package com.dnf.insight.service;

import com.dnf.insight.domain.CharacterEquipment;
import com.dnf.insight.dto.JobEquipmentStats;
import com.dnf.insight.dto.SkillInfo;
import com.dnf.insight.repository.CharacterEquipmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 장비 통계 서비스
 * - 직업별 장비/스킬 사용 통계 생성
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EquipmentStatsService {

    private final CharacterEquipmentRepository equipmentRepository;
    private final DnfApiClient dnfApiClient;

    /**
     * 직업별 장비 통계 생성
     *
     * @param jobId 직업 ID
     * @param jobGrowId 각성 직업 ID
     * @return 장비 통계
     */
    public JobEquipmentStats getJobEquipmentStats(String jobId, String jobGrowId) {
        log.info("📊 Generating equipment stats for jobId={}, jobGrowId={}", jobId, jobGrowId);

        // 1. 해당 직업의 모든 캐릭터 장비 조회
        List<CharacterEquipment> equipments = equipmentRepository.findByJobIdAndJobGrowId(jobId, jobGrowId);

        if (equipments.isEmpty()) {
            log.warn("⚠️ No equipment data found for jobId={}, jobGrowId={}", jobId, jobGrowId);
            return null;
        }

        int totalCharacters = equipments.size();
        String jobName = equipments.get(0).getJobName();
        String jobGrowName = equipments.get(0).getJobGrowName();

        log.info("📈 Analyzing {} characters for {} {}", totalCharacters, jobName, jobGrowName);

        // 2. 통계 생성
        JobEquipmentStats stats = JobEquipmentStats.builder()
                .jobId(jobId)
                .jobGrowId(jobGrowId)
                .jobName(jobName)
                .jobGrowName(jobGrowName)
                .totalCharacters(totalCharacters)
                .build();

        // 3. 무기 통계
        stats.setWeaponTypes(calculateWeaponTypeStats(equipments, totalCharacters));
        stats.setWeaponTunes(calculateWeaponTuneStats(equipments, totalCharacters));

        // 4. 칭호 통계
        stats.setTitles(calculateTitleStats(equipments, totalCharacters));

        // 5. 방어구 융합석 통계 (5부위 합산, 100% 정규화)
        stats.setJacketUpgrades(calculateArmorUpgradesNormalized(equipments, totalCharacters));
        stats.setHeadShoulderUpgrades(new ArrayList<>()); // 사용 안함
        stats.setPantsUpgrades(new ArrayList<>()); // 사용 안함
        stats.setShoesUpgrades(new ArrayList<>()); // 사용 안함
        stats.setBeltUpgrades(new ArrayList<>()); // 사용 안함

        // 6. 방어구 융합석 조합 통계 (0개는 숨김)
        stats.setArmorSetCombinations(calculateArmorSetCombinations(equipments, totalCharacters));

        // 7. 악세서리 융합석 (목걸이/팔찌/반지 따로)
        stats.setNecklaceUpgrades(calculateUpgradeStats(equipments, totalCharacters, eq -> eq.getNecklace(), true, null));
        stats.setBraceletUpgrades(calculateUpgradeStats(equipments, totalCharacters, eq -> eq.getBracelet(), true, null));
        stats.setRingUpgrades(calculateUpgradeStats(equipments, totalCharacters, eq -> eq.getRing(), true, null));

        // 8. 악세서리 조합 통계 (축복, 무지, 창조, 테아나 - 콜론 뒤 제거)
        stats.setAccessoryCombinations(calculateAccessoryCombinations(equipments, totalCharacters));

        // 9. 특수장비 융합석 (레벨별 사용률, 100% 정규화)
        stats.setSubEquipmentUpgrades(calculateSpecialEquipmentLevelStats(equipments, totalCharacters));
        stats.setMagicStoneUpgrades(new ArrayList<>()); // 사용 안함
        stats.setEarringUpgrades(new ArrayList<>()); // 사용 안함

        // 10. 특수장비 조합 통계 (콜론 뒤 제거)
        stats.setSpecialEquipmentCombinations(calculateSpecialEquipmentCombinations(equipments, totalCharacters));

        // 11. 세트 아이템 통계
        stats.setSetItems(calculateSetItemStats(equipments, totalCharacters));

        // 12. 스킬 특성 통계
        stats.setEvolutionSkills(calculateEvolutionSkillStats(equipments, totalCharacters));
        stats.setEnhancementSkills(calculateEnhancementSkillStats(equipments, totalCharacters));

        // 13. 스킬 조합 통계 (진화 + 강화 세트)
        stats.setSkillCombinations(calculateSkillCombinations(equipments, totalCharacters, jobId));

        log.info("✅ Stats generation complete for {} {}", jobName, jobGrowName);
        return stats;
    }

    /**
     * 무기 타입 통계 (itemTypeDetail)
     */
    private List<JobEquipmentStats.ItemStat> calculateWeaponTypeStats(List<CharacterEquipment> equipments, int total) {
        Map<String, Integer> counts = new HashMap<>();

        for (CharacterEquipment eq : equipments) {
            if (eq.getWeapon() != null && eq.getWeapon().getItemTypeDetail() != null) {
                String type = eq.getWeapon().getItemTypeDetail();
                counts.put(type, counts.getOrDefault(type, 0) + 1);
            }
        }

        return counts.entrySet().stream()
                .map(entry -> JobEquipmentStats.ItemStat.builder()
                        .itemId(null)
                        .itemName(entry.getKey())
                        .count(entry.getValue())
                        .percentage(entry.getValue() * 100.0 / total)
                        .build())
                .sorted((a, b) -> b.getCount().compareTo(a.getCount()))
                .collect(Collectors.toList());
    }

    /**
     * 무기 튠 통계 (tuneName)
     */
    private List<JobEquipmentStats.ItemStat> calculateWeaponTuneStats(List<CharacterEquipment> equipments, int total) {
        Map<String, Integer> counts = new HashMap<>();

        for (CharacterEquipment eq : equipments) {
            if (eq.getWeapon() != null && eq.getWeapon().getTuneName() != null) {
                String tuneName = eq.getWeapon().getTuneName();
                counts.put(tuneName, counts.getOrDefault(tuneName, 0) + 1);
            }
        }

        return counts.entrySet().stream()
                .map(entry -> JobEquipmentStats.ItemStat.builder()
                        .itemId(null)
                        .itemName(entry.getKey())
                        .count(entry.getValue())
                        .percentage(entry.getValue() * 100.0 / total)
                        .build())
                .sorted((a, b) -> b.getCount().compareTo(a.getCount()))
                .collect(Collectors.toList());
    }

    /**
     * 칭호 통계 (itemId, itemName)
     */
    private List<JobEquipmentStats.ItemStat> calculateTitleStats(List<CharacterEquipment> equipments, int total) {
        Map<String, TitleInfo> titleMap = new HashMap<>();

        for (CharacterEquipment eq : equipments) {
            if (eq.getTitle() != null && eq.getTitle().getItemId() != null) {
                String itemId = eq.getTitle().getItemId();
                String itemName = eq.getTitle().getItemName();
                titleMap.putIfAbsent(itemId, new TitleInfo(itemId, itemName));
                titleMap.get(itemId).count++;
            }
        }

        return titleMap.values().stream()
                .map(info -> JobEquipmentStats.ItemStat.builder()
                        .itemId(info.itemId)
                        .itemName(info.itemName)
                        .count(info.count)
                        .percentage(info.count * 100.0 / total)
                        .build())
                .sorted((a, b) -> b.getCount().compareTo(a.getCount()))
                .collect(Collectors.toList());
    }

    /**
     * 융합석 통계 (upgradeItemId, upgradeItemName)
     * @param simplifyName true면 "욕망 : 잃어버린 영혼" → "욕망"으로 단순화
     * @param filterKeywords 필터링할 키워드 목록 (null이면 필터링 안함)
     */
    private List<JobEquipmentStats.ItemStat> calculateUpgradeStats(
            List<CharacterEquipment> equipments, int total,
            java.util.function.Function<CharacterEquipment, CharacterEquipment.EquipmentSlot> slotGetter,
            boolean simplifyName,
            Set<String> filterKeywords) {

        Map<String, UpgradeInfo> upgradeMap = new HashMap<>();

        for (CharacterEquipment eq : equipments) {
            CharacterEquipment.EquipmentSlot slot = slotGetter.apply(eq);
            if (slot != null && slot.getUpgradeItemId() != null) {
                String itemId = slot.getUpgradeItemId();
                String itemName = slot.getUpgradeItemName();

                // 이름 단순화 (콜론 앞부분만 추출)
                if (simplifyName && itemName.contains(" : ")) {
                    itemName = itemName.split(" : ")[0].trim();
                }

                // 키워드 필터링
                if (filterKeywords != null) {
                    boolean hasKeyword = false;
                    for (String keyword : filterKeywords) {
                        if (itemName.contains(keyword)) {
                            hasKeyword = true;
                            break;
                        }
                    }
                    if (!hasKeyword) {
                        continue;
                    }
                }

                // itemName을 키로 사용하여 중복 제거
                String key = itemName;
                upgradeMap.putIfAbsent(key, new UpgradeInfo(itemId, itemName));
                upgradeMap.get(key).count++;
            }
        }

        return upgradeMap.values().stream()
                .map(info -> JobEquipmentStats.ItemStat.builder()
                        .itemId(info.itemId)
                        .itemName(info.itemName)
                        .count(info.count)
                        .percentage(info.count * 100.0 / total)
                        .build())
                .sorted((a, b) -> b.getCount().compareTo(a.getCount()))
                .collect(Collectors.toList());
    }

    /**
     * 융합석 통계 (오버로드 - 기본 동작)
     */
    private List<JobEquipmentStats.ItemStat> calculateUpgradeStats(
            List<CharacterEquipment> equipments, int total,
            java.util.function.Function<CharacterEquipment, CharacterEquipment.EquipmentSlot> slotGetter) {
        return calculateUpgradeStats(equipments, total, slotGetter, false, null);
    }

    /**
     * 여러 슬롯의 융합석을 합쳐서 통계 내기 (악세서리, 특수장비용)
     * @param slotGetters 여러 슬롯 getter 리스트
     * @param simplifyName 콜론 뒤 제거 여부
     */
    private List<JobEquipmentStats.ItemStat> calculateCombinedUpgradeStats(
            List<CharacterEquipment> equipments, int total,
            List<java.util.function.Function<CharacterEquipment, CharacterEquipment.EquipmentSlot>> slotGetters,
            boolean simplifyName) {

        Map<String, UpgradeInfo> upgradeMap = new HashMap<>();

        for (CharacterEquipment eq : equipments) {
            for (var slotGetter : slotGetters) {
                CharacterEquipment.EquipmentSlot slot = slotGetter.apply(eq);
                if (slot != null && slot.getUpgradeItemId() != null) {
                    String itemId = slot.getUpgradeItemId();
                    String itemName = slot.getUpgradeItemName();

                    // 이름 단순화 (콜론 앞부분만 추출)
                    if (simplifyName && itemName.contains(" : ")) {
                        itemName = itemName.split(" : ")[0].trim();
                    }

                    // itemName을 키로 사용하여 중복 제거
                    String key = itemName;
                    upgradeMap.putIfAbsent(key, new UpgradeInfo(itemId, itemName));
                    upgradeMap.get(key).count++;
                }
            }
        }

        return upgradeMap.values().stream()
                .map(info -> JobEquipmentStats.ItemStat.builder()
                        .itemId(info.itemId)
                        .itemName(info.itemName)
                        .count(info.count)
                        .percentage(info.count * 100.0 / total)
                        .build())
                .sorted((a, b) -> b.getCount().compareTo(a.getCount()))
                .collect(Collectors.toList());
    }

    /**
     * 방어구 융합석 통계 (5부위 합산, 100% 정규화)
     * 전체 부위 수 = 캐릭터 수 × 5 기준으로 퍼센티지 계산
     */
    private List<JobEquipmentStats.ItemStat> calculateArmorUpgradesNormalized(List<CharacterEquipment> equipments, int totalCharacters) {
        Map<String, UpgradeInfo> upgradeMap = new HashMap<>();
        int totalSlots = 0; // 실제 융합석이 있는 슬롯 개수

        for (CharacterEquipment eq : equipments) {
            List<CharacterEquipment.EquipmentSlot> slots = List.of(
                    eq.getJacket(), eq.getPants(), eq.getHeadShoulder(), eq.getShoes(), eq.getBelt()
            );

            for (CharacterEquipment.EquipmentSlot slot : slots) {
                if (slot != null && slot.getUpgradeItemName() != null) {
                    String itemName = slot.getUpgradeItemName();

                    // 콜론 뒤 제거
                    if (itemName.contains(" : ")) {
                        itemName = itemName.split(" : ")[0].trim();
                    }

                    // 기품/욕망/배신만 카운트
                    if (itemName.contains("기품") || itemName.contains("욕망") || itemName.contains("배신")) {
                        upgradeMap.putIfAbsent(itemName, new UpgradeInfo(slot.getUpgradeItemId(), itemName));
                        upgradeMap.get(itemName).count++;
                        totalSlots++;
                    }
                }
            }
        }

        // 전체 슬롯 기준으로 퍼센티지 계산 (100% 정규화)
        int finalTotalSlots = totalSlots;
        return upgradeMap.values().stream()
                .map(info -> JobEquipmentStats.ItemStat.builder()
                        .itemId(info.itemId)
                        .itemName(info.itemName)
                        .count(info.count)
                        .percentage(info.count * 100.0 / finalTotalSlots)
                        .build())
                .sorted((a, b) -> b.getCount().compareTo(a.getCount()))
                .collect(Collectors.toList());
    }

    /**
     * 방어구 융합석 조합 통계 (5부위의 기품/욕망/배신 개수)
     * 예: "기품 * 5, 욕망 * 0, 배신 * 0" (100명 중 80명)
     */
    private List<JobEquipmentStats.CombinationStat> calculateArmorSetCombinations(List<CharacterEquipment> equipments, int total) {
        Map<String, Integer> combinations = new HashMap<>();

        for (CharacterEquipment eq : equipments) {
            // 5부위 각각의 융합석 이름 수집
            List<String> upgradeNames = new ArrayList<>();
            if (eq.getJacket() != null && eq.getJacket().getUpgradeItemName() != null) {
                upgradeNames.add(eq.getJacket().getUpgradeItemName());
            }
            if (eq.getPants() != null && eq.getPants().getUpgradeItemName() != null) {
                upgradeNames.add(eq.getPants().getUpgradeItemName());
            }
            if (eq.getHeadShoulder() != null && eq.getHeadShoulder().getUpgradeItemName() != null) {
                upgradeNames.add(eq.getHeadShoulder().getUpgradeItemName());
            }
            if (eq.getShoes() != null && eq.getShoes().getUpgradeItemName() != null) {
                upgradeNames.add(eq.getShoes().getUpgradeItemName());
            }
            if (eq.getBelt() != null && eq.getBelt().getUpgradeItemName() != null) {
                upgradeNames.add(eq.getBelt().getUpgradeItemName());
            }

            // 5개 부위 전부 융합석이 있는 경우만 통계에 포함
            if (upgradeNames.size() != 5) {
                continue;
            }

            // 기품/욕망/배신 개수 카운팅
            int dignityCount = 0;
            int desireCount = 0;
            int betrayalCount = 0;

            for (String name : upgradeNames) {
                if (name.contains("기품")) {
                    dignityCount++;
                } else if (name.contains("욕망")) {
                    desireCount++;
                } else if (name.contains("배신")) {
                    betrayalCount++;
                }
            }

            // 조합 문자열 생성 (0개는 표시 안함)
            List<String> parts = new ArrayList<>();
            if (dignityCount > 0) parts.add("기품 * " + dignityCount);
            if (desireCount > 0) parts.add("욕망 * " + desireCount);
            if (betrayalCount > 0) parts.add("배신 * " + betrayalCount);

            // 기품/욕망/배신 합이 5개인 경우만 카운트
            if (dignityCount + desireCount + betrayalCount == 5) {
                String combo = String.join(", ", parts);
                combinations.put(combo, combinations.getOrDefault(combo, 0) + 1);
            }
        }

        return combinations.entrySet().stream()
                .map(entry -> JobEquipmentStats.CombinationStat.builder()
                        .combination(entry.getKey())
                        .count(entry.getValue())
                        .percentage(entry.getValue() * 100.0 / total)
                        .build())
                .sorted((a, b) -> b.getCount().compareTo(a.getCount()))
                .collect(Collectors.toList());
    }

    /**
     * 악세서리 조합 통계 (목걸이, 팔찌, 반지) - 콜론 뒤 제거
     */
    private List<JobEquipmentStats.CombinationStat> calculateAccessoryCombinations(List<CharacterEquipment> equipments, int total) {
        Map<String, Integer> combinations = new HashMap<>();

        for (CharacterEquipment eq : equipments) {
            String necklace = eq.getNecklace() != null ? eq.getNecklace().getUpgradeItemName() : null;
            String bracelet = eq.getBracelet() != null ? eq.getBracelet().getUpgradeItemName() : null;
            String ring = eq.getRing() != null ? eq.getRing().getUpgradeItemName() : null;

            // 콜론 뒤 제거
            if (necklace != null && necklace.contains(" : ")) {
                necklace = necklace.split(" : ")[0].trim();
            }
            if (bracelet != null && bracelet.contains(" : ")) {
                bracelet = bracelet.split(" : ")[0].trim();
            }
            if (ring != null && ring.contains(" : ")) {
                ring = ring.split(" : ")[0].trim();
            }

            if (necklace != null && bracelet != null && ring != null) {
                String combo = necklace + " | " + bracelet + " | " + ring;
                combinations.put(combo, combinations.getOrDefault(combo, 0) + 1);
            }
        }

        return combinations.entrySet().stream()
                .map(entry -> JobEquipmentStats.CombinationStat.builder()
                        .combination(entry.getKey())
                        .count(entry.getValue())
                        .percentage(entry.getValue() * 100.0 / total)
                        .build())
                .sorted((a, b) -> b.getCount().compareTo(a.getCount()))
                .collect(Collectors.toList());
    }

    /**
     * 특수장비 융합석 레벨 통계 (3부위 합산, 100% 정규화)
     * 예: "75: 50%", "35: 20%", "--: 10%"
     */
    private List<JobEquipmentStats.ItemStat> calculateSpecialEquipmentLevelStats(List<CharacterEquipment> equipments, int totalCharacters) {
        Map<String, Integer> levelCounts = new HashMap<>();
        int totalSlots = 0;

        for (CharacterEquipment eq : equipments) {
            List<String> itemNames = List.of(
                    eq.getSubEquipment() != null ? eq.getSubEquipment().getUpgradeItemName() : null,
                    eq.getMagicStone() != null ? eq.getMagicStone().getUpgradeItemName() : null,
                    eq.getEarring() != null ? eq.getEarring().getUpgradeItemName() : null
            );

            for (String itemName : itemNames) {
                String level = extractLevel(itemName);
                if (level != null) {
                    levelCounts.put(level, levelCounts.getOrDefault(level, 0) + 1);
                    totalSlots++;
                }
            }
        }

        int finalTotalSlots = totalSlots;
        return levelCounts.entrySet().stream()
                .map(entry -> JobEquipmentStats.ItemStat.builder()
                        .itemId(null)
                        .itemName(entry.getKey())
                        .count(entry.getValue())
                        .percentage(entry.getValue() * 100.0 / finalTotalSlots)
                        .build())
                .sorted((a, b) -> Double.compare(b.getPercentage(), a.getPercentage())) // 퍼센티지 내림차순
                .collect(Collectors.toList());
    }

    /**
     * 특수장비 조합 통계 (레벨 숫자 또는 "--"만 추출)
     * 예: "설계 : 완성형 어시스트 모듈 75" → "75"
     */
    private List<JobEquipmentStats.CombinationStat> calculateSpecialEquipmentCombinations(List<CharacterEquipment> equipments, int total) {
        Map<String, Integer> combinations = new HashMap<>();

        for (CharacterEquipment eq : equipments) {
            String subEquip = eq.getSubEquipment() != null ? eq.getSubEquipment().getUpgradeItemName() : null;
            String magicStone = eq.getMagicStone() != null ? eq.getMagicStone().getUpgradeItemName() : null;
            String earring = eq.getEarring() != null ? eq.getEarring().getUpgradeItemName() : null;

            // 레벨 숫자 또는 "--" 추출
            String subLevel = extractLevel(subEquip);
            String magicLevel = extractLevel(magicStone);
            String earringLevel = extractLevel(earring);

            if (subLevel != null && magicLevel != null && earringLevel != null) {
                String combo = subLevel + " | " + magicLevel + " | " + earringLevel;
                combinations.put(combo, combinations.getOrDefault(combo, 0) + 1);
            }
        }

        return combinations.entrySet().stream()
                .map(entry -> JobEquipmentStats.CombinationStat.builder()
                        .combination(entry.getKey())
                        .count(entry.getValue())
                        .percentage(entry.getValue() * 100.0 / total)
                        .build())
                .sorted((a, b) -> b.getCount().compareTo(a.getCount()))
                .collect(Collectors.toList());
    }

    /**
     * 세트 아이템 통계 - 각 캐릭터별로 장비 슬롯에서 가장 많이 등장하는 세트를 집계
     * 콜론 뒤 제거 (예: "테아나 : 어쩌고" → "테아나")
     */
    private List<JobEquipmentStats.ItemStat> calculateSetItemStats(List<CharacterEquipment> equipments, int total) {
        Map<String, SetItemInfo> characterSetMap = new HashMap<>();

        for (CharacterEquipment eq : equipments) {
            // 각 캐릭터의 모든 장비 슬롯에서 setItemName 수집
            Map<String, Integer> setNameCounts = new HashMap<>();

            // 모든 장비 슬롯 순회
            List<CharacterEquipment.EquipmentSlot> slots = List.of(
                eq.getJacket(), eq.getHeadShoulder(), eq.getPants(), eq.getShoes(), eq.getBelt(),
                eq.getNecklace(), eq.getBracelet(), eq.getRing(), eq.getSubEquipment(), eq.getMagicStone(), eq.getEarring()
            );

            for (CharacterEquipment.EquipmentSlot slot : slots) {
                if (slot != null && slot.getSetItemName() != null) {
                    String setName = slot.getSetItemName();

                    // 콜론 뒤 제거
                    if (setName.contains(" : ")) {
                        setName = setName.split(" : ")[0].trim();
                    }

                    // "세트" 텍스트 제거
                    if (setName.endsWith(" 세트")) {
                        setName = setName.substring(0, setName.length() - 3).trim();
                    }

                    setNameCounts.put(setName, setNameCounts.getOrDefault(setName, 0) + 1);
                }
            }

            // 가장 많이 등장한 세트를 해당 캐릭터의 세트로 선택
            if (!setNameCounts.isEmpty()) {
                String mostCommonSet = setNameCounts.entrySet().stream()
                        .max(Map.Entry.comparingByValue())
                        .map(Map.Entry::getKey)
                        .orElse(null);

                if (mostCommonSet != null) {
                    characterSetMap.putIfAbsent(mostCommonSet, new SetItemInfo(null, mostCommonSet));
                    characterSetMap.get(mostCommonSet).count++;
                }
            }
        }

        return characterSetMap.values().stream()
                .map(info -> JobEquipmentStats.ItemStat.builder()
                        .itemId(info.itemId)
                        .itemName(info.itemName)
                        .count(info.count)
                        .percentage(info.count * 100.0 / total)
                        .build())
                .sorted((a, b) -> b.getCount().compareTo(a.getCount()))
                .collect(Collectors.toList());
    }

    /**
     * 진화 스킬 통계 (Type별 구분)
     */
    private List<JobEquipmentStats.SkillStat> calculateEvolutionSkillStats(List<CharacterEquipment> equipments, int total) {
        if (equipments.isEmpty()) return new ArrayList<>();

        String jobId = equipments.get(0).getJobId();

        // skillId별로 type 카운트 저장
        Map<String, SkillTypeCount> skillStats = new HashMap<>();

        for (CharacterEquipment eq : equipments) {
            if (eq.getEvolution() != null) {
                for (CharacterEquipment.SkillStyle skill : eq.getEvolution()) {
                    String skillId = skill.getSkillId();
                    Integer type = skill.getType();

                    skillStats.putIfAbsent(skillId, new SkillTypeCount());
                    SkillTypeCount typeCount = skillStats.get(skillId);
                    typeCount.totalCount++;

                    if (type != null) {
                        if (type == 1) {
                            typeCount.type1Count++;
                        } else if (type == 2) {
                            typeCount.type2Count++;
                        }
                    }
                }
            }
        }

        // 스킬 정보 가져오기 (이름 + type별 진화 이름)
        Map<String, SkillInfo> skillInfoMap = new ConcurrentHashMap<>();
        skillStats.keySet().forEach(skillId -> {
            SkillInfo skillInfo = getSkillInfo(jobId, skillId);
            if (skillInfo != null) {
                skillInfoMap.put(skillId, skillInfo);
            }
        });

        return skillStats.entrySet().stream()
                .map(entry -> {
                    String skillId = entry.getKey();
                    SkillTypeCount typeCount = entry.getValue();
                    SkillInfo skillInfo = skillInfoMap.get(skillId);

                    String skillName = skillId;
                    String type1Name = "1번";
                    String type2Name = "2번";

                    if (skillInfo != null) {
                        skillName = skillInfo.getName() != null ? skillInfo.getName() : skillId;

                        // 진화 스킬 type별 이름 추출
                        if (skillInfo.getEvolution() != null) {
                            for (SkillInfo.EvolutionType evo : skillInfo.getEvolution()) {
                                if (evo.getType() != null && evo.getType() == 1 && evo.getName() != null) {
                                    type1Name = evo.getName();
                                } else if (evo.getType() != null && evo.getType() == 2 && evo.getName() != null) {
                                    type2Name = evo.getName();
                                }
                            }
                        }
                    }

                    return JobEquipmentStats.SkillStat.builder()
                            .skillId(skillId)
                            .skillName(skillName)
                            .count(typeCount.totalCount)
                            .percentage(typeCount.totalCount * 100.0 / total)
                            .type1Count(typeCount.type1Count)
                            .type2Count(typeCount.type2Count)
                            .type1Percentage(typeCount.totalCount > 0 ? typeCount.type1Count * 100.0 / typeCount.totalCount : 0.0)
                            .type2Percentage(typeCount.totalCount > 0 ? typeCount.type2Count * 100.0 / typeCount.totalCount : 0.0)
                            .type1Name(type1Name)
                            .type2Name(type2Name)
                            .build();
                })
                .sorted((a, b) -> b.getCount().compareTo(a.getCount()))
                .collect(Collectors.toList());
    }

    /**
     * 강화 스킬 통계 (Type별 구분)
     */
    private List<JobEquipmentStats.SkillStat> calculateEnhancementSkillStats(List<CharacterEquipment> equipments, int total) {
        if (equipments.isEmpty()) return new ArrayList<>();

        String jobId = equipments.get(0).getJobId();

        // skillId별로 type 카운트 저장
        Map<String, SkillTypeCount> skillStats = new HashMap<>();

        for (CharacterEquipment eq : equipments) {
            if (eq.getEnhancement() != null) {
                for (CharacterEquipment.SkillStyle skill : eq.getEnhancement()) {
                    String skillId = skill.getSkillId();
                    Integer type = skill.getType();

                    skillStats.putIfAbsent(skillId, new SkillTypeCount());
                    SkillTypeCount typeCount = skillStats.get(skillId);
                    typeCount.totalCount++;

                    if (type != null) {
                        if (type == 1) {
                            typeCount.type1Count++;
                        } else if (type == 2) {
                            typeCount.type2Count++;
                        }
                    }
                }
            }
        }

        // 스킬 정보 가져오기 (이름 + type별 강화 설명)
        Map<String, SkillInfo> skillInfoMap = new ConcurrentHashMap<>();
        skillStats.keySet().forEach(skillId -> {
            SkillInfo skillInfo = getSkillInfo(jobId, skillId);
            if (skillInfo != null) {
                skillInfoMap.put(skillId, skillInfo);
            }
        });

        return skillStats.entrySet().stream()
                .map(entry -> {
                    String skillId = entry.getKey();
                    SkillTypeCount typeCount = entry.getValue();
                    SkillInfo skillInfo = skillInfoMap.get(skillId);

                    String skillName = skillId;
                    String type1Name = "1번";
                    String type2Name = "2번";

                    if (skillInfo != null) {
                        skillName = skillInfo.getName() != null ? skillInfo.getName() : skillId;

                        // 강화 스킬 type별 정보 추출 (status 정보 사용)
                        if (skillInfo.getEnhancement() != null) {
                            for (SkillInfo.EnhancementType enh : skillInfo.getEnhancement()) {
                                if (enh.getType() != null && enh.getStatus() != null && !enh.getStatus().isEmpty()) {
                                    StringBuilder sb = new StringBuilder();
                                    for (SkillInfo.Status status : enh.getStatus()) {
                                        if (sb.length() > 0) sb.append(", ");
                                        sb.append(status.getName()).append(" ").append(status.getValue());
                                    }
                                    if (enh.getType() == 1) {
                                        type1Name = sb.toString();
                                    } else if (enh.getType() == 2) {
                                        type2Name = sb.toString();
                                    }
                                }
                            }
                        }
                    }

                    return JobEquipmentStats.SkillStat.builder()
                            .skillId(skillId)
                            .skillName(skillName)
                            .count(typeCount.totalCount)
                            .percentage(typeCount.totalCount * 100.0 / total)
                            .type1Count(typeCount.type1Count)
                            .type2Count(typeCount.type2Count)
                            .type1Percentage(typeCount.totalCount > 0 ? typeCount.type1Count * 100.0 / typeCount.totalCount : 0.0)
                            .type2Percentage(typeCount.totalCount > 0 ? typeCount.type2Count * 100.0 / typeCount.totalCount : 0.0)
                            .type1Name(type1Name)
                            .type2Name(type2Name)
                            .build();
                })
                .sorted((a, b) -> b.getCount().compareTo(a.getCount()))
                .collect(Collectors.toList());
    }

    /**
     * 스킬 정보 조회 (API 호출)
     *
     * @param jobId 직업 ID
     * @param skillId 스킬 ID
     * @return 스킬 정보 (조회 실패 시 null)
     */
    private SkillInfo getSkillInfo(String jobId, String skillId) {
        try {
            return dnfApiClient.getSkillInfo(jobId, skillId);
        } catch (Exception e) {
            log.warn("⚠️ Failed to fetch skill info: jobId={}, skillId={}", jobId, skillId);
        }
        return null;
    }

    /**
     * ItemStat 빌더 헬퍼
     */
    private JobEquipmentStats.ItemStat buildItemStat(String itemId, String itemName, int count, int total) {
        return JobEquipmentStats.ItemStat.builder()
                .itemId(itemId)
                .itemName(itemName)
                .count(count)
                .percentage(count * 100.0 / total)
                .build();
    }

    /**
     * 아이템 이름에서 레벨 숫자 또는 "--" 추출
     * 예: "설계 : 완성형 어시스트 모듈 75" → "75"
     * 예: "설계 : 완성형 어시스트 모듈 --" → "--"
     * 예: "황금 : 영원한 분노" → null (숫자 없음)
     */
    private String extractLevel(String itemName) {
        if (itemName == null) return null;

        // "--" 패턴 찾기
        if (itemName.contains(" --")) {
            return "--";
        }

        // 숫자 패턴 찾기 (마지막 숫자를 추출)
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(\\d+)(?!.*\\d)");
        java.util.regex.Matcher matcher = pattern.matcher(itemName);
        if (matcher.find()) {
            return matcher.group(1);
        }

        return null; // 숫자도 "--"도 없으면 null
    }

    // ========== 내부 클래스 (카운팅용) ==========

    private static class TitleInfo {
        String itemId;
        String itemName;
        int count = 0;
        TitleInfo(String itemId, String itemName) {
            this.itemId = itemId;
            this.itemName = itemName;
        }
    }

    private static class UpgradeInfo {
        String itemId;
        String itemName;
        int count = 0;
        UpgradeInfo(String itemId, String itemName) {
            this.itemId = itemId;
            this.itemName = itemName;
        }
    }

    private static class SetItemInfo {
        String itemId;
        String itemName;
        int count = 0;
        SetItemInfo(String itemId, String itemName) {
            this.itemId = itemId;
            this.itemName = itemName;
        }
    }

    private static class SkillTypeCount {
        int totalCount = 0;
        int type1Count = 0;
        int type2Count = 0;
    }

    /**
     * 스킬 조합 통계 (진화 + 강화 세트)
     * 예: "패드스 드로우 - 듀얼 리액션 | 더블 건 호크 - 세퍼레이트"
     */
    private List<JobEquipmentStats.CombinationStat> calculateSkillCombinations(
            List<CharacterEquipment> equipments,
            int total,
            String jobId
    ) {
        // 스킬 정보 캐시 (API 호출 최소화)
        Map<String, SkillInfo> skillInfoCache = new ConcurrentHashMap<>();

        // 캐릭터별 스킬 조합 문자열 생성
        Map<String, Integer> combinationCount = new HashMap<>();

        // 조합별 장비 정보 수집 (세트, 칭호, 무기)
        Map<String, List<CharacterEquipment>> combinationEquipments = new HashMap<>();

        for (CharacterEquipment eq : equipments) {
            List<String> evolutionParts = new ArrayList<>();
            List<String> enhancementParts = new ArrayList<>();

            // 진화 스킬 처리
            if (eq.getEvolution() != null) {
                for (CharacterEquipment.SkillStyle skill : eq.getEvolution()) {
                    SkillInfo skillInfo = getSkillInfoCached(skillInfoCache, jobId, skill.getSkillId());
                    String skillName = skillInfo != null && skillInfo.getName() != null ? skillInfo.getName() : skill.getSkillId();
                    String typeName = "미확인";

                    // 진화 타입 이름 가져오기
                    if (skillInfo != null && skillInfo.getEvolution() != null) {
                        for (SkillInfo.EvolutionType evo : skillInfo.getEvolution()) {
                            if (evo.getType() != null && evo.getType().equals(skill.getType()) && evo.getName() != null) {
                                typeName = evo.getName();
                                break;
                            }
                        }
                    }

                    evolutionParts.add(skillName + " - " + typeName);
                }
            }

            // 강화 스킬 처리
            if (eq.getEnhancement() != null) {
                for (CharacterEquipment.SkillStyle skill : eq.getEnhancement()) {
                    SkillInfo skillInfo = getSkillInfoCached(skillInfoCache, jobId, skill.getSkillId());
                    String skillName = skillInfo != null && skillInfo.getName() != null ? skillInfo.getName() : skill.getSkillId();
                    String typeName = skill.getType() != null && skill.getType() == 1 ? "공격력 증가" : "쿨타임 감소";

                    enhancementParts.add(skillName + " - " + typeName);
                }
            }

            // 조합 문자열 생성 (진화 | 강화)
            if (!evolutionParts.isEmpty() || !enhancementParts.isEmpty()) {
                Collections.sort(evolutionParts);
                Collections.sort(enhancementParts);

                String evolutionStr = String.join(" | ", evolutionParts);
                String enhancementStr = String.join(" | ", enhancementParts);
                String combination = "";

                if (!evolutionStr.isEmpty() && !enhancementStr.isEmpty()) {
                    combination = "[진화] " + evolutionStr + " [강화] " + enhancementStr;
                } else if (!evolutionStr.isEmpty()) {
                    combination = "[진화] " + evolutionStr;
                } else {
                    combination = "[강화] " + enhancementStr;
                }

                combinationCount.merge(combination, 1, Integer::sum);

                // 조합별 장비 정보 수집
                combinationEquipments.computeIfAbsent(combination, k -> new ArrayList<>()).add(eq);
            }
        }

        // CombinationStat 리스트로 변환 (태그 포함)
        return combinationCount.entrySet().stream()
                .map(entry -> {
                    String combination = entry.getKey();
                    List<CharacterEquipment> eqs = combinationEquipments.get(combination);
                    List<String> tags = generateEquipmentTags(eqs);

                    return JobEquipmentStats.CombinationStat.builder()
                            .combination(combination)
                            .count(entry.getValue())
                            .percentage(entry.getValue() * 100.0 / total)
                            .tags(tags)
                            .build();
                })
                .sorted((a, b) -> b.getCount().compareTo(a.getCount()))
                .limit(20) // 상위 20개만
                .collect(Collectors.toList());
    }

    /**
     * 장비 태그 생성 (세트, 칭호, 무기 튠)
     */
    private List<String> generateEquipmentTags(List<CharacterEquipment> equipments) {
        List<String> tags = new ArrayList<>();

        // 세트 아이템 집계 (각 캐릭터별로 장비 슬롯에서 가장 많이 등장하는 세트명 수집)
        Map<String, Long> setItemCounts = new HashMap<>();

        for (CharacterEquipment eq : equipments) {
            // 각 캐릭터의 모든 장비 슬롯에서 setItemName 수집
            Map<String, Integer> setNameCounts = new HashMap<>();

            List<CharacterEquipment.EquipmentSlot> slots = List.of(
                eq.getJacket(), eq.getHeadShoulder(), eq.getPants(), eq.getShoes(), eq.getBelt(),
                eq.getNecklace(), eq.getBracelet(), eq.getRing(), eq.getSubEquipment(), eq.getMagicStone(), eq.getEarring()
            );

            for (CharacterEquipment.EquipmentSlot slot : slots) {
                if (slot != null && slot.getSetItemName() != null && !slot.getSetItemName().isEmpty()) {
                    String setName = slot.getSetItemName();

                    // 콜론 뒤 제거
                    if (setName.contains(" : ")) {
                        setName = setName.split(" : ")[0].trim();
                    }

                    // "세트" 제거
                    if (setName.endsWith(" 세트")) {
                        setName = setName.substring(0, setName.length() - 3).trim();
                    }

                    setNameCounts.put(setName, setNameCounts.getOrDefault(setName, 0) + 1);
                }
            }

            // 해당 캐릭터의 가장 많이 등장한 세트명 찾기
            if (!setNameCounts.isEmpty()) {
                String topSet = setNameCounts.entrySet().stream()
                        .max(Map.Entry.comparingByValue())
                        .map(Map.Entry::getKey)
                        .orElse(null);

                if (topSet != null) {
                    setItemCounts.put(topSet, setItemCounts.getOrDefault(topSet, 0L) + 1);
                }
            }
        }

        if (!setItemCounts.isEmpty()) {
            String topSetItem = setItemCounts.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(null);

            if (topSetItem != null) {
                tags.add(topSetItem);
            }
        }

        // 칭호 레벨 집계 (75Lv, 80Lv 등)
        Map<String, Long> titleCounts = equipments.stream()
                .filter(eq -> eq.getTitle() != null && eq.getTitle().getItemName() != null)
                .map(eq -> {
                    String titleName = eq.getTitle().getItemName();
                    // 칭호 이름에서 레벨 추출 (예: "75Lv 칭호" -> "75Lv")
                    if (titleName.matches(".*\\d+Lv.*")) {
                        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(\\d+Lv)");
                        java.util.regex.Matcher matcher = pattern.matcher(titleName);
                        if (matcher.find()) {
                            return matcher.group(1);
                        }
                    }
                    return null;
                })
                .filter(level -> level != null)
                .collect(Collectors.groupingBy(level -> level, Collectors.counting()));

        if (!titleCounts.isEmpty()) {
            String topTitleLevel = titleCounts.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(null);

            if (topTitleLevel != null) {
                tags.add(topTitleLevel);
            }
        }

        // 무기 튠 집계 (가장 많이 사용된 것)
        Map<String, Long> tuneCounts = equipments.stream()
                .filter(eq -> eq.getWeapon() != null && eq.getWeapon().getTuneName() != null)
                .collect(Collectors.groupingBy(eq -> eq.getWeapon().getTuneName(), Collectors.counting()));

        if (!tuneCounts.isEmpty()) {
            String topTune = tuneCounts.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(null);

            if (topTune != null) {
                tags.add(topTune);
            }
        }

        return tags;
    }

    /**
     * 스킬 정보 캐시에서 가져오기 (없으면 API 호출)
     */
    private SkillInfo getSkillInfoCached(Map<String, SkillInfo> cache, String jobId, String skillId) {
        return cache.computeIfAbsent(skillId, id -> getSkillInfo(jobId, id));
    }
}
