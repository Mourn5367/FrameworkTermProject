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
│   ├── WebClientConfig.java        # WebClient 설정 (API 호출용)
│   └── OpenApiConfig.java          # Swagger/OpenAPI 설정 ✅
├── controller/
│   ├── HealthController.java       # /api/health 엔드포인트
│   ├── CharacterController.java    # /api/characters 엔드포인트 ✅
│   ├── RankingController.java      # /api/ranking 장비 수집 ✅
│   └── EquipmentStatsController.java # /api/stats 장비 통계 ✅
├── service/
│   ├── ApiKeyManager.java          # Redis 기반 API 키 관리 + Rate Limiting ✅
│   ├── DnfApiClient.java           # WebClient 기반 던파 API 호출 ✅
│   ├── CharacterService.java       # 캐릭터 검색/조회 (5분 캐싱) ✅
│   ├── TimelineAnalysisService.java # 타임라인 분석 (던전/시간대) ✅
│   ├── RankingService.java         # 명성 기반 Top 100 수집 ✅
│   ├── EquipmentService.java       # 장비+스킬 수집 및 저장 ✅
│   └── EquipmentStatsService.java  # 장비 통계 생성 ✅
├── dto/
│   ├── CharacterSearchResponse.java # 캐릭터 검색 응답 ✅
│   ├── TimelineResponse.java        # 타임라인 응답 ✅
│   ├── WeeklyDungeonStatus.java     # 주간 던전 현황 ✅
│   ├── PlayTimeAnalysis.java        # 접속 시간대 분석 ✅
│   ├── EquipmentResponse.java       # 장비 API 응답 ✅
│   ├── SkillStyleResponse.java      # 스킬 특성 응답 ✅
│   └── JobEquipmentStats.java       # 장비 통계 응답 ✅
├── domain/
│   └── CharacterEquipment.java      # 캐릭터 장비 엔티티 ✅
├── repository/
│   └── CharacterEquipmentRepository.java # MongoDB Repository ✅
├── util/
│   └── DungeonResetUtil.java        # 던전 리셋 시간 계산 (목요일 06시) ✅
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

## 최근 구현 내역 (계속)

### 2025.01.17 - 일괄 수집 시스템 및 통계 UI 구현 ✅

1. **일괄 수집 API 및 MVC 리팩토링**
   - `BulkCollectionController`: 전체 69개 眞 직업 일괄 수집 API
   - `/api/bulk/collect-all`: POST 엔드포인트로 전체 수집 트리거
   - `/api/bulk/jobs`: GET 엔드포인트로 jobs.json 목록 조회
   - MVC 패턴 준수: Controller는 HTTP 처리만, 비즈니스 로직은 Service로 이동
   - `RankingService.loadAllJobs()`: jobs.json 파싱 로직
   - jobId 그룹별 병렬 처리 유지 (기존 `collectEquipmentsByJobId()` 활용)

2. **방어구 융합석 조합 통계**
   - `JobEquipmentStats.armorSetCombinations`: 5부위 기품/욕망/배신 조합 통계
   - "기품 * 5, 욕망 * 0, 배신 * 0" 형태로 조합 표시
   - `ArmorSetStats` 제거 (단순 세트 분류는 불필요)
   - 각 캐릭터의 5부위(상의/하의/머리어깨/신발/벨트) 융합석 분석
   - 융합석 이름에서 "기품", "욕망", "배신" 키워드 감지

3. **프론트엔드 통계 UI 구현**
   - `EquipmentStatsSection.tsx`: 실제 API 데이터 기반 통계 표시
   - 더미 데이터 완전 제거 (page.tsx에서 아코디언 2개 삭제)
   - **세트, 방어구, 무기 융합석 아코디언:**
     - 선호 세트 (상위 10개)
     - 방어구 융합석 조합 (기품/욕망/배신 개수 조합)
     - 방어구 융합석 (5부위 합산 상위 10개)
     - 무기 해방 (weaponTunes, "무기 튠" → "무기 해방"으로 변경)
     - 칭호 레벨 (칭호 이름에서 숫자 추출 후 레벨별 합산)
   - **악세, 특장 융합석 아코디언:**
     - 목걸이/팔찌/반지 융합석
     - 보조장비/마법석/귀걸이 융합석
     - 악세서리 조합 (목걸이-팔찌-반지)
     - 특수장비 조합 (보조-마석-귀걸이)

