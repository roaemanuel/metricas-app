import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

const color = '#9b59f7'

const AREA_COLORS = {
  social:   '#f0436a',
  diseno:   '#0eb8d4',
  sistemas: '#f5c518',
  gerencia: '#9b59f7',
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

function KpiCard({ label, value, sub, accent, icon, delay = 0 }) {
  return (
    <div className="animate-fadeUp" style={{
      animationDelay: `${delay}s`,
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '18px 20px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent, opacity: 0.8 }} />
      <div style={{ position: 'absolute', bottom: -20, right: -10, fontSize: 52, opacity: 0.05, userSelect: 'none', lineHeight: 1 }}>{icon}</div>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 600, color: accent, letterSpacing: '-1px', lineHeight: 1, marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

function AreaSection({ title, accent, icon, children, to, navigate }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, boxShadow: `0 0 8px ${accent}` }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{icon} {title}</span>
        </div>
        {to && (
          <button onClick={() => navigate(to)} style={{ background: 'none', border: 'none', color: accent, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
            Ver más →
          </button>
        )}
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  )
}

function MetricRow({ label, value, accent, bar, total }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 600, color: accent || 'var(--text-primary)' }}>{fmt(value)}</span>
      </div>
      {bar && (
        <div style={{ height: 3, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: accent, borderRadius: 99, transition: 'width 0.6s ease' }} />
        </div>
      )}
    </div>
  )
}

function EmptyState({ msg, cta, onClick }) {
  return (
    <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
      {msg}{' '}
      {cta && <button onClick={onClick} style={{ background: 'none', border: 'none', color, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>{cta}</button>}
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

    const totalGastoJornadas = (jornadas || []).reduce((s, j) => s + (j.gasto_total || 0), 0)
    const totalIngresos      = (ganancias || []).reduce((s, g) => s + (g.ingresos || 0), 0)
    const totalFlyers        = (diseno || []).reduce((s, d) => s + (d.total_flyers || 0), 0)
    const totalVideos        = (diseno || []).reduce((s, d) => s + (d.video || 0), 0)
    const totalFotos         = (diseno || []).reduce((s, d) => s + (d.fotos_producto || 0), 0)
    const totalStories       = (diseno || []).reduce((s, d) => s + (d.storie || 0), 0)
    const totalEfemerides    = (diseno || []).reduce((s, d) => s + (d.efemeride || 0), 0)
    const totalPromos        = (diseno || []).reduce((s, d) => s + (d.promo || 0), 0)
    const totalIncidencias   = (sistemas || []).reduce((s, s2) => s + (s2.incidencias_resueltas || 0), 0)
    const totalImagenes      = (sistemas || []).reduce((s, s2) => s + (s2.imagenes_codigos_actualizadas || 0), 0)
    const totalPresupuesto   = (campanas || []).reduce((s, c) => s + (c.presupuesto || 0), 0)
    const totalClics         = (campanas || []).reduce((s, c) => s + (c.clics || 0), 0)
    const totalConversiones  = (campanas || []).reduce((s, c) => s + (c.conversiones || 0), 0)

    setData({
      jornadas: jornadas || [], ganancias: ganancias || [],
      totalGastoJornadas, totalIngresos,
      totalFlyers, totalVideos, totalFotos, totalStories, totalEfemerides, totalPromos,
      totalIncidencias, totalImagenes,
      totalPresupuesto, totalClics, totalConversiones,
      ga4: ga4 || null, social: social || null, campanas: campanas || [],
    })
    setLastUpdate(new Date())
    setLoading(false)
  }

  return (
    <div className="animate-fadeIn">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 0 }}>Vista ejecutiva</h1>
            {isCurrentMonth && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: '#10b98118', border: '1px solid #10b98140',
                borderRadius: 20, padding: '2px 10px',
                fontSize: '0.68rem', fontWeight: 700, color: '#10b981', letterSpacing: '0.05em',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite', display: 'inline-block' }} />
                EN VIVO
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
            Gerencia · resumen consolidado del mes
            {lastUpdate && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 8, fontFamily: 'var(--font-mono)' }}>
              · {lastUpdate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => { if (month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }}
            style={{ width:34,height:34,borderRadius:8,background:'var(--bg-elevated)',border:'1px solid var(--border)',color:'var(--text-secondary)',fontSize:'1rem',cursor:'pointer' }}>‹</button>
          <span style={{ fontFamily:'var(--font-mono)',fontSize:'0.82rem',color:'var(--text-primary)',minWidth:130,textAlign:'center' }}>{MONTHS_ES[month]} {year}</span>
          <button onClick={() => { if(isCurrentMonth)return; if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }}
            disabled={isCurrentMonth} style={{ width:34,height:34,borderRadius:8,background:'var(--bg-elevated)',border:'1px solid var(--border)',color:isCurrentMonth?'var(--text-muted)':'var(--text-secondary)',fontSize:'1rem',cursor:isCurrentMonth?'not-allowed':'pointer' }}>›</button>
          <button onClick={loadAll} title="Actualizar"
            style={{ width:34,height:34,borderRadius:8,background:'var(--bg-elevated)',border:'1px solid var(--border)',color:color,fontSize:'0.9rem',cursor:'pointer' }}>↻</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--border-bright)', borderTopColor: color, animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* KPIs financieros */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 12, marginBottom: 14 }}>
            <KpiCard label="Ingresos del mes"      value={formatMoney(data.totalIngresos)}      icon="💵" accent="#10b981" delay={0}    />
            <KpiCard label="Gasto en jornadas"     value={formatMoney(data.totalGastoJornadas)} icon="💰" accent="#f59e0b" delay={0.05} />
            <KpiCard label="Jornadas médicas"      value={data.jornadas.length}                 icon="🏥" accent={color}   delay={0.1}  />
            <KpiCard label="Estrategias activas"   value={data.ganancias.length}                icon="📊" accent={color}   delay={0.15} />
          </div>

          {/* KPIs cross-área */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 12, marginBottom: 20 }}>
            <KpiCard label="Seguidores totales"    value={fmt(data.social?.seguidores_total)}   icon="👥" accent={AREA_COLORS.social}   delay={0.2}  sub="Social Media" />
            <KpiCard label="Nuevos seguidores"     value={fmt(data.social?.nuevos_seguidores)}  icon="📈" accent={AREA_COLORS.social}   delay={0.22} sub="Social Media" />
            <KpiCard label="Flyers creados"        value={fmt(data.totalFlyers)}                icon="🎨" accent={AREA_COLORS.diseno}   delay={0.24} sub="Diseño Gráfico" />
            <KpiCard label="Sesiones web"          value={fmt(data.ga4?.sesiones)}              icon="🌐" accent={AREA_COLORS.sistemas} delay={0.26} sub="Sistemas / GA4" />
            <KpiCard label="Usuarios activos"      value={fmt(data.ga4?.usuarios_activos)}      icon="👤" accent="#8b5cf6"              delay={0.28} sub="Sistemas / GA4" />
            <KpiCard label="Incidencias resueltas" value={fmt(data.totalIncidencias)}           icon="🔧" accent={AREA_COLORS.sistemas} delay={0.3}  sub="Sistemas" />
          </div>

          {/* Grid de áreas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

            {/* Social Media */}
            <AreaSection title="Social Media" accent={AREA_COLORS.social} icon="📱" to="/dashboard/social" navigate={navigate}>
              {!data.social ? (
                <EmptyState msg="Sin datos este mes —" cta="ingresar" onClick={() => navigate('/dashboard/social/ingresar')} />
              ) : (
                <>
                  <MetricRow label="Seguidores totales" value={data.social.seguidores_total}  accent={AREA_COLORS.social} />
                  <MetricRow label="Nuevos seguidores"  value={data.social.nuevos_seguidores} accent={AREA_COLORS.social} />
                  <MetricRow label="Alcance"            value={data.social.alcance}            accent="var(--text-secondary)" />
                  <MetricRow label="Interacciones"      value={data.social.interacciones}      accent="var(--text-secondary)" />
                  {data.social.seguidores_total > 0 && data.social.interacciones > 0 && (
                    <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Engagement Rate</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 700, color: AREA_COLORS.social }}>
                        {((data.social.interacciones / data.social.seguidores_total) * 100).toFixed(2)}%
                      </span>
                    </div>
                  )}
                </>
              )}
            </AreaSection>

            {/* Campañas */}
            <AreaSection title="Campañas Publicitarias" accent="#f0436a" icon="📣" to="/dashboard/social/campanas" navigate={navigate}>
              {data.campanas.length === 0 ? (
                <EmptyState msg="Sin campañas este mes —" cta="registrar" onClick={() => navigate('/dashboard/social/campanas')} />
              ) : (
                <>
                  <MetricRow label="Campañas activas"  value={data.campanas.length}            accent="#f0436a" />
                  <MetricRow label="Presupuesto total" value={formatMoney(data.totalPresupuesto)} accent="#f59e0b" />
                  <MetricRow label="Clics totales"     value={fmt(data.totalClics)}             accent="var(--text-secondary)" />
                  <MetricRow label="Conversiones"      value={fmt(data.totalConversiones)}      accent="#10b981" />
                  {data.totalClics > 0 && data.totalPresupuesto > 0 && (
                    <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 3 }}>CPC</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b' }}>{formatMoney(data.totalPresupuesto / data.totalClics)}</div>
                      </div>
                      <div style={{ padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 3 }}>CTR</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: '#f0436a' }}>
                          {data.totalClics > 0 && data.social?.alcance > 0 ? ((data.totalClics / data.social.alcance) * 100).toFixed(2) + '%' : '—'}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </AreaSection>

            {/* Diseño Gráfico */}
            <AreaSection title="Diseño Gráfico" accent={AREA_COLORS.diseno} icon="🎨" to="/dashboard/diseno" navigate={navigate}>
              {data.totalFlyers === 0 && data.totalVideos === 0 ? (
                <EmptyState msg="Sin registros este mes —" cta="ingresar" onClick={() => navigate('/dashboard/diseno/ingresar')} />
              ) : (
                <>
                  <MetricRow label="Total flyers"   value={data.totalFlyers}     accent={AREA_COLORS.diseno} bar total={data.totalFlyers} />
                  <MetricRow label="Stories"        value={data.totalStories}    accent="var(--text-secondary)" bar total={data.totalFlyers} />
                  <MetricRow label="Efemérides"     value={data.totalEfemerides} accent="var(--text-secondary)" bar total={data.totalFlyers} />
                  <MetricRow label="Promocionales"  value={data.totalPromos}     accent="var(--text-secondary)" bar total={data.totalFlyers} />
                  <MetricRow label="Videos"         value={data.totalVideos}     accent={AREA_COLORS.diseno} />
                  <MetricRow label="Fotos producto" value={data.totalFotos}      accent="var(--text-secondary)" />
                </>
              )}
            </AreaSection>

            {/* Sistemas / GA4 */}
            <AreaSection title="Sistemas / Web" accent={AREA_COLORS.sistemas} icon="⚙️" to="/dashboard/sistemas" navigate={navigate}>
              {!data.ga4 && data.totalIncidencias === 0 ? (
                <EmptyState msg="Sin datos este mes —" cta="ingresar" onClick={() => navigate('/dashboard/sistemas/ingresar')} />
              ) : (
                <>
                  {data.ga4 && (
                    <>
                      <MetricRow label="Sesiones"         value={data.ga4.sesiones}         accent={AREA_COLORS.sistemas} />
                      <MetricRow label="Usuarios activos" value={data.ga4.usuarios_activos} accent="var(--text-secondary)" />
                      <MetricRow label="Pageviews"        value={data.ga4.pageviews}        accent="var(--text-secondary)" />
                      <MetricRow label="Tráfico orgánico" value={data.ga4.trafico_organico} accent="#10b981" />
                      <div style={{ margin: '10px 0', height: 1, background: 'var(--border)' }} />
                    </>
                  )}
                  <MetricRow label="Incidencias resueltas"  value={data.totalIncidencias} accent={AREA_COLORS.sistemas} />
                  <MetricRow label="Imágenes actualizadas"  value={data.totalImagenes}    accent="var(--text-secondary)" />
                </>
              )}
            </AreaSection>
          </div>

          {/* Top estrategias + Jornadas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

            <AreaSection title="Top Estrategias" accent="#10b981" icon="💵" to="/dashboard/gerencia/ganancias" navigate={navigate}>
              {data.ganancias.length === 0 ? (
                <EmptyState msg="Sin datos —" cta="importar Excel" onClick={() => navigate('/dashboard/gerencia/ganancias')} />
              ) : (
                <>
                  {data.ganancias.slice(0, 5).map((g, i) => {
                    const pct = data.totalIngresos > 0 ? (g.ingresos / data.totalIngresos * 100) : 0
                    return (
                      <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', minWidth: 16, textAlign: 'right' }}>{i+1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{g.nombre_estrategia}</div>
                          <div style={{ height: 3, background: 'var(--bg-elevated)', borderRadius: 99 }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#10b981', borderRadius: 99, transition: 'width 0.6s ease' }} />
                          </div>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: '#10b981', flexShrink: 0 }}>{formatMoney(g.ingresos)}</span>
                      </div>
                    )
                  })}
                  <div style={{ paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Total ingresos</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 700, color: '#10b981' }}>{formatMoney(data.totalIngresos)}</span>
                  </div>
                </>
              )}
            </AreaSection>

            <AreaSection title="Jornadas Médicas" accent="#f59e0b" icon="🏥" to="/dashboard/gerencia/jornadas" navigate={navigate}>
              {data.jornadas.length === 0 ? (
                <EmptyState msg="Sin jornadas este mes —" cta="registrar" onClick={() => navigate('/dashboard/gerencia/jornadas')} />
              ) : (
                <>
                  {data.jornadas.slice(0, 4).map((j) => (
                    <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{j.nombre}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{j.fecha?.slice(8)}/{j.fecha?.slice(5,7)}</div>
                      </div>
                      {j.gasto_total > 0 && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b' }}>{formatMoney(j.gasto_total)}</span>
                      )}
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Gasto total</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 700, color: '#f59e0b' }}>{formatMoney(data.totalGastoJornadas)}</span>
                  </div>
                </>
              )}
            </AreaSection>
          </div>

          {/* Balance ejecutivo */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
              📋 Balance del mes — {MONTHS_ES[month]} {year}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              {[
                { label: 'Ingresos',       value: formatMoney(data.totalIngresos),                                        c: '#10b981' },
                { label: 'Gastos jornadas',value: formatMoney(data.totalGastoJornadas),                                   c: '#f59e0b' },
                { label: 'Balance neto',   value: formatMoney(data.totalIngresos - data.totalGastoJornadas),              c: (data.totalIngresos - data.totalGastoJornadas) >= 0 ? '#10b981' : '#f0436a' },
                { label: 'Presupuesto ads',value: formatMoney(data.totalPresupuesto),                                     c: '#f0436a' },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '12px 8px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: item.c, marginBottom: 4 }}>{item.value}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
