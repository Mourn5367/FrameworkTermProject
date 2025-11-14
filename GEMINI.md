# 프로젝트 개요

"던파 인사이트"는 던전앤파이터 캐릭터 분석 및 경매장 시세 추적을 위한 풀스택 웹 애플리케이션입니다. 이 프로젝트는 세 가지 주요 구성 요소로 이루어져 있습니다:

*   **프론트엔드:** 사용자 인터페이스를 제공하는 Next.js/React 애플리케이션.
*   **백엔드:** 주요 API를 제공하는 Spring Boot 애플리케이션.
*   **크롤러:** 커뮤니티 사이트에서 데이터를 수집하는 Python 기반 FastAPI 애플리케이션.

전체 애플리케이션은 Docker 및 Docker Compose를 사용하여 오케스트레이션됩니다.

# 빌드 및 실행

## Docker (권장)

전체 스택을 실행하는 가장 쉬운 방법은 Docker Compose를 사용하는 것입니다:

```bash
# 모든 서비스를 빌드하고 detached 모드로 시작
docker-compose up -d --build

# 로그 확인
docker-compose logs -f

# 컨테이너 중지 및 제거
docker-compose down
```

**서비스 URL:**

*   **프론트엔드:** `http://localhost:3000`
*   **백엔드 API:** `http://localhost:8080`
*   **크롤러 API:** `http://localhost:8000`

## 로컬 개발

### 백엔드 (Spring Boot)

```bash
cd backend
./gradlew bootRun
```

### 프론트엔드 (Next.js)

```bash
cd frontend
npm install
npm run dev
```

### 크롤러 (Python/FastAPI)

```bash
cd crawler
pip install -r requirements.txt
uvicorn main:app --reload
```

# 개발 컨벤션

*   **백엔드:** 백엔드는 표준 Spring Boot 컨벤션을 따릅니다.
    *   설정은 `src/main/resources/application.yml`에 있습니다.
    *   컨트롤러, 서비스, 리포지토리 및 기타 구성 요소는 패키지로 구성됩니다.
*   **프론트엔드:** 프론트엔드는 App Router와 함께 Next.js를 사용합니다.
    *   컴포넌트는 `components` 디렉토리에 있습니다.
    *   페이지는 `app` 디렉토리에 있습니다.
*   **크롤러:** 크롤러는 FastAPI 애플리케이션입니다.
    *   주요 애플리케이션은 `main.py`에 있습니다.
    *   크롤링 로직은 `app/services` 디렉토리에 있습니다.
