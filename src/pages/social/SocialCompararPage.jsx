import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const color = '#f0436a'
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function labelPeriodo(p) {
  if (!p) return '—'
  const [y,m] = p.split('-')
  return `${MONTHS_ES[parseInt(m)-1]} ${y}`
}
function fmt(n) {
  if (n === null || n === undefined) return '—'
  return Number(n).toLocaleString('es-AR')
}
function delta(a, b) {
  if ((b === null || b === undefined) && (a === null || a === undefined)) return null
  if (!b || b === 0) return a > 0 ? 100 : null
  return ((a - b) / b * 100)
}

function DeltaBadge({ value, higherIsBetter = true }) {
  if (value === null || value === undefined) return <span style={{ color:'var(--text-muted)',fontSize:'0.75rem' }}>—</span>
  const good = higherIsBetter ? value >= 0 : value <= 0
  const c = good ? '#10b981' : '#f0436a'
  return (
    <span style={{
      display:'inline-flex',alignItems:'center',gap:3,
      fontFamily:'var(--font-mono)',fontSize:'0.78rem',fontWeight: 600,color:c,
      background:c+'18',border:`1px solid ${c}33`,borderRadius:99,padding:'2px 10px',
    }}>
      {value >= 0 ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function MonthSelect({ label, value, onChange, options }) {
  return (
    <div style={{ flex:1,minWidth:180 }}>
      <div style={{ fontSize:'0.7rem',fontWeight: 600,letterSpacing:'0.1em',color:'var(--text-muted)',marginBottom:8,textTransform:'uppercase' }}>{label}</div>
      <select value={value} onChange={e=>onChange(e.target.value)} style={{
        width:'100%',padding:'10px 14px',
        background:'var(--bg-elevated)',
        border:`1px solid ${value?color+'66':'var(--border)'}`,
        borderRadius:10,color:'var(--text-primary)',fontSize:'0.9rem',cursor:'pointer',
      }}>
        <option value="">— Seleccionar mes —</option>
        {options.map(m => <option key={m} value={m}>{labelPeriodo(m)}</option>)}
      </select>
    </div>
  )
}

const METRICS = [
  { key:'seguidores_total',  label:'Seguidores totales',              emoji:'👥', higherIsBetter:true  },
  { key:'nuevos_seguidores', label:'Nuevos seguidores',               emoji:'📈', higherIsBetter:true  },
  { key:'alcance',           label:'Alcance',                        emoji:'🌐', higherIsBetter:true  },
  { key:'interacciones',     label:'Interacciones (likes+comentarios)',emoji:'❤️', higherIsBetter:true  },
]

export default function SocialCompararPage() {
  const [available, setAvailable] = useState([])
  const [periodoA, setPeriodoA]   = useState('')
  const [periodoB, setPeriodoB]   = useState('')
  const [dataA, setDataA]         = useState(null)
  const [dataB, setDataB]         = useState(null)
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    supabase.from('social_media_metrics').select('periodo').order('periodo', { ascending: false })
      .then(({ data }) => {
        const months = [...new Set((data||[]).map(r=>r.periodo))].sort((a,b)=>b.localeCompare(a))
        setAvailable(months)
        if (months.length >= 1) setPeriodoA(months[0])
        if (months.length >= 2) setPeriodoB(months[1])
      })
  }, [])

  useEffect(() => {
    if (!periodoA) return
    setLoading(true)
    supabase.from('social_media_metrics').select('*').eq('periodo', periodoA).maybeSingle()
      .then(({ data }) => { setDataA(data); setLoading(false) })
  }, [periodoA])

  useEffect(() => {
    if (!periodoB) return
    setLoading(true)
    supabase.from('social_media_metrics').select('*').eq('periodo', periodoB).maybeSingle()
      .then(({ data }) => { setDataB(data); setLoading(false) })
  }, [periodoB])

  const canCompare = dataA && dataB

  // Engagement rates
  const erA = dataA?.interacciones && dataA?.alcance ? (dataA.interacciones/dataA.alcance*100).toFixed(2) : null
  const erB = dataB?.interacciones && dataB?.alcance ? (dataB.interacciones/dataB.alcance*100).toFixed(2) : null

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:'1.6rem',fontWeight: 600,letterSpacing:'-0.8px',marginBottom:4 }}>Comparativa mensual</h1>
        <p style={{ color:'var(--text-secondary)',fontSize:'0.88rem' }}>Social Media · métricas de Instagram período a período</p>
      </div>

      {/* Selectors */}
      <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:14,padding:'20px 24px',marginBottom:24,boxShadow:'0 4px 16px var(--glass-shadow)' }}>
        <div style={{ display:'flex',gap:16,alignItems:'flex-end',flexWrap:'wrap' }}>
          <MonthSelect label="Mes base"        value={periodoA} onChange={setPeriodoA} options={available} />
          <div style={{ fontSize:'1.4rem',color:'var(--text-muted)',paddingBottom:10,flexShrink:0 }}>⇄</div>
          <MonthSelect label="Mes a comparar"  value={periodoB} onChange={setPeriodoB} options={available} />
        </div>
        {available.length < 2 && (
          <p style={{ color:'var(--text-muted)',fontSize:'0.8rem',marginTop:12 }}>⚠️ Necesitás al menos 2 meses con datos para comparar.</p>
        )}
      </div>

      {loading && (
        <div style={{ display:'flex',justifyContent:'center',padding:40 }}>
          <div style={{ width:24,height:24,borderRadius:'50%',border:'2px solid var(--border-bright)',borderTopColor:color,animation:'spin 0.8s linear infinite' }} />
        </div>
      )}

      {canCompare && !loading && (
        <>
          {/* Hero banners */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:12,marginBottom:20,alignItems:'center' }}>
            {[
              { label:labelPeriodo(periodoA), data:dataA, align:'left' },
              null,
              { label:labelPeriodo(periodoB), data:dataB, align:'right' },
            ].map((item,i) => item===null ? (
              <div key={i} style={{ textAlign:'center',color:'var(--text-muted)',fontSize:'1.2rem' }}>vs</div>
            ) : (
              <div key={i} style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:14,padding:'18px 22px',textAlign:item.align, boxShadow:'0 4px 16px var(--glass-shadow)' }}>
                <div style={{ fontSize:'0.75rem',color:'var(--text-muted)',marginBottom:6,fontFamily:'var(--font-mono)' }}>{item.label}</div>
                <div style={{ fontFamily:'var(--font-mono)',fontSize:'2.2rem',fontWeight: 600,color:'var(--text-primary)',letterSpacing:'-1px' }}>
                  {item.data.seguidores_total?.toLocaleString('es-AR') || '—'}
                </div>
                <div style={{ fontSize:'0.75rem',color:'var(--text-secondary)' }}>seguidores</div>
                {item.data.nuevos_seguidores && (
                  <div style={{ marginTop:4,fontSize:'0.78rem',fontFamily:'var(--font-mono)',color:'#10b981',fontWeight:600 }}>
                    +{item.data.nuevos_seguidores.toLocaleString('es-AR')} nuevos
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Metrics table */}
          <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden',marginBottom:14,boxShadow:'0 4px 16px var(--glass-shadow)' }}>
            <div style={{ display:'grid',gridTemplateColumns:'1fr repeat(3,auto)',padding:'12px 20px',background:'var(--bg-elevated)',borderBottom:'1px solid var(--border)',gap:12 }}>
              <div style={{ fontSize:'0.78rem',fontWeight: 600,color:'var(--text-secondary)' }}>📱 INSTAGRAM</div>
              {[labelPeriodo(periodoA),labelPeriodo(periodoB),'Variación'].map((h,i) => (
                <div key={i} style={{ fontSize:'0.7rem',fontWeight: 600,color:'var(--text-muted)',letterSpacing:'0.08em',textAlign:'right',minWidth:100 }}>{h}</div>
              ))}
            </div>
            {METRICS.map((m,i) => {
              const a = dataA?.[m.key]
              const b = dataB?.[m.key]
              const d = delta(b, a)
              return (
                <div key={m.key} style={{
                  display:'grid',gridTemplateColumns:'1fr repeat(3,auto)',
                  padding:'11px 20px',gap:12,alignItems:'center',
                  borderTop:i===0?'none':'1px solid var(--border)',
                  background:i%2===0?'transparent':'var(--bg-elevated)',
                }}>
                  <div style={{ fontSize:'0.82rem',color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:8 }}>
                    <span>{m.emoji}</span>{m.label}
                  </div>
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:'0.85rem',textAlign:'right',minWidth:100 }}>{fmt(a)}</div>
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:'0.85rem',textAlign:'right',minWidth:100 }}>{fmt(b)}</div>
                  <div style={{ textAlign:'right',minWidth:100 }}><DeltaBadge value={d} higherIsBetter={m.higherIsBetter} /></div>
                </div>
              )
            })}
            {/* Engagement rate row */}
            {(erA || erB) && (
              <div style={{
                display:'grid',gridTemplateColumns:'1fr repeat(3,auto)',
                padding:'11px 20px',gap:12,alignItems:'center',
                borderTop:'1px solid var(--border)',background:'var(--bg-elevated)',
              }}>
                <div style={{ fontSize:'0.82rem',color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:8 }}>
                  <span>✨</span>Engagement rate
                  <span style={{ fontSize:'0.68rem',color:'var(--text-muted)',fontStyle:'italic' }}>(calculado)</span>
                </div>
                <div style={{ fontFamily:'var(--font-mono)',fontSize:'0.85rem',textAlign:'right',minWidth:100,color:color }}>{erA ? erA+'%' : '—'}</div>
                <div style={{ fontFamily:'var(--font-mono)',fontSize:'0.85rem',textAlign:'right',minWidth:100,color:color }}>{erB ? erB+'%' : '—'}</div>
                <div style={{ textAlign:'right',minWidth:100 }}>
                  <DeltaBadge value={erA && erB ? delta(parseFloat(erB), parseFloat(erA)) : null} higherIsBetter={true} />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
