import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Gamepad2,
  Sparkles,
  Trophy,
  RefreshCw,
  Droplet,
  Sun,
  Award,
  BookOpen,
  ChevronRight,
  Sprout,
  Heart,
  Skull,
  Activity,
  Zap,
} from "lucide-react";
import { Language, translations } from "../utils/translations";

interface PlantGameProps {
  lang: Language;
}

interface Question {
  id: number;
  questionEn: string;
  questionId: string;
  optionsEn: string[];
  optionsId: string[];
  correctIndex: number;
  explanationEn: string;
  explanationId: string;
}

const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    questionEn: "Which pigment gives plants their green color and absorbs light for photosynthesis?",
    questionId: "Pigmen manakah yang memberikan warna hijau pada tanaman dan menyerap cahaya untuk fotosintesis?",
    optionsEn: ["Carotenoid", "Chlorophyll", "Anthocyanin", "Xanthophyll"],
    optionsId: ["Karotenoid", "Klorofil", "Antosianin", "Xantofil"],
    correctIndex: 1,
    explanationEn: "Chlorophyll is the green pigment in chloroplasts that absorbs light energy.",
    explanationId: "Klorofil adalah pigmen hijau dalam kloroplas yang menyerap energi cahaya.",
  },
  {
    id: 2,
    questionEn: "What is a main symptom of root rot caused by severe overwatering?",
    questionId: "Apa gejala utama busuk akar yang disebabkan oleh penyiraman berlebih yang parah?",
    optionsEn: ["Mushy brown roots & yellowing leaves", "Crispy bright red leaf margins", "White powder spots on top stems", "Accelerated flowering speed"],
    optionsId: ["Akar cokelat lembek & daun menguning", "Ujung daun merah terang yang renyah", "Bintik bubuk putih pada batang atas", "Kecepatan pembungaan yang dipercepat"],
    correctIndex: 0,
    explanationEn: "Overwatering deprives roots of oxygen, causing roots to rot (mushy, smelly) and leaves to yellow.",
    explanationId: "Penyiraman berlebih merampas oksigen dari akar, menyebabkan akar membusuk (lembek, bau) dan daun menguning.",
  },
  {
    id: 3,
    questionEn: "Which plant family do succulents like Aloe Vera, Echeveria, and Jade belong to?",
    questionId: "Keluarga tanaman manakah tempat sukulen seperti Aloe Vera, Echeveria, dan Jade bernaung?",
    optionsEn: ["Orchidaceae", "Cactaceae", "Crassulaceae", "Araceae"],
    optionsId: ["Orchidaceae (Anggrek)", "Cactaceae (Kaktus)", "Crassulaceae", "Araceae (Talas-talasan)"],
    correctIndex: 2,
    explanationEn: "Most common rosette-shaped succulents belong to the Crassulaceae family.",
    explanationId: "Sebagian besar sukulen berbentuk roset yang umum termasuk dalam keluarga Crassulaceae.",
  },
  {
    id: 4,
    questionEn: "What does bright direct sunlight usually do to delicate shade-loving forest plants (like Calatheas)?",
    questionId: "Apa yang biasanya terjadi jika sinar matahari langsung yang terik mengenai tanaman hutan yang menyukai naungan (seperti Calathea)?",
    optionsEn: ["Boosts variegation patterns", "Burns leaves causing brown scorched spots", "Increases soil humidity", "Turns stems deep blue"],
    optionsId: ["Meningkatkan pola varigata", "Membakar daun menyebabkan bercak cokelat gosong", "Meningkatkan kelembapan tanah", "Mengubah batang menjadi biru tua"],
    correctIndex: 1,
    explanationEn: "Direct sunlight burns fragile foliage that adapted to shady forest understories.",
    explanationId: "Sinar matahari langsung membakar daun rapuh yang terbiasa beradaptasi di bawah naungan kanopi hutan.",
  },
  {
    id: 5,
    questionEn: "What material is ideal for adding aeration and high-drainage to standard potting soil mixes?",
    questionId: "Bahan apa yang ideal untuk menambah aerasi dan drainase tinggi ke campuran tanah pot standar?",
    optionsEn: ["Perlite", "Fine clay powder", "Fresh grass clippings", "Sugar water"],
    optionsId: ["Perlit", "Bubuk lempung halus", "Potongan rumput segar", "Air gula"],
    correctIndex: 0,
    explanationEn: "Perlite is an expanded volcanic glass that creates lightweight air pockets in dense soil.",
    explanationId: "Perlit adalah kaca vulkanik mengembang yang menciptakan kantong udara ringan di tanah padat.",
  },
];

