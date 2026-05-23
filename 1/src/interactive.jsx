// Cygnus constellation hero + Quiz
// Real RA/Dec positions, magnitudes, and natural stick figure

// Star data (J2000.0 epoch)
//  RA in degrees, Dec in degrees, mag = apparent magnitude
//  Projected to chart coords via cos(dec) correction
const CYG_RAW = [
  // id           star  latin       cyr          mag    RA_deg    Dec_deg  dir                  cat            count place                  href
  ['marshruty',  'ι',  'Iota Cyg', 'Йота',       3.79,  292.250,  51.717,  'Ясные маршруты',    'Путешествия', 180,  'Москва + СПб',        '#'],
  ['neglinka',   'α',  'Deneb',    'Денеб',      1.25,  310.358,  45.280,  'Неглинка',          'История',     200,  'Москва + Онлайн',     'pages/neglinka.html'],
  ['astronevod', 'δ',  'Fawaris',  'Фаварис',    2.87,  296.000,  45.130,  'Астроневод',        'Астрономия',   90,  'Онлайн',              '#'],
  ['prazdniki',  'γ',  'Sadr',     'Садр',       2.23,  305.557,  40.257,  'Праздники',         'Традиции',    120,  'Офлайн',              '#'],
  ['teremok',    'η',  'η Cygni',  'Эта',        3.89,  299.077,  35.083,  'Ясна-Школа',        'Дети 7–16',    60,  'Онлайн + встречи',    '#'],
  ['litprosvet', 'ε',  'Gienah',   'Гиенах',     2.46,  311.553,  33.970,  'ЛитПроСвет',        'Литература',  140,  'Москва + Онлайн',     '#'],
  ['dzhiva',     'ζ',  'ζ Cygni',  'Дзета',      3.20,  318.234,  30.227,  'Джива',             'Здоровье',     80,  'Онлайн',              '#'],
  ['izvod',      'β',  'Albireo',  'Альбирео',   3.05,  292.680,  27.960,  'Извод',             'Язык',         70,  'Онлайн',              '#'],
];

// Chart projection
//   Centre of constellation in sky: roughly RA 305°, Dec 40°
//   cos(40°) ≈ 0.766 for RA→linear correction at this latitude
//   Chart bounding box: u = (322 - RA) * cos(40°), v = (52 - Dec)
//   u range 3.06–22.79 (Δ 19.73)
//   v range 0.30–24.00 (Δ 23.70)
//   Map to viewport: x 21%–79%, y 10%–94% (chosen so the constellation
//   fills the chart with breathing room and labels fit at edges)
const U_MIN = 3.06, U_MAX = 22.79;
const V_MIN = 0.30, V_MAX = 24.00;
const PAD_X1 = 21, PAD_X2 = 79;
const PAD_Y1 = 10, PAD_Y2 = 94;
const COS40 = 0.76604;
function projRA(ra)  { return (322 - ra) * COS40; }
function projDec(dec){ return 52 - dec; }
function mapU(u){ return PAD_X1 + (u - U_MIN) / (U_MAX - U_MIN) * (PAD_X2 - PAD_X1); }
function mapV(v){ return PAD_Y1 + (v - V_MIN) / (V_MAX - V_MIN) * (PAD_Y2 - PAD_Y1); }

const LBL_POS = {
  marshruty:  'right',
  neglinka:   'left',
  astronevod: 'right',
  prazdniki:  'right',
  teremok:    'right',
  litprosvet: 'left',
  dzhiva:     'left',
  izvod:      'right',
};

const CYG = CYG_RAW.map(r => {
  const [id, star, latin, cyr, mag, ra, dec, dir, cat, count, place, href] = r;
  const u = projRA(ra), v = projDec(dec);
  return {
    id, star, latin, cyr, mag, ra, dec,
    x: mapU(u),  // 0–100 (% of chart width)
    y: mapV(v),  // 0–100 (% of chart height)
    lblPos: LBL_POS[id],
    dir, cat, count, place, href,
  };
});

// Natural Cygnus stick figure
//   Body axis (tail→head): Deneb — Sadr — η — Albireo
//   Wing axis:             ι — δ — Sadr — ε — ζ
const CYG_LINES = [
  ['neglinka',  'prazdniki'],  // Deneb — Sadr
  ['prazdniki', 'teremok'],    // Sadr — η
  ['teremok',   'izvod'],      // η — Albireo
  ['marshruty', 'astronevod'], // ι — δ
  ['astronevod','prazdniki'],  // δ — Sadr
  ['prazdniki', 'litprosvet'], // Sadr — ε
  ['litprosvet','dzhiva'],     // ε — ζ
];

