import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const accentColor = '#FDBA74' // Amber 300 / Systems theme

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function labelForPeriodo(p) {
  if (!p) return '—'
  const [y,m] = p.split('-')
  return `${MONTHS_ES[parseInt(m)-1]} ${y}`
}

async function loadPeriodData(periodo) {
  const [{ data: daily }, { data: ga4 }] = await Promise.all([
    supabase.from('sistemas_diario').select('*').eq('periodo', periodo),
    supabase.from('ga4_metrics').select('*').eq('periodo', periodo).maybeSingle(),
  ])
  const records = daily || []
  const totals = records.reduce((acc, r) => {
    acc.incidencias += r.incidencias_resueltas || 0
    acc.codigos     += r.imagenes_codigos_actualizadas || 0
    acc.optimizadas += r.imagenes_peso_optimizado || 0
    acc.dias        += 1
    return acc
  }, { incidencias:0, codigos:0, optimizadas:0, dias:0 })
  return { totals, ga4: ga4 || null }
}

function delta(a, b) {
  if (b===0 && a===0) return null
  if (b===0) return 100
  return ((a-b)/b*100)
}

function DeltaBadge({ value, higherIsBetter=true }) {
  if (value===null) return <span style={{ color: 'rgba(255,255,255,0.3)', fontSize:'0.75rem' }}>—</span>
  const isGood = higherIsBetter ? value>=0 : value<=0
  const color = isGood ? '#10B981' : '#F0436A'
  
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      fontFamily:'var(--font-mono)', fontSize:'0.8rem', fontWeight: 800, color: color,
      background: `${color}15`, border: `1px solid ${color}33`,
      borderRadius:12, padding:'4px 12px',
      boxShadow: `0 4px 12px ${color}11`
    }}>
      {value>=0?'▲':'▼'} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function MonthSelect({ label, value, onChange, options }) {
  return (
    <div style={{ flex:1, minWidth:220 }}>
      <div style={{ fontSize:'0.75rem', fontWeight: 800, letterSpacing:'0.1em', color:'rgba(255,255,255,0.4)', marginBottom:10, textTransform:'uppercase' }}>{label}</div>
      <select value={value} onChange={e=>onChange(e.target.value)} style={{
        width:'100%', padding:'12px 18px',
        background:'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${value ? accentColor + '66' : 'rgba(255, 255, 255, 0.1)'}`,
        borderRadius:14, color:'#fff', fontSize:'0.95rem', cursor:'pointer',
        boxShadow: value ? `0 0 15px ${accentColor}11` : 'none',
        outline: 'none', transition: 'all 0.3s'
      }}>
        <option value="" style={{ background: '#080C1C' }}>— Seleccionar mes —</option>
        {options.map(m => <option key={m} value={m} style={{ background: '#080C1C' }}>{labelForPeriodo(m)}</option>)}
      </select>
    </div>
  )
}

const METRICS = [
  // Diario
  { key:'incidencias',  label:'Incidencias resueltas',    emoji:'🔧', src:'totals', higherIsBetter:true  },
  { key:'codigos',      label:'Imágenes con código',      emoji:'🏷️', src:'totals', higherIsBetter:true  },
  { key:'optimizadas',  label:'Imágenes optimizadas',     emoji:'⚡', src:'totals', higherIsBetter:true  },
  { key:'dias',         label:'Días con registro',        emoji:'📋', src:'totals', higherIsBetter:true  },
  // GA4
  { key:'sesiones',           label:'Sesiones web',          emoji:'🌐', src:'ga4', higherIsBetter:true  },
  { key:'usuarios_activos',   label:'Usuarios activos',      emoji:'👤', src:'ga4', higherIsBetter:true  },
  { key:'pageviews',          label:'Páginas vistas',        emoji:'👁️', src:'ga4', higherIsBetter:true  },
  { key:'tasa_rebote',        label:'Bounce Rate (%)',       emoji:'↩️', src:'ga4', higherIsBetter:false },
  { key:'duracion_promedio_seg', label:'Duración prom. (seg)',emoji:'⏱️', src:'ga4', higherIsBetter:true  },
  { key:'trafico_organico',   label:'Tráfico orgánico',      emoji:'🔍', src:'ga4', higherIsBetter:true  },
  { key:'trafico_social',     label:'Tráfico social',        emoji:'📱', src:'ga4', higherIsBetter:true  },
]

