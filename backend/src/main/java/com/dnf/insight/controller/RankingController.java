package com.dnf.insight.controller;

import com.dnf.insight.service.RankingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "랭킹 수집", description = "던파 캐릭터 랭킹 및 장비 수집 API")
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
    @Operation(
            summary = "특정 직업 장비 수집",
            description = "지정한 각성 직업(jobGrowId)의 상위 100명 캐릭터의 장비 + 스킬 정보를 수집합니다.\n\n" +
                    "**수집 과정:**\n" +
                    "1. 명성 기준 상위 100명 캐릭터 조회\n" +
                    "2. 각 캐릭터의 장비 + 스킬 API 병렬 호출\n" +
                    "3. MongoDB에 저장 (기존 데이터 덮어쓰기)\n\n" +
                    "**소요 시간:** 약 3초"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "수집 성공",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "jobId": "41f1cdc2df0c91a0478e8bda2684d08f",
                                      "jobGrowId": "37495b941da3b1661bc900e68ef3b2c6",
                                      "jobName": "귀검사(남)",
                                      "jobGrowName": "眞 웨폰마스터",
                                      "successCount": 100,
                                      "failCount": 0,
                                      "totalCount": 100
                                    }
                                    """)
                    )
            ),
            @ApiResponse(responseCode = "500", description = "수집 실패")
    })
    @PostMapping("/collect")
    public ResponseEntity<Map<String, Object>> collectEquipments(
            @Parameter(description = "직업 ID (예: 귀검사(남))", required = true, example = "41f1cdc2df0c91a0478e8bda2684d08f")
            @RequestParam String jobId,

            @Parameter(description = "각성 직업 ID (예: 眞 웨폰마스터)", required = true, example = "37495b941da3b1661bc900e68ef3b2c6")
            @RequestParam String jobGrowId,

            @Parameter(description = "직업명 (자동 입력됨)", example = "귀검사(남)")
            @RequestParam(required = false, defaultValue = "Unknown") String jobName,

            @Parameter(description = "각성 직업명 (자동 입력됨)", example = "眞 웨폰마스터")
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
    @Operation(
            summary = "jobId 그룹 병렬 수집",
            description = "같은 직업(jobId)에 속한 여러 각성 직업(jobGrowId)을 동시에 수집합니다.\n\n" +
                    "**예시:** 귀검사(남)의 5개 각성 직업 (웨폰마스터, 소울브링어, 버서커, 아수라, 검귀)\n\n" +
                    "**수집 과정:**\n" +
                    "1. 각 jobGrowId의 상위 100명을 병렬로 수집\n" +
                    "2. 총 500명 (5개 × 100명)의 장비 + 스킬 수집\n" +
                    "3. MongoDB에 저장\n\n" +
                    "**소요 시간:** 약 3초 (병렬 처리)"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "수집 성공",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "jobName": "귀검사(남)",
                                      "jobCount": 5,
                                      "successCount": 500,
                                      "failCount": 0,
                                      "totalCount": 500
                                    }
                                    """)
                    )
            ),
            @ApiResponse(responseCode = "500", description = "수집 실패")
    })
    @PostMapping("/collect-by-jobid")
    public ResponseEntity<Map<String, Object>> collectByJobId(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "직업 정보 배열 (같은 jobId의 여러 jobGrowId)",
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    [
                                      {
                                        "jobId": "41f1cdc2df0c91a0478e8bda2684d08f",
                                        "jobGrowId": "37495b941da3b1661bc900e68ef3b2c6",
                                        "jobName": "귀검사(남)",
                                        "jobGrowName": "眞 웨폰마스터"
                                      },
                                      {
                                        "jobId": "41f1cdc2df0c91a0478e8bda2684d08f",
                                        "jobGrowId": "618326026de1a1f1cfba5dbd0b8396e7",
                                        "jobName": "귀검사(남)",
                                        "jobGrowName": "眞 소울브링어"
                                      }
                                    ]
                                    """)
                    )
            )
            @RequestBody List<Map<String, String>> jobs) {
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
