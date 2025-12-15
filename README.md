# 🎮 DunSight - 던파 인사이트

> 던전앤파이터 캐릭터 분석, 경매장 시세 추적, AI 기반 정보 검색 통합 플랫폼

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.3-brightgreen?logo=spring)](https://spring.io/projects/spring-boot)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)](https://openjdk.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python)](https://www.python.org/)

---

## 📖 목차

- [프로젝트 소개](#-프로젝트-소개)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시스템 아키텍처](#-시스템-아키텍처)
- [시작하기](#-시작하기)
- [환경 변수 설정](#-환경-변수-설정)
- [프로젝트 구조](#-프로젝트-구조)
- [API 문서](#-api-문서)
- [라이선스](#-라이선스)

---

## 🎯 프로젝트 소개

**DunSight**는 던전앤파이터(DnF) 게임의 다양한 데이터를 수집, 분석, 시각화하는 올인원 플랫폼입니다.

### 핵심 가치

- **📊 실시간 시세 추적**: 경매장 아이템 가격을 1분마다 자동 수집하여 정확한 시세 분석 제공
- **🔍 캐릭터 심층 분석**: 던파 API를 통한 캐릭터 정보, 주간 던전 현황, 접속 패턴 분석
- **🤖 AI 기반 정보 검색**: LLM과 RAG를 활용한 커뮤니티 게시글 검색 및 챗봇
- **📈 장비 통계**: 직업별 인기 세트/융합석 통계 (직업별 상위 100명 기준)
- **☁️ 워드클라우드**: 커뮤니티 트렌드 시각화

---

## ✨ 주요 기능

### 1. 경매장 시세 추적 🏪

- **자동 크롤링**: 1분마다 추적 아이템의 현재 매물 및 판매 내역 수집
- **가격 스냅샷**: 1분 간격으로 가격, 등록 물량, 거래량 저장
- **스냅샷 재계산**: 뒤늦게 수집된 판매 내역을 과거 10분치 스냅샷에 자동 반영
- **듀얼 Y축 차트**: Recharts 기반 현재가(Line), 등록 물량(Bar), 거래량(Bar) 동시 표시
- **인터랙티브 차트**: 마우스 휠로 시간 간격 조절 (5분 ~ 1년)
- **이상치 감지**: 거래 최고가 이상치 자동 표시 및 정상가 계산

### 2. 캐릭터 분석 🎮

- **이중 검색**: `wordType=match` + `wordType=full`로 정확도 향상
- **주간 던전 현황**: 베누스, 나벨, 이내 황혼전 클리어 여부 (목요일 06시 기준 리셋)
- **접속 시간대 분석**: 평일/주말 구분하여 가장 활발한 시간대 표시
- **장비 정보**: 캐릭터 사진, 직업 일러스트, 명성, 서버, 모험단, 길드

### 3. 장비 통계 📊

- **세트 아이템 통계**: 각 캐릭터의 모든 슬롯에서 가장 많이 등장하는 세트 집계
- **융합석 통계**: 방어구 5부위, 악세 3부위, 특수 융합석 분류
- **VP 스킬 통계**: 진화/강화 스킬 + 세트/칭호/무기 튠 태그 분석
- **대량 수집**: 랭킹 API로 직업별 상위 100명 장비 자동 수집

### 4. LLM 챗봇 (RAG) 🤖

- **Function Calling**: Ollama tool_calls로 필요 시 RAG 자동 수행
- **Vector DB 검색**: ChromaDB + ko-sroberta-multitask 임베딩 (768차원)
- **추천수 가중치**: `score = similarity * (1 + log10(upvote+1) * 0.2)`
- **세션 관리**: Redis List로 최대 50개 메시지, 24시간 TTL
- **출처 제공**: 답변과 함께 참고한 게시글 URL 자동 표시

### 5. 커뮤니티 크롤링 🕷️

- **크롤러**:
  - 디시인사이드 (dfip 갤러리) - Beautiful Soup
- **댓글 계층 구조**: parent_id, depth, replies로 트리 구조 저장
- **정보글 분리**: 📚정보 말머리 → info_posts → Vector DB 임베딩
- **워드클라우드**: KoNLPy Okt 명사 추출 + 빈도 계산 + 이미지 생성

---

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 16 (App Router), React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + CSS Variables
- **Charts**: Recharts 3.3
- **State Management**: React Query (TanStack Query)
- **Markdown**: ReactMarkdown, remark-gfm

### Backend
- **Framework**: Spring Boot 3.5.3
- **Language**: Java 21
- **Database**:
  - MySQL 8.0 (JPA) - 경매장 시세 데이터
  - MongoDB 7.0 - 캐릭터 장비, 커뮤니티 게시글
  - Redis 7 - 캐싱 (5분 TTL), Rate Limiting
  - ChromaDB 0.5+ - Vector DB (임베딩)
- **API Client**: WebFlux WebClient (비동기)
- **Scheduler**: @Scheduled (1분 간격 크롤링)

### Crawler
- **Framework**: FastAPI 0.115+
- **Language**: Python 3.11+
- **HTML Parsing**: Beautiful Soup 4
- **NLP**: KoNLPy (Okt), WordCloud
- **LLM**: Ollama (qwen3:4b)
- **Vector DB**: ChromaDB (ko-sroberta-multitask)

### Infrastructure
- **Container**: Docker, Docker Compose
---

## 🏗️ 시스템 아키텍처

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js)   │  Backend (Spring)   │  Crawler (FastAPI)    │    AI (Ollama)     │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  Docker Compose (7 Services: Frontend, Backend, Crawler, MongoDB, MySQL, Redis, Ollama)  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**데이터 흐름:**
1. **경매장**: Spring Scheduler (1분) → 네오플 API → MySQL (스냅샷 재계산) → Next.js 차트
2. **캐릭터**: Next.js → Spring Boot → 네오플 API → Redis 캐싱 (5분) → MongoDB
3. **크롤링**: FastAPI Scheduler (1시간) → DC/Arca → MongoDB → ChromaDB 임베딩
4. **챗봇**: Next.js → FastAPI → Ollama (Function Calling) → ChromaDB → Ollama → Next.js

---

## 🚀 시작하기

### 사전 요구사항

- **Docker** 24.0+
- **Docker Compose** 2.20+
- **네오플 던파 API 키**: [developers.neople.co.kr](https://developers.neople.co.kr)

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/Next_Spring.git
cd Next_Spring
```

### 2. 환경 변수 설정

루트 디렉토리에 `.env` 파일 생성:

```bash
cp .env.example .env
nano .env
```

필수 환경 변수 입력 (자세한 내용은 [환경 변수 설정](#-환경-변수-설정) 참고)

### 3. Docker Compose 실행

```bash
# 전체 스택 빌드 및 실행
docker-compose up --build

# 백그라운드 실행
docker-compose up -d

# 특정 서비스만 실행
docker-compose up frontend backend
```

### 4. 접속

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Crawler API**: http://localhost:8000
- **Ollama API**: http://localhost:11434

### 5. 로그 확인

```bash
# 전체 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f backend
docker-compose logs -f crawler
```

### 6. 중지 및 삭제

```bash
# 중지
docker-compose stop

# 중지 및 컨테이너 삭제
docker-compose down

# 볼륨까지 삭제 (데이터 초기화)
docker-compose down -v
```

---

## 🔧 환경 변수 설정

### `.env` 파일 예시

```bash
# ===== 네오플 던파 API =====
# 여러 키는 쉼표로 구분 (예: key1,key2,key3)
DNF_API_KEYS=your-api-key-1,your-api-key-2
DNF_API_BASE_URL=https://api.neople.co.kr
DNF_IMAGE_BASE_URL=https://img-api.neople.co.kr

# Rate Limiting (네오플 기본값)
DNF_API_RATE_LIMIT_PER_SECOND=1000
DNF_API_RATE_LIMIT_PER_MINUTE=60000
DNF_API_RATE_LIMIT_PER_HOUR=3600000

# 캐시 TTL (초 단위)
DNF_API_CACHE_TIMELINE_TTL=300
DNF_API_CACHE_CHARACTER_TTL=300

# ===== 데이터베이스 =====
# MongoDB
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=your-mongo-password
MONGO_INITDB_DATABASE=dnf_insight

# MySQL
MYSQL_ROOT_PASSWORD=your-mysql-root-password
MYSQL_DATABASE=dnf_insight
MYSQL_USER=dnf_user
MYSQL_PASSWORD=your-mysql-password

# Redis
REDIS_PASSWORD=your-redis-password

# ===== Spring Boot =====
SPRING_PROFILES_ACTIVE=dev
JWT_SECRET=your-jwt-secret-key-minimum-256-bits

# ===== FastAPI Crawler =====
CRAWLER_INTERVAL_MINUTES=60
DCINSIDE_ENABLED=true
DCINSIDE_MAX_PAGES=3
ARCA_ENABLED=true
ARCA_MAX_PAGES=2

# ===== Ollama =====
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=qwen3:4b

# ===== 기타 =====
NODE_ENV=development
API_URL=http://localhost:8080
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### API 키 발급 방법

1. [네오플 개발자 센터](https://developers.neople.co.kr) 접속
2. 회원가입 및 로그인
3. "API Key 발급" 메뉴에서 신규 발급
4. 발급받은 키를 `.env`의 `DNF_API_KEYS`에 입력

**💡 Tip**: Rate Limiting을 피하기 위해 여러 개의 API 키를 쉼표로 구분하여 등록하세요.

---

## 📁 프로젝트 구조

```
Next_Spring/
├── frontend/                      # Next.js 16 Frontend
│   ├── app/
│   │   ├── page.tsx               # 메인 페이지
│   │   ├── auction/page.tsx       # 경매장 시세 페이지
│   │   ├── characters/[serverId]/[characterId]/page.tsx
│   │   ├── search/page.tsx        # 캐릭터 검색 페이지
│   │   └── globals.css            # 디자인 시스템 (CSS Variables)
│   ├── components/
│   │   ├── auction/AuctionTableWithAccordion.tsx
│   │   └── layout/Footer.tsx
│   ├── package.json
│   ├── Dockerfile.dev
│   └── tsconfig.json
│
├── backend/                       # Spring Boot 3.5.3 Backend
│   ├── src/main/java/com/dnf/insight/
│   │   ├── config/
│   │   │   ├── DnfApiConfig.java          # 던파 API 설정
│   │   │   ├── RedisConfig.java           # Redis 캐싱 + Rate Limiting
│   │   │   ├── MongoConfig.java           # MongoDB 설정
│   │   │   └── WebClientConfig.java       # WebClient 설정
│   │   ├── controller/
│   │   │   ├── CharacterController.java   # 캐릭터 API
│   │   │   └── AuctionController.java     # 경매장 API
│   │   ├── service/
│   │   │   ├── ApiKeyManager.java         # Rate Limiting 관리
│   │   │   ├── DnfApiClient.java          # 네오플 API 호출
│   │   │   ├── CharacterService.java      # 캐릭터 검색/조회
│   │   │   ├── TimelineAnalysisService.java
│   │   │   └── auction/
│   │   │       ├── AuctionApiService.java
│   │   │       ├── AuctionCrawlerService.java  # @Scheduled (1분)
│   │   │       └── AuctionService.java
│   │   ├── domain/auction/
│   │   │   ├── TrackedItem.java           # 추적 아이템 (MySQL)
│   │   │   ├── AuctionItem.java           # 현재 매물 (MySQL)
│   │   │   ├── AuctionSoldHistory.java    # 판매 내역 (MySQL)
│   │   │   └── PriceSnapshot.java         # 시세 스냅샷 (MySQL)
│   │   └── repository/auction/            # JPA Repositories
│   ├── build.gradle
│   ├── Dockerfile
│   └── application.yml
│
├── crawler/                       # FastAPI Crawler
│   ├── app/
│   │   ├── config/
│   │   │   └── crawler_config.py          # 중앙 설정 파일
│   │   ├── services/
│   │   │   ├── dcinside_crawler.py        # Beautiful Soup
│   │   │   ├── llm_service.py             # Ollama 연동
│   │   │   ├── vector_db_service.py       # ChromaDB
│   │   │   └── chat_service.py            # Redis 세션 관리
│   │   ├── models/
│   │   │   └── post.py                    # CommunityPost, Comment
│   │   └── main.py                        # FastAPI 앱
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml             # 7개 서비스 통합
├── .env.example                   # 환경 변수 예시
└── README.md                     
```

---

## 📚 API 문서

### 캐릭터 API

#### 캐릭터 검색
```http
GET /api/characters/search?serverId={serverId}&characterName={characterName}
```

**파라미터**:
- `serverId`: 서버 ID (예: `cain`, `casillas`, `siroco`)
- `characterName`: 캐릭터 닉네임

**응답**:
```json
{
  "success": true,
  "characters": [
    {
      "serverId": "cain",
      "characterId": "cb87f16da8475750d45ac9ea60ccab39",
      "characterName": "EADG",
      "jobGrowName": "眞 웨펀마스터",
      "fame": 72500
    }
  ]
}
```

#### 주간 던전 현황
```http
GET /api/characters/{serverId}/{characterId}/weekly-dungeons
```

#### 접속 시간대 분석
```http
GET /api/characters/{serverId}/{characterId}/playtime
```

---

### 경매장 API

#### 추적 아이템 목록
```http
GET /api/auction/tracked-items
```

#### 가격 차트 데이터
```http
GET /api/auction/items/{itemId}/chart?days=7
```

**파라미터**:
- `days`: 조회 기간 (기본값: 7)

**응답**:
```json
{
  "itemId": "36beb5ca88540128e075aa5a647d2e1b",
  "itemName": "요기의 잔흔",
  "labels": ["2025-01-15T10:00:00", "2025-01-15T10:01:00", ...],
  "avgPrices": [150000000, 151000000, ...],
  "minPrices": [148000000, 149000000, ...],
  "soldAvgPrices": [150500000, null, ...],
  "soldCounts": [3, 0, ...],
  "itemCounts": [15, 14, ...]
}
```

#### 현재 매물 조회
```http
GET /api/auction/items/{itemId}
```

#### 판매 완료 내역
```http
GET /api/auction/items/{itemId}/sold-history?limit=100
```

---

### 크롤러 API

#### 챗봇 질의
```http
POST /api/chat
```

**요청**:
```json
{
  "session_id": "abc123",
  "query": "디레지에 빌드 추천"
}
```

**응답**:
```json
{
  "success": true,
  "answer": "매복 빌드를 추천합니다...\n\n출처: https://gall.dcinside.com/...",
  "toolCallsHistory": [
    {
      "function": "search_community_posts",
      "arguments": {"query": "매복 빌드", "top_k": 5}
    }
  ]
}
```

#### 수동 크롤링 트리거
```http
POST /api/crawl/trigger?site=both
```

**파라미터**:
- `site`: `dcinside`

---

## 📊 데이터베이스 스키마

### MySQL (JPA) - 경매장 시세

| 테이블 | 설명 | 주요 컬럼 |
|--------|------|-----------|
| `tracked_items` | 추적 아이템 목록 | `itemId`, `itemName`, `itemImageUrl` |
| `auction_items` | 현재 경매 매물 | `auctionNo`, `itemId`, `unitPrice`, `count` |
| `auction_sold_history` | 판매 완료 내역 | `itemId`, `soldDate`, `price`, `count` |
| `price_snapshots` | 시세 스냅샷 (1분 간격) | `itemId`, `snapshotTime`, `avgPrice`, `soldCount` |


### MongoDB - 캐릭터 & 커뮤니티

| 컬렉션 | 설명 |
|--------|------|
| `character_equipments` | 캐릭터 장비 스냅샷 |
| `equipment_stats` | 직업별 장비 통계 |
| `community_posts` | 크롤링된 게시글 (전체) |
| `info_posts` | 📚정보 플레어 게시글 |
| `wordclouds` | 워드클라우드 이미지 (Base64) |

### ChromaDB - Vector DB

- **Collection**: `dnf_info_posts`
- **Embedding Model**: `jhgan/ko-sroberta-multitask` (768차원)
- **Metadata**: `title`, `url`, `upvote`, `board_name`, `created_at`

---

## 🎨 디자인 시스템

모든 색상, 폰트, 간격은 `frontend/app/globals.css`의 CSS 변수로 중앙 관리됩니다.

### 브랜드 컬러
```css
--primary: #3DB89E           /* 청록색 - 메인 */
--secondary-blue: #155DFC    /* 파란색 - 공지사항 */
--secondary-purple: #6C63FF  /* 보라색 - 업데이트 */
```

### 사용 예시
```tsx
<div style={{ background: 'var(--primary)' }}>
<div className="text-[var(--font-size-xl)]">
```

---

## 🔒 보안

- **API 키 관리**: Redis 기반 Rate Limiting (1초/1분/1시간 단위)
- **CORS 설정**: Spring WebConfig에서 허용 도메인 관리


---

## 시연 영상

[![유튜브 영상](https://img.youtube.com/vi/58X_STIIVes/hqdefault.jpg)](https://youtu.be/58X_STIIVes)
