package com.dnf.insight.service;

import com.dnf.insight.config.DnfApiConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * API 키 관리 및 Rate Limiting 서비스
 * - Redis Sliding Window 방식
 * - 1초/1분/1시간 단위 Rate Limit 체크
 * - 여러 API 키 자동 전환
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ApiKeyManager {

    private final RedisTemplate<String, Object> redisTemplate;
    private final DnfApiConfig dnfApiConfig;

    private static final String RATE_LIMIT_PREFIX = "dnf:rate_limit:";
    private static final String API_KEY_PREFIX = "dnf:api_keys:";

    /**
     * Redis에 API 키 목록 등록
     */
    @PostConstruct
    public void initApiKeys() {
        List<String> apiKeys = dnfApiConfig.getKeys();
        if (apiKeys == null || apiKeys.isEmpty()) {
            log.warn("⚠️ No API keys configured in application.yml");
            return;
        }

        for (int i = 0; i < apiKeys.size(); i++) {
            String key = API_KEY_PREFIX + i;
            redisTemplate.opsForValue().set(key, apiKeys.get(i));
        }

        log.info("✅ Initialized {} API keys in Redis", apiKeys.size());
    }

    /**
     * 사용 가능한 API 키 조회 (Rate Limit 체크)
     *
     * @return 사용 가능한 API 키 (없으면 null)
     */
    public String getAvailableApiKey() {
        List<String> apiKeys = dnfApiConfig.getKeys();
        if (apiKeys == null || apiKeys.isEmpty()) {
            log.error("❌ No API keys available");
            return null;
        }

        // 모든 API 키에 대해 Rate Limit 체크
        for (String apiKey : apiKeys) {
            if (checkRateLimit(apiKey)) {
                log.debug("✅ Using API key: {}...", maskApiKey(apiKey));
                return apiKey;
            }
        }

        log.warn("⚠️ All API keys exceeded rate limit");
        return null;
    }

    /**
     * Rate Limit 체크 (1초/1분/1시간)
     *
     * @param apiKey API 키
     * @return 사용 가능하면 true
     */
    private boolean checkRateLimit(String apiKey) {
        String keyHash = String.valueOf(apiKey.hashCode());

        // 1초 체크
        if (!checkAndIncrementLimit(keyHash, "second", 1, dnfApiConfig.getRateLimit().getPerSecond())) {
            log.debug("⚠️ API key {}... exceeded 1-second limit", maskApiKey(apiKey));
            return false;
        }

        // 1분 체크
        if (!checkAndIncrementLimit(keyHash, "minute", 60, dnfApiConfig.getRateLimit().getPerMinute())) {
            log.debug("⚠️ API key {}... exceeded 1-minute limit", maskApiKey(apiKey));
            return false;
        }

        // 1시간 체크
        if (!checkAndIncrementLimit(keyHash, "hour", 3600, dnfApiConfig.getRateLimit().getPerHour())) {
            log.debug("⚠️ API key {}... exceeded 1-hour limit", maskApiKey(apiKey));
            return false;
        }

        return true;
    }

    /**
     * Redis Sliding Window 방식 Rate Limit 체크 및 증가
     *
     * @param keyHash API 키 해시
     * @param unit 시간 단위 (second, minute, hour)
     * @param ttlSeconds TTL (초)
     * @param maxRequests 최대 요청 수
     * @return 허용 범위 내이면 true
     */
    private boolean checkAndIncrementLimit(String keyHash, String unit, int ttlSeconds, int maxRequests) {
        String redisKey = RATE_LIMIT_PREFIX + keyHash + ":" + unit;

        // 현재 카운트 조회
        Object countObj = redisTemplate.opsForValue().get(redisKey);
        Long currentCount = (countObj != null) ? Long.valueOf(countObj.toString()) : 0L;

        // 최대 요청 수 초과 여부 확인
        if (currentCount >= maxRequests) {
            return false;
        }

        // 카운트 증가
        Long newCount = redisTemplate.opsForValue().increment(redisKey);

        // 첫 요청이면 TTL 설정
        if (newCount != null && newCount == 1) {
            redisTemplate.expire(redisKey, Duration.ofSeconds(ttlSeconds));
        }

        return true;
    }

    /**
     * API 키 마스킹 (로그용)
     *
     * @param apiKey 원본 API 키
     * @return 마스킹된 키 (앞 4자리만 표시)
     */
    private String maskApiKey(String apiKey) {
        if (apiKey == null || apiKey.length() < 8) {
            return "****";
        }
        return apiKey.substring(0, 4) + "****";
    }

    /**
     * API 키별 현재 사용량 조회 (디버깅용)
     *
     * @param apiKey API 키
     * @return 사용량 정보 문자열
     */
    public String getRateLimitStatus(String apiKey) {
        String keyHash = String.valueOf(apiKey.hashCode());

        String secondKey = RATE_LIMIT_PREFIX + keyHash + ":second";
        String minuteKey = RATE_LIMIT_PREFIX + keyHash + ":minute";
        String hourKey = RATE_LIMIT_PREFIX + keyHash + ":hour";

        Object secondCount = redisTemplate.opsForValue().get(secondKey);
        Object minuteCount = redisTemplate.opsForValue().get(minuteKey);
        Object hourCount = redisTemplate.opsForValue().get(hourKey);

        Long secondTtl = redisTemplate.getExpire(secondKey, TimeUnit.SECONDS);
        Long minuteTtl = redisTemplate.getExpire(minuteKey, TimeUnit.SECONDS);
        Long hourTtl = redisTemplate.getExpire(hourKey, TimeUnit.SECONDS);

        return String.format(
                "API Key: %s\n" +
                "  - 1초: %s/%d (TTL: %ds)\n" +
                "  - 1분: %s/%d (TTL: %ds)\n" +
                "  - 1시간: %s/%d (TTL: %ds)",
                maskApiKey(apiKey),
                secondCount != null ? secondCount : 0, dnfApiConfig.getRateLimit().getPerSecond(), secondTtl != null ? secondTtl : 0,
                minuteCount != null ? minuteCount : 0, dnfApiConfig.getRateLimit().getPerMinute(), minuteTtl != null ? minuteTtl : 0,
                hourCount != null ? hourCount : 0, dnfApiConfig.getRateLimit().getPerHour(), hourTtl != null ? hourTtl : 0
        );
    }
}
