const API_URL = "https://mathe.sekawanation.workers.dev";
let skor = 0;
let namaPlayer = "";
let jawabanBenar = 0;
let isPaused = false;

// Audio Assets
const sfxBenar = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
const sfxSalah = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');

// 1. Load Leaderboard & Cek Sesi Lama
window.onload = async () => {
    loadLeaderboard();
    
    // Cek apakah ada sesi yang tersimpan di HP
    const savedNama = localStorage.getItem('math_nama');
    const savedSkor = localStorage.getItem('math_skor');
    
    if (savedNama && savedSkor) {
        document.getElementById('nama').value = savedNama;
        // Opsional: Beri tahu user ada skor lama
        console.log(`Sesi ditemukan: ${savedNama} dengan skor ${savedSkor}`);
    }
};

async function loadLeaderboard() {
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
        }
    } catch (e) { console.error("Gagal load leaderboard"); }
}

// 2. Fungsi Mulai Game (dengan Logika Resume)
function mulaiGame() {
    const inputNama = document.getElementById('nama').value;
    if(!inputNama) return Swal.fire('Eitss!', 'Namamu siapa?', 'warning');
    
    namaPlayer = inputNama;
    
    // Jika nama sama dengan yang tersimpan, lanjutkan skornya
    const savedNama = localStorage.getItem('math_nama');
    if (namaPlayer === savedNama) {
        skor = parseInt(localStorage.getItem('math_skor')) || 0;
    } else {
        skor = 0; // Nama baru, mulai dari nol
        localStorage.setItem('math_nama', namaPlayer);
        localStorage.setItem('math_skor', 0);
    }
    
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('display-nama').innerText = namaPlayer;
    buatSoal();
}

// 3. Fungsi Pause (Lock Total)
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

// 4. Buat Soal
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

// 5. Cek Jawaban (Sudah Diperbaiki)
async function cekJawaban(pilih) {
    // KUNCI: Jika sedang pause, jangan lakukan apa-apa
    if (isPaused) return;

    if(pilih === jawabanBenar) {
        skor += 10;
        sfxBenar.play();
        
        // Simpan ke HP (Local) & Cloud (Worker)
        localStorage.setItem('math_skor', skor);
        simpanSkor(); 

        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        setTimeout(buatSoal, 500);
    } else {
        sfxSalah.play();
        document.getElementById('app').classList.add('shake');
        
        // Hapus sesi lokal karena kalah
        localStorage.removeItem('math_skor');
        
        await simpanSkor();
        
        Swal.fire({
            title: 'GAME OVER! 💥',
            text: `Skor akhir ${namaPlayer}: ${skor}`,
            icon: 'error',
            confirmButtonText: 'MAIN LAGI',
            allowOutsideClick: false
        }).then(() => location.reload());
    }
}

async function simpanSkor() {
    try {
        await fetch(`${API_URL}/submit-score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nama: namaPlayer, skor: skor })
        });
    } catch (e) { console.error("Koneksi cloud gagal"); }
            }
