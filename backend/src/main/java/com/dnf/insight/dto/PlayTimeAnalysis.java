package com.dnf.insight.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * 접속 시간대 분석 DTO
 * - 최근 한 달 타임라인 기반
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayTimeAnalysis {

    /**
     * 평일 시간대별 활동 점수 (월~금)
     * Key: 시간대 (00-03, 03-06, ..., 21-24), Value: 가중치 합산 점수
     */
    private Map<String, Integer> weekdayActivity;

    /**
     * 주말 시간대별 활동 점수 (토~일)
     * Key: 시간대 (00-03, 03-06, ..., 21-24), Value: 가중치 합산 점수
     */
    private Map<String, Integer> weekendActivity;

    /**
     * 평일 가장 활발한 시간대
     */
    private String mostActiveWeekdayTimeRange;

    /**
     * 주말 가장 활발한 시간대
     */
    private String mostActiveWeekendTimeRange;

    /**
     * 총 활동 점수 (가중치 합산)
     */
    private Integer totalScore;

    /**
     * 분석 기간 (일)
     */
    private Integer analysisPeriodDays;

    /**
     * 일평균 활동 점수
     */
    private Double averageDailyScore;
}
