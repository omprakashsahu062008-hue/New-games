/* ============ CRASH & MULTIPLIER GAMES ============ */
(function () {
  const { h, $$, ri, fmt, sleep, toast, Sound, stake, payout, betBar, register, onCleanup, shuffle } = VG;

  /* ---------- 1. AVIATOR ---------- */
  register({
    id: 'aviator', name: 'Aviator', emoji: '✈️', tag: 'Crash',
    desc: 'Watch the plane climb. Cash out before it flies away.',
    mount(root) {
      const bar = betBar();
      let flying = false, mult = 1, raf = null, t0 = 0, crashAt = 2;

      const plane = h('div', { class: 'plane' }, '✈️');
      const sky = h('div', { class: 'sky' },
        h('span', { class: 'cloud c1' }), h('span', { class: 'cloud c2' }), h('span', { class: 'cloud c3' }), plane);
      const multEl = h('div', { class: 'readout-big' }, '1.00×');
      const status = h('div', { class: 'status' }, 'Set your bet, then take off.');
      const action = h('button', { class: 'btn primary big', onclick: () => flying ? cashOut() : begin() }, 'TAKE OFF');

      function begin() {
        if (!stake(bar.api.bet)) return;
        flying = true; mult = 1; t0 = performance.now();
        crashAt = Math.max(1.05, Math.round((0.99 / (1 - Math.random() * 0.99)) * 100) / 100);
        plane.style.opacity = '1';
        status.textContent = 'Climbing… cash out any time!';
        action.className = 'btn gold big';
        raf = requestAnimationFrame(tick);
      }
      function tick(now) {
        const s = (now - t0) / 1000;
        mult = Math.pow(1.0718, s);
        if (mult >= crashAt) { mult = crashAt; draw(); return crash(); }
        draw(); raf = requestAnimationFrame(tick);
      }
      function draw() {
        multEl.textContent = mult.toFixed(2) + '×';
        multEl.style.color = mult < 2 ? '#2fe08a' : mult < 5 ? '#ffcb47' : '#ff6ec7';
        const p = Math.min(1, (mult - 1) / 8);
        plane.style.left = (5 + p * 78) + '%';
        plane.style.bottom = (8 + p * 60) + '%';
        plane.style.transform = 'rotate(-10deg) scale(' + (1 + p * .7) + ')';
        if (flying) action.textContent = 'CASH OUT ' + fmt(bar.api.bet * mult);
      }
      function cashOut() {
        if (!flying) return; flying = false; cancelAnimationFrame(raf);
        const w = bar.api.bet * mult; payout(w); Sound.win();
        status.textContent = 'Cashed out at ' + mult.toFixed(2) + '× for ' + fmt(w) + ' coins!';
        toast('+' + fmt(w) + ' coins', 'good'); reset();
      }
      function crash() {
        flying = false;
        status.textContent = 'Flew away at ' + mult.toFixed(2) + '× — lost ' + fmt(bar.api.bet) + ' coins.';
        Sound.lose(); toast('Crashed at ' + mult.toFixed(2) + '×', 'bad'); reset();
      }
      function reset() { action.textContent = 'TAKE OFF'; action.className = 'btn primary big'; plane.style.opacity = '.3'; }
      onCleanup(() => cancelAnimationFrame(raf));

      root.append(h('div', { class: 'game-shell' }, sky, multEl, status, action, bar));
    }
  });

  /* ---------- 2. CHICKEN ROAD ---------- */
  register({
    id: 'chicken-road', name: 'Chicken Road', emoji: '🐔', tag: 'Crash',
    desc: 'Cross 12 lanes of traffic. Cash out before you get squashed.',
    mount(root) {
      const bar = betBar();
      const LANES = 12, SURV = 0.90, STEP = 1.10;
      let lane = 0, mult = 1, live = false, deadAt = -1;

      const cells = [];
      for (let i = 0; i < LANES; i++) cells.push(h('div', { class: 'lane' }));
      const road = h('div', { class: 'road' }, cells);
      const multEl = h('div', { class: 'readout-big' }, '1.00×');
      const status = h('div', { class: 'status' }, 'Press START, then step lane by lane.');
      const start = h('button', { class: 'btn primary', onclick: begin }, 'START');
      const step  = h('button', { class: 'btn gold', onclick: advance, disabled: true }, 'STEP →');
      const cash  = h('button', { class: 'btn ghost', onclick: cashout, disabled: true }, 'CASH OUT');

      function paint() {
        cells.forEach((c, i) => {
          let mark = '';
          if (i === deadAt) mark = '💥';
          else if (i < lane) mark = '✅';
          else if (i === lane && live) mark = '🐔';
          c.className = 'lane' + (i < lane && i !== deadAt ? ' safe' : '') + (i === deadAt ? ' dead' : '');
          c.innerHTML = '<span class="ln">' + (i + 1) + '</span><span class="mk">' + mark + '</span>';
        });
        multEl.textContent = mult.toFixed(2) + '×';
        cash.textContent = 'CASH OUT ' + fmt(bar.api.bet * mult);
      }
      function begin() {
        if (!stake(bar.api.bet)) return;
        lane = 0; mult = 1; live = true; deadAt = -1;
        step.disabled = false; cash.disabled = false; start.disabled = true;
        status.textContent = 'Lane 1 of 12 — step or cash out.';
        paint();
      }
      function advance() {
        if (!live) return;
        if (Math.random() < SURV) {
          lane++;
          mult = Math.round(mult * STEP * 100) / 100;
          Sound.tick();
          if (lane >= LANES) { paint(); status.textContent = 'PERFECT CROSSING! '; return cashout(); }
          status.textContent = 'Safe! On lane ' + (lane + 1) + ' at ' + mult.toFixed(2) + '×';
          paint();
        } else {
          live = false; deadAt = lane;
          Sound.lose();
          status.textContent = 'Squashed on lane ' + (lane + 1) + '. Lost ' + fmt(bar.api.bet) + ' coins.';
          paint(); end();
        }
      }
      function cashout() {
        if (!live) return; live = false;
        const w = bar.api.bet * mult; payout(w); Sound.win();
        status.textContent = 'Cashed out at ' + mult.toFixed(2) + '× → +' + fmt(w) + ' coins!';
        toast('+' + fmt(w), 'good'); paint(); end();
      }
      function end() { start.disabled = false; start.textContent = 'PLAY AGAIN'; step.disabled = true; cash.disabled = true; }
      paint();
      root.append(h('div', { class: 'game-shell' }, road, multEl, status, h('div', { class: 'row' }, start, step, cash), bar));
    }
  });

  /* ---------- 3. ROCKET ---------- */
  register({
    id: 'rocket', name: 'Rocket Rush', emoji: '🚀', tag: 'Crash',
    desc: 'Fuel the rocket. Eject before the tanks blow.',
    mount(root) {
      const bar = betBar();
      let flying = false, mult = 1, raf = null, t0 = 0, crashAt = 2;
      const rocket = h('div', { class: 'plane' }, '🚀');
      const sky = h('div', { class: 'sky' },
        h('span', { class: 'cloud c1' }), h('span', { class: 'cloud c2' }), h('span', { class: 'cloud c3' }), rocket);
      const multEl = h('div', { class: 'readout-big' }, '1.00×');
      const status = h('div', { class: 'status' }, 'Launch and eject at the right moment.');
      const action = h('button', { class: 'btn primary big', onclick: () => flying ? eject() : begin() }, 'LAUNCH');

      function begin() {
        if (!stake(bar.api.bet)) return;
        flying = true; mult = 1; t0 = performance.now();
        crashAt = Math.max(1.05, Math.round((0.98 / (1 - Math.random() * 0.98)) * 100) / 100);
        rocket.style.opacity = '1'; action.className = 'btn gold big';
        status.textContent = 'Fuel burning… eject any time!';
        raf = requestAnimationFrame(tick);
      }
      function tick(now) {
        mult = Math.pow(1.085, (now - t0) / 1000);
        if (mult >= crashAt) { mult = crashAt; draw(); return boom(); }
        draw(); raf = requestAnimationFrame(tick);
      }
      function draw() {
        multEl.textContent = mult.toFixed(2) + '×';
        multEl.style.color = mult < 2 ? '#2fe08a' : mult < 5 ? '#ffcb47' : '#ff6ec7';
        const p = Math.min(1, (mult - 1) / 7);
        rocket.style.left = (5 + p * 78) + '%';
        rocket.style.bottom = (8 + p * 62) + '%';
        rocket.style.transform = 'rotate(-45deg) scale(' + (1 + p * .8) + ')';
        if (flying) action.textContent = 'EJECT ' + fmt(bar.api.bet * mult);
      }
      function eject() {
        if (!flying) return; flying = false; cancelAnimationFrame(raf);
        const w = bar.api.bet * mult; payout(w); Sound.win();
        status.textContent = 'Ejected at ' + mult.toFixed(2) + '× → +' + fmt(w) + ' coins!';
        toast('+' + fmt(w), 'good'); reset();
      }
      function boom() {
        flying = false; Sound.lose();
        status.textContent = '💥 Tank exploded at ' + mult.toFixed(2) + '× — lost ' + fmt(bar.api.bet) + '.';
        toast('Boom!', 'bad'); reset();
      }
      function reset() { action.textContent = 'LAUNCH'; action.className = 'btn primary big'; rocket.style.opacity = '.3'; }
      onCleanup(() => cancelAnimationFrame(raf));
      root.append(h('div', { class: 'game-shell' }, sky, multEl, status, action, bar));
    }
  });

  /* ---------- 4. LIMBO ---------- */
  register({
    id: 'limbo', name: 'Limbo', emoji: '🎯', tag: 'Crash',
    desc: 'Pick a target multiplier. Roll above it to win big.',
    mount(root) {
      const bar = betBar();
      let target = 2, busy = false;
      const tEl = h('div', { class: 'readout-big' }, '2.00×');
      const rEl = h('div', { class: 'readout' }, 'roll: —');
      const status = h('div', { class: 'status' }, 'Higher target = bigger payout, lower odds.');
      const presets = h('div', { class: 'seg' },
        ...[1.5, 2, 3, 5, 10, 50].map(v => h('button', {
          class: 'segbtn' + (v === 2 ? ' on' : ''),
          onclick(e) {
            if (busy) return; target = v; tEl.textContent = v.toFixed(2) + '×';
            $$('.segbtn', presets).forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on');
          }
        }, v + '×')));
      const go = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return; if (!stake(bar.api.bet)) return;
          busy = true; go.disabled = true;
          for (let i = 0; i < 12; i++) { rEl.textContent = 'roll: ' + (Math.random() * 20).toFixed(2) + '×'; Sound.tick(); await sleep(60); }
          const roll = Math.max(1.0, 99 / (100 * Math.random()));
          rEl.textContent = 'roll: ' + roll.toFixed(2) + '×';
          if (roll >= target) {
            const w = bar.api.bet * target; payout(w); Sound.big();
            status.textContent = 'WIN! ' + roll.toFixed(2) + '× ≥ ' + target.toFixed(2) + '× → +' + fmt(w) + ' coins';
            toast('+' + fmt(w), 'good');
          } else { Sound.lose(); status.textContent = 'Rolled ' + roll.toFixed(2) + '× — needed ' + target.toFixed(2) + '×'; }
          busy = false; go.disabled = false;
        }
      }, 'ROLL');
      root.append(h('div', { class: 'game-shell' }, tEl, rEl, status, presets, go, bar));
    }
  });

  /* ---------- 5. TOWER ---------- */
  register({
    id: 'tower', name: 'Tower Climb', emoji: '🏰', tag: 'Crash',
    desc: 'One bomb per floor. Climb high and cash out.',
    mount(root) {
      const bar = betBar();
      const FLOORS = 8, SURV = 2 / 3, STEP = 1.48;
      let floor = 0, mult = 1, live = false, bomb = 0;

      const tower = h('div', { class: 'game-shell', style: { padding: '10px', gap: '7px' } });
      const rows = [];
      for (let f = FLOORS - 1; f >= 0; f--) {
        const tiles = [0, 1, 2].map(i => h('button', { class: 'mcell', style: { aspectRatio: 'auto', height: '40px', fontSize: '17px' }, onclick: () => pickTile(f, i) }));
        const row = h('div', { class: 'seg', style: { flexWrap: 'nowrap' } }, h('span', { style: { width: '26px', fontSize: '11px', color: '#8e9bc6' } }, 'F' + (f + 1)), tiles);
        rows.push({ f, tiles }); tower.append(row);
      }
      const multEl = h('div', { class: 'readout-big' }, '1.00×');
      const status = h('div', { class: 'status' }, 'Start climbing from the bottom floor.');
      const start = h('button', { class: 'btn primary', onclick: begin }, 'START');
      const cash = h('button', { class: 'btn gold', onclick: cashout, disabled: true }, 'CASH OUT');

      function begin() {
        if (!stake(bar.api.bet)) return;
        floor = 0; mult = 1; live = true;
        rows.forEach(r => r.tiles.forEach(t => { t.textContent = ''; t.className = 'mcell'; t.style.height = '40px'; }));
        next(); start.disabled = true; cash.disabled = false;
      }
      function next() {
        bomb = ri(0, 2);
        status.textContent = 'Floor ' + (floor + 1) + ' — pick a tile. One hides a bomb.';
      }
      function pickTile(f, i) {
        if (!live || f !== floor) return;
        const t = rows.find(r => r.f === f).tiles[i];
        if (i === bomb) {
          t.textContent = '💥'; t.className = 'mcell boom'; live = false; Sound.lose();
          status.textContent = 'Bomb on floor ' + (f + 1) + '! Lost ' + fmt(bar.api.bet) + ' coins.';
          end(); return;
        }
        t.textContent = '💎'; t.className = 'mcell gem';
        floor++; mult = Math.round(mult * STEP * 100) / 100; Sound.tick();
        multEl.textContent = mult.toFixed(2) + '×';
        cash.textContent = 'CASH OUT ' + fmt(bar.api.bet * mult);
        if (floor >= FLOORS) { status.textContent = 'TOP FLOOR! '; return cashout(); }
        next();
      }
      function cashout() {
        if (!live) return; live = false;
        const w = bar.api.bet * mult; payout(w); Sound.win();
        status.textContent = 'Cashed out at ' + mult.toFixed(2) + '× → +' + fmt(w) + ' coins!';
        toast('+' + fmt(w), 'good'); end();
      }
      function end() { start.disabled = false; start.textContent = 'PLAY AGAIN'; cash.disabled = true; }
      root.append(h('div', { class: 'game-shell' }, tower, multEl, status, h('div', { class: 'row' }, start, cash), bar));
    }
  });

  /* ---------- 6. MINES ---------- */
  register({
    id: 'mines', name: 'Mines', emoji: '💎', tag: 'Crash',
    desc: 'Reveal gems, dodge the mines, cash out before you blow up.',
    mount(root) {
      const bar = betBar();
      let minesCount = 3, mineSet = new Set(), revealed = 0, live = false, mult = 1;

      const grid = h('div', { class: 'mines-grid' });
      const cells = [];
      for (let i = 0; i < 25; i++) {
        const c = h('button', { class: 'mcell', onclick: () => reveal(i) });
        cells.push(c); grid.append(c);
      }
      const multEl = h('div', { class: 'readout-big' }, '1.00×');
      const status = h('div', { class: 'status' }, 'Choose how many mines, then start.');
      const seg = h('div', { class: 'seg' });
      [1, 3, 5, 10, 24].forEach(n => seg.append(h('button', {
        class: 'segbtn' + (n === 3 ? ' on' : ''),
        onclick(e) { if (live) return; minesCount = n; $$('.segbtn', seg).forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); }
      }, n + '💣')));
      const start = h('button', { class: 'btn primary', onclick: begin }, 'START');
      const cash = h('button', { class: 'btn gold', onclick: cashout, disabled: true }, 'CASH OUT');

      const comb = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; };
      const multiplier = k => Math.max(1, Math.round(0.99 * comb(25, k) / comb(25 - minesCount, k) * 100) / 100);

      function begin() {
        if (!stake(bar.api.bet)) return;
        mineSet = new Set(shuffle(Array.from({ length: 25 }, (_, i) => i)).slice(0, minesCount));
        revealed = 0; mult = 1; live = true;
        cells.forEach(c => { c.className = 'mcell'; c.textContent = ''; });
        start.disabled = true; cash.disabled = false; update();
        status.textContent = minesCount + ' mines hidden. Tap a tile.';
      }
      function reveal(i) {
        if (!live || cells[i].classList.contains('open')) return;
        cells[i].classList.add('open');
        if (mineSet.has(i)) {
          live = false; cells[i].classList.add('boom'); cells[i].textContent = '💥';
          mineSet.forEach(m => { if (m !== i) { cells[m].classList.add('open', 'mine'); cells[m].textContent = '💣'; } });
          Sound.lose(); status.textContent = 'BOOM! Lost ' + fmt(bar.api.bet) + ' coins.'; end(); return;
        }
        cells[i].textContent = '💎'; cells[i].classList.add('gem');
        revealed++; mult = multiplier(revealed); Sound.tick(); update();
        if (revealed === 25 - minesCount) { status.textContent = 'CLEARED THE BOARD! '; cashout(); }
      }
      function cashout() {
        if (!live) return; live = false;
        const w = bar.api.bet * mult; payout(w); Sound.win();
        mineSet.forEach(m => { if (!cells[m].classList.contains('open')) { cells[m].classList.add('open', 'mine'); cells[m].textContent = '💣'; } });
        status.textContent = 'Cashed out ' + mult.toFixed(2) + '× → +' + fmt(w) + ' coins.';
        toast('+' + fmt(w), 'good'); end();
      }
      function end() { start.disabled = false; start.textContent = 'PLAY AGAIN'; cash.disabled = true; }
      function update() { multEl.textContent = mult.toFixed(2) + '×'; cash.textContent = 'CASH OUT ' + fmt(bar.api.bet * mult); }
      root.append(h('div', { class: 'game-shell' }, seg, grid, multEl, status, h('div', { class: 'row' }, start, cash), bar));
    }
  });

  /* ---------- 7. PLINKO ---------- */
  register({
    id: 'plinko', name: 'Plinko', emoji: '🔻', tag: 'Crash',
    desc: 'Drop the ball and let the pegs decide your payout.',
    mount(root) {
      const bar = betBar();
      const ROWS = 8, PAY = [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13];
      let busy = false;
      const board = h('div', { class: 'plinko-board' });
      for (let r = 0; r < ROWS; r++) {
        const row = h('div', { class: 'pegrow' });
        for (let i = 0; i <= r; i++) row.append(h('span', { class: 'peg' }));
        board.append(row);
      }
      const slots = h('div', { class: 'plinko-slots' });
      PAY.forEach(p => slots.append(h('div', { class: 'pslot' + (p >= 3 ? ' hi' : p < 1 ? ' lo' : '') }, p + '×')));
      board.append(slots);
      const ball = h('div', { class: 'pball' });
      board.append(ball);
      const status = h('div', { class: 'status' }, 'Press drop and watch the ball bounce.');
      const drop = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return; if (!stake(bar.api.bet)) return;
          busy = true; drop.disabled = true;
          let pos = 0;
          for (let r = 0; r < ROWS; r++) {
            pos += Math.random() < 0.5 ? 0 : 1;
            ball.style.transform = 'translate(' + ((pos - r / 2) * 27) + 'px,' + (r * 34) + 'px)';
            Sound.tick(); await sleep(85);
          }
          const pay = PAY[pos];
          const w = bar.api.bet * pay; payout(w);
          if (pay >= 3) { Sound.big(); status.textContent = 'BIG HIT! ' + pay + '× → +' + fmt(w) + ' coins'; toast('+' + fmt(w), 'good'); }
          else if (pay >= 1) { Sound.win(); status.textContent = 'Landed ' + pay + '× → +' + fmt(w) + ' coins'; }
          else { Sound.lose(); status.textContent = 'Landed ' + pay + '× — small loss'; }
          ball.style.transform = 'translate(0,0)';
          busy = false; drop.disabled = false;
        }
      }, 'DROP BALL');
      root.append(h('div', { class: 'game-shell' }, board, status, drop, bar));
    }
  });

  /* ---------- 8. BALLOON POP ---------- */
  register({
    id: 'balloon', name: 'Balloon Pop', emoji: '🎈', tag: 'Crash',
    desc: 'The balloon inflates and the payout grows. Pop it before it bursts.',
    mount(root) {
      const bar = betBar();
      let live = false, mult = 1, raf = null, t0 = 0, burstAt = 2;
      const balloon = h('div', { class: 'plane', style: { fontSize: '70px', left: '42%', bottom: '18%' } }, '🎈');
      const stage = h('div', { class: 'sky' }, balloon);
      const multEl = h('div', { class: 'readout-big' }, '1.00×');
      const status = h('div', { class: 'status' }, 'Inflate the balloon for a bigger payout.');
      const action = h('button', { class: 'btn primary big', onclick: () => live ? pop() : begin() }, 'INFLATE');

      function begin() {
        if (!stake(bar.api.bet)) return;
        live = true; mult = 1; t0 = performance.now();
        burstAt = Math.max(1.05, Math.round((0.99 / (1 - Math.random() * 0.99)) * 100) / 100);
        action.className = 'btn gold big'; status.textContent = 'Inflating… pop it now!';
        raf = requestAnimationFrame(tick);
      }
      function tick(now) {
        mult = Math.pow(1.05, (now - t0) / 1000);
        if (mult >= burstAt) { mult = burstAt; draw(); return burst(); }
        draw(); raf = requestAnimationFrame(tick);
      }
      function draw() {
        multEl.textContent = mult.toFixed(2) + '×';
        multEl.style.color = mult < 2 ? '#2fe08a' : mult < 5 ? '#ffcb47' : '#ff6ec7';
        const s = 1 + (mult - 1) * 0.35;
        balloon.style.transform = 'scale(' + Math.min(s, 2.4) + ')';
        if (live) action.textContent = 'POP ' + fmt(bar.api.bet * mult);
      }
      function pop() {
        if (!live) return; live = false; cancelAnimationFrame(raf);
        const w = bar.api.bet * mult; payout(w); Sound.win();
        status.textContent = 'Popped at ' + mult.toFixed(2) + '× → +' + fmt(w) + ' coins!';
        toast('+' + fmt(w), 'good'); reset();
      }
      function burst() {
        live = false; Sound.lose();
        status.textContent = '💥 Burst at ' + mult.toFixed(2) + '× — lost ' + fmt(bar.api.bet) + ' coins.';
        toast('Burst!', 'bad'); reset();
      }
      function reset() { action.textContent = 'INFLATE'; action.className = 'btn primary big'; balloon.style.transform = 'scale(1)'; }
      onCleanup(() => cancelAnimationFrame(raf));
      root.append(h('div', { class: 'game-shell' }, stage, multEl, status, action, bar));
    }
  });
})();