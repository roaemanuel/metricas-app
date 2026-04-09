import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts'

// Design Module Color Theme
const accentColor = '#93C5FD' // Blue 300
const trafficColors = ['#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A']

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const FLYER_TYPES = [
  { key: 'flyers_storie',      label: 'Stories',                  emoji: '📱', color: '#93C5FD' },
  { key: 'flyers_efemeride',   label: 'Efemérides',               emoji: '📅', color: '#60A5FA' },
  { key: 'flyers_reposicion',  label: 'Reposición',               emoji: '📦', color: '#3B82F6' },
  { key: 'flyers_descuento',   label: 'Descuentos',               emoji: '🏷️', color: '#2563EB' },
  { key: 'flyers_promocion',   label: 'Promociones',              emoji: '📣', color: '#1D4ED8' },
  { key: 'flyers_cumple',      label: 'Cumpleaños',               emoji: '🎂', color: '#1E40AF' },
  { key: 'flyers_otros',       label: 'Otros',                    emoji: '📄', color: '#1E3A8A' },
]

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
function StatCard({ label, value, unit = '', icon, color, sub, delay = 0 }) {
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
        boxShadow: hovered ? `0 12px 40px ${color}22` : '0 8px 32px rgba(0, 0, 0, 0.15)',
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
        background: 'rgba(8, 12, 28, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)',
        padding: '12px 16px', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' 
      }}>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, marginBottom: 6 }}>Día {label}</p>
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

