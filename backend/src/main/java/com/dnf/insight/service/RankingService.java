package com.dnf.insight.service;

import com.dnf.insight.dto.CharacterFameResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import com.dnf.insight.domain.CharacterEquipment;

/**
 * 랭킹 수집 서비스
 * - 직업별 명성 상위 100명 수집
 * - 100명 미만 시 재시도 (fame -2000씩)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RankingService {

    private final DnfApiClient dnfApiClient;
    private final EquipmentService equipmentService;
    private final com.dnf.insight.repository.CharacterEquipmentRepository equipmentRepository;

    /**
     * 직업별 상위 100명 캐릭터 수집
     *
     * @param jobId 직업 ID
     * @param jobGrowId 각성 직업 ID
     * @param targetCount 목표 캐릭터 수 (기본: 100)
     * @return 수집된 캐릭터 목록
     */
    public List<CharacterFameResponse.CharacterRow> collectTopCharacters(
            String jobId, String jobGrowId, int targetCount) {

        log.info("🎯 Collecting top {} characters for jobGrowId={}", targetCount, jobGrowId);

        List<CharacterFameResponse.CharacterRow> allCharacters = new ArrayList<>();
        Set<String> collectedIds = new HashSet<>();

        Integer minFame = null;
        Integer maxFame = null;
        int retryCount = 0;
        int maxRetries = 20; // 최대 20회 재시도 (40,000 명성까지 내려감)

        while (allCharacters.size() < targetCount && retryCount < maxRetries) {
            // API 호출
            CharacterFameResponse response = dnfApiClient.getCharactersByFame(
                    "all", minFame, maxFame, jobId, jobGrowId, 100
            );

            if (response.getRows() == null || response.getRows().isEmpty()) {
                log.warn("⚠️ No more characters found. Stopping collection.");
                break;
            }

            // 중복 제거하며 추가
            for (CharacterFameResponse.CharacterRow character : response.getRows()) {
                String uniqueKey = character.getServerId() + ":" + character.getCharacterId();
                if (!collectedIds.contains(uniqueKey)) {
                    allCharacters.add(character);
                    collectedIds.add(uniqueKey);

                    if (allCharacters.size() >= targetCount) {
                        break;
                    }
                }
            }

            log.info("📊 Collected: {}/{} (retry: {})", allCharacters.size(), targetCount, retryCount);

            // 목표 달성 시 종료
            if (allCharacters.size() >= targetCount) {
                break;
            }

            // 명성 범위를 2000씩 내림
            if (response.getFame() != null) {
                minFame = response.getFame().getMin() - 2000;
                maxFame = response.getFame().getMax() - 2000;
                log.info("🔄 Retry with fame range: {} ~ {}", minFame, maxFame);
            } else {
                log.error("❌ Fame range is null. Cannot retry.");
                break;
            }

            retryCount++;
        }

        log.info("✅ Final collection: {} characters (target: {})", allCharacters.size(), targetCount);
        return allCharacters;
    }

    /**
     * 직업별 상위 100명의 장비 + 스킬 수집
     *
     * @param jobId 직업 ID
     * @param jobGrowId 각성 직업 ID
     * @param jobGrowName 각성 직업명
     * @return 성공/실패 수
     */
    public CollectionResult collectEquipmentsForJob(String jobId, String jobGrowId, String jobName, String jobGrowName) {
        log.info("🚀 Starting equipment collection for: {} {} ({} + {})", jobName, jobGrowName, jobId, jobGrowId);

        // 1. 기존 데이터 삭제 (항상 정확히 100명만 유지) - jobId + jobGrowId 조합으로 삭제
        long deletedCount = equipmentRepository.countByJobIdAndJobGrowId(jobId, jobGrowId);
        if (deletedCount > 0) {
            log.info("🗑️ Deleting {} old records for {} {} ({}+{})", deletedCount, jobName, jobGrowName, jobId, jobGrowId);
            equipmentRepository.deleteByJobIdAndJobGrowId(jobId, jobGrowId);
            log.info("✅ Deletion complete for {} {}", jobName, jobGrowName);
        }

        // 2. 상위 100명 수집
        List<CharacterFameResponse.CharacterRow> topCharacters = collectTopCharacters(jobId, jobGrowId, 100);

        if (topCharacters.isEmpty()) {
            log.warn("⚠️ No characters found for {}", jobGrowName);
            return new CollectionResult(0, 0);
        }

        // ===== 3단계: 100명의 캐릭터 장비 + 스킬을 병렬로 수집 =====
        // 각 캐릭터마다 EquipmentService.saveEquipment()를 호출
        // 이 안에서 다시 장비 API와 스킬 API가 병렬로 호출됨 (2중 병렬)
        log.info("⚡ Starting parallel collection for {} characters", topCharacters.size());

        // Stream API와 CompletableFuture로 100명을 동시에 처리
        // map(): 각 캐릭터를 CompletableFuture로 변환
        // supplyAsync(): 각 작업을 별도 스레드에서 실행
        List<CompletableFuture<CharacterEquipment>> futures = topCharacters.stream()
                .map(character -> CompletableFuture.supplyAsync(() -> {
                    try {
                        // 이 메서드 내부에서 장비 API + 스킬 API가 병렬로 호출됨
                        return equipmentService.saveEquipment(
                                character.getServerId(),
                                character.getCharacterId(),
                                character.getCharacterName(),
                                character.getJobId(),
                                character.getJobGrowId(),
                                jobName,
                                jobGrowName,
                                character.getFame()
                        );
                    } catch (Exception e) {
                        log.error("❌ Failed: {} ({}) - {}",
                                character.getCharacterName(), character.getCharacterId(), e.getMessage());
                        return null; // 실패한 경우 null 반환
                    }
                }))
                .collect(Collectors.toList()); // List<CompletableFuture<CharacterEquipment>>로 수집

        // ===== 모든 비동기 작업이 완료될 때까지 대기 =====
        // allOf()를 사용하여 100개의 Future가 모두 완료될 때까지 블로킹
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        // ===== 결과 집계 =====
        int successCount = 0;
        int failCount = 0;
        for (CompletableFuture<CharacterEquipment> future : futures) {
            CharacterEquipment result = future.join(); // 이미 완료됨이 보장되므로 즉시 반환
            if (result != null) {
                successCount++;
            } else {
                failCount++;
            }
        }

        log.info("✅ Parallel collection complete: {} success, {} failed", successCount, failCount);

        log.info("🎉 Collection complete for {}: success={}, fail={}", jobGrowName, successCount, failCount);
        return new CollectionResult(successCount, failCount);
    }

    /**
     * jobId에 속한 모든 직업(jobGrowId)을 병렬로 수집
     *
     * ===== 병렬 처리 계층 구조 =====
     * 1단계 (이 메서드): jobId 내의 모든 jobGrowId를 병렬 처리
     *   예) 귀검사(남)의 5개 직업(웨펀마스터, 소울브링어, 버서커, 아수라, 검귀)을 동시에 수집
     *
     * 2단계 (collectEquipmentsForJob): 각 직업의 100명을 병렬 처리
     *   예) 웨펀마스터 100명을 동시에 수집
     *
     * 3단계 (EquipmentService.saveEquipment): 각 캐릭터의 장비+스킬 API를 병렬 처리
     *   예) 1명의 장비 API와 스킬 API를 동시에 호출
     *
     * ===== 결과 =====
     * 귀검사(남) 5개 직업 × 100명 = 500명을 약 3초에 수집 (순차 처리 시 약 15초)
     *
     * ===== API Rate Limit 고려 =====
     * - 5개 직업 × 100명 × 2 API = 1000번 API 호출
     * - 네오플 API 제한: 초당 1000건 (안전)
     * - 실제 소요: 약 3초 (1000 / 3 = 333 req/sec)
     *
     * @param jobs jobId에 속한 직업 리스트 (예: 귀검사(남)의 5개 眞 직업)
     * @return 총 성공/실패 수
     */
    public CollectionResult collectEquipmentsByJobId(List<JobInfo> jobs) {
        if (jobs.isEmpty()) {
            return new CollectionResult(0, 0);
        }

        String jobName = jobs.get(0).jobName;
        log.info("🚀 Starting parallel collection for jobId: {} ({} jobs)", jobName, jobs.size());

        // ===== 각 jobGrowId를 병렬로 수집 =====
        // 예) 귀검사(남): 웨펀마스터, 소울브링어, 버서커, 아수라, 검귀 → 5개 동시 실행
        List<CompletableFuture<CollectionResult>> futures = jobs.stream()
                .map(job -> CompletableFuture.supplyAsync(() ->
                        // 각 직업의 100명 수집 (내부에서 또 병렬 처리)
                        collectEquipmentsForJob(job.jobId, job.jobGrowId, job.jobName, job.jobGrowName)
                ))
                .collect(Collectors.toList());

        // ===== 모든 직업의 수집이 완료될 때까지 대기 =====
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        // ===== 결과 집계 =====
        int totalSuccess = 0;
        int totalFail = 0;
        for (CompletableFuture<CollectionResult> future : futures) {
            CollectionResult result = future.join();
            totalSuccess += result.successCount;
            totalFail += result.failCount;
        }

        log.info("🎉 JobId collection complete for {}: total success={}, fail={}", jobName, totalSuccess, totalFail);
        return new CollectionResult(totalSuccess, totalFail);
    }

    /**
     * 직업 정보 (DTO)
     */
    public static class JobInfo {
        public final String jobId;
        public final String jobGrowId;
        public final String jobName;
        public final String jobGrowName;

        public JobInfo(String jobId, String jobGrowId, String jobName, String jobGrowName) {
            this.jobId = jobId;
            this.jobGrowId = jobGrowId;
            this.jobName = jobName;
            this.jobGrowName = jobGrowName;
        }
    }

    /**
     * 수집 결과
     */
    public static class CollectionResult {
        public final int successCount;
        public final int failCount;

        public CollectionResult(int successCount, int failCount) {
            this.successCount = successCount;
            this.failCount = failCount;
        }
    }
}
