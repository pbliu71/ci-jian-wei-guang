const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function readJSON(filename) {
  const file = path.join(DATA_DIR, filename);
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch { return []; }
}

function writeJSON(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf-8');
}

// Diary
app.get('/api/diary', (req, res) => { res.json(readJSON('diary.json')); });

app.post('/api/diary', (req, res) => {
  const { title, content, date, tags } = req.body;
  if (!title || !content) return res.status(400).json({ error: '标题和内容不能为空' });
  const diary = readJSON('diary.json');
  const entry = { id: Date.now().toString(), title, content, date: date || new Date().toISOString().split('T')[0], tags: tags || [], createdAt: new Date().toISOString() };
  diary.unshift(entry);
  writeJSON('diary.json', diary);
  res.status(201).json(entry);
});

app.delete('/api/diary/:id', (req, res) => {
  let diary = readJSON('diary.json');
  diary = diary.filter(e => e.id !== req.params.id);
  writeJSON('diary.json', diary);
  res.json({ success: true });
});

// Profile
app.get('/api/profile', (req, res) => {
  const p = readJSON('profile.json');
  res.json(p.length > 0 ? p[0] : {});
});

app.post('/api/profile', (req, res) => {
  writeJSON('profile.json', [req.body]);
  res.json({ success: true });
});

// Movies
app.get('/api/movies', (req, res) => { res.json(readJSON('movies.json')); });

app.post('/api/movies', (req, res) => {
  const movies = readJSON('movies.json');
  const movie = { id: Date.now().toString(), ...req.body };
  movies.push(movie);
  writeJSON('movies.json', movies);
  res.status(201).json(movie);
});

app.delete('/api/movies/:id', (req, res) => {
  let movies = readJSON('movies.json');
  movies = movies.filter(m => m.id !== req.params.id);
  writeJSON('movies.json', movies);
  res.json({ success: true });
});

// Books
app.get('/api/books', (req, res) => { res.json(readJSON('books.json')); });

app.post('/api/books', (req, res) => {
  const books = readJSON('books.json');
  const book = { id: Date.now().toString(), ...req.body };
  books.push(book);
  writeJSON('books.json', books);
  res.status(201).json(book);
});

app.delete('/api/books/:id', (req, res) => {
  let books = readJSON('books.json');
  books = books.filter(b => b.id !== req.params.id);
  writeJSON('books.json', books);
  res.json({ success: true });
});

// Family
app.get('/api/family', (req, res) => { res.json(readJSON('family.json')); });

app.post('/api/family', (req, res) => {
  writeJSON('family.json', req.body);
  res.json({ success: true });
});

// Auth
app.post('/api/auth', (req, res) => {
  const { password } = req.body;
  const profile = readJSON('profile.json');
  const adminPwd = profile.length > 0 && profile[0].adminPassword ? profile[0].adminPassword : 'admin123';
  if (password === adminPwd) {
    res.json({ success: true, token: 'simple-token-' + Date.now() });
  } else {
    res.status(401).json({ error: '密码错误' });
  }
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API 不存在' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('🌟 个人主页已启动！');
  console.log('📌 访问地址: http://localhost:' + PORT);
  console.log('🔐 管理后台: http://localhost:' + PORT + '/admin/');
});
