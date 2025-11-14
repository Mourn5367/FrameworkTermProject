from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
from app.services.dcinside_crawler import DCInsideCrawler
from app.services.arca_crawler_nodriver import ArcaLiveCrawlerNoDriver
from app.database import get_database
from app.config import get_settings
from app.config.crawler_config import config as crawler_config

settings = get_settings()
scheduler = AsyncIOScheduler()


async def crawl_job():
    """주기적으로 실행되는 크롤링 작업"""
    print(f"\n{'='*50}")
    print(f"🕐 크롤링 작업 시작: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*50}\n")

    # 설정 요약 출력
    print(crawler_config.summary())

    all_posts = []
    dc_posts = []
    arca_posts = []

    try:
        # 1. 디시인사이드 크롤링 (설정에 따라)
        if crawler_config.dcinside.enabled:
            print("📌 디시인사이드 던파IP 갤러리 크롤링")
            dc_crawler = DCInsideCrawler()
            dc_posts = await dc_crawler.crawl_gallery()  # 설정 파일에서 자동으로 가져옴
            all_posts.extend(dc_posts)
        else:
            print("⏭️  디시인사이드 크롤링 비활성화됨")

        # 2. 아카라이브 크롤링 (설정에 따라)
        if crawler_config.arca.enabled:
            print("\n📌 아카라이브 던파 채널 크롤링 (nodriver)")
            arca_crawler = ArcaLiveCrawlerNoDriver()
            arca_posts = await arca_crawler.crawl_board()  # 설정 파일에서 자동으로 가져옴
            all_posts.extend(arca_posts)
        else:
            print("⏭️  아카라이브 크롤링 비활성화됨")

        if not all_posts:
            print("⚠️  크롤링된 게시글이 없습니다.")
            return

        # MongoDB에 저장
        db = get_database()
        collection = db["community_posts"]

        # 중복 방지: URL 기준으로 upsert
        saved_count = 0
        for post in all_posts:
            result = await collection.update_one(
                {"url": post.url},
                {"$set": post.dict()},
                upsert=True
            )
            if result.upserted_id or result.modified_count > 0:
                saved_count += 1

        print(f"\n✅ 총 {len(all_posts)}개 크롤링, {saved_count}개 저장/업데이트 완료")
        print(f"   - 디시인사이드: {len(dc_posts)}개")
        print(f"   - 아카라이브: {len(arca_posts)}개\n")

    except Exception as e:
        print(f"❌ 크롤링 작업 에러: {e}\n")


def start_scheduler():
    """스케줄러 시작"""
    if not crawler_config.scheduler.enabled:
        print("⏭️  스케줄러가 비활성화되어 있습니다.")
        return

    # 주기적 크롤링 작업 등록
    scheduler.add_job(
        crawl_job,
        trigger=IntervalTrigger(minutes=crawler_config.scheduler.interval_minutes),
        id="community_crawl_job",
        name="커뮤니티 크롤링",
        replace_existing=True,
    )

    # 시작 시 즉시 실행 (설정에 따라)
    if crawler_config.scheduler.run_on_startup:
        scheduler.add_job(
            crawl_job,
            id="initial_crawl",
            name="초기 크롤링",
        )

    scheduler.start()
    print(f"✅ 스케줄러 시작: {crawler_config.scheduler.interval_minutes}분마다 크롤링")


def stop_scheduler():
    """스케줄러 종료"""
    scheduler.shutdown()
    print("✅ 스케줄러 종료")
