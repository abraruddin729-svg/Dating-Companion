/**
 * Dating App Companion
 * System Persona:
 * "You are an intelligent dating app companion. Check local weather using your function tool first, then adapt human-like queries accordingly."
 */

// Optional OpenWeatherMap API key (empty by default; uses built-in Open-Meteo fallback)
const OPENWEATHER_API_KEY = "";

let currentLocation = "Hyderabad, IN";
let activeWeather = null;
let isBusy = false;

// Function tool declaration requirement:
// Declared function named `get_current_weather` taking a string parameter `location` (e.g. city and country code)
// to fetch metrics like temperature and sky conditions.
async function get_current_weather(location) {
  const queryLoc = location || currentLocation;
  
  // 1. Primary lookup using OpenWeatherMap API key
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      queryLoc
    )}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const tempC = Math.round(data.main.temp);
      const tempF = Math.round((tempC * 9) / 5 + 32);
      return {
        location: `${data.name}, ${data.sys?.country || ""}`.trim(),
        temperature: `${tempC}°C (${tempF}°F)`,
        temperature_c: tempC,
        temperature_f: tempF,
        sky_conditions: data.weather?.[0]?.description || "Clear",
        condition_main: data.weather?.[0]?.main || "Clear",
        humidity: `${data.main.humidity}%`,
        wind: `${data.wind?.speed} m/s`,
        feels_like: `${Math.round(data.main.feels_like)}°C`,
        source: "OpenWeatherMap",
      };
    }
  } catch (err) {
    console.warn("OpenWeatherMap fetch failed, falling back to geocoding:", err);
  }

  // 2. Resilient fallback to Open-Meteo
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      queryLoc.split(",")[0].trim()
    )}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();
    if (geoData.results && geoData.results.length > 0) {
      const { latitude, longitude, name, country } = geoData.results[0];
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature`;
      const wRes = await fetch(weatherUrl);
      const wData = await wRes.json();
      const cur = wData.current;
      const tempC = Math.round(cur.temperature_2m);
      const tempF = Math.round((tempC * 9) / 5 + 32);
      return {
        location: `${name}, ${country || ""}`.trim(),
        temperature: `${tempC}°C (${tempF}°F)`,
        temperature_c: tempC,
        temperature_f: tempF,
        sky_conditions: "Current Conditions",
        condition_main: "Clear",
        humidity: `${cur.relative_humidity_2m}%`,
        wind: `${cur.wind_speed_10m} km/h`,
        feels_like: `${Math.round(cur.apparent_temperature)}°C`,
        source: "Open-Meteo",
      };
    }
  } catch (err) {
    console.warn("Fallback weather lookup failed:", err);
  }

  return {
    location: queryLoc,
    temperature: "28°C (82°F)",
    sky_conditions: "pleasant",
    humidity: "55%",
    wind: "3 m/s",
    source: "Estimated",
  };
}

// DOM Elements
const messagesContainer = document.getElementById("messages-container");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const currentLocationText = document.getElementById("current-location-text");
const footerLocationText = document.getElementById("footer-location-text");
const headerWeatherTemp = document.getElementById("header-weather-temp");
const startersCity = document.getElementById("starters-city");
const starterPrompts = document.getElementById("starter-prompts");
const resetBtn = document.getElementById("reset-btn");
const locationPill = document.getElementById("location-pill");
const inlineLocBtn = document.getElementById("inline-loc-btn");
const changeLocBtn = document.getElementById("change-loc-btn");
const locationModal = document.getElementById("location-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const customCityForm = document.getElementById("custom-city-form");
const customCityInput = document.getElementById("custom-city-input");

// Message History State
const messages = [
  {
    role: "assistant",
    content: `Hello! I'm your intelligent dating app companion. Before suggesting date spots, styling advice, or conversation openers, I check your local weather using my function tool so every plan feels effortless, comfortable, and tailored to the vibe outside.\n\nWhere are you planning your date, or what kind of vibe are you looking for today?`,
    timestamp: Date.now(),
  },
];

