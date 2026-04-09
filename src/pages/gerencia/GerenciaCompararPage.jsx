import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const color = '#9b59f7' // Gerencia color
const AREA_COLORS = {
  social:   '#f0436a',
  diseno:   '#0eb8d4',
  sistemas: '#f5c518',
  gerencia: '#9b59f7',
}

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

const METRIC_GROUPS = [
  {
    title: 'Finanzas & Gerencia',
    color: AREA_COLORS.gerencia,
    icon: '📊',
    metrics: [
      { key: 'totalIngresos',      label: 'Ingresos Totales',      emoji: '💵', money: true,  higherIsBetter: true  },
      { key: 'totalGastoJornadas', label: 'Inversión en Jornadas', emoji: '🏥', money: true,  higherIsBetter: false },
      { key: 'balance',            label: 'Balance Operativo',     emoji: '⚖️', money: true,  higherIsBetter: true  },
      { key: 'jornadasCount',      label: 'Cantidad de Jornadas',  emoji: '📅', money: false, higherIsBetter: true  },
      { key: 'totalAds',           label: 'Presupuesto Ads',       emoji: '📣', money: true,  higherIsBetter: false },
    ]
  },
  {
    title: 'Social Media',
    color: AREA_COLORS.social,
    icon: '📱',
    metrics: [
      { key: 'seguidoresTotal',    label: 'Seguidores Totales',    emoji: '👥', money: false, higherIsBetter: true },
      { key: 'nuevosSeguidores',   label: 'Nuevos Seguidores',     emoji: '📈', money: false, higherIsBetter: true },
      { key: 'alcanceSocial',      label: 'Alcance Mensual',       emoji: '🌐', money: false, higherIsBetter: true },
      { key: 'interacciones',      label: 'Interacciones',         emoji: '❤️', money: false, higherIsBetter: true },
    ]
  },
  {
    title: 'Diseño Gráfico',
    color: AREA_COLORS.diseno,
    icon: '🎨',
    metrics: [
      { key: 'totalFlyers',        label: 'Flyers Totales',        emoji: '🎨', money: false, higherIsBetter: true },
      { key: 'totalVideos',        label: 'Videos / Reels',        emoji: '🎬', money: false, higherIsBetter: true },
      { key: 'totalFotos',         label: 'Fotos Producto',        emoji: '📸', money: false, higherIsBetter: true },
    ]
  },
  {
    title: 'Sistemas / Web',
    color: AREA_COLORS.sistemas,
    icon: '⚙️',
    metrics: [
      { key: 'sesionesWeb',        label: 'Sesiones (GA4)',        emoji: '🌐', money: false, higherIsBetter: true },
      { key: 'usuariosActivos',    label: 'Usuarios Activos',      emoji: '👤', money: false, higherIsBetter: true },
      { key: 'incidenciasResueltas',label: 'Incidencias Resueltas',emoji: '🔧', money: false, higherIsBetter: true },
      { key: 'imgsOptimizadas',     label: 'Imágenes Optimizadas', emoji: '⚡', money: false, higherIsBetter: true },
    ]
  }
]

