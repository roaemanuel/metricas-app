import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts'

// Pure Blue Scale Theme Colors
const colorPrimary = 'var(--accent)'       // Blue 400
const colorSecondary = 'var(--diseno-color)' // Sky 400
const colorTertiary = 'var(--gerencia-color)' // Indigo 400

const trafficColors = ['#60A5FA', '#38BDF8', '#818CF8', '#A78BFA', '#34D399']

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// --- Modal Component ---
function GlassModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease'
      }} />
      <div className="glass-panel animate-fadeUp" style={{
        position: 'relative', width: '100%', maxWidth: 900,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        borderRadius: 'var(--radius-xl)', overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
        background: 'var(--bg-surface)',
      }}>
        <div style={{
          padding: '24px 32px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)',
            width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>✕</button>
        </div>
        <div style={{ padding: 32, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// --- KPI Card ---
function StatCard({ label, value, unit='', icon, c, sub, delay=0 }) {
  return (
    <div className="animate-fadeUp" style={{
      animationDelay:`${delay}s`,
      background:'var(--bg-surface)', border:'1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding:'24px', position:'relative', overflow:'hidden',
      boxShadow: '0 8px 32px var(--glass-shadow)',
    }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:c, opacity:0.9, boxShadow: `0 0 12px ${c}` }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize:'0.9rem', color:'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize:22, opacity: 0.8 }}>{icon}</div>
      </div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:'3rem', fontWeight:800, color: 'var(--text-primary)', letterSpacing:'-1.5px', lineHeight:1, marginBottom:8 }}>
        {value}<span style={{ fontSize:'1.2rem', fontWeight: 500, marginLeft:4, color: 'var(--text-muted)' }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight: 500 }}>{sub}</div>}
    </div>
  )
}

