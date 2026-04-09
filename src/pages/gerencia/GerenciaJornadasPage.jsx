import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const accentColor = '#C084FC' // Purple 400 - Gerencia Theme

const TIPOS_APOYO = [
  { key: 'logistica',    label: 'Logística y organización',   emoji: '📦' },
  { key: 'comunicacion', label: 'Comunicación y difusión',    emoji: '📢' },
  { key: 'diseno',       label: 'Diseño de materiales',       emoji: '🎨' },
  { key: 'fotografia',   label: 'Registro fotográfico',       emoji: '📸' },
  { key: 'sistemas',     label: 'Soporte técnico / sistemas', emoji: '🖥️' },
  { key: 'coordinacion', label: 'Coordinación de personal',   emoji: '👥' },
]

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function getPeriodo(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`
}
function todayISO() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`
}
function formatDate(iso) {
  if (!iso) return ''
  const [y,m,d] = iso.split('-')
  return `${d}/${m}/${y}`
}
function formatMoney(n) {
  if (!n && n !== 0) return '—'
  return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0 })
}

const EMPTY_FORM = { fecha: todayISO(), nombre: '', tipo_apoyo: [], gasto_total: '', observaciones: '' }

function JornadaForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? {
    fecha: initial.fecha || todayISO(),
    nombre: initial.nombre || '',
    tipo_apoyo: initial.tipo_apoyo || [],
    gasto_total: initial.gasto_total ?? '',
    observaciones: initial.observaciones || '',
  } : { ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  function toggleTipo(key) {
    setForm(f => ({
      ...f,
      tipo_apoyo: f.tipo_apoyo.includes(key)
        ? f.tipo_apoyo.filter(t => t !== key)
        : [...f.tipo_apoyo, key],
    }))
  }

  async function handleSave() {
    if (!form.nombre.trim() || !form.fecha) return
    setSaving(true)
    await onSave({
      ...form,
      periodo: getPeriodo(form.fecha),
      gasto_total: form.gasto_total !== '' ? parseFloat(form.gasto_total) : 0,
    })
    setSaving(false)
  }

  const inputStyle = {
    width: '100%', padding: '14px 18px', fontSize: '0.95rem',
    background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 14, color: '#fff', outline: 'none', transition: 'all 0.3s',
  }
  const labelStyle = {
    display: 'block', fontSize: '0.75rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.4)', marginBottom: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
  }

  return (
    <div className="animate-fadeUp" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 32, padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <span style={{ fontSize: 24 }}>🏥</span>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', letterSpacing: '-0.5px' }}>Identificación de la Jornada</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 24 }}>
          <div>
            <label style={labelStyle}>Denominación Operativa *</label>
            <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="ej: Operativo integral barrio norte" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Fecha de Ejecución *</label>
            <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} style={inputStyle} />
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 32, padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 24 }}>🤝</span>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', letterSpacing: '-0.5px' }}>Áreas de Apoyo Involucradas</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {TIPOS_APOYO.map(tipo => {
            const active = form.tipo_apoyo.includes(tipo.key)
            return (
              <button key={tipo.key} onClick={() => toggleTipo(tipo.key)} style={{
                padding: '14px 18px', borderRadius: 16, cursor: 'pointer',
                background: active ? `${accentColor}22` : 'rgba(255, 255, 255, 0.05)',
                border: active ? `1px solid ${accentColor}66` : '1px solid rgba(255,255,255,0.08)',
                color: active ? accentColor : 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.85rem', fontWeight: active ? 800 : 500,
                display: 'flex', alignItems: 'center', gap: 12,
                textAlign: 'left', transition: 'all 0.2s',
                boxShadow: active ? `0 4px 12px ${accentColor}11` : 'none'
              }}>
                <span style={{ fontSize: 18 }}>{tipo.emoji}</span>
                <span style={{ flex: 1 }}>{tipo.label}</span>
                {active && <span style={{ fontSize: '0.9rem' }}>✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 32, padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 24 }}>💰</span>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', letterSpacing: '-0.5px' }}>Inversión Estimada</span>
          </div>
          <input type="number" value={form.gasto_total}
            onChange={e => setForm(f => ({ ...f, gasto_total: e.target.value }))}
            placeholder="$ 0.00"
            style={{ ...inputStyle, fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: form.gasto_total ? '#10B981' : 'rgba(255,255,255,0.2)' }} />
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 32, padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 24 }}>📝</span>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', letterSpacing: '-0.5px' }}>Bitácora / Notas</span>
          </div>
          <textarea value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
            placeholder="Anotaciones relevantes del despliegue..." rows={2}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 40px' }}>
        <button onClick={onCancel} style={{
          padding: '14px 28px', background: 'transparent',
          border: '1px solid rgba(255,255,255,0.2)', borderRadius: 16,
          color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer',
        }}>CANCELAR</button>
        <button onClick={handleSave} disabled={saving || !form.nombre.trim()} style={{
          padding: '14px 40px',
          background: saving || !form.nombre.trim() ? 'rgba(255,255,255,0.05)' : accentColor,
          border: 'none', borderRadius: 16,
          color: saving || !form.nombre.trim() ? 'rgba(255,255,255,0.2)' : '#080C1C',
          fontSize: '0.9rem', fontWeight: 900,
          cursor: saving || !form.nombre.trim() ? 'not-allowed' : 'pointer',
          boxShadow: !saving && form.nombre.trim() ? `0 8px 32px ${accentColor}55` : 'none',
          transition: 'all 0.3s',
        }}>
          {saving ? 'PROCESANDO...' : initial ? 'ACTUALIZAR REGISTRO' : 'GUARDAR JORNADA'}
        </button>
      </div>
    </div>
  )
}

