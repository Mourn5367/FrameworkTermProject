package com.dnf.insight.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 장비 통계 MySQL 캐시
 * - jobId + jobGrowId 별로 통계 저장
 * - JSON 컬럼으로 복잡한 통계 구조 저장
 */
@Entity
@Table(name = "equipment_stats",
        uniqueConstraints = @UniqueConstraint(columnNames = {"job_id", "job_grow_id"}),
        indexes = {
                @Index(name = "idx_job_grow_name", columnList = "job_grow_name"),
                @Index(name = "idx_calculated_at", columnList = "calculated_at")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipmentStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id", nullable = false, length = 32)
    private String jobId;

    @Column(name = "job_grow_id", nullable = false, length = 32)
    private String jobGrowId;

    @Column(name = "job_name", nullable = false)
    private String jobName;

    @Column(name = "job_grow_name", nullable = false)
    private String jobGrowName;

    @Column(name = "total_characters")
    private Integer totalCharacters;

    // ========== JSON 컬럼 (15개) ==========

    /**
     * 무기 타입 통계
     * [{"itemName": "소태도", "count": 80, "percentage": 80.0}, ...]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "weapon_types", columnDefinition = "json")
    private List<Map<String, Object>> weaponTypes;

    /**
     * 무기 튠 통계
     * [{"itemName": "새겨진 해일의 기억", "count": 95, "percentage": 95.0}, ...]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "weapon_tunes", columnDefinition = "json")
    private List<Map<String, Object>> weaponTunes;

    /**
     * 칭호 통계
     * [{"itemId": "xxx", "itemName": "75Lv", "count": 90, "percentage": 90.0}, ...]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "titles", columnDefinition = "json")
    private List<Map<String, Object>> titles;

    /**
     * 방어구 융합석 통계 (5부위 합산, 100% 정규화)
     * [{"itemName": "기품", "count": 300, "percentage": 60.0}, ...]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "armor_upgrades", columnDefinition = "json")
    private List<Map<String, Object>> armorUpgrades;

    /**
     * 방어구 융합석 조합 통계
     * [{"combination": "기품 * 5", "count": 60, "percentage": 60.0}, ...]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "armor_set_combinations", columnDefinition = "json")
    private List<Map<String, Object>> armorSetCombinations;

    /**
     * 목걸이 융합석 통계
     * [{"itemName": "축복", "count": 80, "percentage": 80.0}, ...]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "necklace_upgrades", columnDefinition = "json")
    private List<Map<String, Object>> necklaceUpgrades;

    /**
     * 팔찌 융합석 통계
     * [{"itemName": "무지", "count": 70, "percentage": 70.0}, ...]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "bracelet_upgrades", columnDefinition = "json")
    private List<Map<String, Object>> braceletUpgrades;

    /**
     * 반지 융합석 통계
     * [{"itemName": "창조", "count": 65, "percentage": 65.0}, ...]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ring_upgrades", columnDefinition = "json")
    private List<Map<String, Object>> ringUpgrades;

    /**
     * 악세서리 조합 통계
     * [{"combination": "축복 | 무지 | 창조", "count": 50, "percentage": 50.0}, ...]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "accessory_combinations", columnDefinition = "json")
    private List<Map<String, Object>> accessoryCombinations;

    /**
     * 특수장비 융합석 레벨 통계 (3부위 합산, 100% 정규화)
     * [{"itemName": "75", "count": 180, "percentage": 60.0}, ...]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "special_equipment_upgrades", columnDefinition = "json")
    private List<Map<String, Object>> specialEquipmentUpgrades;

    /**
     * 특수장비 조합 통계
     * [{"combination": "75 | 75 | 75", "count": 50, "percentage": 50.0}, ...]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "special_equipment_combinations", columnDefinition = "json")
    private List<Map<String, Object>> specialEquipmentCombinations;

    /**
     * 세트 아이템 통계
     * [{"itemName": "테아나", "count": 80, "percentage": 80.0}, ...]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "set_items", columnDefinition = "json")
    private List<Map<String, Object>> setItems;

    /**
     * 진화 스킬 통계
     * [{"skillName": "패드스 드로우 - 듀얼 리액션", "count": 70, "percentage": 70.0}, ...]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "evolution_skills", columnDefinition = "json")
    private List<Map<String, Object>> evolutionSkills;

    /**
     * 강화 스킬 통계
     * [{"skillName": "더블 건 호크 - 세퍼레이트", "count": 65, "percentage": 65.0}, ...]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "enhancement_skills", columnDefinition = "json")
    private List<Map<String, Object>> enhancementSkills;

    /**
     * 스킬 조합 통계
     * [{"combination": "[진화] 스킬명 [강화] 스킬명", "tags": ["세트명", "75Lv", "무기튠"], "count": 50, "percentage": 50.0}, ...]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "skill_combinations", columnDefinition = "json")
    private List<Map<String, Object>> skillCombinations;

    /**
     * 통계 계산 시각
     */
    @Column(name = "calculated_at", nullable = false)
    private LocalDateTime calculatedAt;
}
