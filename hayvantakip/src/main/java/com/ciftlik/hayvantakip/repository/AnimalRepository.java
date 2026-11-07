package com.ciftlik.hayvantakip.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ciftlik.hayvantakip.entity.Animal;

public interface AnimalRepository extends JpaRepository<Animal, Long> {

    // kulak küpe numarasını aramamızı sağlar optinal kullanma sebebimiz null
    // olduğunda boş döndürmesin diye
    Optional<Animal> findByTagNumber(String tagNumber);

    // o bölmedeki hayvanların getirmeyi sağlar
    List<Animal> findBySectionId(Long sectionId);

    int countBySectionId(Long sectionId);

}
