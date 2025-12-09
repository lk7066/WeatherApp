/* BEGIN Olta Ademi */

const homeSearchBtn = document.getElementById("homeSearchBtn");
const homeCityInput = document.getElementById("homeCityInput");
const homeMessage = document.getElementById("homeMessage");
const locationsContainer = document.getElementById("locationsContainer");
const citySuggestions = document.getElementById("citySuggestions");
const noLocationsMessage = document.getElementById("noLocationsMessage");


const celsiusBtn = document.getElementById("celsiusBtn");
const fahrenheitBtn = document.getElementById("fahrenheitBtn");
let isCelsius = true;


const SELECTED_CITY_KEY = "selectedCity";

const iconMapHome = {
    0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
    45: "🌫️", 48: "🌫️", 51: "🌦️",
    61: "🌧️", 71: "❄️", 80: "🌧️", 95: "⛈️"
};


const descriptionMapHome = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    61: "Rain",
    71: "Snow",
    80: "Rain showers",
    95: "Thunderstorm"
};



homeSearchBtn.addEventListener("click", () => {
    fetchHomeCityWeather();
});

homeCityInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
        fetchHomeCityWeather();
    }
});

homeCityInput.addEventListener("input", () => {
    loadCitySuggestions();
});


if (celsiusBtn && fahrenheitBtn) {
    celsiusBtn.classList.add("active");

    celsiusBtn.addEventListener("click", () => {
        if (isCelsius) return;
        isCelsius = true;
        celsiusBtn.classList.add("active");
        fahrenheitBtn.classList.remove("active");
        refreshTemperatureUnits();
    });

    fahrenheitBtn.addEventListener("click", () => {
        if (!isCelsius) return;
        isCelsius = false;
        fahrenheitBtn.classList.add("active");
        celsiusBtn.classList.remove("active");
        refreshTemperatureUnits();
    });
}


fetchHomeCityWeather("Pristina", true);




function showMessage(text, type) {
    if (!text) {
        homeMessage.innerHTML = "";
        return;
    }

    const cls =
        type === "error" ? "alert-danger" :
            type === "info" ? "alert-info" : "alert-success";

    homeMessage.innerHTML =
        `<div class="alert ${cls} mb-0">${text}</div>`;
}


function setLoading(isLoading) {
    if (isLoading) {
        homeSearchBtn.disabled = true;
        homeSearchBtn.innerHTML =
            '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Loading...';
    } else {
        homeSearchBtn.disabled = false;
        homeSearchBtn.textContent = "Search";
    }
}


function formatTimePart(value) {
    if (!value) return "--:--";
    const parts = value.split("T");
    return parts.length === 2 ? parts[1].slice(0, 5) : value;
}


function formatTempDisplay(celsiusValue) {
    if (celsiusValue === null || celsiusValue === undefined) return "--";
    if (isCelsius) {
        return `${Math.round(celsiusValue)}°C`;
    } else {
        const f = celsiusValue * 9 / 5 + 32;
        return `${f.toFixed(1)}°F`;
    }
}



async function loadCitySuggestions() {
    const q = homeCityInput.value.trim();

    if (q.length < 2) {
        citySuggestions.innerHTML = "";
        return;
    }

    try {
        const url =
            "https://geocoding-api.open-meteo.com/v1/search?name=" +
            encodeURIComponent(q) +
            "&count=6";
        const res = await fetch(url);
        const data = await res.json();

        if (!data.results) {
            citySuggestions.innerHTML = "";
            return;
        }

        renderCitySuggestions(data.results);
    } catch {
        citySuggestions.innerHTML = "";
    }
}

function renderCitySuggestions(results) {
    citySuggestions.innerHTML = "";

    results.forEach((loc) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "list-group-item list-group-item-action";
        item.textContent = `${loc.name}, ${loc.country}`;

        item.addEventListener("click", () => {
            homeCityInput.value = loc.name;
            citySuggestions.innerHTML = "";
            fetchHomeCityWeather(loc.name);
        });

        citySuggestions.appendChild(item);
    });
}




async function fetchHomeCityWeather(defaultCity, isDefaultLocation) {
    const cityName = (defaultCity || homeCityInput.value).trim();

    if (!cityName) {
        showMessage("Please enter a city name.", "error");
        return;
    }

    if (!defaultCity) {
        showMessage(`Searching for "${cityName}"…`, "info");
    }

    setLoading(true);

    try {
        const geoUrl =
            "https://geocoding-api.open-meteo.com/v1/search?name=" +
            encodeURIComponent(cityName);
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            showMessage("City not found. Try another search.", "error");
            setLoading(false);
            return;
        }

        const match = geoData.results[0];

        fetchHomeForecast(
            match.latitude,
            match.longitude,
            match.name,
            match.country,
            !defaultCity,
            isDefaultLocation
        );
    } catch {
        showMessage("Unable to load city information.", "error");
        setLoading(false);
    }
}



