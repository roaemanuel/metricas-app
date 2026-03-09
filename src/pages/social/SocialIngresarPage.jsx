import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const color = '#f0436a'

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function getPeriodo(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}-01`
}
function num(v) { return v !== '' && v !== null && v !== undefined ? parseFloat(v) : null }
function fmt(n, decimals = 0) {
  if (n === null || n === undefined) return '—'
  return Number(n).toLocaleString('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

const FIELDS = [
  { key: 'seguidores_total',    label: 'Seguidores totales',          emoji: '👥', placeholder: 'ej: 12500',  color: color,     type: 'int' },
  { key: 'nuevos_seguidores',   label: 'Nuevos seguidores del mes',   emoji: '📈', placeholder: 'ej: 340',    color: '#f59e0b', type: 'int' },
  { key: 'alcance',             label: 'Alcance',                     emoji: '🌐', placeholder: 'ej: 45000',  color: '#3b82f6', type: 'int' },
  { key: 'interacciones',       label: 'Interacciones (likes + comentarios)', emoji: '❤️', placeholder: 'ej: 1800', color: '#ec4899', type: 'int' },
]

const EMPTY = { seguidores_total: '', nuevos_seguidores: '', alcance: '', interacciones: '' }

export default function SocialIngresarPage() {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [form, setForm]   = useState({ ...EMPTY })
  const [existing, setExisting] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  const periodo = getPeriodo(year, month)
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  useEffect(() => { loadMonth() }, [year, month])

  async function loadMonth() {
    setLoading(true); setSaved(false)
    const { data } = await supabase
      .from('social_media_metrics')
      .select('*').eq('periodo', periodo).maybeSingle()
    if (data) {
      setExisting(data)
      setForm({
        seguidores_total:  data.seguidores_total  ?? '',
        nuevos_seguidores: data.nuevos_seguidores ?? '',
        alcance:           data.alcance           ?? '',
        interacciones:     data.interacciones     ?? '',
      })
    } else {
      setExisting(null)
      setForm({ ...EMPTY })
    }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const payload = {
      periodo,
      seguidores_total:  num(form.seguidores_total),
      nuevos_seguidores: num(form.nuevos_seguidores),
      alcance:           num(form.alcance),
      interacciones:     num(form.interacciones),
      ingresado_por: 'social',
      updated_at: new Date().toISOString(),
    }
    let error
    if (existing)
      ;({ error } = await supabase.from('social_media_metrics').update(payload).eq('id', existing.id))
    else {
      const { data, error: err } = await supabase.from('social_media_metrics').insert(payload).select('id').single()
      error = err; if (data) setExisting({ id: data.id })
    }
    setSaving(false)
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    else alert('Error: ' + error.message)
  }

  const anyFilled = Object.values(form).some(v => v !== '')

  const inp = {
    width: '100%', padding: '10px 13px', fontSize: '1rem', fontFamily: 'var(--font-mono)',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 9, color: 'var(--text-primary)', boxSizing: 'border-box',
    fontWeight: 600, outline: 'none',
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:'1.6rem', fontWeight:800, letterSpacing:'-0.8px', marginBottom:4 }}>Métricas Instagram</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.88rem' }}>
            Social Media · ingreso mensual
            {existing && <span style={{ marginLeft:10, fontSize:'0.72rem', background:color+'20', color, border:`1px solid ${color}44`, borderRadius:99, padding:'2px 10px', fontWeight:600 }}>✎ Actualizando</span>}
          </p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={() => { if(month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }}
            style={{ width:34,height:34,borderRadius:8,background:'var(--bg-elevated)',border:'1px solid var(--border)',color:'var(--text-secondary)',fontSize:'1rem',cursor:'pointer' }}>‹</button>
          <span style={{ fontFamily:'var(--font-mono)',fontSize:'0.82rem',color:'var(--text-primary)',minWidth:130,textAlign:'center' }}>{MONTHS_ES[month]} {year}</span>
          <button onClick={() => { if(isCurrentMonth)return; if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }}
            disabled={isCurrentMonth} style={{ width:34,height:34,borderRadius:8,background:'var(--bg-elevated)',border:'1px solid var(--border)',color:isCurrentMonth?'var(--text-muted)':'var(--text-secondary)',fontSize:'1rem',cursor:isCurrentMonth?'not-allowed':'pointer' }}>›</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex',justifyContent:'center',padding:60 }}>
          <div style={{ width:28,height:28,borderRadius:'50%',border:'2px solid var(--border-bright)',borderTopColor:color,animation:'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* API note */}
          <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 16px', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:16 }}>📱</span>
            <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>
              Ingreso manual · <strong style={{color:'var(--text-secondary)'}}>API de Meta</strong> se conectará automáticamente más adelante
            </span>
          </div>

          {/* Metrics grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:14 }}>
            {FIELDS.map(f => (
              <div key={f.key} style={{
                background: form[f.key] ? f.color+'0d' : 'var(--bg-surface)',
                border: `1px solid ${form[f.key] ? f.color+'44' : 'var(--border)'}`,
                borderRadius:16, padding:'22px 24px',
                transition:'all 0.2s',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <span style={{ fontSize:22 }}>{f.emoji}</span>
                  <div>
                    <div style={{ fontSize:'0.85rem', fontWeight:700, color: form[f.key]?'var(--text-primary)':'var(--text-secondary)' }}>{f.label}</div>
                  </div>
                </div>
                <input
                  type="number"
                  value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{
                    ...inp,
                    fontSize:'1.4rem',
                    color: form[f.key] ? f.color : 'var(--text-muted)',
                    borderColor: form[f.key] ? f.color+'55' : 'var(--border)',
                    background: form[f.key] ? 'var(--bg-base)' : 'var(--bg-elevated)',
                  }}
                />
                {/* Show previous value if editing */}
                {existing && existing[f.key] != null && (
                  <div style={{ marginTop:8, fontSize:'0.72rem', color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>
                    Anterior: <span style={{color:'var(--text-secondary)'}}>{fmt(existing[f.key])}</span>
                    {f.key === 'seguidores_total' && form[f.key] && (
                      <span style={{ marginLeft:8, color: parseFloat(form[f.key]) >= existing[f.key] ? '#10b981' : '#f0436a', fontWeight:600 }}>
                        ({parseFloat(form[f.key]) >= existing[f.key] ? '▲' : '▼'} {Math.abs(parseFloat(form[f.key]) - existing[f.key]).toLocaleString('es-AR')})
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tasa de engagement calculada */}
          {form.interacciones && form.alcance && parseFloat(form.alcance) > 0 && (
            <div style={{ background:'var(--bg-surface)', border:`1px solid ${color}33`, borderRadius:12, padding:'14px 20px', display:'flex', alignItems:'center', gap:16 }}>
              <span style={{ fontSize:20 }}>✨</span>
              <div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:600, letterSpacing:'0.05em', marginBottom:2 }}>ENGAGEMENT RATE (calculado)</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:'1.4rem', fontWeight:700, color }}>
                  {(parseFloat(form.interacciones) / parseFloat(form.alcance) * 100).toFixed(2)}%
                </div>
              </div>
              <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginLeft:8 }}>Interacciones ÷ Alcance × 100</div>
            </div>
          )}

          {/* Save */}
          <div style={{ display:'flex', justifyContent:'flex-end', paddingBottom:8 }}>
            <button onClick={handleSave} disabled={saving || !anyFilled} style={{
              padding:'13px 36px',
              background: saved ? '#059669' : !anyFilled ? 'var(--bg-elevated)' : `linear-gradient(135deg, ${color}, #c0392b)`,
              border:'none', borderRadius:12,
              color: saved ? '#fff' : !anyFilled ? 'var(--text-muted)' : '#fff',
              fontSize:'0.95rem', fontWeight:700,
              cursor: !anyFilled ? 'not-allowed' : 'pointer',
              boxShadow: anyFilled && !saved ? `0 4px 20px ${color}44` : 'none',
              transition:'all 0.2s',
            }}
              onMouseEnter={e => { if (!saving && anyFilled) e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {saving ? 'Guardando…' : saved ? '✓ Guardado' : existing ? '✎ Actualizar métricas' : '✚ Guardar métricas del mes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
