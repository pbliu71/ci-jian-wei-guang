// ===== 状态 & 工具 =====
const API = { profile: '/api/profile', diary: '/api/diary', movies: '/api/movies', books: '/api/books', family: '/api/family' };

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('请求失败: ' + url);
  return res.json();
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function stars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '') + ('☆'.repeat(5 - full - (half ? 1 : 0)));
}

// ===== 主题切换 =====
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
});

// ===== 导航 =====
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

function navigateTo(sectionId) {
  // 更新导航状态
  navLinks.forEach(link => link.classList.remove('active'));
  sections.forEach(s => s.classList.remove('active'));

  const targetLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
  const targetSection = document.getElementById(`section-${sectionId}`);

  if (targetLink) targetLink.classList.add('active');
  if (targetSection) targetSection.classList.add('active');

  // 关闭移动端菜单
  navMenu.classList.remove('open');

  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = link.dataset.section;
    history.pushState(null, '', '#' + section);
    navigateTo(section);
  });
});

menuToggle.addEventListener('click', () => {
  navMenu.classList.toggle('open');
});

// 监听 hash 变化
window.addEventListener('hashchange', () => {
  const hash = location.hash.replace('#', '') || 'home';
  navigateTo(hash);
});

// ===== 加载数据 =====

// 首页
async function loadProfile() {
  try {
    const profile = await fetchJSON(API.profile);
    if (!profile) return;

    document.getElementById('heroGreeting').textContent = profile.greeting || '你好，欢迎来到我的小站 🌟';
    document.getElementById('heroName').textContent = profile.name;
    document.getElementById('heroBio').textContent = profile.bio;
    document.getElementById('aboutMe').textContent = profile.aboutMe || '';

    // 信息
    const info = document.getElementById('heroInfo');
    info.innerHTML = '';
    const items = [];
    if (profile.location) items.push({ icon: '📍', text: profile.location });
    if (profile.occupation) items.push({ icon: '💼', text: profile.occupation });
    if (profile.email) items.push({ icon: '📧', text: profile.email });
    items.forEach(item => {
      const el = document.createElement('span');
      el.className = 'hero-info-item';
      el.innerHTML = `${item.icon} ${escapeHTML(item.text)}`;
      info.appendChild(el);
    });

    // 社交链接
    const social = document.getElementById('heroSocial');
    social.innerHTML = '';
    if (profile.social) {
      const iconMap = { github: '🐙', weibo: '📱', twitter: '🐦', zhihu: '📘', bilibili: '📺' };
      Object.entries(profile.social).forEach(([key, url]) => {
        if (!url) return;
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.title = key;
        a.textContent = iconMap[key] || '🔗';
        social.appendChild(a);
      });
    }

    // 时间线
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';
    if (profile.growth && profile.growth.length > 0) {
      profile.growth.forEach(item => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.innerHTML = `
          <div class="timeline-dot"></div>
          <div class="timeline-year">${escapeHTML(item.year)}</div>
          <div class="timeline-title">${escapeHTML(item.title)}</div>
          <div class="timeline-desc">${escapeHTML(item.description)}</div>
        `;
        timeline.appendChild(div);
      });
    }

    // 标题
    document.title = `${profile.name} 的个人主页`;
  } catch (err) {
    console.error('加载个人资料失败:', err);
  }
}

