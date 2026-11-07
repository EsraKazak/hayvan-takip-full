package com.ciftlik.hayvantakip.exception;

import java.time.LocalDate;

public record ErrorResponse(int status,
        String message,
        LocalDate timestamp) {

}