4. **칭호 레벨 통계 처리**
   - 칭호 이름에서 정규식으로 숫자 추출
   - 같은 레벨의 칭호 퍼센테이지 합산
   - 예: "30주년 칭호" + "레벨 30 달성" → "30 레벨" 통계
   - 숫자 없는 칭호는 통계에서 제외

5. **수집 결과**
   - 총 69개 眞 직업, 6,900명 캐릭터 수집
   - 성공률: 99.97% (2명 실패 - StackOverflowError)
   - 실패 원인: 네오플 API 응답의 순환 참조 또는 깊은 중첩 구조
   - 소요 시간: 약 2-3분 (jobId 그룹 간 0.5초 대기)

**API 엔드포인트:**
```bash
# 전체 직업 일괄 수집 (69개 × 100명)
POST /api/bulk/collect-all
→ {"totalJobs":69,"totalSuccess":6898,"totalFail":2,"successRate":"99.97%"}

# jobs.json 목록 조회
GET /api/bulk/jobs
→ {"totalCount":69,"jobs":[{jobId, jobGrowId, jobName, jobGrowName}, ...]}
```

**데이터 구조 변경:**
```java
// 제거됨
public static class ArmorSetStats {
  private ItemStat dignity, desire, betrayal, others;
}

// 추가됨
private List<CombinationStat> armorSetCombinations;
// 예: "기품 * 5, 욕망 * 0, 배신 * 0" → 49명 (49%)
```

**프론트엔드 개선:**
- API 타입: `armorSets` 제거, `armorSetCombinations` 추가
- 방어구 융합석 5부위 데이터 합산 표시
- 칭호 레벨 자동 그룹핑 로직
- 모든 더미 데이터 제거 (100% 실제 API 데이터 사용)

### 2025.01.16 - 장비 통계 시스템 및 Swagger API 문서 ✅

1. **직업별 장비 통계 API**
   - `EquipmentStatsService`: 100명 데이터 기반 통계 생성
   - `JobEquipmentStats` DTO: 모든 통계 항목 포함
   - MongoDB 집계 후 사용 비율(%) 계산
   - 무기 튠 정보 추가 수집 (새겨진 해일의 기억 등)

2. **통계 항목 (11개 카테고리)**
   - 무기: 타입(itemTypeDetail), 튠 이름
   - 칭호: itemId, itemName
   - 방어구 융합석: 5부위 각각 (상의/하의/머리어깨/신발/벨트)
   - 방어구 세트: 기품/욕망/배신 비율 (아이템명 키워드 감지)
   - 악세서리 융합석: 3부위 각각 (목걸이/팔찌/반지)
   - 악세서리 조합: "테아나, 축복, 무지" 등 3개 조합 통계
   - 특수장비 융합석: 3부위 각각 (보조장비/마법석/귀걸이)
   - 특수장비 조합: 보조-마법석-귀걸이 조합 통계
   - 세트 아이템: setItemId, setItemName
   - 스킬: 진화/강화 skillId별

3. **Swagger/OpenAPI 통합**
   - SpringDoc OpenAPI 3.0 (build.gradle)
   - `OpenApiConfig`: API 문서 메타데이터 설정
   - Controller 어노테이션: `@Operation`, `@ApiResponse`, `@Parameter`
   - Swagger UI: `http://localhost:8080/swagger-ui.html`
   - OpenAPI JSON: `http://localhost:8080/v3/api-docs`

4. **데이터 구조 개선**
   - `CharacterEquipment.WeaponSlot`: tuneName 필드 추가
   - `EquipmentService`: tune 배열에서 name이 null이 아닌 값 추출
   - `CharacterEquipmentRepository`: `findByJobIdAndJobGrowId()` 메서드 추가

**API 엔드포인트:**
```
GET /api/stats/equipment?jobId={jobId}&jobGrowId={jobGrowId}
- 직업별 장비/스킬 사용 통계
- 응답: percentage 포함한 모든 통계 데이터
```

