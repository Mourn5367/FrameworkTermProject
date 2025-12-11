from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, JSONResponse
from typing import List, Literal
from pydantic import BaseModel
from app.models.post import CommunityPost
from app.database import get_database
from app.services.dcinside_crawler import DCInsideCrawler
from app.services.arca_crawler_playwright import ArcaLiveCrawlerPlaywright
from app.services.llm_service import LLMService
from app.services.info_post_service import InfoPostService
from datetime import datetime, timedelta, timezone
import base64

# 한국 시간대 (KST)
KST = timezone(timedelta(hours=9))


def utc_str_to_kst_str(utc_str: str) -> str:
    """UTC 문자열을 KST 문자열로 변환"""
    try:
        # UTC 문자열 파싱 (timezone 정보가 없으면 UTC로 가정)
        dt = datetime.fromisoformat(utc_str.replace('Z', '+00:00'))
        # timezone 정보가 없으면 UTC로 설정
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        # KST로 변환
        dt_kst = dt.astimezone(KST)
        # ISO 8601 형식으로 반환
        return dt_kst.isoformat()
    except Exception as e:
        print(f"[ERROR] utc_str_to_kst_str failed: {utc_str}, error: {e}")
        return utc_str
router = APIRouter()


# Pydantic 모델
class RagQueryRequest(BaseModel):
    question: str


@router.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy", "service": "crawler"}
@router.get("/posts", response_model=List[CommunityPost])
async def get_recent_posts(limit: int = 100, hours: int = 24):
    """최근 크롤링된 게시글 조회"""
    try:
        db = get_database()
        collection = db["community_posts"]
        # 최근 N시간 이내 게시글
        since = datetime.utcnow() - timedelta(hours=hours)
        cursor = collection.find(
            {"crawled_at": {"$gte": since}}
        ).sort("crawled_at", -1).limit(limit)
        posts = await cursor.to_list(length=limit)
        return posts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/crawl/trigger")