export default function GerenciaJornadasPage() {
  const now = new Date()
  const [year, setYear]       = useState(now.getFullYear())
  const [month, setMonth]     = useState(now.getMonth())
  const [jornadas, setJornadas] = useState([])
  const [loading, setLoading]   = useState(true)
  const [view, setView]         = useState('list')
  const [editing, setEditing]   = useState(null)

  const periodo = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  useEffect(() => { loadJornadas() }, [year, month])

  async function loadJornadas() {
    setLoading(true)
    const { data } = await supabase
      .from('jornadas_medicas').select('*')
      .eq('periodo', periodo).order('fecha', { ascending: false })
    setJornadas(data || [])
    setLoading(false)
  }

  async function handleSave(payload) {
    let res
    if (editing) {
      res = await supabase.from('jornadas_medicas').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id)
    } else {
      res = await supabase.from('jornadas_medicas').insert({ ...payload, ingresado_por: 'gerencia' })
    }
    if (!res.error) { setView('list'); setEditing(null); loadJornadas() }
    else alert('Error: ' + res.error.message)
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar registro de esta jornada?')) return
    await supabase.from('jornadas_medicas').delete().eq('id', id)
    loadJornadas()
  }

  const totalGasto = jornadas.reduce((s, j) => s + (j.gasto_total || 0), 0)

  if (view !== 'list') {
    return (
      <div className="animate-fadeIn">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ 
            fontSize:'2.5rem', fontWeight: 900, letterSpacing:'-2px', marginBottom:4,
            background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.55))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {editing ? 'Modificar Registro' : 'Nueva Jornada Médica'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', fontWeight: 500 }}>Gerencia · Registro de apoyo operativo y logístico</p>
        </div>
        <JornadaForm initial={editing} onSave={handleSave} onCancel={() => { setView('list'); setEditing(null) }} />
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, marginBottom: 32 }}>
        <div>
          <h1 style={{ 
            fontSize:'2.5rem', fontWeight: 900, letterSpacing:'-2px', marginBottom:4,
            background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.55))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Operativos Médicos
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', fontWeight: 500 }}>Gerencia · Historial de jornadas y gestión de apoyos</p>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 4, 
            border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center' 
          }}>
            <button onClick={() => month===0 ? (setYear(y=>y-1), setMonth(11)) : setMonth(m=>m-1)} 
              style={{ width: 40, height: 40, borderRadius: 12, background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>‹</button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#fff', minWidth: 140, textAlign: 'center', fontWeight: 800 }}>
              {MONTH_NAMES[month].toUpperCase()} {year}
            </span>
            <button onClick={() => isCurrentMonth ? null : month===11 ? (setYear(y=>y+1), setMonth(0)) : setMonth(m=>m+1)} 
              disabled={isCurrentMonth} style={{ 
                width: 40, height: 40, borderRadius: 12, background: 'transparent', border: 'none', 
                color: isCurrentMonth ? 'rgba(255,255,255,0.2)' : '#fff', fontSize: '1.2rem', 
                cursor: isCurrentMonth ? 'not-allowed' : 'pointer' 
              }}>›</button>
          </div>
          <button onClick={() => { setEditing(null); setView('new') }} style={{
            padding:'14px 24px', background: accentColor,
            border:'none', borderRadius: 16, color:'#080C1C',
            fontSize:'0.85rem', fontWeight: 900, cursor:'pointer',
            boxShadow: `0 8px 32px ${accentColor}44`,
          }}>✚ NUEVA JORNADA</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:100 }}>
          <div className="animate-spin" style={{ width:48, height:48, borderRadius:'50%', border:'4px solid rgba(255,255,255,0.1)', borderTopColor: accentColor }} />
        </div>
      ) : (
        <>
          {jornadas.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:20, marginBottom:32 }}>
              {[
                { label:'Despliegues este mes', value:jornadas.length, icon:'🏥', c:accentColor },
                { label:'Inversión proyectada', value:formatMoney(totalGasto), icon:'💰', c:'#10B981' },
                { label:'Media por operativo', value:jornadas.length?formatMoney(Math.round(totalGasto/jornadas.length)):'—', icon:'📊', c:'#3B82F6' },
              ].map((k,i) => (
                <div key={i} className="animate-fadeUp" style={{
                  animationDelay:`${i*0.1}s`, background:'rgba(255, 255, 255, 0.07)',
                  backdropFilter: 'blur(28px)', border:'1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius:24, padding:'28px', position:'relative', overflow:'hidden',
                  boxShadow:'0 8px 32px rgba(0,0,0,0.15)'
                }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:k.c, opacity:0.8 }} />
                  <div style={{ fontSize:28, marginBottom:16, filter: `drop-shadow(0 0 8px ${k.c}44)` }}>{k.icon}</div>
                  <div style={{ 
                    fontFamily:'var(--font-mono)', fontSize:'2rem', fontWeight: 800, 
                    color:'#fff', letterSpacing:'-1px', lineHeight:1, marginBottom:8 
                  }}>{k.value}</div>
                  <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k.label}</div>
                </div>
              ))}
            </div>
          )}

          {jornadas.length === 0 ? (
            <div style={{ 
              textAlign:'center', padding:'80px 40px', border:`2px dashed rgba(255,255,255,0.1)`, 
              borderRadius:32, background:'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)'
            }}>
              <div style={{ fontSize:64, marginBottom:24, filter: 'grayscale(1) opacity(0.5)' }}>🏥</div>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'1rem', marginBottom:32 }}>No se han registrado operativos para {MONTH_NAMES[month]} {year}</p>
              <button 
                onClick={() => setView('new')} 
                style={{ 
                  padding:'14px 32px', background: 'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', 
                  borderRadius:16, color:'#fff', fontWeight: 800, fontSize:'0.9rem', cursor:'pointer' 
                }}
              >REGISTRAR PRIMERA JORNADA →</button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {jornadas.map((j,i) => (
                <div key={j.id} className="animate-fadeUp" style={{
                  animationDelay:`${i*0.06}s`,
                  background:'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(28px)',
                  border:'1px solid rgba(255, 255, 255, 0.1)', borderRadius:24, padding:'24px 32px',
                  transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 30px rgba(0,0,0,0.2)` }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:24, flexWrap:'wrap' }}>
                    <div style={{ flex:1, minWidth:250 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.8rem', color: accentColor, fontWeight: 800, background: `${accentColor}15`, padding: '2px 10px', borderRadius: 8 }}>{formatDate(j.fecha)}</span>
                        {j.gasto_total > 0 && (
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.8rem', fontWeight: 800, color:'#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 10px', borderRadius: 8 }}>{formatMoney(j.gasto_total)}</span>
                        )}
                      </div>
                      <h3 style={{ fontSize:'1.2rem', fontWeight: 800, color:'#fff', margin:'0 0 12px', letterSpacing: '-0.5px' }}>{j.nombre}</h3>
                      
                      {j.tipo_apoyo?.length > 0 && (
                        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom: j.observaciones ? 12 : 0 }}>
                          {j.tipo_apoyo.map(t => {
                            const tipo = TIPOS_APOYO.find(x => x.key === t)
                            return tipo ? (
                              <span key={t} style={{ fontSize:'0.7rem', background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.6)', border:`1px solid rgba(255,255,255,0.1)`, borderRadius:30, padding:'3px 12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {tipo.emoji} {tipo.label}
                              </span>
                            ) : null
                          })}
                        </div>
                      )}
                      
                      {j.observaciones && (
                        <p style={{ fontSize:'0.9rem', color:'rgba(255,255,255,0.4)', fontStyle:'italic', margin:0, borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: 12 }}>{j.observaciones}</p>
                      )}
                    </div>
                    
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <button onClick={() => { setEditing(j); setView('edit') }} style={{ width: 44, height: 44, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, color:'#fff', fontSize:'1rem', cursor:'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>✎</button>
                      <button onClick={() => handleDelete(j.id)} style={{ width: 44, height: 44, background:'rgba(239, 68, 68, 0.1)', border:'1px solid rgba(239, 68, 68, 0.2)', borderRadius:14, color:'#FCA5A5', fontSize:'1rem', cursor:'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#fff' }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#FCA5A5' }}>✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
