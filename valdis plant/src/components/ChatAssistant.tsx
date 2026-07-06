import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  Sprout,
  User,
  Trash2,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Lightbulb,
  CornerDownRight,
  BookOpen,
} from "lucide-react";
import { ChatMessage, SavedPlant } from "../types";
import { Language, translations } from "../utils/translations";

interface ChatAssistantProps {
  lang: Language;
  savedPlants: SavedPlant[];
}

const QUICK_PROMPTS_EN = [
  "Why are my monstera leaves turning yellow?",
  "How do I correctly propagate spider plants?",
  "Best high-drainage soil mixture recipe?",
  "How to treat spider mites organically?",
];

const QUICK_PROMPTS_ID = [
  "Mengapa daun monstera saya menguning?",
  "Bagaimana cara memperbanyak tanaman laba-laba?",
  "Resep campuran tanah berdrainase tinggi terbaik?",
  "Cara membasmi tungau laba-laba secara organik?",
];

export default function ChatAssistant({ lang, savedPlants }: ChatAssistantProps) {
  const t = translations[lang];
  const quickPrompts = lang === "en" ? QUICK_PROMPTS_EN : QUICK_PROMPTS_ID;

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Initialize welcome message when language changes
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        sender: "assistant",
        text: lang === "en"
          ? "Hi there! I'm **Plant Doc**, your digital horticulturist companion. Ask me any gardening questions, ask for pruning tips, diagnose symptoms, or learn how to propagate specimens! How can I assist you today?"
          : "Halo! Saya **Dokter Tanaman**, asisten botani digital Anda. Tanyakan saya pertanyaan berkebun apa saja, tips pemangkasan, diagnosis gejala, atau pelajari cara memperbanyak tanaman! Bagaimana saya bisa membantu Anda hari ini?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [lang]);
  const [inputText, setInputText] = useState("");
  const [selectedPlantContext, setSelectedPlantContext] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    if (!textToSend) setInputText("");

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((msg) => ({
            sender: msg.sender,
            text: msg.text,
          })),
          plantContext: selectedPlantContext || undefined,
          lang,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      const botMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        sender: "assistant",
        text: data.text || "I'm sorry, I couldn't formulate a response. Could you try rephrasing your question?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error("Chat API error:", err);
      const botErrorMessage: ChatMessage = {
        id: `${Date.now()}-assistant-error`,
        sender: "assistant",
        text: `**System Error:** ${err.message || "Failed to contact Plant Doc. Check your network or API secrets config."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botErrorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: "welcome-reset",
        sender: "assistant",
        text: lang === "en"
          ? "Reset complete! I'm **Plant Doc** again. Feel free to ask more gardening or plant questions."
          : "Reset selesai! Saya **Dokter Tanaman** kembali. Silakan ajukan pertanyaan seputar tanaman Anda.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setSelectedPlantContext("");
  };

  // Helper to safely render simple markdown text into paragraphs/lists
  const renderMessageContent = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      let content = line;

      // Handle bullet lists
      const isBullet = content.trim().startsWith("* ") || content.trim().startsWith("- ");
      if (isBullet) {
        content = content.replace(/^[\s*-]+/, "").trim();
      }

      // Handle simple bold tags (e.g. **text**)
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index));
        }
        parts.push(
          <strong key={match.index} className="font-bold text-gray-900">
            {match[1]}
          </strong>
        );
        lastIndex = boldRegex.lastIndex;
      }

      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }

      const elementContent = parts.length > 0 ? parts : content;

      if (isBullet) {
        return (
          <li key={lineIdx} className="ml-4 list-disc text-xs text-gray-700 leading-relaxed mb-1">
            {elementContent}
          </li>
        );
      }

      return (
        <p key={lineIdx} className="text-xs text-gray-700 leading-relaxed mb-2 last:mb-0">
          {elementContent}
        </p>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" id="chat-view-container">
      {/* Top Header Block */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white border border-gray-100 rounded-3xl p-5 shadow-sm gap-4" id="chat-header-bar">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E8EFE9] text-[#3B6640] flex items-center justify-center shadow-inner">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1E3F20] flex items-center gap-1">
              {lang === "en" ? "Ask Plant Doc AI" : "Tanya Dokter Tanaman AI"} <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-yellow-100" />
            </h2>
            <p className="text-[11px] text-gray-400">{lang === "en" ? "Expert Horticulturist chatbot online" : "Asisten ahli botani online"}</p>
          </div>
        </div>

        {/* Dynamic Context selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
          {savedPlants.length > 0 && (
            <div className="flex items-center gap-1.5" id="chat-context-selectors">
              <span className="text-[10px] uppercase font-bold text-gray-400">{lang === "en" ? "Context:" : "Konteks:"}</span>
              <select
                value={selectedPlantContext}
                onChange={(e) => setSelectedPlantContext(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-[#F9F6F0] border border-orange-100/30 rounded-xl text-gray-700 focus:outline-none focus:border-[#3B6640]"
              >
                <option value="">{lang === "en" ? "-- General Care --" : "-- Perawatan Umum --"}</option>
                {savedPlants.map((plant) => (
                  <option key={plant.id} value={plant.nickname || plant.commonName}>
                    {plant.nickname || plant.commonName} ({plant.botanicalName})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleClearHistory}
            className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
            title={lang === "en" ? "Clear Chat History" : "Hapus Riwayat Chat"}
            id="btn-clear-chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Automated Prompt Buttons */}
        <div className="lg:col-span-4 space-y-4" id="chat-suggested-prompts">
          <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-3 shadow-sm">
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> {lang === "en" ? "Quick Diagnostic FAQs:" : "FAQ Diagnosis Cepat:"}
            </h4>
            <div className="space-y-2 flex flex-col">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={loading}
                  className="w-full text-left p-3 rounded-2xl bg-[#F9F6F0] hover:bg-orange-50 text-gray-700 hover:text-[#3B6640] text-xs font-semibold leading-relaxed border border-orange-100/10 transition-colors flex gap-1.5 items-start"
                >
                  <CornerDownRight className="w-3 h-3 text-[#3B6640] shrink-0 mt-0.5" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedPlantContext && (
            <div className="bg-[#E8EFE9] border border-[#D0DFD3] rounded-3xl p-5 text-xs text-[#1E3F20]" id="active-context-hint">
              <h5 className="font-bold flex items-center gap-1 mb-1">
                <Lightbulb className="w-3.5 h-3.5 text-[#3B6640]" /> {lang === "en" ? "Active Context Locked" : "Konteks Aktif Terkunci"}
              </h5>
              <p className="leading-relaxed">
                {lang === "en" ? (
                  <>
                    You have locked <strong>"{selectedPlantContext}"</strong> as active focus. Future responses will tailor diagnosis and watering suggestions for this specimen.
                  </>
                ) : (
                  <>
                    Anda telah mengunci <strong>"{selectedPlantContext}"</strong> sebagai fokus aktif. Jawaban berikutnya akan disesuaikan khusus untuk spesimen ini.
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Chat Screen Panel */}
        <div className="lg:col-span-8 bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[520px]" id="chat-messages-panel">
          {/* Conversation Screen */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
            {messages.map((msg) => {
              const isBot = msg.sender === "assistant";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${isBot ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                  id={`chat-msg-${msg.id}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-inner ${
                      isBot ? "bg-white border-green-100 text-[#3B6640]" : "bg-[#3B6640] border-transparent text-white"
                    }`}
                  >
                    {isBot ? <Sprout className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Bubble */}
                  <div className="space-y-1">
                    <div
                      className={`p-3 rounded-2xl shadow-sm text-xs ${
                        isBot ? "bg-white text-gray-800 rounded-tl-none border border-gray-100" : "bg-[#3B6640] text-white rounded-tr-none"
                      }`}
                    >
                      {isBot ? (
                        <div className="space-y-1">{renderMessageContent(msg.text)}</div>
                      ) : (
                        <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                      )}
                    </div>
                    <p className={`text-[9px] text-gray-400 px-1 ${isBot ? "text-left" : "text-right"}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Waiting/Typing status */}
            {loading && (
              <div className="flex gap-3 mr-auto max-w-[85%] items-center" id="chat-bot-typing-indicator">
                <div className="w-8 h-8 rounded-xl bg-white border border-green-100 text-[#3B6640] flex items-center justify-center shadow-inner animate-pulse">
                  <Sprout className="w-4 h-4" />
                </div>
                <div className="bg-white px-4 py-2.5 rounded-2xl rounded-tl-none border border-gray-100 flex items-center gap-1.5 shadow-sm text-xs text-gray-500">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#3B6640]" />
                  <span>{lang === "en" ? "Plant Doc is typing a reply..." : "Dokter Tanaman sedang mengetik balasan..."}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Form panel */}
          <div className="p-4 bg-white border-t border-gray-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder={
                  selectedPlantContext
                    ? (lang === "en" ? `Ask about "${selectedPlantContext}"...` : `Tanya tentang "${selectedPlantContext}"...`)
                    : (lang === "en" ? "Type custom plant care question here..." : "Ketik pertanyaan perawatan tanaman di sini...")
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={loading}
                className="flex-1 text-xs px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#3B6640] focus:bg-white transition-all placeholder:text-gray-400"
              />
              <button
                type="submit"
                id="btn-send-message"
                disabled={!inputText.trim() || loading}
                className="px-4 bg-[#3B6640] hover:bg-[#1E3F20] disabled:bg-gray-100 disabled:text-gray-300 text-white rounded-2xl transition-colors shadow-sm flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
