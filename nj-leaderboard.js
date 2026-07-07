/* ════════════════════════════════════════════════════════
   NJ's Unblocked Games — Coin Leaderboard Widget
   Reads from Firebase njsgames/leaderboard (admin-set coins)
   ════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const FB_CONFIG = {
    apiKey: "AIzaSyDW9xdFdxFSjAm15f-l107fQpmZbs6_vEw",
    authDomain: "trolling-e3ed8.firebaseapp.com",
    databaseURL: "https://trolling-e3ed8-default-rtdb.firebaseio.com",
    projectId: "trolling-e3ed8",
  };

  /* ── Styles ── */
  const style = document.createElement("style");
  style.textContent = `
    #nj-lb-btn {
      position:fixed; bottom:12px; left:16px; z-index:9990;
      background:#1a1a2e; border:1px solid #fbbf24; border-radius:20px;
      padding:6px 14px; color:#fbbf24; font-size:12px; font-weight:600;
      cursor:pointer; display:flex; align-items:center; gap:5px;
      box-shadow:0 4px 16px rgba(251,191,36,0.2); font-family:'Inter',sans-serif;
      transition:all .15s;
    }
    #nj-lb-btn:hover { background:#fbbf24; color:#0f0f1a; }
    #nj-lb-overlay {
      display:none; position:fixed; inset:0; z-index:99990;
      background:rgba(0,0,0,0.8); backdrop-filter:blur(4px);
      align-items:center; justify-content:center;
      font-family:'Inter',sans-serif;
    }
    #nj-lb-overlay.open { display:flex; }
    #nj-lb-modal {
      background:#0f0f1a; border:1px solid #fbbf24; border-radius:16px;
      width:100%; max-width:440px; margin:0 16px;
      display:flex; flex-direction:column; max-height:85vh;
      box-shadow:0 0 40px rgba(251,191,36,0.2);
    }
    #nj-lb-header {
      display:flex; align-items:center; gap:10px;
      padding:14px 18px; border-bottom:1px solid #2a2a4a; flex-shrink:0;
    }
    #nj-lb-list { flex:1; overflow-y:auto; padding:12px 16px; }
    .nj-lb-row {
      display:flex; align-items:center; gap:10px;
      padding:9px 12px; border-radius:10px;
      background:#1a1a2e; border:1px solid #2a2a4a;
      margin-bottom:6px; transition:border-color .15s;
    }
    .nj-lb-row:nth-child(1) { border-color:#fbbf24; background:rgba(251,191,36,0.07); }
    .nj-lb-row:nth-child(2) { border-color:#9ca3af; background:rgba(156,163,175,0.07); }
    .nj-lb-row:nth-child(3) { border-color:#b45309; background:rgba(180,83,9,0.07); }
    .nj-lb-rank { font-size:18px; width:26px; flex-shrink:0; text-align:center; }
    .nj-lb-name { flex:1; color:#fff; font-size:13px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .nj-lb-coins { color:#fbbf24; font-size:15px; font-weight:700; flex-shrink:0; display:flex; align-items:center; gap:4px; }
    .nj-lb-empty { color:#4b5563; text-align:center; padding:40px 0; font-size:13px; }
    .nj-lb-loading { color:#6b7280; text-align:center; padding:40px 0; font-size:13px; }
    #nj-lb-myrank { padding:10px 16px; border-top:1px solid #2a2a4a; flex-shrink:0; font-size:12px; color:#6b7280; text-align:center; }
    #nj-lb-myrank span { color:#fbbf24; font-weight:700; }
  `;
  document.head.appendChild(style);

  /* ── Leaderboard button ── */
  const lbBtn = document.createElement("button");
  lbBtn.id = "nj-lb-btn";
  lbBtn.innerHTML = "🏆 Leaderboard";
  document.body.appendChild(lbBtn);

  /* ── Overlay ── */
  const lbOverlay = document.createElement("div");
  lbOverlay.id = "nj-lb-overlay";
  lbOverlay.innerHTML = `
    <div id="nj-lb-modal">
      <div id="nj-lb-header">
        <span style="font-size:22px">🏆</span>
        <div style="flex:1">
          <div style="color:#fbbf24;font-weight:700;font-size:15px">Coin Leaderboard</div>
          <div style="color:#6b7280;font-size:11px">Top coin holders — updated by admins</div>
        </div>
        <button id="nj-lb-close" style="background:none;border:none;color:#6b7280;font-size:22px;cursor:pointer;line-height:1">✕</button>
      </div>
      <div id="nj-lb-list"><div class="nj-lb-loading">Loading…</div></div>
      <div id="nj-lb-myrank">Your rank: <span id="nj-lb-my-rank-val">—</span></div>
    </div>
  `;
  document.body.appendChild(lbOverlay);

  document.getElementById("nj-lb-close").addEventListener("click", () => lbOverlay.classList.remove("open"));
  lbOverlay.addEventListener("click", e => { if (e.target === lbOverlay) lbOverlay.classList.remove("open"); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") lbOverlay.classList.remove("open"); });

  let _lbData = {};
  let _fbReady = false;

  lbBtn.addEventListener("click", async () => {
    lbOverlay.classList.add("open");
    if (!_fbReady) await initLeaderboard();
  });

  async function initLeaderboard() {
    try {
      const { initializeApp } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js");
      const { getDatabase, ref, onValue } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js");
      const app = initializeApp(FB_CONFIG, "nj_lb_instance");
      const db = getDatabase(app);
      _fbReady = true;
      onValue(ref(db, "njsgames/leaderboard"), snap => {
        _lbData = snap.val() || {};
        renderLeaderboard();
      });
    } catch (e) {
      document.getElementById("nj-lb-list").innerHTML = `<div class="nj-lb-empty">⚠️ Could not load leaderboard</div>`;
    }
  }

  function renderLeaderboard() {
    const list = document.getElementById("nj-lb-list");
    const myName = localStorage.getItem("nj_username") || "";
    const entries = Object.entries(_lbData).sort((a, b) => (b[1].coins || 0) - (a[1].coins || 0));

    if (!entries.length) {
      list.innerHTML = `<div class="nj-lb-empty">No entries yet — ask an admin to add coins!</div>`;
      document.getElementById("nj-lb-my-rank-val").textContent = "—";
      return;
    }

    const medals = ["🥇", "🥈", "🥉"];
    list.innerHTML = entries.map(([key, e], i) => {
      const isMe = myName && (e.username || "").toLowerCase() === myName.toLowerCase();
      return `
        <div class="nj-lb-row" ${isMe ? 'style="border-color:#7c3aed;background:rgba(124,58,237,0.1)"' : ''}>
          <div class="nj-lb-rank">${medals[i] || `${i + 1}`}</div>
          <div class="nj-lb-name">${esc(e.username || key)} ${isMe ? '<span style="color:#7c3aed;font-size:10px">(you)</span>' : ''}</div>
          <div class="nj-lb-coins">💰 ${Number.isFinite(e.coins) ? e.coins.toLocaleString() : '0'}</div>
        </div>`;
    }).join("");

    const myRank = entries.findIndex(([, e]) => myName && (e.username || "").toLowerCase() === myName.toLowerCase());
    document.getElementById("nj-lb-my-rank-val").textContent = myRank >= 0 ? `#${myRank + 1}` : "Not ranked";
  }

  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

})();
