# 크롤링 설정 가이드

## 📁 설정 파일 위치

**모든 크롤링 설정은 한 파일에서 관리됩니다:**

```
app/config/crawler_config.py
```

## ⚙️ 설정 방법

### 1. 크롤링 주기 변경

```python
# app/config/crawler_config.py

scheduler = SchedulerSettings(
    enabled=True,
    interval_minutes=30,      # ⭐ 30분마다 크롤링
    run_on_startup=True,
    concurrent_crawling=False
)
```

**옵션:**
- `interval_minutes`: 크롤링 주기 (분 단위)
  - `15` - 15분마다 (빠른 업데이트)
  - `30` - 30분마다 (권장)
  - `60` - 1시간마다 (기본값)
  - `120` - 2시간마다 (느린 업데이트)

### 2. 디시인사이드 설정

```python
dcinside = DCInsideSettings(
    enabled=True,              # ⭐ 활성화/비활성화
    max_pages=5,               # ⭐ 크롤링할 페이지 수 (1-10 권장)
    rate_limit_seconds=3,      # ⭐ 페이지 간 대기 시간 (초)
    timeout_seconds=10,        # HTTP 타임아웃
    retry_count=2,             # 실패 시 재시도 횟수
    gallery_id="dfip"          # ⭐ 갤러리 ID
)
```

**예시:**
```python
# 더 빠르게 크롤링
dcinside = DCInsideSettings(
    max_pages=5,
    rate_limit_seconds=3,  # 3초 간격
)

# 더 느리고 안전하게
dcinside = DCInsideSettings(
    max_pages=2,
    rate_limit_seconds=10,  # 10초 간격
)

# 다른 갤러리 크롤링
dcinside = DCInsideSettings(
    gallery_id="mini",  # 미니갤
)
```

### 3. 아카라이브 설정

```python
arca = ArcaLiveSettings(
    enabled=True,                    # ⭐ 활성화/비활성화
    max_pages=2,                     # ⭐ 크롤링할 페이지 수
    rate_limit_seconds=15,           # ⭐ 페이지 간 대기 시간 (초)
    timeout_seconds=20,              # 페이지 로딩 타임아웃
    retry_count=2,                   # 실패 시 재시도 횟수
    board_id="dunfa",                # ⭐ 게시판 ID
    headless=True,                   # 헤드리스 모드 (백그라운드)
    use_cloudflare_bypass=True       # Cloudflare 자동 우회
)
```

**예시:**
```python
# 403 에러가 자주 발생한다면
arca = ArcaLiveSettings(
    max_pages=1,              # 페이지 수 줄임
    rate_limit_seconds=30,    # 30초로 느리게
    timeout_seconds=30,
)

# 디버깅용 (브라우저 보기)
arca = ArcaLiveSettings(
    headless=False,  # 브라우저 창이 보임
)

# Cloudflare 우회 비활성화
arca = ArcaLiveSettings(
    use_cloudflare_bypass=False,
)
```

## 🎯 실전 설정 예시

### 프로덕션 (안정적)

```python
class CrawlerConfig:
    scheduler = SchedulerSettings(
        interval_minutes=60,      # 1시간마다
        run_on_startup=True,
    )

    dcinside = DCInsideSettings(
        enabled=True,
        max_pages=3,
        rate_limit_seconds=5,
        gallery_id="dfip"
    )

    arca = ArcaLiveSettings(
        enabled=True,
        max_pages=2,
        rate_limit_seconds=15,
        board_id="dunfa"
    )
```

### 개발/테스트 (빠르게)

```python
class CrawlerConfig:
    scheduler = SchedulerSettings(
        interval_minutes=5,       # 5분마다 (테스트용)
        run_on_startup=True,
    )

    dcinside = DCInsideSettings(
        enabled=True,
        max_pages=1,              # 1페이지만
        rate_limit_seconds=2,
    )

    arca = ArcaLiveSettings(
        enabled=False,            # 비활성화 (빠른 테스트)
    )
```

### 디시인사이드만 사용

