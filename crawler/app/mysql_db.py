"""
MySQL 데이터베이스 연결 (경매장 price_snapshots용)
"""

import aiomysql
import os
from typing import Optional

# MySQL 연결 풀
_mysql_pool: Optional[aiomysql.Pool] = None


async def connect_to_mysql():
    """MySQL 연결 풀 생성"""
    global _mysql_pool

    try:
        _mysql_pool = await aiomysql.create_pool(
            host=os.getenv("MYSQL_HOST", "localhost"),
            port=int(os.getenv("MYSQL_PORT", "3306")),
            user=os.getenv("MYSQL_USER", "dnf"),
            password=os.getenv("MYSQL_PASSWORD", "password123"),
            db=os.getenv("MYSQL_DATABASE", "dnf_auction"),
            charset='utf8mb4',
            autocommit=True,
            minsize=1,
            maxsize=10
        )
        print("✅ MySQL 연결 성공: dnf_auction")
    except Exception as e:
        print(f"❌ MySQL 연결 실패: {e}")
        raise


async def close_mysql_connection():
    """MySQL 연결 풀 종료"""
    global _mysql_pool
    if _mysql_pool:
        _mysql_pool.close()
        await _mysql_pool.wait_closed()
        print("✅ MySQL 연결 종료")


def get_mysql_pool() -> aiomysql.Pool:
    """MySQL 연결 풀 반환"""
    if _mysql_pool is None:
        raise RuntimeError("MySQL이 연결되지 않았습니다.")
    return _mysql_pool
