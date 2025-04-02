document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logout-btn');
    const currentTimeElement = document.getElementById('current-time');
    
    // Chart variables
    let temperatureChart, humidityChart;
    let previousTemp = null;
    let previousHumid = null;
    
    // ThingSpeak configuration
    const THINGSPEAK_CHANNEL_ID = '2898441';
    const THINGSPEAK_READ_API_KEY = '252COVM7WQ48U9WQ';
    
    // Check login state
    if (localStorage.getItem('isLoggedIn') === 'true') {
        loginContainer.style.display = 'none';
        dashboardContainer.style.display = 'grid';
        initDashboard();
    }
    
    // Login functionality
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if(username && password) {
            localStorage.setItem('isLoggedIn', 'true');
            loginContainer.style.display = 'none';
            dashboardContainer.style.display = 'grid';
            initDashboard();
        }
    });
    
    // Fixed logout functionality
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('isLoggedIn');
        dashboardContainer.style.display = 'none';
        loginContainer.style.display = 'flex';
        loginForm.reset();
    });
    
    // Update current time
    function updateClock() {
        const now = new Date();
        currentTimeElement.textContent = now.toLocaleTimeString() + ' | ' + now.toLocaleDateString();
    }
    const updateClockInterval = setInterval(updateClock, 1000);
    updateClock();
    
    // Initialize dashboard
    function initDashboard() {
        createCharts();
        fetchThingSpeakData();
        setInterval(fetchThingSpeakData, 15000);
    }
    
    // Create separate charts
    function createCharts() {
        // Temperature Chart
        const tempCtx = document.getElementById('temperatureChart').getContext('2d');
        temperatureChart = new Chart(tempCtx, {
            type: 'line',
            data: {
                labels: Array(12).fill(''),
                datasets: [{
                    label: 'Temperature (°C)',
                    data: Array(12).fill(0),
                    borderColor: 'rgba(255, 102, 0, 1)',
                    backgroundColor: 'rgba(255, 102, 0, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: getChartOptions('Temperature (°C)')
        });
        
        // Humidity Chart
        const humidCtx = document.getElementById('humidityChart').getContext('2d');
        humidityChart = new Chart(humidCtx, {
            type: 'line',
            data: {
                labels: Array(12).fill(''),
                datasets: [{
                    label: 'Humidity (%)',
                    data: Array(12).fill(0),
                    borderColor: 'rgba(0, 102, 204, 1)',
                    backgroundColor: 'rgba(0, 102, 204, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: getChartOptions('Humidity (%)')
        });
    }
    
    // Common chart options
    function getChartOptions(title) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                y: {
                    title: { display: true, text: title }
                }
            }
        };
    }
    
    // Fetch data from ThingSpeak
    function fetchThingSpeakData() {
        const url = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_READ_API_KEY}&results=12`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.feeds && data.feeds.length > 0) {
                    processThingSpeakData(data.feeds);
                }
            })
            .catch(error => {
                console.error('Error fetching ThingSpeak data:', error);
                useMockData();
            });
    }
    
    // Process data
    function processThingSpeakData(feeds) {
        const timestamps = feeds.map(feed => new Date(feed.created_at).toLocaleTimeString());
        const tempData = feeds.map(feed => parseFloat(feed.field1) || 0);
        const humidData = feeds.map(feed => parseFloat(feed.field2) || 0);
        
        updateCharts(timestamps, tempData, humidData);
        updateMetrics(tempData, humidData);
    }
    
    // Update charts
    function updateCharts(labels, tempData, humidData) {
        temperatureChart.data.labels = labels;
        temperatureChart.data.datasets[0].data = tempData;
        temperatureChart.update();
        
        humidityChart.data.labels = labels;
        humidityChart.data.datasets[0].data = humidData;
        humidityChart.update();
    }
    
    // Update metrics
    function updateMetrics(tempData, humidData) {
        const currentTemp = tempData[tempData.length - 1];
        const currentHumid = humidData[humidData.length - 1];
        
        // Update temperature
        document.getElementById('temperature-value').textContent = `${currentTemp.toFixed(1)}°C`;
        if (previousTemp !== null) {
            const diff = currentTemp - previousTemp;
            const trendElement = document.getElementById('temp-trend');
            trendElement.innerHTML = diff >= 0 
                ? `<i class="fas fa-arrow-up trend-up"></i> ${Math.abs(diff).toFixed(1)}°C`
                : `<i class="fas fa-arrow-down trend-down"></i> ${Math.abs(diff).toFixed(1)}°C`;
        }
        previousTemp = currentTemp;
        
        // Update humidity
        document.getElementById('humidity-value').textContent = `${currentHumid.toFixed(1)}%`;
        if (previousHumid !== null) {
            const diff = currentHumid - previousHumid;
            const trendElement = document.getElementById('humid-trend');
            trendElement.innerHTML = diff >= 0 
                ? `<i class="fas fa-arrow-up trend-up"></i> ${Math.abs(diff).toFixed(1)}%`
                : `<i class="fas fa-arrow-down trend-down"></i> ${Math.abs(diff).toFixed(1)}%`;
        }
        previousHumid = currentHumid;
    }
    
    // Mock data
    function useMockData() {
        const now = new Date();
        const timestamps = Array(12).fill('').map((_, i) => {
            const time = new Date(now);
            time.setHours(now.getHours() - 12 + i*2);
            return time.toLocaleTimeString();
        });
        
        const mockTemp = Array(12).fill().map(() => 20 + Math.random() * 10);
        const mockHumid = Array(12).fill().map(() => 40 + Math.random() * 30);
        
        updateCharts(timestamps, mockTemp, mockHumid);
        updateMetrics(mockTemp, mockHumid);
    }
});