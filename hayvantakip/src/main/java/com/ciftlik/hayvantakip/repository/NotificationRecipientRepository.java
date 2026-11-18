package com.ciftlik.hayvantakip.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ciftlik.hayvantakip.entity.NotificationRecipient;

public interface NotificationRecipientRepository extends JpaRepository<NotificationRecipient, Long> {
    List<NotificationRecipient> findByActiveTrue();

    boolean existsByEmail(String email);
}
