package com.ciftlik.hayvantakip.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ciftlik.hayvantakip.dto.NotificationItemDto;
import com.ciftlik.hayvantakip.dto.RecipientDto;
import com.ciftlik.hayvantakip.service.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/alerts")
    public ResponseEntity<List<NotificationItemDto>> getAlerts() {
        return ResponseEntity.ok(notificationService.getActiveAlerts());
    }

    @GetMapping("/recipients")
    public ResponseEntity<List<RecipientDto>> getRecipients() {
        return ResponseEntity.ok(notificationService.getAllRecipients());
    }

    @PostMapping("/recipients")
    public ResponseEntity<RecipientDto> addRecipient(@RequestBody RecipientDto dto) {
        return ResponseEntity.ok(notificationService.addRecipient(dto));
    }

    @DeleteMapping("/recipients/{id}")
    public ResponseEntity<Void> deleteRecipient(@PathVariable Long id) {
        notificationService.deleteRecipient(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/send-emails")
    public ResponseEntity<?> sendEmails() {
        int sentCount = notificationService.sendDailyEmailNotifications();
        return ResponseEntity.ok(Map.of(
                "sentCount", sentCount,
                "message", sentCount > 0
                        ? sentCount + " alıcıya bildirim e-postası gönderildi."
                        : "Gönderilecek aktif bir uyarı bulunamadı."));
    }
}