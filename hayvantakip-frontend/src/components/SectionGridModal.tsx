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

  // Seçili padoğa ait hayvanları filtrele
  const sectionAnimals = animals.filter((a) => a.sectionId === section.id);
  const emptySlotsCount = Math.max(0, section.capacity - sectionAnimals.length);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-40">
      <div className="bg-white rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gray-800 text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Layers className="h-6 w-6 text-emerald-400" />
            <div>
              <h2 className="text-xl font-bold">{section.name} - Krokisi</h2>
              <p className="text-xs text-gray-300">
                Doluluk: {sectionAnimals.length} / {section.capacity} Hayvan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Görsel Grid Alanı */}
        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {/* Dolu Slotlar (Hayvan Kartları) */}
            {sectionAnimals.map((animal) => (
              <div
                key={animal.id}
                onClick={() => onSelectAnimal(animal)}
                className="bg-white border-2 border-emerald-500/30 hover:border-emerald-600 rounded-xl p-4 shadow-sm hover:shadow-md cursor-pointer transition-all transform hover:-translate-y-1 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {animal.gender === "DISI" ? "Dişi" : "Erkek"}
                  </span>
                  <Tag className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-base">
                    {animal.tagNumber}
                  </h4>
                  <p className="text-xs text-gray-500 font-medium">
                    {animal.name || "İsimsiz"}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400">
                  <span>{animal.breed || "Irk Belirtilmemiş"}</span>
                  <span className="text-emerald-600 font-semibold">
                    Detaylar →
                  </span>
                </div>
              </div>
            ))}

            {/* Boş Slotlar */}
            {Array.from({ length: emptySlotsCount }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-gray-400 min-h-[120px] bg-white/40"
              >
                <Plus className="h-6 w-6 text-gray-300 mb-1" />
                <span className="text-xs font-medium">Boş Alan</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
