package com.campus.passportreservation.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.campus.passportreservation.dto.DashboardDtos.DashboardSummaryResponse;
import com.campus.passportreservation.dto.DashboardDtos.DashboardTrendPoint;
import com.campus.passportreservation.dto.ReservationDtos.ReservationListItem;
import com.campus.passportreservation.entity.Dept;
import com.campus.passportreservation.entity.Reservation;
import com.campus.passportreservation.enums.ApprovalStatus;
import com.campus.passportreservation.enums.ReservationType;
import com.campus.passportreservation.mapper.DeptMapper;
import com.campus.passportreservation.mapper.ReservationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ISO_LOCAL_DATE;

    private final ReservationMapper reservationMapper;
    private final DeptMapper deptMapper;
    private final ReservationService reservationService;

    public DashboardSummaryResponse summary() {
        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime todayEnd = today.plusDays(1).atStartOfDay();
        LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime monthEnd = today.plusMonths(1).withDayOfMonth(1).atStartOfDay();

        long todayReservations = reservationMapper.selectCount(new LambdaQueryWrapper<Reservation>()
                .ge(Reservation::getVisitTime, todayStart)
                .lt(Reservation::getVisitTime, todayEnd));
        long pendingApprovals = reservationMapper.selectCount(new LambdaQueryWrapper<Reservation>()
                .eq(Reservation::getReservationType, ReservationType.OFFICIAL.name())
                .eq(Reservation::getApprovalStatus, ApprovalStatus.PENDING.name()));
        long activeDepartments = deptMapper.selectCount(new LambdaQueryWrapper<Dept>()
                .eq(Dept::getStatus, "ENABLED"));
        List<Reservation> monthReservations = reservationMapper.selectList(new LambdaQueryWrapper<Reservation>()
                .ge(Reservation::getVisitTime, monthStart)
                .lt(Reservation::getVisitTime, monthEnd));
        Map<Long, Integer> monthPeopleCounts = reservationService.peopleCounts(monthReservations);
        long monthVisitors = monthReservations.stream()
                .mapToLong(reservation -> monthPeopleCounts.getOrDefault(reservation.getId(), 1))
                .sum();

        List<Reservation> recentOfficialReservations = reservationMapper.selectPage(Page.of(1, 5),
                        new LambdaQueryWrapper<Reservation>()
                                .eq(Reservation::getReservationType, ReservationType.OFFICIAL.name())
                                .orderByDesc(Reservation::getApplyTime))
                .getRecords();
        List<ReservationListItem> recentOfficial = reservationService.toListItems(recentOfficialReservations);

        return new DashboardSummaryResponse(
                todayReservations,
                pendingApprovals,
                monthVisitors,
                activeDepartments,
                recentOfficial,
                trend(today.minusDays(6).atStartOfDay(), todayEnd),
                peakHour(monthReservations),
                pendingApprovals > 20 ? "Busy" : "Normal"
        );
    }

    private List<DashboardTrendPoint> trend(LocalDateTime start, LocalDateTime end) {
        List<Reservation> reservations = reservationMapper.selectList(new LambdaQueryWrapper<Reservation>()
                .ge(Reservation::getVisitTime, start)
                .lt(Reservation::getVisitTime, end));
        Map<Long, Integer> peopleCounts = reservationService.peopleCounts(reservations);
        Map<LocalDate, List<Reservation>> byDate = reservations.stream()
                .collect(Collectors.groupingBy(reservation -> reservation.getVisitTime().toLocalDate(), LinkedHashMap::new, Collectors.toList()));
        return start.toLocalDate().datesUntil(end.toLocalDate())
                .map(date -> {
                    List<Reservation> records = byDate.getOrDefault(date, List.of());
                    return new DashboardTrendPoint(DATE.format(date), records.size(),
                            records.stream().mapToLong(reservation -> peopleCounts.getOrDefault(reservation.getId(), 1)).sum());
                })
                .toList();
    }

    private String peakHour(List<Reservation> reservations) {
        if (reservations.isEmpty()) {
            return "暂无数据";
        }
        int hour = reservations.stream()
                .collect(Collectors.groupingBy(reservation -> reservation.getVisitTime().getHour(), Collectors.counting()))
                .entrySet()
                .stream()
                .max(Comparator.comparingLong(Map.Entry::getValue))
                .map(Map.Entry::getKey)
                .orElse(9);
        return LocalTime.of(hour, 0) + " - " + LocalTime.of(Math.min(hour + 1, 23), 0);
    }

}
