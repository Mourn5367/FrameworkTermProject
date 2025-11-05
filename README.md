# 던파 인사이트 (DnF Insight)

던전앤파이터 캐릭터 분석 및 경매장 시세 트래커

## 기술 스택

### Frontend
- Next.js 15.x
- React 19
- TypeScript
- Tailwind CSS
- TanStack Query
- Recharts
- Axios

### Backend
- Spring Boot 3.5.3
- Java 21
- MongoDB 7.0
- Redis 7
- Spring Security
- JWT

### Infrastructure
- Docker & Docker Compose
- Gradle 8.11.1

## 시작하기

### 사전 요구사항
- Docker & Docker Compose
- Node.js 22+ (로컬 개발 시)
- Java 21+ (로컬 개발 시)
- 던파 API 키 (https://developers.neople.co.kr)

### 환경 변수 설정

`.env` 파일을 생성하고 `.env.example`을 참고하여 설정:

```bash
cp .env.example .env
```

던파 API 키를 발급받아 설정:
```
DNF_API_KEY=your-actual-api-key-here
```

### Docker로 실행

```bash
# 전체 스택 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down
```

서비스 접속:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- MongoDB: localhost:27017
- Redis: localhost:6379

### 로컬 개발

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Backend
```bash
cd backend
./gradlew bootRun
```

## 프로젝트 구조

```
.
├── frontend/              # Next.js 프론트엔드
│   ├── app/              # App Router 페이지
│   ├── components/       # React 컴포넌트
│   ├── lib/             # 유틸리티
│   └── types/           # TypeScript 타입
├── backend/             # Spring Boot 백엔드
│   └── src/
│       └── main/
│           ├── java/com/dnf/insight/
│           │   ├── config/       # 설정
│           │   ├── controller/   # REST API
│           │   ├── service/      # 비즈니스 로직
│           │   ├── repository/   # DB 접근
│           │   ├── domain/       # 엔티티
│           │   └── dto/         # DTO
│           └── resources/
│               └── application.yml
└── docker-compose.yml
```

## 주요 기능

### 계획된 기능
1. 캐릭터 관리
   - 즐겨찾기
   - 타임라인 분석
   - 활동 통계

2. 경매장 시세 트래커
   - 실시간 가격 모니터링
   - 시세 차트
   - 가격 알림

3. 랭킹 분석
   - 직업별 랭킹
   - 캐릭터 비교
   - AI 기반 빌드 분석

## API 문서

API 문서는 다음 URL에서 확인 가능:
- Health Check: http://localhost:8080/api/health
- Actuator: http://localhost:8080/actuator/health

## 라이선스

MIT
