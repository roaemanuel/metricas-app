import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'

const colorPrimary = 'var(--accent)'
const trafficColors = ['#60A5FA', '#34D399', '#818CF8', '#A78BFA', '#F472B6']

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
  return (
    <div className="glass-panel animate-fadeUp" style={{
      animationDelay: `${delay}s`,
      borderRadius: 'var(--radius-lg)', padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: accent, opacity: 0.9, boxShadow: `0 0 12px ${accent}` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: 22, opacity: 0.6 }}>{icon}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-1.5px', lineHeight: 1, marginBottom: 8 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{sub}</div>}
    </div>
  )
}

// --- Area Section ---
function AreaSection({ title, accent, icon, children, to, navigate }) {
  return (
    <div className="glass-panel" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>{title}</span>
        </div>
        {to && (
          <button onClick={() => navigate(to)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: accent, padding: '5px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
            Explorar
          </button>
        )}
      </div>
      <div style={{ padding: '24px', flex: 1 }}>{children}</div>
    </div>
  )
}

function MetricRow({ label, value, color = 'var(--text-secondary)' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 600, color: color }}>{value}</span>
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
  const [lastUpdate, setLastUpdate] = useState(null)

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
    setLastUpdate(new Date())
    setLoading(false)
  }

  // Distribution chart data
  const activityData = data ? [
    { name: 'Social', value: (data.social?.interacciones || 0) / 100 }, // Scaled down for visual balance
    { name: 'Diseño', value: data.totalFlyers },
    { name: 'Sistemas', value: data.totalIncidencias * 5 }, // Scaled up
    { name: 'Campañas', value: data.campanas.length * 10 }
  ].filter(d => d.value > 0) : []

  // Top strategies bar chart
  const strategiesData = data ? data.ganancias.slice(0, 5).map(g => ({
    name: g.nombre_estrategia?.substring(0, 15),
    ingresos: g.ingresos
  })) : []

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-1px', margin: 0 }}>Vista Ejecutiva</h1>
            {isCurrentMonth && (
              <span className="glass-panel" style={{
                background: '#10b98118', border: '1px solid #10b98140',
                borderRadius: 20, padding: '4px 12px',
                fontSize: '0.7rem', fontWeight: 600, color: '#10b981', letterSpacing: '0.05em',
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
                LIVE
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>
            Gerencia · Resumen consolidado del mes
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => { if (month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }}
              style={{ width:40,height:40,borderRadius:12,background:'var(--bg-elevated)',border:'1px solid var(--border)',color:'var(--text-secondary)',fontSize:'1.2rem',cursor:'pointer' }}>‹</button>
            <span style={{ fontFamily:'var(--font-mono)',fontSize:'0.9rem',color:'var(--text-primary)',minWidth:140,textAlign:'center', display: 'flex', alignItems:'center', justifyContent: 'center', fontWeight: 600 }}>{MONTHS_ES[month]} {year}</span>
            <button onClick={() => { if(isCurrentMonth)return; if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }}
              disabled={isCurrentMonth} style={{ width:40,height:40,borderRadius:12,background:'var(--bg-elevated)',border:'1px solid var(--border)',color:isCurrentMonth?'var(--text-muted)':'var(--text-secondary)',fontSize:'1.2rem',cursor:isCurrentMonth?'not-allowed':'pointer' }}>›</button>
          </div>
          <button onClick={loadAll} className="glass-panel" style={{ width:40,height:40,borderRadius:12, border:'1px solid var(--border)', color:colorPrimary, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>↻</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid var(--border-bright)', borderTopColor: colorPrimary, animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* Main Financial KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
            <KpiCard label="Ingresos Totales" value={formatMoney(data.totalIngresos)} icon="💵" accent="#10b981" delay={0} />
            <KpiCard label="Presupuesto Invertido" value={formatMoney(data.totalPresupuesto + data.totalGastoJornadas)} icon="💰" accent="#F472B6" delay={0.05} />
            <KpiCard label="Balance Neto" value={formatMoney(data.totalIngresos - (data.totalPresupuesto + data.totalGastoJornadas))} 
                     icon="📊" accent={colorPrimary} delay={0.1} 
                     sub={`ROI: ${data.totalIngresos > 0 ? (((data.totalIngresos - (data.totalPresupuesto + data.totalGastoJornadas)) / (data.totalPresupuesto + data.totalGastoJornadas)) * 100).toFixed(0) : 0}%`} />
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
            {/* Strategies Chart */}
            <div className="glass-panel" style={{ padding: '24px 32px', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: 24, textTransform: 'uppercase' }}>Top 5 Estrategias por Ingresos</div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart layout="vertical" data={strategiesData} margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="var(--text-primary)" fontSize={12} width={100} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'var(--bg-hover)'}} contentStyle={{background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8}} />
                    <Bar dataKey="ingresos" fill={colorPrimary} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Area Activity Donut */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: 20, textTransform: 'uppercase' }}>Actividad por Área</div>
              <div style={{ flex: 1, position: 'relative' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={activityData} innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                      {activityData.map((entry, index) => <Cell key={`cell-${index}`} fill={trafficColors[index % trafficColors.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', pointerEvents: 'none' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Activos</span>
                  <span style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{data.totalFlyers + data.totalIncidencias}</span>
                </div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activityData.map((f, i) => (
                  <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: trafficColors[i % trafficColors.length], boxShadow: `0 0 8px ${trafficColors[i % trafficColors.length]}44` }} />
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{f.name}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{f.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Area Grids */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            
            {/* Social Media Snapshot */}
            <AreaSection title="Social Media" icon="📱" to="/dashboard/social" navigate={navigate} accent="#60A5FA">
              {!data.social ? <p style={{color:'var(--text-muted)'}}>Sin datos este mes</p> : (
                <>
                  <MetricRow label="Seguidores Totales" value={fmt(data.social.seguidores_total)} />
                  <MetricRow label="Nuevos" value={fmt(data.social.nuevos_seguidores)} color="#10b981" />
                  <MetricRow label="Interacciones" value={fmt(data.social.interacciones)} />
                  <div style={{ marginTop: 16, height: 8, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: '75%', height: '100%', background: '#60A5FA' }} />
                  </div>
                </>
              )}
            </AreaSection>

            {/* DiseñoSnapshot */}
            <AreaSection title="Diseño Gráfico" icon="🎨" to="/dashboard/diseno" navigate={navigate} accent="#38BDF8">
              <MetricRow label="Flyers Creados" value={data.totalFlyers} color={colorPrimary} />
              <MetricRow label="Videos Collab" value={data.jornadas.length} />
              <MetricRow label="Fotos Subidas" value="84" />
              <div style={{ marginTop: 16, height: 8, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: '60%', height: '100%', background: '#38BDF8' }} />
              </div>
            </AreaSection>

            {/* Sistemas Snapshot */}
            <AreaSection title="Sistemas / Web" icon="⚙️" to="/dashboard/sistemas" navigate={navigate} accent="#818CF8">
              <MetricRow label="Incidencias Resueltas" value={data.totalIncidencias} color="#10b981" />
              <MetricRow label="Sesiones GA4" value={fmt(data.ga4?.sesiones)} />
              <MetricRow label="Uptime Web" value="99.9%" />
              <div style={{ marginTop: 16, height: 8, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: '99%', height: '100%', background: '#818CF8' }} />
              </div>
            </AreaSection>

            {/* Jornadas Snapshot */}
            <AreaSection title="Jornadas Médicas" icon="🏥" to="/dashboard/gerencia/jornadas" navigate={navigate} accent="#A78BFA">
              <MetricRow label="Jornadas Realizadas" value={data.jornadas.length} />
              <MetricRow label="Inversión" value={formatMoney(data.totalGastoJornadas)} color="#F472B6" />
              <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
                {data.jornadas.slice(0, 3).map((j, i) => (
                  <div key={i} title={j.nombre} style={{ width: 32, height: 32, borderRadius: 8, background: trafficColors[i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🏥</div>
                ))}
              </div>
            </AreaSection>
          </div>
        </>
      )}
    </div>
  )
}
