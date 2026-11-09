import React from "react";
import type { SectionResponseDTO, AnimalResponseDTO } from "../types";
import { X, Layers, Plus, Tag } from "lucide-react";

interface SectionGridModalProps {
  section: SectionResponseDTO | null;
  animals: AnimalResponseDTO[];
  onClose: () => void;
  onSelectAnimal: (animal: AnimalResponseDTO) => void;
}

export const SectionGridModal: React.FC<SectionGridModalProps> = ({
  section,
  animals,
  onClose,
  onSelectAnimal,
}) => {
  if (!section) return null;

  // 1. Seçili padoğa ait tüm hayvanları al
  const sectionAnimals = animals.filter((a) => a.sectionId === section.id);

  // 2. Durak numarası olmayan hayvanları ayır (boş yerlere dağıtmak için)
  const unassignedAnimals = sectionAnimals.filter(
    (a) => a.slotNumber === null || a.slotNumber === undefined,
  );
  let unassignedIndex = 0;

  // 🔥 KAPASİTEYİ 2 EŞİT SATIRA BÖLÜYORUZ
  const halfCapacity = Math.ceil(section.capacity / 2);
  const topRowSlots = Array.from({ length: halfCapacity }, (_, i) => i + 1); // Örn: 1-12
  const bottomRowSlots = Array.from(
    { length: section.capacity - halfCapacity },
    (_, i) => halfCapacity + i + 1,
  ); // Örn: 13-24

  // Tek bir durak kartını çizen yardımcı fonksiyon
  const renderSlotCard = (slotNum: number) => {
    // A) Bu durağa atanmış hayvanı bul
    let animalInSlot = sectionAnimals.find((a) => a.slotNumber === slotNum);

    // B) Atanmış yoksa numarasız hayvanları sırayla yerleştir
    if (!animalInSlot && unassignedIndex < unassignedAnimals.length) {
      animalInSlot = unassignedAnimals[unassignedIndex];
      unassignedIndex++;
    }

    return (
      <div
        key={slotNum}
        onClick={() => animalInSlot && onSelectAnimal(animalInSlot)}
        className={`p-3 rounded-xl border-2 transition-all flex flex-col justify-between min-w-[140px] min-h-[120px] relative ${
          animalInSlot
            ? "bg-white border-emerald-500/40 shadow-sm hover:shadow-md cursor-pointer hover:border-emerald-600"
            : "bg-white/50 border-dashed border-gray-300"
        }`}
      >
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200">
            Durak #{slotNum}
          </span>
          {animalInSlot && (
            <span className="text-[9px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
              {animalInSlot.gender === "DISI" ? "Dişi" : "Erkek"}
            </span>
          )}
        </div>

        {animalInSlot ? (
          <div>
            <div className="flex items-center gap-1 font-bold text-gray-800 text-xs">
              <Tag className="h-3 w-3 text-emerald-600" />
              {animalInSlot.tagNumber}
            </div>
            <p className="text-[11px] text-gray-500 truncate">
              {animalInSlot.name || "İsimsiz"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-2 text-gray-400">
            <Plus className="h-4 w-4 text-gray-300" />
            <span className="text-[10px] font-medium">Boş Durak</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-40">
      <div className="bg-white rounded-xl max-w-6xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gray-800 text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Layers className="h-6 w-6 text-emerald-400" />
            <div>
              <h2 className="text-xl font-bold">
                {section.name} - Çift Sıralı Durak Krokisi
              </h2>
              <p className="text-xs text-gray-300">
                Kapasite: {section.capacity} Durak ({halfCapacity} Üst +{" "}
                {section.capacity - halfCapacity} Alt Sıra)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 🟢 İKİ SATIRLI ÇİFT SIRA YERLEŞİM ALANI */}
        <div className="p-6 overflow-x-auto bg-gray-50 flex-1 space-y-6">
          {/* ÜST SIRA (1 - N/2) */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Üst Sıra Duraklar (Durak 1 - {halfCapacity})
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {topRowSlots.map((slotNum) => renderSlotCard(slotNum))}
            </div>
          </div>

          {/* ORTA YEMLİK KORİDORU GÖRSELİ */}
          <div className="border-y-2 border-dashed border-gray-300 py-2 text-center bg-gray-100 rounded-lg">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              🚜 Yemlik / Geçiş Koridoru 🚜
            </span>
          </div>

          {/* ALT SIRA (N/2+1 - N) */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Alt Sıra Duraklar (Durak {halfCapacity + 1} - {section.capacity})
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {bottomRowSlots.map((slotNum) => renderSlotCard(slotNum))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
