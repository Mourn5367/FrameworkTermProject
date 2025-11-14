package com.dnf.insight.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 던파 API 명성 기반 캐릭터 검색 응답
 * GET /df/servers/{serverId}/characters-fame
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CharacterFameResponse {

    /**
     * 명성 범위
     */
    private FameRange fame;

    /**
     * 캐릭터 목록
     */
    private List<CharacterRow> rows;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FameRange {
        private Integer min;
        private Integer max;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CharacterRow {
        private String serverId;
        private String characterId;
        private String characterName;
        private Integer level;
        private String jobId;
        private String jobName;
        private String jobGrowId;
        private String jobGrowName;
        private Integer fame;
    }
}
