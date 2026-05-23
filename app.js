// ============================================================
//  DriveDeal — Car Marketplace App
//  Pure vanilla JS, no dependencies. State is in-memory.
//  To connect a real backend: replace state.users / state.listings
//  with API calls (Firebase, Supabase, etc.)
// ============================================================

const EMOJIS = ['🚗','🚙','🚕','🏎️','🚓','🛻','🚐','🚌','🚎','🏍️','🛵','🚑','🚒'];
const BRANDS = ['Any Brand','Toyota','BMW','Mercedes','Audi','Ford','Honda','Volkswagen','Hyundai','Kia','Nissan','Mazda','Lexus'];
const TYPES  = ['Any Type','Sedan','SUV','Coupe','Hatchback','Convertible','Truck','Van','Motorcycle'];
const COLORS = ['White','Black','Silver','Gray','Blue','Red','Green','Yellow','Orange'];

// ---- INITIAL STATE ----
let state = {
  page: 'home',
  user: null,
  authMode: 'login',
  selectedListing: null,
  selectedConv: null,
  searchQuery: '',
  searchBrand: 'Any Brand',
  searchType: 'Any Type',

  users: [
    { id: 'u1', name: 'Alex Carter',  email: 'alex@demo.com', password: 'demo123' },
    { id: 'u2', name: 'Sam Rivera',   email: 'sam@demo.com',  password: 'demo123' },
  ],

  listings: [
    {
      id: 'l1', sellerId: 'u1', brand: 'BMW', model: '3 Series', year: 2021, type: 'Sedan',
      mileage: 32000, color: 'Black', price: 38500,
      desc: 'Excellent condition, full service history, sport package, sunroof, heated seats.',
      emoji: '🏎️', auction: true, auctionEnd: Date.now() + 3600000 * 47,
      bids: [{ userId: 'u2', amount: 35000, time: Date.now() - 3600000 }]
    },
    {
      id: 'l2', sellerId: 'u2', brand: 'Toyota', model: 'Land Cruiser', year: 2020, type: 'SUV',
      mileage: 55000, color: 'White', price: 72000,
      desc: 'Low mileage, pristine interior, never off-road, full warranty remaining.',
      emoji: '🚙', auction: false, auctionEnd: null, bids: []
    },
    {
      id: 'l3', sellerId: 'u1', brand: 'Mercedes', model: 'C-Class', year: 2022, type: 'Sedan',
      mileage: 18000, color: 'Silver', price: 51000,
      desc: 'Nearly new, AMG styling package, panoramic roof, Burmester sound system.',
      emoji: '🚗', auction: true, auctionEnd: Date.now() + 3600000 * 12,
      bids: [
        { userId: 'u2', amount: 49000, time: Date.now() - 7200000 },
        { userId: 'u2', amount: 50200, time: Date.now() - 1800000 }
      ]
    },
    {
      id: 'l4', sellerId: 'u2', brand: 'Ford', model: 'Mustang GT', year: 2019, type: 'Coupe',
      mileage: 41000, color: 'Red', price: 34900,
      desc: 'V8 engine, manual transmission, leather seats, premium sound, always garaged.',
      emoji: '🏎️', auction: false, auctionEnd: null, bids: []
    },
    {
      id: 'l5', sellerId: 'u1', brand: 'Honda', model: 'Civic', year: 2023, type: 'Hatchback',
      mileage: 8000, color: 'Blue', price: 24500,
      desc: 'Brand new essentially. Warranty intact. Great on fuel. Perfect city car.',
      emoji: '🚗', auction: true, auctionEnd: Date.now() + 3600000 * 72, bids: []
    },
  ],

  conversations: {
    'u1-u2': {
      participants: ['u1','u2'],
      messages: [
        { from: 'u2', text: 'Hi! Is the BMW still available?',      time: Date.now() - 3600000 },
        { from: 'u1', text: 'Yes it is! Would you like to see it?', time: Date.now() - 3000000 },
        { from: 'u2', text: "I'd love to. Can we meet this weekend?", time: Date.now() - 2400000 },
      ]
    }
  }
};

// ---- HELPERS ----
function getUser(id)    { return state.users.find(u => u.id === id); }
function getListing(id) { return state.listings.find(l => l.id === id); }
function getTopBid(l)   { return l.bids.length ? Math.max(...l.bids.map(b => b.amount)) : null; }
function formatPrice(n) { return '$' + n.toLocaleString(); }
function initials(name) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }
function formatTime(ms) {
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

let toastTimeout;
function showToast(msg) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  clearTimeout(toastTimeout);
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  toastTimeout = setTimeout(() => t.remove(), 2800);
}

