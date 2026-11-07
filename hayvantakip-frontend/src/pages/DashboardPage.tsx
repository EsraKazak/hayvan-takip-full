import React, { useEffect, useState } from "react";
import { sectionApi } from "../api/sectionApi";
import { animalApi } from "../api/animalApi";
import type { SectionResponseDTO, AnimalResponseDTO } from "../types";
import {
  Layers,
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Tag,
} from "lucide-react";

interface DashboardPageProps {
  onNavigateToSections: () => void;
  onNavigateToAnimals: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToSections,
  onNavigateToAnimals,
}) => {
  const [sections, setSections] = useState<SectionResponseDTO[]>([]);
  const [animals, setAnimals] = useState<AnimalResponseDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const sectionsData = await sectionApi.getAllSections();
        setSections(sectionsData);

        // Tüm padoklardaki hayvanları çek
        const animalPromises = sectionsData.map((sec) =>
          animalApi.getBySectionId(sec.id),
        );
        const animalResults = await Promise.all(animalPromises);
        const allAnimals = animalResults.flat();
        setAnimals(allAnimals);

        setError(null);
      } catch (err) {
        setError("Dashboard verileri yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Metrik Hesaplamaları
  const totalSections = sections.length;
  const totalCapacity = sections.reduce((acc, sec) => acc + sec.capacity, 0);
  const totalAnimals = animals.length;

  const activeAnimals = animals.filter(
    (a) => a.animalStatus === "AKTIF",
  ).length;
  const soldAnimals = animals.filter(
    (a) => a.animalStatus === "SATILDI",
  ).length;
  const deadAnimals = animals.filter((a) => a.animalStatus === "OLDU").length;

  // %80 ve üzeri doluluğa sahip padoklar (Kritik Padoklar)
  const criticalSections = sections.filter((sec) => {
    const current = sec.currentAnimalCount ?? 0;
    return current / sec.capacity >= 0.8;
  });

  const overallFullnessRatio =
    totalCapacity > 0 ? Math.round((activeAnimals / totalCapacity) * 100) : 0;

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        Dashboard Yükleniyor...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Çiftlik Genel Durum Özeti
        </h1>
        <p className="text-gray-600 text-sm">
          Padok kapasitelerini ve hayvan durumlarını anlık takip edin.
        </p>
      </div>

      {/* İstatistik Kartları Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Kart 1: Toplam Hayvan Sayısı */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Aktif Hayvan Sayısı
            </p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">
              {activeAnimals}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Toplam Kayıtlı: {totalAnimals}
            </p>
          </div>
          <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
            <Activity className="h-6 w-6" />
          </div>
        </div>

        {/* Kart 2: Toplam Padok & Kapasite */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Toplam Padok
            </p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">
              {totalSections}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Genel Kapasite: {totalCapacity} Hayvan
            </p>
          </div>
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        {/* Kart 3: Çiftlik Doluluk Oranı */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Çiftlik Doluluk Oranı
            </p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">
              %{overallFullnessRatio}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {activeAnimals} / {totalCapacity} Dolu
            </p>
          </div>
          <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Kart 4: Kritik Kapasitedeki Padoklar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Kritik Padoklar (%80+)
            </p>
            <h3
              className={`text-3xl font-bold mt-1 ${criticalSections.length > 0 ? "text-amber-600" : "text-gray-800"}`}
            >
              {criticalSections.length}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Kapasitesi dolmak üzere olan
            </p>
          </div>
          <div
            className={`h-12 w-12 rounded-lg flex items-center justify-center ${
              criticalSections.length > 0
                ? "bg-amber-100 text-amber-600"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Alt Bölüm: Durum Dağılımı ve Kritik Padoklar Listesi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon (2 Birim): Kritik Padoklar Uyarısı */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Kritik Doluluktaki Padoklar
            </h3>
            <button
              onClick={onNavigateToSections}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Tüm Padokları Gör →
            </button>
          </div>

          {criticalSections.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-emerald-600 gap-2 bg-emerald-50/50 rounded-lg">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">
                Harika! Şu an yüksek dolulukta hiçbir padok yok.
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {criticalSections.map((sec) => {
                const count = sec.currentAnimalCount ?? 0;
                const ratio = Math.round((count / sec.capacity) * 100);
                return (
                  <div
                    key={sec.id}
                    className="p-3 bg-amber-50/60 rounded-lg border border-amber-100 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm">
                        {sec.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Mevcut: {count} / Kapasite: {sec.capacity}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                        %{ratio} Dolu
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sağ Kolon (1 Birim): Hayvan Durum Dağılımı */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Tag className="h-5 w-5 text-emerald-600" />
              Durum Dağılımı
            </h3>
            <button
              onClick={onNavigateToAnimals}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Hayvanları Yönet →
            </button>
          </div>

          <div className="space-y-4">
            {/* Aktif */}
            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <span className="text-sm font-medium text-emerald-900">
                AKTİF
              </span>
              <span className="text-lg font-bold text-emerald-700">
                {activeAnimals}
              </span>
            </div>

            {/* Satıldı */}
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-sm font-medium text-blue-900">SATILDI</span>
              <span className="text-lg font-bold text-blue-700">
                {soldAnimals}
              </span>
            </div>

            {/* Öldü */}
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
              <span className="text-sm font-medium text-red-900">ÖLDÜ</span>
              <span className="text-lg font-bold text-red-700">
                {deadAnimals}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
