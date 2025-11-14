package com.dnf.insight.controller;

import com.dnf.insight.domain.CharacterEquipment;
import com.dnf.insight.service.EquipmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 장비 정보 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/characters/{serverId}/{characterId}/equipment")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentService equipmentService;

    /**
     * 캐릭터 장비 조회 (DB에서)
     *
     * GET /api/characters/{serverId}/{characterId}/equipment
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @return 장비 정보
     */
    @GetMapping
    public ResponseEntity<CharacterEquipment> getEquipment(
            @PathVariable String serverId,
            @PathVariable String characterId) {
        log.info("📦 GET /api/characters/{}/{}/equipment", serverId, characterId);

        CharacterEquipment equipment = equipmentService.getEquipment(serverId, characterId);

        if (equipment == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(equipment);
    }

    /**
     * 캐릭터 장비 갱신 (API 호출 → DB 저장)
     *
     * POST /api/characters/{serverId}/{characterId}/equipment/refresh
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @return 저장된 장비 정보
     */
    @PostMapping("/refresh")
    public ResponseEntity<CharacterEquipment> refreshEquipment(
            @PathVariable String serverId,
            @PathVariable String characterId) {
        log.info("🔄 POST /api/characters/{}/{}/equipment/refresh", serverId, characterId);

        try {
            CharacterEquipment equipment = equipmentService.saveEquipment(serverId, characterId);
            return ResponseEntity.ok(equipment);
        } catch (Exception e) {
            log.error("❌ Equipment refresh failed: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