function navigate(page, extra) {
  state.page = page;
  if (extra) Object.assign(state, extra);
  render();
  window.scrollTo(0, 0);
}

// ============================================================
//  RENDER ENTRY POINT
// ============================================================
function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(renderNav());

  const content = document.createElement('div');
  content.style.flex = '1';

  const pages = { home: renderHome, listings: renderListings, detail: renderDetail, list: renderListCar, messages: renderMessages, profile: renderProfile, auth: renderAuth };
  const fn = pages[state.page];
  if (fn) content.appendChild(fn());

  app.appendChild(content);
}

// ============================================================
//  NAV
// ============================================================
function renderNav() {
  const nav = document.createElement('nav');

  const logo = document.createElement('div');
  logo.className = 'logo';
  logo.innerHTML = 'Drive<span>Deal</span>';
  logo.onclick = () => navigate('home');
  nav.appendChild(logo);

  const links = document.createElement('div');
  links.className = 'nav-links';

  function navBtn(label, page, cls) {
    const btn = document.createElement('button');
    btn.className = 'nav-btn' + (state.page === page ? ' active' : '') + (cls ? ' ' + cls : '');
    btn.textContent = label;
    return btn;
  }

  const browseBtn = navBtn('Browse Cars', 'listings');
  browseBtn.onclick = () => navigate('listings');
  links.appendChild(browseBtn);

  if (state.user) {
    const listBtn = navBtn('+ Sell a Car', 'list');
    listBtn.onclick = () => navigate('list');
    links.appendChild(listBtn);

    const msgBtn = navBtn('💬 Messages', 'messages');
    msgBtn.onclick = () => navigate('messages');
    links.appendChild(msgBtn);

    const profileBtn = navBtn(initials(state.user.name), 'profile');
    profileBtn.style.fontWeight = '700';
    profileBtn.onclick = () => navigate('profile');
    links.appendChild(profileBtn);

    const logoutBtn = navBtn('Log out', '');
    logoutBtn.onclick = () => { state.user = null; navigate('home'); showToast('Logged out'); };
    links.appendChild(logoutBtn);
  } else {
    const loginBtn = navBtn('Log in', 'auth');
    loginBtn.onclick = () => navigate('auth', { authMode: 'login' });
    links.appendChild(loginBtn);

    const signupBtn = navBtn('Sign up', 'auth', 'accent-btn');
    signupBtn.onclick = () => navigate('auth', { authMode: 'register' });
    links.appendChild(signupBtn);
  }

  nav.appendChild(links);
  return nav;
}

// ============================================================
//  HOME
// ============================================================
function renderHome() {
  const wrap = document.createElement('div');

  const hero = document.createElement('div');
  hero.className = 'hero';
  hero.innerHTML = `
    <div class="hero-eyebrow">🚀 The smarter way to buy & sell</div>
    <h1 class="hero-title">Find Your Next<br><em>Perfect Ride</em></h1>
    <p class="hero-sub">Auction, negotiate, or buy direct. Real cars from real people — no middleman.</p>
    <div class="hero-btns">
      <button class="primary" id="browseCars">Browse Cars</button>
      <button class="secondary" id="sellCar">${state.user ? 'List My Car' : 'Start Selling'}</button>
    </div>
  `;
  hero.querySelector('#browseCars').onclick = () => navigate('listings');
  hero.querySelector('#sellCar').onclick   = () => state.user ? navigate('list') : navigate('auth', { authMode: 'register' });
  wrap.appendChild(hero);

  // Stats bar
  const stats = document.createElement('div');
  stats.style.cssText = 'display:flex;gap:24px;justify-content:center;padding:0 32px 64px;flex-wrap:wrap;';
  [
    { n: state.listings.length,                          label: 'Active Listings' },
    { n: state.listings.filter(l => l.auction).length,   label: 'Live Auctions'   },
    { n: state.users.length,                              label: 'Verified Sellers' },
  ].forEach(s => {
    const card = document.createElement('div');
    card.style.cssText = 'background:var(--card);border:1px solid var(--border);border-radius:12px;padding:28px 40px;text-align:center;';
    card.innerHTML = `<div style="font-family:Syne,sans-serif;font-size:40px;font-weight:800;color:var(--accent)">${s.n}</div><div style="color:var(--muted);font-size:13px;margin-top:4px">${s.label}</div>`;
    stats.appendChild(card);
  });
  wrap.appendChild(stats);

  // Featured
  const featHeader = document.createElement('div');
  featHeader.className = 'section-header';
  featHeader.innerHTML = '<h2>Featured Listings</h2><p>Hot cars added recently</p>';
  wrap.appendChild(featHeader);

  const grid = document.createElement('div');
  grid.className = 'cars-grid';
  state.listings.slice(0, 3).forEach(l => grid.appendChild(renderCarCard(l)));
  wrap.appendChild(grid);

  const moreBtn = document.createElement('div');
  moreBtn.style.cssText = 'text-align:center;padding-bottom:64px;';
  moreBtn.innerHTML = '<button onclick="navigate(\'listings\')" style="padding:14px 32px;background:transparent;color:var(--accent);border:1px solid var(--border2);border-radius:10px;font-family:Syne,sans-serif;font-weight:700;cursor:pointer;font-size:15px;">View All Listings →</button>';
  wrap.appendChild(moreBtn);

  return wrap;
}

