-- ============================================
-- 샘플 데이터 삽입 (테스트용)
-- ============================================

USE dnf_auction;

-- 추적 대상 아이템 샘플 데이터
INSERT INTO tracked_items (item_id, item_name) VALUES
('f9941d3fa0b8253bb0b2567a29b1299f', '형상화된 요기의 단서')
ON DUPLICATE KEY UPDATE item_name = item_name;
