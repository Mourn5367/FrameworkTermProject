"""
아카라이브 크롤러 테스트 스크립트
Selenium 기반 크롤러를 테스트합니다.
"""

import asyncio
from app.services.arca_crawler import ArcaLiveCrawler


async def test_arca_crawler():
    """아카라이브 크롤러 테스트"""
    print("🧪 아카라이브 크롤러 테스트 시작\n")

    crawler = ArcaLiveCrawler()

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
        print("📝 첫 3개 게시글 샘플:\n")
        for i, post in enumerate(posts[:3], 1):
            print(f"{i}. 제목: {post.title}")
            print(f"   작성자: {post.author}")
            print(f"   URL: {post.url}")
            print(f"   날짜: {post.posted_at}")
            print(f"   조회수: {post.view_count} | 댓글: {post.comment_count}")
            print()

        # 상세 크롤링 테스트 (첫 번째 게시글)
        print(f"{'='*60}")
        print("📄 첫 번째 게시글 상세 크롤링 테스트")
        print(f"{'='*60}\n")

        first_post_url = posts[0].url
        content = await crawler.crawl_post_detail(first_post_url)

        if content:
            print(f"본문 길이: {len(content)}자")
            print(f"본문 미리보기:\n{content[:200]}...")
        else:
            print("⚠️  본문을 가져오지 못했습니다.")

    else:
        print("⚠️  크롤링된 게시글이 없습니다.")
        print("     403 Forbidden 에러가 발생했을 가능성이 있습니다.")

    print(f"\n{'='*60}")
    print("✅ 테스트 완료")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    asyncio.run(test_arca_crawler())