async function fetchHomeForecast(lat, lon, name, country, saveSelected, isDefaultLocation) {
    try {
        const url =
            "https://api.open-meteo.com/v1/forecast?latitude=" +
            lat +
            "&longitude=" +
            lon +
            "&current_weather=true&hourly=relativehumidity_2m" +
            "&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto";

        const res = await fetch(url);
        const data = await res.json();

        if (!data.current_weather) {
            showMessage("Weather data unavailable.", "error");
            setLoading(false);
            return;
        }

        const current = data.current_weather;
        const humidity = data.hourly?.relativehumidity_2m?.[0] ?? "--";
        const sunrise = data.daily.sunrise[0];
        const sunset = data.daily.sunset[0];

        const highTemp = data.daily.temperature_2m_max[0];
        const lowTemp = data.daily.temperature_2m_min[0];

        addLocationCard(
            name,
            country,
            current.temperature,
            current.windspeed,
            humidity,
            current.weathercode,
            sunrise,
            sunset,
            highTemp,
            lowTemp,
            isDefaultLocation
        );

        if (saveSelected) {
            localStorage.setItem(
                SELECTED_CITY_KEY,
                JSON.stringify({ name, country, latitude: lat, longitude: lon })
            );
        }

        showMessage("", "");
    } catch {
        showMessage("Unable to load weather forecast.", "error");
    } finally {
        setLoading(false);
    }
}




function addLocationCard(
    name,
    country,
    temp,
    wind,
    humidity,
    code,
    sunrise,
    sunset,
    highTemp,
    lowTemp,
    isDefaultLocation
) {
    const icon = iconMapHome[code] || "🌡️";
    const description = descriptionMapHome[code] || "";
    const updatedAt = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    const count = locationsContainer.children.length;
    const colClass =
        count === 0
            ? "col-12 col-md-6 location-col"
            : "col-12 col-md-6 col-lg-4 location-col";

    const badge = isDefaultLocation
        ? '<div class="location-badge">CURRENT LOCATION</div>'
        : "";

    const removeBtn = isDefaultLocation
        ? ""
        : '<button type="button" class="btn-close location-remove" aria-label="Remove"></button>';

    const cardClass = isDefaultLocation
        ? "location-card location-card-current"
        : "location-card";


    const heartIcon = !isDefaultLocation
        ? '<span class="heart-btn">❤️</span>'
        : "";

    const html =
        `<div class="${colClass}">
            <div class="${cardClass}"
                 data-temp="${temp}"
                 data-high="${highTemp}"
                 data-low="${lowTemp}"
                 data-feels="${temp}">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <div class="location-city">${name}</div>
                        <div class="location-country">${country}</div>
                        ${badge}
                    </div>
                    <div class="d-flex flex-column align-items-end">
                        ${heartIcon}
                        <div class="location-icon mb-1">${icon}</div>
                        ${removeBtn}
                    </div>
                </div>

                <div class="d-flex align-items-baseline mb-1">
                    <div class="location-temp me-2">${formatTempDisplay(temp)}</div>
                    <div class="location-desc">${description}</div>
                </div>

                <div class="location-meta location-highlow mb-2">
                    High ${formatTempDisplay(highTemp)} · Low ${formatTempDisplay(lowTemp)}
                </div>

                <div class="location-chips">
                    <span class="meta-chip feels-chip">🌡️ Feels like ${formatTempDisplay(temp)}</span>
                    <span class="meta-chip">💨 Wind ${Math.round(wind)} km/h</span>
                    <span class="meta-chip">💧 Humidity ${humidity}%</span>
                    <span class="meta-chip">🌅 ${formatTimePart(sunrise)} · 🌇 ${formatTimePart(sunset)}</span>
                </div>

                <div class="location-meta mt-1">
                    Updated at ${updatedAt}
                </div>
            </div>
        </div>`;

    locationsContainer.insertAdjacentHTML("beforeend", html);

    if (noLocationsMessage) {
        noLocationsMessage.style.display = "none";
    }


    if (!isDefaultLocation) {
        const allCols = locationsContainer.querySelectorAll(".location-col");
        const lastCol = allCols[allCols.length - 1];
        const btn = lastCol.querySelector(".location-remove");

        if (btn) {
            btn.addEventListener("click", () => {
                lastCol.remove();

                if (locationsContainer.children.length === 0 && noLocationsMessage) {
                    noLocationsMessage.style.display = "block";
                }
            });
        }
    }


    refreshTemperatureUnits();
}



function refreshTemperatureUnits() {
    const cards = locationsContainer.querySelectorAll(".location-card");
    cards.forEach(card => {
        const tempC = parseFloat(card.dataset.temp);
        const highC = parseFloat(card.dataset.high);
        const lowC = parseFloat(card.dataset.low);
        const feelsC = parseFloat(card.dataset.feels);

        if (Number.isNaN(tempC)) return;

        const tempEl = card.querySelector(".location-temp");
        const highLowEl = card.querySelector(".location-highlow");
        const feelsEl = card.querySelector(".feels-chip");

        if (tempEl) {
            tempEl.textContent = formatTempDisplay(tempC);
        }
        if (highLowEl) {
            highLowEl.textContent =
                `High ${formatTempDisplay(highC)} · Low ${formatTempDisplay(lowC)}`;
        }
        if (feelsEl) {
            feelsEl.textContent = `🌡️ Feels like ${formatTempDisplay(feelsC || tempC)}`;
        }
    });
}




const themeToggle = document.getElementById("themeToggle");

if (themeToggle) {

    document.body.classList.add("light-mode");
    let isLight = true;

    themeToggle.textContent = "Dark Mode";

    themeToggle.addEventListener("click", () => {
        isLight = !isLight;

        if (isLight) {
            document.body.classList.add("light-mode");
            document.body.classList.remove("dark-mode");
            themeToggle.textContent = "Dark Mode";
        } else {
            document.body.classList.remove("light-mode");
            document.body.classList.add("dark-mode");
            themeToggle.textContent = "Light Mode";
        }
    });
}

/* END Olta Ademi */
