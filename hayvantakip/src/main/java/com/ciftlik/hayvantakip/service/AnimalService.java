package com.ciftlik.hayvantakip.service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

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

        // İlk boş slot numarasını bulan yardımcı metot
        private Integer findFirstAvailableSlot(Long sectionId, int capacity) {
                Set<Integer> occupiedSlots = new HashSet<>(
                                animalRepository.findOccupiedSlotNumbersBySectionId(sectionId));

                for (int slot = 1; slot <= capacity; slot++) {
                        if (!occupiedSlots.contains(slot)) {
                                return slot;
                        }
                }
                throw new BusinessException("Bu bölmede boş durak/slot kalmamış!");
        }

        @Transactional
        public AnimalResponseDto addAnimal(AnimalCreateDto createDto) {
                Section section = sectionRepository.findById(createDto.sectionId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Bölme bulunamadı: " + createDto.sectionId()));

                // Sadece AKTİF hayvanları sayarak kapasite kontrolü yap
                int activeAnimalCount = animalRepository.countBySectionIdAndStatus(createDto.sectionId(),
                                AnimalStatus.AKTIF);
                if (activeAnimalCount >= section.getCapacity()) {
                        throw new BusinessException("Bu bölme dolu! Maksimum kapasite: " + section.getCapacity());
                }

                // Slot numarası girildiyse kontrol et, boş bırakıldıysa ilk boş slotu otomatik
                // ata
                Integer assignedSlot = createDto.slotNumber();
                if (assignedSlot != null) {
                        if (assignedSlot < 1 || assignedSlot > section.getCapacity()) {
                                throw new BusinessException("Durak/slot numarası 1 ile " + section.getCapacity()
                                                + " arasında olmalıdır!");
                        }
                        if (animalRepository.existsBySectionIdAndSlotNumberAndStatus(
                                        createDto.sectionId(), assignedSlot, AnimalStatus.AKTIF)) {
                                throw new BusinessException("Seçilen durak/slot (" + assignedSlot
                                                + ") başka bir aktif hayvan tarafından kullanılıyor!");
                        }
                } else {
                        assignedSlot = findFirstAvailableSlot(createDto.sectionId(), section.getCapacity());
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
                animal.setSlotNumber(assignedSlot);

                // annenin dişi olmasını aktif olan hayvanın seçilmesini sağlamak için
                if (createDto.motherId() != null) {
                        Animal mother = animalRepository.findById(createDto.motherId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Anne kaydı bulunamadı: " + createDto.motherId()));

                        if (!"DISI".equalsIgnoreCase(mother.getGender())) {
                                throw new BusinessException("Anne olarak seçilen hayvan dişi olmalıdır!");
                        }

                        if (mother.getStatus() == AnimalStatus.SATILDI) {
                                throw new BusinessException("Satılmış bir hayvan anne olarak seçilemez!");
                        }

                        if (mother.getStatus() == AnimalStatus.OLDU && mother.getDeathDate() != null
                                        && createDto.birthDate() != null
                                        && createDto.birthDate().isAfter(mother.getDeathDate())) {
                                throw new BusinessException("Anne hayvan (" + mother.getTagNumber()
                                                + "), buzağının doğum tarihinden önce (" + mother.getDeathDate()
                                                + ") ölmüş!");
                        }

                        if (mother.getBirthDate() != null && createDto.birthDate() != null
                                        && !createDto.birthDate().isAfter(mother.getBirthDate())) {
                                throw new BusinessException(
                                                "Buzağının doğum tarihi annenin doğum tarihinden sonra olmalıdır!");
                        }

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
                        int activeCountInTarget = animalRepository.countBySectionIdAndStatus(targetSectionId,
                                        AnimalStatus.AKTIF);
                        if (activeCountInTarget >= targetSection.getCapacity()) {
                                throw new BusinessException(
                                                "Hedef bölme dolu! Maksimum kapasite: " + targetSection.getCapacity());
                        }
                }

                Integer assignedSlot = targetSlotNumber;
                if (assignedSlot != null) {
                        if (assignedSlot < 1 || assignedSlot > targetSection.getCapacity()) {
                                throw new BusinessException("Durak/slot numarası 1 ile " + targetSection.getCapacity()
                                                + " arasında olmalıdır!");
                        }
                        boolean isSameSlot = animal.getSection().getId().equals(targetSectionId)
                                        && assignedSlot.equals(animal.getSlotNumber());

                        if (!isSameSlot && animalRepository.existsBySectionIdAndSlotNumberAndStatus(
                                        targetSectionId, assignedSlot, AnimalStatus.AKTIF)) {
                                throw new BusinessException("Hedef durak/slot (" + assignedSlot + ") dolu!");
                        }
                } else {
                        if (animal.getSection().getId().equals(targetSectionId) && animal.getSlotNumber() != null) {
                                assignedSlot = animal.getSlotNumber();
                        } else {
                                assignedSlot = findFirstAvailableSlot(targetSectionId, targetSection.getCapacity());
                        }
                }

                animal.setSection(targetSection);
                animal.setSlotNumber(assignedSlot);
                Animal updateAnimal = animalRepository.save(animal);
                return convertToDto(updateAnimal);
        }

        @Transactional
        public AnimalResponseDto updateAnimalStatus(Long animalId, AnimalStatus newStatus) {
                Animal animal = animalRepository.findById(animalId)
                                .orElseThrow(() -> new ResourceNotFoundException("Hayvan bulunamadı: " + animalId));

                if (animal.getStatus() != AnimalStatus.AKTIF) {
                        throw new BusinessException("Satılmış veya ölmüş bir hayvanın durumu tekrar değiştirilemez!");
                }

                if (newStatus == AnimalStatus.AKTIF) {
                        return convertToDto(animal);
                }

                animal.setStatus(newStatus);

                if (newStatus == AnimalStatus.OLDU && animal.getDeathDate() == null) {
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

                if (animal.getStatus() != AnimalStatus.AKTIF) {
                        throw new BusinessException("Satılmış veya ölmüş bir hayvana aşı kaydı eklenemez!");
                }

                if (animal.getBirthDate() != null && dto.appliedDate() != null
                                && dto.appliedDate().isBefore(animal.getBirthDate())) {
                        throw new BusinessException("Aşı uygulama tarihi (" + dto.appliedDate()
                                        + "), hayvanın doğum tarihinden (" + animal.getBirthDate() + ") önce olamaz!");
                }

                if (dto.nextDueDate() != null && dto.appliedDate() != null
                                && dto.nextDueDate().isBefore(dto.appliedDate())) {
                        throw new BusinessException("Sonraki aşı tarihi, uygulama tarihinden önce olamaz!");
                }

                Locale trLocale = Locale.forLanguageTag("tr");
                String newVaccineLower = dto.vaccineName().trim().toLowerCase(trLocale);

                for (VaccinationRecord oldRecord : animal.getVaccinationRecords()) {
                        if (!oldRecord.isCompleted()) {
                                String oldVaccineLower = oldRecord.getVaccineName().trim().toLowerCase(trLocale);
                                if (oldVaccineLower.equals(newVaccineLower)
                                                || (oldRecord.getNextDueDate() != null
                                                                && !oldRecord.getNextDueDate()
                                                                                .isAfter(LocalDate.now()))) {
                                        oldRecord.setCompleted(true);
                                }
                        }
                }

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

                if (animal.getStatus() != AnimalStatus.AKTIF) {
                        throw new BusinessException("Satılmış veya ölmüş bir hayvana tohumlama kaydı eklenemez!");
                }

                if (!"DISI".equalsIgnoreCase(animal.getGender())) {
                        throw new BusinessException("Sadece dişi hayvanlara tohumlama kaydı eklenebilir!");
                }

                if (animal.getBirthDate() != null && dto.inseminationDate() != null
                                && dto.inseminationDate().isBefore(animal.getBirthDate())) {
                        throw new BusinessException("Tohumlama tarihi (" + dto.inseminationDate()
                                        + "), hayvanın doğum tarihinden (" + animal.getBirthDate() + ") önce olamaz!");
                }

                if (dto.expectedBirthDate() != null && dto.inseminationDate() != null
                                && !dto.expectedBirthDate().isAfter(dto.inseminationDate())) {
                        throw new BusinessException("Tahmini doğum tarihi, tohumlama tarihinden sonra olmalıdır!");
                }

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
                        targetAnimal = animalRepository.findAllById(dtos.animalIds()).stream()
                                        .filter(a -> a.getStatus() == AnimalStatus.AKTIF).toList();
                } else {
                        throw new BusinessException("Toplu Aşılama İçin En Az Bir Tane Hayvan Seçmelisiniz");
                }

                if (targetAnimal.isEmpty()) {
                        throw new BusinessException("Toplu Aşılama İçin Seçilen Hayvanlar Bulunamadı");
                }

                Locale trLocale = Locale.forLanguageTag("tr");
                String newVaccineLower = dtos.vaccineName().trim().toLowerCase(trLocale);

                for (Animal animal : targetAnimal) {
                        if (animal.getBirthDate() != null && dtos.appliedDate() != null
                                        && dtos.appliedDate().isBefore(animal.getBirthDate())) {
                                throw new BusinessException(animal.getTagNumber()
                                                + " küpeli hayvanın doğum tarihi (" + animal.getBirthDate()
                                                + "), seçilen aşı tarihinden (" + dtos.appliedDate() + ") sonradır!");
                        }
                        for (VaccinationRecord oldRecord : animal.getVaccinationRecords()) {
                                if (!oldRecord.isCompleted()) {
                                        String oldVaccineLower = oldRecord.getVaccineName().trim()
                                                        .toLowerCase(trLocale);
                                        if (oldVaccineLower.equals(newVaccineLower)
                                                        || (oldRecord.getNextDueDate() != null
                                                                        && !oldRecord.getNextDueDate()
                                                                                        .isAfter(LocalDate.now()))) {
                                                oldRecord.setCompleted(true);
                                        }
                                }
                        }

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