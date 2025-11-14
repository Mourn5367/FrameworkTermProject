from fastapi import APIRouter, HTTPException
from typing import List, Literal
from app.models.post import CommunityPost
from app.database import get_database
from app.services.dcinside_crawler import DCInsideCrawler
from app.services.arca_crawler_nodriver import ArcaLiveCrawlerNoDriver
from datetime import datetime, timedelta

router = APIRouter()


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
                page=1,
                max_pages=max_pages
            )
            all_posts.extend(dc_posts)
            results["dcinside"] = len(dc_posts)

        # 아카라이브 크롤링 (nodriver - Cloudflare 우회)
        if site in ["arca", "both"]:
            arca_crawler = ArcaLiveCrawlerNoDriver()
            arca_posts = await arca_crawler.crawl_board(
                board_id=board_id if site == "arca" else "dunfa",
                page=1,
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
