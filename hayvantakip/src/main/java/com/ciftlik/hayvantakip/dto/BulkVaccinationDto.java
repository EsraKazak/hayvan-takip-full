package com.ciftlik.hayvantakip.dto;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record BulkVaccinationDto(
        List<Long> animalIds,
        Long sectionId,
        @NotBlank(message = "Aşı adı boş olamaz") String vaccineName,
        @NotNull(message = "Aşı tarihi boş olamaz") LocalDate appliedDate,
        LocalDate nextAppliedDate,
        String notes) {

}
