package com.ciftlik.hayvantakip.dto;

import java.time.LocalDate;

public record InseminationDto(
        Long id,
        LocalDate inseminationDate,
        LocalDate expectedBirthDate,
        String status,
        String bullInfo) {
}
