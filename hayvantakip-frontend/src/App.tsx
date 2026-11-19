import { useEffect, useState } from "react";
import { Navbar } from "./components/Navbar";
import { SectionsPage } from "./pages/SectionsPage";
import { AnimalsPage } from "./pages/AnimalsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { Toaster, toast } from "sonner";

export function App() {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("auth_token"),
  );
  const [activeTab, setActiveTab] = useState<
    "sections" | "animals" | "dashboard"
  >("sections");

  useEffect(() => {
    const handleAutoLogout = () => {
      setToken(null);
      toast.error("Oturum süreniz doldu, lütfen tekrar giriş yapın.");
    };
    window.addEventListener("auth:logout", handleAutoLogout);
    return () => window.removeEventListener("auth:logout", handleAutoLogout);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    toast.info("Çıkış yapıldı.");
  };

  if (!token) {
    return (
      <>
        <Toaster position="top-right" richColors closeButton />
        <LoginPage onLoginSuccess={(newToken) => setToken(newToken)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors closeButton />
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      <main>
        {activeTab === "dashboard" && (
          <DashboardPage
            onNavigateToSections={() => setActiveTab("sections")}
            onNavigateToAnimals={() => setActiveTab("animals")}
          />
        )}
        {activeTab === "sections" && <SectionsPage />}
        {activeTab === "animals" && <AnimalsPage />}
      </main>
    </div>
  );
}

export default App;
