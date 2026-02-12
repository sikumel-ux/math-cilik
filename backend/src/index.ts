import { Hono } from 'hono';
import { jwt, sign } from 'hono/jwt';
import { cors } from 'hono/cors';

const app = new Hono<{ Bindings: { DB: D1Database } }>();
const SECRET = 'kunci-rahasia-mathcilik-2026';

app.use('*', cors());

// --- HELPER: GENERATE SOAL ---
const generateMath = () => {
  const isAdd = Math.random() > 0.5;
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return isAdd 
    ? { soal: `${a} + ${b}`, benar: a + b }
    : { soal: `${a + b} - ${a}`, benar: b }; // Pastikan tidak negatif
};

// --- AUTH: REGISTER & LOGIN ---
app.post('/auth/register', async (c) => {
  const { username, password, role } = await c.req.json();
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    "INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)"
  ).bind(id, username, password, role).run(); // Note: Harusnya di-hash, ini versi simple
  return c.json({ success: true });
});

app.post('/auth/login', async (c) => {
  const { username, password } = await c.req.json();
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE username = ? AND password_hash = ?")
    .bind(username, password).first();
  
  if (!user) return c.json({ error: 'Salah nih!' }, 401);
  
  const token = await sign({ id: user.id, role: user.role }, SECRET);
  return c.json({ token, role: user.role });
});

// --- QUIZ SYSTEM ---
app.use('/quiz/*', jwt({ secret: SECRET }));

app.post('/quiz/start', async (c) => {
  const payload = c.get('jwtPayload');
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    "INSERT INTO quiz_attempts (id, user_id, current_index, selesai) VALUES (?, ?, 0, 0)"
  ).bind(id, payload.id).run();
  
  const soalBaru = generateMath();
  return c.json({ attemptId: id, ...soalBaru, index: 1 });
});

app.post('/quiz/answer', async (c) => {
  const { attemptId, jawabanUser, jawabanBenar, soal, index } = await c.req.json();
  const isCorrect = parseInt(jawabanUser) === jawabanBenar;
  
  // Simpan jawaban
  await c.env.DB.prepare(
    "INSERT INTO quiz_answers (id, attempt_id, soal, jawaban_user, jawaban_benar, benar) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(crypto.randomUUID(), attemptId, soal, jawabanUser, jawabanBenar, isCorrect ? 1 : 0).run();

  if (index >= 10) {
    await c.env.DB.prepare("UPDATE quiz_attempts SET selesai = 1 WHERE id = ?").bind(attemptId).run();
    return c.json({ selesai: true });
  }

  return c.json({ selesai: false, ...generateMath(), nextIndex: index + 1 });
});

export default app;
    
