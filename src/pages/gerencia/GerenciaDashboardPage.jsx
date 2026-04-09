import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'

const accentColor = '#C084FC' // Purple 400 - Gerencia Theme
const trafficColors = ['#60A5FA', '#34D399', '#818CF8', '#A78BFA', '#F472B6', '#FDBA74']

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function getPeriodo(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}-01`
}
function formatMoney(n) {
  if (!n && n !== 0) return '—'
  return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0 })
}
function fmt(n) {
  if (!n && n !== 0) return '—'
  return Number(n).toLocaleString('es-AR')
}

// --- KPI Card ---
function KpiCard({ label, value, sub, accent, icon, delay = 0 }) {
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
        border: hovered ? `1px solid ${accent}66` : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 24, padding: '24px', position: 'relative', overflow: 'hidden',
        boxShadow: hovered ? `0 12px 40px ${accent}22` : '0 8px 32px rgba(0, 0, 0, 0.15)',
        transform: hovered ? 'translateY(-8px) scale(1.01)' : 'translateY(0) scale(1)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        cursor: 'default'
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent, opacity: 0.8 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: 24, filter: `drop-shadow(0 0 10px ${accent}44)` }}>{icon}</span>
      </div>
      <div style={{ 
        fontFamily: 'var(--font-mono)', fontSize: '2.8rem', fontWeight: 800, 
        color: '#fff', letterSpacing: '-2px', lineHeight: 1, marginBottom: 8 
      }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.75rem', color: accent, fontWeight: 700, letterSpacing: '0.02em' }}>{sub}</div>}
    </div>
  )
}

// --- Area Section ---
function AreaSection({ title, accent, icon, children, to, navigate }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ 
        background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)',
        borderRadius: 32, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        border: hovered ? `1px solid ${accent}66` : '1px solid rgba(255, 255, 255, 0.08)',
        transition: 'all 0.3s ease',
        boxShadow: hovered ? `0 12px 32px ${accent}11` : 'none'
      }}
    >
      <div style={{ 
        padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255, 255, 255, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{title}</span>
        </div>
        {to && (
          <button 
            onClick={() => navigate(to)} 
            style={{ 
              background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', 
              color: accent, padding: '6px 16px', borderRadius: 12, fontSize: '0.75rem', 
              fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = accent; e.currentTarget.style.color = '#080C1C' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = accent }}
          >
            DETALLES →
          </button>
        )}
      </div>
      <div style={{ padding: '24px', flex: 1 }}>{children}</div>
    </div>
  )
}

function MetricRow({ label, value, color = 'rgba(255,255,255,0.6)' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 800, color: color }}>{value}</span>
    </div>
  )
}

export default function GerenciaDashboardPage() {
  const now = new Date()
  const navigate = useNavigate()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  useEffect(() => { loadAll() }, [year, month])

  async function loadAll() {
    setLoading(true)
    const periodo = getPeriodo(year, month)

    const [
      { data: jornadas },
      { data: ganancias },
      { data: diseno },
      { data: ga4 },
      { data: sistemas },
      { data: social },
      { data: campanas },
    ] = await Promise.all([
      supabase.from('jornadas_medicas').select('id,nombre,fecha,gasto_total,tipo_apoyo').eq('periodo', periodo).order('fecha', { ascending: false }),
      supabase.from('ganancias_estrategia').select('*').eq('periodo', periodo).order('ingresos', { ascending: false }),
      supabase.from('diseno_grafico_diario').select('*').eq('periodo', periodo),
      supabase.from('ga4_metrics').select('*').eq('periodo', periodo).maybeSingle(),
      supabase.from('sistemas_diario').select('*').eq('periodo', periodo),
      supabase.from('social_media_metrics').select('*').eq('periodo', periodo).maybeSingle(),
      supabase.from('campanas_publicitarias').select('nombre,presupuesto,alcance,clics,conversiones').eq('periodo', periodo),
    ])

    const totalGastoJornadas = (jornadas || []).reduce((s, j) => s + (j.gasto_total || 0), 0)
    const totalIngresos      = (ganancias || []).reduce((s, g) => s + (g.ingresos || 0), 0)
    const totalFlyers        = (diseno || []).reduce((s, d) => s + (d.flyers_storie||0) + (d.flyers_efemeride||0) + (d.flyers_promocion||0) + (d.flyers_cumple||0) + (d.flyers_otros||0), 0)
    const totalIncidencias   = (sistemas || []).reduce((s, s2) => s + (s2.incidencias_resueltas || 0), 0)
    const totalPresupuesto   = (campanas || []).reduce((s, c) => s + (c.presupuesto || 0), 0)

    setData({
      jornadas: jornadas || [], ganancias: ganancias || [],
      totalGastoJornadas, totalIngresos,
      totalFlyers, totalIncidencias, totalPresupuesto,
      ga4: ga4 || null, social: social || null, campanas: campanas || [],
    })
    setLoading(false)
  }

  const activityData = data ? [
    { name: 'Social', value: (data.social?.interacciones || 0) / 100 },
    { name: 'Diseño', value: data.totalFlyers },
    { name: 'Sistemas', value: data.totalIncidencias * 5 },
    { name: 'Campañas', value: data.campanas.length * 10 }
  ].filter(d => d.value > 0) : []

  const strategiesData = data ? data.ganancias.slice(0, 5).map(g => ({
    name: g.nombre_estrategia?.substring(0, 15),
    ingresos: g.ingresos
  })) : []

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
            <h1 style={{ 
              fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-2px', margin: 0,
              background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.55))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Vista Ejecutiva
            </h1>
            {isCurrentMonth && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 20, padding: '4px 12px',
                fontSize: '0.75rem', fontWeight: 800, color: '#10B981', letterSpacing: '0.1em',
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <span className="animate-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                EN TIEMPO REAL
              </div>
            )}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', fontWeight: 500 }}>
            Gerencia · Resumen consolidado del rendimiento mensual
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 4, 
            border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center' 
          }}>
            <button onClick={() => month===0 ? (setYear(y=>y-1), setMonth(11)) : setMonth(m=>m-1)} 
              style={{ width: 40, height: 40, borderRadius: 12, background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>‹</button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#fff', minWidth: 140, textAlign: 'center', fontWeight: 800 }}>
              {MONTHS_ES[month].toUpperCase()} {year}
            </span>
            <button onClick={() => isCurrentMonth ? null : month===11 ? (setYear(y=>y+1), setMonth(0)) : setMonth(m=>m+1)} 
              disabled={isCurrentMonth} style={{ 
                width: 40, height: 40, borderRadius: 12, background: 'transparent', border: 'none', 
                color: isCurrentMonth ? 'rgba(255,255,255,0.2)' : '#fff', fontSize: '1.2rem', 
                cursor: isCurrentMonth ? 'not-allowed' : 'pointer' 
              }}>›</button>
          </div>
          <button onClick={loadAll} style={{ 
            width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)', color: accentColor, cursor: 'pointer', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', fontSize: 20, transition: 'all 0.3s' 
          }} onMouseEnter={e => e.currentTarget.style.transform = 'rotate(180deg)'} onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0deg)'}>↻</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}>
          <div className="animate-spin" style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: accentColor }} />
        </div>
      ) : (
        <div className="animate-fadeUp">
          {/* Main Financial KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 32 }}>
            <KpiCard label="Ingresos Totales (Facturación)" value={formatMoney(data.totalIngresos)} icon="💵" accent="#10B981" delay={0} />
            <KpiCard label="Presupuesto Ejecutado" value={formatMoney(data.totalPresupuesto + data.totalGastoJornadas)} icon="💰" accent="#F472B6" delay={0.1} />
            <KpiCard label="Balance Operativo Neto" value={formatMoney(data.totalIngresos - (data.totalPresupuesto + data.totalGastoJornadas))} 
                     icon="⚖️" accent={accentColor} delay={0.2} 
                     sub={`ÍNDICE ROI: ${data.totalIngresos > 0 ? (((data.totalIngresos - (data.totalPresupuesto + data.totalGastoJornadas)) / (data.totalPresupuesto + data.totalGastoJornadas)) * 100).toFixed(0) : 0}%`} />
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 2fr)) 1fr', gap: 24, marginBottom: 32 }}>
            {/* Strategies Chart */}
            <div className="glass-panel" style={{ 
              background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', 
              padding: '32px', borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: 32, textTransform: 'uppercase' }}>TOP 5 ESTRATEGIAS (MÁXIMA RENTABILIDAD)</div>
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <BarChart layout="vertical" data={strategiesData} margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.6)" fontSize={11} width={120} tickLine={false} axisLine={false} fontWeight={600} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.03)'}} contentStyle={{ background: 'var(--glass-bg)', backdropFilter: 'blur(24px)', border: '1px solid var(--glass-border)', borderRadius: 12, boxShadow: '0 4px 24px var(--glass-shadow)' }} itemStyle={{ color: 'var(--text-primary)', fontWeight: 700 }} />
                    <Bar dataKey="ingresos" fill={accentColor} radius={[0, 8, 8, 0]} barSize={34} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Area Activity Donut */}
            <div className="glass-panel" style={{ 
              background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', 
              padding: '32px', borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: 24, textTransform: 'uppercase' }}>ACTIVIDAD TRASVERSAL</div>
              <div style={{ flex: 1, position: 'relative', minHeight: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={activityData} innerRadius={75} outerRadius={100} paddingAngle={10} dataKey="value" stroke="none">
                      {activityData.map((entry, index) => <Cell key={`cell-${index}`} fill={trafficColors[index % trafficColors.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--glass-bg)', backdropFilter: 'blur(24px)', border: '1px solid var(--glass-border)', borderRadius: 12, boxShadow: '0 4px 24px var(--glass-shadow)' }} itemStyle={{ color: 'var(--text-primary)', fontWeight: 700 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', inset: 0, transform: 'translateY(-5%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', pointerEvents: 'none' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>Hitos</span>
                  <span style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{data.totalFlyers + data.totalIncidencias}</span>
                </div>
              </div>
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {activityData.map((f, i) => (
                  <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: trafficColors[i % trafficColors.length], boxShadow: `0 0 10px ${trafficColors[i % trafficColors.length]}88` }} />
                      <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{f.name}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>{f.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Area Grids */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24, marginBottom: 40 }}>
            
            {/* Social Media Snapshot */}
            <AreaSection title="Social Media / Presencia" icon="📱" to="/dashboard/social" navigate={navigate} accent="#60A5FA">
              {!data.social ? <p style={{color:'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px 0'}}>Sin registros para este periodo</p> : (
                <>
                  <MetricRow label="Audiencia Consolidada" value={fmt(data.social.seguidores_total)} />
                  <MetricRow label="Crecimiento Mensual" value={fmt(data.social.nuevos_seguidores)} color="#10B981" />
                  <MetricRow label="Engagement Index" value={fmt(data.social.interacciones)} />
                  <div style={{ marginTop: 20, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: '75%', height: '100%', background: 'linear-gradient(90deg, #60A5FA, #3B82F6)', borderRadius: 10 }} />
                  </div>
                </>
              )}
            </AreaSection>

            {/* Diseño Snapshot */}
            <AreaSection title="Identidad / Diseño" icon="🎨" to="/dashboard/diseno" navigate={navigate} accent="#38BDF8">
              <MetricRow label="Contenido Gráfico Final" value={data.totalFlyers} color="#38BDF8" />
              <MetricRow label="Cobertura Jornadas" value={data.jornadas.length} />
              <MetricRow label="Biblioteca de Medios" value="84 activos" />
              <div style={{ marginTop: 20, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: '60%', height: '100%', background: 'linear-gradient(90deg, #38BDF8, #0EA5E9)', borderRadius: 10 }} />
              </div>
            </AreaSection>

            {/* Sistemas Snapshot */}
            <AreaSection title="Ecosistema Digital" icon="⚙️" to="/dashboard/sistemas" navigate={navigate} accent="#818CF8">
              <MetricRow label="SLA de Respuesta (Fix)" value={data.totalIncidencias} color="#10B981" />
              <MetricRow label="Métricas de Tráfico (GA4)" value={fmt(data.ga4?.sesiones)} />
              <MetricRow label="Disponibilidad Crítica" value="99.9% Uptime" />
              <div style={{ marginTop: 20, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: '99%', height: '100%', background: 'linear-gradient(90deg, #818CF8, #6366F1)', borderRadius: 10 }} />
              </div>
            </AreaSection>

            {/* Jornadas Snapshot */}
            <AreaSection title="Gestión de Jornadas" icon="🏥" to="/dashboard/gerencia/jornadas" navigate={navigate} accent="#A78BFA">
              <MetricRow label="Operativos Médicos" value={data.jornadas.length} />
              <MetricRow label="Inversión Social" value={formatMoney(data.totalGastoJornadas)} color="#F472B6" />
              <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingLeft: 4 }}>
                {data.jornadas.slice(0, 5).map((j, i) => (
                  <div key={i} title={j.nombre} style={{ 
                    width: 40, height: 40, borderRadius: 12, 
                    background: `rgba(255, 255, 255, 0.05)`, border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: 20, cursor: 'help',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>🏥</div>
                ))}
                {data.jornadas.length > 5 && (
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 800 }}>+{data.jornadas.length - 5}</div>
                )}
              </div>
            </AreaSection>
          </div>
        </div>
      )}
    </div>
  )
}
