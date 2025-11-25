package com.dnf.insight.repository;

import com.dnf.insight.domain.CharacterEquipment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 캐릭터 장비 Repository
 */
@Repository
public interface CharacterEquipmentRepository extends MongoRepository<CharacterEquipment, String> {

    /**
     * serverId + characterId로 캐릭터 장비 조회
     */
    Optional<CharacterEquipment> findByServerIdAndCharacterId(String serverId, String characterId);

    /**
     * jobGrowId로 해당 직업의 모든 장비 조회 (통계용)
     */
    List<CharacterEquipment> findByJobGrowId(String jobGrowId);

    /**
     * jobId로 해당 직업의 모든 장비 조회 (통계용)
     */
    List<CharacterEquipment> findByJobId(String jobId);

    /**
     * jobGrowId로 해당 직업의 데이터 개수 조회
     */
    long countByJobGrowId(String jobGrowId);

    /**
     * jobGrowId로 해당 직업의 모든 장비 삭제 (재수집 전)
     */
    void deleteByJobGrowId(String jobGrowId);

    /**
     * jobId + jobGrowId 조합으로 데이터 개수 조회
     */
    long countByJobIdAndJobGrowId(String jobId, String jobGrowId);

    /**
     * jobId + jobGrowId 조합으로 모든 장비 조회 (통계용)
     */
    List<CharacterEquipment> findByJobIdAndJobGrowId(String jobId, String jobGrowId);

    /**
     * jobId + jobGrowId 조합으로 모든 장비 삭제 (재수집 전)
     */
    void deleteByJobIdAndJobGrowId(String jobId, String jobGrowId);
}
