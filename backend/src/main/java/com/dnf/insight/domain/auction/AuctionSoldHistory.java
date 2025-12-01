package com.dnf.insight.domain.auction;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "auction_sold_history",
       indexes = {
           @Index(name = "idx_item_id", columnList = "itemId"),
           @Index(name = "idx_sold_date", columnList = "soldDate"),
           @Index(name = "idx_item_sold", columnList = "itemId, soldDate")
       })
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionSoldHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "DATETIME")
    private LocalDateTime soldDate;

    // 아이템 정보
    @Column(nullable = false, length = 32)
    private String itemId;

    @Column(nullable = false, length = 100)
    private String itemName;

    @Column(length = 20)
    private String itemRarity;

    // 거래 정보
    @Column(nullable = false)
    private Integer count;

    @Column(nullable = false)
    private Long price;

    @Column(nullable = false)
    private Long unitPrice;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
