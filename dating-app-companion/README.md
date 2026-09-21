# Dating App Companion

An intelligent dating app companion that checks local weather using a function tool first, then adapts human-like conversational queries and recommendations accordingly.

## System Instructions & Persona

> **Persona:**  
> *"You are an intelligent dating app companion. Check local weather using your function tool first, then adapt human-like queries accordingly."*

## Function Tool Specification

The companion uses the following function declaration to query real-time environmental metrics before formulating dating advice:

* **Function Name:** `get_current_weather`
* **Parameters:**
  * `location` (string): The target city and optional country code (e.g., `"Hyderabad, IN"`, `"London, UK"`, `"New York, US"`).
* **Return Value:**
  * `temperature`: Formatted temperature in Celsius and Fahrenheit (e.g. `32°C (90°F)`).
  * `sky_conditions`: Detailed sky description (e.g. `broken clouds`, `clear sky`, `light rain`).
  * `humidity`: Percentage humidity (e.g. `60%`).
  * `wind`: Wind velocity (e.g. `4.63 m/s`).
  * `feels_like`: Apparent temperature accounting for humidity.

## Weather Integration & API Key Configuration

* Supports OpenWeatherMap via the `OPENWEATHER_API_KEY` environment variable.
* Features automatic zero-configuration fallback to Open-Meteo to guarantee high availability without requiring any API key.

## Project Structure

```
dating-app-companion/
├── index.html       # Semantic HTML5 chat interface with weather pills & quick prompts
├── style.css        # Clean, modern styling with warm rose/slate palette
├── script.js        # Implements get_current_weather and adaptive conversation loop
├── README.md        # Architecture, persona, and setup documentation
└── .gitignore       # Git exclusion rules
```

## Features

1. **Weather Tool Visualizer**: Displays transparent tool invocation cards in the chat stream showing live temperature, humidity, sky conditions, and wind speed.
2. **Context-Aware Recommendations**: Generates tailored date spots (air-conditioned lounges, rooftop bars, cozy coffee shops, or outdoor walks) suited to the live weather.
3. **Quick Starters**: One-click prompt chips for date plans, outfit suggestions, witty weather-based icebreakers, and evening hangouts.
4. **City Selector**: Easily switch between preset cities (Hyderabad, London, New York, Paris, Tokyo, etc.) or input any custom city globally.
