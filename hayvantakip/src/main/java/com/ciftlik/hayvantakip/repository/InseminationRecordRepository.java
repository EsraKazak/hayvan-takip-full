package com.ciftlik.hayvantakip.repository;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.ciftlik.hayvantakip.entity.InseminationRecord;

public interface InseminationRecordRepository extends JpaRepository<InseminationRecord, Long> {

    @Query("SELECT i FROM InseminationRecord i JOIN FETCH i.animal a LEFT JOIN FETCH a.section " +
            "WHERE a.status = 'AKTIF' AND i.expectedBirthDate IS NOT NULL " +
            "AND i.expectedBirthDate BETWEEN :startDate AND :endDate " +
            "AND (i.status IS NULL OR UPPER(i.status) NOT IN ('DOGUM_YAPTI', 'IPTAL', 'DUSUK')) " +
            "ORDER BY i.expectedBirthDate ASC")
    List<InseminationRecord> findUpcomingBirths(@Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}