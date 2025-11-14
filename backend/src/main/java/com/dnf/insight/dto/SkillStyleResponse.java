package com.dnf.insight.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 던파 API 스킬 특성 응답
 * GET /df/servers/{serverId}/characters/{characterId}/skill/style
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillStyleResponse {

    /**
     * 스킬 정보
     */
    private SkillInfo skill;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkillInfo {
        private StyleInfo style;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StyleInfo {
        /**
         * 진화 스킬 목록
         */
        private List<SkillStyleItem> evolution;

        /**
         * 강화 스킬 목록
         */
        private List<SkillStyleItem> enhancement;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkillStyleItem {
        private String skillId;
        private Integer type;
    }
}
