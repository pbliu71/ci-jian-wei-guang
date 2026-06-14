const API = { profile: '/api/profile', diary: '/api/diary', movies: '/api/movies', books: '/api/books', family: '/api/family' };
let token = localStorage.getItem('admin_token');

// ===== 工具函数 =====
function escapeHTML(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

async function api(url, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || '请求失败'); }
  return res.json();
}

// ===== 登录/退出 =====
const loginScreen = document.getElementById('loginScreen');
const adminApp = document.getElementById('adminApp');

function checkAuth() {
  if (token) {
    loginScreen.style.display = 'none';
    adminApp.style.display = 'block';
    loadAll();
  } else {
    loginScreen.style.display = 'flex';
    adminApp.style.display = 'none';
  }
}

document.getElementById('loginBtn').addEventListener('click', async () => {
  const pwd = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  try {
    const res = await api('/api/auth', { method: 'POST', body: JSON.stringify({ password: pwd }) });
    token = res.token;
    localStorage.setItem('admin_token', token);
    errEl.textContent = '';
    document.getElementById('loginPassword').value = '';
    checkAuth();
  } catch (e) {
    errEl.textContent = '❌ ' + e.message;
  }
});

document.getElementById('loginPassword').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('loginBtn').click();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  token = null;
  localStorage.removeItem('admin_token');
  checkAuth();
});

// ===== Tab 切换 =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ===== 日记管理 =====
function renderDiaryList(entries) {
  const list = document.getElementById('diaryList');
  if (!entries || entries.length === 0) {
    list.innerHTML = '<div class="empty-state">📝 还没有日记</div>';
    return;
  }
  list.innerHTML = entries.map(e => `
    <div class="item-card">
      <div class="item-card-content">
        <div class="item-card-title">${escapeHTML(e.title)}</div>
        <div class="item-card-sub">📅 ${escapeHTML(e.date)}</div>
        <div class="item-card-desc">${escapeHTML(e.content).slice(0, 120)}${e.content.length > 120 ? '...' : ''}</div>
        ${e.tags && e.tags.length > 0 ? '<div class="item-card-tags">' + e.tags.map(t => '<span>#' + escapeHTML(t) + '</span>').join('') + '</div>' : ''}
      </div>
      <div class="item-card-actions">
        <button class="btn btn-danger" onclick="deleteDiary('${e.id}')">删除</button>
      </div>
    </div>
  `).join('');
}

async function loadDiary() {
  const entries = await api(API.diary);
  renderDiaryList(entries);
}

