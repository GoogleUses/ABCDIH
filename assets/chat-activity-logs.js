/*
 * Chat-room session logging.  This records which room was entered and how
 * long the room stayed open; it never records the room password or messages.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  update,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const config = {
  apiKey: atob("QUl6YVN5RFc5eGRGZHhGU2pBbTE1Zi1sMTA3ZlFwbVpiczZfdkV3"),
  authDomain: "trolling-e3ed8.firebaseapp.com",
  databaseURL: "https://trolling-e3ed8-default-rtdb.firebaseio.com",
  projectId: "trolling-e3ed8",
  storageBucket: "trolling-e3ed8.appspot.com",
  messagingSenderId: "299260439019",
  appId: "1:299260439019:web:9dedc986334a871e1d51ae",
};

let database;
try {
  database = getDatabase(initializeApp(config, "nj_chat_activity_logs"));
} catch (error) {
  database = null;
}

const username = () => localStorage.getItem("nj_username") || "Unknown";
const sessionId = () =>
  sessionStorage.getItem("nj_sess") ||
  sessionStorage.getItem("nj_sess_id") ||
  "unknown-session";

async function boot() {
  if (!database) return;
  let active = null;
  let pendingProtected = false;
  let lastRoomTitle = "";

  document.getElementById("roomsGrid")?.addEventListener("click", (event) => {
    const card = event.target.closest(".room-card");
    if (!card) return;
    pendingProtected = Boolean(card.querySelector(".private-icon"));
  }, true);

  async function endChat() {
    if (!active) return;
    const endedAt = Date.now();
    await update(ref(database, `njsgames/otherlogs/${active.key}`), {
      status: "completed",
      endedAt,
      durationMs: Math.max(0, endedAt - active.startedAt),
      lastSeen: endedAt,
    }).catch(() => {});
    active = null;
  }

  async function inspectChat() {
    const view = document.getElementById("chat-view");
    const isOpen = view && getComputedStyle(view).display !== "none";
    const title = document.getElementById("chatTitle")?.textContent.trim() || "";
    if (!isOpen || !title || title === "Room") {
      if (active) await endChat();
      lastRoomTitle = "";
      return;
    }
    if (title === lastRoomTitle) {
      if (active) {
        update(ref(database, `njsgames/otherlogs/${active.key}`), {
          lastSeen: Date.now(),
          durationMs: Math.max(0, Date.now() - active.startedAt),
        }).catch(() => {});
      }
      return;
    }
    if (active) await endChat();
    lastRoomTitle = title;
    const startedAt = Date.now();
    const logRef = push(ref(database, "njsgames/otherlogs"));
    active = { key: logRef.key, startedAt };
    await set(logRef, {
      type: "chat_session",
      username: username(),
      sessionId: sessionId(),
      roomName: title,
      passwordProtected: pendingProtected,
      access: pendingProtected ? "password-or-master-key" : "public",
      startedAt,
      lastSeen: startedAt,
      status: "active",
    }).catch(() => {});
    pendingProtected = false;
  }

  const observer = new MutationObserver(inspectChat);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true });
  window.setInterval(inspectChat, 1000);
  await inspectChat();
  window.addEventListener("pagehide", () => {
    if (!active) return;
    const endedAt = Date.now();
    update(ref(database, `njsgames/otherlogs/${active.key}`), {
      status: "completed",
      endedAt,
      durationMs: Math.max(0, endedAt - active.startedAt),
      lastSeen: endedAt,
    }).catch(() => {});
  });
}

boot();