export default function PlantGame({ lang }: PlantGameProps) {
  const t = translations[lang];
  const [gameMode, setGameMode] = useState<"choose" | "quiz" | "sim">("choose");

  // --- TRIVIA STATE ---
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  // --- SIM STATE ---
  const [simHealth, setSimHealth] = useState(50);
  const [simMoisture, setSimMoisture] = useState(50);
  const [simSun, setSimSun] = useState(50);
  const [simNutrients, setSimNutrients] = useState(50);
  const [simStage, setSimStage] = useState<"seed" | "sprout" | "growing" | "mature">("seed");
  const [simLogs, setSimLogs] = useState<string>("");

  // Update Plant growth stage based on health progression
  useEffect(() => {
    if (simHealth >= 100) {
      setSimStage("mature");
    } else if (simHealth >= 75) {
      setSimStage("growing");
    } else if (simHealth >= 35) {
      setSimStage("sprout");
    } else {
      setSimStage("seed");
    }
  }, [simHealth]);

  // Handle caretakers simulation feedback loop
  const handleCareAction = (action: "water" | "sun" | "fertilize" | "prune") => {
    if (simHealth <= 0) return;

    let dMoisture = 0;
    let dSun = 0;
    let dNutrients = 0;
    let effectMsg = "";

    if (action === "water") {
      dMoisture = 20;
      dSun = -5;
      effectMsg = lang === "en" ? "You watered the sprout! Soil is now damp." : "Anda menyiram kecambah! Tanah sekarang lembap.";
    } else if (action === "sun") {
      dSun = 25;
      dMoisture = -15;
      effectMsg = lang === "en" ? "You placed the pot in bright sun." : "Anda meletakkan pot di bawah sinar matahari yang hangat.";
    } else if (action === "fertilize") {
      dNutrients = 25;
      dMoisture = -5;
      effectMsg = lang === "en" ? "You injected rich organic plant food." : "Anda menambahkan makanan tanaman organik kaya nutrisi.";
    } else if (action === "prune") {
      dMoisture = -5;
      dSun = 5;
      effectMsg = lang === "en" ? "You pruned damaged stems to channel energy." : "Anda memangkas batang rusak untuk menyalurkan energi.";
    }

    // Apply adjustments
    const newMoisture = Math.max(0, Math.min(100, simMoisture + dMoisture));
    const newSun = Math.max(0, Math.min(100, simSun + dSun));
    const newNutrients = Math.max(0, Math.min(100, simNutrients + dNutrients));

    setSimMoisture(newMoisture);
    setSimSun(newSun);
    setSimNutrients(newNutrients);

    // Calculate health impact based on balanced levels
    // Optimal Moisture: 30-75
    // Optimal Sun: 30-75
    // Optimal Nutrients: 30-80
    let healthPenalty = 0;
    let healthBonus = 5;

    if (newMoisture < 30 || newMoisture > 75) {
      healthPenalty += 15;
      healthBonus = 0;
    }
    if (newSun < 30 || newSun > 75) {
      healthPenalty += 15;
      healthBonus = 0;
    }
    if (newNutrients < 30 || newNutrients > 80) {
      healthPenalty += 10;
      healthBonus = 0;
    }

    const calculatedHealth = Math.max(0, Math.min(100, simHealth - healthPenalty + healthBonus));
    setSimHealth(calculatedHealth);

    // Setup narrative feedback
    let statusSummary = effectMsg;
    if (calculatedHealth <= 0) {
      statusSummary += " " + (lang === "en" ? "Oh no! The plant withered away completely." : "Oh tidak! Tanaman layu dan mati sepenuhnya.");
    } else if (calculatedHealth >= 100) {
      statusSummary += " " + (lang === "en" ? "Splendid! Your plant is blooming beautifully!" : "Luar biasa! Tanaman Anda mekar dengan sangat indah!");
    } else if (healthPenalty > 0) {
      statusSummary += " " + (lang === "en" ? "Conditions are harsh! Health is dropping!" : "Kondisinya ekstrem! Kesehatan tanaman menurun!");
    } else {
      statusSummary += " " + (lang === "en" ? "The plant feels incredibly happy." : "Tanaman terasa sangat bahagia.");
    }

    setSimLogs(statusSummary);
  };

  const handleResetSim = () => {
    setSimHealth(50);
    setSimMoisture(50);
    setSimSun(50);
    setSimNutrients(50);
    setSimStage("seed");
    setSimLogs("");
  };

  const handleSelectAnswer = (index: number) => {
    if (selectedAns !== null) return;
    setSelectedAns(index);
    if (index === QUIZ_QUESTIONS[currentQ].correctIndex) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAns(null);
    if (currentQ + 1 < QUIZ_QUESTIONS.length) {
      setCurrentQ((prev) => prev + 1);
    } else {
      setQuizDone(true);
    }
  };

  const handleResetQuiz = () => {
    setCurrentQ(0);
    setSelectedAns(null);
    setQuizScore(0);
    setQuizDone(false);
  };

  const q = QUIZ_QUESTIONS[currentQ];
  const questionText = lang === "en" ? q.questionEn : q.questionId;
  const options = lang === "en" ? q.optionsEn : q.optionsId;
  const explanation = lang === "en" ? q.explanationEn : q.explanationId;

  const getSimStatusText = () => {
    if (simHealth <= 0) return t.gameSeedlingDead;
    if (simMoisture < 30) return t.gameSeedlingThirsty;
    if (simMoisture > 75) return t.gameSeedlingDrowning;
    if (simSun > 75) return t.gameSeedlingSunburnt;
    return t.gameSeedlingAlive;
  };

  const getSimStageName = () => {
    switch (simStage) {
      case "seed": return t.gameStageSeed;
      case "sprout": return t.gameStageSprout;
      case "growing": return t.gameStageGrowing;
      case "mature": return t.gameStageMature;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8" id="plant-arcade-view">
      {/* Title */}
      <div className="text-center space-y-2" id="arcade-header">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8EFE9] text-[#3B6640] text-xs font-semibold">
          <Gamepad2 className="w-3.5 h-3.5" />
          {t.tabGame}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-sans text-[#1E3F20] tracking-tight">
          {t.gameTitle}
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto text-sm">
          {t.gameSubtitle}
        </p>
      </div>

      {/* Mode Chooser */}
      {gameMode === "choose" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="arcade-modes">
          {/* Mode 1: Trivia */}
          <button
            onClick={() => setGameMode("quiz")}
            className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:border-[#3B6640] transition-all hover:shadow-md text-left space-y-4 group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E8EFE9] text-[#3B6640] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#1E3F20]">{t.gameTriviaTitle}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {t.gameTriviaDesc}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#3B6640] pt-4">
              Play Quiz <ChevronRight className="w-4 h-4" />
            </span>
          </button>

          {/* Mode 2: Care Simulator */}
          <button
            onClick={() => {
              setGameMode("sim");
              handleResetSim();
            }}
            className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:border-[#3B6640] transition-all hover:shadow-md text-left space-y-4 group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sprout className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#1E3F20]">{t.gameSimTitle}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {t.gameSimDesc}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#3B6640] pt-4">
              Enter Simulator <ChevronRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      )}

      {/* --- TRIVIA MODE --- */}
      {gameMode === "quiz" && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6" id="trivia-panel">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {t.gameTriviaTitle}
            </span>
            <button
              onClick={() => setGameMode("choose")}
              className="text-xs text-gray-500 hover:text-gray-800 underline font-semibold"
            >
              Back to Menu
            </button>
          </div>

          <AnimatePresence mode="wait">
            {!quizDone ? (
              <motion.div
                key={currentQ}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500 font-semibold">
                    <span>{t.gameQuestionOf.replace("{current}", (currentQ + 1).toString()).replace("{total}", QUIZ_QUESTIONS.length.toString())}</span>
                    <span>{t.gameScore}: {quizScore}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3B6640] transition-all duration-300"
                      style={{ width: `${((currentQ + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Question */}
                <h2 className="text-lg md:text-xl font-bold text-[#1E3F20]">
                  {questionText}
                </h2>

                {/* Options */}
                <div className="grid grid-cols-1 gap-3">
                  {options.map((opt, idx) => {
                    const isSelected = selectedAns === idx;
                    const isCorrect = idx === q.correctIndex;
                    let btnStyle = "border-gray-200 bg-white hover:bg-gray-50 text-gray-700";

                    if (selectedAns !== null) {
                      if (isCorrect) {
                        btnStyle = "bg-green-100 border-green-400 text-green-800";
                      } else if (isSelected) {
                        btnStyle = "bg-red-100 border-red-400 text-red-800";
                      } else {
                        btnStyle = "bg-gray-50 border-gray-100 text-gray-400 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectAnswer(idx)}
                        disabled={selectedAns !== null}
                        className={`w-full text-left p-4 rounded-2xl border text-sm font-semibold transition-all flex justify-between items-center ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {selectedAns !== null && isCorrect && <span className="text-green-600 font-extrabold text-xs">✓</span>}
                        {selectedAns !== null && isSelected && !isCorrect && <span className="text-red-600 font-extrabold text-xs">✗</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {selectedAns !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-[#F9F6F0] border border-orange-100/30 text-xs space-y-2"
                  >
                    <p className="font-bold text-gray-800 flex items-center gap-1">
                      <BookOpen className="w-4 h-4 text-[#3B6640]" />
                      {selectedAns === q.correctIndex ? t.gameCorrect : t.gameIncorrect}
                    </p>
                    <p className="text-gray-600 leading-relaxed font-sans">{explanation}</p>

                    <button
                      onClick={handleNextQuestion}
                      className="mt-2 px-4 py-2 bg-[#3B6640] hover:bg-[#1E3F20] text-white rounded-xl text-[10px] font-bold shadow-sm transition-colors block ml-auto"
                    >
                      {t.gameNextBtn}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-6"
              >
                <div className="w-20 h-20 bg-[#E8EFE9] text-[#3B6640] rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Award className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-[#1E3F20]">{t.gameQuizComplete}</h3>
                  <p className="text-sm text-gray-500 font-semibold">
                    {t.gameYourScore}: <span className="text-lg font-black text-[#3B6640]">{quizScore} / {QUIZ_QUESTIONS.length}</span>
                  </p>
                </div>

                <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                  {quizScore === QUIZ_QUESTIONS.length
                    ? t.gamePerfectScore
                    : quizScore >= 3
                    ? t.gameGoodScore
                    : t.gameLowScore}
                </p>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setGameMode("choose")}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Main Menu
                  </button>
                  <button
                    onClick={handleResetQuiz}
                    className="px-5 py-2.5 bg-[#3B6640] hover:bg-[#1E3F20] text-white rounded-xl text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> {t.gameRetryQuiz}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* --- SIM MODE --- */}
      {gameMode === "sim" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="sim-panel">
          {/* Care controls & Stats Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {t.gameSimTitle}
                </span>
                <button
                  onClick={() => setGameMode("choose")}
                  className="text-xs text-gray-500 hover:text-gray-800 underline font-semibold"
                >
                  Back
                </button>
              </div>

              {/* Status Bars */}
              <div className="space-y-4 text-xs">
                {/* Health Bar */}
                <div className="space-y-1.5 bg-[#F9F6F0] p-3 rounded-2xl border border-orange-100/20">
                  <div className="flex justify-between font-bold text-gray-700">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> {t.gameHealth}
                    </span>
                    <span className="text-red-600 font-extrabold">{simHealth}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-100 shadow-inner">
                    <motion.div
                      className="h-full bg-red-500"
                      initial={{ width: "0%" }}
                      animate={{ width: `${simHealth}%` }}
                      transition={{ type: "spring", stiffness: 60 }}
                    />
                  </div>
                </div>

                {/* Soil Moisture Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-gray-600">
                    <span className="flex items-center gap-1">
                      <Droplet className="w-3.5 h-3.5 text-blue-500" /> {t.gameMoisture}
                    </span>
                    <span>{simMoisture}% (Target: 30-75)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        simMoisture < 30 || simMoisture > 75 ? "bg-red-400" : "bg-blue-500"
                      }`}
                      style={{ width: `${simMoisture}%` }}
                    />
                  </div>
                </div>

                {/* Sun Level Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-gray-600">
                    <span className="flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-yellow-500" /> {t.gameSunLevel}
                    </span>
                    <span>{simSun}% (Target: 30-75)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        simSun < 30 || simSun > 75 ? "bg-red-400" : "bg-yellow-500"
                      }`}
                      style={{ width: `${simSun}%` }}
                    />
                  </div>
                </div>

                {/* Soil Nutrients Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-gray-600">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-green-500" /> {t.gameNutrients}
                    </span>
                    <span>{simNutrients}% (Target: 30-80)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        simNutrients < 30 || simNutrients > 80 ? "bg-red-400" : "bg-green-500"
                      }`}
                      style={{ width: `${simNutrients}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Caretaking Buttons */}
            {simHealth > 0 && simHealth < 100 && (
              <div className="grid grid-cols-2 gap-3" id="sim-actions">
                <button
                  onClick={() => handleCareAction("water")}
                  className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-2xl border border-blue-100 text-xs font-bold transition-all flex items-center justify-center gap-1"
                >
                  <Droplet className="w-3.5 h-3.5" /> {t.gameCareWater}
                </button>
                <button
                  onClick={() => handleCareAction("sun")}
                  className="p-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 rounded-2xl border border-yellow-100 text-xs font-bold transition-all flex items-center justify-center gap-1"
                >
                  <Sun className="w-3.5 h-3.5" /> {t.gameCareSun}
                </button>
                <button
                  onClick={() => handleCareAction("fertilize")}
                  className="p-3 bg-green-50 hover:bg-green-100 text-green-800 rounded-2xl border border-green-100 text-xs font-bold transition-all flex items-center justify-center gap-1"
                >
                  <Sprout className="w-3.5 h-3.5" /> {t.gameCareFertilizer}
                </button>
                <button
                  onClick={() => handleCareAction("prune")}
                  className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-2xl border border-purple-100 text-xs font-bold transition-all flex items-center justify-center gap-1"
                >
                  ✂️ {t.gameCarePrune}
                </button>
              </div>
            )}
          </div>

          {/* Visualization Sprout Column */}
          <div className="lg:col-span-7 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-6 min-h-[420px]" id="sim-view-card">
            {/* Health / Status Sign */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                {t.gameSeedlingStatus}
              </span>
              <div className="text-sm font-bold text-gray-700 flex items-center justify-center gap-1.5">
                {simHealth <= 0 ? (
                  <Skull className="w-4 h-4 text-gray-500" />
                ) : (
                  <Activity className="w-4 h-4 text-[#3B6640] animate-pulse" />
                )}
                {getSimStatusText()}
              </div>
            </div>

            {/* Simulated Canvas visualization */}
            <div className="w-44 h-44 rounded-full bg-gradient-to-b from-blue-50/40 to-green-50/40 border border-gray-100 flex items-center justify-center shadow-inner relative overflow-hidden">
              <AnimatePresence mode="wait">
                {simHealth <= 0 ? (
                  <motion.div
                    key="dead-state"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-4xl"
                  >
                    💀🍂
                  </motion.div>
                ) : simStage === "seed" ? (
                  <motion.div
                    key="seed-state"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl"
                  >
                    🟤
                  </motion.div>
                ) : simStage === "sprout" ? (
                  <motion.div
                    key="sprout-state"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-6xl animate-bounce"
                  >
                    🌱
                  </motion.div>
                ) : simStage === "growing" ? (
                  <motion.div
                    key="growing-state"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-6xl"
                  >
                    🪴
                  </motion.div>
                ) : (
                  <motion.div
                    key="mature-state"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-7xl flex flex-col items-center justify-center relative"
                  >
                    <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-4 -right-2 animate-pulse" />
                    <span>🌸✨</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Moisture status visuals */}
              {simMoisture > 75 && (
                <div className="absolute inset-x-0 bottom-0 bg-blue-500/20 h-8 backdrop-blur-[1px]" />
              )}
            </div>

            {/* Plant Stage Info */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                {t.gameSproutStage}
              </p>
              <p className="text-base font-black text-[#1E3F20]">
                {getSimStageName()}
              </p>
            </div>

            {/* Interactive Narrative Log */}
            {simLogs && (
              <div className="p-3 bg-[#F9F6F0] rounded-2xl border border-orange-100/30 text-xs italic text-gray-600 leading-normal max-w-sm">
                "{simLogs}"
              </div>
            )}

            {/* Sim completed / Reset button */}
            {(simHealth <= 0 || simHealth >= 100) && (
              <button
                onClick={handleResetSim}
                className="px-6 py-2 bg-[#3B6640] hover:bg-[#1E3F20] text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                {t.gameResetSim}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
