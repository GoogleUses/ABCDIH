
(function () {
  'use strict';

  
  const FB_CONFIG = {
    apiKey: "AIzaSyDW9xdFdxFSjAm15f-l107fQpmZbs6_vEw",
    authDomain: "trolling-e3ed8.firebaseapp.com",
    databaseURL: "https://trolling-e3ed8-default-rtdb.firebaseio.com",
    projectId: "trolling-e3ed8",
    storageBucket: "trolling-e3ed8.appspot.com",
    messagingSenderId: "299260439019",
    appId: "1:299260439019:web:9dedc986334a871e1d51ae"
  };
  const MASTER = atob("aW1oaW0=");

  let db = null;
  let _fbRef, _fbSet, _fbRemove, _fbPush, _fbGet, _fbOnValue;

  async function initFirebase() {
    if (db) return;
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js");
    const { getDatabase, ref, set, remove, push, get, onValue } =
      await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js");
    const app = initializeApp(FB_CONFIG, "nj_admin_ext");
    db = getDatabase(app);
    _fbRef = (path) => ref(db, path);
    _fbSet = set; _fbRemove = remove; _fbPush = push; _fbGet = get; _fbOnValue = onValue;
  }

  function fk(u) { return u.toLowerCase().replace(/[^a-z0-9_\-]/g, "_").slice(0, 30); }
  function esc(t) { return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  function fmt(ts) { return ts ? new Date(ts).toLocaleString() : "-"; }

  
  const style = document.createElement("style");
  style.textContent = `
    #nj-ext-btn {
      position:fixed; bottom:60px; left:16px; z-index:9990;
      background:#7c3aed; border:none; border-radius:20px;
      padding:8px 14px; color:#fff; font-size:13px; font-weight:600;
      cursor:pointer; display:flex; align-items:center; gap:6px;
      box-shadow:0 4px 20px rgba(124,58,237,0.5); font-family:'Inter',sans-serif;
      transition:transform .15s;
    }
    #nj-ext-btn:hover { transform:scale(1.05); }
    #nj-ext-overlay {
      display:none; position:fixed; inset:0; z-index:99999;
      background:rgba(0,0,0,0.85); backdrop-filter:blur(4px);
      align-items:center; justify-content:center;
      font-family:'Inter',sans-serif;
    }
    #nj-ext-overlay.open { display:flex; }
    #nj-ext-modal {
      background:#0f0f1a; border:1px solid #7c3aed; border-radius:16px;
      width:100%; max-width:820px; margin:0 16px;
      display:flex; flex-direction:column; max-height:92vh;
      box-shadow:0 0 60px rgba(124,58,237,0.3);
    }
    #nj-ext-header {
      display:flex; align-items:center; gap:12px;
      padding:14px 20px; border-bottom:1px solid #2a2a4a; flex-shrink:0;
    }
    #nj-ext-tabs {
      display:flex; gap:4px; padding:10px 20px 0; border-bottom:1px solid #2a2a4a; flex-shrink:0;
    }
    .nj-ext-tab {
      padding:8px 16px; border-radius:8px 8px 0 0; border:none;
      background:#1a1a2e; color:#6b7280; font-size:13px; font-weight:600;
      cursor:pointer; transition:all .15s;
    }
    .nj-ext-tab.active { background:#7c3aed; color:#fff; }
    .nj-ext-tab:hover:not(.active) { color:#c4b5fd; }
    #nj-ext-body { flex:1; overflow-y:auto; padding:16px 20px; }
    .nj-ext-input {
      background:#1a1a2e; border:1px solid #2a2a4a; border-radius:8px;
      padding:8px 12px; color:#fff; font-size:13px; outline:none;
      font-family:'Inter',sans-serif;
    }
    .nj-ext-input:focus { border-color:#7c3aed; }
    .nj-ext-btn-primary {
      background:#7c3aed; border:none; border-radius:8px;
      padding:7px 14px; color:#fff; font-size:12px; font-weight:600;
      cursor:pointer; white-space:nowrap;
    }
    .nj-ext-btn-primary:hover { opacity:.85; }
    .nj-ext-btn-warn {
      background:#b45309; border:none; border-radius:8px;
      padding:5px 10px; color:#fff; font-size:11px; font-weight:600;
      cursor:pointer;
    }
    .nj-ext-btn-danger {
      background:#991b1b; border:none; border-radius:8px;
      padding:5px 10px; color:#fff; font-size:11px; font-weight:600;
      cursor:pointer;
    }
    .nj-ext-btn-mute {
      background:#1d4ed8; border:none; border-radius:8px;
      padding:5px 10px; color:#fff; font-size:11px; font-weight:600;
      cursor:pointer;
    }
    .nj-ext-btn-dismiss {
      background:#374151; border:none; border-radius:8px;
      padding:5px 10px; color:#9ca3af; font-size:11px; font-weight:600;
      cursor:pointer;
    }
    .nj-ext-user-row, .nj-ext-report-row, .nj-ext-lb-row {
      display:flex; align-items:center; gap:10px;
      padding:10px; border-radius:10px; background:#1a1a2e;
      border:1px solid #2a2a4a; margin-bottom:6px;
    }
    .nj-ext-label { color:#a78bfa; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; }
    .nj-ext-name { color:#fff; font-size:13px; font-weight:600; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .nj-ext-meta { color:#6b7280; font-size:11px; }
    .nj-ext-actions { display:flex; gap:5px; flex-shrink:0; flex-wrap:wrap; }
    .nj-ext-section-title { color:#c4b5fd; font-size:12px; font-weight:700; margin:0 0 8px; text-transform:uppercase; letter-spacing:.8px; }
    .nj-ext-empty { color:#4b5563; font-size:13px; text-align:center; padding:32px 0; }
    .nj-ext-toast {
      position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
      background:#0f1f0f; border:1px solid #22c55e; border-radius:10px;
      padding:10px 16px; color:#e5e7eb; font-size:13px;
      box-shadow:0 8px 24px rgba(0,0,0,.5); z-index:999999;
      font-family:'Inter',sans-serif; pointer-events:none;
      animation:njext-fadein .2s ease;
    }
    @keyframes njext-fadein { from{opacity:0;transform:translateX(-50%) translateY(8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
    .nj-ext-badge-online { display:inline-block; width:8px; height:8px; border-radius:50%; background:#22c55e; margin-right:5px; }
    .nj-ext-badge-offline { display:inline-block; width:8px; height:8px; border-radius:50%; background:#6b7280; margin-right:5px; }
    .nj-ext-badge-banned { display:inline-block; padding:1px 6px; border-radius:4px; background:#7f1d1d; color:#fca5a5; font-size:10px; font-weight:700; margin-left:4px; }
    .nj-ext-badge-muted { display:inline-block; padding:1px 6px; border-radius:4px; background:#1e3a5f; color:#93c5fd; font-size:10px; font-weight:700; margin-left:4px; }
    #nj-ext-auth { padding:32px 20px; text-align:center; }
    #nj-ext-auth h3 { color:#fff; margin-bottom:12px; }
    #nj-ext-auth p { color:#6b7280; font-size:13px; margin-bottom:16px; }
    .nj-ext-coin-input { width:80px; background:#0f0f1a; border:1px solid #3a3a5a; border-radius:6px; padding:4px 8px; color:#fbbf24; font-size:13px; font-weight:700; text-align:center; outline:none; }
  `;
  document.head.appendChild(style);

  
  const btn = document.createElement("button");
  btn.id = "nj-ext-btn";
  btn.innerHTML = "🛡️ Admin";
  document.body.appendChild(btn);

  
  const overlay = document.createElement("div");
  overlay.id = "nj-ext-overlay";
  overlay.innerHTML = `
    <div id="nj-ext-modal">
      <div id="nj-ext-header">
        <span style="font-size:22px">🛡️</span>
        <div style="flex:1">
          <div style="color:#fff;font-weight:700;font-size:15px">Site Admin Panel</div>
          <div style="color:#6b7280;font-size:11px">Firebase-connected — full user & report management</div>
        </div>
        <button id="nj-ext-close" style="background:none;border:none;color:#6b7280;font-size:22px;cursor:pointer;line-height:1">✕</button>
      </div>
      <div id="nj-ext-auth" style="display:none">
        <h3>🔐 Master Key Required</h3>
        <p>Enter the master key to access the admin panel.</p>
        <div style="display:flex;gap:8px;justify-content:center">
          <input id="nj-ext-key-input" type="password" class="nj-ext-input" placeholder="Master key..." style="width:200px"/>
          <button class="nj-ext-btn-primary" id="nj-ext-key-submit">Unlock</button>
        </div>
        <div id="nj-ext-key-err" style="color:#f87171;font-size:12px;margin-top:8px"></div>
      </div>
      <div id="nj-ext-panel" style="display:none;flex:1;overflow:hidden;flex-direction:column">
        <div id="nj-ext-tabs">
          <button class="nj-ext-tab active" data-tab="users">👥 Users</button>
          <button class="nj-ext-tab" data-tab="reports">🚩 Reports</button>
          <button class="nj-ext-tab" data-tab="leaderboard">🏆 Leaderboard</button>
        </div>
        <div id="nj-ext-body">
          <!-- Content injected by JS -->
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  
  let _unlocked = false;
  let _activeTab = "users";
  let _onlineUsers = {};
  let _bans = {};
  let _reports = {};
  let _leaderboard = {};
  let _toastTimer = null;
  let _unsubscribers = [];

  function toast(msg, isError) {
    let el = document.getElementById("nj-ext-toast-el");
    if (!el) { el = document.createElement("div"); el.id = "nj-ext-toast-el"; document.body.appendChild(el); }
    el.className = "nj-ext-toast";
    el.style.background = isError ? "#1f0000" : "#0f1f0f";
    el.style.borderColor = isError ? "#dc2626" : "#22c55e";
    el.textContent = msg;
    el.style.display = "block";
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => { el.style.display = "none"; }, 3000);
  }

  
  btn.addEventListener("click", () => {
    overlay.classList.add("open");
    if (_unlocked) {
      showPanel();
    } else {
      document.getElementById("nj-ext-auth").style.display = "block";
      document.getElementById("nj-ext-panel").style.display = "none";
      setTimeout(() => document.getElementById("nj-ext-key-input")?.focus(), 50);
    }
  });

  document.getElementById("nj-ext-close").addEventListener("click", closePanel);
  overlay.addEventListener("click", e => { if (e.target === overlay) closePanel(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && overlay.classList.contains("open")) closePanel(); });

  function closePanel() {
    overlay.classList.remove("open");
  }

  
  document.getElementById("nj-ext-key-submit").addEventListener("click", handleAuth);
  document.getElementById("nj-ext-key-input").addEventListener("keydown", e => { if (e.key === "Enter") handleAuth(); });

  async function handleAuth() {
    const key = document.getElementById("nj-ext-key-input").value;
    if (key !== MASTER) {
      document.getElementById("nj-ext-key-err").textContent = "Wrong master key.";
      return;
    }
    document.getElementById("nj-ext-key-err").textContent = "";
    _unlocked = true;
    await initFirebase();
    subscribeToData();
    showPanel();
  }

  function showPanel() {
    document.getElementById("nj-ext-auth").style.display = "none";
    document.getElementById("nj-ext-panel").style.display = "flex";
    renderTab(_activeTab);
  }

  
  document.querySelectorAll(".nj-ext-tab").forEach(t => {
    t.addEventListener("click", () => {
      document.querySelectorAll(".nj-ext-tab").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      _activeTab = t.dataset.tab;
      renderTab(_activeTab);
    });
  });

  
  function subscribeToData() {

    _unsubscribers.push(
      _fbOnValue(_fbRef("njsgames/presence"), snap => {
        _onlineUsers = snap.val() || {};
        if (_activeTab === "users") renderTab("users");
      })
    );

    _unsubscribers.push(
      _fbOnValue(_fbRef("njsgames/bans"), snap => {
        _bans = snap.val() || {};
        if (_activeTab === "users") renderTab("users");
      })
    );

    _unsubscribers.push(
      _fbOnValue(_fbRef("njsgames/reports"), snap => {
        _reports = snap.val() || {};
        if (_activeTab === "reports") renderTab("reports");
      })
    );

    _unsubscribers.push(
      _fbOnValue(_fbRef("njsgames/leaderboard"), snap => {
        _leaderboard = snap.val() || {};
        if (_activeTab === "leaderboard") renderTab("leaderboard");
      })
    );
  }

  
  function renderTab(tab) {
    const body = document.getElementById("nj-ext-body");
    if (tab === "users") renderUsers(body);
    else if (tab === "reports") renderReports(body);
    else if (tab === "leaderboard") renderLeaderboard(body);
  }

  
  function renderUsers(body) {
    const onlineEntries = Object.entries(_onlineUsers);
    const banEntries = Object.entries(_bans);

    let html = `
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <input id="nj-ext-user-search" class="nj-ext-input" style="flex:1" placeholder="Search username (online or offline)…"/>
        <button class="nj-ext-btn-primary" id="nj-ext-user-search-btn">Find / Add</button>
      </div>
    `;


    html += `<div class="nj-ext-section-title">🟢 Online Users (${onlineEntries.length})</div>`;
    if (!onlineEntries.length) {
      html += `<div class="nj-ext-empty">No users online right now</div>`;
    } else {
      onlineEntries.forEach(([sessId, u]) => {
        const username = u.display || u.username || sessId;
        const banKey = fk(username);
        const isBanned = !!_bans[banKey];
        html += `
          <div class="nj-ext-user-row">
            <span class="nj-ext-badge-online"></span>
            <div class="nj-ext-name">${esc(username)} ${isBanned ? '<span class="nj-ext-badge-banned">BANNED</span>' : ''}</div>
            <div class="nj-ext-meta">${esc(sessId.slice(0,12))}…</div>
            <div class="nj-ext-actions">
              <select class="nj-ext-input" id="mute-dur-${esc(sessId)}" style="padding:4px 6px;font-size:11px">
                <option value="300">5 min</option>
                <option value="1800">30 min</option>
                <option value="3600">1 hr</option>
                <option value="86400">24 hr</option>
                <option value="604800">7 days</option>
              </select>
              <button class="nj-ext-btn-mute" data-action="mute" data-sess="${esc(sessId)}" data-name="${esc(username)}">🔇 Mute</button>
              <button class="nj-ext-btn-warn" data-action="kick" data-sess="${esc(sessId)}" data-name="${esc(username)}">👢 Kick</button>
              <button class="nj-ext-btn-danger" data-action="ban" data-sess="${esc(sessId)}" data-name="${esc(username)}">🚫 Ban</button>
            </div>
          </div>`;
      });
    }


    if (banEntries.length) {
      html += `<div class="nj-ext-section-title" style="margin-top:16px">🚫 Banned Users (${banEntries.length})</div>`;
      banEntries.forEach(([key, ban]) => {
        html += `
          <div class="nj-ext-user-row">
            <span class="nj-ext-badge-offline"></span>
            <div class="nj-ext-name">${esc(ban.username || key)} <span class="nj-ext-badge-banned">BANNED</span></div>
            <div class="nj-ext-meta">${esc(ban.reason || '')} — ${fmt(ban.ts)}</div>
            <div class="nj-ext-actions">
              <button class="nj-ext-btn-primary" data-action="unban" data-key="${esc(key)}" data-name="${esc(ban.username || key)}">✅ Unban</button>
            </div>
          </div>`;
      });
    }

    body.innerHTML = html;


    document.getElementById("nj-ext-user-search-btn").addEventListener("click", () => {
      const v = document.getElementById("nj-ext-user-search").value.trim();
      if (!v) return;
      showOfflineUserActions(v, body);
    });
    document.getElementById("nj-ext-user-search").addEventListener("keydown", e => {
      if (e.key === "Enter") document.getElementById("nj-ext-user-search-btn").click();
    });


    body.querySelectorAll("[data-action]").forEach(el => {
      el.addEventListener("click", () => handleUserAction(el));
    });
  }

  function showOfflineUserActions(username, body) {

    document.getElementById("nj-ext-offline-panel")?.remove();
    const banKey = fk(username);
    const isBanned = !!_bans[banKey];
    const panel = document.createElement("div");
    panel.id = "nj-ext-offline-panel";
    panel.className = "nj-ext-user-row";
    panel.style.cssText = "border-color:#7c3aed;background:#12122a;margin-top:10px;flex-wrap:wrap;gap:8px";
    panel.innerHTML = `
      <div style="width:100%;color:#c4b5fd;font-size:12px;font-weight:700">Offline / Manual: <span style="color:#fff">${esc(username)}</span> ${isBanned ? '<span class="nj-ext-badge-banned">BANNED</span>' : ''}</div>
      <select class="nj-ext-input" id="nj-ext-offline-dur" style="padding:4px 6px;font-size:11px">
        <option value="300">5 min</option><option value="1800">30 min</option>
        <option value="3600">1 hr</option><option value="86400">24 hr</option><option value="604800">7 days</option>
      </select>
      <button class="nj-ext-btn-mute" data-action="offline-mute" data-name="${esc(username)}">🔇 Mute (next login)</button>
      <button class="nj-ext-btn-warn" data-action="offline-kick" data-name="${esc(username)}">👢 Kick (if online)</button>
      ${isBanned
        ? `<button class="nj-ext-btn-primary" data-action="unban" data-key="${esc(banKey)}" data-name="${esc(username)}">✅ Unban</button>`
        : `<button class="nj-ext-btn-danger" data-action="offline-ban" data-name="${esc(username)}">🚫 Ban</button>`}
      <button class="nj-ext-btn-dismiss" onclick="document.getElementById('nj-ext-offline-panel').remove()">✕</button>
    `;
    body.insertBefore(panel, body.firstChild);
    panel.querySelectorAll("[data-action]").forEach(el => el.addEventListener("click", () => handleUserAction(el)));
  }

  async function handleUserAction(el) {
    const action = el.dataset.action;
    const sessId = el.dataset.sess;
    const username = el.dataset.name;
    const banKey = el.dataset.key || (username ? fk(username) : null);

    if (action === "mute") {
      const dur = parseInt(document.getElementById(`mute-dur-${sessId}`)?.value || "300");
      const expiresAt = Date.now() + dur * 1000;
      await _fbSet(_fbRef(`njsgames/commands/${sessId}`), { type: "mute", expiresAt, ts: Date.now() });

      if (username) await _fbSet(_fbRef(`njsgames/mutes/${fk(username)}`), { username, expiresAt, ts: Date.now() });
      toast(`🔇 Muted ${username} for ${dur}s`);
    } else if (action === "kick") {
      await _fbSet(_fbRef(`njsgames/commands/${sessId}`), { type: "kick", ts: Date.now() });
      toast(`👢 Kicked ${username}`);
    } else if (action === "ban") {
      const reason = prompt(`Ban reason for ${username} (optional):`) || "";
      await _fbSet(_fbRef(`njsgames/bans/${fk(username)}`), { username, reason, ts: Date.now(), bannedBy: "admin" });

      await _fbSet(_fbRef(`njsgames/commands/${sessId}`), { type: "ban", ts: Date.now() });
      toast(`🚫 Banned ${username}`);
    } else if (action === "unban") {
      await _fbRemove(_fbRef(`njsgames/bans/${banKey}`));
      toast(`✅ Unbanned ${username || banKey}`);
    } else if (action === "offline-mute") {
      const dur = parseInt(document.getElementById("nj-ext-offline-dur")?.value || "300");
      const expiresAt = Date.now() + dur * 1000;

      const snap = await _fbGet(_fbRef(`njsgames/usernames/${fk(username)}`));
      if (snap.exists() && snap.val().sessionId) {
        await _fbSet(_fbRef(`njsgames/commands/${snap.val().sessionId}`), { type: "mute", expiresAt, ts: Date.now() });
      }
      await _fbSet(_fbRef(`njsgames/mutes/${fk(username)}`), { username, expiresAt, ts: Date.now() });
      toast(`🔇 Queued mute for ${username} (${dur}s)`);
    } else if (action === "offline-kick") {
      const snap = await _fbGet(_fbRef(`njsgames/usernames/${fk(username)}`));
      if (snap.exists() && snap.val().sessionId) {
        await _fbSet(_fbRef(`njsgames/commands/${snap.val().sessionId}`), { type: "kick", ts: Date.now() });
        toast(`👢 Kicked ${username}`);
      } else {
        toast(`⚠️ ${username} is not currently online`, true);
      }
      document.getElementById("nj-ext-offline-panel")?.remove();
    } else if (action === "offline-ban") {
      const reason = prompt(`Ban reason for ${username} (optional):`) || "";
      await _fbSet(_fbRef(`njsgames/bans/${fk(username)}`), { username, reason, ts: Date.now(), bannedBy: "admin" });

      const snap = await _fbGet(_fbRef(`njsgames/usernames/${fk(username)}`));
      if (snap.exists() && snap.val().sessionId) {
        await _fbSet(_fbRef(`njsgames/commands/${snap.val().sessionId}`), { type: "ban", ts: Date.now() });
      }
      toast(`🚫 Banned ${username}`);
      document.getElementById("nj-ext-offline-panel")?.remove();
    }
  }

  
  function renderReports(body) {
    const entries = Object.entries(_reports).sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0));
    if (!entries.length) {
      body.innerHTML = `<div class="nj-ext-empty">📭 No reports yet</div>`;
      return;
    }
    let html = `<div class="nj-ext-section-title">🚩 Reports (${entries.length})</div>`;
    entries.forEach(([key, r]) => {
      const author = r.reportedUser || r.author || "Unknown";
      const reporter = r.reporter || r.reportedBy || "Anonymous";
      html += `
        <div class="nj-ext-report-row" id="report-row-${esc(key)}">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <span style="color:#f87171;font-weight:700;font-size:12px">🚩 ${esc(author)}</span>
              <span style="color:#6b7280;font-size:10px">reported by ${esc(reporter)}</span>
              <span style="color:#4b5563;font-size:10px">• ${fmt(r.ts)}</span>
            </div>
            <div style="background:#0f0f1a;border:1px solid #2a2a4a;border-radius:6px;padding:6px 8px;font-size:12px;color:#d1d5db;max-height:60px;overflow-y:auto;">${esc(r.text || r.message || "")}</div>
          </div>
          <div class="nj-ext-actions" style="flex-direction:column;align-items:flex-end">
            <div style="display:flex;gap:4px;margin-bottom:4px">
              <select class="nj-ext-input" id="rpt-dur-${esc(key)}" style="padding:3px 6px;font-size:10px">
                <option value="300">5m</option><option value="1800">30m</option>
                <option value="3600">1h</option><option value="86400">24h</option>
              </select>
              <button class="nj-ext-btn-mute" data-action="rpt-mute" data-key="${esc(key)}" data-name="${esc(author)}">🔇</button>
              <button class="nj-ext-btn-danger" data-action="rpt-ban" data-key="${esc(key)}" data-name="${esc(author)}">🚫</button>
              <button class="nj-ext-btn-warn" data-action="rpt-kick" data-key="${esc(key)}" data-name="${esc(author)}">👢</button>
            </div>
            <button class="nj-ext-btn-dismiss" data-action="rpt-dismiss" data-key="${esc(key)}">✓ Dismiss</button>
          </div>
        </div>`;
    });
    body.innerHTML = html;

    body.querySelectorAll("[data-action]").forEach(el => {
      el.addEventListener("click", () => handleReportAction(el));
    });
  }

  async function handleReportAction(el) {
    const action = el.dataset.action;
    const key = el.dataset.key;
    const username = el.dataset.name;

    if (action === "rpt-dismiss") {
      await _fbRemove(_fbRef(`njsgames/reports/${key}`));
      document.getElementById(`report-row-${key}`)?.remove();
      toast("✓ Report dismissed");
      return;
    }

    if (action === "rpt-mute") {
      const dur = parseInt(document.getElementById(`rpt-dur-${key}`)?.value || "300");
      const expiresAt = Date.now() + dur * 1000;

      const snap = await _fbGet(_fbRef(`njsgames/usernames/${fk(username)}`));
      if (snap.exists() && snap.val().sessionId) {
        await _fbSet(_fbRef(`njsgames/commands/${snap.val().sessionId}`), { type: "mute", expiresAt, ts: Date.now() });
      }
      await _fbSet(_fbRef(`njsgames/mutes/${fk(username)}`), { username, expiresAt, ts: Date.now() });
      await _fbRemove(_fbRef(`njsgames/reports/${key}`));
      document.getElementById(`report-row-${key}`)?.remove();
      toast(`🔇 Muted ${username}`);
    } else if (action === "rpt-ban") {
      await _fbSet(_fbRef(`njsgames/bans/${fk(username)}`), { username, reason: "Reported user", ts: Date.now(), bannedBy: "admin" });
      const snap = await _fbGet(_fbRef(`njsgames/usernames/${fk(username)}`));
      if (snap.exists() && snap.val().sessionId) {
        await _fbSet(_fbRef(`njsgames/commands/${snap.val().sessionId}`), { type: "ban", ts: Date.now() });
      }
      await _fbRemove(_fbRef(`njsgames/reports/${key}`));
      document.getElementById(`report-row-${key}`)?.remove();
      toast(`🚫 Banned ${username}`);
    } else if (action === "rpt-kick") {
      const snap = await _fbGet(_fbRef(`njsgames/usernames/${fk(username)}`));
      if (snap.exists() && snap.val().sessionId) {
        await _fbSet(_fbRef(`njsgames/commands/${snap.val().sessionId}`), { type: "kick", ts: Date.now() });
        toast(`👢 Kicked ${username}`);
      } else {
        toast(`⚠️ ${username} is not online`, true);
      }
      await _fbRemove(_fbRef(`njsgames/reports/${key}`));
      document.getElementById(`report-row-${key}`)?.remove();
    }
  }

  
  function renderLeaderboard(body) {
    const entries = Object.entries(_leaderboard).sort((a, b) => (b[1].coins || 0) - (a[1].coins || 0));

    let html = `
      <div style="margin-bottom:12px;padding:10px;background:#1a1a2e;border:1px solid #fbbf24;border-radius:10px">
        <div style="color:#fbbf24;font-size:12px;font-weight:700;margin-bottom:8px">➕ Add / Update User Coins</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <input id="nj-lb-user" class="nj-ext-input" placeholder="Username…" style="flex:1;min-width:120px"/>
          <input id="nj-lb-coins" class="nj-ext-input nj-ext-coin-input" type="number" placeholder="Coins" min="0"/>
          <button class="nj-ext-btn-primary" id="nj-lb-set-btn">💰 Set</button>
        </div>
      </div>
      <div class="nj-ext-section-title">🏆 Coin Leaderboard (${entries.length} users)</div>
    `;

    if (!entries.length) {
      html += `<div class="nj-ext-empty">No leaderboard data yet — add users above</div>`;
    } else {
      entries.forEach(([key, entry], i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
        html += `
          <div class="nj-ext-lb-row">
            <span style="font-size:16px;width:28px;flex-shrink:0">${medal}</span>
            <div class="nj-ext-name">${esc(entry.username || key)}</div>
            <input class="nj-ext-input nj-ext-coin-input" type="number" value="${entry.coins || 0}" data-action="lb-edit" data-key="${esc(key)}" data-name="${esc(entry.username || key)}" min="0"/>
            <button class="nj-ext-btn-primary" data-action="lb-save" data-key="${esc(key)}" data-name="${esc(entry.username || key)}">💾</button>
            <button class="nj-ext-btn-danger" data-action="lb-delete" data-key="${esc(key)}">✕</button>
          </div>`;
      });
    }

    body.innerHTML = html;

    document.getElementById("nj-lb-set-btn").addEventListener("click", async () => {
      const user = document.getElementById("nj-lb-user").value.trim();
      const coins = parseInt(document.getElementById("nj-lb-coins").value || "0");
      if (!user) { toast("Enter a username", true); return; }
      const key = fk(user);
      await _fbSet(_fbRef(`njsgames/leaderboard/${key}`), { username: user, coins, ts: Date.now() });
      document.getElementById("nj-lb-user").value = "";
      document.getElementById("nj-lb-coins").value = "";
      toast(`💰 Set ${user}: ${coins} coins`);
    });

    body.querySelectorAll("[data-action]").forEach(el => {
      el.addEventListener("click", async () => {
        const action = el.dataset.action;
        const key = el.dataset.key;
        const name = el.dataset.name;
        if (action === "lb-save") {
          const inp = body.querySelector(`[data-action="lb-edit"][data-key="${key}"]`);
          const coins = parseInt(inp?.value || "0");
          await _fbSet(_fbRef(`njsgames/leaderboard/${key}`), { username: name, coins, ts: Date.now() });
          toast(`💰 Updated ${name}: ${coins} coins`);
        } else if (action === "lb-delete") {
          await _fbRemove(_fbRef(`njsgames/leaderboard/${key}`));
          toast(`✕ Removed ${name}`);
        }
      });
    });
  }

  

  window.njReportMessage = async function (author, text, ts) {
    if (!db) await initFirebase().catch(() => {});
    if (!db) return;
    const key = "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    await _fbPush(_fbRef("njsgames/reports"), {
      reportedUser: author,
      text: text || "",
      ts: ts || Date.now(),
      reporter: "chat_user"
    }).catch(() => {});
  };

})();
