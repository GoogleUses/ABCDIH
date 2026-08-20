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
        `<div style="border-top:1px solid #2a2a4a;padding:10px 0"><div style="color:#fff;font-weight:700">${esc(x.gameName)} <span style="color:${x.status==='pending'?'#fbbf24':'#6b7280'};font-size:10px">${esc(x.status||'pending')}</span></div><div style="color:#9ca3af;font-size:11px;margin-top:3px">${esc(x.username||'Guest')} · ${new Date(x.submittedAt||0).toLocaleString()}</div>${x.url?`<a href="${esc(x.url)}" target="_blank" rel="noopener" style="color:#a78bfa;font-size:11px">${esc(x.url)}</a>`:''}${x.note?`<div style="color:#d1d5db;margin-top:4px">${esc(x.note)}</div>`:''}<div style="display:flex;gap:6px;margin-top:7px">${x.status==='pending'?`<button data-action="approved" data-id="${esc(id)}" style="background:#064e3b;color:#6ee7b7;border:0;border-radius:6px;padding:5px 8px;cursor:pointer">Approve</button><button data-action="rejected" data-id="${esc(id)}" style="background:#451a1a;color:#fca5a5;border:0;border-radius:6px;padding:5px 8px;cursor:pointer">Reject</button>`:''}<button data-action="delete" data-id="${esc(id)}" style="background:#2a2a4a;color:#9ca3af;border:0;border-radius:6px;padding:5px 8px;cursor:pointer">Delete</button></div></div>`
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

  function installQA() {
    if (typeof window.njOpenQA !== 'function') return;
    window.njOpenQA = function () {
      const defaults = window.njDefaultQA || [
        ['How do I play a game?', 'Choose a game and it will open in the site player.'],
        ['Why is a game not loading?', 'Try another game or choose a tested site in Unblocker.'],
        ['How do I earn coins?', 'Use Daily Spin, complete Challenges, and play games.']
      ];
      let qa;
      try { qa = JSON.parse(localStorage.getItem('nj_custom_qa') || 'null') || defaults.slice(); }
      catch (_) { qa = defaults.slice(); }
      const ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;z-index:10070;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;padding:16px';
      ov.innerHTML = '<div style="background:#0f0f1a;border:1px solid #7c3aed;border-radius:18px;width:min(600px,95vw);max-height:88vh;overflow:auto;padding:22px;color:#fff">' +
        '<button id="nj-qa-close" style="float:right;background:none;border:0;color:#9ca3af;font-size:22px;cursor:pointer">✕</button><h2 style="margin-top:0">❓ Questions & Answers</h2>' +
        '<div id="nj-qa-list"></div><button id="nj-qa-add" class="nj-hdr-btn" style="margin-top:14px">＋ Add Q/A</button></div>';
      document.body.appendChild(ov);
      const list = ov.querySelector('#nj-qa-list');
      const render = () => { list.innerHTML = qa.length ? qa.map(x => `<div style="padding:12px 0;border-bottom:1px solid #2a2a4a"><b>${esc(x[0])}</b><div style="color:#a1a1aa;margin-top:5px;line-height:1.5">${esc(x[1])}</div></div>`).join('') : '<div style="color:#9ca3af;padding:18px 0">No Q/A entries yet.</div>'; };
      render();
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
          qa.push([q, a]); localStorage.setItem('nj_custom_qa', JSON.stringify(qa)); form.remove(); render();
          try { if (window.njDb && window.set && window.ref) await window.set(window.ref(window.njDb, 'njsgames/qa'), qa); } catch (_) {}
        };
      };
    };
  }

  function install() {
    rebuildUnblockerSelect(); removeTestingHeader(); removePokiCatalogItems(); removePokiGameCards(); installQA();
    ensureRequestButton(); installAdminRequests(); installPresenceObserver();
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