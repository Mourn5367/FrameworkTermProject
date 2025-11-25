package com.dnf.insight.repository.auction;

import com.dnf.insight.domain.auction.AuctionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuctionItemRepository extends JpaRepository<AuctionItem, Long> {

    // 경매 번호로 조회
    Optional<AuctionItem> findByAuctionNo(Long auctionNo);

    // 아이템 ID로 현재 매물 조회 (가격순 정렬)
    List<AuctionItem> findByItemIdOrderByUnitPriceAsc(String itemId);

    // 아이템 ID로 조회
    List<AuctionItem> findByItemId(String itemId);

    // 아이템별 최저가 조회
    @Query("SELECT a FROM AuctionItem a WHERE a.itemId = :itemId ORDER BY a.unitPrice ASC LIMIT 1")
    Optional<AuctionItem> findCheapestByItemId(@Param("itemId") String itemId);

    // 아이템별 평균가 계산
    @Query("SELECT AVG(a.unitPrice) FROM AuctionItem a WHERE a.itemId = :itemId")
    Double getAveragePrice(@Param("itemId") String itemId);

    // 등록된 고유 아이템 ID 목록
    @Query("SELECT DISTINCT a.itemId FROM AuctionItem a")
    List<String> findDistinctItemIds();

    // 아이템별 매물 수 카운트
    long countByItemId(String itemId);
}
