const CONFIG = {
    city: 'Herne',
    country: 'Germany',
    method: 3
};

async function fetchTimings() {
    const today = new Date();
    const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
    const url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${CONFIG.city}&country=${CONFIG.country}&method=${CONFIG.method}`;

    try {
        const response = await fetch(url);
        const json = await response.json();
        return json.data;
    } catch (e) {
        console.error("API Error", e);
        return null;
    }
}

function updateUI(data) {
    if (!data) return;

    const timings = data.timings;
    const date = data.date;

    document.getElementById('current-date').innerText = date.readable.toUpperCase();
    document.getElementById('hijri-date').innerText = `${date.hijri.day} ${date.hijri.month.en} ${date.hijri.year}`;

    const grid = document.getElementById('prayer-grid');
    grid.innerHTML = '';

    const relevant = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const now = new Date();
    let nextPrayer = null;
    let minDiff = Infinity;

    relevant.forEach(p => {
        const [h, m] = timings[p].split(':');
        const pDate = new Date();
        pDate.setHours(h, m, 0);

        const diff = pDate - now;
        const isNext = diff > 0 && diff < minDiff;
        
        if (isNext) {
            minDiff = diff;
            nextPrayer = { name: p, time: timings[p], date: pDate };
        }

        const card = document.createElement('div');
        card.className = `prayer-card ${isNext ? 'active' : ''}`;
        card.innerHTML = `
            <span class="p-name">${p.toUpperCase()}</span>
            <span class="p-time">${timings[p]}</span>
        `;
        grid.appendChild(card);
    });

    if (nextPrayer) {
        document.getElementById('timer-label').innerText = `NÄCHSTE: ${nextPrayer.name.toUpperCase()}`;
        document.getElementById('next-prayer-time').innerText = nextPrayer.time;
        startCountdown(nextPrayer.date);
    }
}

let timerInterval;
function startCountdown(target) {
    if (timerInterval) clearInterval(timerInterval);
    
    function tick() {
        const now = new Date();
        const diff = target - now;

        if (diff <= 0) {
            clearInterval(timerInterval);
            init(); // Refresh for next prayer
            return;
        }

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        document.getElementById('countdown').innerText = 
            `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    tick();
    timerInterval = setInterval(tick, 1000);
}

async function init() {
    const data = await fetchTimings();
    updateUI(data);
}

init();
