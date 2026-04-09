import { useState, useEffect, useMemo } from 'react'
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
const trafficColors = ['#60A5FA', '#38BDF8', '#818CF8', '#A78BFA', '#34D399', '#6366F1', '#4F46E5', '#94A3B8']

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const FLYER_TYPES = [
  { key: 'flyers_storie',      label: 'Stories',                  emoji: '📱', color: '#60A5FA' },
  { key: 'flyers_efemeride',   label: 'Efemérides',               emoji: '📅', color: '#38BDF8' },
  { key: 'flyers_reposicion',  label: 'Reposición',               emoji: '📦', color: '#818CF8' },
  { key: 'flyers_descuento',   label: 'Descuentos',               emoji: '🏷️', color: '#34D399' },
  { key: 'flyers_promocion',   label: 'Promociones',              emoji: '📣', color: '#6366F1' },
  { key: 'flyers_cumple',      label: 'Cumpleaños',               emoji: '🎂', color: '#4F46E5' },
  { key: 'flyers_otros',       label: 'Otros',                    emoji: '📄', color: '#94A3B8' },
]

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
        position: 'relative', width: '100%', maxWidth: 1000,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        borderRadius: 'var(--radius-xl)', overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
        background: 'var(--bg-surface)',
      }}>
        <div style={{
          padding: '24px 32px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>{title}</h2>
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
function StatCard({ label, value, unit = '', icon, color, sub, delay = 0 }) {
  return (
    <div className="glass-panel animate-fadeUp" style={{
      animationDelay: `${delay}s`,
      borderRadius: 'var(--radius-lg)', padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: color, opacity: 0.9, boxShadow: `0 0 12px ${color}` }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: 22, opacity: 0.8 }}>{icon}</div>
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '3rem', fontWeight: 600,
        color: 'var(--text-primary)', letterSpacing: '-1.5px', lineHeight: 1,
        marginBottom: 8,
      }}>
        {value}<span style={{ fontSize: '1.2rem', fontWeight: 500, marginLeft: 4, color: 'var(--text-muted)' }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{sub}</div>}
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
          <p key={`item-${index}`} style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function aggregateRecordsByDate(records) {
  const map = new Map()

  records.forEach(r => {
    const dateKey = r.fecha
    if (!dateKey) return

    if (!map.has(dateKey)) {
      map.set(dateKey, {
        fecha: dateKey,
        notas: [],
        etiquetas_custom: [],
        colaboracion_video: false,
        fotos_producto_subidas: 0,
        registros_count: 0,
        ...Object.fromEntries(FLYER_TYPES.map(t => [t.key, 0])),
      })
    }

    const entry = map.get(dateKey)

    FLYER_TYPES.forEach(t => {
      entry[t.key] += r[t.key] || 0
    })

    entry.fotos_producto_subidas += r.fotos_producto_subidas || 0
    entry.colaboracion_video = entry.colaboracion_video || !!r.colaboracion_video
    entry.registros_count += 1

    if (Array.isArray(r.etiquetas_custom)) {
      entry.etiquetas_custom.push(...r.etiquetas_custom)
    }

    if (r.notas?.trim()) {
      entry.notas.push(r.notas.trim())
    }
  })

  return Array.from(map.values())
    .map(item => ({
      ...item,
      etiquetas_custom: [...new Set(item.etiquetas_custom)],
      notas: item.notas.join(' | '),
    }))
    .sort((a, b) => (a.fecha > b.fecha ? 1 : -1))
}

export default function DisenoDashboardPage() {
  const color = 'var(--accent)'
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
      .order('updated_at', { ascending: true })

    setRecords(data || [])
    setLoading(false)
  }

  const recordsByDay = useMemo(() => aggregateRecordsByDate(records), [records])

  const totals = records.reduce((acc, r) => {
    FLYER_TYPES.forEach(t => { acc[t.key] = (acc[t.key] || 0) + (r[t.key] || 0) })
    acc.fotos += r.fotos_producto_subidas || 0
    return acc
  }, {
    fotos: 0,
    ...Object.fromEntries(FLYER_TYPES.map(t => [t.key, 0])),
  })

  const diasRegistrados = recordsByDay.length
  const diasConVideo = recordsByDay.filter(r => r.colaboracion_video).length
  const totalFlyers = FLYER_TYPES.reduce((s, t) => s + totals[t.key], 0)

  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
    const rec = recordsByDay.find(r => r.fecha === dayStr)
    const flyers = rec ? FLYER_TYPES.reduce((s, t) => s + (rec[t.key] || 0), 0) : 0
    return {
      dia: String(i + 1),
      'Flyers': flyers,
      'Fotos': rec ? (rec.fotos_producto_subidas || 0) : 0
    }
  })

  const pieData = FLYER_TYPES.map(t => ({
    name: t.label,
    value: totals[t.key]
  })).filter(d => d.value > 0)

  const allTags = [...new Set(records.flatMap(r => r.etiquetas_custom || []))]

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    const today = new Date()
    if (year === today.getFullYear() && month === today.getMonth()) return
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  return (
    <div className="animate-fadeIn">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-1px', marginBottom: 6 }}>
            Diseño Gráfico
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Producción mensual de contenido visual
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={prevMonth} style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer',
          }}>‹</button>

          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.9rem',
            color: 'var(--text-primary)', minWidth: 140, textAlign: 'center', fontWeight: 600
          }}>{MONTHS_ES[month]} {year}</span>

          <button onClick={nextMonth} disabled={isCurrentMonth} style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            color: isCurrentMonth ? 'var(--text-muted)' : 'var(--text-secondary)',
            fontSize: '1.2rem', cursor: isCurrentMonth ? 'not-allowed' : 'pointer',
          }}>›</button>

          <button
            onClick={() => navigate('/dashboard/diseno/ingresar')}
            style={{
              padding: '10px 24px', marginLeft: 12,
              background: 'var(--accent)', border: 'none', borderRadius: 12,
              color: '#fff', fontSize: '0.9rem', fontWeight: 600,
              boxShadow: '0 4px 20px var(--accent-glow)', cursor: 'pointer',
            }}
          >✚ Registrar hoy</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid var(--border-bright)',
            borderTopColor: colorPrimary,
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      ) : records.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 24px',
          border: `2px dashed var(--border-bright)`,
          borderRadius: 24, background: 'var(--glass-bg)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '1.1rem' }}>
            No hay registros para {MONTHS_ES[month]} {year}
          </p>
          <button
            onClick={() => navigate('/dashboard/diseno/ingresar')}
            style={{
              padding: '14px 32px', background: colorPrimary,
              border: 'none', borderRadius: 14,
              color: '#fff', fontWeight: 600, fontSize: '1rem',
              boxShadow: '0 4px 20px var(--accent-glow)',
            }}
          >Ingresar primer registro →</button>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16, marginBottom: 24,
          }}>
            <StatCard
              label="Flyers totales"
              value={totalFlyers}
              icon="🎨"
              color={colorPrimary}
              delay={0}
              sub={`${diasRegistrados} días con producción`}
            />
            <StatCard label="Fotos producto" value={totals.fotos} icon="📸" color={colorSecondary} delay={0.05} />
            <StatCard
              label="Videos"
              value={diasConVideo}
              icon="🎬"
              color={colorTertiary}
              delay={0.1}
              sub="Días con colaboración"
            />
            <StatCard
              label="Días pendientes"
              value={daysInMonth - diasRegistrados}
              icon="🗓️"
              color={daysInMonth - diasRegistrados > 5 ? '#F0436A' : '#94A3B8'}
              delay={0.15}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: pieData.length > 0 ? '2fr 1fr' : '1fr', gap: 16, marginBottom: 24 }}>
            {/* Area Chart */}
            <div className="glass-panel" style={{ padding: '24px 32px', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>PRODUCCIÓN DIARIA</div>
                <button onClick={() => setShowLogsModal(true)} style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)',
                  padding: '6px 14px', borderRadius: 8, fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600
                }}>Ver detalles</button>
              </div>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFlyers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colorPrimary} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={colorPrimary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="dia" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Flyers" stroke={colorPrimary} strokeWidth={3} fillOpacity={1} fill="url(#colorFlyers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut Chart */}
            {pieData.length > 0 && (
              <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: 16 }}>DISTRIBUCIÓN</div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={trafficColors[index % trafficColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} itemStyle={{ color: 'var(--text-primary)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', pointerEvents: 'none' }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{totalFlyers}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Flyers</span>
                  </div>
                </div>
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pieData.map((f, i) => (
                    <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: trafficColors[i % trafficColors.length] }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{f.name}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {f.value} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 400 }}>({((f.value / totalFlyers) * 100).toFixed(0)}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {allTags.length > 0 && (
            <div className="glass-panel" style={{
              padding: '20px 24px',
              marginBottom: 24, borderRadius: 'var(--radius-lg)'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16, letterSpacing: '0.05em' }}>
                ETIQUETAS RELEVANTES
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {allTags.map(tag => (
                  <span key={tag} style={{
                    background: 'var(--accent-glow)',
                    color: colorPrimary,
                    border: `1px solid var(--border-bright)`,
                    borderRadius: 12,
                    padding: '6px 16px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Records Detail Modal */}
          <GlassModal isOpen={showLogsModal} onClose={() => setShowLogsModal(false)} title={`Registros de Producción - ${MONTHS_ES[month]} ${year}`}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-hover)' }}>
                    {['Fecha', 'Stories', 'Efem.', 'Repo', 'Desc', 'Promo', 'Cumple', 'Fotos', 'Video', 'Notas'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.05em', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border-bright)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recordsByDay.map((r, i) => (
                    <tr key={r.fecha} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{r.fecha?.slice(8, 10)}/{r.fecha?.slice(5, 7)}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: r.flyers_storie > 0 ? 800 : 400, color: r.flyers_storie > 0 ? colorPrimary : 'var(--text-muted)' }}>{r.flyers_storie || 0}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: r.flyers_efemeride > 0 ? 800 : 400, color: r.flyers_efemeride > 0 ? colorSecondary : 'var(--text-muted)' }}>{r.flyers_efemeride || 0}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', color: r.flyers_reposicion > 0 ? colorTertiary : 'var(--text-muted)' }}>{r.flyers_reposicion || 0}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', color: r.flyers_descuento > 0 ? trafficColors[3] : 'var(--text-muted)' }}>{r.flyers_descuento || 0}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', color: r.flyers_promocion > 0 ? trafficColors[4] : 'var(--text-muted)' }}>{r.flyers_promocion || 0}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', color: r.flyers_cumple > 0 ? trafficColors[5] : 'var(--text-muted)' }}>{r.flyers_cumple || 0}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', color: r.fotos_producto_subidas > 0 ? colorSecondary : 'var(--text-muted)' }}>{r.fotos_producto_subidas || 0}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>{r.colaboracion_video ? '🎬' : '—'}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notas || '—'}</td>
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
