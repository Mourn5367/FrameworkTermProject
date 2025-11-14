package com.dnf.insight.controller;

import com.dnf.insight.dto.CharacterSearchResponse;
import com.dnf.insight.dto.PlayTimeAnalysis;
import com.dnf.insight.dto.WeeklyDungeonStatus;
import com.dnf.insight.service.CharacterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 캐릭터 API 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/characters")
@RequiredArgsConstructor
public class CharacterController {

    private final CharacterService characterService;

    /**
     * 캐릭터 검색
     *
     * GET /api/characters/search?serverId=casillas&characterName=EADG
     *
     * @param serverId 서버 ID (cain, diregie, siroco, prey, casillas, hilder, anton, bakal)
     * @param characterName 캐릭터 닉네임
     * @return 캐릭터 검색 결과
     */
    @GetMapping("/search")
    public ResponseEntity<CharacterSearchResponse> searchCharacter(
            @RequestParam String serverId,
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
    @GetMapping("/{serverId}/{characterId}/weekly-dungeons")
    public ResponseEntity<WeeklyDungeonStatus> getWeeklyDungeons(
            @PathVariable String serverId,
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
    @GetMapping("/{serverId}/{characterId}/playtime")
    public ResponseEntity<PlayTimeAnalysis> getPlayTime(
            @PathVariable String serverId,
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
    @GetMapping("/{serverId}/{characterId}/image")
    public ResponseEntity<String> getCharacterImage(
            @PathVariable String serverId,
            @PathVariable String characterId,
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
    @DeleteMapping("/{serverId}/{characterId}/cache")
    public ResponseEntity<String> invalidateCache(
            @PathVariable String serverId,
            @PathVariable String characterId) {

        log.info("📥 Cache invalidation request: {}:{}", serverId, characterId);

        characterService.invalidateCache(serverId, characterId);
        return ResponseEntity.ok("Cache invalidated successfully");
    }
}
