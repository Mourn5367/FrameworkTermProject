#!/bin/bash

# 백그라운드에서 스케줄러 실행 (-u 플래그로 버퍼링 비활성화)
echo "🚀 스케줄러를 백그라운드에서 시작합니다..."
python -u run_scheduler.py &

# 포그라운드에서 FastAPI 서버 실행
echo "🚀 FastAPI 서버를 포그라운드에서 시작합니다..."
exec uvicorn main:app --host 0.0.0.0 --port 8000
