// 大富豪 Web UI。ゲームのロジックはすべて Steel エンジン（worker.js 経由の wasm）にある。
// この UI は「状態を表示して、選んだ操作をエンジンに送る」だけ。

const $ = (sel) => document.querySelector(sel);
const ME = 0;

// ---------------------------------------------------------------------------
// エンジンとの通信
// ---------------------------------------------------------------------------

const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
let rpcSeq = 0;
const pending = new Map();
worker.onmessage = ({ data }) => {
  const p = pending.get(data.id);
  if (!p) return;
  pending.delete(data.id);
  data.ok ? p.resolve(data.result) : p.reject(new Error(data.error));
};
worker.onerror = (e) => showFatal(`エンジンの起動に失敗しました: ${e.message ?? e}`);

function rpc(msg) {
  return new Promise((resolve, reject) => {
    const id = ++rpcSeq;
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, ...msg });
  });
}
const api = (func, ...args) => rpc({ method: 'call', func, args });
const loadSource = (name, src) => rpc({ method: 'load', name, src });

// ---------------------------------------------------------------------------
// 状態
// ---------------------------------------------------------------------------

const store = {
  get(k, d) { try { const v = localStorage.getItem(`daifugo:${k}`); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(`daifugo:${k}`, JSON.stringify(v)); } catch { /* 保存できなくても動く */ } },
};

let rulesInfo = null;       // api-rules の結果
let view = null;            // 最新のゲーム表示
let gameId = null;
let selected = new Set();
let speed = 550;
let stepping = false;
let lastSeq = -1;
let lastRound = 0;
let loadedCustom = '';

const SPECIAL = new Set(['revolution', 'eight', 'back11', 'shibari', 'spade3', 'fall']);

const EXAMPLE_RULE = `;; 例: 9 を出すと場が流れる「9切り」
(define-rule! '9giri "9切り"
  "9を出すと場が流れ、出した人から再開する。"
  (hash 'on-play
        (lambda (st player p prev)
          (if (and (memq (play-type p) '(single set))
                   (= (play-rank p) 9))
              (request-flush (add-event st 'eight player "9切り！"))
              st))))`;

// ---------------------------------------------------------------------------
// カードの表示
// ---------------------------------------------------------------------------

const SUIT = { S: ['♠', false], H: ['♥', true], D: ['♦', true], C: ['♣', false] };

function cardEl(id, { small = false } = {}) {
  const el = document.createElement('div');
  el.className = 'card' + (small ? ' small' : '');
  el.dataset.id = id;
  if (id.startsWith('JK')) {
    el.classList.add('joker');
    el.innerHTML = `<span class="corner">JOKER</span><span class="pip">★</span>`;
    el.setAttribute('aria-label', 'ジョーカー');
    return el;
  }
  const [sym, red] = SUIT[id[0]];
  const rank = id.slice(1);
  if (red) el.classList.add('red');
  el.innerHTML = `<span class="corner">${rank}<small>${sym}</small></span><span class="pip">${sym}</span>`;
  el.setAttribute('aria-label', `${sym}${rank}`);
  return el;
}

const cardText = (id) => (id.startsWith('JK') ? 'JK' : SUIT[id[0]][0] + id.slice(1));
const SUIT_NAME = { spade: '♠', heart: '♥', diamond: '♦', club: '♣' };

// ---------------------------------------------------------------------------
// 設定画面
// ---------------------------------------------------------------------------

function renderSetup() {
  const form = $('#setup-form');
  const saved = store.get('settings', {});
  for (const k of ['players', 'ai', 'speed', 'seed']) if (saved[k] != null) form.elements[k].value = saved[k];
  form.elements.custom.value = saved.custom ?? EXAMPLE_RULE;
  const enabled = new Set(saved.rules ?? rulesInfo.rule_sets.find((s) => s.name === 'all').rules);
  const opts = saved.options ?? {};

  const list = $('#rule-list');
  list.replaceChildren();
  for (const r of rulesInfo.rules) {
    const row = document.createElement('label');
    row.className = 'rule';
    row.innerHTML = `<input type="checkbox" name="rule" value="${r.name}">
      <span class="name">${r.title}</span>
      <span class="desc">${r.description}</span>`;
    row.querySelector('input').checked = enabled.has(r.name);
    const bools = r.options.filter((o) => typeof o.default === 'boolean');
    if (bools.length) {
      const box = document.createElement('span');
      box.className = 'opts';
      for (const o of bools) {
        const lab = document.createElement('label');
        const label = { 'kaidan-revolution': '階段でも革命', 'kaidan-8giri': '階段の8でも8切り' }[o.key] ?? o.key;
        lab.innerHTML = `<input type="checkbox" name="opt" value="${o.key}"> ${label}`;
        lab.querySelector('input').checked = opts[o.key] ?? o.default;
        box.append(lab);
      }
      row.append(box);
    }
    list.append(row);
  }

  const presets = $('#presets');
  presets.replaceChildren();
  for (const s of rulesInfo.rule_sets) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = s.title.replace(/（.*）/, '');
    b.title = s.title;
    b.onclick = () => {
      const want = new Set(s.rules);
      for (const cb of form.querySelectorAll('input[name=rule]')) cb.checked = want.has(cb.value);
    };
    presets.append(b);
  }
}

