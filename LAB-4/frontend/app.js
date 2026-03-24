// ─── Theme toggle ─────────────────────────────────────────────────────────
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('technieum-theme', isDark ? 'dark' : 'light');
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = isDark ? 'light_mode' : 'dark_mode';
}
function initThemeIcon() {
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode';
}
document.addEventListener('DOMContentLoaded', initThemeIcon);

const GATEWAY = `http://${window.location.hostname}:8090`;
const PORTAL_URL = `http://${window.location.hostname}:5555`;

// Set dynamic portal/docs links once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const footerPortal = document.getElementById('footer-portal-link');
  if (footerPortal) footerPortal.href = PORTAL_URL;
  const footerDocs = document.getElementById('footer-docs-link');
  if (footerDocs) footerDocs.href = `${GATEWAY}/docs`;
  const flagPortal = document.getElementById('flag-portal-link');
  if (flagPortal) flagPortal.href = PORTAL_URL;
  const sidebarLabs = document.getElementById('sidebar-labs-link');
  if (sidebarLabs) sidebarLabs.href = PORTAL_URL;
  const sidebarDocs = document.getElementById('sidebar-docs-link');
  if (sidebarDocs) sidebarDocs.href = `${GATEWAY}/docs`;
});

let currentUser = null;
let currentToken = localStorage.getItem('tn_token');
let currentBookingData = null;
let chatSessionId = null;

// ─── Session timer ────────────────────────────────────────────────────────
let sessionSeconds = 0;
setInterval(() => {
  sessionSeconds++;
  const h = String(Math.floor(sessionSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((sessionSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(sessionSeconds % 60).padStart(2, '0');
  const el = document.getElementById('session-timer');
  if (el) el.textContent = `${h}:${m}:${s}`;
}, 1000);

// ─── Auth state ───────────────────────────────────────────────────────────
function updateAuthUI() {
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
  const userDisplay = document.getElementById('user-display');
  const logoutBtn = document.getElementById('logout-btn');
  const bookingsSection = document.getElementById('bookings-section');

  if (currentToken && currentUser) {
    loginBtn.classList.add('hidden');
    registerBtn.classList.add('hidden');
    userDisplay.textContent = `// ${currentUser.username}`;
    userDisplay.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
    bookingsSection.classList.remove('hidden');
    loadBookings();
  } else {
    loginBtn.classList.remove('hidden');
    registerBtn.classList.remove('hidden');
    userDisplay.classList.add('hidden');
    logoutBtn.classList.add('hidden');
    bookingsSection.classList.add('hidden');
  }
}

// Load stored auth on page load
if (currentToken) {
  try {
    const stored = localStorage.getItem('tn_user');
    if (stored) currentUser = JSON.parse(stored);
  } catch(e) {}
  updateAuthUI();
}

// ─── Modal helpers ────────────────────────────────────────────────────────
function openAuthModal(tab) {
  document.getElementById('auth-modal').classList.remove('hidden');
  switchAuth(tab);
}
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}
function switchAuth(tab) {
  document.getElementById('auth-login').classList.toggle('hidden', tab !== 'login');
  document.getElementById('auth-register').classList.toggle('hidden', tab !== 'register');
  document.getElementById('auth-modal-title').textContent = tab === 'login' ? 'Sign In' : 'Create Account';
  document.getElementById('auth-message').textContent = '';
}

async function login() {
  const u = document.getElementById('login-username').value;
  const p = document.getElementById('login-password').value;
  const msg = document.getElementById('auth-message');
  try {
    const r = await fetch(`${GATEWAY}/api/auth/login`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({username: u, password: p})
    });
    const data = await r.json();
    if (r.ok) {
      currentToken = data.token;
      currentUser = {user_id: data.user_id, username: data.username, role: data.role};
      localStorage.setItem('tn_token', currentToken);
      localStorage.setItem('tn_user', JSON.stringify(currentUser));
      closeModal('auth-modal');
      updateAuthUI();
    } else {
      msg.textContent = data.detail || 'Login failed';
      msg.className = 'mt-3 font-label text-xs text-center text-red-400';
    }
  } catch(e) {
    msg.textContent = 'Connection error — is gateway running?';
    msg.className = 'mt-3 font-label text-xs text-center text-red-400';
  }
}

async function register() {
  const u = document.getElementById('reg-username').value;
  const e = document.getElementById('reg-email').value;
  const p = document.getElementById('reg-password').value;
  const fn = document.getElementById('reg-fullname').value;
  const msg = document.getElementById('auth-message');
  try {
    const r = await fetch(`${GATEWAY}/api/auth/register`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({username:u, email:e, password:p, full_name:fn})
    });
    const data = await r.json();
    if (r.ok) {
      currentToken = data.token;
      currentUser = {user_id: data.user_id, username: data.username};
      localStorage.setItem('tn_token', currentToken);
      localStorage.setItem('tn_user', JSON.stringify(currentUser));
      closeModal('auth-modal');
      updateAuthUI();
    } else {
      msg.textContent = data.detail || 'Registration failed';
      msg.className = 'mt-3 font-label text-xs text-center text-red-400';
    }
  } catch(e) {
    msg.textContent = 'Connection error';
    msg.className = 'mt-3 font-label text-xs text-center text-red-400';
  }
}

function logout() {
  currentToken = null;
  currentUser = null;
  localStorage.removeItem('tn_token');
  localStorage.removeItem('tn_user');
  updateAuthUI();
}

// ─── Tab switching ────────────────────────────────────────────────────────
function switchMainTab(tab) {
  ['flights','trains','buses','hotels'].forEach(t => {
    document.getElementById(`form-${t}`).classList.toggle('hidden', t !== tab);
    document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
  });
}

// ─── Search functions ────────────────────────────────────────────────────
function showResults(title) {
  const s = document.getElementById('results-section');
  s.style.display = 'block';
  document.getElementById('results-title').textContent = title;
  document.getElementById('results-container').innerHTML =
    '<div class="flex justify-center py-8"><div class="spinner"></div></div>';
  s.scrollIntoView({behavior:'smooth', block:'start'});
}

function checkForFlags(data) {
  const str = JSON.stringify(data);
  const matches = str.match(/TECHNIEUM\{[^}]+\}/g);
  if (matches) {
    [...new Set(matches)].forEach(flag => {
      showFlag(flag);
    });
  }
}

