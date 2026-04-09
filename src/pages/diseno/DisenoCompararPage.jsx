import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const accentColor = '#93C5FD' // Design theme color

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const FLYER_TYPES = [
  { key: 'flyers_storie',      label: 'Stories',                  emoji: '📱' },
  { key: 'flyers_efemeride',   label: 'Efemérides',               emoji: '📅' },
  { key: 'flyers_reposicion',  label: 'Reposición de inventario', emoji: '📦' },
  { key: 'flyers_descuento',   label: 'Descuentos',               emoji: '🏷️' },
  { key: 'flyers_promocion',   label: 'Promociones',              emoji: '📣' },
  { key: 'flyers_cumple',      label: 'Cumpleaños',               emoji: '🎂' },
  { key: 'flyers_otros',       label: 'Otros',                    emoji: '📄' },
]

const METRICS = [
  ...FLYER_TYPES.map(t => ({
    key: t.key,
    label: `Flyers — ${t.label}`,
    emoji: t.emoji,
    higherIsBetter: true
  })),
  { key: 'total_flyers',      label: 'Total flyers',        emoji: '🎨', higherIsBetter: true },
  { key: 'fotos_producto',    label: 'Fotos de producto',   emoji: '📸', higherIsBetter: true },
  { key: 'dias_colaboracion', label: 'Días con video',      emoji: '🎬', higherIsBetter: true },
  { key: 'dias_registrados',  label: 'Días con registro',   emoji: '📋', higherIsBetter: true },
]

function aggregateMonth(records) {
  const uniqueDates = [...new Set(records.map(r => r.fecha).filter(Boolean))]
  const daysWithVideo = new Set()
  const totals = { fotos_producto: 0, dias_colaboracion: 0, dias_registrados: uniqueDates.length }
  FLYER_TYPES.forEach(t => { totals[t.key] = 0 })

  records.forEach(r => {
    FLYER_TYPES.forEach(t => { totals[t.key] += r[t.key] || 0 })
    totals.fotos_producto += r.fotos_producto_subidas || 0
    if (r.colaboracion_video && r.fecha) daysWithVideo.add(r.fecha)
  })
  totals.dias_colaboracion = daysWithVideo.size
  totals.total_flyers = FLYER_TYPES.reduce((s, t) => s + totals[t.key], 0)
  return totals
}

function DeltaBadge({ value, higherIsBetter = true }) {
  if (value === null) return <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>—</span>
  const isGood = higherIsBetter ? value >= 0 : value <= 0
  const color = isGood ? '#10b981' : '#f0436a'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700,
      color, background: `${color}15`, border: `1px solid ${color}33`, borderRadius: 12, padding: '4px 12px', boxShadow: `0 4px 12px ${color}11`
    }}>
      {value >= 0 ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function MonthSelect({ label, value, onChange, availableMonths }) {
  return (
    <div style={{ flex: 1, minWidth: 200 }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: 10, textTransform: 'uppercase' }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '14px 18px', background: 'rgba(255, 255, 255, 0.05)', border: `1px solid ${value ? accentColor + '66' : 'rgba(255, 255, 255, 0.1)'}`, borderRadius: 16, color: '#fff', fontSize: '0.95rem', cursor: 'pointer', outline: 'none' }}
      >
        <option value="" style={{ background: '#080C1C' }}>— Seleccionar mes —</option>
        {availableMonths.map(m => (
          <option key={m} value={m} style={{ background: '#080C1C' }}> {MONTHS_ES[parseInt(m.split('-')[1]) - 1]} {m.split('-')[0]} </option>
        ))}
      </select>
    </div>
  )
}

