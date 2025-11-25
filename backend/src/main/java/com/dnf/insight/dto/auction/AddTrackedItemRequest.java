package com.dnf.insight.dto.auction;

import lombok.Data;

/**
 * 추적 아이템 추가 요청 DTO
 */
@Data
public class AddTrackedItemRequest {

    private String itemId;      // 아이템 ID (필수)
    private String itemName;    // 아이템명 (필수)
}