async function startGame(ev) {
  ev?.preventDefault();
  const form = $('#setup-form');
  const err = $('#setup-error');
  err.textContent = '';
  const players = Number(form.elements.players.value);
  const ai = form.elements.ai.value;
  speed = Number(form.elements.speed.value);
  const seedText = form.elements.seed.value.trim();
  const seed = seedText ? Number(seedText) : Math.floor(Math.random() * 1e9);
  const custom = form.elements.custom.value;

  // 自作ルールを読み込む（変更があったときだけ）
  if (custom.trim() && custom !== loadedCustom) {
    try {
      const before = new Set(rulesInfo.rules.map((r) => r.name));
      await loadSource('custom.scm', custom);
      loadedCustom = custom;
      rulesInfo = await api('api-rules');
      const added = rulesInfo.rules.filter((r) => !before.has(r.name)).map((r) => r.name);
      const keep = collectSettings(form);
      keep.rules = [...keep.rules, ...added];
      store.set('settings', keep);
      renderSetup();
    } catch (e) {
      err.textContent = `自作ルールの読み込みに失敗しました:\n${e.message}`;
      return;
    }
  }

  const settings = collectSettings(form);
  store.set('settings', settings);
  const options = Object.entries(settings.options);
  const ais = ['human', ...Array.from({ length: players - 1 }, () => ai)];
  try {
    if (gameId != null) api('api-delete-game', gameId).catch(() => {});
    view = await api('api-new-game', players, seed, settings.rules, options, [], ais, ME);
  } catch (e) {
    err.textContent = e.message;
    return;
  }
  gameId = view.id;
  lastSeq = -1;
  lastRound = 0;
  selected.clear();
  $('#log').replaceChildren();
  $('#setup').hidden = true;
  $('#game').hidden = false;
  render();
  pump();
}

function collectSettings(form) {
  const rules = [...form.querySelectorAll('input[name=rule]:checked')].map((x) => x.value);
  const options = {};
  for (const cb of form.querySelectorAll('input[name=opt]')) options[cb.value] = cb.checked;
  return {
    players: form.elements.players.value,
    ai: form.elements.ai.value,
    speed: form.elements.speed.value,
    seed: form.elements.seed.value,
    custom: form.elements.custom.value,
    rules,
    options,
  };
}

// ---------------------------------------------------------------------------
// ゲーム画面
// ---------------------------------------------------------------------------

