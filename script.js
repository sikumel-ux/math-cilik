const API_URL = "https://mathe.sekawanation.workers.dev";
let skor = 0;
let namaPlayer = "";
let jawabanBenar = 0;
let isPaused = false;

const sfxBenar = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
const sfxSalah = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');

// 1. Load Data Saat Buka Web
window.onload = async () => {
    loadLeaderboard();
    
    // Cek jika ada sesi tertinggal
    const savedNama = localStorage.getItem('math_nama');
    const savedSkor = localStorage.getItem('math_skor');
    if (savedNama) {
        document.getElementById('nama').value = savedNama;
        console.log("Sesi ditemukan untuk: " + savedNama);
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

// 2. Logika Mulai / Resume
function mulaiGame() {
    namaPlayer = document.getElementById('nama').value.trim();
    if(!namaPlayer) return Swal.fire('Eitss!', 'Namamu siapa?', 'warning');
    
    const savedNama = localStorage.getItem('math_nama');
    // Jika ganti nama, mulai dari 0. Jika nama sama, teruskan skor.
    if (namaPlayer === savedNama) {
        skor = parseInt(localStorage.getItem('math_skor')) || 0;
    } else {
        skor = 0;
        localStorage.setItem('math_nama', namaPlayer);
        localStorage.setItem('math_skor', 0);
    }
    
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('display-nama').innerText = namaPlayer;
    buatSoal();
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-screen').classList.toggle('hidden');
    document.getElementById('game-content').classList.toggle('blur-content');
}

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

    document.getElementById('pilihan-jawaban').innerHTML = pilihan.map(p => `
        <button onclick="cekJawaban(${p})" class="bg-white border-4 border-indigo-50 p-4 rounded-2xl text-2xl font-bold text-indigo-600 hover:border-indigo-400 active:scale-95 transition-all shadow-sm">${p}</button>
    `).join('');
}

async function cekJawaban(pilih) {
    if (isPaused) return; // Lock saat pause

    if(pilih === jawabanBenar) {
        skor += 10;
        sfxBenar.play();
        localStorage.setItem('math_skor', skor); // Simpan di HP
        simpanSkor(); // Simpan di Cloud
        
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        setTimeout(buatSoal, 500);
    } else {
        sfxSalah.play();
        document.getElementById('app').classList.add('shake');
        
        // Game Over: Hapus progres di HP tapi rekor di Cloud tetap ada
        localStorage.removeItem('math_skor');
        await simpanSkor();
        
        Swal.fire({
            title: 'GAME OVER! 💥',
            text: `Skor ${namaPlayer}: ${skor}`,
            icon: 'error',
            confirmButtonText: 'MAIN LAGI'
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
    } catch (e) { console.log("Cloud offline"); }
            }
        
