import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const FLYER_TYPES = [
  { key: 'flyers_storie',   label: 'Stories',          emoji: '📱' },
  { key: 'flyers_efemeride',label: 'Efemérides',       emoji: '📅' },
  { key: 'flyers_promo',    label: 'Promos / Ofertas', emoji: '🏷️' },
  { key: 'flyers_cumple',   label: 'Cumpleaños',        emoji: '🎂' },
  { key: 'flyers_otros',    label: 'Otros',            emoji: '📄' },
]

const METRICS = [
  ...FLYER_TYPES.map(t => ({ key: t.key, label: `Flyers — ${t.label}`, emoji: t.emoji, higherIsBetter: true })),
  { key: 'total_flyers',        label: 'Total flyers',          emoji: '🎨', higherIsBetter: true },
  { key: 'fotos_producto',      label: 'Fotos de producto',     emoji: '📸', higherIsBetter: true },
  { key: 'dias_colaboracion',   label: 'Días con video',        emoji: '🎬', higherIsBetter: true },
  { key: 'dias_registrados',    label: 'Días con registro',     emoji: '📋', higherIsBetter: true },
]

function aggregateMonth(records) {
  const totals = { fotos_producto: 0, dias_colaboracion: 0, dias_registrados: records.length }
  FLYER_TYPES.forEach(t => { totals[t.key] = 0 })
  records.forEach(r => {
    FLYER_TYPES.forEach(t => { totals[t.key] += r[t.key] || 0 })
    totals.fotos_producto += r.fotos_producto_subidas || 0
    if (r.colaboracion_video) totals.dias_colaboracion++
  })
  totals.total_flyers = FLYER_TYPES.reduce((s, t) => s + totals[t.key], 0)
  return totals
}

function delta(a, b) {
  if (b === 0 && a === 0) return null
  if (b === 0) return 100
  return ((a - b) / b * 100)
}

