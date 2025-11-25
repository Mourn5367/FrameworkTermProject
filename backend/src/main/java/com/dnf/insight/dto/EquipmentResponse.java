package com.dnf.insight.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 던파 API 장착장비 응답
 * GET /df/servers/{serverId}/characters/{characterId}/equip/equipment
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentResponse {

    /**
     * 장비 목록
     */
    private List<EquipmentItem> equipment;

    /**
     * 세트 아이템 정보
     */
    private List<SetItemInfo> setItemInfo;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EquipmentItem {
        private String slotId;
        private String slotName;
        private String itemId;
        private String itemName;
        private String itemTypeDetail;
        private String setItemId;
        private String setItemName;

        /**
         * 무기 융합석 정보 (배열)
         */
        private List<TuneInfo> tune;

        /**
         * 방어구/악세 융합석 정보
         */
        private UpgradeInfo upgradeInfo;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TuneInfo {
        private String name;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpgradeInfo {
        private String itemId;
        private String itemName;
        private String itemRarity;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SetItemInfo {
        private String setItemId;
        private String setItemName;
    }
}