async def trigger_crawl(
    site: Literal["dcinside", "arca", "both"] = "both",
    board_id: str = "dfip",
    max_pages: int = 2
):
    """수동 크롤링 트리거"""
    try:
        all_posts = []
        results = {}
        # 디시인사이드 크롤링
        if site in ["dcinside", "both"]:
            dc_crawler = DCInsideCrawler()
            dc_posts = await dc_crawler.crawl_gallery(
                gallery_id=board_id if site == "dcinside" else "dfip",
                max_pages=max_pages
            )
            all_posts.extend(dc_posts)
            results["dcinside"] = len(dc_posts)
        # 아카라이브 크롤링 (Playwright)
        if site in ["arca", "both"]:
            arca_crawler = ArcaLiveCrawlerPlaywright()
            arca_posts = await arca_crawler.crawl_board(
                max_pages=max_pages
            )
            all_posts.extend(arca_posts)
            results["arca"] = len(arca_posts)
        # MongoDB에 저장
        db = get_database()
        collection = db["community_posts"]
        saved_count = 0
        for post in all_posts:
            result = await collection.update_one(
                {"url": post.url},
                {"$set": post.dict()},
                upsert=True
            )
            if result.upserted_id or result.modified_count > 0:
                saved_count += 1
        return {
            "message": "크롤링 완료",
            "site": site,
            "crawled": results,
            "total": len(all_posts),
            "saved": saved_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/wordcloud/generate")
async def generate_wordcloud(board_id: Literal["dfip", "dunfa"] = "dfip"):
    """
    최신 크롤링 데이터로 워드클라우드 생성
    Args:
        board_id: "dfip" (던파 IP 갤러리) 또는 "dunfa" (던파 채널)
    Returns:
        {
            "message": "워드클라우드 생성 완료",
            "board_id": str,
            "total_posts": int,
            "top_words": [[word, count], ...]
        }
    """
    try:
        from app.services.wordcloud_service import WordcloudService

        # MongoDB에서 최신 게시글 조회
        db = get_database()
        collection = db["community_posts"]

        # board_id에 따라 board_name 결정
        board_name_map = {
            "dfip": "디시인사이드 dfip",
            "dunfa": "아카라이브 dunfa"
        }
        board_name = board_name_map.get(board_id)

        # 최신 세션 ID 찾기
        latest_post = await collection.find_one(
            {"board_name": {"$regex": board_name, "$options": "i"}},
            sort=[("crawled_at", -1)]
        )

        if not latest_post:
            raise HTTPException(
                status_code=404,
                detail=f"No posts found for board_name={board_name}"
            )

        session_id = latest_post.get("crawl_session_id")
        if not session_id:
            raise HTTPException(
                status_code=404,
                detail="No crawl_session_id found in latest post"
            )

        # 워드클라우드 생성
        wc_service = WordcloudService()
        wc_data = await wc_service.generate_wordcloud_by_session(
            session_id=session_id,
            board_name=board_name
        )

        if not wc_data:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate wordcloud (no valid data)"
            )

        # MongoDB에 저장
        await wc_service.save_wordcloud_to_db(board_id, wc_data)

        return {
            "message": "워드클라우드 생성 완료",
            "board_id": board_id,
            "total_posts": wc_data["total_posts"],
            "top_words": wc_data["top_words"][:10]
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/stats")
async def get_stats():
    """크롤링 통계"""
    try:
        db = get_database()
        collection = db["community_posts"]
        total = await collection.count_documents({})
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_count = await collection.count_documents({"crawled_at": {"$gte": today}})
        return {
            "total_posts": total,
            "today_posts": today_count,
            "last_updated": datetime.utcnow()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/wordcloud/{board_id}")
async def get_wordcloud(board_id: Literal["dfip", "dunfa"]):
    """
    워드클라우드 이미지 반환 (PNG) - 최신 세션 기준
    Args:
        board_id: "dfip" (던파 IP 갤러리) 또는 "dunfa" (던파 채널)
    Returns:
        PNG 이미지 (image/png)
    """
    try:
        db = get_database()
        collection = db["wordclouds"]

        # 최신 세션 찾기: board_id가 "session_*_dfip" 패턴으로 저장됨
        regex_pattern = f"session_.*_{board_id}$"
        wc_data = await collection.find_one(
            {"board_id": {"$regex": regex_pattern}},
            sort=[("generated_at", -1)]  # 최신 순
        )

        if not wc_data:
            raise HTTPException(
                status_code=404,
                detail=f"Wordcloud not found for board_id={board_id}. "
                       f"Please wait for the first crawl cycle to complete."
            )
        # Base64 디코딩 후 PNG 반환
        img_bytes = base64.b64decode(wc_data["image_base64"])
        return Response(content=img_bytes, media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/wordcloud/{board_id}/metadata")
async def get_wordcloud_metadata(board_id: Literal["dfip", "dunfa"]):
    """
    워드클라우드 메타데이터 조회 - 최신 세션 기준
    Args:
        board_id: "dfip" (던파 IP 갤러리) 또는 "dunfa" (던파 채널)
    Returns:
        {
            "board_id": str,
            "top_words": [[word, count], ...],
            "total_posts": int,
            "generated_at": datetime
        }
    """
    try:
        db = get_database()
        collection = db["wordclouds"]

        # 최신 세션 찾기: board_id가 "session_*_dfip" 패턴으로 저장됨
        regex_pattern = f"session_.*_{board_id}$"
        wc_data = await collection.find_one(
            {"board_id": {"$regex": regex_pattern}},
            sort=[("generated_at", -1)]  # 최신 순
        )

        if not wc_data:
            raise HTTPException(
                status_code=404,
                detail=f"Wordcloud not found for board_id={board_id}"
            )

        # MongoDB _id 제거 및 image_base64 제외 (메타데이터만)
        wc_data.pop("_id", None)
        wc_data.pop("image_base64", None)

        # generated_at은 이미 KST naive datetime으로 저장되어 있음
        # datetime 객체를 ISO 문자열로 변환 (JSON 직렬화 가능하도록)
        if "generated_at" in wc_data and wc_data["generated_at"]:
            wc_data["generated_at"] = wc_data["generated_at"].isoformat()

        # JSONResponse로 명시적 반환
        return JSONResponse(content=wc_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rag/query")
async def rag_query(request: RagQueryRequest):
    """
    RAG 질의응답 엔드포인트

    Args:
        request: {"question": "사용자 질문"}

    Returns:
        {
            "success": bool,
            "answer": str,  # LLM 응답
            "toolCallsHistory": [],  # 사용된 도구 목록
            "iterations": int  # Function Calling 반복 횟수
        }

    Examples:
        - "크루세이더 딜러 빌드 추천해줘"
        - "지금 구슬 사기 좋은 타이밍인가?"
        - "카인 서버 EADG 캐릭터 정보 알려줘"
    """
    try:
        if not request.question or not request.question.strip():
            raise HTTPException(
                status_code=400,
                detail="질문을 입력해주세요."
            )

        # LLM 서비스 초기화 및 질의
        llm_service = LLMService()
        result = await llm_service.query(request.question)

        return result
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"RAG 질의 처리 실패: {str(e)}"
        )


@router.post("/crawl/info-posts")
async def crawl_info_posts(
    days: int = 30,
    max_pages: int = 100
):
    """
    디시인사이드 '📚정보' 게시글 크롤링 + Vector DB 임베딩

    Args:
        days: 수집 기간 (일 단위, 기본: 30일)
        max_pages: 최대 페이지 수 (기본: 100)

    Returns:
        크롤링 + 임베딩 결과 통계

    Example:
        curl -X POST "http://localhost:8000/api/crawl/info-posts?days=30&max_pages=100"
    """
    try:
        info_service = InfoPostService()

        # 크롤링 + MongoDB 저장 + Vector DB 임베딩
        result = await info_service.crawl_and_embed(
            gallery_id="dfip",
            days=days,
            max_pages=max_pages
        )

        return JSONResponse(content=result)

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"정보글 크롤링 실패: {str(e)}"
        )
