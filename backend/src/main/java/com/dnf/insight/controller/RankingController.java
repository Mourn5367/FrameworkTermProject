package com.dnf.insight.controller;

import com.dnf.insight.service.RankingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 랭킹 수집 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/ranking")
@RequiredArgsConstructor
public class RankingController {

    private final RankingService rankingService;

    /**
     * 특정 직업의 상위 100명 장비 수집
     *
     * @param jobId 직업 ID
     * @param jobGrowId 각성 직업 ID
     * @param jobName 직업명 (옵션)
     * @param jobGrowName 각성 직업명 (옵션)
     * @return 수집 결과
     */
    @PostMapping("/collect")
    public ResponseEntity<Map<String, Object>> collectEquipments(
            @RequestParam String jobId,
            @RequestParam String jobGrowId,
            @RequestParam(required = false, defaultValue = "Unknown") String jobName,
            @RequestParam(required = false, defaultValue = "Unknown") String jobGrowName) {

        log.info("🎯 Collection request: jobId={}, jobGrowId={}, jobName={}, jobGrowName={}",
                jobId, jobGrowId, jobName, jobGrowName);

        try {
            RankingService.CollectionResult result = rankingService.collectEquipmentsForJob(
                    jobId, jobGrowId, jobName, jobGrowName
            );

            Map<String, Object> response = new HashMap<>();
            response.put("jobId", jobId);
            response.put("jobGrowId", jobGrowId);
            response.put("jobName", jobName);
            response.put("jobGrowName", jobGrowName);
            response.put("successCount", result.successCount);
            response.put("failCount", result.failCount);
            response.put("totalCount", result.successCount + result.failCount);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Collection failed: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    /**
     * 같은 jobId에 속한 모든 직업을 병렬로 수집
     *
     * @param jobs JSON 배열: [{"jobId":"...", "jobGrowId":"...", "jobName":"...", "jobGrowName":"..."}]
     * @return 수집 결과
     */
    @PostMapping("/collect-by-jobid")
    public ResponseEntity<Map<String, Object>> collectByJobId(@RequestBody List<Map<String, String>> jobs) {
        log.info("🎯 Parallel collection request for {} jobs", jobs.size());

        try {
            // Map -> JobInfo 변환
            List<RankingService.JobInfo> jobInfos = jobs.stream()
                    .map(job -> new RankingService.JobInfo(
                            job.get("jobId"),
                            job.get("jobGrowId"),
                            job.get("jobName"),
                            job.get("jobGrowName")
                    ))
                    .collect(java.util.stream.Collectors.toList());

            RankingService.CollectionResult result = rankingService.collectEquipmentsByJobId(jobInfos);

            Map<String, Object> response = new HashMap<>();
            response.put("jobName", jobInfos.get(0).jobName);
            response.put("jobCount", jobInfos.size());
            response.put("successCount", result.successCount);
            response.put("failCount", result.failCount);
            response.put("totalCount", result.successCount + result.failCount);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Parallel collection failed: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}
