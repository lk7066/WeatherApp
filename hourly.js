// hourly.js
const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const alertBox = document.getElementById("alertBox");
const summaryBox = document.getElementById("summaryBox");
const hourlyContainer = document.getElementById("hourlyContainer");
const themeToggle = document.getElementById("themeToggle");
const celsiusBtn = document.getElementById("celsiusBtn");
const fahrenheitBtn = document.getElementById("fahrenheitBtn");

let isCelsius = true;
let globalTemps = [];

celsiusBtn.addEventListener("click", () => {
    isCelsius = true;
    celsiusBtn.classList.add("active");
    fahrenheitBtn.classList.remove("active");
    if (cityInput.value.trim()) fetchCityCoordinates(cityInput.value.trim());
});

fahrenheitBtn.addEventListener("click", () => {
    isCelsius = false;
    fahrenheitBtn.classList.add("active");
    celsiusBtn.classList.remove("active");
    if (cityInput.value.trim()) fetchCityCoordinates(cityInput.value.trim());
});

themeToggle.textContent = document.body.classList.contains("dark-mode") ? "Light Mode" : "Dark Mode";
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    document.body.classList.toggle("light-mode");
    const isDark = document.body.classList.contains("dark-mode");
    themeToggle.textContent = isDark ? "Light Mode" : "Dark Mode";
    if (globalTemps.length > 0) fetchCityCoordinates(cityInput.value.trim());
});

searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (!city) {
        showAlert("Please enter a city name.", "danger");
        return;
    }
    fetchCityCoordinates(city);
});

function showAlert(msg, type) {
    alertBox.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${msg}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
    `;
}

function fetchCityCoordinates(city) {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}`;
    fetch(geoUrl)
        .then(res => res.json())
        .then(data => {
            if (!data.results || data.results.length === 0) {
                showAlert("City not found. Try again.", "warning");
                return;
            }
            const { latitude, longitude, name, country } = data.results[0];
            summaryBox.innerHTML = `<div class='alert alert-primary shadow-sm'>Showing 24-hour forecast for <strong>${name}, ${country}</strong></div>`;
            fetchWeatherData(latitude, longitude);
        })
        .catch(err => showAlert("Something went wrong while fetching coordinates", "danger"));
}

function fetchWeatherData(lat, lon) {
    const api = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode&timezone=auto`;
    fetch(api)
        .then(res => res.json())
        .then(data => {
            globalTemps = data.hourly.temperature_2m;
            renderHourlyCards(data.hourly.time, data.hourly.temperature_2m, data.hourly.weathercode);
        })
        .catch(() => showAlert("Weather fetch error.", "danger"));
}

function renderHourlyCards(times, temps, codes) {
    hourlyContainer.innerHTML = "";
    for (let i = 0; i < 24; i++) {
        const hour = new Date(times[i]).getHours().toString().padStart(2, "0") + ":00";
        const tempVal = isCelsius ? temps[i] : ((temps[i] * 9 / 5) + 32);
        const icon = getWeatherIcon(codes[i]);
        const card = document.createElement("div");
        card.className = "weather-card text-center p-2";
        card.innerHTML = `
            <h6>${hour}</h6>
            <div style="font-size: 2rem">${icon}</div>
            <div>${Math.round(tempVal)}${isCelsius ? "°C" : "°F"}</div>
        `;
        hourlyContainer.appendChild(card);
    }
}

function getWeatherIcon(code) {
    if (code === 0) return "☀️";
    if (code <= 3) return "⛅";
    if (code <= 48) return "🌫️";
    if (code <= 67) return "🌧️";
    if (code <= 86) return "❄️";
    return "🌩️";
}
