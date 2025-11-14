from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import get_settings

settings = get_settings()

# MongoDB 클라이언트 (전역)
mongo_client: AsyncIOMotorClient | None = None
mongo_db: AsyncIOMotorDatabase | None = None


async def connect_to_mongo():
    """MongoDB 연결"""
    global mongo_client, mongo_db
    mongo_client = AsyncIOMotorClient(settings.mongodb_url)
    mongo_db = mongo_client[settings.mongodb_db_name]
    print(f"✅ MongoDB 연결 성공: {settings.mongodb_db_name}")


async def close_mongo_connection():
    """MongoDB 연결 종료"""
    global mongo_client
    if mongo_client:
        mongo_client.close()
        print("✅ MongoDB 연결 종료")


def get_database() -> AsyncIOMotorDatabase:
    """데이터베이스 인스턴스 반환"""
    if mongo_db is None:
        raise RuntimeError("MongoDB가 연결되지 않았습니다.")
    return mongo_db
