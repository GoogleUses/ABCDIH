(function () {
  "use strict";

  const pokiBase = "https://pokiunblocked.gitlab.io";
  const pokiGames = [
    ["Subway Surfers New York",444],["Dreadhead Parkour",412],["Level Devil",356],
    ["Stickman Hook",406],["Retro Bowl",400],["Temple of Boom",411],["Monkey Mart",829],
    ["Crossy Road",402],["Tunnel Rush",404],["G-Switch 3",403],["Monster Tracks",414],
    ["Drive Mad",401],["Temple Run 2",405],["Rocket Soccer Derby",527],["OvO",456],
    ["Cluster Rush",526],["Furious Racing 3D",793],["Soccer Skills Champions League",588],
    ["Slopey",399],["Poor Bunny",548],["Make It Meme",368],["Super Star Car",630],
    ["Merge Cyber Racers",595],["Rooftop Snipers 2",424],["Raft Wars",409],
    ["Idle Lumber Inc",586],["Rooftop Snipers",481],["Highway Traffic",522],
    ["Battle Wheels",647],["Village Craft",389],["Eugenes Life",589],
    ["Super Mario Bros",826],["Basketball Legends",474],["Red Ball 4",491],
    ["Tank Ball: Monster Battle",4],["Offroader V5",751],["Blumgi Slime",421],
    ["Traffic Escape",357],["Murder",580],["Stickman Archero Fight",6],["Slope 2",437],
    ["Fireboy and Watergirl: Forest Temple",346],["Stickman Bike",590],["Swingo",636],
    ["Moto X3M Winter",460],["Archer Master 3D: Castle Defense",340],
    ["Stair Race 3D",619],["FNF Minus",836],["FNF Salty's Sunday Night",838],
    ["FNF Michael Jackson's Rose Criminal",837],["FNF Smoke Em Out Struggle",840],
    ["FNF UpSide",842],["Flip Side",832],["FNF Vs Hex Mod",834],
    ["FNF Vs Shaggy",839],["FNF StarCatcher",841],
    ["Friday Night Funkin' vs Hatsune Miku",349],["FNF Vs Henry Stickmin",833],
    ["FNF Vs Void",843],["FNF Week 6",844],["Friday Night Funkin' B-Sides",348],
    ["Everywhere At The End Of Funk",831],["Friday Night Funkin' vs Shaggy x Matt",347],
    ["Friday Night Funkin' vs XE",350],["FNF Vs Matt",835],
    ["Little Master Cricket",386]
  ].map(([name,id]) => ({
    name, id: `poki-${id}`, category: "Poki",
    url: `${pokiBase}/go/class-${id}.html`,
    thumb: `${pokiBase}/img/class-${id}.png`
  }));

  const testingSites = [
    ["Player Nation","https://sites.google.com/view/player-nation/home"],
    ["Cherri","https://ual.beltfrog.com/"],["Galaxy","https://a.teimporto.cl/"],
    ["PeteZah","https://math.asturkiters.es/"],["Space","https://learn.hr24.ro/"],
    ["Xylora","https://xylora.bumon.ar/"],["IXL","https://goeeoe.inoriza-racing.com.ar/"],
    ["Strawberri","https://stories-math.martindiaz.org/"],["Tung Tung","https://tt-mathsubject.martindiaz.org/"],
    ["StudyHub","https://quotes-math.martindiaz.org/"],["Utopia","https://math-qo.martindiaz.org/"],
    ["Lunar","https://wow-best-math.martindiaz.org/"],["Dogeub","https://storage.googleapis.com/canvas-lms/index.html"],
    ["Fren","https://s3.amazonaws.com/angelfern/index.html"],["Lucide","https://mathscience.glenoriebakery.com.au"],
    ["Strongdog XP","https://mathcordxp.github.io/"],["Tyrone's Games Shack","https://sites.google.com/view/tyronesgameshack"],
    ["NJS Unblocked Games","https://nightwaveyt.github.io/NJsUnblockedGames/"],
    ["Unblocked Games 24h","https://sites.google.com/site/unblockedgames24h/"],
    ["Unblocked Games GG","https://unblockedgamesgg.com/"],
    ["Unblocked Games 500","https://sites.google.com/site/unblockedgames500weeblycom/home-unblockedgames500"],
    ["Classroom Center","https://sites.google.com/classroom.center/view-1/home"],
    ["Cool UGB","https://coolunblockedgames.github.io/"],["GitHub Games","https://git-hub-games.github.io/"],
    ["Spatial Games","https://www.spatial.io/categories/unblocked-games"],
    ["GPlus Games","https://sites.google.com/view/unblocked-game-gplus/unblocked-games"],
    ["Classroom 6x","https://classroom6xunblocked-games.github.io/"],
    ["Unblocked Games 76","https://sites.google.com/view/unblocked-game76"],
    ["Unblocked Games 333","https://sites.google.com/site/unblockedgames333/"],
    ["ABCDIH / NJS","https://googleuses.github.io/ABCDIH/"],
    ["Unpkg ClassroomDuck","https://unpkg.com/classroomduck@1.0.76/index.html"],
    ["Text to Speech","https://crikk.com/text-to-speech"],["Voice Changer","https://voicechanger.easeus.com/soundboards"],
    ["YFlix","https://yflix.ws/"],["YouTube","https://www.youtube.com/"],
    ["ClickView","https://www.clickview.net/discover"],["Online Pianist","https://www.onlinepianist.com/virtual-piano"],
    ["CoreCS","https://corecs.babypos.hk/"],["Italianish","https://edu.italianish.beltfrog.com/"]
  ];

  const css = `
    #nj-updates-bar{max-width:1180px;margin:10px auto 0;padding:0 14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;position:relative;z-index:5}
    #nj-updates-bar .nj-stacked{display:flex;flex-direction:column;gap:5px}
    #nj-updates-bar button{border:1px solid #3b2b68;background:#17132b;color:#ddd6fe;border-radius:9px;padding:8px 12px;font:600 12px/1.1 inherit;cursor:pointer}
    #nj-updates-bar button:hover{background:#6d28d9;color:#fff}
    #nj-updates-bar .nj-updates-label{color:#a78bfa;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-right:2px}
    #nj-updates-overlay{display:none;position:fixed;inset:0;z-index:10080;background:rgba(3,3,12,.9);backdrop-filter:blur(7px);align-items:center;justify-content:center}
    #nj-updates-modal{width:min(1080px,94vw);max-height:88vh;overflow:auto;background:#0f0f1a;border:1px solid #4c1d95;border-radius:18px;padding:20px;color:#f8fafc;box-shadow:0 20px 80px #000}
    #nj-updates-modal h2{margin:0 0 5px;font-size:21px}.nj-updates-sub{color:#9ca3af;font-size:12px;margin-bottom:16px}
    .nj-updates-close{float:right;background:none!important;border:0!important;color:#9ca3af!important;font-size:20px!important;padding:0!important}
    .nj-updates-search{width:100%;box-sizing:border-box;background:#17172a;border:1px solid #302b4a;border-radius:9px;color:#fff;padding:10px;margin-bottom:14px}
    .nj-updates-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
    .nj-updates-card{display:block;text-decoration:none;color:#fff;background:#17172a;border:1px solid #292345;border-radius:11px;overflow:hidden;transition:.15s}
    .nj-updates-card:hover{transform:translateY(-2px);border-color:#8b5cf6}.nj-updates-card img{width:100%;height:86px;object-fit:cover;background:#24203b}
    .nj-updates-card span{display:block;padding:8px;font-size:12px;font-weight:700}.nj-updates-empty{color:#9ca3af;padding:20px;text-align:center}
    .nj-updates-links{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}
    .nj-updates-link{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#17172a;border:1px solid #292345;border-radius:9px;padding:11px;color:#fff;text-decoration:none;font-size:12px}
    .nj-updates-link:hover{border-color:#8b5cf6}.nj-updates-link small{color:#9ca3af}
    .nj-farmer{padding:30px 12px;text-align:center;border:1px dashed #4c1d95;border-radius:12px;color:#c4b5fd}
    @media(max-width:600px){#nj-updates-bar{margin-top:6px}.nj-updates-grid{grid-template-columns:repeat(2,1fr)}}
  `;
  const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  function esc(value) {
    return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }
  function openModal(title, subtitle, body) {
    let overlay = document.getElementById("nj-updates-overlay");
    if (!overlay) {
      overlay = document.createElement("div"); overlay.id = "nj-updates-overlay";
      overlay.innerHTML = `<div id="nj-updates-modal"><button class="nj-updates-close" aria-label="Close">×</button><h2></h2><div class="nj-updates-sub"></div><div class="nj-updates-content"></div></div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener("click", e => { if (e.target === overlay || e.target.closest(".nj-updates-close")) overlay.style.display = "none"; });
    }
    overlay.querySelector("h2").textContent = title;
    overlay.querySelector(".nj-updates-sub").textContent = subtitle || "";
    overlay.querySelector(".nj-updates-content").innerHTML = body;
    overlay.style.display = "flex";
  }
  function showGames() {
    const known = new Set(["slope","drive mad","rooftop snipers","fireboy and watergirl","basketball legends","friday night funkin"]);
    const games = pokiGames.filter(g => !known.has(g.name.toLowerCase()));
    openModal("🎮 Poki Games", `${games.length} games added from Poki Unblocked. Duplicate names are filtered.`, `<input class="nj-updates-search" placeholder="Search games…" oninput="window.njFilterPoki(this.value)"><div id="nj-poki-grid" class="nj-updates-grid">${games.map(g => `<a class="nj-updates-card" href="${g.url}" target="_blank" rel="noopener noreferrer"><img loading="lazy" src="${g.thumb}" onerror="this.style.display='none'" alt=""><span>${esc(g.name)}</span></a>`).join("")}</div>`);
    window.njFilterPoki = q => document.querySelectorAll("#nj-poki-grid .nj-updates-card").forEach(card => card.style.display = card.textContent.toLowerCase().includes(String(q).toLowerCase()) ? "" : "none");
  }
  function showTesting() {
    openModal("🧪 Testing Sites", "Choose a site or proxy to open in a new tab.", `<div class="nj-updates-links">${testingSites.map(([name,url]) => `<a class="nj-updates-link" href="${url}" target="_blank" rel="noopener noreferrer"><span>${esc(name)}</span><small>Open ↗</small></a>`).join("")}</div>`);
  }
  function showQA() {
    const questions = JSON.parse(localStorage.getItem("nj_custom_qa") || "null") || [
      ["How do I play a game?", "Open Games, choose a title, and use the fullscreen control if the game provides one."],
      ["Why is a game not loading?", "Try another game or testing site, refresh once, and check whether your network blocks the host."],
      ["How do I earn coins?", "Use Daily Spin, complete Challenges, and play games. Coin Farmer is not available yet."],
      ["What does Redeem do?", "Redeem a code supplied by the site owner for coins or an item."],
      ["How do I report a broken link?", "Tell an administrator the game name and what happened; they can update the catalogue."]
    ];
    openModal("❓ Questions & Answers", "Common help for players.", `<div class="nj-updates-links">${questions.map(([q,a]) => `<div class="nj-updates-link" style="display:block"><strong>${esc(q)}</strong><div style="color:#a1a1aa;margin-top:5px;line-height:1.5">${esc(a)}</div></div>`).join("")}</div><div style="margin-top:14px;display:flex;gap:8px;align-items:center"><button onclick="window.njEditQA()">➕ Add Q/A</button><span style="color:#6b7280;font-size:11px">Admin panel authentication is required.</span></div>`);
  }
  window.njEditQA = function () {
    const panel = document.getElementById("nj-admin-overlay");
    if (!panel || getComputedStyle(panel).display === "none") {
      alert("Open the Admin panel and enter the master key first.");
      return;
    }
    const q = prompt("Question:");
    if (!q || !q.trim()) return;
    const a = prompt("Answer:");
    if (!a || !a.trim()) return;
    const current = JSON.parse(localStorage.getItem("nj_custom_qa") || "null") || [
      ["How do I play a game?", "Open Games, choose a title, and use the fullscreen control if the game provides one."],
      ["Why is a game not loading?", "Try another game or testing site, refresh once, and check whether your network blocks the host."]
    ];
    current.push([q.trim(), a.trim()]);
    localStorage.setItem("nj_custom_qa", JSON.stringify(current));
    showQA();
  };
  function showFarmer() {
    openModal("🪙 Coin Farmer", "Coming soon", `<div class="nj-farmer"><div style="font-size:42px">🌱</div><h3>Work in progress</h3><p>This feature is not available yet.</p></div>`);
  }
  function addBar() {
    if (document.getElementById("nj-updates-bar")) return;
    const bar = document.createElement("div"); bar.id = "nj-updates-bar";
    bar.innerHTML = `<span class="nj-updates-label">Quick access</span><div class="nj-stacked"><button onclick="window.njOpenSpin&&njOpenSpin()">🎡 Daily Spin</button><button onclick="window.njOpenChallenges&&njOpenChallenges()">⚡ Challenges</button></div><div class="nj-stacked"><button onclick="window.njOpenGamble&&njOpenGamble()">🎰 Gamble</button><button onclick="document.getElementById('nj-codes-overlay').style.display='flex'">🎟️ Redeem</button></div><button data-action="games">🎮 Poki Games</button><button data-action="qa">❓ Q/A</button><button data-action="farmer">🪙 Coin Farmer</button><button data-action="testing">🧪 Testing Sites</button>`;
    bar.querySelector('[data-action="games"]').onclick = showGames;
    bar.querySelector('[data-action="qa"]').onclick = showQA;
    bar.querySelector('[data-action="farmer"]').onclick = showFarmer;
    bar.querySelector('[data-action="testing"]').onclick = showTesting;
    const root = document.getElementById("root");
    (root || document.body).prepend(bar);
  }
  addBar();
  new MutationObserver(addBar).observe(document.body, { childList: true, subtree: true });
})();