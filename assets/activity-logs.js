/*
 * NJsGames activity telemetry
 *
 * This file deliberately keeps activity records separate from the existing
 * moderation log.  It records sessions, not message contents or passwords:
 *   njsgames/otherlogs
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  update,
  get,
  onValue,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const FIREBASE_CONFIG = {
  apiKey: atob("QUl6YVN5RFc5eGRGZHhGU2pBbTE1Zi1sMTA3ZlFwbVpiczZfdkV3"),
  authDomain: "trolling-e3ed8.firebaseapp.com",
  databaseURL: "https://trolling-e3ed8-default-rtdb.firebaseio.com",
  projectId: "trolling-e3ed8",
  storageBucket: "trolling-e3ed8.appspot.com",
  messagingSenderId: "299260439019",
  appId: "1:299260439019:web:9dedc986334a871e1d51ae",
};

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));

const getUsername = () =>
  localStorage.getItem("nj_username") ||
  window._njUsername ||
  "Unknown";

const getSessionId = () =>
  sessionStorage.getItem("nj_sess") ||
  sessionStorage.getItem("nj_sess_id") ||
  "unknown-session";

const dateText = (timestamp) =>
  timestamp ? new Date(Number(timestamp)).toLocaleString() : "—";

const durationText = (milliseconds) => {
  const seconds = Math.max(0, Math.floor(Number(milliseconds || 0) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
};

function getDatabaseInstance() {
  if (window.njDb) return window.njDb;
  try {
    return getDatabase(initializeApp(FIREBASE_CONFIG, "nj_activity_logs"));
  } catch (error) {
    return null;
  }
}

async function waitForDatabase(timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const database = getDatabaseInstance();
    if (database) return database;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return null;
}

function visibleGameFrame() {
  const frames = [...document.querySelectorAll("iframe")];
  const frame = frames.find((candidate) => {
    const title = (candidate.getAttribute("title") || "").trim();
    const source = candidate.getAttribute("src") || "";
    if (!title || /chat|ai chat/i.test(title)) return false;
    if (/chat/i.test(source)) return false;
    const style = getComputedStyle(candidate);
    return style.display !== "none" && style.visibility !== "hidden";
  });
  if (!frame) return null;
  return {
    name: (frame.getAttribute("title") || "Game").trim(),
    url: frame.getAttribute("src") || "",
  };
}

async function startTelemetry() {
  const db = await waitForDatabase();
  if (!db) return;

  let activeGame = null;
  let gameLogKey = null;
  let lastGameSignature = "";

  async function finishGame(endedAt = Date.now()) {
    if (!activeGame || !gameLogKey) return;
    const durationMs = Math.max(0, endedAt - activeGame.startedAt);
    await update(ref(db, `njsgames/otherlogs/${gameLogKey}`), {
      status: "completed",
      endedAt,
      durationMs,
      lastSeen: endedAt,
    }).catch(() => {});
    activeGame = null;
    gameLogKey = null;
    sessionStorage.removeItem("nj_active_game_log");
  }

  async function inspectGame() {
    const game = visibleGameFrame();
    const signature = game ? `${game.name}|${game.url}` : "";
    if (signature === lastGameSignature) {
      if (activeGame && gameLogKey) {
        update(ref(db, `njsgames/otherlogs/${gameLogKey}`), {
          lastSeen: Date.now(),
          durationMs: Math.max(0, Date.now() - activeGame.startedAt),
        }).catch(() => {});
      }
      return;
    }

    lastGameSignature = signature;
    if (activeGame) await finishGame();
    if (!game || getUsername() === "Unknown") return;

    const startedAt = Date.now();
    const record = {
      type: "game_session",
      username: getUsername(),
      sessionId: getSessionId(),
      gameName: game.name,
      gameUrl: game.url,
      startedAt,
      lastSeen: startedAt,
      status: "active",
    };
    const logRef = push(ref(db, "njsgames/otherlogs"));
    gameLogKey = logRef.key;
    activeGame = { startedAt, game };
    sessionStorage.setItem("nj_active_game_log", gameLogKey);
    await set(logRef, record).catch(() => {});
  }

  window.njLogTradeEvent = async function logTradeEvent(action, data = {}) {
    const normalizedAction = String(action || "").toLowerCase();
    const type = normalizedAction === "buy" || normalizedAction === "purchase"
      ? "trade_buy"
      : "trade_list";
    const payload = {
      type,
      username: getUsername(),
      sessionId: getSessionId(),
      createdAt: Date.now(),
      data: {
        itemName: data.itemName || data.item || data.name || "Unknown item",
        quantity: Number(data.quantity || data.amount || 1),
        price: Number(data.price || data.cost || 0),
        seller: data.seller || "",
        buyer: data.buyer || (type === "trade_buy" ? getUsername() : ""),
        listingId: data.listingId || data.id || "",
      },
    };
    const logRef = push(ref(db, "njsgames/otherlogs"));
    await set(logRef, payload).catch(() => {});
    return logRef.key;
  };

  // A future trading-plaza build can dispatch this without needing to know
  // anything about Firebase.  It also makes the hook useful to embedded
  // trading pages that are added later.
  window.addEventListener("nj-trade-event", (event) => {
    const detail = event.detail || {};
    window.njLogTradeEvent(detail.action, detail);
  });

  const observer = new MutationObserver(() => inspectGame());
  observer.observe(document.body, { childList: true, subtree: true });
  await inspectGame();
  window.setInterval(inspectGame, 30000);
  window.addEventListener("pagehide", () => {
    if (activeGame && gameLogKey) {
      const endedAt = Date.now();
      update(ref(db, `njsgames/otherlogs/${gameLogKey}`), {
        status: "completed",
        endedAt,
        durationMs: Math.max(0, endedAt - activeGame.startedAt),
        lastSeen: endedAt,
      }).catch(() => {});
    }
  });

  let otherLogs = {};
  let filter = "all";

  function ensureOtherLogsPanel() {
    const existing = document.getElementById("nj-other-logs-section");
    const mainLogs = document.getElementById("nj-logs-section");
    if (existing || !mainLogs) return;

    const section = document.createElement("div");
    section.id = "nj-other-logs-section";
    section.style.cssText =
      "margin-top:12px;border:1px solid #2a2a4a;border-radius:10px;overflow:hidden;";
    section.innerHTML = `
      <div id="nj-other-logs-header" style="display:flex;align-items:center;padding:11px 12px;background:#171727;color:#fff;font-weight:700;font-size:13px;cursor:pointer">
        <span>🧭 Other Activity Logs</span>
        <span id="nj-other-logs-count" style="background:#0f2a2a;border:1px solid #0e7490;color:#67e8f9;border-radius:10px;padding:1px 8px;font-size:11px;font-weight:700;margin-left:7px">0</span>
        <span id="nj-other-logs-chevron" style="margin-left:auto;color:#6b7280">▼</span>
      </div>
      <div id="nj-other-logs-body" style="display:none;padding:10px 12px;background:#0f0f1a">
        <div style="color:#6b7280;font-size:11px;line-height:1.5;margin-bottom:8px">Game sessions, chat rooms, and trading activity are shown here. Active sessions update while the player is online.</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
          <button class="nj-quick-game-btn" data-olf="all">All</button>
          <button class="nj-quick-game-btn" data-olf="game_session">Games</button>
          <button class="nj-quick-game-btn" data-olf="chat_session">Chats</button>
          <button class="nj-quick-game-btn" data-olf="trade_list">Listings</button>
          <button class="nj-quick-game-btn" data-olf="trade_buy">Purchases</button>
        </div>
        <div id="nj-other-logs-list" style="max-height:420px;overflow-y:auto;display:flex;flex-direction:column;gap:6px"></div>
      </div>`;
    mainLogs.after(section);

    section.querySelector("#nj-other-logs-header").onclick = () => {
      const body = section.querySelector("#nj-other-logs-body");
      const open = body.style.display !== "block";
      body.style.display = open ? "block" : "none";
      section.querySelector("#nj-other-logs-chevron").textContent = open ? "▲" : "▼";
      if (open) renderOtherLogs();
    };
    section.querySelectorAll("[data-olf]").forEach((button) => {
      button.onclick = () => {
        filter = button.dataset.olf;
        section.querySelectorAll("[data-olf]").forEach((item) => {
          const selected = item.dataset.olf === filter;
          item.style.borderColor = selected ? "#0891b2" : "";
          item.style.color = selected ? "#67e8f9" : "";
        });
        renderOtherLogs();
      };
    });
  }

  function activityDescription(log) {
    const data = log.data || {};
    if (log.type === "game_session") {
      const liveDuration = log.status === "active"
        ? Date.now() - Number(log.startedAt || Date.now())
        : log.durationMs;
      return `<b>${esc(log.username || "Unknown")}</b> played <b>${esc(log.gameName || "a game")}</b> for <b>${durationText(liveDuration)}</b>
        <div style="color:#6b7280;font-size:10px;margin-top:3px">Started: ${esc(dateText(log.startedAt))}${log.status === "active" ? " · 🟢 still playing" : ` · Ended: ${esc(dateText(log.endedAt))}`}</div>`;
    }
    if (log.type === "chat_session") {
      const liveDuration = log.status === "active"
        ? Date.now() - Number(log.startedAt || Date.now())
        : log.durationMs;
      return `<b>${esc(log.username || "Unknown")}</b> entered <b>${esc(log.roomName || "a chat")}</b>
        <div style="color:#6b7280;font-size:10px;margin-top:3px">${log.passwordProtected ? "🔒 Password-protected" : "🌐 Public"} · ${durationText(liveDuration)} · Started: ${esc(dateText(log.startedAt))}${log.status === "active" ? " · 🟢 active" : ` · Ended: ${esc(dateText(log.endedAt))}`}</div>`;
    }
    if (log.type === "trade_list" || log.type === "trade_buy") {
      const action = log.type === "trade_buy" ? "bought" : "listed";
      return `<b>${esc(log.username || "Unknown")}</b> ${action} <b>${esc(data.itemName || "Unknown item")}</b>
        <div style="color:#6b7280;font-size:10px;margin-top:3px">Quantity: ${esc(data.quantity || 1)} · Price: ${esc(data.price || 0)} coins${data.seller ? ` · Seller: ${esc(data.seller)}` : ""}</div>`;
    }
    return `<b>${esc(log.username || "Unknown")}</b> · ${esc(log.type || "activity")}<div style="color:#6b7280;font-size:10px;margin-top:3px">${esc(JSON.stringify(data))}</div>`;
  }

  function renderOtherLogs() {
    const list = document.getElementById("nj-other-logs-list");
    if (!list) return;
    let entries = Object.entries(otherLogs);
    if (filter !== "all") entries = entries.filter(([, log]) => log.type === filter);
    entries.sort((a, b) =>
      Number(b[1].startedAt || b[1].createdAt || 0) -
      Number(a[1].startedAt || a[1].createdAt || 0)
    );
    entries = entries.slice(0, 300);
    list.innerHTML = entries.length
      ? entries.map(([key, log]) => `<div data-other-log="${esc(key)}" style="background:#171727;border:1px solid #164e63;border-radius:8px;padding:9px 10px;font-size:12px">
          <div style="color:#d1d5db;line-height:1.45">${activityDescription(log)}</div>
          <div style="color:#4b5563;font-size:10px;margin-top:4px">${esc(log.sessionId || "")}</div>
        </div>`).join("")
      : '<div style="color:#6b7280;font-size:12px;text-align:center;padding:20px">No other activity has been logged yet.</div>';
  }

  onValue(ref(db, "njsgames/otherlogs"), (snapshot) => {
    otherLogs = snapshot.val() || {};
    const count = document.getElementById("nj-other-logs-count");
    if (count) count.textContent = Object.keys(otherLogs).length;
    ensureOtherLogsPanel();
    if (document.getElementById("nj-other-logs-body")?.style.display === "block") {
      renderOtherLogs();
    }
  });

  // The existing moderation UI is obfuscated, so wrap its public handlers
  // instead of replacing the panel. This fixes the old hard-coded
  // "Moderator" label while retaining its existing behavior.
  function installModeratorPatches() {
    if (window.__njActivityModeratorPatches) return;
    const checkPassword = window._njCheckModPw;
    const openPanel = window._njOpenModPanel;
    const sendAnnouncement = window._njModSendAnn;
    const kick = window._njModKick;
    const mute = window._njModMute;
    if (typeof checkPassword !== "function" || typeof openPanel !== "function" || typeof sendAnnouncement !== "function") return;
    window.__njActivityModeratorPatches = true;

    window._njOpenModPanel = async function (...args) {
      const result = await openPanel.apply(this, args);
      await push(ref(db, "njsgames/adminlogs"), {
        type: "mod_login",
        data: { role: "moderator", sessionId: getSessionId() },
        admin: getUsername(),
        ts: Date.now(),
      }).catch(() => {});
      return result;
    };

    window._njCheckModPw = async function (...args) {
      await checkPassword.apply(this, args);
    };

    async function repairLatest(type, before, matcher) {
      const snapshot = await get(ref(db, "njsgames/adminlogs")).catch(() => null);
      if (!snapshot?.exists()) return;
      const match = Object.entries(snapshot.val() || {})
        .filter(([, log]) =>
          log?.type === type &&
          Number(log.ts || 0) >= before &&
          matcher(log)
        )
        .sort((a, b) => Number(b[1].ts || 0) - Number(a[1].ts || 0))[0];
      if (match) {
        await update(ref(db, `njsgames/adminlogs/${match[0]}`), {
          admin: getUsername(),
        }).catch(() => {});
      }
    }

    window._njModSendAnn = async function (...args) {
      const input = document.getElementById("nj-mod-ann-input");
      const text = input?.value.trim() || "";
      const before = Date.now();
      const result = await sendAnnouncement.apply(this, args);
      await repairLatest("announcement", before - 2000, (log) => log.data?.text === text);
      await update(ref(db, "njsgames/broadcast"), {
        by: getUsername(),
        sender: getUsername(),
      }).catch(() => {});
      return result;
    };

    if (typeof kick === "function") {
      window._njModKick = async function (...args) {
        const target = document.getElementById("nj-mod-kick-input")?.value.trim() || "";
        const before = Date.now();
        const result = await kick.apply(this, args);
        await repairLatest("kick", before - 2000, (log) => log.data?.target === target);
        return result;
      };
    }
    if (typeof mute === "function") {
      window._njModMute = async function (...args) {
        const target = document.getElementById("nj-mod-mute-input")?.value.trim() || "";
        const before = Date.now();
        const result = await mute.apply(this, args);
        await repairLatest("mute", before - 2000, (log) => log.data?.target === target);
        return result;
      };
    }
  }

  ensureOtherLogsPanel();
  installModeratorPatches();
  window.setInterval(() => {
    ensureOtherLogsPanel();
    installModeratorPatches();
    if (document.getElementById("nj-other-logs-body")?.style.display === "block") {
      renderOtherLogs();
    }
  }, 500);
}

startTelemetry();