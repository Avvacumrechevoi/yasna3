// Tweaks panel — controls global CSS vars via data-* attributes on <body>
// Loaded after tweaks-panel.jsx

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "iney",
  "fontpair": "modern",
  "density": "regular",
  "fontSize": 16
}/*EDITMODE-END*/;

const PALETTES = [
  { id:'iney',    label:'Иней',    swatches:['#f5f3ee','#1a1714','#a9743b'] },
  { id:'zemlya',  label:'Земля',   swatches:['#f1ece1','#231b13','#8a3a1e'] },
  { id:'lazur',   label:'Лазурь',  swatches:['#e6eaf0','#15203a','#1f4a7a'] },
  { id:'ugol',    label:'Уголь',   swatches:['#15130f','#efeae0','#d49a5a'] },
];

function applyTweaks(t){
  const body = document.body;
  body.setAttribute('data-palette', t.palette);
  body.setAttribute('data-fontpair', t.fontpair);
  body.setAttribute('data-density', t.density);
  document.documentElement.style.setProperty('--fs-root', t.fontSize + 'px');
}

function TweaksApp(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  React.useEffect(()=>applyTweaks(t), [t]);

  const paletteIdx = PALETTES.findIndex(p=>p.id===t.palette);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Палитра"/>
      <div className="twk-row">
        <div className="twk-lbl"><span>Цветовая схема</span><span className="twk-val">{PALETTES[paletteIdx]?.label}</span></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'6px'}}>
          {PALETTES.map(p => (
            <button key={p.id}
              onClick={()=>setTweak('palette', p.id)}
              title={p.label}
              style={{
                padding:'8px 6px',
                background: p.id===t.palette ? 'rgba(0,0,0,.08)' : 'transparent',
                border: p.id===t.palette ? '1px solid rgba(0,0,0,.18)' : '1px solid rgba(0,0,0,.08)',
                borderRadius:'8px',
                cursor:'default',
                display:'flex', flexDirection:'column', gap:'5px', alignItems:'center'
              }}>
              <div style={{display:'flex', gap:'2px'}}>
                {p.swatches.map((c,i)=>(
                  <span key={i} style={{width:'10px', height:'14px', background:c, borderRadius:'2px', border:'.5px solid rgba(0,0,0,.1)'}}/>
                ))}
              </div>
              <span style={{fontSize:'10px', fontWeight: p.id===t.palette?600:500}}>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <TweakSection label="Типографика"/>
      <TweakRadio label="Шрифтовая пара" value={t.fontpair}
        options={[
          { value:'modern',   label:'Современная' },
          { value:'contrast', label:'Контраст' },
          { value:'book',     label:'Книжная' },
          { value:'mono',     label:'Моно' },
        ]}
        onChange={(v)=>setTweak('fontpair', v)}/>
      <TweakSlider label="Размер шрифта" value={t.fontSize} min={14} max={20} unit="px"
        onChange={(v)=>setTweak('fontSize', v)}/>

      <TweakSection label="Плотность"/>
      <TweakRadio label="Воздух" value={t.density}
        options={['compact','regular','comfy']}
        onChange={(v)=>setTweak('density', v)}/>
    </TweaksPanel>
  );
}

// Mount
(function(){
  const el = document.getElementById('tweaks-root');
  if(el) ReactDOM.createRoot(el).render(<TweaksApp/>);
  // Apply defaults right away even if panel isn't visible
  applyTweaks(TWEAK_DEFAULTS);
})();