// ============================================================
//  AUTH
// ============================================================
function renderAuth() {
  const wrap = document.createElement('div');
  wrap.className = 'auth-wrap';
  const card = document.createElement('div');
  card.className = 'auth-card';
  wrap.appendChild(card);

  let mode = state.authMode || 'login';

  function buildForm() {
    card.innerHTML = '';
    if (mode === 'login') {
      card.innerHTML = `
        <h2 class="auth-title">Welcome back</h2>
        <p class="auth-sub">Sign in to your DriveDeal account</p>
        <div class="form-group"><label>Email</label><input id="email" type="email" placeholder="you@example.com" /></div>
        <div class="form-group"><label>Password</label><input id="pw" type="password" placeholder="••••••••" /></div>
        <button class="btn" id="submit">Sign in</button>
        <div class="auth-switch">No account? <span class="link" id="toggle">Create one</span></div>
        <div style="margin-top:14px;text-align:center;font-size:12px;color:var(--muted);">Demo: alex@demo.com / demo123</div>
      `;
      card.querySelector('#submit').onclick = () => {
        const email = card.querySelector('#email').value.trim();
        const pw    = card.querySelector('#pw').value;
        const found = state.users.find(u => u.email === email && u.password === pw);
        if (found) { state.user = found; navigate('home'); showToast(`Welcome back, ${found.name.split(' ')[0]}!`); }
        else showToast('Invalid email or password');
      };
      card.querySelector('#toggle').onclick = () => { mode = 'register'; buildForm(); };
    } else {
      card.innerHTML = `
        <h2 class="auth-title">Create account</h2>
        <p class="auth-sub">Join thousands of buyers and sellers</p>
        <div class="form-group"><label>Full name</label><input id="name" placeholder="Your full name" /></div>
        <div class="form-group"><label>Email</label><input id="email" type="email" placeholder="you@example.com" /></div>
        <div class="form-group"><label>Password</label><input id="pw" type="password" placeholder="Choose a password" /></div>
        <button class="btn" id="submit">Create account</button>
        <div class="auth-switch">Have an account? <span class="link" id="toggle">Sign in</span></div>
      `;
      card.querySelector('#submit').onclick = () => {
        const name  = card.querySelector('#name').value.trim();
        const email = card.querySelector('#email').value.trim();
        const pw    = card.querySelector('#pw').value;
        if (!name || !email || !pw) { showToast('Please fill all fields'); return; }
        if (state.users.find(u => u.email === email)) { showToast('Email already registered'); return; }
        const newUser = { id: 'u' + Date.now(), name, email, password: pw };
        state.users.push(newUser);
        state.user = newUser;
        navigate('home');
        showToast(`Welcome to DriveDeal, ${name.split(' ')[0]}!`);
      };
      card.querySelector('#toggle').onclick = () => { mode = 'login'; buildForm(); };
    }
  }

  buildForm();
  return wrap;
}

