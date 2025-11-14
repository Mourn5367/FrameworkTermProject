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
        self, gallery_id: str = None, page: int = 1, max_pages: int = None
    ) -> List[CommunityPost]:
        """갤러리 게시글 목록 크롤링"""
        # 설정 파일에서 기본값 사용
        gallery_id = gallery_id or self.settings.gallery_id
        max_pages = max_pages or self.settings.max_pages

        all_posts = []

        for current_page in range(1, max_pages + 1):
            print(f"\n📄 페이지 {current_page}/{max_pages} 크롤링 중...")

            posts = await self._crawl_page(gallery_id, current_page)
            all_posts.extend(posts)

            # Rate Limiting
            if current_page < max_pages:
                print(f"⏳ {self.rate_limit_delay}초 대기 중...")
                await asyncio.sleep(self.rate_limit_delay)

        print(f"\n✅ 총 {len(all_posts)}개 게시글 크롤링 완료")
        return all_posts

    async def _crawl_page(self, gallery_id: str, page: int) -> List[CommunityPost]:
        """단일 페이지 크롤링"""
        url = f"{self.base_url}/mgallery/board/lists"
        params = {"id": gallery_id, "page": page}

        try:
            async with httpx.AsyncClient(timeout=float(self.settings.timeout_seconds)) as client:
                response = await client.get(url, params=params, headers=self.headers)
                response.raise_for_status()

                soup = BeautifulSoup(response.text, "lxml")
                posts = self._parse_post_list(soup, gallery_id)

                print(f"  ✓ {len(posts)}개 게시글 파싱")
                return posts

        except httpx.HTTPError as e:
            print(f"  ❌ HTTP 에러 (페이지 {page}): {e}")
            return []
        except Exception as e:
            print(f"  ❌ 파싱 에러 (페이지 {page}): {e}")
            return []

    def _parse_post_list(self, soup: BeautifulSoup, gallery_id: str) -> List[CommunityPost]:
        """게시글 목록 파싱"""
        posts = []

        # 디시인사이드 게시글 리스트는 .gall_list 클래스의 tbody > tr
        gall_list = soup.select(".gall_list tbody tr.ub-content")

        for row in gall_list:
            try:
                # 공지사항 제외 (class에 'notice'가 있으면 건너뜀)
                if "notice" in row.get("class", []):
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

    async def crawl_post_detail(self, post_url: str) -> str:
        """게시글 상세 내용 크롤링 (선택사항)"""
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(post_url, headers=self.headers)
                response.raise_for_status()

                soup = BeautifulSoup(response.text, "lxml")

                # 본문 내용 추출
                content_elem = soup.select_one(".writing_view_box")
                if content_elem:
                    # 텍스트만 추출 (이미지, 링크 제외)
                    return content_elem.get_text(strip=True)

                return ""

        except Exception as e:
            print(f"    ❌ 상세 크롤링 에러: {e}")
            return ""