function showFlag(flag) {
  document.getElementById('flag-display').textContent = flag;
  document.getElementById('flag-modal').classList.remove('hidden');
}

async function searchFlights() {
  const origin = document.getElementById('fl-origin').value || '';
  const dest = document.getElementById('fl-dest').value || '';
  const date = document.getElementById('fl-date').value || '';
  const pax = document.getElementById('fl-pax').value;
  const cls = document.getElementById('fl-class').value;
  showResults(`Flights ${origin ? 'from '+origin : ''} ${dest ? 'to '+dest : ''}`);
  try {
    const params = new URLSearchParams({passengers: pax});
    if (origin) params.append('origin', origin);
    if (dest) params.append('destination', dest);
    if (date) params.append('date', date);
    if (cls) params.append('class_type', cls);
    const r = await fetch(`${GATEWAY}/api/flights/search?${params}`);
    const data = await r.json();
    checkForFlags(data);
    renderFlights(data.flights || []);
  } catch(e) {
    document.getElementById('results-container').innerHTML = `<p class="font-label text-xs text-red-400">Error: ${e.message}</p>`;
  }
}

function renderFlights(flights) {
  const c = document.getElementById('results-container');
  if (!flights.length) { c.innerHTML = '<p class="font-label text-xs text-zinc-500">No flights found.</p>'; return; }
  c.innerHTML = flights.map(f => `
    <div class="result-card" onclick='prepareBooking("flight", ${JSON.stringify(f)})'>
      <div class="flex items-center justify-between">
        <div>
          <span class="font-headline font-bold text-sm text-on-background">${f.airline}</span>
          <span class="font-label text-[10px] text-zinc-500 ml-2">${f.flight_number}</span>
          <span class="font-label text-[10px] text-zinc-500 ml-2">${f.class_type}</span>
          ${f.internal_notes ? `<span class="font-label text-[10px] text-amber-400 ml-2" title="${f.internal_notes}">⚠ Internal data exposed</span>` : ''}
        </div>
        <span class="price-tag">£${f.price}</span>
      </div>
      <div class="flex items-center gap-2 mt-2">
        <span class="font-label text-sm text-on-background">${f.departure_time?.slice(0,5)}</span>
        <div class="flex-1 border-t border-dashed border-zinc-700/50 mx-2 relative">
          <span class="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#111217] px-1 font-label text-[10px] text-zinc-500">${Math.floor(f.duration_mins/60)}h${f.duration_mins%60}m</span>
        </div>
        <span class="font-label text-sm text-on-background">${f.arrival_time?.slice(0,5)}</span>
      </div>
      <div class="flex items-center justify-between mt-1">
        <div class="font-label text-[10px] text-zinc-500">${f.origin_code} → ${f.destination_code} · ${f.date}</div>
        <div class="font-label text-[10px] text-zinc-500">${f.seats_available} seats left</div>
      </div>
      ${f.cost_price ? `<div class="font-label text-[10px] text-red-400 mt-1">Internal cost: £${f.cost_price} (internal data leaked)</div>` : ''}
    </div>
  `).join('');
}

