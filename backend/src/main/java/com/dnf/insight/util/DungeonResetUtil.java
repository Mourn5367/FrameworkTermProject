package com.dnf.insight.util;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;

/**
 * 던전 리셋 시간 계산 유틸리티
 * - 매주 목요일 오전 06시에 리셋
 */
public class DungeonResetUtil {

    public static final ZoneId KOREA_ZONE = ZoneId.of("Asia/Seoul");
    private static final int RESET_HOUR = 6; // 오전 6시

    /**
     * 이번 주 리셋 시간 계산 (목요일 06:00)
     *
     * @return 이번 주 목요일 06:00 (현재 시간이 목요일 06시 이전이면 지난주 목요일)
     */
    public static LocalDateTime getCurrentWeekResetTime() {
        LocalDateTime now = LocalDateTime.now(KOREA_ZONE);
        LocalDateTime thisThursday = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.THURSDAY))
                .withHour(RESET_HOUR)
                .withMinute(0)
                .withSecond(0)
                .withNano(0);

        // 현재 시간이 목요일 06시 이전이면 지난주 목요일
        if (now.isBefore(thisThursday)) {
            thisThursday = thisThursday.minusWeeks(1);
        }

        return thisThursday;
    }

    /**
     * 지난 주 리셋 시간 계산
     *
     * @return 지난 주 목요일 06:00
     */
    public static LocalDateTime getLastWeekResetTime() {
        return getCurrentWeekResetTime().minusWeeks(1);
    }

    /**
     * 다음 주 리셋 시간 계산
     *
     * @return 다음 주 목요일 06:00
     */
    public static LocalDateTime getNextWeekResetTime() {
        return getCurrentWeekResetTime().plusWeeks(1);
    }

    /**
     * 주어진 시간이 현재 주에 속하는지 확인
     *
     * @param dateTime 확인할 시간
     * @return 현재 주에 속하면 true
     */
    public static boolean isCurrentWeek(LocalDateTime dateTime) {
        LocalDateTime currentWeekStart = getCurrentWeekResetTime();
        LocalDateTime nextWeekStart = getNextWeekResetTime();

        return !dateTime.isBefore(currentWeekStart) && dateTime.isBefore(nextWeekStart);
    }

    /**
     * 주어진 시간이 지난 주에 속하는지 확인
     *
     * @param dateTime 확인할 시간
     * @return 지난 주에 속하면 true
     */
    public static boolean isLastWeek(LocalDateTime dateTime) {
        LocalDateTime lastWeekStart = getLastWeekResetTime();
        LocalDateTime currentWeekStart = getCurrentWeekResetTime();

        return !dateTime.isBefore(lastWeekStart) && dateTime.isBefore(currentWeekStart);
    }

    /**
     * 시간대 분류 (3시간 단위: 00-03, 03-06, 06-09, 09-12, 12-15, 15-18, 18-21, 21-24)
     *
     * @param dateTime 분류할 시간
     * @return 시간대 문자열 (예: "06-09")
     */
    public static String getTimeRange(LocalDateTime dateTime) {
        int hour = dateTime.getHour();

        if (hour >= 0 && hour < 3) {
            return "00-03";
        } else if (hour >= 3 && hour < 6) {
            return "03-06";
        } else if (hour >= 6 && hour < 9) {
            return "06-09";
        } else if (hour >= 9 && hour < 12) {
            return "09-12";
        } else if (hour >= 12 && hour < 15) {
            return "12-15";
        } else if (hour >= 15 && hour < 18) {
            return "15-18";
        } else if (hour >= 18 && hour < 21) {
            return "18-21";
        } else {
            return "21-24";
        }
    }
}
