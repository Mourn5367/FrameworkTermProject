package com.dnf.insight.controller;

import com.dnf.insight.domain.auction.AuctionItem;
import com.dnf.insight.domain.auction.AuctionSoldHistory;
import com.dnf.insight.domain.auction.PriceSnapshot;
import com.dnf.insight.domain.auction.TrackedItem;
import com.dnf.insight.dto.auction.AddTrackedItemRequest;
import com.dnf.insight.dto.auction.ItemSearchResponse;
import com.dnf.insight.dto.auction.PriceChartResponse;
import com.dnf.insight.repository.auction.AuctionItemRepository;
import com.dnf.insight.repository.auction.AuctionSoldHistoryRepository;
import com.dnf.insight.repository.auction.PriceSnapshotRepository;
import com.dnf.insight.repository.auction.TrackedItemRepository;
import com.dnf.insight.service.auction.AuctionApiService;
import com.dnf.insight.service.auction.AuctionCrawlerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/auction")
@RequiredArgsConstructor
public class AuctionController {

    private final TrackedItemRepository trackedItemRepo;
    private final AuctionItemRepository auctionItemRepo;
    private final AuctionSoldHistoryRepository soldHistoryRepo;
    private final PriceSnapshotRepository priceSnapshotRepo;
    private final AuctionApiService auctionApiService;
    private final AuctionCrawlerService crawlerService;

    /**
     * 추적 아이템 목록 조회
     */
    @GetMapping("/tracked-items")
    public ResponseEntity<List<TrackedItem>> getTrackedItems() {
        return ResponseEntity.ok(trackedItemRepo.findAll());
    }

    /**
     * 추적 아이템 추가
     */
    @PostMapping("/tracked-items")
    public ResponseEntity<TrackedItem> addTrackedItem(@RequestBody AddTrackedItemRequest request) {
        // 중복 확인
        if (trackedItemRepo.existsByItemId(request.getItemId())) {
            return ResponseEntity.badRequest().build();
        }

        TrackedItem item = TrackedItem.builder()
                .itemId(request.getItemId())
                .itemName(request.getItemName())
                .build();

        return ResponseEntity.ok(trackedItemRepo.save(item));
    }

