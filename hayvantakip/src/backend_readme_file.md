# 🚀 Çiftlik Hayvan Takip Sistemi - Backend API

Bu proje, çiftliklerde bulunan hayvanların ve padokların (bölmelerin) takibini, kapasite yönetimini ve hayvan transfer süreçlerini yönetmek amacıyla **Spring Boot 3** mimarisi kullanılarak geliştirilmiş bir RESTful API servisidir.

---

## 🛠️ Kullanılan Teknolojiler ve Kütüphaneler

* **Dil / Framework:** Java 21 (LTS) / Spring Boot 3.3.13
* **Veritabanı & ORM:** PostgreSQL / Spring Data JPA & Hibernate
* **Dokümantasyon & Test Arayüzü:** Springdoc OpenAPI / Swagger UI (`2.6.0`)
* **Kod Sadeleştirme:** Lombok (`1.18.34`)
* **Veri Doğrulama:** Jakarta Bean Validation (`spring-boot-starter-validation`)
* **Build Aracı:** Maven (`mvnw` wrapper)

---

## 🏗️ Mimari Yapı ve Tasarım Desenleri

Projede **Layered Architecture (Katmanlı Mimari)** ve **DTO (Data Transfer Object)** deseni uygulanmıştır.

1. **Entity Katmanı:** Veritabanındaki `Section` (Padok) ve `Animal` (Hayvan) tablolarının çift yönlü (`@OneToMany` / `@ManyToOne`) ilişki kurallarını yönetir.
2. **DTO Katmanı (Java Records):** Entity nesneleri doğrudan dış dünyaya açılmaz.
   * **Request DTOs (`AnimalCreateDto`, `SectionCreateDto`):** İstemciden gelen verileri kabul eder ve `@Valid` anotasyonları ile doğrular.
   * **Response DTOs (`AnimalResponseDto`, `SectionResponseDto`):** Sadece ihtiyaç duyulan verileri dışarı döner. Dairesel referans (Circular Reference / Infinite Loop) riskini %100 ortadan kaldırır.
3. **Service Katmanı:** İş kurallarının (Business Logic), kapasite kontrollerinin ve durum güncellemelerinin yönetildiği katmandır.
4. **Controller Katmanı:** RESTful uç noktaların tanımlandığı ve istemci isteklerinin karşılandığı katmandır.

---

## 🔑 Öne Çıkan Özellikler ve İş Kuralları

* **Padok Kapasite Yönetimi:** Bir padoğa yeni hayvan eklenirken veya hayvan transferi yapılırken padoğun mevcut doluluğu ve kapasitesi kontrol edilir. Kapasite aşıldığında işlem engellenir.
* **Kulak Numarası (Tag Number) Kontrolü:** Her hayvan benzersiz bir kulak numarasına sahiptir.
* **Soydaşlık (Anne) Takibi:** Hayvan eklenirken isteğe bağlı olarak anne hayvan (`motherId`) ilişkisi kurulabilir.
* **Veri Doğrulama (Validation):**
  * Boş veri gönderimi engellenir (`@NotBlank`, `@NotNull`).
  * Doğum tarihinin gelecek bir tarih olması engellenir (`@PastOrPresent`).
  * Padok kapasitelerinin negatif veya sıfır girilmesi engellenir (`@Min(1)`).

---

## 📌 API Uç Noktaları (Endpoints)

### 🏡 Padok (Section) İşlemleri (`/api/sections`)

| HTTP Metodu | Endpoint | Açıklama | Request Body |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/sections` | Yeni padok ekler | `SectionCreateDto` |
| **GET** | `/api/sections` | Tüm padokları listeler | - |
| **GET** | `/api/sections/{id}` | ID'ye göre padok detayını getirir | - |

---

### 🐄 Hayvan (Animal) İşlemleri (`/api/animals`)

| HTTP Metodu | Endpoint | Açıklama | Params / Request Body |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/animals` | Yeni hayvan ekler | `AnimalCreateDto` |
| **GET** | `/api/animals/tag/{tagNumber}` | Kulak numarasına göre hayvan arar | - |
| **GET** | `/api/animals/section/{sectionId}` | Belirli bir padoktaki hayvanları listeler | - |
| **PUT** | `/api/animals/{id}/transfer` | Hayvanı başka padoğa transfer eder | `?targetSectionId={id}` |
| **PUT** | `/api/animals/{id}/status` | Hayvanın durumunu günceller (AKTIF, SATILDI, OLDU vb.) | `?status={ANIMAL_STATUS}` |

---

## ⚡ Kurulum ve Çalıştırma

### Gereksinimler
* Java 21 JDK
* PostgreSQL Veritabanı

### 1. Veritabanı Yapılandırması
`src/main/resources/application.properties` dosyasında PostgreSQL bağlantı bilgilerinizi düzenleyin:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/ciftlik_db
spring.datasource.username=postgres
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
```

### 2. Derleme ve Projeyi Başlatma
Terminalde proje ana dizininde şu komutları çalıştırın:

```powershell
# Projeyi derleyin
.\mvnw clean install -DskipTests

# Uygulamayı başlatın
.\mvnw spring-boot:run
```

---

## 📖 Swagger UI Arayüzü

Uygulama kalktıktan sonra tüm uç noktaları test etmek ve canlı API dokümantasyonunu incelemek için tarayıcınızdan şu adrese gidin:

👉 **`http://localhost:8080/swagger-ui/index.html`**

OpenAPI tanım çıktısı (JSON):
👉 **`http://localhost:8080/v3/api-docs`**