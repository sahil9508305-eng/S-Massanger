// ===== STATE & DEFAULT DATA =====
let isSignupMode = false;
let currentUser = JSON.parse(localStorage.getItem('cp_user')) || null;
let activeChatId = null;
let bannerDismissed = false;

let users = JSON.parse(localStorage.getItem('cp_users')) || [
  { name: 'Rohan Mehta', email: 'rohan@chatpulse.in', password: '123', bio: 'Building cool stuff!' }
];

let chats = JSON.parse(localStorage.getItem('cp_chats')) || [
  {
    id: 1, name: 'Priya Sharma', avatar: 'P',
    messages: [
      { sender: 'them', text: 'Hey! Chai peene chalein shaam ko?', time: '10:15 AM' }
    ]
  },
  {
    id: 2, name: 'Aarav Patel', avatar: 'A',
    messages: [
      { sender: 'them', text: 'Bhai project deploy ho gaya kya?', time: '11:30 AM' }
    ]
  },
  {
    id: 3, name: 'Tech Team Group', avatar: 'T',
    messages: [
      { sender: 'them', text: 'Standup meeting 4 PM pe hai.', time: '01:00 PM' }
    ]
  }
];

let ads = JSON.parse(localStorage.getItem('cp_ads')) || [
  {
    id: 101, title: 'Festive Tech Sale - 40% Off',
    desc: 'Upgrade your gadgets with instant UPI cashback.',
    cta: 'Shop Now', placement: 'sidebar', active: true, impressions: 12, clicks: 3
  },
  {
    id: 102, title: 'Chai & Snacks in 10 Mins',
    desc: 'Use code PULSE50 for flat ₹50 off on first order.',
    cta: 'Order Now', placement: 'banner', active: true, impressions: 8, clicks: 2
  }
];

// Helper: Prevent XSS
const esc = (str) => String(str).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
const saveAll = () => {
  localStorage.setItem('cp_users', JSON.stringify(users));
  localStorage.setItem('cp_chats', JSON.stringify(chats));
  localStorage.setItem('cp_ads', JSON.stringify(ads));
};

// ===== 1. AUTHENTICATION LOGIC =====
const authScreen = document.getElementById('authScreen');
const appContainer = document.getElementById('appContainer');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const signupFields = document.getElementById('signupFields');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authError = document.getElementById('authError');

loginTab.onclick = () => {
  isSignupMode = false;
  loginTab.classList.add('active');
  signupTab.classList.remove('active');
  signupFields.classList.add('hidden');
  authSubmitBtn.textContent = 'Log In';
  authError.textContent = '';
};

signupTab.onclick = () => {
  isSignupMode = true;
  signupTab.classList.add('active');
  loginTab.classList.remove('active');
  signupFields.classList.remove('hidden');
  authSubmitBtn.textContent = 'Create Account';
  authError.textContent = '';
};

document.getElementById('authForm').onsubmit = (e) => {
  e.preventDefault();
  const email = document.getElementById('emailInput').value.trim().toLowerCase();
  const password = document.getElementById('passwordInput').value.trim();

  if (isSignupMode) {
    const name = document.getElementById('nameInput').value.trim();
    const bio = document.getElementById('bioInput').value.trim() || 'Available';
    if (!name) return (authError.textContent = 'Please enter your full name.');
    if (users.some(u => u.email === email)) return (authError.textContent = 'Email already registered.');

    const newUser = { name, email, password, bio };
    users.push(newUser);
    saveAll();
    loginUser(newUser);
  } else {
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return (authError.textContent = 'Invalid email or password.');
    loginUser(found);
  }
};

document.getElementById('demoLoginBtn').onclick = () => loginUser(users[0]);

function loginUser(user) {
  currentUser = user;
  localStorage.setItem('cp_user', JSON.stringify(user));
  authScreen.classList.add('hidden');
  appContainer.classList.remove('hidden');
  document.getElementById('userNameDisplay').textContent = user.name;
  document.getElementById('userAvatar').textContent = user.name[0].toUpperCase();
  renderChatList();
  renderAdSlots();
}

document.getElementById('logoutBtn').onclick = () => {
  localStorage.removeItem('cp_user');
  location.reload();
};

