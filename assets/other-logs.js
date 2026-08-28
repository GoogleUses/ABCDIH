/* NJ's Games — activity and audit telemetry
 *
 * This file intentionally keeps activity logs separate from adminlogs. It
 * records useful, human-readable events (not chat message contents or
 * passwords) and adds the Other Logs view to the existing admin panel.
 */
(function () {
  "use strict";

  var CONFIG = {
    apiKey: "AIzaSyDWC9xdFdfhXjAm15f-l107fQpVbsz_vEw",
    authDomain: "trolling-e3ed8.firebaseapp.com",
    databaseURL: "https://trolling-e3ed8-default-rtdb.firebaseio.com",
    projectId: "trolling-e3ed8",
    storageBucket: "trolling-e3ed8.appspot.com",
    messagingSenderId: "299260439019",
    appId: "1:299260439019:web:9dedc986334a871e1d51ae"
  };
  var db = null;
  var firebase = null;
  var pending = [];
  var activeGame = null;
  var activeChat = null;
  var lastActivityKey = "";
  var activeTimer = null;
  var otherLogs = {};
  var otherActive = {};
  var otherUnsub = null;
  var activeUnsub = null;
  var uiInstalled = false;
  var modInstalled = false;

  function now() { return Date.now(); }
  function actor() {
    try { return localStorage.getItem("nj_username") || "Anonymous"; }
    catch (e) { return "Anonymous"; }
  }
  function sessionId() {
    try { return sessionStorage.getItem("nj_sess") || sessionStorage.getItem("nj_chat_sess") || ""; }
    catch (e) { return ""; }
  }
  function deviceId() {
    try { return localStorage.getItem("nj_device_id") || sessionStorage.getItem("nj_device_id") || ""; }
    catch (e) { return ""; }
  }
  function clip(value, max) {
    var text = String(value == null ? "" : value);
    return text.length > (max || 180) ? text.slice(0, max || 180) + "…" : text;
  }
  function clean(value, depth) {
    if (depth > 2) return clip(value, 120);
    if (value == null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return typeof value === "string" ? clip(value, 300) : value;
    }
    if (Array.isArray(value)) return value.slice(0, 12).map(function (v) { return clean(v, (depth || 0) + 1); });
    var result = {};
    Object.keys(value).slice(0, 20).forEach(function (key) {
      if (/password|passhash|secret|token|key/i.test(key)) return;
      result[clip(key, 60)] = clean(value[key], (depth || 0) + 1);
    });
    return result;
  }
  function pageName() {
    try { return location.pathname + location.search; } catch (e) { return ""; }
  }
  function makeEvent(type, data, extra) {
    return Object.assign({
      type: type,
      actor: actor(),
      username: actor(),
      sessionId: sessionId(),
      deviceId: deviceId(),
      page: pageName(),
      ts: now(),
      data: clean(data || {}, 0)
    }, extra || {});
  }
  function writeEvent(event) {
    if (!db || !firebase) { pending.push(event); return; }
    try { firebase.push(firebase.ref(db, "njsgames/otherLogs"), event).catch(function () {}); }
    catch (e) {}
  }
  function record(type, data, extra) { writeEvent(makeEvent(type, data, extra)); }
  function writeActive(key, value) {
    if (!db || !firebase || !key) return;
    try { firebase.set(firebase.ref(db, "njsgames/otherLogsActive/" + key), clean(value, 0)).catch(function () {}); }
    catch (e) {}
  }
  function removeActive(key) {
    if (!db || !firebase || !key) return;
    try { firebase.remove(firebase.ref(db, "njsgames/otherLogsActive/" + key)).catch(function () {}); }
    catch (e) {}
  }

  window.njLogOtherEvent = function (type, data) {
    record(type || "activity", data || {});
  };
  window.njLogTradeListing = function (item, price, quantity, extra) {
    record("marketplace_listing", Object.assign({
      item: clip(item || "Unknown item", 120),
      price: Number(price) || 0,
      quantity: Number(quantity) || 1,
      listedAt: now()
    }, extra || {}));
  };
  window.njLogTradePurchase = function (item, price, quantity, seller, extra) {
    record("marketplace_purchase", Object.assign({
      item: clip(item || "Unknown item", 120),
      price: Number(price) || 0,
      quantity: Number(quantity) || 1,
      seller: clip(seller || "", 80),
      purchasedAt: now()
    }, extra || {}));
  };
  /*
   * Trading Plaza builds can call these two public helpers after their
   * Firebase write succeeds. The current upload does not contain a
   * trading-plaza.html file, so keeping the hooks here makes the logging
   * contract ready without guessing at item or price values.
   */
  window.njLogTrade = function (action, data) {
    if (action === "list" || action === "listing") {
      window.njLogTradeListing(data && (data.item || data.itemName), data && data.price, data && data.quantity, data);
    } else if (action === "buy" || action === "purchase") {
      window.njLogTradePurchase(data && (data.item || data.itemName), data && data.price, data && data.quantity, data && data.seller, data);
    }
  };

  function finishGame(reason) {
    if (!activeGame) return;
    var endedAt = now();
    var game = activeGame;
    activeGame = null;
    removeActive("game_" + (sessionId() || "anonymous"));
    record("game_session", {
      game: game.name,
      gameName: game.name,
      url: game.url || "",
      startedAt: game.startedAt,
      endedAt: endedAt,
      startTime: new Date(game.startedAt).toISOString(),
      endTime: new Date(endedAt).toISOString(),
      durationMs: Math.max(0, endedAt - game.startedAt),
      durationMinutes: Math.round(Math.max(0, endedAt - game.startedAt) / 60000 * 10) / 10,
      endedBecause: reason || "navigation"
    });
  }
  function startGame(value) {
    var game = value || {};
    var name = clip(game.name || game.title || "Unknown game", 160);
    var url = clip(game.url || game.detail || "", 300);
    if (activeGame && activeGame.name === name) {
      activeGame.url = url || activeGame.url;
      writeActive("game_" + (sessionId() || "anonymous"), {
        type: "game_session_in_progress", actor: actor(), username: actor(),
        sessionId: sessionId(), game: activeGame.name, startedAt: activeGame.startedAt,
        updatedAt: now(), url: activeGame.url || ""
      });
      return;
    }
    finishGame("switched_game");
    activeGame = { name: name, url: url, startedAt: now() };
    writeActive("game_" + (sessionId() || "anonymous"), {
      type: "game_session_in_progress", actor: actor(), username: actor(),
      sessionId: sessionId(), game: name, startedAt: activeGame.startedAt,
      updatedAt: now(), url: url
    });
  }
  function updateGame(value) {
    if (value) startGame(value);
    else finishGame("closed_game");
  }

  function hookPresence() {
    if (typeof window.updatePresenceGame === "function" && !window.updatePresenceGame.__njOtherLogs) {
      var originalGame = window.updatePresenceGame;
      var wrappedGame = function (value) {
        updateGame(value);
        return originalGame.apply(this, arguments);
      };
      wrappedGame.__njOtherLogs = true;
      window.updatePresenceGame = wrappedGame;
    }
    if (typeof window.updatePresenceActivity === "function" && !window.updatePresenceActivity.__njOtherLogs) {
      var originalActivity = window.updatePresenceActivity;
      var wrappedActivity = function (type, label, detail, url) {
        var key = [type, label, detail, url].join("|");
        if (key !== lastActivityKey) {
          lastActivityKey = key;
          record("activity_change", { activityType: type || "site", label: label || "", detail: detail || "", url: url || "" });
        }
        return originalActivity.apply(this, arguments);
      };
      wrappedActivity.__njOtherLogs = true;
      window.updatePresenceActivity = wrappedActivity;
    }
  }
  function scanGameIframe() {
    var frames = Array.prototype.slice.call(document.querySelectorAll("iframe[title]"));
    var frame = frames.find(function (node) {
      var title = node.getAttribute("title") || "";
      return title && title !== "Chat Rooms" && title !== "AI Chat";
    });
    if (frame) startGame({ name: frame.getAttribute("title"), url: frame.getAttribute("src") || "" });
    else if (activeGame && !document.querySelector(".game-iframe, iframe[title]")) finishGame("closed_game");
  }

  function finishChat(reason) {
    if (!activeChat) return;
    var endedAt = now();
    var chat = activeChat;
    activeChat = null;
    removeActive("chat_" + (sessionId() || "anonymous"));
    record("chat_session", {
      room: chat.room,
      protected: !!chat.protected,
      access: chat.protected ? "protected-room" : "public-room",
      enteredAt: chat.enteredAt,
      exitedAt: endedAt,
      startTime: new Date(chat.enteredAt).toISOString(),
      endTime: new Date(endedAt).toISOString(),
      durationMs: Math.max(0, endedAt - chat.enteredAt),
      durationMinutes: Math.round(Math.max(0, endedAt - chat.enteredAt) / 60000 * 10) / 10,
      endedBecause: reason || "back_to_rooms"
    });
  }
  function setupChatTracking() {
    if (!/chat/i.test(location.pathname) && document.title !== "Chat Rooms") return;
    var pendingProtected = false;
    document.addEventListener("click", function (event) {
      var card = event.target.closest && event.target.closest(".room-card");
      if (card) pendingProtected = /🔒|password/i.test(card.textContent || "");
    }, true);
    function inspect() {
      var view = document.getElementById("chat-view");
      if (!view) return;
      var visible = getComputedStyle(view).display !== "none";
      var title = (document.getElementById("chatTitle") || {}).textContent || "";
      if (visible && title.trim()) {
        if (!activeChat || activeChat.room !== title.trim()) {
          finishChat("switched_room");
          activeChat = { room: clip(title.trim(), 160), protected: pendingProtected, enteredAt: now() };
          writeActive("chat_" + (sessionId() || "anonymous"), {
            type: "chat_session_in_progress", actor: actor(), username: actor(),
            room: activeChat.room, protected: activeChat.protected,
            enteredAt: activeChat.enteredAt, updatedAt: now()
          });
        }
      } else if (!visible) finishChat("back_to_rooms");
    }
    new MutationObserver(inspect).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["style", "class"] });
    setInterval(inspect, 1000);
    inspect();
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function dateText(ts) {
    if (!ts) return "";
    try { return new Date(ts).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }); }
    catch (e) { return new Date(ts).toLocaleString(); }
  }
  function durationText(ms) {
    var minutes = Math.max(0, Math.round((Number(ms) || 0) / 60000 * 10) / 10);
    if (minutes < 1) return Math.round((Number(ms) || 0) / 1000) + "s";
    if (minutes < 60) return minutes + " min";
    var hours = Math.floor(minutes / 60);
    return hours + "h " + Math.round((minutes % 60) * 10) / 10 + "m";
  }
  function detailFor(log, live) {
    var d = log.data || log;
    if (log.type === "game_session" || (live && log.type === "game_session_in_progress")) {
      var elapsed = live ? now() - (Number(d.startedAt) || now()) : d.durationMs;
      return "🎮 " + escapeHtml(d.gameName || d.game || "Unknown game") +
        " · " + (live ? "in progress · " : "") + durationText(elapsed) +
        " · " + escapeHtml(d.startTime || dateText(d.startedAt)) +
        (live ? "" : " → " + escapeHtml(d.endTime || dateText(d.endedAt)));
    }
    if (log.type === "chat_session" || (live && log.type === "chat_session_in_progress")) {
      var chatElapsed = live ? now() - (Number(d.enteredAt) || now()) : d.durationMs;
      return "💬 " + escapeHtml(d.room || "Unknown room") +
        " · " + (d.protected ? "🔒 protected" : "public") +
        " · " + (live ? "in progress · " : "") + durationText(chatElapsed) +
        " · " + escapeHtml(d.startTime || dateText(d.enteredAt)) +
        (live ? "" : " → " + escapeHtml(d.endTime || dateText(d.exitedAt)));
    }
    var fields = Object.keys(d).filter(function (key) { return !/startTime|endTime|durationMs|durationMinutes/i.test(key); }).slice(0, 8);
    return fields.map(function (key) { return "<b>" + escapeHtml(key) + ":</b> " + escapeHtml(d[key]); }).join(" · ");
  }
  var labels = {
    game_session: "🎮 Game session",
    game_session_in_progress: "🎮 Game session",
    chat_session: "💬 Chat session",
    chat_session_in_progress: "💬 Chat session",
    activity_change: "🧭 Activity",
    marketplace_listing: "🏷️ Marketplace listing",
    marketplace_purchase: "🛒 Marketplace purchase",
    moderator_login: "🛡️ Moderator login",
    moderator_announcement: "📣 Moderator announcement"
  };
  function renderOtherLogs() {
    var list = document.getElementById("nj-other-logs-list");
    var filter = document.getElementById("nj-other-logs-filter");
    if (!list) return;
    var entries = Object.keys(otherLogs).map(function (key) { return { key: key, log: otherLogs[key], live: false }; });
    Object.keys(otherActive).forEach(function (key) {
      var value = otherActive[key];
      if (value && value.type) entries.push({ key: "live_" + key, log: value, live: true });
    });
    var selected = filter ? filter.value : "all";
    if (selected !== "all") entries = entries.filter(function (item) {
      return item.log.type === selected || (selected === "game_session" && item.log.type === "game_session_in_progress") ||
        (selected === "chat_session" && item.log.type === "chat_session_in_progress");
    });
    entries.sort(function (a, b) { return (b.log.ts || b.log.updatedAt || b.log.startedAt || 0) - (a.log.ts || a.log.updatedAt || a.log.startedAt || 0); });
    entries = entries.slice(0, 300);
    if (!entries.length) {
      list.innerHTML = '<div style="color:#6b7280;font-size:12px;padding:12px 0">No other activity logged yet.</div>';
      return;
    }
    list.innerHTML = entries.map(function (item) {
      var l = item.log;
      var name = l.actor || l.username || "Anonymous";
      return '<div style="background:#0f0f1a;border:1px solid ' + (item.live ? "#2563eb" : "#2a2a4a") + ';border-radius:8px;padding:9px 10px;font-size:12px">' +
        '<div style="display:flex;justify-content:space-between;gap:8px"><span style="color:#e5e7eb;font-weight:700">' +
        escapeHtml(labels[l.type] || ("📋 " + l.type)) + '</span><span style="color:#6b7280;font-size:10px;white-space:nowrap">' +
        escapeHtml(dateText(l.ts || l.updatedAt || l.startedAt)) + '</span></div>' +
        '<div style="color:#c4b5fd;margin-top:4px"><b>User:</b> ' + escapeHtml(name) + '</div>' +
        '<div style="color:#9ca3af;margin-top:3px">' + detailFor(l, item.live) + '</div></div>';
    }).join("");
  }
  function installOtherLogsUI() {
    if (uiInstalled) return;
    var oldSection = document.getElementById("nj-logs-section");
    if (!oldSection || !oldSection.parentElement) return;
    uiInstalled = true;
    var section = document.createElement("div");
    section.id = "nj-other-logs-section";
    section.style.cssText = "margin-top:10px;";
    section.innerHTML = '<div id="nj-other-logs-header" style="cursor:pointer;padding:10px 0;color:#fff;font-weight:800;display:flex;align-items:center;gap:7px">' +
      '<span>🧭 Other Logs</span><span id="nj-other-logs-count" style="background:#172554;border:1px solid #2563eb;color:#93c5fd;border-radius:10px;padding:1px 8px;font-size:11px">0</span>' +
      '<span id="nj-other-logs-chevron" style="margin-left:auto;color:#6b7280;font-size:12px">▼</span></div>' +
      '<div id="nj-other-logs-body" style="display:none"><div style="display:flex;gap:6px;flex-wrap:wrap;padding:8px 0">' +
      '<select id="nj-other-logs-filter" style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:7px;color:#c4b5fd;padding:7px;font-size:11px">' +
      '<option value="all">All other activity</option><option value="game_session">Game sessions</option><option value="chat_session">Chat sessions</option>' +
      '<option value="marketplace_listing">Listings</option><option value="marketplace_purchase">Purchases</option><option value="activity_change">Site activity</option>' +
      '</select></div><div id="nj-other-logs-list" style="max-height:420px;overflow-y:auto;display:flex;flex-direction:column;gap:6px"></div></div>';
    oldSection.parentElement.appendChild(section);
    var body = section.querySelector("#nj-other-logs-body");
    section.querySelector("#nj-other-logs-header").addEventListener("click", function () {
      var open = body.style.display !== "block";
      body.style.display = open ? "block" : "none";
      section.querySelector("#nj-other-logs-chevron").textContent = open ? "▲" : "▼";
      if (open) subscribeOtherLogs();
    });
    section.querySelector("#nj-other-logs-filter").addEventListener("change", renderOtherLogs);
  }
  function subscribeOtherLogs() {
    if (!db || !firebase || otherUnsub) { renderOtherLogs(); return; }
    otherUnsub = firebase.onValue(firebase.ref(db, "njsgames/otherLogs"), function (snap) {
      otherLogs = snap.val() || {};
      var count = document.getElementById("nj-other-logs-count");
      if (count) count.textContent = Object.keys(otherLogs).length;
      renderOtherLogs();
    });
    activeUnsub = firebase.onValue(firebase.ref(db, "njsgames/otherLogsActive"), function (snap) {
      otherActive = snap.val() || {};
      renderOtherLogs();
    });
  }

  function modDatabase() { return window.njDb || db; }
  async function modApi() {
    if (firebase) return firebase;
    return null;
  }
  async function moderatorAnnouncement() {
    var input = document.getElementById("nj-mod-ann-input");
    var text = input && input.value.trim();
    if (!text) return;
    var api = await modApi(), database = modDatabase();
    if (!api || !database) return;
    var name = actor(), ts = now();
    await api.set(api.ref(database, "njsgames/broadcast"), { text: text, ts: ts, by: name, sender: name });
    await api.push(api.ref(database, "njsgames/adminlogs"), { type: "announcement", data: { text: text, role: "moderator" }, admin: name, ts: ts });
    record("moderator_announcement", { text: text });
    input.value = "";
    var status = document.getElementById("nj-mod-status");
    if (status) { status.style.color = "#4ade80"; status.textContent = "✅ Announcement sent."; setTimeout(function () { status.textContent = ""; }, 4000); }
  }
  async function moderatorKick() {
    var input = document.getElementById("nj-mod-kick-input"), target = input && input.value.trim();
    if (!target) return;
    var api = await modApi(), database = modDatabase();
    if (!api || !database) return;
    var snap = await api.get(api.ref(database, "njsgames/presence")), found = Object.entries(snap.val() || {}).find(function (entry) {
      return entry[1] && String(entry[1].username || "").toLowerCase() === target.toLowerCase();
    });
    if (!found) return;
    var ts = now();
    await api.set(api.ref(database, "njsgames/commands/" + found[0]), { type: "kick", reason: "Kicked by moderator", ts: ts });
    await api.remove(api.ref(database, "njsgames/presence/" + found[0]));
    await api.push(api.ref(database, "njsgames/adminlogs"), { type: "kick", data: { target: target, reason: "Kicked by moderator" }, admin: actor(), ts: ts });
    record("moderator_kick", { target: target, reason: "Kicked by moderator" });
    input.value = "";
  }
  async function moderatorMute() {
    var input = document.getElementById("nj-mod-mute-input"), target = input && input.value.trim();
    var duration = parseInt((document.getElementById("nj-mod-mute-dur") || {}).value, 10) || 300000;
    if (!target) return;
    var api = await modApi(), database = modDatabase();
    if (!api || !database) return;
    var snap = await api.get(api.ref(database, "njsgames/presence")), found = Object.entries(snap.val() || {}).find(function (entry) {
      return entry[1] && String(entry[1].username || "").toLowerCase() === target.toLowerCase();
    });
    if (!found) return;
    var ts = now(), expires = ts + duration;
    await api.set(api.ref(database, "njsgames/commands/" + found[0]), { type: "mute", expiresAt: expires, ts: ts });
    await api.set(api.ref(database, "njsgames/mutes/" + found[0]), { username: target, expiresAt: expires, mutedAt: ts, mutedBy: actor() });
    await api.push(api.ref(database, "njsgames/adminlogs"), { type: "mute", data: { target: target, durationMs: duration, expiresAt: expires }, admin: actor(), ts: ts });
    record("moderator_mute", { target: target, durationMs: duration, expiresAt: expires });
    input.value = "";
  }
  function installModeratorFixes() {
    if (modInstalled) return;
    if (!document.getElementById("nj-mod-overlay")) return;
    modInstalled = true;
    window._njModSendAnn = moderatorAnnouncement;
    window._njModKick = moderatorKick;
    window._njModMute = moderatorMute;
    var overlay = document.getElementById("nj-mod-overlay"), wasOpen = false;
    new MutationObserver(function () {
      var open = getComputedStyle(overlay).display !== "none";
      if (open && !wasOpen) {
        var name = actor(), ts = now(), api = firebase, database = modDatabase();
        if (api && database) api.push(api.ref(database, "njsgames/adminlogs"), { type: "admin_login", data: { role: "moderator" }, admin: name, ts: ts }).catch(function () {});
        record("moderator_login", { role: "moderator" });
      }
      wasOpen = open;
    }).observe(overlay, { attributes: true, attributeFilter: ["style", "class"] });
  }

  async function initFirebase() {
    try {
      firebase = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js");
      var databaseModule = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js");
      var app = firebase.getApps().find(function (item) { return item.name === "nj_other_logs"; }) ||
        firebase.initializeApp(CONFIG, "nj_other_logs");
      db = databaseModule.getDatabase(app);
      firebase = Object.assign({}, firebase, databaseModule);
      window.njOtherDb = db;
      pending.splice(0).forEach(writeEvent);
    } catch (e) {
      /* Logging must never interfere with the site if Firebase is unavailable. */
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    record("page_view", { title: document.title });
    setupChatTracking();
    setInterval(function () {
      hookPresence();
      scanGameIframe();
      installOtherLogsUI();
      installModeratorFixes();
      if (activeGame) writeActive("game_" + (sessionId() || "anonymous"), {
        type: "game_session_in_progress", actor: actor(), username: actor(),
        game: activeGame.name, startedAt: activeGame.startedAt, updatedAt: now(), url: activeGame.url || ""
      });
    }, 1000);
    window.addEventListener("pagehide", function () { finishGame("page_closed"); finishChat("page_closed"); });
  }, { once: true });
  if (document.readyState !== "loading") document.dispatchEvent(new Event("DOMContentLoaded"));
  initFirebase();
})();