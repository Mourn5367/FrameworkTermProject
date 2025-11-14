"""
크롤링 설정 중앙 관리
모든 크롤링 주기, Rate Limiting, 하이퍼파라미터를 한 곳에서 관리
"""

from dataclasses import dataclass
from typing import Dict


@dataclass
class CrawlerSettings:
    """크롤러별 설정"""
    enabled: bool = True           # 크롤러 활성화 여부
    max_pages: int = 2            # 크롤링할 최대 페이지 수
    rate_limit_seconds: int = 5   # 페이지 간 대기 시간 (초)
    timeout_seconds: int = 15     # 페이지 로딩 타임아웃 (초)
    retry_count: int = 3          # 실패 시 재시도 횟수


@dataclass
class DCInsideSettings(CrawlerSettings):
    """디시인사이드 크롤러 설정"""
    enabled: bool = True
    max_pages: int = 3
    rate_limit_seconds: int = 5
    timeout_seconds: int = 10
    retry_count: int = 2
    gallery_id: str = "dfip"      # 갤러리 ID


@dataclass
class ArcaLiveSettings(CrawlerSettings):
    """아카라이브 크롤러 설정 (nodriver)"""
    enabled: bool = True
    max_pages: int = 2
    rate_limit_seconds: int = 10  # 더 느리게 (Cloudflare 고려)
    timeout_seconds: int = 20     # 더 긴 타임아웃
    retry_count: int = 2
    board_id: str = "dunfa"       # 게시판 ID
    headless: bool = True         # 헤드리스 모드
    use_cloudflare_bypass: bool = True  # cf_verify() 사용 여부


@dataclass
class SchedulerSettings:
    """스케줄러 설정"""
    enabled: bool = True                    # 스케줄러 활성화 여부
    interval_minutes: int = 60             # 크롤링 주기 (분)
    run_on_startup: bool = True            # 시작 시 즉시 실행 여부
    concurrent_crawling: bool = False      # 동시 크롤링 (True) vs 순차 크롤링 (False)


class CrawlerConfig:
    """크롤링 설정 통합 관리 클래스"""

    # 스케줄러 설정
    scheduler = SchedulerSettings(
        enabled=True,
        interval_minutes=60,      # ⭐ 여기서 크롤링 주기 변경!
        run_on_startup=True,
        concurrent_crawling=False
    )

    # 디시인사이드 설정
    dcinside = DCInsideSettings(
        enabled=True,             # ⭐ 디시인사이드 활성화/비활성화
        max_pages=3,              # ⭐ 크롤링할 페이지 수
        rate_limit_seconds=5,     # ⭐ 페이지 간 대기 시간
        timeout_seconds=10,
        retry_count=2,
        gallery_id="dfip"         # ⭐ 갤러리 ID
    )

    # 아카라이브 설정
    arca = ArcaLiveSettings(
        enabled=True,             # ⭐ 아카라이브 활성화/비활성화
        max_pages=2,              # ⭐ 크롤링할 페이지 수
        rate_limit_seconds=10,    # ⭐ 페이지 간 대기 시간
        timeout_seconds=20,
        retry_count=2,
        board_id="dunfa",         # ⭐ 게시판 ID
        headless=True,
        use_cloudflare_bypass=True
    )

    @classmethod
    def get_enabled_crawlers(cls) -> Dict[str, CrawlerSettings]:
        """활성화된 크롤러 목록 반환"""
        crawlers = {}
        if cls.dcinside.enabled:
            crawlers["dcinside"] = cls.dcinside
        if cls.arca.enabled:
            crawlers["arca"] = cls.arca
        return crawlers

    @classmethod
    def summary(cls) -> str:
        """현재 설정 요약"""
        lines = [
            "=" * 60,
            "📋 크롤링 설정 요약",
            "=" * 60,
            "",
            "🕐 스케줄러:",
            f"   - 활성화: {cls.scheduler.enabled}",
            f"   - 주기: {cls.scheduler.interval_minutes}분마다",
            f"   - 시작 시 실행: {cls.scheduler.run_on_startup}",
            "",
            "🔵 디시인사이드:",
            f"   - 활성화: {cls.dcinside.enabled}",
            f"   - 갤러리: {cls.dcinside.gallery_id}",
            f"   - 페이지 수: {cls.dcinside.max_pages}",
            f"   - 대기 시간: {cls.dcinside.rate_limit_seconds}초",
            "",
            "🟣 아카라이브:",
            f"   - 활성화: {cls.arca.enabled}",
            f"   - 게시판: {cls.arca.board_id}",
            f"   - 페이지 수: {cls.arca.max_pages}",
            f"   - 대기 시간: {cls.arca.rate_limit_seconds}초",
            f"   - Cloudflare 우회: {cls.arca.use_cloudflare_bypass}",
            "",
            "=" * 60,
        ]
        return "\n".join(lines)


# 싱글톤 인스턴스
config = CrawlerConfig()
