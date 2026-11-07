package com.ciftlik.hayvantakip.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Getter
@Setter
@Table(name = "animals")
@AllArgsConstructor
@NoArgsConstructor
public class Animal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String tagNumber;

    private String name;
    private LocalDate birthDate;
    private LocalDate deathDate;
    private String gender;
    private String breed; // ırkını temsil eder

    // hayvanın durumunu ilk başta oluşturuken defult olarak aktif veriyoruz
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AnimalStatus status = AnimalStatus.AKTIF;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    @JsonIgnoreProperties("animals")
    private Section section;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mother_id")
    @JsonIgnoreProperties({ "section", "mother" })
    private Animal mother;

}
