import React from "react";
import { Heart, CloudSun, RotateCcw, MapPin, Sparkles } from "lucide-react";
import { WeatherMetrics } from "../types";

interface HeaderProps {
  currentLocation: string;
  weather: WeatherMetrics | null;
  isLoadingWeather: boolean;
  onOpenLocationPicker: () => void;
  onResetChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLocation,
  weather,
  isLoadingWeather,
  onOpenLocationPicker,
  onResetChat,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-rose-100 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Companion Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center text-white shadow-xs shrink-0">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-stone-900 tracking-tight truncate">
                Dating Companion
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Weather-Aware
              </span>
            </div>
            <p className="text-xs text-stone-500 truncate">
              Adaptive date plans & human-like conversational queries
            </p>
          </div>
        </div>

        {/* Right actions: Weather pill & Reset */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Weather & Location Pill */}
          <button
            type="button"
            onClick={onOpenLocationPicker}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200/70 text-rose-900 transition-colors cursor-pointer"
            title="Click to change your local city"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="max-w-[100px] sm:max-w-[130px] truncate">
              {weather?.location || currentLocation}
            </span>
            {isLoadingWeather ? (
              <span className="text-stone-400 animate-pulse">...</span>
            ) : weather ? (
              <span className="flex items-center gap-1 font-semibold text-rose-700 border-l border-rose-200 pl-2">
                <CloudSun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                {weather.temperature.split(" ")[0]}
              </span>
            ) : null}
          </button>

          {/* Reset Chat button */}
          <button
            type="button"
            onClick={onResetChat}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            title="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
