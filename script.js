document.addEventListener('DOMContentLoaded', function() {
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logout-btn');
    const currentTimeElement = document.getElementById('current-time');

    const THINGSPEAK_CHANNEL_ID = '2898441'; // Replace with actual ID
    const THINGSPEAK_READ_API_KEY = '252COVM7WQ48U9WQ'; // Replace with actual API Key

    if (localStorage.getItem('isLoggedIn') === 'true') {
        loginContainer.style.display = 'none';
        dashboardContainer.style.display = 'grid';
        initDashboard();
    }

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username && password) {
            localStorage.setItem('isLoggedIn', 'true');
            loginContainer.style.display = 'none';
            dashboardContainer.style.display = 'grid';
            initDashboard();
        }
    });

    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('isLoggedIn');
        dashboardContainer.style.display = 'none';
        loginContainer.style.display = 'flex';
        loginForm.reset();
    });

    function initDashboard() {
        fetchThingSpeakData();
        setInterval(fetchThingSpeakData, 15000);
    }

    async function fetchThingSpeakData() {
        const url = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_READ_API_KEY}&results=20`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!data.feeds || data.feeds.length === 0) {
                console.error("No data received.");
                return;
            }

            const timestamps = data.feeds.map(feed => new Date(feed.created_at).toLocaleTimeString());
            const tempData = data.feeds.map(feed => parseFloat(feed.field1) || 0);
            const humidData = data.feeds.map(feed => parseFloat(feed.field2) || 0);
            const xAxisData = data.feeds.map(feed => parseFloat(feed.field3) || 0);
            const yAxisData = data.feeds.map(feed => parseFloat(feed.field4) || 0);
            const zAxisData = data.feeds.map(feed => parseFloat(feed.field5) || 0);

            renderGraph("temperatureChart", timestamps, tempData, "Temperature (°C)", "#ff6b6b");
            renderGraph("humidityChart", timestamps, humidData, "Humidity (%)", "#3498db");
            renderGraph("xAxisChart", timestamps, xAxisData, "X-Axis", "#2ecc71");
            renderGraph("yAxisChart", timestamps, yAxisData, "Y-Axis", "#f39c12");
            renderGraph("zAxisChart", timestamps, zAxisData, "Z-Axis", "#9b59b6");

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    function renderGraph(canvasId, labels, data, label, color) {
        const ctx = document.getElementById(canvasId).getContext("2d");

        new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    borderColor: color,
                    backgroundColor: color + "33",
                    fill: true
                }]
            }
        });
    }
});