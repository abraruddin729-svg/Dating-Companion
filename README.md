# Dating App Companion

An intelligent, weather-aware dating app companion built with React, TypeScript, Tailwind CSS, Express, and the Gemini API.

The companion follows a dedicated conversational persona: it checks local weather conditions first using the declared `get_current_weather` function tool, then intelligently adapts its date ideas, outfit recommendations, and conversational icebreakers to the real environment outside.

---

## 🌟 Persona & Function Tool

### System Instructions
> *"You are an intelligent dating app companion. Check local weather using your function tool first, then adapt human-like queries accordingly."*

### Tool Specification
* **Function Name:** `get_current_weather`
* **Parameters:**
  * `location` (string): The target city and country code (e.g., `"Hyderabad, IN"`, `"London, UK"`, `"New York, US"`).
* **Returned Metrics:**
  * `temperature`: Formatted temperature in Celsius and Fahrenheit
  * `sky_conditions`: Detailed sky condition description
  * `humidity`: Percentage humidity
  * `wind`: Wind speed
  * `feels_like`: Apparent temperature

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <your-repository-url>
cd <repository-folder>
npm install
```

### 3. Environment Configuration
Copy the `.env.example` file to create a local `.env`:
```bash
cp .env.example .env
```

Set your environment variables in `.env`:
```env
# Required for Gemini AI responses
GEMINI_API_KEY="your_gemini_api_key_here"

# Application URL (default: http://localhost:3000)
APP_URL="http://localhost:3000"

# Optional: OpenWeatherMap API key (built-in Open-Meteo fallback is active by default)
OPENWEATHER_API_KEY="your_openweather_api_key_here"
```

### 4. Running the Application

#### Development Mode:
Starts the Express API server with Vite middleware on port 3000:
```bash
npm run dev
```
Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

#### Production Build:
Builds the Vite client bundle and bundles the server using esbuild:
```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
├── index.html                  # Root HTML entry point
├── metadata.json               # Application metadata and permissions
├── package.json                # Project dependencies and run scripts
├── package-lock.json           # Standard npm dependency lockfile
├── server.ts                   # Express server, Gemini API & weather function tooling
├── src/
│   ├── App.tsx                 # Main dating companion chat view & state
│   ├── main.tsx                # React entry point
│   ├── index.css               # Global styles with Tailwind CSS
│   ├── types.ts                # TypeScript interfaces and types
│   └── components/
│       ├── Header.tsx          # Navigation header with live weather status pill
│       ├── ChatMessage.tsx     # Message rendering & tool call visualizer
│       ├── WeatherWidget.tsx   # City switcher modal & forecast summary
│       └── PromptSuggestions.tsx # Contextual prompt chips
├── dating-app-companion/       # Standalone HTML/CSS/JS reference implementation
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── README.md
├── .env.example                # Environment variables template (placeholders only)
├── .gitignore                  # Git exclusions
├── tsconfig.json               # TypeScript compiler configuration
└── vite.config.ts              # Vite configuration
```

---

## 🛡️ Security & Privacy
* No private credentials or live API keys are committed to the repository.
* The backend proxies all Gemini and external API requests server-side.
* Includes graceful zero-credential fallback to Open-Meteo when `OPENWEATHER_API_KEY` is not provided.