// ============================================================
//  LISTINGS
// ============================================================
function renderListings() {
  const wrap = document.createElement('div');
  wrap.style.paddingTop = '32px';

  const hdr = document.createElement('div');
  hdr.className = 'section-header';
  hdr.innerHTML = '<h2>All Listings</h2><p>Find your perfect vehicle</p>';
  wrap.appendChild(hdr);

  // Search bar
  const sb = document.createElement('div');
  sb.className = 'search-bar';
  sb.innerHTML = `
    <input id="sq" placeholder="Search make, model..." value="${state.searchQuery}" />
    <select id="sb">${BRANDS.map(b => `<option${state.searchBrand === b ? ' selected' : ''}>${b}</option>`).join('')}</select>
    <select id="st">${TYPES.map(t => `<option${state.searchType === t ? ' selected' : ''}>${t}</option>`).join('')}</select>
    <button id="sreset">Clear</button>
  `;
  wrap.appendChild(sb);

  const grid = document.createElement('div');
  grid.className = 'cars-grid';
  wrap.appendChild(grid);

  function updateGrid() {
    state.searchQuery = sb.querySelector('#sq').value;
    state.searchBrand = sb.querySelector('#sb').value;
    state.searchType  = sb.querySelector('#st').value;
    grid.innerHTML = '';
    const results = state.listings.filter(l => {
      const q      = state.searchQuery.toLowerCase();
      const matchQ = !q || `${l.brand} ${l.model} ${l.year}`.toLowerCase().includes(q);
      const matchB = state.searchBrand === 'Any Brand' || l.brand === state.searchBrand;
      const matchT = state.searchType  === 'Any Type'  || l.type  === state.searchType;
      return matchQ && matchB && matchT;
    });
    if (!results.length) {
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><span class="emoji">🔍</span><h3>No cars found</h3><p>Try adjusting your search filters</p></div>';
    } else {
      results.forEach(l => grid.appendChild(renderCarCard(l)));
    }
  }

  sb.querySelector('#sq').addEventListener('input', updateGrid);
  sb.querySelector('#sb').addEventListener('change', updateGrid);
  sb.querySelector('#st').addEventListener('change', updateGrid);
  sb.querySelector('#sreset').onclick = () => {
    state.searchQuery = ''; state.searchBrand = 'Any Brand'; state.searchType = 'Any Type';
    sb.querySelector('#sq').value = '';
    sb.querySelector('#sb').value = 'Any Brand';
    sb.querySelector('#st').value = 'Any Type';
    updateGrid();
  };

  updateGrid();
  return wrap;
}

// ============================================================
//  CAR CARD
// ============================================================
function renderCarCard(listing) {
  const seller = getUser(listing.sellerId);
  const topBid = getTopBid(listing);
  const card   = document.createElement('div');
  card.className = 'car-card';

  card.innerHTML = `
    <div class="car-img">
      <div class="car-img-bg"></div>
      <div class="car-img-emoji">${listing.emoji}</div>
      <div class="car-badges">
        ${listing.auction ? '<span class="badge-pill badge-auction">🔨 Auction</span>' : ''}
      </div>
    </div>
    <div class="car-info">
      <div class="car-brand">${listing.brand}</div>
      <div class="car-name">${listing.year} ${listing.model}</div>
      <div class="car-meta">
        <span>📍 ${listing.color}</span>
        <span>🛣️ ${listing.mileage.toLocaleString()} km</span>
        <span>🚗 ${listing.type}</span>
      </div>
      <div class="car-footer">
        <div class="car-price">
          ${formatPrice(listing.price)}
          ${topBid ? `<small>Top bid: ${formatPrice(topBid)}</small>` : ''}
        </div>
        <div style="font-size:12px;color:var(--muted);">By ${seller ? seller.name.split(' ')[0] : 'Unknown'}</div>
      </div>
    </div>
  `;

  card.onclick = () => navigate('detail', { selectedListing: listing.id });
  return card;
}

