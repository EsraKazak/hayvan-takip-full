import React, { useEffect, useState } from "react";
import { notificationApi } from "../api/notificationApi";
import type { RecipientDTO } from "../types";
import { Mail, Plus, Trash2, Send, X, Users } from "lucide-react";
import { toast } from "sonner";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [recipients, setRecipients] = useState<RecipientDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Yeni alıcı form state'leri
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Çiftlik Sahibi");
  const [receiveVaccinationAlerts, setReceiveVaccinationAlerts] =
    useState(true);
  const [receiveBirthAlerts, setReceiveBirthAlerts] = useState(true);

  const fetchRecipients = async () => {
    try {
      setLoading(true);
      const data = await notificationApi.getRecipients();
      setRecipients(data);
    } catch {
      toast.error("Alıcı listesi yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecipients();
    }
  }, [isOpen]);

  const handleAddRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    try {
      await notificationApi.addRecipient({
        fullName: fullName.trim(),
        email: email.trim(),
        role,
        receiveVaccinationAlerts,
        receiveBirthAlerts,
      });
      toast.success("Bildirim alıcısı eklendi!");
      setFullName("");
      setEmail("");
      setRole("Çiftlik Sahibi");
      setReceiveVaccinationAlerts(true);
      setReceiveBirthAlerts(true);
      fetchRecipients();
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Alıcı eklenirken hata oluştu.";
      toast.error(msg);
    }
  };

  const handleDeleteRecipient = async (id?: number) => {
    if (!id) return;
    try {
      await notificationApi.deleteRecipient(id);
      toast.success("Alıcı listeden çıkarıldı.");
      fetchRecipients();
    } catch {
      toast.error("Alıcı silinemedi.");
    }
  };

  const handleSendEmailsNow = async () => {
    try {
      setSending(true);
      const res = await notificationApi.sendEmails();
      if (res.sentCount > 0) {
        toast.success(res.message);
      } else {
        toast.info(res.message);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "E-posta gönderilirken hata oluştu.";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-gray-800">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Başlık */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-800">
              E-Posta Bildirim Ayarları & Alıcılar
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Yeni Alıcı Ekleme Formu */}
        <form
          onSubmit={handleAddRecipient}
          className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 space-y-3"
        >
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Plus className="h-4 w-4 text-emerald-600" />
            Yeni Alıcı Ekle
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="Ad Soyad (Örn: Dr. Ahmet)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <input
              type="email"
              required
              placeholder="E-posta adresi"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="Çiftlik Sahibi">Çiftlik Sahibi</option>
              <option value="Veteriner Hekim">Veteriner Hekim</option>
              <option value="Bakıcı / Personel">Bakıcı / Personel</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-4 text-xs font-medium text-gray-700">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={receiveVaccinationAlerts}
                  onChange={(e) =>
                    setReceiveVaccinationAlerts(e.target.checked)
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                Aşı Hatırlatmaları
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={receiveBirthAlerts}
                  onChange={(e) => setReceiveBirthAlerts(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                Doğum Hatırlatmaları
              </label>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Listeye Ekle
            </button>
          </div>
        </form>

        {/* Kayıtlı Alıcılar Listesi */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-gray-500" />
            Kayıtlı Alıcılar ({recipients.length})
          </h3>

          {loading ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              Yükleniyor...
            </p>
          ) : recipients.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center border rounded-lg bg-gray-50/50">
              Henüz bildirim alıcısı eklenmemiş. Yukarıdan ekleyebilirsiniz.
            </p>
          ) : (
            <div className="divide-y border rounded-lg overflow-hidden">
              {recipients.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 flex items-center justify-between bg-white hover:bg-gray-50 text-sm"
                >
                  <div>
                    <div className="font-semibold text-gray-800">
                      {rec.fullName}{" "}
                      <span className="text-xs font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full ml-1">
                        {rec.role}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">{rec.email}</div>
                    <div className="flex gap-2 mt-1 text-[11px] text-gray-500">
                      {rec.receiveVaccinationAlerts && (
                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                          Aşı Bildirimi
                        </span>
                      )}
                      {rec.receiveBirthAlerts && (
                        <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                          Doğum Bildirimi
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteRecipient(rec.id)}
                    title="Alıcıyı Sil"
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alt Aksiyon: Şimdi Mail Gönder */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t">
          <p className="text-xs text-gray-500">
            Yaklaşan/geciken uyarıları tüm aktif alıcılara anında e-posta olarak
            iletir.
          </p>
          <button
            type="button"
            disabled={sending || recipients.length === 0}
            onClick={handleSendEmailsNow}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
            {sending ? "Gönderiliyor..." : "Şimdi E-Posta Gönder"}
          </button>
        </div>
      </div>
    </div>
  );
};
