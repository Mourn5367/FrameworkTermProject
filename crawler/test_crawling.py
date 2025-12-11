"""
크롤링 테스트 스크립트
디시인사이드 + 아카라이브 크롤링 테스트
"""

import asyncio
import sys
from app.services.dcinside_crawler import DCInsideCrawler
from app.config.crawler_config import config


async def test_dcinside():
    """디시인사이드 크롤링 테스트"""
    print("\n" + "="*60)
    print("📌 디시인사이드 던파IP 갤러리 크롤링 테스트")
    print("="*60)
    print(f"설정:")
    print(f"  - gallery_id: {config.dcinside.gallery_id}")
    print(f"  - max_pages: {config.dcinside.max_pages}")
    print(f"  - fetch_full_content: {config.dcinside.fetch_full_content}")
    print(f"  - rate_limit: {config.dcinside.rate_limit_seconds}초")
    print()

    crawler = DCInsideCrawler()

    # 1페이지만 테스트 (빠른 확인)
    print("🚀 크롤링 시작 (1페이지만 테스트)...\n")
    posts = await crawler.crawl_gallery(max_pages=1)

    print(f"\n{'='*60}")
    print(f"✅ 크롤링 완료: 총 {len(posts)}개 게시글")
    print(f"{'='*60}\n")

    if posts:
        # 첫 번째 게시글 상세 정보
        post = posts[0]
        print("📄 첫 번째 게시글 상세:")
        print(f"  제목: {post.title}")
        print(f"  작성자: {post.author}")
        print(f"  조회수: {post.view_count}")
        print(f"  댓글수: {post.comment_count}")
        print(f"  URL: {post.url}")
        print(f"  게시일: {post.posted_at}")
        print(f"  수집일: {post.crawled_at}")
        print(f"  본문 길이: {len(post.content)}자")

        if post.content:
            print(f"\n📝 본문 미리보기 (처음 200자):")
            print(f"  {post.content[:200]}...")
        else:
            print(f"\n⚠️  본문이 비어있습니다!")

        # 댓글 확인
        if post.comments:
            print(f"\n💬 댓글 (총 {len(post.comments)}개):")
            for i, comment in enumerate(post.comments[:3], 1):  # 처음 3개만 표시
                print(f"  [{i}] {comment.author}: {comment.content[:50]}...")
            if len(post.comments) > 3:
                print(f"  ... 외 {len(post.comments) - 3}개 댓글")
        else:
            print(f"\n💬 댓글: 없음")

        # 통계
        print(f"\n📊 통계:")
        content_lengths = [len(p.content) for p in posts]
        avg_length = sum(content_lengths) / len(content_lengths) if content_lengths else 0
        empty_count = sum(1 for p in posts if not p.content)
        total_comments = sum(len(p.comments) if p.comments else 0 for p in posts)
        posts_with_comments = sum(1 for p in posts if p.comments and len(p.comments) > 0)

        print(f"  - 평균 본문 길이: {avg_length:.0f}자")
        print(f"  - 본문 없는 게시글: {empty_count}개")
        print(f"  - 본문 있는 게시글: {len(posts) - empty_count}개")
        print(f"  - 총 댓글 수: {total_comments}개")
        print(f"  - 댓글 있는 게시글: {posts_with_comments}개")

        if config.dcinside.fetch_full_content and empty_count > 0:
            print(f"\n⚠️  주의: fetch_full_content=True인데 본문이 비어있는 게시글이 있습니다!")

        return True
    else:
        print("❌ 크롤링된 게시글이 없습니다.")
        return False


async def main():
    """메인 테스트"""
    try:
        # 디시인사이드 테스트
        success = await test_dcinside()

        if success:
            print(f"\n{'='*60}")
            print("✅ 크롤링 테스트 성공!")
            print(f"{'='*60}\n")
            sys.exit(0)
        else:
            print(f"\n{'='*60}")
            print("❌ 크롤링 테스트 실패!")
            print(f"{'='*60}\n")
            sys.exit(1)

    except Exception as e:
        print(f"\n❌ 에러 발생: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