**실사용 예시 (眞 뮤즈 100명):**
- 무기 타입: 선현궁 100%
- 튠: 새겨진 해일의 기억 51%, 새겨진 돌풍의 기억 37%
- 칭호: 프로스트의 전설 73%
- 악세 조합: 테아나 3셋 79%
- 특수장비 조합: 설계 모듈 3종 다양

### 2025.01.14 - 장비 수집 시스템 및 3단계 병렬 처리 최적화 ✅

1. **명성 기반 랭킹 시스템**
   - 직업별(jobId) + 각성별(jobGrowId) Top 100 캐릭터 수집
   - 명성 범위 자동 조절 (2000씩 감소하며 재시도)
   - HashSet 기반 중복 제거 (serverId + characterId 조합)
   - MongoDB에 캐릭터 장비 데이터 저장

2. **3단계 병렬 처리 아키텍처**
   - **1단계**: 장비 API + 스킬 API 동시 호출 (CompletableFuture)
   - **2단계**: 100명 캐릭터 병렬 수집 (Stream API + CompletableFuture)
   - **3단계**: 같은 jobId의 여러 jobGrowId 병렬 처리
   - **성능**: 6,900명 수집 시간 9분 → 2분 13초 (4배 개선)

3. **데이터 무결성 보장**
   - jobId + jobGrowId 복합 키 기반 삭제/조회
   - 재수집 전 기존 데이터 자동 삭제
   - jobName, jobGrowName 추가 저장 (가독성)
   - 네오플 API에서 직접 가져온 69개 眞 직업 리스트

4. **수집 스크립트**
   - `collect_by_jobid.sh`: jobId별 그룹화 후 순차 처리
   - Python 내장: JSON 파싱 및 API 호출
   - 실시간 진행률 표시 (성공/실패 카운트)

5. **Repository 패턴**
   - `CharacterEquipmentRepository`: MongoDB 접근
   - `countByJobIdAndJobGrowId()`: 기존 데이터 확인
   - `deleteByJobIdAndJobGrowId()`: 재수집 전 정리
   - Spring Data MongoDB 자동 쿼리 생성

**상세 문서**: `/home/aisw/Next_Spring/PERFORMANCE_OPTIMIZATION.md` 참고

## 핵심 아키텍처 설명

### 1. API 키 관리 시스템 (Redis 기반)

**구성 요소:**
- `ApiKeyManager`: 다중 API 키 관리 + Rate Limiting
- `DnfApiConfig`: application.yml에서 API 키 배열 로드
- `RedisTemplate`: Sliding Window 방식으로 1초/1분/1시간 단위 카운팅

**흐름:**
```
application.yml
  → keys: ${DNF_API_KEYS:기본값1,기본값2}
  → DnfApiConfig.keys (List<String>)
  → ApiKeyManager 생성자 주입
  → Redis 초기화 (api_key_0, api_key_1, ...)
  → getAvailableApiKey() 호출 시 Rate Limit 체크
  → 한도 초과 시 자동으로 다음 키로 전환
```

**Rate Limiting 알고리즘:**
- Redis Sorted Set에 타임스탬프 저장
- 1초 이전 데이터 자동 삭제 (removeRangeByScore)
- O(log N) 시간복잡도로 카운팅

### 2. 병렬 처리 아키텍처

**CompletableFuture 사용 이유:**
- Java 표준 라이브러리 (별도 의존성 불필요)
- ForkJoinPool 자동 제공 (CPU 코어 수 - 1)
- 네트워크 I/O 대기 시간 활용

**3단계 계층 구조:**
```
collect_by_jobid.sh
  └─ collectEquipmentsByJobId() [3단계: jobId 그룹 병렬]
      └─ collectEquipmentsForJob() [2단계: 100명 병렬]
          └─ saveEquipment() [1단계: 장비+스킬 API 병렬]
```

**핵심 코드 패턴:**
```java
// Stream API로 CompletableFuture 리스트 생성
List<CompletableFuture<Result>> futures = items.stream()
    .map(item -> CompletableFuture.supplyAsync(() -> process(item)))
    .collect(Collectors.toList());

// 모든 작업 완료 대기
CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

// 결과 수집
List<Result> results = futures.stream()
    .map(CompletableFuture::join)
    .collect(Collectors.toList());
```

