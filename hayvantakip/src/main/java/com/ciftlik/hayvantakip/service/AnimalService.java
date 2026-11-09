package com.ciftlik.hayvantakip.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import com.ciftlik.hayvantakip.dto.AnimalCreateDto;
import com.ciftlik.hayvantakip.dto.AnimalResponseDto;
import com.ciftlik.hayvantakip.dto.InseminationDto;
import com.ciftlik.hayvantakip.dto.VaccinationDto;
import com.ciftlik.hayvantakip.entity.Animal;
import com.ciftlik.hayvantakip.entity.AnimalStatus;
import com.ciftlik.hayvantakip.entity.InseminationRecord;
import com.ciftlik.hayvantakip.entity.Section;
import com.ciftlik.hayvantakip.entity.VaccinationRecord;
import com.ciftlik.hayvantakip.repository.AnimalRepository;
import com.ciftlik.hayvantakip.repository.SectionRepository;
import com.ciftlik.hayvantakip.exception.BusinessException;
import com.ciftlik.hayvantakip.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AnimalService {

        private final AnimalRepository animalRepository;
        private final SectionRepository sectionRepository;

        public AnimalResponseDto addAnimal(AnimalCreateDto createDto) {

                // 1. Bölme varlık kontrolü
                Section section = sectionRepository.findById(createDto.sectionId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Bölme bulunamadı: " + createDto.sectionId()));

                // 2. Kapasite kontrolü
                int currentAnimalCount = animalRepository.countBySectionId(createDto.sectionId());
                if (currentAnimalCount >= section.getCapacity()) {
                        throw new BusinessException("Bu bölme dolu! Maksimum kapasite: " + section.getCapacity());
                }

                // 3. Küpe numarası benzersizlik kontrolü
                if (animalRepository.findByTagNumber(createDto.tagNumber()).isPresent()) {
                        throw new BusinessException("Bu kulak küpe numarası zaten kayıtlı: " + createDto.tagNumber());
                }

                // 4. Entity nesnesini oluşturma
                Animal animal = new Animal();
                animal.setTagNumber(createDto.tagNumber());
                animal.setName(createDto.name());
                animal.setBirthDate(createDto.birthDate());
                animal.setGender(createDto.gender());
                animal.setBreed(createDto.breed());
                animal.setSection(section);
                animal.setStatus(AnimalStatus.AKTIF);
                animal.setSlotNumber(createDto.slotNumber());

                // 5. Anne kaydı kontrolü
                if (createDto.motherId() != null) {
                        Animal mother = animalRepository.findById(createDto.motherId())
                                        .orElseThrow(() -> new RuntimeException(
                                                        "Anne kaydı bulunamadı: " + createDto.motherId()));
                        animal.setMother(mother);
                }

                Animal savedAnimal = animalRepository.save(animal);
                return convertToDto(savedAnimal);
        }

        public AnimalResponseDto transferAnimal(Long animalId, Long targetSectionId, Integer targetSlotNumber) {
                Animal animal = animalRepository.findById(animalId)
                                .orElseThrow(() -> new ResourceNotFoundException("Hayvan bulunamadı: " + animalId));

                Section targetSection = sectionRepository.findById(targetSectionId)
                                .orElseThrow(() -> new RuntimeException("Hedef bölme bulunamadı: " + targetSectionId));

                if (!animal.getSection().getId().equals(targetSectionId)) {
                        int currentCountIntTarget = animalRepository.countBySectionId(targetSectionId);
                        if (currentCountIntTarget >= targetSection.getCapacity()) {
                                throw new RuntimeException(
                                                "Hedef bölme dolu! Maksimum kapasite: " + targetSection.getCapacity());
                        }
                }

                animal.setSection(targetSection);
                animal.setSlotNumber(targetSlotNumber);
                Animal updateAnimal = animalRepository.save(animal);
                return convertToDto(updateAnimal);
        }

        public AnimalResponseDto updateAnimalStatus(Long animalId, AnimalStatus newStatus) {
                Animal animal = animalRepository.findById(animalId)
                                .orElseThrow(() -> new RuntimeException("Hayvan bulunamadı: " + animalId));
                animal.setStatus(newStatus);

                if (newStatus == AnimalStatus.OLDU) {
                        animal.setDeathDate(LocalDate.now());
                }
                Animal updateAnimal = animalRepository.save(animal);
                return convertToDto(updateAnimal);

        }

        public AnimalResponseDto getAnimalTagNumber(String tagNumber) {
                Animal animal = animalRepository.findByTagNumber(tagNumber)
                                .orElseThrow(() -> new RuntimeException("Hayvan Bulunamadı Küpe No: " + tagNumber));
                return convertToDto(animal);
        }

        public List<AnimalResponseDto> getAnimalsBySection(Long sectionId) {
                return animalRepository.findBySectionId(sectionId)
                                .stream()
                                .map(this::convertToDto)
                                .toList();
        }

        // Entity -> DTO Dönüşüm Metodu
        private AnimalResponseDto convertToDto(Animal animal) {
                Long sectionId = (animal.getSection() != null) ? animal.getSection().getId() : null;
                String sectionName = (animal.getSection() != null) ? animal.getSection().getName() : null;

                Long motherId = (animal.getMother() != null) ? animal.getMother().getId() : null;
                String motherTagNumber = (animal.getMother() != null) ? animal.getMother().getTagNumber() : null;

                List<VaccinationDto> vaccinations = (animal.getVaccinationRecords() != null)
                                ? animal.getVaccinationRecords().stream()
                                                .map(v -> new VaccinationDto(v.getId(), v.getVaccineName(),
                                                                v.getAppliedDate(),
                                                                v.getNextDueDate(), v.getNotes()))
                                                .toList()
                                : List.of();

                List<InseminationDto> inseminations = (animal.getInseminationRecords() != null)
                                ? animal.getInseminationRecords().stream()
                                                .map(i -> new InseminationDto(i.getId(), i.getInseminationDate(),
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
                                sectionId,
                                sectionName,
                                motherId,
                                motherTagNumber,
                                animal.getSlotNumber(),
                                vaccinations,
                                inseminations);
        }

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
}