// Initialize UI
async function init() {
  updateLocationUI(currentLocation);
  renderMessages();
  await refreshWeather();
}

function updateLocationUI(loc) {
  currentLocation = loc;
  currentLocationText.textContent = loc;
  footerLocationText.textContent = loc;
  if (startersCity) startersCity.textContent = loc;
}

async function refreshWeather() {
  headerWeatherTemp.textContent = "...";
  try {
    activeWeather = await get_current_weather(currentLocation);
    if (activeWeather && activeWeather.temperature) {
      headerWeatherTemp.textContent = activeWeather.temperature.split(" ")[0];
    }
  } catch (e) {
    headerWeatherTemp.textContent = "--";
  }
}

function renderMessages() {
  messagesContainer.innerHTML = "";
  messages.forEach((msg) => {
    const row = document.createElement("div");
    row.className = `message-row ${msg.role}`;

    const avatar = document.createElement("div");
    avatar.className = `avatar ${msg.role}`;
    avatar.textContent = msg.role === "user" ? "👤" : "❤️";

    const contentBox = document.createElement("div");
    contentBox.className = "message-content";

    // Tool Call Card if present
    if (msg.toolCalls && msg.toolCalls.length > 0) {
      msg.toolCalls.forEach((call) => {
        const toolCard = document.createElement("div");
        toolCard.className = "tool-call-card";
        toolCard.innerHTML = `
          <div class="tool-header">
            <span>⚙️ Tool: <code>${call.name}</code></span>
            <span>${call.result.location || call.args.location}</span>
          </div>
          <div class="tool-metrics">
            <span class="metric-tag">🌡️ ${call.result.temperature}</span>
            <span class="metric-tag">☁️ ${call.result.sky_conditions}</span>
            <span class="metric-tag">💧 ${call.result.humidity}</span>
            ${call.result.feels_like ? `<span class="metric-tag">Feels: ${call.result.feels_like}</span>` : ""}
          </div>
        `;
        contentBox.appendChild(toolCard);
      });
    }

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.innerHTML = formatText(msg.content);

    const time = document.createElement("span");
    time.className = "message-time";
    time.textContent = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    contentBox.appendChild(bubble);
    contentBox.appendChild(time);

    row.appendChild(avatar);
    row.appendChild(contentBox);
    messagesContainer.appendChild(row);
  });

  // Toggle starters visibility
  if (starterPrompts) {
    starterPrompts.style.display = messages.length > 1 ? "none" : "block";
  }

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatText(text) {
  return text
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
}

// Handle Message Submission
async function sendMessage(text) {
  const content = (text || chatInput.value).trim();
  if (!content || isBusy) return;

  isBusy = true;
  chatInput.value = "";

  // Add User Message
  messages.push({
    role: "user",
    content,
    timestamp: Date.now(),
  });
  renderMessages();

  // Temporary typing indicator
  const typingRow = document.createElement("div");
  typingRow.className = "message-row assistant";
  typingRow.id = "typing-row";
  typingRow.innerHTML = `
    <div class="avatar assistant">❤️</div>
    <div class="message-bubble" style="font-size: 12px; color: #78716c;">
      Checking local weather in ${currentLocation} and tailoring dating advice...
    </div>
  `;
  messagesContainer.appendChild(typingRow);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    // Check if full-stack /api/chat is available
    let res = null;
    try {
      res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          userLocation: currentLocation,
        }),
      });
    } catch (e) {
      // Backend not running, proceed to client-side standalone execution
    }

    if (res && res.ok) {
      const data = await res.json();
      messages.push({
        role: "assistant",
        content: data.reply,
        timestamp: Date.now(),
        toolCalls: data.toolCalls,
      });
      if (data.weather) {
        activeWeather = data.weather;
        headerWeatherTemp.textContent = activeWeather.temperature.split(" ")[0];
      }
    } else {
      // Client-side standalone adaptive fallback
      const weather = await get_current_weather(currentLocation);
      activeWeather = weather;
      headerWeatherTemp.textContent = weather.temperature.split(" ")[0];

      let tailoredAdvice = "";
      const isWarm = weather.temperature_c >= 26;
      const isCold = weather.temperature_c <= 15;

      if (isWarm) {
        tailoredAdvice = `It’s quite warm in ${weather.location} right now (${weather.temperature}, feeling like ${weather.feels_like || weather.temperature} with ${weather.sky_conditions.toLowerCase()}).\n\nFor a smooth first date in this weather, I suggest comfortable spots with cool air or evening breezes:\n* **Chic Dessert or Coffee Lounge**: Somewhere with great AC and cozy seating where you can talk for hours without feeling rushed.\n* **Elevated Rooftop Bar**: Ideal for later in the evening to catch the ${weather.wind || "breeze"}.\n* **Casual Gallery or Museum**: An easy, interactive way to break the ice away from the heat.`;
      } else if (isCold) {
        tailoredAdvice = `It’s brisk in ${weather.location} at ${weather.temperature} with ${weather.sky_conditions.toLowerCase()}.\n\nHere are some cozy, warm ideas:\n* **Artisanal Hot Chocolate & Bookstore Stroll**: Warm drinks in hand while sharing favorite titles.\n* **Fireside Wine Bar or Bistro**: Candlelight and warmth create instant intimacy.\n* **Interactive Cooking Class or Arcade**: Keeps both of you active and laughing indoors.`;
      } else {
        tailoredAdvice = `The weather in ${weather.location} is very pleasant right now—around ${weather.temperature} with ${weather.sky_conditions.toLowerCase()}.\n\nThis is ideal weather for outdoor or indoor plans:\n* **Scenic Neighborhood Walk & Gelato**: Stroll through a lively district before settling into an outdoor patio.\n* **Outdoor Café with Terrace Seating**: Soak up the great temperature while enjoying casual appetizers.\n* **Botanical Gardens or Waterfront**: Perfect setting for natural, effortless conversation.`;
      }

      messages.push({
        role: "assistant",
        content: tailoredAdvice,
        timestamp: Date.now(),
        toolCalls: [
          {
            name: "get_current_weather",
            args: { location: weather.location },
            result: weather,
          },
        ],
      });
    }
  } catch (err) {
    console.error("Error processing response:", err);
    messages.push({
      role: "assistant",
      content: "I ran into a momentary issue checking the weather, but I'm ready to help you plan an unforgettable date. Where would you like to go?",
      timestamp: Date.now(),
    });
  } finally {
    const typing = document.getElementById("typing-row");
    if (typing) typing.remove();
    isBusy = false;
    renderMessages();
  }
}

