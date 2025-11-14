from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
from datetime import datetime
from typing import List
import asyncio
import time
from app.models.post import CommunityPost


class ArcaLiveCrawler:
    """아카라이브 크롤러 (Selenium 기반)"""

    def __init__(self):
        self.base_url = "https://arca.live"
        self.rate_limit_delay = 10  # 10초 간격 (느리게)
        self.driver = None

    def _init_driver(self):
        """Chrome WebDriver 초기화"""
        if self.driver:
            return

        chrome_options = Options()
        chrome_options.add_argument("--headless=new")  # 헤드리스 모드
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument(
            "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )

        # Chrome 자동 감지 및 설치
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.driver.implicitly_wait(10)

        print("✅ Chrome WebDriver 초기화 완료")

    def _close_driver(self):
        """WebDriver 종료"""
        if self.driver:
            self.driver.quit()
            self.driver = None
            print("✅ Chrome WebDriver 종료")

    async def crawl_board(
        self, board_id: str = "dunfa", page: int = 1, max_pages: int = 2
    ) -> List[CommunityPost]:
        """게시판 크롤링 (비동기 래퍼)"""
        # Selenium은 동기식이므로 별도 스레드에서 실행
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, self._crawl_board_sync, board_id, page, max_pages
        )

    def _crawl_board_sync(
        self, board_id: str, page: int, max_pages: int
    ) -> List[CommunityPost]:
        """게시판 크롤링 (동기 버전)"""
        all_posts = []

        try:
            self._init_driver()

            for current_page in range(1, max_pages + 1):
                print(f"\n📄 페이지 {current_page}/{max_pages} 크롤링 중...")

                posts = self._crawl_page(board_id, current_page)
                all_posts.extend(posts)

                # Rate Limiting
                if current_page < max_pages:
                    print(f"⏳ {self.rate_limit_delay}초 대기 중...")
                    time.sleep(self.rate_limit_delay)

            print(f"\n✅ 총 {len(all_posts)}개 게시글 크롤링 완료")

        except Exception as e:
            print(f"❌ 크롤링 에러: {e}")

        finally:
            self._close_driver()

        return all_posts

    def _crawl_page(self, board_id: str, page: int) -> List[CommunityPost]:
        """단일 페이지 크롤링"""
        url = f"{self.base_url}/b/{board_id}"
        if page > 1:
            url += f"?p={page}"

        try:
            # 페이지 로드
            self.driver.get(url)

            # JavaScript 렌더링 대기
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".list-table"))
            )

            # 추가 대기 (동적 콘텐츠 로딩)
            time.sleep(2)

            # HTML 파싱
            soup = BeautifulSoup(self.driver.page_source, "lxml")
            posts = self._parse_post_list(soup, board_id)

            print(f"  ✓ {len(posts)}개 게시글 파싱")
            return posts

        except TimeoutException:
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
                    # datetime 속성 또는 텍스트 사용
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

                # 추천수
                rate_elem = row.select_one(".col-rate")
                rate_count = 0
                if rate_elem:
                    try:
                        rate_text = rate_elem.get_text(strip=True)
                        rate_count = int(rate_text.replace(",", ""))
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
                    content="",  # 목록에서는 본문 없음
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
            # ISO 8601 형태 (datetime 속성)
            if "T" in date_str:
                # 2025-01-07T14:30:00+09:00 형태
                return datetime.fromisoformat(date_str.replace("Z", "+00:00"))

            # "01.07" 형태 (월.일)
            elif "." in date_str and len(date_str.split(".")) == 2:
                month, day = date_str.split(".")
                now = datetime.now()
                return datetime(now.year, int(month), int(day))

            # "14:30" 형태 (시간)
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
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._crawl_post_detail_sync, post_url)

    def _crawl_post_detail_sync(self, post_url: str) -> str:
        """게시글 상세 내용 크롤링 (동기 버전)"""
        try:
            if not self.driver:
                self._init_driver()

            self.driver.get(post_url)

            # 본문 대기
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".article-body"))
            )

            soup = BeautifulSoup(self.driver.page_source, "lxml")
            content_elem = soup.select_one(".article-body")

            if content_elem:
                return content_elem.get_text(strip=True)

            return ""

        except Exception as e:
            print(f"    ❌ 상세 크롤링 에러: {e}")
            return ""
