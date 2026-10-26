/* ============ TABLE GAMES ============ */
(function () {
  const { h, $$, ri, fmt, sleep, toast, Sound, stake, payout, betBar, register, cards } = VG;
  const { newDeck, cardEl, bj, rv } = cards;

  /* ---------- ROULETTE ---------- */
  register({
    id: 'roulette', name: 'European Roulette', emoji: '🎡', tag: 'Table',
    desc: 'Bet red, black, odd, even, low, high, zero or a straight number.',
    mount(root) {
      const bar = betBar();
      const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
      let type = 'red', num = 7, busy = false, rot = 0;
      const wheel = h('div', { class: 'wheel' }, h('div', { class: 'wheel-hub' }, '★'));
      const out = h('div', { class: 'readout-big' }, '—');
      const status = h('div', { class: 'status' }, 'Pick a bet and spin.');
      const seg = h('div', { class: 'seg' });
      [['red','🔴 Red'],['black','⚫ Black'],['odd','Odd'],['even','Even'],['low','1–18'],['high','19–36'],['zero','🟢 Zero'],['straight','Number']]
        .forEach(([k, l]) => seg.append(h('button', {
          class: 'segbtn' + (k === 'red' ? ' on' : ''),
          onclick(e) {
            if (busy) return; type = k;
            $$('.segbtn', seg).forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on');
            numRow.style.display = k === 'straight' ? 'flex' : 'none';
          }
        }, l)));
      const numInput = h('input', { class: 'numin', type: 'number', min: 0, max: 36, value: 7, oninput(e) { num = Math.max(0, Math.min(36, parseInt(e.target.value || 0, 10))); } });
      const numRow = h('div', { class: 'numrow', style: { display: 'none' } }, 'Straight number:', numInput);

      const spin = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return; const bet = bar.api.bet; if (!stake(bet)) return;
          busy = true; spin.disabled = true; status.textContent = 'Spinning…';
          const n = ri(0, 36);
          rot += 1440 + (n / 37) * 360;
          wheel.style.transition = 'transform 2.6s cubic-bezier(.15,.9,.25,1)';
          wheel.style.transform = 'rotate(' + rot + 'deg)';
          Sound.tick(); await sleep(2700);
          out.textContent = n + (n === 0 ? ' 🟢' : RED.has(n) ? ' 🔴' : ' ⚫');
          out.style.color = n === 0 ? '#2fe08a' : RED.has(n) ? '#ff5c7a' : '#c9d4ff';
          let win = 0;
          if (type === 'red' && RED.has(n)) win = bet * 1.95;
          else if (type === 'black' && n !== 0 && !RED.has(n)) win = bet * 2.3;
          else if (type === 'odd' && n % 2 === 1) win = bet * 1.95;
          else if (type === 'even' && n !== 0 && n % 2 === 0) win = bet * 1.95;
          else if (type === 'low' && n >= 1 && n <= 18) win = bet * 1.95;
          else if (type === 'high' && n >= 19) win = bet * 1.95;
          else if (type === 'zero' && n === 0) win = bet * 11;
          else if (type === 'straight' && n === num) win = bet * 35;
          if (win > 0) { payout(win); Sound.big(); status.textContent = 'WINNER! +' + fmt(win) + ' coins'; toast('+' + fmt(win), 'good'); }
          else { Sound.lose(); status.textContent = 'No luck — lost ' + fmt(bet) + ' coins.'; }
          busy = false; spin.disabled = false;
        }
      }, 'SPIN');
      root.append(h('div', { class: 'game-shell' }, h('div', { class: 'wheel-wrap' }, wheel), out, status, seg, numRow, spin, bar));
    }
  });

  /* ---------- BLACKJACK ---------- */
  register({
    id: 'blackjack', name: 'Blackjack', emoji: '🃏', tag: 'Table',
    desc: 'Beat the dealer to 21 without going bust.',
    mount(root) {
      const bar = betBar();
      let deck = [], you = [], cpu = [], live = false, doubled = false;
      const youRow = h('div', { class: 'hand' }), cpuRow = h('div', { class: 'hand' });
      const youS = h('div', { class: 'score' }, '—'), cpuS = h('div', { class: 'score' }, '—');
      const status = h('div', { class: 'status' }, 'Press DEAL to start a hand.');
      const deal  = h('button', { class: 'btn primary', onclick: start }, 'DEAL');
      const hit   = h('button', { class: 'btn gold', onclick: () => act('hit'), disabled: true }, 'HIT');
      const stand = h('button', { class: 'btn ghost', onclick: () => act('stand'), disabled: true }, 'STAND');
      const dbl   = h('button', { class: 'btn ghost', onclick: () => act('double'), disabled: true }, 'DOUBLE');

      function paint() {
        youRow.innerHTML = ''; cpuRow.innerHTML = '';
        you.forEach(c => youRow.append(cardEl(c)));
        cpu.forEach((c, i) => cpuRow.append(cardEl(c, i > 0 && live)));
        youS.textContent = you.length ? 'You: ' + bj(you) : '—';
        cpuS.textContent = cpu.length ? 'Dealer: ' + (live ? rv(cpu[0].r) : bj(cpu)) : '—';
      }
      function start() {
        const bet = bar.api.bet; if (!stake(bet)) return;
        deck = newDeck(); you = [deck.pop(), deck.pop()]; cpu = [deck.pop(), deck.pop()];
        live = true; doubled = false;
        hit.disabled = false; stand.disabled = false; dbl.disabled = false; deal.disabled = true;
        status.textContent = 'Hit or stand?';
        paint();
        if (bj(you) === 21) finish();
      }
      function act(a) {
        if (!live) return;
        if (a === 'hit') { you.push(deck.pop()); paint(); if (bj(you) > 21) return finish(); }
        if (a === 'double') { if (!stake(bar.api.bet)) return; doubled = true; you.push(deck.pop()); paint(); return finish(); }
        if (a === 'stand') finish();
      }
      function finish() {
        live = false; hit.disabled = true; stand.disabled = true; dbl.disabled = true;
        while (bj(cpu) < 17) cpu.push(deck.pop());
        paint();
        const p = bj(you), d = bj(cpu), bet = bar.api.bet * (doubled ? 2 : 1);
        if (p > 21) { Sound.lose(); status.textContent = 'Bust with ' + p + ' — lost ' + fmt(bet) + ' coins.'; }
        else if (d > 21 || p > d) { const w = bet * 1.95; payout(w); Sound.big(); status.textContent = 'You win ' + p + ' vs ' + d + ' → +' + fmt(w) + ' coins'; toast('+' + fmt(w), 'good'); }
        else if (p === d) { payout(bet); status.textContent = 'Push at ' + p + ' — bet returned.'; }
        else { Sound.lose(); status.textContent = 'Dealer wins ' + d + ' vs ' + p + ' — lost ' + fmt(bet) + ' coins.'; }
        deal.disabled = false; deal.textContent = 'DEAL AGAIN';
      }
      paint();
      root.append(h('div', { class: 'game-shell' },
        h('div', {}, h('div', { class: 'score' }, 'DEALER'), cpuRow, cpuS),
        h('div', {}, h('div', { class: 'score' }, 'YOU'), youRow, youS),
        status, h('div', { class: 'row' }, deal, hit, stand, dbl), bar));
    }
  });

  /* ---------- BACCARAT ---------- */
  register({
    id: 'baccarat', name: 'Baccarat', emoji: '👑', tag: 'Table',
    desc: 'Bet on Player, Banker or Tie. Closest to 9 wins.',
    mount(root) {
      const bar = betBar();
      let side = 'player', busy = false;
      const pRow = h('div', { class: 'hand' }), bRow = h('div', { class: 'hand' });
      const pS = h('div', { class: 'score' }, '—'), bS = h('div', { class: 'score' }, '—');
      const status = h('div', { class: 'status' }, 'Choose a side and deal.');
      const val = cs => cs.reduce((a, c) => a + (rv(c.r) > 9 ? 0 : rv(c.r)), 0) % 10;
      const seg = h('div', { class: 'seg' });
      [['player', 'Player 1.9×'], ['banker', 'Banker 1.9×'], ['tie', 'Tie 8×']].forEach(([k, l]) =>
        seg.append(h('button', {
          class: 'segbtn' + (k === 'player' ? ' on' : ''),
          onclick(e) { if (busy) return; side = k; $$('.segbtn', seg).forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); }
        }, l)));
      const go = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return; const bet = bar.api.bet; if (!stake(bet)) return;
          busy = true; go.disabled = true;
          const d = newDeck();
          let p = [d.pop(), d.pop()], b = [d.pop(), d.pop()];
          pRow.innerHTML = ''; bRow.innerHTML = '';
          p.forEach(c => pRow.append(cardEl(c))); b.forEach(c => bRow.append(cardEl(c)));
          pS.textContent = 'Player: ' + val(p); bS.textContent = 'Banker: ' + val(b);
          Sound.tick(); await sleep(500);
          if (val(p) <= 5 && val(p) !== 8 && val(p) !== 9) { p.push(d.pop()); pRow.append(cardEl(p[2])); pS.textContent = 'Player: ' + val(p); await sleep(400); }
          if (val(b) <= 5 && val(b) !== 8 && val(b) !== 9) { b.push(d.pop()); bRow.append(cardEl(b[2])); bS.textContent = 'Banker: ' + val(b); await sleep(400); }
          const P = val(p), B = val(b);
          const winner = P > B ? 'player' : B > P ? 'banker' : 'tie';
          if (winner === 'tie' && side === 'tie') { const w = bet * 8; payout(w); Sound.big(); status.textContent = 'TIE! +' + fmt(w); }
          else if (winner === side) { const w = bet * 1.9; payout(w); Sound.win(); status.textContent = side.toUpperCase() + ' wins ' + (side === 'player' ? P : B) + ' — +' + fmt(w); }
          else if (winner === 'tie') { payout(bet); status.textContent = 'Tie — bet returned.'; }
          else { Sound.lose(); status.textContent = winner.toUpperCase() + ' wins — lost ' + fmt(bet); }
          busy = false; go.disabled = false;
        }
      }, 'DEAL');
      root.append(h('div', { class: 'game-shell' },
        h('div', {}, h('div', { class: 'score' }, 'BANKER'), bRow, bS),
        h('div', {}, h('div', { class: 'score' }, 'PLAYER'), pRow, pS),
        status, seg, go, bar));
    }
  });

  /* ---------- TEEN PATTI ---------- */
  register({
    id: 'teen-patti', name: 'Teen Patti', emoji: '🎴', tag: 'Table',
    desc: 'Indian 3-card poker. Best hand takes the pot.',
    mount(root) {
      const bar = betBar();
      let busy = false;
      const youRow = h('div', { class: 'hand' }), cpuRow = h('div', { class: 'hand' });
      const status = h('div', { class: 'status' }, 'Deal a hand and beat the dealer.');
      function rank(cs) {
        const v = cs.map(c => rv(c.r) === 1 ? 14 : rv(c.r)).sort((a, b) => b - a);
        const suit = cs.every(c => c.s === cs[0].s);
        const trail = v[0] === v[1] && v[1] === v[2];
        const seq = (v[0] - 1 === v[1] && v[1] - 1 === v[2]);
        const a23 = v[0] === 14 && v[1] === 3 && v[2] === 2;
        if (trail) return [6, v[0]];
        if ((seq || a23) && suit) return [5, a23 ? 3 : v[0]];
        if (seq || a23) return [4, a23 ? 3 : v[0]];
        if (suit) return [3, ...v];
        if (v[0] === v[1] || v[1] === v[2]) { const pair = v[0] === v[1] ? v[0] : v[1]; return [2, pair, v[0] === v[1] ? v[2] : v[0]]; }
        return [1, ...v];
      }
      const cmp = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] || 0) - (b[i] || 0); if (d) return d; } return 0; };
      const go = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return; const bet = bar.api.bet; if (!stake(bet)) return;
          busy = true; go.disabled = true;
          const d = newDeck();
          const you = [d.pop(), d.pop(), d.pop()], cpu = [d.pop(), d.pop(), d.pop()];
          youRow.innerHTML = ''; cpuRow.innerHTML = '';
          you.forEach(c => youRow.append(cardEl(c)));
          cpu.forEach((c, i) => cpuRow.append(cardEl(c, true)));
          status.textContent = 'Dealing…'; await sleep(500);
          cpuRow.innerHTML = ''; cpu.forEach(c => cpuRow.append(cardEl(c)));
          const r = cmp(rank(you), rank(cpu));
          if (r > 0) { const w = bet * 1.9; payout(w); Sound.big(); status.textContent = 'You win! +' + fmt(w) + ' coins'; toast('+' + fmt(w), 'good'); }
          else if (r === 0) { payout(bet); status.textContent = 'Tie — bet returned.'; }
          else { Sound.lose(); status.textContent = 'Dealer wins — lost ' + fmt(bet) + ' coins.'; }
          busy = false; go.disabled = false;
        }
      }, 'DEAL');
      root.append(h('div', { class: 'game-shell' },
        h('div', {}, h('div', { class: 'score' }, 'DEALER'), cpuRow),
        h('div', {}, h('div', { class: 'score' }, 'YOU'), youRow),
        status, go, bar));
    }
  });

  /* ---------- ANDAR BAHAR ---------- */
  register({
    id: 'andar-bahar', name: 'Andar Bahar', emoji: '🀄', tag: 'Table',
    desc: 'A joker card is drawn. Pick the side that matches its rank first.',
    mount(root) {
      const bar = betBar();
      let side = 'andar', busy = false;
      const jokerRow = h('div', { class: 'hand' });
      const aRow = h('div', { class: 'hand' }), bRow = h('div', { class: 'hand' });
      const status = h('div', { class: 'status' }, 'Pick Andar or Bahar, then deal.');
      const seg = h('div', { class: 'seg' });
      [['andar', 'Andar 1.9×'], ['bahar', 'Bahar 2.1×']].forEach(([k, l]) =>
        seg.append(h('button', {
          class: 'segbtn' + (k === 'andar' ? ' on' : ''),
          onclick(e) { if (busy) return; side = k; $$('.segbtn', seg).forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); }
        }, l)));
      const go = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return; const bet = bar.api.bet; if (!stake(bet)) return;
          busy = true; go.disabled = true;
          const d = newDeck();
          const joker = d.pop();
          jokerRow.innerHTML = ''; jokerRow.append(cardEl(joker));
          aRow.innerHTML = ''; bRow.innerHTML = '';
          status.textContent = 'Joker is ' + joker.r + ' — dealing…';
          let turn = 'andar', winner = null;
          for (let i = 0; i < 60 && !winner; i++) {
            const c = d.pop();
            if (turn === 'andar') { aRow.append(cardEl(c)); if (c.r === joker.r) winner = 'andar'; turn = 'bahar'; }
            else { bRow.append(cardEl(c)); if (c.r === joker.r) winner = 'bahar'; turn = 'andar'; }
            Sound.tick(); await sleep(220);
          }
          if (!winner) winner = turn;
          if (winner === side) { const w = bet * (side === 'andar' ? 1.9 : 2.1); payout(w); Sound.big(); status.textContent = winner.toUpperCase() + ' matched! +' + fmt(w) + ' coins'; toast('+' + fmt(w), 'good'); }
          else { Sound.lose(); status.textContent = winner.toUpperCase() + ' matched — lost ' + fmt(bet) + ' coins.'; }
          busy = false; go.disabled = false;
        }
      }, 'DEAL');
      root.append(h('div', { class: 'game-shell' },
        h('div', {}, h('div', { class: 'score' }, 'JOKER'), jokerRow),
        h('div', { class: 'score' }, 'ANDAR'), aRow,
        h('div', { class: 'score' }, 'BAHAR'), bRow,
        status, seg, go, bar));
    }
  });

  /* ---------- DRAGON TIGER ---------- */
  register({
    id: 'dragon-tiger', name: 'Dragon Tiger', emoji: '🐲', tag: 'Table',
    desc: 'One card each. Higher card wins.',
    mount(root) {
      const bar = betBar();
      let side = 'dragon', busy = false;
      const dRow = h('div', { class: 'hand' }), tRow = h('div', { class: 'hand' });
      const status = h('div', { class: 'status' }, 'Pick a side and deal.');
      const seg = h('div', { class: 'seg' });
      [['dragon', '🐲 Dragon'], ['tiger', '🐯 Tiger'], ['tie', 'Tie 9×']].forEach(([k, l]) =>
        seg.append(h('button', {
          class: 'segbtn' + (k === 'dragon' ? ' on' : ''),
          onclick(e) { if (busy) return; side = k; $$('.segbtn', seg).forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); }
        }, l)));
      const go = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return; const bet = bar.api.bet; if (!stake(bet)) return;
          busy = true; go.disabled = true;
          const d = newDeck(), a = d.pop(), b = d.pop();
          dRow.innerHTML = cardEl(a); tRow.innerHTML = cardEl(b);
          dRow.innerHTML = ''; tRow.innerHTML = '';
          dRow.append(cardEl(a)); tRow.append(cardEl(b));
          Sound.tick(); await sleep(600);
          const va = rv(a.r), vb = rv(b.r);
          const winner = va > vb ? 'dragon' : vb > va ? 'tiger' : 'tie';
          if (winner === side) { const w = bet * 1.95; payout(w); Sound.big(); status.textContent = winner.toUpperCase() + ' wins! +' + fmt(w); }
          else if (winner === 'tie') { const w = side === 'tie' ? bet * 9 : bet; payout(w); status.textContent = 'Tie — ' + (side === 'tie' ? '+' + fmt(w) : 'bet returned'); if (side === 'tie') Sound.big(); }
          else { Sound.lose(); status.textContent = winner.toUpperCase() + ' wins — lost ' + fmt(bet); }
          busy = false; go.disabled = false;
        }
      }, 'DEAL');
      root.append(h('div', { class: 'game-shell' },
        h('div', {}, h('div', { class: 'score' }, 'DRAGON'), dRow),
        h('div', {}, h('div', { class: 'score' }, 'TIGER'), tRow),
        status, seg, go, bar));
    }
  });

  /* ---------- SIC BO ---------- */
  register({
    id: 'sic-bo', name: 'Sic Bo', emoji: '🎲', tag: 'Table',
    desc: 'Three dice. Bet Small, Big or Any Triple.',
    mount(root) {
      const bar = betBar();
      let side = 'small', busy = false;
      const dice = h('div', { class: 'hand' }, '🎲', '🎲', '🎲');
      const out = h('div', { class: 'readout-big' }, '—');
      const status = h('div', { class: 'status' }, 'Small = 4–10, Big = 11–17. Triples lose on Small/Big.');
      const seg = h('div', { class: 'seg' });
      [['small', 'Small'], ['big', 'Big'], ['triple', 'Any Triple 30×']].forEach(([k, l]) =>
        seg.append(h('button', {
          class: 'segbtn' + (k === 'small' ? ' on' : ''),
          onclick(e) { if (busy) return; side = k; $$('.segbtn', seg).forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); }
        }, l)));
      const go = h('button', {
        class: 'btn primary big', onclick: async () => {
          if (busy) return; const bet = bar.api.bet; if (!stake(bet)) return;
          busy = true; go.disabled = true;
          for (let i = 0; i < 10; i++) { dice.textContent = ''; for (let k = 0; k < 3; k++) dice.append(h('span', {}, ['⚀','⚁','⚂','⚃','⚄','⚅'][ri(0,5)])); Sound.tick(); await sleep(70); }
          const r = [ri(1,6), ri(1,6), ri(1,6)];
          const total = r.reduce((a, b) => a + b, 0);
          const triple = r[0] === r[1] && r[1] === r[2];
          dice.innerHTML = ''; r.forEach(v => dice.append(h('span', {}, ['⚀','⚁','⚂','⚃','⚄','⚅'][v - 1])));
          out.textContent = total + (triple ? ' TRIPLE!' : '');
          let win = 0;
          if (side === 'triple' && triple) win = bet * 30;
          else if (side === 'small' && !triple && total >= 4 && total <= 10) win = bet * 1.95;
          else if (side === 'big' && !triple && total >= 11 && total <= 17) win = bet * 1.95;
          if (win > 0) { payout(win); Sound.big(); status.textContent = 'WIN! +' + fmt(win) + ' coins'; toast('+' + fmt(win), 'good'); }
          else { Sound.lose(); status.textContent = 'Total ' + total + ' — lost ' + fmt(bet); }
          busy = false; go.disabled = false;
        }
      }, 'ROLL DICE');
      root.append(h('div', { class: 'game-shell' }, dice, out, status, seg, go, bar));
    }
  });

  /* ---------- VIDEO POKER ---------- */
  register({
    id: 'video-poker', name: 'Video Poker', emoji: '🂡', tag: 'Table',
    desc: 'Jacks or Better. Hold the cards you want, then draw.',
    mount(root) {
      const bar = betBar();
      let hand = [], held = [], phase = 'deal';
      const row = h('div', { class: 'hand' });
      const status = h('div', { class: 'status' }, 'Press DEAL to get your hand.');
      const paytable = 'RF 250× · SF 50× · 4K 25× · FH 9× · FL 6× · ST 4× · 3K 3× · 2P 2× · JJ+ 1×';
      const go = h('button', { class: 'btn primary big', onclick: run }, 'DEAL');

      function paint() {
        row.innerHTML = '';
        hand.forEach((c, i) => {
          const el = cardEl(c);
          if (held[i]) { el.style.outline = '3px solid #ffcb47'; el.style.transform = 'translateY(-8px)'; }
          el.onclick = () => { if (phase === 'hold') { held[i] = !held[i]; Sound.click(); paint(); } };
          row.append(el);
        });
      }
      function evaluate(cs) {
        const v = cs.map(c => rv(c.r)).sort((a, b) => a - b);
        const flush = cs.every(c => c.s === cs[0].s);
        const straight = v.every((x, i) => i === 0 || x === v[i - 1] + 1);
        const royal = straight && flush && v[0] === 10;
        const counts = {}; v.forEach(x => counts[x] = (counts[x] || 0) + 1);
        const c = Object.values(counts).sort((a, b) => b - a);
        if (royal) return ['Royal Flush', 250];
        if (straight && flush) return ['Straight Flush', 50];
        if (c[0] === 4) return ['Four of a Kind', 25];
        if (c[0] === 3 && c[1] === 2) return ['Full House', 9];
        if (flush) return ['Flush', 6];
        if (straight) return ['Straight', 4];
        if (c[0] === 3) return ['Three of a Kind', 3];
        if (c[0] === 2 && c[1] === 2) return ['Two Pair', 2];
        if (c[0] === 2) {
          const pairRank = Object.keys(counts).find(k => counts[k] === 2);
          if (+pairRank >= 11) return ['Jacks or Better', 1];
        }
        return ['No win', 0];
      }
      function run() {
        if (phase === 'deal') {
          const bet = bar.api.bet; if (!stake(bet)) return;
          hand = newDeck().slice(0, 5); held = [false, false, false, false, false];
          phase = 'hold'; go.textContent = 'DRAW'; status.textContent = 'Tap cards to HOLD, then draw.'; paint(); return;
        }
        const d = newDeck();
        hand = hand.map((c, i) => held[i] ? c : d.pop());
        paint();
        const [name, mult] = evaluate(hand);
        if (mult > 0) { const w = bar.api.bet * mult; payout(w); Sound.big(); status.textContent = name + ' → +' + fmt(w) + ' coins'; toast('+' + fmt(w), 'good'); }
        else { Sound.lose(); status.textContent = 'No win — lost ' + fmt(bar.api.bet) + ' coins.'; }
        phase = 'deal'; go.textContent = 'DEAL AGAIN'; held = [false,false,false,false,false];
      }
      root.append(h('div', { class: 'game-shell' }, row, status, h('div', { class: 'status' }, paytable), go, bar));
    }
  });
})();