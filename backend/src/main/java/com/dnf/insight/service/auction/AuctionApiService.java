package com.dnf.insight.service.auction;

import com.dnf.insight.dto.auction.AuctionListResponse;
import com.dnf.insight.dto.auction.AuctionSoldListResponse;
import com.dnf.insight.dto.auction.ItemSearchResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * 네오플 경매장 API 호출 서비스
 */
@Slf4j
@Service
public class AuctionApiService {

    private final WebClient webClient;
    private final String apiKey;

    public AuctionApiService(WebClient.Builder webClientBuilder,
                             @Value("${dnf.api.base-url}") String baseUrl,
                             @Value("${dnf.api.keys}") String apiKeys) {
        this.webClient = webClientBuilder.baseUrl(baseUrl).build();
        // 두 번째 API 키 사용 (추후 다중 키 관리 추가 가능)
        this.apiKey = apiKeys.split(",")[1].trim();
    }

    /**
     * 아이템 ID로 현재 경매 매물 검색
     * 네오플 API 최대 limit: 400개
     */
    public AuctionListResponse searchAuctionByItemId(String itemId) {
        try {
            String url = String.format("/df/auction?itemId=%s&limit=400&apikey=%s", itemId, apiKey);

            AuctionListResponse response = webClient
                    .get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(AuctionListResponse.class)
                    .block();

            log.info("✅ 경매 검색 성공: itemId={}, 매물 수={}",
                    itemId, response != null ? response.getRows().size() : 0);

            return response;

        } catch (Exception e) {
            log.error("❌ 경매 검색 실패: itemId={}", itemId, e);
            throw new RuntimeException("경매 검색 실패: " + e.getMessage(), e);
        }
    }

    /**
     * 특정 경매 매물 상세 조회
     */
    public AuctionListResponse getAuctionDetail(Long auctionNo) {
        try {
            String url = String.format("/df/auction/%d?apikey=%s", auctionNo, apiKey);

            AuctionListResponse response = webClient
                    .get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(AuctionListResponse.class)
                    .block();

            log.info("✅ 경매 상세 조회 성공: auctionNo={}", auctionNo);
            return response;

        } catch (Exception e) {
            log.error("❌ 경매 상세 조회 실패: auctionNo={}", auctionNo, e);
            return null;  // 404면 매물 사라짐
        }
    }

    /**
     * 판매 완료 내역 조회 (아이템 ID로)
     * 네오플 API 최대 limit: 100개
     */
    public AuctionSoldListResponse getSoldHistory(String itemId) {
        try {
            String url = String.format("/df/auction-sold?itemId=%s&limit=100&apikey=%s", itemId, apiKey);

            AuctionSoldListResponse response = webClient
                    .get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(AuctionSoldListResponse.class)
                    .block();

            log.info("✅ 판매 내역 조회 성공: itemId={}, 거래 수={}",
                    itemId, response != null ? response.getRows().size() : 0);

            return response;

        } catch (Exception e) {
            log.error("❌ 판매 내역 조회 실패: itemId={}", itemId, e);
            return null;
        }
    }

    /**
     * 아이템 검색 (이름으로)
     * 네오플 API 최대 limit: 30개
     * wordType=full: 부분 일치 검색 (더 많은 결과)
     */
    public ItemSearchResponse searchItems(String itemName) {
        try {
            // UriComponentsBuilder로 쿼리 파라미터만 구성
            String queryString = UriComponentsBuilder.newInstance()
                    .queryParam("wordType", "full")
                    .queryParam("limit", 30)
                    .queryParam("apikey", apiKey)
                    .queryParam("itemName", itemName)
                    .build()
                    .encode()
                    .toUriString();

            // WebClient의 baseUrl과 결합 (재인코딩 방지)
            ItemSearchResponse response = webClient
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/df/items")
                            .replaceQuery(queryString.substring(1))  // 맨 앞 '?' 제거
                            .build())
                    .retrieve()
                    .bodyToMono(ItemSearchResponse.class)
                    .block();

            log.info("✅ 아이템 검색 성공: itemName={}, 결과 수={}",
                    itemName, response != null && response.getRows() != null ? response.getRows().size() : 0);

            return response;

        } catch (Exception e) {
            log.error("❌ 아이템 검색 실패: itemName={}", itemName, e);
            return null;
        }
    }
}
