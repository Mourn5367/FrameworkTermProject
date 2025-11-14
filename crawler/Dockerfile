FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성 설치 (Chrome + OpenCV + KoNLPy용)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    wget \
    gnupg \
    unzip \
    curl \
    chromium \
    chromium-driver \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    default-jdk \
    fonts-nanum \
    && rm -rf /var/lib/apt/lists/*

# Chrome 환경 변수 설정
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver
ENV DISPLAY=:99
ENV DBUS_SESSION_BUS_ADDRESS=/dev/null

# Python 의존성 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Playwright 브라우저 설치
RUN playwright install chromium
RUN playwright install-deps chromium || true

# 애플리케이션 코드 복사
COPY . .

# 포트 노출
EXPOSE 8000

# 실행 명령
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
