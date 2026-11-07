import React from "react";
import { Home, Layers, Calendar, LayoutDashboard } from "lucide-react";

interface NavbarProps {
  activeTab: "dashboard" | "sections" | "animals";
  setActiveTab: (tab: "dashboard" | "sections" | "animals") => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="bg-emerald-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Home className="h-8 w-8 text-emerald-200" />
            <span className="font-bold text-xl tracking-tight">
              Çiftlik Takip Sistemi
            </span>
          </div>
          <div className="flex space-x-2 sm:space-x-4">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "dashboard"
                  ? "bg-emerald-900 text-white"
                  : "text-emerald-100 hover:bg-emerald-600"
              }`}
            >
              <LayoutDashboard className="h-4 w-4 mr-1.5" />
              Dashboard
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
              Padoklar
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
              Hayvanlar
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
