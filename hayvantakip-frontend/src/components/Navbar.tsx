import React, { useEffect, useRef, useState } from "react";
import {
  Home,
  Layers,
  Calendar,
  LayoutDashboard,
  Bell,
  Mail,
  Syringe,
  Baby,
  LogOut,
  AlertCircle,
} from "lucide-react";
import { notificationApi } from "../api/notificationApi";
import type { NotificationItemDTO } from "../types";
import { NotificationModal } from "./NotificationModal";

interface NavbarProps {
  activeTab: "dashboard" | "sections" | "animals";
  setActiveTab: (tab: "dashboard" | "sections" | "animals") => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onLogout,
}) => {
  const [alerts, setAlerts] = useState<NotificationItemDTO[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchAlerts = async () => {
    try {
      const data = await notificationApi.getAlerts();
      setAlerts(data);
    } catch {
      // Sessizce geç (arka plan kontrolü)
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [activeTab]);

  // Açılır menü dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const overdueCount = alerts.filter((a) => a.severity === "OVERDUE").length;

  return (
    <>
      <nav className="bg-emerald-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Sol Logo */}
            <div className="flex items-center space-x-3">
              <Home className="h-8 w-8 text-emerald-200" />
              <span className="font-bold text-xl tracking-tight">
                Çiftlik Takip Sistemi
              </span>
            </div>

            {/* Orta Sekmeler + Sağ Bildirim İkonları */}
            <div className="flex items-center space-x-1 sm:space-x-3">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "dashboard"
                    ? "bg-emerald-900 text-white"
                    : "text-emerald-100 hover:bg-emerald-600"
                }`}
              >
                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab("sections")}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "sections"
                    ? "bg-emerald-900 text-white"
                    : "text-emerald-100 hover:bg-emerald-600"
                }`}
              >
                <Layers className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Padoklar</span>
              </button>

              <button
                onClick={() => setActiveTab("animals")}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "animals"
                    ? "bg-emerald-900 text-white"
                    : "text-emerald-100 hover:bg-emerald-600"
                }`}
              >
                <Calendar className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Hayvanlar</span>
              </button>

              {/* Ayraç */}
              <div className="h-6 w-px bg-emerald-500/50 mx-1" />

              {/* Bildirim Zili Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  title="Yaklaşan ve Geciken Uyarılar"
                  className="relative p-2 rounded-lg text-emerald-100 hover:bg-emerald-600 transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {alerts.length > 0 && (
                    <span
                      className={`absolute -top-0.5 -right-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full text-white ${
                        overdueCount > 0 ? "bg-red-500" : "bg-amber-500"
                      }`}
                    >
                      {alerts.length}
                    </span>
                  )}
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 text-gray-800 z-50 overflow-hidden">
                    <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                      <span className="font-bold text-sm text-gray-800">
                        Bildirimler ({alerts.length})
                      </span>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsRecipientModalOpen(true);
                        }}
                        className="text-xs text-emerald-700 hover:underline font-medium"
                      >
                        Mail Ayarları
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                      {alerts.length === 0 ? (
                        <div className="p-6 text-center text-sm text-gray-400">
                          Yaklaşan veya geciken bir uyarı yok.
                        </div>
                      ) : (
                        alerts.map((item) => {
                          const isOverdue = item.daysRemaining < 0;
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                setActiveTab("animals");
                                setIsDropdownOpen(false);
                              }}
                              className="p-3 hover:bg-gray-50 cursor-pointer flex items-start gap-3 transition-colors"
                            >
                              <div
                                className={`p-2 rounded-lg mt-0.5 ${
                                  item.type === "VACCINATION"
                                    ? "bg-blue-50 text-blue-600"
                                    : "bg-amber-50 text-amber-600"
                                }`}
                              >
                                {item.type === "VACCINATION" ? (
                                  <Syringe className="h-4 w-4" />
                                ) : (
                                  <Baby className="h-4 w-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-xs text-gray-900">
                                    {item.animalTagNumber}{" "}
                                    {item.animalName
                                      ? `(${item.animalName})`
                                      : ""}
                                  </span>
                                  <span className="text-[11px] text-gray-400">
                                    {item.sectionName}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-700 truncate">
                                  {item.title}
                                </p>
                                <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold">
                                  {isOverdue ? (
                                    <span className="text-red-600 flex items-center gap-1">
                                      <AlertCircle className="h-3 w-3" />
                                      {Math.abs(item.daysRemaining)} gün gecikti
                                      ({item.targetDate})
                                    </span>
                                  ) : item.daysRemaining === 0 ? (
                                    <span className="text-amber-600">
                                      BUGÜN ({item.targetDate})
                                    </span>
                                  ) : (
                                    <span className="text-emerald-700">
                                      {item.daysRemaining} gün kaldı (
                                      {item.targetDate})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* E-Posta Alıcıları & Gönderim Butonu */}
              <button
                onClick={() => setIsRecipientModalOpen(true)}
                title="E-Posta Bildirim Alıcıları"
                className="p-2 rounded-lg text-emerald-100 hover:bg-emerald-600 transition-colors"
              >
                <Mail className="h-5 w-5" />
              </button>
              {/* Çıkış Yap Butonu */}
              <button
                onClick={onLogout}
                title="Çıkış Yap"
                className="p-2 rounded-lg text-emerald-100 hover:bg-red-600 hover:text-white transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mail Alıcıları ve Gönderim Modalı */}
      <NotificationModal
        isOpen={isRecipientModalOpen}
        onClose={() => setIsRecipientModalOpen(false)}
      />
    </>
  );
};
