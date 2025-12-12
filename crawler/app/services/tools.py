"""
DnF Insight RAG Tools - Vector DB 기반 커뮤니티 정보 검색
"""

from typing import Dict, Any, List


class DnfApiTools:
    """던파 커뮤니티 정보 검색 도구 (Vector DB 기반)"""

    def __init__(self):
        # Vector DB 서비스 (lazy loading)
        self._info_service = None

    @property
    def info_service(self):
        """InfoPostService 인스턴스 (lazy loading)"""
        if self._info_service is None:
            from app.services.info_post_service import InfoPostService
            self._info_service = InfoPostService()
        return self._info_service

    def search_community_posts(self, query: str, top_k: int = 5) -> Dict[str, Any]:
        """
        커뮤니티 정보글 검색 (Vector DB RAG)

        Args:
            query: 검색 질의 (예: "디레지에 공략", "베누스 패턴", "직업 추천")
            top_k: 반환할 결과 수 (기본: 5)

        Returns:
            검색된 커뮤니티 게시글 목록 (제목, 본문, URL 포함)
        """
        try:
            results = self.info_service.search_posts(
                query=query,
                top_k=top_k,
                min_upvote=None  # 추천수 필터 없음
            )

            if not results:
                return {
                    "success": True,
                    "message": f"'{query}'에 대한 정보를 찾을 수 없습니다. 크롤링된 게시글이 없거나 관련 정보가 부족합니다.",
                    "posts": [],
                    "count": 0
                }

            # 결과 포맷팅 (제목, 본문, URL)
            posts = []
            for result in results:
                metadata = result['metadata']
                posts.append({
                    "title": metadata.get('title', '제목 없음'),
                    "content": result['document'],  # 전체 본문
                    "url": metadata.get('url', ''),
                    "board": metadata.get('board_name', ''),
                    "upvoteCount": metadata.get('upvote_count', 0),
                    "viewCount": metadata.get('view_count', 0),
                    "similarity": round(result['similarity'], 3)
                })

            return {
                "success": True,
                "posts": posts,
                "count": len(posts),
                "query": query,
                "instruction": "답변 마지막에 반드시 출처 URL을 표기해주세요."
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"커뮤니티 검색 실패: {str(e)}"
            }


# Claude Function Calling 형식의 Tool 정의
TOOLS_DEFINITION = [
    {
        "type": "function",
        "function": {
            "name": "search_community_posts",
            "description": (
                "던파 커뮤니티에서 크롤링한 게시글을 검색합니다. "
                "던전 공략, 직업 빌드, 팁, 정보 등을 찾을 때 사용하세요. "
                "검색 결과에는 게시글 제목, 본문, 출처 URL이 포함됩니다. "
                "답변 시 반드시 출처 URL을 함께 제공해야 합니다."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "검색 질의 (예: '디레지에 공략', '진행중인 이벤트')"
                    },
                    "top_k": {
                        "type": "integer",
                        "description": "반환할 게시글 수 (기본: 5, 최대: 10)",
                        "default": 5
                    }
                },
                "required": ["query"]
            }
        }
    }
]
