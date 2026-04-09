import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const FLYER_TYPES = [
  { key: 'flyers_storie',     label: 'Storie',                    emoji: '📱' },
  { key: 'flyers_efemeride',  label: 'Efeméride',                 emoji: '📅' },
  { key: 'flyers_reposicion', label: 'Reposición de inventario',  emoji: '📦' },
  { key: 'flyers_descuento',  label: 'Descuentos',                emoji: '🏷️' },
  { key: 'flyers_promocion',  label: 'Promociones 777',               emoji: '📣' },
  { key: 'flyers_cumple',     label: 'Cumpleaños',                emoji: '🎂' },
  { key: 'flyers_otros',      label: 'Otros',                     emoji: '📄' },
]

const EMPTY_FORM = {
  flyers_storie: 0,
  flyers_efemeride: 0,
  flyers_reposicion: 0,
  flyers_descuento: 0,
  flyers_promocion: 0,
  flyers_cumple: 0,
  flyers_otros: 0,
  etiquetas_custom: [],
  colaboracion_video: false,
  colaboracion_video_desc: '',
  fotos_producto_subidas: 0,
  notas: '',
}

function getPeriodo(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function todayISO() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}

function formatDateDisplay(iso) {
  const [y, m, d] = iso.split('-')
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return `${d} de ${months[parseInt(m) - 1]} ${y}`
}

function Counter({ value, onChange, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--bg-elevated)', border: 'none',
          color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
      >
        −
      </button>

      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '1.3rem',
        fontWeight: 600,
        color: 'var(--text-primary)',
        minWidth: 32,
        textAlign: 'center',
        transition: 'color 0.15s',
      }}>
        {value}
      </span>

      <button
        onClick={() => onChange(value + 1)}
        style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--bg-elevated)',
          border: 'none',
          color: 'var(--text-secondary)',
          fontSize: '1.1rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--bg-hover)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'var(--bg-elevated)'
        }}
      >
        +
      </button>
    </div>
  )
}

