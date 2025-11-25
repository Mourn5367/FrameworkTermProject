package com.dnf.insight.repository.auction;

import com.dnf.insight.domain.auction.TrackedItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TrackedItemRepository extends JpaRepository<TrackedItem, Long> {

    // 아이템 ID로 조회
    Optional<TrackedItem> findByItemId(String itemId);

    // 아이템 ID 존재 여부 확인
    boolean existsByItemId(String itemId);
}
