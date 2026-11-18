package com.ciftlik.hayvantakip.dto;

import java.time.LocalDate;

public record NotificationItemDto(
        String id,
        String type,
        String severity,
        String animalTagNumber,
        String animalName,
        String sectionName,
        String title,
        LocalDate targetDate,
        long daysRemaining) {

}
