/* ============ ROUTER / LOBBY / PAGES ============ */
(function () {
  const { $, $$, h, fmt, Wallet, games, toast, Sound, runCleanups } = VG;
  const view = $('#view');

  function paintBalance() { $('#balance').textContent = fmt(Wallet.get()); }
  document.addEventListener('wallet', paintBalance);
  paintBalance();
  $('#addCoins').addEventListener('click', () => { Wallet.add(5000); Sound.win(); toast('+5,000 coins added', 'good'); });

  $$('.tabbar button').forEach(b => b.addEventListener('click', () => { Sound.click(); location.hash = b.dataset.nav; }));

  function gameCard(g) {
    return h('button', { class: 'gcard', onclick() { Sound.click(); location.hash = '#/g/' + g.id; } },
      h('div', { class: 'gicon' }, g.emoji),
      h('div', { class: 'gmeta' }, h('strong', {}, g.name), h('small', {}, g.desc)),
      h('span', { class: 'gtag' }, g.tag));
  }

  function lobby() {
    const page = h('div', { class: 'page' });
    page.append(h('section', { class: 'hero' },
      h('h1', {}, 'Play ', h('em', {}, String(games.length)), ' premium games'),
      h('p', {}, 'Crash, cards, slots, roulette, arcade and more — all instant, all with virtual coins. No signup, no server.'),
      h('div', { class: 'herobtns' },
        h('button', { class: 'btn primary', onclick() { location.hash = '#/g/aviator'; } }, '▶ Play Aviator'),
        h('button', { class: 'btn ghost', onclick() { Wallet.reset(); toast('Wallet reset to 10,000', 'good'); } }, '⟲ Reset coins'))));
    [...new Set(games.map(g => g.tag))].forEach(cat => {
      const list = games.filter(g => g.tag === cat);
      page.append(h('h2', { class: 'sechead' }, cat, h('span', {}, list.length + ' games')));
      const grid = h('div', { class: 'grid' });
      list.forEach(g => grid.append(gameCard(g)));
      page.append(grid);
    });
    return page;
  }

  function openGame(id) {
    const g = games.find(x => x.id === id);
    if (!g) { location.hash = '#/'; return; }
    runCleanups();
    const page = h('div', { class: 'page' },
      h('div', { class: 'gamehead' },
        h('button', { class: 'back', onclick() { location.hash = '#/'; } }, '←'),
        h('div', {}, h('h2', {}, g.emoji + ' ' + g.name), h('small', {}, g.tag + ' · ' + g.desc))));
    const host = h('div', { class: 'gamehost' });
    page.append(host);
    view.append(page);
    try { g.mount(host); } catch (e) { host.append(h('div', { class: 'game-shell' }, h('div', { class: 'status' }, 'Error: ' + e.message))); console.error(e); }
    window.scrollTo(0, 0);
  }

  function walletPage() {
    const page = h('div', { class: 'page' });
    page.append(h('h1', { style: { fontWeight: 900 } }, '💰 Wallet'));
    page.append(h('div', { class: 'game-shell', style: { maxWidth: '480px' } },
      h('div', { class: 'readout-big' }, fmt(Wallet.get()) + ' ◉'),
      h('div', { class: 'status' }, 'Your balance lives in localStorage on this device only.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn gold', onclick() { Wallet.add(5000); Sound.win(); } }, '+5,000'),
        h('button', { class: 'btn primary', onclick() { Wallet.add(25000); Sound.win(); } }, '+25,000'),
        h('button', { class: 'btn danger', onclick() { Wallet.reset(); toast('Reset to 10,000', 'good'); } }, 'Reset')),
      h('div', { class: 'status' }, 'Sound:'),
      h('button', { class: 'btn ghost', onclick(e) { VG.Sound.on = !VG.Sound.on; localStorage.setItem('vg.sound', VG.Sound.on ? '1' : '0'); e.currentTarget.textContent = VG.Sound.on ? '🔊 Sound ON' : '🔇 Sound OFF'; } },
        VG.Sound.on ? '🔊 Sound ON' : '🔇 Sound OFF')));
    return page;
  }

  function searchPage() {
    const page = h('div', { class: 'page' });
    const results = h('div', { class: 'grid' });
    const input = h('input', {
      class: 'numin', style: { width: '100%', maxWidth: '420px', textAlign: 'left', padding: '13px 16px' },
      placeholder: 'Search 40 games…', oninput(e) {
        const q = e.target.value.toLowerCase().trim();
        results.innerHTML = '';
        games.filter(g => !q || g.name.toLowerCase().includes(q) || g.tag.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q))
          .forEach(g => results.append(gameCard(g)));
      }
    });
    page.append(h('h1', { style: { fontWeight: 900 } }, '🔎 Search'), input, h('div', { style: { height: '16px' } }), results);
    games.forEach(g => results.append(gameCard(g)));
    return page;
  }

  function aboutPage() {
    return h('div', { class: 'page' },
      h('h1', { style: { fontWeight: 900 } }, 'ℹ️ About LuckyVerse'),
      h('div', { class: 'game-shell', style: { maxWidth: '620px', alignItems: 'flex-start' } },
        h('p', { class: 'status', style: { textAlign: 'left' } }, 'A zero-dependency casino arcade: pure HTML, CSS and vanilla JavaScript. 40 games, one wallet, no backend.'),
        h('p', { class: 'status', style: { textAlign: 'left' } }, 'Every game module registers itself with a tiny registry — add a new one by dropping a file in /js and adding a <script> tag.'),
        h('p', { class: 'status', style: { textAlign: 'left' } }, 'All randomness is client-side with a tuned ~95–100% return to player.')));
  }

  function route() {
    const hash = location.hash || '#/';
    view.innerHTML = '';
    $$('.tabbar button').forEach(b => b.classList.toggle('on', b.dataset.nav === hash));
    const m = hash.match(/^#\/g\/(.+)$/);
    if (m) return openGame(m[1]);
    if (hash === '#/wallet') { view.append(walletPage()); return window.scrollTo(0, 0); }
    if (hash === '#/search') { view.append(searchPage()); return window.scrollTo(0, 0); }
    if (hash === '#/about') { view.append(aboutPage()); return window.scrollTo(0, 0); }
    view.append(lobby());
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);
  route();
})();