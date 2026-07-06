import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  Upload,
  Sprout,
  AlertTriangle,
  CheckCircle2,
  Droplet,
  Sun,
  Activity,
  BookmarkPlus,
  RefreshCw,
  Info,
  Layers,
  Sparkles,
  Smile,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";
import { IdentificationResult, SavedPlant } from "../types";
import { Language, translations } from "../utils/translations";

interface ScannerProps {
  lang: Language;
  onSaveToGarden: (plant: SavedPlant) => void;
  savedPlantIds: string[];
}

const LOADING_STATUS_MESSAGES = [
  "Capturing high-resolution leaf image...",
  "Analyzing leaf margins and venation patterns...",
  "Cross-referencing with global botanical taxonomy database...",
  "Evaluating chlorophyll density and plant vigor...",
  "Retrieving pet and human toxicity profiles...",
  "Formulating customized watering and soil instructions...",
  "Compiling propagation steps and common disease data...",
];

export default function Scanner({ lang, onSaveToGarden, savedPlantIds }: ScannerProps) {
  const t = translations[lang];
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<IdentificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Nickname & custom watering frequency for adding to Garden
  const [nickname, setNickname] = useState("");
  const [wateringDays, setWateringDays] = useState(7);
  const [isSaved, setIsSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cycling status messages during API call
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_STATUS_MESSAGES.length);
      }, 3000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, or WEBP).");
      return;
    }
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImage(event.target.result as string);
        setResult(null);
        setIsSaved(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read the selected file.");
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setError(null);
    setResult(null);
    setIsSaved(false);
    setIsCameraActive(true);
    setImage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError("Could not access camera. Please check permissions or drag/upload a photo instead.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setImage(dataUrl);
        setMimeType("image/jpeg");
        stopCamera();
      }
    }
  };

  const handleIdentify = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setResult(null);

    // Extract base64 without metadata prefix
    const base64Data = image.split(",")[1];

    try {
      const response = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Data,
          mimeType,
          lang,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned status ${response.status}`);
      }

      const data: IdentificationResult = await response.json();
      setResult(data);

      // Guess a sensible watering frequency from care guide descriptions
      let frequency = 7;
      const waterDesc = data.careGuide.watering.toLowerCase();
      if (waterDesc.includes("daily") || waterDesc.includes("constant moist")) {
        frequency = 2;
      } else if (waterDesc.includes("twice a week") || waterDesc.includes("2-3 days")) {
        frequency = 3;
      } else if (waterDesc.includes("1-2 weeks") || waterDesc.includes("every two weeks")) {
        frequency = 12;
      } else if (waterDesc.includes("succulent") || waterDesc.includes("once a month") || waterDesc.includes("3 weeks")) {
        frequency = 21;
      }
      setWateringDays(frequency);
      setNickname(data.commonName);
    } catch (err: any) {
      console.error("Identification error:", err);
      setError(err.message || "An unexpected error occurred while analyzing the plant.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlant = () => {
    if (!result) return;

    const newPlant: SavedPlant = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nickname: nickname.trim() || result.commonName,
      commonName: result.commonName,
      botanicalName: result.botanicalName,
      addedAt: new Date().toISOString(),
      wateringFrequencyDays: wateringDays,
      imageUrl: image || undefined,
      careGuide: result.careGuide,
    };

    onSaveToGarden(newPlant);
    setIsSaved(true);
  };

  const resetScanner = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setIsSaved(false);
    stopCamera();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8" id="scanner-view-container">
      {/* Header Banner */}
      <div className="text-center space-y-3" id="scanner-header-text">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8EFE9] text-[#3B6640] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Gemini 3.5 AI
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-sans text-[#1E3F20] tracking-tight">
          AI Plant Scanner
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto text-sm md:text-base">
          Snap a photo of any indoor or outdoor plant to instantly identify its species, check its toxicity, and download custom care schedules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div
            id="scanner-dropzone"
            className={`relative rounded-3xl border-2 border-dashed bg-white p-6 transition-all duration-300 flex flex-col items-center justify-center min-h-[350px] overflow-hidden ${
              isDragging ? "border-[#3B6640] bg-[#E8EFE9]/40 scale-[1.01]" : "border-gray-200 hover:border-gray-300"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Camera View Finder */}
            {isCameraActive && (
              <div className="absolute inset-0 bg-black z-10 flex flex-col justify-between" id="camera-viewfinder-overlay">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4 z-20">
                  <button
                    onClick={capturePhoto}
                    id="btn-capture-camera"
                    className="flex items-center gap-2 bg-[#3B6640] hover:bg-[#1E3F20] text-white px-5 py-2.5 rounded-full font-medium shadow-lg transition-colors text-sm"
                  >
                    <Camera className="w-4 h-4" /> {lang === "en" ? "Capture Photo" : "Ambil Foto"}
                  </button>
                  <button
                    onClick={stopCamera}
                    id="btn-cancel-camera"
                    className="bg-gray-800/80 hover:bg-gray-900/90 text-white px-4 py-2.5 rounded-full text-xs font-medium backdrop-blur transition-colors"
                  >
                    {t.gardenCancel}
                  </button>
                </div>
              </div>
            )}

            {/* Static Content / Preview */}
            <AnimatePresence mode="wait">
              {!image && !isCameraActive ? (
                <motion.div
                  key="upload-prompt"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center space-y-4 py-8"
                  id="scanner-static-prompt"
                >
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-[#E8EFE9] text-[#3B6640] flex items-center justify-center">
                    <Sprout className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-800">{lang === "en" ? "Drag & drop your plant image" : "Tarik & lepas foto tanaman Anda"}</p>
                    <p className="text-xs text-gray-500">{lang === "en" ? "Supports PNG, JPG, or WEBP files" : "Mendukung file PNG, JPG, atau WEBP"}</p>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <div className="h-px w-8 bg-gray-200" />
                    <span className="text-xs text-gray-400 font-medium uppercase">{lang === "en" ? "or" : "atau"}</span>
                    <div className="h-px w-8 bg-gray-200" />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      id="btn-browse-photo"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-[#E8EFE9] text-[#3B6640] hover:bg-[#dce9dd] rounded-full text-xs font-semibold transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" /> {lang === "en" ? "Browse File" : "Pilih File"}
                    </button>
                    <button
                      onClick={startCamera}
                      id="btn-open-camera"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-[#3B6640] text-white hover:bg-[#1E3F20] rounded-full text-xs font-semibold shadow-md transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" /> {lang === "en" ? "Use Live Camera" : "Gunakan Kamera Langsung"}
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </motion.div>
              ) : image ? (
                <motion.div
                  key="image-preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full flex flex-col items-center justify-center relative"
                  id="scanner-image-preview-panel"
                >
                  <img
                    src={image}
                    alt="Plant preview"
                    className="w-full h-64 object-cover rounded-2xl shadow-inner border border-gray-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="mt-4 flex gap-3 w-full justify-between items-center px-1">
                    <button
                      onClick={resetScanner}
                      id="btn-reset-scanner"
                      disabled={loading}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full disabled:opacity-50 transition-colors"
                    >
                      {lang === "en" ? "Remove" : "Hapus"}
                    </button>
                    {!result && (
                      <button
                        onClick={handleIdentify}
                        id="btn-trigger-identify"
                        disabled={loading}
                        className="flex items-center gap-2 bg-[#3B6640] hover:bg-[#1E3F20] text-white px-5 py-2 rounded-full font-semibold text-xs shadow-md disabled:opacity-50 transition-colors"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" /> {lang === "en" ? "Identifying..." : "Mengidentifikasi..."}
                          </>
                        ) : (
                          <>
                            <Sprout className="w-3.5 h-3.5" /> {lang === "en" ? "Analyze Plant Now" : "Analisis Tanaman Sekarang"}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Action Status and Warnings */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#E8EFE9] border border-[#D0DFD3] rounded-2xl p-4 flex gap-3 text-sm text-[#1E3F20]"
              id="scanner-loading-bar-panel"
            >
              <RefreshCw className="w-4 h-4 text-[#3B6640] animate-spin shrink-0 mt-0.5" />
              <div className="space-y-1.5 w-full">
                <p className="font-semibold text-[#1E3F20]">{lang === "en" ? "Gemini AI is examining your specimen" : "Gemini AI sedang memeriksa spesimen Anda"}</p>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#3B6640]"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 20, ease: "linear" }}
                  />
                </div>
                <p className="text-xs text-gray-500 italic animate-pulse duration-1000">
                  {lang === "en" ? LOADING_STATUS_MESSAGES[loadingStep] : [
                    "Menangkap gambar daun dengan resolusi tinggi...",
                    "Menganalisis margin daun dan pola pertulangan...",
                    "Mencocokkan dengan database taksonomi botani global...",
                    "Mengevaluasi kepadatan klorofil dan kekuatan tanaman...",
                    "Mengambil profil toksisitas hewan peliharaan dan manusia...",
                    "Merumuskan instruksi penyiraman dan tanah yang disesuaikan...",
                    "Menyusun langkah propagasi dan data penyakit umum...",
                  ][loadingStep]}
                </p>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 text-sm text-red-800"
              id="scanner-error-panel"
            >
              <AlertTriangle className="w-4.5 h-4.5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">{lang === "en" ? "Identification Halted" : "Identifikasi Terhenti"}</p>
                <p className="text-xs text-red-700/90 leading-relaxed">{error}</p>
                <button
                  onClick={handleIdentify}
                  className="mt-2 text-xs font-bold underline text-red-800 hover:text-red-900 block"
                >
                  {lang === "en" ? "Retry Analysis" : "Coba Analisis Lagi"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Quick instructions panel */}
          {!result && !loading && (
            <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-3 shadow-sm text-xs" id="scanner-tips-panel">
              <h4 className="font-semibold text-gray-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#3B6640]" /> {lang === "en" ? "Scanning Tips for Best Accuracy:" : "Tips Pemindaian untuk Akurasi Terbaik:"}
              </h4>
              <ul className="space-y-2 text-gray-600 list-disc list-inside">
                {lang === "en" ? (
                  <>
                    <li>Ensure the plant is well-lit and the image is sharp.</li>
                    <li>Position the camera close enough to show individual leaf characteristics.</li>
                    <li>Avoid having multiple distinct plant varieties in a single picture.</li>
                    <li>Focus on unique traits like leaf shape, stem structure, or flowers.</li>
                  </>
                ) : (
                  <>
                    <li>Pastikan tanaman cukup terang dan gambar tajam.</li>
                    <li>Posisikan kamera cukup dekat untuk menunjukkan karakteristik daun individu.</li>
                    <li>Hindari memiliki beberapa varietas tanaman berbeda dalam satu gambar.</li>
                    <li>Fokus pada sifat unik seperti bentuk daun, struktur batang, atau bunga.</li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Detailed Identification Results */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="results-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
                id="scanner-results-container"
              >
                {/* Result Hero Info */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 space-y-4 shadow-sm" id="result-hero-card">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold font-sans text-[#1E3F20]">
                        {result.commonName}
                      </h2>
                      <p className="text-sm italic text-gray-500 font-serif">
                        {result.botanicalName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {lang === "en" ? "Family:" : "Famili:"} <span className="font-semibold text-gray-600">{result.family}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#E8EFE9] text-[#3B6640] font-semibold text-xs">
                        <Activity className="w-3.5 h-3.5" />
                        {result.confidenceScore}% {lang === "en" ? "Confidence" : "Keyakinan"}
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  <div className="space-y-1">
                    <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider">{lang === "en" ? "Botanical Profile" : "Profil Botani"}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {result.description}
                    </p>
                  </div>
                </div>

                {/* Toxicity Status Cards */}
                <div className="grid grid-cols-3 gap-3" id="result-toxicity-cards">
                  {(["cats", "dogs", "humans"] as const).map((subject) => {
                    const status = result.toxicity[subject] || "Unknown";
                    const isSafe = status.toLowerCase().includes("safe");
                    const isMild = status.toLowerCase().includes("mild");

                    return (
                      <div
                        key={subject}
                        className={`rounded-2xl p-3 border text-center space-y-1 transition-colors ${
                          isSafe
                            ? "bg-green-50 border-green-100 text-green-800"
                            : isMild
                            ? "bg-yellow-50 border-yellow-100 text-yellow-800"
                            : "bg-red-50 border-red-100 text-red-800"
                        }`}
                      >
                        <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                          {subject === "cats" ? (lang === "en" ? "Cats" : "Kucing") : subject === "dogs" ? (lang === "en" ? "Dogs" : "Anjing") : (lang === "en" ? "Humans" : "Manusia")}
                        </p>
                        <div className="flex items-center justify-center gap-1 text-xs font-semibold">
                          {isSafe ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                          ) : (
                            <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          )}
                          <span className="truncate">{status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Botanical Care Guide Tabs */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 space-y-4 shadow-sm" id="result-care-guide-grid">
                  <h3 className="text-sm font-bold text-[#1E3F20] flex items-center gap-1.5 uppercase tracking-wide">
                    <Sprout className="w-4 h-4 text-[#3B6640]" /> {lang === "en" ? "Care Requirements" : "Kebutuhan Perawatan"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-[#F9F6F0] p-4 rounded-2xl border border-orange-100/40 space-y-1">
                      <div className="flex items-center gap-1 text-[#3B6640] font-semibold">
                        <Droplet className="w-3.5 h-3.5" /> {lang === "en" ? "Watering Instructions" : "Petunjuk Penyiraman"}
                      </div>
                      <p className="text-gray-600 leading-relaxed">{result.careGuide.watering}</p>
                    </div>

                    <div className="bg-[#E8EFE9] p-4 rounded-2xl border border-[#D0DFD3]/40 space-y-1">
                      <div className="flex items-center gap-1 text-[#3B6640] font-semibold">
                        <Sun className="w-3.5 h-3.5" /> {lang === "en" ? "Sunlight Preference" : "Sinar Matahari Ideal"}
                      </div>
                      <p className="text-gray-600 leading-relaxed">{result.careGuide.light}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                      <div className="flex items-center gap-1 text-gray-700 font-semibold">
                        <Layers className="w-3.5 h-3.5 text-gray-500" /> {lang === "en" ? "Ideal Soil Mixture" : "Media Tanam Ideal"}
                      </div>
                      <p className="text-gray-600 leading-relaxed">{result.careGuide.soil}</p>
                    </div>

                    <div className="bg-[#F9F6F0] p-4 rounded-2xl border border-orange-100/40 space-y-1">
                      <div className="flex items-center gap-1 text-gray-700 font-semibold">
                        <ThermometerIcon className="w-3.5 h-3.5 text-red-500" /> {lang === "en" ? "Temp & Humidity" : "Suhu & Kelembapan"}
                      </div>
                      <p className="text-gray-600 leading-relaxed">
                        <strong>{lang === "en" ? "Temp:" : "Suhu:"}</strong> {result.careGuide.temperature}<br />
                        <strong>{lang === "en" ? "Humidity:" : "Kelembapan:"}</strong> {result.careGuide.humidity}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs space-y-1">
                    <div className="flex items-center gap-1 text-gray-700 font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-500" /> {lang === "en" ? "Fertilizer & Feeding" : "Pemupukan & Nutrisi"}
                    </div>
                    <p className="text-gray-600 leading-relaxed">{result.careGuide.fertilizer}</p>
                  </div>
                </div>

                {/* Propagation Guide */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 space-y-3 shadow-sm" id="result-propagation-panel">
                  <h3 className="text-sm font-bold text-[#1E3F20] uppercase tracking-wide">
                    {lang === "en" ? "Propagation Methods" : "Metode Perbanyakan / Propagasi"}
                  </h3>
                  <div className="space-y-2 text-xs">
                    {result.propagation.map((method, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E8EFE9] text-[#3B6640] font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-gray-600 leading-relaxed">{method}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Common Problems & Solutions Table */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 space-y-4 shadow-sm" id="result-problems-panel">
                  <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide">
                    {lang === "en" ? "Potential Problems & Troubleshooting" : "Masalah Potensial & Penanganan"}
                  </h3>
                  <div className="space-y-3 text-xs">
                    {result.commonProblems.map((prob, idx) => (
                      <div key={idx} className="p-3 bg-red-50/40 border border-red-100/40 rounded-2xl space-y-1.5">
                        <p className="font-semibold text-red-900 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" /> {prob.symptom}
                        </p>
                        <p className="text-gray-600">
                          <strong>{lang === "en" ? "Probable Cause:" : "Kemungkinan Penyebab:"}</strong> {prob.cause}
                        </p>
                        <p className="text-[#3B6640] font-medium">
                          <strong>{lang === "en" ? "Remedy:" : "Solusi:"}</strong> {prob.solution}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fun Trivia Card */}
                <div className="bg-gradient-to-br from-[#1E3F20] to-[#3B6640] text-white rounded-3xl p-6 space-y-2.5 shadow-md" id="result-trivia-card">
                  <div className="flex items-center gap-1.5 text-yellow-300 font-bold text-xs uppercase tracking-wider">
                    <Smile className="w-4 h-4" /> {lang === "en" ? "Fun Botanical Trivia" : "Trivia Botani Menarik"}
                  </div>
                  <p className="text-xs md:text-sm text-white/90 leading-relaxed italic">
                    "{result.funFact}"
                  </p>
                </div>

                {/* Save to Collection Panel */}
                <div className="bg-[#E8EFE9] border border-[#D0DFD3] rounded-3xl p-6 space-y-4" id="result-save-panel">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[#1E3F20] flex items-center gap-1.5">
                      <BookmarkPlus className="w-5 h-5" /> {lang === "en" ? "Save to My Garden" : "Simpan ke Kebunku"}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {lang === "en"
                        ? "Add this plant to your digital garden to log notes, monitor last watered status, and track scheduled routines."
                        : "Tambahkan tanaman ini ke kebun digital Anda untuk mencatat catatan, memantau status penyiraman terakhir, dan melacak rutinitas terjadwal."}
                    </p>
                  </div>

                  {isSaved ? (
                    <div className="bg-white text-[#3B6640] p-4 rounded-2xl border border-[#D0DFD3] text-xs font-semibold flex items-center gap-2 justify-center">
                      <CheckCircle2 className="w-4 h-4 text-green-600" /> {lang === "en" ? "Plant saved successfully to My Garden collection!" : "Tanaman berhasil disimpan ke koleksi Kebunku!"}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 block">{lang === "en" ? "Plant Nickname" : "Nama Panggilan Tanaman"}</label>
                        <input
                          type="text"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          placeholder={lang === "en" ? "My Beautiful Fern..." : "Pakisku yang Cantik..."}
                          className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#3B6640]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 block">{lang === "en" ? "Watering Frequency" : "Frekuensi Penyiraman"}</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={wateringDays}
                            onChange={(e) => setWateringDays(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#3B6640]"
                          />
                          <span className="text-xs text-gray-600 font-semibold">{lang === "en" ? "Days" : "Hari"}</span>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <button
                          onClick={handleSavePlant}
                          id="btn-confirm-save-garden"
                          disabled={savedPlantIds.includes(result.commonName) || isSaved}
                          className="w-full py-2.5 bg-[#3B6640] hover:bg-[#1E3F20] text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
                        >
                          {lang === "en" ? "Add to Collection" : "Tambah ke Koleksi"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[400px]" id="scanner-empty-results">
                <div className="w-12 h-12 rounded-2xl bg-white text-gray-300 flex items-center justify-center border border-gray-100 mb-3 shadow-inner">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-700 text-sm">{lang === "en" ? "Waiting for Analysis" : "Menunggu Analisis"}</h3>
                <p className="text-xs text-gray-400 max-w-xs mt-1 leading-relaxed">
                  {lang === "en"
                    ? "Upload a leaf photo or capture one using your webcam. Once analysed, the comprehensive care guide and taxonomy will appear here."
                    : "Unggah foto daun atau ambil foto menggunakan kamera Anda. Setelah dianalisis, panduan perawatan komprehensif dan taksonomi akan muncul di sini."}
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Custom simple thermometers icon since standard Thermometer can be built in-house or we use a replacement
function ThermometerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
    </svg>
  );
}
