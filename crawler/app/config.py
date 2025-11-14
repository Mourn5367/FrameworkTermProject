from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """애플리케이션 설정"""

    # MongoDB
    mongodb_url: str = "mongodb://mongodb:27017"
    mongodb_db_name: str = "dnf_insight"

    # 크롤링 설정
    crawl_interval_minutes: int = 60
    target_site_url: str = "https://example-community.com"

    # LLM API (선택)
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None

    # 환경
    environment: str = "development"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    """설정 객체를 캐싱하여 반환"""
    return Settings()