function render() {
  if (!view) return;
  const me = view.players[ME];
  const myTurn = view.waiting_for_human && view.turn === ME;
  const exchange = view.phase === 'exchange';

  $('#round').textContent = view.round;

  // バッジ
  const badges = $('#badges');
  badges.replaceChildren();
  const badge = (text, cls = '') => {
    const b = document.createElement('span');
    b.className = `badge ${cls}`;
    b.textContent = text;
    badges.append(b);
  };
  if (view.revolution) badge('革命中', 'hot');
  if (view.back11) badge('11バック中', 'warn');
  if (view.lock) badge(`${view.lock.map((s) => SUIT_NAME[s]).join('')}縛り`, 'warn');
  if (exchange) badge('カード交換');

  // 相手
  const opps = $('#opponents');
  opps.replaceChildren();
  for (const p of view.players) {
    if (p.index === ME) continue;
    const el = document.createElement('div');
    el.className = 'opp';
    if (view.turn === p.index && view.phase !== 'over') el.classList.add('turn');
    if (p.finished != null || p.fallen) el.classList.add('out');
    const backs = Array.from({ length: Math.min(p.count, 14) }, () => '<span class="back"></span>').join('');
    let status = '';
    let cls = '';
    if (p.finished != null) { status = `${p.finished}位で上がり`; cls = 'done'; }
    else if (p.fallen) { status = '都落ち'; cls = 'done'; }
    else if (p.passed) { status = 'パス'; cls = 'passed'; }
    else if (view.turn === p.index && view.phase !== 'over') status = '考え中…';
    el.innerHTML = `
      <div class="top">${p.name}${p.title ? `<span class="title-tag">${p.title}</span>` : ''}</div>
      <div style="display:flex">${p.count ? `<span class="backs">${backs}</span><span class="count">${p.count}枚</span>` : ''}</div>
      <div class="status ${cls}">${status}</div>`;
    opps.append(el);
  }

  // 場
  const field = $('#field');
  field.replaceChildren();
  const tricks = view.field.slice(-3);
  if (!tricks.length) {
    const e = document.createElement('div');
    e.className = 'empty-field';
    e.textContent = view.phase === 'over' ? 'ゲーム終了' : exchange ? 'カード交換中' : '場は空です';
    field.append(e);
    $('#field-label').textContent = '';
  } else {
    tricks.forEach((t, i) => {
      const g = document.createElement('div');
      const age = tricks.length - 1 - i;
      g.className = 'trick ' + (age === 0 ? 'new' : age === 1 ? 'old' : 'older');
      for (const id of t.play.cards) g.append(cardEl(id));
      field.append(g);
    });
    const top = tricks.at(-1);
    $('#field-label').textContent = `${view.players[top.player].name}：${top.play.label}`;
  }

  // 自分
  const info = $('#me-info');
  info.className = 'me-info' + (myTurn ? ' turn' : '');
  let status = '';
  if (me.finished != null) status = ` — ${me.finished}位で上がり！`;
  else if (me.fallen) status = ' — 都落ち';
  else if (me.passed) status = ' — パス中';
  info.textContent = `${me.name}${me.title ? `（${me.title}）` : ''}${status}`;

  const hand = me.hand ?? [];
  const legal = (view.legal ?? []).map((l) => [...l].sort().join(','));
  const playable = new Set((view.legal ?? []).flat());
  for (const id of [...selected]) if (!hand.includes(id)) selected.delete(id);

  const handEl = $('#hand');
  handEl.replaceChildren();
  const width = handEl.clientWidth || window.innerWidth;
  const cw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-w')) || 58;
  const overlap = Math.max(0, Math.min(cw * 0.55, (cw * hand.length - (width - 24)) / Math.max(1, hand.length - 1)));
  handEl.style.setProperty('--overlap', `${overlap}px`);
  for (const id of hand) {
    const c = cardEl(id);
    if (selected.has(id)) c.classList.add('selected');
    if (myTurn && !exchange && !playable.has(id)) c.classList.add('dim');
    c.onclick = () => {
      if (!(myTurn)) return;
      selected.has(id) ? selected.delete(id) : selected.add(id);
      render();
    };
    handEl.append(c);
  }

  // 操作ボタンと案内
  const key = [...selected].sort().join(',');
  const prompt = $('#prompt');
  prompt.classList.remove('error');
  const playBtn = $('#btn-play');
  if (exchange && myTurn) {
    const need = view.exchange.count;
    const to = view.players[view.exchange.receiver].name;
    prompt.textContent = `${to} に渡すカードを ${need} 枚選んでください（${selected.size}/${need}）`;
    playBtn.textContent = '渡す';
    playBtn.disabled = selected.size !== need;
  } else {
    playBtn.textContent = '出す';
    playBtn.disabled = !(myTurn && legal.includes(key));
    if (view.phase === 'over') prompt.textContent = '';
    else if (myTurn) {
      prompt.textContent = !legal.length
        ? '出せるカードがありません。パスしてください'
        : selected.size && !legal.includes(key) ? 'その組み合わせは出せません' : 'カードを選んで「出す」';
    } else if (me.finished != null || me.fallen) prompt.textContent = '他の人の対戦を見ています…';
    else prompt.textContent = `${view.players[view.turn].name} の番`;
  }
  $('#btn-pass').disabled = !(myTurn && view.can_pass);
  $('#btn-hint').disabled = !myTurn;
  $('#btn-undo').disabled = !view.can_undo || stepping;

  renderLog();
  if (view.phase === 'over') showResult();
}

function renderLog() {
  const ol = $('#log');
  if (view.round !== lastRound) {
    lastRound = view.round;
    lastSeq = -1;
    const h = document.createElement('li');
    h.className = 'head';
    h.textContent = `第${view.round}ゲーム`;
    ol.append(h);
  }
  let flash = null;
  for (const e of view.log) {
    if (e.seq <= lastSeq) continue;
    lastSeq = e.seq;
    if (e.type === 'deal') continue;
    const li = document.createElement('li');
    if (SPECIAL.has(e.type)) { li.className = 'special'; flash = e.text; }
    if (e.type === 'pass' || e.type === 'clear') li.className = 'dim';
    li.textContent = e.cards?.length ? `${e.text}  ${e.cards.map(cardText).join(' ')}` : e.text;
    ol.append(li);
  }
  ol.scrollTop = ol.scrollHeight;
  if (flash) showFlash(flash);
}

