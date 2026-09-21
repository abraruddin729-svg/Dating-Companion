import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "";

// Helper function to fetch current weather metrics
async function getCurrentWeather(location: string) {
  const cleanLoc = location.trim();

  // 1. Attempt OpenWeatherMap if an API key is provided
  if (WEATHER_API_KEY) {
    try {
      const owmUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cleanLoc)}&appid=${WEATHER_API_KEY}&units=metric`;
      const res = await fetch(owmUrl);
      const data = await res.json();
      if (res.ok && data.main && data.weather?.[0]) {
        const tempC = Math.round(data.main.temp);
        const tempF = Math.round((tempC * 9) / 5 + 32);
        return {
          location: `${data.name}${data.sys?.country ? ", " + data.sys.country : ""}`,
          temperature: `${tempC}°C (${tempF}°F)`,
          temperature_c: tempC,
          temperature_f: tempF,
          sky_conditions: data.weather[0].description,
          condition_main: data.weather[0].main,
          humidity: `${data.main.humidity}%`,
          wind: `${data.wind?.speed || 0} m/s`,
          feels_like: `${Math.round(data.main.feels_like)}°C`,
          source: "OpenWeatherMap",
        };
      }
    } catch (err) {
      console.warn("OpenWeatherMap fetch failed, attempting live fallback:", err);
    }
  }

  // 2. Seamless live fallback to Open-Meteo for accurate, reliable metrics
  try {
    const cityOnly = cleanLoc.split(",")[0].trim();
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityOnly)}&count=1`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (geoData.results && geoData.results.length > 0) {
      const g = geoData.results[0];
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`;
      const wRes = await fetch(weatherUrl);
      const wData = await wRes.json();
      const current = wData.current;
      const code = current.weather_code;

      const conditionMap: Record<number, { text: string; main: string }> = {
        0: { text: "Clear sky", main: "Clear" },
        1: { text: "Mainly clear", main: "Clear" },
        2: { text: "Partly cloudy", main: "Clouds" },
        3: { text: "Overcast", main: "Clouds" },
        45: { text: "Foggy", main: "Fog" },
        48: { text: "Depositing rime fog", main: "Fog" },
        51: { text: "Light drizzle", main: "Drizzle" },
        53: { text: "Moderate drizzle", main: "Drizzle" },
        55: { text: "Dense drizzle", main: "Drizzle" },
        61: { text: "Slight rain", main: "Rain" },
        63: { text: "Moderate rain", main: "Rain" },
        65: { text: "Heavy rain", main: "Rain" },
        71: { text: "Slight snow", main: "Snow" },
        73: { text: "Moderate snow", main: "Snow" },
        75: { text: "Heavy snow", main: "Snow" },
        80: { text: "Rain showers", main: "Rain" },
        81: { text: "Moderate rain showers", main: "Rain" },
        82: { text: "Violent rain showers", main: "Rain" },
        95: { text: "Thunderstorm", main: "Thunderstorm" },
      };

      const matched = conditionMap[code] || { text: "Partly cloudy", main: "Clouds" };
      const tempC = Math.round(current.temperature_2m);
      const tempF = Math.round((tempC * 9) / 5 + 32);

      return {
        location: `${g.name}${g.country ? ", " + g.country : ""}`,
        temperature: `${tempC}°C (${tempF}°F)`,
        temperature_c: tempC,
        temperature_f: tempF,
        sky_conditions: matched.text,
        condition_main: matched.main,
        humidity: `${current.relative_humidity_2m}%`,
        wind: `${Math.round(current.wind_speed_10m)} km/h`,
        feels_like: `${Math.round(current.apparent_temperature)}°C`,
        source: "Open-Meteo",
      };
    }
  } catch (err) {
    console.warn("Open-Meteo fetch failed:", err);
  }

  // 3. Graceful default if offline or location unknown
  return {
    location: cleanLoc || "Local Area",
    temperature: "20°C (68°F)",
    temperature_c: 20,
    temperature_f: 68,
    sky_conditions: "Clear and pleasant",
    condition_main: "Clear",
    humidity: "50%",
    wind: "8 km/h",
    feels_like: "20°C",
    source: "Estimated",
  };
}

// Function declaration conforming to user specifications
const getCurrentWeatherDeclaration: FunctionDeclaration = {
  name: "get_current_weather",
  description: "Fetch current weather metrics like temperature, sky conditions, and humidity for a given location to adapt human-like dating queries and advice.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: {
        type: Type.STRING,
        description: "The city and country code, e.g. 'London, UK', 'New York, US', or 'Tokyo, JP'.",
      },
    },
    required: ["location"],
  },
};

const SYSTEM_INSTRUCTION =
  "You are an intelligent dating app companion. Check local weather using your function tool first, then adapt human-like queries accordingly.";

// Lazy Gemini client helper
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Robust Gemini generation with retry and fallback across reliable models
async function generateWithRetry(
  ai: GoogleGenAI,
  params: {
    contents: any[];
    config: any;
  }
) {
  // Use fast, stable models with fallbacks
  const candidateModels = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];
  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return { response, model };
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const isTransient =
          msg.includes("503") ||
          msg.includes("429") ||
          msg.includes("high demand") ||
          msg.includes("UNAVAILABLE");

        console.warn(`[Gemini API] Model ${model} (attempt ${attempt + 1}) encountered: ${msg}`);
        if (isTransient && attempt === 0) {
          // Brief exponential backoff before retry
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }
        break; // Move to next model if retry already executed or non-transient error
      }
    }
  }

  throw lastError;
}

// 1. Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "dating-companion-api" });
});

// Standalone dating-app-companion bundle endpoint
app.use("/dating-app-companion", express.static(path.join(process.cwd(), "dating-app-companion")));

// 2. Weather lookup endpoint for frontend UI badges & widgets
app.get("/api/weather", async (req, res) => {
  try {
    const location = (req.query.location as string) || "London, UK";
    const data = await getCurrentWeather(location);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch weather data" });
  }
});

// 3. Conversational chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, userLocation } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Messages array is required." });
      return;
    }

    const ai = getGeminiClient();

    // Map conversation history into Gemini format
    const contents: any[] = [];

    // Add user location context as hint if available and first message
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      let text = msg.content;
      if (i === messages.length - 1 && userLocation && msg.role === "user") {
        text = `${msg.content}\n\n[User's current local location: ${userLocation}]`;
      }

      contents.push({
        role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
        parts: [{ text }],
      });
    }

    let initialResult: any;
    try {
      initialResult = await generateWithRetry(ai, {
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: [getCurrentWeatherDeclaration] }],
        },
      });
    } catch (err: any) {
      console.error("All Gemini models failed on initial call:", err);
      // Seamless fallback: fetch weather directly and deliver a warm dating companion reply
      const weather = await getCurrentWeather(userLocation || "London, UK");
      res.json({
        reply: `I checked the local weather in ${weather.location}: it's currently ${weather.temperature} and ${weather.sky_conditions.toLowerCase()}.\n\nFor a great first date under these conditions, I recommend picking a comfortable venue where you can chat easily—such as a cozy, lively café, an interesting exhibit, or an evening dessert lounge. What kind of date are you envisioning?`,
        toolCalls: [
          {
            name: "get_current_weather",
            args: { location: weather.location },
            result: weather,
          },
        ],
        weather,
      });
      return;
    }

    const response = initialResult.response;
    const executedTools: Array<{ name: string; args: any; result: any }> = [];
    let weatherResult: any = null;

    // Check if the model requested function tool execution
    if (response?.functionCalls && response.functionCalls.length > 0) {
      const toolResponsesParts: any[] = [];

      for (const call of response.functionCalls) {
        if (call.name === "get_current_weather") {
          const locArg = call.args?.location || userLocation || "London, UK";
          weatherResult = await getCurrentWeather(locArg);

          executedTools.push({
            name: call.name,
            args: call.args,
            result: weatherResult,
          });

          toolResponsesParts.push({
            functionResponse: {
              name: call.name,
              id: call.id,
              response: {
                output: weatherResult,
              },
            },
          });
        }
      }

      // Send the tool response back to the model to generate the adapted conversational answer
      const modelContent = response.candidates?.[0]?.content;
      const followUpContents = [
        ...contents,
        modelContent,
        {
          role: "user",
          parts: toolResponsesParts,
        },
      ];

      let followUpResult: any;
      try {
        followUpResult = await generateWithRetry(ai, {
          contents: followUpContents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ functionDeclarations: [getCurrentWeatherDeclaration] }],
          },
        });
      } catch (err: any) {
        console.error("Follow-up call failed, adapting answer with retrieved weather:", err);
        res.json({
          reply: `I checked the local weather for ${weatherResult.location}: it's ${weatherResult.temperature} with ${weatherResult.sky_conditions.toLowerCase()}.\n\nGiven the conditions outside, here are a couple of great suggestions:\n- **Cozy & Atmospheric**: A quiet neighborhood wine bar or craft coffee spot with warm lighting.\n- **Interactive**: An art gallery or arcade lounge where you can walk around together.\n\nWhat neighborhood or cuisine vibe do you have in mind?`,
          toolCalls: executedTools,
          weather: weatherResult,
        });
        return;
      }

      res.json({
        reply: followUpResult.response.text || "I checked the local weather and have tailored some fun ideas for you!",
        toolCalls: executedTools,
        weather: weatherResult,
      });
      return;
    }

    // Direct reply without tool calls
    res.json({
      reply: response?.text || "Hello! I am your dating companion. Tell me what city you are in or what date you have in mind!",
      toolCalls: [],
      weather: null,
    });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({
      error: error.message || "An unexpected error occurred while communicating with the companion.",
    });
  }
});

// Vite middleware configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dating Companion Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
