package com.ciftlik.hayvantakip.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
public class WebConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // Vercel, localhost veya herhangi bir origin'e izin ver
        config.setAllowedOriginPatterns(List.of("*"));

        // Tüm HTTP metotlarına (OPTIONS, GET, POST, PUT, DELETE vb.) izin ver
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // Tüm Header'lara izin ver
        config.setAllowedHeaders(List.of("*"));

        // Cookie ve auth başlıklarına izin ver
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Tüm API uç noktaları için geçerli kıl
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}