function ExistingRecordModal({ date, existingCount, onEdit, onNew, onCancel }) {
  const color = '#0eb8d4'

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(7,8,15,0.88)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 24,
        padding: '36px 32px',
        width: '100%',
        maxWidth: 430,
        boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
        animation: 'fadeUp 0.3s ease',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>📋</div>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.3px', marginBottom: 8 }}>
          Ya hay registro para ese día
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 28 }}>
          El <strong style={{ color: 'var(--text-primary)' }}>{formatDateDisplay(date)}</strong> ya tiene
          {existingCount > 1 ? ` ${existingCount} registros cargados.` : ' datos cargados.'}
          <br />
          ¿Querés editar el registro más reciente o agregar uno nuevo?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onEdit} style={{
            padding: '13px',
            background: 'var(--accent)',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 16px var(--accent-glow)',
          }}>
            ✎ Editar registro más reciente
          </button>

          <button onClick={onNew} style={{
            padding: '13px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-bright)',
            borderRadius: 10,
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            ✚ Agregar registro adicional del día
          </button>

          <button onClick={onCancel} style={{
            padding: '10px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
          }}>
            ← Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DisenoIngresarPage() {
  const color = '#0eb8d4'
  const today = todayISO()

  const [selectedDate, setSelectedDate] = useState(today)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [existingRecord, setExistingRecord] = useState(null)
  const [existingCount, setExistingCount] = useState(0)
  const [mode, setMode] = useState(null) // null | 'ask' | 'edit' | 'new'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    checkDayData(selectedDate)
  }, [selectedDate])

  async function checkDayData(date) {
    setLoading(true)
    setSaved(false)
    setMode(null)

    const { data, error } = await supabase
      .from('diseno_grafico_diario')
      .select('*')
      .eq('fecha', date)
      .order('updated_at', { ascending: false })
      .order('id', { ascending: false })

    if (error) {
      alert('Error consultando registros del día: ' + error.message)
      setExistingRecord(null)
      setExistingCount(0)
      setForm({ ...EMPTY_FORM })
      setMode('new')
      setLoading(false)
      return
    }

    if (data && data.length > 0) {
      setExistingRecord(data[0])
      setExistingCount(data.length)
      setMode('ask')
    } else {
      setExistingRecord(null)
      setExistingCount(0)
      setForm({ ...EMPTY_FORM })
      setMode('new')
    }

    setLoading(false)
  }

  function handleEditExisting() {
    const r = existingRecord
    if (!r) return

    setForm({
      flyers_storie:           r.flyers_storie ?? 0,
      flyers_efemeride:        r.flyers_efemeride ?? 0,
      flyers_reposicion:       r.flyers_reposicion ?? 0,
      flyers_descuento:        r.flyers_descuento ?? 0,
      flyers_promocion:        r.flyers_promocion ?? 0,
      flyers_cumple:           r.flyers_cumple ?? 0,
      flyers_otros:            r.flyers_otros ?? 0,
      etiquetas_custom:        r.etiquetas_custom ?? [],
      colaboracion_video:      r.colaboracion_video ?? false,
      colaboracion_video_desc: r.colaboracion_video_desc ?? '',
      fotos_producto_subidas:  r.fotos_producto_subidas ?? 0,
      notas:                   r.notas ?? '',
    })

    setMode('edit')
  }

  function handleAddNew() {
    setForm({ ...EMPTY_FORM })
    setMode('new')
  }

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function addTag() {
    const tag = newTag.trim()
    if (!tag || form.etiquetas_custom.includes(tag)) return
    setField('etiquetas_custom', [...form.etiquetas_custom, tag])
    setNewTag('')
  }

  function removeTag(tag) {
    setField('etiquetas_custom', form.etiquetas_custom.filter(t => t !== tag))
  }

  async function handleSave() {
    setSaving(true)

    const payload = {
      fecha: selectedDate,
      periodo: getPeriodo(selectedDate),
      ...form,
      ingresado_por: 'diseno',
      updated_at: new Date().toISOString(),
    }

    let error

    if (mode === 'edit' && existingRecord) {
      ;({ error } = await supabase
        .from('diseno_grafico_diario')
        .update(payload)
        .eq('id', existingRecord.id))
    } else {
      ;({ error } = await supabase
        .from('diseno_grafico_diario')
        .insert(payload))
    }

    setSaving(false)

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      await checkDayData(selectedDate)
    } else {
      alert('Error al guardar: ' + error.message)
    }
  }

  const totalFlyers = FLYER_TYPES.reduce((s, t) => s + (form[t.key] || 0), 0)

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 600, letterSpacing: '-0.8px', marginBottom: 4 }}>
              Registro diario
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Diseño Gráfico · {formatDateDisplay(selectedDate)}

              {mode === 'edit' && (
                <span style={{
                  marginLeft: 10,
                  fontSize: '0.72rem',
                  background: color + '20',
                  color,
                  border: `1px solid ${color}44`,
                  borderRadius: 99,
                  padding: '2px 10px',
                  fontWeight: 600,
                }}>
                  ✎ Editando registro existente
                </span>
              )}

              {mode === 'new' && existingCount > 0 && (
                <span style={{
                  marginLeft: 10,
                  fontSize: '0.72rem',
                  background: '#f59e0b20',
                  color: '#f59e0b',
                  border: '1px solid #f59e0b44',
                  borderRadius: 99,
                  padding: '2px 10px',
                  fontWeight: 600,
                }}>
                  ✚ Nuevo registro adicional
                </span>
              )}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Fecha:
            </span>

            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={e => setSelectedDate(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: '0.85rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
              }}
            />
          </div>
        </div>
      </div>

      {mode === 'ask' && !loading && (
        <ExistingRecordModal
          date={selectedDate}
          existingCount={existingCount}
          onEdit={handleEditExisting}
          onNew={handleAddNew}
          onCancel={() => setSelectedDate(today)}
        />
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '2px solid var(--border-bright)',
            borderTopColor: color,
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      ) : (mode === 'edit' || mode === 'new') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 4px 16px var(--glass-shadow)',
          }}>
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🎨</span>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Flyers creados hoy</span>
              </div>

              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}>
                Total: {totalFlyers}
              </div>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {FLYER_TYPES.map(type => (
                <div key={type.key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--bg-surface)',
                  border: form[type.key] > 0 ? `1px solid var(--border-bright)` : '1px solid var(--border)',
                  borderRadius: 10,
                  transition: 'all 0.15s',
                  boxShadow: '0 2px 8px var(--glass-shadow)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{type.emoji}</span>
                    <span style={{
                      fontSize: '0.88rem',
                      fontWeight: 500,
                      color: form[type.key] > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}>
                      {type.label}
                    </span>
                  </div>

                  <Counter value={form[type.key]} onChange={v => setField(type.key, v)} color={color} />
                </div>
              ))}

              <div style={{
                padding: '14px 16px',
                background: 'var(--bg-elevated)',
                border: '1px dashed var(--border-bright)',
                borderRadius: 10,
              }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600 }}>
                  Etiquetas personalizadas
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: form.etiquetas_custom.length > 0 ? 10 : 0 }}>
                  {form.etiquetas_custom.map(tag => (
                    <span key={tag} style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: color + '20',
                      color,
                      border: `1px solid ${color}44`,
                      borderRadius: 99,
                      padding: '4px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                    }}>
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color,
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          padding: 0,
                          lineHeight: 1
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTag()}
                    placeholder="Nueva etiqueta… (Enter para agregar)"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)'
                    }}
                  />

                  <button
                    onClick={addTag}
                    disabled={!newTag.trim()}
                    style={{
                      padding: '8px 14px',
                      background: newTag.trim() ? color : 'var(--bg-elevated)',
                      border: 'none',
                      borderRadius: 8,
                      color: newTag.trim() ? '#fff' : 'var(--text-muted)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '20px 24px',
            transition: 'border-color 0.2s',
            boxShadow: '0 4px 16px var(--glass-shadow)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.colaboracion_video ? 16 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🎬</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Colaboración en video</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    ¿Participaste en creación de contenido de video hoy?
                  </div>
                </div>
              </div>

              <button
                onClick={() => setField('colaboracion_video', !form.colaboracion_video)}
                style={{
                  width: 52,
                  height: 28,
                  borderRadius: 99,
                  background: form.colaboracion_video ? color : 'var(--bg-elevated)',
                  border: `1px solid ${form.colaboracion_video ? color : 'var(--border-bright)'}`,
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 3,
                  left: form.colaboracion_video ? 26 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }} />
              </button>
            </div>

            {form.colaboracion_video && (
              <textarea
                value={form.colaboracion_video_desc}
                onChange={e => setField('colaboracion_video_desc', e.target.value)}
                placeholder="Describí brevemente la colaboración…"
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  background: 'var(--bg-elevated)',
                  border: `1px solid ${color}33`,
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>

          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '20px 24px',
            boxShadow: '0 4px 16px var(--glass-shadow)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>📸</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Fotos de producto</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Fotos tomadas y subidas a la nube hoy
                  </div>
                </div>
              </div>

              <Counter value={form.fotos_producto_subidas} onChange={v => setField('fotos_producto_subidas', v)} color={color} />
            </div>
          </div>

          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '20px 24px',
            boxShadow: '0 4px 16px var(--glass-shadow)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>📝</span>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Notas del día</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(opcional)</span>
            </div>

            <textarea
              value={form.notas}
              onChange={e => setField('notas', e.target.value)}
              placeholder="Observaciones del día…"
              rows={2}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '14px 36px',
                background: saved ? '#059669' : 'var(--accent)',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: saved ? '0 4px 20px #05966944' : '0 4px 20px var(--accent-glow)',
                transition: 'all 0.2s',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={e => !saving && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {saving
                ? 'Guardando…'
                : saved
                  ? '✓ Guardado'
                  : mode === 'edit'
                    ? '✎ Actualizar registro'
                    : '✚ Guardar registro del día'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
