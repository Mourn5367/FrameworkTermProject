package com.dnf.insight.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 스킬 정보 (네오플 API 응답)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillInfo {

    /**
     * 스킬 ID
     */
    private String skillId;

    /**
     * 스킬명
     */
    private String name;

    /**
     * 진화 타입 정보 (1번, 2번)
     */
    private List<EvolutionType> evolution;

    /**
     * 강화 타입 정보 (1번, 2번)
     */
    private List<EnhancementType> enhancement;

    /**
     * 진화 타입 (1번 또는 2번)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EvolutionType {
        private Integer type;
        private String name;
        private String desc;
        private String descDetail;
    }

    /**
     * 강화 타입 (1번 또는 2번)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EnhancementType {
        private Integer type;
        private List<Status> status;
    }

    /**
     * 강화 스탯 정보
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Status {
        private String name;
        private String value;
    }
}
