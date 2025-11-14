package com.dnf.insight.config;

import lombok.Getter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * 던파 API 설정
 * - 여러 개의 API 키 관리
 * - Rate Limiting 설정
 */
@Getter
@Configuration
@ConfigurationProperties(prefix = "dnf.api")
public class DnfApiConfig {

    /**
     * API 키 목록 (쉼표로 구분)
     */
    private List<String> keys;

    /**
     * API Base URL
     */
    private String baseUrl = "https://api.neople.co.kr";

    /**
     * 이미지 API Base URL
     */
    private String imageBaseUrl = "https://img-api.neople.co.kr";

    /**
     * Rate Limiting 설정
     */
    private RateLimitConfig rateLimit = new RateLimitConfig();

    /**
     * 캐싱 설정
     */
    private CacheConfig cache = new CacheConfig();

    public void setKeys(List<String> keys) {
        this.keys = keys;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public void setImageBaseUrl(String imageBaseUrl) {
        this.imageBaseUrl = imageBaseUrl;
    }

    public void setRateLimit(RateLimitConfig rateLimit) {
        this.rateLimit = rateLimit;
    }

    public void setCache(CacheConfig cache) {
        this.cache = cache;
    }

    @Getter
    public static class RateLimitConfig {
        /**
         * 1초당 최대 요청 수 (기본: 1000)
         */
        private int perSecond = 1000;

        /**
         * 1분당 최대 요청 수 (기본: 60,000)
         */
        private int perMinute = 60000;

        /**
         * 1시간당 최대 요청 수 (기본: 3,600,000)
         */
        private int perHour = 3600000;

        public void setPerSecond(int perSecond) {
            this.perSecond = perSecond;
        }

        public void setPerMinute(int perMinute) {
            this.perMinute = perMinute;
        }

        public void setPerHour(int perHour) {
            this.perHour = perHour;
        }
    }

    @Getter
    public static class CacheConfig {
        /**
         * 타임라인 캐시 만료 시간 (초, 기본: 300 = 5분)
         */
        private int timelineTtl = 300;

        /**
         * 캐릭터 정보 캐시 만료 시간 (초, 기본: 300 = 5분)
         */
        private int characterTtl = 300;

        public void setTimelineTtl(int timelineTtl) {
            this.timelineTtl = timelineTtl;
        }

        public void setCharacterTtl(int characterTtl) {
            this.characterTtl = characterTtl;
        }
    }
}
