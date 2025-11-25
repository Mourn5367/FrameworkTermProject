package com.dnf.insight.service;

import com.dnf.insight.dto.PlayTimeAnalysis;
import com.dnf.insight.dto.TimelineResponse;
import com.dnf.insight.dto.WeeklyDungeonStatus;
import com.dnf.insight.util.DungeonResetUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 타임라인 분석 서비스
 * - 주간 던전 입장 현황
 * - 접속 시간대 패턴 분석
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TimelineAnalysisService {

    private final DnfApiClient dnfApiClient;

    private static final DateTimeFormatter TIMELINE_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    /**
     * 던파 타임라인 이벤트 코드
     * 던전 관련 이벤트만 수집
     */
    private static final String DUNGEON_EVENT_CODES = "201,207,209,210,301,401,402,403,405,406,407,501,502,504,505,507,508,509,510,511,512,513,514,515,516,517,518,519,520,521";

    /**
     * 주간 던전 현황 분석
     * 코드: 201(레이드), 209(레기온 클리어), 210(레이드-선발대)
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @return 주간 던전 현황
     */
    public WeeklyDungeonStatus analyzeWeeklyDungeons(String serverId, String characterId) {
        LocalDateTime currentWeekStart = DungeonResetUtil.getCurrentWeekResetTime();
        LocalDateTime lastWeekStart = currentWeekStart.minusWeeks(1);
        LocalDateTime now = LocalDateTime.now(DungeonResetUtil.KOREA_ZONE);

        log.info("🔍 Analyzing weekly dungeons: characterId={}, currentWeek={}, lastWeek={}",
                characterId, currentWeekStart, lastWeekStart);

        // 이번 주 타임라인 조회 (목요일 06시 ~ 현재)
        List<TimelineResponse.TimelineRow> currentWeekTimeline = fetchAllTimeline(
                serverId, characterId, currentWeekStart, now);

        // 저번 주 타임라인 조회 (저번주 목요일 06시 ~ 이번주 목요일 06시)
        List<TimelineResponse.TimelineRow> lastWeekTimeline = fetchAllTimeline(
                serverId, characterId, lastWeekStart, currentWeekStart);

        // 던전 입장 횟수 집계
        Map<String, Integer> dungeonEntries = new HashMap<>();
        Map<String, Integer> thisWeekItemsByGrade = new HashMap<>();
        Map<String, Integer> lastWeekItemsByGrade = new HashMap<>();

        // 초기화
        for (String grade : new String[]{"에픽", "레전더리", "태초"}) {
            thisWeekItemsByGrade.put(grade, 0);
            lastWeekItemsByGrade.put(grade, 0);
        }

        // 이번 주 데이터 집계
        for (TimelineResponse.TimelineRow row : currentWeekTimeline) {
            String code = row.getCode();

            // 201: 레이드, 210: 레이드(선발대)
            if ("201".equals(code) || "210".equals(code)) {
                String raidName = extractRaidName(row.getData());
                if (raidName != null) {
                    dungeonEntries.put(raidName, dungeonEntries.getOrDefault(raidName, 0) + 1);
                }
            }
            // 209: 레기온 클리어
            else if ("209".equals(code)) {
                String regionName = extractRegionName(row.getData());
                if (regionName != null) {
                    dungeonEntries.put(regionName, dungeonEntries.getOrDefault(regionName, 0) + 1);
                }
            }
            // 505, 504, 513, 507: 아이템 획득
            else if ("505".equals(code) || "504".equals(code) || "513".equals(code) || "507".equals(code)) {
                String itemRarity = extractItemRarity(row.getData());
                if (itemRarity != null) {
                    thisWeekItemsByGrade.put(itemRarity, thisWeekItemsByGrade.getOrDefault(itemRarity, 0) + 1);
                }
            }
        }

        // 저번 주 아이템 획득 집계
        for (TimelineResponse.TimelineRow row : lastWeekTimeline) {
            String code = row.getCode();
            if ("505".equals(code) || "504".equals(code) || "513".equals(code) || "507".equals(code)) {
                String itemRarity = extractItemRarity(row.getData());
                if (itemRarity != null) {
                    lastWeekItemsByGrade.put(itemRarity, lastWeekItemsByGrade.getOrDefault(itemRarity, 0) + 1);
                }
            }
        }

        int totalEntries = dungeonEntries.values().stream().mapToInt(Integer::intValue).sum();

        // 고정된 주간 던전 목록
        List<String> weeklyDungeonNames = List.of(
                "베누스",
                "만들어진 신 나벨",
                "이내 황혼전"
        );

        // 던전 클리어 상태 목록 생성
        List<WeeklyDungeonStatus.DungeonClearStatus> dungeonStatuses = weeklyDungeonNames.stream()
                .map(dungeonName -> {
                    Integer count = dungeonEntries.getOrDefault(dungeonName, 0);
                    return WeeklyDungeonStatus.DungeonClearStatus.builder()
                            .name(dungeonName)
                            .cleared(count > 0)
                            .count(count)
                            .build();
                })
                .collect(Collectors.toList());

        log.info("✅ Weekly dungeon analysis complete: {} entries, thisWeek items: {}, lastWeek items: {}",
                totalEntries, thisWeekItemsByGrade, lastWeekItemsByGrade);

        return WeeklyDungeonStatus.builder()
                .weekStartTime(currentWeekStart)
                .dungeons(dungeonStatuses)
                .dungeonEntries(dungeonEntries)
                .totalEntries(totalEntries)
                .thisWeekItemsByGrade(thisWeekItemsByGrade)
                .lastWeekItemsByGrade(lastWeekItemsByGrade)
                .build();
    }

    /**
     * 접속 시간대 패턴 분석 (최근 한 달, 평일/주말 구분)
     * 가중치: 201,209,210 = 15점, 505,513 = 3점, 나머지 = 1점
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @return 시간대별 활동 패턴
     */
    public PlayTimeAnalysis analyzePlayTime(String serverId, String characterId) {
        LocalDateTime endDate = LocalDateTime.now(DungeonResetUtil.KOREA_ZONE);
        LocalDateTime startDate = endDate.minusDays(30);

        log.info("🔍 Analyzing play time: characterId={}, period={}~{}", characterId, startDate, endDate);

        // 최근 한 달 타임라인 조회
        List<TimelineResponse.TimelineRow> timeline = fetchAllTimeline(serverId, characterId, startDate, endDate);

        // 평일/주말 시간대별 활동 점수 집계 (3시간 단위, 가중치 적용)
        Map<String, Integer> weekdayActivity = new HashMap<>();
        Map<String, Integer> weekendActivity = new HashMap<>();

        // 초기화
        for (String timeRange : new String[]{"00-03", "03-06", "06-09", "09-12", "12-15", "15-18", "18-21", "21-24"}) {
            weekdayActivity.put(timeRange, 0);
            weekendActivity.put(timeRange, 0);
        }

        int totalScore = 0;

        for (TimelineResponse.TimelineRow row : timeline) {
            try {
                LocalDateTime activityTime = LocalDateTime.parse(row.getDate(), TIMELINE_DATE_FORMATTER);
                String timeRange = DungeonResetUtil.getTimeRange(activityTime);

                // 가중치 계산
                int weight = getActivityWeight(row.getCode());
                totalScore += weight;

                // 평일(월~금) vs 주말(토~일) 구분
                int dayOfWeek = activityTime.getDayOfWeek().getValue(); // 1=Monday, 7=Sunday
                if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                    // 평일 (월~금)
                    weekdayActivity.put(timeRange, weekdayActivity.getOrDefault(timeRange, 0) + weight);
                } else {
                    // 주말 (토~일)
                    weekendActivity.put(timeRange, weekendActivity.getOrDefault(timeRange, 0) + weight);
                }
            } catch (Exception e) {
                log.warn("⚠️ Failed to parse timeline date: {}", row.getDate());
            }
        }

        // 평일 가장 활발한 시간대 찾기
        String mostActiveWeekdayTimeRange = weekdayActivity.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("00-03");

        // 주말 가장 활발한 시간대 찾기
        String mostActiveWeekendTimeRange = weekendActivity.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("00-03");

        double averageDailyScore = totalScore / 30.0;

        log.info("✅ Play time analysis complete: {} total score, weekday peak: {}, weekend peak: {}",
                totalScore, mostActiveWeekdayTimeRange, mostActiveWeekendTimeRange);

        return PlayTimeAnalysis.builder()
                .weekdayActivity(weekdayActivity)
                .weekendActivity(weekendActivity)
                .mostActiveWeekdayTimeRange(mostActiveWeekdayTimeRange)
                .mostActiveWeekendTimeRange(mostActiveWeekendTimeRange)
                .totalScore(totalScore)
                .analysisPeriodDays(30)
                .averageDailyScore(averageDailyScore)
                .build();
    }

    /**
     * 이벤트 코드별 가중치 계산
     * - 201, 209, 210 (레이드, 레기온, 선발대): 15점
     * - 505, 513 (아이템 획득): 3점
     * - 나머지: 1점
     *
     * @param code 이벤트 코드
     * @return 가중치
     */
    private int getActivityWeight(String code) {
        if ("201".equals(code) || "209".equals(code) || "210".equals(code)) {
            return 15; // 레이드, 레기온, 선발대
        } else if ("505".equals(code) || "513".equals(code)) {
            return 3; // 아이템 획득
        } else {
            return 1; // 기타
        }
    }

    /**
     * 타임라인 전체 조회 (next 토큰 처리)
     *
     * @param serverId 서버 ID
     * @param characterId 캐릭터 ID
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 전체 타임라인 항목
     */
    private List<TimelineResponse.TimelineRow> fetchAllTimeline(String serverId, String characterId,
                                                                 LocalDateTime startDate, LocalDateTime endDate) {
        List<TimelineResponse.TimelineRow> allRows = new ArrayList<>();
        String nextToken = null;
        int pageCount = 0;
        final int MAX_PAGES = 50; // 최대 5000개 (100 * 50)

        do {
            TimelineResponse response = dnfApiClient.getTimeline(
                    serverId, characterId, startDate, endDate, 100, nextToken, DUNGEON_EVENT_CODES);

            if (response.getTimeline() != null && response.getTimeline().getRows() != null) {
                allRows.addAll(response.getTimeline().getRows());
                nextToken = response.getTimeline().getNext();
            } else {
                nextToken = null;
            }

            pageCount++;
            if (pageCount >= MAX_PAGES) {
                log.warn("⚠️ Reached max page limit ({}) for timeline", MAX_PAGES);
                break;
            }

        } while (nextToken != null && !nextToken.isEmpty());

        log.info("📊 Fetched {} timeline items across {} pages", allRows.size(), pageCount);
        return allRows;
    }

    /**
     * 레이드 이름 추출 (code: 201, 210)
     * 예: "만들어진 신 나벨", "이내 황혼전"
     *
     * @param data API 응답의 data 필드
     * @return 레이드 이름
     */
    private String extractRaidName(Object data) {
        if (data == null) {
            return null;
        }

        if (data instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> dataMap = (Map<String, Object>) data;
            Object raidName = dataMap.get("raidName");
            if (raidName != null) {
                return raidName.toString();
            }
        }

        return null;
    }

    /**
     * 레기온 이름 추출 (code: 209)
     * 예: "베누스"
     *
     * @param data API 응답의 data 필드
     * @return 레기온 이름
     */
    private String extractRegionName(Object data) {
        if (data == null) {
            return null;
        }

        if (data instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> dataMap = (Map<String, Object>) data;
            Object regionName = dataMap.get("regionName");
            if (regionName != null) {
                return regionName.toString();
            }
        }

        return null;
    }

    /**
     * 아이템 등급 추출 (code: 505, 504, 513, 507)
     * 예: "에픽", "레전더리", "태초"
     *
     * @param data API 응답의 data 필드
     * @return 아이템 등급
     */
    private String extractItemRarity(Object data) {
        if (data == null) {
            return null;
        }

        if (data instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> dataMap = (Map<String, Object>) data;
            Object itemRarity = dataMap.get("itemRarity");
            if (itemRarity != null) {
                return itemRarity.toString();
            }
        }

        return null;
    }
}