export default function DisenoDashboardPage() {
  const navigate = useNavigate()
  const now = new Date()

  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLogsModal, setShowLogsModal] = useState(false)

  const periodo = `${year}-${String(month + 1).padStart(2, '0')}-01`

  useEffect(() => { loadMonth() }, [year, month])

  async function loadMonth() {
    setLoading(true)
    const { data } = await supabase
      .from('diseno_grafico_diario')
      .select('*')
      .eq('periodo', periodo)
      .order('fecha', { ascending: true })

    setRecords(data || [])
    setLoading(false)
  }

  const recordsByDay = useMemo(() => {
    const map = new Map()
    records.forEach(r => {
      const dateKey = r.fecha
      if (!dateKey) return
      if (!map.has(dateKey)) {
        map.set(dateKey, {
          fecha: dateKey, notas: [], tags: [], video: false, fotos: 0, count: 0,
          ...Object.fromEntries(FLYER_TYPES.map(t => [t.key, 0])),
        })
      }
      const entry = map.get(dateKey)
      FLYER_TYPES.forEach(t => { entry[t.key] += r[t.key] || 0 })
      entry.fotos += r.fotos_producto_subidas || 0
      entry.video = entry.video || !!r.colaboracion_video
      entry.count += 1
      if (Array.isArray(r.etiquetas_custom)) entry.tags.push(...r.etiquetas_custom)
      if (r.notas?.trim()) entry.notas.push(r.notas.trim())
    })
    return Array.from(map.values()).map(item => ({
      ...item, tags: [...new Set(item.tags)], notas: item.notas.join(' | ')
    })).sort((a,b) => a.fecha.localeCompare(b.fecha))
  }, [records])

  const totals = useMemo(() => {
    return records.reduce((acc, r) => {
      FLYER_TYPES.forEach(t => { acc[t.key] = (acc[t.key] || 0) + (r[t.key] || 0) })
      acc.fotos += r.fotos_producto_subidas || 0
      return acc
    }, { fotos: 0, ...Object.fromEntries(FLYER_TYPES.map(t => [t.key, 0])) })
  }, [records])

  const totalFlyers = FLYER_TYPES.reduce((s, t) => s + totals[t.key], 0)
  const diasConVideo = recordsByDay.filter(r => r.video).length
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
    const rec = recordsByDay.find(r => r.fecha === dayStr)
    const flyers = rec ? FLYER_TYPES.reduce((s, t) => s + (rec[t.key] || 0), 0) : 0
    return { dia: String(i + 1), Flyers: flyers, Fotos: rec ? rec.fotos : 0 }
  })

  const pieData = FLYER_TYPES.map(t => ({ name: t.label, value: totals[t.key] })).filter(d => d.value > 0)
  const allTags = [...new Set(records.flatMap(r => r.etiquetas_custom || []))].slice(0, 10)

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 32 }}>
        <div>
          <h1 style={{ 
            fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-2px', marginBottom: 4,
            background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.55))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Diseño Gráfico
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', fontWeight: 500 }}>
            Producción creativa · Estándares visuales de marca
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
            onClick={() => navigate('/dashboard/diseno/ingresar')}
            style={{
              padding: '12px 28px', background: accentColor, border: 'none', borderRadius: 16,
              color: '#080C1C', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer',
              boxShadow: `0 8px 24px ${accentColor}44`, transition: 'all 0.3s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >✚ Registrar Producción</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}>
          <div className="animate-spin" style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: accentColor }} />
        </div>
      ) : records.length === 0 ? (
        <div className="animate-fadeUp" style={{
          textAlign: 'center', padding: '100px 40px',
          border: `1px dashed ${accentColor}66`, borderRadius: 32, background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)'
        }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🎨</div>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, marginBottom: 12 }}>Sin producción registrada</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 32, fontSize: '1.1rem' }}>No hay registros de diseño para el periodo de {MONTHS_ES[month]} {year}</p>
          <button onClick={() => navigate('/dashboard/diseno/ingresar')}
            style={{ padding: '16px 48px', background: accentColor, border: 'none', borderRadius: 16, color: '#080C1C', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: `0 8px 24px ${accentColor}33` }}
          >Empezar registro ahora →</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 24 }}>
            <StatCard label="Flyers totales" value={totalFlyers} icon="🎨" color={accentColor} delay={0} sub={`${recordsByDay.length} jornadas activas`} />
            <StatCard label="Fotos producto" value={totals.fotos} icon="📸" color="#60A5FA" delay={0.1} sub="Capturas editadas" />
            <StatCard label="Colab. Videos" value={diasConVideo} icon="🎬" color="#3B82F6" delay={0.2} sub="Días con apoyo diseño" />
            <StatCard label="Días Restantes" value={daysInMonth - recordsByDay.length} icon="🗓️" color={daysInMonth - recordsByDay.length > 10 ? '#F0436A' : 'rgba(255,255,255,0.5)'} delay={0.3} sub="Para cerrar ciclo" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: pieData.length > 0 ? '2fr 1fr' : '1fr', gap: 24, marginBottom: 24 }}>
            {/* Main Area Chart */}
            <div className="animate-fadeUp" style={{ 
              background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', 
              padding: '32px', borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>FLUJO DE PRODUCCIÓN DIARIA</div>
                <button onClick={() => setShowLogsModal(true)} style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                  padding: '8px 20px', borderRadius: 12, fontSize: '0.8rem', cursor: 'pointer', fontWeight: 700
                }}>Ver bitácora mensual</button>
              </div>
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFlyers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={accentColor} stopOpacity={0.6} />
                        <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="dia" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Flyers" stroke={accentColor} strokeWidth={4} fillOpacity={1} fill="url(#colorFlyers)" animationDuration={1500} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Side Donut Chart */}
            {pieData.length > 0 && (
              <div className="animate-fadeUp" style={{ 
                background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', 
                padding: '32px', borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                animationDelay: '0.1s'
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>MIX DE TRABAJO</div>
                <div style={{ flex: 1, position: 'relative', minHeight: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={trafficColors[index % trafficColors.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', pointerEvents: 'none' }}>
                    <span style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{totalFlyers}</span>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>Formatos</span>
                  </div>
                </div>
                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pieData.map((f, i) => (
                    <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: trafficColors[i % trafficColors.length], boxShadow: `0 0 10px ${trafficColors[i % trafficColors.length]}88` }} />
                        <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{f.name}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>
                        {f.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tags Cloud */}
          {allTags.length > 0 && (
            <div className="animate-fadeUp" style={{
              background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(20px)',
              padding: '24px 32px', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)',
              animationDelay: '0.2s'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginBottom: 20, letterSpacing: '0.1em', textTransform: 'uppercase' }}>TENDENCIAS Y CONCEPTOS DEL MES</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {allTags.map(tag => (
                  <span key={tag} style={{
                    background: 'rgba(255, 255, 255, 0.05)', color: accentColor, border: `1px solid ${accentColor}33`,
                    borderRadius: 14, padding: '8px 20px', fontSize: '0.85rem', fontWeight: 700, boxShadow: `0 4px 12px ${accentColor}11`
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Records Detail Modal */}
          <GlassModal isOpen={showLogsModal} onClose={() => setShowLogsModal(false)} title={`Bitácora de Diseño - ${MONTHS_ES[month]} ${year}`}>
            <div style={{ overflowX: 'auto', margin: '0 -32px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {['Fecha', 'Story', 'Efem', 'Repo', 'Desc', 'Prom', 'Cumple', 'Fotos', 'Video', 'Notas'].map(h => (
                      <th key={h} style={{ padding: '16px 20px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recordsByDay.map((r, i) => (
                    <tr key={r.fecha} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '16px 20px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>{r.fecha?.split('-').reverse().join('/')}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', color: r.flyers_storie ? accentColor : 'rgba(255,255,255,0.1)', fontWeight: 800 }}>{r.flyers_storie || '—'}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', color: r.flyers_efemeride ? '#60A5FA' : 'rgba(255,255,255,0.1)', fontWeight: 800 }}>{r.flyers_efemeride || '—'}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', color: r.flyers_reposicion ? '#3B82F6' : 'rgba(255,255,255,0.1)', fontWeight: 800 }}>{r.flyers_reposicion || '—'}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', color: r.flyers_descuento ? '#2563EB' : 'rgba(255,255,255,0.1)' }}>{r.flyers_descuento || '—'}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', color: r.flyers_promocion ? '#1D4ED8' : 'rgba(255,255,255,0.1)' }}>{r.flyers_promocion || '—'}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', color: r.flyers_cumple ? '#1E40AF' : 'rgba(255,255,255,0.1)' }}>{r.flyers_cumple || '—'}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', color: r.fotos ? '#60A5FA' : 'rgba(255,255,255,0.1)', fontWeight: 800 }}>{r.fotos || '—'}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>{r.video ? '🎬' : '—'}</td>
                      <td style={{ padding: '16px 20px', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notas || '—'}</td>
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
