/* ============ SLOT MACHINES ============ */
(function () {
  const { h, $$, ri, pick, fmt, sleep, toast, Sound, stake, payout, betBar, register } = VG;

  /* ---------- CLASSIC SLOTS ---------- */
  register({
    id: 'slots', name: 'Classic Slots', emoji: '🎰', tag: 'Slots',
    desc: '3 reels, 1 payline. Two of a kind returns 1.1×, three pays big.',
    mount(root) {
      const bar = betBar();
      const SYM = [
        { e: '🍒', w: 22, p: 5 }, { e: '🍋', w: 20, p: 8 }, { e: '🍇', w: 16, p: 15 },
        { e: '🔔', w: 12, p: 30 }, { e: '⭐', w: 10, p: 60 }, { e: '💎', w: 7, p: 120 }, { e: '7️⃣', w: 5, p: 500 }
      ];
      const TOTAL = SYM.reduce((a, s) => a + s.w, 0);
      const draw = () => { let r = Math.random() * TOTAL; for (const s of SYM) { r -= s.w; if (r <= 0) return s; } return SYM[0]; };
      let busy = false;
      const reels = [0, 1, 2].map(() => h('div', { class: 'reel' }, '❔'));
      const status = h('div', { class: 'status' }, 'Match 3 for the big payout.');
      const go = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return; const bet = bar.api.bet; if (!stake(bet)) return;
          busy = true; go.disabled = true; status.textContent = 'Spinning…';
          const res = [draw(), draw(), draw()];
          for (let i = 0; i < 3; i++) {
            for (let k = 0; k < 9; k++) { reels[i].textContent = pick(SYM).e; Sound.tick(); await sleep(45 + i * 14); }
            reels[i].textContent = res[i].e;
          }
          const [a, b, c] = res;
          if (a.e === b.e && b.e === c.e) { const w = bet * a.p; payout(w); Sound.big(); status.textContent = 'JACKPOT! 3× ' + a.e + ' pays ' + a.p + '× → +' + fmt(w); toast('+' + fmt(w), 'good'); }
          else if (a.e === b.e || b.e === c.e || a.e === c.e) { const w = bet * 1.1; payout(w); Sound.win(); status.textContent = 'Pair — you get ' + fmt(w) + ' coins back'; }
          else { Sound.lose(); status.textContent = 'No match — lost ' + fmt(bet); }
          busy = false; go.disabled = false;
        }
      }, 'SPIN');
      root.append(h('div', { class: 'game-shell' }, h('div', { class: 'reelbox' }, reels), status, go, bar));
    }
  });

  /* ---------- FRUIT BONANZA ---------- */
  register({
    id: 'bonanza', name: 'Fruit Bonanza', emoji: '🍉', tag: 'Slots',
    desc: '5 reels, 15 symbols. Three or more of any fruit anywhere pays.',
    mount(root) {
      const bar = betBar();
      const SYM = ['🍒', '🍋', '🍇', '🔔', '⭐', '💎'];
      const PAY = { 3: 0.15, 4: 0.35, 5: 0.8, 6: 2, 7: 5, 8: 12, 9: 25, 10: 50, 11: 80, 12: 120, 13: 180, 14: 250, 15: 400 };
      let busy = false;
      const box = h('div', { class: 'reelbox' });
      const reels = [];
      for (let i = 0; i < 5; i++) { const r = h('div', { class: 'reel', style: { width: '56px', height: '90px', fontSize: '26px' } }, '❔'); reels.push(r); box.append(r); }
      const status = h('div', { class: 'status' }, 'Press SPIN to drop the fruit.');
      const go = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return; const bet = bar.api.bet; if (!stake(bet)) return;
          busy = true; go.disabled = true;
          const res = Array.from({ length: 15 }, () => SYM[ri(0, SYM.length - 1)]);
          for (let i = 0; i < 5; i++) {
            for (let k = 0; k < 7; k++) { reels[i].textContent = pick(SYM); Sound.tick(); await sleep(45 + i * 20); }
            reels[i].textContent = res[i * 3 + 1];
          }
          const counts = {};
          res.forEach(s => counts[s] = (counts[s] || 0) + 1);
          let total = 0, best = '';
          Object.keys(counts).forEach(s => { if (counts[s] >= 3) { total += bet * PAY[Math.min(counts[s], 15)]; best = s; } });
          if (total > 0) { payout(total); (total > bet * 3 ? Sound.big : Sound.win)(); status.textContent = 'WINS on ' + best + ' → +' + fmt(total) + ' coins'; toast('+' + fmt(total), 'good'); }
          else { Sound.lose(); status.textContent = 'No win — lost ' + fmt(bet); }
          busy = false; go.disabled = false;
        }
      }, 'SPIN');
      root.append(h('div', { class: 'game-shell' }, box, status, go, bar));
    }
  });

  /* ---------- MEGA WAYS ---------- */
  register({
    id: 'mega-ways', name: 'Mega Ways', emoji: '🌌', tag: 'Slots',
    desc: '6 reels × 4 rows. Symbol counts everywhere pay out.',
    mount(root) {
      const bar = betBar();
      const SYM = ['🍒', '🍋', '🍇', '🔔', '⭐', '💎', '🍉', '👑'];
      const PAY = { 3: 0.04, 4: 0.09, 5: 0.2, 6: 0.55, 7: 1.4, 8: 3.5, 9: 8, 10: 20, 12: 60, 15: 200, 24: 2000 };
      let busy = false;
      const grid = h('div', { class: 'board', style: { gridTemplateColumns: 'repeat(6,1fr)' } });
      const cells = [];
      for (let i = 0; i < 24; i++) { const c = h('div', { class: 'sq', style: { fontSize: '18px' } }, '❔'); cells.push(c); grid.append(c); }
      const status = h('div', { class: 'status' }, 'Press SPIN. Bigger groups pay much more.');
      const go = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return; const bet = bar.api.bet; if (!stake(bet)) return;
          busy = true; go.disabled = true;
          const res = Array.from({ length: 24 }, () => SYM[ri(0, SYM.length - 1)]);
          cells.forEach((c, i) => { c.textContent = pick(SYM); });
          for (let step = 0; step < 8; step++) { cells.forEach(c => c.textContent = pick(SYM)); Sound.tick(); await sleep(70); }
          res.forEach((s, i) => { cells[i].textContent = s; });
          const counts = {};
          res.forEach(s => counts[s] = (counts[s] || 0) + 1);
          let total = 0, hits = 0;
          Object.keys(counts).forEach(s => { const n = counts[s]; if (n >= 3) { hits++; total += bet * (PAY[Math.min(n, 24)] || PAY[24]); } });
          if (total > 0) { payout(total); (total > bet * 4 ? Sound.big : Sound.win)(); status.textContent = hits + ' symbol group(s) paid → +' + fmt(total) + ' coins'; toast('+' + fmt(total), 'good'); }
          else { Sound.lose(); status.textContent = 'No win — lost ' + fmt(bet); }
          busy = false; go.disabled = false;
        }
      }, 'SPIN');
      root.append(h('div', { class: 'game-shell' }, grid, status, go, bar));
    }
  });

  /* ---------- DICE SLOTS ---------- */
  register({
    id: 'dice-slots', name: 'Dice Slots', emoji: '🎲', tag: 'Slots',
    desc: 'Three dice. A pair returns 1.1×, a triple pays 20×.',
    mount(root) {
      const bar = betBar();
      let busy = false;
      const box = h('div', { class: 'reelbox' });
      const reels = [0, 1, 2].map(() => h('div', { class: 'reel' }, '⚀'));
      reels.forEach(r => box.append(r));
      const status = h('div', { class: 'status' }, 'Roll the dice slots.');
      const go = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return; const bet = bar.api.bet; if (!stake(bet)) return;
          busy = true; go.disabled = true;
          const F = ['⚀','⚁','⚂','⚃','⚄','⚅'];
          const res = [ri(1,6), ri(1,6), ri(1,6)];
          for (let i = 0; i < 3; i++) {
            for (let k = 0; k < 10; k++) { reels[i].textContent = pick(F); Sound.tick(); await sleep(50 + i * 18); }
            reels[i].textContent = F[res[i] - 1];
          }
          const [a, b, c] = res;
          if (a === b && b === c) { const w = bet * 20; payout(w); Sound.big(); status.textContent = 'TRIPLE ' + a + 's! +' + fmt(w) + ' coins'; toast('+' + fmt(w), 'good'); }
          else if (a === b || b === c || a === c) { const w = bet * 1.1; payout(w); Sound.win(); status.textContent = 'Pair — ' + fmt(w) + ' coins back'; }
          else { Sound.lose(); status.textContent = 'No match — lost ' + fmt(bet); }
          busy = false; go.disabled = false;
        }
      }, 'ROLL');
      root.append(h('div', { class: 'game-shell' }, box, status, go, bar));
    }
  });

  /* ---------- SPIN & WIN ---------- */
  register({
    id: 'spin-win', name: 'Spin & Win', emoji: '💫', tag: 'Slots',
    desc: 'Multiplier wheel with a 4× segment. Pure spin-to-win.',
    mount(root) {
      const bar = betBar();
      const SEGS = [0, 0.5, 1, 0, 2, 0.5, 4, 0.2];
      let busy = false, rot = 0;
      const wheel = h('div', { class: 'wheel' },
        h('div', { class: 'wheel-pin' }, '▼'),
        h('div', { class: 'wheel-hub' }, '💫'));
      const out = h('div', { class: 'readout-big' }, '—');
      const status = h('div', { class: 'status' }, 'Segments: ' + SEGS.map(s => s + '×').join(' · '));
      const go = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return; const bet = bar.api.bet; if (!stake(bet)) return;
          busy = true; go.disabled = true;
          const idx = ri(0, SEGS.length - 1);
          rot += 1800 + (360 / SEGS.length) * idx;
          wheel.style.transition = 'transform 3.2s cubic-bezier(.12,.85,.2,1)';
          wheel.style.transform = 'rotate(' + rot + 'deg)';
          Sound.tick(); await sleep(3300);
          const m = SEGS[idx];
          out.textContent = m.toFixed(2) + '×';
          out.style.color = m >= 2 ? '#ffcb47' : m >= 1 ? '#2fe08a' : '#ff5c7a';
          if (m > 0) { const w = bet * m; payout(w); (m >= 2 ? Sound.big : Sound.win)(); status.textContent = 'Landed ' + m + '× → +' + fmt(w) + ' coins'; if (m >= 2) toast('+' + fmt(w), 'good'); }
          else { Sound.lose(); status.textContent = 'Landed 0× — lost ' + fmt(bet); }
          busy = false; go.disabled = false;
        }
      }, 'SPIN');
      root.append(h('div', { class: 'game-shell' }, h('div', { class: 'wheel-wrap' }, wheel), out, status, go, bar));
    }
  });
})();