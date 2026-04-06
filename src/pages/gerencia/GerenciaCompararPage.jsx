import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const color = '#9b59f7' // Gerencia color
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function labelPeriodo(p) {
  if (!p) return '—'
  const [y,m] = p.split('-')
  return `${MONTHS_ES[parseInt(m)-1]} ${y}`
}

function formatMoney(n) {
  if (n === null || n === undefined) return '—'
  return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0 })
}

function fmt(n) {
  if (n === null || n === undefined) return '—'
  return Number(n).toLocaleString('es-AR')
}

function delta(a, b) {
  if ((b === null || b === undefined) && (a === null || a === undefined)) return null
  if (!b || b === 0) return a > 0 ? 100 : (a === 0 ? 0 : -100)
  return ((a - b) / b * 100)
}

function DeltaBadge({ value, higherIsBetter = true }) {
  if (value === null || value === undefined) return <span style={{ color:'var(--text-muted)',fontSize:'0.75rem' }}>—</span>
  const good = higherIsBetter ? value >= 0 : value <= 0
  const c = good ? '#10b981' : '#f0436a'
  return (
    <span style={{
      display:'inline-flex',alignItems:'center',gap:3,
      fontFamily:'var(--font-mono)',fontSize:'0.78rem',fontWeight:700,color:c,
      background:c+'18',border:`1px solid ${c}33`,borderRadius:99,padding:'2px 10px',
    }}>
      {value >= 0 ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function MonthSelect({ label, value, onChange, options }) {
  return (
    <div style={{ flex:1,minWidth:180 }}>
      <div style={{ fontSize:'0.7rem',fontWeight:700,letterSpacing:'0.1em',color:'var(--text-muted)',marginBottom:8,textTransform:'uppercase' }}>{label}</div>
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
  { key: 'totalIngresos',      label: 'Ingresos Totales',      emoji: '💵', money: true,  higherIsBetter: true  },
  { key: 'totalGastoJornadas', label: 'Inversión en Jornadas', emoji: '🏥', money: true,  higherIsBetter: false },
  { key: 'balance',            label: 'Balance Operativo',     emoji: '⚖️', money: true,  higherIsBetter: true  },
  { key: 'jornadasCount',      label: 'Cantidad de Jornadas',  emoji: '📅', money: false, higherIsBetter: true  },
  { key: 'totalAds',           label: 'Presupuesto Ads',       emoji: '📣', money: true,  higherIsBetter: false },
]

export default function GerenciaCompararPage() {
  const [available, setAvailable] = useState([])
  const [periodoA, setPeriodoA]   = useState('')
  const [periodoB, setPeriodoB]   = useState('')
  const [dataA, setDataA]         = useState(null)
  const [dataB, setDataB]         = useState(null)
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    // Fetch available periods across multiple tables to be safe, but ganancias_estrategia is the most reliable for Gerencia
    supabase.from('ganancias_estrategia').select('periodo').order('periodo', { ascending: false })
      .then(({ data }) => {
        const months = [...new Set((data||[]).map(r=>r.periodo))].sort((a,b)=>b.localeCompare(a))
        setAvailable(months)
        if (months.length >= 1) setPeriodoA(months[0])
        if (months.length >= 2) setPeriodoB(months[1])
      })
  }, [])

  async function fetchPeriodData(periodo) {
    if (!periodo) return null
    
    const [
      { data: ganancias },
      { data: jornadas },
      { data: campanas }
    ] = await Promise.all([
      supabase.from('ganancias_estrategia').select('ingresos').eq('periodo', periodo),
      supabase.from('jornadas_medicas').select('gasto_total').eq('periodo', periodo),
      supabase.from('campanas_publicitarias').select('presupuesto').eq('periodo', periodo)
    ])

    const totalIngresos = (ganancias || []).reduce((s, g) => s + (g.ingresos || 0), 0)
    const totalGastoJornadas = (jornadas || []).reduce((s, j) => s + (j.gasto_total || 0), 0)
    const totalAds = (campanas || []).reduce((s, c) => s + (c.presupuesto || 0), 0)
    const jornadasCount = (jornadas || []).length
    const balance = totalIngresos - totalGastoJornadas

    return {
      totalIngresos,
      totalGastoJornadas,
      totalAds,
      jornadasCount,
      balance
    }
  }

  useEffect(() => {
    if (!periodoA) return
    setLoading(true)
    fetchPeriodData(periodoA).then(res => {
      setDataA(res)
      setLoading(false)
    })
  }, [periodoA])

  useEffect(() => {
    if (!periodoB) return
    setLoading(true)
    fetchPeriodData(periodoB).then(res => {
      setDataB(res)
      setLoading(false)
    })
  }, [periodoB])

  const canCompare = dataA && dataB

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:'1.6rem',fontWeight:800,letterSpacing:'-0.8px',marginBottom:4 }}>Comparativa Ejecutiva</h1>
        <p style={{ color:'var(--text-secondary)',fontSize:'0.88rem' }}>Gerencia · evolución financiera y operativa por período</p>
      </div>

      {/* Selectors */}
      <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:14,padding:'20px 24px',marginBottom:24 }}>
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
              <div key={i} style={{ background:'var(--bg-surface)',border:`1px solid ${color}33`,borderRadius:14,padding:'18px 22px',textAlign:item.align }}>
                <div style={{ fontSize:'0.75rem',color:'var(--text-muted)',marginBottom:6,fontFamily:'var(--font-mono)' }}>{item.label}</div>
                <div style={{ fontFamily:'var(--font-mono)',fontSize:'2.2rem',fontWeight:600,color: item.data.balance >= 0 ? '#10b981' : '#f0436a',letterSpacing:'-1px' }}>
                  {formatMoney(item.data.balance)}
                </div>
                <div style={{ fontSize:'0.75rem',color:'var(--text-secondary)' }}>Balance Operativo</div>
                <div style={{ marginTop:4,fontSize:'0.78rem',fontFamily:'var(--font-mono)',color:'var(--text-muted)' }}>
                  Ingresos: {formatMoney(item.data.totalIngresos)}
                </div>
              </div>
            ))}
          </div>

          {/* Metrics table */}
          <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden',marginBottom:14 }}>
            <div style={{ display:'grid',gridTemplateColumns:'1fr repeat(3,auto)',padding:'12px 20px',background:'var(--bg-elevated)',borderBottom:'1px solid var(--border)',gap:12 }}>
              <div style={{ fontSize:'0.78rem',fontWeight:700,color:'var(--text-secondary)' }}>📊 KPI EJECUTIVOS</div>
              {[labelPeriodo(periodoA),labelPeriodo(periodoB),'Variación'].map((h,i) => (
                <div key={i} style={{ fontSize:'0.7rem',fontWeight:700,color:'var(--text-muted)',letterSpacing:'0.08em',textAlign:'right',minWidth:120 }}>{h}</div>
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
                    <span style={{ fontSize: '1.1rem' }}>{m.emoji}</span>{m.label}
                  </div>
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:'0.85rem',textAlign:'right',minWidth:120 }}>
                    {m.money ? formatMoney(a) : fmt(a)}
                  </div>
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:'0.85rem',textAlign:'right',minWidth:120 }}>
                    {m.money ? formatMoney(b) : fmt(b)}
                  </div>
                  <div style={{ textAlign:'right',minWidth:120 }}><DeltaBadge value={d} higherIsBetter={m.higherIsBetter} /></div>
                </div>
              )
            })}
          </div>

          {/* Net Efficiency (Marketing ROI) */}
          {dataA.totalAds > 0 && dataB.totalAds > 0 && (
            <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:14,padding:'20px 24px' }}>
              <div style={{ fontSize:'0.72rem',fontWeight:700,color:'var(--text-secondary)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:16 }}>
                💡 Eficiencia de Inversión (ROI Publicitario)
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20 }}>
                {[
                  { label:labelPeriodo(periodoA), val: (dataA.totalIngresos / dataA.totalAds).toFixed(2), ads: dataA.totalAds },
                  { label:labelPeriodo(periodoB), val: (dataB.totalIngresos / dataB.totalAds).toFixed(2), ads: dataB.totalAds },
                ].map((item, i) => (
                  <div key={i} style={{ padding:'12px 16px', background:'var(--bg-elevated)', borderRadius:10, border: '1px solid var(--border)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{item.label}</span>
                      <span style={{ fontSize:'0.65rem', color:color, fontFamily:'var(--font-mono)' }}>Ads: {formatMoney(item.ads)}</span>
                    </div>
                    <div style={{ fontSize:'1.4rem', fontWeight:600, color:'#10b981', fontFamily:'var(--font-mono)' }}>{item.val}x</div>
                    <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginTop:2 }}>Pesos ingresados por cada $1 invertido</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:14, textAlign:'center' }}>
                <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)' }}>Variación en eficiencia: </span>
                <DeltaBadge value={delta(dataB.totalIngresos/dataB.totalAds, dataA.totalIngresos/dataA.totalAds)} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
