package com.ciftlik.hayvantakip.repository;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.ciftlik.hayvantakip.entity.VaccinationRecord;

public interface VaccinationRecordRepository extends JpaRepository<VaccinationRecord, Long> {

    @Query("SELECT v FROM VaccinationRecord v JOIN FETCH v.animal a LEFT JOIN FETCH a.section " +
            "WHERE a.status = 'AKTIF' AND v.nextDueDate IS NOT NULL AND v.nextDueDate <= :limitDate " +
            "ORDER BY v.nextDueDate ASC")
    List<VaccinationRecord> findUpcomingOrOverdueVaccinations(@Param("limitDate") LocalDate limitDate);
}