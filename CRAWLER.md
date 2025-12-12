# CRAWLER.md

던파 인사이트(DnF Insight) - 커뮤니티 크롤러 시스템 가이드

---

## 1. Crawler 폴더 개요

```
crawler/
├── app/
│   ├── api/
│   │   └── routes.py                       # FastAPI 라우터 (엔드포인트 정의)
│   ├── config/
│   │   └── crawler_config.py               # ⭐ 중앙 설정 관리
│   ├── models/
│   │   ├── post.py                         # 게시글 데이터 모델 (CommunityPost)
│   │   └── info_post.py                    # 정보글 데이터 모델 (InfoPost)
│   ├── services/
│   │   ├── dcinside_crawler.py             # 디시인사이드 크롤러 (Beautiful Soup)
│   │   ├── arca_crawler_playwright.py      # 아카라이브 크롤러 (Playwright) ⭐
│   │   ├── info_post_crawler.py            # 📚정보 플레어 게시글 전문 크롤러
│   │   ├── info_post_service.py            # Vector DB 임베딩 통합 서비스
│   │   ├── vector_db_service.py            # ⭐ ChromaDB + 한국어 임베딩
│   │   ├── llm_service.py                  # ⭐ Ollama LLM + Function Calling
│   │   ├── chat_service.py                 # Redis 기반 채팅 히스토리 관리
│   │   ├── wordcloud_service.py            # 워드클라우드 생성 (KoNLPy + WordCloud)
│   │   └── scheduler.py                    # ⭐ APScheduler 기반 주기적 크롤링
│   ├── database.py                         # MongoDB 연결
│   ├── mysql_db.py                         # MySQL 연결 (채팅 히스토리용)
│   └── settings.py                         # 환경 변수 로딩
├── chroma_db/                              # ChromaDB 영구 저장 디렉토리 (Vector DB)
├── main.py                                 # FastAPI 애플리케이션 진입점
├── make_wordcloud.py                       # 워드클라우드 생성 스크립트 (수동 실행)
├── crawl_500_posts.py                      # 대량 크롤링 스크립트 (500개 게시글)
├── test_*.py                               # 테스트 스크립트 모음
├── Dockerfile                              # Docker 이미지 정의 (Java + Playwright 포함)
└── requirements.txt                        # Python 의존성 패키지
```

**핵심 특징:**
- **중앙 집중식 설정**: `crawler_config.py`에서 모든 크롤링 주기, Rate Limiting, 하이퍼파라미터 관리
- **비동기 처리**: FastAPI + asyncio로 고속 병렬 크롤링
- **자동화**: APScheduler로 주기적 크롤링 (기본: 5분마다)
- **데이터 저장**: MongoDB (원본 데이터) + ChromaDB (Vector 임베딩)
- **LLM RAG**: Ollama + Function Calling + Vector DB 검색

---

## 2. 워드클라우드 시스템

### 2.1 워드클라우드란?

텍스트 데이터에서 자주 등장하는 단어를 시각화하는 기법. 단어의 빈도에 따라 크기와 색상이 달라지며, 커뮤니티의 주요 관심사를 한눈에 파악할 수 있습니다.

### 2.2 워드클라우드 작동 방식

**전체 파이프라인:**

```
MongoDB 원본 데이터
    ↓
텍스트 추출 (제목 + 본문 + 댓글)
    ↓
전처리 (URL, 이메일, 특수문자 제거)
    ↓
한글 형태소 분석 (KoNLPy Okt)
    ↓
명사 추출
    ↓
불용어 제거 (조사, 의성어, 욕설 등)
    ↓
빈도 계산 (Counter)
    ↓
워드클라우드 생성 (WordCloud 라이브러리)
    ↓
이미지 저장 (Base64 인코딩 → MongoDB 저장)
```

**단계별 상세 설명:**

1. **데이터 로드**: MongoDB `community_posts` 컬렉션에서 최근 1시간 데이터 조회
2. **텍스트 추출**: 제목, 본문, 댓글을 하나의 문자열로 결합
3. **전처리**:
   - URL 제거: `http[s]?://\S+` 정규식 제거
   - 이메일 제거: `\S+@\S+` 정규식 제거
   - 특수문자 제거: 한글, 영문, 숫자만 남김
   - 공백 정규화: 연속된 공백을 하나로
4. **형태소 분석**: KoNLPy Okt로 명사 추출 (예: "던파는 재밌다" → ["던파", "재밌다"])
5. **불용어 제거**:
   - 조사: "의", "가", "은", "는" 등
   - 의성어: "ㅋㅋㅋ", "ㅎㅎ", "ㄱ", "ㄴ" 등
   - 욕설: "새끼", "병신", "시발" 등 (불건전 단어 필터링)
   - 길이 필터: 2글자 미만 제거
6. **빈도 계산**: `Counter`로 Top 100 단어 추출
7. **이미지 생성**:
   - WordCloud 라이브러리로 1200x600px 이미지 생성
   - 한글 폰트: NanumGothic.ttf (Linux 기본)
   - Colormap: `viridis` (초록-청록-노랑 그라데이션)
8. **저장**:
   - PNG 이미지 → Base64 인코딩
   - MongoDB `wordclouds` 컬렉션에 저장
   - 메타데이터: `top_words`, `total_posts`, `generated_at` 포함

