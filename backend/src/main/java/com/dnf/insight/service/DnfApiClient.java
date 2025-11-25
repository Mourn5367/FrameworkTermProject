package com.dnf.insight.service;

import com.dnf.insight.config.DnfApiConfig;
import com.dnf.insight.dto.CharacterBasicResponse;
import com.dnf.insight.dto.CharacterFameResponse;
import com.dnf.insight.dto.CharacterSearchResponse;
import com.dnf.insight.dto.EquipmentResponse;
import com.dnf.insight.dto.SkillInfo;
import com.dnf.insight.dto.SkillStyleResponse;
import com.dnf.insight.dto.TimelineResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 던파 API 클라이언트
 * - WebClient 기반 API 호출
 * - ApiKeyManager를 통한 자동 키 전환
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DnfApiClient {

    private final WebClient webClient;
    private final ApiKeyManager apiKeyManager;
    private final DnfApiConfig dnfApiConfig;

    private static final DateTimeFormatter API_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    /**
     * 캐릭터 기본 정보 조회
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @return 캐릭터 기본 정보 (모험단명, 길드명 포함)
     */
    public CharacterBasicResponse getCharacterBasicInfo(String serverId, String characterId) {
        String apiKey = apiKeyManager.getAvailableApiKey();
        if (apiKey == null) {
            log.error("❌ No available API key for character basic info");
            throw new RuntimeException("All API keys exceeded rate limit");
        }

        String url = String.format("/df/servers/%s/characters/%s", serverId, characterId);

        try {
            CharacterBasicResponse response = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path(url)
                            .queryParam("apikey", apiKey)
                            .build())
                    .retrieve()
                    .bodyToMono(CharacterBasicResponse.class)
                    .block();

            log.info("✅ Character basic info retrieved: characterId={}, adventureName={}, guildName={}, fame={}",
                    characterId, response.getAdventureName(), response.getGuildName(), response.getFame());
            return response;

        } catch (WebClientResponseException e) {
            log.error("❌ Character basic info retrieval failed: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Character basic info retrieval failed: " + e.getMessage(), e);
        }
    }

    /**
     * 캐릭터 검색
     *
     * @param serverId 서버 ID (cain, diregie, siroco, prey, casillas, hilder, anton, bakal)
     * @param characterName 캐릭터 닉네임
     * @param wordType 검색 타입 ("match" 정확히 일치, "full" 포함)
     * @return 캐릭터 검색 결과
     */
    public CharacterSearchResponse searchCharacter(String serverId, String characterName, String wordType) {
        String apiKey = apiKeyManager.getAvailableApiKey();
        if (apiKey == null) {
            log.error("❌ No available API key for character search");
            throw new RuntimeException("All API keys exceeded rate limit");
        }

        String url = String.format("/df/servers/%s/characters", serverId);

        try {
            CharacterSearchResponse response = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path(url)
                            .queryParam("characterName", characterName)
                            .queryParam("wordType", wordType != null ? wordType : "match")
                            .queryParam("apikey", apiKey)
                            .build())
                    .retrieve()
                    .bodyToMono(CharacterSearchResponse.class)
                    .block();

            log.info("✅ Character search success: {} (server: {}, wordType: {})", characterName, serverId, wordType);
            return response;

        } catch (WebClientResponseException e) {
            log.error("❌ Character search failed: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Character search failed: " + e.getMessage(), e);
        }
    }

    /**
     * 타임라인 조회 (기본)
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @param limit 조회 개수 (기본: 100)
     * @return 타임라인 응답
     */
    public TimelineResponse getTimeline(String serverId, String characterId,
                                        LocalDateTime startDate, LocalDateTime endDate,
                                        Integer limit) {
        return getTimeline(serverId, characterId, startDate, endDate, limit, null, null);
    }

    /**
     * 타임라인 조회 (next 토큰 지원)
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @param limit 조회 개수 (기본: 100)
     * @param nextToken 다음 페이지 토큰 (100개 이상일 경우)
     * @param codes 이벤트 코드 필터 (쉼표로 구분, 예: "201,207,209")
     * @return 타임라인 응답
     */
    public TimelineResponse getTimeline(String serverId, String characterId,
                                        LocalDateTime startDate, LocalDateTime endDate,
                                        Integer limit, String nextToken, String codes) {
        String apiKey = apiKeyManager.getAvailableApiKey();
        if (apiKey == null) {
            log.error("❌ No available API key for timeline");
            throw new RuntimeException("All API keys exceeded rate limit");
        }

        String url = String.format("/df/servers/%s/characters/%s/timeline", serverId, characterId);
        String startDateStr = startDate.format(API_DATE_FORMATTER);
        String endDateStr = endDate.format(API_DATE_FORMATTER);

        log.info("📅 Timeline API call: startDate={} ({}), endDate={} ({})",
                startDate, startDateStr, endDate, endDateStr);

        try {
            TimelineResponse response = webClient.get()
                    .uri(uriBuilder -> {
                        var builder = uriBuilder
                                .path(url)
                                .queryParam("startDate", startDateStr)
                                .queryParam("endDate", endDateStr)
                                .queryParam("limit", limit != null ? limit : 100)
                                .queryParam("apikey", apiKey);

                        // next 토큰이 있으면 추가
                        if (nextToken != null && !nextToken.isEmpty()) {
                            builder.queryParam("next", nextToken);
                        }

                        // code 필터가 있으면 추가
                        if (codes != null && !codes.isEmpty()) {
                            builder.queryParam("code", codes);
                        }

                        return builder.build();
                    })
                    .retrieve()
                    .bodyToMono(TimelineResponse.class)
                    .block();

            log.info("✅ Timeline retrieved: characterId={}, items={}, hasNext={}",
                    characterId,
                    response.getTimeline().getRows() != null ? response.getTimeline().getRows().size() : 0,
                    response.getTimeline().getNext() != null);
            return response;

        } catch (WebClientResponseException e) {
            log.error("❌ Timeline retrieval failed: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Timeline retrieval failed: " + e.getMessage(), e);
        }
    }

    /**
     * 캐릭터 이미지 URL 생성
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @param zoom 확대 레벨 (1-3, 기본: 1)
     * @return 이미지 URL
     */
    public String getCharacterImageUrl(String serverId, String characterId, Integer zoom) {
        int zoomLevel = (zoom != null && zoom >= 1 && zoom <= 3) ? zoom : 1;
        return String.format("%s/df/servers/%s/characters/%s?zoom=%d",
                dnfApiConfig.getImageBaseUrl(), serverId, characterId, zoomLevel);
    }

    /**
     * 캐릭터 이미지 URL 생성 (기본 zoom=1)
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @return 이미지 URL
     */
    public String getCharacterImageUrl(String serverId, String characterId) {
        return getCharacterImageUrl(serverId, characterId, 1);
    }

    /**
     * 명성 기반 캐릭터 검색
     *
     * @param serverId 서버 ID (all 가능)
     * @param minFame 최소 명성 (nullable)
     * @param maxFame 최대 명성 (nullable)
     * @param jobId 직업 ID
     * @param jobGrowId 각성 직업 ID
     * @param limit 조회 개수 (기본: 100)
     * @return 캐릭터 목록 응답
     */
    public CharacterFameResponse getCharactersByFame(String serverId, Integer minFame, Integer maxFame,
                                                     String jobId, String jobGrowId, Integer limit) {
        String apiKey = apiKeyManager.getAvailableApiKey();
        if (apiKey == null) {
            log.error("❌ No available API key for characters-fame");
            throw new RuntimeException("All API keys exceeded rate limit");
        }

        String url = String.format("/df/servers/%s/characters-fame", serverId);

        try {
            CharacterFameResponse response = webClient.get()
                    .uri(uriBuilder -> {
                        // 필수 파라미터 추가 (항상 값이 존재)
                        var builder = uriBuilder
                                .path(url)
                                .queryParam("jobId", jobId)           // 필수: 직업 ID
                                .queryParam("jobGrowId", jobGrowId)   // 필수: 각성 직업 ID
                                .queryParam("limit", limit != null ? limit : 100)  // 기본값 100
                                .queryParam("apikey", apiKey);        // 필수: API 키

                        // 선택적 파라미터 처리 (null 체크 필수)
                        // ⚠️ 중요: null인 경우 파라미터를 아예 추가하지 않아야 함
                        // - queryParam("minFame", null) → URL에 "?minFame=null" 문자열로 전송되어 API 오류 발생
                        // - null 체크 후 조건부 추가 → null이면 파라미터 자체가 URL에 포함되지 않음 (정상)
                        //
                        // 예시:
                        // - null 체크 없이: /characters-fame?jobId=xxx&minFame=null&maxFame=null (❌ 오류)
                        // - null 체크 있음: /characters-fame?jobId=xxx (✅ 정상)
                        if (minFame != null) {
                            builder.queryParam("minFame", minFame);
                        }
                        if (maxFame != null) {
                            builder.queryParam("maxFame", maxFame);
                        }

                        return builder.build();
                    })
                    .retrieve()
                    .bodyToMono(CharacterFameResponse.class)
                    .block();

            log.info("✅ Characters-fame API success: found {} characters",
                    response.getRows() != null ? response.getRows().size() : 0);
            return response;

        } catch (Exception e) {
            log.error("❌ Characters-fame API failed: {}", e.getMessage());
            throw new RuntimeException("Failed to get characters by fame", e);
        }
    }

    /**
     * 장착 장비 조회
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @return 장비 정보
     */
    public EquipmentResponse getEquipment(String serverId, String characterId) {
        String apiKey = apiKeyManager.getAvailableApiKey();
        if (apiKey == null) {
            log.error("❌ No available API key for equipment");
            throw new RuntimeException("All API keys exceeded rate limit");
        }

        String url = String.format("/df/servers/%s/characters/%s/equip/equipment", serverId, characterId);

        try {
            EquipmentResponse response = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path(url)
                            .queryParam("apikey", apiKey)
                            .build())
                    .retrieve()
                    .bodyToMono(EquipmentResponse.class)
                    .block();

            log.info("✅ Equipment retrieved: characterId={}", characterId);
            return response;

        } catch (WebClientResponseException e) {
            log.error("❌ Equipment retrieval failed: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Equipment retrieval failed: " + e.getMessage(), e);
        }
    }

    /**
     * 스킬 특성 조회 (진화/강화)
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @return 스킬 특성 정보
     */
    public SkillStyleResponse getSkillStyle(String serverId, String characterId) {
        String apiKey = apiKeyManager.getAvailableApiKey();
        if (apiKey == null) {
            log.error("❌ No available API key for skill style");
            throw new RuntimeException("All API keys exceeded rate limit");
        }

        String url = String.format("/df/servers/%s/characters/%s/skill/style", serverId, characterId);

        try {
            SkillStyleResponse response = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path(url)
                            .queryParam("apikey", apiKey)
                            .build())
                    .retrieve()
                    .bodyToMono(SkillStyleResponse.class)
                    .block();

            log.info("✅ Skill style retrieved: characterId={}", characterId);
            return response;

        } catch (WebClientResponseException e) {
            log.error("❌ Skill style retrieval failed: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Skill style retrieval failed: " + e.getMessage(), e);
        }
    }

    /**
     * 스킬 상세 정보 조회
     *
     * @param jobId 직업 ID
     * @param skillId 스킬 ID
     * @return 스킬 정보 (진화/강화 정보 포함)
     */
    public SkillInfo getSkillInfo(String jobId, String skillId) {
        String apiKey = apiKeyManager.getAvailableApiKey();
        if (apiKey == null) {
            log.error("❌ No available API key for skill info");
            return null; // Rate limit 초과 시 null 반환
        }

        String url = String.format("/df/skills/%s/%s", jobId, skillId);

        try {
            SkillInfo response = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path(url)
                            .queryParam("apikey", apiKey)
                            .build())
                    .retrieve()
                    .bodyToMono(SkillInfo.class)
                    .block();

            log.debug("✅ Skill info retrieved: skillId={}", skillId);
            return response;

        } catch (WebClientResponseException e) {
            if (e.getStatusCode().value() == 404) {
                log.warn("⚠️ Skill not found: jobId={}, skillId={}", jobId, skillId);
                return null;
            }
            log.error("❌ Skill info retrieval failed: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            return null; // 오류 시 null 반환
        } catch (Exception e) {
            log.error("❌ Unexpected error retrieving skill info: {}", e.getMessage());
            return null;
        }
    }
}
