/* ============ LUCK GAMES ============ */
(function () {
  const { h, $$, ri, fmt, sleep, toast, Sound, stake, payout, betBar, register, shuffle } = VG;

  /* ---------- COIN FLIP ---------- */
  register({
    id: 'coin-flip', name: 'Coin Flip', emoji: '🪙', tag: 'Luck',
    desc: 'Heads or tails. Simple, fast, 1.95× payout.',
    mount(root) {
      const bar = betBar();
      let side = 'heads', busy = false;
      const coin = h('div', { class: 'readout-big', style: { fontSize: '80px' } }, '🪙');
      const status = h('div', { class: 'status' }, 'Call it in the air.');
      const seg = h('div', { class: 'seg' });
      [['heads', '👑 Heads'], ['tails', '🌿 Tails']].forEach(([k, l]) =>
        seg.append(h('button', {
          class: 'segbtn' + (k === 'heads' ? ' on' : ''),
          onclick(e) { if (busy) return; side = k; $$('.segbtn', seg).forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); }
        }, l)));
      const go = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return; const bet = bar.api.bet; if (!stake(bet)) return;
          busy = true; go.disabled = true;
          for (let i = 0; i < 12; i++) { coin.textContent = Math.random() < .5 ? '🪙' : '🌕'; Sound.tick(); await sleep(70); }
          const heads = Math.random() < 0.5;
          coin.textContent = heads ? '👑' : '🌿';
          if (heads === (side === 'heads')) { const w = bet * 1.95; payout(w); Sound.big(); status.textContent = (heads ? 'HEADS' : 'TAILS') + ' — +' + fmt(w) + ' coins!'; toast('+' + fmt(w), 'good'); }
          else { Sound.lose(); status.textContent = (heads ? 'HEADS' : 'TAILS') + ' — lost ' + fmt(bet); }
          busy = false; go.disabled = false;
        }
      }, 'FLIP');
      root.append(h('div', { class: 'game-shell' }, coin, status, seg, go, bar));
    }
  });

  /* ---------- DICE ROLL ---------- */
  register({
    id: 'dice-roll', name: 'Dice Roll', emoji: '🎲', tag: 'Luck',
    desc: 'Pick a face. Hit it and get 5.8×.',
    mount(root) {
      const bar = betBar();
      let target = 6, busy = false;
      const face = h('div', { class: 'readout-big', style: { fontSize: '90px' } }, '⚀');
      const status = h('div', { class: 'status' }, 'Pick a face, then roll.');
      const seg = h('div', { class: 'seg' });
      for (let n = 1; n <= 6; n++) seg.append(h('button', {
        class: 'segbtn' + (n === 6 ? ' on' : ''),
        onclick(e) { if (busy) return; target = n; $$('.segbtn', seg).forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); }
      }, ['⚀','⚁','⚂','⚃','⚄','⚅'][n-1]));
      const go = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return; const bet = bar.api.bet; if (!stake(bet)) return;
          busy = true; go.disabled = true;
          for (let i = 0; i < 14; i++) { face.textContent = ['⚀','⚁','⚂','⚃','⚄','⚅'][ri(0,5)]; Sound.tick(); await sleep(60); }
          const r = ri(1, 6);
          face.textContent = ['⚀','⚁','⚂','⚃','⚄','⚅'][r - 1];
          if (r === target) { const w = bet * 5.8; payout(w); Sound.big(); status.textContent = 'Rolled ' + r + ' — JACKPOT +' + fmt(w); toast('+' + fmt(w), 'good'); }
          else { Sound.lose(); status.textContent = 'Rolled ' + r + ' — lost ' + fmt(bet); }
          busy = false; go.disabled = false;
        }
      }, 'ROLL');
      root.append(h('div', { class: 'game-shell' }, face, status, seg, go, bar));
    }
  });

  /* ---------- SPIN WHEEL (colour) ---------- */
  register({
    id: 'spin-wheel', name: 'Spin Wheel', emoji: '🎡', tag: 'Luck',
    desc: 'Bet on a colour and spin the big wheel.',
    mount(root) {
      const bar = betBar();
      let pick = 'red', busy = false, rot = 0;
      const wheel = h('div', { class: 'wheel' }, h('div', { class: 'wheel-hub' }, '★'));
      const out = h('div', { class: 'readout-big' }, '—');
      const status = h('div', { class: 'status' }, 'Red 1.95× · Black 2.3× · Green 11×');
      const seg = h('div', { class: 'seg' });
      [['red', '🔴 Red'], ['black', '⚫ Black'], ['green', '🟢 Green']].forEach(([k, l]) =>
        seg.append(h('button', {
          class: 'segbtn' + (k === 'red' ? ' on' : ''),
          onclick(e) { if (busy) return; pick = k; $$('.segbtn', seg).forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); }
        }, l)));
      const go = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return; const bet = bar.api.bet; if (!stake(bet)) return;
          busy = true; go.disabled = true;
          const r = Math.random();
          const colour = r < 0.5 ? 'red' : r < 0.9167 ? 'black' : 'green';
          const idx = colour === 'red' ? ri(0, 5) : colour === 'black' ? ri(6, 10) : 11;
          rot += 1440 + idx * 30;
          wheel.style.transition = 'transform 3s cubic-bezier(.15,.9,.25,1)';
          wheel.style.transform = 'rotate(' + rot + 'deg)';
          Sound.tick(); await sleep(3100);
          out.textContent = colour.toUpperCase();
          out.style.color = colour === 'green' ? '#2fe08a' : colour === 'red' ? '#ff5c7a' : '#c9d4ff';
          if (colour === pick) { const w = bet * (pick === 'green' ? 11 : pick === 'black' ? 2.3 : 1.95); payout(w); Sound.big(); status.textContent = colour.toUpperCase() + '! +' + fmt(w) + ' coins'; toast('+' + fmt(w), 'good'); }
          else { Sound.lose(); status.textContent = colour.toUpperCase() + ' — lost ' + fmt(bet); }
          busy = false; go.disabled = false;
        }
      }, 'SPIN');
      root.append(h('div', { class: 'game-shell' }, h('div', { class: 'wheel-wrap' }, wheel), out, status, seg, go, bar));
    }
  });

  /* ---------- LUCKY SPIN ---------- */
  register({
    id: 'lucky-spin', name: 'Lucky Spin', emoji: '🍀', tag: 'Luck',
    desc: 'Multiplier wheel. Land on 4× for the big one.',
    mount(root) {
      const bar = betBar();
      const SEGS = [0, 0.5, 1, 0, 2, 0.5, 4, 0.2];
      let busy = false, rot = 0;
      const wheel = h('div', { class: 'wheel' }, h('div', { class: 'wheel-hub' }, '🍀'));
      const out = h('div', { class: 'readout-big' }, '—');
      const status = h('div', { class: 'status' }, 'Segments: ' + SEGS.map(s => s + '×').join(' · '));
      const go = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return; const bet = bar.api.bet; if (!stake(bet)) return;
          busy = true; go.disabled = true;
          const idx = ri(0, SEGS.length - 1);
          rot += 1440 + (360 / SEGS.length) * idx;
          wheel.style.transition = 'transform 3s cubic-bezier(.15,.9,.25,1)';
          wheel.style.transform = 'rotate(' + rot + 'deg)';
          Sound.tick(); await sleep(3100);
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

  /* ---------- KENO ---------- */
  register({
    id: 'keno', name: 'Keno', emoji: '🔢', tag: 'Luck',
    desc: 'Pick 3 numbers from 1–10. Match all three for 32×.',
    mount(root) {
      const bar = betBar();
      let picks = [], busy = false;
      const grid = h('div', { class: 'mines-grid', style: { gridTemplateColumns: 'repeat(5,1fr)' } });
      const cells = [];
      for (let i = 1; i <= 10; i++) {
        const c = h('button', { class: 'mcell', style: { fontSize: '15px' }, onclick: () => {
          if (busy) return;
          const idx = picks.indexOf(i);
          if (idx >= 0) { picks.splice(idx, 1); c.className = 'mcell'; }
          else if (picks.length < 3) { picks.push(i); c.className = 'mcell open'; }
          Sound.click();
        } }, i);
        cells.push(c); grid.append(c);
      }
      const status = h('div', { class: 'status' }, 'Pick 3 numbers (2.5× for 2 matches, 32× for 3).');
      const go = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return;
          if (picks.length !== 3) return toast('Pick exactly 3 numbers', 'bad');
          const bet = bar.api.bet; if (!stake(bet)) return;
          busy = true; go.disabled = true;
          const draw = shuffle([1,2,3,4,5,6,7,8,9,10]).slice(0, 3);
          for (let i = 0; i < 10; i++) { status.textContent = 'Drawing… ' + shuffle([1,2,3,4,5,6,7,8,9,10]).slice(0,3).join(' · '); Sound.tick(); await sleep(90); }
          const hits = picks.filter(p => draw.includes(p)).length;
          cells.forEach((c, i) => {
            const n = i + 1;
            if (draw.includes(n)) c.className = 'mcell open gem';
            if (picks.includes(n) && draw.includes(n)) c.className = 'mcell boom';
          });
          status.textContent = 'Drawn: ' + draw.join(', ') + ' — ' + hits + ' match(es)';
          if (hits === 3) { const w = bet * 32; payout(w); Sound.big(); toast('+' + fmt(w), 'good'); }
          else if (hits === 2) { const w = bet * 2.5; payout(w); Sound.win(); toast('+' + fmt(w), 'good'); }
          else if (hits === 1) { const w = bet * 0.55; payout(w); Sound.win(); }
          else Sound.lose();
          busy = false; go.disabled = false;
          picks = []; cells.forEach(c => c.className = 'mcell');
        }
      }, 'DRAW');
      root.append(h('div', { class: 'game-shell' }, grid, status, go, bar));
    }
  });

  /* ---------- SCRATCH CARD ---------- */
  register({
    id: 'scratch', name: 'Scratch Card', emoji: '🎫', tag: 'Luck',
    desc: 'Scratch all 9 panels. Three matching symbols pays.',
    mount(root) {
      const bar = betBar();
      const SYM = ['🍒','🍋','🍇','🔔','⭐','💎','🍉','🍊'];
      let board = [], live = false;
      const grid = h('div', { class: 'scratch-grid' });
      const cells = [];
      for (let i = 0; i < 9; i++) { const c = h('button', { class: 'scell', onclick: () => reveal(i) }); cells.push(c); grid.append(c); }
      const status = h('div', { class: 'status' }, 'Press NEW CARD then scratch all 9 panels.');
      const start = h('button', { class: 'btn primary big', onclick: begin }, 'NEW CARD');
      function begin() {
        if (!stake(bar.api.bet)) return;
        board = Array.from({ length: 9 }, () => SYM[ri(0, SYM.length - 1)]);
        cells.forEach(c => { c.textContent = ''; c.className = 'scell'; });
        live = true; status.textContent = 'Scratch the panels…';
      }
      function reveal(i) {
        if (!live || cells[i].classList.contains('open')) return;
        cells[i].textContent = board[i]; cells[i].classList.add('open'); Sound.click();
        if (cells.every(c => c.classList.contains('open'))) finish();
      }
      function finish() {
        live = false;
        const counts = {};
        board.forEach(s => counts[s] = (counts[s] || 0) + 1);
        let best = 0;
        Object.values(counts).forEach(n => { if (n >= 3) best = Math.max(best, n); });
        const PAY = { 3: 1, 4: 2, 5: 5, 6: 15, 7: 40, 8: 100, 9: 250 };
        const mult = best ? PAY[Math.min(best, 9)] : 0;
        if (mult) {
          const w = bar.api.bet * mult; payout(w); (mult >= 5 ? Sound.big : Sound.win)();
          status.textContent = best + ' of a kind! Paid ' + mult + '× → +' + fmt(w) + ' coins';
          toast('+' + fmt(w), 'good');
          board.forEach((s, i) => { if (counts[s] >= 3) cells[i].classList.add('hit'); });
        } else { Sound.lose(); status.textContent = 'No match — lost ' + fmt(bar.api.bet) + ' coins.'; }
      }
      root.append(h('div', { class: 'game-shell' }, grid, status, start, bar));
    }
  });

  /* ---------- NUMBER GUESS ---------- */
  register({
    id: 'number-guess', name: 'Number Guess', emoji: '🔮', tag: 'Luck',
    desc: 'Guess the secret number between 1 and 10. Hit it for 9×.',
    mount(root) {
      const bar = betBar();
      let target = ri(1, 10), busy = false;
      const disp = h('div', { class: 'readout-big' }, '?');
      const status = h('div', { class: 'status' }, 'Pick a number and guess.');
      const seg = h('div', { class: 'seg' });
      let pick = 5;
      for (let n = 1; n <= 10; n++) seg.append(h('button', {
        class: 'segbtn' + (n === 5 ? ' on' : ''),
        onclick(e) { if (busy) return; pick = n; $$('.segbtn', seg).forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); }
      }, n));
      const go = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return; const bet = bar.api.bet; if (!stake(bet)) return;
          busy = true; go.disabled = true;
          for (let i = 0; i < 14; i++) { disp.textContent = ri(1, 10); Sound.tick(); await sleep(60); }
          disp.textContent = target;
          if (target === pick) { const w = bet * 9; payout(w); Sound.big(); status.textContent = 'Correct! +' + fmt(w) + ' coins'; toast('+' + fmt(w), 'good'); }
          else { Sound.lose(); status.textContent = 'It was ' + target + ' — lost ' + fmt(bet); }
          target = ri(1, 10);
          busy = false; go.disabled = false;
        }
      }, 'GUESS');
      root.append(h('div', { class: 'game-shell' }, disp, status, seg, go, bar));
    }
  });
})();