// --- Custom Recharts Tooltip ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel" style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border-bright)' }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Día {label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function SistemasDashboardPage() {
  const now = new Date()
  const navigate = useNavigate()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [records, setRecords] = useState([])
  const [ga4data, setGa4data] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Modal state
  const [showLogsModal, setShowLogsModal] = useState(false)

  const periodo = `${year}-${String(month+1).padStart(2,'0')}-01`
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  useEffect(() => { loadMonth() }, [year, month])

  async function loadMonth() {
    setLoading(true)
    const [{ data: daily }, { data: ga4 }] = await Promise.all([
      supabase.from('sistemas_diario').select('*').eq('periodo', periodo).order('fecha'),
      supabase.from('ga4_metrics').select('*').eq('periodo', periodo).maybeSingle(),
    ])
    setRecords(daily || [])
    setGa4data(ga4 || null)
    setLoading(false)
  }

  const totals = records.reduce((acc, r) => {
    acc.incidencias += r.incidencias_resueltas || 0
    acc.codigos     += r.imagenes_codigos_actualizadas || 0
    acc.optimizadas += r.imagenes_peso_optimizado || 0
    acc.dias        += 1
    return acc
  }, { incidencias:0, codigos:0, optimizadas:0, dias:0 })

  const daysInMonth = new Date(year, month+1, 0).getDate()
  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const dayStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`
    const rec = records.find(r => r.fecha === dayStr)
    return { 
      dia: String(i+1), 
      'Incidencias': rec ? (rec.incidencias_resueltas || 0) : 0,
      'Optimizadas': rec ? (rec.imagenes_peso_optimizado || 0) : 0
    }
  })

  const traficoTotal = ga4data
    ? (ga4data.trafico_organico||0)+(ga4data.trafico_directo||0)+(ga4data.trafico_social||0)+(ga4data.trafico_referido||0)+(ga4data.trafico_email||0)
    : 0

  const trafficData = ga4data && traficoTotal > 0 ? [
    { name: 'Orgánico', value: ga4data.trafico_organico },
    { name: 'Directo',  value: ga4data.trafico_directo },
    { name: 'Social',   value: ga4data.trafico_social },
    { name: 'Referido', value: ga4data.trafico_referido },
    { name: 'Email',    value: ga4data.trafico_email }
  ].filter(f => f.value > 0) : []

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:32 }}>
        <div>
          <h1 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:'-1px', marginBottom:6 }}>Sistemas / Web</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'1rem' }}>Métricas Operativas y Analítica de Tráfico</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={() => { if(month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }}
            style={{ width:40, height:40, borderRadius:12, background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:'1.2rem', cursor:'pointer', transition: 'all 0.2s' }}>‹</button>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.9rem', color:'var(--text-primary)', minWidth:140, textAlign:'center', fontWeight: 600 }}>{MONTHS_ES[month]} {year}</span>
          <button onClick={() => { if(isCurrentMonth)return; if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }}
            disabled={isCurrentMonth}
            style={{ width:40, height:40, borderRadius:12, background:'var(--bg-elevated)', border:'1px solid var(--border)', color:isCurrentMonth?'var(--text-muted)':'var(--text-secondary)', fontSize:'1.2rem', cursor:isCurrentMonth?'not-allowed':'pointer', transition: 'all 0.2s' }}>›</button>
          <button onClick={() => navigate('/dashboard/sistemas/ingresar')} style={{
            padding:'10px 24px', marginLeft:12, background: 'var(--accent)',
            border:'none', borderRadius:12, color:'#fff',
            fontSize:'0.9rem', fontWeight:700, cursor:'pointer',
            boxShadow:'0 4px 20px var(--accent-glow)',
            transition: 'all 0.2s'
          }}>✚ Registrar hoy</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:100 }}>
          <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid var(--border-bright)', borderTopColor:colorPrimary, animation:'spin 0.8s linear infinite' }} />
        </div>
      ) : records.length === 0 && !ga4data ? (
        <div style={{ textAlign:'center', padding:'80px 24px', border:`2px dashed var(--border-bright)`, borderRadius:24, background:'var(--glass-bg)' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🖥️</div>
          <p style={{ color:'var(--text-secondary)', marginBottom:24, fontSize: '1.1rem' }}>No hay registros para {MONTHS_ES[month]} {year}</p>
          <button onClick={() => navigate('/dashboard/sistemas/ingresar')} style={{
            padding:'14px 32px', background:colorPrimary, border:'none', borderRadius:14,
            color:'#fff', fontWeight:700, fontSize:'1rem', cursor:'pointer',
            boxShadow:'0 4px 20px var(--accent-glow)',
          }}>Ingresar primer registro →</button>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16, marginBottom:24 }}>
            {ga4data && <StatCard label="Sesiones web"    value={ga4data.sesiones?.toLocaleString('es-AR') || '—'} icon="🌐" c={colorPrimary} delay={0} />}
            <StatCard label="Incidencias resueltas" value={totals.incidencias} icon="🔧" c={colorSecondary} delay={0.05} sub={`${totals.dias} días registrados`} />
            <StatCard label="Imgs. optimizadas"     value={totals.optimizadas} icon="⚡" c={colorTertiary} delay={0.1} />
            {ga4data && <StatCard label="Usuarios activos" value={ga4data.usuarios_activos?.toLocaleString('es-AR') || '—'} icon="👤" c={trafficColors[3]} delay={0.15} />}
          </div>

          {/* Main Visualizations Row */}
          <div style={{ display:'grid', gridTemplateColumns: ga4data ? '2fr 1fr' : '1fr', gap:16, marginBottom:24 }}>
            {/* Primary Chart - Area Chart */}
            {records.length > 0 && (
              <div className="glass-panel" style={{ padding: '24px 32px', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 24 }}>
                  <div style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--text-secondary)', letterSpacing:'0.05em' }}>EVOLUCIÓN DIARIA</div>
                  <button onClick={() => setShowLogsModal(true)} style={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)',
                    padding: '6px 14px', borderRadius: 8, fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600
                  }}>Ver detalles</button>
                </div>
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colorSecondary} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={colorSecondary} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorOpt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colorTertiary} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={colorTertiary} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="dia" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="Optimizadas" stroke={colorTertiary} strokeWidth={3} fillOpacity={1} fill="url(#colorOpt)" />
                      <Area type="monotone" dataKey="Incidencias" stroke={colorSecondary} strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Donut Chart - Traffic Sources */}
            {ga4data && traficoTotal > 0 && (
              <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-xl)', display:'flex', flexDirection:'column' }}>
                <div style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--text-secondary)', letterSpacing:'0.05em', marginBottom: 16 }}>FUENTES DE TRÁFICO</div>
                
                <div style={{ flex: 1, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={trafficData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {trafficData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={trafficColors[index % trafficColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} itemStyle={{ color: 'var(--text-primary)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', pointerEvents: 'none' }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{ga4data.sesiones?.toLocaleString('es-AR')}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sesiones</span>
                  </div>
                </div>

                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {trafficData.map((f, i) => (
                    <div key={f.name} style={{ display:'flex', justifyContent:'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: trafficColors[i % trafficColors.length] }} />
                        <span style={{ fontSize:'0.85rem', color:'var(--text-secondary)' }}>{f.name}</span>
                      </div>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.85rem', fontWeight:600, color:'var(--text-primary)' }}>
                        {f.value.toLocaleString('es-AR')} <span style={{ color: 'var(--text-muted)', fontSize:'0.75rem', fontWeight: 400 }}>({((f.value / traficoTotal) * 100).toFixed(1)}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Secondary Analytics Row */}
          {ga4data && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
               {/* GA4 Highlights */}
              <div className="glass-panel" style={{ padding: '24px 32px', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:20, letterSpacing:'0.05em' }}>
                  RENDIMIENTO DEL SITIO
                </div>
                <div style={{ display:'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap:16, textAlign: 'center' }}>
                  <div style={{ background: 'var(--bg-elevated)', padding: '20px 10px', borderRadius: 16, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Páginas Vistas</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: colorPrimary }}>{ga4data.pageviews?.toLocaleString('es-AR')}</div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', padding: '20px 10px', borderRadius: 16, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Tasa de Rebote</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: trafficColors[3] }}>{ga4data.tasa_rebote ? ga4data.tasa_rebote+'%' : '—'}</div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', padding: '20px 10px', borderRadius: 16, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>T. Promedio</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: colorSecondary }}>
                      {ga4data.duracion_promedio_seg ? `${Math.floor(ga4data.duracion_promedio_seg/60)}m` : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* SEO Keywords */}
              {ga4data.seo_keywords?.length > 0 && (
                <div className="glass-panel" style={{ padding: '24px 32px', borderRadius: 'var(--radius-xl)' }}>
                  <div style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--text-secondary)', letterSpacing:'0.05em', marginBottom: 20 }}>
                    SEO — TOP KEYWORDS
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {[...ga4data.seo_keywords].sort((a,b) => parseInt(a.posicion||99)-parseInt(b.posicion||99)).slice(0,4).map((kw,i) => (
                      <div key={i} style={{
                        display:'grid', gridTemplateColumns:'1fr 60px 70px 80px', gap:12,
                        padding:'12px 16px', background:'var(--bg-elevated)',
                        border:'1px solid var(--border)', borderRadius:12, alignItems:'center',
                      }}>
                        <span style={{ fontSize:'0.9rem', color:'var(--text-primary)', fontWeight: 500 }}>{kw.keyword}</span>
                        <span style={{
                          fontFamily:'var(--font-mono)', fontSize:'0.9rem', fontWeight:800, textAlign:'center',
                          color: parseInt(kw.posicion)<=3? trafficColors[4] : parseInt(kw.posicion)<=10 ? colorPrimary : 'var(--text-secondary)',
                        }}>#{kw.posicion}</span>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.8rem', textAlign:'center', color:'var(--text-secondary)' }}>{kw.clics ? kw.clics+' click' : '—'}</span>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.8rem', textAlign:'center', color:'var(--text-muted)' }}>{kw.impresiones ? kw.impresiones+' imp' : '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Records Detail Modal */}
          <GlassModal isOpen={showLogsModal} onClose={() => setShowLogsModal(false)} title={`Registros Diarios - ${MONTHS_ES[month]} ${year}`}>
            {records.length > 0 ? (
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.9rem' }}>
                <thead>
                  <tr style={{ background:'var(--bg-hover)' }}>
                    {['Fecha','Incidencias','Cód. Barras','Optimizadas','Notas'].map(h => (
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', color:'var(--text-muted)', fontWeight:600, fontSize:'0.8rem', letterSpacing:'0.05em', whiteSpace:'nowrap', borderBottom: '1px solid var(--border-bright)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom:'1px solid var(--border)' }}>
                      <td style={{ padding:'14px 16px', fontFamily:'var(--font-mono)', color:'var(--text-secondary)', whiteSpace:'nowrap' }}>{r.fecha?.slice(8,10)} / {r.fecha?.slice(5,7)}</td>
                      <td style={{ padding:'14px 16px', textAlign:'center', fontFamily:'var(--font-mono)', color: r.incidencias_resueltas>0?colorSecondary:'var(--text-muted)', fontWeight: r.incidencias_resueltas>0?800:400, fontSize: '1rem' }}>{r.incidencias_resueltas||0}</td>
                      <td style={{ padding:'14px 16px', textAlign:'center', fontFamily:'var(--font-mono)', color: r.imagenes_codigos_actualizadas>0?colorPrimary:'var(--text-muted)', fontSize: '1rem' }}>{r.imagenes_codigos_actualizadas||0}</td>
                      <td style={{ padding:'14px 16px', textAlign:'center', fontFamily:'var(--font-mono)', color: r.imagenes_peso_optimizado>0?colorTertiary:'var(--text-muted)', fontSize: '1rem' }}>{r.imagenes_peso_optimizado||0}</td>
                      <td style={{ padding:'14px 16px', color:'var(--text-muted)', maxWidth:250, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.notas||'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay datos detallados para este mes.</p>
            )}
          </GlassModal>
        </>
      )}
    </div>
  )
}