// ============================================================
//  DETAIL
// ============================================================
function renderDetail() {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'padding:32px;max-width:1100px;margin:0 auto;';

  const back = document.createElement('button');
  back.className = 'back-btn';
  back.innerHTML = '← Back to listings';
  back.onclick = () => navigate('listings');
  wrap.appendChild(back);

  const listing = getListing(state.selectedListing);
  if (!listing) { wrap.innerHTML += '<div class="empty">Listing not found</div>'; return wrap; }

  const seller = getUser(listing.sellerId);
  const topBid = getTopBid(listing);

  const layout = document.createElement('div');
  layout.style.cssText = 'display:flex;gap:32px;flex-wrap:wrap;';

  // LEFT
  const left = document.createElement('div');
  left.style.cssText = 'flex:1;min-width:280px;';

  const img = document.createElement('div');
  img.style.cssText = 'width:100%;height:280px;background:var(--bg3);border-radius:var(--radius-lg);display:flex;align-items:center;justify-content:center;font-size:100px;border:1px solid var(--border);margin-bottom:20px;';
  img.textContent = listing.emoji;
  left.appendChild(img);

  const descCard = document.createElement('div');
  descCard.className = 'detail-desc';
  descCard.innerHTML = `<h3>Description</h3><p>${listing.desc}</p>`;
  left.appendChild(descCard);

  const sellerCard = document.createElement('div');
  sellerCard.className = 'detail-desc';
  sellerCard.innerHTML = `
    <h3>Seller</h3>
    <div style="display:flex;align-items:center;gap:12px;margin-top:10px;">
      <div style="width:44px;height:44px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:800;font-family:Syne,sans-serif;color:#000;">${seller ? initials(seller.name) : '?'}</div>
      <div>
        <div style="font-weight:600;font-size:15px;">${seller ? seller.name : 'Unknown'}</div>
        <div style="font-size:13px;color:var(--muted);">DriveDeal Verified</div>
      </div>
    </div>
  `;
  left.appendChild(sellerCard);
  layout.appendChild(left);

  // RIGHT
  const right = document.createElement('div');
  right.style.cssText = 'flex:1;min-width:280px;';

  const info = document.createElement('div');
  info.innerHTML = `
    <div class="detail-brand">${listing.brand}</div>
    <div class="detail-title">${listing.year} ${listing.model}</div>
    <div class="detail-specs">
      <div class="spec-item"><div class="spec-label">Type</div><div class="spec-value">${listing.type}</div></div>
      <div class="spec-item"><div class="spec-label">Color</div><div class="spec-value">${listing.color}</div></div>
      <div class="spec-item"><div class="spec-label">Mileage</div><div class="spec-value">${listing.mileage.toLocaleString()} km</div></div>
      <div class="spec-item"><div class="spec-label">Year</div><div class="spec-value">${listing.year}</div></div>
    </div>
    <div class="detail-price">${formatPrice(listing.price)}</div>
  `;
  right.appendChild(info);

  // Auction box
  if (listing.auction) {
    const abox = document.createElement('div');
    abox.className = 'auction-box';
    const expired = listing.auctionEnd - Date.now() <= 0;
    abox.innerHTML = `
      <div class="auction-title">🔨 ${expired ? 'AUCTION ENDED' : 'LIVE AUCTION'}</div>
      ${!expired ? `<div style="font-size:12px;color:var(--muted);margin-bottom:6px;">Ends in</div><div class="auction-timer" id="aTimer">${formatTime(Math.max(0, listing.auctionEnd - Date.now()))}</div>` : ''}
      <div style="font-size:14px;margin-bottom:4px;">${topBid ? `Current highest bid: <strong style="color:var(--accent)">${formatPrice(topBid)}</strong>` : 'No bids yet — be first!'}</div>
    `;

    if (!expired && !state.user) {
      const loginNow = document.createElement('div');
      loginNow.style.cssText = 'margin-top:12px;font-size:13px;color:var(--muted);';
      loginNow.innerHTML = `<span class="link" id="loginBid">Sign in</span> to place a bid`;
      loginNow.querySelector('#loginBid').onclick = () => navigate('auth', { authMode: 'login' });
      abox.appendChild(loginNow);
    }

    if (!expired && state.user && state.user.id !== listing.sellerId) {
      const bidRow = document.createElement('div');
      bidRow.className = 'bid-row';
      bidRow.innerHTML = `<input type="number" id="bidInput" placeholder="Your bid in $" /><button id="placeBid">Bid Now</button>`;
      abox.appendChild(bidRow);
      bidRow.querySelector('#placeBid').onclick = () => {
        const amount = parseInt(bidRow.querySelector('#bidInput').value);
        const minBid = (topBid || listing.price - 1) + 1;
        if (!amount || amount < minBid) { showToast(`Bid must be at least ${formatPrice(minBid)}`); return; }
        listing.bids.push({ userId: state.user.id, amount, time: Date.now() });
        showToast(`Bid of ${formatPrice(amount)} placed!`);
        navigate('detail', { selectedListing: listing.id });
      };
    }

    if (listing.bids.length > 0) {
      const hist = document.createElement('div');
      hist.className = 'bid-history';
      hist.innerHTML = '<div style="font-size:11px;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">Bid history</div>';
      [...listing.bids].reverse().forEach(b => {
        const u = getUser(b.userId);
        const d = document.createElement('div');
        d.className = 'bid-entry';
        d.innerHTML = `<span style="color:var(--text);font-weight:500;">${u ? u.name.split(' ')[0] : 'Anon'}</span><span style="color:var(--accent);font-weight:600;">${formatPrice(b.amount)}</span>`;
        hist.appendChild(d);
      });
      abox.appendChild(hist);
    }

    right.appendChild(abox);

    // Live countdown
    if (!expired) {
      const timerEl = abox.querySelector('#aTimer');
      if (timerEl) {
        const tick = setInterval(() => {
          const r = listing.auctionEnd - Date.now();
          if (r <= 0) { clearInterval(tick); timerEl.textContent = 'Ended'; return; }
          if (document.body.contains(timerEl)) timerEl.textContent = formatTime(r);
          else clearInterval(tick);
        }, 1000);
      }
    }
  }

  // Actions
  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap;';

  if (!state.user) {
    const btn = document.createElement('button');
    btn.style.cssText = 'flex:1;padding:12px 20px;border-radius:10px;font-family:Syne,sans-serif;font-weight:700;font-size:14px;cursor:pointer;background:var(--bg3);color:var(--text);border:1px solid var(--border);';
    btn.textContent = '💬 Sign in to Message Seller';
    btn.onclick = () => navigate('auth', { authMode: 'login' });
    actions.appendChild(btn);
  } else if (state.user.id !== listing.sellerId) {
    const btn = document.createElement('button');
    btn.style.cssText = 'flex:1;padding:12px 20px;border-radius:10px;font-family:Syne,sans-serif;font-weight:700;font-size:14px;cursor:pointer;background:var(--bg3);color:var(--text);border:1px solid var(--border);';
    btn.textContent = '💬 Message Seller';
    btn.onclick = () => {
      const key = [state.user.id, listing.sellerId].sort().join('-');
      if (!state.conversations[key]) state.conversations[key] = { participants: [state.user.id, listing.sellerId], messages: [] };
      navigate('messages', { selectedConv: key });
    };
    actions.appendChild(btn);
  } else {
    const note = document.createElement('div');
    note.style.cssText = 'padding:12px 20px;background:var(--bg3);border-radius:10px;font-size:14px;color:var(--muted);text-align:center;flex:1;';
    note.textContent = '📋 This is your listing';
    actions.appendChild(note);
  }

  right.appendChild(actions);
  layout.appendChild(right);
  wrap.appendChild(layout);
  return wrap;
}

