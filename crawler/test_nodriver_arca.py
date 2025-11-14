"""
nodriver 기반 아카라이브 크롤러 테스트 (Cloudflare 우회)
2025년 최신 솔루션 테스트
"""

import asyncio
from app.services.arca_crawler_nodriver import ArcaLiveCrawlerNoDriver


async def test_nodriver_crawler():
    """nodriver 크롤러 테스트"""
    print("🧪 nodriver 아카라이브 크롤러 테스트 시작\n")
    print("   (Cloudflare 우회 시도)\n")

    crawler = ArcaLiveCrawlerNoDriver()

    # 던파 채널 크롤링 (1페이지만)
    posts = await crawler.crawl_board(
        board_id="dunfa",
        page=1,
        max_pages=1  # 테스트용으로 1페이지만
    )

    print(f"\n{'='*60}")
    print(f"📊 크롤링 결과")
    print(f"{'='*60}\n")
    print(f"총 게시글 수: {len(posts)}\n")

    if posts:
        print("✅ Cloudflare 우회 성공!\n")
        print("📝 첫 5개 게시글 샘플:\n")
        for i, post in enumerate(posts[:5], 1):
            print(f"{i}. 제목: {post.title}")
            print(f"   작성자: {post.author}")
            print(f"   URL: {post.url}")
            print(f"   날짜: {post.posted_at}")
            print(f"   조회수: {post.view_count} | 댓글: {post.comment_count}")
            print()

    else:
        print("❌ 크롤링 실패")
        print("   - 403 Forbidden 에러가 발생했을 가능성")
        print("   - Cloudflare 우회 실패")
        print("   - 네트워크 문제")

    print(f"{'='*60}")
    print("✅ 테스트 완료")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    # nodriver는 비동기 기반
    asyncio.run(test_nodriver_crawler())
