from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import asyncio

from app.services.dcinside_crawler import DCInsideCrawler
from app.services.arca_crawler_playwright import ArcaLiveCrawlerPlaywright
from app.database import get_database
from app.settings import get_settings
from app.config.crawler_config import config as crawler_config

settings = get_settings()
scheduler = AsyncIOScheduler()


async def crawl_job():
    """주기적으로 실행되는 크롤링 작업 (세션 ID 기반)"""
    from datetime import timezone, timedelta
    import asyncio

    # 한국 시간 기준 세션 ID 생성
    kst = timezone(timedelta(hours=9))
    now_kst = datetime.now(kst)
    session_id = now_kst.strftime("%Y%m%d_%H%M%S")

    print(f"\n{'='*60}")
    print(f"📌 크롤링 세션 시작: {session_id}")
    print(f"   현재 시각 (KST): {now_kst.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")

    # 설정 요약 출력
    print(crawler_config.summary())

    dc_posts = []
    arca_posts = []

    try:
        # 1. 디시인사이드 크롤링
        async def crawl_dcinside():
            if crawler_config.dcinside.enabled:
                print("🔍 [1/2] 디시인사이드 던파IP 갤러리 크롤링...")
                dc_crawler = DCInsideCrawler()
                posts = await dc_crawler.crawl_gallery(crawl_session_id=session_id)
                print(f"✅ 디시인사이드 크롤링 완료: {len(posts)}개")
                return posts
            else:
                print("⏭️  디시인사이드 크롤링 비활성화됨")
                return []

        # 2. 아카라이브 크롤링
        async def crawl_arca():
            if crawler_config.arca.enabled:
                print("🔍 [2/2] 아카라이브 던파 채널 크롤링...")
                arca_crawler = ArcaLiveCrawlerPlaywright()
                posts = await arca_crawler.crawl_board(crawl_session_id=session_id)
                print(f"✅ 아카라이브 크롤링 완료: {len(posts)}개")
                return posts
            else:
                print("⏭️  아카라이브 크롤링 비활성화됨")
                return []

        # 병렬 실행
        print("\n🚀 병렬 크롤링 시작...\n")
        dc_posts, arca_posts = await asyncio.gather(
            crawl_dcinside(),
            crawl_arca()
        )

        all_posts = dc_posts + arca_posts

        if not all_posts:
            print("⚠️  크롤링된 게시글이 없습니다.")
            return

        # MongoDB에 저장
        db = get_database()
        collection = db["community_posts"]

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

        # 3. 워드클라우드 생성 (세션 ID 기반으로 3개 생성)
        if crawler_config.wordcloud.enabled:
            print(f"\n{'='*60}")
            print("📊 워드클라우드 생성 중...")
            print(f"{'='*60}\n")

            from app.services.wordcloud_service import WordcloudService
            wc_service = WordcloudService()

            # 3-1. 디시인사이드 던파IP 갤러리 워드클라우드
            if crawler_config.dcinside.enabled and dc_posts:
                print("[1/3] 디시인사이드 던파IP 갤러리 워드클라우드...")
                dc_wc = await wc_service.generate_wordcloud_by_session(
                    session_id=session_id,
                    board_name="디시인사이드 dfip"
                )
                if dc_wc:
                    await wc_service.save_wordcloud_to_db(f"session_{session_id}_dfip", dc_wc)
                    print(f"✅ 생성 완료! (게시글: {dc_wc['total_posts']}개)\n")
                else:
                    print("❌ 생성 실패 (데이터 없음)\n")

            # 3-2. 아카라이브 던파 채널 워드클라우드
            if crawler_config.arca.enabled and arca_posts:
                print("[2/3] 아카라이브 던파 채널 워드클라우드...")
                arca_wc = await wc_service.generate_wordcloud_by_session(
                    session_id=session_id,
                    board_name="아카라이브 dunfa"
                )
                if arca_wc:
                    await wc_service.save_wordcloud_to_db(f"session_{session_id}_dunfa", arca_wc)
                    print(f"✅ 생성 완료! (게시글: {arca_wc['total_posts']}개)\n")
                else:
                    print("❌ 생성 실패 (데이터 없음)\n")

            # 3-3. 통합 워드클라우드 (던파IP + 던파 채널)
            if all_posts:
                print("[3/3] 통합 워드클라우드 (던파IP + 던파 채널)...")
                combined_wc = await wc_service.generate_wordcloud_by_session(
                    session_id=session_id,
                    board_name=None  # 모든 게시판
                )
                if combined_wc:
                    await wc_service.save_wordcloud_to_db(f"session_{session_id}_combined", combined_wc)
                    print(f"✅ 생성 완료! (게시글: {combined_wc['total_posts']}개)\n")
                else:
                    print("❌ 생성 실패 (데이터 없음)\n")

            print("✅ 워드클라우드 생성 작업 완료")

        print(f"\n{'='*60}")
        print(f"✅ 세션 {session_id} 완료!")
        print(f"{'='*60}\n")

    except Exception as e:
        print(f"❌ 크롤링 작업 에러: {e}\n")
        import traceback
        traceback.print_exc()


def start_scheduler():
    """스케줄러 시작"""
    if not crawler_config.scheduler.enabled:
        print("⏭️  스케줄러가 비활성화되어 있습니다.")
        return

    # 주기적 크롤링 작업 등록
    scheduler.add_job(
        crawl_job,
        trigger=IntervalTrigger(
            minutes=crawler_config.scheduler.interval_minutes,
            timezone='Asia/Seoul'
        ),
        id="community_crawl_job",
        name="커뮤니티 크롤링",
        replace_existing=True,
        misfire_grace_time=None,  # ⭐ misfire 무시 (항상 실행)
        coalesce=True,  # ⭐ 누적된 작업 하나로 통합
    )

    scheduler.start()
    print(f"✅ 스케줄러 시작: {crawler_config.scheduler.interval_minutes}분마다 크롤링")
    print("   (스케줄러는 백그라운드에서 실행됩니다.)")

    # 시작 시 즉시 실행 (설정에 따라)
    if crawler_config.scheduler.run_on_startup:
        print("🚀 애플리케이션 시작 시 초기 크롤링 실행...")
        scheduler.add_job(
            crawl_job,
            id="initial_crawl",
            name="초기 크롤링",
            replace_existing=True
        )


def stop_scheduler():
    """스케줄러 종료"""
    scheduler.shutdown()
    print("✅ 스케줄러 종료")