// ============================================================
//  MESSAGES
// ============================================================
function renderMessages() {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'padding:32px;max-width:1100px;margin:0 auto;';

  if (!state.user) {
    wrap.innerHTML = '<div class="empty"><span class="emoji">💬</span><h3>Sign in to view messages</h3></div>';
    return wrap;
  }

  wrap.innerHTML = '<h2 style="font-family:Syne,sans-serif;font-size:24px;font-weight:800;margin-bottom:20px;">Messages</h2>';

  const layout = document.createElement('div');
  layout.className = 'dm-layout';

  // Sidebar
  const sidebar = document.createElement('div');
  sidebar.className = 'dm-sidebar';
  sidebar.innerHTML = '<div class="dm-sidebar-header"><h3 style="font-family:Syne,sans-serif;font-size:15px;font-weight:700;">Conversations</h3></div>';

  const myConvs = Object.entries(state.conversations).filter(([, c]) => c.participants.includes(state.user.id));

  if (!myConvs.length) {
    sidebar.innerHTML += '<div style="padding:20px;font-size:13px;color:var(--muted);">No conversations yet.<br>Message a seller from a listing!</div>';
  }

  myConvs.forEach(([key, conv]) => {
    const otherId = conv.participants.find(p => p !== state.user.id);
    const other   = getUser(otherId);
    const lastMsg = conv.messages[conv.messages.length - 1];
    const item    = document.createElement('div');
    item.className = 'dm-conv' + (state.selectedConv === key ? ' active' : '');
    item.innerHTML = `
      <div class="dm-avatar">${other ? initials(other.name) : '?'}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:14px;font-weight:500;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${other ? other.name : 'Unknown'}</div>
        <div style="font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${lastMsg ? lastMsg.text : 'Start a conversation'}</div>
      </div>
    `;
    item.onclick = () => { state.selectedConv = key; renderConv(); };
    sidebar.appendChild(item);
  });

  layout.appendChild(sidebar);

  const main = document.createElement('div');
  main.className = 'dm-main';
  main.id = 'dm-main';
  layout.appendChild(main);

  function renderConv() {
    main.innerHTML = '';
    if (!state.selectedConv || !state.conversations[state.selectedConv]) {
      main.innerHTML = '<div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:14px;padding:40px;">Select a conversation</div>';
      return;
    }
    const conv    = state.conversations[state.selectedConv];
    const otherId = conv.participants.find(p => p !== state.user.id);
    const other   = getUser(otherId);

    const header = document.createElement('div');
    header.className = 'dm-header';
    header.innerHTML = `
      <div class="dm-avatar">${other ? initials(other.name) : '?'}</div>
      <div>
        <div style="font-weight:600;font-size:15px;">${other ? other.name : 'Unknown'}</div>
        <div style="font-size:12px;color:var(--muted);">DriveDeal member</div>
      </div>
    `;
    main.appendChild(header);

    const messages = document.createElement('div');
    messages.className = 'dm-messages';

    conv.messages.forEach(m => {
      const mine = m.from === state.user.id;
      const msg  = document.createElement('div');
      msg.className = 'msg ' + (mine ? 'mine' : 'theirs');
      msg.innerHTML = `
        <div class="msg-bubble">${m.text}</div>
        <div class="msg-time">${new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      `;
      messages.appendChild(msg);
    });

    if (!conv.messages.length) {
      messages.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:14px;padding:40px;">Send a message to start the conversation!</div>';
    }

    main.appendChild(messages);
    messages.scrollTop = messages.scrollHeight;

    const inputBar = document.createElement('div');
    inputBar.className = 'dm-input-bar';
    inputBar.innerHTML = `<input id="msgInput" placeholder="Type a message..." /><button id="sendBtn">➤</button>`;
    main.appendChild(inputBar);

    const sendMsg = () => {
      const input = inputBar.querySelector('#msgInput');
      const text  = input.value.trim();
      if (!text) return;
      conv.messages.push({ from: state.user.id, text, time: Date.now() });
      input.value = '';
      renderConv();
    };

    inputBar.querySelector('#sendBtn').onclick = sendMsg;
    inputBar.querySelector('#msgInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });
    inputBar.querySelector('#msgInput').focus();
  }

  renderConv();
  wrap.appendChild(layout);
  return wrap;
}

// ============================================================
//  LIST A CAR
// ============================================================
function renderListCar() {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'padding:32px;max-width:800px;margin:0 auto;';

  if (!state.user) {
    wrap.innerHTML = '<div class="empty"><span class="emoji">🔐</span><h3>Sign in to list your car</h3></div>';
    return wrap;
  }

  const back = document.createElement('button');
  back.className = 'back-btn';
  back.innerHTML = '← Back';
  back.onclick = () => navigate('listings');
  wrap.appendChild(back);

  const card = document.createElement('div');
  card.style.cssText = 'background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:32px;';
  card.innerHTML = `
    <h2 style="font-size:28px;font-weight:800;margin-bottom:8px;">List Your Car</h2>
    <p style="color:var(--muted);font-size:14px;margin-bottom:32px;">Fill in your vehicle details to attract buyers</p>

    <div class="form-group">
      <label>Vehicle Icon</label>
      <div class="emoji-picker" id="emojiPicker">
        ${EMOJIS.map(e => `<div class="emoji-opt${e === '🚗' ? ' selected' : ''}" data-e="${e}">${e}</div>`).join('')}
      </div>
    </div>

    <div class="form-row">
      <div class="form-group"><label>Brand</label><select id="brand">${BRANDS.slice(1).map(b => `<option>${b}</option>`).join('')}</select></div>
      <div class="form-group"><label>Model</label><input id="model" placeholder="e.g. Corolla, X5" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Year</label><input id="year" type="number" placeholder="2020" min="1980" max="2025" /></div>
      <div class="form-group"><label>Type</label><select id="type">${TYPES.slice(1).map(t => `<option>${t}</option>`).join('')}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Color</label><select id="color">${COLORS.map(c => `<option>${c}</option>`).join('')}</select></div>
      <div class="form-group"><label>Mileage (km)</label><input id="mileage" type="number" placeholder="50000" /></div>
    </div>
    <div class="form-group"><label>Asking Price ($)</label><input id="price" type="number" placeholder="25000" /></div>
    <div class="form-group"><label>Description</label><textarea id="desc" placeholder="Describe your car's condition, features, history..."></textarea></div>

    <div class="form-group">
      <label>Listing Type</label>
      <div style="display:flex;gap:20px;margin-top:8px;">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;"><input type="radio" name="ltype" value="direct" checked /> Fixed Price</label>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;"><input type="radio" name="ltype" value="auction" /> Auction</label>
      </div>
    </div>
    <div class="form-group" id="auctionDurGroup" style="display:none;">
      <label>Auction Duration</label>
      <select id="auctionDur">
        <option value="86400000">24 hours</option>
        <option value="259200000">3 days</option>
        <option value="604800000" selected>7 days</option>
      </select>
    </div>

    <button class="btn" id="submitListing">🚀 Publish Listing</button>
  `;

  let selectedEmoji = '🚗';
  card.querySelectorAll('.emoji-opt').forEach(el => {
    el.onclick = () => {
      selectedEmoji = el.dataset.e;
      card.querySelectorAll('.emoji-opt').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
    };
  });

  card.querySelectorAll('[name=ltype]').forEach(r => {
    r.onchange = () => {
      card.querySelector('#auctionDurGroup').style.display = r.value === 'auction' ? 'block' : 'none';
    };
  });

  card.querySelector('#submitListing').onclick = () => {
    const brand    = card.querySelector('#brand').value;
    const model    = card.querySelector('#model').value.trim();
    const year     = parseInt(card.querySelector('#year').value);
    const type     = card.querySelector('#type').value;
    const color    = card.querySelector('#color').value;
    const mileage  = parseInt(card.querySelector('#mileage').value);
    const price    = parseInt(card.querySelector('#price').value);
    const desc     = card.querySelector('#desc').value.trim();
    const isAuct   = card.querySelector('[name=ltype]:checked').value === 'auction';
    const dur      = parseInt(card.querySelector('#auctionDur').value);

    if (!model || !year || !mileage || !price || !desc) { showToast('Please fill in all fields'); return; }
    if (year < 1980 || year > 2026) { showToast('Please enter a valid year'); return; }

    const newListing = {
      id: 'l' + Date.now(), sellerId: state.user.id, brand, model, year, type, color,
      mileage, price, desc, emoji: selectedEmoji,
      auction: isAuct, auctionEnd: isAuct ? Date.now() + dur : null, bids: []
    };
    state.listings.unshift(newListing);
    showToast('🎉 Car listed successfully!');
    navigate('detail', { selectedListing: newListing.id });
  };

  wrap.appendChild(card);
  return wrap;
}

// ============================================================
//  PROFILE
// ============================================================
function renderProfile() {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'padding:32px;max-width:800px;margin:0 auto;';

  if (!state.user) {
    wrap.innerHTML = '<div class="empty"><span class="emoji">👤</span><h3>Sign in to view your profile</h3></div>';
    return wrap;
  }

  const card = document.createElement('div');
  card.className = 'profile-card';
  card.innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar">${initials(state.user.name)}</div>
      <div>
        <div style="font-family:Syne,sans-serif;font-size:24px;font-weight:800;">${state.user.name}</div>
        <div style="color:var(--muted);font-size:14px;">${state.user.email}</div>
        <div style="font-size:12px;color:var(--accent);margin-top:4px;font-weight:600;">✅ Verified Member</div>
      </div>
    </div>
  `;

  const myListings = state.listings.filter(l => l.sellerId === state.user.id);
  const listDiv = document.createElement('div');
  listDiv.innerHTML = `<h3 style="font-family:Syne,sans-serif;font-size:16px;margin-bottom:16px;">Your Listings (${myListings.length})</h3>`;

  if (!myListings.length) {
    listDiv.innerHTML += '<div style="color:var(--muted);font-size:14px;">No listings yet.</div>';
    const addBtn = document.createElement('button');
    addBtn.className = 'btn';
    addBtn.style.marginTop = '16px';
    addBtn.textContent = '+ Add Your First Listing';
    addBtn.onclick = () => navigate('list');
    listDiv.appendChild(addBtn);
  } else {
    myListings.forEach(l => {
      const topBid = getTopBid(l);
      const item = document.createElement('div');
      item.className = 'my-listing-item';
      item.innerHTML = `
        <div class="emoji">${l.emoji}</div>
        <div class="info">
          <div class="name">${l.year} ${l.brand} ${l.model}</div>
          <div class="price">${formatPrice(l.price)}${topBid ? ` · Top bid: ${formatPrice(topBid)}` : ''}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px;">${l.auction ? '🔨 Auction' : '🏷️ Fixed'} · ${l.bids.length} bid${l.bids.length !== 1 ? 's' : ''}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm view-btn" data-id="${l.id}">View</button>
          <button class="btn btn-sm btn-danger del-btn" data-id="${l.id}">Delete</button>
        </div>
      `;
      listDiv.appendChild(item);
    });

    card.querySelectorAll && setTimeout(() => {
      listDiv.querySelectorAll('.view-btn').forEach(btn => {
        btn.onclick = () => navigate('detail', { selectedListing: btn.dataset.id });
      });
      listDiv.querySelectorAll('.del-btn').forEach(btn => {
        btn.onclick = () => {
          state.listings = state.listings.filter(l => l.id !== btn.dataset.id);
          showToast('Listing deleted');
          navigate('profile');
        };
      });
    }, 0);
  }

  card.appendChild(listDiv);
  wrap.appendChild(card);

  // Wire up buttons after DOM append
  setTimeout(() => {
    wrap.querySelectorAll('.view-btn').forEach(btn => {
      btn.onclick = () => navigate('detail', { selectedListing: btn.dataset.id });
    });
    wrap.querySelectorAll('.del-btn').forEach(btn => {
      btn.onclick = () => {
        state.listings = state.listings.filter(l => l.id !== btn.dataset.id);
        showToast('Listing deleted');
        navigate('profile');
      };
    });
  }, 0);

  return wrap;
}

// ============================================================
//  BOOT
// ============================================================
render();
