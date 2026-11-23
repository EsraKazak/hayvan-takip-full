import React, { useEffect, useState } from "react";
import { sectionApi } from "../api/sectionApi";
import { barnApi } from "../api/barnApi";
import type {
  AnimalResponseDTO,
  BarnDTO,
  PadokType,
  SectionResponseDTO,
} from "../types";
import { Plus, Users, Eye, Trash2, Syringe, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { animalApi } from "../api/animalApi";
import { SectionGridModal } from "../components/SectionGridModal";
import { AnimalDetailModal } from "../components/AnimalDetailModal";
import { BulkVaccinationModal } from "../components/BulkVaccinationModal";

export const SectionsPage: React.FC = () => {
  const [sections, setSections] = useState<SectionResponseDTO[]>([]);
  const [barns, setBarns] = useState<BarnDTO[]>([]);
  const [selectedBarnTab, setSelectedBarnTab] = useState<number | "ALL">("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Padok Ekleme Form Durumları
  const [name, setName] = useState("");
  const [padokType, setPadokType] = useState<PadokType>("IKILI");
  const [capacity, setCapacity] = useState<number | "">("");
  const [selectedBarnIdForCreate, setSelectedBarnIdForCreate] = useState<
    number | ""
  >("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ahır Ekleme Modal Durumları
  const [isBarnModalOpen, setIsBarnModalOpen] = useState(false);
  const [barnName, setBarnName] = useState("");
  const [barnDescription, setBarnDescription] = useState("");

  const [allAnimals, setAllAnimals] = useState<AnimalResponseDTO[]>([]);
  const [selectedGridSection, setSelectedGridSection] =
    useState<SectionResponseDTO | null>(null);
  const [selectedAnimalDetail, setSelectedAnimalDetail] =
    useState<AnimalResponseDTO | null>(null);

  // Toplu aşılama için
  const [bulkVaccineSectionId, setBulkVaccineSectionId] = useState<
    number | null
  >(null);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const [sectionsData, barnsData] = await Promise.all([
        sectionApi.getAllSections(),
        barnApi.getAllBarns().catch(() => [] as BarnDTO[]),
      ]);
      setSections(sectionsData);
      setBarns(barnsData);

      const animalPromises = sectionsData.map((sec) =>
        animalApi.getBySectionId(sec.id),
      );
      const animalResults = await Promise.all(animalPromises);
      setAllAnimals(animalResults.flat());

      setError(null);
    } catch (err) {
      setError(
        "Padoklar yüklenirken bir hata oluştu. Backend servisinin açık olduğundan emin olun.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleCreateBarn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await barnApi.create({
        name: barnName,
        description: barnDescription || undefined,
      });
      toast.success(`'${created.name}' ahırı oluşturuldu!`);
      setBarnName("");
      setBarnDescription("");
      setIsBarnModalOpen(false);
      setSelectedBarnTab(created.id);
      fetchSections();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Ahır eklenirken bir hata oluştu.",
      );
    }
  };

  const handleDeleteBarn = async (barn: BarnDTO) => {
    if (
      confirm(
        `'${barn.name}' ahırını silmek istediğinize emin misiniz? (İçinde padok varsa silinemez)`,
      )
    ) {
      try {
        await barnApi.deleteBarn(barn.id);
        toast.success(`'${barn.name}' ahırı silindi.`);
        if (selectedBarnTab === barn.id) setSelectedBarnTab("ALL");
        fetchSections();
      } catch (err: any) {
        toast.error(
          err.response?.data?.message || "Ahır silinirken bir hata oluştu.",
        );
      }
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedCapacity = Number(capacity);

    if (!resolvedCapacity || resolvedCapacity < 1) {
      toast.error("Lütfen geçerli bir kapasite girin.");
      return;
    }

    try {
      await sectionApi.create({
        name,
        capacity: resolvedCapacity,
        padokType,
        barnId: selectedBarnIdForCreate
          ? Number(selectedBarnIdForCreate)
          : null,
      });
      toast.success(`'${name}' padoğu başarıyla oluşturuldu!`);
      setName("");
      setCapacity("");
      setPadokType("IKILI");
      setIsModalOpen(false);
      fetchSections();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Padok eklenirken bir hata oluştu.";
      toast.error(errorMessage);
    }
  };

  const handleDeleteSection = async (section: SectionResponseDTO) => {
    if (section.currentAnimalCount && section.currentAnimalCount > 0) {
      toast.error(
        `'${section.name}' padoğu silinemez! İçinde ${section.currentAnimalCount} adet hayvan var.`,
      );
      return;
    }

    if (
      confirm(`'${section.name}' padoğunu silmek istediğinize emin misiniz?`)
    ) {
      try {
        await sectionApi.deleteSection(section.id);
        toast.success(`'${section.name}' padoğu başarıyla silindi.`);
        fetchSections();
      } catch (err: any) {
        toast.error(
          err.response?.data?.message || "Padok silinirken bir hata oluştu.",
        );
      }
    }
  };

  const displayedSections =
    selectedBarnTab === "ALL"
      ? sections
      : sections.filter((s) => s.barnId === selectedBarnTab);

  const getPadokBadge = (sec: SectionResponseDTO) => {
    if (sec.padokType === "TEKLI") {
      return {
        label: "Tek Sıralı",
        cls: "bg-purple-50 text-purple-700 border-purple-200",
      };
    }
    return {
      label: "Çift Sıralı",
      cls: "bg-blue-50 text-blue-700 border-blue-200",
    };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Üst Başlık ve Butonlar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Ahır & Padok Yönetimi
          </h1>
          <p className="text-gray-600 text-sm">
            Ahırlarınızı ve tek sıralı veya çift sıralı padok doluluklarını
            takip edin.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsBarnModalOpen(true)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm text-sm"
          >
            <Warehouse className="h-4 w-4" />
            Yeni Ahır Ekle
          </button>
          <button
            onClick={() => {
              setSelectedBarnIdForCreate(
                selectedBarnTab !== "ALL" ? selectedBarnTab : "",
              );
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm text-sm"
          >
            <Plus className="h-4 w-4" />
            Yeni Padok Ekle
          </button>
        </div>
      </div>

      {/* Ahır Filtre Sekmeleri */}
      <div className="flex flex-wrap items-center gap-2 mb-6 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
        <button
          onClick={() => setSelectedBarnTab("ALL")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            selectedBarnTab === "ALL"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Tüm Ahırlar ({sections.length})
        </button>

        {barns.map((barn) => {
          const count = sections.filter((s) => s.barnId === barn.id).length;
          const isSelected = selectedBarnTab === barn.id;
          return (
            <div key={barn.id} className="inline-flex items-center">
              <button
                onClick={() => setSelectedBarnTab(barn.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Warehouse className="h-3.5 w-3.5" />
                {barn.name} ({count})
              </button>
              {count === 0 && (
                <button
                  onClick={() => handleDeleteBarn(barn)}
                  title="Boş Ahırı Sil"
                  className="ml-0.5 p-1 text-gray-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : displayedSections.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border border-gray-100 text-gray-400 text-sm">
          Bu ahırda henüz kayıtlı padok bulunmuyor. "Yeni Padok Ekle" butonunu
          kullanarak ekleyebilirsiniz.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayedSections.map((section) => {
            const currentCount = section.currentAnimalCount ?? 0;
            const fullnessRatio = Math.round(
              (currentCount / section.capacity) * 100,
            );
            const badge = getPadokBadge(section);

            return (
              <div
                key={section.id}
                className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Üst Etiketler: Ahır & Padok Düzeni */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      <Warehouse className="h-3 w-3 text-gray-400" />
                      {section.barnName || "Genel Ahır"}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {section.name}
                    </h3>
                    <button
                      onClick={() => handleDeleteSection(section)}
                      title="Padoğu Sil"
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600 justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        Doluluk:
                      </span>
                      <span className="font-semibold text-gray-800">
                        {currentCount} / {section.capacity} Hayvan
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          fullnessRatio >= 90
                            ? "bg-red-500"
                            : fullnessRatio >= 70
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(fullnessRatio, 100)}%` }}
                      />
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      %{fullnessRatio} Dolu
                    </div>
                  </div>
                </div>

                {/* Kart Altı Butonları */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setSelectedGridSection(section)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Kroki / Gir
                  </button>
                  <button
                    onClick={() => setBulkVaccineSectionId(section.id)}
                    disabled={currentCount === 0}
                    title="Bu padoktaki tüm hayvanlara aşı uygula"
                    className="flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
                  >
                    <Syringe className="h-4 w-4" />
                    Toplu Aşı
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Yeni Ahır Ekle */}
      {isBarnModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Yeni Ahır Ekle
            </h2>
            <form onSubmit={handleCreateBarn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ahır Adı (*)
                </label>
                <input
                  type="text"
                  required
                  value={barnName}
                  onChange={(e) => setBarnName(e.target.value)}
                  placeholder="Örn: 1 Nolu Sağmal Ahırı, Buzağı Ahırı"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={barnDescription}
                  onChange={(e) => setBarnDescription(e.target.value)}
                  placeholder="Örn: Kuzey cephe bölmeler"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsBarnModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium"
                >
                  Ahırı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Yeni Padok Ekle */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Yeni Padok Ekle
            </h2>
            <form onSubmit={handleCreateSection} className="space-y-4">
              {/* Ahır Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bulunduğu Ahır
                </label>
                <select
                  value={selectedBarnIdForCreate}
                  onChange={(e) =>
                    setSelectedBarnIdForCreate(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="">Genel Ahır (Seçilmedi)</option>
                  {barns.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Padok Yerleşim Düzeni Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Padok Yerleşim Düzeni (*)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPadokType("TEKLI")}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      padokType === "TEKLI"
                        ? "bg-purple-50 border-purple-500 text-purple-700"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Tek Sıralı (Tek Satır)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPadokType("IKILI")}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      padokType === "IKILI"
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Çift Sıralı (Karşılıklı)
                  </button>
                </div>
              </div>

              {/* Padok Adı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Padok Adı (*)
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: A-1 Bölmesi"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Kapasite */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kapasite (*)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Örn: 20"
                  value={capacity}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCapacity(val === "" ? "" : Number(val));
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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

      {/* Görsel Kroki ve Detay Modalları */}
      <SectionGridModal
        section={selectedGridSection}
        animals={allAnimals}
        onClose={() => setSelectedGridSection(null)}
        onSelectAnimal={(animal) => {
          setSelectedGridSection(null);
          setSelectedAnimalDetail(animal);
        }}
      />

      <AnimalDetailModal
        animal={selectedAnimalDetail}
        onClose={() => setSelectedAnimalDetail(null)}
        onRefresh={fetchSections}
      />

      <BulkVaccinationModal
        isOpen={bulkVaccineSectionId !== null}
        onClose={() => setBulkVaccineSectionId(null)}
        sections={sections}
        preselectedSectionId={bulkVaccineSectionId}
        onSuccess={() => {
          fetchSections();
          window.dispatchEvent(new Event("alerts:refresh"));
        }}
      />
    </div>
  );
};
