import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const color = '#f0436a'

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const OBJETIVOS = [
  { key: 'awareness',  label: 'Awareness',  emoji: '👁️',  c: '#8b5cf6' },
  { key: 'trafico',    label: 'Tráfico',    emoji: '🔗',  c: '#3b82f6' },
  { key: 'ventas',     label: 'Ventas',     emoji: '💰',  c: '#10b981' },
  { key: 'engagement', label: 'Engagement', emoji: '❤️', c: '#f0436a' },
  { key: 'leads',      label: 'Leads',      emoji: '📋',  c: '#f59e0b' },
]

function getPeriodo(date) {
  const d = new Date(date + 'T00:00:00')
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
  if (!n && n!==0) return '—'
  return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0 })
}
function num(v) { return v !== '' ? parseFloat(v) : null }

const EMPTY_CAMP = {
  nombre: '', objetivo: 'trafico',
  fecha_inicio: todayISO(), fecha_fin: todayISO(),
  presupuesto: '', alcance: '', clics: '', conversiones: '', notas: '',
}

function CampanaForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? {
    nombre:       initial.nombre || '',
    objetivo:     initial.objetivo || 'trafico',
    fecha_inicio: initial.fecha_inicio || todayISO(),
    fecha_fin:    initial.fecha_fin || todayISO(),
    presupuesto:  initial.presupuesto ?? '',
    alcance:      initial.alcance ?? '',
    clics:        initial.clics ?? '',
    conversiones: initial.conversiones ?? '',
    notas:        initial.notas || '',
  } : { ...EMPTY_CAMP })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.nombre.trim()) return
    setSaving(true)
    await onSave({
      ...form,
      periodo:     getPeriodo(form.fecha_inicio),
      presupuesto: num(form.presupuesto),
      alcance:     num(form.alcance),
      clics:       num(form.clics),
      conversiones:num(form.conversiones),
    })
    setSaving(false)
  }

  const ctr = form.clics && form.alcance && parseFloat(form.alcance) > 0
    ? (parseFloat(form.clics) / parseFloat(form.alcance) * 100).toFixed(2)
    : null
  const cpc = form.presupuesto && form.clics && parseFloat(form.clics) > 0
    ? (parseFloat(form.presupuesto) / parseFloat(form.clics)).toFixed(2)
    : null

  const inp = {
    width:'100%', padding:'10px 13px', fontSize:'0.88rem',
    background:'var(--bg-elevated)', border:'1px solid var(--border)',
    borderRadius:9, color:'var(--text-primary)', boxSizing:'border-box',
  }
  const lbl = {
    display:'block', fontSize:'0.72rem', fontWeight:700,
    color:'var(--text-muted)', marginBottom:6, letterSpacing:'0.06em', textTransform:'uppercase',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Datos básicos */}
      <div style={{ background:'var(--bg-surface)', border:`1px solid ${color}33`, borderRadius:16, padding:'22px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
          <span style={{ fontSize:18 }}>📣</span>
          <span style={{ fontWeight:700, fontSize:'0.95rem' }}>Datos de la campaña</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 180px 180px', gap:14, marginBottom:14 }}>
          <div>
            <label style={lbl}>Nombre de la campaña *</label>
            <input value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))}
              placeholder="ej: Promo diciembre dental" style={inp} />
          </div>
          <div>
            <label style={lbl}>Fecha inicio</label>
            <input type="date" value={form.fecha_inicio} onChange={e=>setForm(f=>({...f,fecha_inicio:e.target.value}))} style={inp} />
          </div>
          <div>
            <label style={lbl}>Fecha fin</label>
            <input type="date" value={form.fecha_fin} onChange={e=>setForm(f=>({...f,fecha_fin:e.target.value}))} style={inp} />
          </div>
        </div>

        {/* Objetivo */}
        <div>
          <label style={lbl}>Objetivo</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {OBJETIVOS.map(o => {
              const active = form.objetivo === o.key
              return (
                <button key={o.key} onClick={()=>setForm(f=>({...f,objetivo:o.key}))} style={{
                  padding:'8px 16px', borderRadius:99, cursor:'pointer',
                  background: active ? o.c+'22' : 'var(--bg-elevated)',
                  border: `1px solid ${active ? o.c+'66' : 'var(--border)'}`,
                  color: active ? o.c : 'var(--text-secondary)',
                  fontSize:'0.82rem', fontWeight: active ? 700 : 400,
                  display:'flex', alignItems:'center', gap:6, transition:'all 0.15s',
                }}>
                  {o.emoji} {o.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:16, padding:'22px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
          <span style={{ fontSize:18 }}>📊</span>
          <span style={{ fontWeight:700, fontSize:'0.95rem' }}>Resultados de la campaña</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14 }}>
          {[
            { key:'presupuesto', label:'Presupuesto / Gasto',  placeholder:'$ 0',    prefix:'$' },
            { key:'alcance',     label:'Alcance',              placeholder:'ej: 12000' },
            { key:'clics',       label:'Clics',                placeholder:'ej: 340' },
            { key:'conversiones',label:'Conversiones',         placeholder:'ej: 28' },
          ].map(f => (
            <div key={f.key}>
              <label style={lbl}>{f.label}</label>
              <input type="number" value={form[f.key]}
                onChange={e=>setForm(prev=>({...prev,[f.key]:e.target.value}))}
                placeholder={f.placeholder}
                style={{ ...inp, fontFamily:'var(--font-mono)', fontWeight:600, fontSize:'1rem',
                  color: form[f.key] ? color : 'var(--text-muted)',
                  borderColor: form[f.key] ? color+'44' : 'var(--border)',
                }} />
            </div>
          ))}
        </div>

        {/* Calculated KPIs */}
        {(ctr || cpc) && (
          <div style={{ marginTop:16, display:'flex', gap:12, flexWrap:'wrap' }}>
            {ctr && (
              <div style={{ background:`${color}12`, border:`1px solid ${color}33`, borderRadius:10, padding:'10px 16px' }}>
                <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:700, letterSpacing:'0.08em', marginBottom:3 }}>CTR</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:'1.2rem', fontWeight:700, color }}>{ctr}%</div>
              </div>
            )}
            {cpc && (
              <div style={{ background:'#10b98112', border:'1px solid #10b98133', borderRadius:10, padding:'10px 16px' }}>
                <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:700, letterSpacing:'0.08em', marginBottom:3 }}>COSTO POR CLIC</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:'1.2rem', fontWeight:700, color:'#10b981' }}>${parseFloat(cpc).toLocaleString('es-AR',{minimumFractionDigits:2})}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notas */}
      <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:16, padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <span style={{ fontSize:18 }}>📝</span>
          <span style={{ fontWeight:700, fontSize:'0.95rem' }}>Notas</span>
          <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>(opcional)</span>
        </div>
        <textarea value={form.notas} onChange={e=>setForm(f=>({...f,notas:e.target.value}))}
          placeholder="Observaciones, resultados cualitativos, aprendizajes…" rows={2}
          style={{ ...inp, resize:'none', lineHeight:1.5 }} />
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', paddingBottom:8 }}>
        <button onClick={onCancel} style={{ padding:'12px 24px', background:'transparent', border:'1px solid var(--border)', borderRadius:10, color:'var(--text-secondary)', fontSize:'0.88rem', cursor:'pointer' }}>← Volver</button>
        <button onClick={handleSave} disabled={saving || !form.nombre.trim()} style={{
          padding:'12px 32px',
          background: saving || !form.nombre.trim() ? 'var(--bg-elevated)' : `linear-gradient(135deg, ${color}, #c0392b)`,
          border:'none', borderRadius:10,
          color: saving || !form.nombre.trim() ? 'var(--text-muted)' : '#fff',
          fontSize:'0.9rem', fontWeight:700,
          cursor: saving || !form.nombre.trim() ? 'not-allowed' : 'pointer',
          boxShadow: !saving && form.nombre.trim() ? `0 4px 20px ${color}44` : 'none',
          transition:'all 0.2s',
        }}>
          {saving ? 'Guardando…' : initial ? '✎ Actualizar campaña' : '✚ Guardar campaña'}
        </button>
      </div>
    </div>
  )
}

