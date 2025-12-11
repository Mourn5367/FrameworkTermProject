from playwright.async_api import async_playwright, Page, BrowserContext
from datetime import datetime, timedelta, timezone
from typing import List
import asyncio
from app.models.post import CommunityPost
from app.config.crawler_config import config


class ArcaLiveCrawlerPlaywright:
    """아카라이브 Playwright 크롤러 (제목 + 본문만 수집, 댓글 제외)"""

    def __init__(self):
        self.base_url = "https://arca.live"
        self.settings = config.arca
        self.rate_limit_delay = self.settings.rate_limit_seconds

    async def crawl_board(
        self,
        board_id: str = None,
        max_pages: int = None,
        crawl_session_id: str = None,
        hours_ago: int = 1
    ) -> List[CommunityPost]:
        """게시판 크롤링 (1시간 전 게시물부터 최신까지, 제목+본문만)"""

        # 설정 로드
        board_id = board_id or self.settings.board_id
        max_pages = max_pages or self.settings.max_pages

        # 한국 시간 기준 세션 ID
        kst = timezone(timedelta(hours=9))
        now_kst = datetime.now(kst)
        if not crawl_session_id:
            crawl_session_id = now_kst.strftime("%Y%m%d_%H%M%S")

        # 1시간 전 기준 시간
        cutoff_time = now_kst - timedelta(hours=hours_ago)
        print(f"🔍 [Arca] 수집 기준: {cutoff_time.strftime('%Y-%m-%d %H:%M')} (KST) 이후")

        all_posts = []
        found_cutoff = False

        # Playwright 시작
        playwright = await async_playwright().start()
        browser = await playwright.chromium.launch(
            headless=self.settings.headless,
            args=['--disable-blink-features=AutomationControlled']
        )
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )

        try:
            # 페이지별 크롤링
            for current_page in range(1, max_pages + 1):
                print(f"\n📄 [Arca] 페이지 {current_page} 크롤링 중...")

                # 목록 크롤링
                page_posts = await self._crawl_page(
                    context, board_id, current_page, crawl_session_id
                )

                # 시간 필터링
                for post in page_posts:
                    if post.posted_at:
                        post_time_kst = post.posted_at.replace(tzinfo=timezone.utc).astimezone(kst)

                        if post_time_kst >= cutoff_time:
                            all_posts.append(post)
                        else:
                            found_cutoff = True
                            print(f"⏹️  [Arca] 1시간 전 게시물 발견, 수집 종료")
                            break
                    else:
                        all_posts.append(post)

                if found_cutoff:
                    break

                # Rate Limiting
                if current_page < max_pages and not found_cutoff:
                    await asyncio.sleep(self.rate_limit_delay)

            print(f"\n📝 [Arca] 본문 수집 시작... (총 {len(all_posts)}개)")

            # 본문 수집 (Playwright로)
            for i, post in enumerate(all_posts, 1):
                try:
                    content = await self._fetch_content(context, post.url)
                    post.content = content
                    print(f"  ✅ [{i}/{len(all_posts)}] {post.title[:40]}... ({len(content)}자)")

                    # 본문 수집 간 짧은 딜레이 (0.5초)
                    if i < len(all_posts):
                        await asyncio.sleep(0.5)

                except Exception as e:
                    print(f"  ❌ [{i}/{len(all_posts)}] 본문 수집 실패: {e}")
                    post.content = ""

        finally:
            await browser.close()
            await playwright.stop()

        print(f"\n✅ [Arca] 크롤링 완료: {len(all_posts)}개 (최근 {hours_ago}시간)")
        return all_posts

    async def _crawl_page(
        self,
        context: BrowserContext,
        board_id: str,
        page: int,
        crawl_session_id: str,
        retry_count: int = 0,
        max_retries: int = 3
    ) -> List[CommunityPost]:
        """단일 페이지 목록 크롤링 (재시도 지원)"""
        url = f"{self.base_url}/b/{board_id}?p={page}"

        playwright_page = await context.new_page()

        try:
            # 페이지 이동
            await playwright_page.goto(url, wait_until="domcontentloaded", timeout=20000)

            # Cloudflare 우회 (필요 시)
            if self.settings.use_cloudflare_bypass:
                await asyncio.sleep(2)

            # .list-area 로딩 대기
            try:
                await playwright_page.wait_for_selector(
                    ".list-area", timeout=10000, state="visible"
                )
            except:
                print(f"  ⚠️  .list-area 로딩 실패 (페이지 {page})")

                # 재시도 로직
                if retry_count < max_retries:
                    await playwright_page.close()
                    print(f"  🔄 페이지 {page} 재시도 중... ({retry_count + 1}/{max_retries})")
                    await asyncio.sleep(3)  # 3초 대기 후 재시도
                    return await self._crawl_page(
                        context, board_id, page, crawl_session_id,
                        retry_count + 1, max_retries
                    )
                return []

            # HTML 가져오기
            html = await playwright_page.content()

            # BeautifulSoup로 파싱
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, "lxml")
            posts = self._parse_post_list(soup, board_id, crawl_session_id)

            print(f"  ✓ {len(posts)}개 게시글 파싱")
            return posts

        except Exception as e:
            print(f"  ❌ 페이지 {page} 크롤링 실패: {e}")

            # 재시도 로직
            if retry_count < max_retries:
                await playwright_page.close()
                print(f"  🔄 페이지 {page} 재시도 중... ({retry_count + 1}/{max_retries})")
                await asyncio.sleep(3)  # 3초 대기 후 재시도
                return await self._crawl_page(
                    context, board_id, page, crawl_session_id,
                    retry_count + 1, max_retries
                )
            return []

        finally:
            await playwright_page.close()

    def _parse_post_list(
        self, soup, board_id: str, crawl_session_id: str
    ) -> List[CommunityPost]:
        """게시글 목록 파싱"""
        posts = []

        # 게시글 리스트
        list_area = soup.select_one(".list-area")
        if not list_area:
            return posts

        rows = list_area.select("a.vrow")

        for row in rows:
            try:
                # 공지사항 제외
                if "notice" in row.get("class", []):
                    continue

                # URL
                post_url = row.get("href", "")
                if post_url.startswith("/"):
                    post_url = self.base_url + post_url

                # 제목
                title_elem = row.select_one(".title")
                if not title_elem:
                    continue
                title = title_elem.get_text(strip=True)

                # 작성자
                author_elem = row.select_one(".user-info")
                author = author_elem.get_text(strip=True) if author_elem else "익명"

                # 날짜
                time_elem = row.select_one(".time")
                date_str = time_elem.get_text(strip=True) if time_elem else ""
                posted_at = self._parse_date(date_str)

                # 조회수
                view_count = 0
                view_elem = row.select_one(".view-count")
                if view_elem:
                    try:
                        view_count = int(view_elem.get_text(strip=True))
                    except:
                        pass

                # 댓글 수
                comment_count = 0
                comment_elem = row.select_one(".comment-count")
                if comment_elem:
                    try:
                        comment_count = int(comment_elem.get_text(strip=True))
                    except:
                        pass

                post = CommunityPost(
                    title=title,
                    content="",  # 나중에 채움
                    author=author,
                    url=post_url,
                    posted_at=posted_at,
                    crawl_session_id=crawl_session_id,
                    board_name=f"아카라이브 {board_id}",
                    view_count=view_count,
                    comment_count=comment_count,
                    comments=[],  # 댓글 수집 안함
                )

                posts.append(post)

            except Exception as e:
                print(f"    ⚠️  게시글 파싱 실패: {e}")
                continue

        return posts

    async def _fetch_content(self, context: BrowserContext, url: str) -> str:
        """본문 내용만 빠르게 가져오기"""
        playwright_page = await context.new_page()
        
        try:
            await playwright_page.goto(url, wait_until="domcontentloaded", timeout=15000)

            # 본문 영역 대기
            try:
                await playwright_page.wait_for_selector(
                    ".article-body", timeout=5000, state="visible"
                )
            except:
                return ""

            # HTML 가져오기
            html = await playwright_page.content()

            # BeautifulSoup로 파싱
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, "lxml")

            # 본문 추출
            content_elem = soup.select_one(".article-body")
            if content_elem:
                return content_elem.get_text(separator="\n", strip=True)
            else:
                return ""

        except Exception as e:
            return ""
        
        finally:
            await playwright_page.close()

    def _parse_date(self, date_str: str) -> datetime:
        """날짜 파싱"""
        try:
            # "1시간 전", "30분 전" 등
            now = datetime.now()

            if "시간 전" in date_str:
                hours = int(date_str.replace("시간 전", "").strip())
                return now - timedelta(hours=hours)
            elif "분 전" in date_str:
                minutes = int(date_str.replace("분 전", "").strip())
                return now - timedelta(minutes=minutes)
            elif "방금" in date_str or "초 전" in date_str:
                return now
            elif "일 전" in date_str:
                days = int(date_str.replace("일 전", "").strip())
                return now - timedelta(days=days)
            # "2025-01-07" 형태
            elif "-" in date_str and len(date_str.split("-")) == 3:
                year, month, day = date_str.split("-")
                return datetime(int(year), int(month), int(day))
            else:
                return now

        except:
            return datetime.now()
