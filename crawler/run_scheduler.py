import asyncio
import time
import signal
from app.database import connect_to_mongo, close_mongo_connection
from app.services.scheduler import start_scheduler, stop_scheduler

# 종료 시그널을 받았을 때 실행될 함수
def handle_exit(signum, frame):
    print("\n👋 종료 시그널 수신. 스케줄러를 안전하게 종료합니다...")
    stop_scheduler()
    # 비동기 함수인 close_mongo_connection을 실행하기 위해 asyncio.run 사용
    asyncio.run(close_mongo_connection())
    print("✅ 모든 리소스가 정리되었습니다. 안녕히 가세요!")
    exit(0)

async def main():
    # 애플리케이션 시작
    await connect_to_mongo()
    start_scheduler()

    # 시그널 핸들러 등록 (SIGINT, SIGTERM)
    signal.signal(signal.SIGINT, handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)

    print("⏳ 스케줄러가 실행 중입니다. 종료하려면 Ctrl+C를 누르세요.")

    # 스케줄러가 백그라운드에서 계속 실행되도록 유지
    try:
        # 이 루프는 스케줄러가 별도 스레드에서 돌기 때문에
        # 메인 스레드를 살려두는 역할만 합니다.
        while True:
            time.sleep(3600)  # 리소스 사용을 줄이기 위해 길게 대기
    except (KeyboardInterrupt, SystemExit):
        # handle_exit이 호출되므로 여기서는 특별히 할 일이 없음
        pass

if __name__ == "__main__":
    asyncio.run(main())
