// Era Krasniqi - Daily Forecast Page

const searchBtn = document.getElementById('searchBtn');
const cityInput = document.getElementById('cityInput');
const forecastOutput = document.getElementById('forecastOutput');
const summaryBox = document.getElementById('summaryBox');
const themeToggle = document.getElementById('themeToggle');

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
            summaryBox.innerHTML = `<div class='alert alert-primary mt-3'>Forecast for <strong>${name}, ${country}</strong></div>`;
            fetchDailyForecast(latitude, longitude);
        })
        .catch(() => showAlert('Error fetching city data.', 'danger'));
}

function fetchDailyForecast(lat, lon) {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
    fetch(weatherUrl)
        .then(res => res.json())
        .then(data => {
            console.log('Forecast API response:', data); // <-- ADD THIS
            if (!data.daily || !data.daily.time) {
                showAlert('Forecast data is missing or invalid.', 'warning');
                return;
            }
            renderForecast(data.daily);
        })

        .catch(() => showAlert('Error fetching forecast.', 'danger'));
}


function renderForecast(daily) {
    forecastOutput.innerHTML = '';
    const icons = code => {
        if (code === 0) return '☀';
        if (code <= 3) return '⛅';
        if (code <= 48) return '🌫';
        if (code <= 67) return '🌧';
        if (code <= 86) return '❄';
        return '🌩';
    };
daily.time.forEach((date, i) => {
        const card = `
        <div class="col-md-3 col-sm-6">
            <div class="card card-weather text-center p-3">
                <h5>${date}</h5>
                <div style="font-size: 2rem">${icons(daily.weathercode[i])}</div>
                <p class="text-danger">Max: ${Math.round(daily.temperature_2m_max[i])}°C</p>
                <p class="text-primary">Min: ${Math.round(daily.temperature_2m_min[i])}°C</p>
            </div>
        </div>
        `;
        forecastOutput.insertAdjacentHTML('beforeend', card);
    });
}

// THEME TOGGLE LOGIC
let isDark = false;
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    isDark = !isDark;
    themeToggle.textContent = isDark ? 'Light Mode' : 'Dark Mode';
});