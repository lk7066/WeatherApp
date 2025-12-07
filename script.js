const WEATHER_API = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_API = "https://geocoding-api.open-meteo.com/v1/search";
const REFRESH_MINUTES = 10;

let lastLat = null;
let lastLon = null;
let lastCity = null;
let refreshTimer = null;
let mapInstance = null;
let mapMarker = null;

// On load
window.onload = () => {
    setupSearch();
    setupThemeToggle();

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(successLocation, failLocation);
    } else {
        loadWeatherByCity("Pristina");
    }
};

function setupSearch() {
    const input = document.getElementById("searchInput");
    const btn = document.getElementById("searchBtn");

    btn.addEventListener("click", () => {
        const city = input.value.trim();
        if (city) loadWeatherByCity(city);
    });

    input.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
            const city = input.value.trim();
            if (city) loadWeatherByCity(city);
        }
    });
}

// Optional theme toggle (light / dark)
function setupThemeToggle() {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;

    btn.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        btn.textContent = document.body.classList.contains("dark-mode")
            ? "Dark Mode"
            : "Light Mode";
    });
}

// Geolocation success / fail
function successLocation(position) {
    loadWeather(position.coords.latitude, position.coords.longitude, "Your Location");
}

function failLocation() {
    loadWeatherByCity("Pristina");
}

// City search → coordinates
function loadWeatherByCity(city) {
    fetch(`${GEOCODE_API}?name=${encodeURIComponent(city)}&count=1`)
        .then(res => res.json())
        .then(data => {
            if (!data.results || !data.results.length) {
                alert("City not found.");
                return;
            }
            const r = data.results[0];
            const label = `${r.name}${r.country ? ", " + r.country : ""}`;
            loadWeather(r.latitude, r.longitude, label);
        })
        .catch(() => alert("Error loading city data."));
}

// Coordinates → weather
function loadWeather(lat, lon, cityName) {
    lastLat = lat;
    lastLon = lon;
    lastCity = cityName;

    fetch(`${WEATHER_API}?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m&daily=sunrise,sunset&timezone=auto`)
        .then(res => res.json())
        .then(data => {
            updateUI(data, cityName, lat, lon);
            setupAutoRefresh();
        })
        .catch(() => alert("Weather data unavailable."));
}

// Auto-refresh every REFRESH_MINUTES
function setupAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(() => {
        if (lastLat && lastLon && lastCity) {
            loadWeather(lastLat, lastLon, lastCity);
        }
    }, REFRESH_MINUTES * 60 * 1000);
}

// Map
function updateMap(lat, lon, label) {
    if (!mapInstance) {
        mapInstance = L.map("map").setView([lat, lon], 10);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19
        }).addTo(mapInstance);
    } else {
        mapInstance.setView([lat, lon], 10);
    }

    if (mapMarker) {
        mapInstance.removeLayer(mapMarker);
    }

    mapMarker = L.marker([lat, lon]).addTo(mapInstance).bindPopup(label).openPopup();
}

// Weather code → icon + theme
function getWeatherInfo(code, isDay) {
    const map = {
        0: { text: isDay ? "Clear sky" : "Clear night", icon: isDay ? "bi-sun-fill" : "bi-moon-stars-fill", theme: isDay ? "theme-sunny" : "theme-night" },
        1: { text: "Mostly clear", icon: "bi-cloud-sun-fill", theme: "theme-sunny" },
        2: { text: "Mostly clear", icon: "bi-cloud-sun-fill", theme: "theme-sunny" },
        3: { text: "Cloudy", icon: "bi-clouds-fill", theme: "theme-cloudy" },
        45: { text: "Foggy", icon: "bi-cloud-fog2-fill", theme: "theme-cloudy" },
        48: { text: "Foggy", icon: "bi-cloud-fog2-fill", theme: "theme-cloudy" },
        51: { text: "Drizzle", icon: "bi-cloud-drizzle-fill", theme: "theme-rain" },
        61: { text: "Rain", icon: "bi-cloud-rain-fill", theme: "theme-rain" },
        71: { text: "Snow", icon: "bi-cloud-snow-fill", theme: "theme-snow" },
        80: { text: "Rain showers", icon: "bi-cloud-rain-fill", theme: "theme-rain" },
        95: { text: "Thunderstorm", icon: "bi-cloud-lightning-rain-fill", theme: "theme-rain" }
    };
    return map[code] || { text: "Unknown", icon: "bi-cloud", theme: "theme-cloudy" };
}

// Wind angle → direction text
function getWindDirection(deg) {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(deg / 45) % 8];
}

// Update UI from API response
function updateUI(data, cityName, lat, lon) {
    document.getElementById("weather-card").classList.remove("d-none");

    const current = data.current_weather;
    const daily = data.daily;
    const humidity = data.hourly.relative_humidity_2m[0];

    const isDay = current.is_day === 1;
    const info = getWeatherInfo(current.weathercode, isDay);

    // Temperature
    const temp = current.temperature;
    const tempEl = document.getElementById("temperature");
    tempEl.innerText = temp + "°C";
    tempEl.className = "";
    if (temp >= 30) tempEl.classList.add("temp-hot");
    else if (temp >= 20) tempEl.classList.add("temp-warm");
    else if (temp >= 10) tempEl.classList.add("temp-cool");
    else tempEl.classList.add("temp-cold");

    // Text values
    document.getElementById("city-name").innerText = cityName;
    document.getElementById("description").innerText = info.text;
    document.getElementById("feels-like").innerText = temp.toFixed(1);
    document.getElementById("wind").innerText = current.windspeed;
    document.getElementById("humidity").innerText = humidity;

    document.getElementById("sunrise").innerText = daily.sunrise[0].split("T")[1];
    document.getElementById("sunset").innerText = daily.sunset[0].split("T")[1];

    document.getElementById("local-time").innerText =
        "Local time: " + current.time.replace("T", " ");

    document.getElementById("day-night-label").innerText =
        isDay ? "Daytime" : "Nighttime";

    // Main icon
    document.getElementById("main-icon").innerHTML = `<i class="bi ${info.icon}"></i>`;

    // Background theme on body (optional)
    document.body.classList.remove("theme-sunny", "theme-cloudy", "theme-rain", "theme-snow", "theme-night");
    document.body.classList.add(info.theme);

    // Wind direction arrow + label
    const windDeg = current.winddirection || 0;
    document.getElementById("wind-arrow").style.transform = `rotate(${windDeg}deg)`;
    document.getElementById("wind-dir-text").innerText = getWindDirection(windDeg);

    // Map
    updateMap(lat, lon, cityName);
}
/* --------------------------------------------------- */
/* TEMPERATURE UNIT SWITCH (ADD-ON)                    */
/* --------------------------------------------------- */

// Temperature state
let isCelsius = true;

// Buttons
const celsiusBtn = document.getElementById('celsiusBtn');
const fahrenheitBtn = document.getElementById('fahrenheitBtn');

// Input reference (your existing search bar)
const cityInput = document.getElementById('searchInput');

// Celsius button click
celsiusBtn.addEventListener('click', () => {
    isCelsius = true;
    celsiusBtn.classList.add('active');
    fahrenheitBtn.classList.remove('active');

    const city = cityInput.value.trim();
    if (city) {
        loadWeatherByCity(city); // Your existing function
    } 
});

// Fahrenheit button click
fahrenheitBtn.addEventListener('click', () => {
    isCelsius = false;
    fahrenheitBtn.classList.add('active');
    celsiusBtn.classList.remove('active');

    const city = cityInput.value.trim();
    if (city) {
        loadWeatherByCity(city); // Your existing function
    }
});