async function searchHotels() {
  const city = document.getElementById('ht-city').value || '';
  const checkin = document.getElementById('ht-checkin').value;
  const checkout = document.getElementById('ht-checkout').value;
  const guests = document.getElementById('ht-guests').value;
  const stars = document.getElementById('ht-stars').value;
  const maxPrice = document.getElementById('ht-maxprice').value;
  showResults(`Hotels in ${city || 'all cities'}`);
  try {
    const params = new URLSearchParams({guests});
    if (city) params.append('city', city);
    if (checkin) params.append('check_in', checkin);
    if (checkout) params.append('check_out', checkout);
    if (stars) params.append('stars', stars);
    if (maxPrice) params.append('max_price', maxPrice);
    const r = await fetch(`${GATEWAY}/api/hotels/search?${params}`);
    const data = await r.json();
    checkForFlags(data);
    renderHotels(data.hotels || []);
  } catch(e) {
    document.getElementById('results-container').innerHTML = `<p class="font-label text-xs text-red-400">Error: ${e.message}</p>`;
  }
}

function renderHotels(hotels) {
  const c = document.getElementById('results-container');
  if (!hotels.length) { c.innerHTML = '<p class="font-label text-xs text-zinc-500">No hotels found.</p>'; return; }
  c.innerHTML = hotels.map(h => `
    <div class="result-card" onclick='prepareBooking("hotel", ${JSON.stringify(h).replace(/'/g,"&#39;")})'>
      <div class="flex items-center justify-between">
        <div>
          <span class="font-headline font-bold text-sm text-on-background">${h.name}</span>
          <span class="stars ml-2 text-sm">${'⭐'.repeat(h.stars)}</span>
        </div>
        <span class="price-tag">£${h.price_per_night}<span class="text-[10px] font-normal text-zinc-500">/night</span></span>
      </div>
      <p class="font-label text-[10px] text-zinc-500 mt-1">${h.city}, ${h.country}</p>
      <p class="font-body text-xs text-zinc-400 mt-1 line-clamp-2">${h.description?.replace(/<[^>]*>/g,'') || ''}</p>
      ${h.cost_per_night ? `<div class="font-label text-[10px] text-red-400 mt-1">Internal cost: £${h.cost_per_night}/night (leaked)</div>` : ''}
      <div class="flex gap-1 mt-2 flex-wrap">${(h.amenities||[]).slice(0,4).map(a=>`<span class="tool-pill">${a}</span>`).join('')}</div>
    </div>
  `).join('');
}

async function searchTrains() {
  const origin = document.getElementById('tr-origin').value || '';
  const dest = document.getElementById('tr-dest').value || '';
  const date = document.getElementById('tr-date').value;
  const pax = document.getElementById('tr-pax').value;
  showResults(`Trains ${origin ? 'from '+origin : ''} ${dest ? 'to '+dest : ''}`);
  try {
    const params = new URLSearchParams({passengers: pax});
    if (origin) params.append('origin', origin);
    if (dest) params.append('destination', dest);
    if (date) params.append('date', date);
    const r = await fetch(`${GATEWAY}/api/trains/search?${params}`);
    const data = await r.json();
    checkForFlags(data);
    renderTransport(data.trains || data.buses || [], 'train');
  } catch(e) {
    document.getElementById('results-container').innerHTML = `<p class="font-label text-xs text-red-400">Error: ${e.message}</p>`;
  }
}

