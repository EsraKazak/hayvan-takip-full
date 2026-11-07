package com.ciftlik.hayvantakip.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**") // Sadece /api/ ile başlayan uç noktalar için geçerli yap
                .allowedOrigins("http://localhost:5173") // Vite/React uygulamanın çalıştığı port
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // İzin verilen HTTP metotları
                .allowedHeaders("*") // Tüm HTTP başlıklarına (Header) izin ver
                .allowCredentials(true); // Cookie veya kimlik doğrulama bilgileri taşınacaksa
    }
}