**자동 생성:**
- 5분마다 크롤링 완료 후 자동으로 3개 워드클라우드 생성:
  1. 디시인사이드 던파IP 갤러리 (`session_{timestamp}_dfip`)
  2. 아카라이브 던파 채널 (`session_{timestamp}_dunfa`)
  3. 통합 워드클라우드 (`session_{timestamp}_combined`)

**수동 생성:**
```bash
# Docker로 수동 실행
docker-compose run --rm crawler python make_wordcloud.py

# API 엔드포인트로 생성
curl -X POST "http://localhost:8000/api/wordcloud/generate?board_id=dfip"
```

---

## 3. LLM 서비스 (RAG 질의응답)

### 3.1 LLM이란?

Large Language Model (대형 언어 모델). 사용자의 질문을 이해하고 자연어로 답변을 생성하는 AI 시스템.

**현재 사용 모델:**
- **Ollama qwen3:4b**: 40억 파라미터 경량 모델
- 로컬 실행 (Docker 컨테이너 `ollama:11434`)
- Function Calling 지원 (도구 사용 가능)

### 3.2 LLM 작동 방식 (Flow 차트 대신 글 설명)

**전체 워크플로우:**

```
사용자 질문 입력
    ↓
LLM에게 질문 전달 (시스템 프롬프트 포함)
    ↓
LLM이 도구 사용 결정 (Function Calling)
    ↓
    ├─→ [도구 X] LLM이 직접 답변 생성 → 종료
    └─→ [도구 O] search_community_posts 실행
            ↓
        Vector DB 검색 (ChromaDB)
            ↓
        관련 게시글 5개 반환
            ↓
        검색 결과를 LLM에 전달
            ↓
        LLM이 검색 결과 기반 답변 생성
            ↓
        답변 + 출처 URL 반환
```

**단계별 상세 설명:**

1. **사용자 질문 수신**:
   - 예: "디레지에 빌드가 뭐 있지?"
   - 프론트엔드 `/api/chat` POST 요청

2. **시스템 프롬프트 구성**:
   ```python
   {
       "role": "system",
       "content": """당신은 던파(던전앤파이터) 전문 AI 어시스턴트입니다.

       사용 가능한 도구:
       - search_community_posts: 커뮤니티에서 크롤링한 게시글 검색

       중요:
       - 검색된 게시글의 내용을 요약해서 답변
       - 답변 마지막에 반드시 출처 URL을 표기
       - 답변은 반드시 한국어로, 친절하고 자세하게 작성
       """
   }
   ```

3. **Ollama API 호출** (`llm_service.py:127-183`):
   - URL: `http://ollama:11434/api/chat`
   - 요청 파라미터:
     - `model`: "qwen3:4b"
     - `messages`: 시스템 프롬프트 + 채팅 히스토리 + 현재 질문
     - `tools`: `TOOLS_DEFINITION` (사용 가능한 도구 목록)
     - `options`:
       - `num_predict`: 2048 (최대 생성 토큰 수)
       - `temperature`: 0.7 (창의성 수준)

4. **LLM 응답 분석**:
   - LLM이 `tool_calls` 포함 시 → 도구 실행 필요
   - LLM이 `content`만 반환 시 → 최종 답변 생성 완료

5. **Function Calling 실행** (도구 사용):
   - 도구명: `search_community_posts`
   - 인자 예시:
     ```json
     {
         "query": "디레지에 빌드",
         "top_k": 5
     }
     ```

6. **Vector DB 검색** (`vector_db_service.py:123-189`):
   - **임베딩 모델**: `jhgan/ko-sroberta-multitask` (한국어 전문 768차원)
   - **검색 방식**:
     1. 사용자 질문을 벡터로 변환 (임베딩)
     2. ChromaDB에서 유사도 기반 검색 (L2 distance)
     3. 추천수 가중치 적용:
        - 추천수 0 → 가중치 1.0
        - 추천수 10 → 가중치 1.2
        - 추천수 100 → 가중치 1.4
        - 추천수 1000 → 가중치 1.6
     4. 점수 = 유사도 × 추천수 가중치
     5. 점수 기준 상위 5개 반환

7. **검색 결과 포맷팅** (`tools.py:50-61`):
   ```python
   {
       "success": True,
       "posts": [
           {
               "title": "디레지에 딜러 빌드 완전 정복",
               "content": "1. 세트: 혼돈의 찬가...",
               "url": "https://gall.dcinside.com/...",
               "similarity": 0.892
           }
       ],
       "instruction": "답변 마지막에 반드시 출처 URL을 표기해주세요."
   }
   ```

8. **LLM에게 검색 결과 전달**:
   - 역할: `"tool"` (도구 실행 결과)
   - 내용: JSON 형식 검색 결과

9. **LLM 최종 답변 생성**:
   - 검색된 게시글 내용 요약
   - 마크다운 형식으로 답변 작성
   - 마지막에 출처 URL 포함
   - 예시 답변:
     ```markdown
     디레지에 딜러 빌드는 크게 3가지가 있습니다:

     1. **혼돈의 찬가 세트**: 광역 딜링에 특화
        - 무기: 흑요석
        - 융합석: 혼돈 + 공격력

     2. **군신의 무기고 세트**: 단일 딜링에 강력
        - 무기: 명품 룩샤나
        - 융합석: 크리티컬 + 공격력

     출처:
     - https://gall.dcinside.com/mgallery/board/view/?id=dfip&no=123456
     - https://arca.live/b/dunfa/123456
     ```

