# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
├── app/                    # App Router 페이지
│   ├── layout.tsx         # 루트 레이아웃 (헤더 제거됨)
│   ├── page.tsx           # 메인 페이지 (검색, 시세 테이블)
│   ├── dashboard/         # 대시보드 (계획)
│   ├── characters/        # 캐릭터 관리 (계획)
│   ├── auction/           # 경매장 (계획)
│   └── ranking/           # 랭킹 (계획)
├── components/
│   ├── layout/            # 레이아웃 컴포넌트
│   ├── ui/                # 공통 UI 컴포넌트
│   └── features/          # 기능별 컴포넌트
│       ├── dashboard/
│       ├── characters/
│       ├── auction/
│       └── ranking/
├── lib/
│   └── utils/
│       └── cn.ts          # Tailwind class 유틸리티
└── types/                 # TypeScript 타입 정의 (미구현)
```

**중요:**
- `app/layout.tsx`: 헤더 제거됨. 글로벌 레이아웃만 담당
- `app/page.tsx`: 메인 페이지. Header 컴포넌트, 아이템 테이블, 크롤링 위젯 포함
- `app/auction/page.tsx`: 경매장 페이지 (아코디언 방식 아이템 리스트, 차트 확장 영역)
- `app/characters/[id]/page.tsx`: 캐릭터 상세 페이지 (명성, 장비 세트, VP 스킬 분석)
- Hot Reload: `ENV WATCHPACK_POLLING=true` (Dockerfile.dev)

**컴포넌트 구조:**
- `components/layout/Header.tsx`: 로고 + 검색 섹션 (메인, 캐릭터 페이지에 사용)
- `components/layout/Logo.tsx`: 로고만 (경매장 페이지에 사용)
- `components/layout/Footer.tsx`: 공통 푸터 (모든 페이지)

### 백엔드 (Spring Boot)

```
backend/src/main/java/com/dnf/insight/
├── config/
│   ├── WebConfig.java         # CORS 설정
│   └── MongoConfig.java       # MongoDB 설정
├── controller/
│   └── HealthController.java  # /api/health 엔드포인트
├── service/                   # 비즈니스 로직 (미구현)
├── repository/                # MongoDB Repository (미구현)
├── domain/                    # 엔티티 (미구현)
├── dto/                       # DTO (미구현)
├── exception/                 # 예외 처리 (미구현)
└── util/                      # 유틸리티 (미구현)
```

**주요 설정 (`application.yml`):**
- MongoDB URI: `mongodb://admin:password123@mongodb:27017/dnf_insight`
- Redis: `redis:6379`
- 던파 API: `${DNF_API_KEY}`, `https://api.neople.co.kr`
- JWT: `${JWT_SECRET}`, expiration 86400000ms
- CORS: `http://localhost:3000`

### 데이터베이스 구조 (계획)

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

## 환경 변수 설정

`.env` 파일 생성 (`.env.example` 참고):

```bash
# 던파 API (필수)
DNF_API_KEY=your-neople-api-key-here

# JWT (프로덕션 변경 필수)
JWT_SECRET=your-jwt-secret-key-minimum-256-bits

# 기타
SPRING_PROFILES_ACTIVE=dev
NODE_ENV=development
```

**던파 API 키 발급:** https://developers.neople.co.kr

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

### 현재 구현
- `GET /api/health`: 헬스 체크

### 계획된 엔드포인트
```
# 캐릭터
POST   /api/characters/favorite
GET    /api/characters/dashboard
GET    /api/characters/{id}/timeline
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

## 던파 API 통합 (미구현)

**주요 API:**
- 캐릭터 검색/정보: `/df/servers/{serverId}/characters`
- 타임라인: `/df/servers/{serverId}/characters/{characterId}/timeline`
- 장착 장비: `/df/servers/{serverId}/characters/{characterId}/equip/equipment`
- 경매장 검색: `/df/auction`
- 경매장 시세: `/df/auction/{auctionNo}`
- 랭킹: `/df/ranking/{rankingType}`

**Rate Limiting:** API 키별 제한 확인 필요

## 개발 중 주의사항

1. **Frontend 디자인:**
   - 시안 기준: `/메인_화면_시안.png`
   - 현재 구현: 검색 섹션, 아이템 테이블, 크롤링 위젯
   - 캐릭터/아이템 탭 제거됨
   - Figma로 디자인 수정 예정

2. **Backend:**
   - Spring Security 설정됨: 개발 시 인증 비활성화 또는 테스트 계정 사용
   - JWT 토큰 생성/검증 로직 미구현
   - 던파 API 클라이언트 미구현 (WebClient 사용 예정)

3. **MongoDB:**
   - 초기화 스크립트 미작성 (`mongo-init/`)
   - Time Series Collection 설정 필요 (price_snapshots)
   - 인덱스 전략 수립 필요

4. **Docker:**
   - Backend Dockerfile에서 Gradle Wrapper JAR 자동 다운로드
   - Frontend Hot Reload: `WATCHPACK_POLLING=true` 필수

## UI 디자인 시스템

### 전역 CSS 변수 (`app/globals.css`)
모든 UI 크기와 스타일을 중앙에서 관리하는 CSS 변수 시스템 구현:

```css
:root {
  --container-max-width: 800px;      /* 컨테이너 최대 너비 */
  --container-padding: 2rem;

  /* 글씨 크기 (xs ~ 6xl) */
  --font-size-base: 0.9rem;

  /* 간격 (xs ~ 3xl) */
  --spacing-base: 0.8rem;

  /* 카드/컨테이너 */
  --card-padding: 1.2rem;
  --border-radius: 0.75rem;
}
```

### 전역 레이아웃 클래스
- `.app-container`: 모든 페이지의 메인 컨테이너 (max-width 제한, 중앙 정렬)
- `.page-wrapper`: Sticky Footer 구현을 위한 Flexbox 래퍼
- Body는 `min-height: 100vh`로 설정되어 푸터가 항상 화면 하단에 위치

### Sticky Footer 패턴
```jsx
<div className="page-wrapper">
  <div className="flex-1">
    {/* 페이지 컨텐츠 */}
  </div>
  <Footer />  {/* 항상 하단에 고정 */}
