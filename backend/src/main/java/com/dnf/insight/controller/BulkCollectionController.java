package com.dnf.insight.controller;

import com.dnf.insight.service.RankingService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.*;

/**
 * 전체 직업 일괄 수집 컨트롤러
 */
@Tag(name = "일괄 수집", description = "전체 직업 데이터 일괄 수집 API")
@Slf4j
@RestController
@RequestMapping("/api/bulk")
@RequiredArgsConstructor
public class BulkCollectionController {

    private final RankingService rankingService;
    private final ObjectMapper objectMapper;


    /**
     * 전체 직업 수집 (眞 직업만)
     *
     * POST /api/bulk/collect-all
     *
     * @return 수집 결과
     */
    @Operation(
            summary = "전체 직업 일괄 수집",
            description = "jobs.json에 정의된 모든 眞 직업 (약 69개)의 상위 100명씩 수집합니다.\n\n" +
                    "**수집 과정:**\n" +
                    "1. jobs.json에서 전체 眞 직업 목록 로드\n" +
                    "2. 각 직업의 상위 100명 장비 + 스킬 수집 (병렬 처리)\n" +
                    "3. MongoDB에 저장 (기존 데이터 덮어쓰기)\n\n" +
                    "**예상 소요 시간:** 약 5~10분 (69개 직업 × 100명 = 6900명)\n\n" +
                    "**주의:** 네오플 API Rate Limit 고려하여 순차 실행"
    )
    @PostMapping("/collect-all")
    public ResponseEntity<Map<String, Object>> collectAll() {
        try {
            // Service의 랭킹 수집 메서드 호출
            List<RankingService.JobInfo> allJobs = rankingService.loadAllJobs();

            // jobId로 그룹화
            Map<String, List<RankingService.JobInfo>> jobGroups = allJobs.stream()
                    .collect(java.util.stream.Collectors.groupingBy(job -> job.jobId));

            int totalSuccess = 0;
            int totalFail = 0;

            // 각 jobId 그룹을 순차적으로 처리 (병렬 처리는 Service 내부에서)
            int groupIndex = 0;
            for (Map.Entry<String, List<RankingService.JobInfo>> entry : jobGroups.entrySet()) {
                groupIndex++;
                List<RankingService.JobInfo> jobs = entry.getValue();
                String jobName = jobs.get(0).jobName;

                log.info("📊 [{}/{}] Collecting jobId group: {} ({} jobs)",
                        groupIndex, jobGroups.size(), jobName, jobs.size());

                // Service의 병렬 처리 메서드 호출
                RankingService.CollectionResult result = rankingService.collectEquipmentsByJobId(jobs);

                totalSuccess += result.successCount;
                totalFail += result.failCount;

                // Rate Limiting: jobId 그룹 간 5초 대기
                if (groupIndex < jobGroups.size()) {
                    log.info("⏳ Waiting 0.5 seconds before next jobId group...");
                    Thread.sleep(500);
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("totalJobs", allJobs.size());
            response.put("totalSuccess", totalSuccess);
            response.put("totalFail", totalFail);
            response.put("successRate", String.format("%.1f%%",
                    totalSuccess * 100.0 / (totalSuccess + totalFail)));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Bulk collection failed: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    /**
     * jobs.json에서 전체 眞 직업 목록 조회
     *
     * GET /api/bulk/jobs
     *
     * @return 전체 眞 직업 리스트
     */
    @Operation(
            summary = "전체 眞 직업 목록 조회",
            description = "jobs.json에 정의된 모든 眞 직업의 목록을 반환합니다."
    )
    @GetMapping("/jobs")
    public ResponseEntity<Map<String, Object>> getAllJobs() {
        try {
            List<RankingService.JobInfo> allJobs = rankingService.loadAllJobs();

            Map<String, Object> response = new HashMap<>();
            response.put("totalCount", allJobs.size());
            response.put("jobs", allJobs.stream()
                    .map(job -> {
                        Map<String, String> jobMap = new HashMap<>();
                        jobMap.put("jobId", job.jobId);
                        jobMap.put("jobGrowId", job.jobGrowId);
                        jobMap.put("jobName", job.jobName);
                        jobMap.put("jobGrowName", job.jobGrowName);
                        return jobMap;
                    })
                    .toList());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Failed to load jobs: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}
