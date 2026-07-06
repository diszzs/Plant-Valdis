import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sprout,
  Compass,
  Heart,
  Activity,
  MessageSquare,
  Droplet,
  Info,
  Calendar,
  Gamepad2,
} from "lucide-react";
import Scanner from "./components/Scanner";
import Garden from "./components/Garden";
import Diagnosis from "./components/Diagnosis";
import ChatAssistant from "./components/ChatAssistant";
import PlantGame from "./components/PlantGame";
import { SavedPlant } from "./types";
import { Language, translations } from "./utils/translations";

type Tab = "scanner" | "garden" | "diagnosis" | "chat" | "game";

export default function App() {
  const [lang, setLang] = useState<Language>("en");
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<Tab>("scanner");
  const [savedPlants, setSavedPlants] = useState<SavedPlant[]>([]);

  // Load plants from localStorage on component mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("plant_care_garden_plants");
      if (stored) {
        setSavedPlants(JSON.parse(stored));
      } else {
        // Initial mock welcome plant if the garden is brand new
        const welcomePlant: SavedPlant = {
          id: "welcome-monstera",
          nickname: "My Welcome Monstera",
          commonName: "Monstera Deliciosa",
          botanicalName: "Monstera deliciosa",
          addedAt: new Date().toISOString(),
          lastWateredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Watered 3 days ago
          wateringFrequencyDays: 7,
          notes: "Received as a welcome gift! Positioned in bright, indirect sunlight in the living room.",
          careGuide: {
            watering: "Water thoroughly when the top 2-3 inches of soil feels dry. Avoid overwatering.",
            light: "Thrives in bright to medium indirect sunlight. Keep away from direct hot midday sun.",
            soil: "Requires peat-rich, well-draining soil mixture with perlite or orchid bark.",
            temperature: "Ideal range is 18°C - 30°C (65°F - 85°F). Keep away from cold drafts.",
            humidity: "Appreciates higher humidity. Mist occasionally or use a humidifier.",
            fertilizer: "Feed monthly during spring and summer with balanced liquid houseplant food."
          }
        };
        setSavedPlants([welcomePlant]);
        localStorage.setItem("plant_care_garden_plants", JSON.stringify([welcomePlant]));
      }
    } catch (err) {
      console.error("Failed to load saved plants from local storage:", err);
    }
  }, []);

  // Sync saved plants back to localStorage
  const saveToStorage = (updatedList: SavedPlant[]) => {
    setSavedPlants(updatedList);
    try {
      localStorage.setItem("plant_care_garden_plants", JSON.stringify(updatedList));
    } catch (err) {
      console.error("Failed to write saved plants list to local storage:", err);
    }
  };

  const handleSaveToGarden = (newPlant: SavedPlant) => {
    // Avoid double entries for exact name/nickname if wanted, but generally allow unique records
    const updated = [newPlant, ...savedPlants];
    saveToStorage(updated);
  };

  const handleWaterPlant = (id: string) => {
    const updated = savedPlants.map((plant) => {
      if (plant.id === id) {
        return {
          ...plant,
          lastWateredAt: new Date().toISOString(),
        };
      }
      return plant;
    });
    saveToStorage(updated);
  };

  const handleWaterAllPlants = () => {
    const updated = savedPlants.map((plant) => ({
      ...plant,
      lastWateredAt: new Date().toISOString(),
    }));
    saveToStorage(updated);
  };

  const handleDeletePlant = (id: string) => {
    const confirmMsg = lang === "en"
      ? "Are you sure you want to remove this plant from your My Garden collection?"
      : "Apakah Anda yakin ingin menghapus tanaman ini dari koleksi Kebun Saya?";
    if (confirm(confirmMsg)) {
      const updated = savedPlants.filter((plant) => plant.id !== id);
      saveToStorage(updated);
    }
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    const updated = savedPlants.map((plant) => {
      if (plant.id === id) {
        return {
          ...plant,
          notes,
        };
      }
      return plant;
    });
    saveToStorage(updated);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF7] text-gray-800 flex flex-col font-sans selection:bg-[#E8EFE9] selection:text-[#3B6640]">
      {/* Dynamic Header & Navigation Bar */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-40 transition-all duration-300 shadow-sm" id="app-nav-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and App Title */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab("scanner")} id="header-branding">
              <div className="w-9 h-9 rounded-xl bg-[#E8EFE9] text-[#3B6640] flex items-center justify-center shadow-inner">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-base md:text-lg text-[#1E3F20] tracking-tight block leading-tight">
                  {t.appTitle}
                </span>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                  {t.appSubTitle}
                </span>
              </div>
            </div>

            {/* Desktop Tabs Selectors */}
            <nav className="hidden md:flex space-x-1 bg-gray-100/60 p-1 rounded-2xl animate-fade-in" id="desktop-tab-navigation">
              <button
                onClick={() => setActiveTab("scanner")}
                id="tab-scanner-desktop"
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                  activeTab === "scanner"
                    ? "bg-[#3B6640] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Compass className="w-3.5 h-3.5" /> {t.tabScanner}
              </button>

              <button
                onClick={() => setActiveTab("garden")}
                id="tab-garden-desktop"
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                  activeTab === "garden"
                    ? "bg-[#3B6640] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Heart className="w-3.5 h-3.5" /> {t.tabGarden}
                {savedPlants.length > 0 && (
                  <span className="ml-1 w-4 h-4 bg-orange-100 text-[#3B6640] rounded-full text-[9px] font-bold flex items-center justify-center border border-orange-200">
                    {savedPlants.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("diagnosis")}
                id="tab-diagnosis-desktop"
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                  activeTab === "diagnosis"
                    ? "bg-[#3B6640] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Activity className="w-3.5 h-3.5" /> {t.tabDiagnosis}
              </button>

              <button
                onClick={() => setActiveTab("chat")}
                id="tab-chat-desktop"
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                  activeTab === "chat"
                    ? "bg-[#3B6640] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> {t.tabChat}
              </button>

              <button
                onClick={() => setActiveTab("game")}
                id="tab-game-desktop"
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                  activeTab === "game"
                    ? "bg-[#3B6640] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" /> {t.tabGame}
              </button>
            </nav>

            {/* Quick overview widget & Language selection */}
            <div className="flex items-center gap-3 text-xs" id="quick-status-badge">
              <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8EFE9] text-[#3B6640] font-semibold text-[10px] uppercase">
                <Calendar className="w-3 h-3" /> {t.greenhouseActive}
              </span>
              <button
                onClick={() => setLang(lang === "en" ? "id" : "en")}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F9F6F0] hover:bg-[#E8EFE9] border border-orange-100/30 text-gray-700 hover:text-[#3B6640] transition-colors flex items-center gap-1 shadow-sm"
                id="btn-language-switcher"
              >
                <span>🌐</span>
                <span className="uppercase font-extrabold tracking-wider">{lang === "en" ? "ID" : "EN"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden border-t border-gray-100 bg-white grid grid-cols-5 px-2 py-1.5 text-center gap-1" id="mobile-tab-navigation">
          <button
            onClick={() => setActiveTab("scanner")}
            id="tab-scanner-mobile"
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[10px] font-semibold ${
              activeTab === "scanner" ? "text-[#3B6640] bg-[#E8EFE9]/50" : "text-gray-400"
            }`}
          >
            <Compass className="w-4.5 h-4.5 mb-0.5" />
            <span>{lang === "en" ? "Scan" : "Scan"}</span>
          </button>

          <button
            onClick={() => setActiveTab("garden")}
            id="tab-garden-mobile"
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[10px] font-semibold relative ${
              activeTab === "garden" ? "text-[#3B6640] bg-[#E8EFE9]/50" : "text-gray-400"
            }`}
          >
            <Heart className="w-4.5 h-4.5 mb-0.5" />
            <span>{lang === "en" ? "Garden" : "Kebun"}</span>
            {savedPlants.length > 0 && (
              <span className="absolute top-1 right-2.5 w-3.5 h-3.5 bg-orange-400 text-white rounded-full text-[8px] font-extrabold flex items-center justify-center">
                {savedPlants.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("diagnosis")}
            id="tab-diagnosis-mobile"
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[10px] font-semibold ${
              activeTab === "diagnosis" ? "text-[#3B6640] bg-[#E8EFE9]/50" : "text-gray-400"
            }`}
          >
            <Activity className="w-4.5 h-4.5 mb-0.5" />
            <span>{lang === "en" ? "Doctor" : "Dokter"}</span>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            id="tab-chat-mobile"
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[10px] font-semibold ${
              activeTab === "chat" ? "text-[#3B6640] bg-[#E8EFE9]/50" : "text-gray-400"
            }`}
          >
            <MessageSquare className="w-4.5 h-4.5 mb-0.5" />
            <span>{lang === "en" ? "Chat" : "Chat"}</span>
          </button>

          <button
            onClick={() => setActiveTab("game")}
            id="tab-game-mobile"
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[10px] font-semibold ${
              activeTab === "game" ? "text-[#3B6640] bg-[#E8EFE9]/50" : "text-gray-400"
            }`}
          >
            <Gamepad2 className="w-4.5 h-4.5 mb-0.5" />
            <span>{lang === "en" ? "Game" : "Game"}</span>
          </button>
        </div>
      </header>

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" id="app-main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="focus:outline-none"
          >
            {activeTab === "scanner" && (
              <Scanner
                onSaveToGarden={handleSaveToGarden}
                savedPlantIds={savedPlants.map((p) => p.commonName)}
                lang={lang}
              />
            )}

            {activeTab === "garden" && (
              <Garden
                plants={savedPlants}
                onWaterPlant={handleWaterPlant}
                onWaterAllPlants={handleWaterAllPlants}
                onDeletePlant={handleDeletePlant}
                onUpdateNotes={handleUpdateNotes}
                onNavigateToScanner={() => setActiveTab("scanner")}
                lang={lang}
              />
            )}

            {activeTab === "diagnosis" && <Diagnosis lang={lang} />}

            {activeTab === "chat" && <ChatAssistant savedPlants={savedPlants} lang={lang} />}

            {activeTab === "game" && <PlantGame lang={lang} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Aesthetic Footer Block */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-12 text-center text-xs text-gray-400 font-medium" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="flex items-center justify-center gap-1.5 text-gray-500">
            <Sprout className="w-4 h-4 text-[#3B6640]" /> {t.footerText}
          </p>
          <p className="text-[10px]">
            {t.footerNote}
          </p>
        </div>
      </footer>
    </div>
  );
}
