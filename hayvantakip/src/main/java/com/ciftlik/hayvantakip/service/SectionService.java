package com.ciftlik.hayvantakip.service;

import java.util.Collections;
import java.util.List;

import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ciftlik.hayvantakip.dto.AnimalResponseDto;
import com.ciftlik.hayvantakip.dto.InseminationDto;
import com.ciftlik.hayvantakip.dto.SectionCreateDto;
import com.ciftlik.hayvantakip.dto.SectionResponseDto;
import com.ciftlik.hayvantakip.dto.VaccinationDto;
import com.ciftlik.hayvantakip.entity.AnimalStatus;
import com.ciftlik.hayvantakip.entity.Barn;
import com.ciftlik.hayvantakip.entity.Section;
import com.ciftlik.hayvantakip.exception.BusinessException;
import com.ciftlik.hayvantakip.exception.ResourceNotFoundException;
import com.ciftlik.hayvantakip.repository.AnimalRepository;
import com.ciftlik.hayvantakip.repository.BarnRepository;
import com.ciftlik.hayvantakip.repository.SectionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SectionService {

        private final SectionRepository sectionRepository;
        private final AnimalRepository animalRepository;
        private final BarnRepository barnRepository;

        @Transactional
        public SectionResponseDto createSection(SectionCreateDto createDto) {
                if (createDto.capacity() == null || createDto.capacity() < 1) {
                        throw new BusinessException("Padok kapasitesi en az 1 olmalıdır!");
                }

                String type = (createDto.padokType() != null && !createDto.padokType().isBlank())
                                ? createDto.padokType().trim().toUpperCase(java.util.Locale.ROOT)
                                : "IKILI"; // Varsayılan: Çift Sıra

                Barn barn = null;
                if (createDto.barnId() != null) {
                        barn = barnRepository.findById(createDto.barnId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Belirtilen ahır bulunamadı: " + createDto.barnId()));
                }

                Section section = new Section();
                section.setName(createDto.name().trim());
                section.setCapacity(createDto.capacity());
                section.setPadokType(type);
                section.setBarn(barn);

                Section savedSection = sectionRepository.save(section);
                return convertToDto(savedSection);
        }

        @Transactional(readOnly = true)
        public List<SectionResponseDto> getAllSections() {
                return sectionRepository.findAll().stream()
                                .map(this::convertToDto)
                                .toList();
        }

        @Transactional(readOnly = true)
        public SectionResponseDto getSectionById(Long id) {
                Section section = sectionRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Belirtilen ID'ye sahip bölme bulunamadı: " + id));
                return convertToDto(section);
        }

        @Transactional
        public void deleteSection(Long id) {
                Section section = sectionRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Belirtilen ID'ye sahip bölme bulunamadı: " + id));

                int currentAnimalCount = animalRepository.countBySectionId(id);
                if (currentAnimalCount > 0) {
                        throw new BusinessException("Bu padok silinemez! İçinde " + currentAnimalCount
                                        + " adet hayvan bulunmaktadır. Lütfen önce hayvanları başka bir padoğa transfer edin.");
                }
                sectionRepository.delete(section);
        }

        // Entity -> DTO Dönüştürücü (Güvenli Katman)
        private SectionResponseDto convertToDto(Section section) {
                List<AnimalResponseDto> animalDtos = Collections.emptyList();

                // Lazy koleksiyonun yuklu ve null olmadığını garanti et
                if (section.getAnimals() != null && Hibernate.isInitialized(section.getAnimals())) {
                        animalDtos = section.getAnimals().stream().map(animal -> {
                                Long motherId = null;
                                String motherTagNumber = null;

                                if (animal.getMother() != null && Hibernate.isInitialized(animal.getMother())) {
                                        motherId = animal.getMother().getId();
                                        motherTagNumber = animal.getMother().getTagNumber();
                                }

                                List<VaccinationDto> vDtos = (animal.getVaccinationRecords() != null
                                                && Hibernate.isInitialized(animal.getVaccinationRecords()))
                                                                ? animal.getVaccinationRecords().stream()
                                                                                .map(v -> new VaccinationDto(v.getId(),
                                                                                                v.getVaccineName(),
                                                                                                v.getAppliedDate(),
                                                                                                v.getNextDueDate(),
                                                                                                v.getNotes()))
                                                                                .toList()
                                                                : Collections.emptyList();

                                List<InseminationDto> iDtos = (animal.getInseminationRecords() != null
                                                && Hibernate.isInitialized(animal.getInseminationRecords()))
                                                                ? animal.getInseminationRecords().stream()
                                                                                .map(i -> new InseminationDto(i.getId(),
                                                                                                i.getInseminationDate(),
                                                                                                i.getExpectedBirthDate(),
                                                                                                i.getStatus(),
                                                                                                i.getBullInfo()))
                                                                                .toList()
                                                                : Collections.emptyList();

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
                        }).toList();
                }

                int activeAnimalCount = (int) animalRepository.countBySectionIdAndStatus(section.getId(),
                                AnimalStatus.AKTIF);

                Long barnId = section.getBarn() != null ? section.getBarn().getId() : null;
                String barnName = section.getBarn() != null ? section.getBarn().getName() : null;
                String padokType = section.getPadokType() != null ? section.getPadokType() : "COKLU";

                return new SectionResponseDto(
                                section.getId(),
                                section.getName(),
                                section.getCapacity(),
                                activeAnimalCount,
                                barnId,
                                barnName,
                                padokType,
                                animalDtos);
        }
}