```python
class CrawlerConfig:
    scheduler = SchedulerSettings(
        interval_minutes=30,
    )

    dcinside = DCInsideSettings(
        enabled=True,
        max_pages=5,
        rate_limit_seconds=3,
    )

    arca = ArcaLiveSettings(
        enabled=False,            # ⭐ 아카라이브 비활성화
    )
```

## 📊 설정 값 가이드

### Rate Limiting (페이지 간 대기 시간)

| 값 | 속도 | 안정성 | 권장 용도 |
|----|------|--------|-----------|
| 2-3초 | 빠름 | 낮음 | 테스트 |
| 5초 | 보통 | 중간 | 디시인사이드 |
| 10-15초 | 느림 | 높음 | 아카라이브 |
| 20-30초 | 매우 느림 | 매우 높음 | 403 에러 발생 시 |

### Max Pages (크롤링할 페이지 수)

| 값 | 게시글 수 (예상) | 소요 시간 | 권장 |
|----|-----------------|----------|------|
| 1 | ~25개 | 빠름 | 테스트 |
| 2-3 | ~50-75개 | 보통 | 기본값 |
| 5 | ~125개 | 느림 | 많은 데이터 |
| 10+ | ~250개+ | 매우 느림 | 비권장 |

## 🔧 설정 확인 방법

### 1. 로그에서 확인

크롤러 시작 시 설정 요약이 출력됩니다:

```
============================================================
📋 크롤링 설정 요약
============================================================

🕐 스케줄러:
   - 활성화: True
   - 주기: 60분마다
   - 시작 시 실행: True

🔵 디시인사이드:
   - 활성화: True
   - 갤러리: dfip
   - 페이지 수: 3
   - 대기 시간: 5초

🟣 아카라이브:
   - 활성화: True
   - 게시판: dunfa
   - 페이지 수: 2
   - 대기 시간: 10초
   - Cloudflare 우회: True

============================================================
```

### 2. Python 코드로 확인

```python
from app.config.crawler_config import config

print(config.summary())
print(f"디시인사이드 활성화: {config.dcinside.enabled}")
print(f"크롤링 주기: {config.scheduler.interval_minutes}분")
```

## 🚨 주의사항

### 1. Rate Limiting을 너무 짧게 설정하지 마세요

```python
# ❌ 나쁜 예
rate_limit_seconds=0.5  # 너무 빠름 - 차단될 수 있음

# ✅ 좋은 예
rate_limit_seconds=5    # 적절한 속도
```

### 2. 너무 많은 페이지를 크롤링하지 마세요

```python
# ❌ 나쁜 예
max_pages=50  # 너무 많음 - 서버 부하, 차단 위험

# ✅ 좋은 예
max_pages=3   # 적절한 양
```

### 3. 아카라이브는 느리게 설정

```python
# ❌ 나쁜 예 (403 에러 발생 가능)
arca = ArcaLiveSettings(
    rate_limit_seconds=3,
    max_pages=5
)

# ✅ 좋은 예
arca = ArcaLiveSettings(
    rate_limit_seconds=15,
    max_pages=2
)
```

## 🔄 설정 변경 후

설정을 변경한 후에는 **서비스를 재시작**해야 합니다:

```bash
# Docker Compose
docker-compose restart crawler

# 로컬
# Ctrl+C로 종료 후 다시 실행
python main.py
```

## 📝 문제 해결

### 403 에러가 자주 발생

```python
# Rate Limiting 증가
rate_limit_seconds=20

# 페이지 수 감소
max_pages=1
```

### 크롤링이 너무 느림

```python
# 디시인사이드만 사용
arca.enabled = False

# Rate Limiting 감소 (주의!)
dcinside.rate_limit_seconds = 3
```

### 특정 사이트만 크롤링

```python
# 디시인사이드만
dcinside.enabled = True
arca.enabled = False

# 아카라이브만
dcinside.enabled = False
arca.enabled = True
```

## 🎯 권장 설정

**프로덕션 환경:**
- 크롤링 주기: 60분
- 디시 페이지: 3, Rate: 5초
- 아카 페이지: 2, Rate: 15초

**개발 환경:**
- 크롤링 주기: 5-10분
- 디시 페이지: 1-2, Rate: 3초
- 아카 비활성화 (빠른 테스트)
