"""
아카라이브 크롤러 (Playwright 버전 - Windows 안정)
Cloudflare 403 에러 우회
"""

from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from datetime import datetime
from typing import List
import asyncio
from app.models.post import CommunityPost, Comment
from app.config.crawler_config import config


class ArcaLiveCrawlerPlaywright:
    """아카라이브 크롤러 (Playwright 기반 - Windows 안정)"""

    def __init__(self):
        self.base_url = "https://arca.live"
        # 설정 파일에서 로드
        self.settings = config.arca
        self.rate_limit_delay = self.settings.rate_limit_seconds
        self.browser = None
        self.playwright = None

    async def crawl_board(
        self, board_id: str = None, page: int = 1, max_pages: int = None
    ) -> List[CommunityPost]:
        """게시판 크롤링"""
        # 설정 파일에서 기본값 사용
        board_id = board_id or self.settings.board_id
        max_pages = max_pages or self.settings.max_pages

        all_posts = []

        try:
            # Playwright 시작
            print("🚀 Playwright 브라우저 시작...")
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=self.settings.headless,
                args=['--disable-blink-features=AutomationControlled']
            )

            # 새 컨텍스트 (User-Agent 설정)
            context = await self.browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            print(f"  ✅ 브라우저 시작 완료")

            for current_page in range(1, max_pages + 1):
                print(f"\n📄 페이지 {current_page}/{max_pages} 크롤링 중...")

                posts = await self._crawl_page(context, board_id, current_page)
                all_posts.extend(posts)

                # Rate Limiting
                if current_page < max_pages:
                    print(f"⏳ {self.rate_limit_delay}초 대기 중...")
                    await asyncio.sleep(self.rate_limit_delay)

            print(f"\n✅ 총 {len(all_posts)}개 게시글 크롤링 완료")

        except Exception as e:
            print(f"❌ 크롤링 에러: {e}")
            import traceback
            traceback.print_exc()

        finally:
            if self.browser:
                await self.browser.close()
                print("✅ Playwright 브라우저 종료")
            if self.playwright:
                await self.playwright.stop()

        return all_posts

    async def _crawl_page(self, context, board_id: str, page: int) -> List[CommunityPost]:
        """단일 페이지 크롤링"""
        url = f"{self.base_url}/b/{board_id}"
        if page > 1:
            url += f"?p={page}"

        try:
            # 새 페이지
            page_obj = await context.new_page()

            # 페이지 이동
            print(f"  🌐 페이지 로딩: {url}")
            await page_obj.goto(url, wait_until='networkidle', timeout=self.settings.timeout_seconds * 1000)

            # Cloudflare 체크 대기 (있다면)
            try:
                # Cloudflare challenge가 있는지 확인
                if await page_obj.locator('text=Checking your browser').count() > 0:
                    print("  🔐 Cloudflare 체크 감지, 대기 중...")
                    await page_obj.wait_for_selector('.list-table', timeout=30000)
                    print("  ✅ Cloudflare 통과")
            except:
                pass  # Cloudflare 없음

            # 페이지 콘텐츠 대기
            await page_obj.wait_for_selector('.list-table', timeout=self.settings.timeout_seconds * 1000)
            await asyncio.sleep(2)  # 추가 대기

            # HTML 파싱
            html = await page_obj.content()

            # 디버깅: HTML 저장
            with open("arca_debug.html", "w", encoding="utf-8") as f:
                f.write(html)
            print("  📁 HTML 저장됨: arca_debug.html")

            soup = BeautifulSoup(html, "lxml")

            # 디버깅: HTML 구조 확인
            list_table = soup.select_one(".list-table")
            vrows = soup.select("a.vrow")
            print(f"  🔍 디버깅: .list-table={1 if list_table else 0}, a.vrow={len(vrows)}개")

            if not vrows:
                # HTML 일부 출력
                body_text = soup.get_text()[:500]
                print(f"  📄 HTML 미리보기: {body_text[:200]}")

            posts = await self._parse_post_list_with_details(context, soup, board_id)

            print(f"  ✓ {len(posts)}개 게시글 파싱 (본문+댓글 포함)")

            await page_obj.close()
            return posts

        except Exception as e:
            print(f"  ❌ 크롤링 에러 (페이지 {page}): {e}")
            return []

    async def _parse_post_list_with_details(self, context, soup: BeautifulSoup, board_id: str) -> List[CommunityPost]:
        """게시글 목록 파싱 + 본문/댓글 크롤링"""
        posts = []
        post_rows = soup.select(".list-table a.vrow")

        if not post_rows:
            print("  ⚠️  게시글 목록을 찾을 수 없습니다.")
            return []

        # 공지사항 필터링
        normal_posts = []
        for row in post_rows:
            row_classes = row.get("class", [])
            is_notice = False
            if isinstance(row_classes, list) and "notice" in row_classes:
                is_notice = True
            elif isinstance(row_classes, str) and "notice" in row_classes:
                is_notice = True

            if not is_notice:
                normal_posts.append(row)

        print(f"  📊 전체 {len(post_rows)}개 중 공지 제외 {len(normal_posts)}개 발견")

        for idx, row in enumerate(normal_posts[:10], 1):  # 공지 제외한 일반 게시글 중 10개만 크롤링
            try:

                # URL
                post_url = row.get("href", "")
                if post_url.startswith("/"):
                    post_url = self.base_url + post_url

                # 기본 정보 파싱
                title_elem = row.select_one(".title")
                if not title_elem:
                    continue
                title = title_elem.get_text(strip=True)

                author_elem = row.select_one(".user-info")
                author = author_elem.get_text(strip=True) if author_elem else "익명"

                time_elem = row.select_one(".col-time time")
                date_str = time_elem.get("datetime", "") or time_elem.get_text(strip=True) if time_elem else ""
                posted_at = self._parse_date(date_str)

                view_elem = row.select_one(".col-view")
                view_count = 0
                if view_elem:
                    try:
                        view_count = int(view_elem.get_text(strip=True).replace(",", ""))
                    except:
                        pass

                comment_elem = row.select_one(".vcol-comment")
                comment_count = 0
                if comment_elem:
                    try:
                        comment_count = int(comment_elem.get_text(strip=True).strip("[]").replace(",", ""))
                    except:
                        pass

                # 본문 및 댓글 크롤링
                print(f"    [{idx}] {title[:30]}... 본문/댓글 크롤링 중...")
                # 첫 게시글만 HTML 저장
                save_debug = (idx == 1)
                content, comments = await self._crawl_post_detail(context, post_url, save_debug_html=save_debug)

                post = CommunityPost(
                    title=title,
                    content=content,
                    author=author,
                    url=post_url,
                    posted_at=posted_at,
                    board_name=f"아카라이브 {board_id}",
                    view_count=view_count,
                    comment_count=comment_count,
                    comments=comments
                )

                posts.append(post)
                await asyncio.sleep(2)  # 본문 크롤링 간 딜레이

            except Exception as e:
                print(f"    ⚠️  게시글 파싱 실패: {e}")
                continue

        return posts

    async def _crawl_post_detail(self, context, post_url: str, save_debug_html: bool = False) -> tuple[str, List[Comment]]:
        """게시글 본문 및 댓글 크롤링 (필요한 영역만)"""
        try:
            page = await context.new_page()
            await page.goto(post_url, wait_until='networkidle', timeout=20000)
            await asyncio.sleep(2)

            # 본문 크롤링 (.article-body만)
            content = ""
            try:
                content_elem = await page.query_selector('.article-body')
                if content_elem:
                    content = await content_elem.text_content()
                    content = content.strip()
            except:
                pass

            # 댓글 영역만 추출 (.list-area)
            comments = []
            try:
                # .list-area 영역만 가져오기
                list_area = await page.query_selector('.list-area')
                if not list_area:
                    print(f"      ⚠️  댓글 영역(.list-area)을 찾을 수 없음")
                    await page.close()
                    return content, comments

                # 디버깅용 HTML 저장 (필요한 영역만)
                if save_debug_html:
                    list_area_html = await list_area.inner_html()
                    with open("arca_comments_debug.html", "w", encoding="utf-8") as f:
                        f.write(f'<div class="list-area">\n{list_area_html}\n</div>')
                    print(f"      📁 댓글 영역 HTML 저장됨: arca_comments_debug.html")

                # .list-area 안의 .comment-item들만 크롤링
                comment_elems = await list_area.query_selector_all('.comment-item')
                print(f"      💬 댓글 {len(comment_elems)}개 발견")

                for comment_elem in comment_elems[:50]:  # 최대 50개 댓글
                    try:
                        # 댓글 ID
                        comment_id = await comment_elem.get_attribute('id')

                        # 부모 댓글 ID (대댓글 화살표 링크에서 추출)
                        parent_id = None
                        parent_link = await comment_elem.query_selector('a[href*="#c_"]')
                        if parent_link:
                            href = await parent_link.get_attribute('href')
                            if href and '#c_' in href:
                                parent_id = href.split('#')[-1]  # "c_797444581"

                        # 작성자 (.user-info)
                        author_elem = await comment_elem.query_selector('.user-info')
                        author = await author_elem.text_content() if author_elem else "익명"
                        author = author.strip()

                        # 댓글 내용 (.message .text)
                        text_elem = await comment_elem.query_selector('.message .text')
                        if not text_elem:
                            text_elem = await comment_elem.query_selector('.message')
                        text = await text_elem.text_content() if text_elem else ""
                        text = text.strip()

                        # 시간 (time[datetime])
                        time_elem = await comment_elem.query_selector('time[datetime]')
                        time_str = await time_elem.get_attribute('datetime') if time_elem else ""
                        comment_time = self._parse_date(time_str) if time_str else None

                        if text:
                            comments.append(Comment(
                                comment_id=comment_id,
                                parent_id=parent_id,
                                author=author,
                                content=text,
                                posted_at=comment_time,
                                depth=0  # depth는 나중에 계산
                            ))
                    except Exception as e:
                        print(f"        ⚠️ 댓글 파싱 실패: {e}")
                        continue
            except Exception as e:
                print(f"      ⚠️ 댓글 크롤링 실패: {e}")
                pass

            # 댓글 깊이(depth) 계산
            comments = self._calculate_comment_depth(comments)

            await page.close()
            return content, comments

        except Exception as e:
            print(f"      ⚠️  본문/댓글 크롤링 실패: {e}")
            return "", []

    def _calculate_comment_depth(self, comments: List[Comment]) -> List[Comment]:
        """댓글 계층 구조 기반으로 depth 계산"""
        # 댓글 ID -> Comment 매핑
        comment_map = {c.comment_id: c for c in comments if c.comment_id}

        for comment in comments:
            if comment.parent_id:
                # 부모를 따라가며 depth 계산
                depth = 0
                current_parent_id = comment.parent_id
                while current_parent_id and depth < 10:  # 최대 깊이 10
                    depth += 1
                    parent = comment_map.get(current_parent_id)
                    if parent:
                        current_parent_id = parent.parent_id
                    else:
                        break
                comment.depth = depth
            else:
                comment.depth = 0  # 원댓글

        return comments

    def _parse_post_list(self, soup: BeautifulSoup, board_id: str) -> List[CommunityPost]:
        """게시글 목록 파싱"""
        posts = []

        # 아카라이브 게시글 리스트
        post_rows = soup.select(".list-table a.vrow")

        if not post_rows:
            print("  ⚠️  게시글 목록을 찾을 수 없습니다.")
            return []

        for row in post_rows:
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
                author = (
                    author_elem.get_text(strip=True) if author_elem else "익명"
                )

                # 날짜
                time_elem = row.select_one(".col-time time")
                date_str = ""
                if time_elem:
                    date_str = time_elem.get("datetime", "") or time_elem.get_text(strip=True)
                posted_at = self._parse_date(date_str)

                # 조회수
                view_elem = row.select_one(".col-view")
                view_count = 0
                if view_elem:
                    try:
                        view_text = view_elem.get_text(strip=True)
                        view_count = int(view_text.replace(",", ""))
                    except:
                        pass

                # 댓글 수
                comment_elem = row.select_one(".vcol-comment")
                comment_count = 0
                if comment_elem:
                    try:
                        comment_text = comment_elem.get_text(strip=True)
                        comment_count = int(comment_text.strip("[]").replace(",", ""))
                    except:
                        pass

                post = CommunityPost(
                    title=title,
                    content="",
                    author=author,
                    url=post_url,
                    posted_at=posted_at,
                    board_name=f"아카라이브 {board_id}",
                    view_count=view_count,
                    comment_count=comment_count,
                )

                posts.append(post)

            except Exception as e:
                print(f"    ⚠️  게시글 파싱 실패: {e}")
                continue

        return posts

    def _parse_date(self, date_str: str) -> datetime:
        """날짜 문자열을 datetime 객체로 변환"""
        try:
            if "T" in date_str:
                return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            elif "." in date_str and len(date_str.split(".")) == 2:
                month, day = date_str.split(".")
                now = datetime.now()
                return datetime(now.year, int(month), int(day))
            elif ":" in date_str:
                hour, minute = date_str.split(":")
                now = datetime.now()
                return datetime(now.year, now.month, now.day, int(hour), int(minute))
            else:
                return datetime.utcnow()
        except Exception as e:
            print(f"      ⚠️  날짜 파싱 실패 ({date_str}): {e}")
            return datetime.utcnow()
