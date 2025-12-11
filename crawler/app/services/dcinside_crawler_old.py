import httpx
from bs4 import BeautifulSoup
from datetime import datetime
from typing import List
import asyncio
from app.models.post import CommunityPost


from app.config.crawler_config import config


class DCInsideCrawler:
    """디시인사이드 크롤러"""

    def __init__(self):
        self.base_url = "https://gall.dcinside.com"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": "https://gall.dcinside.com/",
        }
        # 설정 파일에서 로드
        self.settings = config.dcinside
        self.rate_limit_delay = self.settings.rate_limit_seconds

    async def crawl_gallery(
        self, gallery_id: str = None, page: int = 1, max_pages: int = None, fetch_content: bool = None, crawl_session_id: str = None, hours_ago: int = 1
    ) -> List[CommunityPost]:
        """갤러리 게시글 목록 크롤링 (1시간 전 게시물부터 최신까지)"""
        from datetime import timezone, timedelta

        # 설정 파일에서 기본값 사용
        gallery_id = gallery_id or self.settings.gallery_id
        max_pages = max_pages or self.settings.max_pages
        fetch_content = fetch_content if fetch_content is not None else self.settings.fetch_full_content

        # 크롤링 세션 ID 생성 (한국 시간 기준)
        kst = timezone(timedelta(hours=9))
        now_kst = datetime.now(kst)
        if not crawl_session_id:
            crawl_session_id = now_kst.strftime("%Y%m%d_%H%M%S")

        # 1시간 전 시간 계산
        cutoff_time = now_kst - timedelta(hours=hours_ago)
        print(f"📅 수집 기준: {cutoff_time.strftime('%Y-%m-%d %H:%M')} (KST) 이후 게시물부터 수집")

        all_posts = []
        found_cutoff = False

        for current_page in range(1, max_pages + 1):
            print(f"\n📄 페이지 {current_page} 크롤링 중...")

            posts = await self._crawl_page(gallery_id, current_page, crawl_session_id)

            # 각 게시물의 시간 확인
            for post in posts:
                if post.posted_at:
                    # UTC로 저장된 시간을 KST로 변환
                    post_time_kst = post.posted_at.replace(tzinfo=timezone.utc).astimezone(kst)

                    if post_time_kst >= cutoff_time:
                        # 1시간 이내 게시물
                        all_posts.append(post)
                    else:
                        # 1시간 전 게시물 발견
                        found_cutoff = True
                        print(f"⏹️  수집 종료: 1시간 전 게시물 발견 ({post_time_kst.strftime('%Y-%m-%d %H:%M')})")
                        break
                else:
                    # 시간 정보 없으면 일단 수집
                    all_posts.append(post)

            if found_cutoff:
                break

            # Rate Limiting
            if current_page < max_pages:
                print(f"⏳ {self.rate_limit_delay}초 대기 중...")
                await asyncio.sleep(self.rate_limit_delay)

        print(f"✅ 수집 완료: 총 {len(all_posts)}개 게시글 (최근 {hours_ago}시간)")

        # Full content fetching (if enabled)
        if fetch_content and all_posts:
            print(f"\n📝 전체 본문 + 댓글 크롤링 중... ({len(all_posts)}개 게시글)")

            # Playwright를 한 번만 시작하고 재사용
            from playwright.async_api import async_playwright
            playwright = await async_playwright().start()
            browser = await playwright.chromium.launch(
                headless=True,
                args=['--disable-blink-features=AutomationControlled']
            )
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            )

            try:
                for i, post in enumerate(all_posts, 1):
                    try:
                        content, comments = await self._crawl_with_playwright_page(context, post.url)
                        post.content = content
                        post.comments = comments
                        print(f"  ✓ [{i}/{len(all_posts)}] {post.title[:30]}... (본문 {len(content)}자, 댓글 {len(comments)}개)")

                        # Rate limiting for detail pages (1초로 단축)
                        if i < len(all_posts):
                            await asyncio.sleep(1)
                    except Exception as e:
                        print(f"  ❌ [{i}/{len(all_posts)}] 본문 크롤링 실패: {e}")
                        continue
            finally:
                await browser.close()
                await playwright.stop()

        print(f"\n✅ 총 {len(all_posts)}개 게시글 크롤링 완료")
        return all_posts

    async def _crawl_page(self, gallery_id: str, page: int, crawl_session_id: str) -> List[CommunityPost]:
        """단일 페이지 크롤링"""
        url = f"{self.base_url}/mgallery/board/lists"
        params = {"id": gallery_id, "page": page}

        try:
            async with httpx.AsyncClient(timeout=float(self.settings.timeout_seconds)) as client:
                response = await client.get(url, params=params, headers=self.headers)
                response.raise_for_status()

                soup = BeautifulSoup(response.text, "lxml")
                posts = self._parse_post_list(soup, gallery_id, crawl_session_id)

                print(f"  ✓ {len(posts)}개 게시글 파싱")
                return posts

        except httpx.HTTPError as e:
            print(f"  ❌ HTTP 에러 (페이지 {page}): {e}")
            return []
        except Exception as e:
            print(f"  ❌ 파싱 에러 (페이지 {page}): {e}")
            return []

    def _parse_post_list(self, soup: BeautifulSoup, gallery_id: str, crawl_session_id: str) -> List[CommunityPost]:
        """게시글 목록 파싱"""
        posts = []

        # 디시인사이드 게시글 리스트는 .gall_list 클래스의 tbody > tr
        gall_list = soup.select(".gall_list tbody tr.ub-content")

        for row in gall_list:
            try:
                # 공지사항 제외 (class에 'notice'가 있으면 건너뜀)
                if "notice" in row.get("class", []):
                    continue

                # 말머리(gall_subject) 필터링: 설문, AD, 공지 제외
                subject_elem = row.select_one(".gall_subject")
                if subject_elem:
                    subject_text = subject_elem.get_text(strip=True)
                    excluded_subjects = ["설문", "AD", "공지"]
                    if any(excluded in subject_text for excluded in excluded_subjects):
                        print(f"    ⏭️  필터링: [{subject_text}] 말머리 제외")
                        continue

                # 제목 및 URL
                title_elem = row.select_one(".gall_tit a")
                if not title_elem:
                    continue

                title = title_elem.get_text(strip=True)
                post_url = title_elem.get("href", "")

                # 상대 URL을 절대 URL로 변환
                if post_url.startswith("/"):
                    post_url = self.base_url + post_url

                # 작성자
                author_elem = row.select_one(".gall_writer")
                author = (
                    author_elem.get("data-nick", "익명")
                    if author_elem
                    else "익명"
                )

                # 날짜
                date_elem = row.select_one(".gall_date")
                date_str = date_elem.get_text(strip=True) if date_elem else ""
                posted_at = self._parse_date(date_str)

                # 조회수
                view_elem = row.select_one(".gall_count")
                view_count = 0
                if view_elem:
                    try:
                        view_count = int(view_elem.get_text(strip=True))
                    except:
                        pass

                # 추천수
                recommend_elem = row.select_one(".gall_recommend")
                recommend_count = 0
                if recommend_elem:
                    try:
                        recommend_count = int(recommend_elem.get_text(strip=True))
                    except:
                        pass

                # 댓글 수 (제목 옆에 [숫자] 형태로 표시)
                comment_count = 0
                reply_elem = row.select_one(".gall_tit .reply_num")
                if reply_elem:
                    try:
                        comment_text = reply_elem.get_text(strip=True)
                        # [123] 형태에서 숫자만 추출
                        comment_count = int(comment_text.strip("[]"))
                    except:
                        pass

                post = CommunityPost(
                    title=title,
                    content="",  # 목록에서는 본문 없음
                    author=author,
                    url=post_url,
                    posted_at=posted_at,
                    crawl_session_id=crawl_session_id,  # 세션 ID 할당
                    board_name=f"디시인사이드 {gallery_id}",
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
            # "25.01.07" 형태 (날짜)
            if "." in date_str and len(date_str.split(".")) == 3:
                year, month, day = date_str.split(".")
                year = int("20" + year)  # 25 -> 2025
                month = int(month)
                day = int(day)
                return datetime(year, month, day)

            # "12:34" 형태 (시간) - 오늘 날짜로 가정
            elif ":" in date_str:
                hour, minute = date_str.split(":")
                now = datetime.now()
                return datetime(now.year, now.month, now.day, int(hour), int(minute))

            else:
                return datetime.utcnow()

        except Exception as e:
            print(f"      ⚠️  날짜 파싱 실패 ({date_str}): {e}")
            return datetime.utcnow()

    async def crawl_post_detail(self, post_url: str, use_playwright: bool = True) -> tuple[str, List]:
        """
        게시글 상세 내용 + 댓글 크롤링

        Args:
            post_url: 게시글 URL
            use_playwright: Playwright 사용 여부 (댓글 크롤링을 위해 True 권장)

        Returns:
            tuple[str, List]: (본문 내용, 댓글 리스트)
        """
        if use_playwright:
            return await self._crawl_with_playwright(post_url)
        else:
            return await self._crawl_with_httpx(post_url)

    async def _crawl_with_httpx(self, post_url: str) -> tuple[str, List]:
        """HTTP 기반 크롤링 (빠르지만 댓글 없음)"""
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(post_url, headers=self.headers)
                response.raise_for_status()

                soup = BeautifulSoup(response.text, "lxml")

                # 본문 내용 추출
                content = ""
                content_elem = soup.select_one(".writing_view_box")
                if content_elem:
                    content = content_elem.get_text(strip=True)

                return content, []

        except Exception as e:
            print(f"    ❌ HTTP 크롤링 에러: {e}")
            return "", []

    async def _crawl_with_playwright_page(self, context, post_url: str) -> tuple[str, List]:
        """Playwright context를 재사용하여 크롤링 (빠름 + 댓글 포함)"""
        from app.models.post import Comment

        try:
            page = await context.new_page()
            await page.goto(post_url, wait_until='domcontentloaded', timeout=15000)

            # 댓글 로딩 대기 (최대 3초)
            try:
                await page.wait_for_selector('.comment_wrap .cmt_list', timeout=3000)
            except:
                pass  # 댓글 없을 수도 있음

            # HTML 가져오기
            html = await page.content()
            soup = BeautifulSoup(html, "lxml")

            # 1. 본문 추출
            content = ""
            content_elem = soup.select_one(".writing_view_box")
            if content_elem:
                content = content_elem.get_text(strip=True)

            # 2. 댓글 추출
            comments = []
            comment_list = soup.select(".comment_wrap .cmt_list li.ub-content")

            for li in comment_list:
                try:
                    # 댓글 번호
                    comment_no = li.get("data-no", "")

                    # 작성자
                    author_elem = li.select_one(".gall_writer")
                    if author_elem:
                        author = author_elem.get("data-nick") or author_elem.get("data-uid") or "익명"
                    else:
                        author = "익명"

                    # 댓글 내용
                    content_elem = li.select_one(".usertxt")
                    if not content_elem:
                        continue
                    comment_content = content_elem.get_text(strip=True)

                    # 날짜
                    date_elem = li.select_one(".date_time")
                    date_str = date_elem.get_text(strip=True) if date_elem else ""
                    posted_at = self._parse_comment_date(date_str)

                    # 대댓글 여부
                    c_idx = li.get("data-c_idx", "0")
                    depth = 1 if c_idx != "0" else 0

                    comment = Comment(
                        comment_id=comment_no,
                        parent_id=c_idx if depth > 0 else None,
                        author=author,
                        content=comment_content,
                        posted_at=posted_at,
                        depth=depth,
                        replies=[]
                    )

                    comments.append(comment)

                except Exception as e:
                    continue

            await page.close()  # 페이지만 닫기 (브라우저는 재사용)
            return content, comments

        except Exception as e:
            print(f"    ❌ Playwright 크롤링 에러: {e}")
            return "", []

    async def _fetch_comments_from_api(self, gallery_id: str, post_no: str) -> List:
        """
        디시인사이드 댓글 API에서 댓글 가져오기
        댓글은 JavaScript로 동적 로드되므로 별도 API 호출 필요
        """
        from app.models.post import Comment
        import re

        comments = []

        try:
            # 디시인사이드 댓글 API 엔드포인트
            comment_url = f"{self.base_url}/board/comment/"
            params = {
                "id": gallery_id,
                "no": post_no,
                "cmt_id": gallery_id,
                "cmt_no": post_no,
                "e_s_n_o": "3eabc1234abcd",  # 고정값
                "_": ""  # timestamp (선택)
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(comment_url, params=params, headers=self.headers)

                if response.status_code != 200:
                    return []

                # HTML 응답에서 댓글 파싱
                soup = BeautifulSoup(response.text, "lxml")
                comment_list = soup.select("li.ub-content")

                for li in comment_list:
                    try:
                        # 댓글 번호
                        comment_no = li.get("data-no", "")

                        # 작성자 (닉네임 또는 IP)
                        author_elem = li.select_one(".gall_writer")
                        if author_elem:
                            author = author_elem.get("data-nick") or author_elem.get("data-uid") or "익명"
                        else:
                            author = "익명"

                        # 댓글 내용
                        content_elem = li.select_one(".usertxt")
                        if not content_elem:
                            continue
                        content = content_elem.get_text(strip=True)

                        # 날짜
                        date_elem = li.select_one(".date_time")
                        date_str = date_elem.get_text(strip=True) if date_elem else ""
                        posted_at = self._parse_comment_date(date_str)

                        # 대댓글 여부 (c_idx 확인)
                        c_idx = li.get("data-c_idx", "0")
                        depth = 1 if c_idx != "0" else 0

                        comment = Comment(
                            comment_id=comment_no,
                            parent_id=c_idx if depth > 0 else None,
                            author=author,
                            content=content,
                            posted_at=posted_at,
                            depth=depth,
                            replies=[]
                        )

                        comments.append(comment)

                    except Exception as e:
                        print(f"      ⚠️  댓글 파싱 실패: {e}")
                        continue

        except Exception as e:
            print(f"      ⚠️  댓글 API 호출 실패: {e}")

        return comments

    def _parse_comment_date(self, date_str: str) -> datetime:
        """댓글 날짜 파싱"""
        try:
            # "2025.12.02 10:30:45" 형식
            if "." in date_str and ":" in date_str:
                from datetime import datetime
                return datetime.strptime(date_str, "%Y.%m.%d %H:%M:%S")
            else:
                return datetime.utcnow()
        except:
            return datetime.utcnow()