function DeltaBadge({ value, higherIsBetter = true }) {
  if (value === null) return <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
  const isGood = higherIsBetter ? value >= 0 : value <= 0
  const color = isGood ? '#10b981' : '#f0436a'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
      fontWeight: 700, color,
      background: color + '18',
      border: `1px solid ${color}33`,
      borderRadius: 99, padding: '2px 10px',
    }}>
      {value >= 0 ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function MonthSelect({ label, value, onChange, availableMonths }) {
  const color = '#0eb8d4'
  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
        {label}
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px',
          background: 'var(--bg-elevated)',
          border: `1px solid ${value ? color + '66' : 'var(--border)'}`,
          borderRadius: 10, color: 'var(--text-primary)',
          fontSize: '0.9rem', cursor: 'pointer',
        }}
      >
        <option value="">— Seleccionar mes —</option>
        {availableMonths.map(m => (
          <option key={m} value={m}>
            {MONTHS_ES[parseInt(m.split('-')[1]) - 1]} {m.split('-')[0]}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function DisenoCompararPage() {
  const color = '#0eb8d4'
  const [availableMonths, setAvailableMonths] = useState([])
  const [periodoA, setPeriodoA] = useState('')
  const [periodoB, setPeriodoB] = useState('')
  const [dataA, setDataA] = useState(null)
  const [dataB, setDataB] = useState(null)
  const [loading, setLoading] = useState(false)

  // Load available months (months that have at least 1 record)
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('diseno_grafico_diario')
        .select('periodo')
        .order('periodo', { ascending: false })
      if (data) {
        const unique = [...new Set(data.map(r => r.periodo))]
        setAvailableMonths(unique)
        if (unique.length >= 1) setPeriodoA(unique[0])
        if (unique.length >= 2) setPeriodoB(unique[1])
      }
    }
    load()
  }, [])

  // Load records when periods change
  useEffect(() => {
    if (periodoA) loadPeriod(periodoA, setDataA)
  }, [periodoA])

  useEffect(() => {
    if (periodoB) loadPeriod(periodoB, setDataB)
  }, [periodoB])

  async function loadPeriod(periodo, setter) {
    setLoading(true)
    const { data } = await supabase
      .from('diseno_grafico_diario')
      .select('*')
      .eq('periodo', periodo)
    setter(data ? aggregateMonth(data) : null)
    setLoading(false)
  }

  function labelForPeriodo(p) {
    if (!p) return '—'
    const [y, m] = p.split('-')
    return `${MONTHS_ES[parseInt(m) - 1]} ${y}`
  }

  const canCompare = dataA && dataB

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 4 }}>
          Comparativa mensual
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Diseño Gráfico · comparación período a período
        </p>
      </div>

      {/* Period selectors */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 14, padding: '20px 24px',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <MonthSelect label="Mes base" value={periodoA} onChange={setPeriodoA} availableMonths={availableMonths} />
          <div style={{ fontSize: '1.4rem', color: 'var(--text-muted)', paddingBottom: 10, flexShrink: 0 }}>⇄</div>
          <MonthSelect label="Mes a comparar" value={periodoB} onChange={setPeriodoB} availableMonths={availableMonths} />
        </div>
        {availableMonths.length < 2 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 12 }}>
            ⚠️ Necesitás al menos 2 meses con datos registrados para comparar.
          </p>
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            border: '2px solid var(--border-bright)',
            borderTopColor: color,
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      )}

      {canCompare && !loading && (
        <>
          {/* Summary row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto 1fr',
            gap: 12, marginBottom: 20, alignItems: 'center',
          }}>
            {[
              { label: labelForPeriodo(periodoA), data: dataA, align: 'left' },
              null,
              { label: labelForPeriodo(periodoB), data: dataB, align: 'right' },
            ].map((item, i) => {
              if (item === null) return (
                <div key={i} style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.2rem' }}>vs</div>
              )
              return (
                <div key={i} style={{
                  background: 'var(--bg-surface)',
                  border: `1px solid ${color}33`,
                  borderRadius: 14, padding: '18px 22px',
                  textAlign: item.align,
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '2.2rem',
                    fontWeight: 600, color, letterSpacing: '-1px',
                  }}>{item.data.total_flyers}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>flyers totales</div>
                </div>
              )
            })}
          </div>

          {/* Detail table */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr repeat(3, auto)',
              padding: '12px 20px',
              background: 'var(--bg-elevated)',
              borderBottom: '1px solid var(--border)',
              gap: 12,
            }}>
              {['Métrica', labelForPeriodo(periodoA), labelForPeriodo(periodoB), 'Variación'].map((h, i) => (
                <div key={i} style={{
                  fontSize: '0.7rem', fontWeight: 700,
                  color: 'var(--text-muted)', letterSpacing: '0.08em',
                  textAlign: i > 0 ? 'right' : 'left',
                  minWidth: i > 0 ? 80 : 'auto',
                }}>{h}</div>
              ))}
            </div>

            {METRICS.map((m, i) => {
              const valA = dataA[m.key] ?? 0
              const valB = dataB[m.key] ?? 0
              const d = delta(valB, valA)
              const isTotal = m.key === 'total_flyers'

              return (
                <div key={m.key} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr repeat(3, auto)',
                  padding: isTotal ? '14px 20px' : '11px 20px',
                  borderTop: i === 0 ? 'none' : `1px solid ${isTotal ? 'var(--border-bright)' : 'var(--border)'}`,
                  background: isTotal ? color + '08' : i % 2 === 0 ? 'transparent' : 'var(--bg-elevated)',
                  gap: 12, alignItems: 'center',
                  borderLeft: isTotal ? `3px solid ${color}` : '3px solid transparent',
                }}>
                  <div style={{
                    fontSize: isTotal ? '0.88rem' : '0.82rem',
                    color: isTotal ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isTotal ? 700 : 400,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ fontSize: '0.9rem' }}>{m.emoji}</span>
                    {m.label}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', textAlign: 'right', minWidth: 80,
                    fontSize: isTotal ? '1rem' : '0.85rem',
                    color: isTotal ? color : 'var(--text-primary)',
                    fontWeight: isTotal ? 700 : 400,
                  }}>{valA}</div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', textAlign: 'right', minWidth: 80,
                    fontSize: isTotal ? '1rem' : '0.85rem',
                    color: isTotal ? color : 'var(--text-primary)',
                    fontWeight: isTotal ? 700 : 400,
                  }}>{valB}</div>
                  <div style={{ textAlign: 'right', minWidth: 90 }}>
                    <DeltaBadge value={d} higherIsBetter={m.higherIsBetter} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
