package com.dnf.insight.dto.auction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 시세 그래프 데이터 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceChartResponse {

    private String itemId;
    private String itemName;

    private List<String> labels;           // 시간 (x축)
    private List<Long> avgPrices;          // 평균 매물가
    private List<Long> minPrices;          // 최저가
    private List<Long> maxPrices;          // 최고가
    private List<Long> soldAvgPrices;      // 평균 판매가
    private List<Integer> soldCounts;      // 판매 건수 (최근 24시간)
    private List<Integer> itemCounts;      // 매물 수
}