### 3. 중복 제거 로직

**문제**: 명성 범위가 겹치면 같은 캐릭터가 여러 API 응답에 포함됨

**해결**: HashSet 기반 O(1) 중복 체크
```java
Set<String> collectedIds = new HashSet<>();
String uniqueKey = serverId + ":" + characterId;

if (!collectedIds.contains(uniqueKey)) {  // O(1)
    allCharacters.add(character);
    collectedIds.add(uniqueKey);
}
```

**시간복잡도:**
- HashSet: O(1) × 100 = 100회
- ArrayList: O(n) × 100 = 5,050회 (50배 느림)

### 4. WebClient 기반 API 호출

**메서드 체이닝 (Fluent API):**
```java
webClient.get()                        // GET 요청 시작
    .uri(uriBuilder -> {...})          // URI 설정
    .retrieve()                        // 요청 전송
    .bodyToMono(ResponseClass.class)   // 응답 변환
    .block();                          // 동기 대기
```

**선택적 파라미터 처리:**
```java
// 필수 파라미터: 항상 추가
.queryParam("jobId", jobId)

// 선택적 파라미터: null 체크 후 조건부 추가
if (minFame != null) {
    builder.queryParam("minFame", minFame);
}
// ⚠️ null을 직접 전달하면 "?minFame=null" 문자열로 전송되어 API 오류!
```

### 5. MongoDB + Redis 캐싱 전략

**캐싱 계층:**
- Redis: 5분 TTL (API 응답 캐싱)
- MongoDB: 영구 저장 (CharacterEquipment 컬렉션)

**데이터 재수집 전략:**
```java
// 1. 기존 데이터 개수 확인
long count = repository.countByJobIdAndJobGrowId(jobId, jobGrowId);

// 2. 100개 이상이면 삭제 후 재수집
if (count > 0) {
    repository.deleteByJobIdAndJobGrowId(jobId, jobGrowId);
}

// 3. 새로운 데이터 수집
List<CharacterEquipment> newData = collectTop100(...);
repository.saveAll(newData);
```

## 주요 명령어

### 개발 환경 실행

```bash
# WSL 경로로 이동
cd /home/aisw/Next_Spring

# Docker 전체 스택 실행
docker-compose up -d

# 백엔드만 재시작
docker-compose restart backend

# 로그 실시간 확인
docker-compose logs -f backend

# 컨테이너 접속
docker exec -it dnf-backend bash
```

### 백엔드 빌드 및 실행

```bash
# Gradle 빌드 (테스트 제외)
cd /home/aisw/Next_Spring/backend
./gradlew clean build -x test

# 로컬 실행 (Docker 없이)
./gradlew bootRun

# 특정 테스트만 실행
./gradlew test --tests RankingServiceTest

# 의존성 확인
./gradlew dependencies
```

### 데이터 수집 스크립트

```bash
# 전체 69개 직업 × 100명 수집 (권장)
bash /home/aisw/Next_Spring/scripts/collect_by_jobid.sh

# 단일 직업 수집 (API 테스트용)
curl -X POST "http://localhost:8080/api/ranking/collect" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "jobId=41f1cdc2ff58bb5fdc287be0db2a8df3" \
  -d "jobGrowId=37495b941da3b1661bc900e68ef3b2c6" \
  -d "jobName=귀검사(남)" \
  -d "jobGrowName=眞 웨폰마스터"

# jobId 그룹 수집 (같은 직업군의 여러 각성 동시 수집)
curl -X POST "http://localhost:8080/api/ranking/collect-by-jobid" \
  -H "Content-Type: application/json" \
  -d @scripts/all_jobs.json
```

### MongoDB 데이터 확인

```bash
# MongoDB 접속
docker exec -it dnf-mongodb mongosh -u admin -p password123

# 데이터베이스 선택
use dnf_insight

# 캐릭터 장비 데이터 확인
db.character_equipments.countDocuments()
db.character_equipments.find().limit(5).pretty()

# 특정 직업 데이터 확인
db.character_equipments.find({
  "jobName": "귀검사(남)",
  "jobGrowName": "眞 웨폰마스터"
}).count()

# 인덱스 확인
db.character_equipments.getIndexes()
```