// Background star field (deterministic LCG seed)
const BG_STARS = (() => {
  let s = 13;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const out = [];
  for (let i = 0; i < 220; i++) {
    const x = rand() * 100, y = rand() * 100;
    if (CYG.some(d => Math.hypot(d.x - x, d.y - y) < 3.5)) continue;
    // Magnitude-like distribution: few bright, many faint
    const m = rand();
    const r = m < 0.04 ? 1.8 + rand() * 0.8
            : m < 0.18 ? 1.0 + rand() * 0.7
            :            0.4 + rand() * 0.6;
    const op = 0.18 + Math.pow(rand(), 1.6) * 0.65;
    out.push({ x, y, r, op });
  }
  return out;
})();

// Radius from magnitude (visual mag 1 → 22px, mag 4 → ~7px) in viewBox units
function starRadius(mag){ return Math.max(6.5, 22 - (mag - 1) * 5.2); }

// Convert chart hour/dec to chart % (for axis ticks)
function raHourToX(h){
  const u = projRA(h * 15);
  return mapU(u);
}
function decToY(d){
  const v = projDec(d);
  return mapV(v);
}

// Glyph radius scales with magnitude (bigger node = brighter star)
function nodeRadius(mag){ return Math.max(26, 50 - (mag - 1) * 7); }

// Render the brand glyph for each direction, centered at (0,0).
// `s` is the inner scale (typically nodeRadius * 0.65).
// Color = currentColor (parent <g> controls ink/accent).
function renderGlyph(id, s){
  const sw = s * 0.09;  // common stroke width
  switch(id){
    case 'neglinka':  // city skyline
      return (
        <g>
          <rect x={-s*0.82} y={s*0.10} width={s*0.46} height={s*0.70} fill="currentColor"/>
          <rect x={-s*0.20} y={-s*0.45} width={s*0.46} height={s*1.25} fill="currentColor"/>
          <rect x={s*0.40}  y={-s*0.10} width={s*0.46} height={s*0.90} fill="currentColor"/>
          <circle cx={s*0.03} cy={-s*0.65} r={s*0.10} fill="var(--accent)"/>
        </g>
      );
    case 'litprosvet':  // page lines
      return (
        <g stroke="currentColor" strokeWidth={sw} strokeLinecap="round" fill="none">
          <line x1={-s*0.70} y1={-s*0.55} x2={s*0.70}  y2={-s*0.55}/>
          <line x1={-s*0.70} y1={-s*0.18} x2={s*0.45}  y2={-s*0.18}/>
          <line x1={-s*0.70} y1={ s*0.18} x2={s*0.55}  y2={ s*0.18}/>
          <line x1={-s*0.70} y1={ s*0.55} x2={s*0.25}  y2={ s*0.55}/>
          <circle cx={s*0.55} cy={s*0.18} r={s*0.13} fill="var(--accent)" stroke="none"/>
        </g>
      );
    case 'astronevod':  // sun + scattered stars
      return (
        <g>
          <circle cx="0" cy="0" r={s*0.42} fill="none" stroke="currentColor" strokeWidth={sw}/>
          <circle cx="0" cy="0" r={s*0.11} fill="var(--accent)"/>
          <circle cx={-s*0.78} cy={-s*0.45} r={s*0.09} fill="currentColor"/>
          <circle cx={ s*0.70} cy={-s*0.60} r={s*0.06} fill="currentColor"/>
          <circle cx={ s*0.80} cy={ s*0.50} r={s*0.10} fill="currentColor"/>
          <circle cx={-s*0.65} cy={ s*0.62} r={s*0.07} fill="currentColor"/>
        </g>
      );
    case 'prazdniki':  // concentric (sun-wheel)
      return (
        <g fill="none" stroke="currentColor" strokeWidth={sw}>
          <circle cx="0" cy="0" r={s*0.85}/>
          <circle cx="0" cy="0" r={s*0.55}/>
          <circle cx="0" cy="0" r={s*0.25}/>
          <circle cx="0" cy="0" r={s*0.09} fill="var(--accent)" stroke="none"/>
        </g>
      );
    case 'dzhiva':  // spine with energy dots
      return (
        <g>
          <line x1="0" y1={-s*0.85} x2="0" y2={s*0.85}
            stroke="currentColor" strokeWidth={sw*0.85} strokeLinecap="round"/>
          <circle cx="0" cy={-s*0.65} r={s*0.13} fill="none" stroke="currentColor" strokeWidth={sw*0.85}/>
          <circle cx="0" cy={-s*0.22} r={s*0.13} fill="none" stroke="currentColor" strokeWidth={sw*0.85}/>
          <circle cx="0" cy={ s*0.22} r={s*0.14} fill="var(--accent)"/>
          <circle cx="0" cy={ s*0.65} r={s*0.13} fill="none" stroke="currentColor" strokeWidth={sw*0.85}/>
        </g>
      );
    case 'marshruty':  // dotted path
      return (
        <g>
          <path d={`M ${-s*0.7} ${-s*0.55} L ${-s*0.1} ${-s*0.10} L ${s*0.55} ${-s*0.55} L ${s*0.20} ${s*0.55} L ${-s*0.55} ${s*0.55}`}
                fill="none" stroke="currentColor" strokeWidth={sw*0.75}
                strokeDasharray={`${s*0.08} ${s*0.13}`}/>
          <circle cx={-s*0.70} cy={-s*0.55} r={s*0.12} fill="currentColor"/>
          <circle cx={-s*0.10} cy={-s*0.10} r={s*0.12} fill="currentColor"/>
          <circle cx={ s*0.55} cy={-s*0.55} r={s*0.14} fill="var(--accent)"/>
          <circle cx={ s*0.20} cy={ s*0.55} r={s*0.12} fill="currentColor"/>
          <circle cx={-s*0.55} cy={ s*0.55} r={s*0.12} fill="currentColor"/>
        </g>
      );
    case 'izvod':  // circle bisected (root cut)
      return (
        <g>
          <circle cx="0" cy="0" r={s*0.75} fill="none" stroke="currentColor" strokeWidth={sw}/>
          <line x1={-s*0.55} y1={-s*0.55} x2={s*0.55} y2={s*0.55}
                stroke="var(--accent)" strokeWidth={sw*1.3} strokeLinecap="round"/>
          <circle cx={-s*0.55} cy={-s*0.55} r={s*0.12} fill="currentColor"/>
          <circle cx={ s*0.55} cy={ s*0.55} r={s*0.13} fill="var(--accent)"/>
        </g>
      );
    case 'teremok':  // small house
      return (
        <g fill="none" stroke="currentColor" strokeWidth={sw}>
          <polygon points={`${-s*0.72},${-s*0.05} 0,${-s*0.75} ${s*0.72},${-s*0.05}`}/>
          <rect x={-s*0.55} y={-s*0.05} width={s*1.10} height={s*0.70}/>
          <circle cx="0" cy={s*0.30} r={s*0.13} fill="var(--accent)" stroke="none"/>
        </g>
      );
    default:
      return null;
  }
}

