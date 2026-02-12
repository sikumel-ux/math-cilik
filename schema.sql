-- Hapus tabel lama jika ingin reset (Hati-hati: data akan hilang!)
DROP TABLE IF EXISTS quiz_answers;
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS users;

-- 1. Tabel untuk menyimpan data Pengguna (Anak & Orang Tua)
CREATE TABLE users (
    id TEXT PRIMARY KEY,             -- UUID Unik
    username TEXT UNIQUE NOT NULL,    -- Nama untuk login
    password_hash TEXT NOT NULL,      -- Password (simpan hash)
    role TEXT NOT NULL,               -- 'anak' atau 'orangtua'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel untuk sesi Quiz (Satu sesi isi 10 soal)
CREATE TABLE quiz_attempts (
    id TEXT PRIMARY KEY,             -- ID Sesi Quiz
    user_id TEXT NOT NULL,            -- ID Anak yang mengerjakan
    skor INTEGER DEFAULT 0,           -- Jumlah jawaban benar
    total_soal INTEGER DEFAULT 10,    -- Target soal
    selesai BOOLEAN DEFAULT 0,        -- 0 = Sedang jalan, 1 = Selesai
    current_index INTEGER DEFAULT 0,  -- Soal terakhir yang dikerjakan
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 3. Tabel untuk detail jawaban per soal
CREATE TABLE quiz_answers (
    id TEXT PRIMARY KEY,             -- ID Jawaban
    attempt_id TEXT NOT NULL,         -- ID Sesi Quiz-nya
    soal TEXT NOT NULL,               -- Teks soal (misal: "5 + 3")
    jawaban_user INTEGER,             -- Jawaban dari si anak
    jawaban_benar INTEGER,            -- Jawaban yang seharusnya
    benar BOOLEAN,                    -- Hasil cek otomatis
    FOREIGN KEY(attempt_id) REFERENCES quiz_attempts(id)
);
