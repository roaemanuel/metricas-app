import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const color = '#9b59f7'

const TIPOS_APOYO = [
  { key: 'logistica',    label: 'Logística y organización',   emoji: '📦' },
  { key: 'comunicacion', label: 'Comunicación y difusión',    emoji: '📢' },
  { key: 'diseno',       label: 'Diseño de materiales',       emoji: '🎨' },
  { key: 'fotografia',   label: 'Registro fotográfico',       emoji: '📸' },
  { key: 'sistemas',     label: 'Soporte técnico / sistemas', emoji: '🖥️' },
  { key: 'coordinacion', label: 'Coordinación de personal',   emoji: '👥' },
]

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
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

const EMPTY = { fecha: todayISO(), nombre: '', tipo_apoyo: [], gasto_total: '', observaciones: '' }

function JornadaForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? {
    fecha: initial.fecha || todayISO(),
    nombre: initial.nombre || '',
    tipo_apoyo: initial.tipo_apoyo || [],
    gasto_total: initial.gasto_total ?? '',
    observaciones: initial.observaciones || '',
  } : { ...EMPTY })
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

  const inp = {
    width: '100%', padding: '10px 13px', fontSize: '0.88rem',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 9, color: 'var(--text-primary)', boxSizing: 'border-box',
  }
  const lbl = {
    display: 'block', fontSize: '0.72rem', fontWeight: 600,
    color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 24px', boxShadow: '0 4px 16px var(--glass-shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <span style={{ fontSize: 18 }}>🏥</span>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Datos de la jornada</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 14 }}>
          <div>
            <label style={lbl}>Nombre *</label>
            <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="ej: Jornada oftalmológica barrio norte" style={inp} />
          </div>
          <div>
            <label style={lbl}>Fecha *</label>
            <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} style={inp} />
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 24px', boxShadow: '0 4px 16px var(--glass-shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 18 }}>🤝</span>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Tipo de apoyo brindado</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(puede ser más de uno)</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
          {TIPOS_APOYO.map(tipo => {
            const active = form.tipo_apoyo.includes(tipo.key)
            return (
              <button key={tipo.key} onClick={() => toggleTipo(tipo.key)} style={{
                padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                background: active ? color + '22' : 'var(--bg-elevated)',
                border: `1px solid ${active ? color + '66' : 'var(--border)'}`,
                color: active ? color : 'var(--text-secondary)',
                fontSize: '0.82rem', fontWeight: active ? 700 : 400,
                display: 'flex', alignItems: 'center', gap: 8,
                textAlign: 'left', transition: 'all 0.15s',
              }}>
                <span>{tipo.emoji}</span>
                <span style={{ flex: 1 }}>{tipo.label}</span>
                {active && <span style={{ fontSize: '0.7rem' }}>✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px', boxShadow: '0 4px 16px var(--glass-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>💰</span>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Gasto total</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(opcional)</span>
          </div>
          <input type="number" value={form.gasto_total}
            onChange={e => setForm(f => ({ ...f, gasto_total: e.target.value }))}
            placeholder="$ 0"
            style={{ ...inp, fontSize: '1.3rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: form.gasto_total ? '#10b981' : 'var(--text-muted)' }} />
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px', boxShadow: '0 4px 16px var(--glass-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>📝</span>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Observaciones</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(opcional)</span>
          </div>
          <textarea value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
            placeholder="Notas relevantes de la jornada…" rows={3}
            style={{ ...inp, resize: 'none', lineHeight: 1.5 }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 }}>
        <button onClick={onCancel} style={{
          padding: '12px 24px', background: 'transparent',
          border: '1px solid var(--border)', borderRadius: 10,
          color: 'var(--text-secondary)', fontSize: '0.88rem', cursor: 'pointer',
        }}>← Volver</button>
        <button onClick={handleSave} disabled={saving || !form.nombre.trim()} style={{
          padding: '12px 32px',
          background: saving || !form.nombre.trim() ? 'var(--bg-elevated)' : 'var(--accent)',
          border: 'none', borderRadius: 10,
          color: saving || !form.nombre.trim() ? 'var(--text-muted)' : '#fff',
          fontSize: '0.9rem', fontWeight: 600,
          cursor: saving || !form.nombre.trim() ? 'not-allowed' : 'pointer',
          boxShadow: !saving && form.nombre.trim() ? '0 4px 20px var(--accent-glow)' : 'none',
          transition: 'all 0.2s',
        }}>
          {saving ? 'Guardando…' : initial ? '✎ Actualizar jornada' : '✚ Guardar jornada'}
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
    let result
    if (editing) {
      result = await supabase.from('jornadas_medicas').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id)
    } else {
      result = await supabase.from('jornadas_medicas').insert({ ...payload, ingresado_por: 'gerencia' })
    }
    if (!result.error) { setView('list'); setEditing(null); loadJornadas() }
    else alert('Error: ' + result.error.message)
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta jornada?')) return
    await supabase.from('jornadas_medicas').delete().eq('id', id)
    loadJornadas()
  }

  const totalGasto = jornadas.reduce((s, j) => s + (j.gasto_total || 0), 0)

  if (view !== 'list') {
    return (
      <div className="animate-fadeIn">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 600, letterSpacing: '-0.8px', marginBottom: 4 }}>
            {editing ? 'Editar jornada' : 'Nueva jornada médica'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Gerencia · registro de apoyo a jornada médica</p>
        </div>
        <JornadaForm initial={editing} onSave={handleSave} onCancel={() => { setView('list'); setEditing(null) }} />
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 600, letterSpacing: '-0.8px', marginBottom: 4 }}>Jornadas médicas</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Registro de apoyo y gastos por jornada</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => { if (month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }}
            style={{ width:34,height:34,borderRadius:8,background:'var(--bg-elevated)',border:'1px solid var(--border)',color:'var(--text-secondary)',fontSize:'1rem',cursor:'pointer' }}>‹</button>
          <span style={{ fontFamily:'var(--font-mono)',fontSize:'0.82rem',color:'var(--text-primary)',minWidth:130,textAlign:'center' }}>{MONTHS_ES[month]} {year}</span>
          <button onClick={() => { if(isCurrentMonth)return; if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }}
            disabled={isCurrentMonth} style={{ width:34,height:34,borderRadius:8,background:'var(--bg-elevated)',border:'1px solid var(--border)',color:isCurrentMonth?'var(--text-muted)':'var(--text-secondary)',fontSize:'1rem',cursor:isCurrentMonth?'not-allowed':'pointer' }}>›</button>
          <button onClick={() => { setEditing(null); setView('new') }} style={{
            padding:'8px 18px',marginLeft:8,background:'var(--accent)',
            border:'none',borderRadius:8,color:'#fff',
            fontSize:'0.82rem',fontWeight: 600,cursor:'pointer',
            boxShadow:'0 2px 12px var(--accent-glow)',
          }}>✚ Nueva jornada</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex',justifyContent:'center',padding:60 }}>
          <div style={{ width:28,height:28,borderRadius:'50%',border:'2px solid var(--border-bright)',borderTopColor:color,animation:'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <>
          {jornadas.length > 0 && (
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:24 }}>
              {[
                { label:'Jornadas este mes', value:jornadas.length, icon:'🏥', c:color },
                { label:'Gasto total del mes', value:formatMoney(totalGasto), icon:'💰', c:'#10b981' },
                { label:'Promedio por jornada', value:jornadas.length?formatMoney(Math.round(totalGasto/jornadas.length)):'—', icon:'📊', c:'#3b82f6' },
              ].map((k,i) => (
                <div key={i} className="animate-fadeUp" style={{
                  animationDelay:`${i*0.06}s`,background:'var(--bg-surface)',
                  border:'1px solid var(--border)',borderRadius:14,
                  padding:'20px 22px',position:'relative',overflow:'hidden',
                  boxShadow:'0 4px 20px var(--glass-shadow)',
                }}>
                  <div style={{ position:'absolute',top:0,left:0,right:0,height:3,background:k.c,opacity:0.9 }} />
                  <div style={{ fontSize:22,marginBottom:10 }}>{k.icon}</div>
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:'1.7rem',fontWeight: 600,color:'var(--text-primary)',letterSpacing:'-1px',lineHeight:1,marginBottom:6 }}>{k.value}</div>
                  <div style={{ fontSize:'0.8rem',color:'var(--text-secondary)' }}>{k.label}</div>
                </div>
              ))}
            </div>
          )}

          {jornadas.length === 0 ? (
            <div style={{ textAlign:'center',padding:'60px 24px',border:`1px dashed ${color}44`,borderRadius:16,background:'var(--bg-surface)' }}>
              <div style={{ fontSize:40,marginBottom:14 }}>🏥</div>
              <p style={{ color:'var(--text-secondary)',marginBottom:20 }}>No hay jornadas para {MONTHS_ES[month]} {year}</p>
              <button onClick={() => setView('new')} style={{ padding:'12px 28px',background:'var(--accent)',border:'none',borderRadius:10,color:'#fff',fontWeight: 600,fontSize:'0.88rem',cursor:'pointer',boxShadow:'0 4px 16px var(--accent-glow)' }}>
                Registrar primera jornada →
              </button>
            </div>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              {jornadas.map((j,i) => (
                <div key={j.id} className="animate-fadeUp" style={{
                  animationDelay:`${i*0.04}s`,
                  background:'var(--bg-surface)',border:'1px solid var(--border)',
                  borderRadius:14,padding:'18px 22px',
                  borderLeft:`3px solid ${color}88`,
                  boxShadow:'0 4px 16px var(--glass-shadow)',
                }}>
                  <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap' }}>
                    <div style={{ flex:1,minWidth:0 }}>
                      <span style={{ fontFamily:'var(--font-mono)',fontSize:'0.73rem',color:'var(--text-muted)' }}>{formatDate(j.fecha)}</span>
                      <h3 style={{ fontSize:'0.95rem',fontWeight: 600,color:'var(--text-primary)',margin:'5px 0 8px' }}>{j.nombre}</h3>
                      {j.tipo_apoyo?.length > 0 && (
                        <div style={{ display:'flex',flexWrap:'wrap',gap:5,marginBottom: j.observaciones ? 8 : 0 }}>
                          {j.tipo_apoyo.map(t => {
                            const tipo = TIPOS_APOYO.find(x => x.key === t)
                            return tipo ? (
                              <span key={t} style={{ fontSize:'0.72rem',background:color+'15',color,border:`1px solid ${color}33`,borderRadius:99,padding:'2px 9px' }}>
                                {tipo.emoji} {tipo.label}
                              </span>
                            ) : null
                          })}
                        </div>
                      )}
                      {j.observaciones && (
                        <p style={{ fontSize:'0.8rem',color:'var(--text-muted)',fontStyle:'italic',margin:0 }}>{j.observaciones}</p>
                      )}
                    </div>
                    <div style={{ display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
                      {j.gasto_total > 0 && (
                        <span style={{ fontFamily:'var(--font-mono)',fontSize:'1.05rem',fontWeight: 600,color:'#10b981' }}>{formatMoney(j.gasto_total)}</span>
                      )}
                      <button onClick={() => { setEditing(j); setView('edit') }} style={{ padding:'6px 11px',background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:7,color:'var(--text-secondary)',fontSize:'0.75rem',cursor:'pointer' }}>✎</button>
                      <button onClick={() => handleDelete(j.id)} style={{ padding:'6px 11px',background:'#dc262612',border:'1px solid #dc262630',borderRadius:7,color:'#f87171',fontSize:'0.75rem',cursor:'pointer' }}>✕</button>
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
