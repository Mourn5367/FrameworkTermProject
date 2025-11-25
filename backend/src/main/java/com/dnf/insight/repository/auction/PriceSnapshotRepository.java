package com.dnf.insight.repository.auction;

import com.dnf.insight.domain.auction.PriceSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PriceSnapshotRepository extends JpaRepository<PriceSnapshot, Long> {

    // 아이템별 최근 N일 시세 추이 (시간순 정렬)
    List<PriceSnapshot> findByItemIdAndSnapshotTimeAfterOrderBySnapshotTimeAsc(
            String itemId,
            LocalDateTime since
    );

    // 그래프 데이터 조회 (최근 7일)
    @Query("SELECT s FROM PriceSnapshot s " +
           "WHERE s.itemId = :itemId " +
           "AND s.snapshotTime >= :since " +
           "ORDER BY s.snapshotTime ASC")
    List<PriceSnapshot> findPriceHistory(@Param("itemId") String itemId,
                                         @Param("since") LocalDateTime since);

    // 특정 아이템의 최신 스냅샷
    @Query("SELECT s FROM PriceSnapshot s " +
           "WHERE s.itemId = :itemId " +
           "ORDER BY s.snapshotTime DESC " +
           "LIMIT 1")
    PriceSnapshot findLatestByItemId(@Param("itemId") String itemId);

    // 특정 시간대의 모든 스냅샷
    List<PriceSnapshot> findBySnapshotTime(LocalDateTime snapshotTime);
}