document.getElementById('newDiaryBtn').addEventListener('click', () => {
  const form = document.getElementById('diaryForm');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
  if (form.style.display === 'block') {
    document.getElementById('diaryTitle').value = '';
    document.getElementById('diaryContent').value = '';
    document.getElementById('diaryDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('diaryTags').value = '';
  }
});

document.getElementById('cancelDiaryBtn').addEventListener('click', () => {
  document.getElementById('diaryForm').style.display = 'none';
});

document.getElementById('saveDiaryBtn').addEventListener('click', async () => {
  const title = document.getElementById('diaryTitle').value.trim();
  const content = document.getElementById('diaryContent').value.trim();
  if (!title || !content) { alert('标题和内容不能为空！'); return; }
  const date = document.getElementById('diaryDate').value;
  const tags = document.getElementById('diaryTags').value.split(',').map(t => t.trim()).filter(Boolean);
  try {
    await api(API.diary, { method: 'POST', body: JSON.stringify({ title, content, date, tags }) });
    document.getElementById('diaryForm').style.display = 'none';
    await loadDiary();
  } catch (e) { alert('发布失败: ' + e.message); }
});

async function deleteDiary(id) {
  if (!confirm('确定要删除这篇日记吗？')) return;
  try {
    await api(API.diary + '/' + id, { method: 'DELETE' });
    await loadDiary();
  } catch (e) { alert('删除失败: ' + e.message); }
}

// ===== 个人资料 =====
async function loadProfile() {
  const p = await api(API.profile);
  if (!p || !p.name) return;
  document.getElementById('pfName').value = p.name || '';
  document.getElementById('pfGreeting').value = p.greeting || '';
  document.getElementById('pfBio').value = p.bio || '';
  document.getElementById('pfAbout').value = p.aboutMe || '';
  document.getElementById('pfLocation').value = p.location || '';
  document.getElementById('pfOccupation').value = p.occupation || '';
  document.getElementById('pfEmail').value = p.email || '';
  document.getElementById('pfPassword').value = '';
}

document.getElementById('saveProfileBtn').addEventListener('click', async () => {
  const data = {
    name: document.getElementById('pfName').value.trim(),
    greeting: document.getElementById('pfGreeting').value.trim(),
    bio: document.getElementById('pfBio').value.trim(),
    aboutMe: document.getElementById('pfAbout').value.trim(),
    location: document.getElementById('pfLocation').value.trim(),
    occupation: document.getElementById('pfOccupation').value.trim(),
    email: document.getElementById('pfEmail').value.trim(),
    social: { github: '', weibo: '', twitter: '' }
  };
  const pwd = document.getElementById('pfPassword').value.trim();
  if (pwd) data.adminPassword = pwd;
  try {
    await api(API.profile, { method: 'POST', body: JSON.stringify(data) });
    alert('✅ 个人资料已保存！');
  } catch (e) { alert('保存失败: ' + e.message); }
});

// ===== 家庭管理 =====
function renderFamilyList(members) {
  const list = document.getElementById('familyList');
  if (!members || members.length === 0) {
    list.innerHTML = '<div class="empty-state">🏠 还没有家庭成员</div>';
    return;
  }
  list.innerHTML = members.map((m, i) => `
    <div class="item-card">
      <div class="item-card-content">
        <div class="item-card-title">${escapeHTML(m.name)}</div>
        <div class="item-card-sub">${escapeHTML(m.role)}</div>
        <div class="item-card-desc">${escapeHTML(m.description)}</div>
      </div>
      <div class="item-card-actions">
        <button class="btn btn-danger" onclick="deleteFamilyMember(${i})">删除</button>
      </div>
    </div>
  `).join('');
}

async function loadFamily() {
  const members = await api(API.family);
  renderFamilyList(members);
}

document.getElementById('addFamilyBtn').addEventListener('click', () => {
  showModal('添加家庭成员', [
    { id: 'fmName', label: '姓名', type: 'text' },
    { id: 'fmRole', label: '角色（如：爸爸、妈妈）', type: 'text' },
    { id: 'fmDesc', label: '描述', type: 'textarea' }
  ], async (data) => {
    const members = await api(API.family);
    members.push({ name: data.fmName, role: data.fmRole, description: data.fmDesc, image: '' });
    await api(API.family, { method: 'POST', body: JSON.stringify(members) });
    await loadFamily();
  });
});

async function deleteFamilyMember(index) {
  if (!confirm('确定要删除吗？')) return;
  const members = await api(API.family);
  members.splice(index, 1);
  await api(API.family, { method: 'POST', body: JSON.stringify(members) });
  await loadFamily();
}

// ===== 电影管理 =====
function renderMovieList(movies) {
  const list = document.getElementById('moviesList');
  if (!movies || movies.length === 0) {
    list.innerHTML = '<div class="empty-state">🎬 还没有电影</div>';
    return;
  }
  list.innerHTML = movies.map(m => `
    <div class="item-card">
      <div class="item-card-content">
        <div class="item-card-title">${escapeHTML(m.title)}</div>
        <div class="item-card-sub">${escapeHTML(m.director)} · ${m.year} · ⭐ ${m.rating}</div>
        <div class="item-card-desc">${escapeHTML(m.review)}</div>
      </div>
      <div class="item-card-actions">
        <button class="btn btn-danger" onclick="deleteMovie('${m.id}')">删除</button>
      </div>
    </div>
  `).join('');
}

async function loadMovies() {
  const movies = await api(API.movies);
  renderMovieList(movies);
}

document.getElementById('addMovieBtn').addEventListener('click', () => {
  showModal('添加电影', [
    { id: 'mvTitle', label: '电影名称', type: 'text' },
    { id: 'mvDirector', label: '导演', type: 'text' },
    { id: 'mvYear', label: '年份', type: 'number' },
    { id: 'mvRating', label: '评分 (1-10)', type: 'number' },
    { id: 'mvReview', label: '短评', type: 'textarea' }
  ], async (data) => {
    await api(API.movies, {
      method: 'POST',
      body: JSON.stringify({
        title: data.mvTitle,
        director: data.mvDirector,
        year: parseInt(data.mvYear),
        rating: parseFloat(data.mvRating),
        review: data.mvReview,
        image: ''
      })
    });
    await loadMovies();
  });
});

async function deleteMovie(id) {
  if (!confirm('确定删除吗？')) return;
  await api(API.movies + '/' + id, { method: 'DELETE' });
  await loadMovies();
}

// ===== 书籍管理 =====
function renderBookList(books) {
  const list = document.getElementById('booksList');
  if (!books || books.length === 0) {
    list.innerHTML = '<div class="empty-state">📚 还没有书籍</div>';
    return;
  }
  list.innerHTML = books.map(b => `
    <div class="item-card">
      <div class="item-card-content">
        <div class="item-card-title">${escapeHTML(b.title)}</div>
        <div class="item-card-sub">${escapeHTML(b.author)} · ${b.year} · ⭐ ${b.rating}</div>
        <div class="item-card-desc">${escapeHTML(b.review)}</div>
      </div>
      <div class="item-card-actions">
        <button class="btn btn-danger" onclick="deleteBook('${b.id}')">删除</button>
      </div>
    </div>
  `).join('');
}

async function loadBooks() {
  const books = await api(API.books);
  renderBookList(books);
}

document.getElementById('addBookBtn').addEventListener('click', () => {
  showModal('添加书籍', [
    { id: 'bkTitle', label: '书名', type: 'text' },
    { id: 'bkAuthor', label: '作者', type: 'text' },
    { id: 'bkYear', label: '出版年份', type: 'number' },
    { id: 'bkRating', label: '评分 (1-10)', type: 'number' },
    { id: 'bkReview', label: '短评', type: 'textarea' }
  ], async (data) => {
    await api(API.books, {
      method: 'POST',
      body: JSON.stringify({
        title: data.bkTitle,
        author: data.bkAuthor,
        year: parseInt(data.bkYear),
        rating: parseFloat(data.bkRating),
        review: data.bkReview,
        image: ''
      })
    });
    await loadBooks();
  });
});

async function deleteBook(id) {
  if (!confirm('确定删除吗？')) return;
  await api(API.books + '/' + id, { method: 'DELETE' });
  await loadBooks();
}

// ===== Modal =====
function showModal(title, fields, onSubmit) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3>${title}</h3>
      ${fields.map(f => `
        <div class="form-group">
          <label>${f.label}</label>
          ${f.type === 'textarea'
            ? `<textarea id="${f.id}" class="form-input" rows="3"></textarea>`
            : `<input type="${f.type}" id="${f.id}" class="form-input">`
          }
        </div>
      `).join('')}
      <div class="form-actions">
        <button class="btn btn-primary" id="modalSubmitBtn">确定</button>
        <button class="btn btn-outline" id="modalCancelBtn">取消</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#modalSubmitBtn').addEventListener('click', async () => {
    const data = {};
    fields.forEach(f => data[f.id] = document.getElementById(f.id).value.trim());
    if (fields.some(f => f.type !== 'textarea' && !data[f.id])) {
      alert('请填写所有必填项');
      return;
    }
    try {
      await onSubmit(data);
      overlay.remove();
    } catch (e) {
      alert('操作失败: ' + e.message);
    }
  });

  overlay.querySelector('#modalCancelBtn').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// ===== 加载全部 =====
async function loadAll() {
  try {
    await Promise.all([
      loadDiary(),
      loadProfile(),
      loadFamily(),
      loadMovies(),
      loadBooks()
    ]);
  } catch (e) {
    console.error('加载数据失败:', e);
  }
}

// ===== 初始化 =====
checkAuth();
