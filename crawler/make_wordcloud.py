"""
MongoDB 데이터 전처리 + 워드클라우드 생성
한글 형태소 분석 (KoNLPy) + 워드클라우드 시각화
"""

import asyncio
import re
from collections import Counter
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Windows에서 asyncio 이벤트 루프 정책 설정
import sys
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())


async def make_wordcloud():
    """MongoDB → 전처리 → 워드클라우드"""

    print("🎨 워드클라우드 생성 시작\n")

    # 1. MongoDB 연결
    mongodb_url = os.getenv(
        "MONGODB_URL",
        "mongodb://admin:password123@mongodb:27017/dnf_insight?authSource=admin"
    )

    print("📡 MongoDB 연결 중...")
    try:
        client = AsyncIOMotorClient(mongodb_url)
        db = client.dnf_insight
        await client.admin.command('ping')
        print("✅ MongoDB 연결 성공\n")
    except Exception as e:
        print(f"❌ MongoDB 연결 실패: {e}")
        return

    # 2. 데이터 가져오기
    print("📥 데이터 로딩 중...")
    collection = db.community_posts

    posts = await collection.find({}).to_list(None)
    print(f"✅ {len(posts)}개 게시글 로드\n")

    if not posts:
        print("❌ 데이터가 없습니다. 먼저 크롤링을 실행하세요.")
        return

    # 3. 텍스트 추출
    print("📝 텍스트 추출 중...")
    all_text = []

    for post in posts:
        # 제목 + 본문
        all_text.append(post.get('title', ''))
        all_text.append(post.get('content', ''))

        # 댓글 전문
        for comment in post.get('comments', []):
            all_text.append(comment.get('content', ''))

    combined_text = ' '.join(all_text)
    print(f"✅ 총 {len(combined_text):,}자 추출\n")

    # 4. 전처리
    print("🧹 텍스트 전처리 중...")

    # 4-1. URL 제거
    combined_text = re.sub(r'http[s]?://\S+', '', combined_text)

    # 4-2. 이메일 제거
    combined_text = re.sub(r'\S+@\S+', '', combined_text)

    # 4-3. 특수문자 제거 (한글, 영문, 숫자만 남김)
    combined_text = re.sub(r'[^가-힣a-zA-Z0-9\s]', ' ', combined_text)

    # 4-4. 공백 정규화
    combined_text = re.sub(r'\s+', ' ', combined_text).strip()

    print(f"✅ 전처리 완료: {len(combined_text):,}자\n")

    # 5. 한글 형태소 분석 (KoNLPy)
    print("🔍 한글 형태소 분석 중...")
    print("   (Okt 로딩... 시간이 걸릴 수 있습니다)")

    try:
        from konlpy.tag import Okt
        okt = Okt()

        # 명사만 추출
        print("   명사 추출 중...")
        nouns = okt.nouns(combined_text)
        print(f"✅ {len(nouns):,}개 명사 추출\n")

    except ImportError:
        print("⚠️  KoNLPy 미설치, 단순 공백 분리로 대체")
        nouns = combined_text.split()
    except Exception as e:
        print(f"⚠️  형태소 분석 실패: {e}")
        print("   단순 공백 분리로 대체")
        nouns = combined_text.split()

    # 6. 불용어 제거 + 필터링
    print("🗑️  불용어 제거 중...")

    stopwords = {
        # 일반 불용어
        '의', '가', '이', '은', '들', '는', '좀', '잘', '걍', '과', '도', '를', '으로', '자', '에', '와', '한', '하다',
        # 커뮤니티 불용어
        'ㅋ', 'ㅋㅋ', 'ㅋㅋㅋ', 'ㅎ', 'ㅎㅎ', 'ㄱ', 'ㄴ', 'ㄷ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ',
        # 숫자
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        # 짧은 단어
        ,'새끼','개새끼','시발','씨발','병신','ㅅㅂ','ㅂㅅ','ㅄ','ㅉㅉ','ㅉ','ㄹㅇ','존나','존내','좆같','좆같이','좆같은'
    }

    # 필터링: 2글자 이상 + 불용어 아님
    filtered_nouns = [
        word for word in nouns
        if len(word) >= 2 and word not in stopwords
    ]

    print(f"✅ {len(filtered_nouns):,}개 단어 남음\n")

    # 7. 빈도 계산
    print("📊 단어 빈도 계산 중...")
    word_count = Counter(filtered_nouns)
    most_common = word_count.most_common(100)

    print(f"✅ Top 100 단어:\n")
    for i, (word, count) in enumerate(most_common[:20], 1):
        print(f"   {i:2}. {word:10} : {count:5}회")
    print()

    # 8. 워드클라우드 생성
    print("🎨 워드클라우드 생성 중...")

    try:
        from wordcloud import WordCloud
        import matplotlib.pyplot as plt

        # 한글 폰트 경로
        font_paths = [
            '/usr/share/fonts/truetype/nanum/NanumGothic.ttf',  # Linux
            'C:/Windows/Fonts/malgun.ttf',  # Windows
            '/System/Library/Fonts/AppleGothic.ttf',  # Mac
        ]

        font_path = None
        for path in font_paths:
            if os.path.exists(path):
                font_path = path
                break

        if not font_path:
            print("⚠️  한글 폰트를 찾을 수 없습니다. 기본 폰트 사용")
            font_path = None

        # 워드클라우드 생성
        wordcloud = WordCloud(
            font_path=font_path,
            width=1600,
            height=800,
            background_color='white',
            colormap='viridis',
            max_words=100,
            relative_scaling=0.3,
            min_font_size=10
        ).generate_from_frequencies(dict(word_count))

        # 이미지 저장
        plt.figure(figsize=(20, 10))
        plt.imshow(wordcloud, interpolation='bilinear')
        plt.axis('off')
        plt.tight_layout(pad=0)

        output_file = 'wordcloud_arca_dunfa.png'
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        print(f"✅ 워드클라우드 저장: {output_file}\n")

        # 통계 저장
        stats_file = 'wordcloud_stats.txt'
        with open(stats_file, 'w', encoding='utf-8') as f:
            f.write(f"아카라이브 던파 채널 워드클라우드 통계\n")
            f.write(f"{'='*60}\n\n")
            f.write(f"분석 대상:\n")
            f.write(f"  - 게시글 수: {len(posts)}개\n")
            f.write(f"  - 전체 텍스트: {len(combined_text):,}자\n")
            f.write(f"  - 추출 명사: {len(nouns):,}개\n")
            f.write(f"  - 필터링 후: {len(filtered_nouns):,}개\n\n")
            f.write(f"Top 100 단어:\n")
            f.write(f"{'='*60}\n\n")
            for i, (word, count) in enumerate(most_common, 1):
                f.write(f"{i:3}. {word:15} : {count:6}회\n")

        print(f"✅ 통계 저장: {stats_file}\n")

    except ImportError as e:
        print(f"⚠️  워드클라우드 라이브러리 미설치: {e}")
        print("   pip install wordcloud matplotlib 실행 필요")

        # 텍스트 파일로라도 저장
        output_file = 'wordcloud_data.txt'
        with open(output_file, 'w', encoding='utf-8') as f:
            for word, count in most_common:
                f.write(f"{word}\t{count}\n")
        print(f"✅ 단어 빈도 데이터 저장: {output_file}\n")

    except Exception as e:
        print(f"❌ 워드클라우드 생성 실패: {e}")

    client.close()

    print(f"{'='*60}")
    print("✅ 모든 작업 완료")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    asyncio.run(make_wordcloud())
