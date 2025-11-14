package com.dnf.insight.service;

import com.dnf.insight.domain.CharacterEquipment;
import com.dnf.insight.dto.CharacterSearchResponse;
import com.dnf.insight.dto.EquipmentResponse;
import com.dnf.insight.dto.SkillStyleResponse;
import com.dnf.insight.repository.CharacterEquipmentRepository;
import com.dnf.insight.util.DungeonResetUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * 장비 정보 서비스
 * - 장비 API 호출 및 MongoDB 저장
 * - 스킬 특성 수집
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final DnfApiClient dnfApiClient;
    private final CharacterService characterService;
    private final CharacterEquipmentRepository equipmentRepository;

    /**
     * 캐릭터 장비 + 스킬 수집 및 저장
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @return 저장된 장비 정보
     */
    public CharacterEquipment saveEquipment(String serverId, String characterId) {
        log.info("🔍 Collecting equipment for characterId={}", characterId);

        // 1. 캐릭터 기본 정보 조회 (characterName, jobId, jobGrowId)
        CharacterSearchResponse.CharacterInfo characterInfo = characterService.getCharacterInfo(serverId, characterId);

        // 2. 장비 API 호출
        EquipmentResponse equipmentResponse = dnfApiClient.getEquipment(serverId, characterId);

        // 3. 스킬 특성 API 호출
        SkillStyleResponse skillResponse = dnfApiClient.getSkillStyle(serverId, characterId);

        // 4. CharacterEquipment 엔티티 생성
        CharacterEquipment equipment = CharacterEquipment.builder()
                .serverId(serverId)
                .characterId(characterId)
                .characterName(characterInfo.getCharacterName())
                .jobId(characterInfo.getJobId())
                .jobGrowId(characterInfo.getJobGrowId())
                .crawledAt(LocalDateTime.now(DungeonResetUtil.KOREA_ZONE))
                .build();

        // 5. 장비 파싱
        parseEquipment(equipmentResponse, equipment);

        // 6. 스킬 특성 파싱
        parseSkillStyle(skillResponse, equipment);

        // 7. MongoDB 저장 (upsert)
        CharacterEquipment existing = equipmentRepository.findByServerIdAndCharacterId(serverId, characterId).orElse(null);
        if (existing != null) {
            equipment.setId(existing.getId()); // 기존 ID 유지
        }
        CharacterEquipment saved = equipmentRepository.save(equipment);

        log.info("✅ Equipment saved: characterId={}, weapon={}, setItem={}",
                characterId, saved.getWeapon() != null ? saved.getWeapon().getItemName() : "null",
                saved.getSetItemName());

        return saved;
    }

    /**
     * 캐릭터 장비 + 스킬 수집 및 저장 (캐릭터 정보 포함)
     *
     * ===== 병렬 처리 최적화 =====
     * 이전: 장비 API → 스킬 API (순차 처리, 2배 시간 소요)
     * 현재: 장비 API ↘
     *               → 동시 호출 → 2배 빠름
     *      스킬 API ↗
     *
     * ===== CompletableFuture 사용 이유 =====
     * - supplyAsync(): 비동기 작업을 별도 스레드에서 실행
     * - allOf().join(): 두 작업이 모두 완료될 때까지 대기
     * - 결과적으로 네트워크 I/O 대기 시간을 절반으로 단축
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @param characterName 캐릭터명
     * @param jobId 직업 ID (예: 41f1cdc2... = 귀검사(남))
     * @param jobGrowId 각성 직업 ID (예: 37495b94... = 眞 웨펀마스터)
     * @param jobName 직업명 (예: 귀검사(남))
     * @param jobGrowName 각성 직업명 (예: 眞 웨펀마스터)
     * @param fame 명성
     * @return 저장된 장비 정보
     */
    public CharacterEquipment saveEquipment(String serverId, String characterId,
                                           String characterName, String jobId, String jobGrowId,
                                           String jobName, String jobGrowName, Integer fame) {
        log.info("🔍 Collecting equipment for {} ({} {}, fame: {})", characterName, jobName, jobGrowName, fame);

        // ===== 1단계: 장비 API와 스킬 API를 동시에 호출 (병렬 처리) =====
        long startTime = System.currentTimeMillis();

        // CompletableFuture.supplyAsync()를 사용하여 별도 스레드에서 비동기 실행
        // ForkJoinPool.commonPool()의 스레드를 사용 (기본: CPU 코어 수 - 1)
        CompletableFuture<EquipmentResponse> equipmentFuture = CompletableFuture.supplyAsync(() ->
            dnfApiClient.getEquipment(serverId, characterId)
        );

        CompletableFuture<SkillStyleResponse> skillFuture = CompletableFuture.supplyAsync(() ->
            dnfApiClient.getSkillStyle(serverId, characterId)
        );

        // ===== 2단계: 두 API 호출이 모두 완료될 때까지 대기 =====
        // allOf(): 여러 CompletableFuture가 모두 완료될 때까지 대기하는 CompletableFuture 반환
        // join(): 블로킹 방식으로 완료 대기 (예외 발생 시 RuntimeException으로 래핑)
        CompletableFuture.allOf(equipmentFuture, skillFuture).join();

        // 각 Future에서 결과 추출 (이미 완료됨이 보장되므로 즉시 반환)
        EquipmentResponse equipmentResponse = equipmentFuture.join();
        SkillStyleResponse skillResponse = skillFuture.join();

        long apiTime = System.currentTimeMillis() - startTime;
        log.debug("⚡ API calls completed in {}ms (parallel processing)", apiTime);

        // 3. CharacterEquipment 엔티티 생성
        CharacterEquipment equipment = CharacterEquipment.builder()
                .serverId(serverId)
                .characterId(characterId)
                .characterName(characterName)
                .jobId(jobId)
                .jobGrowId(jobGrowId)
                .jobName(jobName)
                .jobGrowName(jobGrowName)
                .fame(fame)
                .crawledAt(LocalDateTime.now(DungeonResetUtil.KOREA_ZONE))
                .build();

        // 4. 장비 파싱
        parseEquipment(equipmentResponse, equipment);

        // 5. 스킬 특성 파싱
        parseSkillStyle(skillResponse, equipment);

        // 6. MongoDB 저장 (upsert)
        CharacterEquipment existing = equipmentRepository.findByServerIdAndCharacterId(serverId, characterId).orElse(null);
        if (existing != null) {
            equipment.setId(existing.getId()); // 기존 ID 유지
        }
        CharacterEquipment saved = equipmentRepository.save(equipment);

        log.info("✅ Equipment saved: {}, weapon={}, setItem={}, fame={}",
                characterName, saved.getWeapon() != null ? saved.getWeapon().getItemName() : "null",
                saved.getSetItemName(), fame);

        return saved;
    }

    /**
     * 캐릭터 장비 조회
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @return 장비 정보
     */
    public CharacterEquipment getEquipment(String serverId, String characterId) {
        return equipmentRepository.findByServerIdAndCharacterId(serverId, characterId)
                .orElse(null);
    }

    /**
     * 장비 파싱 (13개 슬롯)
     *
     * @param response 장비 API 응답
     * @param equipment 엔티티
     */
    private void parseEquipment(EquipmentResponse response, CharacterEquipment equipment) {
        if (response.getEquipment() == null) {
            return;
        }

        for (EquipmentResponse.EquipmentItem item : response.getEquipment()) {
            String slotName = item.getSlotName();

            switch (slotName) {
                case "무기":
                    String tuneName = null;
                    if (item.getTune() != null && !item.getTune().isEmpty()) {
                        tuneName = item.getTune().get(0).getName();
                    }
                    equipment.setWeapon(CharacterEquipment.WeaponSlot.builder()
                            .itemId(item.getItemId())
                            .itemName(item.getItemName())
                            .itemTypeDetail(item.getItemTypeDetail())
                            .tuneName(tuneName)
                            .build());
                    break;

                case "칭호":
                    equipment.setTitle(CharacterEquipment.EquipmentSlot.builder()
                            .itemId(item.getItemId())
                            .itemName(item.getItemName())
                            .upgradeItemId(null)
                            .upgradeItemName(null)
                            .build());
                    break;

                case "상의":
                    equipment.setJacket(buildEquipmentSlot(item));
                    break;

                case "머리어깨":
                    equipment.setHeadShoulder(buildEquipmentSlot(item));
                    break;

                case "하의":
                    equipment.setPants(buildEquipmentSlot(item));
                    break;

                case "신발":
                    equipment.setShoes(buildEquipmentSlot(item));
                    break;

                case "벨트":
                    equipment.setBelt(buildEquipmentSlot(item));
                    break;

                case "목걸이":
                    equipment.setNecklace(buildEquipmentSlot(item));
                    break;

                case "팔찌":
                    equipment.setBracelet(buildEquipmentSlot(item));
                    break;

                case "반지":
                    equipment.setRing(buildEquipmentSlot(item));
                    break;

                case "보조장비":
                    equipment.setSubEquipment(buildEquipmentSlot(item));
                    break;

                case "마법석":
                    equipment.setMagicStone(buildEquipmentSlot(item));
                    break;

                case "귀걸이":
                    equipment.setEarring(buildEquipmentSlot(item));
                    break;
            }
        }

        // 세트 아이템 정보 추출
        if (response.getSetItemInfo() != null && !response.getSetItemInfo().isEmpty()) {
            equipment.setSetItemId(response.getSetItemInfo().get(0).getSetItemId());
            equipment.setSetItemName(response.getSetItemInfo().get(0).getSetItemName());
        }
    }

    /**
     * EquipmentSlot 생성 (장비 자체 + 융합석)
     *
     * @param item API 응답 아이템
     * @return EquipmentSlot
     */
    private CharacterEquipment.EquipmentSlot buildEquipmentSlot(EquipmentResponse.EquipmentItem item) {
        return CharacterEquipment.EquipmentSlot.builder()
                .itemId(item.getItemId())
                .itemName(item.getItemName())
                .upgradeItemId(item.getUpgradeInfo() != null ? item.getUpgradeInfo().getItemId() : null)
                .upgradeItemName(item.getUpgradeInfo() != null ? item.getUpgradeInfo().getItemName() : null)
                .build();
    }

    /**
     * 스킬 특성 파싱 (진화/강화)
     *
     * @param response 스킬 특성 API 응답
     * @param equipment 엔티티
     */
    private void parseSkillStyle(SkillStyleResponse response, CharacterEquipment equipment) {
        if (response.getSkill() == null || response.getSkill().getStyle() == null) {
            return;
        }

        SkillStyleResponse.StyleInfo style = response.getSkill().getStyle();

        if (style.getEvolution() != null) {
            List<CharacterEquipment.SkillStyle> evolution = style.getEvolution().stream()
                    .map(item -> CharacterEquipment.SkillStyle.builder()
                            .skillId(item.getSkillId())
                            .type(item.getType())
                            .build())
                    .collect(Collectors.toList());
            equipment.setEvolution(evolution);
        }

        if (style.getEnhancement() != null) {
            List<CharacterEquipment.SkillStyle> enhancement = style.getEnhancement().stream()
                    .map(item -> CharacterEquipment.SkillStyle.builder()
                            .skillId(item.getSkillId())
                            .type(item.getType())
                            .build())
                    .collect(Collectors.toList());
            equipment.setEnhancement(enhancement);
        }
    }
}
