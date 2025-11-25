package com.dnf.insight.dto.auction;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * 네오플 경매장 API 응답 DTO (현재 매물)
 */
@Data
public class AuctionItemResponse {

    @JsonProperty("auctionNo")
    private Long auctionNo;

    @JsonProperty("regDate")
    private String regDate;  // "2025-11-24 11:41:08"

    @JsonProperty("expireDate")
    private String expireDate;

    @JsonProperty("itemId")
    private String itemId;

    @JsonProperty("itemName")
    private String itemName;

    @JsonProperty("itemAvailableLevel")
    private Integer itemAvailableLevel;

    @JsonProperty("itemRarity")
    private String itemRarity;

    @JsonProperty("itemTypeId")
    private String itemTypeId;

    @JsonProperty("itemType")
    private String itemType;

    @JsonProperty("itemTypeDetailId")
    private String itemTypeDetailId;

    @JsonProperty("itemTypeDetail")
    private String itemTypeDetail;

    @JsonProperty("refine")
    private Integer refine;

    @JsonProperty("reinforce")
    private Integer reinforce;

    @JsonProperty("amplificationName")
    private String amplificationName;

    @JsonProperty("fame")
    private Integer fame;

    @JsonProperty("exchange")
    private ExchangeInfo exchange;

    @JsonProperty("count")
    private Integer count;

    @JsonProperty("regCount")
    private Integer regCount;

    @JsonProperty("price")
    private Long price;

    @JsonProperty("currentPrice")
    private Long currentPrice;

    @JsonProperty("unitPrice")
    private Long unitPrice;

    @JsonProperty("averagePrice")
    private Long averagePrice;

    @Data
    public static class ExchangeInfo {
        @JsonProperty("count")
        private Integer count;

        @JsonProperty("bindName")
        private String bindName;
    }
}
