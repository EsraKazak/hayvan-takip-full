package com.ciftlik.hayvantakip.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;

public record AnimalCreateDto(
                @NotBlank(message = "Hayvan Kulak Numarası boş olamaz.") String tagNumber,
                String name,

                @NotNull(message = "Hayvan Doğum Tarihi boş olamaz.") @PastOrPresent(message = "Hayvan Doğum Tarihi bugünden ileri bir tarih olamaz.") LocalDate birthDate,
                @NotBlank(message = "Hayvan Cinsiyeti boş olamaz.") String gender,
                @NotBlank(message = "Cinsi boş olamaz") String breed,

                @NotNull(message = "Hayvanın ait olduğu padok boş olamaz.") Long sectionId,
                Long motherId,
                Integer slotNumber) {
}