/* ─── Constellation hero ─────────────────────────────────────────── */
function Constellation(){
  const [hover, setHover] = React.useState(null);
  const W = 1600, H = 1000;
  const pX = (xp) => xp * W / 100;
  const pY = (yp) => yp * H / 100;

  return (
    <div className="cyg-map">
      <svg className="cyg-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="cyg-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="var(--ink)" strokeWidth=".5" opacity=".05"/>
          </pattern>
          <linearGradient id="cyg-mw" x1="78%" y1="10%" x2="22%" y2="100%">
            <stop offset="0%"   stopColor="var(--accent-2)" stopOpacity="0"/>
            <stop offset="35%"  stopColor="var(--accent-2)" stopOpacity=".07"/>
            <stop offset="60%"  stopColor="var(--accent-2)" stopOpacity=".07"/>
            <stop offset="100%" stopColor="var(--accent-2)" stopOpacity="0"/>
          </linearGradient>
          <radialGradient id="cyg-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="var(--ink)" stopOpacity=".18"/>
            <stop offset="50%"  stopColor="var(--ink)" stopOpacity=".06"/>
            <stop offset="100%" stopColor="var(--ink)" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="cyg-halo-hot" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="var(--accent)" stopOpacity=".40"/>
            <stop offset="50%"  stopColor="var(--accent)" stopOpacity=".12"/>
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
          </radialGradient>
        </defs>

        {/* Grid + Milky Way */}
        <rect width={W} height={H} fill="url(#cyg-grid)"/>
        <ellipse cx={W*0.5} cy={H*0.55} rx={W*0.55} ry={H*0.18}
          fill="url(#cyg-mw)"
          transform={`rotate(-58 ${W*0.5} ${H*0.55})`}/>

        {/* Background star field (twinkling) */}
        {BG_STARS.map((s, i) => (
          <circle key={i} cx={pX(s.x)} cy={pY(s.y)} r={s.r}
            fill="var(--ink)" className="cyg-twk"
            style={{
              '--op': s.op,
              '--dur': `${4 + (i % 7)}s`,
              '--del': `${(i % 11) * 0.4}s`,
            }}/>
        ))}

        {/* Axis ticks */}
        {[19, 20, 21].map(h => {
          const x = pX(raHourToX(h));
          return (
            <g key={'ra'+h} opacity=".55">
              <line x1={x} y1={26} x2={x} y2={36} stroke="var(--ink-3)" strokeWidth=".8"/>
              <text x={x} y={20} fill="var(--ink-3)" fontSize="13"
                fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing=".1em">
                {h}ʰ
              </text>
            </g>
          );
        })}
        {[30, 40, 50].map(d => {
          const y = pY(decToY(d));
          return (
            <g key={'dec'+d} opacity=".55">
              <line x1={26} y1={y} x2={36} y2={y} stroke="var(--ink-3)" strokeWidth=".8"/>
              <text x={20} y={y + 4} fill="var(--ink-3)" fontSize="13"
                fontFamily="var(--font-mono)" textAnchor="start" letterSpacing=".06em">
                +{d}°
              </text>
            </g>
          );
        })}

        {/* Corner annotations */}
        <text x={W-32} y={28} fill="var(--ink-3)" fontSize="13"
          fontFamily="var(--font-mono)" textAnchor="end" letterSpacing=".18em">
          CYGNUS · ЛЕБЕДЬ
        </text>
        <text x={W-32} y={48} fill="var(--ink-3)" fontSize="11"
          fontFamily="var(--font-mono)" textAnchor="end" letterSpacing=".10em" opacity=".75">
          NORTHERN CROSS · 16TH CONSTELLATION
        </text>
        <text x={W-32} y={H-44} fill="var(--ink-3)" fontSize="11"
          fontFamily="var(--font-mono)" textAnchor="end" letterSpacing=".10em" opacity=".75">
          EPOCH J2000.0
        </text>
        <text x={W-32} y={H-26} fill="var(--ink-3)" fontSize="11"
          fontFamily="var(--font-mono)" textAnchor="end" letterSpacing=".10em" opacity=".75">
          DEC +28° → +52° · 8 STARS
        </text>
        <text x={32} y={H-26} fill="var(--ink-3)" fontSize="11"
          fontFamily="var(--font-mono)" textAnchor="start" letterSpacing=".10em" opacity=".75">
          v.2026 · РУССКАЯ ЯСНА
        </text>

        {/* Stick figure — dashes slowly flow */}
        {CYG_LINES.map(([a, b], i) => {
          const A = CYG.find(s => s.id === a);
          const B = CYG.find(s => s.id === b);
          const active = hover && (a === hover || b === hover);
          const rA = nodeRadius(A.mag), rB = nodeRadius(B.mag);
          const dx = pX(B.x) - pX(A.x), dy = pY(B.y) - pY(A.y);
          const len = Math.hypot(dx, dy);
          const ux = dx/len, uy = dy/len;
          const x1 = pX(A.x) + ux * (rA + 6);
          const y1 = pY(A.y) + uy * (rA + 6);
          const x2 = pX(B.x) - ux * (rB + 6);
          const y2 = pY(B.y) - uy * (rB + 6);
          return (
            <line key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              className="cyg-line"
              stroke={active ? "var(--accent)" : "var(--ink)"}
              strokeWidth={active ? 1.4 : 1.0}
              opacity={active ? .60 : .30}
              vectorEffect="non-scaling-stroke"
              style={{transition:"stroke .3s, opacity .3s, stroke-width .3s"}}/>
          );
        })}

        {/* Constellation nodes (glyphs replace bare star dots) */}
        {CYG.map((s, i) => {
          const cx = pX(s.x), cy = pY(s.y);
          const r  = nodeRadius(s.mag);
          const isHover = hover === s.id;
          const dim = hover && !isHover;
          const inner = r * 0.65;
          return (
            <g key={s.id}
               transform={`translate(${cx} ${cy})`}
               style={{
                 opacity: dim ? .50 : 1,
                 transition: 'opacity .3s',
                 cursor:'pointer',
               }}
               onMouseEnter={() => setHover(s.id)}
               onMouseLeave={() => setHover(null)}>
              {/* Outer halo (animated — own group so scale doesn't disturb translate) */}
              <g className="cyg-halo" style={{'--n': i}}>
                <circle cx="0" cy="0" r={r * 1.8}
                  fill={isHover ? "url(#cyg-halo-hot)" : "url(#cyg-halo)"}/>
              </g>
              {/* Breathing wrapper (only scale here — no translate) */}
              <g className="cyg-node-breath"
                 style={{
                   '--n': i,
                   color: isHover ? 'var(--accent)' : 'var(--ink)',
                   transition: 'color .25s',
                 }}>
                <a href={s.href}>
                  <circle cx="0" cy="0" r={r}
                    fill="var(--paper)"
                    stroke="currentColor"
                    strokeWidth={isHover ? 1.8 : 1.2}
                    className="cyg-node-body"
                    style={{transition:'stroke-width .25s'}}/>
                  <g className="cyg-node-glyph">
                    {renderGlyph(s.id, inner)}
                  </g>
                </a>
              </g>
              {/* (star designation removed per request) */}
            </g>
          );
        })}

        {/* Labels */}
        {CYG.map(s => {
          const cx = pX(s.x), cy = pY(s.y);
          const r  = nodeRadius(s.mag);
          const off = r + 22;
          const isHover = hover === s.id;
          const dim = hover && !isHover;
          let lx, ly_top, anchor;
          if (s.lblPos === 'right') { lx = cx + off; ly_top = cy - 14; anchor = 'start'; }
          else if (s.lblPos === 'left')  { lx = cx - off; ly_top = cy - 14; anchor = 'end'; }
          else if (s.lblPos === 'below') { lx = cx; ly_top = cy + off; anchor = 'middle'; }
          else                           { lx = cx; ly_top = cy - off - 38; anchor = 'middle'; }
          return (
            <g key={'l-'+s.id}
               style={{opacity: dim ? .3 : 1, transition:'opacity .3s', pointerEvents:'none'}}>
              <text x={lx} y={ly_top + 26}
                fill={isHover ? "var(--accent)" : "var(--ink)"}
                fontSize="24" fontFamily="var(--font-display)" fontWeight="700"
                letterSpacing="-.018em"
                textAnchor={anchor}
                style={{transition:'fill .25s'}}>
                {s.dir}
              </text>
              <text x={lx} y={ly_top + 46}
                fill="var(--ink-3)" fontSize="12"
                fontFamily="var(--font-mono)" letterSpacing=".10em"
                textAnchor={anchor}>
                {s.cat.toUpperCase()} · {s.count}+
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── Star key table (replaces old connections graph) ────────────── */
function StarKey(){
  const fmtRA = (deg) => {
    const h = deg / 15;
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return `${hh}ʰ ${String(mm).padStart(2,'0')}ᵐ`;
  };
  const fmtDec = (dec) => {
    const d = Math.floor(dec);
    const m = Math.round((dec - d) * 60);
    return `+${d}° ${String(m).padStart(2,'0')}′`;
  };
  const sorted = [...CYG].sort((a,b) => a.mag - b.mag);

  return (
    <div className="cyg-key">
      <div className="cyg-key-head">
        <div>Δ</div>
        <div>STAR · ЗВЕЗДА</div>
        <div>MAG</div>
        <div>RA</div>
        <div>DEC</div>
        <div>НАПРАВЛЕНИЕ</div>
      </div>
      {sorted.map(s => (
        <a key={s.id} href={s.href} className="cyg-key-row">
          <div className="kc-glyph">{s.star}</div>
          <div className="kc-name">
            <span className="kc-latin">{s.latin}</span>
            <span className="kc-cyr">{s.cyr}</span>
          </div>
          <div className="kc-mag">{s.mag.toFixed(2)}</div>
          <div className="kc-ra">{fmtRA(s.ra)}</div>
          <div className="kc-dec">{fmtDec(s.dec)}</div>
          <div className="kc-dir">
            <span className="kc-dir-name">{s.dir}</span>
            <span className="kc-dir-meta">{s.cat} · {s.count}+</span>
          </div>
        </a>
      ))}
    </div>
  );
}

/* ─── Quiz ────────────────────────────────────────────────────────── */
const QUESTIONS = [
  {
    q: 'Что зацепит вас сильнее?',
    opts: [
      { t: 'Прогулка по городу с открытием смыслов', tags: ['neglinka','marshruty'] },
      { t: 'Разбор слова и его настоящего значения', tags: ['izvod','litprosvet'] },
      { t: 'Связь земного и небесного, календарь',   tags: ['astronevod','prazdniki'] },
      { t: 'Семья, дети, традиции дома',              tags: ['teremok','prazdniki','dzhiva'] },
    ],
  },
  {
    q: 'В каком ритме удобно участвовать?',
    opts: [
      { t: 'Выходить из дома: гулять, встречаться', tags: ['neglinka','marshruty','prazdniki'] },
      { t: 'Дома, в своём темпе — текст, видео',    tags: ['izvod','litprosvet','astronevod','dzhiva'] },
      { t: 'Вместе с детьми',                        tags: ['teremok','prazdniki'] },
      { t: 'Гибко — и то, и другое',                 tags: ['litprosvet','prazdniki','neglinka'] },
    ],
  },
  {
    q: 'Что важнее: знание или практика?',
    opts: [
      { t: 'Первоисточники, исследование',       tags: ['izvod','astronevod','litprosvet'] },
      { t: 'Делать своими руками, на месте',     tags: ['prazdniki','marshruty','dzhiva'] },
      { t: 'Передать смысл следующему поколению', tags: ['teremok','prazdniki'] },
      { t: 'Совмещать в равной мере',             tags: ['neglinka','litprosvet'] },
    ],
  },
];

function Quiz(){
  const [step, setStep]     = React.useState(0);
  const [scores, setScores] = React.useState({});

  const pick = (opt) => {
    const next = {...scores};
    opt.tags.forEach((t,i) => { next[t] = (next[t]||0) + (1/(i+1)); });
    setScores(next);
    setStep(step + 1);
  };
  const reset = () => { setScores({}); setStep(0); };

  const done = step >= QUESTIONS.length;
  let winner = null, runnerUp = null;
  if (done) {
    const sorted = Object.entries(scores).sort((a,b) => b[1]-a[1]);
    winner = CYG.find(d => d.id === sorted[0]?.[0]) || CYG[0];
    runnerUp = CYG.find(d => d.id === sorted[1]?.[0]);
  }

  if (done) {
    return (
      <div className="quiz">
        <div className="head">
          <div>
            <div className="eyebrow">Результат · 3 / 3</div>
            <h3 style={{margin:'8px 0 0', fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.4rem', letterSpacing:'-0.014em'}}>Вам подойдёт</h3>
          </div>
          <button className="restart" onClick={reset}>↻ Пройти ещё раз</button>
        </div>
        <div className="result">
          <div>
            <div className="lead-line">Ваша звезда · {winner.star} {winner.latin}</div>
            <h3>{winner.dir}</h3>
            <p>{winner.cat} · {winner.count}+ участников · {winner.place}.</p>
            <div className="acts">
              <a className="btn btn-primary" href={winner.href}>
                Перейти к направлению <span className="arr">→</span>
              </a>
              <a className="btn btn-ghost" href="#join">Оставить заявку</a>
            </div>
            {runnerUp && <div className="alt">также близко: <b style={{color:'var(--ink)'}}>{runnerUp.dir}</b></div>}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
            {Object.entries(scores)
              .sort((a,b)=>b[1]-a[1])
              .slice(0,4)
              .map(([id, sc], i) => {
                const dn = CYG.find(d => d.id === id);
                if (!dn) return null;
                const top = Math.max(...Object.values(scores));
                const pct = Math.round((sc/top)*100);
                return (
                  <div key={id} style={{padding:'14px 16px', background:'var(--bg)', borderRadius:'10px', border:'1px solid var(--line)'}}>
                    <div style={{fontFamily:'var(--font-mono)', fontSize:'.66rem', letterSpacing:'.12em', color:'var(--ink-3)', textTransform:'uppercase', marginBottom:'6px'}}>
                      {dn.star} · {dn.latin}
                    </div>
                    <div style={{fontFamily:'var(--font-display)', fontWeight:600, fontSize:'.98rem', marginBottom:'10px', letterSpacing:'-0.008em'}}>
                      {dn.dir}
                    </div>
                    <div style={{height:'4px', background:'var(--line)', borderRadius:'2px', overflow:'hidden'}}>
                      <div style={{height:'100%', width:`${pct}%`, background:i===0?'var(--ink)':'var(--accent)', transition:'width .4s'}}/>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  }

  const Q = QUESTIONS[step];
  return (
    <div className="quiz">
      <div className="head">
        <div>
          <div className="eyebrow">Вопрос {step+1} из {QUESTIONS.length}</div>
        </div>
        <div className="progress">
          {QUESTIONS.map((_, i) => (
            <span key={i} className={"pdot " + (i<step ? "done" : i===step ? "on" : "")}/>
          ))}
        </div>
      </div>
      <p className="q">{Q.q}</p>
      <div className="opts">
        {Q.opts.map((o, i) => (
          <button key={i} className="opt" onClick={()=>pick(o)}>
            <span className="o-num">0{i+1}</span>
            <span className="o-text">{o.t}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Russian Cross — circle of responsibility ───────────────────── */
const CROSS_ROLES = [
  { id:'society',  label:'ГОСУДАРСТВО', answersFor:'отца',    gives:'строй · смысл · место',  pos:'n' },
  { id:'children', label:'ДЕТИ',     answersFor:'будущее', gives:'продолжение · надежду', pos:'e' },
  { id:'mother',   label:'МАТЬ',     answersFor:'детей',   gives:'тепло · опору · корни', pos:'s' },
  { id:'father',   label:'ОТЕЦ',     answersFor:'семью',   gives:'дом · имя · защиту',     pos:'w' },
];
const CROSS_NEXT = { father:'society', society:'children', children:'mother', mother:'father' };
const CROSS_BEFORE = { father:'государством', society:'будущим детей', children:'матерью', mother:'отцом' };

function CrossDiagram(){
  const [active, setActive] = React.useState(null);
  const [auto, setAuto]     = React.useState(0);
  React.useEffect(() => {
    if (active) return;
    const id = setInterval(() => setAuto(a => (a + 1) % 4), 2400);
    return () => clearInterval(id);
  }, [active]);

  const order = ['father', 'society', 'children', 'mother'];
  const litId = active || order[auto];

  return (
    <div className="rc-wrap">
      <div className="rc-grid">
        {CROSS_ROLES.map(r => (
          <article
            key={r.id}
            className={`rc-card rc-card--${r.pos} ${litId === r.id ? 'is-lit' : ''}`}
            onMouseEnter={() => setActive(r.id)}
            onMouseLeave={() => setActive(null)}>
            <span className="rc-card-mark"/>
            <h3 className="rc-card-title">{r.label}</h3>
            <dl className="rc-card-meta">
              <div>
                <dt>Отвечает за</dt>
                <dd>{r.answersFor}</dd>
              </div>
              <div>
                <dt>Перед</dt>
                <dd className="rc-before">{CROSS_BEFORE[r.id]}</dd>
              </div>
            </dl>
            <div className="rc-card-gives"><span className="rc-gives-l">даёт</span><span>{r.gives}</span></div>
          </article>
        ))}
        <div className="rc-center">
          <CrossSvg active={litId}/>
        </div>
      </div>
      <div className="rc-foot">
        <span className="rc-foot-l">Если разорвать одно звено —</span>
        <span className="rc-foot-r">рушится&nbsp;весь&nbsp;круг.</span>
      </div>
    </div>
  );
}

function CrossSvg({active}){
  const W = 320, H = 320;
  const cx = W/2, cy = H/2;
  const r = 118;
  const off = 30;
  const arcs = {
    society:  `M ${cx + off*0.4} ${cy - r*0.95} A ${r} ${r} 0 0 1 ${cx + r*0.95} ${cy - off*0.4}`,
    children: `M ${cx + r*0.95} ${cy + off*0.4} A ${r} ${r} 0 0 1 ${cx + off*0.4} ${cy + r*0.95}`,
    mother:   `M ${cx - off*0.4} ${cy + r*0.95} A ${r} ${r} 0 0 1 ${cx - r*0.95} ${cy + off*0.4}`,
    father:   `M ${cx - r*0.95} ${cy - off*0.4} A ${r} ${r} 0 0 1 ${cx - off*0.4} ${cy - r*0.95}`,
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="rc-svg" aria-hidden="true">
      <defs>
        <marker id="rc-arrow" viewBox="0 0 10 10" refX="8" refY="5"
          markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 0 L 9 5 L 0 10 Z" fill="var(--ink)"/>
        </marker>
        <marker id="rc-arrow-hot" viewBox="0 0 10 10" refX="8" refY="5"
          markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 0 L 9 5 L 0 10 Z" fill="var(--accent)"/>
        </marker>
      </defs>
      <circle cx={cx} cy={cy} r={r}
        fill="none" stroke="var(--line)" strokeWidth="1"
        strokeDasharray="2 6" opacity=".7"/>
      <line x1={cx} y1={cy - 24} x2={cx} y2={cy + 24}
        stroke="var(--ink)" strokeWidth="1.4"/>
      <line x1={cx - 24} y1={cy} x2={cx + 24} y2={cy}
        stroke="var(--ink)" strokeWidth="1.4"/>
      <circle cx={cx} cy={cy} r="4.5" fill="var(--accent)"/>
      {['father','society','children','mother'].map(id => {
        const isAct = active === id;
        return (
          <path key={id} d={arcs[id]}
            fill="none"
            stroke={isAct ? 'var(--accent)' : 'var(--ink)'}
            strokeWidth={isAct ? 2.0 : 1.2}
            opacity={isAct ? 1 : 0.28}
            markerEnd={`url(#${isAct ? 'rc-arrow-hot' : 'rc-arrow'})`}
            style={{transition:'all .35s ease'}}/>
        );
      })}
    </svg>
  );
}

/* ─── Life Spheres ↔ Directions ──────────────────────────────────── */
const SPHERES = [
  { id:'body',    label:'Здоровье',  short:'тело · голос · энергия'          },
  { id:'mind',    label:'Мышление',  short:'речь · чтение · точность'        },
  { id:'family',  label:'Семья',     short:'дом · близкие · традиции'        },
  { id:'kids',    label:'Дети',      short:'воспитание · обучение'            },
  { id:'city',    label:'Город',     short:'место · прогулки · история улиц' },
  { id:'meaning', label:'Кругозор',  short:'история · небо · картина мира'   },
];
const DIRS_LM = [
  { id:'neglinka',   name:'Неглинка',       cat:'История'      },
  { id:'litprosvet', name:'ЛитПроСвет',     cat:'Литература'   },
  { id:'astronevod', name:'Астроневод',     cat:'Астрономия'   },
  { id:'prazdniki',  name:'Праздники',      cat:'Традиции'     },
  { id:'dzhiva',     name:'Джива',          cat:'Здоровье'     },
  { id:'marshruty',  name:'Ясные маршруты', cat:'Путешествия'  },
  { id:'izvod',      name:'Извод',          cat:'Язык'         },
  { id:'teremok',    name:'Ясна-Школа',     cat:'Дети 7–16'    },
];
const DIR_SPHERES = {
  neglinka:   ['city','meaning'],
  litprosvet: ['mind','meaning'],
  astronevod: ['meaning'],
  prazdniki:  ['family','kids'],
  dzhiva:     ['body'],
  marshruty:  ['city','body'],
  izvod:      ['mind'],
  teremok:    ['kids','family'],
};

function LifeMap(){
  const [hover, setHover] = React.useState(null); // {type, id} | null

  const isSphereLit = (sId) =>
    hover?.type === 'sphere' ? hover.id === sId
    : hover?.type === 'dir'  ? DIR_SPHERES[hover.id]?.includes(sId)
    : false;
  const isDirLit = (dId) =>
    hover?.type === 'dir'    ? hover.id === dId
    : hover?.type === 'sphere'? DIR_SPHERES[dId]?.includes(hover.id)
    : false;

  // SVG geometry for curves
  const W = 1000, H = 720;
  const sphereSpacing = H / SPHERES.length;
  const dirSpacing    = H / DIRS_LM.length;
  const sphereY = (i) => sphereSpacing * (i + 0.5);
  const dirY    = (i) => dirSpacing    * (i + 0.5);

  const connections = [];
  DIRS_LM.forEach((d, dIdx) => {
    (DIR_SPHERES[d.id] || []).forEach(sId => {
      const sIdx = SPHERES.findIndex(s => s.id === sId);
      if (sIdx < 0) return;
      connections.push({ dirId: d.id, sphereId: sId, y1: sphereY(sIdx), y2: dirY(dIdx) });
    });
  });

  return (
    <div className="lm-wrap">
      <div className="lm-grid">
        {/* Left column: spheres */}
        <div className="lm-col lm-col--spheres">
          <div className="lm-col-head">СФЕРА ЖИЗНИ</div>
          {SPHERES.map((s, i) => {
            const lit = isSphereLit(s.id);
            const dim = hover && !lit;
            return (
              <button key={s.id}
                className={"lm-row lm-sphere " + (lit ? "is-lit " : "") + (dim ? "is-dim" : "")}
                onMouseEnter={() => setHover({type:'sphere', id: s.id})}
                onMouseLeave={() => setHover(null)}>
                <span className="lm-num">{String(i+1).padStart(2,'0')}</span>
                <div className="lm-text">
                  <span className="lm-label">{s.label}</span>
                  <span className="lm-short">{s.short}</span>
                </div>
                <span className="lm-dot"/>
              </button>
            );
          })}
        </div>

        {/* Middle column: connection curves */}
        <div className="lm-mid">
          <svg className="lm-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            {connections.map((c, i) => {
              const lit = hover && (
                (hover.type === 'sphere' && hover.id === c.sphereId) ||
                (hover.type === 'dir'    && hover.id === c.dirId)
              );
              const dim = hover && !lit;
              return (
                <path key={i}
                  d={`M 0 ${c.y1} C ${W*0.45} ${c.y1}, ${W*0.55} ${c.y2}, ${W} ${c.y2}`}
                  fill="none"
                  stroke={lit ? "var(--accent)" : "var(--ink)"}
                  strokeWidth={lit ? 1.8 : 0.8}
                  opacity={dim ? 0.07 : (lit ? 0.75 : 0.22)}
                  style={{transition:"opacity .3s, stroke .3s, stroke-width .3s"}}/>
              );
            })}
          </svg>
        </div>

        {/* Right column: directions */}
        <div className="lm-col lm-col--dirs">
          <div className="lm-col-head">НАПРАВЛЕНИЕ</div>
          {DIRS_LM.map((d, i) => {
            const lit = isDirLit(d.id);
            const dim = hover && !lit;
            return (
              <button key={d.id}
                className={"lm-row lm-dir " + (lit ? "is-lit " : "") + (dim ? "is-dim" : "")}
                onMouseEnter={() => setHover({type:'dir', id: d.id})}
                onMouseLeave={() => setHover(null)}>
                <span className="lm-dot"/>
                <div className="lm-text" style={{alignItems:'flex-end', textAlign:'right'}}>
                  <span className="lm-label">{d.name}</span>
                  <span className="lm-short">{d.cat}</span>
                </div>
                <span className="lm-num">{String(i+1).padStart(2,'0')}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="lm-hint">
        <span>Наведите на любой пункт — увидите связи</span>
        <span className="lm-hint-r">{SPHERES.length} сфер · {DIRS_LM.length} направлений</span>
      </div>
    </div>
  );
}

Object.assign(window, { Constellation, StarKey, Quiz, CrossDiagram, LifeMap, CYG });

(function mount(){
  const slots = [
    ['#hero-map',    Constellation],
    ['#starkey-mount', StarKey],
    ['#quiz-mount',  Quiz],
    ['#cross-mount', CrossDiagram],
    ['#life-mount',  LifeMap],
  ];
  slots.forEach(([sel, Comp]) => {
    const el = document.querySelector(sel);
    if (el) ReactDOM.createRoot(el).render(<Comp/>);
  });
})();