### Redis 데이터 확인

```bash
# Redis 접속
docker exec -it dnf-redis redis-cli

# API 키 확인
KEYS api_key_*

# Rate Limit 카운터 확인
KEYS rate_limit:*
ZCARD rate_limit:api_key_0

# 캐시된 데이터 확인
KEYS *
TTL some_cache_key
```

## API 엔드포인트

**API 문서:** `http://localhost:8080/swagger-ui.html` (Swagger UI)

### 장비 수집 API

```
POST /api/ranking/collect
- 단일 직업의 Top 100 수집
- 파라미터: jobId, jobGrowId, jobName, jobGrowName

POST /api/ranking/collect-by-jobid
- 같은 jobId의 여러 jobGrowId 병렬 수집
- Body: JSON 배열 [{jobId, jobGrowId, jobName, jobGrowName}, ...]
- 예: 귀검사(남) 5개 각성을 동시에 수집
```

### 장비 통계 API ✅

```
GET /api/stats/equipment?jobId={jobId}&jobGrowId={jobGrowId}
- 직업별 장비/스킬 사용 통계
- 응답: 무기, 칭호, 융합석, 조합, 세트, 스킬 통계
- 사용 비율(percentage) 포함
```

### 캐릭터 API

```
GET /api/characters/search?serverId={id}&characterName={name}
- 캐릭터 검색

GET /api/characters/{serverId}/{characterId}/weekly-dungeons
- 주간 던전 현황

GET /api/characters/{serverId}/{characterId}/playtime
- 접속 시간대 분석

GET /api/characters/{serverId}/{characterId}/image?zoom={1-3}
- 캐릭터 이미지 URL

DELETE /api/characters/{serverId}/{characterId}/cache
- 캐시 무효화
```

## 코드 작성 시 주의사항

### 1. 경로 사용 규칙
- ✅ **사용**: `/home/aisw/Next_Spring/` (WSL 경로)
- ❌ **금지**: `/mnt/d/03_Spring/Next_Spring/` (Windows 마운트)

### 2. API 파라미터 처리
- 필수 파라미터: 직접 추가
- 선택적 파라미터: null 체크 후 조건부 추가
- 이유: `queryParam("key", null)` → "?key=null" 문자열 전송됨

### 3. 중복 체크
- List.contains() 대신 **HashSet** 사용 (O(1) vs O(n))
- 고유 키 생성: serverId + ":" + characterId

### 4. 병렬 처리
- 네트워크 I/O 작업은 CompletableFuture 사용
- CPU 집약적 작업은 순차 처리
- API Rate Limit 고려 (초당 1000건)

### 5. Lombok 어노테이션
- DTO: `@Data @Builder @NoArgsConstructor @AllArgsConstructor`
- Service/Config: `@RequiredArgsConstructor` (final 필드 생성자 주입)
- 로그: `@Slf4j`

### 6. MongoDB Repository
- 메서드 이름으로 쿼리 자동 생성
- 예: `countByJobIdAndJobGrowId()` → `db.collection.count({jobId: ..., jobGrowId: ...})`
- 복합 조건은 `And` 사용

## 다음 단계

1. ~~**던파 API 통합**: WebClient로 네오플 API 연동~~ ✅ 완료
2. ~~**장비 정보 수집**: 명성 기반 Top 100 캐릭터 수집~~ ✅ 완료
3. ~~**병렬 처리 최적화**: 3단계 계층 구조 구현~~ ✅ 완료
4. ~~**장비 통계 API**: 직업별 인기 장비 분석~~ ✅ 완료
5. ~~**Swagger/OpenAPI**: API 문서 자동 생성~~ ✅ 완료
6. **프론트엔드 통계 페이지**: 차트 라이브러리로 시각화
7. **경매장 API**: 실시간 시세 조회 및 히스토리 추적
8. **LLM 통합**: 크롤링 데이터 + 장비 정보 기반 빌드 추천
9. **RAG 시스템**: 벡터 DB + 검색 시스템
10. **스케줄러**: 자동 데이터 갱신 (일 1회)
