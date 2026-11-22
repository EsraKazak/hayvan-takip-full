package com.ciftlik.hayvantakip.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ciftlik.hayvantakip.entity.Animal;
import com.ciftlik.hayvantakip.entity.AnimalStatus;

public interface AnimalRepository extends JpaRepository<Animal, Long> {

    // kulak küpe numarasını aramamızı sağlar optinal kullanma sebebimiz null
    // olduğunda boş döndürmesin diye
    Optional<Animal> findByTagNumber(String tagNumber);

    // o bölmedeki hayvanların getirmeyi sağlar
    List<Animal> findBySectionId(Long sectionId);

    int countBySectionId(Long sectionId);

    // padoktaki hayvanların sadece aktif olanlarını getirmeyi sağlar
    int countBySectionIdAndStatus(Long sectionId, AnimalStatus status);

    // padotaki belirli slottak, hayvanın durumunu kontrol etmeyi sağlar
    boolean existsBySectionIdAndSlotNumberAndStatus(Long sectionId, Integer slotNumber, AnimalStatus status);

    // aynı slotta başka aktif hayvanın var olma durmunu kontrol eder
    boolean existsBySectionIdAndSlotNumberAndStatusAndIdNot(Long sectionId, Integer slotNumber, AnimalStatus status,
            Long id);

    // hayvaın slot numarasını yazmadığımızda null atmasını engellemek için
    @Query("SELECT a.slotNumber FROM Animal a WHERE a.section.id = :sectionId AND a.status = 'AKTIF' AND a.slotNumber IS NOT NULL")
    List<Integer> findOccupiedSlotNumbersBySectionId(@Param("sectionId") Long sectionId);
}
