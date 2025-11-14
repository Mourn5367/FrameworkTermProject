package com.dnf.insight.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 타임라인 응답 DTO
 * API: /df/servers/{serverId}/characters/{characterId}/timeline
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimelineResponse {

    @JsonProperty("serverId")
    private String serverId;

    @JsonProperty("characterId")
    private String characterId;

    @JsonProperty("characterName")
    private String characterName;

    @JsonProperty("level")
    private Integer level;

    @JsonProperty("jobId")
    private String jobId;

    @JsonProperty("jobGrowId")
    private String jobGrowId;

    @JsonProperty("jobName")
    private String jobName;

    @JsonProperty("jobGrowName")
    private String jobGrowName;

    @JsonProperty("fame")
    private Integer fame;

    @JsonProperty("adventureName")
    private String adventureName;

    @JsonProperty("guildId")
    private String guildId;

    @JsonProperty("guildName")
    private String guildName;

    @JsonProperty("timeline")
    private TimelineData timeline;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimelineData {
        /**
         * 조회 기간
         */
        @JsonProperty("date")
        private DateRange date;

        /**
         * 다음 페이지 토큰 (100개 이상일 경우)
         */
        @JsonProperty("next")
        private String next;

        /**
         * 타임라인 항목 리스트
         */
        @JsonProperty("rows")
        private List<TimelineRow> rows;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DateRange {
        /**
         * 시작 시간 (예: "2025-10-14 11:49")
         */
        @JsonProperty("start")
        private String start;

        /**
         * 종료 시간
         */
        @JsonProperty("end")
        private String end;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimelineRow {
        /**
         * 코드 (예: "던전", "아이템", "레벨업" 등)
         */
        @JsonProperty("code")
        private String code;

        /**
         * 상세 내용
         */
        @JsonProperty("data")
        private Object data;

        /**
         * 발생 시간
         */
        @JsonProperty("date")
        private String date;
    }
}
