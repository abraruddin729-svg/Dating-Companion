import React, { useState } from "react";
import { MapPin, Navigation, Check, X, Thermometer, Wind, Droplets } from "lucide-react";
import { WeatherMetrics } from "../types";

interface WeatherWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: string;
  weather: WeatherMetrics | null;
  onSelectLocation: (location: string) => void;
}

const PRESET_CITIES = [
  "Hyderabad, IN",
  "London, UK",
  "New York, US",
  "Paris, FR",
  "Tokyo, JP",
  "Chicago, US",
  "San Francisco, US",
  "Sydney, AU",
];

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  isOpen,
  onClose,
  currentLocation,
  weather,
  onSelectLocation,
}) => {
  const [customInput, setCustomInput] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      onSelectLocation(customInput.trim());
      setCustomInput("");
      onClose();
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${lat},${lon}&count=1`
          );
          // Reverse geocode via open-meteo or bigdatacloud free client
          const reverseRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
          );
          const revData = await reverseRes.json();
          if (revData.city || revData.locality) {
            const locName = `${revData.city || revData.locality}, ${revData.countryCode || ""}`.trim();
            onSelectLocation(locName);
            onClose();
          } else {
            onSelectLocation("London, UK");
            onClose();
          }
        } catch {
          onSelectLocation("London, UK");
          onClose();
        } finally {
          setIsDetecting(false);
        }
      },
      () => {
        setIsDetecting(false);
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-stone-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-sm">Select Your Location</h3>
              <p className="text-xs text-stone-500">
                Companion adapts dating advice to this city's weather
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Weather Card Preview if available */}
        {weather && (
          <div className="my-4 p-3.5 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-rose-700 uppercase tracking-wide">
                  Active City Weather
                </p>
                <h4 className="text-base font-semibold text-stone-900 mt-0.5">
                  {weather.location}
                </h4>
                <p className="text-xs text-stone-600 capitalize mt-0.5">
                  {weather.sky_conditions}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-stone-900 tracking-tight">
                  {weather.temperature.split(" ")[0]}
                </span>
                {weather.feels_like && (
                  <p className="text-[11px] text-stone-500">
                    Feels {weather.feels_like}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-rose-200/60 flex items-center gap-4 text-xs text-stone-600">
              <span className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-sky-500" />
                {weather.humidity}
              </span>
              {weather.wind && (
                <span className="flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-stone-400" />
                  {weather.wind}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Custom Input Form */}
        <form onSubmit={handleCustomSubmit} className="mt-4">
          <label className="block text-xs font-medium text-stone-700 mb-1.5">
            Type city or country code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Kyoto, JP or Berlin, DE"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
            <button
              type="submit"
              disabled={!customInput.trim()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition-colors shrink-0"
            >
              Set
            </button>
          </div>
        </form>

        {/* Popular Cities */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-500">Popular Dating Hubs</span>
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isDetecting}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium"
            >
              <Navigation className="w-3 h-3" />
              {isDetecting ? "Detecting..." : "Auto-detect"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_CITIES.map((city) => {
              const isSelected =
                currentLocation.toLowerCase().includes(city.split(",")[0].toLowerCase());
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    onSelectLocation(city);
                    onClose();
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left border transition-all ${
                    isSelected
                      ? "bg-rose-50 text-rose-900 border-rose-300 font-semibold"
                      : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200/70"
                  }`}
                >
                  <span className="truncate">{city}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-rose-600 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
