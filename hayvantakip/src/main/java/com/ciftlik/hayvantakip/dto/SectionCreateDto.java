package com.ciftlik.hayvantakip.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SectionCreateDto(
        @NotBlank(message = "Padok Adı boş olamaz.") @Size(min = 2, max = 50, message = "Padok Adı en az 2, en fazla 50 karakter olabilir.") String name,

        @NotNull(message = "Padok Kapasitesi boş olamaz.") @Min(value = 1, message = "Padok Kapasitesi en az 1 olabilir.") Integer capacity) {

}