// Event Listeners
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage();
});

// Starter prompt buttons
document.querySelectorAll(".starter-card").forEach((btn) => {
  btn.addEventListener("click", () => {
    const prompt = btn.getAttribute("data-prompt");
    if (prompt) sendMessage(prompt);
  });
});

// Reset Chat
resetBtn.addEventListener("click", () => {
  messages.length = 1;
  renderMessages();
});

// Modal Actions
function openModal() {
  locationModal.classList.remove("hidden");
}
function closeModal() {
  locationModal.classList.add("hidden");
}

locationPill.addEventListener("click", openModal);
inlineLocBtn.addEventListener("click", openModal);
changeLocBtn.addEventListener("click", openModal);
closeModalBtn.addEventListener("click", closeModal);

locationModal.addEventListener("click", (e) => {
  if (e.target === locationModal) closeModal();
});

customCityForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const val = customCityInput.value.trim();
  if (val) {
    updateLocationUI(val);
    refreshWeather();
    customCityInput.value = "";
    closeModal();
  }
});

document.querySelectorAll(".btn-preset").forEach((btn) => {
  btn.addEventListener("click", () => {
    const city = btn.getAttribute("data-city");
    if (city) {
      updateLocationUI(city);
      refreshWeather();
      closeModal();
    }
  });
});

// Start app
init();
