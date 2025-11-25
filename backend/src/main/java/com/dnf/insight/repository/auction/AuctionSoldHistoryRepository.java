package com.dnf.insight.repository.auction;

import com.dnf.insight.domain.auction.AuctionSoldHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuctionSoldHistoryRepository extends JpaRepository<AuctionSoldHistory, Long> {

    // 아이템별 최근 거래 내역 (최신순)
    List<AuctionSoldHistory> findByItemIdOrderBySoldDateDesc(String itemId);

    // 특정 기간 거래 내역
    List<AuctionSoldHistory> findByItemIdAndSoldDateBetween(
            String itemId,
            LocalDateTime start,
            LocalDateTime end
    );

    // 아이템별 평균 판매가 (특정 기간 이후)
    @Query("SELECT AVG(a.unitPrice) FROM AuctionSoldHistory a " +
           "WHERE a.itemId = :itemId " +
           "AND a.soldDate >= :since")
    Double getAveragePriceSince(@Param("itemId") String itemId,
                                @Param("since") LocalDateTime since);

    // 아이템별 최저 판매가 (특정 기간 이후)
    @Query("SELECT MIN(a.unitPrice) FROM AuctionSoldHistory a " +
           "WHERE a.itemId = :itemId " +
           "AND a.soldDate >= :since")
    Long getMinPriceSince(@Param("itemId") String itemId,
                          @Param("since") LocalDateTime since);

    // 아이템별 최고 판매가 (특정 기간 이후)
    @Query("SELECT MAX(a.unitPrice) FROM AuctionSoldHistory a " +
           "WHERE a.itemId = :itemId " +
           "AND a.soldDate >= :since")
    Long getMaxPriceSince(@Param("itemId") String itemId,
                          @Param("since") LocalDateTime since);

    // 아이템별 거래량 (특정 기간 이후)
    @Query("SELECT COUNT(a) FROM AuctionSoldHistory a " +
           "WHERE a.itemId = :itemId " +
           "AND a.soldDate >= :since")
    Long countSoldSince(@Param("itemId") String itemId,
                        @Param("since") LocalDateTime since);

    // 인기 아이템 TOP 10 (거래량 기준)
    @Query("SELECT a.itemName, COUNT(a) as cnt FROM AuctionSoldHistory a " +
           "WHERE a.soldDate >= :since " +
           "GROUP BY a.itemId, a.itemName " +
           "ORDER BY cnt DESC " +
           "LIMIT 10")
    List<Object[]> findTopSellingItems(@Param("since") LocalDateTime since);
}
