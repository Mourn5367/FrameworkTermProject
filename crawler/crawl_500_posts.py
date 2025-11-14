"""
아카라이브 과거 게시글 500개 크롤링 (본문 + 댓글 전문)
"""

import asyncio
import sys
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from app.services.arca_crawler_playwright import ArcaLiveCrawlerPlaywright
import os

# Windows에서 asyncio 이벤트 루프 정책 설정
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())


async def crawl_500_posts():
    """500개 게시글 크롤링 (최대 50페이지)"""

    print("🚀 아카라이브 대량 크롤링 시작")
    print("   목표: 500개 게시글 (본문 + 댓글 전문)\n")

    # 1. MongoDB 연결
    mongodb_url = os.getenv(
        "MONGODB_URL",
        "mongodb://admin:password123@mongodb:27017/dnf_insight?authSource=admin"
    )

    print(f"📡 MongoDB 연결 중...")
    try:
        client = AsyncIOMotorClient(mongodb_url)
        db = client.dnf_insight
        await client.admin.command('ping')
        print("✅ MongoDB 연결 성공\n")
    except Exception as e:
        print(f"❌ MongoDB 연결 실패: {e}")
        return

    # 2. 크롤링 설정
    TARGET_POSTS = 500
    MAX_PAGES = 50  # 페이지당 약 10개 게시글
    BOARD_ID = "dunfa"

    print(f"{'='*60}")
    print(f"🕷️  크롤링 시작")
    print(f"{'='*60}")
    print(f"   게시판: {BOARD_ID}")
    print(f"   목표: {TARGET_POSTS}개 게시글")
    print(f"   최대 페이지: {MAX_PAGES}페이지\n")

    crawler = ArcaLiveCrawlerPlaywright()
    collection = db.community_posts

    total_saved = 0
    total_updated = 0
    total_crawled = 0

    # 3. 페이지별 크롤링
    for page_num in range(1, MAX_PAGES + 1):
        print(f"\n📄 페이지 {page_num}/{MAX_PAGES} 크롤링 중...")

        try:
            posts = await crawler.crawl_board(
                board_id=BOARD_ID,
                page=page_num,
                max_pages=1  # 한 번에 1페이지씩
            )

            if not posts:
                print(f"   ⚠️  게시글 없음, 크롤링 종료")
                break

            # MongoDB에 저장
            for post in posts:
                try:
                    post_dict = post.model_dump(mode='json')
                    result = await collection.update_one(
                        {"url": post.url},
                        {"$set": post_dict},
                        upsert=True
                    )

                    if result.upserted_id:
                        total_saved += 1
                        print(f"   ✅ [{total_saved + total_updated}] 신규: {post.title[:40]}...")
                    else:
                        total_updated += 1
                        print(f"   🔄 [{total_saved + total_updated}] 업데이트: {post.title[:40]}...")

                    total_crawled += 1

                except Exception as e:
                    print(f"   ❌ 저장 실패: {e}")

            # 목표 달성 확인
            if total_crawled >= TARGET_POSTS:
                print(f"\n🎉 목표 달성! {total_crawled}개 게시글 수집 완료")
                break

            # Rate limiting
            print(f"   ⏳ 다음 페이지까지 5초 대기...")
            await asyncio.sleep(5)

        except Exception as e:
            print(f"   ❌ 페이지 {page_num} 크롤링 실패: {e}")
            continue

    # 4. 결과 요약
    print(f"\n{'='*60}")
    print(f"📊 크롤링 완료")
    print(f"{'='*60}")
    print(f"   총 처리: {total_crawled}개")
    print(f"   신규 저장: {total_saved}개")
    print(f"   업데이트: {total_updated}개\n")

    # 5. 통계
    total_count = await collection.count_documents({})
    total_comments = await collection.aggregate([
        {"$project": {"comment_count": {"$size": "$comments"}}},
        {"$group": {"_id": None, "total": {"$sum": "$comment_count"}}}
    ]).to_list(1)

    comment_count = total_comments[0]['total'] if total_comments else 0

    print(f"{'='*60}")
    print(f"📊 MongoDB 전체 통계")
    print(f"{'='*60}")
    print(f"   전체 게시글: {total_count}개")
    print(f"   전체 댓글: {comment_count}개\n")

    client.close()

    print(f"{'='*60}")
    print("✅ 모든 작업 완료")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    asyncio.run(crawl_500_posts())
