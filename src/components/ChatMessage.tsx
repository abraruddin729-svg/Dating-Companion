import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Heart,
  User,
  CloudSun,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Droplets,
  Wind,
  Thermometer,
} from "lucide-react";
import { Message } from "../types";

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [showToolDetails, setShowToolDetails] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`group flex gap-3.5 my-4 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
          isUser
            ? "bg-stone-800 text-white"
            : "bg-gradient-to-tr from-rose-500 to-pink-500 text-white"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Heart className="w-4 h-4 fill-current" />}
      </div>

      {/* Message Body & Metadata */}
      <div className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        {/* Tool Execution Card (if companion invoked get_current_weather) */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-2 w-full rounded-2xl border border-rose-200/80 bg-rose-50/70 p-3 shadow-xs">
            {message.toolCalls.map((call, idx) => {
              const res = call.result;
              return (
                <div key={idx}>
                  <div
                    onClick={() => setShowToolDetails(!showToolDetails)}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                        <CloudSun className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-rose-950">
                        Function Tool: <code className="font-mono text-[11px] bg-rose-100/80 px-1 py-0.5 rounded text-rose-800">get_current_weather</code>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-rose-700 font-medium">
                      <span>{res?.location || call.args?.location}</span>
                      {showToolDetails ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </div>

                  {showToolDetails && res && (
                    <div className="mt-2.5 pt-2 border-t border-rose-200/50 flex flex-wrap gap-2 text-[11px] text-stone-700">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-rose-200 text-rose-800 font-medium">
                        <Thermometer className="w-3 h-3 text-rose-500" />
                        {res.temperature}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-rose-200 capitalize">
                        <CloudSun className="w-3 h-3 text-amber-500" />
                        {res.sky_conditions}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-rose-200">
                        <Droplets className="w-3 h-3 text-sky-500" />
                        {res.humidity} humidity
                      </span>
                      {res.wind && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-rose-200">
                          <Wind className="w-3 h-3 text-stone-400" />
                          {res.wind}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-rose-600 text-white rounded-tr-xs shadow-xs"
              : "bg-white text-stone-900 border border-stone-100 rounded-tl-xs shadow-xs"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-stone prose-p:my-2 prose-headings:my-2 prose-headings:font-semibold prose-headings:text-stone-900 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-stone-900">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Bottom meta & actions */}
        <div className="flex items-center gap-2 mt-1 px-1 text-[11px] text-stone-400">
          <span>{formattedTime}</span>
          {!isUser && (
            <button
              onClick={handleCopy}
              className="hover:text-stone-700 transition-colors p-0.5"
              title="Copy message"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
