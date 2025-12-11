"""
세션 ID 기반 크롤링 + 워드클라우드 생성 테스트
던파 채널(아카라이브) / IP 갤러리(디시인사이드) / 통합 - 총 3개 워드클라우드 생성
"""
import asyncio
from datetime import datetime, timezone, timedelta
from app.services.dcinside_crawler import DCInsideCrawler
from app.services.arca_crawler_playwright import ArcaLiveCrawlerPlaywright
from app.services.wordcloud_service import WordcloudService
from app.database import connect_to_mongo, get_database


async def main():
    # MongoDB 연결
    await connect_to_mongo()

    # 한국 시간 기준 세션 ID 생성
    kst = timezone(timedelta(hours=9))
    now_kst = datetime.now(kst)
    session_id = now_kst.strftime("%Y%m%d_%H%M%S")

    print("="*60)
    print(f"📌 크롤링 세션 시작: {session_id}")
    print(f"   현재 시각 (KST): {now_kst.strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)

    # 디시인사이드 크롤링
    print("\n🔍 [1/2] 디시인사이드 던파IP 갤러리 크롤링...")
    dc_crawler = DCInsideCrawler()
    dc_posts = await dc_crawler.crawl_gallery(
        gallery_id="dfip",
        max_pages=1,
        crawl_session_id=session_id
    )
    print(f"✅ 디시인사이드 크롤링 완료: {len(dc_posts)}개 게시글")

    # 아카라이브 크롤링
    print("\n🔍 [2/2] 아카라이브 던파 채널 크롤링...")
    arca_crawler = ArcaLiveCrawlerPlaywright()
    arca_posts = await arca_crawler.crawl_board(
        board_id="dunfa",
        max_pages=1,
        crawl_session_id=session_id
    )
    print(f"✅ 아카라이브 크롤링 완료: {len(arca_posts)}개 게시글")

    # MongoDB에 저장
    db = get_database()
    collection = db["community_posts"]

    all_posts = dc_posts + arca_posts
    saved_count = 0
    for post in all_posts:
        result = await collection.update_one(
            {"url": post.url},
            {"$set": post.model_dump()},
            upsert=True
        )
        if result.upserted_id or result.modified_count > 0:
            saved_count += 1

    print(f"\n💾 MongoDB 저장 완료: {saved_count}개 (총 {len(all_posts)}개)")

    # 워드클라우드 생성
    print("\n" + "="*60)
    print("📊 워드클라우드 생성 중...")
    print("="*60)

    wc_service = WordcloudService()

    # 1. 디시인사이드 던파IP 갤러리 워드클라우드
    print("\n[1/3] 디시인사이드 던파IP 갤러리 워드클라우드...")
    dc_wc = await wc_service.generate_wordcloud_by_session(
        session_id=session_id,
        board_name="디시인사이드 dfip"
    )
    if dc_wc:
        await wc_service.save_wordcloud_to_db(f"session_{session_id}_dfip", dc_wc)
        print(f"✅ 생성 완료! (게시글: {dc_wc['total_posts']}개)")
        print(f"   상위 5개 키워드: {', '.join([f'{w}({c})' for w, c in dc_wc['top_words'][:5]])}")
    else:
        print("❌ 생성 실패 (데이터 없음)")

    # 2. 아카라이브 던파 채널 워드클라우드
    print("\n[2/3] 아카라이브 던파 채널 워드클라우드...")
    arca_wc = await wc_service.generate_wordcloud_by_session(
        session_id=session_id,
        board_name="아카라이브 dunfa"
    )
    if arca_wc:
        await wc_service.save_wordcloud_to_db(f"session_{session_id}_dunfa", arca_wc)
        print(f"✅ 생성 완료! (게시글: {arca_wc['total_posts']}개)")
        print(f"   상위 5개 키워드: {', '.join([f'{w}({c})' for w, c in arca_wc['top_words'][:5]])}")
    else:
        print("❌ 생성 실패 (데이터 없음)")

    # 3. 통합 워드클라우드 (던파IP + 던파 채널)
    print("\n[3/3] 통합 워드클라우드 (던파IP + 던파 채널)...")
    combined_wc = await wc_service.generate_wordcloud_by_session(
        session_id=session_id,
        board_name=None  # 모든 게시판
    )
    if combined_wc:
        await wc_service.save_wordcloud_to_db(f"session_{session_id}_combined", combined_wc)
        print(f"✅ 생성 완료! (게시글: {combined_wc['total_posts']}개)")
        print(f"   상위 10개 키워드:")
        for i, (word, count) in enumerate(combined_wc['top_words'][:10], 1):
            print(f"      {i}. {word}: {count}회")
    else:
        print("❌ 생성 실패 (데이터 없음)")

    # 결과 요약
    print("\n" + "="*60)
    print("📊 워드클라우드 생성 결과 요약")
    print("="*60)
    print(f"세션 ID: {session_id}")
    print(f"디시인사이드: {'✅' if dc_wc else '❌'} (board_id: session_{session_id}_dfip)")
    print(f"아카라이브:   {'✅' if arca_wc else '❌'} (board_id: session_{session_id}_dunfa)")
    print(f"통합:         {'✅' if combined_wc else '❌'} (board_id: session_{session_id}_combined)")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())
