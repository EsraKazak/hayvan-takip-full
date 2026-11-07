package com.ciftlik.hayvantakip.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ciftlik.hayvantakip.dto.SectionCreateDto;
import com.ciftlik.hayvantakip.dto.SectionResponseDto;
import com.ciftlik.hayvantakip.service.SectionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/sections")
@RequiredArgsConstructor
public class SectionController {

    private final SectionService sectionService;

    // requestbody gelen json cevabını javayasection nesnesine dönüştürür
    @PostMapping
    public ResponseEntity<SectionResponseDto> createSection(@Valid @RequestBody SectionCreateDto createDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sectionService.createSection(createDto));
    }

    // TÜM BÖLMELERİN LİSTESİNİ ALIYORUZ
    @GetMapping
    public ResponseEntity<List<SectionResponseDto>> getAllSections() {
        return ResponseEntity.ok(sectionService.getAllSections());
    }

    // id ye göre tek bir bölme getirme
    @GetMapping("/{id}")
    public ResponseEntity<SectionResponseDto> getSectionById(@PathVariable Long id) {
        return ResponseEntity.ok(sectionService.getSectionById(id));
    }
}
