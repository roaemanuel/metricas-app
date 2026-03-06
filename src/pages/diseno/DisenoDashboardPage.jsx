import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const FLYER_TYPES = [
  { key: 'flyers_storie',   label: 'Stories',            emoji: '📱', color: '#f0436a' },
  { key: 'flyers_efemeride',label: 'Efemérides',         emoji: '📅', color: '#f59e0b' },
  { key: 'flyers_promo',    label: 'Promos / Ofertas',   emoji: '🏷️', color: '#10b981' },
  { key: 'flyers_cumple',   label: 'Cumpleaños',          emoji: '🎂', color: '#f59e0b' },
  { key: 'flyers_otros',    label: 'Otros',              emoji: '📄', color: '#6b7280' },
]

function StatCard({ label, value, unit = '', icon, color, sub, delay = 0 }) {
  return (
    <div className="animate-fadeUp" style={{
      animationDelay: `${delay}s`,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 14, padding: '20px 22px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: color, opacity: 0.7,
      }} />
      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '2rem', fontWeight: 600,
        color, letterSpacing: '-1px', lineHeight: 1,
        marginBottom: 6,
      }}>
        {value}<span style={{ fontSize: '1rem', marginLeft: 3 }}>{unit}</span>
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function BarChart({ data, color }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: '100%', borderRadius: '4px 4px 0 0',
            background: d.value > 0 ? color : 'var(--border)',
            height: `${Math.max((d.value / max) * 60, d.value > 0 ? 4 : 2)}px`,
            transition: 'height 0.4s ease',
            opacity: d.value > 0 ? 1 : 0.3,
          }} />
          <span style={{
            fontSize: '0.6rem', color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function DisenoDashboardPage() {
  const color = '#0eb8d4'
  const navigate = useNavigate()
  const now = new Date()

  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

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

  // Aggregate totals
  const totals = records.reduce((acc, r) => {
    FLYER_TYPES.forEach(t => { acc[t.key] = (acc[t.key] || 0) + (r[t.key] || 0) })
    acc.fotos += r.fotos_producto_subidas || 0
    acc.videos += r.colaboracion_video ? 1 : 0
    acc.dias_registrados += 1
    return acc
  }, { fotos: 0, videos: 0, dias_registrados: 0, ...Object.fromEntries(FLYER_TYPES.map(t => [t.key, 0])) })

  const totalFlyers = FLYER_TYPES.reduce((s, t) => s + totals[t.key], 0)

  // Build daily chart data for the month
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
    const rec = records.find(r => r.fecha === dayStr)
    const val = rec ? FLYER_TYPES.reduce((s, t) => s + (rec[t.key] || 0), 0) : 0
    return { label: String(i + 1), value: val }
  })

  // All custom tags used this month
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 4 }}>
            Diseño Gráfico
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Resumen mensual de producción
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Month navigator */}
          <button onClick={prevMonth} style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', fontSize: '1rem', cursor: 'pointer',
          }}>‹</button>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
            color: 'var(--text-primary)', minWidth: 130, textAlign: 'center',
          }}>{MONTHS_ES[month]} {year}</span>
          <button onClick={nextMonth} disabled={isCurrentMonth} style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            color: isCurrentMonth ? 'var(--text-muted)' : 'var(--text-secondary)',
            fontSize: '1rem', cursor: isCurrentMonth ? 'not-allowed' : 'pointer',
          }}>›</button>
          <button
            onClick={() => navigate('/dashboard/diseno/ingresar')}
            style={{
              padding: '8px 18px', marginLeft: 8,
              background: color, border: 'none', borderRadius: 8,
              color: '#fff', fontSize: '0.82rem', fontWeight: 700,
              boxShadow: `0 2px 12px ${color}44`,
            }}
          >✚ Registrar hoy</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            border: '2px solid var(--border-bright)',
            borderTopColor: color,
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      ) : records.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          border: `1px dashed ${color}44`,
          borderRadius: 16, background: 'var(--bg-surface)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>🎨</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            No hay registros para {MONTHS_ES[month]} {year}
          </p>
          <button
            onClick={() => navigate('/dashboard/diseno/ingresar')}
            style={{
              padding: '12px 28px', background: color,
              border: 'none', borderRadius: 10,
              color: '#fff', fontWeight: 700, fontSize: '0.88rem',
            }}
          >Ingresar primer registro →</button>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12, marginBottom: 20,
          }}>
            <StatCard label="Flyers totales" value={totalFlyers} icon="🎨" color={color} delay={0}
              sub={`${totals.dias_registrados} día${totals.dias_registrados !== 1 ? 's' : ''} registrado${totals.dias_registrados !== 1 ? 's' : ''}`} />
            <StatCard label="Fotos de producto" value={totals.fotos} icon="📸" color="#a78bfa" delay={0.05} />
            <StatCard label="Colabs. en video" value={totals.videos} icon="🎬" color="#f59e0b" delay={0.1}
              sub="días con colaboración" />
            <StatCard label="Días sin registro" value={daysInMonth - totals.dias_registrados} icon="📋"
              color={daysInMonth - totals.dias_registrados > 5 ? '#f0436a' : '#64748b'} delay={0.15} />
          </div>

          {/* Daily production chart */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 14, padding: '20px 24px',
            marginBottom: 20,
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 16, letterSpacing: '0.05em' }}>
              PRODUCCIÓN DIARIA — FLYERS
            </div>
            <BarChart data={chartData} color={color} />
          </div>

          {/* Breakdown by type */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 14, padding: '20px 24px',
            marginBottom: 20,
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 16, letterSpacing: '0.05em' }}>
              DESGLOSE POR TIPO
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FLYER_TYPES.map(type => {
                const val = totals[type.key]
                const pct = totalFlyers > 0 ? (val / totalFlyers) * 100 : 0
                return (
                  <div key={type.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: '0.82rem', color: val > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {type.emoji} {type.label}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
                        color: val > 0 ? type.color : 'var(--text-muted)',
                        fontWeight: 600,
                      }}>{val}</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: type.color,
                        borderRadius: 99,
                        transition: 'width 0.6s ease',
                        opacity: val > 0 ? 1 : 0,
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Custom tags */}
          {allTags.length > 0 && (
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 14, padding: '16px 24px',
              marginBottom: 20,
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, letterSpacing: '0.05em' }}>
                ETIQUETAS USADAS ESTE MES
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {allTags.map(tag => (
                  <span key={tag} style={{
                    background: color + '18', color,
                    border: `1px solid ${color}33`,
                    borderRadius: 99, padding: '4px 14px',
                    fontSize: '0.78rem', fontWeight: 600,
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Day-by-day log */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 24px',
              borderBottom: '1px solid var(--border)',
              fontSize: '0.8rem', fontWeight: 700,
              color: 'var(--text-secondary)', letterSpacing: '0.05em',
            }}>REGISTROS DEL MES ({records.length})</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)' }}>
                    {['Fecha','Stories','Efem.','Promo','Feed','Banner','Otros','Fotos','Video','Notas'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: 'left',
                        color: 'var(--text-muted)', fontWeight: 600,
                        fontSize: '0.72rem', letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={r.id} style={{
                      borderTop: '1px solid var(--border)',
                      background: i % 2 === 0 ? 'transparent' : 'var(--bg-elevated)',
                    }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {r.fecha?.slice(5)}
                      </td>
                      {FLYER_TYPES.map(t => (
                        <td key={t.key} style={{
                          padding: '10px 14px', textAlign: 'center',
                          fontFamily: 'var(--font-mono)',
                          color: r[t.key] > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontWeight: r[t.key] > 0 ? 600 : 400,
                        }}>{r[t.key] || 0}</td>
                      ))}
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: r.fotos_producto_subidas > 0 ? '#a78bfa' : 'var(--text-muted)' }}>
                        {r.fotos_producto_subidas || 0}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        {r.colaboracion_video ? <span style={{ color: '#f59e0b' }}>✓</span> : <span style={{ color: 'var(--border-bright)' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.notas || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
