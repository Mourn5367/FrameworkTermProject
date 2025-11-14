"""
Playwright 기반 아카라이브 크롤러 테스트 (Windows 안정)
"""

import asyncio
import sys
from app.services.arca_crawler_playwright import ArcaLiveCrawlerPlaywright

# Windows에서 asyncio 이벤트 루프 정책 설정
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())


async def test_playwright_crawler():
    """Playwright 크롤러 테스트"""
    print("🧪 Playwright 아카라이브 크롤러 테스트 시작\n")

    crawler = ArcaLiveCrawlerPlaywright()

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
        print("✅ 크롤링 성공!\n")
        print("📝 첫 3개 게시글 샘플 (본문+댓글 포함):\n")
        for i, post in enumerate(posts[:10], 1):
            print(f"{'='*60}")
            print(f"{i}. 제목: {post.title}")
            print(f"   작성자: {post.author}")
            print(f"   URL: {post.url}")
            print(f"   날짜: {post.posted_at}")
            print(f"   조회수: {post.view_count} | 댓글: {post.comment_count}")
            print(f"\n   📄 본문:")
            print(f"   {post.content[:200]}..." if len(post.content) > 200 else f"   {post.content}")
            print(f"\n   💬 댓글 ({len(post.comments)}개):")
            for j, comment in enumerate(post.comments[:3], 1):
                print(f"      [{j}] {comment.author}: {comment.content[:100]}")
            if len(post.comments) > 3:
                print(f"      ... 외 {len(post.comments) - 3}개")
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
    asyncio.run(test_playwright_crawler())
