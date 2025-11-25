package com.dnf.insight.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 직업별 장비 통계
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobEquipmentStats {

    /**
     * 직업 ID
     */
    private String jobId;

    /**
     * 각성 직업 ID
     */
    private String jobGrowId;

    /**
     * 직업명
     */
    private String jobName;

    /**
     * 각성 직업명
     */
    private String jobGrowName;

    /**
     * 분석한 캐릭터 수
     */
    private Integer totalCharacters;

    // ========== 무기 ==========

    /**
     * 무기 타입 통계 (itemTypeDetail: 낫, 대검 등)
     */
    private List<ItemStat> weaponTypes;

    /**
     * 튠 통계 (tuneName: 새겨진 해일의 기억 등)
     */
    private List<ItemStat> weaponTunes;

    // ========== 칭호 ==========

    /**
     * 칭호 통계 (itemId, itemName)
     */
    private List<ItemStat> titles;

    // ========== 방어구 융합석 (상의/하의/머리어깨/신발/벨트) ==========

    /**
     * 상의 융합석 통계
     */
    private List<ItemStat> jacketUpgrades;

    /**
     * 머리어깨 융합석 통계
     */
    private List<ItemStat> headShoulderUpgrades;

    /**
     * 하의 융합석 통계
     */
    private List<ItemStat> pantsUpgrades;

    /**
     * 신발 융합석 통계
     */
    private List<ItemStat> shoesUpgrades;

    /**
     * 벨트 융합석 통계
     */
    private List<ItemStat> beltUpgrades;

    /**
     * 방어구 융합석 조합 통계 (5부위의 기품/욕망/배신 개수)
     * 예: "기품 * 5, 욕망 * 0, 배신 * 0"
     */
    private List<CombinationStat> armorSetCombinations;

    // ========== 악세서리 융합석 (목걸이/팔찌/반지) ==========

    /**
     * 목걸이 융합석 통계
     */
    private List<ItemStat> necklaceUpgrades;

    /**
     * 팔찌 융합석 통계
     */
    private List<ItemStat> braceletUpgrades;

    /**
     * 반지 융합석 통계
     */
    private List<ItemStat> ringUpgrades;

    /**
     * 악세서리 조합 통계 (축복, 무지, 창조, 테아나 조합)
     * 예: "축복, 무지, 무지" (목걸이, 팔찌, 반지 순)
     */
    private List<CombinationStat> accessoryCombinations;

    // ========== 특수장비 융합석 (보조장비/마법석/귀걸이) ==========

    /**
     * 보조장비 융합석 통계
     */
    private List<ItemStat> subEquipmentUpgrades;

    /**
     * 마법석 융합석 통계
     */
    private List<ItemStat> magicStoneUpgrades;

    /**
     * 귀걸이 융합석 통계
     */
    private List<ItemStat> earringUpgrades;

    /**
     * 특수장비 조합 통계
     * 예: "아이템A, 아이템B, 아이템C" (보조장비, 마법석, 귀걸이 순)
     */
    private List<CombinationStat> specialEquipmentCombinations;

    // ========== 세트 아이템 ==========

    /**
     * 세트 아이템 통계 (setItemId, setItemName)
     */
    private List<ItemStat> setItems;

    // ========== 스킬 특성 ==========

    /**
     * 진화 스킬 통계 (skillId별)
     */
    private List<SkillStat> evolutionSkills;

    /**
     * 강화 스킬 통계 (skillId별)
     */
    private List<SkillStat> enhancementSkills;

    /**
     * 스킬 조합 통계 (진화 + 강화 세트)
     * 예: "패드스 드로우 - 듀얼 리액션 | 더블 건 호크 - 세퍼레이트"
     */
    private List<CombinationStat> skillCombinations;

    // ========== 내부 클래스 ==========

    /**
     * 아이템 통계 (itemId, itemName, 사용 비율)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemStat {
        private String itemId;
        private String itemName;
        private Integer count;         // 사용 인원 수
        private Double percentage;     // 사용 비율 (0.0 ~ 100.0)
    }

    /**
     * 스킬 통계 (skillId, 사용 비율)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkillStat {
        private String skillId;
        private String skillName;      // 스킬명
        private Integer count;         // 사용 인원 수
        private Double percentage;     // 사용 비율 (0.0 ~ 100.0)
        private Integer type1Count;    // Type 1 선택 인원 수
        private Integer type2Count;    // Type 2 선택 인원 수
        private Double type1Percentage; // Type 1 비율 (스킬 사용자 중)
        private Double type2Percentage; // Type 2 비율 (스킬 사용자 중)
        private String type1Name;      // Type 1 진화/강화 이름
        private String type2Name;      // Type 2 진화/강화 이름
    }

    /**
     * 조합 통계 (아이템 조합 또는 세트 조합)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CombinationStat {
        private String combination;    // 예: "축복, 무지, 무지" 또는 "아이템A, 아이템B, 아이템C"
        private Integer count;
        private Double percentage;
        private List<String> tags;     // 주요 장비 태그 (세트, 칭호, 무기해방 등)
    }
}
