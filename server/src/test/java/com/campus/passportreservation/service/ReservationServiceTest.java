package com.campus.passportreservation.service;

import com.campus.passportreservation.dto.ReservationDtos.ReservationListItem;
import com.campus.passportreservation.entity.Reservation;
import com.campus.passportreservation.enums.ApprovalStatus;
import com.campus.passportreservation.enums.ReservationType;
import com.campus.passportreservation.mapper.CompanionMapper;
import com.campus.passportreservation.mapper.MobileUserMapper;
import com.campus.passportreservation.mapper.ReservationMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ReservationServiceTest {

    @Test
    void toListItemsAllowsPublicReservationWithoutVisitDept() {
        ReservationMapper reservationMapper = mock(ReservationMapper.class);
        CompanionMapper companionMapper = mock(CompanionMapper.class);
        MobileUserMapper mobileUserMapper = mock(MobileUserMapper.class);
        CryptoService cryptoService = mock(CryptoService.class);
        DictionaryService dictionaryService = mock(DictionaryService.class);
        AuditLogService auditLogService = mock(AuditLogService.class);

        when(companionMapper.selectMaps(any())).thenReturn(List.of());
        when(cryptoService.decrypt("id-card")).thenReturn("110101199001011234");
        when(cryptoService.decrypt("phone")).thenReturn("13800138000");
        when(dictionaryService.campusNames(anyCollection())).thenReturn(Map.of(1L, "朝晖"));
        when(dictionaryService.deptNames(anyCollection())).thenReturn(Map.of());

        Reservation reservation = new Reservation();
        reservation.setId(1L);
        reservation.setReservationNo("R202606150001");
        reservation.setReservationType(ReservationType.PUBLIC.name());
        reservation.setCampusId(1L);
        reservation.setVisitDeptId(null);
        reservation.setApplyTime(LocalDateTime.of(2026, 6, 15, 8, 0));
        reservation.setVisitTime(LocalDateTime.of(2026, 6, 15, 0, 0));
        reservation.setOrganization("测试单位");
        reservation.setVisitorName("张三");
        reservation.setIdCardCipher("id-card");
        reservation.setPhoneCipher("phone");
        reservation.setApprovalStatus(ApprovalStatus.AUTO_APPROVED.name());

        ReservationService service = new ReservationService(
                reservationMapper,
                companionMapper,
                mobileUserMapper,
                cryptoService,
                dictionaryService,
                auditLogService,
                new ObjectMapper());

        List<ReservationListItem> items = service.toListItems(List.of(reservation));

        assertThat(items).hasSize(1);
        assertThat(items.get(0).campusName()).isEqualTo("朝晖");
        assertThat(items.get(0).visitDeptName()).isNull();
    }
}
