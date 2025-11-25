package com.dnf.insight.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 캐릭터 장비 + 스킬 스냅샷
 * - serverId + characterId 기준으로 upsert
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "character_equipments")
@CompoundIndex(name = "character_idx", def = "{'serverId': 1, 'characterId': 1}", unique = true)
public class CharacterEquipment {

    @Id
    private String id;

    /**
     * 서버 ID
     */
    private String serverId;

    /**
     * 캐릭터 ID
     */
    private String characterId;

    /**
     * 캐릭터 닉네임
     */
    private String characterName;

    /**
     * 직업 ID (jobId)
     */
    private String jobId;

    /**
     * 각성 직업 ID (jobGrowId)
     */
    private String jobGrowId;

    /**
     * 직업명 (예: 귀검사(남))
     */
    private String jobName;

    /**
     * 각성 직업명 (예: 眞 웨펀마스터)
     */
    private String jobGrowName;

    /**
     * 명성
     */
    private Integer fame;

    // ========== 장비 (13개 슬롯) ==========

    /**
     * 무기 정보 (itemId, itemName, itemTypeDetail, tuneName)
     */
    private WeaponSlot weapon;

    /**
     * 칭호 정보 (itemId, itemName)
     */
    private EquipmentSlot title;

    /**
     * 상의 (장비 + 융합석)
     */
    private EquipmentSlot jacket;

    /**
     * 머리어깨 (장비 + 융합석)
     */
    private EquipmentSlot headShoulder;

    /**
     * 하의 (장비 + 융합석)
     */
    private EquipmentSlot pants;

    /**
     * 신발 (장비 + 융합석)
     */
    private EquipmentSlot shoes;

    /**
     * 벨트 (장비 + 융합석)
     */
    private EquipmentSlot belt;

    /**
     * 목걸이 (장비 + 융합석)
     */
    private EquipmentSlot necklace;

    /**
     * 팔찌 (장비 + 융합석)
     */
    private EquipmentSlot bracelet;

    /**
     * 반지 (장비 + 융합석)
     */
    private EquipmentSlot ring;

    /**
     * 보조장비 (장비 + 융합석)
     */
    private EquipmentSlot subEquipment;

    /**
     * 마법석 (장비 + 융합석)
     */
    private EquipmentSlot magicStone;

    /**
     * 귀걸이 (장비 + 융합석)
     */
    private EquipmentSlot earring;

    /**
     * 세트 아이템 ID
     */
    private String setItemId;

    /**
     * 세트 아이템명
     */
    private String setItemName;

    // ========== 스킬 특성 ==========

    /**
     * 진화 스킬 목록
     */
    private List<SkillStyle> evolution;

    /**
     * 강화 스킬 목록
     */
    private List<SkillStyle> enhancement;

    /**
     * 크롤링 시각
     */
    private LocalDateTime crawledAt;

    // ========== 내부 클래스 ==========

    /**
     * 무기 슬롯 (itemId, itemName, itemTypeDetail, tuneName)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeaponSlot {
        private String itemId;
        private String itemName;
        private String itemTypeDetail;
        private String tuneName;          // 튠 이름 (예: 새겨진 해일의 기억)
    }

    /**
     * 일반 장비 슬롯 (장비 자체 + 융합석 + 세트)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EquipmentSlot {
        private String itemId;           // 장비 자체
        private String itemName;         // 장비 자체
        private String setItemId;        // 세트 아이템 ID
        private String setItemName;      // 세트 아이템 이름
        private String upgradeItemId;    // 융합석 (upgradeInfo)
        private String upgradeItemName;  // 융합석 (upgradeInfo)
    }

    /**
     * 스킬 특성 (진화/강화)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkillStyle {
        private String skillId;
        private Integer type;
    }
}