    /**
     * 추적 아이템 삭제
     */
    @DeleteMapping("/tracked-items/{id}")
    public ResponseEntity<Void> deleteTrackedItem(@PathVariable Long id) {
        trackedItemRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 아이템별 현재 매물 조회
     */
    @GetMapping("/items/{itemId}")
    public ResponseEntity<List<AuctionItem>> getAuctionItems(@PathVariable String itemId) {
        List<AuctionItem> items = auctionItemRepo.findByItemIdOrderByUnitPriceAsc(itemId);
        return ResponseEntity.ok(items);
    }

    /**
     * 아이템 시세 그래프 데이터 (최근 N일)
     */
    @GetMapping("/items/{itemId}/chart")
    public ResponseEntity<PriceChartResponse> getPriceChart(
            @PathVariable String itemId,
            @RequestParam(defaultValue = "7") int days) {

        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<PriceSnapshot> snapshots = priceSnapshotRepo.findPriceHistory(itemId, since);

        if (snapshots.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PriceChartResponse response = PriceChartResponse.builder()
                .itemId(itemId)
                .itemName(snapshots.get(0).getItemName())
                .labels(snapshots.stream()
                        .map(s -> s.getSnapshotTime().toString())
                        .collect(Collectors.toList()))
                .avgPrices(snapshots.stream()
                        .map(PriceSnapshot::getAvgPrice)
                        .collect(Collectors.toList()))
                .minPrices(snapshots.stream()
                        .map(PriceSnapshot::getMinPrice)
                        .collect(Collectors.toList()))
                .maxPrices(snapshots.stream()
                        .map(PriceSnapshot::getMaxPrice)
                        .collect(Collectors.toList()))
                .soldAvgPrices(snapshots.stream()
                        .map(PriceSnapshot::getSoldAvgPrice)
                        .collect(Collectors.toList()))
                .soldCounts(snapshots.stream()
                        .map(PriceSnapshot::getSoldCount)
                        .collect(Collectors.toList()))
                .itemCounts(snapshots.stream()
                        .map(PriceSnapshot::getItemCount)
                        .collect(Collectors.toList()))
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * 수동 크롤링 트리거
     */
    @PostMapping("/crawl")
    public ResponseEntity<String> triggerCrawl() {
        crawlerService.crawlTrackedItems();
        return ResponseEntity.ok("크롤링이 시작되었습니다.");
    }

    /**
     * 판매 완료 내역 조회
     */
    @GetMapping("/items/{itemId}/sold-history")
    public ResponseEntity<List<AuctionSoldHistory>> getSoldHistory(
            @PathVariable String itemId,
            @RequestParam(defaultValue = "100") int limit) {

        List<AuctionSoldHistory> history = soldHistoryRepo.findByItemIdOrderBySoldDateDesc(itemId);

        // limit 적용
        if (history.size() > limit) {
            history = history.subList(0, limit);
        }

        return ResponseEntity.ok(history);
    }

    /**
     * 아이템 통계 (가격, 공급량, 거래량)
     */
    @GetMapping("/items/{itemId}/stats")
    public ResponseEntity<ItemStatsResponse> getItemStats(
            @PathVariable String itemId,
            @RequestParam(defaultValue = "24") int hours) {

        LocalDateTime since = LocalDateTime.now().minusHours(hours);

        // 현재 매물 통계
        List<AuctionItem> currentItems = auctionItemRepo.findByItemIdOrderByUnitPriceAsc(itemId);

        // 가격 통계
        Long minPrice = currentItems.stream()
                .map(AuctionItem::getUnitPrice)
                .filter(p -> p != null && p > 0)
                .min(Long::compareTo)
                .orElse(0L);

        Long maxPrice = currentItems.stream()
                .map(AuctionItem::getUnitPrice)
                .filter(p -> p != null && p > 0)
                .max(Long::compareTo)
                .orElse(0L);

        Double avgPrice = currentItems.stream()
                .map(AuctionItem::getUnitPrice)
                .filter(p -> p != null && p > 0)
                .mapToLong(Long::longValue)
                .average()
                .orElse(0.0);

        // 공급량 (현재 경매장에 등록된 총 개수)
        Integer totalSupply = currentItems.stream()
                .mapToInt(AuctionItem::getCount)
                .sum();

        // 거래량 (최근 N시간 판매 완료 건수)
        Long soldCount = soldHistoryRepo.countSoldSince(itemId, since);

        // 판매 평균가
        Double soldAvgPrice = soldHistoryRepo.getAveragePriceSince(itemId, since);

        ItemStatsResponse stats = ItemStatsResponse.builder()
                .itemId(itemId)
                .currentMinPrice(minPrice)
                .currentMaxPrice(maxPrice)
                .currentAvgPrice(avgPrice.longValue())
                .totalSupply(totalSupply)
                .soldCount(soldCount != null ? soldCount.intValue() : 0)
                .soldAvgPrice(soldAvgPrice != null ? soldAvgPrice.longValue() : null)
                .hoursRange(hours)
                .build();

        return ResponseEntity.ok(stats);
    }

    /**
     * 아이템 검색 (관리자용)
     */
    @GetMapping("/admin/search-items")
    public ResponseEntity<ItemSearchResponse> searchItems(@RequestParam String itemName) {
        if (itemName == null || itemName.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        // 디버깅: 받은 itemName 확인
        log.info("🔍 컨트롤러에서 받은 itemName: [{}], 길이: {}, bytes: {}",
                itemName, itemName.length(),
                java.util.Arrays.toString(itemName.getBytes(java.nio.charset.StandardCharsets.UTF_8)));

        ItemSearchResponse response = auctionApiService.searchItems(itemName);

        if (response == null || response.getRows() == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(response);
    }

    /**
     * 아이템 통계 응답 DTO
     */
    @lombok.Data
    @lombok.Builder
    public static class ItemStatsResponse {
        private String itemId;

        // 현재 가격 (단가 기준)
        private Long currentMinPrice;      // 최저가
        private Long currentMaxPrice;      // 최고가
        private Long currentAvgPrice;      // 평균가

        // 공급량
        private Integer totalSupply;       // 현재 경매장 총 재고

        // 거래량 (최근 N시간)
        private Integer soldCount;         // 판매 건수
        private Long soldAvgPrice;         // 판매 평균가

        private Integer hoursRange;        // 통계 기간 (시간)
    }
}