10. **채팅 히스토리 저장** (Redis):
    - 세션 ID 기반 (예: `session_20250113_143025`)
    - TTL: 1시간 (Redis 자동 만료)
    - 구조:
      ```json
      {
          "session_id": "user_123",
          "messages": [
              {"role": "user", "content": "디레지에 빌드가 뭐 있지?"},
              {"role": "assistant", "content": "디레지에 딜러 빌드는..."}
          ]
      }
      ```

11. **프론트엔드 응답**:
    - ReactMarkdown으로 마크다운 렌더링
    - 링크, 강조 표시, 리스트 자동 포맷팅

**최대 반복 제한:**
- Function Calling 최대 5회 (무한 루프 방지)
- 5회 초과 시 오류 메시지 반환

---

## 4. 크롤러 작동 방식

### 4.1 디시인사이드 크롤러 (Beautiful Soup)

**특징:**
- HTTP 기반, 빠르고 안정적
- JavaScript 렌더링 불필요
- 성공률: 100%

**작동 방식:**

1. **목록 페이지 크롤링**:
   - URL: `https://gall.dcinside.com/mgallery/board/lists?id=dfip&page={page}`
   - HTML 파싱: `<tr class="ub-content">` 선택
   - 추출 정보:
     - 제목: `.gall_tit a`
     - 작성자: `.gall_writer[data-nick]`
     - 날짜: `.gall_date`
     - 조회수: `.gall_count`
     - 댓글 수: `.reply_num`

2. **시간 필터링**:
   - 최근 1시간 게시글만 수집 (설정 가능)
   - 1시간 전 게시글 발견 시 크롤링 중단

3. **본문 크롤링**:
   - URL: `https://gall.dcinside.com/mgallery/board/view/?id=dfip&no={post_no}`
   - HTML 파싱: `.write_div` 선택
   - 텍스트 추출: `get_text(separator="\n", strip=True)`

4. **병렬 처리**:
   - 페이지 목록: 5페이지씩 병렬 크롤링
   - 본문 수집: 20개씩 병렬 크롤링
   - asyncio.gather()로 동시 실행

5. **MongoDB 저장**:
   - 컬렉션: `community_posts`
   - URL 기반 Upsert (중복 방지)

**코드 예시:**
```python
# 디시인사이드 크롤러 (dcinside_crawler.py:24-95)
async def crawl_gallery(self, gallery_id="dfip", max_pages=3, hours_ago=1):
    cutoff_time = now - timedelta(hours=hours_ago)

    # 1단계: 목록 병렬 크롤링 (5페이지씩)
    for batch_start in range(1, max_pages + 1, 5):
        pages = list(range(batch_start, min(batch_start + 5, max_pages + 1)))
        tasks = [self._crawl_page(gallery_id, page, session_id) for page in pages]
        results = await asyncio.gather(*tasks)

        # 시간 필터링
        for post in results:
            if post.posted_at >= cutoff_time:
                all_posts.append(post)
            else:
                break  # 1시간 전 게시글 발견 시 중단

    # 2단계: 본문 병렬 수집 (20개씩)
    async with httpx.AsyncClient() as client:
        for batch in chunks(all_posts, 20):
            tasks = [self._fetch_content(client, post.url) for post in batch]
            await asyncio.gather(*tasks)
```

---

### 4.2 아카라이브 크롤러 (Playwright)

**특징:**
- JavaScript 렌더링 필요 (Cloudflare 우회)
- Headless Chrome 브라우저 사용
- 성공률: 95%+

**작동 방식:**

1. **Playwright 브라우저 시작**:
   ```python
   playwright = await async_playwright().start()
   browser = await playwright.chromium.launch(
       headless=True,
       args=['--disable-blink-features=AutomationControlled']
   )
   ```

2. **목록 페이지 크롤링**:
   - URL: `https://arca.live/b/dunfa?p={page}`
   - DOM 대기: `.list-area` 요소 visible 상태까지 기다림 (최대 10초)
   - Cloudflare 우회: 2초 대기 (필요 시)
   - HTML 가져오기: `playwright_page.content()`
   - Beautiful Soup로 파싱: `.vrow` 선택

3. **선택적 크롤링 (성능 최적화)**:
   - 전체 페이지 대신 `.list-area` 영역만 크롤링
   - 불필요한 광고, 헤더, 푸터 제외

4. **본문 크롤링**:
   - URL: `https://arca.live/b/dunfa/{post_id}`
   - DOM 대기: `.article-body` 요소 visible 상태
   - 본문 텍스트만 추출: `content_elem.get_text(separator="\n", strip=True)`
   - 댓글 수집 안함 (성능 고려)

5. **재시도 로직**:
   - 실패 시 최대 3회 재시도
   - 3초 대기 후 재시도

