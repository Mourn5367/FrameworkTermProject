import httpx
from bs4 import BeautifulSoup
from datetime import datetime
from typing import List
from app.models.post import CommunityPost
from app.config import get_settings

settings = get_settings()


class CommunityCrawler:
    """커뮤니티 사이트 크롤러"""

    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

    async def crawl_posts(self, url: str = None) -> List[CommunityPost]:
        """게시글 목록 크롤링"""
        target_url = url or settings.target_site_url

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(target_url, headers=self.headers, timeout=10.0)
                response.raise_for_status()

                soup = BeautifulSoup(response.text, "lxml")
                posts = self._parse_posts(soup, target_url)

                print(f"✅ 크롤링 완료: {len(posts)}개 게시글")
                return posts

        except httpx.HTTPError as e:
            print(f"❌ HTTP 에러: {e}")
            return []
        except Exception as e:
            print(f"❌ 크롤링 에러: {e}")
            return []

    def _parse_posts(self, soup: BeautifulSoup, base_url: str) -> List[CommunityPost]:
        """HTML에서 게시글 파싱 (사이트별로 커스터마이징 필요)"""
        posts = []

        # 예시: 일반적인 게시판 구조 (실제 사이트에 맞게 수정 필요)
        # post_elements = soup.select(".post-item")  # CSS 선택자는 사이트마다 다름

        # 임시 예시 데이터 (실제 구현 시 위 주석 코드 사용)
        post_elements = []

        for element in post_elements:
            try:
                # 제목, 작성자, URL 등 추출 (사이트 구조에 맞게 수정)
                title = element.select_one(".title").get_text(strip=True)
                author = element.select_one(".author").get_text(strip=True)
                post_url = element.select_one("a")["href"]

                if not post_url.startswith("http"):
                    post_url = base_url + post_url

                post = CommunityPost(
                    title=title,
                    content="",  # 상세 페이지 크롤링 필요
                    author=author,
                    url=post_url,
                    posted_at=datetime.utcnow(),  # 실제로는 파싱 필요
                )
                posts.append(post)

            except Exception as e:
                print(f"⚠️  게시글 파싱 실패: {e}")
                continue

        return posts

    async def crawl_post_detail(self, url: str) -> str:
        """게시글 상세 내용 크롤링"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=self.headers, timeout=10.0)
                response.raise_for_status()

                soup = BeautifulSoup(response.text, "lxml")

                # 본문 추출 (사이트별로 커스터마이징 필요)
                content_element = soup.select_one(".post-content")
                if content_element:
                    return content_element.get_text(strip=True)

                return ""

        except Exception as e:
            print(f"❌ 상세 크롤링 에러: {e}")
            return ""
