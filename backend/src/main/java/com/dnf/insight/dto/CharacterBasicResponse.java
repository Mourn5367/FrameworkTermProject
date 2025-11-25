package com.dnf.insight.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 캐릭터 기본 정보 응답 DTO
 * API: /df/servers/{serverId}/characters/{characterId}
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CharacterBasicResponse {

    /**
     * 서버 ID
     */
    @JsonProperty("serverId")
    private String serverId;

    /**
     * 캐릭터 ID
     */
    @JsonProperty("characterId")
    private String characterId;

    /**
     * 캐릭터 닉네임
     */
    @JsonProperty("characterName")
    private String characterName;

    /**
     * 레벨
     */
    @JsonProperty("level")
    private Integer level;

    /**
     * 직업 ID
     */
    @JsonProperty("jobId")
    private String jobId;

    /**
     * 직업 성장 ID
     */
    @JsonProperty("jobGrowId")
    private String jobGrowId;

    /**
     * 직업명
     */
    @JsonProperty("jobName")
    private String jobName;

    /**
     * 직업 성장명 (전직명)
     */
    @JsonProperty("jobGrowName")
    private String jobGrowName;

    /**
     * 모험단명
     */
    @JsonProperty("adventureName")
    private String adventureName;

    /**
     * 길드 ID
     */
    @JsonProperty("guildId")
    private String guildId;

    /**
     * 길드명
     */
    @JsonProperty("guildName")
    private String guildName;

    /**
     * 명성 (추가)
     */
    @JsonProperty("fame")
    private Integer fame;
}
