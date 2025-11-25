package com.dnf.insight.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 캐릭터 검색 응답 DTO
 * API: /df/servers/{serverId}/characters
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CharacterSearchResponse {

    @JsonProperty("rows")
    private List<CharacterInfo> rows;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CharacterInfo {
        /**
         * 서버 ID (cain, diregie, siroco, prey, casillas, hilder, anton, bakal)
         */
        @JsonProperty("serverId")
        private String serverId;

        /**
         * 캐릭터 ID (고유 식별자)
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
         * 명성
         */
        @JsonProperty("fame")
        private Integer fame;

        /**
         * 모험단명
         */
        @JsonProperty("adventureName")
        private String adventureName;

        /**
         * 길드명
         */
        @JsonProperty("guildName")
        private String guildName;
    }
}
