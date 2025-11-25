package com.dnf.insight.dto.auction;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * 네오플 경매장 API 응답 DTO (판매 완료)
 */
@Data
public class AuctionSoldResponse {

    @JsonProperty("soldDate")
    private String soldDate;  // "2025-11-25 09:14:18"

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

    @JsonProperty("count")
    private Integer count;

    @JsonProperty("price")
    private Long price;

    @JsonProperty("unitPrice")
    private Long unitPrice;
}
