const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const { convertDate } = require('./lunar');
const { tinhLaSo } = require('./calc');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

const USERS = [
  { username: 'demo', password: 'demo123', paid: true },
  { username: 'free', password: 'free123', paid: false }
];
const USER_STORE = USERS; // simple in-memory store for demo

function requireAuth(req, res, next) {
  if (req.session?.user) return next();
  return res.status(401).json({ error: 'Yeu cau dang nhap' });
}

function requirePaid(req, res, next) {
  if (!req.session?.user) return res.status(401).json({ error: 'Yeu cau dang nhap' });
  if (!req.session.user.paid) return res.status(403).json({ error: 'Tai khoan chua co goi tra phi' });
  return next();
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Thieu thong tin dang nhap' });
  const user = USER_STORE.find((u) => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Sai tai khoan hoac mat khau' });
  req.session.user = { username: user.username, paid: user.paid };
  res.json({ ok: true, user: req.session.user });
});

// Demo register (in-memory)
app.post('/api/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Thieu thong tin dang ky' });
  const exists = USER_STORE.find(u => u.username === username);
  if (exists) return res.status(400).json({ error: 'Tai khoan da ton tai' });
  const newUser = { username, password, paid: false };
  USER_STORE.push(newUser);
  req.session.user = { username, paid: false };
  res.json({ ok: true, user: req.session.user });
});

// Demo: activate paid for current user (mock purchase)
app.post('/api/activate-paid', requireAuth, (req, res) => {
  const username = req.session.user.username;
  const u = USER_STORE.find(user => user.username === username);
  if (u) u.paid = true;
  req.session.user.paid = true;
  res.json({ ok: true, user: req.session.user });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', (req, res) => {
  res.json({ authenticated: !!req.session?.user, user: req.session?.user || null });
});

// Public: an la so
app.post('/api/convert', (req, res) => {
  try {
    const result = convertDate(req.body || {});
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Invalid input' });
  }
});

// Tính lá số (bước 1): chuyển logic tính toán sang backend
app.post('/api/tinh-laso', (req, res) => {
  try {
    const result = tinhLaSo(req.body || {});
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Invalid input' });
  }
});

// Paid-only sample endpoints
app.post('/api/premium/tra-cuu-sao', requirePaid, (req, res) => {
  res.json({
    data: [],
    note: 'Day la du lieu gia lap. Chi tai khoan tra phi moi xem duoc.'
  });
});

app.post('/api/premium/cach-cuc', requirePaid, (req, res) => {
  res.json({
    data: [],
    note: 'Cach cuc premium (demo).'
  });
});

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '../frontend')));

// Catch-all route (Express 5)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server chay tai http://localhost:${PORT}`);
});
