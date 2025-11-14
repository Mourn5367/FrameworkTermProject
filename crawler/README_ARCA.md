# 아카라이브 크롤링 가이드

## ⚠️ 현재 상황

아카라이브는 **403 Forbidden 에러**로 크롤링이 차단됩니다.
- Cloudflare 또는 WAF 사용
- 일반 HTTP 요청 차단
- 기본 Selenium도 차단 가능성 높음

## 🔧 해결 방법

### 방법 1: undetected-chromedriver (권장)

**파일:** `app/services/arca_crawler_undetected.py`

**특징:**
- Cloudflare/WAF 우회 특화
- 일반 Selenium보다 탐지 회피 능력 높음
- 자동 User-Agent 처리

**사용 방법:**

```python
# scheduler.py에서 교체
from app.services.arca_crawler_undetected import ArcaLiveCrawlerUndetected

arca_crawler = ArcaLiveCrawlerUndetected()
```

### 방법 2: 느린 속도 + Proxy

**Rate Limiting 증가:**
```python
# arca_crawler_undetected.py:16
self.rate_limit_delay = 30  # 30초로 증가
```

**Proxy 사용:**
```python
options.add_argument('--proxy-server=http://your-proxy:port')
```

### 방법 3: 로컬 브라우저 (Headless 끄기)

헤드리스 모드가 문제일 수 있음:

```python
# options.add_argument("--headless=new")  # 주석 처리
```

## 🧪 테스트

### 1. Docker 없이 로컬 테스트

```bash
cd crawler

# 가상 환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 테스트 실행
python test_arca_crawler.py
```

### 2. Docker Compose

```bash
docker-compose up --build crawler
docker-compose logs -f crawler
```

### 3. API로 테스트

```bash
# 크롤러 실행 후
curl -X POST "http://localhost:8000/api/crawl/trigger?site=arca&max_pages=1"
```

## 📊 성공 가능성

| 방법 | 성공률 | 난이도 | 비용 |
|------|--------|--------|------|
| undetected-chromedriver | 60-70% | 중간 | 무료 |
| Proxy + 느린 속도 | 40-50% | 중간 | 유료 (Proxy) |
| Headless 끄기 | 30-40% | 낮음 | 무료 |
| 공식 API (없음) | 0% | - | - |

## ⚡ 대안

### 1. 디시인사이드만 사용

디시인사이드는 **100% 안정적**으로 크롤링 가능합니다.

```python
# scheduler.py에서 아카라이브 비활성화
# arca_crawler = ArcaLiveCrawlerUndetected()  # 주석 처리
```

### 2. RSS/JSON 피드 확인

아카라이브에 RSS 피드가 있는지 확인:
```
https://arca.live/b/dunfa?output=rss
```

### 3. 사용자 요청 시에만 크롤링

주기적 크롤링 대신 사용자가 요청할 때만:
- 스케줄러에서 제외
- API 엔드포인트로만 접근

## 🚨 법적 고려사항

1. **robots.txt**: 크롤링 허용하지만 실제로는 WAF로 차단
2. **이용약관**: 자동화된 접근 금지 조항 확인 필요
3. **개인정보**: 작성자 정보 수집 시 주의

## 📝 권장 사항

**현재 상황에서는:**

1. **디시인사이드 dfip 갤러리**만 사용 (안정적)
2. 아카라이브는 **수동 트리거**로만 제공
3. 사용자에게 "아카라이브는 접근 제한으로 인해 불안정할 수 있음" 안내

**코드:**
```python
# scheduler.py
async def crawl_job():
    # 디시인사이드만 자동 크롤링
    dc_crawler = DCInsideCrawler()
    dc_posts = await dc_crawler.crawl_gallery(gallery_id="dfip", max_pages=3)

    # 아카라이브는 제외 (수동 트리거로만)
```

## 🔍 디버깅

403 에러 원인 파악:

```python
# 페이지 소스 저장
with open("arca_page.html", "w", encoding="utf-8") as f:
    f.write(self.driver.page_source)

# Cloudflare 차단 확인
if "Cloudflare" in self.driver.page_source:
    print("Cloudflare 차단 확인")
```

## 📞 문의

- 아카라이브 접근이 계속 차단된다면 디시인사이드만 사용하는 것을 권장합니다.
- undetected-chromedriver도 100% 보장은 아닙니다.