export default function SistemasCompararPage() {
  const [availableMonths, setAvailableMonths] = useState([])
  const [periodoA, setPeriodoA] = useState('')
  const [periodoB, setPeriodoB] = useState('')
  const [dataA, setDataA] = useState(null)
  const [dataB, setDataB] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadMonths() {
      const [{ data: d1 }, { data: d2 }] = await Promise.all([
        supabase.from('sistemas_diario').select('periodo').order('periodo', { ascending: false }),
        supabase.from('ga4_metrics').select('periodo').order('periodo', { ascending: false }),
      ])
      const all = [...new Set([...(d1||[]).map(r=>r.periodo), ...(d2||[]).map(r=>r.periodo)])]
        .sort((a,b) => b.localeCompare(a))
      setAvailableMonths(all)
      if (all.length >= 1) setPeriodoA(all[0])
      if (all.length >= 2) setPeriodoB(all[1])
    }
    loadMonths()
  }, [])

  useEffect(() => {
    if (periodoA) { setLoading(true); loadPeriodData(periodoA).then(d => { setDataA(d); setLoading(false) }) }
  }, [periodoA])
  useEffect(() => {
    if (periodoB) { setLoading(true); loadPeriodData(periodoB).then(d => { setDataB(d); setLoading(false) }) }
  }, [periodoB])

  function getVal(data, metric) {
    if (!data) return 0
    if (metric.src === 'totals') return data.totals[metric.key] ?? 0
    return data.ga4?.[metric.key] ?? 0
  }

  const canCompare = dataA && dataB

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom:32 }}>
        <h1 style={{ 
          fontSize:'2.5rem', fontWeight: 900, letterSpacing:'-2px', marginBottom:4,
          background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.55))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Comparativa de Rendimiento
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', fontWeight: 500 }}>
          Sistemas / Web · Análisis evolutivo de infraestructura y métricas digitales
        </p>
      </div>

      {/* Selectors Panel */}
      <div style={{ 
        background:'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', 
        border:'1px solid rgba(255, 255, 255, 0.12)', borderRadius:32, padding:'28px 32px', 
        marginBottom:32, boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
        display:'flex', gap:24, alignItems:'flex-end', flexWrap:'wrap'
      }}>
        <MonthSelect label="Periodo actual (A)" value={periodoA} onChange={setPeriodoA} options={availableMonths} />
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', borderRadius: '50%', width: 48, height: 48, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor, 
          fontSize: '1.2rem', paddingBottom: 2, border: '1px solid rgba(255,255,255,0.1)' 
        }}>⇄</div>
        <MonthSelect label="Periodo anterior (B)" value={periodoB} onChange={setPeriodoB} options={availableMonths} />
        
        {availableMonths.length < 2 && (
          <div style={{ width: '100%', color: accentColor, fontSize: '0.85rem', fontWeight: 700, background: `${accentColor}11`, padding: '10px 16px', borderRadius: 12, border: `1px solid ${accentColor}33` }}>
            ⚠️ Se requieren al menos dos periodos con registros para generar la comparativa.
          </div>
        )}
      </div>

      {loading && (
        <div style={{ display:'flex', justifyContent:'center', padding:100 }}>
          <div className="animate-spin" style={{ width:40, height:40, borderRadius:'50%', border:'4px solid rgba(255,255,255,0.1)', borderTopColor: accentColor }} />
        </div>
      )}

      {canCompare && !loading && (
        <div className="animate-fadeUp">
          {/* Hero Comparison Summary */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:20, marginBottom:32, alignItems:'center' }}>
            {[
              { label: labelForPeriodo(periodoA), data: dataA, accent: accentColor },
              null,
              { label: labelForPeriodo(periodoB), data: dataB, accent: '#60A5FA' },
            ].map((item, i) => item === null ? (
              <div key={i} style={{ 
                fontSize:'1.2rem', fontWeight: 900, color: 'rgba(255,255,255,0.2)', 
                fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' 
              }}>VS</div>
            ) : (
              <div key={i} style={{ 
                background:'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', 
                border:'1px solid rgba(255, 255, 255, 0.12)', borderRadius:32, padding:'32px', 
                textAlign: i === 0 ? 'left' : 'right', boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
                position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: item.accent }} />
                <div style={{ fontSize:'0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{item.label}</div>
                <div style={{ 
                  fontFamily:'var(--font-mono)', fontSize:'3.5rem', fontWeight: 900, 
                  color:'#fff', letterSpacing:'-3px', lineHeight: 1 
                }}>
                  {item.data.totals.incidencias}
                </div>
                <div style={{ fontSize:'0.85rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginTop: 4 }}>incidencias técnicos resueltas</div>
              </div>
            ))}
          </div>

          {/* Metric Groups */}
          {[
            { title:'📋 Actividad y Operativa Técnica', metrics: METRICS.filter(m=>m.src==='totals') },
            { title:'📈 Rendimiento Website (GA4)', metrics: METRICS.filter(m=>m.src==='ga4') },
          ].map(section => (
            <div key={section.title} style={{ 
              background:'rgba(255, 255, 255, 0.05)', border:'1px solid rgba(255, 255, 255, 0.1)', 
              borderRadius:32, overflow:'hidden', marginBottom:24, boxShadow:'0 4px 20px rgba(0,0,0,0.1)' 
            }}>
              <div style={{
                display:'grid', gridTemplateColumns:'1fr 140px 140px 160px',
                padding:'18px 32px', background:'rgba(255, 255, 255, 0.03)',
                borderBottom:'1px solid rgba(255, 255, 255, 0.1)', gap:20, alignItems: 'center'
              }}>
                <div style={{ fontSize:'0.85rem', fontWeight: 900, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{section.title}</div>
                {[labelForPeriodo(periodoA), labelForPeriodo(periodoB), 'Tendencia'].map((h,i) => (
                  <div key={i} style={{ fontSize:'0.75rem', fontWeight: 800, color:'rgba(255,255,255,0.4)', letterSpacing:'0.05em', textAlign:'right', textTransform: 'uppercase' }}>{h}</div>
                ))}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {section.metrics.map((m, i) => {
                  const valA = getVal(dataA, m)
                  const valB = getVal(dataB, m)
                  const d = delta(valA, valB) // A vs B (Current vs Previous)
                  
                  return (
                    <div key={m.key} style={{
                      display:'grid', gridTemplateColumns:'1fr 140px 140px 160px',
                      padding:'20px 32px', gap:20, alignItems:'center',
                      borderTop: i === 0 ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'}
                    >
                      <div style={{ fontSize:'1rem', color:'#fff', fontWeight: 700, display:'flex', alignItems:'center', gap:12 }}>
                        <span style={{ fontSize: 20 }}>{m.emoji}</span>
                        {m.label}
                      </div>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:'1.1rem', textAlign:'right', fontWeight: 800, color: '#fff' }}>
                        {valA?.toLocaleString('es-AR') ?? '—'}
                      </div>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:'1.1rem', textAlign:'right', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>
                        {valB?.toLocaleString('es-AR') ?? '—'}
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <DeltaBadge value={d} higherIsBetter={m.higherIsBetter} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
