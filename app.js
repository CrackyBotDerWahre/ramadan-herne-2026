const CONFIG = {
    city: 'Herne',
    country: 'Germany',
    method: 3,
    mawaqitId: 'msjd-ly-bn-by-tlb-herne-44649-germany'
};

async function fetchData() {
    // We use Aladhan for reliable JSON, Mawaqit as reference (visual)
    const today = new Date();
    const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
    const url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${CONFIG.city}&country=${CONFIG.country}&method=${CONFIG.method}`;

    try {
        const response = await fetch(url);
        const json = await response.json();
        return json.data;
    } catch (e) {
        return null;
    }
}

function updateUI(data) {
    if (!data) return;

    const timings = data.timings;
    const date = data.date;

    document.getElementById('current-gregorian').innerText = date.readable.toUpperCase();
    document.getElementById('hijri-date-text').innerText = `${date.hijri.day}. ${date.hijri.month.en}`;

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

        let diff = pDate - now;
        
        // If prayer is in the past, check if it's for tomorrow (e.g. Fajr after Isha)
        if (diff < 0) {
            pDate.setDate(pDate.getDate() + 1);
            diff = pDate - now;
        }

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
        document.getElementById('timer-label').innerText = `NEXT: ${nextPrayer.name.toUpperCase()}`;
        document.getElementById('next-prayer-time').innerText = nextPrayer.time;
        startCountdown(nextPrayer.date);
    }
}

let timerInterval;
function startCountdown(target) {
    if (timerInterval) clearInterval(timerInterval);
    function tick() {
        const diff = target - new Date();
        if (diff <= 0) { init(); return; }
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
    const data = await fetchData();
    updateUI(data);
}

init();