**코드 예시:**
```python
# 아카라이브 크롤러 (arca_crawler_playwright.py:108-176)
async def _crawl_page(self, context, board_id, page, session_id, retry_count=0):
    url = f"{self.base_url}/b/{board_id}?p={page}"
    playwright_page = await context.new_page()

    try:
        # 페이지 이동
        await playwright_page.goto(url, wait_until="domcontentloaded", timeout=20000)

        # Cloudflare 우회
        if self.use_cloudflare_bypass:
            await asyncio.sleep(2)

        # .list-area 로딩 대기
        await playwright_page.wait_for_selector(".list-area", timeout=10000, state="visible")

        # HTML 가져오기 → Beautiful Soup 파싱
        html = await playwright_page.content()
        soup = BeautifulSoup(html, "lxml")
        posts = self._parse_post_list(soup, board_id, session_id)

        return posts

    except Exception as e:
        # 재시도 로직
        if retry_count < 3:
            await asyncio.sleep(3)
            return await self._crawl_page(context, board_id, page, session_id, retry_count + 1)
        return []
```

---

### 4.3 자동 스케줄링 (APScheduler)

**작동 방식:**

1. **FastAPI 애플리케이션 시작 시**:
   - `main.py` lifespan 이벤트에서 `start_scheduler()` 호출

2. **스케줄러 등록** (`scheduler.py:166-198`):
   ```python
   scheduler.add_job(
       crawl_job,  # 실행할 함수
       trigger=IntervalTrigger(minutes=5, timezone='Asia/Seoul'),
       id="community_crawl_job",
       replace_existing=True
   )
   ```

3. **5분마다 크롤링 작업 실행**:
   - 한국 시간(KST) 기준 세션 ID 생성: `20250113_143025`
   - 디시인사이드 + 아카라이브 병렬 크롤링
   - MongoDB 저장 (URL 기반 upsert)
   - 워드클라우드 3개 생성 (dfip, dunfa, combined)

4. **설정 변경**:
   - `crawler/app/config/crawler_config.py` 수정:
     ```python
     scheduler = SchedulerSettings(
         enabled=True,
         interval_minutes=60,  # ⭐ 여기를 변경하면 주기 조절
         run_on_startup=True   # ⭐ 시작 시 즉시 실행 여부
     )
     ```

5. **재시작 후 적용**:
   ```bash
   docker-compose restart crawler
   ```

---

## 5. 사용한 주요 프레임워크

### 5.1 Python 웹 프레임워크

**FastAPI (비동기 웹 프레임워크)**
- 버전: 0.115+
- 역할: REST API 엔드포인트 제공
- 특징:
  - 자동 API 문서 생성 (`/docs`)
  - Pydantic 기반 자동 데이터 검증
  - asyncio 네이티브 지원 (고속 비동기 처리)
- 주요 엔드포인트:
  - `POST /api/chat`: 채팅 (세션 기반)
  - `POST /api/crawl/trigger`: 수동 크롤링 트리거
  - `GET /api/wordcloud/{board_id}`: 워드클라우드 이미지 조회

**Pydantic (데이터 검증 라이브러리)**
- 버전: 2.10+
- 역할: API 요청/응답 검증, 데이터 모델 정의
- 예시:
  ```python
  class ChatRequest(BaseModel):
      session_id: str  # 필수
      query: str       # 필수
  ```

---

### 5.2 크롤링 프레임워크

**Playwright (브라우저 자동화)**
- 버전: 1.50+
- 역할: JavaScript 렌더링 필요한 사이트 크롤링 (아카라이브)
- 특징:
  - Headless Chrome 브라우저 제어
  - Cloudflare 우회 가능
  - 비동기 API 제공 (`async_playwright`)
- 설치:
  ```bash
  pip install playwright
  playwright install chromium
  ```

**httpx (비동기 HTTP 클라이언트)**
- 버전: 0.28+
- 역할: HTTP 요청 (디시인사이드, Ollama API 호출)
- 특징:
  - asyncio 네이티브 지원
  - Connection Pooling (성능 최적화)
- 예시:
  ```python
  async with httpx.AsyncClient() as client:
      response = await client.get(url, headers=headers)
  ```

**Beautiful Soup 4 (HTML 파싱)**
- 버전: 4.12+
- 역할: HTML → 구조화된 데이터 변환
- 파서: lxml (가장 빠름)
- 예시:
  ```python
  soup = BeautifulSoup(html, "lxml")
  title = soup.select_one(".gall_tit a").get_text(strip=True)
  ```

---

### 5.3 데이터베이스

**MongoDB (NoSQL 문서 DB)**
- 버전: 7.0
- 역할: 원본 크롤링 데이터 저장
- 드라이버: Motor (비동기 MongoDB 드라이버)
- 컬렉션:
  - `community_posts`: 크롤링된 게시글
  - `info_posts`: 📚정보 플레어 게시글
  - `wordclouds`: 워드클라우드 이미지 (Base64)
  - `chat_history`: 채팅 히스토리 (Redis 대체용)

**ChromaDB (Vector DB)**
- 버전: 0.5.23+
- 역할: 텍스트 임베딩 벡터 저장 및 검색
- 특징:
  - 임베딩 자동 관리
  - 메타데이터 필터링 지원
  - 영구 저장 (`/app/chroma_db`)
- 컬렉션: `dnf_info_posts`

**Redis (인메모리 DB)**
- 버전: 7.x
- 역할: 채팅 히스토리 임시 저장
- 특징:
  - TTL 자동 만료 (1시간)
  - JSON 저장 (Redis Stack)
- 키 구조: `chat_history:{session_id}`

---

### 5.4 NLP 및 임베딩

