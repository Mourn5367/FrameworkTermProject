# nodriver를 사용한 Cloudflare 우회 (2025년 최신)

## 🎯 nodriver란?

**nodriver**는 2025년 현재 가장 효과적인 Cloudflare 우회 도구입니다.

### 특징
- ✅ **undetected-chromedriver의 공식 후속작** (같은 개발자)
- ✅ **Chrome DevTools Protocol 직접 통신** (Selenium 없음)
- ✅ **탐지 흔적 제거** (WebDriver 패치 불필요)
- ✅ **Cloudflare 자동 우회** (`tab.cf_verify()`)
- ✅ **비동기 기반** (빠른 성능)

## 📦 설치

```bash
pip install nodriver
pip install opencv-python  # Cloudflare CAPTCHA 자동 해결용
```

## 🚀 사용 방법

### 기본 사용

```python
import nodriver as uc

async def main():
    browser = await uc.start()
    page = await browser.get('https://arca.live/b/dunfa')

    # Cloudflare 자동 우회
    await page.cf_verify()

    # HTML 가져오기
    html = await page.get_content()

if __name__ == '__main__':
    uc.loop().run_until_complete(main())
```

### 아카라이브 크롤링 예제

```python
from app.services.arca_crawler_nodriver import ArcaLiveCrawlerNoDriver

# 비동기 함수에서
crawler = ArcaLiveCrawlerNoDriver()
posts = await crawler.crawl_board(board_id="dunfa", max_pages=2)
```

## 🧪 테스트

```bash
cd crawler
python test_nodriver_arca.py
```

## 📊 성공률

| 도구 | Cloudflare 우회율 | 속도 | 안정성 |
|------|------------------|------|--------|
| **nodriver** | **80-90%** | 중간 | 높음 |
| undetected-chromedriver | 60-70% | 중간 | 중간 |
| Selenium 기본 | 0-10% | 빠름 | 낮음 |
| Beautiful Soup | 0% | 매우 빠름 | - |

## ⚙️ 설정

### Headless 모드

```python
browser = await uc.start(headless=True)  # 백그라운드 실행
```

### Cloudflare CAPTCHA 자동 해결

```python
await tab.cf_verify()  # 자동으로 체크박스 클릭
```

**주의**: opencv-python이 설치되어 있어야 합니다.

## 🐛 문제 해결

### 1. 403 에러 계속 발생

```python
# Rate Limiting 증가
self.rate_limit_delay = 20  # 20초로 증가
```

### 2. 브라우저 시작 실패

```bash
# Chrome 설치 확인
chromium --version

# 없으면 설치
sudo apt install chromium chromium-driver
```

### 3. OpenCV 에러

```bash
# OpenCV 의존성 설치 (Docker)
apt-get install -y libgl1-mesa-glx libglib2.0-0
```

## 📝 장단점

### 장점
- ✅ 최신 Cloudflare 우회 기술
- ✅ Selenium보다 탐지율 낮음
- ✅ 자동 CAPTCHA 해결
- ✅ 비동기 기반으로 빠름

### 단점
- ⚠️ Turnstile CAPTCHA는 여전히 어려움
- ⚠️ 100% 보장 없음 (Cloudflare 계속 업데이트)
- ⚠️ 리소스 사용량 높음 (Chrome 실행)
- ⚠️ 속도 느림 (Beautiful Soup 대비)

## 🔄 대안

### 1. 디시인사이드만 사용

안정적이고 빠른 크롤링:
```python
# scheduler.py에서 아카라이브 비활성화
# arca_crawler = ...  # 주석 처리
```

### 2. FlareSolverr (Docker)

Proxy 서버 방식:
```bash
docker run -d --name flaresolverr -p 8191:8191 21hsmw/flaresolverr:nodriver
```

### 3. SeleniumBase UC Mode

또 다른 대안:
```bash
pip install seleniumbase
```

## 📚 참고 자료

- GitHub: https://github.com/ultrafunkamsterdam/nodriver
- 2025 Cloudflare 우회 가이드: https://scrapfly.io/blog/posts/how-to-bypass-cloudflare-anti-scraping
- SeleniumBase: https://github.com/seleniumbase/SeleniumBase

## ⚖️ 법적 고려사항

1. **robots.txt 준수**: 아카라이브는 크롤링 허용하지만 WAF로 차단
2. **Rate Limiting**: 서버 부하 방지 (10-20초 간격)
3. **이용약관**: 자동화 접근 금지 조항 확인 필요
4. **개인정보**: 작성자 정보 수집 시 주의

## 🎯 권장 사항

**프로덕션 환경에서는:**

1. 디시인사이드를 메인으로 사용 (안정적)
2. 아카라이브는 보조적으로 사용
3. 실패 시 에러 핸들링 필수
4. 사용자에게 불안정성 안내

```python
try:
    arca_posts = await arca_crawler.crawl_board(...)
    if not arca_posts:
        print("⚠️  아카라이브 크롤링 실패 (계속 진행)")
except Exception as e:
    print(f"⚠️  아카라이브 에러: {e} (무시)")
    arca_posts = []
```
