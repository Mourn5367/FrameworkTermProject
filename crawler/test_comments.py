"""
특정 게시글의 댓글 크롤링 테스트
"""

import asyncio
import sys
from app.services.dcinside_crawler import DCInsideCrawler


async def test_single_post():
    """특정 게시글의 댓글 테스트"""
    post_url = "https://gall.dcinside.com/mgallery/board/view/?id=dfip&no=3603728&page=1"

    print("\n" + "="*60)
    print("📌 댓글 크롤링 테스트")
    print("="*60)
    print(f"URL: {post_url}\n")

    crawler = DCInsideCrawler()

    # 본문 + 댓글 크롤링
    content, comments = await crawler.crawl_post_detail(post_url)

    print(f"📄 본문 길이: {len(content)}자")
    if content:
        print(f"본문 미리보기: {content[:200]}...\n")

    print(f"💬 댓글 수: {len(comments)}개\n")

    if comments:
        print("="*60)
        print("댓글 목록:")
        print("="*60)
        for i, comment in enumerate(comments, 1):
            depth_mark = "  " * comment.depth + "└─" if comment.depth > 0 else ""
            print(f"\n[{i}] {depth_mark} {comment.author}")
            print(f"    ID: {comment.comment_id}")
            print(f"    깊이: {comment.depth}")
            print(f"    작성일: {comment.posted_at}")
            print(f"    내용: {comment.content[:100]}...")

        print("\n" + "="*60)
        print(f"✅ 댓글 크롤링 성공: {len(comments)}개")
        print("="*60)
    else:
        print("⚠️  댓글이 없거나 파싱에 실패했습니다.")
        print("\n디버깅을 위해 HTML 구조를 확인해보겠습니다...")

        # 디버깅: HTML 구조 확인
        import httpx
        from bs4 import BeautifulSoup

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(post_url, headers=crawler.headers)
            soup = BeautifulSoup(response.text, "lxml")

            # 댓글 영역 찾기
            comment_wrap = soup.select_one(".comment_wrap")
            if comment_wrap:
                print("\n✓ .comment_wrap 발견")
                cmt_list = comment_wrap.select(".cmt_list li")
                print(f"✓ .cmt_list li 개수: {len(cmt_list)}")

                if cmt_list:
                    print("\n첫 번째 댓글 요소:")
                    print(cmt_list[0].prettify()[:500])
            else:
                print("\n❌ .comment_wrap을 찾을 수 없습니다.")


if __name__ == "__main__":
    asyncio.run(test_single_post())
