package com.dnf.insight.controller;

import com.dnf.insight.dto.JobEquipmentStats;
import com.dnf.insight.service.EquipmentStatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 장비 통계 컨트롤러
 */
@Tag(name = "장비 통계", description = "직업별 장비 및 스킬 사용 통계 API")
@Slf4j
@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class EquipmentStatsController {

    private final EquipmentStatsService statsService;

    /**
     * 직업별 장비 통계 조회
     *
     * @param jobId 직업 ID
     * @param jobGrowId 각성 직업 ID
     * @return 장비 통계
     */
    @Operation(
            summary = "직업별 장비 통계",
            description = "지정한 각성 직업(jobGrowId)의 상위 100명 장비/스킬 사용 통계를 반환합니다.\n\n" +
                    "**통계 항목:**\n" +
                    "- 무기 타입 및 튠\n" +
                    "- 칭호\n" +
                    "- 방어구 융합석 (상의/하의/머리어깨/신발/벨트)\n" +
                    "- 방어구 세트 (기품/욕망/배신)\n" +
                    "- 악세서리 융합석 (목걸이/팔찌/반지) 및 조합\n" +
                    "- 특수장비 융합석 (보조장비/마법석/귀걸이) 및 조합\n" +
                    "- 세트 아이템\n" +
                    "- 진화/강화 스킬"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "통계 조회 성공",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "jobId": "41f1cdc2df0c91a0478e8bda2684d08f",
                                      "jobGrowId": "37495b941da3b1661bc900e68ef3b2c6",
                                      "jobName": "귀검사(남)",
                                      "jobGrowName": "眞 웨폰마스터",
                                      "totalCharacters": 100,
                                      "weaponTypes": [
                                        {"itemId": null, "itemName": "소태도", "count": 80, "percentage": 80.0},
                                        {"itemId": null, "itemName": "대검", "count": 20, "percentage": 20.0}
                                      ],
                                      "weaponTunes": [
                                        {"itemId": null, "itemName": "새겨진 해일의 기억", "count": 95, "percentage": 95.0}
                                      ],
                                      "accessoryCombinations": [
                                        {"combination": "축복, 무지, 무지", "count": 60, "percentage": 60.0}
                                      ]
                                    }
                                    """)
                    )
            ),
            @ApiResponse(responseCode = "404", description = "데이터 없음")
    })
    @GetMapping("/equipment")
    public ResponseEntity<JobEquipmentStats> getEquipmentStats(
            @Parameter(description = "직업 ID", required = true, example = "41f1cdc2df0c91a0478e8bda2684d08f")
            @RequestParam String jobId,

            @Parameter(description = "각성 직업 ID", required = true, example = "37495b941da3b1661bc900e68ef3b2c6")
            @RequestParam String jobGrowId) {

        log.info("📊 Equipment stats request: jobId={}, jobGrowId={}", jobId, jobGrowId);

        JobEquipmentStats stats = statsService.getJobEquipmentStats(jobId, jobGrowId);

        if (stats == null) {
            log.warn("⚠️ No stats found for jobId={}, jobGrowId={}", jobId, jobGrowId);
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(stats);
    }
}