export default function SocialCampanasPage() {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [campanas, setCampanas] = useState([])
  const [loading, setLoading]   = useState(true)
  const [view, setView]         = useState('list')
  const [editing, setEditing]   = useState(null)

  const periodo = `${year}-${String(month+1).padStart(2,'0')}-01`
  const isCurrentMonth = year===now.getFullYear() && month===now.getMonth()

  useEffect(() => { loadCampanas() }, [year, month])

  async function loadCampanas() {
    setLoading(true)
    const { data } = await supabase
      .from('campanas_publicitarias').select('*')
      .eq('periodo', periodo).order('fecha_inicio', { ascending: false })
    setCampanas(data || [])
    setLoading(false)
  }

  async function handleSave(payload) {
    let result
    if (editing) {
      result = await supabase.from('campanas_publicitarias').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id)
    } else {
      result = await supabase.from('campanas_publicitarias').insert({ ...payload, ingresado_por: 'social' })
    }
    if (!result.error) { setView('list'); setEditing(null); loadCampanas() }
    else alert('Error: ' + result.error.message)
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta campaña?')) return
    await supabase.from('campanas_publicitarias').delete().eq('id', id)
    loadCampanas()
  }

  const totalGasto  = campanas.reduce((s,c) => s + (c.presupuesto || 0), 0)
  const totalClics  = campanas.reduce((s,c) => s + (c.clics || 0), 0)
  const totalAlcance = campanas.reduce((s,c) => s + (c.alcance || 0), 0)

  if (view !== 'list') {
    return (
      <div className="animate-fadeIn">
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:'1.6rem', fontWeight:800, letterSpacing:'-0.8px', marginBottom:4 }}>
            {editing ? 'Editar campaña' : 'Nueva campaña'}
          </h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.88rem' }}>Social Media · {MONTHS_ES[month]} {year}</p>
        </div>
        <CampanaForm initial={editing} onSave={handleSave} onCancel={() => { setView('list'); setEditing(null) }} />
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:'1.6rem', fontWeight:800, letterSpacing:'-0.8px', marginBottom:4 }}>Campañas publicitarias</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.88rem' }}>Registro y seguimiento de campañas pagas</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={() => { if(month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }}
            style={{ width:34,height:34,borderRadius:8,background:'var(--bg-elevated)',border:'1px solid var(--border)',color:'var(--text-secondary)',fontSize:'1rem',cursor:'pointer' }}>‹</button>
          <span style={{ fontFamily:'var(--font-mono)',fontSize:'0.82rem',color:'var(--text-primary)',minWidth:130,textAlign:'center' }}>{MONTHS_ES[month]} {year}</span>
          <button onClick={() => { if(isCurrentMonth)return; if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }}
            disabled={isCurrentMonth} style={{ width:34,height:34,borderRadius:8,background:'var(--bg-elevated)',border:'1px solid var(--border)',color:isCurrentMonth?'var(--text-muted)':'var(--text-secondary)',fontSize:'1rem',cursor:isCurrentMonth?'not-allowed':'pointer' }}>›</button>
          <button onClick={() => { setEditing(null); setView('new') }} style={{
            padding:'8px 18px',marginLeft:8,background:color,border:'none',borderRadius:8,
            color:'#fff',fontSize:'0.82rem',fontWeight:700,cursor:'pointer',
            boxShadow:`0 2px 12px ${color}44`,
          }}>✚ Nueva campaña</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex',justifyContent:'center',padding:60 }}>
          <div style={{ width:28,height:28,borderRadius:'50%',border:'2px solid var(--border-bright)',borderTopColor:color,animation:'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <>
          {campanas.length > 0 && (
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:12,marginBottom:24 }}>
              {[
                { label:'Campañas', value:campanas.length, icon:'📣', c:color },
                { label:'Gasto total', value:formatMoney(totalGasto), icon:'💰', c:'#f59e0b' },
                { label:'Alcance total', value:totalAlcance?totalAlcance.toLocaleString('es-AR'):'—', icon:'🌐', c:'#3b82f6' },
                { label:'Clics totales', value:totalClics?totalClics.toLocaleString('es-AR'):'—', icon:'👆', c:'#10b981' },
              ].map((k,i) => (
                <div key={i} className="animate-fadeUp" style={{
                  animationDelay:`${i*0.05}s`,
                  background:'var(--bg-surface)',border:'1px solid var(--border)',
                  borderRadius:14,padding:'18px 20px',position:'relative',overflow:'hidden',
                }}>
                  <div style={{ position:'absolute',top:0,left:0,right:0,height:2,background:k.c,opacity:0.7 }} />
                  <div style={{ fontSize:20,marginBottom:8 }}>{k.icon}</div>
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:'1.5rem',fontWeight:600,color:k.c,letterSpacing:'-0.5px',lineHeight:1,marginBottom:5 }}>{k.value}</div>
                  <div style={{ fontSize:'0.78rem',color:'var(--text-secondary)' }}>{k.label}</div>
                </div>
              ))}
            </div>
          )}

          {campanas.length === 0 ? (
            <div style={{ textAlign:'center',padding:'60px 24px',border:`1px dashed ${color}44`,borderRadius:16,background:'var(--bg-surface)' }}>
              <div style={{ fontSize:40,marginBottom:14 }}>📣</div>
              <p style={{ color:'var(--text-secondary)',marginBottom:20 }}>No hay campañas registradas para {MONTHS_ES[month]} {year}</p>
              <button onClick={() => setView('new')} style={{ padding:'12px 28px',background:color,border:'none',borderRadius:10,color:'#fff',fontWeight:700,fontSize:'0.88rem',cursor:'pointer' }}>
                Registrar primera campaña →
              </button>
            </div>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              {campanas.map((c, i) => {
                const obj = OBJETIVOS.find(o => o.key === c.objetivo)
                const ctr = c.clics && c.alcance ? (c.clics/c.alcance*100).toFixed(2) : null
                return (
                  <div key={c.id} className="animate-fadeUp" style={{
                    animationDelay:`${i*0.04}s`,
                    background:'var(--bg-surface)',border:'1px solid var(--border)',
                    borderRadius:14,padding:'18px 22px',
                    borderLeft:`3px solid ${obj?.c || color}88`,
                  }}>
                    <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap' }}>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap' }}>
                          {obj && (
                            <span style={{ fontSize:'0.72rem',background:obj.c+'18',color:obj.c,border:`1px solid ${obj.c}33`,borderRadius:99,padding:'2px 9px',fontWeight:600 }}>
                              {obj.emoji} {obj.label}
                            </span>
                          )}
                          <span style={{ fontFamily:'var(--font-mono)',fontSize:'0.72rem',color:'var(--text-muted)' }}>
                            {formatDate(c.fecha_inicio)} → {formatDate(c.fecha_fin)}
                          </span>
                        </div>
                        <h3 style={{ fontSize:'0.95rem',fontWeight:700,color:'var(--text-primary)',marginBottom:10 }}>{c.nombre}</h3>
                        <div style={{ display:'flex',flexWrap:'wrap',gap:12 }}>
                          {[
                            { label:'Gasto',       value:formatMoney(c.presupuesto), c:'#f59e0b' },
                            { label:'Alcance',     value:c.alcance?.toLocaleString('es-AR'), c:'#3b82f6' },
                            { label:'Clics',       value:c.clics?.toLocaleString('es-AR'),   c:'#10b981' },
                            { label:'Conversiones',value:c.conversiones,                     c:'#8b5cf6' },
                            ctr ? { label:'CTR', value:ctr+'%', c:color } : null,
                          ].filter(Boolean).map(m => m.value ? (
                            <div key={m.label} style={{ display:'flex',flexDirection:'column',gap:2 }}>
                              <span style={{ fontSize:'0.68rem',color:'var(--text-muted)',fontWeight:600,letterSpacing:'0.05em' }}>{m.label}</span>
                              <span style={{ fontFamily:'var(--font-mono)',fontSize:'0.88rem',fontWeight:700,color:m.c }}>{m.value}</span>
                            </div>
                          ) : null)}
                        </div>
                        {c.notas && <p style={{ marginTop:8,fontSize:'0.78rem',color:'var(--text-muted)',fontStyle:'italic' }}>{c.notas}</p>}
                      </div>
                      <div style={{ display:'flex',gap:6,flexShrink:0 }}>
                        <button onClick={() => { setEditing(c); setView('edit') }} style={{ padding:'6px 11px',background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:7,color:'var(--text-secondary)',fontSize:'0.75rem',cursor:'pointer' }}>✎</button>
                        <button onClick={() => handleDelete(c.id)} style={{ padding:'6px 11px',background:'#dc262612',border:'1px solid #dc262630',borderRadius:7,color:'#f87171',fontSize:'0.75rem',cursor:'pointer' }}>✕</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
