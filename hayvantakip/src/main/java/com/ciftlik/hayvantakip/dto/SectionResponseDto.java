package com.ciftlik.hayvantakip.dto;

import java.util.List;

public record SectionResponseDto(Long id, String name, Integer capacity, int currentAnimalCount, Long barnId,
                String barnName, String padokType,
                List<AnimalResponseDto> animals) {

}
