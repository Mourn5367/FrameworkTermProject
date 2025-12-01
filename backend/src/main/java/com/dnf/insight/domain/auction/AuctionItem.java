package com.dnf.insight.domain.auction;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "auction_items",
       indexes = {
           @Index(name = "idx_item_id", columnList = "itemId"),
           @Index(name = "idx_unit_price", columnList = "unitPrice"),
           @Index(name = "idx_reg_date", columnList = "regDate")
       })
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private Long auctionNo;

    @Column(nullable = false, columnDefinition = "DATETIME")
    private LocalDateTime regDate;

    @Column(nullable = false, columnDefinition = "DATETIME")
    private LocalDateTime expireDate;

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

    private Integer regCount;
    private Long currentPrice;
    private Long unitPrice;
    private Long averagePrice;

    // 메타 정보
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
