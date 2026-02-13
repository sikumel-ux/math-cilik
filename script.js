const API_URL = "https://mathe.sekawanation.workers.dev";
let skor = 0;
let namaPlayer = "";
let jawabanBenar = 0;
let isPaused = false;

// Audio Assets
const sfxBenar = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
const sfxSalah = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');

// 1. Load Leaderboard saat buka web
window.onload = async () => {
    try {
        const res = await fetch(`${API_URL}/leaderboard`);
        const data = await res.json();
        const listContainer = document.getElementById('list-juara');
        
        if (data && data.length > 0) {
            listContainer.innerHTML = data.map((p, i) => `
                <div class="flex justify-between bg-indigo-50 p-2 rounded-lg border-b-2 border-indigo-100">
                    <span>${i+1}. <b>${p.nama}</b></span>
                    <span class="font-bold text-indigo-600">${p.skor}</span>
                </div>
            `).join('');
        } else {
            listContainer.innerHTML = `<p class="text-center text-gray-400 italic">Belum ada skor. Jadilah yang pertama!</p>`;
        }
    } catch (e) {
        console.error("Gagal ambil leaderboard");
    }
};

// 2. Fungsi Mulai Game
function mulaiGame() {
    namaPlayer = document.getElementById('nama').value;
    if(!namaPlayer) return Swal.fire('Eitss!', 'Namamu siapa?', 'warning');
    
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('display-nama').innerText = namaPlayer;
    buatSoal();
}

// 3. Fungsi Pause/Istirahat
function togglePause() {
    isPaused = !isPaused;
    const pauseScreen = document.getElementById('pause-screen');
    const gameContent = document.getElementById('game-content');
    
    if (isPaused) {
        pauseScreen.classList.remove('hidden');
        gameContent.classList.add('blur-content');
    } else {
        pauseScreen.classList.add('hidden');
        gameContent.classList.remove('blur-content');
    }
}

// 4. Logika Membuat Soal
function buatSoal() {
    let range = 10 + Math.floor(skor / 50); 
    let a = Math.floor(Math.random() * range) + 1;
    let b = Math.floor(Math.random() * range) + 1;
    jawabanBenar = a + b;

    document.getElementById('pertanyaan').innerText = `${a} + ${b}`;
    document.getElementById('display-skor').innerText = skor;

    let pilihan = [jawabanBenar];
    while(pilihan.length < 4) {
        let salah = jawabanBenar + (Math.floor(Math.random() * 10) - 5);
        if(salah !== jawabanBenar && salah > 0) pilihan.push(salah);
        pilihan = [...new Set(pilihan)];
    }
    pilihan.sort(() => Math.random() - 0.5);

    const container = document.getElementById('pilihan-jawaban');
    container.innerHTML = pilihan.map(p => `
        <button onclick="cekJawaban(${p})" class="bg-white border-4 border-indigo-50 p-4 rounded-2xl text-2xl font-bold text-indigo-600 hover:border-indigo-400 active:scale-95 transition-all shadow-sm">${p}</button>
    `).join('');
}

// 5. Cek Jawaban & Kirim Skor Otomatis
async function cekJawaban(pilih) {
    if (isPaused) return;

    if(pilih === jawabanBenar) {
        skor += 10;
        sfxBenar.play();
        
        // Simpan setiap jawaban benar (Anti-Reload)
        simpanSkor();

        // Efek Kembang Api
        confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#f472b6']
        });

        setTimeout(buatSoal, 500);
    } else {
        sfxSalah.play();
        document.getElementById('app').classList.add('shake');
        
        // Simpan skor terakhir saat kalah
        await simpanSkor();
        
        Swal.fire({
            title: 'GAME OVER! 💥',
            text: `Skor akhir ${namaPlayer}: ${skor}`,
            icon: 'error',
            confirmButtonText: 'MAIN LAGI',
            confirmButtonColor: '#6366f1',
            allowOutsideClick: false
        }).then(() => location.reload());
    }
}

// 6. Fungsi Komunikasi ke Cloudflare Worker
async function simpanSkor() {
    try {
        await fetch(`${API_URL}/submit-score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nama: namaPlayer, skor: skor })
        });
    } catch (e) {
        console.error("Koneksi database terganggu");
    }
}

// Register Service Worker PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
                   }
        
