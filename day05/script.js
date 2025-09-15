// OpenWeatherMap API 키 (실제 사용시에는 환경변수로 관리하세요)
const API_KEY = '5b12c84d40cf884288d3524afe83e841'; 
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM 요소들
const searchForm = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const currentWeather = document.getElementById('currentWeather');
const forecast = document.getElementById('forecast');

// 현재 날씨 요소들
const currentCity = document.getElementById('currentCity');
const currentDate = document.getElementById('currentDate');
const currentIcon = document.getElementById('currentIcon');
const currentTemp = document.getElementById('currentTemp');
const currentDesc = document.getElementById('currentDesc');
const currentFeelsLike = document.getElementById('currentFeelsLike');
const currentHumidity = document.getElementById('currentHumidity');
const currentWindSpeed = document.getElementById('currentWindSpeed');
const currentPressure = document.getElementById('currentPressure');

// 5일 예보 요소
const forecastList = document.getElementById('forecastList');

// 검색 폼 이벤트 리스너
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const city = cityInput.value.trim();
    if (!city) return;
    
    try {
        showLoading();
        hideError();
        
        // 현재 날씨와 5일 예보를 동시에 가져오기
        const [currentData, forecastData] = await Promise.all([
            getCurrentWeather(city),
            getForecast(city)
        ]);
        
        displayCurrentWeather(currentData);
        displayForecast(forecastData);
        
        hideLoading();
        showWeather();
        
    } catch (err) {
        console.error('날씨 데이터 가져오기 실패:', err);
        hideLoading();
        showError();
    }
});

// 현재 날씨 데이터 가져오기 (한국어 지원)
async function getCurrentWeather(city) {
    try {
        // 먼저 한국어로 시도
        let response = await fetch(
            `${API_BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric&lang=kr`
        );
        
        // 한국어로 실패하면 영어로 시도
        if (!response.ok) {
            response = await fetch(
                `${API_BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric&lang=en`
            );
        }
        
        if (!response.ok) {
            throw new Error(`도시를 찾을 수 없습니다: ${city}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API 호출 실패:', error);
        throw new Error('도시를 찾을 수 없습니다');
    }
}

// 5일 예보 데이터 가져오기 (한국어 지원)
async function getForecast(city) {
    try {
        // 먼저 한국어로 시도
        let response = await fetch(
            `${API_BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric&lang=kr`
        );
        
        // 한국어로 실패하면 영어로 시도
        if (!response.ok) {
            response = await fetch(
                `${API_BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric&lang=en`
            );
        }
        
        if (!response.ok) {
            throw new Error(`예보 데이터를 가져올 수 없습니다: ${city}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API 호출 실패:', error);
        throw new Error('예보 데이터를 가져올 수 없습니다');
    }
}

// 현재 날씨 표시
function displayCurrentWeather(data) {
    currentCity.textContent = data.name;
    currentDate.textContent = formatDate(new Date());
    currentIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    currentIcon.alt = data.weather[0].description;
    currentTemp.textContent = Math.round(data.main.temp);
    currentDesc.textContent = data.weather[0].description;
    currentFeelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
    currentHumidity.textContent = `${data.main.humidity}%`;
    currentWindSpeed.textContent = `${data.wind.speed} m/s`;
    currentPressure.textContent = `${data.main.pressure} hPa`;
}

// 5일 예보 표시
function displayForecast(data) {
    // 하루에 여러 시간대 데이터가 있으므로, 하루당 하나씩만 표시
    const dailyForecasts = [];
    const processedDays = new Set();
    
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toDateString();
        
        // 아직 처리하지 않은 날짜이고, 12시 데이터인 경우만 추가
        if (!processedDays.has(dayKey) && date.getHours() === 12) {
            dailyForecasts.push(item);
            processedDays.add(dayKey);
        }
    });
    
    // 최대 5일까지만 표시
    const forecastsToShow = dailyForecasts.slice(0, 5);
    
    forecastList.innerHTML = forecastsToShow.map(item => {
        const date = new Date(item.dt * 1000);
        const dayName = getDayName(date.getDay());
        const icon = item.weather[0].icon;
        const temp = Math.round(item.main.temp);
        const desc = item.weather[0].description;
        
        return `
            <div class="forecast-item">
                <div class="forecast-day">${dayName}</div>
                <div class="forecast-icon">
                    <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}">
                </div>
                <div class="forecast-temp">${temp}°C</div>
                <div class="forecast-desc">${desc}</div>
            </div>
        `;
    }).join('');
}

// 날짜 포맷팅
function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    return date.toLocaleDateString('ko-KR', options);
}

// 요일 이름 가져오기
function getDayName(dayIndex) {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[dayIndex];
}

// UI 상태 관리 함수들
function showLoading() {
    loading.style.display = 'block';
    currentWeather.style.display = 'none';
    forecast.style.display = 'none';
}

function hideLoading() {
    loading.style.display = 'none';
}

function showError() {
    error.style.display = 'block';
    currentWeather.style.display = 'none';
    forecast.style.display = 'none';
}

function hideError() {
    error.style.display = 'none';
}

function showWeather() {
    currentWeather.style.display = 'block';
    forecast.style.display = 'block';
}

// 페이지 로드시 기본 도시로 서울 날씨 표시
window.addEventListener('load', () => {
    // API 키가 설정되어 있으면 서울 날씨를 자동으로 로드
    if (API_KEY !== 'YOUR_API_KEY_HERE') {
        cityInput.value = 'Seoul';
        searchForm.dispatchEvent(new Event('submit'));
    }
});