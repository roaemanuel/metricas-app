import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const accentColor = '#93C5FD' // Design theme color
const GREEN = '#10b981'
const RED = '#f0436a'

const FLYER_TYPES = [
  { key: 'flyers_storie',     label: 'Storie',                    emoji: '📱' },
  { key: 'flyers_efemeride',  label: 'Efeméride',                 emoji: '📅' },
  { key: 'flyers_reposicion', label: 'Reposición de inventario',  emoji: '📦' },
  { key: 'flyers_descuento',  label: 'Descuentos',                emoji: '🏷️' },
  { key: 'flyers_promocion',  label: 'Promociones',               emoji: '📣' },
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff', fontSize: '1.2rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
        }}
      >
        −
      </button>

      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 800,
        color: value > 0 ? color : 'rgba(255, 255, 255, 0.2)',
        minWidth: 32, textAlign: 'center', transition: 'all 0.3s',
      }}>
        {value}
      </span>

      <button
        onClick={() => onChange(value + 1)}
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff', fontSize: '1.2rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
          e.currentTarget.style.borderColor = color
          e.currentTarget.style.boxShadow = `0 0 15px ${color}33`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        +
      </button>
    </div>
  )
}

function ExistingRecordModal({ date, existingCount, onEdit, onNew, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(8,12,28,0.4)',
      backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, animation: 'fadeIn 0.3s ease', padding: 24,
    }}>
      <div className="animate-fadeUp" style={{
        background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)',
        border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 32,
        padding: '48px 40px', width: '100%', maxWidth: 450,
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4)', textAlign: 'center',
        position: 'relative'
      }}>
        {/* Top Accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
        
        <div style={{ fontSize: 48, marginBottom: 24, filter: `drop-shadow(0 0 15px ${accentColor}44)` }}>📝</div>

        <h2 style={{ 
          fontSize: '1.4rem', fontWeight: 800, marginBottom: 12, color: '#fff',
          letterSpacing: '-1px'
        }}>
          Registro existente
        </h2>

        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 36 }}>
          El <strong style={{ color: '#fff' }}>{formatDateDisplay(date)}</strong> ya tiene
          {existingCount > 1 ? ` ${existingCount} registros cargados.` : ' datos cargados.'}
          <br /><br />
          ¿Deseas editar el registro más reciente o agregar uno nuevo para esta misma jornada?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={onEdit} style={{
            padding: '16px', background: accentColor, border: 'none', borderRadius: 16,
            color: '#080C1C', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
            boxShadow: `0 8px 20px ${accentColor}44`, transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            ✎ Editar registro actual
          </button>

          <button onClick={onNew} style={{
            padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, color: '#fff', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            ✚ Crear nuevo registro adicional
          </button>

          <button onClick={onCancel} style={{
            marginTop: 8, padding: '8px', background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600
          }}>
            Cancelar y volver
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DisenoIngresarPage() {
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

    if (error) {
      alert('Error consultando registros: ' + error.message)
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

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const addTag = () => {
    const tag = newTag.trim()
    if (!tag || form.etiquetas_custom.includes(tag)) return
    setField('etiquetas_custom', [...form.etiquetas_custom, tag])
    setNewTag('')
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
      ({ error } = await supabase.from('diseno_grafico_diario').update(payload).eq('id', existingRecord.id))
    } else {
      ({ error } = await supabase.from('diseno_grafico_diario').insert(payload))
    }

    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      await checkDayData(selectedDate)
    } else alert('Error al guardar: ' + error.message)
  }

  const totalFlyers = FLYER_TYPES.reduce((s, t) => s + (form[t.key] || 0), 0)

  const glassInputStyle = {
    width: '100%', padding: '14px 18px', fontSize: '1rem',
    background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 16, color: '#fff', boxSizing: 'border-box', outline: 'none', transition: 'all 0.2s'
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <h1 style={{ 
            fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-2px', marginBottom: 4,
            background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.55))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Registro Diario
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', fontWeight: 500 }}>
            {formatDateDisplay(selectedDate)}
            {mode === 'edit' && <span style={{ marginLeft: 12, fontSize: '0.75rem', background: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}44`, borderRadius: 99, padding: '3px 12px', fontWeight: 800, textTransform: 'uppercase' }}>✎ Editando Registro</span>}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em' }}>CAMBIAR FECHA:</span>
          <input
            type="date" value={selectedDate} max={today} onChange={e => setSelectedDate(e.target.value)}
            style={{ ...glassInputStyle, width: 'auto', padding: '10px 16px', fontSize: '0.9rem', colorScheme: 'dark' }}
          />
        </div>
      </div>

      {mode === 'ask' && !loading && (
        <ExistingRecordModal date={selectedDate} existingCount={existingCount} onEdit={handleEditExisting} onNew={() => { setForm({ ...EMPTY_FORM }); setMode('new') }} onCancel={() => setSelectedDate(today)} />
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div className="animate-spin" style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: accentColor }} />
        </div>
      ) : (mode === 'edit' || mode === 'new') && (
        <div className="animate-fadeUp" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Production Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', 
            border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 28, overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>🎨</span>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>Formatos Diseñados</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 800, color: accentColor, textShadow: `0 0 15px ${accentColor}44` }}>
                Total: {totalFlyers}
              </div>
            </div>

            <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {FLYER_TYPES.map(type => (
                <div key={type.key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px',
                  background: form[type.key] > 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${form[type.key] > 0 ? accentColor + '66' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 18, transition: 'all 0.3s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 24, filter: `drop-shadow(0 0 8px ${form[type.key] > 0 ? accentColor : 'transparent'})` }}>{type.emoji}</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: form[type.key] > 0 ? '#fff' : 'rgba(255,255,255,0.4)' }}>{type.label}</span>
                  </div>
                  <Counter value={form[type.key]} onChange={v => setField(type.key, v)} color={accentColor} />
                </div>
              ))}
            </div>

            {/* Tags Cloud */}
            <div style={{ padding: '0 32px 32px' }}>
               <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 20, padding: 20 }}>
                 <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, marginBottom: 16, letterSpacing: '0.1em' }}>ETIQUETAS Y CONCEPTOS</div>
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: form.etiquetas_custom.length > 0 ? 16 : 0 }}>
                    {form.etiquetas_custom.map(tag => (
                      <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}33`, borderRadius: 12, padding: '6px 14px', fontSize: '0.85rem', fontWeight: 700 }}>
                        {tag} <button onClick={() => setField('etiquetas_custom', form.etiquetas_custom.filter(t => t !== tag))} style={{ background: 'none', border: 'none', color: accentColor, cursor: 'pointer', padding: 0 }}>✕</button>
                      </span>
                    ))}
                 </div>
                 <div style={{ display: 'flex', gap: 12 }}>
                    <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()} placeholder="Escribe un concepto y pulsa Enter..." style={{ ...glassInputStyle, flex: 1, padding: '12px 16px', fontSize: '0.9rem' }} />
                    <button onClick={addTag} style={{ padding: '0 24px', background: accentColor, border: 'none', borderRadius: 14, color: '#080C1C', fontWeight: 800, cursor: 'pointer' }}>+</button>
                 </div>
               </div>
            </div>
          </div>

          {/* Details & Multimedia */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
             {/* Videos */}
             <div style={{ background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 28, padding: 28, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)' }}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: form.colaboracion_video ? `${accentColor}22` : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎬</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>Apoyo en Video</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Edición o asistencia</div>
                    </div>
                 </div>
                 <button onClick={() => setField('colaboracion_video', !form.colaboracion_video)} style={{ width: 56, height: 30, borderRadius: 99, background: form.colaboracion_video ? accentColor : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'all 0.3s' }}>
                    <div style={{ position: 'absolute', top: 4, left: form.colaboracion_video ? 30 : 4, width: 22, height: 22, borderRadius: '50%', background: form.colaboracion_video ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.3s' }} />
                 </button>
               </div>
               {form.colaboracion_video && (
                 <textarea value={form.colaboracion_video_desc} onChange={e => setField('colaboracion_video_desc', e.target.value)} placeholder="¿En qué consistió tu colaboración?" rows={2} style={{ ...glassInputStyle, fontSize: '0.9rem', resize: 'none' }} />
               )}
             </div>

             {/* Photos */}
             <div style={{ background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 28, padding: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: form.fotos_producto_subidas > 0 ? `${accentColor}22` : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📸</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>Fotos de Producto</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Capturas y retoques</div>
                  </div>
               </div>
               <Counter value={form.fotos_producto_subidas} onChange={v => setField('fotos_producto_subidas', v)} color={accentColor} />
             </div>
          </div>

          {/* Notes */}
          <div style={{ background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 28, padding: 28, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>📝</span>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Notas de la Jornada</span>
            </div>
            <textarea value={form.notas} onChange={e => setField('notas', e.target.value)} placeholder="Observaciones, contratiempos o detalles de la producción..." rows={3} style={{ ...glassInputStyle, fontSize: '1rem', resize: 'none', lineHeight: 1.6 }} />
          </div>

          {/* Action Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12, paddingBottom: 40 }}>
            <button
              onClick={handleSave} disabled={saving}
              style={{
                padding: '18px 64px',
                background: saved ? GREEN : accentColor,
                border: 'none', borderRadius: 20,
                color: '#080C1C', fontSize: '1.1rem', fontWeight: 900,
                cursor: 'pointer', boxShadow: saved ? `0 10px 30px ${GREEN}44` : `0 10px 30px ${accentColor}44`,
                transition: 'all 0.3s'
              }}
              onMouseEnter={e => !saving && (e.currentTarget.style.transform = 'translateY(-6px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
            >
              {saving ? 'Guardando...' : saved ? '✓ Registro Actualizado' : mode === 'edit' ? '✎ Actualizar Jornada' : '✚ Guardar Producción Hoy'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
