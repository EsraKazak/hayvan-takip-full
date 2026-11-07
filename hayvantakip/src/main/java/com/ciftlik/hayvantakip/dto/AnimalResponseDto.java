package com.ciftlik.hayvantakip.dto;

import java.time.LocalDate;

import com.ciftlik.hayvantakip.entity.AnimalStatus;

public record AnimalResponseDto(
                Long id,
                String tagNumber,
                String name,
                LocalDate birthDate,
                LocalDate deathDate,
                String gender,
                String breed,
                AnimalStatus animalStatus,
                Long sectionId,
                String sectionName,
                Long motherId,
                String motherTagNumber) {
}