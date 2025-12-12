"""
채팅 서비스: Redis 기반 세션별 채팅 히스토리 관리
"""

import redis.asyncio as aioredis
from typing import List, Dict, Optional
from datetime import datetime, timedelta, timezone
import json
import os

KST = timezone(timedelta(hours=9))


class ChatService:
    """
    Redis 기반 채팅 히스토리 관리

    특징:
    - 세션별 채팅 히스토리 저장 (최대 50개 메시지)
    - 24시간 TTL (자동 만료)
    - JSON 직렬화/역직렬화
    """

    def __init__(self):
        """Redis 클라이언트 초기화"""
        redis_host = os.getenv("REDIS_HOST", "localhost")
        redis_port = int(os.getenv("REDIS_PORT", "6379"))
        redis_password = os.getenv("REDIS_PASSWORD", None)

        self.redis_client = aioredis.from_url(
            f"redis://{redis_host}:{redis_port}",
            password=redis_password,
            decode_responses=True
        )

        # 채팅 히스토리 TTL (24시간)
        self.history_ttl = 24 * 60 * 60

        # 최대 메시지 수 (세션당)
        self.max_messages = 50

    async def get_chat_history(
        self,
        session_id: str,
        limit: Optional[int] = None
    ) -> List[Dict[str, str]]:
        """
        세션별 채팅 히스토리 조회

        Args:
            session_id: 세션 ID
            limit: 반환할 최대 메시지 수 (None이면 전체)

        Returns:
            [
                {"role": "user", "content": "질문"},
                {"role": "assistant", "content": "응답"},
                ...
            ]
        """
        key = f"chat_history:{session_id}"

        try:
            # Redis List에서 메시지 조회 (오래된 것부터)
            messages_json = await self.redis_client.lrange(key, 0, -1)

            if not messages_json:
                return []

            # JSON 역직렬화
            messages = [json.loads(msg) for msg in messages_json]

            # limit 적용 (최신 N개만)
            if limit:
                messages = messages[-limit:]

            return messages

        except Exception as e:
            print(f"[ERROR] get_chat_history failed: {e}")
            return []

    async def save_message(
        self,
        session_id: str,
        role: str,
        content: str
    ) -> bool:
        """
        채팅 메시지 저장

        Args:
            session_id: 세션 ID
            role: "user" 또는 "assistant"
            content: 메시지 내용

        Returns:
            성공 여부
        """
        key = f"chat_history:{session_id}"

        try:
            message = {
                "role": role,
                "content": content,
                "timestamp": datetime.now(KST).isoformat()
            }

            # JSON 직렬화 후 Redis List에 추가 (오른쪽 끝에)
            await self.redis_client.rpush(key, json.dumps(message, ensure_ascii=False))

            # TTL 설정 (24시간)
            await self.redis_client.expire(key, self.history_ttl)

            # 최대 메시지 수 초과 시 오래된 것 삭제
            list_len = await self.redis_client.llen(key)
            if list_len > self.max_messages:
                # 왼쪽에서 초과분만큼 삭제
                await self.redis_client.ltrim(key, list_len - self.max_messages, -1)

            return True

        except Exception as e:
            print(f"[ERROR] save_message failed: {e}")
            return False

    async def clear_history(self, session_id: str) -> bool:
        """
        세션별 채팅 히스토리 삭제

        Args:
            session_id: 세션 ID

        Returns:
            성공 여부
        """
        key = f"chat_history:{session_id}"

        try:
            await self.redis_client.delete(key)
            return True
        except Exception as e:
            print(f"[ERROR] clear_history failed: {e}")
            return False

    async def get_session_count(self) -> int:
        """
        활성 세션 수 조회

        Returns:
            활성 세션 수
        """
        try:
            keys = await self.redis_client.keys("chat_history:*")
            return len(keys)
        except Exception as e:
            print(f"[ERROR] get_session_count failed: {e}")
            return 0

    async def close(self):
        """Redis 연결 종료"""
        await self.redis_client.close()
