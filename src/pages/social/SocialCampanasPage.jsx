import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const color = '#7DD3FC' // Social color from user request
const RED = '#f0436a'
const GREEN = '#10b981'
const BLUE = '#3b82f6'
const AMBER = '#f59e0b'
const PURPLE = '#A5B4FC'

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const OBJETIVOS = [
  { key: 'awareness',  label: 'Awareness',  emoji: '👁️',  c: '#8b5cf6' },
  { key: 'trafico',    label: 'Tráfico',    emoji: '🔗',  c: BLUE },
  { key: 'ventas',     label: 'Ventas',     emoji: '💰',  c: GREEN },
  { key: 'engagement', label: 'Engagement', emoji: '❤️', c: RED },
  { key: 'leads',      label: 'Leads',      emoji: '📋',  c: AMBER },
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

  const glassInput = {
    width:'100%', padding:'12px 16px', fontSize:'0.95rem',
    background:'rgba(255, 255, 255, 0.05)', border:'1px solid rgba(255, 255, 255, 0.1)',
    borderRadius:12, color:'#fff', boxSizing:'border-box',
    outline: 'none', transition: 'all 0.2s'
  }
  const lbl = {
    display:'block', fontSize:'0.75rem', fontWeight: 700,
    color:'rgba(255, 255, 255, 0.4)', marginBottom:8, letterSpacing:'0.1em', textTransform:'uppercase',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Datos básicos */}
      <div 
        className="animate-fadeUp"
        style={{ 
          background:'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', 
          border:'1px solid rgba(255, 255, 255, 0.1)', borderRadius:24, padding:32,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
          <span style={{ fontSize:20 }}>📣</span>
          <span style={{ fontWeight: 800, fontSize:'1.1rem', color: '#fff' }}>Datos de la campaña</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, marginBottom:24 }}>
          <div>
            <label style={lbl}>Nombre de la campaña *</label>
            <input value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))}
              placeholder="ej: Promo diciembre dental" style={glassInput} />
          </div>
          <div>
            <label style={lbl}>Fecha inicio</label>
            <input type="date" value={form.fecha_inicio} onChange={e=>setForm(f=>({...f,fecha_inicio:e.target.value}))} style={{...glassInput, colorScheme: 'dark'}} />
          </div>
          <div>
            <label style={lbl}>Fecha fin</label>
            <input type="date" value={form.fecha_fin} onChange={e=>setForm(f=>({...f,fecha_fin:e.target.value}))} style={{...glassInput, colorScheme: 'dark'}} />
          </div>
        </div>

        {/* Objetivo */}
        <div>
          <label style={lbl}>Objetivo estratégico</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {OBJETIVOS.map(o => {
              const active = form.objetivo === o.key
              return (
                <button key={o.key} onClick={()=>setForm(f=>({...f,objetivo:o.key}))} style={{
                  padding:'10px 20px', borderRadius:14, cursor:'pointer',
                  background: active ? o.c+'22' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${active ? o.c : 'rgba(255,255,255,0.1)'}`,
                  color: active ? o.c : 'rgba(255,255,255,0.5)',
                  fontSize:'0.88rem', fontWeight: active ? 700 : 500,
                  display:'flex', alignItems:'center', gap:8, transition:'all 0.2s',
                  backdropFilter: 'blur(10px)'
                }}>
                  {o.emoji} {o.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div 
        className="animate-fadeUp"
        style={{ 
          animationDelay: '0.1s',
          background:'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', 
          border:'1px solid rgba(255, 255, 255, 0.1)', borderRadius:24, padding:32,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
          <span style={{ fontSize:20 }}>📊</span>
          <span style={{ fontWeight: 800, fontSize:'1.1rem', color: '#fff' }}>Resultados de rendimiento</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:20 }}>
          {[
            { key:'presupuesto', label:'Gasto / Inversión', placeholder:'$ 0',    prefix:'$', c: AMBER },
            { key:'alcance',     label:'Alcance total',     placeholder:'ej: 12000', c: BLUE },
            { key:'clics',       label:'Clics logrados',    placeholder:'ej: 340',   c: color },
            { key:'conversiones',label:'Conversiones',       placeholder:'ej: 28',    c: GREEN },
          ].map(f => (
            <div key={f.key}>
              <label style={lbl}>{f.label}</label>
              <input type="number" value={form[f.key]}
                onChange={e=>setForm(prev=>({...prev,[f.key]:e.target.value}))}
                placeholder={f.placeholder}
                style={{ ...glassInput, fontFamily:'var(--font-mono)', fontWeight:700, fontSize:'1.2rem',
                  color: form[f.key] ? f.c : '#fff',
                  borderColor: form[f.key] ? f.c + '66' : 'rgba(255,255,255,0.1)',
                  background: form[f.key] ? f.c + '0a' : 'rgba(255,255,255,0.05)'
                }} />
            </div>
          ))}
        </div>

        {/* Calculated KPIs */}
        {(ctr || cpc) && (
          <div style={{ marginTop:24, display:'flex', gap:16, flexWrap:'wrap' }}>
            {ctr && (
              <div style={{ background:`${color}15`, border:`1px solid ${color}33`, borderRadius:16, padding:'14px 22px', backdropFilter: 'blur(10px)' }}>
                <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing:'0.1em', marginBottom:4 }}>CTR ESTIMADO</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:'1.5rem', fontWeight: 800, color }}>{ctr}%</div>
              </div>
            )}
            {cpc && (
              <div style={{ background:`${GREEN}15`, border:`1px solid ${GREEN}33`, borderRadius:16, padding:'14px 22px', backdropFilter: 'blur(10px)' }}>
                <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing:'0.1em', marginBottom:4 }}>COSTO POR CLIC</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:'1.5rem', fontWeight: 800, color:GREEN }}>${parseFloat(cpc).toLocaleString('es-AR',{minimumFractionDigits:2})}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notas */}
      <div 
        className="animate-fadeUp"
        style={{ 
          animationDelay: '0.2s',
          background:'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', 
          border:'1px solid rgba(255, 255, 255, 0.1)', borderRadius:24, padding:32,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <span style={{ fontSize:20 }}>📝</span>
          <span style={{ fontWeight: 800, fontSize:'1.1rem', color: '#fff' }}>Notas y observaciones</span>
        </div>
        <textarea value={form.notas} onChange={e=>setForm(f=>({...f,notas:e.target.value}))}
          placeholder="Aprendizajes, resultados cualitativos, recomendaciones…" rows={3}
          style={{ ...glassInput, resize:'none', lineHeight:1.6, fontSize: '0.95rem' }} />
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems: 'center', paddingBottom:20 }}>
        <button onClick={onCancel} style={{ 
          padding:'14px 28px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', 
          borderRadius:14, color:'rgba(255,255,255,0.6)', fontSize:'0.9rem', fontWeight: 600, cursor:'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >← Volver al listado</button>
        <button onClick={handleSave} disabled={saving || !form.nombre.trim()} style={{
          padding:'16px 40px',
          background: saving || !form.nombre.trim() ? 'rgba(255,255,255,0.05)' : color,
          border:'none', borderRadius:16,
          color: saving || !form.nombre.trim() ? 'rgba(255,255,255,0.2)' : '#080C1C',
          fontSize:'1rem', fontWeight: 800,
          cursor: saving || !form.nombre.trim() ? 'not-allowed' : 'pointer',
          boxShadow: !saving && form.nombre.trim() ? `0 8px 24px ${color}33` : 'none',
          transition:'all 0.3s',
        }}
        onMouseEnter={e => { if (!saving && form.nombre.trim()) e.currentTarget.style.transform = 'translateY(-4px)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
        >
          {saving ? 'Guardando…' : initial ? '✎ Actualizar Campaña' : '✚ Registrar Campaña'}
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
        <div style={{ marginBottom:32 }}>
          <h1 style={{ 
            fontSize: '2.4rem', 
            fontWeight: 800, 
            letterSpacing: '-1.5px', 
            marginBottom: 6,
            background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.55))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {editing ? 'Editar Campaña' : 'Nueva Campaña'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', fontWeight: 500 }}>Social Media · {MONTHS_ES[month]} {year}</p>
        </div>
        <CampanaForm initial={editing} onSave={handleSave} onCancel={() => { setView('list'); setEditing(null) }} />
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:32 }}>
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
            Campañas Publicitarias
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', fontWeight: 500 }}>Registro y seguimiento de inversión en anuncios</p>
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: 14, 
            padding: '4px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <button onClick={() => { if(month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }}
              style={{ width:36,height:36,borderRadius:10,background:'transparent',border:'none',color:'#fff',fontSize:'1.1rem',cursor:'pointer' }}>‹</button>
            <span style={{ fontFamily:'var(--font-mono)',fontSize:'0.85rem',color:'rgba(255,255,255,0.8)',minWidth:120,textAlign:'center', fontWeight:600 }}>{MONTHS_ES[month]} {year}</span>
            <button onClick={() => { if(isCurrentMonth)return; if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }}
              disabled={isCurrentMonth} style={{ width:36,height:36,borderRadius:10,background:'transparent',border:'none',color:isCurrentMonth?'rgba(255,255,255,0.2)':'#fff',fontSize:'1.1rem',cursor:isCurrentMonth?'not-allowed':'pointer' }}>›</button>
          </div>
          <button onClick={() => { setEditing(null); setView('new') }} style={{
            padding:'10px 24px',background:color,border:'none',borderRadius:12,
            color:'#080C1C',fontSize:'0.85rem',fontWeight: 800,cursor:'pointer',
            boxShadow:`0 4px 20px ${color}44`,
          }}>✚ Nueva Campaña</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex',justifyContent:'center',padding:80 }}>
          <div className="animate-spin" style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: color }} />
        </div>
      ) : (
        <>
          {campanas.length > 0 && (
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:20,marginBottom:32 }}>
              {[
                { label:'Campañas', value:campanas.length, icon:'📣', c:color },
                { label:'Inversión Total', value:formatMoney(totalGasto), icon:'💰', c:AMBER },
                { label:'Alcance Total', value:totalAlcance?totalAlcance.toLocaleString('es-AR'):'—', icon:'🌐', c:BLUE },
                { label:'Clics Totales', value:totalClics?totalClics.toLocaleString('es-AR'):'—', icon:'👆', c:GREEN },
              ].map((k,i) => (
                <div key={i} className="animate-fadeUp" style={{
                  animationDelay:`${i*0.08}s`,
                  background:'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)',
                  border:'1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius:24,padding:'24px',position:'relative',overflow:'hidden',
                  boxShadow:'0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}>
                  <div style={{ position:'absolute',top:0,left:0,right:0,height:'2px',background:k.c,opacity:0.8 }} />
                  <div style={{ fontSize:24,marginBottom:12, filter: `drop-shadow(0 0 10px ${k.c}44)` }}>{k.icon}</div>
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:'1.8rem',fontWeight: 800,color:'#fff',letterSpacing:'-1px',lineHeight:1,marginBottom:6 }}>{k.value}</div>
                  <div style={{ fontSize:'0.75rem',color:'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
                </div>
              ))}
            </div>
          )}

          {campanas.length === 0 ? (
            <div 
              className="animate-fadeUp"
              style={{ 
                textAlign:'center',padding:'80px 40px',border:`1px dashed ${color}33`,borderRadius:28,
                background:'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{ fontSize:56,marginBottom:20 }}>📣</div>
              <p style={{ color:'rgba(255,255,255,0.5)',marginBottom:28, fontSize: '1.1rem' }}>No hay campañas registradas para {MONTHS_ES[month]} {year}</p>
              <button 
                onClick={() => setView('new')} 
                style={{ 
                  padding:'16px 40px',background:color,border:'none',borderRadius:16,
                  color:'#080C1C',fontWeight: 800,fontSize:'1rem',cursor:'pointer',
                  boxShadow:`0 8px 24px ${color}33`, transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                Registrar primera campaña →
              </button>
            </div>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
              {campanas.map((c, i) => {
                const obj = OBJETIVOS.find(o => o.key === c.objetivo)
                const ctr = c.clics && c.alcance ? (c.clics/c.alcance*100).toFixed(2) : null
                const statusColor = obj?.c || color
                return (
                  <div key={c.id} className="animate-fadeUp" style={{
                    animationDelay:`${i*0.05}s`,
                    background:'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)',
                    border:'1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius:24,padding:'24px 30px',
                    position: 'relative', overflow: 'hidden',
                    boxShadow:'0 8px 32px rgba(0, 0, 0, 0.12)',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.borderColor = statusColor + '66'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: statusColor }} />
                    
                    <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:20,flexWrap:'wrap' }}>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:12,flexWrap:'wrap' }}>
                          {obj && (
                            <span style={{ 
                              fontSize:'0.72rem',background:statusColor+'15',color:statusColor,
                              border:`1px solid ${statusColor}33`,borderRadius:99,padding:'3px 12px',fontWeight:800,
                              textTransform: 'uppercase', letterSpacing: '0.05em'
                            }}>
                              {obj.emoji} {obj.label}
                            </span>
                          )}
                          <span style={{ fontFamily:'var(--font-mono)',fontSize:'0.75rem',color:'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                            {formatDate(c.fecha_inicio)} — {formatDate(c.fecha_fin)}
                          </span>
                        </div>
                        <h3 style={{ fontSize:'1.2rem',fontWeight: 800,color:'#fff',marginBottom:16, letterSpacing: '-0.5px' }}>{c.nombre}</h3>
                        
                        <div style={{ display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap:24 }}>
                          {[
                            { label:'Gasto Real',      value:formatMoney(c.presupuesto), c:AMBER },
                            { label:'Alcance total',   value:c.alcance?.toLocaleString('es-AR'), c:BLUE },
                            { label:'Clics logrados',  value:c.clics?.toLocaleString('es-AR'),   c:color },
                            { label:'Conversiones',    value:c.conversiones,                     c:GREEN },
                            ctr ? { label:'CTR (%)', value:ctr+'%', c:PURPLE } : null,
                          ].filter(Boolean).map(m => m.value ? (
                            <div key={m.label} style={{ display:'flex',flexDirection:'column',gap:4 }}>
                              <span style={{ fontSize:'0.7rem',color:'rgba(255,255,255,0.4)',fontWeight:800,letterSpacing:'0.05em', textTransform: 'uppercase' }}>{m.label}</span>
                              <span style={{ fontFamily:'var(--font-mono)',fontSize:'1.1rem',fontWeight: 800,color:m.c }}>{m.value}</span>
                            </div>
                          ) : null)}
                        </div>
                        {c.notas && (
                          <div style={{ marginTop:20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <p style={{ fontSize:'0.85rem',color:'rgba(255,255,255,0.5)',fontStyle:'italic', lineHeight: 1.5 }}>“{c.notas}”</p>
                          </div>
                        )}
                      </div>
                      <div style={{ display:'flex',gap:10,flexShrink:0 }}>
                        <button onClick={() => { setEditing(c); setView('edit') }} style={{ 
                          width: 42, height: 42, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                          borderRadius: 12, color:'rgba(255,255,255,0.6)', fontSize:'1rem', cursor:'pointer', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                        >✎</button>
                        <button onClick={() => handleDelete(c.id)} style={{ 
                          width: 42, height: 42, background: 'rgba(240,67,106,0.1)', border: '1px solid rgba(240,67,106,0.2)', 
                          borderRadius: 12, color:RED, fontSize:'1rem', cursor:'pointer', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(240,67,106,0.2)'; e.currentTarget.style.transform = 'scale(1.05)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(240,67,106,0.1)'; e.currentTarget.style.transform = 'none' }}
                        >✕</button>
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
