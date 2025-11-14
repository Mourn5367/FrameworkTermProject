"""
MongoDB 저장 테스트
크롤링 → MongoDB 저장 → 확인
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


async def test_save_to_mongodb():
    """MongoDB 저장 테스트"""

    print("🧪 MongoDB 저장 테스트 시작\n")

    # 1. MongoDB 연결
    mongodb_url = os.getenv(
        "MONGODB_URL",
        "mongodb://admin:password123@localhost:27017/dnf_insight?authSource=admin"
    )

    print(f"📡 MongoDB 연결 중...")
    print(f"   URL: {mongodb_url}\n")

    try:
        client = AsyncIOMotorClient(mongodb_url)
        db = client.dnf_insight

        # 연결 테스트
        await client.admin.command('ping')
        print("✅ MongoDB 연결 성공\n")

    except Exception as e:
        print(f"❌ MongoDB 연결 실패: {e}")
        print("   Docker로 MongoDB를 먼저 실행해주세요:")
        print("   cd /home/aisw/Next_Spring && docker-compose up mongodb -d")
        return

    # 2. 크롤링
    print("🕷️  아카라이브 크롤링 시작...")
    crawler = ArcaLiveCrawlerPlaywright()

    posts = await crawler.crawl_board(
        board_id="dunfa",
        page=1,
        max_pages=1  # 테스트용 1페이지만
    )

    if not posts:
        print("❌ 크롤링 실패")
        return

    print(f"\n✅ 크롤링 완료: {len(posts)}개 게시글\n")

    # 3. MongoDB에 저장
    print(f"{'='*60}")
    print("💾 MongoDB에 저장 중...")
    print(f"{'='*60}\n")

    collection = db.community_posts
    saved_count = 0
    updated_count = 0

    for i, post in enumerate(posts, 1):
        try:
            # Pydantic 모델을 dict로 변환
            post_dict = post.model_dump(mode='json')

            # URL 기준으로 upsert (중복 방지)
            result = await collection.update_one(
                {"url": post.url},
                {"$set": post_dict},
                upsert=True
            )

            if result.upserted_id:
                saved_count += 1
                print(f"  [{i}/{len(posts)}] ✅ 새 게시글 저장")
            else:
                updated_count += 1
                print(f"  [{i}/{len(posts)}] 🔄 기존 게시글 업데이트")

            print(f"       제목: {post.title[:40]}...")
            print(f"       URL: {post.url}")
            print(f"       댓글: {len(post.comments)}개")
            print()

        except Exception as e:
            print(f"  [{i}/{len(posts)}] ❌ 저장 실패: {e}\n")

    print(f"{'='*60}")
    print(f"📊 저장 완료")
    print(f"{'='*60}")
    print(f"   신규 저장: {saved_count}개")
    print(f"   업데이트: {updated_count}개")
    print(f"   총 처리: {len(posts)}개\n")

    # 4. 저장된 데이터 확인
    print(f"{'='*60}")
    print("🔍 저장된 데이터 확인")
    print(f"{'='*60}\n")

    # 전체 문서 개수
    total_count = await collection.count_documents({})
    print(f"📊 전체 게시글 수: {total_count}개\n")

    # 최근 저장된 게시글 1개 조회
    latest = await collection.find_one(
        {},
        sort=[("crawled_at", -1)]
    )

    if latest:
        print("📄 최근 저장된 게시글 샘플:\n")
        print(f"   제목: {latest['title']}")
        print(f"   작성자: {latest['author']}")
        print(f"   조회수: {latest.get('view_count', 0)}")
        print(f"   댓글 수: {len(latest.get('comments', []))}개")
        print(f"   크롤링 시간: {latest['crawled_at']}")
        print()

        # 댓글 샘플
        if latest.get('comments'):
            print("   💬 댓글 샘플 (최대 3개):\n")
            for i, comment in enumerate(latest['comments'][:3], 1):
                indent = "  " * comment.get('depth', 0)
                parent_info = f" (부모: {comment.get('parent_id')})" if comment.get('parent_id') else ""
                print(f"      {indent}[{i}] depth={comment.get('depth', 0)}{parent_info}")
                print(f"      {indent}    {comment['author']}: {comment['content'][:50]}...")
            print()

    # 5. 통계
    print(f"{'='*60}")
    print("📊 MongoDB 통계")
    print(f"{'='*60}\n")

    # 게시판별 통계
    pipeline = [
        {"$group": {
            "_id": "$board_name",
            "count": {"$sum": 1},
            "total_comments": {"$sum": {"$size": "$comments"}}
        }},
        {"$sort": {"count": -1}}
    ]

    stats = []
    async for stat in collection.aggregate(pipeline):
        stats.append(stat)

    if stats:
        print("게시판별 통계:")
        for stat in stats:
            print(f"   {stat['_id']}: {stat['count']}개 게시글, {stat['total_comments']}개 댓글")

    print()

    # 연결 종료
    client.close()

    print(f"{'='*60}")
    print("✅ 테스트 완료")
    print(f"{'='*60}\n")

    print("💡 MongoDB 확인 방법:")
    print("   1. MongoDB Compass 사용: mongodb://admin:password123@localhost:27017")
    print("   2. Docker 쉘: docker exec -it dnf-mongodb mongosh -u admin -p password123")
    print("   3. Python 쿼리: python -c \"from pymongo import MongoClient; ...\"")
    print()


if __name__ == "__main__":
    asyncio.run(test_save_to_mongodb())
