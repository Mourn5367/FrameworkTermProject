"""
워드클라우드 생성 서비스
Korean NLP + WordCloud 이미지 생성
"""

from konlpy.tag import Okt
from wordcloud import WordCloud
from collections import Counter
from datetime import datetime, timedelta, timezone
import base64
import io
import numpy as np
from PIL import Image
from typing import Optional, Dict, List, Tuple
from app.database import get_database
from app.config.crawler_config import config

# 한국 시간대 (KST)
KST = timezone(timedelta(hours=9))


class WordcloudService:
    """워드클라우드 생성 및 관리 서비스"""

    def __init__(self):
        self.okt = Okt()
        # 불용어 (제외할 단어)
        self.stopwords = {
            # 이모티콘
            "ㅋㅋㅋ", "ㅋㅋ", "ㄷㄷ", "ㅇㅇ", "ㄱㅇㄷ", "ㄴㄴ",
            # 던파 관련 (너무 흔한 단어)
            "던파", "디레지",
            # 일반 조사/동사
            "하다", "되다", "있다", "없다", "이다", "같다", "하는", "되는",
            "것", "거", "게", "그냥", "진짜", "좀", "뭐", "왜", "또",
            "때", "수", "등", "및", "위", "내", "중", "전", "후", "이제","거임","된거", "건가","로기",
            # 비속어
            "씨발","시발", "좆같", "개새끼", "병신", "미친", "엿같", "씹", "새끼",
            "ㅅㅂ", "ㅉㅉ", "ㅂㅅ", "지랄", "존나",
        }

        # 형태소 분석에서 보존할 단어 (조사 포함)
        # 이 단어들은 형태소 분석 전에 플레이스홀더로 치환 후, 분석 후 복원됨
        self.preserve_words = [
            "디레지에", "그로기", "종민", "중천", "디거시",
            # 여기에 보존하고 싶은 단어 추가 (예: "이스핀에", "바칼에" 등)
        ]

        # 폰트 경로 (DNF Forged Blade)
        self.font_path = "resource/DNFForgedBlade-Bold.ttf"

        # 마스크 이미지 경로 (디레지에)
        self.mask_image_path = "resource/dire.png"

        # 설정 로드
        self.settings = config.wordcloud

    def _load_mask_image(self):
        """마스크 이미지 로드 및 전처리 (참고 코드 방식 적용)"""
        try:
            # RGBA로 변환하여 알파 채널 확보
            mask_img = Image.open(self.mask_image_path).convert("RGBA")
            mask_array = np.array(mask_img)

            # wordcloud는 마스크의 '흰색' 영역에 단어를 그립니다.
            # 투명한 영역(alpha == 0)을 단어가 그려질 흰색(255)으로 만듭니다.
            transformed_mask = np.where(mask_array[:, :, 3] == 0, 255, 0).astype(np.uint8)

            # 알파 채널 방식이 실패한 경우 (투명도 없는 이미지)
            if np.all(transformed_mask):
                print("  ℹ️  알파 채널 없음, 그레이스케일 기반 마스크 변환...")
                # JPEG 등 투명도 없는 이미지 대비 (흰색 배경에 검은 도형)
                mask_img_L = Image.open(self.mask_image_path).convert("L")
                mask_array_L = np.array(mask_img_L)
                # 이미지의 밝은 영역(>250)을 단어가 그려질 흰색(255)으로
                transformed_mask = np.where(mask_array_L > 250, 255, 0).astype(np.uint8)

            # 최종 마스크 검증
            if np.sum(transformed_mask) == 0:
                print("  ⚠️  마스크 변환 실패: 유효한 영역이 없습니다.")
                return None

            return transformed_mask
        except Exception as e:
            print(f"  ⚠️  마스크 이미지 로드 실패: {e}")
            return None

    def _purple_color_func(self, word, font_size, position, orientation, random_state=None, **kwargs):
        """보라색 계열 색상 함수"""
        import random
        # 보라색 계열 RGB 범위
        colors = [
            (138, 43, 226),   # BlueViolet
            (148, 0, 211),    # DarkViolet
            (153, 50, 204),   # DarkOrchid
            (186, 85, 211),   # MediumOrchid
            (147, 112, 219),  # MediumPurple
            (123, 104, 238),  # MediumSlateBlue
            (106, 90, 205),   # SlateBlue
            (128, 0, 128),    # Purple
            (75, 0, 130),     # Indigo
        ]
        color = random.choice(colors)
        return f"rgb({color[0]}, {color[1]}, {color[2]})"

    async def generate_wordcloud_by_session(
        self,
        session_id: str,
        board_name: str = None,
        width: int = None,
        height: int = None
    ) -> Optional[Dict]:
        """
        특정 크롤링 세션의 워드클라우드 생성

        Args:
            session_id: 크롤링 세션 ID (예: "20251202_140000")
            board_name: 게시판 이름 필터 (Optional, 예: "디시인사이드 dfip")
            width: 이미지 너비 (기본값: config.wordcloud.width)
            height: 이미지 높이 (기본값: config.wordcloud.height)

        Returns:
            워드클라우드 데이터 또는 None
        """
        width = width or self.settings.width
        height = height or self.settings.height

        # 1. MongoDB에서 세션 ID로 게시글 조회
        db = get_database()
        collection = db["community_posts"]

        query = {"crawl_session_id": session_id}
        if board_name:
            query["board_name"] = {"$regex": board_name, "$options": "i"}

        cursor = collection.find(query)
        posts = await cursor.to_list(None)

        if not posts:
            print(f"  ⚠️  세션 {session_id}: 데이터 없음")
            return None

        print(f"  📊 세션 {session_id}: {len(posts)}개 게시글")

        # 2. 텍스트 추출 (제목 + 본문 + 댓글)
        texts = []
        for post in posts:
            title = post.get("title", "")
            content = post.get("content", "")
            texts.append(f"{title} {content}")

            # 댓글도 포함
            comments = post.get("comments", [])
            for comment in comments:
                comment_text = comment.get("content", "")
                texts.append(comment_text)

        full_text = " ".join(texts)

        # 3. Korean NLP - 명사 추출
        print(f"  🔍 형태소 분석 중... (텍스트 길이: {len(full_text)}자)")
        words = self.okt.nouns(full_text)

        # 4. 불용어 제거 및 필터링
        words = [
            w for w in words
            if w not in self.stopwords
            and len(w) > 1
            and not w.isdigit()
        ]

        # 5. 보존 단어를 별도로 카운트하여 추가
        preserve_counts = {}
        for preserve_word in self.preserve_words:
            count = full_text.count(preserve_word)
            if count > 0:
                preserve_counts[preserve_word] = count
                print(f"  📌 보존 단어 '{preserve_word}': {count}회")

        # 보존 단어를 words 리스트에 추가 (빈도만큼)
        for preserve_word, count in preserve_counts.items():
            words.extend([preserve_word] * count)

        if not words:
            print(f"  ⚠️  세션 {session_id}: 유효한 단어 없음")
            return None

        # 5. 단어 빈도 계산
        word_freq = Counter(words)
        top_words = word_freq.most_common(self.settings.max_words)

        print(f"  ✅ Top 20 단어: {top_words[:20]}")

        # 6. 마스크 이미지 로드
        mask = self._load_mask_image()

        # 7. 워드클라우드 생성
        print(f"  🎨 워드클라우드 이미지 생성 중... ({width}x{height})")
        wc = WordCloud(
            font_path=self.font_path,
            width=width,
            height=height,
            background_color="white",
            max_words=self.settings.max_words,
            relative_scaling=0.3,
            mask=mask,
            contour_width=8,
            contour_color='#6b3087',  # 보라색 테두리
            prefer_horizontal=0.7,
            min_font_size=12,
            colormap=None  # 커스텀 색상 함수 사용
        ).generate_from_frequencies(dict(word_freq))

        # 보라색 계열 색상 적용
        wc.recolor(color_func=self._purple_color_func)

        # 8. PNG로 변환 후 Base64 인코딩
        img_buffer = io.BytesIO()
        wc.to_image().save(img_buffer, format="PNG")
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()

        print(f"  ✅ 워드클라우드 생성 완료 (Base64: {len(img_base64)}자)")

        # 현재 한국 시간 (timezone 정보 제거하여 naive datetime으로 저장)
        # Motor는 timezone-aware datetime을 UTC로 변환하므로, naive datetime 사용
        kst_now = datetime.now(KST).replace(tzinfo=None)
        print(f"  🕒 생성 시간 (KST): {kst_now.strftime('%Y-%m-%d %H:%M:%S')}")

        return {
            "image": img_base64,
            "top_words": top_words[:20],
            "total_posts": len(posts),
            "session_id": session_id,
            "generated_at": kst_now  # naive datetime (KST 시간 그대로)
        }

    async def save_wordcloud_to_db(self, board_id: str, wordcloud_data: Dict):
        """워드클라우드 데이터를 MongoDB에 저장"""
        db = get_database()
        collection = db["wordclouds"]

        await collection.update_one(
            {"board_id": board_id},
            {"$set": {
                "board_id": board_id,
                "image_base64": wordcloud_data["image"],
                "top_words": wordcloud_data["top_words"],
                "total_posts": wordcloud_data["total_posts"],
                "generated_at": wordcloud_data["generated_at"]
            }},
            upsert=True
        )

        print(f"  💾 MongoDB 저장 완료: board_id={board_id}")

    async def get_wordcloud_from_db(self, board_id: str) -> Optional[Dict]:
        """MongoDB에서 워드클라우드 조회"""
        db = get_database()
        collection = db["wordclouds"]

        wc_data = await collection.find_one({"board_id": board_id})

        if not wc_data:
            return None

        # MongoDB _id 제거
        wc_data.pop("_id", None)

        return wc_data