async function searchBuses() {
  const origin = document.getElementById('bu-origin').value || '';
  const dest = document.getElementById('bu-dest').value || '';
  const date = document.getElementById('bu-date').value;
  const pax = document.getElementById('bu-pax').value;
  showResults(`Buses ${origin ? 'from '+origin : ''} ${dest ? 'to '+dest : ''}`);
  try {
    const params = new URLSearchParams({passengers: pax});
    if (origin) params.append('origin', origin);
    if (dest) params.append('destination', dest);
    if (date) params.append('date', date);
    const r = await fetch(`${GATEWAY}/api/buses/search?${params}`);
    const data = await r.json();
    checkForFlags(data);
    renderTransport(data.buses || [], 'bus');
  } catch(e) {
    document.getElementById('results-container').innerHTML = `<p class="font-label text-xs text-red-400">Error: ${e.message}</p>`;
  }
}

function renderTransport(items, type) {
  const c = document.getElementById('results-container');
  if (!items.length) { c.innerHTML = `<p class="font-label text-xs text-zinc-500">No ${type}s found.</p>`; return; }
  c.innerHTML = items.map(t => `
    <div class="result-card" onclick='prepareBooking("${type}", ${JSON.stringify(t)})'>
      <div class="flex items-center justify-between">
        <div>
          <span class="font-headline font-bold text-sm text-on-background">${t.operator}</span>
          <span class="font-label text-[10px] text-zinc-500 ml-2">${t.train_number || t.bus_number}</span>
          ${t.class_type ? `<span class="font-label text-[10px] text-zinc-500 ml-2">${t.class_type}</span>` : ''}
        </div>
        <span class="price-tag">£${t.price}</span>
      </div>
      <div class="flex items-center gap-2 mt-2">
        <span class="font-label text-sm text-on-background">${String(t.departure_time).slice(0,5)}</span>
        <span class="text-zinc-600 text-xs mx-1">→</span>
        <span class="font-label text-sm text-on-background">${String(t.arrival_time).slice(0,5)}</span>
      </div>
      <div class="font-label text-[10px] text-zinc-500 mt-1">${t.origin} → ${t.destination} · ${t.date}</div>
      ${t.amenities ? `<div class="flex gap-1 mt-1 flex-wrap">${(t.amenities||[]).map(a=>`<span class="tool-pill">${a}</span>`).join('')}</div>` : ''}
    </div>
  `).join('');
}

function quickSearchFlight(origin, dest) {
  document.getElementById('fl-origin').value = origin;
  document.getElementById('fl-dest').value = dest;
  switchMainTab('flights');
  searchFlights();
}

// ─── Booking ──────────────────────────────────────────────────────────────
function prepareBooking(type, data) {
  currentBookingData = {type, data};
  const price = data.price || data.price_per_night;
  let details = '';
  if (type === 'flight') {
    details = `<div class="result-card"><p class="font-headline font-bold text-on-background">${data.airline} ${data.flight_number}</p><p class="font-body text-sm text-zinc-400">${data.origin} → ${data.destination}</p><p class="font-body text-sm text-zinc-400">${data.date} · Departs ${data.departure_time?.slice(0,5)}</p><p class="price-tag text-2xl mt-2">£${price}</p></div>`;
  } else if (type === 'hotel') {
    details = `<div class="result-card"><p class="font-headline font-bold text-on-background">${data.name}</p><p class="font-body text-sm text-zinc-400">${data.city}, ${data.country}</p><p class="price-tag text-2xl mt-2">£${price}/night</p></div>`;
  } else {
    details = `<div class="result-card"><p class="font-headline font-bold text-on-background">${data.operator} ${data.train_number || data.bus_number}</p><p class="font-body text-sm text-zinc-400">${data.origin} → ${data.destination}</p><p class="price-tag text-2xl mt-2">£${price}</p></div>`;
  }
  document.getElementById('booking-details').innerHTML = details;
  document.getElementById('booking-result').textContent = '';
  document.getElementById('booking-modal').classList.remove('hidden');
}

