import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const color = '#f0436a'

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function getPeriodo(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}-01`
}

function todayISO() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}

function num(v) {
  return v !== '' && v !== null && v !== undefined ? parseFloat(v) : null
}

function fmt(n, decimals = 0) {
  if (n === null || n === undefined) return '—'
  return Number(n).toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function parseRedSocial(value) {
  if (Array.isArray(value)) return value

  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.filter(Boolean)
    return parsed ? [parsed] : []
  } catch {
    return [value]
  }
}

const FIELDS = [
  { key: 'seguidores_total', label: 'Seguidores totales', emoji: '👥', placeholder: 'ej: 12500', color: color, type: 'int' },
  { key: 'nuevos_seguidores', label: 'Nuevos seguidores del mes', emoji: '📈', placeholder: 'ej: 340', color: '#f59e0b', type: 'int' },
  { key: 'alcance', label: 'Alcance', emoji: '🌐', placeholder: 'ej: 45000', color: '#3b82f6', type: 'int' },
  { key: 'interacciones', label: 'Interacciones (likes + comentarios)', emoji: '❤️', placeholder: 'ej: 1800', color: '#ec4899', type: 'int' },
]

const EMPTY = {
  seguidores_total: '',
  nuevos_seguidores: '',
  alcance: '',
  interacciones: '',
}

const REDES = [
  { key: 'tiktok', label: 'TikTok', emoji: '🎵', color: '#010101', bg: '#69C9D020' },
  { key: 'youtube', label: 'YouTube', emoji: '▶️', color: '#FF0000', bg: '#FF000020' },
  { key: 'whatsapp', label: 'WhatsApp', emoji: '💬', color: '#25D366', bg: '#25D36620' },
  { key: 'instagram', label: 'Instagram', emoji: '📸', color: '#E1306C', bg: '#E1306C20' },
]

export default function SocialIngresarPage() {
  const now = new Date()
  const today = todayISO()

  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [form, setForm] = useState({ ...EMPTY })
  const [existing, setExisting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('metricas')

  const [videos, setVideos] = useState([])
  const [savingVideo, setSavingVideo] = useState(false)
  const [newVideo, setNewVideo] = useState({
    red_social: ['instagram'],
    etiqueta: '',
    cantidad: 1,
    fecha: today,
  })
  const [videoSaved, setVideoSaved] = useState(false)

  const periodo = getPeriodo(year, month)
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  useEffect(() => {
    loadMonth()
  }, [year, month])

  async function loadMonth() {
    setLoading(true)
    setSaved(false)

    const [{ data: m }, { data: v }] = await Promise.all([
      supabase
        .from('social_media_metrics')
        .select('*')
        .eq('periodo', periodo)
        .maybeSingle(),
      supabase
        .from('social_videos')
        .select('*')
        .eq('periodo', periodo)
        .order('created_at', { ascending: false }),
    ])

    if (m) {
      setExisting(m)
      setForm({
        seguidores_total: m.seguidores_total ?? '',
        nuevos_seguidores: m.nuevos_seguidores ?? '',
        alcance: m.alcance ?? '',
        interacciones: m.interacciones ?? '',
      })
    } else {
      setExisting(null)
      setForm({ ...EMPTY })
    }

    const parsedVideos = (v || []).map(video => ({
      ...video,
      red_social: parseRedSocial(video.red_social),
    }))

    setVideos(parsedVideos)
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)

    const payload = {
      periodo,
      seguidores_total: num(form.seguidores_total),
      nuevos_seguidores: num(form.nuevos_seguidores),
      alcance: num(form.alcance),
      interacciones: num(form.interacciones),
      ingresado_por: 'social',
      updated_at: new Date().toISOString(),
    }

    let error

    if (existing) {
      ;({ error } = await supabase
        .from('social_media_metrics')
        .update(payload)
        .eq('id', existing.id))
    } else {
      const { data, error: err } = await supabase
        .from('social_media_metrics')
        .insert(payload)
        .select('id')
        .single()

      error = err
      if (data) setExisting({ id: data.id })
    }

    setSaving(false)

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      alert('Error: ' + error.message)
    }
  }

  async function handleAddVideo() {
    if (!newVideo.etiqueta.trim()) return
    if (!newVideo.red_social.length) {
      alert('Selecciona al menos una red social')
      return
    }

    setSavingVideo(true)

    const payload = {
      periodo,
      red_social: JSON.stringify(newVideo.red_social),
      etiqueta: newVideo.etiqueta.trim(),
      cantidad: parseInt(newVideo.cantidad) || 1,
      fecha: newVideo.fecha || today,
      ingresado_por: 'social',
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('social_videos').insert(payload)

    setSavingVideo(false)

    if (!error) {
      setVideoSaved(true)
      setTimeout(() => setVideoSaved(false), 2000)

      setNewVideo({
        red_social: ['instagram'],
        etiqueta: '',
        cantidad: 1,
        fecha: today,
      })

      const { data: v } = await supabase
        .from('social_videos')
        .select('*')
        .eq('periodo', periodo)
        .order('created_at', { ascending: false })

      const parsedVideos = (v || []).map(video => ({
        ...video,
        red_social: parseRedSocial(video.red_social),
      }))

      setVideos(parsedVideos)
    } else {
      alert('Error al guardar video: ' + error.message)
    }
  }

  async function handleDeleteVideo(id) {
    const { error } = await supabase.from('social_videos').delete().eq('id', id)

    if (!error) {
      setVideos(prev => prev.filter(v => v.id !== id))
    }
  }

  function toggleRedSocial(redKey) {
    setNewVideo(prev => {
      const exists = prev.red_social.includes(redKey)

      return {
        ...prev,
        red_social: exists
          ? prev.red_social.filter(item => item !== redKey)
          : [...prev.red_social, redKey],
      }
    })
  }

  const anyFilled = Object.values(form).some(v => v !== '')

  const inp = {
    width: '100%',
    padding: '10px 13px',
    fontSize: '1rem',
    fontFamily: 'var(--font-mono)',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 9,
    color: 'var(--text-primary)',
    boxSizing: 'border-box',
    fontWeight: 600,
    outline: 'none',
  }

  const videosPorRed = REDES.map(r => ({
    ...r,
    total: videos
      .filter(v => Array.isArray(v.red_social) && v.red_social.includes(r.key))
      .reduce((s, v) => s + (v.cantidad || 1), 0),
    items: videos.filter(v => Array.isArray(v.red_social) && v.red_social.includes(r.key)),
  }))

  const totalVideos = videos.reduce((s, v) => s + (v.cantidad || 1), 0)

  return (
    <div className="animate-fadeIn">
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 600, letterSpacing: '-0.8px', marginBottom: 4 }}>
            Métricas Social Media
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Community · ingreso mensual
            {existing && (
              <span
                style={{
                  marginLeft: 10,
                  fontSize: '0.72rem',
                  background: color + '20',
                  color,
                  border: `1px solid ${color}44`,
                  borderRadius: 99,
                  padding: '2px 10px',
                  fontWeight: 600,
                }}
              >
                ✎ Actualizando
              </span>
            )}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => {
              if (month === 0) {
                setYear(y => y - 1)
                setMonth(11)
              } else {
                setMonth(m => m - 1)
              }
            }}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            ‹
          </button>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              minWidth: 130,
              textAlign: 'center',
            }}
          >
            {MONTHS_ES[month]} {year}
          </span>

          <button
            onClick={() => {
              if (isCurrentMonth) return
              if (month === 11) {
                setYear(y => y + 1)
                setMonth(0)
              } else {
                setMonth(m => m + 1)
              }
            }}
            disabled={isCurrentMonth}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: isCurrentMonth ? 'var(--text-muted)' : 'var(--text-secondary)',
              fontSize: '1rem',
              cursor: isCurrentMonth ? 'not-allowed' : 'pointer',
            }}
          >
            ›
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 24,
          background: 'var(--bg-elevated)',
          padding: 4,
          borderRadius: 12,
          width: 'fit-content',
        }}
      >
        {[
          ['metricas', '📊 Métricas Instagram'],
          ['videos', '🎬 Videos'],
        ].map(([id, lbl]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              padding: '8px 20px',
              borderRadius: 9,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === id ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === id ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: activeTab === id ? 600 : 400,
              boxShadow: activeTab === id ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {lbl}
            {id === 'videos' && totalVideos > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  background: color + '30',
                  color,
                  borderRadius: 99,
                  padding: '1px 7px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                }}
              >
                {totalVideos}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: '2px solid var(--border-bright)',
              borderTopColor: color,
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      ) : (
        <>
          {activeTab === 'metricas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 16 }}>📱</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Ingreso manual · <strong style={{ color: 'var(--text-secondary)' }}>API de Meta</strong> se conectará automáticamente más adelante
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 }}>
                {FIELDS.map(f => (
                  <div
                    key={f.key}
                    style={{
                      background: form[f.key] ? f.color + '0d' : 'var(--bg-surface)',
                      border: `1px solid ${form[f.key] ? f.color + '44' : 'var(--border)'}`,
                      borderRadius: 16,
                      padding: '22px 24px',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 16px var(--glass-shadow)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <span style={{ fontSize: 22 }}>{f.emoji}</span>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: form[f.key] ? 'var(--text-primary)' : 'var(--text-secondary)',
                        }}
                      >
                        {f.label}
                      </div>
                    </div>

                    <input
                      type="number"
                      value={form[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{
                        ...inp,
                        fontSize: '1.4rem',
                        color: form[f.key] ? f.color : 'var(--text-muted)',
                        borderColor: form[f.key] ? f.color + '55' : 'var(--border)',
                        background: form[f.key] ? 'var(--bg-base)' : 'var(--bg-elevated)',
                      }}
                    />

                    {existing && existing[f.key] != null && (
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        Anterior: <span style={{ color: 'var(--text-secondary)' }}>{fmt(existing[f.key])}</span>
                        {f.key === 'seguidores_total' && form[f.key] && (
                          <span
                            style={{
                              marginLeft: 8,
                              color: parseFloat(form[f.key]) >= existing[f.key] ? '#10b981' : '#f0436a',
                              fontWeight: 600,
                            }}
                          >
                            ({parseFloat(form[f.key]) >= existing[f.key] ? '▲' : '▼'}{' '}
                            {Math.abs(parseFloat(form[f.key]) - existing[f.key]).toLocaleString('es-AR')})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {form.interacciones && form.alcance && parseFloat(form.alcance) > 0 && (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: `1px solid ${color}33`,
                    borderRadius: 12,
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <span style={{ fontSize: 20 }}>✨</span>
                  <div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        marginBottom: 2,
                      }}
                    >
                      ENGAGEMENT RATE (calculado)
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '1.4rem',
                        fontWeight: 600,
                        color,
                      }}
                    >
                      {(parseFloat(form.interacciones) / parseFloat(form.alcance) * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                    Interacciones ÷ Alcance × 100
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 8 }}>
                <button
                  onClick={handleSave}
                  disabled={saving || !anyFilled}
                  style={{
                    padding: '13px 36px',
                    background: saved
                      ? '#059669'
                      : !anyFilled
                        ? 'var(--bg-elevated)'
                        : 'var(--accent)',
                    border: 'none',
                    borderRadius: 12,
                    color: saved ? '#fff' : !anyFilled ? 'var(--text-muted)' : '#fff',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: !anyFilled ? 'not-allowed' : 'pointer',
                    boxShadow: anyFilled && !saved ? '0 4px 20px var(--accent-glow)' : 'none',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    if (!saving && anyFilled) e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {saving ? 'Guardando…' : saved ? '✓ Guardado' : existing ? '✎ Actualizar métricas' : '✚ Guardar métricas del mes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'videos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {totalVideos > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10 }}>
                  {videosPorRed.map(r => (
                    <div
                      key={r.key}
                      style={{
                        background: r.total > 0 ? r.bg : 'var(--bg-surface)',
                        border: `1px solid ${r.total > 0 ? r.color + '44' : 'var(--border)'}`,
                        borderRadius: 12,
                        padding: '14px 16px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{r.emoji}</div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '1.6rem',
                          fontWeight: 600,
                          color: r.total > 0 ? r.color : 'var(--text-muted)',
                          lineHeight: 1,
                          marginBottom: 4,
                        }}
                      >
                        {r.total}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {r.label}
                      </div>
                    </div>
                  ))}

                  <div
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: '14px 16px',
                      textAlign: 'center',
                      boxShadow: '0 4px 16px var(--glass-shadow)',
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 6 }}>🎬</div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '1.6rem',
                        fontWeight: 600,
                        color,
                        lineHeight: 1,
                        marginBottom: 4,
                      }}
                    >
                      {totalVideos}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Total
                    </div>
                  </div>
                </div>
              )}

              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  padding: '20px 24px',
                  boxShadow: '0 4px 16px var(--glass-shadow)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  <span style={{ fontSize: 20 }}>🎬</span>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Registrar video</span>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.73rem',
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                      marginBottom: 8,
                      letterSpacing: '0.05em',
                    }}
                  >
                    RED SOCIAL
                  </label>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {REDES.map(r => {
                      const active = newVideo.red_social.includes(r.key)

                      return (
                        <button
                          key={r.key}
                          type="button"
                          onClick={() => toggleRedSocial(r.key)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 14px',
                            borderRadius: 10,
                            cursor: 'pointer',
                            border: `1px solid ${active ? r.color : 'var(--border)'}`,
                            background: active ? r.color + '22' : 'var(--bg-elevated)',
                            color: active ? r.color : 'var(--text-secondary)',
                            fontSize: '0.85rem',
                            fontWeight: active ? 700 : 400,
                            transition: 'all 0.15s',
                          }}
                        >
                          {r.emoji} {r.label}
                        </button>
                      )
                    })}
                  </div>

                  <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Puedes seleccionar múltiples redes sociales
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.73rem',
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                      marginBottom: 6,
                      letterSpacing: '0.05em',
                    }}
                  >
                    DESCRIPCIÓN / ETIQUETA
                  </label>

                  <input
                    type="text"
                    value={newVideo.etiqueta}
                    onChange={e => setNewVideo(v => ({ ...v, etiqueta: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleAddVideo()}
                    placeholder="ej: Promoción descuento 20%, Efeméride día del médico…"
                    style={{
                      width: '100%',
                      padding: '10px 13px',
                      fontSize: '0.9rem',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 9,
                      color: 'var(--text-primary)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.73rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        marginBottom: 6,
                        letterSpacing: '0.05em',
                      }}
                    >
                      CANTIDAD
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={newVideo.cantidad}
                      onChange={e => setNewVideo(v => ({ ...v, cantidad: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '10px 13px',
                        fontSize: '0.9rem',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: 9,
                        color: 'var(--text-primary)',
                        boxSizing: 'border-box',
                        fontFamily: 'var(--font-mono)',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.73rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        marginBottom: 6,
                        letterSpacing: '0.05em',
                      }}
                    >
                      FECHA
                    </label>

                    <input
                      type="date"
                      value={newVideo.fecha}
                      onChange={e => setNewVideo(v => ({ ...v, fecha: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '10px 13px',
                        fontSize: '0.9rem',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: 9,
                        color: 'var(--text-primary)',
                        boxSizing: 'border-box',
                        fontFamily: 'var(--font-mono)',
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddVideo}
                  disabled={savingVideo || !newVideo.etiqueta.trim() || !newVideo.red_social.length}
                  style={{
                    padding: '12px 28px',
                    background: videoSaved
                      ? '#059669'
                      : !newVideo.etiqueta.trim() || !newVideo.red_social.length
                        ? 'var(--bg-elevated)'
                        : `linear-gradient(135deg, ${color}, #c0392b)`,
                    border: 'none',
                    borderRadius: 10,
                    color: !newVideo.etiqueta.trim() || !newVideo.red_social.length ? 'var(--text-muted)' : '#fff',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: !newVideo.etiqueta.trim() || !newVideo.red_social.length ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {savingVideo ? 'Guardando…' : videoSaved ? '✓ Agregado' : '✚ Agregar video'}
                </button>
              </div>

              {videos.length > 0 && (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      letterSpacing: '0.08em',
                    }}
                  >
                    VIDEOS DEL MES ({videos.length} registros · {totalVideos} videos)
                  </div>

                  <div>
                    {videos.map((v, i) => {
                      const redesVideo = REDES.filter(r =>
                        Array.isArray(v.red_social) && v.red_social.includes(r.key)
                      )

                      return (
                        <div
                          key={v.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 20px',
                            borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              gap: 6,
                              flexWrap: 'wrap',
                              minWidth: 150,
                              maxWidth: 220,
                              flexShrink: 0,
                            }}
                          >
                            {redesVideo.map(red => (
                              <span
                                key={red.key}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  background: red.bg,
                                  border: `1px solid ${red.color}44`,
                                  borderRadius: 8,
                                  padding: '4px 10px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  color: red.color,
                                  flexShrink: 0,
                                }}
                              >
                                {red.emoji} {red.label}
                              </span>
                            ))}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-primary)',
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {v.etiqueta}
                            </div>

                            {v.fecha && (
                              <div
                                style={{
                                  fontSize: '0.68rem',
                                  color: 'var(--text-muted)',
                                  fontFamily: 'var(--font-mono)',
                                  marginTop: 2,
                                }}
                              >
                                {v.fecha.slice(8, 10)}/{v.fecha.slice(5, 7)}
                              </div>
                            )}
                          </div>

                          {v.cantidad > 1 && (
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                color,
                                background: color + '15',
                                borderRadius: 8,
                                padding: '3px 10px',
                                flexShrink: 0,
                              }}
                            >
                              ×{v.cantidad}
                            </span>
                          )}

                          <button
                            onClick={() => handleDeleteVideo(v.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              padding: '4px',
                              flexShrink: 0,
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.color = '#f0436a'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.color = 'var(--text-muted)'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {videos.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 24px',
                    border: `1px dashed ${color}33`,
                    borderRadius: 14,
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                  }}
                >
                  🎬 Aún no hay videos registrados este mes
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
