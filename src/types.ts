export interface WeatherMetrics {
  location: string;
  temperature: string;
  temperature_c?: number;
  temperature_f?: number;
  sky_conditions: string;
  condition_main?: string;
  humidity: string;
  wind?: string;
  feels_like?: string;
  source?: string;
}

export interface ToolCallExecution {
  name: string;
  args: {
    location?: string;
    [key: string]: any;
  };
  result: WeatherMetrics;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  toolCalls?: ToolCallExecution[];
  weather?: WeatherMetrics | null;
}

export interface QuickPrompt {
  id: string;
  title: string;
  prompt: string;
  category: "date_idea" | "outfit" | "conversation" | "vibes";
  iconName: string;
}
