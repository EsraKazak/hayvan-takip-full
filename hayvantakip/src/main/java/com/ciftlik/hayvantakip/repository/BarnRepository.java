package com.ciftlik.hayvantakip.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ciftlik.hayvantakip.entity.Barn;

public interface BarnRepository extends JpaRepository<Barn, Long> {
    boolean existsByNameIgnoreCase(String name);

}
