from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.database import connect_to_mongo, close_mongo_connection
from app.mysql_db import connect_to_mysql, close_mysql_connection
from app.services.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 시작/종료 시 실행"""
    # 시작 시
    print("\n🚀 FastAPI 크롤러 서비스 시작\n")
    await connect_to_mongo()
    await connect_to_mysql()
    start_scheduler()  # ⭐ 스케줄러 시작 (동기 함수)

    yield  # 애플리케이션 실행 중

    # 종료 시
    print("\n🛑 FastAPI 크롤러 서비스 종료\n")
    stop_scheduler()  # ⭐ 스케줄러 종료 (동기 함수)
    await close_mongo_connection()
    await close_mysql_connection()


app = FastAPI(
    title="DnF Insight Crawler",
    description="던파 커뮤니티 크롤링 서비스",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8080",
        "http://192.168.24.189:3000",  # 로컬 네트워크 IP
        "http://192.168.24.189:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(router, prefix="/api", tags=["crawler"])


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "service": "DnF Insight Crawler",
        "status": "running",
        "docs": "/docs"
    }