export default function GerenciaCompararPage() {
  const [available, setAvailable] = useState([])
  const [periodoA, setPeriodoA]   = useState('')
  const [periodoB, setPeriodoB]   = useState('')
  const [dataA, setDataA]         = useState(null)
  const [dataB, setDataB]         = useState(null)
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    // Fetch available periods across multiple tables to be safe
    Promise.all([
      supabase.from('ganancias_estrategia').select('periodo'),
      supabase.from('jornadas_medicas').select('periodo'),
      supabase.from('social_media_metrics').select('periodo'),
      supabase.from('diseno_grafico_diario').select('periodo'),
      supabase.from('sistemas_diario').select('periodo'),
    ]).then(results => {
      const allPeriods = results.flatMap(r => r.data || []).map(r => r.periodo)
      const uniqueMonths = [...new Set(allPeriods)]
        .filter(Boolean)
        .sort((a,b) => b.localeCompare(a))

      setAvailable(uniqueMonths)
      if (uniqueMonths.length >= 1) setPeriodoA(uniqueMonths[0])
      if (uniqueMonths.length >= 2) setPeriodoB(uniqueMonths[1])
    })
  }, [])

  async function fetchPeriodData(periodo) {
    if (!periodo) return null
    
    setLoading(true)
    const [
      { data: ganancias },
      { data: jornadas },
      { data: campanas },
      { data: social },
      { data: diseno },
      { data: systems },
      { data: ga4 }
    ] = await Promise.all([
      supabase.from('ganancias_estrategia').select('ingresos').eq('periodo', periodo),
      supabase.from('jornadas_medicas').select('gasto_total').eq('periodo', periodo),
      supabase.from('campanas_publicitarias').select('presupuesto').eq('periodo', periodo),
      supabase.from('social_media_metrics').select('*').eq('periodo', periodo).maybeSingle(),
      supabase.from('diseno_grafico_diario').select('*').eq('periodo', periodo),
      supabase.from('sistemas_diario').select('*').eq('periodo', periodo),
      supabase.from('ga4_metrics').select('*').eq('periodo', periodo).maybeSingle()
    ])

    // Finance aggregates
    const totalIngresos = (ganancias || []).reduce((s, g) => s + (g.ingresos || 0), 0)
    const totalGastoJornadas = (jornadas || []).reduce((s, j) => s + (j.gasto_total || 0), 0)
    const totalAds = (campanas || []).reduce((s, c) => s + (c.presupuesto || 0), 0)
    const jornadasCount = (jornadas || []).length
    const balance = totalIngresos - totalGastoJornadas

    // Design aggregates
    const totalFlyers = (diseno || []).reduce((s, d) => s + (d.flyers_storie||0) + (d.flyers_efemeride||0) + (d.flyers_promo||0) + (d.flyers_cumple||0) + (d.flyers_otros||0), 0)
    const totalVideos = (diseno || []).reduce((s, d) => s + (d.colaboracion_video ? 1 : 0), 0)
    const totalFotos  = (diseno || []).reduce((s, d) => s + (d.fotos_producto_subidas || 0), 0)

    // Systems aggregates
    const incidenciasResueltas = (systems || []).reduce((s, s2) => s + (s2.incidencias_resueltas || 0), 0)
    const imgsOptimizadas      = (systems || []).reduce((s, s2) => s + (s2.imagenes_peso_optimizado || 0), 0)

    return {
      totalIngresos, totalGastoJornadas, totalAds, jornadasCount, balance,
      seguidoresTotal:  social?.seguidores_total || 0,
      nuevosSeguidores: social?.nuevos_seguidores || 0,
      alcanceSocial:    social?.alcance || 0,
      interacciones:    social?.interacciones || 0,
      totalFlyers, totalVideos, totalFotos,
      sesionesWeb:      ga4?.sesiones || 0,
      usuariosActivos:  ga4?.usuarios_activos || 0,
      incidenciasResueltas, imgsOptimizadas
    }
  }

  useEffect(() => {
    if (!periodoA) return
    fetchPeriodData(periodoA).then(res => {
      setDataA(res)
      setLoading(false) // Wait for both if possible? No, separate is fine
    })
  }, [periodoA])

  useEffect(() => {
    if (!periodoB) return
    fetchPeriodData(periodoB).then(res => {
      setDataB(res)
      setLoading(false)
    })
  }, [periodoB])

  const canCompare = dataA && dataB

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:'1.6rem',fontWeight: 600,letterSpacing:'-0.8px',marginBottom:4 }}>Analítica Comparativa 360°</h1>
        <p style={{ color:'var(--text-secondary)',fontSize:'0.88rem' }}>Vista ejecutiva · rendimiento integral de todas las áreas operativas</p>
      </div>

      {/* Selectors */}
      <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:14,padding:'20px 24px',marginBottom:24,boxShadow:'0 4px 16px var(--glass-shadow)' }}>
        <div style={{ display:'flex',gap:16,alignItems:'flex-end',flexWrap:'wrap' }}>
          <MonthSelect label="Mes base"        value={periodoA} onChange={setPeriodoA} options={available} />
          <div style={{ fontSize:'1.4rem',color:'var(--text-muted)',paddingBottom:10,flexShrink:0 }}>⇄</div>
          <MonthSelect label="Mes a comparar"  value={periodoB} onChange={setPeriodoB} options={available} />
        </div>
        {available.length < 2 && (
          <p style={{ color:'var(--text-muted)',fontSize:'0.8rem',marginTop:12 }}>⚠️ Necesitás al menos 2 meses con datos para realizar una comparativa integral.</p>
        )}
      </div>

      {loading && (
        <div style={{ display:'flex',justifyContent:'center',padding:40 }}>
          <div style={{ width:24,height:24,borderRadius:'50%',border:'2px solid var(--border-bright)',borderTopColor:color,animation:'spin 0.8s linear infinite' }} />
        </div>
      )}

      {canCompare && !loading && (
        <>
          {/* Main Comparison Sections */}
          {METRIC_GROUPS.map((group, groupIdx) => (
            <div key={groupIdx} style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:16,overflow:'hidden',marginBottom:20,boxShadow:'0 4px 16px var(--glass-shadow)' }}>
              <div style={{ padding:'14px 20px',background:group.color+'08',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12 }}>
                <span style={{ fontSize:'1.2rem',opacity:0.8 }}>{group.icon}</span>
                <span style={{ fontSize:'0.78rem',fontWeight: 600,color:group.color,letterSpacing:'0.05em',textTransform:'uppercase' }}>{group.title}</span>
              </div>
              
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%',borderCollapse:'collapse',minWidth:600 }}>
                  <thead>
                    <tr style={{ background:'var(--bg-elevated)' }}>
                      <th style={{ padding:'12px 20px',textAlign:'left',fontSize:'0.72rem',color:'var(--text-muted)',fontWeight: 600,letterSpacing:'0.05em' }}>KPI</th>
                      <th style={{ padding:'12px 20px',textAlign:'right',fontSize:'0.72rem',color:'var(--text-muted)',fontWeight: 600 }}>{labelPeriodo(periodoA).toUpperCase()}</th>
                      <th style={{ padding:'12px 20px',textAlign:'right',fontSize:'0.72rem',color:'var(--text-muted)',fontWeight: 600 }}>{labelPeriodo(periodoB).toUpperCase()}</th>
                      <th style={{ padding:'12px 20px',textAlign:'right',fontSize:'0.72rem',color:'var(--text-muted)',fontWeight: 600 }}>DESVÍO (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.metrics.map((m, idx) => {
                      const a = dataA?.[m.key]
                      const b = dataB?.[m.key]
                      const d = delta(b, a)
                      return (
                        <tr key={m.key} style={{ borderTop:'1px solid var(--border)' }}>
                          <td style={{ padding:'12px 20px' }}>
                            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                              <span style={{ fontSize:'1rem' }}>{m.emoji}</span>
                              <span style={{ fontSize:'0.82rem',color:'var(--text-primary)',fontWeight:500 }}>{m.label}</span>
                            </div>
                          </td>
                          <td style={{ padding:'12px 20px',textAlign:'right',fontFamily:'var(--font-mono)',fontSize:'0.85rem',color:'var(--text-secondary)' }}>
                            {m.money ? formatMoney(a) : fmt(a)}
                          </td>
                          <td style={{ padding:'12px 20px',textAlign:'right',fontFamily:'var(--font-mono)',fontSize:'0.85rem',color:'var(--text-primary)',fontWeight:600 }}>
                            {m.money ? formatMoney(b) : fmt(b)}
                          </td>
                          <td style={{ padding:'12px 20px',textAlign:'right' }}>
                            <DeltaBadge value={d} higherIsBetter={m.higherIsBetter} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Special ROI Section (Marketing Efficiency) */}
          {((dataA.totalAds > 0 && dataA.totalIngresos > 0) || (dataB.totalAds > 0 && dataB.totalIngresos > 0)) && (
            <div style={{ 
              background:'var(--bg-surface)',
              border:'1px solid var(--border)',
              borderRadius:16, padding:'24px',
              boxShadow:'0 4px 20px var(--glass-shadow)'
            }}>
              <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:20 }}>
                <div style={{ padding:8, background:AREA_COLORS.gerencia+'18', borderRadius:8 }}>💹</div>
                <div>
                  <div style={{ fontSize:'0.9rem',fontWeight: 600,color:'var(--text-primary)' }}>Eficiencia de Inversión Publicitaria (ROAS)</div>
                  <div style={{ fontSize:'0.72rem',color:'var(--text-muted)' }}>Proporción de ingresos generados vs presupuesto invertido en Ads</div>
                </div>
              </div>
              
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:16 }}>
                {[
                  { label:labelPeriodo(periodoA), val: (dataA.totalAds > 0 ? (dataA.totalIngresos / dataA.totalAds) : 0), ads: dataA.totalAds, ingresos: dataA.totalIngresos },
                  { label:labelPeriodo(periodoB), val: (dataB.totalAds > 0 ? (dataB.totalIngresos / dataB.totalAds) : 0), ads: dataB.totalAds, ingresos: dataB.totalIngresos },
                ].map((item, i) => (
                  <div key={i} style={{ padding:'16px', background:'rgba(255,255,255,0.02)', borderRadius:12, border: '1px solid var(--border)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                      <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight: 600 }}>{item.label}</span>
                      <span style={{ fontSize:'0.65rem', color:AREA_COLORS.gerencia, fontFamily:'var(--font-mono)' }}>ROI {item.val.toFixed(2)}x</span>
                    </div>
                    <div style={{ display:'flex',alignItems:'flex-end',gap:4,marginBottom:4 }}>
                      <span style={{ fontSize:'1.6rem', fontWeight: 600, color:'#10b981', fontFamily:'var(--font-mono)', lineHeight:1 }}>{item.val.toFixed(2)}</span>
                      <span style={{ fontSize:'0.82rem',color:'var(--text-muted)',marginBottom:3 }}>x</span>
                    </div>
                    <div style={{ fontSize:'0.62rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                      Ingresos: {formatMoney(item.ingresos)}
                    </div>
                  </div>
                ))}
              </div>
              
              {dataA.totalAds > 0 && dataB.totalAds > 0 && (
                <div style={{ marginTop:20, paddingTop:20, borderTop:'1px solid var(--border)', textAlign:'center' }}>
                  <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>Variación en la eficiencia de inversión: </span>
                  <DeltaBadge value={delta(dataB.totalIngresos/dataB.totalAds, dataA.totalIngresos/dataA.totalAds)} />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
