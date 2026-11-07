package com.ciftlik.hayvantakip.entity;

import java.util.List;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
// Hayvan bölmeleri için oluşturulmuş bir entity sınıfıdır.
public class Section {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Integer capacity;

    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL)
    private List<Animal> animals;

}
