# DnF Insight Crawler

던파 커뮤니티 사이트 크롤링 서비스 (FastAPI)

## 기능

- ✅ 주기적 커뮤니티 게시글 크롤링 (기본 60분 간격)
- ✅ MongoDB에 자동 저장 (중복 방지)
- ✅ RESTful API 제공
- ✅ APScheduler로 스케줄링
- ✅ Beautiful Soup 4 기반 파싱
- ✅ Docker 지원

## 실행 방법

### Docker Compose (권장)

```bash
# 크롤러만 실행
docker-compose up crawler

# 전체 스택 실행
docker-compose up

# 백그라운드 실행
docker-compose up -d crawler
```

### 로컬 실행

```bash
cd crawler

# 가상 환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일 수정

# 실행
uvicorn main:app --reload
```

## API 엔드포인트

### 헬스 체크
```
GET /api/health
```

### 최근 게시글 조회
```
GET /api/posts?limit=100&hours=24
```

### 수동 크롤링 트리거
```
POST /api/crawl/trigger
```

### 통계 조회
```
GET /api/stats
```

### API 문서
```
http://localhost:8000/docs
```

## 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `MONGODB_URL` | MongoDB 연결 URL | `mongodb://mongodb:27017` |
| `MONGODB_DB_NAME` | 데이터베이스 이름 | `dnf_insight` |
| `CRAWL_INTERVAL_MINUTES` | 크롤링 주기 (분) | `60` |
| `TARGET_SITE_URL` | 크롤링 대상 URL | 필수 설정 |
| `OPENAI_API_KEY` | OpenAI API 키 (선택) | - |
| `ANTHROPIC_API_KEY` | Claude API 키 (선택) | - |

## 커스터마이징

### 크롤링 대상 사이트 변경

`app/services/crawler.py`의 `_parse_posts()` 메서드를 수정:

```python
def _parse_posts(self, soup: BeautifulSoup, base_url: str) -> List[CommunityPost]:
    # CSS 선택자를 대상 사이트에 맞게 수정
    post_elements = soup.select(".your-site-post-selector")

    for element in post_elements:
        title = element.select_one(".title").get_text(strip=True)
        # ...
```

### 크롤링 주기 변경

`.env` 파일에서 설정:
```
CRAWL_INTERVAL_MINUTES=30  # 30분마다
```

## 프로젝트 구조

```
crawler/
├── app/
│   ├── api/
│   │   └── routes.py       # API 라우트
│   ├── models/
│   │   └── post.py         # 데이터 모델
│   ├── services/
│   │   ├── crawler.py      # 크롤링 로직
│   │   └── scheduler.py    # 스케줄러
│   ├── config.py           # 설정
│   └── database.py         # MongoDB 연결
├── main.py                 # FastAPI 앱
├── requirements.txt
├── Dockerfile
└── README.md
```

## 다음 단계

1. **실제 커뮤니티 사이트 크롤링 구현**
   - `crawler.py`의 CSS 선택자를 실제 사이트에 맞게 수정
   - robots.txt 확인 및 준수
   - Rate Limiting 구현

2. **LLM 통합**
   - 크롤링된 텍스트를 Claude/OpenAI API로 분석
   - 감성 분석, 요약, 트렌드 분석

3. **워드클라우드 생성**
   - 한글 형태소 분석 (KoNLPy)
   - 빈도수 분석 후 프론트엔드로 JSON 반환

4. **Spring Boot 연동**
   - Spring Boot에서 크롤러 API 호출
   - 분석 결과를 프론트엔드에 제공
