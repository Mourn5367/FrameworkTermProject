"""
Vector DB 서비스: ChromaDB + SentenceTransformers
현업 수준의 RAG 시스템 (추천수 기반 가중치)
"""

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Optional
from app.models.post import CommunityPost
import os


class VectorDBService:
    """
    Vector DB 서비스 (ChromaDB + Ko-Sroberta)

    특징:
    - 추천수 기반 가중치: 높은 추천수 → 높은 relevance
    - Metadata 필터링: 날짜, 추천수, 조회수 등
    - Hybrid Search: 의미적 유사도 + 메타데이터 필터
    """

    def __init__(self, persist_directory: str = "./chroma_db"):
        """
        Args:
            persist_directory: ChromaDB 영구 저장 디렉토리
        """
        self.persist_directory = persist_directory

        # ChromaDB 클라이언트 (영구 저장)
        self.chroma_client = chromadb.Client(Settings(
            persist_directory=persist_directory,
            anonymized_telemetry=False
        ))

        # Collection 이름: dnf_info_posts
        self.collection_name = "dnf_info_posts"

        # 한국어 임베딩 모델 (jhgan/ko-sroberta-multitask)
        # 현업 표준: 한국어 성능 최고 (KLUE-STS 93.5점)
        print("📦 임베딩 모델 로딩 중... (jhgan/ko-sroberta-multitask)")
        self.embedding_model = SentenceTransformer('jhgan/ko-sroberta-multitask')
        print("✅ 임베딩 모델 로드 완료")

        # Collection 생성 또는 가져오기
        try:
            self.collection = self.chroma_client.get_collection(name=self.collection_name)
            print(f"✅ 기존 Collection 로드: {self.collection_name}")
        except:
            self.collection = self.chroma_client.create_collection(
                name=self.collection_name,
                metadata={"description": "던파 정보 게시글 (추천수 가중치)"}
            )
            print(f"✅ 새 Collection 생성: {self.collection_name}")

    def add_posts(self, posts: List[CommunityPost]) -> int:
        """
        게시글 임베딩 및 Vector DB 저장

        Args:
            posts: CommunityPost 목록

        Returns:
            저장된 게시글 수
        """
        if not posts:
            print("⚠️  추가할 게시글 없음")
            return 0

        print(f"\n🔄 Vector DB 저장 시작... (총 {len(posts)}개)")

        # 임베딩할 텍스트 생성 (제목 + 본문만, 댓글 제외)
        documents = []
        metadatas = []
        ids = []

        for post in posts:
            # ID: URL 기반 (중복 방지)
            post_id = post.url.split("/")[-1] if "/" in post.url else post.url

            # 임베딩 텍스트: 제목 + 본문만
            text = f"{post.title}\n\n{post.content}"

            documents.append(text)

            # 메타데이터 (필터링 + 정렬용)
            metadatas.append({
                "title": post.title,
                "url": post.url,
                "author": post.author,
                "posted_at": post.posted_at.isoformat() if post.posted_at else "",
                "upvote_count": post.upvote_count or 0,
                "view_count": post.view_count or 0,
                "comment_count": post.comment_count or 0,
                "board_name": post.board_name or "Unknown",
                "crawl_session_id": post.crawl_session_id or ""
            })

            ids.append(post_id)

        # 임베딩 생성 (배치 처리)
        print(f"   🧠 임베딩 생성 중... (모델: ko-sroberta-multitask)")
        embeddings = self.embedding_model.encode(
            documents,
            show_progress_bar=True,
            batch_size=32
        ).tolist()

        # ChromaDB에 저장
        print(f"   💾 ChromaDB 저장 중...")
        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )

        print(f"✅ Vector DB 저장 완료: {len(posts)}개")
        return len(posts)

    def search(
        self,
        query: str,
        top_k: int = 5,
        min_upvote: Optional[int] = None,
        boost_by_upvote: bool = True
    ) -> List[Dict[str, Any]]:
        """
        의미적 검색 (추천수 가중치 적용)

        Args:
            query: 검색 질의
            top_k: 반환할 결과 수 (기본: 5)
            min_upvote: 최소 추천수 필터 (None이면 필터 없음)
            boost_by_upvote: 추천수 기반 점수 부스트 (기본: True)

        Returns:
            검색 결과 리스트 (메타데이터 + 점수)
        """
        # 쿼리 임베딩
        query_embedding = self.embedding_model.encode([query]).tolist()

        # 메타데이터 필터 (선택)
        where_filter = None
        if min_upvote is not None:
            where_filter = {"upvote_count": {"$gte": min_upvote}}

        # 검색 (유사도 기반)
        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=top_k * 2 if boost_by_upvote else top_k,  # 부스트 시 더 많이 가져와서 재정렬
            where=where_filter
        )

        # 결과 파싱
        search_results = []
        for i in range(len(results['ids'][0])):
            result = {
                "id": results['ids'][0][i],
                "document": results['documents'][0][i],
                "metadata": results['metadatas'][0][i],
                "distance": results['distances'][0][i],  # 낮을수록 유사 (L2 distance)
                "similarity": 1 / (1 + results['distances'][0][i])  # 0~1 사이 변환
            }

            # 추천수 기반 점수 부스트 (현업 방식)
            if boost_by_upvote:
                upvote_count = result['metadata'].get('upvote_count', 0)
                # 공식: score = similarity * (1 + log10(upvote_count + 1) * 0.2)
                # 추천수 0 → 가중치 1.0
                # 추천수 10 → 가중치 1.2
                # 추천수 100 → 가중치 1.4
                # 추천수 1000 → 가중치 1.6
                import math
                upvote_boost = 1 + math.log10(upvote_count + 1) * 0.2
                result['boosted_score'] = result['similarity'] * upvote_boost
            else:
                result['boosted_score'] = result['similarity']

            search_results.append(result)

        # 추천수 부스트 적용 시 재정렬
        if boost_by_upvote:
            search_results.sort(key=lambda x: x['boosted_score'], reverse=True)
            search_results = search_results[:top_k]  # 상위 top_k만

        return search_results

    def get_stats(self) -> Dict[str, Any]:
        """Collection 통계"""
        count = self.collection.count()
        return {
            "collection_name": self.collection_name,
            "total_documents": count,
            "persist_directory": self.persist_directory
        }

    def clear(self):
        """Collection 삭제 (재생성 필요 시)"""
        self.chroma_client.delete_collection(name=self.collection_name)
        self.collection = self.chroma_client.create_collection(
            name=self.collection_name,
            metadata={"description": "던파 정보 게시글 (추천수 가중치)"}
        )
        print(f"🗑️  Collection 초기화 완료: {self.collection_name}")
