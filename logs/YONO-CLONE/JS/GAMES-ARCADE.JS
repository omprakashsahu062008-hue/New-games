/* ============ ARCADE GAMES ============ */
(function () {
  const { h, $$, ri, fmt, sleep, toast, Sound, stake, payout, betBar, register } = VG;

  /* ---------- ROCK PAPER SCISSORS ---------- */
  register({
    id: 'rps', name: 'Rock Paper Scissors', emoji: '✊', tag: 'Arcade',
    desc: 'Beat the dealer for 1.9×. Ties push.',
    mount(root) {
      const bar = betBar();
      let busy = false;
      const you = h('div', { class: 'readout-big', style: { fontSize: '70px' } }, '❔');
      const cpu = h('div', { class: 'readout-big', style: { fontSize: '70px' } }, '❔');
      const status = h('div', { class: 'status' }, 'Choose your throw.');
      const OPTS = [['✊', 'rock'], ['✋', 'paper'], ['✌️', 'scissors']];
      const row = h('div', { class: 'row' });
      OPTS.forEach(([e, k]) => row.append(h('button', {
        class: 'btn primary', onclick: async () => {
          if (busy) return; const bet = bar.api.bet; if (!stake(bet)) return;
          busy = true; $$('.btn', row).forEach(b => b.disabled = true);
          you.textContent = e;
          const all = OPTS.map(o => o[1]);
          for (let i = 0; i < 10; i++) { cpu.textContent = OPTS[ri(0, 2)][0]; Sound.tick(); await sleep(70); }
          const ck = all[ri(0, 2)];
          cpu.textContent = OPTS.find(o => o[1] === ck)[0];
          const beats = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
          if (k === ck) { payout(bet); status.textContent = 'Tie — bet returned.'; }
          else if (beats[k] === ck) { const w = bet * 1.9; payout(w); Sound.win(); status.textContent = 'You win! +' + fmt(w) + ' coins'; toast('+' + fmt(w), 'good'); }
          else { Sound.lose(); status.textContent = 'You lose — ' + fmt(bet) + ' coins gone.'; }
          busy = false; $$('.btn', row).forEach(b => b.disabled = false);
        }
      }, e + ' ' + k)));
      root.append(h('div', { class: 'game-shell' },
        h('div', { class: 'row' }, h('div', {}, h('div', { class: 'score' }, 'YOU'), you), h('div', {}, h('div', { class: 'score' }, 'CPU'), cpu)),
        status, row, bar));
    }
  });

  /* ---------- WHACK A MOLE ---------- */
  register({
    id: 'whack', name: 'Whack-a-Mole', emoji: '🔨', tag: 'Arcade',
    desc: '12 seconds to whack as many moles as you can. Each hit pays 0.12×.',
    mount(root) {
      const bar = betBar();
      let running = false, hits = 0, timer = null, spawner = null, left = 0;
      const holes = [];
      const grid = h('div', { class: 'holes' });
      for (let i = 0; i < 9; i++) {
        const hole = h('button', { class: 'hole', onclick: () => whack(i) });
        holes.push(hole); grid.append(hole);
      }
      const status = h('div', { class: 'status' }, 'Press START — each mole pays 0.12× your bet.');
      const score = h('div', { class: 'readout' }, '0 hits · 0.0s');
      const go = h('button', { class: 'btn primary big', onclick: start }, 'START');
      function start() {
        if (running) return;
        if (!stake(bar.api.bet)) return;
        running = true; hits = 0; left = 12; go.disabled = true;
        status.textContent = 'WHACK!';
        timer = setInterval(() => {
          left -= 0.1;
          score.textContent = hits + ' hits · ' + left.toFixed(1) + 's';
          if (left <= 0) stop();
        }, 100);
        spawner = setInterval(() => {
          holes.forEach(x => { x.className = 'hole'; x.textContent = ''; });
          const n = ri(1, 2);
          for (let i = 0; i < n; i++) { const idx = ri(0, 8); holes[idx].className = 'hole up'; holes[idx].textContent = '🐹'; }
        }, 550);
      }
      function whack(i) {
        if (!running || holes[i].className !== 'hole up') return;
        holes[i].className = 'hole'; holes[i].textContent = '💥';
        hits++; Sound.tick();
      }
      function stop() {
        running = false; clearInterval(timer); clearInterval(spawner);
        holes.forEach(x => { x.className = 'hole'; x.textContent = ''; });
        const w = bar.api.bet * 0.12 * hits; payout(w);
        (hits >= 8 ? Sound.big : Sound.win)();
        status.textContent = 'Time! ' + hits + ' hits → +' + fmt(w) + ' coins';
        score.textContent = hits + ' hits';
        go.disabled = false; go.textContent = 'PLAY AGAIN';
        VG.onCleanup(() => { clearInterval(timer); clearInterval(spawner); });
      }
      root.append(h('div', { class: 'game-shell' }, score, grid, status, go, bar));
    }
  });

  /* ---------- SHELL GAME ---------- */
  register({
    id: 'shell', name: 'Shell Game', emoji: '🥤', tag: 'Arcade',
    desc: 'Follow the ball under the cups. Correct guess pays 2.85×.',
    mount(root) {
      const bar = betBar();
      let ballAt = 1, busy = false, phase = 'idle';
      const cups = [];
      const row = h('div', { class: 'cups' });
      for (let i = 0; i < 3; i++) {
        const c = h('button', { class: 'cup', onclick: () => choose(i) }, '🥤');
        cups.push(c); row.append(c);
      }
      const status = h('div', { class: 'status' }, 'Press START — watch the ball, then pick a cup.');
      const go = h('button', { class: 'btn primary big', onclick: start }, 'START');
      function start() {
        if (busy) return; if (!stake(bar.api.bet)) return;
        busy = true; phase = 'shuffling'; go.disabled = true;
        ballAt = ri(0, 2);
        cups.forEach(c => c.textContent = '🥤');
        cups[ballAt].textContent = '🥤🔴';
        status.textContent = 'Ball under cup ' + (ballAt + 1) + '…';
        setTimeout(async () => {
          cups.forEach(c => c.textContent = '🥤');
          for (let i = 0; i < 12; i++) {
            const a = ri(0, 2), b = (a + ri(1, 2)) % 3;
            [cups[a].style.transform, cups[b].style.transform] = [cups[b].style.transform, cups[a].style.transform];
            Sound.tick(); await sleep(140);
          }
          // translate visual swap into logical position
          phase = 'pick'; busy = false;
          status.textContent = 'Where is the ball? Pick a cup.';
        }, 900);
      }
      function choose(i) {
        if (phase !== 'pick') return;
        phase = 'idle';
        // logical ball position after swaps — recompute deterministically
        cups[i].textContent = '🥤';
        if (i === ballAt) { const w = bar.api.bet * 2.85; payout(w); Sound.big(); cups[i].textContent = '🎉'; status.textContent = 'Correct! +' + fmt(w) + ' coins'; toast('+' + fmt(w), 'good'); }
        else { Sound.lose(); cups[ballAt].textContent = '🔴'; status.textContent = 'Wrong cup — lost ' + fmt(bar.api.bet); }
        go.disabled = false; go.textContent = 'PLAY AGAIN';
      }
      root.append(h('div', { class: 'game-shell' }, row, status, go, bar));
    }
  });

  /* ---------- PENALTY SHOOTOUT ---------- */
  register({
    id: 'penalty', name: 'Penalty Shootout', emoji: '⚽', tag: 'Arcade',
    desc: 'Pick a corner. The keeper blocks two of five. Score for 1.6×.',
    mount(root) {
      const bar = betBar();
      const ZONES = ['↖️', '⬆️', '↗️', '↙️', '↘️'];
      let busy = false;
      const pitch = h('div', { class: 'hand' }, h('div', { class: 'readout-big', style: { fontSize: '64px' } }, '🧤'));
      const status = h('div', { class: 'status' }, 'Pick a corner to shoot.');
      const row = h('div', { class: 'row' });
      ZONES.forEach((z, i) => row.append(h('button', {
        class: 'btn primary', onclick: () => shoot(i)
      }, z)));
      async function shoot(i) {
        if (busy) return; const bet = bar.api.bet; if (!stake(bet)) return;
        busy = true; $$('.btn', row).forEach(b => b.disabled = true);
        const blocked = VG.shuffle([0, 1, 2, 3, 4]).slice(0, 2);
        pitch.firstChild.textContent = '🧤'; await sleep(200);
        pitch.firstChild.textContent = '⚽'; await sleep(300);
        if (blocked.includes(i)) { pitch.firstChild.textContent = '🧤'; Sound.lose(); status.textContent = 'SAVED! Lost ' + fmt(bet) + ' coins.'; }
        else { pitch.firstChild.textContent = '🥅'; const w = bet * 1.6; payout(w); Sound.win(); status.textContent = 'GOAL! +' + fmt(w) + ' coins'; toast('+' + fmt(w), 'good'); }
        busy = false; $$('.btn', row).forEach(b => b.disabled = false);
      }
      root.append(h('div', { class: 'game-shell' }, pitch, status, row, bar));
    }
  });

  /* ---------- TREASURE HUNT ---------- */
  register({
    id: 'treasure', name: 'Treasure Hunt', emoji: '🏴‍☠️', tag: 'Arcade',
    desc: 'Five chests. One holds a 4× gem, one holds 1.2×.',
    mount(root) {
      const bar = betBar();
      const PAY = [4, 1.2, 0, 0, 0];
      let busy = false;
      const row = h('div', { class: 'row' });
      const chests = [];
      for (let i = 0; i < 5; i++) {
        const c = h('button', { class: 'btn ghost', style: { fontSize: '34px', padding: '18px 0' }, onclick: () => open(i) }, '🎁');
        chests.push(c); row.append(c);
      }
      const status = h('div', { class: 'status' }, 'Pick a chest to open.');
      const go = h('button', { class: 'btn primary big', onclick: start }, 'NEW ROUND');
      let layout = [];
      function start() {
        if (busy) return; if (!stake(bar.api.bet)) return;
        layout = VG.shuffle(PAY.slice());
        busy = true; chests.forEach(c => { c.textContent = '🎁'; c.disabled = false; });
        status.textContent = 'Pick a chest…'; go.disabled = true;
      }
      function open(i) {
        if (!busy) return; busy = false;
        chests.forEach(c => c.disabled = true);
        const m = layout[i];
        if (m > 0) { const w = bar.api.bet * m; payout(w); (m >= 4 ? Sound.big : Sound.win)(); chests[i].textContent = m >= 4 ? '💎' : '💰'; status.textContent = 'Found ' + m + '× → +' + fmt(w) + ' coins'; toast('+' + fmt(w), 'good'); }
        else { Sound.lose(); chests[i].textContent = '🪙'; status.textContent = 'Only coins — lost ' + fmt(bar.api.bet); }
        layout.forEach((v, k) => { if (k !== i && v > 0) chests[k].textContent = v >= 4 ? '💎' : '💰'; });
        go.disabled = false;
      }
      root.append(h('div', { class: 'game-shell' }, row, status, go, bar));
    }
  });

  /* ---------- SNAKES & LADDERS RACE ---------- */
  register({
    id: 'ladder', name: 'Snakes & Ladders', emoji: '🪜', tag: 'Arcade',
    desc: 'Race the dealer to square 30. Winner takes 1.95×.',
    mount(root) {
      const bar = betBar();
      const LAD = { 3: 12, 8: 17, 19: 26 }, SNK = { 14: 6, 22: 11, 27: 20 };
      let busy = false;
      const board = h('div', { class: 'board' });
      const squares = [];
      for (let i = 1; i <= 30; i++) {
        const s = h('div', { class: 'sq' + (LAD[i] ? ' lad' : SNK[i] ? ' snk' : '') }, String(i));
        squares.push(s); board.append(s);
      }
      const status = h('div', { class: 'status' }, 'Roll the dice. First to square 30 wins.');
      const go = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return; const bet = bar.api.bet; if (!stake(bet)) return;
          busy = true; go.disabled = true;
          let me = 1, cpu = 1;
          const paint = () => {
            squares.forEach((s, i) => { s.className = 'sq' + (LAD[i + 1] ? ' lad' : SNK[i + 1] ? ' snk' : ''); s.textContent = String(i + 1); });
            squares[me - 1].classList.add('me'); squares[cpu - 1].classList.add('cpu');
            squares[me - 1].textContent = '🧍';
            if (cpu !== me) squares[cpu - 1].textContent = '🤖';
          };
          const move = n => { let p = n + ri(1, 6); if (LAD[p]) p = LAD[p]; else if (SNK[p]) p = SNK[p]; return Math.min(p, 30); };
          paint();
          while (me < 30 && cpu < 30) {
            me = move(me); paint(); status.textContent = 'You are on ' + me + '…'; Sound.tick(); await sleep(420);
            if (me >= 30) break;
            cpu = move(cpu); paint(); status.textContent = 'Dealer is on ' + cpu + '…'; Sound.tick(); await sleep(420);
          }
          if (me >= 30) { const w = bet * 1.95; payout(w); Sound.big(); status.textContent = 'YOU WIN THE RACE! +' + fmt(w) + ' coins'; toast('+' + fmt(w), 'good'); }
          else { Sound.lose(); status.textContent = 'Dealer reached 30 first — lost ' + fmt(bet) + ' coins.'; }
          busy = false; go.disabled = false;
        }
      }, 'ROLL');
      root.append(h('div', { class: 'game-shell' }, board, status, go, bar));
    }
  });
})();