async function confirmBooking() {
  if (!currentBookingData) return;
  const {type, data} = currentBookingData;
  const card = document.getElementById('pay-card').value;
  const expiry = document.getElementById('pay-expiry').value;
  const cvv = document.getElementById('pay-cvv').value;
  const holder = document.getElementById('pay-holder').value;
  const resultEl = document.getElementById('booking-result');
  resultEl.textContent = 'Processing...';

  try {
    const userId = currentUser?.user_id || 2;
    const bookingPayload = {
      user_id: userId,
      booking_type: type,
      reference_id: data.id,
      total_price: data.price || data.price_per_night,
      details: data,
      passengers: currentUser ? [{name: currentUser.username}] : []
    };
    const bookR = await fetch(`${GATEWAY}/api/bookings`, {
      method: 'POST',
      headers: {'Content-Type':'application/json', 'Authorization': `Bearer ${currentToken}`},
      body: JSON.stringify(bookingPayload)
    });
    const bookData = await bookR.json();

    if (bookR.ok) {
      const payPayload = {
        booking_id: bookData.id,
        user_id: userId,
        amount: bookData.total_price,
        payment_method: 'card',
        card_number: card.replace(/\s/g,''),
        card_expiry: expiry,
        card_cvv: cvv,
        card_holder: holder
      };
      await fetch(`${GATEWAY}/api/payments`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payPayload)
      });

      resultEl.innerHTML = `<span class="text-green-400">Booking confirmed! Ref: ${bookData.booking_ref}</span>`;
      setTimeout(() => {
        closeModal('booking-modal');
        loadBookings();
      }, 2000);
    } else {
      resultEl.innerHTML = `<span class="text-red-400">Error: ${bookData.detail || 'Booking failed'}</span>`;
    }
  } catch(e) {
    resultEl.innerHTML = `<span class="text-red-400">Error: ${e.message}</span>`;
  }
}

async function loadBookings() {
  const container = document.getElementById('bookings-container');
  container.innerHTML = '<div class="flex justify-center py-4"><div class="spinner"></div></div>';
  try {
    const userId = currentUser?.user_id;
    const params = userId ? `?user_id=${userId}` : '';
    const r = await fetch(`${GATEWAY}/api/bookings${params}`, {
      headers: currentToken ? {'Authorization': `Bearer ${currentToken}`} : {}
    });
    const data = await r.json();
    checkForFlags(data);
    const bookings = data.bookings || [];
    if (!bookings.length) {
      container.innerHTML = '<p class="font-label text-xs text-zinc-500">No bookings found.</p>';
      return;
    }
    container.innerHTML = bookings.slice(0,5).map(b => `
      <div class="result-card">
        <div class="flex items-center justify-between">
          <div>
            <span class="font-label text-xs text-[#FF6A00]">${b.booking_ref}</span>
            <span class="font-label text-[10px] ml-2 px-2 py-0.5 rounded ${b.status==='confirmed'?'bg-green-500/10 text-green-400':b.status==='cancelled'?'bg-red-500/10 text-red-400':'bg-amber-500/10 text-amber-400'}">${b.status}</span>
          </div>
          <span class="font-label font-bold text-sm text-on-background">£${b.total_price}</span>
        </div>
        <p class="font-label text-[10px] text-zinc-500 mt-1">${b.booking_type.toUpperCase()} · ${b.created_at?.slice(0,10)}</p>
      </div>
    `).join('');
  } catch(e) {
    container.innerHTML = `<p class="font-label text-xs text-red-400">Error loading bookings</p>`;
  }
}

// ─── AI Chat ──────────────────────────────────────────────────────────────
function toggleChat() {
  const p = document.getElementById('chat-panel');
  p.style.display = p.style.display === 'none' ? 'flex' : 'none';
}

function toggleMobileChat() {
  const overlay = document.getElementById('mobile-chat-overlay');
  overlay.classList.toggle('hidden');
}

function setQuickMsg(msg) {
  document.getElementById('chat-input').value = msg;
  document.getElementById('chat-input').focus();
}

function clearChat() {
  document.getElementById('chat-messages').innerHTML = `
    <div class="chat-bubble-ai p-3 slide-in">
      <p class="font-body text-xs">Chat cleared. How can I help you plan your next trip?</p>
    </div>`;
  chatSessionId = null;
}

