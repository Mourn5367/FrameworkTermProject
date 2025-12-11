"""
RAG 전용: 디시인사이드 '📚정보' 말머리 게시글 크롤러
추천수 기반 가중치 시스템 + MongoDB 저장
"""

import httpx
from bs4 import BeautifulSoup
from datetime import datetime, timedelta, timezone
from typing import List, Optional
import asyncio
from app.models.post import CommunityPost


class InfoPostCrawler:
    """디시인사이드 '📚정보' 말머리 게시글 전용 크롤러"""

    def __init__(self):
        self.base_url = "https://gall.dcinside.com"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "ko-KR,ko;q=0.9",
            "Referer": "https://gall.dcinside.com/",
        }
        self.kst = timezone(timedelta(hours=9))

    async def crawl_info_posts(
        self,
        gallery_id: str = "dfip",
        days: int = 30,
        max_pages: int = 100,
        flair_keyword: str = "📚정보"
    ) -> List[CommunityPost]:
        """
        '📚정보' 말머리 게시글만 크롤링

        Args:
            gallery_id: 갤러리 ID (기본: dfip)
            days: 수집 기간 (일 단위, 기본: 30일)
            max_pages: 최대 페이지 수 (기본: 100)
            flair_keyword: 말머리 키워드 (기본: 📚정보)

        Returns:
            List[CommunityPost]: 크롤링된 정보 게시글 목록 (추천수 포함)
        """

        now_kst = datetime.now(self.kst)
        crawl_session_id = now_kst.strftime("%Y%m%d_%H%M%S_INFO")
        cutoff_time = now_kst - timedelta(days=days)

        print(f"\n🔍 [정보글 크롤러] 시작")
        print(f"   - 갤러리: {gallery_id}")
        print(f"   - 말머리: {flair_keyword}")
        print(f"   - 기간: {days}일 ({cutoff_time.strftime('%Y-%m-%d')} ~ {now_kst.strftime('%Y-%m-%d')})")
        print(f"   - 최대 페이지: {max_pages}")

        # URL에 말머리 필터 파라미터 추가
        # search_head=10은 '정보' 말머리를 의미 (디시인사이드 내부 코드)
        url_params = {
            "id": gallery_id,
            "sort_type": "N",  # 최신순
            "search_head": "10"  # 정보 말머리 필터
        }

        all_posts = []
        found_cutoff = False

        # 페이지별 크롤링 (순차 처리 - Rate Limiting 고려)
        for page in range(1, max_pages + 1):
            if found_cutoff:
                break

            url_params["page"] = page

            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.get(
                        f"{self.base_url}/mgallery/board/lists",
                        params=url_params,
                        headers=self.headers
                    )
                    response.raise_for_status()

                    soup = BeautifulSoup(response.text, "lxml")
                    page_posts = self._parse_info_posts(soup, gallery_id, crawl_session_id, cutoff_time)

                    if not page_posts:
                        print(f"   ⏹️  페이지 {page}: 게시글 없음, 종료")
                        break

                    # 시간 필터링 체크
                    for post in page_posts:
                        if post.posted_at and post.posted_at < cutoff_time:
                            found_cutoff = True
                            print(f"   ⏹️  페이지 {page}: {days}일 이전 게시글 발견, 종료")
                            break
                        all_posts.append(post)

                    print(f"   ✓ 페이지 {page}: {len(page_posts)}개 수집 (총 {len(all_posts)}개)")

                    # Rate Limiting
                    await asyncio.sleep(2)

            except Exception as e:
                print(f"   ❌ 페이지 {page} 실패: {e}")
                await asyncio.sleep(5)
                continue

        if not all_posts:
            print(f"\n⚠️  [정보글 크롤러] 수집된 게시글 없음")
            return []

        print(f"\n📝 [정보글 크롤러] 본문 및 추천수 수집 시작... (총 {len(all_posts)}개)")

        # 본문 + 추천수 병렬 수집 (10개씩 배치)
        async with httpx.AsyncClient(timeout=15.0) as client:
            batch_size = 10
            for i in range(0, len(all_posts), batch_size):
                batch = all_posts[i:i+batch_size]

                tasks = [
                    self._fetch_full_content(client, post, i+idx+1, len(all_posts))
                    for idx, post in enumerate(batch)
                ]
                await asyncio.gather(*tasks)

                # Rate Limiting
                await asyncio.sleep(3)

        # 추천수 기준 내림차순 정렬
        all_posts.sort(key=lambda x: x.upvote_count or 0, reverse=True)

        print(f"\n✅ [정보글 크롤러] 완료: {len(all_posts)}개")
        print(f"   - 최고 추천: {all_posts[0].upvote_count if all_posts else 0}개")
        print(f"   - 평균 추천: {sum(p.upvote_count or 0 for p in all_posts) // len(all_posts) if all_posts else 0}개")

        return all_posts

    def _parse_info_posts(
        self,
        soup: BeautifulSoup,
        gallery_id: str,
        crawl_session_id: str,
        cutoff_time: datetime
    ) -> List[CommunityPost]:
        """게시글 목록 파싱 (말머리 필터링 적용)"""
        posts = []
        rows = soup.select(".gall_list tbody tr.ub-content")

        for row in rows:
            try:
                # 공지 제외
                if "notice" in row.get("class", []):
                    continue

                # 제목 추출
                title_elem = row.select_one(".gall_tit a")
                if not title_elem:
                    continue

                title = title_elem.get_text(strip=True)
                post_url = title_elem.get("href", "")
                if post_url.startswith("/"):
                    post_url = self.base_url + post_url

                # 작성자
                author_elem = row.select_one(".gall_writer")
                author = author_elem.get("data-nick", "익명") if author_elem else "익명"

                # 날짜
                date_elem = row.select_one(".gall_date")
                date_str = date_elem.get_text(strip=True) if date_elem else ""
                posted_at = self._parse_date(date_str)

                # 조회수
                view_count = 0
                view_elem = row.select_one(".gall_count")
                if view_elem:
                    try:
                        view_count = int(view_elem.get_text(strip=True))
                    except:
                        pass

                # 댓글 수
                comment_count = 0
                reply_elem = row.select_one(".gall_tit .reply_num")
                if reply_elem:
                    try:
                        comment_text = reply_elem.get_text(strip=True)
                        comment_count = int(comment_text.strip("[]"))
                    except:
                        pass

                # 추천수 (목록 페이지에서는 없음, 상세 페이지에서 수집)
                upvote_count = 0
                recommend_elem = row.select_one(".gall_recommend")
                if recommend_elem:
                    try:
                        upvote_count = int(recommend_elem.get_text(strip=True))
                    except:
                        pass

                post = CommunityPost(
                    title=title,
                    content="",  # 나중에 채움
                    author=author,
                    url=post_url,
                    posted_at=posted_at,
                    crawl_session_id=crawl_session_id,
                    board_name=f"디시인사이드 {gallery_id} (정보글)",
                    view_count=view_count,
                    comment_count=comment_count,
                    upvote_count=upvote_count,
                    comments=[],
                )

                posts.append(post)

            except Exception as e:
                continue

        return posts

    async def _fetch_full_content(
        self,
        client: httpx.AsyncClient,
        post: CommunityPost,
        idx: int,
        total: int
    ):
        """게시글 본문 + 추천수 수집"""
        try:
            response = await client.get(post.url, headers=self.headers)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "lxml")

            # 본문
            content_elem = soup.select_one(".write_div")
            if content_elem:
                post.content = content_elem.get_text(separator="\n", strip=True)

            # 추천수 (상세 페이지에서 정확한 값)
            recommend_elem = soup.select_one(".up_num span.up_num")
            if not recommend_elem:
                recommend_elem = soup.select_one(".recommend_box .up")

            if recommend_elem:
                try:
                    recommend_text = recommend_elem.get_text(strip=True)
                    post.upvote_count = int(recommend_text)
                except:
                    pass

            if idx % 10 == 0 or idx == total:
                print(f"      📊 수집 진행: {idx}/{total} (추천 {post.upvote_count}개)")

        except Exception as e:
            post.content = ""
            print(f"      ❌ 본문 수집 실패: {post.url[:50]}... - {e}")

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
                return datetime(year, month, day, tzinfo=self.kst)

            # "12:34" 형태 (오늘 시간)
            elif ":" in date_str:
                hour, minute = date_str.split(":")
                return datetime(
                    now_kst.year, now_kst.month, now_kst.day,
                    int(hour), int(minute),
                    tzinfo=self.kst
                )

            else:
                return now_kst

        except:
            return now_kst
