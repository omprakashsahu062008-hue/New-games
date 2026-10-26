/* core.js — shared runtime */
window.VG = (function () {
  'use strict';

  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));

  function add(el, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) { c.forEach(x => add(el, x)); return; }
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  function h(tag, attrs) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
    for (let i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }

  const rnd = (a, b) => a + Math.random() * (b - a);
  const ri  = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = n => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = ri(0, i); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* ---------- wallet ---------- */
  const WKEY = 'vg.wallet';
  const Wallet = {
    get() { const v = parseFloat(localStorage.getItem(WKEY)); return Number.isFinite(v) ? v : 10000; },
    set(v) {
      v = Math.max(0, Math.round(v * 100) / 100);
      localStorage.setItem(WKEY, String(v));
      document.dispatchEvent(new CustomEvent('wallet', { detail: v }));
      return v;
    },
    add(v) { return Wallet.set(Wallet.get() + v); },
    reset() { return Wallet.set(10000); }
  };

  /* ---------- toasts ---------- */
  let host = null;
  function toast(msg, kind) {
    if (!host) { host = h('div', { class: 'toasts' }); document.body.appendChild(host); }
    const t = h('div', { class: 'toast ' + (kind || '') }, msg);
    host.appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 260); }, 2100);
  }

  /* ---------- sound ---------- */
  const Sound = {
    on: localStorage.getItem('vg.sound') !== '0',
    ctx: null,
    ac() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); return this.ctx; },
    tone(f, d, type, vol) {
      if (!this.on) return;
      try {
        const c = this.ac(), o = c.createOscillator(), g = c.createGain();
        o.type = type || 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(vol || 0.05, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + (d || 0.1));
        o.connect(g); g.connect(c.destination);
        o.start(); o.stop(c.currentTime + (d || 0.1));
      } catch (e) {}
    },
    click() { this.tone(560, 0.05, 'square', 0.025); },
    tick()  { this.tone(900, 0.03, 'sine', 0.02); },
    win()   { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, .12, 'triangle', .045), i * 65)); },
    big()   { [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => this.tone(f, .16, 'triangle', .05), i * 80)); },
    lose()  { this.tone(190, 0.22, 'sawtooth', 0.04); }
  };

  /* ---------- betting ---------- */
  function stake(amount) {
    amount = Math.round(amount * 100) / 100;
    if (Wallet.get() < amount) { toast('Not enough coins', 'bad'); Sound.lose(); return false; }
    Wallet.add(-amount); return true;
  }
  function payout(amount) {
    amount = Math.round((amount || 0) * 100) / 100;
    if (amount > 0) Wallet.add(amount);
    return amount;
  }

  function betBar(opts) {
    opts = opts || {};
    let bet = parseInt(localStorage.getItem('vg.bet') || '100', 10);
    if (!Number.isFinite(bet) || bet < 10) bet = 100;
    const out = h('span', { class: 'betval' }, fmt(bet));
    const api = {
      get bet() { return bet; },
      set(v) {
        bet = clamp(Math.round(v), 10, 1000000);
        localStorage.setItem('vg.bet', String(bet));
        out.textContent = fmt(bet);
        if (opts.onChange) opts.onChange(bet);
      }
    };
    const step = n => h('button', { class: 'icon-btn', onclick() { Sound.click(); api.set(bet + n); } }, (n > 0 ? '+' + n : String(n)));
    const bar = h('div', { class: 'betbar' },
      h('button', { class: 'icon-btn', onclick() { Sound.click(); api.set(bet / 2); } }, '½'),
      step(-10), step(10),
      h('div', { class: 'betpill' }, h('span', { class: 'lbl' }, 'BET'), out),
      h('button', { class: 'icon-btn', onclick() { Sound.click(); api.set(bet * 2); } }, '2×'),
      h('button', { class: 'icon-btn', onclick() { Sound.click(); api.set(100); } }, '⟲')
    );
    bar.api = api;
    return bar;
  }

  /* ---------- card engine ---------- */
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const rv = r => RANKS.indexOf(r) + 1;
  const isRed = c => c.s === '♥' || c.s === '♦';
  const newDeck = () => shuffle(SUITS.reduce((a, s) => a.concat(RANKS.map(r => ({ r, s }))), []));
  function cardEl(c, down) {
    if (down) return h('div', { class: 'pcard back' }, h('span', {}, '★'));
    return h('div', { class: 'pcard' + (isRed(c) ? ' red' : '') },
      h('span', { class: 'cr' }, c.r), h('span', { class: 'cs' }, c.s));
  }
  function bj(cs) {
    let t = 0, a = 0;
    cs.forEach(c => { const v = rv(c.r); if (v === 1) { a++; t += 11; } else t += v > 10 ? 10 : v; });
    while (t > 21 && a) { t -= 10; a--; }
    return t;
  }

  /* ---------- registry ---------- */
  const games = [];
  const register = g => games.push(g);
  const cleanups = [];
  const onCleanup = fn => cleanups.push(fn);
  const runCleanups = () => cleanups.splice(0).forEach(f => { try { f(); } catch (e) {} });

  return {
    $, $$, h, rnd, ri, pick, clamp, fmt, sleep, shuffle,
    Wallet, toast, Sound, stake, payout, betBar,
    cards: { SUITS, RANKS, rv, isRed, newDeck, cardEl, bj },
    games, register, onCleanup, runCleanups
  };
})();