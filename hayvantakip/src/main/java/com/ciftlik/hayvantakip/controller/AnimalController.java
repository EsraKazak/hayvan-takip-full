package com.ciftlik.hayvantakip.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ciftlik.hayvantakip.dto.AnimalCreateDto;
import com.ciftlik.hayvantakip.dto.AnimalResponseDto;
import com.ciftlik.hayvantakip.entity.AnimalStatus;
import com.ciftlik.hayvantakip.service.AnimalService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/animals")
@RequiredArgsConstructor
public class AnimalController {

    private final AnimalService animalService;

    @PostMapping
    public ResponseEntity<AnimalResponseDto> addAnimal(@Valid @RequestBody AnimalCreateDto createDto) {
        return ResponseEntity.ok(animalService.addAnimal(createDto));
    }

    @PutMapping("/{id}/transfer")
    public ResponseEntity<AnimalResponseDto> transferAnimal(@PathVariable Long id,
            @RequestParam @NotNull(message = "Hedef Padok Id'si boş olamaz.") Long targetSectionId) {

        return ResponseEntity.ok(animalService.transferAnimal(id, targetSectionId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<AnimalResponseDto> updateStatus(@PathVariable Long id,
            @RequestParam @NotNull(message = "Durum bilgisi boş bırakılamaz.") AnimalStatus status) {
        return ResponseEntity.ok(animalService.updateAnimalStatus(id, status));
    }

    @GetMapping("/tag/{tagNumber}")
    public ResponseEntity<AnimalResponseDto> getAnimalByTagNumber(@PathVariable String tagNumber) {
        return ResponseEntity.ok(animalService.getAnimalTagNumber(tagNumber));
    }

    @GetMapping("/section/{sectionId}")
    public ResponseEntity<List<AnimalResponseDto>> getAnimalsBySection(@PathVariable Long sectionId) {
        return ResponseEntity.ok(animalService.getAnimalsBySection(sectionId));
    }
}