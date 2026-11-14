import React, { useState, useEffect } from "react";
import { Syringe, X, Users, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { animalApi } from "../api/animalApi";
import type { AnimalResponseDTO, SectionResponseDTO } from "../types";

interface BulkVaccinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: SectionResponseDTO[];
  selectedAnimals?: AnimalResponseDTO[];
  preselectedSectionId?: number | null;
  onSuccess: () => void;
}

export const BulkVaccinationModal: React.FC<BulkVaccinationModalProps> = ({
  isOpen,
  onClose,
  sections,
  selectedAnimals = [],
  preselectedSectionId = null,
  onSuccess,
}) => {
  const [targetMode, setTargetMode] = useState<"SECTION" | "SELECTED">(
    selectedAnimals.length > 0 ? "SELECTED" : "SECTION",
  );
  const [sectionId, setSectionId] = useState<number | "">(
    preselectedSectionId || "",
  );
  const [vaccineName, setVaccineName] = useState("");
  const [appliedDate, setAppliedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [nextDueDate, setNextDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (preselectedSectionId) {
        setTargetMode("SECTION");
        setSectionId(preselectedSectionId);
      } else if (selectedAnimals.length > 0) {
        setTargetMode("SELECTED");
      } else {
        setTargetMode("SECTION");
        setSectionId("");
      }
    }
  }, [isOpen, preselectedSectionId, selectedAnimals]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (targetMode === "SECTION" && !sectionId) {
      toast.error("Lütfen aşılama yapılacak padoğu seçin.");
      return;
    }

    if (targetMode === "SELECTED" && selectedAnimals.length === 0) {
      toast.error("Seçili hayvan bulunamadı.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await animalApi.addBulkVaccination({
        sectionId: targetMode === "SECTION" ? Number(sectionId) : undefined,
        animalIds:
          targetMode === "SELECTED"
            ? selectedAnimals.map((a) => a.id)
            : undefined,
        vaccineName: vaccineName.trim(),
        appliedDate,
        nextDueDate: nextDueDate || null,
        notes: notes.trim() || null,
      });

      toast.success(res.message);
      setVaccineName("");
      setNextDueDate("");
      setNotes("");
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Toplu aşılama kaydedilirken bir hata oluştu.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <Syringe className="h-5 w-5" />
            <h2 className="text-xl font-bold text-gray-800">Toplu Aşılama</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Hedef Seçim Sekmeleri */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg mb-4">
          <button
            type="button"
            onClick={() => setTargetMode("SECTION")}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all ${
              targetMode === "SECTION"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Users className="h-4 w-4" />
            Padok Bazlı
          </button>
          <button
            type="button"
            disabled={selectedAnimals.length === 0}
            onClick={() => setTargetMode("SELECTED")}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all ${
              targetMode === "SELECTED"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-gray-600 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            Seçili Hayvanlar ({selectedAnimals.length})
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hedef Gösterimi */}
          {targetMode === "SECTION" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hedef Padok (*)
              </label>
              <select
                required
                value={sectionId}
                onChange={(e) => setSectionId(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-sm"
              >
                <option value="">Padok Seçin...</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name} ({sec.currentAnimalCount ?? 0} Hayvan)
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Seçilen padoktaki tüm <strong>AKTİF</strong> hayvanlara aşı
                işlenir.
              </p>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-emerald-800 mb-1">
                Aşı Uygulanacak Hayvanlar ({selectedAnimals.length} Adet):
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {selectedAnimals.map((a) => (
                  <span
                    key={a.id}
                    className="px-2 py-0.5 bg-white text-emerald-700 border border-emerald-200 rounded text-xs font-medium"
                  >
                    {a.tagNumber}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Aşı Adı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aşı Adı (*)
            </label>
            <input
              type="text"
              required
              placeholder="Örn: Şap Aşısı, Brucella, Karma Aşı..."
              value={vaccineName}
              onChange={(e) => setVaccineName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
            />
          </div>

          {/* Tarihler */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Uygulama Tarihi (*)
              </label>
              <input
                type="date"
                required
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sonraki Doz (Opsiyonel)
              </label>
              <input
                type="date"
                min={appliedDate}
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Notlar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notlar (Opsiyonel)
            </label>
            <textarea
              rows={2}
              placeholder="Veteriner hekim adı, doz bilgisi vb..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
            />
          </div>

          {/* Butonlar */}
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm disabled:opacity-50"
            >
              <Syringe className="h-4 w-4" />
              {submitting ? "Kaydediliyor..." : "Toplu Aşıyı Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
