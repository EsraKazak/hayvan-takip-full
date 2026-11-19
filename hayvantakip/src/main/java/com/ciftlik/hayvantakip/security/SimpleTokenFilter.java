package com.ciftlik.hayvantakip.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Collections;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class SimpleTokenFilter extends OncePerRequestFilter {

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${app.cron.secret}")
    private String cronSecret;

    public String generateExpectedToken() {
        try {
            String raw = adminUsername + ":" + adminPassword + ":HAYVANTAKIP_SECRET_SALT";
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Token oluşturulamadı", e);
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. Cron-job.org için özel gizli anahtar kontrolü
        String incomingCronSecret = request.getHeader("X-Cron-Secret");
        if (incomingCronSecret != null && incomingCronSecret.equals(cronSecret)) {
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("cron-bot", null,
                    Collections.emptyList());
            SecurityContextHolder.getContext().setAuthentication(auth);
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Tarayıcıdan (Frontend) gelen Bearer Token kontrolü
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (token.equals(generateExpectedToken())) {
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(adminUsername, null,
                        Collections.emptyList());
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        filterChain.doFilter(request, response);
    }
}