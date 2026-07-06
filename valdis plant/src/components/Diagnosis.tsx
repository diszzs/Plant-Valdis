import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  Upload,
  Activity,
  AlertTriangle,
  HeartCrack,
  CheckCircle2,
  RefreshCw,
  Info,
  ShieldAlert,
  HelpCircle,
  Lightbulb,
  Heart,
} from "lucide-react";
import { DiagnosisResult } from "../types";
import { Language, translations } from "../utils/translations";

const DIAGNOSIS_LOADING_STEPS_EN = [
  "Examining surface textures and color changes...",
  "Searching for bacterial lesion signatures...",
  "Correlating symptom descriptors with fungal patterns...",
  "Estimating pathology development severity...",
  "Sourcing recommended solutions and non-toxic treatments...",
  "Formatting prevention guidelines for future seasons...",
];

const DIAGNOSIS_LOADING_STEPS_ID = [
  "Memeriksa tekstur permukaan dan perubahan warna...",
  "Mencari tanda lesi bakteri...",
  "Menghubungkan deskripsi gejala dengan pola jamur...",
  "Memperkirakan tingkat keparahan perkembangan patologi...",
  "Mencari solusi yang direkomendasikan dan pengobatan non-toksik...",
  "Membuat panduan pencegahan untuk musim berikutnya...",
];

interface DiagnosisProps {
  lang: Language;
}

