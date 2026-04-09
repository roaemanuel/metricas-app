import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const accentColor = '#C084FC' // Gerencia core color
const AREA_COLORS = {
  social:   '#7DD3FC',
  diseno:   '#93C5FD',
  sistemas: '#FDBA74',
  gerencia: '#C084FC',
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function labelPeriodo(p) {
  if (!p) return '—'
  const [y,m] = p.split('-')
  return `${MONTH_NAMES[parseInt(m)-1]} ${y}`
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
  if (value === null || value === undefined) return <span style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.75rem' }}>—</span>
  const good = higherIsBetter ? value >= 0 : value <= 0
  const c = good ? '#10B981' : '#F0436A'
  
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      fontFamily:'var(--font-mono)', fontSize:'0.8rem', fontWeight: 800, color: c,
      background: `${c}15`, border: `1px solid ${c}33`,
      borderRadius:12, padding:'4px 12px',
      boxShadow: `0 4px 12px ${c}11`
    }}>
      {value >= 0 ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
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
        {options.map(m => <option key={m} value={m} style={{ background: '#080C1C' }}>{labelPeriodo(m)}</option>)}
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

    const totalIngresos = (ganancias || []).reduce((s, g) => s + (g.ingresos || 0), 0)
    const totalGastoJornadas = (jornadas || []).reduce((s, j) => s + (j.gasto_total || 0), 0)
    const totalAds = (campanas || []).reduce((s, c) => s + (c.presupuesto || 0), 0)
    const balance = totalIngresos - totalGastoJornadas

    const totalFlyers = (diseno || []).reduce((s, d) => s + (d.flyers_storie||0) + (d.flyers_efemeride||0) + (d.flyers_promo||0) + (d.flyers_cumple||0) + (d.flyers_otros||0), 0)
    const totalVideos = (diseno || []).reduce((s, d) => s + (d.colaboracion_video ? 1 : 0), 0)
    const totalFotos  = (diseno || []).reduce((s, d) => s + (d.fotos_producto_subidas || 0), 0)

    const incidenciasResueltas = (systems || []).reduce((s, s2) => s + (s2.incidencias_resueltas || 0), 0)
    const imgsOptimizadas      = (systems || []).reduce((s, s2) => s + (s2.imagenes_peso_optimizado || 0), 0)

    return {
      totalIngresos, totalGastoJornadas, totalAds, jornadasCount: (jornadas||[]).length, balance,
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
    if (periodoA) fetchPeriodData(periodoA).then(res => { setDataA(res); setLoading(false) })
  }, [periodoA])

  useEffect(() => {
    if (periodoB) fetchPeriodData(periodoB).then(res => { setDataB(res); setLoading(false) })
  }, [periodoB])

  const canCompare = dataA && dataB

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom:32 }}>
        <h1 style={{ 
          fontSize:'2.5rem', fontWeight: 900, letterSpacing:'-2px', marginBottom:4,
          background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.55))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Analítica Ejecutiva 360°
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', fontWeight: 500 }}>
          Gerencia · Auditoría integral de rendimiento y eficiencia corporativa
        </p>
      </div>

      {/* Selectors Panel */}
      <div style={{ 
        background:'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', 
        border:'1px solid rgba(255, 255, 255, 0.12)', borderRadius:32, padding:'28px 32px', 
        marginBottom:32, boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
        display:'flex', gap:24, alignItems:'flex-end', flexWrap:'wrap'
      }}>
        <MonthSelect label="Mes de Referencia" value={periodoA} onChange={setPeriodoA} options={available} />
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', borderRadius: '50%', width: 48, height: 48, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor, 
          fontSize: '1.2rem', border: '1px solid rgba(255,255,255,0.1)' 
        }}>⇄</div>
        <MonthSelect label="Mes de Contraste" value={periodoB} onChange={setPeriodoB} options={available} />
        
        {available.length < 2 && (
          <div style={{ width: '100%', color: accentColor, fontSize: '0.85rem', fontWeight: 700, background: `${accentColor}11`, padding: '10px 16px', borderRadius: 12, border: `1px solid ${accentColor}33` }}>
            ⚠️ Se requieren múltiples periodos con datos operativos para activar el análisis comparativo.
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
          {/* Main Comparison Sections */}
          {METRIC_GROUPS.map((group, groupIdx) => (
            <div key={groupIdx} style={{ 
              background:'rgba(255, 255, 255, 0.05)', border:'1px solid rgba(255, 255, 255, 0.1)', 
              borderRadius:32, overflow:'hidden', marginBottom:28, boxShadow:'0 12px 40px rgba(0,0,0,0.15)' 
            }}>
              <div style={{ 
                padding:'20px 32px', background:'rgba(255, 255, 255, 0.03)', 
                borderBottom:'1px solid rgba(255, 255, 255, 0.1)', 
                display:'flex', alignItems:'center', gap:16 
              }}>
                <span style={{ fontSize:'1.4rem' }}>{group.icon}</span>
                <span style={{ fontSize:'0.85rem', fontWeight: 900, color: group.color, letterSpacing:'0.1em', textTransform:'uppercase' }}>{group.title}</span>
              </div>
              
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
                  <thead>
                    <tr style={{ background:'rgba(255, 255, 255, 0.02)' }}>
                      <th style={{ padding:'16px 32px', textAlign:'left', fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase' }}>Auditoría KPI</th>
                      <th style={{ padding:'16px 32px', textAlign:'right', fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', fontWeight: 800 }}>{labelPeriodo(periodoA).toUpperCase()}</th>
                      <th style={{ padding:'16px 32px', textAlign:'right', fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', fontWeight: 800 }}>{labelPeriodo(periodoB).toUpperCase()}</th>
                      <th style={{ padding:'16px 32px', textAlign:'right', fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', fontWeight: 800 }}>DESVÍO NETO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.metrics.map((m, idx) => {
                      const a = dataA?.[m.key]
                      const b = dataB?.[m.key]
                      const d = delta(b, a)
                      return (
                        <tr key={m.key} style={{ 
                          borderTop:'1px solid rgba(255, 255, 255, 0.05)',
                          background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'}
                        >
                          <td style={{ padding:'18px 32px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                              <span style={{ fontSize:'1.2rem', filter: `drop-shadow(0 0 8px ${group.color}44)` }}>{m.emoji}</span>
                              <span style={{ fontSize:'0.95rem', color:'#fff', fontWeight: 700 }}>{m.label}</span>
                            </div>
                          </td>
                          <td style={{ padding:'18px 32px', textAlign:'right', fontFamily:'var(--font-mono)', fontSize:'1rem', color:'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                            {m.money ? formatMoney(a) : fmt(a)}
                          </td>
                          <td style={{ padding:'18px 32px', textAlign:'right', fontFamily:'var(--font-mono)', fontSize:'1rem', color:'#fff', fontWeight: 800 }}>
                            {m.money ? formatMoney(b) : fmt(b)}
                          </td>
                          <td style={{ padding:'18px 32px', textAlign:'right' }}>
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

          {/* Efficiency ROAS Section */}
          {((dataA.totalAds > 0 && dataA.totalIngresos > 0) || (dataB.totalAds > 0 && dataB.totalIngresos > 0)) && (
            <div style={{ 
              background:'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)',
              border:'1px solid rgba(255, 255, 255, 0.12)',
              borderRadius:32, padding:'32px', marginBottom:40,
              boxShadow:'0 12px 40px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:28 }}>
                <div style={{ 
                  width: 48, height: 48, background: `${accentColor}22`, borderRadius:16, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                  border: `1px solid ${accentColor}33`, color: accentColor
                }}>💹</div>
                <div>
                  <div style={{ fontSize:'1.1rem', fontWeight: 900, color:'#fff', letterSpacing: '-0.5px' }}>Eficiencia de Inversión Publicitaria (ROAS)</div>
                  <div style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.4)', fontWeight: 500 }}>Correlación directa entre facturación y pauta publicitaria</div>
                </div>
              </div>
              
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:24 }}>
                {[
                  { label:labelPeriodo(periodoA), val: (dataA.totalAds > 0 ? (dataA.totalIngresos / dataA.totalAds) : 0), ads: dataA.totalAds, ingresos: dataA.totalIngresos },
                  { label:labelPeriodo(periodoB), val: (dataB.totalAds > 0 ? (dataB.totalIngresos / dataB.totalAds) : 0), ads: dataB.totalAds, ingresos: dataB.totalIngresos },
                ].map((item, i) => (
                  <div key={i} style={{ 
                    padding:'24px', background:'rgba(255,255,255,0.03)', borderRadius:24, 
                    border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden'
                  }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: i===0 ? 'rgba(255,255,255,0.1)' : accentColor }} />
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
                      <span style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase' }}>{item.label}</span>
                      <span style={{ fontSize:'0.7rem', color:accentColor, fontWeight: 900, background: `${accentColor}15`, padding: '2px 8px', borderRadius: 6 }}>ROI {item.val.toFixed(2)}x</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:8 }}>
                      <span style={{ fontSize:'2.5rem', fontWeight: 900, color:'#10B981', fontFamily:'var(--font-mono)', lineHeight:1 }}>{item.val.toFixed(2)}</span>
                      <span style={{ fontSize:'1rem', color:'rgba(255,255,255,0.3)', fontWeight: 800 }}>X</span>
                    </div>
                    <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.3)', fontWeight: 700, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                      Revenue: {formatMoney(item.ingresos)}
                    </div>
                  </div>
                ))}
              </div>
              
              {dataA.totalAds > 0 && dataB.totalAds > 0 && (
                <div style={{ 
                  marginTop:32, paddingTop:24, borderTop:'1px solid rgba(255,255,255,0.08)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16
                }}>
                  <span style={{ fontSize:'0.9rem', color:'rgba(255,255,255,0.5)', fontWeight: 600 }}>Variación neta en la eficiencia de capital: </span>
                  <DeltaBadge value={delta(dataB.totalIngresos/dataB.totalAds, dataA.totalIngresos/dataA.totalAds)} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
