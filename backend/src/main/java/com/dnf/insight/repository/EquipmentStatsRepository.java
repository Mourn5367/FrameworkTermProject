package com.dnf.insight.repository;

import com.dnf.insight.domain.EquipmentStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 장비 통계 Repository
 */
@Repository
public interface EquipmentStatsRepository extends JpaRepository<EquipmentStats, Long> {

    /**
     * jobId + jobGrowId로 통계 조회
     */
    Optional<EquipmentStats> findByJobIdAndJobGrowId(String jobId, String jobGrowId);

    /**
     * jobGrowName으로 통계 조회 (정확 매칭)
     */
    Optional<EquipmentStats> findByJobGrowName(String jobGrowName);

    /**
     * jobGrowName으로 통계 검색 (부분 매칭)
     */
    List<EquipmentStats> findByJobGrowNameContaining(String keyword);
}