**KoNLPy (한국어 형태소 분석)**
- 버전: 0.6+
- 역할: 한글 텍스트 → 명사 추출
- 형태소 분석기: Okt (Open Korean Text)
- 의존성: JDK 17 (Dockerfile에 포함)
- 예시:
  ```python
  from konlpy.tag import Okt
  okt = Okt()
  nouns = okt.nouns("던파는 재밌는 게임이야")
  # ['던파', '게임']
  ```

**Sentence Transformers (임베딩 모델)**
- 버전: 3.3+
- 역할: 텍스트 → 768차원 벡터 변환
- 모델: `jhgan/ko-sroberta-multitask`
  - 한국어 성능: KLUE-STS 93.5점 (SOTA 수준)
  - 모델 크기: 110MB
  - 추론 속도: RTX 3060 기준 초당 300문장
- 예시:
  ```python
  from sentence_transformers import SentenceTransformer
  model = SentenceTransformer('jhgan/ko-sroberta-multitask')
  embeddings = model.encode(["디레지에 빌드", "크루세이더 공략"])
  # [[0.123, 0.456, ...], [0.789, 0.234, ...]]
  ```

**WordCloud (워드클라우드 생성)**
- 버전: 1.9+
- 역할: 단어 빈도 → 시각화 이미지
- 의존성: matplotlib, pillow
- 폰트: NanumGothic.ttf (한글 지원)

---

### 5.5 LLM 및 RAG

**Ollama (로컬 LLM 서버)**
- 버전: 0.5+
- 역할: LLM 추론 (로컬 실행)
- 모델: qwen3:4b (40억 파라미터)
- API: `http://ollama:11434/api/chat`
- 특징:
  - Function Calling 지원
  - Streaming 응답 지원
  - GPU 가속 (CUDA, ROCm)

**APScheduler (스케줄러)**
- 버전: 3.10+
- 역할: 주기적 크롤링 작업 실행
- 스케줄러 타입: AsyncIOScheduler (비동기)
- Trigger: IntervalTrigger (5분마다)

---

### 5.6 기타 유틸리티

**python-dotenv (환경 변수 관리)**
- 버전: 1.0+
- 역할: `.env` 파일 로딩

**asyncio (비동기 프로그래밍)**
- 파이썬 표준 라이브러리
- 역할: 병렬 크롤링, 비동기 I/O

**dataclasses (데이터 클래스)**
- 파이썬 표준 라이브러리
- 역할: 설정 클래스 정의 (`crawler_config.py`)

---

## 6. 워드클라우드 핵심 코드

### 6.1 전처리 파이프라인 (`make_wordcloud.py:66-103`)

```python
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

# 5. 한글 형태소 분석 (KoNLPy)
from konlpy.tag import Okt
okt = Okt()

# 명사만 추출
nouns = okt.nouns(combined_text)
print(f"✅ {len(nouns):,}개 명사 추출\n")

# 6. 불용어 제거 + 필터링
stopwords = {
    # 일반 불용어
    '의', '가', '이', '은', '들', '는', '좀', '잘', '걍',
    # 커뮤니티 불용어
    'ㅋ', 'ㅋㅋ', 'ㅋㅋㅋ', 'ㅎ', 'ㅎㅎ',
    # 욕설 (불건전 단어 필터링)
    '새끼', '개새끼', '시발', '씨발', '병신',
}

# 필터링: 2글자 이상 + 불용어 아님
filtered_nouns = [
    word for word in nouns
    if len(word) >= 2 and word not in stopwords
]

print(f"✅ {len(filtered_nouns):,}개 단어 남음\n")
```

**핵심 포인트:**
- 정규식으로 불필요한 요소 제거 (URL, 이메일, 특수문자)
- KoNLPy Okt로 명사만 추출 (동사, 형용사 제외)
- 불용어 제거 (조사, 의성어, 욕설 등)
- 2글자 미만 단어 제외 (의미 없는 짧은 단어)

---

### 6.2 빈도 계산 및 워드클라우드 생성 (`make_wordcloud.py:126-180`)

```python
from collections import Counter
from wordcloud import WordCloud
import matplotlib.pyplot as plt

# 7. 빈도 계산
word_count = Counter(filtered_nouns)
most_common = word_count.most_common(100)  # Top 100

print(f"✅ Top 100 단어:\n")
for i, (word, count) in enumerate(most_common[:20], 1):
    print(f"   {i:2}. {word:10} : {count:5}회")

# 8. 워드클라우드 생성
font_path = '/usr/share/fonts/truetype/nanum/NanumGothic.ttf'  # 한글 폰트

wordcloud = WordCloud(
    font_path=font_path,
    width=1600,               # 이미지 너비
    height=800,               # 이미지 높이
    background_color='white', # 배경색
    colormap='viridis',       # 색상 팔레트 (초록-청록-노랑)
    max_words=100,            # 최대 단어 수
    relative_scaling=0.3,     # 빈도에 따른 크기 비율
    min_font_size=10          # 최소 폰트 크기
).generate_from_frequencies(dict(word_count))

# 이미지 저장
plt.figure(figsize=(20, 10))
plt.imshow(wordcloud, interpolation='bilinear')
plt.axis('off')  # 축 숨기기
plt.tight_layout(pad=0)

output_file = 'wordcloud_arca_dunfa.png'
plt.savefig(output_file, dpi=300, bbox_inches='tight')
print(f"✅ 워드클라우드 저장: {output_file}\n")
```

