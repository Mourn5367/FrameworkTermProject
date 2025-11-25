package com.dnf.insight.dto.auction;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * 네오플 경매장 API 목록 응답 래퍼
 */
@Data
public class AuctionListResponse {

    @JsonProperty("rows")
    private List<AuctionItemResponse> rows;
}
