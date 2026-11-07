package com.ciftlik.hayvantakip.exception;

//aranan kayıt veritabanında bulunamadığında kullandığımız hata sınıfı 404
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }

}