export default function DisenoCompararPage() {
  const [availableMonths, setAvailableMonths] = useState([])
  const [periodoA, setPeriodoA] = useState('')
  const [periodoB, setPeriodoB] = useState('')
  const [dataA, setDataA] = useState(null)
  const [dataB, setDataB] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('diseno_grafico_diario').select('periodo').order('periodo', { ascending: false })
      if (data) {
        const unique = [...new Set(data.map(r => r.periodo))]
        setAvailableMonths(unique)
        if (unique.length >= 1) setPeriodoA(unique[0])
        if (unique.length >= 2) setPeriodoB(unique[1])
      }
    }
    load()
  }, [])

  useEffect(() => { if (periodoA) loadPeriod(periodoA, setDataA) }, [periodoA])
  useEffect(() => { if (periodoB) loadPeriod(periodoB, setDataB) }, [periodoB])

  async function loadPeriod(periodo, setter) {
    setLoading(true)
    const { data } = await supabase.from('diseno_grafico_diario').select('*').eq('periodo', periodo)
    setter(data ? aggregateMonth(data) : null)
    setLoading(false)
  }

  const delta = (a, b) => (b === 0 && a === 0) ? null : (b === 0) ? 100 : ((a - b) / b * 100)
  const labelForPeriodo = (p) => p ? `${MONTHS_ES[parseInt(p.split('-')[1]) - 1]} ${p.split('-')[0]}` : '—'
  const canCompare = dataA && dataB

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ 
          fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-2px', marginBottom: 4,
          background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.55))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Comparativa Mensual
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', fontWeight: 500 }}>
          Diseño Gráfico · Análisis de rendimiento y variaciones
        </p>
      </div>

      {/* Selectors Panel */}
      <div className="animate-fadeUp" style={{
        background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)',
        borderRadius: 28, padding: '32px', marginBottom: 24, border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
      }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <MonthSelect label="Mes Base (Referencia)" value={periodoA} onChange={setPeriodoA} availableMonths={availableMonths} />
          <div style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.2)', paddingBottom: 12, flexShrink: 0 }}>⇄</div>
          <MonthSelect label="Mes a Comparar" value={periodoB} onChange={setPeriodoB} availableMonths={availableMonths} />
        </div>
        {availableMonths.length < 2 && (
          <div style={{ marginTop: 20, padding: '12px 20px', background: `${accentColor}11`, border: `1px solid ${accentColor}33`, borderRadius: 14, color: accentColor, fontSize: '0.85rem', fontWeight: 600 }}>
            ⚠️ Se requieren al menos 2 meses con registros para realizar una comparación.
          </div>
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="animate-spin" style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: accentColor }} />
        </div>
      )}

      {canCompare && !loading && (
        <div className="animate-fadeUp">
          {/* Summary Hero Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 20, marginBottom: 32, alignItems: 'center' }}>
            {[
              { label: labelForPeriodo(periodoA), val: dataA.total_flyers, align: 'left', color: 'rgba(255,255,255,0.4)', index: 0 },
              { label: 'vs', val: null, align: 'center', color: accentColor, index: 1 },
              { label: labelForPeriodo(periodoB), val: dataB.total_flyers, align: 'right', color: accentColor, index: 2 },
            ].map((item, i) => {
              if (item.val === null) return <div key={i} style={{ fontSize: '1.2rem', fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>{item.label}</div>
              return (
                <div key={i} style={{
                  background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)',
                  borderRadius: 24, padding: '24px 32px', textAlign: item.align, border: '1px solid rgba(255, 255, 255, 0.1)',
                  position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: 0, left: item.align === 'left' ? 0 : 'auto', right: item.align === 'right' ? 0 : 'auto', height: 3, width: '40%', background: item.color }} />
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, marginBottom: 8, letterSpacing: '0.05em' }}>{item.label.toUpperCase()}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '3rem', fontWeight: 900, color: '#fff', letterSpacing: '-2px', lineHeight: 1 }}>{item.val}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginTop: 4 }}>Producción Total</div>
                </div>
              )
            })}
          </div>

          {/* Detailed Metric Comparison Table */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)',
            borderRadius: 28, border: '1px solid rgba(255, 255, 255, 0.1)', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1.5fr repeat(3, 1fr)',
              padding: '20px 32px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              {['MÉTRICA DE PRODUCCIÓN', labelForPeriodo(periodoA), labelForPeriodo(periodoB), 'VARIACIÓN'].map((h, i) => (
                <div key={i} style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textAlign: i > 0 ? 'right' : 'left' }}>{h.toUpperCase()}</div>
              ))}
            </div>

            <div style={{ padding: '8px 0' }}>
              {METRICS.map((m, i) => {
                const valA = dataA[m.key] ?? 0
                const valB = dataB[m.key] ?? 0
                const v = delta(valB, valA)
                const isTotal = m.key === 'total_flyers'

                return (
                  <div key={m.key} style={{
                    display: 'grid', gridTemplateColumns: '1.5fr repeat(3, 1fr)',
                    padding: '16px 32px', borderBottom: i === METRICS.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                    alignItems: 'center', background: isTotal ? `${accentColor}08` : 'transparent',
                    borderLeft: isTotal ? `4px solid ${accentColor}` : '4px solid transparent'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: '1.2rem', filter: `drop-shadow(0 0 8px ${isTotal ? accentColor : 'transparent'})` }}>{m.emoji}</span>
                      <span style={{ fontSize: isTotal ? '1rem' : '0.9rem', color: isTotal ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: isTotal ? 800 : 600 }}>{m.label}</span>
                    </div>

                    <div style={{ fontFamily: 'var(--font-mono)', textAlign: 'right', fontSize: '1.1rem', color: isTotal ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: isTotal ? 800 : 500 }}>{valA}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', textAlign: 'right', fontSize: '1.1rem', color: isTotal ? accentColor : '#fff', fontWeight: 800 }}>{valB}</div>

                    <div style={{ textAlign: 'right' }}>
                      <DeltaBadge value={v} higherIsBetter={m.higherIsBetter} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div style={{ height: 40 }} />
        </div>
      )}
    </div>
  )
}
