package com.ciftlik.hayvantakip.service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ciftlik.hayvantakip.dto.AnimalCreateDto;
import com.ciftlik.hayvantakip.dto.AnimalResponseDto;
import com.ciftlik.hayvantakip.dto.BulkVaccinationDto;
import com.ciftlik.hayvantakip.dto.InseminationDto;
import com.ciftlik.hayvantakip.dto.VaccinationDto;
import com.ciftlik.hayvantakip.entity.Animal;
import com.ciftlik.hayvantakip.entity.AnimalStatus;
import com.ciftlik.hayvantakip.entity.InseminationRecord;
import com.ciftlik.hayvantakip.entity.Section;
import com.ciftlik.hayvantakip.entity.VaccinationRecord;
import com.ciftlik.hayvantakip.exception.BusinessException;
import com.ciftlik.hayvantakip.exception.ResourceNotFoundException;
import com.ciftlik.hayvantakip.repository.AnimalRepository;
import com.ciftlik.hayvantakip.repository.SectionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AnimalService {

        private final AnimalRepository animalRepository;
        private final SectionRepository sectionRepository;

        @Transactional
        public AnimalResponseDto addAnimal(AnimalCreateDto createDto) {
                Section section = sectionRepository.findById(createDto.sectionId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Bölme bulunamadı: " + createDto.sectionId()));

                int currentAnimalCount = animalRepository.countBySectionId(createDto.sectionId());
                if (currentAnimalCount >= section.getCapacity()) {
                        throw new BusinessException("Bu bölme dolu! Maksimum kapasite: " + section.getCapacity());
                }

                if (animalRepository.findByTagNumber(createDto.tagNumber()).isPresent()) {
                        throw new BusinessException("Bu kulak küpe numarası zaten kayıtlı: " + createDto.tagNumber());
                }

                Animal animal = new Animal();
                animal.setTagNumber(createDto.tagNumber());
                animal.setName(createDto.name());
                animal.setBirthDate(createDto.birthDate());
                animal.setGender(createDto.gender());
                animal.setBreed(createDto.breed());
                animal.setSection(section);
                animal.setStatus(AnimalStatus.AKTIF);
                animal.setSlotNumber(createDto.slotNumber());

                if (createDto.motherId() != null) {
                        Animal mother = animalRepository.findById(createDto.motherId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Anne kaydı bulunamadı: " + createDto.motherId()));
                        animal.setMother(mother);
                }

                Animal savedAnimal = animalRepository.save(animal);
                return convertToDto(savedAnimal);
        }

        @Transactional
        public AnimalResponseDto transferAnimal(Long animalId, Long targetSectionId, Integer targetSlotNumber) {
                Animal animal = animalRepository.findById(animalId)
                                .orElseThrow(() -> new ResourceNotFoundException("Hayvan bulunamadı: " + animalId));

                Section targetSection = sectionRepository.findById(targetSectionId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Hedef bölme bulunamadı: " + targetSectionId));

                if (!animal.getSection().getId().equals(targetSectionId)) {
                        int currentCountIntTarget = animalRepository.countBySectionId(targetSectionId);
                        if (currentCountIntTarget >= targetSection.getCapacity()) {
                                throw new BusinessException(
                                                "Hedef bölme dolu! Maksimum kapasite: " + targetSection.getCapacity());
                        }
                }

                animal.setSection(targetSection);
                animal.setSlotNumber(targetSlotNumber);
                Animal updateAnimal = animalRepository.save(animal);
                return convertToDto(updateAnimal);
        }

        @Transactional
        public AnimalResponseDto updateAnimalStatus(Long animalId, AnimalStatus newStatus) {
                Animal animal = animalRepository.findById(animalId)
                                .orElseThrow(() -> new ResourceNotFoundException("Hayvan bulunamadı: " + animalId));
                animal.setStatus(newStatus);

                if (newStatus == AnimalStatus.OLDU) {
                        animal.setDeathDate(LocalDate.now());
                }
                Animal updateAnimal = animalRepository.save(animal);
                return convertToDto(updateAnimal);
        }

        @Transactional(readOnly = true)
        public AnimalResponseDto getAnimalTagNumber(String tagNumber) {
                Animal animal = animalRepository.findByTagNumber(tagNumber)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Hayvan Bulunamadı Küpe No: " + tagNumber));
                return convertToDto(animal);
        }

        @Transactional(readOnly = true)
        public List<AnimalResponseDto> getAnimalsBySection(Long sectionId) {
                return animalRepository.findBySectionId(sectionId)
                                .stream()
                                .map(this::convertToDto)
                                .toList();
        }

        // Entity -> DTO Dönüşüm Metodu (Güvenli Katman)
        private AnimalResponseDto convertToDto(Animal animal) {
                Long sectionId = (animal.getSection() != null) ? animal.getSection().getId() : null;
                String sectionName = (animal.getSection() != null) ? animal.getSection().getName() : null;

                Long motherId = null;
                String motherTagNumber = null;
                if (animal.getMother() != null && Hibernate.isInitialized(animal.getMother())) {
                        motherId = animal.getMother().getId();
                        motherTagNumber = animal.getMother().getTagNumber();
                }

                List<VaccinationDto> vaccinations = (animal.getVaccinationRecords() != null
                                && Hibernate.isInitialized(animal.getVaccinationRecords()))
                                                ? animal.getVaccinationRecords().stream()
                                                                .map(v -> new VaccinationDto(v.getId(),
                                                                                v.getVaccineName(),
                                                                                v.getAppliedDate(), v.getNextDueDate(),
                                                                                v.getNotes()))
                                                                .toList()
                                                : Collections.emptyList();

                List<InseminationDto> inseminations = (animal.getInseminationRecords() != null
                                && Hibernate.isInitialized(animal.getInseminationRecords()))
                                                ? animal.getInseminationRecords().stream()
                                                                .map(i -> new InseminationDto(i.getId(),
                                                                                i.getInseminationDate(),
                                                                                i.getExpectedBirthDate(), i.getStatus(),
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
                                sectionId,
                                sectionName,
                                motherId,
                                motherTagNumber,
                                animal.getSlotNumber(),
                                vaccinations,
                                inseminations);
        }

        @Transactional
        public VaccinationDto addVaccination(Long animalId, VaccinationDto dto) {
                Animal animal = animalRepository.findById(animalId)
                                .orElseThrow(() -> new ResourceNotFoundException("Hayvan bulunamadı: " + animalId));

                VaccinationRecord record = new VaccinationRecord();
                record.setVaccineName(dto.vaccineName());
                record.setAppliedDate(dto.appliedDate());
                record.setNextDueDate(dto.nextDueDate());
                record.setNotes(dto.notes());
                record.setAnimal(animal);

                animal.getVaccinationRecords().add(record);
                animalRepository.save(animal);
                return dto;
        }

        @Transactional
        public InseminationDto addInsemination(Long animalId, InseminationDto dto) {
                Animal animal = animalRepository.findById(animalId)
                                .orElseThrow(() -> new ResourceNotFoundException("Hayvan bulunamadı: " + animalId));

                InseminationRecord record = new InseminationRecord();
                record.setInseminationDate(dto.inseminationDate());
                record.setExpectedBirthDate(dto.expectedBirthDate());
                record.setStatus(dto.status());
                record.setBullInfo(dto.bullInfo());
                record.setAnimal(animal);

                animal.getInseminationRecords().add(record);
                animalRepository.save(animal);
                return dto;
        }

        @Transactional
        public int addbulkVaccinations(BulkVaccinationDto dtos) {
                List<Animal> targetAnimal;
                if (dtos.sectionId() != null) {
                        targetAnimal = animalRepository.findBySectionId(dtos.sectionId()).stream()
                                        .filter(a -> a.getStatus() == AnimalStatus.AKTIF).toList();

                } else if (dtos.animalIds() != null && !dtos.animalIds().isEmpty()) {
                        targetAnimal = animalRepository.findAllById(dtos.animalIds());
                } else {
                        throw new BusinessException("Toplu Aşılama İçin En Az Bir Tane Hayvan Seçmelisiniz");
                }

                if (targetAnimal.isEmpty()) {
                        throw new BusinessException("Toplu Aşılama İçin Seçilen Hayvanlar Bulunamadı");
                }

                for (Animal animal : targetAnimal) {
                        VaccinationRecord record = new VaccinationRecord();
                        record.setVaccineName(dtos.vaccineName());
                        record.setAppliedDate(dtos.appliedDate());
                        record.setNextDueDate(dtos.nextAppliedDate());
                        record.setNotes(dtos.notes());
                        record.setAnimal(animal);

                        animal.getVaccinationRecords().add(record);
                }

                animalRepository.saveAll(targetAnimal);

                return targetAnimal.size();
        }
}