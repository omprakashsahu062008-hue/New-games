/* ============ CARD GAMES ============ */
(function () {
  const { h, fmt, sleep, toast, Sound, stake, payout, betBar, register, cards } = VG;
  const { newDeck, cardEl, rv, isRed } = cards;

  /* ---------- HI-LO ---------- */
  register({
    id: 'hilo', name: 'Hi-Lo', emoji: '⬆️', tag: 'Cards',
    desc: 'Guess whether the next card is higher or lower.',
    mount(root) {
      const bar = betBar();
      let cur = null, live = false;
      const row = h('div', { class: 'hand' });
      const status = h('div', { class: 'status' }, 'Press DEAL to draw the first card.');
      const hi = h('button', { class: 'btn gold', onclick: () => guess('hi'), disabled: true }, 'HIGHER');
      const lo = h('button', { class: 'btn gold', onclick: () => guess('lo'), disabled: true }, 'LOWER');
      const deal = h('button', { class: 'btn primary', onclick: start }, 'DEAL');
      function start() {
        if (!stake(bar.api.bet)) return;
        cur = newDeck()[0]; live = true;
        row.innerHTML = ''; row.append(cardEl(cur));
        hi.disabled = false; lo.disabled = false; deal.disabled = true;
        status.textContent = 'Card is ' + cur.r + '. Higher or lower?';
      }
      function guess(dir) {
        if (!live) return;
        const next = newDeck()[0];
        row.append(cardEl(next));
        const a = rv(cur.r), b = rv(next.r);
        const win = dir === 'hi' ? b > a : b < a;
        const tie = a === b;
        if (tie) { payout(bar.api.bet); status.textContent = 'Tie card — bet returned.'; }
        else if (win) { const w = bar.api.bet * 1.9; payout(w); Sound.win(); status.textContent = 'Correct! +' + fmt(w) + ' coins'; toast('+' + fmt(w), 'good'); }
        else { Sound.lose(); status.textContent = 'Wrong — lost ' + fmt(bar.api.bet) + ' coins.'; }
        live = false; hi.disabled = true; lo.disabled = true; deal.disabled = false; deal.textContent = 'DEAL AGAIN';
      }
      root.append(h('div', { class: 'game-shell' }, row, status, h('div', { class: 'row' }, deal, hi, lo), bar));
    }
  });

  /* ---------- CARD WAR ---------- */
  register({
    id: 'war', name: 'Card War', emoji: '⚔️', tag: 'Cards',
    desc: 'Highest card takes the pot. Ties push.',
    mount(root) {
      const bar = betBar();
      let busy = false;
      const youRow = h('div', { class: 'hand' }), cpuRow = h('div', { class: 'hand' });
      const status = h('div', { class: 'status' }, 'Deal to battle the dealer.');
      const go = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return; const bet = bar.api.bet; if (!stake(bet)) return;
          busy = true; go.disabled = true;
          const d = newDeck(), a = d.pop(), b = d.pop();
          youRow.innerHTML = ''; cpuRow.innerHTML = '';
          cpuRow.append(cardEl(b, true)); youRow.append(cardEl(a, true));
          await sleep(350);
          cpuRow.innerHTML = ''; youRow.innerHTML = '';
          cpuRow.append(cardEl(b)); youRow.append(cardEl(a));
          const va = rv(a.r), vb = rv(b.r);
          if (va > vb) { const w = bet * 1.9; payout(w); Sound.win(); status.textContent = 'You win the war! +' + fmt(w); }
          else if (va === vb) { payout(bet); status.textContent = 'Tie — bet returned.'; }
          else { Sound.lose(); status.textContent = 'Dealer wins — lost ' + fmt(bet); }
          busy = false; go.disabled = false;
        }
      }, 'DEAL');
      root.append(h('div', { class: 'game-shell' },
        h('div', { class: 'score' }, 'DEALER'), cpuRow,
        h('div', { class: 'score' }, 'YOU'), youRow, status, go, bar));
    }
  });

  /* ---------- COLOUR PREDICT ---------- */
  register({
    id: 'colour-predict', name: 'Colour Predict', emoji: '🎨', tag: 'Cards',
    desc: 'Predict the colour or the suit of the next card.',
    mount(root) {
      const bar = betBar();
      let mode = 'colour', busy = false;
      const row = h('div', { class: 'hand' }, h('div', { class: 'pcard back' }, h('span', {}, '?')));
      const status = h('div', { class: 'status' }, 'Pick your prediction.');
      const seg = h('div', { class: 'seg' });
      [['colour', 'Colour 1.95×'], ['suit', 'Suit 3.7×']].forEach(([k, l]) =>
        seg.append(h('button', {
          class: 'segbtn' + (k === 'colour' ? ' on' : ''),
          onclick(e) { if (busy) return; mode = k; $$('.segbtn', seg).forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); }
        }, l)));
      const picks = h('div', { class: 'seg' });
      const render = () => {
        picks.innerHTML = '';
        const opts = mode === 'colour' ? [['red', '🔴 Red'], ['black', '⚫ Black']] : [['♠', '♠ Spades'], ['♥', '♥ Hearts'], ['♦', '♦ Diamonds'], ['♣', '♣ Clubs']];
        opts.forEach(([k, l]) => picks.append(h('button', {
          class: 'segbtn', onclick(e) { pick = k; $$('.segbtn', picks).forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); }
        }, l)));
      };
      let pick = 'red';
      render();
      const go = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return; const bet = bar.api.bet; if (!stake(bet)) return;
          busy = true; go.disabled = true;
          const c = newDeck()[0];
          row.innerHTML = ''; row.append(cardEl(c, true)); await sleep(300);
          row.innerHTML = ''; row.append(cardEl(c));
          let win = 0;
          if (mode === 'colour' && ((pick === 'red') === isRed(c))) win = bet * 1.95;
          if (mode === 'suit' && pick === c.s) win = bet * 3.7;
          if (win > 0) { payout(win); Sound.big(); status.textContent = c.r + c.s + ' — WIN +' + fmt(win); }
          else { Sound.lose(); status.textContent = c.r + c.s + ' — lost ' + fmt(bet); }
          busy = false; go.disabled = false;
        }
      }, 'REVEAL');
      root.append(h('div', { class: 'game-shell' }, row, status, seg, picks, go, bar));
    }
  });

  /* ---------- MEMORY MATCH ---------- */
  register({
    id: 'memory', name: 'Memory Match', emoji: '🧠', tag: 'Cards',
    desc: 'Flip pairs. Every match pays instantly.',
    mount(root) {
      const bar = betBar();
      const SYM = ['🍒','🍋','🍇','🔔','⭐','💎'];
      let deck = [], first = null, busy = false, live = false, matched = 0;
      const grid = h('div', { class: 'scratch-grid' });
      const cells = [];
      for (let i = 0; i < 12; i++) {
        const c = h('button', { class: 'scell', onclick: () => flip(i) });
        cells.push(c); grid.append(c);
      }
      const status = h('div', { class: 'status' }, 'Press START — each match pays 0.35× your bet.');
      const start = h('button', { class: 'btn primary big', onclick: begin }, 'START');
      function begin() {
        if (!stake(bar.api.bet)) return;
        deck = VG.shuffle(SYM.concat(SYM));
        cells.forEach(c => { c.textContent = ''; c.className = 'scell'; });
        first = null; matched = 0; busy = false; live = true;
        status.textContent = 'Find all 6 pairs.';
      }
      async function flip(i) {
        if (!live || busy || cells[i].classList.contains('open')) return;
        cells[i].textContent = deck[i]; cells[i].classList.add('open');
        Sound.click();
        if (first === null) { first = i; return; }
        if (first === i) return;
        busy = true;
        const a = first, b = i; first = null;
        if (deck[a] === deck[b]) {
          cells[a].classList.add('hit'); cells[b].classList.add('hit');
          matched++; const w = bar.api.bet * 0.35; payout(w); Sound.win();
          status.textContent = 'Match! +' + fmt(w) + ' coins (' + matched + '/6)';
          busy = false;
          if (matched === 6) { const bonus = bar.api.bet * 0.4; payout(bonus); Sound.big(); status.textContent = 'BOARD CLEARED! +' + fmt(bar.api.bet * 2.5) + ' coins total'; live = false; }
        } else {
          await sleep(620);
          cells[a].textContent = ''; cells[b].textContent = '';
          cells[a].classList.remove('open'); cells[b].classList.remove('open');
          busy = false;
        }
      }
      root.append(h('div', { class: 'game-shell' }, grid, status, start, bar));
    }
  });

  /* ---------- LUCKY 7 ---------- */
  register({
    id: 'lucky7', name: 'Lucky 7', emoji: '7️⃣', tag: 'Cards',
    desc: 'Roll two dice and bet on the total. Seven pays 5×.',
    mount(root) {
      const bar = betBar();
      let target = 7, busy = false;
      const dice = h('div', { class: 'hand' }, h('span', {}, '⚀'), h('span', {}, '⚀'));
      const status = h('div', { class: 'status' }, 'Pick a total and roll.');
      const seg = h('div', { class: 'seg' });
      const PAY = { 2: 30, 3: 15, 4: 10, 5: 7, 6: 6, 7: 5, 8: 6, 9: 7, 10: 10, 11: 15, 12: 30 };
      for (let n = 2; n <= 12; n++) seg.append(h('button', {
        class: 'segbtn' + (n === 7 ? ' on' : ''),
        onclick(e) { if (busy) return; target = n; $$('.segbtn', seg).forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); }
      }, n));
      const go = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return; const bet = bar.api.bet; if (!stake(bet)) return;
          busy = true; go.disabled = true;
          for (let i = 0; i < 12; i++) { dice.textContent = ''; dice.append(h('span', {}, ['⚀','⚁','⚂','⚃','⚄','⚅'][VG.ri(0,5)]), h('span', {}, ['⚀','⚁','⚂','⚃','⚄','⚅'][VG.ri(0,5)])); Sound.tick(); await sleep(60); }
          const a = VG.ri(1,6), b = VG.ri(1,6), total = a + b;
          dice.innerHTML = ''; dice.append(h('span', {}, ['⚀','⚁','⚂','⚃','⚄','⚅'][a-1]), h('span', {}, ['⚀','⚁','⚂','⚃','⚄','⚅'][b-1]));
          if (total === target) { const w = bet * PAY[target]; payout(w); Sound.big(); status.textContent = total + '! Paid ' + PAY[target] + '× → +' + fmt(w); toast('+' + fmt(w), 'good'); }
          else { Sound.lose(); status.textContent = 'Rolled ' + total + ' — lost ' + fmt(bet); }
          busy = false; go.disabled = false;
        }
      }, 'ROLL');
      root.append(h('div', { class: 'game-shell' }, dice, status, seg, go, bar));
    }
  });

  /* ---------- COLOUR STREAK ---------- */
  register({
    id: 'streak', name: 'Colour Streak', emoji: '🔥', tag: 'Cards',
    desc: 'Guess red or black repeatedly. The multiplier stacks — cash out any time.',
    mount(root) {
      const bar = betBar();
      let mult = 1, live = false;
      const row = h('div', { class: 'hand' });
      const multEl = h('div', { class: 'readout-big' }, '1.00×');
      const status = h('div', { class: 'status' }, 'Press START, then guess the next card colour.');
      const start = h('button', { class: 'btn primary', onclick: begin }, 'START');
      const red = h('button', { class: 'btn gold', onclick: () => guess(true), disabled: true }, '🔴 RED');
      const blk = h('button', { class: 'btn ghost', onclick: () => guess(false), disabled: true }, '⚫ BLACK');
      const cash = h('button', { class: 'btn primary', onclick: cashout, disabled: true }, 'CASH OUT');
      function begin() {
        if (!stake(bar.api.bet)) return;
        mult = 1; live = true; row.innerHTML = '';
        start.disabled = true; red.disabled = false; blk.disabled = false; cash.disabled = false;
        multEl.textContent = '1.00×'; status.textContent = 'Streak 0 — guess the colour.';
      }
      function guess(isRedPick) {
        if (!live) return;
        const c = newDeck()[0];
        row.append(cardEl(c));
        if (isRed(c) === isRedPick) {
          mult = Math.round(mult * 1.94 * 100) / 100;
          multEl.textContent = mult.toFixed(2) + '×';
          cash.textContent = 'CASH OUT ' + fmt(bar.api.bet * mult);
          Sound.tick(); status.textContent = 'Correct! Multiplier now ' + mult.toFixed(2) + '×';
        } else {
          live = false; Sound.lose();
          status.textContent = 'Bust — lost ' + fmt(bar.api.bet) + ' coins.';
          red.disabled = true; blk.disabled = true; cash.disabled = true; start.disabled = false; start.textContent = 'PLAY AGAIN';
        }
      }
      function cashout() {
        if (!live) return; live = false;
        const w = bar.api.bet * mult; payout(w); Sound.big();
        status.textContent = 'Cashed out at ' + mult.toFixed(2) + '× → +' + fmt(w) + ' coins!';
        toast('+' + fmt(w), 'good');
        red.disabled = true; blk.disabled = true; cash.disabled = true; start.disabled = false; start.textContent = 'PLAY AGAIN';
      }
      root.append(h('div', { class: 'game-shell' }, multEl, row, status, h('div', { class: 'row' }, start, red, blk, cash), bar));
    }
  });
})();