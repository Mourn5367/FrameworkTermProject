package com.dnf.insight.service;

import com.dnf.insight.config.DnfApiConfig;
import com.dnf.insight.dto.CharacterSearchResponse;
import com.dnf.insight.dto.PlayTimeAnalysis;
import com.dnf.insight.dto.WeeklyDungeonStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * 캐릭터 비즈니스 로직 서비스
 * - 캐릭터 검색
 * - 타임라인 분석
 * - Redis 캐싱 (5분)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CharacterService {

    private final DnfApiClient dnfApiClient;
    private final TimelineAnalysisService timelineAnalysisService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final DnfApiConfig dnfApiConfig;

    private static final String CHARACTER_CACHE_PREFIX = "dnf:character:";
    private static final String WEEKLY_DUNGEON_CACHE_PREFIX = "dnf:weekly_dungeon:";
    private static final String PLAYTIME_CACHE_PREFIX = "dnf:playtime:";

    /**
     * 캐릭터 기본 정보 조회 (characterName, jobId, jobGrowId)
     * 검색 API로 단일 캐릭터 정보 추출
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @return 캐릭터 기본 정보
     */
    public CharacterSearchResponse.CharacterInfo getCharacterInfo(String serverId, String characterId) {
        // 캐릭터 검색 API는 characterName으로만 조회 가능
        // characterId로 직접 조회는 불가능하므로, 기존에 캐싱된 데이터 활용
        // 또는 별도 API 호출 필요 (현재는 간단히 빈 객체 반환)
        // TODO: 실제로는 /df/servers/{serverId}/characters/{characterId} 엔드포인트가 필요
        log.warn("⚠️ getCharacterInfo() is not fully implemented. Returning mock data.");

        // Mock 데이터 (실제로는 API 호출 필요)
        CharacterSearchResponse.CharacterInfo row = new CharacterSearchResponse.CharacterInfo();
        row.setServerId(serverId);
        row.setCharacterId(characterId);
        row.setCharacterName("Unknown");
        row.setJobId("unknown");
        row.setJobGrowId("unknown");
        return row;
    }

    /**
     * 캐릭터 검색 (캐싱 지원)
     *
     * @param serverId 서버 ID
     * @param characterName 캐릭터 닉네임
     * @return 캐릭터 검색 결과
     */
    public CharacterSearchResponse searchCharacter(String serverId, String characterName) {
        String cacheKey = CHARACTER_CACHE_PREFIX + serverId + ":" + characterName;

        // 캐시 확인
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached instanceof CharacterSearchResponse) {
            log.info("✅ Cache hit: character search ({}:{})", serverId, characterName);
            return (CharacterSearchResponse) cached;
        }

        // API 호출
        CharacterSearchResponse response = dnfApiClient.searchCharacter(serverId, characterName);

        // 캐시 저장 (5분)
        redisTemplate.opsForValue().set(
                cacheKey,
                response,
                dnfApiConfig.getCache().getCharacterTtl(),
                TimeUnit.SECONDS
        );

        log.info("✅ Cache stored: character search ({}:{})", serverId, characterName);
        return response;
    }

    /**
     * 주간 던전 현황 조회 (캐싱 지원)
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @return 주간 던전 현황
     */
    public WeeklyDungeonStatus getWeeklyDungeonStatus(String serverId, String characterId) {
        String cacheKey = WEEKLY_DUNGEON_CACHE_PREFIX + serverId + ":" + characterId;

        // 캐시 확인
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached instanceof WeeklyDungeonStatus) {
            log.info("✅ Cache hit: weekly dungeon ({}:{})", serverId, characterId);
            return (WeeklyDungeonStatus) cached;
        }

        // 분석 수행
        WeeklyDungeonStatus status = timelineAnalysisService.analyzeWeeklyDungeons(serverId, characterId);

        // 캐시 저장 (5분)
        redisTemplate.opsForValue().set(
                cacheKey,
                status,
                dnfApiConfig.getCache().getTimelineTtl(),
                TimeUnit.SECONDS
        );

        log.info("✅ Cache stored: weekly dungeon ({}:{})", serverId, characterId);
        return status;
    }

    /**
     * 접속 시간대 패턴 조회 (캐싱 지원)
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @return 시간대별 활동 패턴
     */
    public PlayTimeAnalysis getPlayTimeAnalysis(String serverId, String characterId) {
        String cacheKey = PLAYTIME_CACHE_PREFIX + serverId + ":" + characterId;

        // 캐시 확인
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached instanceof PlayTimeAnalysis) {
            log.info("✅ Cache hit: playtime analysis ({}:{})", serverId, characterId);
            return (PlayTimeAnalysis) cached;
        }

        // 분석 수행
        PlayTimeAnalysis analysis = timelineAnalysisService.analyzePlayTime(serverId, characterId);

        // 캐시 저장 (5분)
        redisTemplate.opsForValue().set(
                cacheKey,
                analysis,
                dnfApiConfig.getCache().getTimelineTtl(),
                TimeUnit.SECONDS
        );

        log.info("✅ Cache stored: playtime analysis ({}:{})", serverId, characterId);
        return analysis;
    }

    /**
     * 캐릭터 이미지 URL 생성
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @param zoom 확대 레벨 (1-3)
     * @return 이미지 URL
     */
    public String getCharacterImageUrl(String serverId, String characterId, Integer zoom) {
        return dnfApiClient.getCharacterImageUrl(serverId, characterId, zoom);
    }

    /**
     * 캐시 무효화 (특정 캐릭터)
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     */
    public void invalidateCache(String serverId, String characterId) {
        redisTemplate.delete(WEEKLY_DUNGEON_CACHE_PREFIX + serverId + ":" + characterId);
        redisTemplate.delete(PLAYTIME_CACHE_PREFIX + serverId + ":" + characterId);
        log.info("🗑️ Cache invalidated: {}:{}", serverId, characterId);
    }

    /**
     * 캐시 무효화 (캐릭터 검색)
     *
     * @param serverId 서버 ID
     * @param characterName 캐릭터 닉네임
     */
    public void invalidateSearchCache(String serverId, String characterName) {
        redisTemplate.delete(CHARACTER_CACHE_PREFIX + serverId + ":" + characterName);
        log.info("🗑️ Search cache invalidated: {}:{}", serverId, characterName);
    }
}
