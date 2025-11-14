from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class Comment(BaseModel):
    """댓글 모델 (계층 구조 지원)"""
    comment_id: Optional[str] = None  # 댓글 고유 ID (사이트에서 제공)
    parent_id: Optional[str] = None   # 부모 댓글 ID (대댓글인 경우)
    author: str
    content: str
    posted_at: Optional[datetime] = None
    depth: int = 0  # 댓글 깊이 (0=원댓글, 1=대댓글, 2=대대댓글...)
    replies: Optional[List["Comment"]] = []  # 자식 댓글 리스트 (트리 구조)


class CommunityPost(BaseModel):
    """커뮤니티 게시글 모델"""

    title: str
    content: str
    author: str
    url: str
    posted_at: datetime
    crawled_at: datetime = Field(default_factory=datetime.utcnow)
    board_name: Optional[str] = None
    view_count: Optional[int] = None
    comment_count: Optional[int] = None
    comments: Optional[List[Comment]] = []  # 댓글 리스트

    class Config:
        json_schema_extra = {
            "example": {
                "title": "던파 신규 레이드 업데이트",
                "content": "신규 레이드가 오픈되었습니다...",
                "author": "user123",
                "url": "https://example.com/post/12345",
                "posted_at": "2025-01-07T10:00:00",
                "board_name": "던전앤파이터",
                "view_count": 1500,
                "comment_count": 32,
            }
        }
