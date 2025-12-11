from pydantic import BaseModel, Field, field_serializer
from datetime import datetime, timezone, timedelta
from typing import Optional, List

# 한국 시간대 (KST)
KST = timezone(timedelta(hours=9))


def get_kst_now() -> datetime:
    """현재 한국 시간 반환 (timezone-aware)"""
    return datetime.now(KST)


def to_fake_utc(dt: datetime) -> datetime:
    """
    timezone-aware datetime을 UTC timezone으로 변환 (시간값은 유지)
    Motor가 datetime을 UTC로 변환하므로, KST 시간값을 UTC timezone으로 저장
    """
    if dt.tzinfo is None:
        # Naive이면 그대로 UTC로 가정
        return dt.replace(tzinfo=timezone.utc)
    # KST 시간값을 유지하면서 timezone만 UTC로 변경
    kst_time = dt.astimezone(KST)
    return kst_time.replace(tzinfo=timezone.utc)


class Comment(BaseModel):
    """댓글 모델 (계층 구조 지원)"""
    comment_id: Optional[str] = None  # 댓글 고유 ID (사이트에서 제공)
    parent_id: Optional[str] = None   # 부모 댓글 ID (대댓글인 경우)
    author: str
    content: str
    posted_at: Optional[datetime] = None
    depth: int = 0  # 댓글 깊이 (0=원댓글, 1=대댓글, 2=대대댓글...)
    replies: Optional[List["Comment"]] = []  # 자식 댓글 리스트 (트리 구조)

    @field_serializer('posted_at')
    def serialize_posted_at(self, dt: Optional[datetime], _info):
        """posted_at을 fake UTC datetime으로 직렬화"""
        return to_fake_utc(dt) if dt else None


class CommunityPost(BaseModel):
    """커뮤니티 게시글 모델"""

    title: str
    content: str
    author: str
    url: str
    posted_at: datetime
    crawled_at: datetime = Field(default_factory=get_kst_now)  # ⭐ KST로 변경
    crawl_session_id: Optional[str] = None  # 크롤링 세션 ID (예: 20251202_140000)
    board_name: Optional[str] = None
    view_count: Optional[int] = None
    comment_count: Optional[int] = None
    upvote_count: Optional[int] = None  # ⭐ 추천수 (RAG 가중치용)
    comments: Optional[List[Comment]] = []  # 댓글 리스트

    @field_serializer('posted_at', 'crawled_at')
    def serialize_datetime(self, dt: datetime, _info):
        """datetime을 fake UTC datetime으로 직렬화"""
        return to_fake_utc(dt)

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
