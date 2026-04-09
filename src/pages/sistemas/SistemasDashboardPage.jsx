import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts'

// Systems Module Color Theme
const accentColor = '#FDBA74' // Amber 300
const trafficColors = ['#FDBA74', '#FB923C', '#F97316', '#EA580C', '#C2410C', '#9A3412', '#7C2D12']

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// --- Modal Component ---
function GlassModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(8,12,28,0.4)',
        backdropFilter: 'blur(12px)', animation: 'fadeIn 0.3s ease'
      }} />
      <div className="animate-fadeUp" style={{
        position: 'relative', width: '100%', maxWidth: 1000,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        borderRadius: 32, overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        background: 'rgba(255, 255, 255, 0.07)',
        backdropFilter: 'blur(28px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}>
        {/* Top Accent Line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
        
        <div style={{
          padding: '24px 32px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', fontWeight: 800, margin: 0, 
            background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.55))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>{title}</h2>
          <button onClick={onClose} style={{
            background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff',
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
function StatCard({ label, value, unit='', icon, color, sub, delay=0 }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div 
      className="animate-fadeUp" 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        animationDelay: `${delay}s`,
        background: 'rgba(255, 255, 255, 0.07)',
        backdropFilter: 'blur(28px)',
        border: hovered ? `1px solid ${color}66` : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 24, padding: '24px', position: 'relative', overflow: 'hidden',
        boxShadow: hovered ? `0 12px 40px ${color}22` : '0 8px 32px rgba(0,0, 0, 0.15)',
        transform: hovered ? 'translateY(-8px) scale(1.01)' : 'translateY(0) scale(1)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        cursor: 'default'
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color, opacity: 0.8 }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: 24, filter: `drop-shadow(0 0 10px ${color}44)` }}>{icon}</div>
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '2.8rem', fontWeight: 800,
        color: '#fff', letterSpacing: '-2px', lineHeight: 1,
        marginBottom: 8,
      }}>
        {value}<span style={{ fontSize: '1rem', fontWeight: 600, marginLeft: 6, color: 'rgba(255,255,255,0.4)', letterSpacing: 0 }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{sub}</div>}
    </div>
  )
}

// --- Custom Recharts Tooltip ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
        background: 'var(--glass-bg)', backdropFilter: 'blur(24px)', border: '1px solid var(--glass-border)',
        padding: '12px 16px', borderRadius: 12, boxShadow: '0 4px 24px var(--glass-shadow)' 
      }}>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: 6 }}>Día {label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: entry.color }}>
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
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:20, marginBottom:32 }}>
        <div>
          <h1 style={{ 
            fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-2px', marginBottom: 4,
            background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.55))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Sistemas / Web
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', fontWeight: 500 }}>
            Infraestructura técnica · Análisis de rendimiento digital
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 4, 
            border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center' 
          }}>
            <button onClick={() => month === 0 ? (setYear(y=>y-1), setMonth(11)) : setMonth(m=>m-1)} 
              style={{ width: 40, height: 40, borderRadius: 12, background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>‹</button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', minWidth: 120, textAlign: 'center', fontWeight: 700 }}>
              {MONTHS_ES[month].toUpperCase()} {year}
            </span>
            <button onClick={() => isCurrentMonth ? null : month === 11 ? (setYear(y=>y+1), setMonth(0)) : setMonth(m=>m+1)} 
              disabled={isCurrentMonth} style={{ 
                width: 40, height: 40, borderRadius: 12, background: 'transparent', border: 'none', 
                color: isCurrentMonth ? 'rgba(255,255,255,0.2)' : '#fff', fontSize: '1.2rem', 
                cursor: isCurrentMonth ? 'not-allowed' : 'pointer' 
              }}>›</button>
          </div>

          <button
            onClick={() => navigate('/dashboard/sistemas/ingresar')}
            style={{
              padding: '12px 28px', background: accentColor, border: 'none', borderRadius: 16,
              color: '#080C1C', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer',
              boxShadow: `0 8px 24px ${accentColor}44`, transition: 'all 0.3s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >✚ Registrar Jornada</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}>
          <div className="animate-spin" style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: accentColor }} />
        </div>
      ) : records.length === 0 && !ga4data ? (
        <div className="animate-fadeUp" style={{
          textAlign: 'center', padding: '100px 40px',
          border: `1px dashed ${accentColor}66`, borderRadius: 32, background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)'
        }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🖥️</div>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, marginBottom: 12 }}>Sin datos técnicos</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 32, fontSize: '1.1rem' }}>No hay registros de sistemas para {MONTHS_ES[month]} {year}</p>
          <button onClick={() => navigate('/dashboard/sistemas/ingresar')}
            style={{ padding: '16px 48px', background: accentColor, border: 'none', borderRadius: 16, color: '#080C1C', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: `0 8px 24px ${accentColor}33` }}
          >Ingresar métricas ahora →</button>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:20, marginBottom:24 }}>
            {ga4data && <StatCard label="Sesiones web" value={ga4data.sesiones?.toLocaleString('es-AR') || '—'} icon="🌐" color={accentColor} delay={0} />}
            <StatCard label="Incidencias resueltas" value={totals.incidencias} icon="🔧" color="#60A5FA" delay={0.1} sub={`${totals.dias} días registrados`} />
            <StatCard label="Imgs. optimizadas" value={totals.optimizadas} icon="⚡" color="#3B82F6" delay={0.2} />
            {ga4data && <StatCard label="Usuarios activos" value={ga4data.usuarios_activos?.toLocaleString('es-AR') || '—'} icon="👤" color="#10B981" delay={0.3} />}
          </div>

          {/* Main Visualizations Row */}
          <div style={{ display:'grid', gridTemplateColumns: ga4data ? '2fr 1fr' : '1fr', gap:24, marginBottom:24 }}>
            {/* Primary Evolution Chart */}
            {records.length > 0 && (
              <div className="animate-fadeUp" style={{ 
                background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', 
                padding: '32px', borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 32 }}>
                  <div style={{ fontSize:'0.8rem', fontWeight: 800, color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', textTransform: 'uppercase' }}>ACTIVIDAD TÉCNICA DIARIA</div>
                  <button onClick={() => setShowLogsModal(true)} style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                    padding: '8px 20px', borderRadius: 12, fontSize: '0.8rem', cursor: 'pointer', fontWeight: 700
                  }}>Ver bitácora detallada</button>
                </div>
                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorOpt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="dia" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="Optimizadas" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorOpt)" />
                      <Area type="monotone" dataKey="Incidencias" stroke="#60A5FA" strokeWidth={4} fillOpacity={1} fill="url(#colorInc)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Donut Chart - Traffic Sources */}
            {ga4data && traficoTotal > 0 && (
              <div className="animate-fadeUp" style={{ 
                background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', 
                padding: '32px', borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                animationDelay: '0.1s'
              }}>
                <div style={{ fontSize:'0.8rem', fontWeight: 800, color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', textTransform: 'uppercase', marginBottom: 24 }}>CANALES DE ADQUISICIÓN</div>
                
                <div style={{ flex: 1, position: 'relative', minHeight: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={trafficData} innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">
                        {trafficData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={trafficColors[index % trafficColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: 'var(--glass-bg)', backdropFilter: 'blur(24px)', border: '1px solid var(--glass-border)', borderRadius: 12, boxShadow: '0 4px 24px var(--glass-shadow)' }} 
                        itemStyle={{ color: 'var(--text-primary)', fontWeight: 700 }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', inset: 0, transform: 'translateY(-5%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', pointerEvents: 'none' }}>
                    <span style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{ga4data.sesiones?.toLocaleString('es-AR')}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>Sesiones</span>
                  </div>
                </div>

                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {trafficData.map((f, i) => (
                    <div key={f.name} style={{ display:'flex', justifyContent:'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: trafficColors[i % trafficColors.length], boxShadow: `0 0 10px ${trafficColors[i % trafficColors.length]}88` }} />
                        <span style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.6)', fontWeight: 600 }}>{f.name}</span>
                      </div>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.85rem', fontWeight:800, color:'#fff' }}>
                        {((f.value / traficoTotal) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Secondary Analytics Row */}
          {ga4data && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 40 }}>
               {/* Website Performance Metrics */}
              <div className="animate-fadeUp" style={{ 
                background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(20px)', 
                padding: '32px', borderRadius: 32, border: '1px solid rgba(255,255,255,0.08)',
                animationDelay: '0.2s'
              }}>
                <div style={{ fontSize:'0.8rem', fontWeight: 800, color:'rgba(255,255,255,0.5)', marginBottom:24, letterSpacing:'0.1em', textTransform: 'uppercase' }}>EFICIENCIA DEL SITIO WEB</div>
                <div style={{ display:'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap:20 }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px 12px', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, marginBottom: 12, textTransform: 'uppercase' }}>Páginas Vistas</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>{ga4data.pageviews?.toLocaleString('es-AR') || '0'}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px 12px', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, marginBottom: 12, textTransform: 'uppercase' }}>Tasa Rebote</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F0436A' }}>{ga4data.tasa_rebote || '0'}%</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px 12px', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, marginBottom: 12, textTransform: 'uppercase' }}>Sesión Prom.</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981' }}>{ga4data.duracion_promedio_seg ? `${Math.floor(ga4data.duracion_promedio_seg/60)}m` : '0m'}</div>
                  </div>
                </div>
              </div>

              {/* SEO Top Keywords */}
              {ga4data.seo_keywords?.length > 0 && (
                <div className="animate-fadeUp" style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(20px)', 
                  padding: '32px', borderRadius: 32, border: '1px solid rgba(255,255,255,0.08)',
                  animationDelay: '0.3s'
                }}>
                  <div style={{ fontSize:'0.8rem', fontWeight: 800, color:'rgba(255,255,255,0.5)', marginBottom:24, letterSpacing:'0.1em', textTransform: 'uppercase' }}>RANKING SEO (TOP KEYWORDS)</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {[...ga4data.seo_keywords].sort((a,b) => parseInt(a.posicion||99)-parseInt(b.posicion||99)).slice(0,4).map((kw,i) => (
                      <div key={i} style={{
                        display:'grid', gridTemplateColumns:'1fr 60px 80px 90px', gap:16,
                        padding:'14px 20px', background:'rgba(255,255,255,0.02)',
                        border:'1px solid rgba(255,255,255,0.05)', borderRadius:16, alignItems:'center',
                      }}>
                        <span style={{ fontSize:'0.9rem', color:'#fff', fontWeight: 700 }}>{kw.keyword}</span>
                        <span style={{
                          fontFamily:'var(--font-mono)', fontSize:'1rem', fontWeight: 900, textAlign:'center',
                          color: parseInt(kw.posicion)<=3? '#10B981' : parseInt(kw.posicion)<=10 ? accentColor : 'rgba(255,255,255,0.4)',
                          textShadow: parseInt(kw.posicion)<=3 ? '0 0 10px #10B98144' : 'none'
                        }}>#{kw.posicion}</span>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.8rem', textAlign:'right', color:'rgba(255,255,255,0.5)', fontWeight:600 }}>{kw.clics || 0} clicks</span>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.8rem', textAlign:'right', color:'rgba(255,255,255,0.3)', fontWeight:500 }}>{kw.impresiones?.toLocaleString('es-AR') || 0} imp</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Records Detail Modal */}
          <GlassModal isOpen={showLogsModal} onClose={() => setShowLogsModal(false)} title={`Bitácora de Sistemas - ${MONTHS_ES[month]} ${year}`}>
            <div style={{ overflowX: 'auto', margin: '0 -32px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {['Fecha', 'Incidencias', 'Cód. Barras', 'Optimizadas', 'Notas'].map(h => (
                      <th key={h} style={{ padding: '16px 20px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '16px 20px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>{r.fecha?.split('-').reverse().join('/')}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', color: r.incidencias_resueltas ? '#60A5FA' : 'rgba(255,255,255,0.1)', fontWeight: 800 }}>{r.incidencias_resueltas || '—'}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', color: r.imagenes_codigos_actualizadas ? accentColor : 'rgba(255,255,255,0.1)', fontWeight: 800 }}>{r.imagenes_codigos_actualizadas || '—'}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', color: r.imagenes_peso_optimizado ? '#3B82F6' : 'rgba(255,255,255,0.1)', fontWeight: 800 }}>{r.imagenes_peso_optimizado || '—'}</td>
                      <td style={{ padding: '16px 20px', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notas || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassModal>
        </>
      )}
    </div>
  )
}
