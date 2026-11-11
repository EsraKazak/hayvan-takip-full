import React, { useEffect, useState } from "react";
import { sectionApi } from "../api/sectionApi";
import type { AnimalResponseDTO, SectionResponseDTO } from "../types";
import { Plus, Users, Eye, Trash2 } from "lucide-react"; // 🔥 Eye ikonu eklendi
import { toast } from "sonner";
import { animalApi } from "../api/animalApi";
import { SectionGridModal } from "../components/SectionGridModal"; // 🔥 Import eklendi
import { AnimalDetailModal } from "../components/AnimalDetailModal"; // 🔥 Import eklendi

export const SectionsPage: React.FC = () => {
  const [sections, setSections] = useState<SectionResponseDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form durumları
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState<number | "">("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [allAnimals, setAllAnimals] = useState<AnimalResponseDTO[]>([]);
  const [selectedGridSection, setSelectedGridSection] =
    useState<SectionResponseDTO | null>(null);
  const [selectedAnimalDetail, setSelectedAnimalDetail] =
    useState<AnimalResponseDTO | null>(null);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const data = await sectionApi.getAllSections();
      setSections(data);

      const animalPromises = data.map((sec) =>
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

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sectionApi.create({ name, capacity: Number(capacity) });
      toast.success(`'${name}' padoğu başarıyla oluşturuldu!`);
      setName("");
      setCapacity("");
      setIsModalOpen(false);
      fetchSections(); // Listeyi yenile
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Padok eklenirken bir hata oluştu.";
      toast.error(errorMessage);
    }
  };

  // Silme işlemi için fonksiyon
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
        fetchSections(); // Listeyi tazele
      } catch (err: any) {
        toast.error(
          err.response?.data?.message || "Padok silinirken bir hata oluştu.",
        );
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Padok Yönetimi</h1>
          <p className="text-gray-600 text-sm">
            Çiftlikteki padokları ve doluluk oranlarını takip edin.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm"
        >
          <Plus className="h-5 w-5" />
          Yeni Padok Ekle
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {sections.map((section) => {
            const currentCount = section.currentAnimalCount ?? 0;
            const fullnessRatio = Math.round(
              (currentCount / section.capacity) * 100,
            );

            return (
              <div
                key={section.id}
                className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {section.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteSection(section)}
                        title="Padoğu Sil"
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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

                    {/* Doluluk Çubuğu (Progress Bar) */}
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

                {/* 🟢 1. KONUM: PADOĞA GİR BUTONU HER KARTIN ALTINA EKLENDİ */}
                <button
                  onClick={() => setSelectedGridSection(section)}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  Padoğa Gir / Krokini Gör
                </button>
              </div>
            );
          })}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Padok Adı
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kapasite
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Örn: 20"
                  value={capacity}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Kullanıcı alanı tamamen silerse boş string yap, sayı girerse Number'a çevir (başındaki 0'ları siler)
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

      {/* 🟢 2. KONUM: GÖRSEL KROKİ VE DETAY MODALLARI EN ALTA EKLENDİ */}
      <SectionGridModal
        section={selectedGridSection}
        animals={allAnimals}
        onClose={() => setSelectedGridSection(null)}
        onSelectAnimal={(animal) => setSelectedAnimalDetail(animal)}
      />

      <AnimalDetailModal
        animal={selectedAnimalDetail}
        onClose={() => setSelectedAnimalDetail(null)}
      />
    </div>
  );
};
