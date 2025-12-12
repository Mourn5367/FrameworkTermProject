"""
정보글 전용 모델 (community_posts와 분리)
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class InfoPost(BaseModel):
    """
    디시인사이드 '📚정보' 말머리 게시글 모델

    community_posts와 별도로 관리되며, Vector RAG 전용으로 사용
    """

    title: str = Field(..., description="게시글 제목")
    content: str = Field(..., description="게시글 본문")
    author: str = Field(..., description="작성자")
    url: str = Field(..., description="게시글 URL (unique key)")

    # 메타데이터
    posted_at: Optional[datetime] = Field(None, description="작성 시간 (KST)")
    crawled_at: datetime = Field(default_factory=datetime.now, description="크롤링 시간")
    crawl_session_id: str = Field(..., description="크롤링 세션 ID")

    # 통계
    view_count: int = Field(default=0, description="조회수")
    upvote_count: int = Field(default=0, description="추천수 (Vector 가중치용)")
    comment_count: int = Field(default=0, description="댓글 수")

    # 분류
    gallery_id: str = Field(default="dfip", description="갤러리 ID")
    category: str = Field(default="📚정보", description="말머리")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "11월 27일 이벤트 설명",
                "content": "던파 이벤트 이미지와 함께 보는 간단 설명입니다...",
                "author": "작성자명",
                "url": "https://gall.dcinside.com/mgallery/board/view/?id=dfip&no=3562510",
                "posted_at": "2024-11-27T10:30:00",
                "upvote_count": 41,
                "view_count": 12143,
                "gallery_id": "dfip",
                "category": "📚정보"
            }
        }
