package com.dnf.insight.dto.auction;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * 네오플 아이템 검색 API 응답 DTO
 */
@Data
public class ItemSearchResponse {

    @JsonProperty("rows")
    private List<ItemInfo> rows;

    @Data
    public static class ItemInfo {
        @JsonProperty("itemId")
        private String itemId;

        @JsonProperty("itemName")
        private String itemName;

        @JsonProperty("itemRarity")
        private String itemRarity;

        @JsonProperty("itemType")
        private String itemType;

        @JsonProperty("itemTypeDetail")
        private String itemTypeDetail;

        @JsonProperty("itemAvailableLevel")
        private Integer itemAvailableLevel;

        @JsonProperty("itemObtainInfo")
        private String itemObtainInfo;

        @JsonProperty("itemExplain")
        private String itemExplain;

        @JsonProperty("itemExplainDetail")
        private String itemExplainDetail;

        @JsonProperty("itemFlavorText")
        private String itemFlavorText;
    }
}
