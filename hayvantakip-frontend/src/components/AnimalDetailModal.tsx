import React, { useState } from "react";
import type {
  VaccinationDTO,
  InseminationDTO,
  AnimalResponseDTO,
} from "../types";
import { animalApi } from "../api/animalApi";
import { toast } from "sonner";
import { X, Syringe, Heart, Tag, User, Plus } from "lucide-react";

interface AnimalDetailModalProps {
  animal: AnimalResponseDTO | null;
  onClose: () => void;
  onRefresh?: () => void; // Veri eklendiğinde ana listeyi yenilemek için
}

export const AnimalDetailModal: React.FC<AnimalDetailModalProps> = ({
  animal,
  onClose,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<
    "info" | "vaccines" | "insemination"
  >("info");
  const [showVacForm, setShowVacForm] = useState(false);
  const [showInsForm, setShowInsForm] = useState(false);

  // Aşı Form State
  const [vaccineName, setVaccineName] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [vacNotes, setVacNotes] = useState("");

  // Tohumlanma Form State
  const [inseminationDate, setInseminationDate] = useState("");
  const [expectedBirthDate, setExpectedBirthDate] = useState("");
  const [insStatus, setInsStatus] = useState("BEKLEMEDE");
  const [bullInfo, setBullInfo] = useState("");

  if (!animal) return null;

  const vaccineList: VaccinationDTO[] =
    animal.vaccinations || animal.vaccinationRecords || [];
  const inseminationList: InseminationDTO[] =
    animal.inseminations || animal.inseminationRecords || [];

  // Aşı Kaydetme
  const handleAddVaccination = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newVac = await animalApi.addVaccination(animal.id, {
        vaccineName,
        appliedDate,
        nextDueDate: nextDueDate || null,
        notes: vacNotes || null,
      });

      toast.success(`${vaccineName} aşısı başarıyla kaydedildi!`);

      // Yerel state'i güncelle
      if (!animal.vaccinations) animal.vaccinations = [];
      animal.vaccinations.push(newVac as VaccinationDTO);

      // Formu sıfırla
      setVaccineName("");
      setAppliedDate("");
      setNextDueDate("");
      setVacNotes("");
      setShowVacForm(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Aşı eklenirken hata oluştu.");
    }
  };

  // Tohumlanma Kaydetme
  const handleAddInsemination = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newIns = await animalApi.addInsemination(animal.id, {
        inseminationDate,
        expectedBirthDate: expectedBirthDate || null,
        status: insStatus,
        bullInfo: bullInfo || null,
      });

      toast.success("Tohumlanma/Gebelik kaydı eklendi!");

      // Yerel state'i güncelle
      if (!animal.inseminations) animal.inseminations = [];
      animal.inseminations.push(newIns as InseminationDTO);

      // Formu sıfırla
      setInseminationDate("");
      setExpectedBirthDate("");
      setInsStatus("BEKLEMEDE");
      setBullInfo("");
      setShowInsForm(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          "Tohumlanma kaydı eklenirken hata oluştu.",
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="bg-emerald-700 text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2.5 rounded-lg">
              <Tag className="h-6 w-6 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {animal.tagNumber} {animal.name ? `(${animal.name})` : ""}
              </h2>
              <p className="text-xs text-emerald-200">
                {animal.sectionName || `Padok #${animal.sectionId}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-100 hover:text-white p-1 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b bg-gray-50 px-4 pt-2">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 ${
              activeTab === "info"
                ? "border-emerald-600 text-emerald-700 bg-white rounded-t-lg"
                : "border-transparent text-gray-500"
            }`}
          >
            <User className="h-4 w-4" /> Kimlik & Genel
          </button>
          <button
            onClick={() => setActiveTab("vaccines")}
            className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 ${
              activeTab === "vaccines"
                ? "border-emerald-600 text-emerald-700 bg-white rounded-t-lg"
                : "border-transparent text-gray-500"
            }`}
          >
            <Syringe className="h-4 w-4" />
            <button onClick={() => setActiveTab("vaccines")}>
              Aşı Geçmişi ({vaccineList.length})
            </button>
          </button>
          <button
            onClick={() => setActiveTab("insemination")}
            className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 ${
              activeTab === "insemination"
                ? "border-emerald-600 text-emerald-700 bg-white rounded-t-lg"
                : "border-transparent text-gray-500"
            }`}
          >
            <Heart className="h-4 w-4" /> Tohumlanma / Gebelik (
            <button onClick={() => setActiveTab("insemination")}>
              ({inseminationList.length})
            </button>
            )
          </button>
        </div>

        {/* Modal İçeriği */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* TAB 1: GENEL BİLGİLER */}
          {activeTab === "info" && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 block">Cinsiyet</span>
                <span className="font-semibold text-gray-800">
                  {animal.gender === "DISI" ? "Dişi" : "Erkek"}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 block">Irk / Cins</span>
                <span className="font-semibold text-gray-800">
                  {animal.breed || "-"}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 block">
                  Doğum Tarihi
                </span>
                <span className="font-semibold text-gray-800">
                  {animal.birthDate}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 block">
                  Anne Küpe No
                </span>
                <span className="font-semibold text-gray-800">
                  {animal.motherTagNumber || "Bilinmiyor"}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 block">Durum</span>
                <span
                  className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full mt-1 ${
                    animal.animalStatus === "AKTIF"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {animal.animalStatus}
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: AŞI GEÇMİŞİ & FORMU */}
          {activeTab === "vaccines" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-700 text-sm">
                  Aşı Kayıtları
                </h3>
                <button
                  onClick={() => setShowVacForm(!showVacForm)}
                  className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {showVacForm ? "Formu Kapat" : "Yeni Aşı Ekle"}
                </button>
              </div>

              {/* Aşı Ekleme Formu */}
              {showVacForm && (
                <form
                  onSubmit={handleAddVaccination}
                  className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-3"
                >
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Aşı Adı (*)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Şap Aşısı"
                      value={vaccineName}
                      onChange={(e) => setVaccineName(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-md text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Uygulama Tarihi (*)
                      </label>
                      <input
                        type="date"
                        required
                        value={appliedDate}
                        onChange={(e) => setAppliedDate(e.target.value)}
                        className="w-full px-3 py-1.5 border rounded-md text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Gelecek Aşı Tarihi
                      </label>
                      <input
                        type="date"
                        value={nextDueDate}
                        onChange={(e) => setNextDueDate(e.target.value)}
                        className="w-full px-3 py-1.5 border rounded-md text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Notlar
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: 1. Doz tamamlandı"
                      value={vacNotes}
                      onChange={(e) => setVacNotes(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-md text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition-colors"
                  >
                    Aşıyı Kaydet
                  </button>
                </form>
              )}

              {/* Aşı Listesi */}
              {!vaccineList || vaccineList.length === 0 ? (
                <p className="text-center text-gray-400 py-6 text-sm">
                  Kayıtlı aşı bilgisi bulunmamaktadır.
                </p>
              ) : (
                vaccineList.map((vac) => (
                  <div
                    key={vac.id || Math.random()}
                    className="p-3 bg-white border border-gray-100 shadow-sm rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">
                        {vac.vaccineName}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Uygulama: {vac.appliedDate}
                      </p>
                      {vac.notes && (
                        <p className="text-xs text-emerald-700 mt-0.5">
                          {vac.notes}
                        </p>
                      )}
                    </div>
                    {vac.nextDueDate && (
                      <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                        Gelecek Aşı: {vac.nextDueDate}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: TOHUMLANMA GEÇMİŞİ & FORMU */}
          {activeTab === "insemination" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-700 text-sm">
                  Tohumlanma & Gebelik Kayıtları
                </h3>
                <button
                  onClick={() => setShowInsForm(!showInsForm)}
                  className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {showInsForm ? "Formu Kapat" : "Yeni Kayıt Ekle"}
                </button>
              </div>

              {/* Tohumlanma Ekleme Formu */}
              {showInsForm && (
                <form
                  onSubmit={handleAddInsemination}
                  className="p-4 bg-blue-50/60 border border-blue-200 rounded-lg space-y-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Tohumlanma Tarihi (*)
                      </label>
                      <input
                        type="date"
                        required
                        value={inseminationDate}
                        onChange={(e) => setInseminationDate(e.target.value)}
                        className="w-full px-3 py-1.5 border rounded-md text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Tahmini Doğum Tarihi
                      </label>
                      <input
                        type="date"
                        value={expectedBirthDate}
                        onChange={(e) => setExpectedBirthDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Durum (*)
                      </label>
                      <select
                        value={insStatus}
                        onChange={(e) => setInsStatus(e.target.value)}
                        className="w-full px-3 py-1.5 border rounded-md text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      >
                        <option value="BEKLEMEDE">BEKLEMEDE</option>
                        <option value="TUTTU">TUTTU (GEBE)</option>
                        <option value="TUTMADI">TUTMADI</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Boğa / Sperm Kodu
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: Holstein-007"
                        value={bullInfo}
                        onChange={(e) => setBullInfo(e.target.value)}
                        className="w-full px-3 py-1.5 border rounded-md text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors"
                  >
                    Kaydı Temizle & Sakla
                  </button>
                </form>
              )}

              {/* Tohumlanma Listesi */}
              {inseminationList.length === 0 ? (
                <p className="text-center text-gray-400 py-6 text-sm">
                  Kayıtlı tohumlanma/gebelik bilgisi bulunmamaktadır.
                </p>
              ) : (
                inseminationList.map((ins) => (
                  <div
                    key={ins.id || Math.random()}
                    className="p-3 bg-white border border-gray-100 shadow-sm rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">
                        Tohumlanma: {ins.inseminationDate}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Boğa/Sperm: {ins.bullInfo || "-"}
                      </p>
                      {ins.expectedBirthDate && (
                        <p className="text-xs text-blue-700 font-semibold mt-0.5">
                          Tahmini Doğum: {ins.expectedBirthDate}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        ins.status === "TUTTU"
                          ? "bg-emerald-100 text-emerald-800"
                          : ins.status === "TUTMADI"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {ins.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
