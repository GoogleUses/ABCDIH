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
    rebuildUnblockerSelect(); removeTestingHeader(); removePokiCatalogItems(); installQA();
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
        if (content) content.innerHTML = '<h2 style="color:#fff">📋 Update Log</h2><div style="background:#0f1a0f;border:1px solid #166534;border-radius:12px;padding:14px;color:#d1d5db"><b style="color:#4ade80">Latest · 20 Aug 2026</b><h3 style="color:#fff">🛠️ Q/A, Unblocker & Catalog cleanup</h3><ul><li>Add Q/A now opens a real masterkey form before the question and answer fields.</li><li>Removed the Testing Sites and School Games tabs.</li><li>Removed the unreliable LunarV2 proxy.</li><li>Removed the non-working Poki game range from the visible catalog.</li><li>Kept the remaining game sources unique by normalized URL.</li></ul></div>';
      };
    }
  }
  install();
  new MutationObserver(install).observe(document.body, { childList: true, subtree: true });
})();