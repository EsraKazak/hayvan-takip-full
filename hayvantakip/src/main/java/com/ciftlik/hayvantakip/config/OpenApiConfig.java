package com.ciftlik.hayvantakip.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Çiftlik Hayvan Takip Sistemi API")
                        .version("1.0")
                        .description("Bölme (Padok) ve Hayvan yönetimi için RESTful API dokümantasyonu"));
    }
}
