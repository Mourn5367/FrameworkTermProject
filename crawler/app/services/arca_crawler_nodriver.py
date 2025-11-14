"""
아카라이브 크롤러 (nodriver 버전 - 2025년 최신)
Cloudflare 403 에러 우회를 위한 최신 솔루션
"""

import nodriver as uc
from bs4 import BeautifulSoup
from datetime import datetime
from typing import List
import asyncio
from app.models.post import CommunityPost
from app.config.crawler_config import config


class ArcaLiveCrawlerNoDriver:
    """아카라이브 크롤러 (nodriver 기반 - Cloudflare 우회)"""

    def __init__(self):
        self.base_url = "https://arca.live"
        # 설정 파일에서 로드
        self.settings = config.arca
        self.rate_limit_delay = self.settings.rate_limit_seconds
        self.browser = None

    async def crawl_board(
        self, board_id: str = None, page: int = 1, max_pages: int = None
    ) -> List[CommunityPost]:
        """게시판 크롤링"""
        # 설정 파일에서 기본값 사용
        board_id = board_id or self.settings.board_id
        max_pages = max_pages or self.settings.max_pages

        all_posts = []

        try:
            # Browser 시작 (설정 파일의 headless 모드)
            print("🚀 nodriver 브라우저 시작...")
            try:
                self.browser = await uc.start(
                    headless=self.settings.headless,
                    browser_args=[
                        '--no-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--disable-software-rasterizer',
                    ]
                )
                print(f"  ✅ 브라우저 시작 완료: {self.browser}")
            except Exception as browser_error:
                print(f"  ❌ 브라우저 시작 실패: {browser_error}")
                import traceback
                traceback.print_exc()
                raise

            for current_page in range(1, max_pages + 1):
                print(f"\n📄 페이지 {current_page}/{max_pages} 크롤링 중...")

                posts = await self._crawl_page(board_id, current_page)
                all_posts.extend(posts)

                # Rate Limiting
                if current_page < max_pages:
                    print(f"⏳ {self.rate_limit_delay}초 대기 중...")
                    await asyncio.sleep(self.rate_limit_delay)

            print(f"\n✅ 총 {len(all_posts)}개 게시글 크롤링 완료")

        except Exception as e:
            print(f"❌ 크롤링 에러: {e}")

        finally:
            if self.browser:
                await self.browser.stop()
                print("✅ nodriver 브라우저 종료")

        return all_posts

    async def _crawl_page(self, board_id: str, page: int) -> List[CommunityPost]:
        """단일 페이지 크롤링"""
        url = f"{self.base_url}/b/{board_id}"
        if page > 1:
            url += f"?p={page}"

        try:
            # 페이지 이동
            tab = await self.browser.get(url)

            # Cloudflare 체크 자동 해결 시도 (설정에 따라)
            if self.settings.use_cloudflare_bypass:
                try:
                    print("  🔐 Cloudflare 체크 확인 중...")
                    await tab.cf_verify()  # Cloudflare 자동 우회
                    print("  ✅ Cloudflare 우회 성공")
                except Exception as cf_error:
                    print(f"  ℹ️  Cloudflare 체크 없음 또는 이미 통과: {cf_error}")

            # 페이지 로딩 대기 (설정 파일의 타임아웃)
            await tab.wait_for(".list-table", timeout=self.settings.timeout_seconds)
            await asyncio.sleep(2)  # 추가 대기

            # HTML 파싱
            html = await tab.get_content()
            soup = BeautifulSoup(html, "lxml")
            posts = self._parse_post_list(soup, board_id)

            print(f"  ✓ {len(posts)}개 게시글 파싱")
            return posts

        except asyncio.TimeoutError:
            print(f"  ❌ 페이지 로딩 타임아웃 (페이지 {page})")
            return []
        except Exception as e:
            print(f"  ❌ 크롤링 에러 (페이지 {page}): {e}")
            return []

    def _parse_post_list(self, soup: BeautifulSoup, board_id: str) -> List[CommunityPost]:
        """게시글 목록 파싱"""
        posts = []

        # 아카라이브 게시글 리스트
        post_rows = soup.select(".list-table a.vrow")

        if not post_rows:
            print("  ⚠️  게시글 목록을 찾을 수 없습니다.")
            # HTML 일부 출력 (디버깅용)
            body_text = soup.get_text()[:500]
            if "403" in body_text or "Forbidden" in body_text:
                print("  ❌ 403 Forbidden 에러 감지")
            elif "Cloudflare" in body_text:
                print("  ❌ Cloudflare에 의해 차단됨")
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

    async def crawl_post_detail(self, post_url: str) -> str:
        """게시글 상세 내용 크롤링 (선택사항)"""
        try:
            if not self.browser:
                self.browser = await uc.start(headless=True)

            tab = await self.browser.get(post_url)

            # Cloudflare 우회
            try:
                await tab.cf_verify()
            except:
                pass

            await tab.wait_for(".article-body", timeout=10)

            html = await tab.get_content()
            soup = BeautifulSoup(html, "lxml")
            content_elem = soup.select_one(".article-body")

            if content_elem:
                return content_elem.get_text(strip=True)

            return ""

        except Exception as e:
            print(f"    ❌ 상세 크롤링 에러: {e}")
            return ""
