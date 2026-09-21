import React, { useState, useEffect, useRef } from "react";
import { Send, Sparkles, AlertCircle, CloudSun, MapPin, Loader2 } from "lucide-react";
import { Message, WeatherMetrics } from "./types";
import { Header } from "./components/Header";
import { ChatMessage } from "./components/ChatMessage";
import { WeatherWidget } from "./components/WeatherWidget";
import { PromptSuggestions } from "./components/PromptSuggestions";

const INITIAL_MESSAGE: Message = {
  id: "welcome-msg",
  role: "assistant",
  content:
    "Hello! I'm your intelligent dating app companion. Before suggesting date spots, styling advice, or conversation openers, I check your local weather to adapt my recommendations so everything feels natural and fits the vibe outside.\n\nWhere are you planning your date, or what kind of vibe are you looking for today?",
  timestamp: Date.now(),
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState("");
  const [currentLocation, setCurrentLocation] = useState("Hyderabad, IN");
  const [currentWeather, setCurrentWeather] = useState<WeatherMetrics | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Fetch current weather for the active city
  const fetchActiveWeather = async (loc: string) => {
    try {
      setIsLoadingWeather(true);
      const res = await fetch(`/api/weather?location=${encodeURIComponent(loc)}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentWeather(data);
      }
    } catch (err) {
      console.error("Failed to load header weather:", err);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  useEffect(() => {
    fetchActiveWeather(currentLocation);
  }, [currentLocation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    setErrorMessage(null);
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText("");
    setIsSending(true);

    try {
      // Prepare payload for backend with persona and function tools
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          userLocation: currentLocation,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        let cleanMsg = errData.error || `Server responded with status ${res.status}`;
        try {
          if (typeof cleanMsg === "string" && cleanMsg.includes('{"error":')) {
            const parsed = JSON.parse(cleanMsg.slice(cleanMsg.indexOf("{")));
            cleanMsg = parsed.error?.message || cleanMsg;
          }
        } catch {
          // keep original
        }
        throw new Error(cleanMsg);
      }

      const data = await res.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: Date.now(),
        toolCalls: data.toolCalls,
        weather: data.weather,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If the tool updated weather for a location, refresh current weather view
      if (data.weather?.temperature) {
        setCurrentWeather(data.weather);
      }
    } catch (err: any) {
      console.error("Failed to send message:", err);
      setErrorMessage(
        err.message || "Failed to reach the companion. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        ...INITIAL_MESSAGE,
        timestamp: Date.now(),
      },
    ]);
    setErrorMessage(null);
  };

  return (
    <div className="flex flex-col h-screen bg-stone-50 font-sans text-stone-900">
      {/* Top Header with branding and live weather status pill */}
      <Header
        currentLocation={currentLocation}
        weather={currentWeather}
        isLoadingWeather={isLoadingWeather}
        onOpenLocationPicker={() => setIsLocationPickerOpen(true)}
        onResetChat={handleResetChat}
      />

      {/* Main Conversation Area */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex flex-col justify-between min-h-full">
          {/* Chat Stream */}
          <div>
            {/* Context Notice Card */}
            <div className="mb-4 p-3 rounded-2xl bg-white/80 border border-stone-200/60 shadow-2xs flex items-center justify-between gap-3 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span>
                  Active dating companion persona with real-time weather tool calling
                </span>
              </div>
              <button
                onClick={() => setIsLocationPickerOpen(true)}
                className="text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <MapPin className="w-3 h-3" />
                <span>{currentLocation}</span>
              </button>
            </div>

            {/* Messages list */}
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {/* Loading Indicator */}
            {isSending && (
              <div className="flex gap-3 my-4 animate-in fade-in">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white border border-rose-100 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-stone-600 shadow-xs flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                  <span>Checking weather conditions & adapting dating advice...</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="my-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-medium transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Starters shown when chat has only the welcome message */}
          {messages.length === 1 && (
            <div className="mt-6 mb-2">
              <PromptSuggestions
                currentCity={currentLocation}
                onSelectPrompt={(text) => handleSendMessage(text)}
              />
            </div>
          )}
        </div>
      </main>

      {/* Input Footer */}
      <footer className="bg-white border-t border-stone-200/80 p-4 shrink-0">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-rose-200 focus-within:border-rose-400 transition-all shadow-xs"
          >
            {/* Location quick badge inside input bar */}
            <button
              type="button"
              onClick={() => setIsLocationPickerOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-stone-200 text-[11px] font-medium text-stone-700 hover:text-rose-700 hover:border-rose-200 transition-colors shrink-0 cursor-pointer"
              title="Change active location"
            >
              <MapPin className="w-3 h-3 text-rose-500" />
              <span className="max-w-[80px] sm:max-w-[110px] truncate">{currentLocation}</span>
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask for date plans, icebreakers, or what to wear..."
              disabled={isSending}
              className="flex-1 bg-transparent px-2 py-1.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="w-9 h-9 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:hover:bg-rose-600 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              title="Send message"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
          <div className="flex items-center justify-between mt-1.5 px-2 text-[10px] text-stone-400">
            <span>Powered by Gemini & Weather Function Calling Tool</span>
            <span>Local weather is checked first to adapt recommendations</span>
          </div>
        </div>
      </footer>

      {/* Location Selector Modal */}
      <WeatherWidget
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        currentLocation={currentLocation}
        weather={currentWeather}
        onSelectLocation={(loc) => {
          setCurrentLocation(loc);
        }}
      />
    </div>
  );
}
