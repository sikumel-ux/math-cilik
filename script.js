const API_URL = "https://mathe.sekawanation.workers.dev";
let skor = 0;
let namaPlayer = "";
let jawabanBenar = 0;

// Audio Assets
const sfxBenar = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
const sfxSalah = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');

// Load Leaderboard saat halaman dibuka
window.onload = async () => {
    try {
        const res = await fetch(`${API_URL}/leaderboard`);
        const data = await res.json();
        const listContainer = document.getElementById('list-juara');
        
        if (data.length > 0) {
            listContainer.innerHTML = data.map((p, i) => `
                <div class="flex justify-between bg-indigo-50 p-2 rounded-lg">
                    <span>${i+1}. <b>${p.nama}</b></span>
                    <span class="font-bold text-indigo-600">${p.skor}</span>
                </div>
            `).join('');
        } else {
            listContainer.innerHTML = `<p class="text-center text-gray-400">Belum ada skor.</p>`;
        }
    } catch (e) {
        console.error("Gagal load leaderboard");
    }
};

function mulaiGame() {
    namaPlayer = document.getElementById('nama').value;
    if(!namaPlayer) return Swal.fire('Eitss!', 'Namamu siapa Jagoan?', 'warning');
    
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('display-nama').innerText = namaPlayer;
    buatSoal();
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

    const container = document.getElementById('pilihan-jawaban');
    container.innerHTML = pilihan.map(p => `
        <button onclick="cekJawaban(${p})" class="bg-white border-4 border-indigo-50 p-4 rounded-2xl text-2xl font-bold text-indigo-600 hover:border-indigo-400 active:scale-95 transition-all">${p}</button>
    `).join('');
}

async function cekJawaban(pilih) {
    if(pilih === jawabanBenar) {
        skor += 10;
        sfxBenar.play();
        
        // Kembang Api (Confetti)
        confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 }
        });

        setTimeout(buatSoal, 500);
    } else {
        sfxSalah.play();
        document.getElementById('app').classList.add('shake');
        
        // Simpan ke database
        await simpanSkor();
        
        Swal.fire({
            title: 'WADUH! 💥',
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
    } catch (e) {
        console.error("Gagal simpan skor");
    }
}

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
}