// ===== 2. MESSAGING LOGIC =====
function renderChatList(filter = '') {
  const listEl = document.getElementById('chatList');
  listEl.innerHTML = '';

  chats
    .filter(c => c.name.toLowerCase().includes(filter.toLowerCase()))
    .forEach(chat => {
      const lastMsg = chat.messages[chat.messages.length - 1];
      const div = document.createElement('div');
      div.className = `chat-item ${chat.id === activeChatId ? 'active' : ''}`;
      div.innerHTML = `
        <div class="avatar">${esc(chat.avatar)}</div>
        <div class="chat-meta">
          <h4>${esc(chat.name)}</h4>
          <p>${lastMsg ? esc(lastMsg.text) : 'No messages yet'}</p>
        </div>
      `;
      div.onclick = () => openChat(chat.id);
      listEl.appendChild(div);
    });
}

document.getElementById('searchChatInput').oninput = (e) => renderChatList(e.target.value);

function openChat(id) {
  activeChatId = id;
  bannerDismissed = false;
  const chat = chats.find(c => c.id === id);

  document.getElementById('emptyState').classList.add('hidden');
  document.getElementById('activeChatView').classList.remove('hidden');
  appContainer.classList.add('chat-open');

  document.getElementById('activeAvatar').textContent = chat.avatar;
  document.getElementById('activeName').textContent = chat.name;
  renderChatList(document.getElementById('searchChatInput').value);
  renderMessages();
  renderAdSlots();
}

document.getElementById('backBtn').onclick = () => appContainer.classList.remove('chat-open');

function renderMessages() {
  const chat = chats.find(c => c.id === activeChatId);
  const box = document.getElementById('messagesContainer');
  box.innerHTML = '';

  chat.messages.forEach(m => {
    const div = document.createElement('div');
    if (m.isPromo) {
      div.className = 'msg sent promo-bubble';
      div.innerHTML = `
        <span class="sponsored-tag">📢 Sponsored Offer</span>
        <h4>${esc(m.title)}</h4>
        <p>${esc(m.text)}</p>
        <span class="msg-time">${m.time} ✓✓</span>
      `;
    } else {
      div.className = `msg ${m.sender === 'me' ? 'sent' : 'received'}`;
      div.innerHTML = `
        ${esc(m.text)}
        <span class="msg-time">${m.time} ${m.sender === 'me' ? '✓✓' : ''}</span>
      `;
    }
    box.appendChild(div);
  });
  box.scrollTop = box.scrollHeight;
}

document.getElementById('messageForm').onsubmit = (e) => {
  e.preventDefault();
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (!text || !activeChatId) return;

  const chat = chats.find(c => c.id === activeChatId);
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  chat.messages.push({ sender: 'me', text, time });
  input.value = '';
  saveAll();
  renderMessages();
  renderChatList();

  // Simulated Auto-Reply
  const statusEl = document.getElementById('activeStatus');
  statusEl.textContent = 'typing...';
  setTimeout(() => {
    const replies = ['Sounds good! 👍', 'Haha bilkul sahi!', 'Got it, let me check.', 'Awesome, milte hain!'];
    const reply = replies[Math.floor(Math.random() * replies.length)];
    chat.messages.push({ sender: 'them', text: reply, time });
    statusEl.textContent = 'online';
    saveAll();
    if (activeChatId === chat.id) renderMessages();
    renderChatList();
  }, 1000);
};

// ===== 3. PROMOTIONAL AD MANAGER LOGIC =====
const adModal = document.getElementById('adModal');
document.getElementById('openAdModalBtn').onclick = () => { adModal.classList.remove('hidden'); renderAdDashboard(); };
document.getElementById('closeAdModalBtn').onclick = () => adModal.classList.add('hidden');

function trackAdClick(adId) {
  const ad = ads.find(a => a.id === adId);
  if (!ad) return;
  ad.clicks++;
  saveAll();
  renderAdDashboard();
  alert(`Ad Clicked: "${ad.title}"\n(Total Clicks: ${ad.clicks})`);
}

