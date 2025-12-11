import httpx
from bs4 import BeautifulSoup
from datetime import datetime, timedelta, timezone
from typing import List
import asyncio
from app.models.post import CommunityPost
from app.config.crawler_config import config


class DCInsideCrawler:
    """디시인사이드 크롤러 (KST 시간 처리 + 병렬 본문 수집)"""

    def __init__(self):
        self.base_url = "https://gall.dcinside.com"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "ko-KR,ko;q=0.9",
            "Referer": "https://gall.dcinside.com/",
        }
        self.settings = config.dcinside
        self.rate_limit_delay = self.settings.rate_limit_seconds
        self.kst = timezone(timedelta(hours=9))

    async def crawl_gallery(
        self,
        gallery_id: str = None,
        max_pages: int = None,
        crawl_session_id: str = None,
        hours_ago: int = 1
    ) -> List[CommunityPost]:
        """갤러리 크롤링 (1시간 전부터 최신까지)"""

        gallery_id = gallery_id or self.settings.gallery_id
        max_pages = max_pages or self.settings.max_pages

        now_kst = datetime.now(self.kst)
        if not crawl_session_id:
            crawl_session_id = now_kst.strftime("%Y%m%d_%H%M%S")

        cutoff_time = now_kst - timedelta(hours=hours_ago)
        print(f"🔍 [DC] 수집 기준: {cutoff_time.strftime('%Y-%m-%d %H:%M')} (KST) 이후")

        all_posts = []
        found_cutoff = False

        # 페이지별 목록 크롤링
        for current_page in range(1, max_pages + 1):
            print(f"\n📄 [DC] 페이지 {current_page} 크롤링 중...")

            page_posts = await self._crawl_page(gallery_id, current_page, crawl_session_id)

            # 시간 필터링
            for post in page_posts:
                if post.posted_at:
                    # KST로 파싱되어 있으므로 직접 비교
                    if post.posted_at >= cutoff_time:
                        all_posts.append(post)
                    else:
                        found_cutoff = True
                        print(f"⏹️  [DC] 1시간 전 게시물 발견 ({post.posted_at.strftime('%Y-%m-%d %H:%M')}), 수집 종료")
                        break
                else:
                    # 시간 정보 없으면 일단 수집
                    all_posts.append(post)

            if found_cutoff:
                break

            if current_page < max_pages and not found_cutoff:
                await asyncio.sleep(self.rate_limit_delay)

        if not all_posts:
            print(f"\n⚠️  [DC] 수집된 게시글 없음")
            return []

        print(f"\n📝 [DC] 본문 수집 시작... (총 {len(all_posts)}개)")

        # 병렬 본문 수집 (10개씩 배치)
        batch_size = 10
        async with httpx.AsyncClient(timeout=10.0) as client:
            for i in range(0, len(all_posts), batch_size):
                batch = all_posts[i:i+batch_size]
                
                # 배치 내 병렬 처리
                tasks = [self._fetch_content_for_post(client, post, i+idx+1, len(all_posts)) 
                         for idx, post in enumerate(batch)]
                await asyncio.gather(*tasks)

        print(f"\n✅ [DC] 크롤링 완료: {len(all_posts)}개 (최근 {hours_ago}시간)")
        return all_posts

    async def _fetch_content_for_post(self, client: httpx.AsyncClient, post: CommunityPost, idx: int, total: int):
        """게시글 본문을 가져와서 post 객체에 직접 할당"""
        try:
            content = await self._fetch_content(client, post.url)
            post.content = content
            print(f"  ✅ [{idx}/{total}] {post.title[:40]}... ({len(content)}자)")
        except Exception as e:
            print(f"  ❌ [{idx}/{total}] 본문 수집 실패: {e}")
            post.content = ""

    async def _crawl_page(
        self, gallery_id: str, page: int, crawl_session_id: str
    ) -> List[CommunityPost]:
        """단일 페이지 목록 크롤링"""
        url = f"{self.base_url}/mgallery/board/lists"
        params = {"id": gallery_id, "page": page}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params, headers=self.headers)
                response.raise_for_status()

                soup = BeautifulSoup(response.text, "lxml")
                posts = self._parse_post_list(soup, gallery_id, crawl_session_id)

                print(f"  ✓ {len(posts)}개 게시글 파싱")
                return posts

        except Exception as e:
            print(f"  ❌ 페이지 {page} 크롤링 실패: {e}")
            return []

    def _parse_post_list(
        self, soup: BeautifulSoup, gallery_id: str, crawl_session_id: str
    ) -> List[CommunityPost]:
        """게시글 목록 파싱"""
        posts = []
        rows = soup.select(".gall_list tbody tr.ub-content")

        for row in rows:
            try:
                if "notice" in row.get("class", []):
                    continue

                subject_elem = row.select_one(".gall_subject")
                if subject_elem:
                    subject_text = subject_elem.get_text(strip=True)
                    if any(x in subject_text for x in ["설문", "AD", "공지"]):
                        continue

                title_elem = row.select_one(".gall_tit a")
                if not title_elem:
                    continue

                title = title_elem.get_text(strip=True)
                post_url = title_elem.get("href", "")
                if post_url.startswith("/"):
                    post_url = self.base_url + post_url

                author_elem = row.select_one(".gall_writer")
                author = author_elem.get("data-nick", "익명") if author_elem else "익명"

                date_elem = row.select_one(".gall_date")
                date_str = date_elem.get_text(strip=True) if date_elem else ""
                posted_at = self._parse_date(date_str)

                view_count = 0
                view_elem = row.select_one(".gall_count")
                if view_elem:
                    try:
                        view_count = int(view_elem.get_text(strip=True))
                    except:
                        pass

                comment_count = 0
                reply_elem = row.select_one(".gall_tit .reply_num")
                if reply_elem:
                    try:
                        comment_text = reply_elem.get_text(strip=True)
                        comment_count = int(comment_text.strip("[]"))
                    except:
                        pass

                post = CommunityPost(
                    title=title,
                    content="",
                    author=author,
                    url=post_url,
                    posted_at=posted_at,
                    crawl_session_id=crawl_session_id,
                    board_name=f"디시인사이드 {gallery_id}",
                    view_count=view_count,
                    comment_count=comment_count,
                    comments=[],
                )

                posts.append(post)

            except Exception as e:
                print(f"    ⚠️  게시글 파싱 실패: {e}")
                continue

        return posts

    async def _fetch_content(self, client: httpx.AsyncClient, url: str) -> str:
        """본문 내용만 빠르게 가져오기"""
        try:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "lxml")
            content_elem = soup.select_one(".write_div")
            if content_elem:
                return content_elem.get_text(separator="\n", strip=True)
            else:
                return ""

        except Exception as e:
            return ""

    def _parse_date(self, date_str: str) -> datetime:
        """날짜 파싱 (KST 기준)"""
        now_kst = datetime.now(self.kst)
        
        try:
            # "25.01.07" 형태 (날짜만)
            if "." in date_str and len(date_str.split(".")) == 3:
                year, month, day = date_str.split(".")
                year = int("20" + year)
                month = int(month)
                day = int(day)
                # KST로 생성
                return datetime(year, month, day, tzinfo=self.kst)

            # "12:34" 형태 (오늘 시간)
            elif ":" in date_str:
                hour, minute = date_str.split(":")
                # 오늘 날짜 + 시간 (KST)
                return datetime(
                    now_kst.year, now_kst.month, now_kst.day,
                    int(hour), int(minute),
                    tzinfo=self.kst
                )

            else:
                return now_kst

        except:
            return now_kst
