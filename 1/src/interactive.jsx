/* CrossDiagram — диаграмма «Четыре опоры. Один круг» на главной (#cross-mount).
   Файл сокращён 06.07.2026: удалены немонтируемые компоненты
   Constellation / StarKey / Quiz / LifeMap (~600 строк), их блоки на странице
   отсутствовали, а Babel-standalone компилировал весь файл при каждой загрузке. */

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

(function mount(){
  const el = document.querySelector('#cross-mount');
  if (el) ReactDOM.createRoot(el).render(<CrossDiagram/>);
})();
