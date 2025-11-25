package com.dnf.insight.service.auction;

import com.dnf.insight.domain.auction.AuctionItem;
import com.dnf.insight.domain.auction.AuctionSoldHistory;
import com.dnf.insight.domain.auction.PriceSnapshot;
import com.dnf.insight.domain.auction.TrackedItem;
import com.dnf.insight.dto.auction.AuctionItemResponse;
import com.dnf.insight.dto.auction.AuctionListResponse;
import com.dnf.insight.dto.auction.AuctionSoldListResponse;
import com.dnf.insight.dto.auction.AuctionSoldResponse;
import com.dnf.insight.repository.auction.AuctionItemRepository;
import com.dnf.insight.repository.auction.AuctionSoldHistoryRepository;
import com.dnf.insight.repository.auction.PriceSnapshotRepository;
import com.dnf.insight.repository.auction.TrackedItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 경매장 자동 크롤링 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuctionCrawlerService {

    private final AuctionApiService auctionApiService;
    private final TrackedItemRepository trackedItemRepo;
    private final AuctionItemRepository auctionItemRepo;
    private final AuctionSoldHistoryRepository soldHistoryRepo;
    private final PriceSnapshotRepository priceSnapshotRepo;

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 2분마다 추적 중인 아이템 크롤링
     */
    @Scheduled(fixedDelay = 120000, initialDelay = 10000)
    @Transactional
    public void crawlTrackedItems() {
        log.info("📊 경매장 크롤링 시작...");

        List<TrackedItem> trackedItems = trackedItemRepo.findAll();

        if (trackedItems.isEmpty()) {
            log.info("⚠️ 추적 중인 아이템이 없습니다.");
            return;
        }

        int successCount = 0;
        int failCount = 0;

        for (TrackedItem tracked : trackedItems) {
            try {
                // 네오플 API 호출
                AuctionListResponse response = auctionApiService.searchAuctionByItemId(tracked.getItemId());

                if (response == null || response.getRows() == null) {
                    log.warn("⚠️ 매물 없음: {}", tracked.getItemName());
                    continue;
                }

                // DB에 저장/업데이트
                for (AuctionItemResponse dto : response.getRows()) {
                    saveOrUpdateAuctionItem(dto);
                }

                // 판매 완료 내역 수집
                collectSoldHistory(tracked);

                // PriceSnapshot 생성
                createPriceSnapshot(tracked);

                successCount++;
                log.info("✅ 크롤링 완료: {} ({}건)", tracked.getItemName(), response.getRows().size());

            } catch (Exception e) {
                failCount++;
                log.error("❌ 크롤링 실패: {}", tracked.getItemName(), e);
            }
        }

        log.info("📊 크롤링 완료: 성공={}, 실패={}", successCount, failCount);
    }

    /**
     * 10분마다 만료된 매물 자동 정리
     */
    @Scheduled(fixedDelay = 600000, initialDelay = 60000)
    @Transactional
    public void cleanExpiredItems() {
        try {
            LocalDateTime now = LocalDateTime.now();

            // 만료 시간이 지난 매물 조회
            List<AuctionItem> expiredItems = auctionItemRepo.findAll().stream()
                    .filter(item -> item.getExpireDate() != null && item.getExpireDate().isBefore(now))
                    .collect(Collectors.toList());

            if (expiredItems.isEmpty()) {
                log.debug("🧹 만료된 매물 없음");
                return;
            }

            // 만료된 매물 삭제
            auctionItemRepo.deleteAll(expiredItems);
            log.info("🧹 만료된 매물 정리 완료: {}건 삭제", expiredItems.size());

        } catch (Exception e) {
            log.error("❌ 만료 매물 정리 실패", e);
        }
    }

    /**
     * 판매 완료 내역 수집
     */
    private void collectSoldHistory(TrackedItem tracked) {
        try {
            // 네오플 API에서 판매 완료 내역 조회 (최근 100건)
            AuctionSoldListResponse response = auctionApiService.getSoldHistory(tracked.getItemId());

            if (response == null || response.getRows() == null || response.getRows().isEmpty()) {
                log.debug("⚠️ 판매 내역 없음: {}", tracked.getItemName());
                return;
            }

            int savedCount = 0;
            for (AuctionSoldResponse dto : response.getRows()) {
                // 중복 체크: soldDate + itemId + price 조합으로 확인
                LocalDateTime soldDate = parseDateTime(dto.getSoldDate());

                // 이미 저장된 내역인지 확인 (같은 시간대 + 같은 아이템 + 같은 가격)
                boolean exists = soldHistoryRepo.findByItemIdAndSoldDateBetween(
                        dto.getItemId(),
                        soldDate.minusSeconds(5),
                        soldDate.plusSeconds(5)
                ).stream().anyMatch(h -> h.getPrice().equals(dto.getPrice()));

                if (!exists) {
                    AuctionSoldHistory history = AuctionSoldHistory.builder()
                            .soldDate(soldDate)
                            .itemId(dto.getItemId())
                            .itemName(dto.getItemName())
                            .itemRarity(dto.getItemRarity())
                            .count(dto.getCount())
                            .price(dto.getPrice())
                            .unitPrice(dto.getUnitPrice())
                            .build();

                    soldHistoryRepo.save(history);
                    savedCount++;
                }
            }

            if (savedCount > 0) {
                log.info("💰 판매 내역 저장: {} ({}건)", tracked.getItemName(), savedCount);
            }

        } catch (Exception e) {
            log.error("❌ 판매 내역 수집 실패: {}", tracked.getItemName(), e);
        }
    }

    /**
     * 시세 스냅샷 생성
     */
    private void createPriceSnapshot(TrackedItem tracked) {
        try {
            LocalDateTime now = LocalDateTime.now();
            String itemId = tracked.getItemId();

            // 현재 매물 통계
            List<AuctionItem> items = auctionItemRepo.findByItemIdOrderByUnitPriceAsc(itemId);

            if (items.isEmpty()) {
                log.debug("⚠️ 매물 없음 - 스냅샷 생략: {}", tracked.getItemName());
                return;
            }

            // 최근 24시간 판매 내역
            LocalDateTime oneDayAgo = now.minusHours(24);
            Double soldAvgPrice = soldHistoryRepo.getAveragePriceSince(itemId, oneDayAgo);
            Long soldCount = soldHistoryRepo.countSoldSince(itemId, oneDayAgo);

            // 통계 계산
            Long minPrice = items.stream()
                    .map(AuctionItem::getUnitPrice)
                    .filter(p -> p != null && p > 0)
                    .min(Long::compareTo)
                    .orElse(0L);

            Long maxPrice = items.stream()
                    .map(AuctionItem::getUnitPrice)
                    .filter(p -> p != null && p > 0)
                    .max(Long::compareTo)
                    .orElse(0L);

            Double avgPrice = items.stream()
                    .map(AuctionItem::getUnitPrice)
                    .filter(p -> p != null && p > 0)
                    .mapToLong(Long::longValue)
                    .average()
                    .orElse(0.0);

            Integer itemCount = items.stream()
                    .mapToInt(AuctionItem::getCount)
                    .sum();

            // PriceSnapshot 저장
            PriceSnapshot snapshot = new PriceSnapshot();
            snapshot.setItemId(itemId);
            snapshot.setItemName(tracked.getItemName());
            snapshot.setSnapshotTime(now);
            snapshot.setAvgPrice(avgPrice.longValue());
            snapshot.setMinPrice(minPrice);
            snapshot.setMaxPrice(maxPrice);
            snapshot.setSoldAvgPrice(soldAvgPrice != null ? soldAvgPrice.longValue() : null);
            snapshot.setSoldCount(soldCount != null ? soldCount.intValue() : 0);
            snapshot.setItemCount(itemCount);

            priceSnapshotRepo.save(snapshot);
            log.debug("📸 스냅샷 생성: {} (평균: {}골드, 판매: {}건)",
                    tracked.getItemName(), avgPrice.longValue(), soldCount != null ? soldCount : 0);

        } catch (Exception e) {
            log.error("❌ 스냅샷 생성 실패: {}", tracked.getItemName(), e);
        }
    }

    /**
     * 경매 매물 저장/업데이트
     */
    private void saveOrUpdateAuctionItem(AuctionItemResponse dto) {
        AuctionItem item = auctionItemRepo
                .findByAuctionNo(dto.getAuctionNo())
                .orElse(new AuctionItem());

        item.setAuctionNo(dto.getAuctionNo());
        item.setRegDate(parseDateTime(dto.getRegDate()));
        item.setExpireDate(parseDateTime(dto.getExpireDate()));

        item.setItemId(dto.getItemId());
        item.setItemName(dto.getItemName());
        item.setItemRarity(dto.getItemRarity());

        item.setCount(dto.getCount());
        item.setRegCount(dto.getRegCount());
        item.setCurrentPrice(dto.getCurrentPrice());
        item.setUnitPrice(dto.getUnitPrice());
        item.setAveragePrice(dto.getAveragePrice());

        auctionItemRepo.save(item);
    }

    /**
     * 날짜 문자열 파싱
     */
    private LocalDateTime parseDateTime(String dateStr) {
        try {
            return LocalDateTime.parse(dateStr, DATE_FORMATTER);
        } catch (Exception e) {
            return LocalDateTime.now();
        }
    }
}
