"""
워드클라우드 수동 재생성 스크립트
최신 크롤링 세션의 데이터로 워드클라우드를 재생성합니다.
"""

import asyncio
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from app.services.wordcloud_service import WordcloudService


async def main():
    # MongoDB 연결
    client = AsyncIOMotorClient("mongodb://dnf-mongodb:27017")
    db = client["dnf_insight"]

    # 한국 시간 기준 최신 세션 ID 찾기
    collection = db["community_posts"]

    # 최신 게시글의 세션 ID 조회
    latest_post = await collection.find_one(
        {},
        sort=[("crawled_at", -1)]
    )

    if not latest_post:
        print("❌ 크롤링된 데이터가 없습니다.")
        return

    session_id = latest_post.get("crawl_session_id")

    if not session_id:
        print("❌ 세션 ID가 없습니다.")
        return

    print(f"\n{'='*60}")
    print(f"📊 최신 세션: {session_id}")
    print(f"{'='*60}\n")

    # 워드클라우드 생성 서비스
    wc_service = WordcloudService()

    # 디시인사이드 던파IP 워드클라우드 생성
    print("[1/1] 디시인사이드 던파IP 갤러리 워드클라우드 생성...")
    dc_wc = await wc_service.generate_wordcloud_by_session(
        session_id=session_id,
        board_name="디시인사이드 dfip"
    )

    if dc_wc:
        await wc_service.save_wordcloud_to_db("dfip", dc_wc)
        print(f"✅ 생성 완료! (게시글: {dc_wc['total_posts']}개)")
        print(f"   Top 10: {dc_wc['top_words'][:10]}\n")
    else:
        print("❌ 생성 실패 (데이터 없음)\n")

    print(f"{'='*60}")
    print("✅ 워드클라우드 재생성 완료!")
    print(f"{'='*60}\n")

    # MongoDB 연결 종료
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
