import React, { useEffect, useState } from "react";
import { animalApi } from "../api/animalApi";
import { sectionApi } from "../api/sectionApi";
import type {
  AnimalResponseDTO,
  SectionResponseDTO,
  AnimalStatus,
} from "../types";
import {
  Plus,
  Search,
  ArrowRightLeft,
  Tag,
  Filter,
  RefreshCw,
  Syringe,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { BulkVaccinationModal } from "../components/BulkVaccinationModal";

export const AnimalsPage: React.FC = () => {
  const [animals, setAnimals] = useState<AnimalResponseDTO[]>([]);
  const [sections, setSections] = useState<SectionResponseDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Arama ve Filtreleme State'leri
  const [searchTag, setSearchTag] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>("ALL");
  const [selectedSectionFilter, setSelectedSectionFilter] =
    useState<string>("ALL");

  // Modallar
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Durum Değişikliği Onay Modalı State'leri
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    animal: AnimalResponseDTO;
    newStatus: "SATILDI" | "OLDU";
  } | null>(null);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  // Form State - Ekleme
  const [tagNumber, setTagNumber] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"ERKEK" | "DISI" | "">("DISI");
  const [breed, setBreed] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState<number | "">("");
  const [selectedMotherId, setSelectedMotherId] = useState<number | "">("");
  const [slotNumber, setSlotNumber] = useState<number | "">("");

  // Form State - Transfer
  const [selectedAnimal, setSelectedAnimal] =
    useState<AnimalResponseDTO | null>(null);
  const [targetSectionId, setTargetSectionId] = useState<number | "">("");
  const [targetSlotNumber, setTargetSlotNumber] = useState<number | "">("");

  // Toplu aşılama için
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<number[]>([]);
  const [isBulkVaccineModalOpen, setIsBulkVaccineModalOpen] = useState(false);

  // Verileri Çekme
  const fetchData = async () => {
    try {
      setLoading(true);
      const sectionsData = await sectionApi.getAllSections();
      setSections(sectionsData);

      const animalPromises = sectionsData.map((sec) =>
        animalApi.getBySectionId(sec.id),
      );
      const animalResults = await Promise.all(animalPromises);
      const allAnimals = animalResults.flat();

      setAnimals(allAnimals);
      setError(null);
    } catch (err: any) {
      setError(
        "Veriler yüklenirken hata oluştu. Backend servisinin açık olduğundan emin olun.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Kulak No ile Tekli Arama
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTag.trim()) {
      fetchData();
      return;
    }
    try {
      setLoading(true);
      const result = await animalApi.getByTagNumber(searchTag.trim());
      if (result && result.id) {
        setAnimals([result]);
        setError(null);
      } else {
        setAnimals([]);
        setError(`'${searchTag}' kulak numaralı hayvan bulunamadı.`);
      }
    } catch (err: any) {
      setAnimals([]);
      setError(`'${searchTag}' kulak numaralı hayvan bulunamadı.`);
    } finally {
      setLoading(false);
    }
  };

  // Yeni Hayvan Kaydetme
  const handleCreateAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSectionId || !gender) {
      toast.error("Lütfen zorunlu alanları doldurun!");
      return;
    }

    try {
      await animalApi.create({
        tagNumber,
        name: name.trim() || undefined,
        birthDate,
        gender,
        breed: breed.trim(),
        sectionId: Number(selectedSectionId),
        motherId: selectedMotherId ? Number(selectedMotherId) : undefined,
        slotNumber: slotNumber ? Number(slotNumber) : null,
      });

      toast.success(`${tagNumber} küpe numaralı hayvan başarıyla kaydedildi!`);

      // Formu Sıfırla
      setTagNumber("");
      setName("");
      setBirthDate("");
      setGender("DISI");
      setBreed("");
      setSelectedSectionId("");
      setSelectedMotherId("");
      setSlotNumber("");
      setIsAddModalOpen(false);
      fetchData();
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Hayvan eklenirken bir hata oluştu.";
      toast.error(msg);
    }
  };

  // Padok Transferi
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimal || !targetSectionId) return;

    try {
      await animalApi.transfer(
        selectedAnimal.id,
        Number(targetSectionId),
        targetSlotNumber ? Number(targetSlotNumber) : null,
      );
      toast.success(
        `${selectedAnimal.tagNumber} küpeli hayvan başarıyla transfer edildi!`,
      );
      setIsTransferModalOpen(false);
      setSelectedAnimal(null);
      setTargetSectionId("");
      setTargetSlotNumber("");
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Transfer işlemi başarısız.";
      toast.error(msg);
    }
  };

  // Durum Seçildiğinde Onay Modalını Aç
  const handleStatusSelect = (animal: AnimalResponseDTO, value: string) => {
    if (value === "SATILDI" || value === "OLDU") {
      setPendingStatusChange({ animal, newStatus: value });
    }
  };

  // Onay Modalından "Evet, Onayla" Denildiğinde Kaydet
  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    try {
      setIsStatusUpdating(true);
      await animalApi.updateStatus(
        pendingStatusChange.animal.id,
        pendingStatusChange.newStatus as AnimalStatus,
      );
      toast.success(
        `${pendingStatusChange.animal.tagNumber} küpeli hayvan '${
          pendingStatusChange.newStatus === "SATILDI" ? "SATILDI" : "ÖLDÜ"
        }' olarak güncellendi ve yeri boşaltıldı.`,
      );
      setPendingStatusChange(null);
      await fetchData();
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Durum güncellenirken hata oluştu.";
      toast.error(msg);
    } finally {
      setIsStatusUpdating(false);
    }
  };

  // Filtreleri Sıfırlama
  const handleResetFilters = () => {
    setSearchTag("");
    setSelectedStatusFilter("ALL");
    setSelectedSectionFilter("ALL");
    fetchData();
  };

  // CANLI FİLTRELEME MANTIĞI
  const filteredAnimals = animals.filter((animal) => {
    const matchesStatus =
      selectedStatusFilter === "ALL" ||
      animal.animalStatus === selectedStatusFilter;

    const matchesSection =
      selectedSectionFilter === "ALL" ||
      animal.sectionId === Number(selectedSectionFilter);

    return matchesStatus && matchesSection;
  });

  // Listede o an görünen sadece AKTİF hayvanlar (Toplu aşılama seçimi için)
  const activeFilteredAnimals = filteredAnimals.filter(
    (a) => a.animalStatus === "AKTIF",
  );

  const toggleSelectAnimal = (animal: AnimalResponseDTO) => {
    if (animal.animalStatus !== "AKTIF") return;
    setSelectedAnimalIds((prev) =>
      prev.includes(animal.id)
        ? prev.filter((item) => item !== animal.id)
        : [...prev, animal.id],
    );
  };

  const toggleSelectAll = () => {
    if (
      activeFilteredAnimals.length > 0 &&
      selectedAnimalIds.length === activeFilteredAnimals.length
    ) {
      setSelectedAnimalIds([]);
    } else {
      setSelectedAnimalIds(activeFilteredAnimals.map((a) => a.id));
    }
  };

  // Toplu aşılama modalına sadece aktif olan seçili hayvanları gönder
  const selectedAnimalObjects = animals.filter(
    (a) => selectedAnimalIds.includes(a.id) && a.animalStatus === "AKTIF",
  );

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Üst Başlık & Aksiyonlar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hayvan Yönetimi</h1>
          <p className="text-gray-600 text-sm">
            Çiftlikteki tüm hayvanları filtreleyin, transfer edin veya
            durumlarını güncelleyin.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsBulkVaccineModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm"
          >
            <Syringe className="h-5 w-5" />
            Toplu Aşılama{" "}
            {selectedAnimalObjects.length > 0 &&
              `(${selectedAnimalObjects.length})`}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Yeni Hayvan Ekle
          </button>
        </div>
      </div>

      {/* ARAMA & FİLTRELEME ÇUBUĞU */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        {/* Sol Taraf: Arama Kutusu */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Kulak Küpe No ile Ara (Örn: TR34001)..."
              value={searchTag}
              onChange={(e) => setSearchTag(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50/50 text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium text-sm"
          >
            Ara
          </button>
        </form>

        {/* Sağ Taraf: Dropdown Filtreler */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <Filter className="h-4 w-4" />
            Filtrele:
          </div>

          {/* Durum Filtresi */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-gray-700"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="AKTIF">AKTİF</option>
            <option value="SATILDI">SATILDI</option>
            <option value="OLDU">ÖLDÜ</option>
          </select>

          {/* Padok Filtresi */}
          <select
            value={selectedSectionFilter}
            onChange={(e) => setSelectedSectionFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-gray-700"
          >
            <option value="ALL">Tüm Padoklar</option>
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name}
              </option>
            ))}
          </select>

          {/* Filtreleri Sıfırla Butonu */}
          {(selectedStatusFilter !== "ALL" ||
            selectedSectionFilter !== "ALL" ||
            searchTag !== "") && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-3 py-2 border text-gray-600 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Sıfırla
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded text-red-700">
          {error}
        </div>
      )}

      {/* Hayvan Tablosu */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          Hayvanlar Yükleniyor...
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      disabled={activeFilteredAnimals.length === 0}
                      checked={
                        activeFilteredAnimals.length > 0 &&
                        selectedAnimalIds.length ===
                          activeFilteredAnimals.length
                      }
                      onChange={toggleSelectAll}
                      title="Tüm aktif hayvanları seç"
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </th>
                  <th className="py-3 px-4">Kulak No</th>
                  <th className="py-3 px-4">Adı</th>
                  <th className="py-3 px-4">Cinsiyet / Irk</th>
                  <th className="py-3 px-4">Doğum Tarihi</th>
                  <th className="py-3 px-4">Bulunduğu Padok</th>
                  <th className="py-3 px-4">Anne Küpe No</th>
                  <th className="py-3 px-4">Durum</th>
                  <th className="py-3 px-4 text-right">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredAnimals.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-400">
                      Seçilen kriterlere uygun hayvan bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredAnimals.map((animal) => {
                    const isActive = animal.animalStatus === "AKTIF";
                    return (
                      <tr
                        key={animal.id}
                        className={`transition-colors ${
                          isActive
                            ? "hover:bg-gray-50/50"
                            : "bg-gray-50/60 text-gray-500"
                        }`}
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            disabled={!isActive}
                            checked={
                              isActive && selectedAnimalIds.includes(animal.id)
                            }
                            onChange={() => toggleSelectAnimal(animal)}
                            title={
                              !isActive
                                ? "Satılan veya ölen hayvanlar aşılamaya seçilemez"
                                : "Aşılama için seç"
                            }
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-800 flex items-center gap-2">
                          <Tag
                            className={`h-4 w-4 ${
                              isActive ? "text-emerald-600" : "text-gray-400"
                            }`}
                          />
                          {animal.tagNumber}
                        </td>
                        <td className="py-3 px-4 text-gray-700 font-medium">
                          {animal.name || "-"}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <span className="font-medium text-gray-800">
                            {animal.gender === "DISI" ? "Dişi" : "Erkek"}
                          </span>
                          <span className="text-xs text-gray-400 block">
                            {animal.breed || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {animal.birthDate}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {isActive ? (
                            <span className="text-emerald-700">
                              {animal.sectionName ||
                                `Padok #${animal.sectionId}`}
                              {animal.slotNumber
                                ? ` (Durak #${animal.slotNumber})`
                                : ""}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">
                              {animal.sectionName ||
                                `Padok #${animal.sectionId}`}
                              {animal.slotNumber
                                ? ` • Durak #${animal.slotNumber}`
                                : ""}
                              <span className="block text-[11px] italic text-gray-400">
                                (Ayrıldı - Yer Boşaltıldı)
                              </span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {animal.motherTagNumber || "-"}
                        </td>
                        <td className="py-3 px-4">
                          {isActive ? (
                            <select
                              value={animal.animalStatus}
                              onChange={(e) =>
                                handleStatusSelect(animal, e.target.value)
                              }
                              className="px-2.5 py-1 text-xs font-semibold rounded-full border-none bg-emerald-100 text-emerald-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                            >
                              <option value="AKTIF">AKTİF</option>
                              <option value="SATILDI">SATILDI</option>
                              <option value="OLDU">ÖLDÜ</option>
                            </select>
                          ) : (
                            <span
                              title="Bu kayıt kilitlenmiştir, geri alınamaz"
                              className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full select-none ${
                                animal.animalStatus === "SATILDI"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {animal.animalStatus === "SATILDI"
                                ? "SATILDI"
                                : "ÖLDÜ"}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            disabled={!isActive}
                            title={
                              !isActive
                                ? "Sadece aktif hayvanlar transfer edilebilir"
                                : "Hayvanı başka padoğa aktar"
                            }
                            onClick={() => {
                              setSelectedAnimal(animal);
                              setIsTransferModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                            Transfer Et
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Durum Değişikliği Onay Penceresi */}
      {pendingStatusChange && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`p-2.5 rounded-full ${
                  pendingStatusChange.newStatus === "SATILDI"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {pendingStatusChange.newStatus === "SATILDI"
                  ? "Hayvan Satış Onayı"
                  : "Hayvan Ölüm Kaydı Onayı"}
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              <span className="font-bold text-gray-900">
                {pendingStatusChange.animal.tagNumber}
              </span>{" "}
              {pendingStatusChange.animal.name
                ? `(${pendingStatusChange.animal.name}) `
                : ""}
              küpeli hayvanı{" "}
              <span
                className={`font-bold ${
                  pendingStatusChange.newStatus === "SATILDI"
                    ? "text-blue-700"
                    : "text-red-700"
                }`}
              >
                {pendingStatusChange.newStatus === "SATILDI"
                  ? "SATILDI"
                  : "ÖLDÜ"}
              </span>{" "}
              olarak işaretlemek istediğinize emin misiniz?
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-5">
              <strong>Dikkat:</strong> Bu işlem kalıcıdır ve geri alınamaz.
              Hayvanın padok ve durak yeri yeni hayvanlar için boşaltılacak,
              ancak tarihsel kaydı listede korunacaktır.
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={isStatusUpdating}
                onClick={() => setPendingStatusChange(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isStatusUpdating}
                onClick={confirmStatusChange}
                className={`px-4 py-2 text-sm text-white rounded-lg font-medium shadow-sm ${
                  pendingStatusChange.newStatus === "SATILDI"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isStatusUpdating ? "Kaydediliyor..." : "Evet, Onayla"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Yeni Hayvan Ekle */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Yeni Hayvan Ekle
            </h2>
            <form onSubmit={handleCreateAnimal} className="space-y-4">
              {/* Kulak Küpe No */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kulak Küpe No (*)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: TR34001"
                  value={tagNumber}
                  onChange={(e) => setTagNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Cinsiyet (*) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cinsiyet (*)
                </label>
                <select
                  required
                  value={gender}
                  onChange={(e) =>
                    setGender(e.target.value as "ERKEK" | "DISI")
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="DISI">Dişi</option>
                  <option value="ERKEK">Erkek</option>
                </select>
              </div>

              {/* Hayvan Adı (Opsiyonel) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hayvan Adı (Opsiyonel)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Sarıkız"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Irkı / Türü (Opsiyonel) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Irkı / Cinsi (Opsiyonel)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Holstein, Simental vb."
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Doğum Tarihi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doğum Tarihi (*)
                </label>
                <input
                  type="date"
                  required
                  max={todayStr}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Bulunacağı Padok */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bulunacağı Padok (*)
                </label>
                <select
                  required
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="">Padok Seçin...</option>
                  {sections.map((sec) => {
                    const isFull =
                      (sec.currentAnimalCount ?? 0) >= sec.capacity;
                    return (
                      <option key={sec.id} value={sec.id} disabled={isFull}>
                        {sec.name} ({sec.currentAnimalCount ?? 0}/{sec.capacity}
                        ) {isFull ? "- DOLU" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Anne Hayvan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anne Hayvan (Opsiyonel)
                </label>
                <select
                  value={selectedMotherId}
                  onChange={(e) =>
                    setSelectedMotherId(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="">Anne Seçilmedi</option>
                  {animals
                    .filter((m) => m.gender === "DISI" || !m.gender)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.tagNumber} {m.name ? `(${m.name})` : ""}
                      </option>
                    ))}
                </select>
              </div>

              {/* Durak / Slot Numarası (Opsiyonel) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durak / Slot No (Opsiyonel)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Örn: 1, 2, 3..."
                  value={slotNumber}
                  onChange={(e) =>
                    setSlotNumber(e.target.value ? Number(e.target.value) : "")
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Butonlar */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Padok Transferi */}
      {isTransferModalOpen && selectedAnimal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-2 text-gray-800">
              Hayvan Transfer Et
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-semibold">{selectedAnimal.tagNumber}</span>{" "}
              küpe numaralı hayvanı yeni padoğuna transfer edin.
            </p>

            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hedef Padok (*)
                </label>
                <select
                  required
                  value={targetSectionId}
                  onChange={(e) => setTargetSectionId(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Hedef Padok Seçin...</option>
                  {sections.map((sec) => {
                    const isCurrent = sec.id === selectedAnimal.sectionId;
                    const isFull =
                      (sec.currentAnimalCount ?? 0) >= sec.capacity;
                    const isDisabled = isFull && !isCurrent;
                    return (
                      <option key={sec.id} value={sec.id} disabled={isDisabled}>
                        {sec.name} ({sec.currentAnimalCount ?? 0}/{sec.capacity}
                        ){" "}
                        {isCurrent
                          ? "- (Mevcut Padok)"
                          : isFull
                            ? "- (DOLU)"
                            : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hedef Durak / Slot No (Opsiyonel)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Örn: 1, 2, 3..."
                  value={targetSlotNumber}
                  onChange={(e) =>
                    setTargetSlotNumber(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Boş bırakılırsa sıradaki uygun alana yerleşir.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsTransferModalOpen(false);
                    setSelectedAnimal(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                >
                  Transferi Tamamla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Toplu Aşılama */}
      <BulkVaccinationModal
        isOpen={isBulkVaccineModalOpen}
        onClose={() => setIsBulkVaccineModalOpen(false)}
        sections={sections}
        selectedAnimals={selectedAnimalObjects}
        onSuccess={() => {
          setSelectedAnimalIds([]);
          fetchData();
        }}
      />
    </div>
  );
};
