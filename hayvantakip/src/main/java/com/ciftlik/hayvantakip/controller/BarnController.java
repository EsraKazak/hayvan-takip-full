package com.ciftlik.hayvantakip.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ciftlik.hayvantakip.dto.BarnDto;
import com.ciftlik.hayvantakip.entity.Barn;
import com.ciftlik.hayvantakip.exception.BusinessException;
import com.ciftlik.hayvantakip.exception.ResourceNotFoundException;
import com.ciftlik.hayvantakip.repository.BarnRepository;
import com.ciftlik.hayvantakip.repository.SectionRepository;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/barns")
@RequiredArgsConstructor
public class BarnController {

    private final BarnRepository barnRepository;
    private final SectionRepository sectionRepository;

    @GetMapping
    public ResponseEntity<List<BarnDto>> getAllBarns() {
        List<BarnDto> barns = barnRepository.findAll().stream()
                .map(b -> new BarnDto(b.getId(), b.getName(), b.getDescription())).toList();
        return ResponseEntity.ok(barns);
    }

    @PostMapping
    public ResponseEntity<BarnDto> createBarn(@RequestBody BarnDto dto) {
        if (dto.name() == null || dto.name().isBlank()) {
            throw new BusinessException("Ahır Adı Boş Olamaz!");
        }
        if (barnRepository.existsByNameIgnoreCase(dto.name().trim())) {
            throw new BusinessException("Bu Ahır Adı Zaten Mevcut");
        }

        Barn barn = new Barn();
        barn.setName(dto.name().trim());
        barn.setDescription(dto.description() != null ? dto.description().trim() : null);
        Barn saved = barnRepository.save(barn);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new BarnDto(saved.getId(), saved.getName(), saved.getDescription()));

    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBarn(@PathVariable Long id) {
        if (!barnRepository.existsById(id)) {
            throw new ResourceNotFoundException("Ahır bulunamadı: " + id);
        }
        long sectionCount = sectionRepository.countByBarnId(id);
        if (sectionCount > 0) {
            throw new BusinessException("Bu ahır silinemez! İçinde " + sectionCount + " adet padok bulunmaktadır.");
        }
        barnRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

}
