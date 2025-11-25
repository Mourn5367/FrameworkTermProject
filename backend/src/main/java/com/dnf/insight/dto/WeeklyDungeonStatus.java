package com.dnf.insight.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 주간 던전 현황 DTO
 * - 목요일 06시 기준 리셋
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyDungeonStatus {

    /**
     * 현재 주 시작 시간 (목요일 06:00)
     */
    private LocalDateTime weekStartTime;

    /**
     * 던전 클리어 현황 목록
     */
    private List<DungeonClearStatus> dungeons;

    /**
     * 던전별 입장 횟수
     * Key: 던전명, Value: 입장 횟수
     */
    private Map<String, Integer> dungeonEntries;

    /**
     * 금주 획득 등급별 개수
     * Key: 등급 (에픽, 레전더리, 태초), Value: 개수
     */
    private Map<String, Integer> thisWeekItemsByGrade;

    /**
     * 전주 획득 등급별 개수
     * Key: 등급 (에픽, 레전더리, 태초), Value: 개수
     */
    private Map<String, Integer> lastWeekItemsByGrade;

    /**
     * 주간 던전 총 입장 횟수
     */
    private Integer totalEntries;

    /**
     * 던전 클리어 상태
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DungeonClearStatus {
        private String name;        // 던전명
        private Boolean cleared;    // 클리어 여부
        private Integer count;      // 클리어 횟수
    }
}
