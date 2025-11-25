-- ============================================
-- 경매장 시세 트래킹 시스템 - 테이블 생성
-- ============================================

USE dnf_auction;

-- 1. 추적 대상 아이템
CREATE TABLE IF NOT EXISTS tracked_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- 필수 입력 필드
    item_id VARCHAR(32) UNIQUE NOT NULL COMMENT '아이템 ID',
    item_name VARCHAR(100) NOT NULL COMMENT '아이템명',

    -- 자동 생성 필드
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '등록 시간',

    INDEX idx_item_id (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT '추적 대상 아이템';

-- 2. 현재 경매 매물
CREATE TABLE IF NOT EXISTS auction_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    auction_no BIGINT UNIQUE NOT NULL COMMENT '경매 번호',
    reg_date TIMESTAMP NOT NULL COMMENT '등록 시간',
    expire_date TIMESTAMP NOT NULL COMMENT '만료 시간',

    item_id VARCHAR(32) NOT NULL COMMENT '아이템 ID',
    item_name VARCHAR(100) NOT NULL COMMENT '아이템명',
    item_rarity VARCHAR(20) COMMENT '등급',

    count INT NOT NULL COMMENT '수량',
    reg_count INT COMMENT '등록 수량',
    current_price BIGINT COMMENT '현재가',
    unit_price BIGINT COMMENT '개당 가격',
    average_price BIGINT COMMENT '평균 시세',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_item_id (item_id),
    INDEX idx_unit_price (unit_price),
    INDEX idx_reg_date (reg_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT '현재 경매 매물';

-- 3. 판매 완료 내역
CREATE TABLE IF NOT EXISTS auction_sold_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    sold_date TIMESTAMP NOT NULL COMMENT '판매 시간',

    item_id VARCHAR(32) NOT NULL COMMENT '아이템 ID',
    item_name VARCHAR(100) NOT NULL COMMENT '아이템명',
    item_rarity VARCHAR(20) COMMENT '등급',

    count INT NOT NULL COMMENT '수량',
    price BIGINT NOT NULL COMMENT '판매가',
    unit_price BIGINT NOT NULL COMMENT '개당 가격',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_item_id (item_id),
    INDEX idx_sold_date (sold_date),
    INDEX idx_item_sold (item_id, sold_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT '판매 완료 내역';

-- 4. 시세 스냅샷
CREATE TABLE IF NOT EXISTS price_snapshots (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    item_id VARCHAR(32) NOT NULL COMMENT '아이템 ID',
    item_name VARCHAR(100) NOT NULL COMMENT '아이템명',
    snapshot_time TIMESTAMP NOT NULL COMMENT '스냅샷 시간',

    avg_price BIGINT COMMENT '평균 매물가',
    min_price BIGINT COMMENT '최저가',
    max_price BIGINT COMMENT '최고가',
    item_count INT DEFAULT 0 COMMENT '매물 수',

    sold_avg_price BIGINT COMMENT '평균 판매가 (24시간)',
    sold_count INT DEFAULT 0 COMMENT '거래량 (24시간)',

    UNIQUE KEY uk_item_snapshot (item_id, snapshot_time),
    INDEX idx_item_time (item_id, snapshot_time),
    INDEX idx_snapshot_time (snapshot_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT '시세 스냅샷';
