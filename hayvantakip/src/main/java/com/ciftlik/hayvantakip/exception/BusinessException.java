package com.ciftlik.hayvantakip.exception;

//kapasite dolu olduğunda kulak küpe no tekrarı gibi olaylarda kullanılır
public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }

}
