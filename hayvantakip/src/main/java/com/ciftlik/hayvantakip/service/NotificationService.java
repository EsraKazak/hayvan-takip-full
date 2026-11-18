package com.ciftlik.hayvantakip.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ciftlik.hayvantakip.dto.NotificationItemDto;
import com.ciftlik.hayvantakip.dto.RecipientDto;
import com.ciftlik.hayvantakip.entity.InseminationRecord;
import com.ciftlik.hayvantakip.entity.NotificationRecipient;
import com.ciftlik.hayvantakip.entity.VaccinationRecord;
import com.ciftlik.hayvantakip.exception.BusinessException;
import com.ciftlik.hayvantakip.exception.ResourceNotFoundException;
import com.ciftlik.hayvantakip.repository.InseminationRecordRepository;
import com.ciftlik.hayvantakip.repository.NotificationRecipientRepository;
import com.ciftlik.hayvantakip.repository.VaccinationRecordRepository;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final VaccinationRecordRepository vaccinationRepository;
    private final InseminationRecordRepository inseminationRepository;
    private final NotificationRecipientRepository recipientRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    // 1. Uygulama İçi Aktif Bildirimleri Getir (Önümüzdeki 7 gün aşı, 14 gün doğum)
    @Transactional(readOnly = true)
    public List<NotificationItemDto> getActiveAlerts() {
        LocalDate today = LocalDate.now();
        List<NotificationItemDto> alerts = new ArrayList<>();

        // Gecikmiş veya 7 gün içinde gelecek aşılar
        List<VaccinationRecord> vaccinations = vaccinationRepository
                .findUpcomingOrOverdueVaccinations(today.plusDays(7));

        for (VaccinationRecord v : vaccinations) {
            long days = ChronoUnit.DAYS.between(today, v.getNextDueDate());
            String severity = days < 0 ? "OVERDUE" : "UPCOMING";
            String sectionName = v.getAnimal().getSection() != null ? v.getAnimal().getSection().getName() : "-";

            alerts.add(new NotificationItemDto(
                    "VAC-" + v.getId(),
                    "VACCINATION",
                    severity,
                    v.getAnimal().getTagNumber(),
                    v.getAnimal().getName(),
                    sectionName,
                    v.getVaccineName(),
                    v.getNextDueDate(),
                    days));
        }

        // 3 gün gecikmiş veya 14 gün içinde beklenen doğumlar
        List<InseminationRecord> births = inseminationRepository
                .findUpcomingBirths(today.minusDays(3), today.plusDays(14));

        for (InseminationRecord i : births) {
            long days = ChronoUnit.DAYS.between(today, i.getExpectedBirthDate());
            String severity = days < 0 ? "OVERDUE" : "UPCOMING";
            String sectionName = i.getAnimal().getSection() != null ? i.getAnimal().getSection().getName() : "-";

            alerts.add(new NotificationItemDto(
                    "BIRTH-" + i.getId(),
                    "BIRTH",
                    severity,
                    i.getAnimal().getTagNumber(),
                    i.getAnimal().getName(),
                    sectionName,
                    "Beklenen Doğum",
                    i.getExpectedBirthDate(),
                    days));
        }

        return alerts;
    }

    // 2. Alıcı Yönetimi (CRUD)
    @Transactional(readOnly = true)
    public List<RecipientDto> getAllRecipients() {
        return recipientRepository.findAll().stream()
                .map(r -> new RecipientDto(r.getId(), r.getFullName(), r.getEmail(), r.getRole(),
                        r.isReceiveVaccinationAlerts(), r.isReceiveBirthAlerts(), r.isActive()))
                .toList();
    }

    @Transactional
    public RecipientDto addRecipient(RecipientDto dto) {
        if (recipientRepository.existsByEmail(dto.email().trim().toLowerCase())) {
            throw new BusinessException("Bu e-posta adresi zaten bildirim listesinde kayıtlı!");
        }
        NotificationRecipient entity = new NotificationRecipient();
        entity.setFullName(dto.fullName().trim());
        entity.setEmail(dto.email().trim().toLowerCase());
        entity.setRole(dto.role());
        entity.setReceiveVaccinationAlerts(dto.receiveVaccinationAlerts());
        entity.setReceiveBirthAlerts(dto.receiveBirthAlerts());
        entity.setActive(true);

        NotificationRecipient saved = recipientRepository.save(entity);
        return new RecipientDto(saved.getId(), saved.getFullName(), saved.getEmail(), saved.getRole(),
                saved.isReceiveVaccinationAlerts(), saved.isReceiveBirthAlerts(), saved.isActive());
    }

    @Transactional
    public void deleteRecipient(Long id) {
        if (!recipientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Alıcı bulunamadı: " + id);
        }
        recipientRepository.deleteById(id);
    }

    // 3. Çoklu Alıcıya E-Posta Gönderimi
    @Transactional(readOnly = true)
    public int sendDailyEmailNotifications() {
        if (mailSender == null || fromEmail == null || fromEmail.isBlank()) {
            throw new BusinessException(
                    "Mail sunucusu yapılandırılmamış! Render/application.properties mail ayarlarını kontrol edin.");
        }

        List<NotificationItemDto> allAlerts = getActiveAlerts();
        if (allAlerts.isEmpty()) {
            return 0; // Gönderilecek yaklaşan/geciken uyarı yok
        }

        List<NotificationRecipient> recipients = recipientRepository.findByActiveTrue();
        if (recipients.isEmpty()) {
            throw new BusinessException("Bildirim gönderilecek aktif alıcı bulunamadı.");
        }

        int sentCount = 0;
        for (NotificationRecipient recipient : recipients) {
            // Alıcının tercihine göre sadece ilgilendiği bildirimleri filtrele
            List<NotificationItemDto> userAlerts = allAlerts.stream()
                    .filter(a -> (a.type().equals("VACCINATION") && recipient.isReceiveVaccinationAlerts())
                            || (a.type().equals("BIRTH") && recipient.isReceiveBirthAlerts()))
                    .toList();

            if (userAlerts.isEmpty())
                continue;

            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(fromEmail);
                helper.setTo(recipient.getEmail());
                helper.setSubject("🐄 Çiftlik Günlük Hatırlatma Raporu (" + userAlerts.size() + " Uyarı)");
                helper.setText(buildHtmlEmail(recipient.getFullName(), userAlerts), true);

                mailSender.send(message);
                sentCount++;
            } catch (Exception e) {
                throw new BusinessException(
                        "Mail gönderilirken hata oluştu (" + recipient.getEmail() + "): " + e.getMessage());
            }
        }
        return sentCount;
    }

    private String buildHtmlEmail(String recipientName, List<NotificationItemDto> alerts) {
        StringBuilder sb = new StringBuilder();
        sb.append(
                "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;'>");
        sb.append("<h2 style='color: #047857;'>Merhaba ").append(recipientName).append(",</h2>");
        sb.append(
                "<p style='color: #374151;'>İşletmenizdeki hayvanlar için yaklaşan veya geciken hatırlatmalar aşağıdadır:</p>");
        sb.append("<table style='width: 100%; border-collapse: collapse; margin-top: 12px;'>");
        sb.append("<thead><tr style='background-color: #f3f4f6; text-align: left;'>")
                .append("<th style='padding: 8px; border-bottom: 1px solid #d1d5db;'>Küpe No</th>")
                .append("<th style='padding: 8px; border-bottom: 1px solid #d1d5db;'>Padok</th>")
                .append("<th style='padding: 8px; border-bottom: 1px solid #d1d5db;'>Konu</th>")
                .append("<th style='padding: 8px; border-bottom: 1px solid #d1d5db;'>Tarih / Durum</th>")
                .append("</tr></thead><tbody>");

        for (NotificationItemDto item : alerts) {
            String statusText = item.daysRemaining() < 0
                    ? "<span style='color: #dc2626; font-weight: bold;'>" + Math.abs(item.daysRemaining())
                            + " gün gecikti (" + item.targetDate() + ")</span>"
                    : item.daysRemaining() == 0
                            ? "<span style='color: #d97706; font-weight: bold;'>BUGÜN (" + item.targetDate()
                                    + ")</span>"
                            : item.daysRemaining() + " gün kaldı (" + item.targetDate() + ")";

            sb.append("<tr>")
                    .append("<td style='padding: 8px; border-bottom: 1px solid #e5e7eb;'><strong>")
                    .append(item.animalTagNumber()).append("</strong></td>")
                    .append("<td style='padding: 8px; border-bottom: 1px solid #e5e7eb;'>").append(item.sectionName())
                    .append("</td>")
                    .append("<td style='padding: 8px; border-bottom: 1px solid #e5e7eb;'>").append(item.title())
                    .append("</td>")
                    .append("<td style='padding: 8px; border-bottom: 1px solid #e5e7eb;'>").append(statusText)
                    .append("</td>")
                    .append("</tr>");
        }

        sb.append("</tbody></table>");
        sb.append(
                "<p style='font-size: 12px; color: #6b7280; margin-top: 20px;'>Bu e-posta Hayvan Takip Sistemi tarafından otomatik oluşturulmuştur.</p>");
        sb.append("</div>");
        return sb.toString();
    }
}