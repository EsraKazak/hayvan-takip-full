package com.ciftlik.hayvantakip.dto;

import java.time.LocalDate;

public record VaccinationDto(
                Long id,
                String vaccineName,
                LocalDate appliedDate,
                LocalDate nextDueDate,
                String notes) {

}
