# 시스템 설계 문서 (SYSTEM_DESIGN.md)

## 목차
1. [시스템 개요](#시스템-개요)
2. [전체 아키텍처](#전체-아키텍처)
3. [컴포넌트 구조](#컴포넌트-구조)
4. [데이터 흐름](#데이터-흐름)
5. [마이크로서비스 구성](#마이크로서비스-구성)
6. [인프라 구조](#인프라-구조)
7. [보안 및 성능](#보안-및-성능)

---

## 시스템 개요

**프로젝트명**: DnF Insight (던파 인사이트)

**목적**: 던전앤파이터 게임의 캐릭터 정보 분석, 경매장 시세 추적, 커뮤니티 크롤링, AI 기반 질의응답 제공

**기술 스택**:
- **Frontend**: Next.js 15.0, React 19, TypeScript, Tailwind CSS
- **Backend**: Spring Boot 3.5.3, Java 21
- **Crawler**: FastAPI (Python 3.11), Playwright, Beautiful Soup
- **Databases**: MongoDB 7.0, MySQL 8.0, Redis 7, ChromaDB (Vector DB)
- **AI/LLM**: Ollama (Qwen3:4b), SentenceTransformers (jhgan/ko-sroberta-multitask)
- **Infrastructure**: Docker, Docker Compose, nginx (배포 시)

**배포 환경**: WSL2 (Linux 6.6.87.2-microsoft-standard-WSL2)

---

## 전체 아키텍처

```mermaid
graph TB
    subgraph "클라이언트"
        Browser[웹 브라우저]
    end

    subgraph "프론트엔드 계층"
        NextJS[Next.js 15<br/>포트: 3000]
    end

    subgraph "백엔드 계층"
        SpringBoot[Spring Boot 3.5.3<br/>포트: 8080]
        Crawler[FastAPI Crawler<br/>포트: 8000]
        Ollama[Ollama LLM<br/>포트: 11434]
    end

    subgraph "데이터베이스 계층"
        MongoDB[(MongoDB 7.0<br/>포트: 27017)]
        MySQL[(MySQL 8.0<br/>포트: 3307)]
        Redis[(Redis 7<br/>포트: 6379)]
        ChromaDB[(ChromaDB Vector DB<br/>로컬 파일 시스템)]
    end

    subgraph "외부 API"
        NeopleAPI[네오플 던파 API<br/>api.neople.co.kr]
        NeopleImage[네오플 이미지 API<br/>img-api.neople.co.kr]
    end

    Browser --> NextJS
    NextJS --> SpringBoot
    NextJS --> Crawler

    SpringBoot --> MongoDB
    SpringBoot --> MySQL
    SpringBoot --> Redis
    SpringBoot --> NeopleAPI
    SpringBoot --> NeopleImage

    Crawler --> MongoDB
    Crawler --> MySQL
    Crawler --> Redis
    Crawler --> ChromaDB
    Crawler --> Ollama
    Crawler --> SpringBoot

    Ollama -.GPU.-> GPU[NVIDIA GPU<br/>Docker GPU 지원]

    style NextJS fill:#3DB89E,stroke:#333,stroke-width:2px,color:#fff
    style SpringBoot fill:#6DB33F,stroke:#333,stroke-width:2px,color:#fff
    style Crawler fill:#009688,stroke:#333,stroke-width:2px,color:#fff
    style Ollama fill:#6C63FF,stroke:#333,stroke-width:2px,color:#fff
```

---

## 컴포넌트 구조

### 1. Frontend (Next.js 15)

```mermaid
graph TB
    subgraph "Next.js App Router"
        Layout[app/layout.tsx<br/>전역 레이아웃]

        subgraph "Pages"
            Home[app/page.tsx<br/>메인 페이지]
            Search[app/search/page.tsx<br/>캐릭터 검색]
            CharDetail[app/characters/[serverId]/[characterId]/page.tsx<br/>캐릭터 상세]
            Auction[app/auction/page.tsx<br/>경매장 시세]
            Admin[app/admin/page.tsx<br/>관리자 페이지]
        end

        subgraph "Components"
            Header[components/layout/Header.tsx]
            Footer[components/layout/Footer.tsx]
            Logo[components/layout/Logo.tsx]
        end

        subgraph "Assets"
            Images[public/images/<br/>logo.png, neople-logo.png, fame-icon.png]
            GlobalCSS[app/globals.css<br/>CSS 변수, Tailwind 설정]
        end
    end

    Layout --> Home
    Layout --> Search
    Layout --> CharDetail
    Layout --> Auction
    Layout --> Admin

    Layout --> Header
    Layout --> Footer
    Layout --> Logo

    GlobalCSS -.스타일.-> Layout

    style Home fill:#3DB89E
    style CharDetail fill:#155DFC
    style Auction fill:#6C63FF
```

**주요 기능**:
- ✅ **메인 페이지**: 캐릭터 검색, 실시간 아이템 시세 위젯, 공지사항, 업데이트 사항
- ✅ **캐릭터 검색**: 서버 선택 + 닉네임 검색 (이중 검색: match + full)
- ✅ **캐릭터 상세**: 명성, 직업 정보, 주간 던전 클리어 현황, 접속 시간대 분석, 장비 통계
- ✅ **경매장 시세**: Recharts 듀얼 Y축 차트, 마우스 휠로 시간 간격 조절 (2분~1일)
- ✅ **디자인 시스템**: CSS 변수 기반 (Primary #3DB89E, Secondary Blue #155DFC, Purple #6C63FF)

**환경 변수**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
NODE_ENV=development
WATCHPACK_POLLING=true  # Docker Hot Reload
```

---

### 2. Backend (Spring Boot 3.5.3)

```mermaid
graph LR
    subgraph "Controller Layer"
        HealthCtrl[HealthController<br/>/api/health]
        CharCtrl[CharacterController<br/>/api/characters]
        AuctionCtrl[AuctionController<br/>/api/auction]
        EquipCtrl[EquipmentController<br/>/api/equipment]
        StatsCtrl[EquipmentStatsController<br/>/api/equipment-stats]
        RankingCtrl[RankingController<br/>/api/ranking]
        BulkCtrl[BulkCollectionController<br/>/api/bulk]
    end

    subgraph "Service Layer"
        CharSvc[CharacterService<br/>캐릭터 검색/조회]
        TimelineSvc[TimelineAnalysisService<br/>던전/시간대 분석]
        EquipSvc[EquipmentService<br/>장비 정보 조회]
        StatsSvc[EquipmentStatsService<br/>직업별 통계]
        AuctionApiSvc[AuctionApiService<br/>경매 API 호출]
        AuctionCrawlerSvc[AuctionCrawlerService<br/>자동 크롤링 + 스냅샷]
        ApiKeyMgr[ApiKeyManager<br/>Rate Limiting]
        DnfApiClient[DnfApiClient<br/>WebClient 기반]
        RankingSvc[RankingService<br/>랭킹 조회]
    end

    subgraph "Repository Layer"
        CharRepo[(CharacterEquipmentRepository<br/>MongoDB)]
        StatsRepo[(EquipmentStatsRepository<br/>MongoDB)]
        TrackedRepo[(TrackedItemRepository<br/>MySQL)]
        AuctionRepo[(AuctionItemRepository<br/>MySQL)]
        SoldRepo[(AuctionSoldHistoryRepository<br/>MySQL)]
        SnapshotRepo[(PriceSnapshotRepository<br/>MySQL)]
    end

    CharCtrl --> CharSvc
    CharCtrl --> TimelineSvc
    AuctionCtrl --> AuctionCrawlerSvc
    AuctionCtrl --> AuctionApiSvc
    EquipCtrl --> EquipSvc
    StatsCtrl --> StatsSvc

    CharSvc --> ApiKeyMgr
    CharSvc --> DnfApiClient
    TimelineSvc --> DnfApiClient
    AuctionCrawlerSvc --> AuctionApiSvc
    AuctionCrawlerSvc --> TrackedRepo
    AuctionCrawlerSvc --> AuctionRepo
    AuctionCrawlerSvc --> SoldRepo
    AuctionCrawlerSvc --> SnapshotRepo

    EquipSvc --> CharRepo
    StatsSvc --> CharRepo
    StatsSvc --> StatsRepo

    style CharSvc fill:#6DB33F
    style AuctionCrawlerSvc fill:#FF6B6B
    style ApiKeyMgr fill:#FFA500
```

**주요 기능**:
- ✅ **캐릭터 API**: 검색, 타임라인 분석, 주간 던전 현황, 접속 시간대, 이미지 URL
- ✅ **경매장 API**: 추적 아이템 관리, 현재 매물, 판매 내역, 시세 스냅샷
- ✅ **API 키 관리**: Redis 기반 Sliding Window Rate Limiting (1초/1분/1시간)
- ✅ **자동 크롤링**: 1분 간격 경매장 크롤링, 10분 간격 만료 매물 정리
- ✅ **스냅샷 재계산**: 과거 10분치 스냅샷에 뒤늦게 수집된 판매 내역 반영
- ✅ **장비 통계**: 직업별 세트, 융합석, VP 스킬 조합 통계

**환경 변수** (docker-compose.yml):
```yaml
SPRING_DATA_MONGODB_URI: mongodb://admin:password123@mongodb:27017/dnf_insight?authSource=admin
SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/dnf_auction?...
SPRING_DATA_REDIS_HOST: redis
DNF_API_KEYS: key1,key2,key3  # 쉼표로 구분
DNF_API_BASE_URL: https://api.neople.co.kr
TZ: Asia/Seoul
SPRING_JPA_HIBERNATE_DDL_AUTO: update
```

**Rate Limiting 설정**:
- 1초당: 1,000건
- 1분당: 60,000건
- 1시간당: 3,600,000건

---

### 3. Crawler (FastAPI)

```mermaid
graph TB
    subgraph "FastAPI App"
        Router[api/routes.py<br/>REST API]
        Scheduler[services/scheduler.py<br/>자동 크롤링 스케줄러]
    end

    subgraph "크롤링 서비스"
        DCCrawler[services/dcinside_crawler.py<br/>디시인사이드 갤러리<br/>Beautiful Soup]
        ArcaCrawler[services/arca_crawler_playwright.py<br/>아카라이브 채널<br/>Playwright]
        InfoCrawler[services/info_post_crawler.py<br/>정보글 전용 크롤러]
    end

    subgraph "LLM/AI 서비스"
        LLMSvc[services/llm_service.py<br/>Ollama Function Calling<br/>Qwen3:4b]
        VectorDB[services/vector_db_service.py<br/>ChromaDB + Ko-Sroberta<br/>RAG 검색]
        ChatSvc[services/chat_service.py<br/>Redis 기반 세션 관리]
        Tools[services/tools.py<br/>Function Calling 도구<br/>DnfApiTools]
        WordCloud[services/wordcloud_service.py<br/>워드클라우드 생성<br/>KoNLPy + WordCloud]
    end

    subgraph "데이터 모델"
        CommunityPost[models/post.py<br/>CommunityPost, Comment]
        InfoPost[models/info_post.py<br/>InfoPost]
    end

    Router --> DCCrawler
    Router --> ArcaCrawler
    Router --> InfoCrawler
    Router --> LLMSvc
    Router --> ChatSvc
    Router --> WordCloud

    Scheduler --> DCCrawler
    Scheduler --> ArcaCrawler
    Scheduler --> InfoCrawler
    Scheduler --> VectorDB

    LLMSvc --> VectorDB
    LLMSvc --> Tools
    LLMSvc --> Ollama[Ollama API<br/>qwen3:4b]

    VectorDB --> ChromaDBFile[(ChromaDB<br/>/app/chroma_db)]
    ChatSvc --> RedisDB[(Redis<br/>chat_history:*)]

    DCCrawler --> MongoDB[(MongoDB<br/>community_posts)]
    ArcaCrawler --> MongoDB
    InfoCrawler --> MongoInfo[(MongoDB<br/>info_posts)]

    WordCloud --> MongoDB

    style DCCrawler fill:#4CAF50
    style ArcaCrawler fill:#009688
    style LLMSvc fill:#6C63FF
    style VectorDB fill:#FF6B6B
```

**주요 기능**:
- ✅ **커뮤니티 크롤링**: 디시인사이드 dfip 갤러리, 아카라이브 dunfa 채널
- ✅ **정보글 크롤링**: 📚정보 말머리 게시글 전용 수집 (Vector DB용)
- ✅ **RAG 시스템**: ChromaDB + Ko-Sroberta 임베딩 모델, 추천수 기반 가중치
- ✅ **LLM 채팅**: Ollama Function Calling (Qwen3:4b), Redis 세션별 히스토리 (최대 50개)
- ✅ **워드클라우드**: KoNLPy Okt 형태소 분석, 불용어 제거
- ✅ **자동 스케줄링**: 1시간 간격 크롤링 (설정 가능)

**환경 변수** (docker-compose.yml):
```yaml
MONGODB_URI: mongodb://admin:password123@mongodb:27017/dnf_insight?authSource=admin
REDIS_HOST: redis
OLLAMA_API_URL: http://ollama:11434
SPRING_BACKEND_URL: http://backend:8080
MYSQL_HOST: mysql
MYSQL_DATABASE: dnf_auction
TZ: Asia/Seoul
```

**크롤링 설정** (crawler/app/config/crawler_config.py):
```python
scheduler:
    interval_minutes: 60  # 크롤링 주기
    run_on_startup: True

dcinside:
    enabled: True
    max_pages: 3
    rate_limit_seconds: 5

arca:
    enabled: True
    max_pages: 2
    rate_limit_seconds: 10
    use_cloudflare_bypass: True
```

---

## 데이터 흐름

### 1. 캐릭터 검색 흐름

```mermaid
sequenceDiagram
    participant User as 사용자
    participant Frontend as Next.js
    participant Backend as Spring Boot
    participant Redis as Redis Cache
    participant DnfAPI as 네오플 API
    participant MongoDB as MongoDB

    User->>Frontend: 서버 선택 + 닉네임 입력
    Frontend->>Backend: GET /api/characters/search?serverId=cain&characterName=EADG

    Backend->>Redis: 캐시 조회 (character:cain:EADG)
    alt 캐시 HIT
        Redis-->>Backend: 캐싱된 데이터 반환
        Backend-->>Frontend: 캐릭터 목록 (캐시)
    else 캐시 MISS
        Backend->>Redis: API 키 조회 (Rate Limit 체크)
        Redis-->>Backend: 사용 가능한 API 키

        Backend->>DnfAPI: 이중 검색 (wordType=match)
        DnfAPI-->>Backend: 검색 결과 1

        Backend->>DnfAPI: 이중 검색 (wordType=full)
        DnfAPI-->>Backend: 검색 결과 2

        Backend->>Backend: 중복 제거 + 병합
        Backend->>Redis: 캐시 저장 (TTL: 5분)
        Backend-->>Frontend: 캐릭터 목록
    end

    Frontend->>User: 캐릭터 카드 형식 표시

    User->>Frontend: 캐릭터 클릭
    Frontend->>Backend: GET /api/characters/{serverId}/{characterId}/weekly-dungeons
    Backend->>DnfAPI: 타임라인 조회 (next 토큰 처리)
    DnfAPI-->>Backend: 타임라인 데이터
    Backend->>Backend: 주간 던전 분석 (목요일 06시 기준)
    Backend-->>Frontend: 던전 클리어 현황

    Frontend->>Backend: GET /api/characters/{serverId}/{characterId}/playtime
    Backend->>DnfAPI: 타임라인 조회
    DnfAPI-->>Backend: 타임라인 데이터
    Backend->>Backend: 접속 시간대 분석 (평일/주말)
    Backend-->>Frontend: 시간대 통계

    Frontend->>Backend: GET /api/equipment/{serverId}/{characterId}
    Backend->>MongoDB: 장비 데이터 조회
    MongoDB-->>Backend: CharacterEquipment
    Backend-->>Frontend: 장비 정보

    Frontend->>User: 캐릭터 상세 페이지 렌더링
```

**주요 특징**:
- Redis 5분 캐싱으로 중복 API 호출 방지
- 이중 검색 (match + full) + 중복 제거로 정확도 향상
- 타임라인 API의 next 토큰 처리로 100개 이상 데이터 수집
- 목요일 06시 기준 주간 던전 리셋 시간 계산

---

### 2. 경매장 시세 크롤링 흐름

```mermaid
sequenceDiagram
    participant Scheduler as @Scheduled<br/>(1분 간격)
    participant Crawler as AuctionCrawlerService
    participant API as AuctionApiService
    participant MySQL as MySQL DB
    participant Redis as Redis
    participant DnfAPI as 네오플 경매 API

    Scheduler->>Crawler: crawlTrackedItems()

    Crawler->>MySQL: SELECT * FROM tracked_items
    MySQL-->>Crawler: 추적 아이템 목록

    loop 각 아이템마다
        Crawler->>Redis: Rate Limit 체크
        Redis-->>Crawler: API 키

        Crawler->>API: searchAuctionByItemId(itemId)
        API->>DnfAPI: GET /df/auction?itemId={itemId}
        DnfAPI-->>API: 현재 매물 목록 (최대 200건)
        API-->>Crawler: AuctionListResponse

        Crawler->>MySQL: UPSERT auction_items (auctionNo 기준)

        Crawler->>API: getSoldHistory(itemId)
        API->>DnfAPI: GET /df/auction-sold?itemId={itemId}
        DnfAPI-->>API: 판매 완료 내역 (최근 100건)
        API-->>Crawler: AuctionSoldListResponse

        Crawler->>MySQL: INSERT INTO auction_sold_history<br/>(중복 체크: soldDate + itemId + price)

        Crawler->>Crawler: createPriceSnapshot()<br/>현재 시점 스냅샷 생성
        Crawler->>MySQL: 현재 매물 통계 계산<br/>(avgPrice, minPrice, itemCount)
        Crawler->>MySQL: 최근 1분 판매 통계<br/>(soldAvgPrice, soldMaxPrice, soldCount)
        Crawler->>MySQL: INSERT INTO price_snapshots

        Crawler->>Crawler: recalculatePastSnapshots()<br/>과거 10분 재계산
        Crawler->>MySQL: SELECT * FROM price_snapshots<br/>WHERE snapshotTime BETWEEN (now-10분, now)
        MySQL-->>Crawler: 과거 스냅샷 목록

        loop 각 스냅샷마다
            Crawler->>MySQL: soldDate 기준 재집계<br/>BETWEEN (snapshotTime-1분, snapshotTime)
            MySQL-->>Crawler: 재계산된 판매 통계
            Crawler->>MySQL: UPDATE price_snapshots<br/>SET soldAvgPrice, soldMaxPrice, soldCount
        end
    end

    Crawler->>Crawler: cleanNonExistentItems()<br/>병렬 매물 존재 확인

    Crawler->>MySQL: SELECT * FROM auction_items
    MySQL-->>Crawler: 전체 매물 목록

    par 병렬 처리
        Crawler->>API: getAuctionDetail(auctionNo)
        API->>DnfAPI: GET /df/auction/{auctionNo}
        DnfAPI-->>API: 매물 상세 or 404
        API-->>Crawler: 존재 여부
    end

    Crawler->>MySQL: DELETE FROM auction_items<br/>WHERE auctionNo IN (삭제 대상)
```

**핵심 로직**:
1. **1분 간격 크롤링** (`@Scheduled(fixedDelay = 60000)`)
2. **스냅샷 재계산**: 네오플 API는 최근 100건 판매 내역을 반환하지만 soldDate는 과거 시간이므로, 초기 스냅샷에 누락된 거래를 뒤늦게 반영
3. **병렬 매물 확인**: CompletableFuture로 모든 매물을 동시에 확인하여 성능 향상
4. **Timezone 처리**: `DateTimeFormatter.withZone(ZoneId.of("Asia/Seoul"))` + `hibernate.jdbc.time_zone: Asia/Seoul`

---

### 3. LLM 채팅 (RAG) 흐름

```mermaid
sequenceDiagram
    participant User as 사용자
    participant Frontend as Next.js
    participant Crawler as FastAPI Crawler
    participant Chat as ChatService
    participant LLM as LLMService
    participant Vector as VectorDBService
    participant Ollama as Ollama API<br/>(qwen3:4b)
    participant Redis as Redis
    participant ChromaDB as ChromaDB

    User->>Frontend: 질문 입력 (예: "무기마 빌드 추천")
    Frontend->>Crawler: POST /api/chat (session_id, query)

    Crawler->>Chat: get_chat_history(session_id)
    Chat->>Redis: LRANGE chat_history:{session_id} 0 -1
    Redis-->>Chat: 최근 10개 메시지
    Chat-->>Crawler: 채팅 히스토리

    Crawler->>LLM: query(question, chat_history)

    LLM->>Ollama: POST /api/chat<br/>(messages, tools, stream=false)
    Note over Ollama: System Prompt:<br/>"던파 전문 AI 어시스턴트"<br/>"search_community_posts 도구 사용"

    Ollama-->>LLM: tool_calls: [search_community_posts]

    LLM->>LLM: _execute_tool("search_community_posts", {query: "무기마 빌드"})
    LLM->>Vector: search(query="무기마 빌드", top_k=5)

    Vector->>Vector: embedding_model.encode(query)<br/>(jhgan/ko-sroberta-multitask)
    Vector->>ChromaDB: collection.query(query_embeddings)
    ChromaDB-->>Vector: 유사도 기반 상위 5개 문서

    Vector->>Vector: 추천수 기반 점수 부스트<br/>score = similarity * (1 + log10(upvote+1)*0.2)
    Vector-->>LLM: 재정렬된 검색 결과

    LLM->>Ollama: POST /api/chat<br/>(messages + tool_result)
    Ollama-->>LLM: 최종 답변 (한국어)

    LLM-->>Crawler: {answer, toolCallsHistory, iterations}

    Crawler->>Chat: save_message(session_id, "user", query)
    Chat->>Redis: RPUSH chat_history:{session_id}
    Redis->>Redis: EXPIRE 24시간

    Crawler->>Chat: save_message(session_id, "assistant", answer)
    Chat->>Redis: RPUSH chat_history:{session_id}

    Crawler-->>Frontend: 답변 + 출처 URL
    Frontend->>User: 답변 표시
```

**주요 특징**:
- **Function Calling**: Ollama의 tool_calls 기능으로 필요 시 RAG 검색 자동 수행
- **추천수 가중치**: 높은 추천수 → 높은 relevance (log10 스케일)
- **세션 관리**: Redis List로 최대 50개 메시지 저장, 24시간 TTL
- **임베딩 모델**: Ko-Sroberta (한국어 특화)

---

## 마이크로서비스 구성

### Docker Compose 네트워크

```mermaid
graph TB
    subgraph "dnf-network (bridge)"
        Frontend[Frontend Container<br/>dnf-frontend<br/>3000:3000]
        Backend[Backend Container<br/>dnf-backend<br/>8080:8080]
        Crawler[Crawler Container<br/>dnf-crawler<br/>8000:8000]
        Ollama[Ollama Container<br/>dnf-ollama<br/>11434:11434<br/>GPU 지원]

        MongoDB[MongoDB Container<br/>dnf-mongodb<br/>27017:27017]
        MySQL[MySQL Container<br/>dnf-mysql<br/>3307:3306]
        Redis[Redis Container<br/>dnf-redis<br/>6379:6379]
    end

    subgraph "Volumes (영구 저장)"
        MongoData[mongodb_data]
        MySQLData[mysql_data]
        RedisData[redis_data]
        OllamaData[ollama_data]
        ChromaData[./crawler/chroma_data]
    end

    Frontend -.HTTP.-> Backend
    Frontend -.HTTP.-> Crawler

    Backend --> MongoDB
    Backend --> MySQL
    Backend --> Redis

    Crawler --> MongoDB
    Crawler --> MySQL
    Crawler --> Redis
    Crawler --> Ollama
    Crawler -.HTTP.-> Backend

    MongoDB -.mount.-> MongoData
    MySQL -.mount.-> MySQLData
    Redis -.mount.-> RedisData
    Ollama -.mount.-> OllamaData
    Crawler -.mount.-> ChromaData

    style Frontend fill:#3DB89E
    style Backend fill:#6DB33F
    style Crawler fill:#009688
    style Ollama fill:#6C63FF
```

**컨테이너 의존성**:
- Backend: `depends_on: [mongodb, redis, mysql]` (healthcheck)
- Crawler: `depends_on: [mongodb, redis, mysql, ollama]`
- Frontend: 독립 실행 가능 (depends_on 제거됨)

**헬스체크**:
- MongoDB: `mongosh localhost:27017/test --quiet`
- MySQL: `mysqladmin ping -h localhost -u root -p***`
- Redis: `redis-cli ping`
- Ollama: `curl -f http://localhost:11434/api/tags`

**볼륨 마운트**:
- Frontend: `./frontend:/app` (Hot Reload 지원)
- Backend: `./backend/logs:/app/logs`
- Crawler: `./crawler/chroma_data:/app/chroma_db` (ChromaDB 영구 저장)

---

## 인프라 구조

### 개발 환경 (Docker Compose)

```mermaid
graph TB
    subgraph "Host Machine (WSL2)"
        Docker[Docker Engine]

        subgraph "컨테이너 런타임"
            Frontend[Frontend<br/>Node.js 20]
            Backend[Backend<br/>Java 21 + Gradle]
            Crawler[Crawler<br/>Python 3.11]
            Ollama[Ollama<br/>CUDA 12.1]

            MongoDB[MongoDB 7.0]
            MySQL[MySQL 8.0]
            Redis[Redis 7]
        end

        subgraph "로컬 파일 시스템"
            SourceCode[/mnt/d/03_Spring/Next_Spring]
            ChromaDB[./crawler/chroma_data]
            Logs[./backend/logs]
        end
    end

    GPU[NVIDIA GPU] -.driver.-> Ollama

    SourceCode -.bind mount.-> Frontend
    SourceCode -.bind mount.-> Backend
    ChromaDB -.bind mount.-> Crawler
    Logs -.bind mount.-> Backend

    style GPU fill:#76B900
```

**시스템 요구사항**:
- OS: Linux (WSL2 권장, Windows 경로보다 Hot Reload 안정적)
- Docker: 20.10+
- Docker Compose: 2.0+
- NVIDIA GPU (선택 사항): Ollama LLM 가속

**포트 매핑**:
- 3000: Next.js Frontend
- 8080: Spring Boot Backend
- 8000: FastAPI Crawler
- 11434: Ollama LLM
- 27017: MongoDB
- 3307: MySQL (호스트 3307 → 컨테이너 3306)
- 6379: Redis

---

### 배포 환경 (계획)

```mermaid
graph TB
    subgraph "프로덕션 환경"
        LoadBalancer[Nginx Load Balancer<br/>포트: 80/443]

        subgraph "Application Servers"
            Frontend1[Next.js 1]
            Frontend2[Next.js 2]
            Backend1[Spring Boot 1]
            Backend2[Spring Boot 2]
            Crawler1[FastAPI Crawler]
        end

        subgraph "Database Cluster"
            MongoPrimary[MongoDB Primary]
            MongoSecondary1[MongoDB Secondary 1]
            MongoSecondary2[MongoDB Secondary 2]

            MySQLPrimary[MySQL Primary]
            MySQLReplica[MySQL Replica]

            RedisCluster[Redis Cluster]
        end

        OllamaGPU[Ollama GPU Server]
    end

    LoadBalancer --> Frontend1
    LoadBalancer --> Frontend2
    LoadBalancer --> Backend1
    LoadBalancer --> Backend2

    Backend1 --> MongoPrimary
    Backend2 --> MongoPrimary
    Backend1 --> MySQLPrimary
    Backend2 --> MySQLPrimary
    Backend1 --> RedisCluster
    Backend2 --> RedisCluster

    Crawler1 --> MongoPrimary
    Crawler1 --> MySQLPrimary
    Crawler1 --> RedisCluster
    Crawler1 --> OllamaGPU

    MongoPrimary --> MongoSecondary1
    MongoPrimary --> MongoSecondary2
    MySQLPrimary --> MySQLReplica

    style LoadBalancer fill:#FF6B6B
    style OllamaGPU fill:#6C63FF
```

**배포 전략** (미구현):
- Nginx 리버스 프록시 + SSL/TLS
- MongoDB Replica Set (3 노드)
- MySQL Replication (Primary-Replica)
- Redis Cluster (고가용성)
- Docker Swarm 또는 Kubernetes 오케스트레이션

---

## 보안 및 성능

### 1. 보안

**인증/인가** (일부 구현):
- ✅ Spring Security 설정됨 (개발 시 CORS만 활성화)
- ❌ JWT 토큰 생성/검증 로직 미구현
- ✅ API 키 마스킹: 로그에 앞 4자리만 표시

**CORS 설정** (application.yml):
```yaml
cors:
  allowed-origins: http://localhost:3000,http://192.168.24.189:3000
```

**데이터베이스 보안**:
- MongoDB: 인증 활성화 (`authSource=admin`)
- MySQL: 전용 계정 (`dnf` / `password123`)
- Redis: 비밀번호 미설정 (내부 네트워크만)

**환경 변수 관리**:
- `.env` 파일 사용 (`.gitignore`에 포함)
- Docker Compose 환경 변수로 주입

---

### 2. 성능 최적화

**캐싱 전략**:
- ✅ **Redis 캐싱**: 캐릭터 검색 5분, 타임라인 5분
- ✅ **API Rate Limiting**: Redis Sliding Window (1초/1분/1시간)
- ✅ **다중 API 키**: 한도 초과 시 자동 전환

**데이터베이스 인덱싱**:
- MySQL: `idx_item_id`, `idx_sold_date`, `idx_item_time` 등
- MongoDB: `serverId + characterId` 복합 인덱스

**비동기 처리**:
- ✅ Spring Boot: `@Scheduled` + `CompletableFuture` (병렬 매물 확인)
- ✅ FastAPI: `async/await` (크롤링, LLM 호출)
- ✅ Next.js: Server Components + Client Components 분리

**배치 처리**:
- ✅ 임베딩 생성: batch_size=32
- ✅ MongoDB upsert: 중복 방지

**프론트엔드 최적화**:
- ✅ CSS 변수 기반 디자인 시스템
- ✅ Recharts 차트 렌더링 최적화
- ✅ 이미지 lazy loading (계획)

---

## 주요 기술 결정

| 항목 | 선택 기술 | 이유 |
|------|----------|------|
| **Frontend** | Next.js 15 App Router | SSR/SSG, React 19, 빠른 개발 속도 |
| **Backend** | Spring Boot 3.5.3 | 엔터프라이즈급 안정성, JPA/MongoDB 지원 |
| **Crawler** | FastAPI + Playwright | 비동기 처리, 브라우저 자동화 (Cloudflare 우회) |
| **LLM** | Ollama (Qwen3:4b) | 로컬 실행, GPU 가속, Function Calling 지원 |
| **Vector DB** | ChromaDB | 경량, 임베딩 자동 관리, 메타데이터 필터링 |
| **임베딩 모델** | Ko-Sroberta | 한국어 특화, SentenceTransformers 호환 |
| **MongoDB** | 7.0 | 유연한 스키마, 장비 데이터 저장 |
| **MySQL** | 8.0 | 경매장 트랜잭션 무결성, 시세 스냅샷 |
| **Redis** | 7 | 캐싱, Rate Limiting, 채팅 히스토리 |
| **인프라** | Docker Compose | 로컬 개발 편의성, 일관된 환경 |

---

## 개선 계획

### 단기 (1개월)
- [ ] JWT 인증/인가 구현
- [ ] MongoDB Time Series Collection (price_snapshots 마이그레이션)
- [ ] 프론트엔드 에러 핸들링 개선
- [ ] Swagger UI 문서화 완성

### 중기 (3개월)
- [ ] Kubernetes 배포
- [ ] MongoDB Replica Set
- [ ] MySQL Replication
- [ ] CI/CD 파이프라인 (GitHub Actions)

### 장기 (6개월)
- [ ] 캐릭터 비교 기능
- [ ] AI 빌드 추천 (Claude/OpenAI API)
- [ ] 실시간 알림 (WebSocket)
- [ ] 모바일 앱 (React Native)

---

**작성일**: 2025-12-15
**버전**: 1.0.0
**작성자**: Claude Code (Sonnet 4.5)