**핵심 포인트:**
- `Counter.most_common(100)`: Top 100 단어 추출
- `WordCloud.generate_from_frequencies()`: 빈도 딕셔너리로 생성
- `colormap='viridis'`: matplotlib 색상 팔레트 사용
- `relative_scaling=0.3`: 빈도 차이를 크기 차이로 표현하는 비율
- DPI 300: 고해상도 이미지 (인쇄 품질)

---

## 7. LLM 서비스 핵심 코드

### 7.1 시스템 프롬프트 및 메시지 구성 (`llm_service.py:42-76`)

```python
async def query(
    self,
    user_question: str,
    chat_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    사용자 질문에 대한 RAG 응답 생성

    Args:
        user_question: 사용자 질문
        chat_history: 채팅 히스토리 (선택 사항)
            [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}, ...]

    Returns:
        LLM 응답 및 사용된 도구 정보
    """
    messages = [
        {
            "role": "system",
            "content": """당신은 던파(던전앤파이터) 전문 AI 어시스턴트입니다.

사용 가능한 도구:
- search_community_posts: 커뮤니티에서 크롤링한 게시글 검색 (공략, 빌드, 팁, 이벤트 정보 등)

사용자 질문을 분석하여 search_community_posts 도구를 사용해 관련 게시글을 찾고, 그 내용을 바탕으로 답변하세요.

중요:
- 던전 공략, 직업 빌드, 게임 팁 등 모든 질문에 search_community_posts 사용
- 검색된 게시글의 내용을 요약해서 답변
- 답변 마지막에 반드시 출처 URL을 표기 (예: "출처: https://...")
- 답변은 반드시 한국어로, 친절하고 자세하게 작성
- 검색 결과가 없으면 "관련 정보를 찾을 수 없습니다"라고 안내
"""
        }
    ]

    # 채팅 히스토리가 있으면 추가 (최근 10개만)
    if chat_history:
        recent_history = chat_history[-10:]
        for msg in recent_history:
            messages.append({
                "role": msg.get("role"),
                "content": msg.get("content")
            })

    # 현재 사용자 질문 추가
    messages.append({
        "role": "user",
        "content": user_question
    })
```

**핵심 포인트:**
- 시스템 프롬프트로 LLM의 역할 정의
- 채팅 히스토리 최근 10개만 포함 (컨텍스트 길이 제한)
- 메시지 구조: `[system, user, assistant, user, ...]` 순서

---

### 7.2 Function Calling 루프 (`llm_service.py:77-125`)

```python
iteration = 0
tool_calls_history = []

while iteration < self.max_iterations:  # 최대 5회
    iteration += 1

    # LLM에게 질문 (도구 선택 요청)
    llm_response = await self._call_ollama(messages)

    # LLM이 최종 답변을 생성한 경우
    if not llm_response.get("tool_calls"):
        return {
            "success": True,
            "answer": llm_response.get("content", ""),
            "toolCallsHistory": tool_calls_history,
            "iterations": iteration
        }

    # Function Calling: 도구 실행
    tool_calls = llm_response.get("tool_calls", [])
    tool_results = []

    for tool_call in tool_calls:
        function_name = tool_call.get("function", {}).get("name")
        arguments = tool_call.get("function", {}).get("arguments", {})

        # 도구 실행
        result = await self._execute_tool(function_name, arguments)
        tool_results.append({
            "function": function_name,
            "arguments": arguments,
            "result": result
        })

        # 대화 히스토리에 도구 실행 결과 추가
        messages.append({
            "role": "tool",
            "content": json.dumps(result, ensure_ascii=False)
        })

    tool_calls_history.extend(tool_results)

# 최대 반복 횟수 초과
return {
    "success": False,
    "error": "최대 반복 횟수를 초과했습니다. 질문을 더 명확하게 작성해주세요.",
    "toolCallsHistory": tool_calls_history,
    "iterations": iteration
}
```

**핵심 포인트:**
- While 루프로 Function Calling 반복 (최대 5회)
- `tool_calls`가 없으면 최종 답변으로 간주
- 도구 실행 결과를 `role: "tool"`로 메시지에 추가
- 다음 LLM 호출에 도구 결과 포함 (컨텍스트 누적)

---

### 7.3 Ollama API 호출 (`llm_service.py:144-156`)

```python
async with httpx.AsyncClient(timeout=self.timeout) as client:
    # Ollama Chat API 호출
    url = f"{self.ollama_url}/api/chat"

    response = await client.post(
        url,
        json={
            "model": self.model,                # "qwen3:4b"
            "messages": messages,               # 시스템 프롬프트 + 히스토리 + 현재 질문
            "tools": TOOLS_DEFINITION,          # 사용 가능한 도구 목록
            "stream": False,                    # Streaming 비활성화 (일괄 응답)
            "options": {
                "num_predict": 2048,            # 최대 생성 토큰 수 (기본값: 128)
                "temperature": 0.7,             # 창의성 (0.0~1.0)
            }
        }
    )

    response.raise_for_status()
    data = response.json()

    # 응답 파싱
    message = data.get("message", {})
    return {
        "content": message.get("content", ""),      # LLM 답변 텍스트
        "tool_calls": message.get("tool_calls", []) # Function Calling 요청
    }
```