// 家庭
async function loadFamily() {
  try {
    const members = await fetchJSON(API.family);
    const grid = document.getElementById('familyGrid');
    grid.innerHTML = '';

    const icons = ['👨', '👩', '🧑', '👴', '👵', '👶'];
    members.forEach((member, i) => {
      const card = document.createElement('div');
      card.className = 'family-card';
      card.innerHTML = `
        <div class="family-avatar">${member.image ? '<img src="' + escapeHTML(member.image) + '" alt="' + escapeHTML(member.name) + '">' : (icons[i] || '👤')}</div>
        <h3 class="family-name">${escapeHTML(member.name)}</h3>
        <p class="family-role">${escapeHTML(member.role)}</p>
        <p class="family-desc">${escapeHTML(member.description)}</p>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error('加载家庭成员失败:', err);
  }
}

// 电影
async function loadMovies() {
  try {
    const movies = await fetchJSON(API.movies);
    const grid = document.getElementById('moviesGrid');
    grid.innerHTML = '';

    const icons = ['🎬', '🎥', '🎞️', '📽️', '🍿', '🎭'];
    movies.forEach((movie, i) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-title">${icons[i % icons.length]} ${escapeHTML(movie.title)}</div>
        <div class="card-sub">${escapeHTML(movie.director)} · ${movie.year}</div>
        <div class="card-rating">${stars(movie.rating)} ${movie.rating}</div>
        <div class="card-review">${escapeHTML(movie.review)}</div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error('加载电影失败:', err);
  }
}

// 书籍
async function loadBooks() {
  try {
    const books = await fetchJSON(API.books);
    const grid = document.getElementById('booksGrid');
    grid.innerHTML = '';

    const icons = ['📖', '📕', '📗', '📘', '📙', '📚'];
    books.forEach((book, i) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-title">${icons[i % icons.length]} ${escapeHTML(book.title)}</div>
        <div class="card-sub">${escapeHTML(book.author)} · ${book.year}</div>
        <div class="card-rating">${stars(book.rating)} ${book.rating}</div>
        <div class="card-review">${escapeHTML(book.review)}</div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error('加载书籍失败:', err);
  }
}

// 日记
let allDiary = [];
let activeDiaryTag = null;

function renderDiary(entries) {
  const list = document.getElementById('diaryList');
  if (!entries || entries.length === 0) {
    list.innerHTML = '<div class="diary-empty">📝 还没有日记，快来写第一篇吧！</div>';
    return;
  }

  list.innerHTML = '';
  entries.forEach((entry, i) => {
    const div = document.createElement('div');
    div.className = 'diary-entry';
    div.style.animationDelay = (i * 0.1) + 's';
    div.innerHTML = `
      <div class="diary-entry-header">
        <h3 class="diary-entry-title">${escapeHTML(entry.title)}</h3>
        <span class="diary-entry-date">📅 ${escapeHTML(entry.date)}</span>
      </div>
      <div class="diary-entry-content">${escapeHTML(entry.content)}</div>
      ${entry.tags && entry.tags.length > 0 ? '<div class="diary-entry-tags">' + entry.tags.map(t => '<span class="diary-entry-tag">#' + escapeHTML(t) + '</span>').join('') + '</div>' : ''}
    `;
    list.appendChild(div);
  });
}

function updateDiaryTags(entries) {
  const container = document.getElementById('diaryTags');
  const tags = [...new Set(entries.flatMap(e => e.tags || []))];
  container.innerHTML = '<button class="diary-tag' + (activeDiaryTag === null ? ' active' : '') + '" data-tag="">全部</button>';
  tags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'diary-tag' + (activeDiaryTag === tag ? ' active' : '');
    btn.dataset.tag = tag;
    btn.textContent = '# ' + tag;
    btn.addEventListener('click', () => {
      activeDiaryTag = activeDiaryTag === tag ? null : tag;
      updateDiaryTags(entries);
      filterDiary();
    });
    container.appendChild(btn);
  });
}

function filterDiary() {
  const search = (document.getElementById('diarySearch').value || '').toLowerCase();
  let filtered = allDiary;
  if (activeDiaryTag) {
    filtered = filtered.filter(e => e.tags && e.tags.includes(activeDiaryTag));
  }
  if (search) {
    filtered = filtered.filter(e =>
      e.title.toLowerCase().includes(search) ||
      e.content.toLowerCase().includes(search)
    );
  }
  renderDiary(filtered);
}

async function loadDiary() {
  try {
    allDiary = await fetchJSON(API.diary);
    activeDiaryTag = null;
    updateDiaryTags(allDiary);
    renderDiary(allDiary);

    document.getElementById('diarySearch').addEventListener('input', filterDiary);
  } catch (err) {
    console.error('加载日记失败:', err);
  }
}

// ===== Back to Top =====
const backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  backToTop.classList.toggle('visible', window.scrollY > 400);
});
backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== 页脚年份 =====
document.getElementById('footerYear').textContent = new Date().getFullYear();

// ===== 初始化 =====
async function init() {
  // 处理初始 hash
  const initialHash = location.hash.replace('#', '') || 'home';
  navigateTo(initialHash);

  // 加载所有数据
  await Promise.all([
    loadProfile(),
    loadFamily(),
    loadMovies(),
    loadBooks(),
    loadDiary()
  ]);
}

document.addEventListener('DOMContentLoaded', init);