</div>
```

## 현재 UI 구현 상태

### 1. 메인 페이지 (`app/page.tsx`)
**구현 완료:**
- Header 컴포넌트 (로고 + 검색 섹션)
  - 서버 선택 드롭다운 (카인, 디레지에, 시로코, 프레이, 카시야스)
  - 닉네임 입력 필드
  - 검색 버튼 (그라디언트 디자인)
  - 최근 검색 목록 영역
- 실시간 아이템 시세 테이블 (빈 행 2개)
- 크롤링 데이터 위젯 (플레이스홀더)
- **공지사항 섹션** (아코디언, 기본 2개 표시, 더보기 버튼)
  - 제목, 날짜, 확장 가능한 본문
  - 파란색 테마
- **업데이트 사항 섹션** (아코디언, 기본 2개 표시, 더보기 버튼)
  - 버전별 업데이트 (v1.2.0, v1.1.5 등)
  - 날짜, 변경사항 목록 (줄바꿈 지원)
  - 보라색 테마
- Footer 컴포넌트 (하단 여백 포함)

### 2. 경매장 페이지 (`app/auction/page.tsx`)
**구현 완료:**
- Logo 컴포넌트만 사용 (검색 없음)
- 아코디언 방식 아이템 리스트 (축소된 크기)
  - 아이템 정보: 아이콘, 이름, 카테고리, 현재 가격
  - 가격 변동: 1주전 대비, 어제 대비 (퍼센트, 화살표)
  - 확장/축소 버튼 (회전 애니메이션)
- 확장 시 표시 영역:
  - **가격 추이 차트** (플레이스홀더, h-48, 최저가/평균가/최대가)
  - **등록 물량 테이블** (가격 오름차순, 최대 10개, text-xs)
    - 컬럼: 등록시간, 물량, 가격, 개당
    - 시간 표시: "10초 전", "2분 전", "1시간 전" 등
    - 파란색 테마 (hover:bg-blue-50)
  - **최근 거래 테이블** (최대 10개, text-xs)
    - 컬럼: 거래시간, 물량, 가격, 개당
    - 시간 표시: "5초 전", "1분 전", "30분 전" 등
    - 녹색 테마 (hover:bg-green-50)
- 2열 그리드로 나란히 배치
- Footer 컴포넌트

**샘플 데이터:**
```typescript
// 아이템 예시
{ id: 1, icon: '⚔️', name: '누트럼 우측...', category: '장비 · 무기',
  price: 12500000, weekAgoPrice: 11800000, yesterdayPrice: 12300000 }

// 등록 물량 예시
{ time: '10초 전', quantity: 5, price: 62500000, unit: 12500000 }

