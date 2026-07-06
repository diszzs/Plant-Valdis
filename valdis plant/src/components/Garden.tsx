import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Droplet,
  Trash2,
  Calendar,
  Layers,
  Sun,
  Edit2,
  Check,
  Search,
  PlusCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HeartCrack,
} from "lucide-react";
import { SavedPlant } from "../types";
import { Language, translations } from "../utils/translations";

interface GardenProps {
  lang: Language;
  plants: SavedPlant[];
  onWaterPlant: (id: string) => void;
  onWaterAllPlants: () => void;
  onDeletePlant: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onNavigateToScanner: () => void;
}

export default function Garden({
  lang,
  plants,
  onWaterPlant,
  onWaterAllPlants,
  onDeletePlant,
  onUpdateNotes,
  onNavigateToScanner,
}: GardenProps) {
  const t = translations[lang];
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState("");
  const [expandedPlantId, setExpandedPlantId] = useState<string | null>(null);

  const filteredPlants = plants.filter(
    (plant) =>
      plant.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plant.commonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plant.botanicalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateWateringStatus = (plant: SavedPlant) => {
    if (!plant.lastWateredAt) {
      return { status: lang === "en" ? "Overdue 🚨" : "Terlambat 🚨", daysLeft: 0, severity: "danger" };
    }

    const lastWatered = new Date(plant.lastWateredAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastWatered.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const daysLeft = plant.wateringFrequencyDays - diffDays;

    if (daysLeft < 0) {
      return { status: lang === "en" ? `Overdue by ${Math.abs(daysLeft)}d 🚨` : `Telat ${Math.abs(daysLeft)} hari 🚨`, daysLeft, severity: "danger" };
    } else if (daysLeft === 0) {
      return { status: lang === "en" ? "Needs water today 💧" : "Siram hari ini 💧", daysLeft, severity: "warning" };
    } else if (daysLeft === 1) {
      return { status: lang === "en" ? "Water tomorrow ⏳" : "Siram besok ⏳", daysLeft, severity: "warning" };
    } else {
      return { status: lang === "en" ? `Healthy (${daysLeft}d left)` : `Sehat (sisa ${daysLeft} hari)`, daysLeft, severity: "success" };
    }
  };

  const handleStartEditing = (plant: SavedPlant) => {
    setEditingPlantId(plant.id);
    setTempNotes(plant.notes || "");
  };

  const handleSaveNotes = (id: string) => {
    onUpdateNotes(id, tempNotes);
    setEditingPlantId(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6" id="garden-view-container">
      {/* Garden Stats Dashboard */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6" id="garden-stats-panel">
        <div className="space-y-1">
          <p className="text-xs uppercase font-bold text-gray-400 tracking-wider">{t.gardenTotalPlants}</p>
          <p className="text-3xl font-black text-[#1E3F20]">{plants.length}</p>
          <p className="text-xs text-gray-500">{t.gardenInGreenhouse}</p>
        </div>

        <div className="space-y-1 border-y md:border-y-0 md:border-x border-gray-100 py-4 md:py-0 md:px-6">
          <p className="text-xs uppercase font-bold text-gray-400 tracking-wider">{t.gardenOverdueWatering}</p>
          <p className="text-3xl font-black text-red-600">
            {plants.filter((p) => calculateWateringStatus(p).severity === "danger").length}
          </p>
          <p className="text-xs text-gray-500">{t.gardenImmediateHydration}</p>
        </div>

        <div className="space-y-3 flex flex-col justify-center">
          {plants.length > 0 && (
            <button
              onClick={onWaterAllPlants}
              id="btn-water-all"
              className="w-full py-2.5 px-4 bg-[#E8EFE9] text-[#3B6640] hover:bg-[#dce9dd] rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Droplet className="w-4 h-4 text-[#3B6640] fill-[#3B6640]" /> {t.gardenWaterAll}
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between" id="garden-controls">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t.gardenSearchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-[#3B6640] shadow-sm placeholder:text-gray-400"
          />
        </div>

        {plants.length > 0 && (
          <button
            onClick={onNavigateToScanner}
            id="btn-scan-more"
            className="w-full sm:w-auto px-4 py-2 bg-[#3B6640] hover:bg-[#1E3F20] text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" /> {t.gardenScanMore}
          </button>
        )}
      </div>

      {/* Main Plants List / Grid */}
      <AnimatePresence mode="wait">
        {filteredPlants.length === 0 ? (
          <motion.div
            key="empty-garden"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white border border-gray-100 rounded-3xl p-12 text-center space-y-4 shadow-sm"
            id="garden-empty-state"
          >
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[#E8EFE9] text-[#3B6640] flex items-center justify-center mb-2 shadow-inner">
              <HeartCrack className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-gray-800">{t.gardenEmptyTitle}</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                {searchQuery
                  ? t.gardenEmptyDescSearch
                  : t.gardenEmptyDescGeneral}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={onNavigateToScanner}
                id="btn-go-scan-first"
                className="px-6 py-2.5 bg-[#3B6640] hover:bg-[#1E3F20] text-white rounded-full text-xs font-semibold shadow-md transition-all duration-200"
              >
                {t.gardenScanFirstBtn}
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="garden-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            id="garden-grid-layout"
          >
            {filteredPlants.map((plant) => {
              const { status, daysLeft, severity } = calculateWateringStatus(plant);
              const isExpanded = expandedPlantId === plant.id;

              return (
                <motion.div
                  key={plant.id}
                  layout
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between"
                  id={`plant-card-${plant.id}`}
                >
                  <div className="p-5 space-y-4">
                    {/* Plant card top: Image & Info */}
                    <div className="flex gap-4 items-start">
                      {plant.imageUrl ? (
                        <img
                          src={plant.imageUrl}
                          alt={plant.nickname}
                          className="w-20 h-20 object-cover rounded-2xl border border-gray-100 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-[#E8EFE9] text-[#3B6640] flex items-center justify-center shrink-0 border border-[#D0DFD3]/40">
                          <Layers className="w-8 h-8 opacity-60" />
                        </div>
                      )}

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-1.5">
                          <h3 className="font-bold text-base text-[#1E3F20] truncate">
                            {plant.nickname || plant.commonName}
                          </h3>
                          <button
                            onClick={() => onDeletePlant(plant.id)}
                            id={`btn-delete-${plant.id}`}
                            className="p-1 text-gray-300 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                            title="Remove from Garden"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs italic text-gray-500 font-serif truncate">
                          {plant.botanicalName}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {lang === "en" ? "Added on" : "Ditambahkan pada"} {new Date(plant.addedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Hydration Tracker Meter */}
                    <div className="bg-gray-50 rounded-2xl p-3 flex items-center justify-between text-xs border border-gray-100/60">
                      <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t.gardenWateringRoutine}</p>
                        <p className="font-semibold text-gray-700">
                          {t.gardenWateringEvery.replace("{days}", plant.wateringFrequencyDays.toString())}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            severity === "danger"
                              ? "bg-red-50 text-red-600 border border-red-100"
                              : severity === "warning"
                              ? "bg-yellow-50 text-yellow-700 border border-yellow-100"
                              : "bg-green-50 text-green-700 border border-green-100"
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                    </div>

                    {/* Expandable Care Reference Guide */}
                    <div className="border-t border-gray-100 pt-3">
                      <button
                        onClick={() => setExpandedPlantId(isExpanded ? null : plant.id)}
                        className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-[#3B6640] transition-colors font-medium py-1"
                      >
                        <span>{lang === "en" ? "Botanical Care Guide Summary" : "Ringkasan Panduan Perawatan Botani"}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden text-xs text-gray-600 space-y-2 mt-2"
                          >
                            <div className="grid grid-cols-2 gap-2 bg-[#F9F6F0] p-3 rounded-2xl border border-orange-100/30">
                              <div>
                                <p className="font-bold text-[#3B6640] flex items-center gap-1">
                                  <Droplet className="w-3 h-3 text-[#3B6640]" /> {lang === "en" ? "Watering" : "Penyiraman"}
                                </p>
                                <p className="text-[11px] leading-relaxed text-gray-500">{plant.careGuide.watering}</p>
                              </div>
                              <div>
                                <p className="font-bold text-[#3B6640] flex items-center gap-1">
                                  <Sun className="w-3 h-3 text-orange-400" /> {lang === "en" ? "Lighting" : "Pencahayaan"}
                                </p>
                                <p className="text-[11px] leading-relaxed text-gray-500">{plant.careGuide.light}</p>
                              </div>
                            </div>
                            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                              <p className="font-semibold text-gray-700">{lang === "en" ? "Ideal Conditions" : "Kondisi Ideal"}</p>
                              <p className="text-[10px] text-gray-500 leading-normal">
                                <strong>Soil:</strong> {plant.careGuide.soil} <br />
                                <strong>Temp:</strong> {plant.careGuide.temperature} | <strong>Humidity:</strong> {plant.careGuide.humidity}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Active Diary/Notes section */}
                    <div className="space-y-1.5 border-t border-gray-100 pt-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.gardenDiaryTitle}</label>
                        {editingPlantId !== plant.id && (
                          <button
                            onClick={() => handleStartEditing(plant)}
                            className="text-[10px] text-[#3B6640] hover:underline font-bold flex items-center gap-1"
                          >
                            <Edit2 className="w-2.5 h-2.5" /> {t.gardenEditNotes}
                          </button>
                        )}
                      </div>

                      {editingPlantId === plant.id ? (
                        <div className="space-y-2" id={`notes-editor-${plant.id}`}>
                          <textarea
                            value={tempNotes}
                            onChange={(e) => setTempNotes(e.target.value)}
                            placeholder="Type progress reports, health updates, or observations..."
                            rows={3}
                            className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#3B6640] resize-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingPlantId(null)}
                              className="text-[10px] text-gray-500 hover:bg-gray-100 px-2 py-1 rounded-md"
                            >
                              {t.gardenCancel}
                            </button>
                            <button
                              onClick={() => handleSaveNotes(plant.id)}
                              className="text-[10px] text-white bg-[#3B6640] hover:bg-[#1E3F20] px-2.5 py-1 rounded-md font-semibold flex items-center gap-1"
                            >
                              <Check className="w-2.5 h-2.5" /> {t.gardenSaveNote}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-600 bg-[#F9F6F0]/50 p-3 rounded-2xl italic border border-orange-100/10 leading-relaxed min-h-[42px]">
                          {plant.notes || t.gardenDiaryPlaceholder}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action bottom button */}
                  <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                      <Clock className="w-3 h-3" />
                      {plant.lastWateredAt ? (
                        <span>{t.gardenLastWatered.replace("{date}", new Date(plant.lastWateredAt).toLocaleDateString())}</span>
                      ) : (
                        <span className="text-red-500 font-semibold">{t.gardenNeverWatered}</span>
                      )}
                    </div>

                    <button
                      onClick={() => onWaterPlant(plant.id)}
                      id={`btn-water-${plant.id}`}
                      className="flex items-center gap-1 bg-[#3B6640] hover:bg-[#1E3F20] text-white text-xs px-4 py-1.5 rounded-xl font-semibold transition-colors shadow-sm"
                    >
                      <Droplet className="w-3.5 h-3.5 shrink-0" /> {t.gardenWaterBtn}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
