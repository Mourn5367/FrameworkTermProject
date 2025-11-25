package com.dnf.insight.dto.auction;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * 네오플 경매장 API 판매 내역 목록 응답 래퍼
 */
@Data
public class AuctionSoldListResponse {

    @JsonProperty("rows")
    private List<AuctionSoldResponse> rows;
}