function showFlash(text) {
  const f = $('#flash');
  f.textContent = text.replace(/^.*?(都落ち！).*$/, '$1');
  f.classList.remove('show');
  void f.offsetWidth;
  f.classList.add('show');
}

function showResult() {
  const dlg = $('#result');
  if (dlg.open) return;
  const ol = $('#ranking');
  ol.replaceChildren();
  view.ranking.forEach((r, i) => {
    const p = view.players[r.player];
    const li = document.createElement('li');
    if (i === 0) li.classList.add('first');
    if (r.player === ME) li.classList.add('mine');
    li.innerHTML = `<span class="t">${r.title}</span><span>${p.name}${p.fallen ? '（都落ち）' : ''}</span><span class="sc">通算 ${p.score}点</span>`;
    ol.append(li);
  });
  setTimeout(() => { if (view.phase === 'over' && !dlg.open) dlg.showModal(); }, 700);
}

function showError(msg) {
  const p = $('#prompt');
  p.textContent = msg;
  p.classList.add('error');
}

const FRIENDLY = [
  [/^illegal play/, 'その組み合わせは出せません'],
  [/^cannot pass on lead/, '親なのでパスできません'],
  [/^must give exactly/, '渡す枚数が違います'],
  [/^not your turn/, 'あなたの番ではありません'],
];
const friendly = (m) => (FRIENDLY.find(([re]) => re.test(m))?.[1] ?? m);

// ---------------------------------------------------------------------------
// 操作
// ---------------------------------------------------------------------------

async function act(func, ...args) {
  try {
    view = await api(func, gameId, ...args);
    selected.clear();
    render();
    pump();
  } catch (e) {
    showError(friendly(e.message));
  }
}

// CPU の番なら 1 手ずつ間を空けて進める
async function pump() {
  if (stepping) return;
  stepping = true;
  try {
    while (view && view.phase !== 'over' && !view.waiting_for_human) {
      await new Promise((r) => setTimeout(r, speed));
      view = await api('api-ai-step', gameId);
      render();
    }
  } catch (e) {
    showError(e.message);
  } finally {
    stepping = false;
    render();
  }
}

$('#btn-play').onclick = () => {
  if (view.phase === 'exchange') act('api-give', ME, [...selected]);
  else act('api-play', ME, [...selected]);
};
$('#btn-pass').onclick = () => act('api-pass', ME);
$('#btn-undo').onclick = () => act('api-undo');
$('#btn-hint').onclick = async () => {
  try {
    const h = await api('api-hint', gameId);
    if (h.action === 'pass') { showError('ヒント: パスがおすすめ'); return; }
    selected = new Set(h.cards);
    render();
  } catch (e) { showError(e.message); }
};
$('#btn-next').onclick = async () => {
  $('#result').close();
  await act('api-next-round');
};
const backToSetup = () => {
  $('#result').close();
  $('#game').hidden = true;
  $('#setup').hidden = false;
  renderSetup();
};
$('#btn-result-setup').onclick = backToSetup;
$('#btn-setup').onclick = backToSetup;
$('#btn-log').onclick = () => $('#log-panel').classList.toggle('open');
$('#btn-log-close').onclick = () => $('#log-panel').classList.remove('open');
$('#setup-form').addEventListener('submit', startGame);

document.addEventListener('keydown', (e) => {
  if ($('#game').hidden || e.target.closest('input, textarea, select')) return;
  if (e.key === 'Enter' && !$('#btn-play').disabled) $('#btn-play').click();
  if ((e.key === 'p' || e.key === 'P') && !$('#btn-pass').disabled) $('#btn-pass').click();
  if (e.key === 'h' && !$('#btn-hint').disabled) $('#btn-hint').click();
});
window.addEventListener('resize', () => render());

function showFatal(msg) {
  $('#loading').innerHTML = `<p class="error">${msg}</p>`;
}

// ---------------------------------------------------------------------------
// 起動
// ---------------------------------------------------------------------------

(async () => {
  try {
    rulesInfo = await api('api-rules');
  } catch (e) {
    showFatal(`エンジンの読み込みに失敗しました: ${e.message}`);
    return;
  }
  $('#loading').hidden = true;
  $('#setup').hidden = false;
  renderSetup();
})();
