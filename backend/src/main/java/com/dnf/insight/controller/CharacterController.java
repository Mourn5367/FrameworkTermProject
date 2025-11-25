package com.dnf.insight.controller;

import com.dnf.insight.dto.CharacterBasicResponse;
import com.dnf.insight.dto.CharacterSearchResponse;
import com.dnf.insight.dto.PlayTimeAnalysis;
import com.dnf.insight.dto.WeeklyDungeonStatus;
import com.dnf.insight.service.CharacterService;
import com.dnf.insight.service.DnfApiClient;
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
 * 캐릭터 API 컨트롤러
 */
@Tag(name = "캐릭터 조회", description = "던파 캐릭터 검색 및 정보 조회 API")
@Slf4j
@RestController
@RequestMapping("/api/characters")
@RequiredArgsConstructor
public class CharacterController {

    private final CharacterService characterService;
    private final DnfApiClient dnfApiClient;

    /**
     * 캐릭터 기본 정보 조회
     *
     * GET /api/characters/{serverId}/{characterId}/basic
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @return 캐릭터 기본 정보 (모험단명, 길드명 포함)
     */
    @Operation(summary = "캐릭터 기본 정보", description = "캐릭터의 기본 정보를 조회합니다.")
    @GetMapping("/{serverId}/{characterId}/basic")
    public ResponseEntity<CharacterBasicResponse> getCharacterBasic(
            @Parameter(description = "서버 ID", required = true, example = "casillas")
            @PathVariable String serverId,

            @Parameter(description = "캐릭터 ID", required = true, example = "cb87f16da8475750d45ac9ea60ccab39")
            @PathVariable String characterId) {

        log.info("📥 Character basic info request: {}:{}", serverId, characterId);

        CharacterBasicResponse response = dnfApiClient.getCharacterBasicInfo(serverId, characterId);
        return ResponseEntity.ok(response);
    }

    /**
     * 캐릭터 검색
     *
     * GET /api/characters/search?serverId=casillas&characterName=EADG
     *
     * @param serverId 서버 ID (cain, diregie, siroco, prey, casillas, hilder, anton, bakal)
     * @param characterName 캐릭터 닉네임
     * @return 캐릭터 검색 결과
     */
    @Operation(summary = "캐릭터 검색", description = "서버와 닉네임으로 캐릭터를 검색합니다. (5분 캐싱)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "검색 성공"),
            @ApiResponse(responseCode = "404", description = "캐릭터를 찾을 수 없음")
    })
    @GetMapping("/search")
    public ResponseEntity<CharacterSearchResponse> searchCharacter(
            @Parameter(description = "서버 ID", required = true, example = "casillas")
            @RequestParam String serverId,

            @Parameter(description = "캐릭터 닉네임", required = true, example = "EADG")
            @RequestParam String characterName) {

        log.info("📥 Character search request: server={}, name={}", serverId, characterName);

        CharacterSearchResponse response = characterService.searchCharacter(serverId, characterName);

        if (response == null || response.getRows() == null || response.getRows().isEmpty()) {
            log.warn("⚠️ Character not found: {}:{}", serverId, characterName);
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(response);
    }

    /**
     * 주간 던전 현황 조회
     *
     * GET /api/characters/{serverId}/{characterId}/weekly-dungeons
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @return 주간 던전 현황
     */
    @Operation(
            summary = "주간 던전 현황",
            description = "목요일 06시 기준으로 이번 주/지난 주 던전 입장 내역을 분석합니다."
    )
    @GetMapping("/{serverId}/{characterId}/weekly-dungeons")
    public ResponseEntity<WeeklyDungeonStatus> getWeeklyDungeons(
            @Parameter(description = "서버 ID", required = true, example = "casillas")
            @PathVariable String serverId,

            @Parameter(description = "캐릭터 ID", required = true, example = "cb87f16da8475750d45ac9ea60ccab39")
            @PathVariable String characterId) {

        log.info("📥 Weekly dungeon request: {}:{}", serverId, characterId);

        WeeklyDungeonStatus status = characterService.getWeeklyDungeonStatus(serverId, characterId);
        return ResponseEntity.ok(status);
    }

    /**
     * 접속 시간대 패턴 조회
     *
     * GET /api/characters/{serverId}/{characterId}/playtime
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @return 시간대별 활동 패턴
     */
    @Operation(
            summary = "접속 시간대 분석",
            description = "최근 한 달간 타임라인을 분석하여 시간대별 활동 패턴을 파악합니다."
    )
    @GetMapping("/{serverId}/{characterId}/playtime")
    public ResponseEntity<PlayTimeAnalysis> getPlayTime(
            @Parameter(description = "서버 ID", required = true, example = "casillas")
            @PathVariable String serverId,

            @Parameter(description = "캐릭터 ID", required = true, example = "cb87f16da8475750d45ac9ea60ccab39")
            @PathVariable String characterId) {

        log.info("📥 Playtime analysis request: {}:{}", serverId, characterId);

        PlayTimeAnalysis analysis = characterService.getPlayTimeAnalysis(serverId, characterId);
        return ResponseEntity.ok(analysis);
    }

    /**
     * 캐릭터 이미지 URL 조회
     *
     * GET /api/characters/{serverId}/{characterId}/image?zoom=1
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @param zoom 확대 레벨 (1-3, 기본: 1)
     * @return 이미지 URL
     */
    @Operation(summary = "캐릭터 이미지 URL", description = "네오플 이미지 서버의 캐릭터 이미지 URL을 반환합니다.")
    @GetMapping("/{serverId}/{characterId}/image")
    public ResponseEntity<String> getCharacterImage(
            @Parameter(description = "서버 ID", required = true, example = "casillas")
            @PathVariable String serverId,

            @Parameter(description = "캐릭터 ID", required = true, example = "cb87f16da8475750d45ac9ea60ccab39")
            @PathVariable String characterId,

            @Parameter(description = "확대 레벨 (1-3)", example = "1")
            @RequestParam(required = false, defaultValue = "1") Integer zoom) {

        log.info("📥 Character image request: {}:{}, zoom={}", serverId, characterId, zoom);

        String imageUrl = characterService.getCharacterImageUrl(serverId, characterId, zoom);
        return ResponseEntity.ok(imageUrl);
    }

    /**
     * 캐시 무효화
     *
     * DELETE /api/characters/{serverId}/{characterId}/cache
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @return 성공 메시지
     */
    @Operation(summary = "캐시 무효화", description = "캐릭터 정보의 Redis 캐시를 강제로 삭제합니다.")
    @DeleteMapping("/{serverId}/{characterId}/cache")
    public ResponseEntity<String> invalidateCache(
            @Parameter(description = "서버 ID", required = true, example = "casillas")
            @PathVariable String serverId,

            @Parameter(description = "캐릭터 ID", required = true, example = "cb87f16da8475750d45ac9ea60ccab39")
            @PathVariable String characterId) {

        log.info("📥 Cache invalidation request: {}:{}", serverId, characterId);

        characterService.invalidateCache(serverId, characterId);
        return ResponseEntity.ok("Cache invalidated successfully");
    }
}
