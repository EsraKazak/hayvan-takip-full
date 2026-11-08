package com.ciftlik.hayvantakip.entity;

import java.time.LocalDate;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "insemination_records")
@Data
@NoArgsConstructor
public class InseminationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate inseminationDate;
    private LocalDate expectedBirthDate;
    private String status;
    private String bullInfo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

}
