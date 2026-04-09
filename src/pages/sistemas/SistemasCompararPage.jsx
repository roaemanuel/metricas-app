import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

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
  if (value===null) return <span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>—</span>
  const isGood = higherIsBetter ? value>=0 : value<=0
  const c = isGood ? '#10b981' : '#f0436a'
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:3,
      fontFamily:'var(--font-mono)', fontSize:'0.78rem', fontWeight: 600, color:c,
      background:c+'18', border:`1px solid ${c}33`,
      borderRadius:99, padding:'2px 10px',
    }}>
      {value>=0?'▲':'▼'} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function MonthSelect({ label, value, onChange, options }) {
  const color = '#f5c518'
  return (
    <div style={{ flex:1, minWidth:180 }}>
      <div style={{ fontSize:'0.7rem', fontWeight: 600, letterSpacing:'0.1em', color:'var(--text-muted)', marginBottom:8, textTransform:'uppercase' }}>{label}</div>
      <select value={value} onChange={e=>onChange(e.target.value)} style={{
        width:'100%', padding:'10px 14px',
        background:'var(--bg-elevated)',
        border:`1px solid ${value?color+'66':'var(--border)'}`,
        borderRadius:10, color:'var(--text-primary)', fontSize:'0.9rem', cursor:'pointer',
      }}>
        <option value="">— Seleccionar mes —</option>
        {options.map(m => <option key={m} value={m}>{labelForPeriodo(m)}</option>)}
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
  { key:'sesiones',           label:'Sesiones',              emoji:'🌐', src:'ga4', higherIsBetter:true  },
  { key:'usuarios_activos',   label:'Usuarios activos',      emoji:'👤', src:'ga4', higherIsBetter:true  },
  { key:'pageviews',          label:'Páginas vistas',        emoji:'👁️', src:'ga4', higherIsBetter:true  },
  { key:'tasa_rebote',        label:'Tasa de rebote (%)',    emoji:'↩️', src:'ga4', higherIsBetter:false },
  { key:'duracion_promedio_seg', label:'Duración prom. (seg)',emoji:'⏱️', src:'ga4', higherIsBetter:true  },
  { key:'trafico_organico',   label:'Tráfico orgánico',      emoji:'🔍', src:'ga4', higherIsBetter:true  },
  { key:'trafico_social',     label:'Tráfico social',        emoji:'📱', src:'ga4', higherIsBetter:true  },
]

export default function SistemasCompararPage() {
  const color = '#f5c518'
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
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:'1.6rem', fontWeight: 600, letterSpacing:'-0.8px', marginBottom:4 }}>Comparativa mensual</h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.88rem' }}>Sistemas / Web · incidencias, imágenes y GA4 período a período</p>
      </div>

      {/* Selectors */}
      <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:14, padding:'20px 24px', marginBottom:24, boxShadow:'0 4px 16px var(--glass-shadow)' }}>
        <div style={{ display:'flex', gap:16, alignItems:'flex-end', flexWrap:'wrap' }}>
          <MonthSelect label="Mes base"         value={periodoA} onChange={setPeriodoA} options={availableMonths} />
          <div style={{ fontSize:'1.4rem', color:'var(--text-muted)', paddingBottom:10, flexShrink:0 }}>⇄</div>
          <MonthSelect label="Mes a comparar"   value={periodoB} onChange={setPeriodoB} options={availableMonths} />
        </div>
        {availableMonths.length < 2 && (
          <p style={{ color:'var(--text-muted)', fontSize:'0.8rem', marginTop:12 }}>⚠️ Necesitás al menos 2 meses con datos para comparar.</p>
        )}
      </div>

      {loading && <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
        <div style={{ width:24, height:24, borderRadius:'50%', border:'2px solid var(--border-bright)', borderTopColor:color, animation:'spin 0.8s linear infinite' }} />
      </div>}

      {canCompare && !loading && (
        <>
          {/* Summary banners */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:12, marginBottom:20, alignItems:'center' }}>
            {[
              { label:labelForPeriodo(periodoA), data:dataA, align:'left' },
              null,
              { label:labelForPeriodo(periodoB), data:dataB, align:'right' },
            ].map((item,i) => item===null ? (
              <div key={i} style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'1.2rem' }}>vs</div>
            ) : (
              <div key={i} style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:14, padding:'18px 22px', textAlign:item.align, boxShadow:'0 4px 16px var(--glass-shadow)' }}>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:6, fontFamily:'var(--font-mono)' }}>{item.label}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:'2.2rem', fontWeight: 600, color:'var(--text-primary)', letterSpacing:'-1px' }}>
                  {item.data.totals.incidencias}
                </div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>incidencias resueltas</div>
              </div>
            ))}
          </div>

          {/* Detail table — split into sections */}
          {[
            { title:'📋 Actividad diaria', metrics: METRICS.filter(m=>m.src==='totals') },
            { title:'📈 Google Analytics', metrics: METRICS.filter(m=>m.src==='ga4') },
          ].map(section => (
            <div key={section.title} style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', marginBottom:14, boxShadow:'0 4px 16px var(--glass-shadow)' }}>
              <div style={{
                display:'grid', gridTemplateColumns:'1fr repeat(3, auto)',
                padding:'12px 20px', background:'var(--bg-elevated)',
                borderBottom:'1px solid var(--border)', gap:12,
              }}>
                <div style={{ fontSize:'0.78rem', fontWeight: 600, color:'var(--text-secondary)' }}>{section.title}</div>
                {[labelForPeriodo(periodoA), labelForPeriodo(periodoB), 'Variación'].map((h,i) => (
                  <div key={i} style={{ fontSize:'0.7rem', fontWeight: 600, color:'var(--text-muted)', letterSpacing:'0.08em', textAlign:'right', minWidth:90 }}>{h}</div>
                ))}
              </div>
              {section.metrics.map((m,i) => {
                const valA = getVal(dataA, m)
                const valB = getVal(dataB, m)
                const d = delta(valB, valA)
                return (
                  <div key={m.key} style={{
                    display:'grid', gridTemplateColumns:'1fr repeat(3, auto)',
                    padding:'11px 20px', gap:12, alignItems:'center',
                    borderTop: i===0?'none':'1px solid var(--border)',
                    background: i%2===0?'transparent':'var(--bg-elevated)',
                  }}>
                    <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:8 }}>
                      <span>{m.emoji}</span>{m.label}
                    </div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.85rem', textAlign:'right', minWidth:90, color:'var(--text-primary)' }}>
                      {valA != null ? valA : '—'}
                    </div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.85rem', textAlign:'right', minWidth:90, color:'var(--text-primary)' }}>
                      {valB != null ? valB : '—'}
                    </div>
                    <div style={{ textAlign:'right', minWidth:90 }}>
                      <DeltaBadge value={d} higherIsBetter={m.higherIsBetter} />
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
