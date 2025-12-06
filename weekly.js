/* BEGIN Lea Krasniqi */


const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const dayToggle = document.getElementById("dayToggle");
const forecastContainer = document.getElementById("forecastContainer");
const cityTitle = document.getElementById("cityTitle");


// Weather icon 
const iconMap = {
    0: "☀️",
    1: "🌤️",
    2: "⛅",
    3: "☁️",
    45: "🌫️",
    48: "🌫️",
    51: "🌦️",
    61: "🌧️",
    71: "❄️",
    80: "🌧️",
    95: "⛈️"
};

searchBtn.addEventListener("click", fetchCityWeather);
const dayInput = document.getElementById("dayInput");
dayInput.addEventListener("input", fetchCityWeather);

// Fetch city → lat/lon
async function fetchCityWeather() {
    const city = cityInput.value.trim();
    if (!city) {
        alert("Please enter a city name.");
        return;
    }

    cityTitle.textContent = "Loading...";

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}`;

    try {
        const geoRes = await fetch(geoUrl);
        console.log("Geo status:", geoRes.status);

        const geoData = await geoRes.json();
        console.log("Geo data:", geoData);

        if (!geoData.results || geoData.results.length === 0) {
            cityTitle.textContent = "City not found.";
            forecastContainer.innerHTML = "";
            return;
        }

        const { latitude, longitude, name, country } = geoData.results[0];
        cityTitle.textContent = `${name}, ${country}`;

        fetchForecast(latitude, longitude);

    } catch (err) {
        cityTitle.textContent = "Error loading weather.";
        console.error(err);
    }
}

//fetch forecast
async function fetchForecast(lat, lon) {
    let days = parseInt(dayInput.value);

    // validation
    if (isNaN(days) || days < 1) days = 1;
    if (days > 15) days = 15;

    const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&daily=weathercode,temperature_2m_max,temperature_2m_min` +
        `&timezone=auto&forecast_days=${days}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (!data.daily || !data.daily.time) {
            throw new Error("Invalid forecast data");
        }

        renderForecast(data.daily);

    } catch (err) {
        cityTitle.textContent = "Unable to load forecast.";
        forecastContainer.innerHTML = "";
    }
}



// Render forecast cards
function renderForecast(daily) {

    // Hide welcome section AFTER user searches
    const welcome = document.getElementById("welcomeSection");
    if (welcome) welcome.style.display = "none";

    forecastContainer.innerHTML = "";

    daily.time.forEach((date, i) => {
        const code = daily.weathercode[i];
        const icon = iconMap[code] || "🌡️";

        const card = `
        <div class="col-md-3 col-sm-6">
            <div class="card card-weather shadow p-3 text-center">
                <h5>${date}</h5>
                <div class="fs-1">${icon}</div>
                <p class="fw-bold text-danger">Max: ${daily.temperature_2m_max[i]}°C</p>
                <p class="fw-bold text-primary">Min: ${daily.temperature_2m_min[i]}°C</p>
            </div>
        </div>
        `;
        forecastContainer.insertAdjacentHTML("beforeend", card);
    });
}
/* THEME TOGGLE */

const themeToggle = document.getElementById("themeToggle");
let isLight = false;

themeToggle.addEventListener("click", () => {
    isLight = !isLight;

    if (isLight) {
        document.body.classList.add("light-mode");
        themeToggle.textContent = "Dark Mode";
    } else {
        document.body.classList.remove("light-mode");
        themeToggle.textContent = "Light Mode";
    }
});



/* END Lea Krasniqi */