// 최근 거래 예시
{ time: '5초 전', quantity: 2, price: 25000000, unit: 12500000 }
```

### 3. 캐릭터 상세 페이지 (`app/characters/[id]/page.tsx`)
**구현 완료:**
- Header 컴포넌트 (로고 + 검색)
- **캐릭터 기본 정보 카드** (3열 그리드, 축소된 크기):
  - **왼쪽:** 캐릭터 사진 (플레이스홀더, aspect-square)
  - **중앙:**
    - 명성 수치 (text-2xl)
    - 닉네임, 서버, 모험단, 길드명 (text-sm)
    - **접속 시간대 시각화**:
      - SVG 원형 그래프 (w-24 h-24, 활동 시간 표시)
      - 주요 활동 시간: 오후 6시 ~ 자정
      - 평균 활동 시간: 6시간/일
  - **오른쪽:**
    - 주간 던전 목록 (상급던전, 배누스, 나벨, 이넬 황혼전, p-2)
    - 금주 먹은 등급 개수 (레전더리, 에픽, 태초, text-xs)
    - 저번 주 먹은 등급 개수 (text-xs)

- **장비 세트 정보 카드** (3열 그리드, 명성 상위 100등 통계):
  - **선호 장비 세트** (8개 아이템, 동적 높이 조정)
    - 각 아이템별 사용률 퍼센트 표시 (85%, 82%, ..., text-sm)
    - flex-1로 남은 공간 균등 분배 (min-h-[45px])
    - gap-2, p-3
  - **선호 무기** (8개, 동적 높이 조정)
    - 무기별 사용률 퍼센트 표시 (80%, 76%, ..., text-sm)
    - 동일한 높이 조정 로직
  - **선호 VP 스킬** (8개 슬롯, space-y-2)
    - 슬롯별 사용률 표시 (예: "VP 슬롯 1: 95% 사용", text-xs)
    - 각 슬롯당 2개 스킬 비교:
      - 스킬 1: 파란색 가로 막대 그래프 (h-1, 예: 65%)
      - 스킬 2: 보라색 가로 막대 그래프 (h-1, 예: 35%)

- Footer 컴포넌트

**주요 기술 구현:**
```typescript
// 동적 높이 조정 (장비 세트/무기) - 컨테이너 높이에 맞춰 자동 조정
<div className="flex-1 flex flex-col justify-between gap-2">
  {[...Array(8)].map((_, i) => (
    <div className="flex-1 min-h-[45px]">
      {/* flex-1로 남은 공간 균등 분배 */}
    </div>
  ))}
</div>

// VP 스킬 가로 막대 그래프 (h-1로 축소)
<div className="w-full bg-gray-200 rounded-full h-1">
  <div
    className="bg-gradient-to-r from-blue-500 to-blue-600 h-1 rounded-full"
    style={{ width: `${percent1}%` }}
  ></div>
</div>
```

### 4. 레이아웃 컴포넌트

**Header.tsx** (`components/layout/Header.tsx`):
- 로고 (text-4xl) + 검색 섹션 통합
- 서버 선택, 닉네임 입력, 검색 버튼 (text-sm, py-2.5)
- 최근 검색 목록 영역 (text-xs)
- 사용 페이지: 메인, 캐릭터 상세

**Logo.tsx** (`components/layout/Logo.tsx`):
- 로고만 표시 (text-4xl, 검색 없음)
- 사용 페이지: 경매장

**Footer.tsx** (`components/layout/Footer.tsx`):
- 공통 푸터 (모든 페이지)
- 하단 여백 (mb-6) 포함
- 링크 (text-sm), 저작권 (text-xs)

## UI 크기 조정 가이드

전체 UI 크기를 조정하려면 `frontend/app/globals.css`의 CSS 변수를 수정:

```css
:root {
  /* 컨테이너 너비 조정 (현재: 800px) */
  --container-max-width: 1000px;

  /* 글씨 크기 조정 */
  --font-size-base: 1rem;      /* 현재: 0.9rem */
  --font-size-sm: 0.9rem;      /* 현재: 0.8rem */

  /* 간격 조정 */
  --spacing-base: 1rem;        /* 현재: 0.8rem */
}
```

## 최근 구현 사항 (2025.01)

### UI 크기 최적화
- 전역 CSS 변수 시스템 도입으로 일관된 크기 관리
- 컨테이너 너비를 800px로 축소하여 한눈에 보기 쉽게 개선
- 모든 텍스트 크기와 간격을 15% 축소 (scale-factor: 0.85)
- 푸터를 Sticky Footer 패턴으로 구현 (항상 화면 하단 고정)

### 메인 페이지 공지/업데이트 섹션
- 아코디언 UI로 구현 (확장/축소 가능)
- 기본 2개 항목만 표시, "더보기" 버튼으로 전체 표시
- 공지사항: 파란색 테마, 본문 확장 가능
- 업데이트: 보라색 테마, 버전별 업데이트 목록 (v1.2.0 등)
- React useState로 독립적 상태 관리

### 아코디언 패턴 사용처
1. **경매장 페이지**: 아이템 클릭 시 차트 + 테이블 확장
2. **메인 페이지**: 공지/업데이트 항목 클릭 시 본문 확장
3. 공통 UI 패턴: 화살표 아이콘 회전, fadeIn 애니메이션

## 다음 단계

### UI/UX 개선
1. 실제 차트 라이브러리 통합 (Recharts)
2. 로딩 상태 및 에러 처리 UI
3. 반응형 디자인 최적화 (모바일)

### Backend 개발
1. MongoDB 초기화 스크립트 작성
2. 던파 API 클라이언트 구현 (WebClient)
3. 도메인 엔티티 작성 (Character, AuctionItem 등)
4. 경매장 크롤러 구현 (@Scheduled)
5. API 엔드포인트 구현

### Frontend-Backend 연동
1. API 호출 로직 (Axios/TanStack Query)
2. 실시간 데이터 바인딩
3. 검색 기능 구현 (서버 + 닉네임)
4. 즐겨찾기 및 최근 검색 기능 (localStorage)

### LLM 통합
1. Claude/OpenAI API 연동
2. 캐릭터 비교 분석 프롬프트
3. 빌드 추천 시스템