export default function Diagnosis({ lang }: DiagnosisProps) {
  const t = translations[lang];
  const diagnosisLoadingSteps = lang === "en" ? DIAGNOSIS_LOADING_STEPS_EN : DIAGNOSIS_LOADING_STEPS_ID;

  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [description, setDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % diagnosisLoadingSteps.length);
      }, 3000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

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
      setError(lang === "en" ? "Please upload an image file (PNG, JPG, or WEBP)." : "Silakan unggah file gambar (PNG, JPG, atau WEBP).");
      return;
    }
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImage(event.target.result as string);
        setResult(null);
      }
    };
    reader.onerror = () => {
      setError(lang === "en" ? "Failed to read the selected file." : "Gagal membaca file yang dipilih.");
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setError(null);
    setResult(null);
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
      setError(lang === "en" ? "Could not access camera. Try dragging or browsing a photo instead." : "Tidak dapat mengakses kamera. Silakan seret atau pilih foto.");
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

  const handleDiagnose = async () => {
    if (!image && !description.trim()) {
      setError(lang === "en" ? "Please supply at least a text description or upload/capture a photo to begin diagnosis." : "Silakan berikan deskripsi teks atau unggah/ambil foto untuk memulai diagnosis.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    // Extract base64 without metadata prefix if image exists
    const base64Data = image ? image.split(",")[1] : undefined;

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          image: base64Data,
          mimeType: image ? mimeType : undefined,
          lang,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned status ${response.status}`);
      }

      const data: DiagnosisResult = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error("Diagnosis error:", err);
      setError(err.message || (lang === "en" ? "An unexpected error occurred while analyzing the symptoms." : "Terjadi kesalahan tidak terduga saat menganalisis gejala."));
    } finally {
      setLoading(false);
    }
  };

  const resetDiagnosis = () => {
    setImage(null);
    setDescription("");
    setResult(null);
    setError(null);
    stopCamera();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8" id="diagnosis-view-container">
      {/* Title block */}
      <div className="text-center space-y-3" id="diagnosis-title-block">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-100">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          {lang === "en" ? "Plant Pathology Specialist" : "Spesialis Patologi Tanaman"}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#1E3F20] tracking-tight">
          {lang === "en" ? "AI Plant Doctor & Symptom Checker" : "Dokter Tanaman AI & Cek Gejala"}
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto text-sm md:text-base">
          {lang === "en"
            ? "Got yellow leaves, powdery spots, or drooping stems? Provide a photo or describe symptoms to get instant care advice."
            : "Daun menguning, bercak berjamur, atau batang layu? Berikan foto atau jelaskan gejala untuk saran perawatan instan."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Diagnostic Inputs Column */}
        <div className="lg:col-span-5 space-y-4">
          <div
            id="diagnosis-dropzone"
            className={`relative rounded-3xl border-2 border-dashed bg-white p-5 transition-all duration-300 flex flex-col items-center justify-center min-h-[250px] overflow-hidden ${
              isDragging ? "border-red-500 bg-red-50/25 scale-[1.01]" : "border-gray-200 hover:border-gray-300"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Camera View Finder */}
            {isCameraActive && (
              <div className="absolute inset-0 bg-black z-10 flex flex-col justify-between" id="diagnosis-camera-overlay">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4 z-20">
                  <button
                    onClick={capturePhoto}
                    id="btn-diagnosis-capture"
                    className="flex items-center gap-2 bg-[#3B6640] hover:bg-[#1E3F20] text-white px-5 py-2.5 rounded-full font-semibold shadow-lg text-sm"
                  >
                    <Camera className="w-4 h-4" /> {lang === "en" ? "Snap Photo" : "Ambil Foto"}
                  </button>
                  <button
                    onClick={stopCamera}
                    id="btn-diagnosis-cancel-camera"
                    className="bg-gray-800/80 hover:bg-gray-900/90 text-white px-4 py-2.5 rounded-full text-xs font-semibold backdrop-blur"
                  >
                    {lang === "en" ? "Cancel" : "Batal"}
                  </button>
                </div>
              </div>
            )}

            {/* Visual Preview or Drop Prompt */}
            <AnimatePresence mode="wait">
              {!image && !isCameraActive ? (
                <motion.div
                  key="diagnosis-upload-prompt"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center space-y-3 py-4"
                  id="diagnosis-drop-prompt"
                >
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-inner">
                    <HeartCrack className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-800 text-xs">{lang === "en" ? "Upload leaf/stem closeup photo" : "Unggah foto closeup daun/batang"}</p>
                    <p className="text-[10px] text-gray-500">{lang === "en" ? "Drag files here or choose below" : "Seret file ke sini atau pilih di bawah"}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1.5">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      id="btn-diagnosis-browse"
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full text-[11px] font-semibold transition-colors border border-gray-200"
                    >
                      <Upload className="w-3 h-3 text-gray-500" /> {lang === "en" ? "Browse Image" : "Pilih Gambar"}
                    </button>
                    <button
                      onClick={startCamera}
                      id="btn-diagnosis-camera"
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#3B6640] text-white hover:bg-[#1E3F20] rounded-full text-[11px] font-semibold shadow-sm transition-colors"
                    >
                      <Camera className="w-3 h-3" /> {lang === "en" ? "Live Camera" : "Kamera Langsung"}
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
                  key="diagnosis-image-preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full flex flex-col items-center justify-center relative"
                  id="diagnosis-preview-panel"
                >
                  <img
                    src={image}
                    alt="Sick Plant leaf"
                    className="w-full h-48 object-cover rounded-2xl border border-gray-100 shadow-inner"
                    referrerPolicy="no-referrer"
                  />
                  <div className="mt-3 text-left w-full">
                    <button
                      onClick={() => {
                        setImage(null);
                        setResult(null);
                      }}
                      className="text-[11px] text-red-600 hover:text-red-700 font-bold bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-full transition-colors"
                    >
                      {lang === "en" ? "Delete Photo" : "Hapus Foto"}
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Text input for symptom description */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-3 shadow-sm" id="diagnosis-text-input-card">
            <label className="text-xs font-bold text-gray-700 block uppercase tracking-wide">
              {lang === "en" ? "Symptom Description (Optional)" : "Deskripsi Gejala (Opsional)"}
            </label>
            <textarea
              placeholder={lang === "en" ? "E.g., Leaf tips are dry, brown, and curling upwards. Also noticed fine web-like filaments on the stems..." : "Contoh: Ujung daun kering, cokelat, dan melengkung ke atas. Juga terlihat jaring halus di batang..."}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setResult(null);
              }}
              rows={4}
              className="w-full text-xs p-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-red-400 focus:bg-white resize-none transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Submit Action Block */}
          {!result && (
            <button
              onClick={handleDiagnose}
              id="btn-run-diagnosis"
              disabled={loading || (!image && !description.trim())}
              className="w-full py-3 bg-[#3B6640] hover:bg-[#1E3F20] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {lang === "en" ? "Analyzing Pathology..." : "Menganalisis Patologi..."}
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5" /> {lang === "en" ? "Diagnose Health Issue" : "Diagnosis Masalah Kesehatan"}
                </>
              )}
            </button>
          )}

          {/* Pathology Loading State */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50/60 border border-red-100 rounded-2xl p-4 flex gap-3 text-xs text-red-900"
              id="diagnosis-loading-state"
            >
              <RefreshCw className="w-4 h-4 text-red-600 animate-spin shrink-0 mt-0.5" />
              <div className="space-y-1 w-full">
                <p className="font-bold">{lang === "en" ? "Analyzing Botanical Symptoms" : "Menganalisis Gejala Botani"}</p>
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-red-600"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 18, ease: "linear" }}
                  />
                </div>
                <p className="text-[10px] text-gray-500 italic animate-pulse">
                  {diagnosisLoadingSteps[loadingStep]}
                </p>
              </div>
            </motion.div>
          )}

          {/* Pathology Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-100/80 border border-red-200 text-red-800 p-4 rounded-2xl text-xs flex gap-2.5"
              id="diagnosis-error-state"
            >
              <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
              <p className="leading-normal">
                <strong>Diagnosis Failed:</strong> {error}
              </p>
            </motion.div>
          )}
        </div>

        {/* Diagnosis Results Column */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="diagnosis-result-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
                id="diagnosis-result-container"
              >
                {/* Primary Issue & Severity Alert */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4" id="diagnosis-header-card">
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{lang === "en" ? "Pathology Diagnosis" : "Diagnosis Patologi"}</p>
                      <h2 className="text-xl md:text-2xl font-black text-[#1E3F20]">
                        {result.issueName}
                      </h2>
                    </div>

                    <div className="shrink-0">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          result.severity === "high"
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : result.severity === "medium"
                            ? "bg-yellow-50 text-yellow-700 border border-yellow-100"
                            : "bg-green-50 text-green-700 border border-green-100"
                        }`}
                      >
                        {result.severity === "high" ? (lang === "en" ? "High" : "Tinggi") : result.severity === "medium" ? (lang === "en" ? "Medium" : "Sedang") : (lang === "en" ? "Low" : "Rendah")} {lang === "en" ? "Severity" : "Keparahan"}
                      </span>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  <div className="space-y-1 text-xs">
                    <p className="text-gray-400 uppercase font-bold tracking-wider text-[10px]">{lang === "en" ? "Clinical Analysis" : "Analisis Klinis"}</p>
                    <p className="text-gray-600 leading-relaxed font-sans text-sm">{result.diagnosis}</p>
                  </div>
                </div>

                {/* Sourcing/Possible Causes list */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-3" id="diagnosis-causes-card">
                  <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-gray-400" /> {lang === "en" ? "Possible Trigger Factors" : "Faktor Pemicu Kemungkinan"}
                  </h3>
                  <div className="space-y-2 text-xs">
                    {result.possibleCauses.map((cause, idx) => (
                      <div key={idx} className="flex gap-2 items-start text-gray-600 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                        <p>{cause}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Treatment & Remedies step-by-step procedures */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4" id="diagnosis-remedies-card">
                  <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5 text-green-800">
                    <Lightbulb className="w-4 h-4 text-yellow-500 fill-yellow-100 animate-bounce" /> {lang === "en" ? "Recommended Therapeutic Solutions" : "Rekomendasi Solusi Terapi"}
                  </h3>
                  <div className="space-y-3 text-xs">
                    {result.solutions.map((sol, idx) => (
                      <div key={idx} className="flex gap-3 items-start p-3 bg-[#F9F6F0] rounded-2xl border border-orange-100/20">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E8EFE9] text-[#3B6640] font-bold text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-gray-700 leading-relaxed font-sans">{sol}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prevention list */}
                <div className="bg-gradient-to-br from-[#1E3F20] to-[#3B6640] text-white rounded-3xl p-6 space-y-3 shadow-md" id="diagnosis-prevention-card">
                  <h3 className="text-xs uppercase font-bold text-yellow-300 tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-yellow-300" /> {lang === "en" ? "Proactive Prevention Guidelines" : "Pedoman Pencegahan Proaktif"}
                  </h3>
                  <div className="space-y-2 text-xs text-white/95 leading-relaxed">
                    {result.preventiveMeasures.map((measure, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <CheckCircle2 className="w-3.5 h-3.5 text-yellow-300 shrink-0 mt-0.5" />
                        <p>{measure}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reset button to run a new check */}
                <button
                  onClick={resetDiagnosis}
                  id="btn-new-diagnosis"
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-semibold shadow-inner transition-colors border border-gray-200"
                >
                  {lang === "en" ? "Clear and Run New Diagnosis" : "Hapus dan Mulai Diagnosis Baru"}
                </button>
              </motion.div>
            ) : (
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[400px]" id="diagnosis-empty-state">
                <div className="w-12 h-12 rounded-2xl bg-white text-gray-300 flex items-center justify-center border border-gray-100 mb-3 shadow-inner">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-700 text-sm">{lang === "en" ? "Pathology Report Center" : "Pusat Laporan Patologi"}</h3>
                <p className="text-xs text-gray-400 max-w-xs mt-1 leading-relaxed">
                  {lang === "en"
                    ? "Provide symptoms above. If possible, upload a detailed photo of the damaged leaf for our AI vision to perform precision lesion analysis."
                    : "Berikan detail gejala di atas. Jika memungkinkan, unggah foto closeup daun yang bermasalah agar penglihatan AI kami dapat melakukan analisis lesi secara presisi."}
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
