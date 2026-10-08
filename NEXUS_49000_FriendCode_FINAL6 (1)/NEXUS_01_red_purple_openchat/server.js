
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'referrals.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ codes: {}, visits: [] }, null, 2));

function loadData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { codes: {}, visits: [] }; }
}
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function cleanCode(code) {
  return String(code || '').trim().replace(/[^A-Za-z0-9_-]/g, '').slice(0, 30);
}
function newCode() {
  return 'NEXUS-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

app.get('/api/referral/new', (req, res) => {
  const data = loadData();
  let code = newCode();
  while (data.codes[code]) code = newCode();
  data.codes[code] = { createdAt: new Date().toISOString(), visits: 0, purchases: 0 };
  saveData(data);
  res.json({ code, url: `${req.protocol}://${req.get('host')}/?ref=${encodeURIComponent(code)}` });
});

app.post('/api/referral/register', (req, res) => {
  const code = cleanCode(req.body.code);
  if (!code) return res.status(400).json({ error: '추천인 코드를 입력하세요.' });
  const data = loadData();
  if (data.codes[code]) return res.status(409).json({ error: '이미 사용 중인 추천인 코드입니다.' });
  data.codes[code] = { createdAt: new Date().toISOString(), visits: 0, purchases: 0 };
  saveData(data);
  res.json({ code, url: `${req.protocol}://${req.get('host')}/?ref=${encodeURIComponent(code)}` });
});

app.post('/api/referral/visit', (req, res) => {
  const code = cleanCode(req.body.code);
  if (!code) return res.json({ ok: true, tracked: false });
  const data = loadData();
  if (!data.codes[code]) return res.json({ ok: true, tracked: false });
  data.codes[code].visits = (data.codes[code].visits || 0) + 1;
  data.visits.push({ code, at: new Date().toISOString() });
  if (data.visits.length > 5000) data.visits = data.visits.slice(-5000);
  saveData(data);
  res.json({ ok: true, tracked: true });
});

app.get('/api/referral/:code', (req, res) => {
  const code = cleanCode(req.params.code);
  const data = loadData();
  if (!data.codes[code]) return res.status(404).json({ error: '추천인 코드를 찾을 수 없습니다.' });
  res.json({ code, ...data.codes[code] });
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`NEXUS running on ${PORT}`));
