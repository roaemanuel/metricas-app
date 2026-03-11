import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

// ─── Paleta Marketing Joskar ───────────────────────────────────────────────
const palette = {
  navy:       '#0a1628',
  navyMid:    '#0f2040',
  blue:       '#1a3a6b',
  blueMid:    '#1e4d8c',
  blueLight:  '#2563eb',
  blueBright: '#3b82f6',
  blueGlow:   '#60a5fa',
  blueAccent: '#93c5fd',
  grayBlue1:  '#0d1b2e',
  grayBlue2:  '#162033',
  grayBlue3:  '#1e2d44',
  grayBlue4:  '#253554',
  grayBlue5:  '#2e4068',
  border:     '#1e3152',
  borderBright:'#2a4875',
  textPrimary: '#e8f0fe',
  textSec:    '#8ba4c8',
  textMuted:  '#4d6a94',
  white:      '#ffffff',
  green:      '#10b981',
  amber:      '#f59e0b',
  rose:       '#f43f5e',
  purple:     '#8b5cf6',
  cyan:       '#06b6d4',
}

const AREA_COLORS = {
  social:   '#f0436a',
  diseno:   '#0eb8d4',
  sistemas: '#f5c518',
  gerencia: '#3b82f6',
}

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

// ─── Componentes ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent, icon, delay = 0 }) {
  return (
    <div style={{
      background: palette.grayBlue2,
      border: `1px solid ${palette.border}`,
      borderRadius: 12,
      padding: '18px 20px',
      position: 'relative',
      overflow: 'hidden',
      animation: `fadeUp 0.4s ease both`,
      animationDelay: `${delay}s`,
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${accent}, transparent)`,
      }} />
      <div style={{
        position: 'absolute', bottom: -20, right: -10,
        fontSize: 52, opacity: 0.06, userSelect: 'none', lineHeight: 1,
      }}>{icon}</div>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: palette.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '1.75rem', fontWeight: 600, color: accent, letterSpacing: '-1px', lineHeight: 1, marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: palette.textMuted }}>{sub}</div>}
    </div>
  )
}

function AreaSection({ title, color, icon, children, to, navigate }) {
  return (
    <div style={{
      background: palette.grayBlue2,
      border: `1px solid ${palette.border}`,
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 20px',
        borderBottom: `1px solid ${palette.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: palette.grayBlue3,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: palette.textSec, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{icon} {title}</span>
        </div>
        {to && (
          <button onClick={() => navigate(to)} style={{ background: 'none', border: 'none', color: color, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}>
            Ver más →
          </button>
        )}
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  )
}

function MetricRow({ label, value, color, bar, total }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: '0.78rem', color: palette.textSec }}>{label}</span>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.78rem', fontWeight: 600, color: color || palette.textPrimary }}>{fmt(value)}</span>
      </div>
      {bar && (
        <div style={{ height: 3, background: palette.grayBlue4, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
        </div>
      )}
    </div>
  )
}

function EmptyState({ msg, cta, onClick }) {
  return (
    <div style={{ padding: '20px 0', textAlign: 'center', color: palette.textMuted, fontSize: '0.8rem' }}>
      {msg}{' '}
      {cta && <button onClick={onClick} style={{ background: 'none', border: 'none', color: palette.blueGlow, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>{cta}</button>}
    </div>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────

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

  // Auto-refresh cada 60s si es el mes actual
  useEffect(() => {
    if (!isCurrentMonth) return
    const interval = setInterval(loadAll, 60000)
    return () => clearInterval(interval)
  }, [isCurrentMonth, year, month])

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
      supabase.from('diseno_grafico_diario').select('total_flyers,video,fotos_producto,storie,efemeride,promo,cumple,otros').eq('periodo', periodo),
      supabase.from('ga4_metrics').select('*').eq('periodo', periodo).maybeSingle(),
      supabase.from('sistemas_diario').select('incidencias_resueltas,imagenes_codigos_actualizadas,imagenes_peso_optimizado').eq('periodo', periodo),
      supabase.from('social_media_metrics').select('*').eq('periodo', periodo).maybeSingle(),
      supabase.from('campanas_publicitarias').select('nombre,presupuesto,alcance,clics,conversiones').eq('periodo', periodo),
    ])

    // Gerencia
    const totalGastoJornadas = (jornadas || []).reduce((s, j) => s + (j.gasto_total || 0), 0)
    const totalIngresos      = (ganancias || []).reduce((s, g) => s + (g.ingresos || 0), 0)

    // Diseño
    const totalFlyers      = (diseno || []).reduce((s, d) => s + (d.total_flyers || 0), 0)
    const totalVideos      = (diseno || []).reduce((s, d) => s + (d.video || 0), 0)
    const totalFotos       = (diseno || []).reduce((s, d) => s + (d.fotos_producto || 0), 0)
    const totalStories     = (diseno || []).reduce((s, d) => s + (d.storie || 0), 0)
    const totalEfemerides  = (diseno || []).reduce((s, d) => s + (d.efemeride || 0), 0)
    const totalPromos      = (diseno || []).reduce((s, d) => s + (d.promo || 0), 0)

    // Sistemas
    const totalIncidencias  = (sistemas || []).reduce((s, s2) => s + (s2.incidencias_resueltas || 0), 0)
    const totalImagenes     = (sistemas || []).reduce((s, s2) => s + (s2.imagenes_codigos_actualizadas || 0), 0)

    // Campañas
    const totalPresupuesto  = (campanas || []).reduce((s, c) => s + (c.presupuesto || 0), 0)
    const totalClics        = (campanas || []).reduce((s, c) => s + (c.clics || 0), 0)
    const totalConversiones = (campanas || []).reduce((s, c) => s + (c.conversiones || 0), 0)

    setData({
      jornadas: jornadas || [],
      ganancias: ganancias || [],
      totalGastoJornadas, totalIngresos,
      totalFlyers, totalVideos, totalFotos, totalStories, totalEfemerides, totalPromos,
      totalIncidencias, totalImagenes,
      totalPresupuesto, totalClics, totalConversiones,
      ga4: ga4 || null,
      social: social || null,
      campanas: campanas || [],
    })
    setLastUpdate(new Date())
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.8px', color: palette.textPrimary, margin: 0 }}>
              Vista ejecutiva
            </h1>
            {isCurrentMonth && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: `${palette.green}18`, border: `1px solid ${palette.green}40`,
                borderRadius: 20, padding: '2px 10px',
                fontSize: '0.68rem', fontWeight: 700, color: palette.green, letterSpacing: '0.05em',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: palette.green, animation: 'pulse 2s infinite', display: 'inline-block' }} />
                EN VIVO
              </span>
            )}
          </div>
          <p style={{ color: palette.textMuted, fontSize: '0.82rem', margin: 0 }}>
            Marketing Joskar · resumen consolidado · {lastUpdate ? `actualizado ${lastUpdate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}` : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => { if (month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }}
            style={{ width:34, height:34, borderRadius:8, background: palette.grayBlue3, border:`1px solid ${palette.border}`, color: palette.textSec, fontSize:'1.1rem', cursor:'pointer' }}>‹</button>
          <span style={{ fontFamily:'DM Mono, monospace', fontSize:'0.82rem', color: palette.textPrimary, minWidth:130, textAlign:'center', background: palette.grayBlue3, border:`1px solid ${palette.border}`, borderRadius:8, padding:'6px 12px' }}>
            {MONTHS_ES[month]} {year}
          </span>
          <button onClick={() => { if(isCurrentMonth)return; if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }}
            disabled={isCurrentMonth}
            style={{ width:34, height:34, borderRadius:8, background: palette.grayBlue3, border:`1px solid ${palette.border}`, color:isCurrentMonth?palette.textMuted:palette.textSec, fontSize:'1.1rem', cursor:isCurrentMonth?'not-allowed':'pointer' }}>›</button>
          <button onClick={loadAll} title="Actualizar"
            style={{ width:34, height:34, borderRadius:8, background: palette.grayBlue3, border:`1px solid ${palette.border}`, color: palette.blueGlow, fontSize:'0.9rem', cursor:'pointer' }}>↻</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:80, gap:16 }}>
          <div style={{ width:28, height:28, borderRadius:'50%', border:`2px solid ${palette.border}`, borderTopColor: palette.blueLight, animation:'spin 0.8s linear infinite' }} />
          <span style={{ fontSize:'0.78rem', color: palette.textMuted }}>Cargando datos del equipo…</span>
        </div>
      ) : (
        <>
          {/* ── KPIs financieros ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:10, marginBottom:16 }}>
            <KpiCard label="Ingresos del mes"     value={formatMoney(data.totalIngresos)}      icon="💵" accent={palette.green}      delay={0}    />
            <KpiCard label="Gasto en jornadas"    value={formatMoney(data.totalGastoJornadas)} icon="💰" accent={palette.amber}      delay={0.05} />
            <KpiCard label="Jornadas médicas"     value={data.jornadas.length}                 icon="🏥" accent={palette.blueBright} delay={0.1}  />
            <KpiCard label="Estrategias activas"  value={data.ganancias.length}                icon="📊" accent={palette.blueGlow}   delay={0.15} />
          </div>

          {/* ── KPIs cross-área ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(145px, 1fr))', gap:10, marginBottom:20 }}>
            <KpiCard label="Seguidores totales"   value={fmt(data.social?.seguidores_total)}   icon="👥" accent={AREA_COLORS.social}   delay={0.2} sub="Social Media" />
            <KpiCard label="Nuevos seguidores"    value={fmt(data.social?.nuevos_seguidores)}  icon="📈" accent={AREA_COLORS.social}   delay={0.22} sub="Social Media" />
            <KpiCard label="Flyers creados"       value={fmt(data.totalFlyers)}                icon="🎨" accent={AREA_COLORS.diseno}   delay={0.24} sub="Diseño Gráfico" />
            <KpiCard label="Sesiones web"         value={fmt(data.ga4?.sesiones)}              icon="🌐" accent={AREA_COLORS.sistemas} delay={0.26} sub="Sistemas / GA4" />
            <KpiCard label="Usuarios activos"     value={fmt(data.ga4?.usuarios_activos)}      icon="👤" accent={palette.purple}       delay={0.28} sub="Sistemas / GA4" />
            <KpiCard label="Incidencias resueltas" value={fmt(data.totalIncidencias)}          icon="🔧" accent={AREA_COLORS.sistemas} delay={0.3}  sub="Sistemas" />
          </div>

          {/* ── Grid de áreas ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>

            {/* Social Media */}
            <AreaSection title="Social Media" color={AREA_COLORS.social} icon="📱" to="/dashboard/social" navigate={navigate}>
              {!data.social ? (
                <EmptyState msg="Sin datos este mes —" cta="ingresar" onClick={() => navigate('/dashboard/social/ingresar')} />
              ) : (
                <>
                  <MetricRow label="Seguidores totales"  value={data.social.seguidores_total}  color={AREA_COLORS.social} />
                  <MetricRow label="Nuevos seguidores"   value={data.social.nuevos_seguidores} color={AREA_COLORS.social} />
                  <MetricRow label="Alcance"             value={data.social.alcance}            color={palette.textSec} />
                  <MetricRow label="Interacciones"       value={data.social.interacciones}      color={palette.textSec} />
                  {data.social.seguidores_total > 0 && data.social.interacciones > 0 && (
                    <div style={{ marginTop:10, padding:'8px 12px', background: palette.grayBlue3, borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:'0.72rem', color: palette.textMuted }}>Engagement Rate</span>
                      <span style={{ fontFamily:'DM Mono, monospace', fontSize:'0.88rem', fontWeight:700, color: AREA_COLORS.social }}>
                        {((data.social.interacciones / data.social.seguidores_total) * 100).toFixed(2)}%
                      </span>
                    </div>
                  )}
                </>
              )}
            </AreaSection>

            {/* Campañas */}
            <AreaSection title="Campañas Publicitarias" color={palette.rose} icon="📣" to="/dashboard/social/campanas" navigate={navigate}>
              {data.campanas.length === 0 ? (
                <EmptyState msg="Sin campañas este mes —" cta="registrar" onClick={() => navigate('/dashboard/social/campanas')} />
              ) : (
                <>
                  <MetricRow label="Campañas activas"   value={data.campanas.length}           color={palette.rose} />
                  <MetricRow label="Presupuesto total"  value={formatMoney(data.totalPresupuesto)} color={palette.amber} />
                  <MetricRow label="Clics totales"      value={fmt(data.totalClics)}            color={palette.textSec} />
                  <MetricRow label="Conversiones"       value={fmt(data.totalConversiones)}     color={palette.green} />
                  {data.totalClics > 0 && data.totalPresupuesto > 0 && (
                    <div style={{ marginTop:10, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      <div style={{ padding:'8px 10px', background: palette.grayBlue3, borderRadius:8, textAlign:'center' }}>
                        <div style={{ fontSize:'0.68rem', color: palette.textMuted, marginBottom:3 }}>CPC</div>
                        <div style={{ fontFamily:'DM Mono, monospace', fontSize:'0.82rem', fontWeight:700, color: palette.amber }}>{formatMoney(data.totalPresupuesto / data.totalClics)}</div>
                      </div>
                      <div style={{ padding:'8px 10px', background: palette.grayBlue3, borderRadius:8, textAlign:'center' }}>
                        <div style={{ fontSize:'0.68rem', color: palette.textMuted, marginBottom:3 }}>CTR</div>
                        <div style={{ fontFamily:'DM Mono, monospace', fontSize:'0.82rem', fontWeight:700, color: palette.rose }}>
                          {data.totalClics > 0 && data.social?.alcance > 0 ? ((data.totalClics / data.social.alcance) * 100).toFixed(2) + '%' : '—'}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </AreaSection>

            {/* Diseño Gráfico */}
            <AreaSection title="Diseño Gráfico" color={AREA_COLORS.diseno} icon="🎨" to="/dashboard/diseno" navigate={navigate}>
              {data.totalFlyers === 0 && data.totalVideos === 0 ? (
                <EmptyState msg="Sin registros este mes —" cta="ingresar" onClick={() => navigate('/dashboard/diseno/ingresar')} />
              ) : (
                <>
                  <MetricRow label="Total flyers"     value={data.totalFlyers}     color={AREA_COLORS.diseno} bar total={data.totalFlyers} />
                  <MetricRow label="Stories"          value={data.totalStories}    color={palette.textSec} bar total={data.totalFlyers} />
                  <MetricRow label="Efemérides"       value={data.totalEfemerides} color={palette.textSec} bar total={data.totalFlyers} />
                  <MetricRow label="Promocionales"    value={data.totalPromos}     color={palette.textSec} bar total={data.totalFlyers} />
                  <MetricRow label="Videos"           value={data.totalVideos}     color={AREA_COLORS.diseno} />
                  <MetricRow label="Fotos producto"   value={data.totalFotos}      color={palette.textSec} />
                </>
              )}
            </AreaSection>

            {/* Sistemas / GA4 */}
            <AreaSection title="Sistemas / Web" color={AREA_COLORS.sistemas} icon="⚙️" to="/dashboard/sistemas" navigate={navigate}>
              {!data.ga4 && data.totalIncidencias === 0 ? (
                <EmptyState msg="Sin datos este mes —" cta="ingresar" onClick={() => navigate('/dashboard/sistemas/ingresar')} />
              ) : (
                <>
                  {data.ga4 && (
                    <>
                      <MetricRow label="Sesiones"          value={data.ga4.sesiones}            color={AREA_COLORS.sistemas} />
                      <MetricRow label="Usuarios activos"  value={data.ga4.usuarios_activos}    color={palette.textSec} />
                      <MetricRow label="Pageviews"         value={data.ga4.pageviews}           color={palette.textSec} />
                      <MetricRow label="Tráfico orgánico"  value={data.ga4.trafico_organico}    color={palette.green} />
                      <div style={{ margin:'10px 0', height:1, background: palette.border }} />
                    </>
                  )}
                  <MetricRow label="Incidencias resueltas"     value={data.totalIncidencias} color={AREA_COLORS.sistemas} />
                  <MetricRow label="Imágenes actualizadas"     value={data.totalImagenes}    color={palette.textSec} />
                </>
              )}
            </AreaSection>
          </div>

          {/* ── Gerencia: Top estrategias + Jornadas ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>

            {/* Top estrategias */}
            <AreaSection title="Top Estrategias" color={palette.green} icon="💵" to="/dashboard/gerencia/ganancias" navigate={navigate}>
              {data.ganancias.length === 0 ? (
                <EmptyState msg="Sin datos —" cta="importar Excel" onClick={() => navigate('/dashboard/gerencia/ganancias')} />
              ) : (
                <>
                  {data.ganancias.slice(0, 5).map((g, i) => {
                    const pct = data.totalIngresos > 0 ? (g.ingresos / data.totalIngresos * 100) : 0
                    return (
                      <div key={g.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                        <span style={{ fontFamily:'DM Mono, monospace', fontSize:'0.68rem', color: palette.textMuted, minWidth:16, textAlign:'right' }}>{i+1}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'0.78rem', color: palette.textPrimary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>{g.nombre_estrategia}</div>
                          <div style={{ height:3, background: palette.grayBlue4, borderRadius:99 }}>
                            <div style={{ width:`${pct}%`, height:'100%', background: palette.green, borderRadius:99, transition:'width 0.6s ease' }} />
                          </div>
                        </div>
                        <span style={{ fontFamily:'DM Mono, monospace', fontSize:'0.78rem', fontWeight:700, color: palette.green, flexShrink:0 }}>{formatMoney(g.ingresos)}</span>
                      </div>
                    )
                  })}
                  <div style={{ paddingTop:10, borderTop:`1px solid ${palette.border}`, display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:'0.75rem', fontWeight:700, color: palette.textSec }}>Total ingresos</span>
                    <span style={{ fontFamily:'DM Mono, monospace', fontSize:'0.88rem', fontWeight:700, color: palette.green }}>{formatMoney(data.totalIngresos)}</span>
                  </div>
                </>
              )}
            </AreaSection>

            {/* Jornadas médicas */}
            <AreaSection title="Jornadas Médicas" color={palette.amber} icon="🏥" to="/dashboard/gerencia/jornadas" navigate={navigate}>
              {data.jornadas.length === 0 ? (
                <EmptyState msg="Sin jornadas este mes —" cta="registrar" onClick={() => navigate('/dashboard/gerencia/jornadas')} />
              ) : (
                <>
                  {data.jornadas.slice(0, 4).map((j) => (
                    <div key={j.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, paddingBottom:10, borderBottom:`1px solid ${palette.border}` }}>
                      <div>
                        <div style={{ fontSize:'0.8rem', fontWeight:600, color: palette.textPrimary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:160 }}>{j.nombre}</div>
                        <div style={{ fontSize:'0.68rem', color: palette.textMuted, fontFamily:'DM Mono, monospace', marginTop:2 }}>
                          {j.fecha?.slice(8)}/{j.fecha?.slice(5,7)}
                        </div>
                      </div>
                      {j.gasto_total > 0 && (
                        <span style={{ fontFamily:'DM Mono, monospace', fontSize:'0.78rem', fontWeight:700, color: palette.amber }}>{formatMoney(j.gasto_total)}</span>
                      )}
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'0.75rem', fontWeight:700, color: palette.textSec }}>Gasto total</span>
                    <span style={{ fontFamily:'DM Mono, monospace', fontSize:'0.88rem', fontWeight:700, color: palette.amber }}>{formatMoney(data.totalGastoJornadas)}</span>
                  </div>
                </>
              )}
            </AreaSection>
          </div>

          {/* ── Balance ejecutivo ── */}
          <div style={{
            background: `linear-gradient(135deg, ${palette.grayBlue2} 0%, ${palette.grayBlue3} 100%)`,
            border: `1px solid ${palette.borderBright}`,
            borderRadius: 14, padding: '20px 24px',
          }}>
            <div style={{ fontSize:'0.72rem', fontWeight:700, color: palette.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>
              📋 Balance del mes — {MONTHS_ES[month]} {year}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:12 }}>
              {[
                { label:'Ingresos', value: formatMoney(data.totalIngresos), color: palette.green },
                { label:'Gastos jornadas', value: formatMoney(data.totalGastoJornadas), color: palette.amber },
                { label:'Balance neto', value: formatMoney(data.totalIngresos - data.totalGastoJornadas), color: (data.totalIngresos - data.totalGastoJornadas) >= 0 ? palette.green : palette.rose },
                { label:'Presupuesto ads', value: formatMoney(data.totalPresupuesto), color: palette.rose },
              ].map((item, i) => (
                <div key={i} style={{ textAlign:'center', padding:'12px 8px', background: palette.grayBlue1, borderRadius:10, border:`1px solid ${palette.border}` }}>
                  <div style={{ fontFamily:'DM Mono, monospace', fontSize:'1.15rem', fontWeight:700, color: item.color, marginBottom:4 }}>{item.value}</div>
                  <div style={{ fontSize:'0.68rem', color: palette.textMuted, textTransform:'uppercase', letterSpacing:'0.06em' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
