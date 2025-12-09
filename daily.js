//Begin Era Kelmendi


const searchBtn = document.getElementById('searchBtn');
const cityInput = document.getElementById('cityInput');
const forecastOutput = document.getElementById('forecastOutput');
const summaryBox = document.getElementById('summaryBox');
const themeToggle = document.getElementById('themeToggle');

const celsiusBtn = document.getElementById("celsiusBtn");
const fahrenheitBtn = document.getElementById("fahrenheitBtn");

let isCelsius = true;
celsiusBtn.classList.add("active");


celsiusBtn.addEventListener("click", () => {
    isCelsius = true;
    celsiusBtn.classList.add("active");
    fahrenheitBtn.classList.remove("active");

    if (cityInput.value.trim()) searchBtn.click();
});


fahrenheitBtn.addEventListener("click", () => {
    isCelsius = false;
    fahrenheitBtn.classList.add("active");
    celsiusBtn.classList.remove("active");

    if (cityInput.value.trim()) searchBtn.click();
});

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (!city) {
        showAlert('Please enter a city name.', 'danger');
        return;
    }
    fetchCityCoords(city);
});
function showAlert(msg, type) {
    summaryBox.innerHTML = `
        <div class="alert alert-${type} mt-3">${msg}</div>
    `;
}
function fetchCityCoords(city) {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}`;
    fetch(geoUrl)
        .then(res => res.json())
        .then(data => {

            if (!data.results || data.results.length === 0) {
                showAlert('City not found.', 'warning');
                return;
            }

            const { latitude, longitude, name, country } = data.results[0];

            summaryBox.innerHTML = `
                <div class='alert alert-primary mt-3'>
                    Forecast for <strong>${name}, ${country}</strong>
                </div>
            `;

            fetchDailyForecast(latitude, longitude);
        })
        .catch(() => showAlert('Error fetching city data.', 'danger'));
}

function fetchDailyForecast(lat, lon) {

    const weatherUrl =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,windspeed_10m_max,weathercode&timezone=auto`;

    fetch(weatherUrl)
        .then(res => res.json())
        .then(data => {
            if (!data.daily || !data.daily.time) {
                showAlert('Forecast data is missing or invalid.', 'warning');
                return;
            }
            renderForecast(data.daily);
        })
        .catch(() => showAlert('Error fetching forecast.', 'danger'));
}
function icons(code) {
    if (code === 0) return '☀';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫';
    if (code <= 67) return '🌧';
    if (code <= 86) return '❄';
    return '🌩';
}


function renderForecast(daily) {

    forecastOutput.innerHTML = '';

    let todayWind = daily.windspeed_10m_max[0];
    let todayMin = daily.temperature_2m_min[0];
    let todayMax = daily.temperature_2m_max[0];

    const todaySunrise = daily.sunrise[0].split("T")[1];
    const todaySunset = daily.sunset[0].split("T")[1];


    if (!isCelsius) {
        todayMin = (todayMin * 9 / 5 + 32).toFixed(1);
        todayMax = (todayMax * 9 / 5 + 32).toFixed(1);
    }

    const unit = isCelsius ? "°C" : "°F";

    summaryBox.innerHTML = `
    <div class="row g-3 mt-4 justify-content-center">

        <div class="col-md-2 col-sm-6 info-card">
            <div class="card card-weather text-center p-3">
                <div class="info-icon">💨</div>
                <h5>Wind Speed</h5>
                <p>${todayWind} km/h</p>
            </div>
        </div>

        <div class="col-md-2 col-sm-6 info-card">
            <div class="card card-weather text-center p-3">
                <div class="info-icon">🧊</div>
                <h5>Min Temp</h5>
                <p>${todayMin}${unit}</p>
            </div>
        </div>

        <div class="col-md-2 col-sm-6 info-card">
            <div class="card card-weather text-center p-3">
                <div class="info-icon">🔥</div>
                <h5>Max Temp</h5>
                <p>${todayMax}${unit}</p>
            </div>
        </div>

        <div class="col-md-2 col-sm-6 info-card">
            <div class="card card-weather text-center p-3">
                <div class="info-icon">🌅</div>
                <h5>Sunrise</h5>
                <p>${todaySunrise}</p>
            </div>
        </div>

        <div class="col-md-2 col-sm-6 info-card">
            <div class="card card-weather text-center p-3">
                <div class="info-icon">🌇</div>
                <h5>Sunset</h5>
                <p>${todaySunset}</p>
            </div>
        </div>

    </div>
    `;
}




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
//End Era Kelmendi