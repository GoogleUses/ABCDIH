/* NJ site v26 compatibility and content patch.
 * This file is intentionally separate from the large bundled app so future
 * catalog builds do not overwrite the fixes below.
 */
(function () {
  'use strict';

  const proxies = [
    ['IXL', 'https://goeeoe.inoriza-racing.com.ar/'],
    ['Strawberri', 'https://stories-math.martindiaz.org/'],
    ['Tung Tung', 'https://tt-mathsubject.martindiaz.org/'],
    ['Utopia', 'https://math-qo.martindiaz.org/'],
    ['Fern Proxy', 'https://s3.amazonaws.com/angelfern/index.html']
  ];
  const esc = (v) => String(v).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));
  const masterHash = 'f613e8c503ac4659ed35b54a936fde38d4fc9fc537849d99168828caa78cdc2d';
  async function sha256(value) {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  let _njFbPromise = null;
  function firebaseTools() {
    if (_njFbPromise) return _njFbPromise;
    _njFbPromise = Promise.all([
      import('https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js')
    ]).then(([appMod, dbMod]) => {
      const cfg = {
        apiKey: atob('QUl6YVN5RFc5eGRGZHhGU2pBbTE1Zi1sMTA3ZlFwbVpiczZfdkV3'),
        authDomain: atob('dHJvbGxpbmctZTNlZDguZmlyZWJhc2VhcHAuY29t'),
        databaseURL: atob('aHR0cHM6Ly90cm9sbGluZy1lM2VkOC1kZWZhdWx0LXJ0ZGIuZmlyZWJhc2Vpby5jb20='),
        projectId: atob('dHJvbGxpbmctZTNlZDg='),
        storageBucket: atob('dHJvbGxpbmctZTNlZDguYXBwc3BvdC5jb20='),
        messagingSenderId: atob('Mjk5MjYwNDM5MDE5'),
        appId: atob('MToyOTkyNjA0MzkwMTk6d2ViOjlkZWRjOTg2MzM0YTg3MWUxZDUxYWU=')
      };
      const app = appMod.getApps().find(a => a.name === 'nj_main_sys') ||
        appMod.initializeApp(cfg, 'nj_main_sys');
      return { db: dbMod.getDatabase(app), ...dbMod };
    }).catch(() => null);
    return _njFbPromise;
  }

  function visible(el) {
    if (!el) return false;
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
  }

  const removedPokiGames = [
    'Dreadhead Parkour', 'Level Devil', 'Temple of Boom', 'Monster Tracks',
    'Furious Racing 3D', 'Soccer Skills Champions League', 'Slopey', 'Poor Bunny',
    'Make It Meme', 'Super Star Car', 'Merge Cyber Racers', 'Rooftop Snipers 2',
    'Raft Wars', 'Idle Lumber Inc', 'Battle Wheels', 'Village Craft', 'Eugenes Life',
    'Super Mario Bros', 'Basketball Legends', 'Red Ball 4', 'Tank Ball: Monster Battle',
    'Offroader V5', 'Traffic Escape', 'Murder', 'Stickman Archero Fight',
    'Fireboy and Watergirl: Forest Temple', 'Stickman Bike',
    'Archer Master 3D: Castle Defense', 'Stair Race 3D', 'FNF Minus',
    "FNF Salty's Sunday Night", "FNF Michael Jackson's Rose Criminal",
    'FNF Smoke Em Out Struggle', 'FNF UpSide', 'Flip Side', 'FNF Vs Hex Mod',
    'FNF Vs Shaggy', 'FNF StarCatcher', "Friday Night Funkin' vs Hatsune Miku",
    'FNF Vs Henry Stickmin', 'FNF Vs Void', 'FNF Week 6',
    "Friday Night Funkin' B-Sides", 'Everywhere At The End Of Funk',
    "Friday Night Funkin' vs Shaggy x Matt", "Friday Night Funkin' vs XE",
    'FNF Vs Matt', 'Little Master Cricket'
  ];

  function removePokiGameCards() {
    const names = removedPokiGames.map(x => x.toLowerCase());
    const hide = el => {
      if (!el || el.id === 'root' || el === document.body) return;
      el.classList.add('nj-poki-hidden');
      el.setAttribute('aria-hidden', 'true');
    };
    if (!document.getElementById('nj-poki-hide-style')) {
      const style = document.createElement('style');
      style.id = 'nj-poki-hide-style';
      style.textContent = '.nj-poki-hidden{display:none!important}';
      document.head.appendChild(style);
    }
    // The catalog cards are React divs rather than articles or links. Their
    // thumbnails are the stable marker, so remove the rendered card itself.
    document.querySelectorAll('img[src*="pokiunblocked.gitlab.io"], img[data-src*="pokiunblocked.gitlab.io"]').forEach(img => {
      hide(img.closest('div[style*="cursor"]') || img.parentElement?.parentElement?.parentElement);
    });
    document.querySelectorAll('article, li, [class*="card"], [class*="Card"]').forEach(card => {
      const text = (card.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (names.some(name => text.includes(name))) hide(card);
    });
    [...document.querySelectorAll('p, span, div, a, button')].forEach(label => {
      const text = (label.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (names.includes(text)) {
        const card = label.closest('div[style*="cursor"]') || cardFor(label);
        if (card) hide(card);
      }
    });
  }

  // Direct-source catalog importer. This intentionally skips Google Sites and
  // other hub pages: only game pages/files or pages exposing a game iframe are
  // added to the site's own player.
  const importedSources = [
    { name: 'StrongDog XP', index: 'https://mathcordxp.github.io/cards-data.js', type: 'strongdog' },
    { name: 'Cool UGB', index: 'https://coolunblockedgames.github.io/pages.js', type: 'cool' },
    { name: 'GitHub Games', index: 'https://git-hub-games.github.io/', type: 'github' },
    { name: 'Classroom 6x', index: 'https://classroom6xunblocked-games.github.io/', type: 'classroom' }
  ];
  let importedCatalogPromise = null;
  const importedKey = value => String(value || '').toLowerCase().replace(/&amp;/g, '&').replace(/[^a-z0-9]+/g, ' ').trim();
  const absoluteUrl = (value, base) => { try { return new URL(value, base).href; } catch (_) { return ''; } };
  const htmlText = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  async function fetchText(url) {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    return response.text();
  }
  function parseStrongDog(text, source) {
    const games = [], re = /\{\s*href:\s*['"]([^'"]+)['"][\s\S]{0,220}?name:\s*['"]([^'"]+)['"][\s\S]{0,120}?(?:'id'|"id"|id):\s*([0-9]+)/g;
    let match;
    while ((match = re.exec(text))) games.push({ name: match[2], source: source.name, page: absoluteUrl(match[1], source.index), kind: 'resolve' });
    return games;
  }
  function parseCool(text, source) {
    const games = [], re = /\{\s*name:\s*"([^"]+)"([\s\S]*?)\n\s*\}/g;
    let match;
    while ((match = re.exec(text))) {
      const body = match[2], type = (body.match(/fileType:\s*"([^"]+)"/) || [])[1] || 'html';
      const file = (body.match(/file_name:\s*"([^"]+)"/) || [])[1] || match[1];
      games.push({ name: (body.match(/formatted_Name:\s*"([^"]+)"/) || [])[1] || match[1], source: source.name, page: `https://coolubg2.github.io/coolubg-list/${encodeURIComponent(file).replace(/%2F/gi, '/')}${type === 'html' && !/\.[a-z0-9]+$/i.test(file) ? '.html' : ''}`, kind: 'direct' });
    }
    return games;
  }
  function parseHub(text, source, prefix, titlePattern) {
    const games = [], re = new RegExp(`href=["'](${prefix}[^"']+)["'][\\s\\S]{0,700}?${titlePattern}`, 'gi');
    let match;
    while ((match = re.exec(text))) games.push({ name: htmlText(match[2] || match[1].split('/').pop().replace(/[-_]/g, ' ')), source: source.name, page: absoluteUrl(match[1], source.index), kind: 'resolve' });
    return games;
  }
  async function loadImportedCatalog() {
    if (importedCatalogPromise) return importedCatalogPromise;
    importedCatalogPromise = Promise.all(importedSources.map(async source => {
      try {
        const text = await fetchText(source.index);
        if (source.type === 'strongdog') return parseStrongDog(text, source);
        if (source.type === 'cool') return parseCool(text, source);
        if (source.type === 'github') return parseHub(text, source, '/play/', "alt=[\"']([^\"']+)[\"']");
        return parseHub(text, source, '/g/', "title=[\"']([^\"']+)[\"']");
      } catch (_) { return []; }
    })).then(groups => {
      const seen = new Set();
      const existing = new Set([...document.querySelectorAll('img[alt]')].map(image => importedKey(image.alt)));
      return groups.flat().filter(game => {
        const key = importedKey(game.name);
        if (!key || seen.has(key) || existing.has(key) || removedPokiGames.some(name => importedKey(name) === key)) return false;
        seen.add(key);
        return true;
      });
    });
    return importedCatalogPromise;
  }
  async function resolveImportedGame(game) {
    if (game.kind === 'direct') return game.page;
    try {
      const text = await fetchText(game.page);
      const match = text.match(/<iframe[^>]+(?:id=["']game-area["']|class=["'][^"']*game-iframe[^"']*)[^>]+src=["']([^"']+)["']/i) || text.match(/<iframe[^>]+src=["']([^"']+)["']/i);
      return match ? absoluteUrl(match[1], game.page) : game.page;
    } catch (_) { return game.page; }
  }
  function openImportedGame(game) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:20000;background:#000;display:flex;flex-direction:column;';
    overlay.innerHTML = `<div style="background:#0f0f1a;border-bottom:1px solid #2a2a4a;padding:9px 14px;display:flex;align-items:center;gap:10px;flex-shrink:0"><b style="color:#fff;flex:1">🎮 ${esc(game.name)}</b><span style="color:#6b7280;font-size:11px">${esc(game.source)}</span><button style="background:#1a1a2e;border:1px solid #3b2b68;border-radius:7px;color:#fff;padding:6px 10px;cursor:pointer">✕</button></div><div style="flex:1;position:relative"><div class="nj-import-loading" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#c4b5fd">Loading game…</div></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('button').onclick = () => overlay.remove();
    resolveImportedGame(game).then(url => {
      if (!url || !overlay.isConnected) return;
      const frame = document.createElement('iframe');
      frame.src = url; frame.title = game.name; frame.allowFullscreen = true;
      frame.style.cssText = 'width:100%;height:100%;border:0;position:absolute;inset:0;';
      frame.setAttribute('allow', 'fullscreen; gamepad; autoplay');
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-presentation');
      overlay.querySelector('.nj-import-loading')?.remove();
      overlay.querySelector('div > div:last-child')?.appendChild(frame);
    });
  }
  function installImportedCatalogButton() {
    if (document.getElementById('nj-imported-games-button')) return;
    const anchor = [...document.querySelectorAll('button')].find(button => (button.textContent || '').replace(/\s+/g, ' ').trim() === '🌐 Unblocker');
    if (!anchor || !anchor.parentElement) return;
    const button = document.createElement('button');
    button.id = 'nj-imported-games-button'; button.className = 'nj-hdr-btn'; button.type = 'button'; button.textContent = '🧩 Imported Games';
    button.onclick = async () => {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:10060;background:#0a0a0f;overflow:auto;padding:24px 16px;color:#fff;';
      overlay.innerHTML = '<div style="max-width:1100px;margin:0 auto"><div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><h1 style="font-size:22px;margin:0;flex:1">🧩 Imported Games</h1><button id="nj-import-close" style="background:#1a1a2e;border:1px solid #3b2b68;border-radius:8px;color:#fff;padding:8px 12px;cursor:pointer">✕ Close</button></div><p style="color:#9ca3af;font-size:12px;margin:0 0 14px">Direct game sources only — hub pages and wrapper pages are excluded.</p><input id="nj-import-search" placeholder="Search imported games…" style="width:100%;box-sizing:border-box;background:#171727;border:1px solid #3b2b68;border-radius:8px;padding:10px;color:#fff;margin-bottom:14px"><div id="nj-import-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px"><p style="color:#c4b5fd">Loading catalogs…</p></div></div>';
      document.body.appendChild(overlay);
      overlay.querySelector('#nj-import-close').onclick = () => overlay.remove();
      const list = overlay.querySelector('#nj-import-list'), games = await loadImportedCatalog();
      const render = () => {
        const query = importedKey(overlay.querySelector('#nj-import-search').value);
        const shown = games.filter(game => !query || importedKey(game.name).includes(query));
        list.innerHTML = shown.length ? shown.map((game, index) => `<button data-index="${index}" style="text-align:left;background:#171727;border:1px solid #2a2a4a;border-radius:10px;padding:12px;color:#fff;cursor:pointer"><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(game.name)}</b><span style="display:block;color:#a78bfa;font-size:10px;margin-top:5px">${esc(game.source)}</span></button>`).join('') : '<p style="color:#9ca3af">No imported games found.</p>';
        list.querySelectorAll('[data-index]').forEach(item => { item.onclick = () => openImportedGame(shown[Number(item.dataset.index)]); });
      };
      overlay.querySelector('#nj-import-search').oninput = render; render();
    };
    anchor.parentElement.insertBefore(button, anchor.nextSibling);
  }

  function installImportedHomeGames() {
    if (document.getElementById('nj-imported-home-games')) return;
    const grid = document.querySelector('main [style*="grid-template-columns"]');
    if (!grid) return;
    const section = document.createElement('div');
    section.id = 'nj-imported-home-games';
    section.style.cssText = 'display:contents';
    grid.appendChild(section);
    loadImportedCatalog().then(games => {
      if (!section.isConnected) return;
      const fragment = document.createDocumentFragment();
      games.forEach(game => {
        const card = document.createElement('div');
        card.style.cssText = 'cursor:pointer;border-radius:12px;overflow:hidden;background:#1a1a2e;border:1px solid #2a2a4a;transition:all .2s;';
        card.title = `${game.name} · ${game.source}`;
        card.innerHTML = `<div style="position:relative;padding-bottom:100%;background:#0f0f1a"><img alt="${esc(game.name)}" loading="lazy" src="https://placehold.co/200x200/1a1a2e/9333ea?text=${encodeURIComponent((game.name || '?')[0])}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"><div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.7),transparent);display:flex;align-items:center;justify-content:center"><div style="background:#7c3aed;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px">▶</div></div></div><div style="padding:8px 8px 10px"><p style="color:#fff;font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.3;margin:0">${esc(game.name)}</p><p style="color:#7c3aed;font-size:11px;margin:2px 0 0">${esc(game.source)}</p></div>`;
        card.onmouseenter = () => { card.style.transform = 'scale(1.05)'; card.style.borderColor = '#7c3aed'; card.style.boxShadow = '0 8px 24px rgba(124,58,237,.25)'; };
        card.onmouseleave = () => { card.style.transform = ''; card.style.borderColor = '#2a2a4a'; card.style.boxShadow = ''; };
        card.onclick = () => openImportedGame(game);
        fragment.appendChild(card);
      });
      section.appendChild(fragment);
    });
  }

  // The original presence writer only knows whether an iframe exists. This
  // second, low-frequency observer records the visible feature/overlay too,
  // without replacing the site's existing game telemetry.
  function installPresenceObserver() {
    if (window.__njDetailedPresence) return;
    window.__njDetailedPresence = true;
    let last = '';
    let lastWritten = 0;
    const featureMap = [
      ['nj-settings-overlay', '⚙️ In Settings'],
      ['nj-gamble-overlay', '🎰 Gambling'],
      ['nj-spin-overlay', '🎡 Spinning the Wheel'],
      ['nj-shop-overlay', '🛒 Browsing Shop'],
      ['nj-lb-overlay', '🏆 Viewing Leaderboard'],
      ['nj-challenges-overlay', '⚡ Doing Challenges'],
      ['nj-profile-overlay', '👤 Viewing Profile'],
      ['nj-codes-overlay', '🎟️ Redeeming Code'],
      ['nj-unblocker-overlay', '🌐 Using Unblocker'],
      ['nj-soundboard-overlay', '🎵 Using Soundboard'],
      ['nj-ach-overlay', '🏅 Viewing Achievements'],
      ['nj-lucky-overlay', '🍀 Using Lucky Draw'],
      ['nj-quiz-overlay', '🧠 Taking the Quiz'],
      ['nj-lootbox-overlay', '🎁 Opening a Loot Box'],
      ['nj-levelup-overlay', '⬆️ Viewing Level Up'],
      ['nj-events-overlay', '📅 Viewing Events'],
      ['nj-announce-overlay', '📣 Viewing Announcement']
    ];
    const record = async (activity, game) => {
      const username = localStorage.getItem('nj_username');
      const sessionId = sessionStorage.getItem('nj_sess');
      if (!username || !sessionId) return;
      const f = await firebaseTools();
      if (!f) return;
      const now = Date.now();
      const key = JSON.stringify([activity, game && game.name]);
      if (key === last && now - lastWritten < 5000) return;
      last = key;
      lastWritten = now;
      const presenceRef = f.ref(f.db, `njsgames/presence/${sessionId}`);
      const snap = await f.get(presenceRef).catch(() => null);
      const current = snap && snap.exists() ? snap.val() : {};
      const history = Array.isArray(current.activityHistory) ? current.activityHistory : [];
      history.push({ ...activity, ts: now });
      await f.update(presenceRef, {
        username, game: game || null, activity,
        activityHistory: history.slice(-12), lastSeen: now, lastActive: now
      }).catch(() => {});
    };
    const scan = () => {
      let game = null;
      const frame = [...document.querySelectorAll('iframe[title]')].find(x =>
        visible(x) && !['Chat Rooms', 'AI Chat'].includes(x.title));
      if (frame) game = { name: frame.title, thumb: null };
      let feature = null;
      const chatFrame = [...document.querySelectorAll('iframe')].find(x =>
        visible(x) && (x.title === 'Chat Rooms' || /chat/i.test(x.src || '')));
      if (chatFrame) feature = '💬 Chatting';
      const unblocker = document.getElementById('nj-unblocker-overlay');
      if (!feature && visible(unblocker)) {
        const sel = document.getElementById('nj-unblocker-site-select');
        feature = '🌐 Using ' + (sel && sel.selectedOptions[0] ? sel.selectedOptions[0].textContent.trim() : 'Unblocker');
      }
      for (const [id, label] of featureMap) {
        if (!feature && visible(document.getElementById(id))) { feature = label; break; }
      }
      record(
        feature ? { type: 'feature', label: feature, detail: location.href } :
          game ? { type: 'game', label: 'Playing ' + game.name, detail: location.href } :
            { type: 'site', label: 'Browsing the site', detail: location.pathname },
        feature ? null : game
      );
    };
    scan();
    setInterval(scan, 1200);
  }

  function ensureRequestButton() {
    // The request action lives in the header, stacked below Unblocker.
    // Keep this binding idempotent because the site patch is re-run after
    // React catalog updates.
    let button = document.getElementById('nj-game-request-button');
    if (!button) {
      const unblocker = [...document.querySelectorAll('button')].find(el =>
        (el.textContent || '').replace(/\s+/g, ' ').trim() === '🌐 Unblocker'
      );
      if (unblocker && unblocker.parentElement) {
        const stack = document.createElement('div');
        stack.style.cssText = 'display:flex;flex-direction:column;gap:3px';
        unblocker.parentElement.insertBefore(stack, unblocker);
        stack.appendChild(unblocker);
        button = document.createElement('button');
        button.id = 'nj-game-request-button';
        button.className = 'nj-hdr-btn';
        button.textContent = '🎮 Request a game';
        stack.appendChild(button);
      }
    }
    if (button) {
      button.onclick = openRequestForm;
      button.type = 'button';
    }
    window.njOpenRequestForm = openRequestForm;
  }

  function buttonByText(text) {
    return [...document.querySelectorAll('#nj-hdr-gbar button')].find(button =>
      (button.textContent || '').replace(/\s+/g, ' ').trim() === text
    );
  }

  function makeHeaderGroup(bar, buttons, className) {
    const group = document.createElement('div');
    group.className = `nj-hdr-group ${className}`;
    group.style.cssText = 'display:flex;flex-direction:column;gap:3px;flex:0 0 auto;';
    buttons.filter(Boolean).forEach(button => group.appendChild(button));
    bar.appendChild(group);
  }

  function installHealthBar() {
    const bar = document.getElementById('nj-hdr-gbar');
    if (!bar || document.getElementById('nj-site-health')) return;
    const health = document.createElement('div');
    health.id = 'nj-site-health';
    health.title = 'Live status for the site shell, connection, and player';
    health.style.cssText = 'display:flex;align-items:center;gap:5px;background:#111827;border:1px solid #374151;border-radius:8px;padding:5px 8px;color:#d1d5db;font-size:11px;white-space:nowrap;';
    health.innerHTML = '<span id="nj-health-dot" style="width:7px;height:7px;border-radius:50%;background:#fbbf24;box-shadow:0 0 7px #fbbf24"></span><span id="nj-health-text">Checking site…</span>';
    bar.appendChild(health);
    const setHealth = (label, color) => {
      const dot = document.getElementById('nj-health-dot'), text = document.getElementById('nj-health-text');
      if (dot) { dot.style.background = color; dot.style.boxShadow = `0 0 7px ${color}`; }
      if (text) text.textContent = label;
    };
    const check = async () => {
      if (!navigator.onLine) { setHealth('Offline', '#ef4444'); return; }
      if (!document.getElementById('root')) { setHealth('Player unavailable', '#ef4444'); return; }
      try {
        const f = await firebaseTools();
        setHealth(f ? 'Site healthy' : 'Player online · data offline', f ? '#22c55e' : '#f59e0b');
      } catch (_) { setHealth('Player online · data offline', '#f59e0b'); }
    };
    check();
    setInterval(check, 30000);
  }

  function installRandomGameButton(button) {
    if (button) return button;
    const b = document.createElement('button');
    b.className = 'nj-hdr-btn';
    b.type = 'button';
    b.textContent = '🎲 Random Game';
    b.onclick = () => {
      const links = [...document.querySelectorAll('a[href*="/play/"]')].filter(el => visible(el));
      if (links.length) { links[Math.floor(Math.random() * links.length)].click(); return; }
      const fallback = ['ab-kissing-simulator','arcana-fight','avatar-fortress-fight-2','backrooms-2','basketball-stars','batman-dog','blocky-world','bowling','buckshot-roulette','build-a-big-army','build-an-army','build-defend','cb-clicker','chicken-royale','crashy-road','crazy-roll','delivery','deltarune','diep-io-original','drono','dune-buggy','escape-game','flappy-dunk','flying-cookie-quest','fly-the-plane','friday-n-funkin','goku','gvibes','hazmob-fps','hop-fighters','i-am-quadrober','ice-dodo'];
      const slug = fallback[Math.floor(Math.random() * fallback.length)];
      const destination = new URL(`ABCDIH/play/${slug}`, location.origin + (location.pathname.startsWith('/ABCDIH') ? '/' : '/')).href;
      history.pushState({}, '', destination);
      window.dispatchEvent(new PopStateEvent('popstate'));
    };
    return b;
  }

  function openModRequestForm() {
    if (document.getElementById('nj-mod-request-overlay')) return;
    const ov = document.createElement('div');
    ov.id = 'nj-mod-request-overlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:10080;background:#000b;display:flex;align-items:center;justify-content:center;padding:16px;';
    ov.innerHTML = '<form id="nj-mod-request-form" style="background:#0f0f1a;border:1px solid #7c3aed;border-radius:18px;width:min(520px,95vw);max-height:92vh;overflow:auto;padding:22px;color:#fff;box-shadow:0 16px 60px #000">' +
      '<button type="button" id="nj-mod-close" style="float:right;background:none;border:0;color:#9ca3af;font-size:22px;cursor:pointer">✕</button>' +
      '<h2 style="margin:0 0 6px">📨 Other request</h2><p style="color:#9ca3af;font-size:12px;margin:0 0 18px">Give the admin team enough detail to review this properly.</p>' +
      '<label style="display:block;font-size:12px;color:#c4b5fd;margin:10px 0 5px">What kind of request? *</label><select id="nj-mod-type" required style="width:100%;box-sizing:border-box;padding:10px;background:#171727;border:1px solid #3b2b68;border-radius:8px;color:#fff"><option value="">Choose one…</option><option>Report a bug</option><option>Report a broken game or link</option><option>Suggest a site change</option><option>Report inappropriate content</option><option>Other</option></select>' +
      '<label style="display:block;font-size:12px;color:#c4b5fd;margin:10px 0 5px">Short title *</label><input id="nj-mod-title" required maxlength="100" placeholder="Summarise the request" style="width:100%;box-sizing:border-box;padding:10px;background:#171727;border:1px solid #3b2b68;border-radius:8px;color:#fff">' +
      '<label style="display:block;font-size:12px;color:#c4b5fd;margin:10px 0 5px">Where does it happen? *</label><input id="nj-mod-location" required maxlength="160" placeholder="Game name, page, or header" style="width:100%;box-sizing:border-box;padding:10px;background:#171727;border:1px solid #3b2b68;border-radius:8px;color:#fff">' +
      '<label style="display:block;font-size:12px;color:#c4b5fd;margin:10px 0 5px">What happened? *</label><textarea id="nj-mod-details" required maxlength="1200" rows="5" placeholder="Steps to reproduce, what you expected, and what you saw…" style="width:100%;box-sizing:border-box;padding:10px;background:#171727;border:1px solid #3b2b68;border-radius:8px;color:#fff;resize:vertical"></textarea>' +
      '<label style="display:block;font-size:12px;color:#c4b5fd;margin:10px 0 5px">Helpful link or screenshot URL</label><input id="nj-mod-evidence" type="url" maxlength="400" placeholder="https://..." style="width:100%;box-sizing:border-box;padding:10px;background:#171727;border:1px solid #3b2b68;border-radius:8px;color:#fff">' +
      '<label style="display:block;font-size:12px;color:#c4b5fd;margin:10px 0 5px">How urgent is it?</label><select id="nj-mod-priority" style="width:100%;box-sizing:border-box;padding:10px;background:#171727;border:1px solid #3b2b68;border-radius:8px;color:#fff"><option>Low</option><option selected>Normal</option><option>High</option><option>Urgent</option></select>' +
      '<div id="nj-mod-status" style="font-size:12px;margin-top:10px"></div><button type="submit" style="margin-top:14px;width:100%;padding:11px;background:#7c3aed;border:0;border-radius:9px;color:#fff;font-weight:800;cursor:pointer">Send to moderators</button></form>';
    document.body.appendChild(ov);
    ov.querySelector('#nj-mod-close').onclick = () => ov.remove();
    ov.querySelector('#nj-mod-request-form').onsubmit = async event => {
      event.preventDefault();
      const status = ov.querySelector('#nj-mod-status');
      const evidence = ov.querySelector('#nj-mod-evidence').value.trim();
      if (evidence && !/^https?:\/\//i.test(evidence)) {
        status.textContent = 'Please use a full http:// or https:// link.';
        status.style.color = '#f87171';
        return;
      }
      const f = await firebaseTools();
      if (!f) { status.textContent = 'Could not connect right now. Try again shortly.'; status.style.color = '#f87171'; return; }
      const request = {
        type: ov.querySelector('#nj-mod-type').value,
        title: ov.querySelector('#nj-mod-title').value.trim(),
        location: ov.querySelector('#nj-mod-location').value.trim(),
        details: ov.querySelector('#nj-mod-details').value.trim(),
        evidence, priority: ov.querySelector('#nj-mod-priority').value,
        username: localStorage.getItem('nj_username') || 'Guest',
        sessionId: sessionStorage.getItem('nj_sess') || '',
        status: 'pending', submittedAt: Date.now()
      };
      await f.set(f.push(f.ref(f.db, 'njsgames/otherRequests')), request);
      status.textContent = '✅ Sent to the admin panel.';
      status.style.color = '#4ade80';
      event.target.querySelector('button[type="submit"]').disabled = true;
    };
  }

  function rebuildHeaderGroups() {
    const bar = document.getElementById('nj-hdr-gbar');
    if (!bar || bar.dataset.njGroupsBuilt === '1') return;
    const stat = bar.querySelector('.nj-stat-pill');
    // The status indicator is intentionally not part of the public header.
    const find = text => buttonByText(text);
    const leaderboard = find('🏆 Leaderboard'), shop = find('🛒 Shop'), profile = find('👤 Profile'), soundboard = find('🎵 Soundboard');
    const testing = find('🧪 Testing Sites');
    const spin = find('🎡 Daily Spin'), challenges = find('⚡ Challenges');
    const unblocker = find('🌐 Unblocker'), otherSites = find('🌐 Other Sites'), gameRequest = document.getElementById('nj-game-request-button') || find('🎮 Request a game');
    const gamble = find('🎰 Gamble'), coinFarmer = find('🪙 Coin Farmer'), redeem = find('🎟️ Redeem');
    const random = installRandomGameButton(find('🎲 Random Game'));
    const mod = document.createElement('button');
    mod.className = 'nj-hdr-btn'; mod.type = 'button'; mod.textContent = '📨 Other requests';
    mod.onclick = openModRequestForm;
    [...bar.children].forEach(child => child.remove());
    if (stat) bar.appendChild(stat);
    makeHeaderGroup(bar, [leaderboard], 'nj-hdr-group-1');
    makeHeaderGroup(bar, [shop, profile], 'nj-hdr-group-1');
    makeHeaderGroup(bar, [random, soundboard], 'nj-hdr-group-2');
    makeHeaderGroup(bar, [testing], 'nj-hdr-group-2');
    makeHeaderGroup(bar, [spin, challenges], 'nj-hdr-group-2');
    makeHeaderGroup(bar, [unblocker, otherSites], 'nj-hdr-group-2');
    makeHeaderGroup(bar, [gameRequest, mod], 'nj-hdr-group-2');
    makeHeaderGroup(bar, [gamble, coinFarmer, redeem], 'nj-hdr-group-3');
    bar.dataset.njGroupsBuilt = '1';
  }

  function bypassBitlifeQuiz() {
    const finish = () => {
      const overlay = document.getElementById('nj-quiz-overlay');
      if (!overlay) return;
      const correct = overlay.querySelector('.nj-quiz-choice[data-correct="true"]');
      if (correct) {
        // Use the existing handler so pending username/presence state is
        // completed exactly as it was for a user answering the quiz.
        correct.click();
      } else {
        overlay.style.display = 'none';
      }
      localStorage.setItem('nj_quiz_passed', '1');
    };
    const scan = () => {
      const overlay = document.getElementById('nj-quiz-overlay');
      if (overlay && getComputedStyle(overlay).display !== 'none') finish();
    };
    new MutationObserver(scan).observe(document.documentElement, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['style']
    });
    scan();
  }

  function hardenInSiteNavigation() {
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
      link.target = '_self';
      link.removeAttribute('rel');
    });
    if (window.__njNoPopupsInstalled) return;
    window.__njNoPopupsInstalled = true;
    window.open = function () {
      showToast('🛡️ Popups and new tabs are disabled');
      return null;
    };
  }

  function openRequestForm() {
    if (document.getElementById('nj-request-overlay')) return;
    const ov = document.createElement('div');
    ov.id = 'nj-request-overlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:10080;background:#000b;display:flex;align-items:center;justify-content:center;padding:16px;';
    ov.innerHTML = '<form id="nj-request-form" style="background:#0f0f1a;border:1px solid #7c3aed;border-radius:18px;width:min(480px,95vw);padding:22px;color:#fff;box-shadow:0 16px 60px #000">' +
      '<button type="button" id="nj-request-close" style="float:right;background:none;border:0;color:#9ca3af;font-size:22px;cursor:pointer">✕</button>' +
      '<h2 style="margin:0 0 6px">🎮 Request a game</h2><p style="color:#9ca3af;font-size:12px;margin:0 0 18px">Tell us what you want added. Requests go straight to the admin panel.</p>' +
      '<label style="display:block;font-size:12px;color:#c4b5fd;margin:10px 0 5px">Game name *</label><input id="nj-request-name" required maxlength="80" placeholder="e.g. Geometry Dash" style="width:100%;box-sizing:border-box;padding:10px;background:#171727;border:1px solid #3b2b68;border-radius:8px;color:#fff">' +
      '<label style="display:block;font-size:12px;color:#c4b5fd;margin:10px 0 5px">Link (optional)</label><input id="nj-request-url" type="url" maxlength="300" placeholder="https://..." style="width:100%;box-sizing:border-box;padding:10px;background:#171727;border:1px solid #3b2b68;border-radius:8px;color:#fff">' +
      '<label style="display:block;font-size:12px;color:#c4b5fd;margin:10px 0 5px">Why this game?</label><textarea id="nj-request-note" maxlength="500" rows="3" placeholder="Anything helpful for the admin…" style="width:100%;box-sizing:border-box;padding:10px;background:#171727;border:1px solid #3b2b68;border-radius:8px;color:#fff;resize:vertical"></textarea>' +
      '<div id="nj-request-status" style="font-size:12px;margin-top:10px"></div><button type="submit" style="margin-top:14px;width:100%;padding:11px;background:#7c3aed;border:0;border-radius:9px;color:#fff;font-weight:800;cursor:pointer">Submit request</button></form>';
    document.body.appendChild(ov);
    ov.querySelector('#nj-request-close').onclick = () => ov.remove();
    ov.querySelector('#nj-request-form').onsubmit = async e => {
      e.preventDefault();
      const status = ov.querySelector('#nj-request-status');
      const f = await firebaseTools();
      if (!f) { status.textContent = 'Could not connect right now. Try again shortly.'; status.style.color = '#f87171'; return; }
      const request = {
        gameName: ov.querySelector('#nj-request-name').value.trim(),
        url: ov.querySelector('#nj-request-url').value.trim(),
        note: ov.querySelector('#nj-request-note').value.trim(),
        username: localStorage.getItem('nj_username') || 'Guest',
        sessionId: sessionStorage.getItem('nj_sess') || '',
        status: 'pending', submittedAt: Date.now()
      };
      if (!request.gameName) return;
      if (request.url && !/^https?:\/\//i.test(request.url)) {
        status.textContent = 'Please use a full http:// or https:// link.';
        status.style.color = '#f87171';
        return;
      }
      await f.set(f.push(f.ref(f.db, 'njsgames/gameRequests')), request);
      status.textContent = '✅ Sent to the admin panel.';
      status.style.color = '#4ade80';
      e.target.querySelector('button[type="submit"]').disabled = true;
    };
  }

  function installAdminRequests() {
    const body = document.getElementById('nj-admin-body');
    if (!body || document.getElementById('nj-admin-requests')) return;
    const section = document.createElement('section');
    section.id = 'nj-admin-requests';
    section.style.cssText = 'margin:14px 0;padding:14px;background:#121225;border:1px solid #3b2b68;border-radius:12px;';
    section.innerHTML = '<div style="display:flex;align-items:center;gap:8px"><b style="color:#fff">🎮 Game requests</b><span id="nj-request-count" style="color:#a78bfa;font-size:11px"></span><button id="nj-request-refresh" style="margin-left:auto;background:#2a2a4a;border:0;border-radius:6px;padding:5px 8px;color:#d1d5db;cursor:pointer">↻</button></div><div id="nj-request-list" style="margin-top:10px;color:#9ca3af;font-size:12px">Loading…</div>';
    body.prepend(section);
    const render = data => {
      const list = Object.entries(data || {}).sort((a,b) => (b[1].submittedAt||0)-(a[1].submittedAt||0));
      section.querySelector('#nj-request-count').textContent = `${list.filter(([,x]) => x.status === 'pending').length} pending`;
      section.querySelector('#nj-request-list').innerHTML = list.length ? list.map(([id, x]) =>
        `<div style="border-top:1px solid #2a2a4a;padding:10px 0"><div style="color:#fff;font-weight:700">${esc(x.gameName)} <span style="color:${x.status==='pending'?'#fbbf24':'#6b7280'};font-size:10px">${esc(x.status||'pending')}</span></div><div style="color:#9ca3af;font-size:11px;margin-top:3px">${esc(x.username||'Guest')} · ${new Date(x.submittedAt||0).toLocaleString()}</div>${x.url?`<a href="${esc(x.url)}" target="_self" style="color:#a78bfa;font-size:11px">${esc(x.url)}</a>`:''}${x.note?`<div style="color:#d1d5db;margin-top:4px">${esc(x.note)}</div>`:''}<div style="display:flex;gap:6px;margin-top:7px">${x.status==='pending'?`<button data-action="approved" data-id="${esc(id)}" style="background:#064e3b;color:#6ee7b7;border:0;border-radius:6px;padding:5px 8px;cursor:pointer">Approve</button><button data-action="rejected" data-id="${esc(id)}" style="background:#451a1a;color:#fca5a5;border:0;border-radius:6px;padding:5px 8px;cursor:pointer">Reject</button>`:''}<button data-action="delete" data-id="${esc(id)}" style="background:#2a2a4a;color:#9ca3af;border:0;border-radius:6px;padding:5px 8px;cursor:pointer">Delete</button></div></div>`
      ).join('') : 'No game requests yet.';
      section.querySelectorAll('[data-action]').forEach(btn => btn.onclick = async () => {
        const f = await firebaseTools(); if (!f) return;
        const path = `njsgames/gameRequests/${btn.dataset.id}`;
        if (btn.dataset.action === 'delete') await f.remove(f.ref(f.db, path));
        else await f.update(f.ref(f.db, path), { status: btn.dataset.action, reviewedAt: Date.now(), reviewedBy: localStorage.getItem('nj_username') || 'Admin' });
      });
    };
    section.querySelector('#nj-request-refresh').onclick = async () => {
      const f = await firebaseTools(); if (!f) return;
      const snap = await f.get(f.ref(f.db, 'njsgames/gameRequests')); render(snap.val() || {});
    };
    firebaseTools().then(f => f && f.onValue(f.ref(f.db, 'njsgames/gameRequests'), snap => render(snap.val() || {})));
  }

  function installAdminModRequests() {
    const body = document.getElementById('nj-admin-body');
    if (!body || document.getElementById('nj-admin-other-requests')) return;
    const section = document.createElement('section');
    section.id = 'nj-admin-other-requests';
    section.style.cssText = 'margin:14px 0;padding:14px;background:#121225;border:1px solid #3b2b68;border-radius:12px;';
    section.innerHTML = '<div style="display:flex;align-items:center;gap:8px"><b style="color:#fff">📨 Other requests</b><span id="nj-mod-request-count" style="color:#a78bfa;font-size:11px"></span><button id="nj-mod-request-refresh" style="margin-left:auto;background:#2a2a4a;border:0;border-radius:6px;padding:5px 8px;color:#d1d5db;cursor:pointer">↻</button></div><div id="nj-mod-request-list" style="margin-top:10px;color:#9ca3af;font-size:12px">Loading…</div>';
    body.prepend(section);
    const render = data => {
      const list = Object.entries(data || {}).sort((a, b) => (b[1].submittedAt || 0) - (a[1].submittedAt || 0));
      section.querySelector('#nj-mod-request-count').textContent = `${list.filter(([, x]) => x.status === 'pending').length} pending`;
      section.querySelector('#nj-mod-request-list').innerHTML = list.length ? list.map(([id, x]) =>
        `<div style="border-top:1px solid #2a2a4a;padding:10px 0"><div style="color:#fff;font-weight:700">${esc(x.title || 'Untitled')} <span style="color:${x.status === 'pending' ? '#fbbf24' : '#6b7280'};font-size:10px">${esc(x.status || 'pending')}</span></div><div style="color:#c4b5fd;font-size:11px;margin-top:3px">${esc(x.type || 'Other')} · ${esc(x.priority || 'Normal')} · ${esc(x.location || 'Unknown location')}</div><div style="color:#9ca3af;font-size:11px;margin-top:3px">${esc(x.username || 'Guest')} · ${new Date(x.submittedAt || 0).toLocaleString()}</div><div style="color:#d1d5db;margin-top:5px;white-space:pre-wrap">${esc(x.details || '')}</div>${x.evidence ? `<a href="${esc(x.evidence)}" target="_self" style="color:#a78bfa;font-size:11px">Evidence link</a>` : ''}<div style="display:flex;gap:6px;margin-top:7px">${x.status === 'pending' ? `<button data-mod-action="approved" data-mod-id="${esc(id)}" style="background:#064e3b;color:#6ee7b7;border:0;border-radius:6px;padding:5px 8px;cursor:pointer">Approve</button><button data-mod-action="rejected" data-mod-id="${esc(id)}" style="background:#451a1a;color:#fca5a5;border:0;border-radius:6px;padding:5px 8px;cursor:pointer">Reject</button>` : ''}<button data-mod-action="delete" data-mod-id="${esc(id)}" style="background:#2a2a4a;color:#9ca3af;border:0;border-radius:6px;padding:5px 8px;cursor:pointer">Delete</button></div></div>`
      ).join('') : 'No other requests yet.';
      section.querySelectorAll('[data-mod-action]').forEach(btn => btn.onclick = async () => {
        const f = await firebaseTools(); if (!f) return;
        const path = `njsgames/otherRequests/${btn.dataset.modId}`;
        if (btn.dataset.modAction === 'delete') await f.remove(f.ref(f.db, path));
        else await f.update(f.ref(f.db, path), { status: btn.dataset.modAction, reviewedAt: Date.now(), reviewedBy: localStorage.getItem('nj_username') || 'Admin' });
      });
    };
    section.querySelector('#nj-mod-request-refresh').onclick = async () => {
      const f = await firebaseTools(); if (!f) return;
      const snap = await f.get(f.ref(f.db, 'njsgames/otherRequests')); render(snap.val() || {});
    };
    firebaseTools().then(f => f && f.onValue(f.ref(f.db, 'njsgames/otherRequests'), snap => render(snap.val() || {})));
  }

  function rebuildUnblockerSelect() {
    const sel = document.getElementById('nj-unblocker-site-select');
    if (!sel) return;
    if (sel.dataset.njPatched === '1') return;
    sel.innerHTML =
      '<optgroup label="Proxies">' +
      proxies.map(x => `<option value="${esc(x[1])}">${esc(x[0])}</option>`).join('') +
      '</optgroup>';
    sel.dataset.njPatched = '1';
  }

  function removeTestingHeader() {
    [...document.querySelectorAll('button')].forEach(button => {
      if ((button.textContent || '').replace(/\s+/g, ' ').trim() === '🧪 Testing Sites') {
        const group = button.parentElement;
        if (group && group.children.length === 1) group.remove();
        else button.remove();
      }
    });
  }

  function cardFor(link) {
    return link.closest('article, li, [class*="card"], [class*="Card"]') || link.parentElement;
  }

  function removePokiCatalogItems() {
    document.querySelectorAll('a[href*="pokiunblocked.gitlab.io"]').forEach(link => {
      const card = cardFor(link);
      if (card) card.remove();
    });
    [...document.querySelectorAll('button')].forEach(button => {
      if ((button.textContent || '').trim().toLowerCase() === 'poki') button.remove();
    });
  }

  function showUnblockerChooser() {
    const overlay = document.getElementById('nj-unblocker-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    const frame = document.getElementById('nj-unblocker-frame');
    if (frame) frame.style.display = 'none';
    let chooser = document.getElementById('nj-unblocker-chooser');
    if (!chooser) {
      chooser = document.createElement('div');
      chooser.id = 'nj-unblocker-chooser';
      chooser.style.cssText = 'position:absolute;inset:60px 0 0;background:#0a0a0f;z-index:2;overflow:auto;padding:24px;box-sizing:border-box;';
      overlay.appendChild(chooser);
    }
    const group = (title, icon, items) =>
      `<section style="max-width:760px;margin:0 auto 22px"><h2 style="color:#fff;font-size:18px;margin:0 0 10px">${icon} ${title}</h2>` +
      `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px">` +
      items.map(x => `<button data-unblock-url="${esc(x[1])}" style="text-align:left;background:#171727;border:1px solid #3b2b68;border-radius:12px;color:#fff;padding:14px;cursor:pointer;font-weight:700">${esc(x[0])}<div style="color:#9ca3af;font-size:11px;margin-top:5px">Open in site player</div></button>`).join('') +
      '</div></section>';
    chooser.innerHTML = '<div style="max-width:760px;margin:0 auto 22px"><h1 style="color:#fff;font-size:24px;margin:0 0 6px">🌐 Choose an unblocker</h1><p style="color:#9ca3af;margin:0">Pick a proxy or a tested game hub.</p></div>' +
      group('Proxies', '🛡️', proxies);
    chooser.querySelectorAll('[data-unblock-url]').forEach(button => {
      button.onclick = () => {
        const url = button.dataset.unblockUrl;
        if (frame) frame.style.display = 'block';
        chooser.style.display = 'none';
        const sel = document.getElementById('nj-unblocker-site-select');
        if (sel) {
          sel.value = url;
          const event = new Event('change', { bubbles: true });
          sel.dispatchEvent(event);
        } else if (typeof window.njSelectUnblocker === 'function') {
          window.njSelectUnblocker(url);
        }
      };
    });
  }

  const otherSiteSources = [
    ['StrongDog XP', 'https://mathcordxp.github.io/'],
    ['Unblocked Games 500', 'https://sites.google.com/site/unblockedgames500weeblycom/home'],
    ['Cool UGB', 'https://coolunblockedgames.github.io/'],
    ['GitHub Games', 'https://git-hub-games.github.io/'],
    ['Classroom 6x', 'https://classroom6xunblocked-games.github.io/'],
    ['Unblocked Games 76', 'https://sites.google.com/view/unblocked-game76']
  ];

  function showOtherSitesChooser() {
    if (document.getElementById('nj-other-sites-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'nj-other-sites-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10016;background:#0a0a0f;display:flex;flex-direction:column;';
    overlay.innerHTML = '<div style="background:rgba(10,10,15,.97);border-bottom:1px solid #1a1a2e;padding:12px 20px;display:flex;align-items:center;gap:14px;flex-shrink:0"><button id="nj-other-sites-close" style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:8px;color:#9ca3af;font-size:13px;font-weight:600;padding:7px 14px;cursor:pointer">← Back</button><span style="font-size:17px;font-weight:800;background:linear-gradient(135deg,#a78bfa,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent">🌐 Other Sites</span></div><div id="nj-other-sites-body" style="flex:1;overflow:auto;padding:24px"></div>';
    document.body.appendChild(overlay);
    const body = overlay.querySelector('#nj-other-sites-body');
    const renderChooser = () => {
      body.innerHTML = '<div style="max-width:900px;margin:0 auto"><h1 style="color:#fff;font-size:24px;margin:0 0 6px">🌐 Choose a game site</h1><p style="color:#9ca3af;margin:0 0 20px">Open a complete game site inside the player. Choose a site, then browse its own games.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">' +
        otherSiteSources.map((site, index) => `<button data-site-index="${index}" style="text-align:left;background:#171727;border:1px solid #3b2b68;border-radius:12px;color:#fff;padding:16px;cursor:pointer;font-weight:700;font-size:14px"><span style="font-size:20px">🎮</span> ${esc(site[0])}<div style="color:#9ca3af;font-size:11px;margin-top:7px;font-weight:400">Browse this site's full game catalog</div></button>`).join('') +
        '</div></div>';
      body.querySelectorAll('[data-site-index]').forEach(button => {
        button.onclick = () => {
          const site = otherSiteSources[Number(button.dataset.siteIndex)];
          body.innerHTML = `<div style="height:100%;display:flex;flex-direction:column;max-width:1400px;margin:0 auto"><div style="display:flex;align-items:center;gap:10px;padding:0 0 10px"><button id="nj-other-sites-list" style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:8px;color:#c4b5fd;padding:7px 12px;cursor:pointer">← Sites</button><b style="color:#fff">${esc(site[0])}</b><span style="margin-left:auto;color:#6b7280;font-size:11px">In-site player only</span></div><iframe title="${esc(site[0])}" src="${esc(site[1])}" style="flex:1;min-height:70vh;width:100%;border:1px solid #2a2a4a;border-radius:10px;background:#fff" sandbox="allow-forms allow-modals allow-pointer-lock allow-popups-to-escape-sandbox allow-scripts allow-same-origin" allowfullscreen></iframe></div>`;
          body.querySelector('#nj-other-sites-list').onclick = renderChooser;
        };
      });
    };
    overlay.querySelector('#nj-other-sites-close').onclick = () => overlay.remove();
    renderChooser();
  }

  function installOtherSitesButton() {
    if (document.getElementById('nj-other-sites-button')) return;
    const unblocker = [...document.querySelectorAll('button')].find(button =>
      (button.textContent || '').replace(/\s+/g, ' ').trim() === '🌐 Unblocker'
    );
    if (!unblocker || !unblocker.parentElement) return;
    const button = document.createElement('button');
    button.id = 'nj-other-sites-button';
    button.className = 'nj-hdr-btn';
    button.type = 'button';
    button.textContent = '🌐 Other Sites';
    button.onclick = showOtherSitesChooser;
    unblocker.parentElement.insertBefore(button, unblocker.nextSibling);
    window.njOpenOtherSites = showOtherSitesChooser;
  }

  function installQA() {
    if (typeof window.njOpenQA !== 'function') return;
    window.njOpenQA = function () {
      const defaults = window.njDefaultQA || [
        ['How do I play a game?', 'Choose a game and it will open in the site player.'],
        ['Why is a game not loading?', 'Try another game or choose a tested site in Unblocker.'],
        ['How do I earn coins?', 'Use Daily Spin, complete Challenges, and play games.']
      ];
      let qa = defaults.slice();
      const ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;z-index:10070;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;padding:16px';
      ov.innerHTML = '<div style="background:#0f0f1a;border:1px solid #7c3aed;border-radius:18px;width:min(600px,95vw);max-height:88vh;overflow:auto;padding:22px;color:#fff">' +
        '<button id="nj-qa-close" style="float:right;background:none;border:0;color:#9ca3af;font-size:22px;cursor:pointer">✕</button><h2 style="margin-top:0">❓ Questions & Answers</h2>' +
        '<div id="nj-qa-list"></div><button id="nj-qa-add" class="nj-hdr-btn" style="margin-top:14px">＋ Add Q/A</button></div>';
      document.body.appendChild(ov);
      const list = ov.querySelector('#nj-qa-list');
      const render = () => { list.innerHTML = qa.length ? qa.map(x => `<div style="padding:12px 0;border-bottom:1px solid #2a2a4a"><b>${esc(x[0])}</b><div style="color:#a1a1aa;margin-top:5px;line-height:1.5">${esc(x[1])}</div></div>`).join('') : '<div style="color:#9ca3af;padding:18px 0">No Q/A entries yet.</div>'; };
      render();
      firebaseTools().then(f => f && f.onValue(f.ref(f.db, 'njsgames/qa'), snap => {
        const shared = snap.val();
        if (Array.isArray(shared)) qa = shared;
        else if (shared && typeof shared === 'object') qa = Object.values(shared);
        render();
      }));
      ov.querySelector('#nj-qa-close').onclick = () => ov.remove();
      ov.querySelector('#nj-qa-add').onclick = async () => {
        const form = document.createElement('div');
        form.style.cssText = 'position:fixed;inset:0;z-index:10071;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:16px';
        form.innerHTML = '<div style="background:#171727;border:1px solid #7c3aed;border-radius:14px;padding:20px;width:min(420px,92vw);color:#fff"><h3 style="margin-top:0">🔐 Masterkey required</h3><input id="nj-patch-key" type="password" placeholder="Masterkey" style="width:100%;box-sizing:border-box;padding:10px;margin-bottom:8px;background:#0f0f1a;border:1px solid #3b2b68;border-radius:8px;color:#fff"><input id="nj-patch-q" placeholder="Question" style="display:none;width:100%;box-sizing:border-box;padding:10px;margin-bottom:8px;background:#0f0f1a;border:1px solid #3b2b68;border-radius:8px;color:#fff"><textarea id="nj-patch-a" placeholder="Answer" rows="4" style="display:none;width:100%;box-sizing:border-box;padding:10px;background:#0f0f1a;border:1px solid #3b2b68;border-radius:8px;color:#fff"></textarea><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button id="nj-patch-cancel">Cancel</button><button id="nj-patch-submit" class="nj-btn-confirm">Verify</button></div></div>';
        document.body.appendChild(form);
        let verified = false;
        form.querySelector('#nj-patch-cancel').onclick = () => form.remove();
        form.querySelector('#nj-patch-submit').onclick = async () => {
          if (!verified) {
            if (await sha256(form.querySelector('#nj-patch-key').value) !== masterHash) { alert('Incorrect masterkey.'); return; }
            verified = true;
            form.querySelector('#nj-patch-key').style.display = 'none';
            form.querySelector('#nj-patch-q').style.display = 'block';
            form.querySelector('#nj-patch-a').style.display = 'block';
            form.querySelector('#nj-patch-submit').textContent = 'Save';
            return;
          }
          const q = form.querySelector('#nj-patch-q').value.trim(), a = form.querySelector('#nj-patch-a').value.trim();
          if (!q || !a) return;
          qa.push([q, a]); form.remove(); render();
          try {
            const f = await firebaseTools();
            if (f) await f.set(f.ref(f.db, 'njsgames/qa'), qa);
          } catch (_) {}
        };
      };
    };
  }

  function install() {
    rebuildUnblockerSelect(); removeTestingHeader(); removePokiCatalogItems(); removePokiGameCards(); installQA();
    ensureRequestButton(); installOtherSitesButton(); installAdminRequests(); installAdminModRequests(); installPresenceObserver();
    installHealthBar();
    const health = document.getElementById('nj-site-health');
    if (health) health.remove();
    rebuildHeaderGroups(); hardenInSiteNavigation(); bypassBitlifeQuiz();
    const oldOpen = window.njOpenUnblocker;
    if (oldOpen && !window.__njChooserInstalled) {
      window.__njChooserInstalled = true;
      window.njOpenUnblocker = showUnblockerChooser;
    }
    const log = window.njSettingsTab;
    if (log && !window.__njLogInstalled) {
      window.__njLogInstalled = true;
      window.njSettingsTab = function (tab) {
        log(tab);
        if (tab !== 'log') return;
        const content = document.getElementById('nj-settings-content');
        if (content) content.innerHTML = '<h2 style="color:#fff">📋 Update Log</h2><div style="background:#0f1a0f;border:1px solid #166534;border-radius:12px;padding:14px;color:#d1d5db"><b style="color:#4ade80">Latest · 20 Aug 2026</b><h3 style="color:#fff">🛠️ Requests, activity & catalog cleanup</h3><ul><li>Added a public Request a game button that sends submissions to the admin panel.</li><li>Admin user rows now show the most accurate current feature or game activity.</li><li>Activity telemetry records unblocker selections and feature overlays as well as game iframes.</li><li>Removed the unreliable LunarV2 proxy.</li><li>Removed the non-working Poki game range from the visible catalog.</li></ul></div>';
      };
    }
  }
  install();
  new MutationObserver(install).observe(document.body, { childList: true, subtree: true });
})();