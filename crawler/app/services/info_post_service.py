"""
정보글 통합 서비스: 크롤링 + MongoDB 저장 + Vector DB 임베딩
"""

from typing import List
from app.services.info_post_crawler import InfoPostCrawler
from app.services.vector_db_service import VectorDBService
from app.database import get_database
from app.models.info_post import InfoPost

# Vector DB 서비스 싱글톤 (전역 인스턴스)
_vector_db_instance = None

def get_vector_db():
    """Vector DB 서비스 싱글톤 인스턴스 반환"""
    global _vector_db_instance
    if _vector_db_instance is None:
        _vector_db_instance = VectorDBService(persist_directory="/app/chroma_db")
    return _vector_db_instance


class InfoPostService:
    """
    정보글 통합 서비스

    워크플로우:
    1. 디시인사이드 '📚정보' 게시글 크롤링
    2. MongoDB에 저장 (추천수 포함)
    3. Vector DB 임베딩 생성 및 저장
    """

    def __init__(self):
        self.crawler = InfoPostCrawler()
        self.vector_db = get_vector_db()  # 싱글톤 인스턴스 사용

    async def crawl_and_embed(
        self,
        gallery_id: str = "dfip",
        days: int = 7,
        max_pages: int = 100
    ) -> dict:
        """
        정보글 크롤링 + MongoDB 저장 + Vector DB 임베딩

        Args:
            gallery_id: 갤러리 ID (기본: dfip)
            days: 수집 기간 (일 단위, 기본: 30일)
            max_pages: 최대 페이지 수 (기본: 100)

        Returns:
            결과 통계 딕셔너리
        """
        # 1단계: 크롤링
        print("\n" + "="*60)
        print("📚 정보글 크롤링 + 임베딩 시작")
        print("="*60)

        posts = await self.crawler.crawl_info_posts(
            gallery_id=gallery_id,
            days=days,
            max_pages=max_pages,
            flair_keyword="📚정보"
        )

        if not posts:
            return {
                "success": False,
                "message": "크롤링된 게시글 없음",
                "crawled": 0,
                "saved_to_mongo": 0,
                "embedded": 0
            }

        # 2단계: MongoDB 저장
        print(f"\n💾 MongoDB 저장 중... (총 {len(posts)}개)")
        saved_count = await self._save_to_mongodb(posts)

        # 3단계: Vector DB 임베딩
        print(f"\n🧠 Vector DB 임베딩 중... (총 {len(posts)}개)")
        embedded_count = self.vector_db.add_posts(posts)

        # 통계
        stats = self.vector_db.get_stats()

        print("\n" + "="*60)
        print("✅ 정보글 처리 완료")
        print(f"   - 크롤링: {len(posts)}개")
        print(f"   - MongoDB 저장: {saved_count}개")
        print(f"   - Vector DB 임베딩: {embedded_count}개")
        print(f"   - 전체 Vector DB 문서 수: {stats['total_documents']}개")
        print("="*60 + "\n")

        return {
            "success": True,
            "crawled": len(posts),
            "saved_to_mongo": saved_count,
            "embedded": embedded_count,
            "total_vector_db_docs": stats['total_documents'],
            "top_posts": [
                {
                    "title": p.title,
                    "upvote_count": p.upvote_count,
                    "url": p.url
                }
                for p in posts[:5]  # 상위 5개
            ]
        }

    async def _save_to_mongodb(self, posts: List[InfoPost]) -> int:
        """
        MongoDB에 정보글 저장 (upsert) - info_posts 컬렉션 사용

        Args:
            posts: InfoPost 목록

        Returns:
            저장된 게시글 수
        """
        db = get_database()
        collection = db.info_posts  # 별도 컬렉션 사용
        saved_count = 0

        for post in posts:
            try:
                # URL 기반 upsert (중복 방지)
                result = await collection.update_one(
                    {"url": post.url},
                    {"$set": post.model_dump()},
                    upsert=True
                )

                if result.upserted_id or result.modified_count > 0:
                    saved_count += 1

            except Exception as e:
                print(f"   ❌ MongoDB 저장 실패: {post.url[:50]}... - {e}")
                continue

        print(f"   ✅ MongoDB 저장 완료: {saved_count}개")
        return saved_count

    def search_posts(
        self,
        query: str,
        top_k: int = 5,
        min_upvote: int = None
    ) -> List[dict]:
        """
        Vector DB 검색 (추천수 가중치 적용)

        Args:
            query: 검색 질의
            top_k: 반환할 결과 수
            min_upvote: 최소 추천수 필터

        Returns:
            검색 결과 리스트
        """
        return self.vector_db.search(
            query=query,
            top_k=top_k,
            min_upvote=min_upvote,
            boost_by_upvote=True
        )

    def get_vector_db_stats(self) -> dict:
        """Vector DB 통계"""
        return self.vector_db.get_stats()

    def clear_vector_db(self):
        """Vector DB 초기화 (재생성 필요 시)"""
        self.vector_db.clear()
