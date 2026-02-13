const API_URL = "https://mathe.sekawanation.workers.dev";
let skor = 0;
let namaPlayer = "";
let jawabanBenar = 0;
let isPaused = false;
let nyawa = 3;
let timerInterval;
let waktuSisa = 100;

const sfxBenar = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
const sfxSalah = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');

window.onload = async () => {
    loadLeaderboard();
    const savedNama = localStorage.getItem('math_nama');
    if (savedNama) document.getElementById('nama').value = savedNama;
};

async function loadLeaderboard() {
    try {
        const res = await fetch(`${API_URL}/leaderboard`);
        const data = await res.json();
        const listContainer = document.getElementById('list-juara');
        if (data && data.length > 0) {
            listContainer.innerHTML = data.map((p, i) => `
                <div class="flex justify-between bg-indigo-50 p-2 rounded-lg border-b-2 border-indigo-100 mb-1">
                    <span>${i+1}. <b>${p.nama}</b></span>
                    <span class="font-bold text-indigo-600">${p.skor}</span>
                </div>
            `).join('');
        }
    } catch (e) { console.log("Leaderboard error"); }
}

function mulaiGame() {
    namaPlayer = document.getElementById('nama').value.trim();
    if(!namaPlayer) return Swal.fire('Eitss!', 'Namamu siapa?', 'warning');
    
    localStorage.setItem('math_nama', namaPlayer);
    skor = 0;
    nyawa = 3;
    updateNyawaUI();
    
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('display-nama').innerText = namaPlayer;
    
    buatSoal();
}

function updateNyawaUI() {
    const container = document.getElementById('lives-container');
    let html = "";
    for(let i=0; i<3; i++) {
        html += `<span class="${i >= nyawa ? 'heart-lost' : ''}">❤️</span> `;
    }
    container.innerHTML = html;
}

function startTimer() {
    clearInterval(timerInterval);
    waktuSisa = 100;
    const bar = document.getElementById('timer-bar');
    
    // Kecepatan timer makin tinggi skor makin cepat
    const speed = Math.max(15, 80 - Math.floor(skor / 10));

    timerInterval = setInterval(() => {
        if (!isPaused) {
            waktuSisa -= 1;
            bar.style.width = waktuSisa + "%";
            if (waktuSisa <= 0) {
                clearInterval(timerInterval);
                kurangiNyawa("Waktu Habis! ⏰");
            }
        }
    }, speed);
}

function buatSoal() {
    // 1. Tentukan angka (Minimal 1 agar tidak 0 + 0)
    let range = 10 + Math.floor(skor / 50); 
    let a = Math.floor(Math.random() * range) + 1;
    let b = Math.floor(Math.random() * range) + 1;
    jawabanBenar = a + b;

    // 2. Update Tampilan
    document.getElementById('pertanyaan').innerText = `${a} + ${b}`;
    document.getElementById('display-skor').innerText = skor;

    // 3. Buat Pilihan Jawaban
    let pilihan = [jawabanBenar];
    while(pilihan.length < 4) {
        // Biar angka salahnya mirip-mirip jawaban benar
        let acak = Math.floor(Math.random() * 10) - 5; 
        let salah = jawabanBenar + acak;
        
        if(salah !== jawabanBenar && salah > 0 && !pilihan.includes(salah)) {
            pilihan.push(salah);
        }
    }
    
    // Acak posisi tombol
    pilihan.sort(() => Math.random() - 0.5);

    // 4. Masukkan ke HTML
    const container = document.getElementById('pilihan-jawaban');
    container.innerHTML = ""; 
    
    pilihan.forEach(angka => {
        const btn = document.createElement('button');
        btn.innerText = angka;
        btn.className = "bg-white border-4 border-indigo-50 p-4 rounded-2xl text-2xl font-bold text-indigo-600 shadow-sm hover:border-indigo-200 active:scale-95 transition-all";
        btn.onclick = () => cekJawaban(angka);
        container.appendChild(btn);
    });
    
    startTimer();
}

async function cekJawaban(pilih) {
    if (isPaused) return;

    if(parseInt(pilih) === jawabanBenar) {
        clearInterval(timerInterval);
        skor += 10;
        sfxBenar.play();
        simpanSkor(); 
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
        setTimeout(buatSoal, 300);
    } else {
        kurangiNyawa("Jawaban Salah! ❌");
    }
}

async function kurangiNyawa(pesan) {
    clearInterval(timerInterval);
    nyawa--;
    sfxSalah.play();
    updateNyawaUI();
    
    document.getElementById('app').classList.add('shake');
    setTimeout(() => document.getElementById('app').classList.remove('shake'), 400);

    if (nyawa <= 0) {
        await simpanSkor();
        Swal.fire({
            title: 'GAME OVER! 💥',
            text: `Skor akhir ${namaPlayer}: ${skor}`,
            icon: 'error',
            confirmButtonText: 'MAIN LAGI'
        }).then(() => location.reload());
    } else {
        Swal.fire({
            title: pesan,
            text: "Jangan menyerah!",
            timer: 1000,
            showConfirmButton: false
        }).then(() => buatSoal());
    }
}

async function simpanSkor() {
    try {
        await fetch(`${API_URL}/submit-score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nama: namaPlayer, skor: skor })
        });
    } catch (e) { console.log("Cloud offline"); }
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-screen').classList.toggle('hidden');
    document.getElementById('game-content').classList.toggle('blur-content');
                         }
                
