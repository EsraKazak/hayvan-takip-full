package com.ciftlik.hayvantakip.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.ciftlik.hayvantakip.dto.AnimalResponseDto;
import com.ciftlik.hayvantakip.dto.InseminationDto;
import com.ciftlik.hayvantakip.dto.SectionCreateDto;
import com.ciftlik.hayvantakip.dto.SectionResponseDto;
import com.ciftlik.hayvantakip.dto.VaccinationDto;
import com.ciftlik.hayvantakip.entity.Section;
import com.ciftlik.hayvantakip.exception.ResourceNotFoundException;
import com.ciftlik.hayvantakip.repository.AnimalRepository;
import com.ciftlik.hayvantakip.repository.SectionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SectionService {

        private final SectionRepository sectionRepository;
        private final AnimalRepository animalRepository;

        // Yeni bölme oluşturmak için kullanılır
        public SectionResponseDto createSection(SectionCreateDto createDto) {
                Section section = new Section();
                section.setName(createDto.name());
                section.setCapacity(createDto.capacity());

                Section savedSection = sectionRepository.save(section);
                return convertToDto(savedSection);
        }

        // tüm bölmeleri listeler
        public List<SectionResponseDto> getAllSections() {
                return sectionRepository.findAll().stream().map(this::convertToDto).toList();
        }

        // idsine görebolme getirir
        public SectionResponseDto getSectionById(Long id) {
                Section section = sectionRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Belirtilen ID'ye sahip bölme bulunamadı: " + id));
                return convertToDto(section);
        }

        // Entity -> DTO Dönüştürücü
        private SectionResponseDto convertToDto(Section section) {
                // 1. Hayvan listesini güvenli bir şekilde map et (null ise boş liste dön)
                List<AnimalResponseDto> animalDtos = (section.getAnimals() != null)
                                ? section.getAnimals().stream().map(animal -> {
                                        Long motherId = (animal.getMother() != null) ? animal.getMother().getId()
                                                        : null;
                                        String motherTagNumber = (animal.getMother() != null)
                                                        ? animal.getMother().getTagNumber()
                                                        : null;

                                        List<VaccinationDto> vDtos = (animal.getVaccinationRecords() != null)
                                                        ? animal.getVaccinationRecords().stream()
                                                                        .map(v -> new VaccinationDto(v.getId(),
                                                                                        v.getVaccineName(),
                                                                                        v.getAppliedDate(),
                                                                                        v.getNextDueDate(),
                                                                                        v.getNotes()))
                                                                        .toList()
                                                        : List.of();

                                        // Tohumlanma listesini DTO'ya dönüştür
                                        List<InseminationDto> iDtos = (animal.getInseminationRecords() != null)
                                                        ? animal.getInseminationRecords().stream()
                                                                        .map(i -> new InseminationDto(i.getId(),
                                                                                        i.getInseminationDate(),
                                                                                        i.getExpectedBirthDate(),
                                                                                        i.getStatus(), i.getBullInfo()))
                                                                        .toList()
                                                        : List.of();

                                        return new AnimalResponseDto(
                                                        animal.getId(),
                                                        animal.getTagNumber(),
                                                        animal.getName(),
                                                        animal.getBirthDate(),
                                                        animal.getDeathDate(),
                                                        animal.getGender(),
                                                        animal.getBreed(),
                                                        animal.getStatus(),
                                                        section.getId(),
                                                        section.getName(),
                                                        motherId,
                                                        motherTagNumber,
                                                        animal.getSlotNumber(),
                                                        vDtos,
                                                        iDtos);
                                }).toList()
                                : List.of();

                // 2. Anlık hayvan sayısını veritabanı sorgusuyla al
                int currentAnimalCount = animalRepository.countBySectionId(section.getId());

                // 3. SectionResponseDto nesnesini eksiksiz oluştur
                return new SectionResponseDto(
                                section.getId(),
                                section.getName(),
                                section.getCapacity(),
                                currentAnimalCount,
                                animalDtos);
        }
}