function appendChatMessage(role, content, toolCalls) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'slide-in';

  if (role === 'user') {
    div.innerHTML = `<div class="chat-bubble-user p-3"><p class="font-body text-xs">${escapeHtml(content)}</p></div>`;
  } else {
    let html = `<div class="chat-bubble-ai p-3">`;
    const flags = content.match(/TECHNIEUM\{[^}]+\}/g);
    if (flags) {
      [...new Set(flags)].forEach(f => showFlag(f));
    }
    html += `<div class="font-body text-xs prose prose-invert max-w-none">${typeof marked !== 'undefined' ? marked.parse(content) : escapeHtml(content)}</div>`;
    if (toolCalls && toolCalls.length > 0) {
      html += `<div class="mt-2 pt-2 border-t border-zinc-800/40">`;
      html += `<p class="font-label text-[9px] text-zinc-600 mb-1 uppercase">Tools used:</p>`;
      toolCalls.forEach(tc => {
        html += `<span class="tool-pill">${tc.tool}</span>`;
      });
      html += `</div>`;
    }
    html += `</div>`;
    div.innerHTML = html;
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message) return;
  input.value = '';

  appendChatMessage('user', message);
  document.getElementById('typing-indicator').classList.remove('hidden');

  try {
    const r = await fetch(`${GATEWAY}/api/ai/chat`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        message,
        session_id: chatSessionId,
        user_id: currentUser?.user_id || null
      })
    });
    const data = await r.json();
    document.getElementById('typing-indicator').classList.add('hidden');

    if (r.ok) {
      chatSessionId = data.session_id;
      appendChatMessage('ai', data.response, data.tool_calls);

      if (data.shared_memory_updated) {
        appendChatMessage('ai',
          '**Security Note:** Your message was detected as a potential injection attempt and stored in the shared cross-session memory. This memory is visible to all users. Check `/api/ai/memory` to see what was stored.',
          null
        );
      }
    } else {
      appendChatMessage('ai', `Error: ${data.detail || 'AI service error'}`, null);
    }
  } catch(e) {
    document.getElementById('typing-indicator').classList.add('hidden');
    appendChatMessage('ai', `Connection error: ${e.message}. Is the AI agent running?`, null);
  }
}

async function sendMobileMessage() {
  const input = document.getElementById('mobile-chat-input');
  const message = input.value.trim();
  if (!message) return;
  input.value = '';
  document.getElementById('chat-input').value = message;
  await sendMessage();
  const mobileContainer = document.getElementById('mobile-chat-messages');
  mobileContainer.innerHTML = document.getElementById('chat-messages').innerHTML;
  mobileContainer.scrollTop = mobileContainer.scrollHeight;
}

// ─── Upload Doc ───────────────────────────────────────────────────────────
function uploadDocModal() {
  document.getElementById('upload-modal').classList.remove('hidden');
  document.getElementById('upload-result').textContent = '';
}

async function uploadDoc() {
  const title = document.getElementById('doc-title').value;
  const content = document.getElementById('doc-content').value;
  const category = document.getElementById('doc-category').value;
  const resultEl = document.getElementById('upload-result');

  if (!title || !content) { resultEl.innerHTML = '<span class="text-red-400">Title and content are required</span>'; return; }
  resultEl.textContent = 'Uploading...';

  try {
    const r = await fetch(`${GATEWAY}/api/ai/upload-doc`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({title, content, category})
    });
    const data = await r.json();
    if (r.ok) {
      resultEl.innerHTML = `<span class="text-green-400">Document uploaded! ID: ${data.result?.doc_id || 'stored'}</span>`;
    } else {
      resultEl.innerHTML = `<span class="text-red-400">Error: ${data.detail}</span>`;
    }
  } catch(e) {
    resultEl.innerHTML = `<span class="text-red-400">Error: ${e.message}</span>`;
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────
function escapeHtml(text) {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Set today's date as default ─────────────────────────────────────────
const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now()+86400000).toISOString().split('T')[0];
['fl-date','tr-date','bu-date'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.value = tomorrow;
});
document.getElementById('ht-checkin').value = tomorrow;
document.getElementById('ht-checkout').value = new Date(Date.now()+3*86400000).toISOString().split('T')[0];
