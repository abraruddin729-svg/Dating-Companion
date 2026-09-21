import React from "react";
import { Sparkles, Umbrella, Shirt, MessageSquareHeart, Coffee } from "lucide-react";
import { QuickPrompt } from "../types";

interface PromptSuggestionsProps {
  onSelectPrompt: (promptText: string) => void;
  currentCity: string;
}

const PROMPTS: QuickPrompt[] = [
  {
    id: "date-plan",
    title: "Weather-Adaptive Date",
    prompt: "Can you recommend a romantic first date idea suited to today's local weather?",
    category: "date_idea",
    iconName: "Umbrella",
  },
  {
    id: "outfit",
    title: "What to Wear",
    prompt: "What outfit should I wear for our casual coffee date considering the current temperature and conditions?",
    category: "outfit",
    iconName: "Shirt",
  },
  {
    id: "icebreakers",
    title: "Witty Icebreakers",
    prompt: "Give me 3 charming icebreaker openers that reference today's weather in an effortless, cute way.",
    category: "conversation",
    iconName: "MessageSquareHeart",
  },
  {
    id: "evening",
    title: "Evening Hangout",
    prompt: "Plan a spontaneous evening date with dinner and drinks that fits tonight's local forecast.",
    category: "vibes",
    iconName: "Coffee",
  },
];

export const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
  onSelectPrompt,
  currentCity,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Umbrella":
        return <Umbrella className="w-3.5 h-3.5 text-rose-500" />;
      case "Shirt":
        return <Shirt className="w-3.5 h-3.5 text-amber-500" />;
      case "MessageSquareHeart":
        return <MessageSquareHeart className="w-3.5 h-3.5 text-pink-500" />;
      case "Coffee":
        return <Coffee className="w-3.5 h-3.5 text-orange-500" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-rose-500" />;
    }
  };

  return (
    <div className="py-2">
      <p className="text-[11px] font-medium text-stone-500 mb-2 flex items-center gap-1.5 px-1">
        <Sparkles className="w-3 h-3 text-rose-500" />
        Quick starters for {currentCity}:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {PROMPTS.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectPrompt(item.prompt)}
            className="flex items-center gap-2.5 p-2.5 rounded-xl text-left bg-white hover:bg-rose-50/60 border border-stone-200/70 hover:border-rose-200 text-stone-800 text-xs transition-all cursor-pointer shadow-2xs group"
          >
            <div className="w-7 h-7 rounded-lg bg-stone-50 group-hover:bg-rose-100 flex items-center justify-center shrink-0 transition-colors">
              {getIcon(item.iconName)}
            </div>
            <div className="min-w-0">
              <span className="font-medium text-stone-900 block truncate">
                {item.title}
              </span>
              <span className="text-[11px] text-stone-500 block truncate">
                {item.prompt}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