**핵심 포인트:**
- `num_predict: 2048`: 최대 생성 토큰 수 증가 (긴 답변 가능)
- `temperature: 0.7`: 창의성 수준 (0.0 = 보수적, 1.0 = 창의적)
- `stream: False`: 일괄 응답 (실시간 스트리밍 아님)
- `tools: TOOLS_DEFINITION`: LLM에게 사용 가능한 도구 알림

---

### 7.4 Vector DB 검색 (`vector_db_service.py:123-189`)

```python
def search(
    self,
    query: str,
    top_k: int = 5,
    min_upvote: Optional[int] = None,
    boost_by_upvote: bool = True
) -> List[Dict[str, Any]]:
    """
    의미적 검색 (추천수 가중치 적용)

    Args:
        query: 검색 질의
        top_k: 반환할 결과 수 (기본: 5)
        min_upvote: 최소 추천수 필터 (None이면 필터 없음)
        boost_by_upvote: 추천수 기반 점수 부스트 (기본: True)

    Returns:
        검색 결과 리스트 (메타데이터 + 점수)
    """
    # 쿼리 임베딩
    query_embedding = self.embedding_model.encode([query]).tolist()

    # 메타데이터 필터 (선택)
    where_filter = None
    if min_upvote is not None:
        where_filter = {"upvote_count": {"$gte": min_upvote}}

    # 검색 (유사도 기반)
    results = self.collection.query(
        query_embeddings=query_embedding,
        n_results=top_k * 2 if boost_by_upvote else top_k,  # 부스트 시 더 많이 가져와서 재정렬
        where=where_filter
    )

    # 결과 파싱
    search_results = []
    for i in range(len(results['ids'][0])):
        result = {
            "id": results['ids'][0][i],
            "document": results['documents'][0][i],
            "metadata": results['metadatas'][0][i],
            "distance": results['distances'][0][i],  # 낮을수록 유사 (L2 distance)
            "similarity": 1 / (1 + results['distances'][0][i])  # 0~1 사이 변환
        }

        # 추천수 기반 점수 부스트 (현업 방식)
        if boost_by_upvote:
            upvote_count = result['metadata'].get('upvote_count', 0)
            # 공식: score = similarity * (1 + log10(upvote_count + 1) * 0.2)
            # 추천수 0 → 가중치 1.0
            # 추천수 10 → 가중치 1.2
            # 추천수 100 → 가중치 1.4
            # 추천수 1000 → 가중치 1.6
            import math
            upvote_boost = 1 + math.log10(upvote_count + 1) * 0.2
            result['boosted_score'] = result['similarity'] * upvote_boost
        else:
            result['boosted_score'] = result['similarity']

        search_results.append(result)

    # 추천수 부스트 적용 시 재정렬
    if boost_by_upvote:
        search_results.sort(key=lambda x: x['boosted_score'], reverse=True)
        search_results = search_results[:top_k]  # 상위 top_k만

    return search_results
```

**핵심 포인트:**
- **임베딩 모델**: `jhgan/ko-sroberta-multitask` (한국어 전문)
- **유사도 계산**: L2 distance (낮을수록 유사)
- **추천수 가중치**:
  - 로그 스케일 사용 (추천수가 높을수록 점수 증가, 단 선형 증가 아님)
  - 공식: `1 + log10(추천수 + 1) * 0.2`
  - 추천수 1000인 게시글이 추천수 10인 게시글보다 1.6배 가중치
- **메타데이터 필터**: 최소 추천수 조건 (선택적)

---

## 8. 환경 변수 설정 (`crawler/.env`)

```bash
# MongoDB (커뮤니티 게시글 저장)
MONGODB_URL=mongodb://admin:password123@mongodb:27017/dnf_insight?authSource=admin

# Redis (채팅 히스토리 임시 저장)
REDIS_URL=redis://redis:6379/0

# MySQL (확장용, 현재 미사용)
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_USER=dnf_user
MYSQL_PASSWORD=dnf_password
MYSQL_DATABASE=dnf_insight

# Ollama (LLM 서버)
OLLAMA_API_URL=http://ollama:11434

# FastAPI 개발 모드
FASTAPI_ENV=development
LOG_LEVEL=INFO
```

---

## 9. Docker 실행 명령어

```bash
# 크롤러 서비스만 실행
docker-compose up crawler

# 백그라운드 실행
docker-compose up -d crawler

# 재빌드 후 실행 (코드 변경 시)
docker-compose up --build crawler

# 로그 확인
docker-compose logs -f crawler

# 컨테이너 진입 (디버깅)
docker-compose exec crawler bash

# 워드클라우드 수동 생성
docker-compose run --rm crawler python make_wordcloud.py

# 대량 크롤링 (500개 게시글)
docker-compose run --rm crawler python crawl_500_posts.py

# 크롤러 재시작 (설정 변경 후)
docker-compose restart crawler

# 전체 스택 중지
docker-compose down
```

---

## 10. API 엔드포인트 목록

**기본:**
- `GET /api/health`: 헬스 체크

**크롤링:**
- `POST /api/crawl/trigger?site=both&max_pages=2`: 수동 크롤링 트리거
- `GET /api/posts?limit=100&hours=24`: 최근 게시글 조회
- `GET /api/stats`: 크롤링 통계

**워드클라우드:**
- `POST /api/wordcloud/generate?board_id=dfip`: 워드클라우드 생성
- `GET /api/wordcloud/{board_id}`: 워드클라우드 이미지 (PNG)
- `GET /api/wordcloud/{board_id}/metadata`: 워드클라우드 메타데이터

