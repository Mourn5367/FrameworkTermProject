# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ 중요: 프로젝트 경로 설정

**이 프로젝트는 WSL 환경에서 작업합니다.**

- **프로젝트 루트**: `/home/aisw/Next_Spring/`
- **백엔드**: `/home/aisw/Next_Spring/backend/`
- **프론트엔드**: `/home/aisw/Next_Spring/frontend/`
- **스크립트**: `/home/aisw/Next_Spring/scripts/`

**❌ 사용하지 말 것**: `/mnt/d/03_Spring/Next_Spring/` (Windows 마운트 경로)
**✅ 항상 사용**: `/home/aisw/Next_Spring/` (WSL 경로)

모든 파일 읽기, 쓰기, 실행은 WSL 경로를 사용해야 합니다.

## 프로젝트 개요

던파 인사이트(DnF Insight) - 던전앤파이터 캐릭터 분석 및 경매장 시세 트래커

**목표:**
- 던파 API를 통한 실시간 캐릭터 정보 수집
- 경매장 시세 크롤링 및 데이터 분석
- 캐릭터 비교 및 AI 기반 빌드 추천 (Claude/OpenAI API)

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Spring Boot 3.5.3, Java 21, MongoDB 7.0, Redis 7
- **Infrastructure**: Docker, Docker Compose
- **External APIs**:
  - 네오플 던파 API (https://developers.neople.co.kr)
  - Claude/OpenAI API (계획)

## 개발 명령어

### Docker를 사용한 개발 (권장)

```bash
# 프론트엔드만 실행 (Hot Reload 지원)
docker-compose up frontend

# 백엔드만 실행
docker-compose up backend

# 전체 스택 실행
docker-compose up

# 백그라운드 실행
docker-compose up -d

# 재빌드 후 실행 (Dockerfile 변경 시)
docker-compose up --build

# 로그 확인
docker-compose logs -f [service-name]

# 중지 및 삭제
docker-compose down
```

### 로컬 개발

**Frontend:**
```bash
cd frontend
npm install
npm run dev          # 개발 서버 (http://localhost:3000)
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버
```

**Backend:**
```bash
cd backend
./gradlew bootRun              # 개발 서버 실행
./gradlew build                # 빌드
./gradlew test                 # 테스트 실행
./gradlew clean build -x test  # 테스트 제외 빌드
```

## 아키텍처 구조

### 프론트엔드 (Next.js 15 App Router)

```
frontend/
├── app/
│   ├── page.tsx                    # 메인 페이지
│   ├── characters/[id]/page.tsx    # 캐릭터 상세 페이지
│   ├── auction/page.tsx            # 경매장 페이지 (구현 중)
│   └── globals.css                 # 전역 CSS 및 디자인 토큰
├── components/
│   └── layout/
│       ├── Header.tsx              # 헤더 (미사용)
│       ├── Footer.tsx              # 푸터
│       └── Logo.tsx                # 로고 전용 컴포넌트
└── public/
    └── images/
        ├── logo.png                # DunSight 로고
        ├── neople-logo.png         # 네오플 API 로고
        └── fame-icon.png           # 명성 아이콘
```

### 백엔드 (Spring Boot)

```
backend/src/main/java/com/dnf/insight/
├── config/
│   ├── WebConfig.java              # CORS 설정
│   ├── MongoConfig.java            # MongoDB 설정
│   ├── RedisConfig.java            # Redis 설정 (API 키 관리 + 캐싱)
│   ├── DnfApiConfig.java           # 던파 API 설정 (다중 키, Rate Limiting)
│   └── WebClientConfig.java        # WebClient 설정 (API 호출용)
├── controller/
│   ├── HealthController.java       # /api/health 엔드포인트
│   └── CharacterController.java    # /api/characters 엔드포인트 ✅
├── service/
│   ├── ApiKeyManager.java          # Redis 기반 API 키 관리 + Rate Limiting ✅
│   ├── DnfApiClient.java           # WebClient 기반 던파 API 호출 ✅
│   ├── CharacterService.java       # 캐릭터 검색/조회 (5분 캐싱) ✅
│   └── TimelineAnalysisService.java # 타임라인 분석 (던전/시간대) ✅
├── dto/
│   ├── CharacterSearchResponse.java # 캐릭터 검색 응답 ✅
│   ├── TimelineResponse.java        # 타임라인 응답 ✅
│   ├── WeeklyDungeonStatus.java     # 주간 던전 현황 ✅
│   └── PlayTimeAnalysis.java        # 접속 시간대 분석 ✅
├── util/
│   └── DungeonResetUtil.java        # 던전 리셋 시간 계산 (목요일 06시) ✅
├── repository/                      # MongoDB Repository (미구현)
├── domain/                          # 엔티티 (미구현)
└── exception/                       # 예외 처리 (미구현)
```

## 디자인 시스템 (frontend/app/globals.css)

모든 색상, 폰트, 간격은 `globals.css`의 CSS 변수로 중앙 관리됩니다.

### 브랜드 컬러
```css
--primary: #3DB89E           /* 청록색 - 메인 컬러 */
--secondary-blue: #155DFC    /* 파란색 - 공지사항 */
--secondary-purple: #6C63FF  /* 보라색 - 업데이트 */
--background: #F5F7FA        /* 배경색 */
```

### 폰트
- **Primary**: Pretendard
- **Fallback**: Noto Sans KR, sans-serif

### 글씨 크기 (CSS 변수)
```css
--font-size-xs: 0.75rem      /* 12px */
--font-size-sm: 0.875rem     /* 14px */
--font-size-base: 1rem       /* 16px */
--font-size-lg: 1.125rem     /* 18px */
--font-size-xl: 1.25rem      /* 20px */
--font-size-2xl: 1.5rem      /* 24px */
--font-size-3xl: 1.875rem    /* 30px */
--font-size-4xl: 2.25rem     /* 36px */
```

### 간격 (CSS 변수)
```css
--spacing-xs: 0.5rem
--spacing-sm: 0.75rem
--spacing-base: 1rem
--spacing-lg: 1.5rem
--spacing-xl: 2rem
--spacing-2xl: 2.5rem
--spacing-3xl: 3rem
```

### 컨테이너
```css
--container-max-width: 800px
--container-padding: 2rem
--card-padding: 1.5rem
--border-radius: 12px
```

### 이미지 비율 (캐릭터 페이지)
```css
--character-photo-ratio: 7    /* 캐릭터 사진 */
--job-illustration-ratio: 3   /* 직업 일러스트 */
```

**사용 예시:**
```tsx
<div style={{ background: 'var(--primary)' }}>
<div style={{ flex: 'var(--character-photo-ratio)' }}>
```

## 현재 UI 구현 상태 (2025.01)

### 1. 메인 페이지 (`/`)
- **로고**: DunSight (청록색)
- **검색 섹션**: 서버 선택 + 닉네임 입력 + 검색 버튼
- **검색 탭**: "최근 검색", "닉네임 1", "닉네임 2", "닉네임 3", "닉네임 4" (클릭 시 언더라인)
- **실시간 아이템 시세**: 테이블 (청록색 헤더)
- **크롤링 데이터 위젯**: 아이콘 + 설명
- **공지사항**: 파란색 헤더, 아코디언 (2개 기본 표시 + 더보기)
- **업데이트 사항**: 보라색 헤더, 아코디언 (2개 기본 표시 + 더보기)
- **푸터**: 로고 + 네오플 API 로고 + 링크

### 2. 캐릭터 상세 페이지 (`/characters/[id]`)

**캐릭터 정보 카드 (3열 레이아웃):**

**1열 (왼쪽):**
- 캐릭터 사진 (7 비율, 보라-핑크 그라데이션)
- 직업 일러스트 (3 비율, 파랑-청록 그라데이션)

**2열 (중간):**
- 명성 72,500 (아이콘 포함)
- EADG (닉네임): 플레이어123
- 서버명: 카인
- 모험단명: 모험단명
- 길드명: 길드명
- 접속 시간대 박스 (시계 그래프, 직업 일러스트와 같은 높이)

**3열 (오른쪽):**
- 주간 던전 목록 (전체 높이 사용)
- 상급던전 0/2, 배누스 1/1, 나벨 전투역 0/0, 이스트 황혼전 0/1
- 금주 먹은 등급 (파란색 박스)
- 전주 먹은 등급 (보라색 박스)

**세트, 방어구, 무기 융합석 아코디언 (파란색 헤더):**
- 3단 그리드: 선호 세트 / 방어구 융합석 조합 / 무기 융합석
- 각 항목: 이름 - 80%
- 우측 하단: 직업 일러스트 플레이스홀더

**악세, 특장 융합석 아코디언 (보라색 헤더):**
- 3단 그리드: 팔찌 융합석 / 목걸이 융합석 / 반지 융합석
- 각 컬럼 하단: 특수 융합석 조합, 특수 융합석, 악세 융합석 조합

### 3. Sticky Footer
- `body`: `display: flex`, `flex-direction: column`, `min-height: 100vh`
- `.page-wrapper`: `flex: 1`
- Footer가 항상 화면 하단에 고정됨

## 환경 변수 설정

`.env` 파일 생성 (`.env.example` 참고):

```bash
# 던파 API (여러 키는 쉼표로 구분) ✅
DNF_API_KEYS=key1,key2,key3
DNF_API_BASE_URL=https://api.neople.co.kr
DNF_IMAGE_BASE_URL=https://img-api.neople.co.kr

# 던파 API Rate Limiting (네오플 기본값) ✅
DNF_API_RATE_LIMIT_PER_SECOND=1000
DNF_API_RATE_LIMIT_PER_MINUTE=60000
DNF_API_RATE_LIMIT_PER_HOUR=3600000

# 던파 API 캐시 설정 (초 단위) ✅
DNF_API_CACHE_TIMELINE_TTL=300
DNF_API_CACHE_CHARACTER_TTL=300

# JWT (프로덕션 변경 필수)
JWT_SECRET=your-jwt-secret-key-minimum-256-bits

# 기타
SPRING_PROFILES_ACTIVE=dev
NODE_ENV=development
```

**던파 API 키 발급:** https://developers.neople.co.kr

**네오플 API Rate Limiting:**
- 1초당 최대: 1,000건
- 1분당 최대: 60,000건
- 1시간당 최대: 3,600,000건

## Docker Hot Reload 설정

**Frontend (`frontend/Dockerfile.dev`):**
```dockerfile
ENV WATCHPACK_POLLING=true
```

**docker-compose.yml:**
```yaml
volumes:
  - ./frontend:/app           # 상대 경로 사용
  - /app/node_modules
  - /app/.next
```

**주의사항:**
- Windows 경로(`D:\...`)보다 WSL 내부 경로에서 실행 시 Hot Reload 더 안정적
- `depends_on` 제거됨: 프론트엔드 독립 실행 가능

## API 엔드포인트

### 현재 구현 ✅

**기본:**
- `GET /api/health`: 헬스 체크

**캐릭터 API:**
- `GET /api/characters/search?serverId={serverId}&characterName={characterName}`: 캐릭터 검색 ✅
- `GET /api/characters/{serverId}/{characterId}/weekly-dungeons`: 주간 던전 현황 ✅
- `GET /api/characters/{serverId}/{characterId}/playtime`: 접속 시간대 패턴 ✅
- `GET /api/characters/{serverId}/{characterId}/image?zoom={zoom}`: 캐릭터 이미지 URL ✅
- `DELETE /api/characters/{serverId}/{characterId}/cache`: 캐시 무효화 ✅

**테스트 예시:**
```bash
# 캐릭터 검색
curl "http://localhost:8080/api/characters/search?serverId=casillas&characterName=EADG"

# 주간 던전 현황
curl "http://localhost:8080/api/characters/casillas/cb87f16da8475750d45ac9ea60ccab39/weekly-dungeons"

# 접속 시간대
curl "http://localhost:8080/api/characters/casillas/cb87f16da8475750d45ac9ea60ccab39/playtime"

# 캐릭터 이미지 URL
curl "http://localhost:8080/api/characters/casillas/cb87f16da8475750d45ac9ea60ccab39/image?zoom=1"
```

### 계획된 엔드포인트
```
# 캐릭터
POST   /api/characters/favorite
GET    /api/characters/dashboard
GET    /api/characters/{id}/compare

# 경매장
GET    /api/auction/items/{itemId}/price
GET    /api/auction/items/{itemId}/history
POST   /api/auction/watchlist
GET    /api/auction/watchlist/alerts

# 랭킹
GET    /api/ranking/job/{jobId}
GET    /api/ranking/analysis
```

## 던파 API 통합 ✅

**구현된 API:**
- ✅ 캐릭터 검색: `/df/servers/{serverId}/characters`
- ✅ 타임라인 (next 토큰 지원): `/df/servers/{serverId}/characters/{characterId}/timeline`
- ✅ 캐릭터 이미지: `https://img-api.neople.co.kr/df/servers/{serverId}/characters/{characterId}?zoom={zoom}`

**미구현 API:**
- 장착 장비: `/df/servers/{serverId}/characters/{characterId}/equip/equipment`
- 경매장 검색: `/df/auction`
- 경매장 시세: `/df/auction/{auctionNo}`
- 랭킹: `/df/ranking/{rankingType}`

**Rate Limiting:** Redis Sliding Window 방식으로 구현 ✅
- API 키별 1초/1분/1시간 단위 카운팅
- 한도 초과 시 자동으로 다음 API 키로 전환

## 데이터베이스 구조 (계획)

**MongoDB Collections (미구현):**
- `users`: 사용자 정보 및 즐겨찾기
- `characters`: 캐릭터 스냅샷 (타임라인 포함)
- `auction_items`: 현재 경매 매물
- `auction_history`: 거래 내역 (중복 방지: `auctionNo + soldAt` unique)
- `price_snapshots`: Time Series Collection (5분 간격 시세)
- `user_watchlist`: 사용자별 관심 아이템
- `ranking_cache`: 랭킹 캐시 (일 1회 갱신)

**크롤링 전략:**
- 5분마다 경매장 API 호출
- 10분 이상 API 응답 없으면 판매 완료로 간주
- 중복 방지: `auction_no + sold_at` unique constraint

## UI 스타일 가이드

### 색상 사용
- **Primary (#3DB89E)**: 로고, 버튼, 테이블 헤더, 강조 색상
- **Secondary Blue (#155DFC)**: 공지사항, 세트/방어구/무기 아코디언
- **Secondary Purple (#6C63FF)**: 업데이트 사항, 악세/특장 아코디언

### 아코디언 패턴
```tsx
const [expanded, setExpanded] = useState<number | null>(null);

<div onClick={() => setExpanded(expanded === id ? null : id)}>
  {/* 헤더 */}
  <svg className={expanded === id ? 'rotate-180' : ''}>
    {/* 화살표 아이콘 */}
  </svg>
</div>
{expanded === id && (
  <div>{/* 내용 */}</div>
)}
```

### 더보기 버튼 패턴
```tsx
const [showAll, setShowAll] = useState(false);
const displayed = showAll ? items : items.slice(0, 2);

{items.length > 2 && (
  <button onClick={() => setShowAll(!showAll)}>
    {showAll ? '접기' : `더보기 (${items.length - 2}개)`}
  </button>
)}
```

## 개발 중 주의사항

1. **디자인 시스템 준수**:
   - 모든 색상은 CSS 변수 사용 (`var(--primary)`)
   - 직접 hex 코드 사용 금지 (유지보수 어려움)
   - 폰트 크기도 CSS 변수 사용 권장

2. **Backend**:
   - Spring Security 설정됨: 개발 시 인증 비활성화 또는 테스트 계정 사용
   - JWT 토큰 생성/검증 로직 미구현
   - 던파 API 클라이언트 미구현 (WebClient 사용 예정)

3. **MongoDB**:
   - 초기화 스크립트 미작성 (`mongo-init/`)
   - Time Series Collection 설정 필요 (price_snapshots)
   - 인덱스 전략 수립 필요

4. **Docker**:
   - Backend Dockerfile에서 Gradle Wrapper JAR 자동 다운로드
   - Frontend Hot Reload: `WATCHPACK_POLLING=true` 필수

## 커뮤니티 크롤러 시스템 (crawler/)

**기술 스택:**
- **FastAPI** - 비동기 웹 프레임워크
- **Playwright** - 브라우저 자동화 (아카라이브 메인)
- **Beautiful Soup** - HTML 파싱 (디시인사이드용)
- **Motor** - 비동기 MongoDB 드라이버
- **KoNLPy** - 한글 형태소 분석
- **WordCloud** - 워드클라우드 생성

### 크롤러 실행

```bash
# Docker (권장)
docker-compose build crawler           # 이미지 빌드
docker-compose up crawler               # API 서버 실행

# 대량 크롤링 (500개 게시글)
docker-compose run --rm crawler python crawl_500_posts.py

# 워드클라우드 생성
docker-compose run --rm crawler python make_wordcloud.py

# 테스트 (Windows 로컬)
cd D:\03_Spring\Next_Spring\crawler
python test_playwright_arca.py         # Playwright 테스트
python test_save_mongodb.py            # MongoDB 저장 테스트
python test_comment_structure.py       # 댓글 계층 구조 테스트
```

### 크롤링 설정 (중앙 집중식)

**모든 크롤링 설정은 `crawler/app/config/crawler_config.py`에서 관리:**

```python
class CrawlerConfig:
    # 스케줄러 설정
    scheduler = SchedulerSettings(
        interval_minutes=60,      # ⭐ 크롤링 주기 (분)
        run_on_startup=True,
    )

    # 디시인사이드 설정
    dcinside = DCInsideSettings(
        enabled=True,             # ⭐ 활성화/비활성화
        max_pages=3,              # ⭐ 크롤링할 페이지 수
        rate_limit_seconds=5,     # ⭐ 페이지 간 대기 시간
        gallery_id="dfip"         # ⭐ 갤러리 ID
    )

    # 아카라이브 설정
    arca = ArcaLiveSettings(
        enabled=True,
        max_pages=2,
        rate_limit_seconds=10,    # Cloudflare 고려하여 느리게
        board_id="dunfa",
        use_cloudflare_bypass=True
    )
```

**설정 변경 후 재시작 필수:**
```bash
docker-compose restart crawler
```

### 크롤러 아키텍처

```
crawler/
├── app/
│   ├── config/
│   │   └── crawler_config.py           # 중앙 설정 파일
│   ├── services/
│   │   ├── dcinside_crawler.py         # 디시인사이드 (Beautiful Soup)
│   │   └── arca_crawler_playwright.py  # 아카라이브 (Playwright) ⭐
│   ├── models/
│   │   └── post.py                     # CommunityPost, Comment 모델
│   └── database.py                     # MongoDB 연결
├── crawl_500_posts.py                  # 대량 크롤링 스크립트
├── make_wordcloud.py                   # 워드클라우드 생성 스크립트
├── test_save_mongodb.py                # MongoDB 저장 테스트
└── Dockerfile                          # Java(KoNLPy) + Playwright 포함
```

### API 엔드포인트 (Crawler)

```bash
GET  /api/health                    # 헬스 체크
GET  /api/posts?limit=100&hours=24  # 최근 게시글 조회
POST /api/crawl/trigger?site=both   # 수동 크롤링 트리거
GET  /api/stats                     # 크롤링 통계
```

### MongoDB Collections (추가)

- `community_posts`: 크롤링된 커뮤니티 게시글
  - URL 기준 중복 방지 (upsert)
  - 인덱스: `url` (unique), `crawled_at`, `board_name`
  - 댓글 계층 구조 지원 (depth, parent_id, replies)

**데이터 구조:**
```json
{
  "title": "게시글 제목",
  "content": "본문 전문 (원본)",
  "comments": [
    {
      "comment_id": "c_797444581",
      "parent_id": null,
      "depth": 0,
      "author": "작성자",
      "content": "댓글 내용 (원본)",
      "replies": []
    }
  ]
}
```

### 크롤링 전략

**아카라이브 (dunfa 채널) - Playwright:**
- `.list-area` 영역만 선택적 크롤링 (효율적)
- 본문: `.article-body` 추출
- 댓글: `.comment-item` 파싱
- 대댓글 계층: `a[href*="#c_"]` 링크에서 parent_id 추출
- Depth 자동 계산
- Rate Limiting: 5초 간격 (페이지당)
- 성공률: 95%+

**디시인사이드 (dfip 갤러리) - Beautiful Soup:**
- 빠르고 안정적
- Rate Limiting: 5초 간격
- 성공률: 100%

**데이터 저장:**
- 원본 그대로 MongoDB 저장 (전처리 X)
- 전처리는 사용 시점에 수행 (유연성)
- URL 기준 upsert로 중복 방지

### 워드클라우드 및 데이터 분석

**전처리 파이프라인:**
1. MongoDB에서 원본 데이터 로드
2. 텍스트 정규화 (URL, 이메일, 특수문자 제거)
3. KoNLPy Okt로 명사 추출
4. 불용어 제거 (ㅋㅋㅋ, 조사 등)
5. WordCloud 생성 (`wordcloud_arca_dunfa.png`)
6. 통계 저장 (`wordcloud_stats.txt`)

**MongoDB → 다른 포맷 변환:**
```python
# JSON
import json
from pymongo import MongoClient
posts = list(db.community_posts.find({}))
json.dump(posts, f, ensure_ascii=False, default=str)

# CSV (pandas)
posts_df = pd.DataFrame(list(db.community_posts.find({})))
posts_df.to_csv('posts.csv')

# Parquet (ML용)
df.to_parquet('posts.parquet', compression='gzip')

# HuggingFace Dataset (LLM 학습용)
from datasets import Dataset
dataset = Dataset.from_list(posts)
dataset.push_to_hub("your-username/arca-dunfa")
```

## 최근 구현 내역

### 2025.01.13 - 커뮤니티 크롤러
1. **Playwright 기반 아카라이브 크롤러**
   - Windows/Docker 모두 지원
   - 댓글 계층 구조 파싱 (parent_id, depth)
   - 선택적 영역 크롤링 (`.list-area`만)
   - 본문 + 댓글 전문 수집

2. **대량 데이터 수집 시스템**
   - `crawl_500_posts.py`: 50페이지 크롤링
   - MongoDB 자동 중복 방지 (URL 기준 upsert)
   - Rate limiting (5초/페이지)

3. **한글 형태소 분석 및 워드클라우드**
   - KoNLPy + WordCloud 통합
   - Docker에 Java/나눔폰트 설치
   - 전처리 파이프라인 구축
   - Top 100 단어 통계 자동 생성

### 2025.11.13 - 던파 API 통합 ✅

1. **API 키 관리 시스템**
   - Redis 기반 다중 API 키 관리
   - Sliding Window 방식 Rate Limiting (1초/1분/1시간)
   - 한도 초과 시 자동 키 전환

2. **캐릭터 검색 및 조회**
   - WebClient 기반 비동기 API 호출
   - 캐릭터 검색 (서버/닉네임)
   - 캐릭터 이미지 URL 생성

3. **타임라인 분석**
   - 주간 던전 입장 현황 (목요일 06시 기준)
   - 접속 시간대 패턴 분석 (최근 한 달)
   - next 토큰 처리로 100개 이상 데이터 수집

4. **캐싱 전략**
   - Redis 기반 5분 캐싱 (동일 캐릭터)
   - 중복 API 호출 방지

## 다음 단계

1. ~~**던파 API 통합**: WebClient로 네오플 API 연동~~ ✅ 완료
2. **장비 정보 API**: 캐릭터 장착 장비 조회 및 분석
3. **경매장 API**: 실시간 시세 조회 및 히스토리 추적
4. **MongoDB 스키마**: 캐릭터/타임라인 데이터 저장 구조
5. **LLM 통합**: 크롤링 데이터 + 캐릭터 정보 기반 빌드 추천
6. **RAG 시스템**: 벡터 DB + 검색 시스템
7. **스케줄러**: 자동 크롤링 + 데이터 갱신
