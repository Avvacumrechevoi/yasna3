/* Диаграмма «Четыре опоры. Один круг» (#cross-mount на главной).
   Ванильный JS без сборки. Заменил React+ReactDOM+Babel-standalone
   (07.2026): раньше ради этих 100 строк главная тянула ~3 МБ Babel
   и компилировала JSX в браузере. DOM и SVG — 1:1 к прежней версии. */
(function () {
  var mount = document.getElementById('cross-mount');
  if (!mount) return;

  var ROLES = [
    { id: 'society',  label: 'ГОСУДАРСТВО', answersFor: 'отца',    gives: 'строй · смысл · место',  pos: 'n', before: 'будущим детей' },
    { id: 'children', label: 'ДЕТИ',        answersFor: 'будущее', gives: 'продолжение · надежду',  pos: 'e', before: 'матерью' },
    { id: 'mother',   label: 'МАТЬ',        answersFor: 'детей',   gives: 'тепло · опору · корни',  pos: 's', before: 'отцом' },
    { id: 'father',   label: 'ОТЕЦ',        answersFor: 'семью',   gives: 'дом · имя · защиту',     pos: 'w', before: 'государством' },
  ];
  var ORDER = ['father', 'society', 'children', 'mother'];
  var SVGNS = 'http://www.w3.org/2000/svg';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function svg(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  // ─── Карточки ───
  var wrap = el('div', 'rc-wrap');
  var grid = el('div', 'rc-grid');
  var cardEls = {};
  ROLES.forEach(function (r) {
    var card = el('article', 'rc-card rc-card--' + r.pos);
    card.appendChild(el('span', 'rc-card-mark'));
    card.appendChild(el('h3', 'rc-card-title', r.label));
    var dl = el('dl', 'rc-card-meta');
    var d1 = el('div'); d1.appendChild(el('dt', null, 'Отвечает за')); d1.appendChild(el('dd', null, r.answersFor));
    var d2 = el('div'); d2.appendChild(el('dt', null, 'Перед')); d2.appendChild(el('dd', 'rc-before', r.before));
    dl.appendChild(d1); dl.appendChild(d2);
    card.appendChild(dl);
    var gives = el('div', 'rc-card-gives');
    gives.appendChild(el('span', 'rc-gives-l', 'даёт'));
    gives.appendChild(el('span', null, r.gives));
    card.appendChild(gives);
    card.addEventListener('mouseenter', function () { active = r.id; render(); });
    card.addEventListener('mouseleave', function () { active = null; render(); });
    grid.appendChild(card);
    cardEls[r.id] = card;
  });

  // ─── Центральная схема ───
  var W = 320, cx = W / 2, cy = W / 2, r = 118, off = 30;
  var arcs = {
    society:  'M ' + (cx + off * 0.4) + ' ' + (cy - r * 0.95) + ' A ' + r + ' ' + r + ' 0 0 1 ' + (cx + r * 0.95) + ' ' + (cy - off * 0.4),
    children: 'M ' + (cx + r * 0.95) + ' ' + (cy + off * 0.4) + ' A ' + r + ' ' + r + ' 0 0 1 ' + (cx + off * 0.4) + ' ' + (cy + r * 0.95),
    mother:   'M ' + (cx - off * 0.4) + ' ' + (cy + r * 0.95) + ' A ' + r + ' ' + r + ' 0 0 1 ' + (cx - r * 0.95) + ' ' + (cy + off * 0.4),
    father:   'M ' + (cx - r * 0.95) + ' ' + (cy - off * 0.4) + ' A ' + r + ' ' + r + ' 0 0 1 ' + (cx - off * 0.4) + ' ' + (cy - r * 0.95),
  };
  var center = el('div', 'rc-center');
  var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + W, class: 'rc-svg', 'aria-hidden': 'true' });
  var defs = svg('defs', {});
  [['rc-arrow', 'var(--ink)'], ['rc-arrow-hot', 'var(--accent)']].forEach(function (m) {
    var mk = svg('marker', { id: m[0], viewBox: '0 0 10 10', refX: '8', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto' });
    mk.appendChild(svg('path', { d: 'M 0 0 L 9 5 L 0 10 Z', fill: m[1] }));
    defs.appendChild(mk);
  });
  s.appendChild(defs);
  s.appendChild(svg('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: 'var(--line)', 'stroke-width': '1', 'stroke-dasharray': '2 6', opacity: '.7' }));
  s.appendChild(svg('line', { x1: cx, y1: cy - 24, x2: cx, y2: cy + 24, stroke: 'var(--ink)', 'stroke-width': '1.4' }));
  s.appendChild(svg('line', { x1: cx - 24, y1: cy, x2: cx + 24, y2: cy, stroke: 'var(--ink)', 'stroke-width': '1.4' }));
  s.appendChild(svg('circle', { cx: cx, cy: cy, r: '4.5', fill: 'var(--accent)' }));
  var arcEls = {};
  ORDER.forEach(function (id) {
    var p = svg('path', { d: arcs[id], fill: 'none', stroke: 'var(--ink)', 'stroke-width': '1.2', opacity: '0.28', 'marker-end': 'url(#rc-arrow)', style: 'transition:all .35s ease' });
    arcEls[id] = p;
    s.appendChild(p);
  });
  center.appendChild(s);
  grid.appendChild(center);
  wrap.appendChild(grid);

  var foot = el('div', 'rc-foot');
  foot.appendChild(el('span', 'rc-foot-l', 'Если разорвать одно звено —'));
  foot.appendChild(el('span', 'rc-foot-r', 'рушится весь круг.'));
  wrap.appendChild(foot);

  mount.appendChild(wrap);

  // ─── Подсветка ───
  var active = null, auto = 0;
  function render() {
    var lit = active || ORDER[auto];
    ROLES.forEach(function (rr) {
      cardEls[rr.id].classList.toggle('is-lit', lit === rr.id);
    });
    ORDER.forEach(function (id) {
      var hot = lit === id, p = arcEls[id];
      p.setAttribute('stroke', hot ? 'var(--accent)' : 'var(--ink)');
      p.setAttribute('stroke-width', hot ? '2.0' : '1.2');
      p.setAttribute('opacity', hot ? '1' : '0.28');
      p.setAttribute('marker-end', 'url(#' + (hot ? 'rc-arrow-hot' : 'rc-arrow') + ')');
    });
  }
  render();
  setInterval(function () {
    if (active) return;      // не крутим, пока курсор на карточке
    auto = (auto + 1) % 4;
    render();
  }, 2400);
})();