**LLM RAG:**
- `POST /api/rag/query`: RAG 질의응답 (세션 없음, 단발성)
- `POST /api/chat`: 채팅 (세션 기반, 히스토리 유지)

**정보글 크롤링 (Vector DB):**
- `POST /api/crawl/info-posts?days=30&max_pages=100`: 📚정보 게시글 크롤링 + 임베딩

**테스트 예시:**
```bash
# 채팅 (세션 기반)
curl -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "user_123", "query": "디레지에 빌드가 뭐 있지?"}'

# 워드클라우드 조회
curl "http://localhost:8000/api/wordcloud/dfip" -o wordcloud.png

# 수동 크롤링
curl -X POST "http://localhost:8000/api/crawl/trigger?site=both&max_pages=2"
```

---

## 11. 트러블슈팅

### 11.1 크롤링 실패 (Cloudflare 차단)

**증상:** 아카라이브 크롤링 시 `TimeoutError` 또는 빈 결과

**해결:**
1. `crawler_config.py`에서 `rate_limit_seconds` 증가 (10초 → 15초)
2. `use_cloudflare_bypass: True` 확인
3. 재시도 횟수 증가: `retry_count: 2 → 3`

```python
# crawler/app/config/crawler_config.py
arca = ArcaLiveSettings(
    rate_limit_seconds=15,  # ⭐ 더 느리게
    retry_count=3           # ⭐ 재시도 증가
)
```

---

### 11.2 LLM 응답 없음

**증상:** 채팅창에 "답변 생성중" 이후 빈 응답

**원인:**
1. Ollama 컨테이너 미실행
2. Vector DB 데이터 없음
3. Function Calling 무한 루프

**해결:**
```bash
# 1. Ollama 컨테이너 확인
docker-compose ps | grep ollama

# 2. Ollama 실행 여부
curl http://localhost:11434/api/tags

# 3. Vector DB 데이터 확인
docker-compose exec crawler python -c "
from app.services.vector_db_service import VectorDBService
vdb = VectorDBService()
print(vdb.get_stats())
"

# 4. 로그 확인
docker-compose logs -f crawler | grep "❌"
```

---

### 11.3 워드클라우드 생성 실패

**증상:** "데이터 없음" 또는 빈 이미지

**원인:**
1. 크롤링된 게시글 없음
2. KoNLPy 미설치 (JDK 필요)
3. 한글 폰트 없음

**해결:**
```bash
# 1. 크롤링 데이터 확인
curl "http://localhost:8000/api/stats"

# 2. KoNLPy 설치 확인
docker-compose exec crawler python -c "from konlpy.tag import Okt; print('OK')"

# 3. 폰트 확인
docker-compose exec crawler ls /usr/share/fonts/truetype/nanum/
```

---

### 11.4 MongoDB 연결 실패

**증상:** `ServerSelectionTimeoutError`

**해결:**
```bash
# 1. MongoDB 컨테이너 실행 확인
docker-compose ps | grep mongodb

# 2. MongoDB 재시작
docker-compose restart mongodb

# 3. MongoDB 연결 테스트
docker-compose exec mongodb mongosh -u admin -p password123
```

---

## 12. 성능 최적화 팁

### 12.1 크롤링 속도 향상

**병렬 처리 활성화:**
```python
# crawler/app/config/crawler_config.py
scheduler = SchedulerSettings(
    concurrent_crawling=True  # ⭐ 디시인사이드 + 아카라이브 동시 실행
)
```

**페이지 수 조절:**
```python
dcinside = DCInsideSettings(
    max_pages=5  # ⭐ 5페이지 → 10페이지로 늘리면 2배 느려짐
)
```

---

### 12.2 LLM 응답 속도 향상

**모델 경량화:**
- qwen3:4b (현재) → qwen3:1.8b (더 빠름, 단 성능 하락)

**토큰 수 제한:**
```python
# llm_service.py
"options": {
    "num_predict": 1024  # 2048 → 1024로 줄이면 2배 빠름
}
```

**Vector DB 검색 결과 축소:**
```python
# tools.py
return self.info_service.search_posts(
    query=query,
    top_k=3  # 5 → 3으로 줄이면 검색 속도 향상
)
```

---

### 12.3 메모리 사용량 최적화

**ChromaDB 컬렉션 주기적 정리:**
```bash
# 30일 이상 오래된 데이터 삭제
docker-compose exec crawler python -c "
from app.database import get_database
import asyncio
from datetime import datetime, timedelta

async def cleanup():
    db = get_database()
    cutoff = datetime.utcnow() - timedelta(days=30)
    result = await db.community_posts.delete_many({'crawled_at': {'\$lt': cutoff}})
    print(f'삭제됨: {result.deleted_count}개')

asyncio.run(cleanup())
"
```

---

## 13. 추가 학습 자료

**FastAPI 공식 문서:**
- https://fastapi.tiangolo.com/

**Playwright 가이드:**
- https://playwright.dev/python/

**ChromaDB 문서:**
- https://docs.trychroma.com/

**Sentence Transformers:**
- https://www.sbert.net/

**KoNLPy:**
- https://konlpy.org/

**Ollama:**
- https://ollama.com/

---

**문서 작성일:** 2025-01-13
**마지막 업데이트:** 2025-01-13
**버전:** 1.0.0
