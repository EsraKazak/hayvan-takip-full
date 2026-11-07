import { useState } from "react";
import { Navbar } from "./components/Navbar";
import { SectionsPage } from "./pages/SectionsPage";
import { AnimalsPage } from "./pages/AnimalsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { Toaster } from "sonner";

export function App() {
  const [activeTab, setActiveTab] = useState<
    "sections" | "animals" | "dashboard"
  >("sections");

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors closeButton />
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

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
