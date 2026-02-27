const CONFIG = {
    city: 'Herne',
    country: 'Germany',
    method: 3
};

async function fetchCalendar() {
    const today = new Date();
    // Fetch current month calendar
    const res = await fetch(`https://api.aladhan.com/v1/calendarByCity/${today.getFullYear()}/${today.getMonth() + 1}?city=${CONFIG.city}&country=${CONFIG.country}&method=${CONFIG.method}`);
    const json = await res.json();
    return json.data;
}

function updateUI(calendarData) {
    if (!calendarData) return;

    const today = new Date();
    const currentDay = today.getDate();
    const todayData = calendarData[currentDay - 1];
    
    // Header & Hero
    document.getElementById('current-gregorian').innerText = todayData.date.readable.toUpperCase();
    document.getElementById('hijri-date-text').innerText = `${todayData.date.hijri.day}. ${todayData.date.hijri.month.en}`;

    // Today's Grid
    const grid = document.getElementById('prayer-grid');
    grid.innerHTML = '';
    const relevant = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    
    relevant.forEach(p => {
        const time = todayData.timings[p].split(' ')[0];
        const card = document.createElement('div');
        card.className = `prayer-card`;
        card.innerHTML = `<span class="p-name">${p.toUpperCase()}</span><span class="p-time">${time}</span>`;
        grid.appendChild(card);
    });

    // Next Prayer Logic
    const now = new Date();
    let next = null;
    relevant.forEach(p => {
        const timeStr = todayData.timings[p].split(' ')[0];
        const [h, m] = timeStr.split(':');
        const pDate = new Date(); pDate.setHours(h, m, 0);
        if (pDate > now && (!next || pDate < next.date)) {
            next = { name: p, time: timeStr, date: pDate };
        }
    });

    if (next) {
        document.getElementById('timer-label').innerText = `NEXT: ${next.name.toUpperCase()}`;
        document.getElementById('next-prayer-time').innerText = next.time;
        startCountdown(next.date);
        // Highlight active card
        Array.from(grid.children).forEach(c => {
            if (c.querySelector('.p-name').innerText === next.name.toUpperCase()) c.classList.add('active');
        });
    }

    // Month Calendar
    const tbody = document.getElementById('calendar-body');
    tbody.innerHTML = '';
    
    calendarData.forEach(day => {
        if (day.date.hijri.month.number === 9) { // Only show Ramadan days
            const tr = document.createElement('tr');
            if (parseInt(day.date.gregorian.day) === currentDay) tr.className = 'today';
            
            tr.innerHTML = `
                <td>${day.date.hijri.day}</td>
                <td>${day.date.timings.Fajr.split(' ')[0]}</td>
                <td>${day.date.timings.Maghrib.split(' ')[0]}</td>
            `;
            tbody.appendChild(tr);
        }
    });
}

let timerInterval;
function startCountdown(target) {
    if (timerInterval) clearInterval(timerInterval);
    function tick() {
        const diff = target - new Date();
        if (diff <= 0) { location.reload(); return; }
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        document.getElementById('countdown').innerText = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    tick(); timerInterval = setInterval(tick, 1000);
}

async function init() {
    const data = await fetchCalendar();
    updateUI(data);
}

init();
