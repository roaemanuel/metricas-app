import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const color = '#7DD3FC' // Social color from user request
const RED = '#f0436a'
const GREEN = '#10b981'
const BLUE = '#3b82f6'

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
  { key: 'nuevos_seguidores', label: 'Nuevos seguidores del mes', emoji: '📈', placeholder: 'ej: 340', color: GREEN, type: 'int' },
  { key: 'alcance', label: 'Alcance', emoji: '🌐', placeholder: 'ej: 45000', color: BLUE, type: 'int' },
  { key: 'interacciones', label: 'Interacciones (likes + comentarios)', emoji: '❤️', placeholder: 'ej: 1800', color: RED, type: 'int' },
]

const EMPTY = {
  seguidores_total: '',
  nuevos_seguidores: '',
  alcance: '',
  interacciones: '',
}

const REDES = [
  { key: 'tiktok', label: 'TikTok', emoji: '🎵', color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
  { key: 'youtube', label: 'YouTube', emoji: '▶️', color: '#38BDF8', bg: 'rgba(56,189,248,0.1)' },
  { key: 'whatsapp', label: 'WhatsApp', emoji: '💬', color: '#818CF8', bg: 'rgba(129,140,248,0.1)' },
  { key: 'instagram', label: 'Instagram', emoji: '📸', color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
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
      seguidores_total: num(form.seguidores_total) || 0,
      nuevos_seguidores: num(form.nuevos_seguidores) || 0,
      alcance: num(form.alcance) || 0,
      interacciones: num(form.interacciones) || 0,
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
    if (!confirm('¿Eliminar este registro de video?')) return
    const { error } = await supabase.from('social_videos').delete().eq('id', id)
    if (!error) setVideos(prev => prev.filter(v => v.id !== id))
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
  const totalVideos = videos.reduce((s, v) => s + (v.cantidad || 1), 0)

  const videosPorRed = REDES.map(r => ({
    ...r,
    total: videos
      .filter(v => Array.isArray(v.red_social) && v.red_social.includes(r.key))
      .reduce((s, v) => s + (v.cantidad || 1), 0),
  }))

  const glassInput = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '1.2rem',
    fontFamily: 'var(--font-mono)',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    color: '#fff',
    boxSizing: 'border-box',
    fontWeight: 700,
    outline: 'none',
    transition: 'all 0.2s',
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div>
          <h1 style={{ 
            fontSize: '2.4rem', 
            fontWeight: 800, 
            letterSpacing: '-1.5px', 
            marginBottom: 6,
            background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.55))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Ingreso de Métricas
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', fontWeight: 500 }}>
            Social Media · Registro mensual de KPIs y Contenido
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: 14, 
            padding: '4px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <button
              onClick={() => {
                if (month === 0) { setYear(y => y - 1); setMonth(11) }
                else { setMonth(m => m - 1) }
              }}
              style={{ width: 36, height: 36, borderRadius: 10, background: 'transparent', border: 'none', color: '#fff', fontSize: '1.1rem', cursor: 'pointer' }}
            >‹</button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', minWidth: 120, textAlign: 'center', fontWeight: 600 }}>
              {MONTHS_ES[month]} {year}
            </span>
            <button
              onClick={() => {
                if (isCurrentMonth) return
                if (month === 11) { setYear(y => y + 1); setMonth(0) }
                else { setMonth(m => m + 1) }
              }}
              disabled={isCurrentMonth}
              style={{ width: 36, height: 36, borderRadius: 10, background: 'transparent', border: 'none', color: isCurrentMonth ? 'rgba(255,255,255,0.2)' : '#fff', fontSize: '1.1rem', cursor: isCurrentMonth ? 'not-allowed' : 'pointer' }}
            >›</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', gap: 6, marginBottom: 32, background: 'rgba(255,255,255,0.05)', 
        padding: 6, borderRadius: 16, width: 'fit-content', border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {[
          ['metricas', '📊 Métricas Instagram'],
          ['videos', '🎬 Videos de Contenido'],
        ].map(([id, lbl]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              padding: '10px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: activeTab === id ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: activeTab === id ? '#fff' : 'rgba(255,255,255,0.4)',
              fontSize: '0.88rem', fontWeight: 700, transition: 'all 0.2s'
            }}
          >
            {lbl}
            {id === 'videos' && totalVideos > 0 && (
              <span style={{ marginLeft: 8, background: `${color}33`, color, borderRadius: 99, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 800 }}>
                {totalVideos}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div className="animate-spin" style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: color }} />
        </div>
      ) : (
        <>
          {activeTab === 'metricas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Fields Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                {FIELDS.map(f => (
                  <div
                    key={f.key}
                    className="animate-fadeUp"
                    style={{
                      background: 'rgba(255, 255, 255, 0.07)',
                      backdropFilter: 'blur(28px)',
                      border: `1px solid ${form[f.key] ? f.color + '44' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 24, padding: '28px', transition: 'all 0.3s',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                      <span style={{ fontSize: 24, filter: `drop-shadow(0 0 8px ${f.color}44)` }}>{f.emoji}</span>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {f.label}
                      </div>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        value={form[f.key]}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        style={{
                          ...glassInput,
                          color: form[f.key] ? f.color : '#fff',
                          borderColor: form[f.key] ? f.color + '77' : 'rgba(255,255,255,0.1)',
                          background: form[f.key] ? `${f.color}0a` : 'rgba(255,255,255,0.05)'
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = f.color}
                        onBlur={e => e.currentTarget.style.borderColor = form[f.key] ? f.color + '77' : 'rgba(255,255,255,0.1)'}
                      />
                    </div>

                    {existing && existing[f.key] != null && (
                      <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                        Dato anterior: <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>{fmt(existing[f.key])}</span>
                        {f.key === 'seguidores_total' && form[f.key] && (
                          <span style={{ marginLeft: 10, color: parseFloat(form[f.key]) >= existing[f.key] ? GREEN : RED, fontWeight: 800 }}>
                            ({parseFloat(form[f.key]) >= existing[f.key] ? '▲' : '▼'}{' '}
                            {Math.abs(parseFloat(form[f.key]) - existing[f.key]).toLocaleString('es-AR')})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Engagement Rate Insight */}
              {form.interacciones && form.alcance && parseFloat(form.alcance) > 0 && (
                <div
                  className="animate-fadeUp"
                  style={{
                    background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)',
                    border: `1px solid ${color}33`, borderRadius: 20, padding: '20px 28px',
                    display: 'flex', alignItems: 'center', gap: 24, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ width: 50, height: 50, borderRadius: 14, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✨</div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Engagement Rate Estimado</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 800, color, lineHeight: 1 }}>
                      {(parseFloat(form.interacciones) / parseFloat(form.alcance) * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', marginLeft: 'auto', fontStyle: 'italic' }}>
                    Interacciones / Alcance × 100
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  onClick={handleSave}
                  disabled={saving || !anyFilled}
                  style={{
                    padding: '16px 48px',
                    background: saved ? GREEN : (anyFilled ? color : 'rgba(255,255,255,0.05)'),
                    border: 'none', borderRadius: 16,
                    color: (anyFilled || saved) ? '#080C1C' : 'rgba(255,255,255,0.2)',
                    fontSize: '1rem', fontWeight: 800,
                    cursor: (anyFilled && !saving) ? 'pointer' : 'not-allowed',
                    boxShadow: (anyFilled && !saved) ? `0 8px 24px ${color}33` : 'none',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={e => { if (anyFilled && !saving) e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
                >
                  {saving ? 'Procesando…' : saved ? '✓ Datos Guardados' : existing ? '✎ Actualizar Periodo' : '✚ Guardar Métricas'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'videos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Quick Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16 }}>
                {videosPorRed.map(r => (
                  <div
                    key={r.key}
                    style={{
                      background: r.total > 0 ? r.bg : 'rgba(255,255,255,0.03)',
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${r.total > 0 ? r.color + '44' : 'rgba(255,255,255,0.05)'}`,
                      borderRadius: 20, padding: '20px', textAlign: 'center', transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{r.emoji}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800, color: r.total > 0 ? r.color : 'rgba(255,255,255,0.2)', lineHeight: 1, marginBottom: 4 }}>
                      {r.total}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>{r.label}</div>
                  </div>
                ))}

                <div style={{
                  background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: `1px solid ${color}33`,
                  borderRadius: 20, padding: '20px', textAlign: 'center', boxShadow: `0 8px 24px ${color}11`
                }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>🎬</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>
                    {totalVideos}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>Total Mes</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'start' }}>
                {/* Video Form */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 28, padding: '32px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                    <span style={{ fontSize: 24 }}>🎥</span>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.55))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Registrar Nuevo Contenido</span>
                  </div>

                  {/* Redes Multi-select */}
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 12, letterSpacing: '0.1em' }}>DESTINO DEL VIDEO</label>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {REDES.map(r => {
                        const active = newVideo.red_social.includes(r.key)
                        return (
                          <button
                            key={r.key}
                            type="button"
                            onClick={() => toggleRedSocial(r.key)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, cursor: 'pointer',
                              border: `1px solid ${active ? r.color : 'rgba(255,255,255,0.1)'}`,
                              background: active ? `${r.color}22` : 'rgba(255,255,255,0.05)',
                              color: active ? r.color : 'rgba(255,255,255,0.5)',
                              fontSize: '0.88rem', fontWeight: active ? 700 : 500, transition: 'all 0.2s'
                            }}
                          >
                            {r.emoji} {r.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 8, letterSpacing: '0.1em' }}>TÍTULO / ETIQUETA</label>
                    <input
                      type="text"
                      value={newVideo.etiqueta}
                      onChange={e => setNewVideo(v => ({ ...v, etiqueta: e.target.value }))}
                      placeholder="ej: Reel Lanzamiento Colección Otoño…"
                      style={{ ...glassInput, fontSize: '1rem', padding: '14px 18px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 8, letterSpacing: '0.1em' }}>CANTIDAD</label>
                      <input
                        type="number" min="1"
                        value={newVideo.cantidad}
                        onChange={e => setNewVideo(v => ({ ...v, cantidad: e.target.value }))}
                        style={{ ...glassInput, fontSize: '1rem', padding: '14px 18px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 8, letterSpacing: '0.1em' }}>FECHA</label>
                      <input
                        type="date"
                        value={newVideo.fecha}
                        onChange={e => setNewVideo(v => ({ ...v, fecha: e.target.value }))}
                        style={{ ...glassInput, fontSize: '1rem', padding: '14px 18px', colorScheme: 'dark' }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddVideo}
                    disabled={savingVideo || !newVideo.etiqueta.trim() || !newVideo.red_social.length}
                    style={{
                      width: '100%', padding: '16px',
                      background: videoSaved ? GREEN : (savingVideo ? 'rgba(255,255,255,0.05)' : color),
                      border: 'none', borderRadius: 16,
                      color: (videoSaved || !savingVideo) ? '#080C1C' : 'rgba(255,255,255,0.2)',
                      fontSize: '1rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {savingVideo ? 'Subiendo…' : videoSaved ? '✓ Agregado Correctamente' : '✚ Registrar Video'}
                  </button>
                </div>

                {/* Video List */}
                {videos.length > 0 ? (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 28, overflow: 'hidden',
                    maxHeight: 600, display: 'flex', flexDirection: 'column'
                  }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>
                      REGISTROS DEL MES ({videos.length})
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                      {videos.map((v, i) => {
                        const redesVideo = REDES.filter(r => Array.isArray(v.red_social) && v.red_social.includes(r.key))
                        return (
                          <div
                            key={v.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px',
                              borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', width: 60, flexShrink: 0 }}>
                              {redesVideo.map(red => (
                                <span key={red.key} title={red.label} style={{ fontSize: '1.2rem' }}>{red.emoji}</span>
                              ))}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {v.etiqueta}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                                {v.fecha ? v.fecha.split('-').reverse().join('/') : 'S/F'}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color }}>×{v.cantidad}</span>
                              <button
                                onClick={() => handleDeleteVideo(v.id)}
                                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '1.1rem', transition: 'color 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.color = RED}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                              >✕</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 40px', border: `1px dashed rgba(255,255,255,0.1)`, borderRadius: 28, color: 'rgba(255,255,255,0.3)' }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>🎬</div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>No hay videos registrados aún.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