function renderAdSlots() {
  // Sidebar Sponsored Card
  const sidebarSlot = document.getElementById('sidebarAdSlot');
  const sideAd = ads.find(a => a.active && a.placement === 'sidebar');
  if (sideAd) {
    sideAd.impressions++;
    sidebarSlot.innerHTML = `
      <div class="sponsored-card">
        <span class="sponsored-tag">Sponsored</span>
        <h5>${esc(sideAd.title)}</h5>
        <p>${esc(sideAd.desc)}</p>
        <button onclick="trackAdClick(${sideAd.id})">${esc(sideAd.cta)}</button>
      </div>
    `;
  } else {
    sidebarSlot.innerHTML = '';
  }

  // Top Chat Banner
  const bannerSlot = document.getElementById('topBannerSlot');
  const bannerAd = ads.find(a => a.active && a.placement === 'banner');
  if (bannerAd && activeChatId && !bannerDismissed) {
    bannerAd.impressions++;
    bannerSlot.innerHTML = `
      <div class="top-banner-ad">
        <div>
          <span class="sponsored-tag">Ad</span>
          <b>${esc(bannerAd.title)}</b> — ${esc(bannerAd.desc)}
        </div>
        <div>
          <button class="small-btn" style="background:#f59e0b;color:#fff" onclick="trackAdClick(${bannerAd.id})">${esc(bannerAd.cta)}</button>
          <button class="icon-btn" onclick="dismissBanner()">✖</button>
        </div>
      </div>
    `;
  } else {
    bannerSlot.innerHTML = '';
  }
  saveAll();
}

window.dismissBanner = () => {
  bannerDismissed = true;
  document.getElementById('topBannerSlot').innerHTML = '';
};

// Send Promo Card directly into active chat
document.getElementById('sendPromoBtn').onclick = () => {
  const activeAd = ads.find(a => a.active);
  if (!activeAd) return alert('Koi active ad nahi hai. Pehle Ad Manager se ek campaign banayein.');
  const chat = chats.find(c => c.id === activeChatId);
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  chat.messages.push({ sender: 'me', isPromo: true, title: activeAd.title, text: activeAd.desc, time });
  activeAd.impressions++;
  saveAll();
  renderMessages();
};

// Create New Ad
document.getElementById('adForm').onsubmit = (e) => {
  e.preventDefault();
  ads.unshift({
    id: Date.now(),
    title: document.getElementById('adTitle').value.trim(),
    desc: document.getElementById('adDesc').value.trim(),
    cta: document.getElementById('adCta').value.trim(),
    placement: document.getElementById('adPlacement').value,
    active: true, impressions: 0, clicks: 0
  });
  e.target.reset();
  saveAll();
  renderAdDashboard();
  renderAdSlots();
};

function renderAdDashboard() {
  const activeCount = ads.filter(a => a.active).length;
  const totalImp = ads.reduce((sum, a) => sum + a.impressions, 0);
  const totalClicks = ads.reduce((sum, a) => sum + a.clicks, 0);
  const ctr = totalImp ? ((totalClicks / totalImp) * 100).toFixed(1) : 0;

  document.getElementById('statActiveAds').textContent = activeCount;
  document.getElementById('statImpressions').textContent = totalImp;
  document.getElementById('statClicks').textContent = totalClicks;
  document.getElementById('statCtr').textContent = `${ctr}%`;

  const list = document.getElementById('adListContainer');
  list.innerHTML = '';
  ads.forEach(ad => {
    const item = document.createElement('div');
    item.className = 'ad-list-item';
    item.innerHTML = `
      <div>
        <b>${esc(ad.title)}</b> (${ad.placement})<br/>
        <small>Views: ${ad.impressions} | Clicks: ${ad.clicks} | Status: ${ad.active ? '🟢 Active' : '⏸ Paused'}</small>
      </div>
      <div class="ad-item-actions">
        <button class="small-btn" onclick="toggleAd(${ad.id})">${ad.active ? 'Pause' : 'Resume'}</button>
        <button class="small-btn" style="background:#e53935;color:#fff" onclick="deleteAd(${ad.id})">Delete</button>
      </div>
    `;
    list.appendChild(item);
  });
}

window.toggleAd = (id) => {
  const ad = ads.find(a => a.id === id);
  if (ad) ad.active = !ad.active;
  saveAll();
  renderAdDashboard();
  renderAdSlots();
};

window.deleteAd = (id) => {
  ads = ads.filter(a => a.id !== id);
  saveAll();
  renderAdDashboard();
  renderAdSlots();
};

// ===== 4. THEME TOGGLE & INIT =====
document.getElementById('themeToggleBtn').onclick = () => {
  document.body.classList.toggle('dark');
};

if (currentUser) loginUser(currentUser);
