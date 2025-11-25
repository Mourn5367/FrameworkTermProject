package com.dnf.insight.domain.auction;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "price_snapshots",
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_item_snapshot", columnNames = {"itemId", "snapshotTime"})
       },
       indexes = {
           @Index(name = "idx_item_time", columnList = "itemId, snapshotTime"),
           @Index(name = "idx_snapshot_time", columnList = "snapshotTime")
       })
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 32)
    private String itemId;

    @Column(nullable = false, length = 100)
    private String itemName;

    @Column(nullable = false)
    private LocalDateTime snapshotTime;

    // 현재 매물 통계
    private Long avgPrice;
    private Long minPrice;
    private Long maxPrice;
    private Integer itemCount;

    // 거래 통계 (최근 24시간)
    private Long soldAvgPrice;
    private Integer soldCount;
}
