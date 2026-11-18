package com.ciftlik.hayvantakip.dto;

public record RecipientDto(
        Long id,
        String fullName,
        String email,
        String role,
        boolean receiveVaccinationAlerts,
        boolean receiveBirthAlerts,
        boolean active) {

}
