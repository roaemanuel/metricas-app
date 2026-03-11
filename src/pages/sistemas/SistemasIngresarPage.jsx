import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function todayISO() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`
}
function getPeriodo(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`
}
function formatDateDisplay(iso) {
  if (!iso) return ''
  const [y,m,d] = iso.split('-')
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return `${d} de ${months[parseInt(m)-1]} ${y}`
}

function Counter({ value, onChange, color = '#f5c518', label, sublabel }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'14px 18px',
      background: value > 0 ? color+'0d' : 'var(--bg-elevated)',
      border:`1px solid ${value > 0 ? color+'44' : 'var(--border)'}`,
      borderRadius:12, transition:'all 0.15s',
    }}>
      <div>
        <div style={{ fontSize:'0.88rem', fontWeight:600, color: value>0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{label}</div>
        {sublabel && <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:2 }}>{sublabel}</div>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={() => onChange(Math.max(0, value-1))} style={{
          width:34, height:34, borderRadius:9,
          background:'var(--bg-base)', border:'1px solid var(--border)',
          color:'var(--text-secondary)', fontSize:'1.2rem', fontWeight:700,
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
        }}
          onMouseEnter={e=>e.currentTarget.style.borderColor=color+'88'}
          onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
        >−</button>
        <span style={{
          fontFamily:'var(--font-mono)', fontSize:'1.5rem', fontWeight:700,
          color: value>0 ? color : 'var(--text-muted)',
          minWidth:40, textAlign:'center', transition:'color 0.15s',
        }}>{value}</span>
        <button onClick={() => onChange(value+1)} style={{
          width:34, height:34, borderRadius:9,
          background: value>0 ? color+'22' : 'var(--bg-base)',
          border:`1px solid ${value>0 ? color+'66' : 'var(--border)'}`,
          color: value>0 ? color : 'var(--text-secondary)',
          fontSize:'1.2rem', fontWeight:700,
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
          transition:'all 0.15s',
        }}
          onMouseEnter={e=>{ e.currentTarget.style.background=color+'33'; e.currentTarget.style.borderColor=color }}
          onMouseLeave={e=>{ e.currentTarget.style.background=value>0?color+'22':'var(--bg-base)'; e.currentTarget.style.borderColor=value>0?color+'66':'var(--border)' }}
        >+</button>
      </div>
    </div>
  )
}

function ExistingModal({ date, onEdit, onNew, onCancel }) {
  const color = '#f5c518'
  return (
    <div style={{
      position:'fixed', inset:0,
      background:'rgba(7,8,15,0.88)', backdropFilter:'blur(12px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:200, animation:'fadeIn 0.2s ease',
    }}>
      <div style={{
        background:'var(--bg-surface)', border:`1px solid ${color}44`,
        borderRadius:20, padding:'36px 32px', width:'100%', maxWidth:400,
        boxShadow:`0 0 60px ${color}18`, animation:'fadeUp 0.3s ease', textAlign:'center',
      }}>
        <div style={{ fontSize:36, marginBottom:16 }}>🖥️</div>
        <h2 style={{ fontSize:'1.1rem', fontWeight:800, letterSpacing:'-0.3px', marginBottom:8 }}>
          Ya hay un registro para hoy
        </h2>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.85rem', lineHeight:1.6, marginBottom:28 }}>
          El <strong style={{color:'var(--text-primary)'}}>{formatDateDisplay(date)}</strong> ya tiene datos.
          ¿Editás el registro existente o agregás uno nuevo?
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <button onClick={onEdit} style={{
            padding:'13px', background:color, border:'none', borderRadius:10,
            color:'#000', fontSize:'0.9rem', fontWeight:700, cursor:'pointer',
            boxShadow:`0 4px 16px ${color}44`,
          }}>✎ Editar el registro existente</button>
          <button onClick={onNew} style={{
            padding:'13px', background:'var(--bg-elevated)',
            border:'1px solid var(--border-bright)', borderRadius:10,
            color:'var(--text-primary)', fontSize:'0.9rem', fontWeight:600, cursor:'pointer',
          }}>✚ Agregar registro adicional</button>
          <button onClick={onCancel} style={{
            padding:'10px', background:'transparent', border:'none',
            color:'var(--text-muted)', fontSize:'0.8rem', cursor:'pointer', fontFamily:'var(--font-mono)',
          }}>← Cancelar</button>
        </div>
      </div>
    </div>
  )
}

const EMPTY_FORM = { incidencias_resueltas:0, imagenes_codigos_actualizadas:0, imagenes_peso_optimizado:0, notas:'' }
const EMPTY_GA4  = { sesiones:'', usuarios_activos:'', pageviews:'', tasa_rebote:'', duracion_promedio_seg:'', trafico_organico:'', trafico_directo:'', trafico_social:'', trafico_referido:'', trafico_email:'', seo_keywords:[] }

export default function SistemasIngresarPage() {
  const color  = '#f5c518'
  const today  = todayISO()

  const [selectedDate, setSelectedDate]       = useState(today)
  const [form, setForm]                       = useState({ ...EMPTY_FORM })
  const [ga4, setGa4]                         = useState({ ...EMPTY_GA4 })
  const [existingRecord, setExistingRecord]   = useState(null)
  const [existingGa4, setExistingGa4]         = useState(null)
  const [mode, setMode]                       = useState(null)
  const [loading, setLoading]                 = useState(true)
  const [saving, setSaving]                   = useState(false)
  const [saved, setSaved]                     = useState(false)
  const [activeTab, setActiveTab]             = useState('diario')
  const [newKw, setNewKw]                     = useState({ keyword:'', posicion:'', clics:'', impresiones:'' })

  useEffect(() => { checkDayData(selectedDate) }, [selectedDate])

  async function checkDayData(date) {
    setLoading(true); setSaved(false); setMode(null)
    const periodo = getPeriodo(date)
    const [{ data: daily }, { data: ga4data }] = await Promise.all([
      supabase.from('sistemas_diario').select('*').eq('fecha', date).maybeSingle(),
      supabase.from('ga4_metrics').select('*').eq('periodo', periodo).maybeSingle(),
    ])
    if (daily) { setExistingRecord(daily); setMode('ask') }
    else { setExistingRecord(null); setForm({ ...EMPTY_FORM }); setMode('new') }
    if (ga4data) {
      setExistingGa4(ga4data)
      setGa4({
        sesiones:              ga4data.sesiones ?? '',
        usuarios_activos:      ga4data.usuarios_activos ?? '',
        pageviews:             ga4data.pageviews ?? '',
        tasa_rebote:           ga4data.tasa_rebote ?? '',
        duracion_promedio_seg: ga4data.duracion_promedio_seg ?? '',
        trafico_organico:      ga4data.trafico_organico ?? '',
        trafico_directo:       ga4data.trafico_directo ?? '',
        trafico_social:        ga4data.trafico_social ?? '',
        trafico_referido:      ga4data.trafico_referido ?? '',
        trafico_email:         ga4data.trafico_email ?? '',
        seo_keywords:          ga4data.seo_keywords ?? [],
      })
    } else { setExistingGa4(null); setGa4({ ...EMPTY_GA4 }) }
    setLoading(false)
  }

  function handleEditExisting() {
    const r = existingRecord
    setForm({
      incidencias_resueltas:         r.incidencias_resueltas ?? 0,
      imagenes_codigos_actualizadas: r.imagenes_codigos_actualizadas ?? 0,
      imagenes_peso_optimizado:      r.imagenes_peso_optimizado ?? 0,
      notas:                         r.notas ?? '',
    })
    setMode('edit')
  }
  function handleAddNew() { setForm({ ...EMPTY_FORM }); setMode('new') }

  function addKeyword() {
    if (!newKw.keyword.trim()) return
    setGa4(g => ({ ...g, seo_keywords: [...g.seo_keywords, { ...newKw, id: Date.now() }] }))
    setNewKw({ keyword:'', posicion:'', clics:'', impresiones:'' })
  }
  function removeKeyword(id) {
    setGa4(g => ({ ...g, seo_keywords: g.seo_keywords.filter(k => k.id !== id) }))
  }

  async function handleSaveDiario() {
    setSaving(true)
    const payload = { fecha:selectedDate, periodo:getPeriodo(selectedDate), ...form, ingresado_por:'sistemas', updated_at:new Date().toISOString() }
    let error
    if (mode === 'edit' && existingRecord) {
      ({ error } = await supabase.from('sistemas_diario').update(payload).eq('id', existingRecord.id))
    } else {
      ({ error } = await supabase.from('sistemas_diario').insert(payload))
    setSaving(false)
    if (!error) { setSaved(true)
    }; setTimeout(()=>setSaved(false), 3000) }
    else alert('Error: ' + error.message)
  }

  async function handleSaveGA4() {
    setSaving(true)
    const periodo = getPeriodo(selectedDate)
    const n = v => v !== '' ? parseFloat(v) : null
    const payload = {
      periodo,
      sesiones:              n(ga4.sesiones),
      usuarios_activos:      n(ga4.usuarios_activos),
      pageviews:             n(ga4.pageviews),
      tasa_rebote:           n(ga4.tasa_rebote),
      duracion_promedio_seg: n(ga4.duracion_promedio_seg),
      trafico_organico:      n(ga4.trafico_organico),
      trafico_directo:       n(ga4.trafico_directo),
      trafico_social:        n(ga4.trafico_social),
      trafico_referido:      n(ga4.trafico_referido),
      trafico_email:         n(ga4.trafico_email),
      seo_keywords:          ga4.seo_keywords,
      ingresado_por:'sistemas', updated_at:new Date().toISOString(),
    }
    let error
    if (existingGa4) {
      ;({ error } = await supabase.from('ga4_metrics').update(payload).eq('id', existingGa4.id))
    } else {
      const { data, error:err } = await supabase.from('ga4_metrics').insert(payload).select('id').single()
      error = err; if (data) setExistingGa4({ id:data.id })
    }
    setSaving(false)
    if (!error) { setSaved(true); setTimeout(()=>setSaved(false), 3000) }
    else alert('Error GA4: ' + error.message)
  }

  const inputSt = { width:'100%', padding:'9px 12px', fontSize:'0.88rem', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-primary)', boxSizing:'border-box' }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:'1.6rem', fontWeight:800, letterSpacing:'-0.8px', marginBottom:4 }}>Registro diario</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.88rem' }}>
            Sistemas / Web · {formatDateDisplay(selectedDate)}
            {mode==='edit' && <span style={{ marginLeft:10, fontSize:'0.72rem', background:color+'20', color, border:`1px solid ${color}44`, borderRadius:99, padding:'2px 10px', fontWeight:600 }}>✎ Editando</span>}
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>Fecha:</span>
          <input type="date" value={selectedDate} max={today} onChange={e=>setSelectedDate(e.target.value)}
            style={{ padding:'8px 12px', fontSize:'0.85rem', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-primary)', fontFamily:'var(--font-mono)' }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:24, background:'var(--bg-elevated)', padding:4, borderRadius:12, width:'fit-content' }}>
        {[['diario','📋 Registro del día'],['ga4','📈 Google Analytics']].map(([id,lbl]) => (
          <button key={id} onClick={()=>setActiveTab(id)} style={{
            padding:'8px 20px', borderRadius:9, border:'none', cursor:'pointer',
            background: activeTab===id ? 'var(--bg-surface)' : 'transparent',
            color: activeTab===id ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize:'0.85rem', fontWeight: activeTab===id ? 600 : 400,
            boxShadow: activeTab===id ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
            transition:'all 0.15s',
          }}>{lbl}</button>
        ))}
      </div>

      {mode==='ask' && !loading && activeTab==='diario' && (
        <ExistingModal date={selectedDate} onEdit={handleEditExisting} onNew={handleAddNew} onCancel={()=>setSelectedDate(today)} />
      )}

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
          <div style={{ width:28, height:28, borderRadius:'50%', border:'2px solid var(--border-bright)', borderTopColor:color, animation:'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* ── TAB: DIARIO ── */}
          {activeTab==='diario' && (mode==='edit'||mode==='new') && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* Incidencias — solo cantidad */}
              <div style={{ background:'var(--bg-surface)', border:`1px solid ${color}33`, borderRadius:16, padding:'24px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                  <span style={{ fontSize:20 }}>🔧</span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.95rem' }}>Incidencias técnicas resueltas</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>Cantidad total de incidencias que se resolvieron hoy</div>
                  </div>
                </div>
                {/* Big counter centrado */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:20 }}>
                    <button onClick={()=>setForm(f=>({...f, incidencias_resueltas:Math.max(0,f.incidencias_resueltas-1)}))} style={{
                      width:52, height:52, borderRadius:14,
                      background:'var(--bg-elevated)', border:'1px solid var(--border)',
                      color:'var(--text-secondary)', fontSize:'1.6rem', fontWeight:700,
                      display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                    }}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=color+'88'}
                      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
                    >−</button>
                    <div style={{ textAlign:'center' }}>
                      <div style={{
                        fontFamily:'var(--font-mono)', fontSize:'4rem', fontWeight:700, lineHeight:1,
                        color: form.incidencias_resueltas>0 ? color : 'var(--text-muted)',
                        transition:'color 0.15s',
                        textShadow: form.incidencias_resueltas>0 ? `0 0 40px ${color}66` : 'none',
                      }}>{form.incidencias_resueltas}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:4, fontFamily:'var(--font-mono)', letterSpacing:'0.1em' }}>
                        {form.incidencias_resueltas===1 ? 'INCIDENCIA' : 'INCIDENCIAS'}
                      </div>
                    </div>
                    <button onClick={()=>setForm(f=>({...f, incidencias_resueltas:f.incidencias_resueltas+1}))} style={{
                      width:52, height:52, borderRadius:14,
                      background: form.incidencias_resueltas>0 ? color+'22' : 'var(--bg-elevated)',
                      border:`1px solid ${form.incidencias_resueltas>0 ? color+'66' : 'var(--border)'}`,
                      color: form.incidencias_resueltas>0 ? color : 'var(--text-secondary)',
                      fontSize:'1.6rem', fontWeight:700,
                      display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                      transition:'all 0.15s',
                    }}
                      onMouseEnter={e=>{ e.currentTarget.style.background=color+'33'; e.currentTarget.style.borderColor=color }}
                      onMouseLeave={e=>{ e.currentTarget.style.background=form.incidencias_resueltas>0?color+'22':'var(--bg-elevated)'; e.currentTarget.style.borderColor=form.incidencias_resueltas>0?color+'66':'var(--border)' }}
                    >+</button>
                  </div>
                  {form.incidencias_resueltas===0 && (
                    <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>
                      Sin incidencias hoy — ¡buen día! ✓
                    </div>
                  )}
                </div>
              </div>

              {/* Imágenes — por separado */}
              <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:16, padding:'24px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <span style={{ fontSize:20 }}>🖼️</span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.95rem' }}>Gestión de imágenes de productos</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>Cada campo se actualiza de forma independiente durante el día</div>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <Counter
                    value={form.imagenes_codigos_actualizadas}
                    onChange={v=>setForm(f=>({...f,imagenes_codigos_actualizadas:v}))}
                    color="#3b82f6"
                    label="🏷️ Imágenes con código de barra actualizado"
                    sublabel="Productos con código de barra cargado o actualizado"
                  />
                  <Counter
                    value={form.imagenes_peso_optimizado}
                    onChange={v=>setForm(f=>({...f,imagenes_peso_optimizado:v}))}
                    color="#0eb8d4"
                    label="⚡ Imágenes con peso optimizado"
                    sublabel="Imágenes procesadas para reducir tamaño de archivo"
                  />
                </div>
              </div>

              {/* Notas */}
              <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:16, padding:'20px 24px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <span style={{ fontSize:18 }}>📝</span>
                  <span style={{ fontWeight:700, fontSize:'0.95rem' }}>Notas del día</span>
                  <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>(opcional)</span>
                </div>
                <textarea value={form.notas} onChange={e=>setForm(f=>({...f,notas:e.target.value}))}
                  placeholder="Observaciones técnicas del día…" rows={2}
                  style={{ ...inputSt, resize:'vertical', lineHeight:1.5 }} />
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end', paddingBottom:8 }}>
                <button onClick={handleSaveDiario} disabled={saving} style={{
                  padding:'14px 36px',
                  background: saved ? '#059669' : `linear-gradient(135deg, ${color}, #d97706)`,
                  border:'none', borderRadius:12, color: saved?'#fff':'#000',
                  fontSize:'0.95rem', fontWeight:700, cursor:'pointer',
                  boxShadow: saved?'0 4px 20px #05966944':`0 4px 20px ${color}44`,
                  transition:'all 0.2s',
                }}
                  onMouseEnter={e=>!saving&&(e.currentTarget.style.transform='translateY(-2px)')}
                  onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}
                >
                  {saving?'Guardando…':saved?'✓ Guardado':mode==='edit'?'✎ Actualizar registro':'✚ Guardar registro del día'}
                </button>
              </div>
            </div>
          )}

          {/* ── TAB: GA4 ── */}
          {activeTab==='ga4' && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {/* Info banner */}
              <div style={{
                background:'var(--bg-elevated)', border:'1px solid var(--border)',
                borderRadius:10, padding:'12px 16px',
                display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10,
              }}>
                <div>
                  <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>
                    📅 Período: <strong style={{color:'var(--text-primary)'}}>
                      {new Date(getPeriodo(selectedDate)).toLocaleDateString('es-AR',{month:'long',year:'numeric'})}
                    </strong>
                  </span>
                  <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginLeft:12, fontFamily:'var(--font-mono)' }}>
                    · ingreso manual o sincronización automática
                  </span>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                  {existingGa4 && <span style={{ fontSize:'0.72rem', background:'#10b98120', color:'#10b981', border:'1px solid #10b98144', borderRadius:99, padding:'2px 10px', fontWeight:600 }}>✓ Datos existentes</span>}
                  {syncMsg && <span style={{ fontSize:'0.72rem', color: syncMsg.startsWith('✅')?'#10b981':'#f0436a', fontFamily:'var(--font-mono)' }}>{syncMsg}</span>}
                  <button
                    onClick={async () => {
                      setSyncingGa4(true); setSyncMsg('')
                      try {
                        const periodo = getPeriodo(selectedDate)
                        const [y, m] = periodo.split('-').map(Number)
                        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-ga4`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                          },
                          body: JSON.stringify({ year: y, month: m - 1 }),
                        })
                        const data = await res.json()
                        if (data.ok) {
                          setSyncMsg('✅ Sincronizado correctamente')
                          await loadGa4(periodo)
                        } else {
                          setSyncMsg('❌ ' + (data.error || 'Error desconocido'))
                        }
                      } catch(e) {
                        setSyncMsg('❌ ' + e.message)
                      }
                      setSyncingGa4(false)
                    }}
                    disabled={syncingGa4}
                    style={{
                      fontSize:'0.78rem', fontWeight:700, cursor: syncingGa4?'wait':'pointer',
                      background: syncingGa4?'var(--bg-elevated)':'#4285F4',
                      color: syncingGa4?'var(--text-muted)':'#fff',
                      border:'none', borderRadius:8, padding:'5px 14px',
                      opacity: syncingGa4?0.6:1, transition:'all 0.15s',
                    }}
                  >{syncingGa4 ? '⟳ Sincronizando...' : '⚡ Sync GA4'}</button>
                  <a href="https://analytics.google.com" target="_blank" rel="noreferrer" style={{
                    fontSize:'0.78rem', color:'#4285F4', textDecoration:'none',
                    background:'#4285F420', border:'1px solid #4285F444',
                    borderRadius:8, padding:'5px 12px', fontWeight:600,
                  }}>Abrir GA4 →</a>
                </div>
              </div>

              {/* Métricas principales */}
              <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
                <div style={{ padding:'14px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:18 }}>📊</span>
                  <span style={{ fontWeight:700, fontSize:'0.95rem' }}>Métricas del sitio</span>
                </div>
                <div style={{ padding:'20px 24px', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(190px, 1fr))', gap:14 }}>
                  {[
                    { key:'sesiones',              label:'Sesiones',              placeholder:'ej: 3200' },
                    { key:'usuarios_activos',       label:'Usuarios activos',      placeholder:'ej: 2100' },
                    { key:'pageviews',              label:'Páginas vistas',        placeholder:'ej: 8400' },
                    { key:'tasa_rebote',            label:'Tasa de rebote (%)',    placeholder:'ej: 42.5' },
                    { key:'duracion_promedio_seg',  label:'Duración promedio (seg)',placeholder:'ej: 185' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display:'block', fontSize:'0.73rem', color:'var(--text-muted)', fontWeight:600, marginBottom:6, letterSpacing:'0.05em' }}>{f.label}</label>
                      <input type="number" value={ga4[f.key]} onChange={e=>setGa4(g=>({...g,[f.key]:e.target.value}))}
                        placeholder={f.placeholder} style={{ ...inputSt }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Fuentes de tráfico */}
              <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
                <div style={{ padding:'14px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:18 }}>🔀</span>
                  <span style={{ fontWeight:700, fontSize:'0.95rem' }}>Fuentes de tráfico (sesiones por canal)</span>
                </div>
                <div style={{ padding:'20px 24px', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:14 }}>
                  {[
                    { key:'trafico_organico', label:'Orgánico',  color:'#10b981' },
                    { key:'trafico_directo',  label:'Directo',   color:'#3b82f6' },
                    { key:'trafico_social',   label:'Social',    color:'#ec4899' },
                    { key:'trafico_referido', label:'Referido',  color:'#f59e0b' },
                    { key:'trafico_email',    label:'Email',     color:'#8b5cf6' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display:'block', fontSize:'0.73rem', fontWeight:600, marginBottom:6, color:f.color, letterSpacing:'0.05em' }}>{f.label}</label>
                      <input type="number" value={ga4[f.key]} onChange={e=>setGa4(g=>({...g,[f.key]:e.target.value}))}
                        placeholder="0" style={{ ...inputSt, borderColor: ga4[f.key]?f.color+'44':'var(--border)' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* SEO Keywords */}
              <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
                <div style={{ padding:'14px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:18 }}>🔍</span>
                  <span style={{ fontWeight:700, fontSize:'0.95rem' }}>Keywords / Posición SEO</span>
                </div>
                <div style={{ padding:'20px 24px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 80px 80px auto', gap:8, marginBottom:12 }}>
                    {[{k:'keyword',pl:'Keyword'},{k:'posicion',pl:'Pos.'},{k:'clics',pl:'Clics'},{k:'impresiones',pl:'Impr.'}].map(f => (
                      <input key={f.k} value={newKw[f.k]} onChange={e=>setNewKw(k=>({...k,[f.k]:e.target.value}))}
                        onKeyDown={e=>e.key==='Enter'&&addKeyword()} placeholder={f.pl}
                        style={{ ...inputSt, padding:'8px 10px', fontSize:'0.82rem' }} />
                    ))}
                    <button onClick={addKeyword} disabled={!newKw.keyword.trim()} style={{
                      padding:'8px 14px', background:newKw.keyword.trim()?color:'var(--bg-elevated)',
                      border:'none', borderRadius:8, color:newKw.keyword.trim()?'#000':'var(--text-muted)',
                      fontSize:'0.82rem', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap',
                    }}>+ Agregar</button>
                  </div>
                  {ga4.seo_keywords.length > 0 ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                      {ga4.seo_keywords.map(kw => (
                        <div key={kw.id} style={{
                          display:'grid', gridTemplateColumns:'1fr 80px 80px 80px 32px',
                          gap:8, padding:'8px 10px',
                          background:'var(--bg-elevated)', border:'1px solid var(--border)',
                          borderRadius:8, alignItems:'center',
                        }}>
                          <span style={{ fontSize:'0.82rem' }}>{kw.keyword}</span>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.82rem', textAlign:'center', fontWeight:600, color:parseInt(kw.posicion)<=3?'#10b981':parseInt(kw.posicion)<=10?color:'var(--text-secondary)' }}>#{kw.posicion||'?'}</span>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.78rem', textAlign:'center', color:'var(--text-muted)' }}>{kw.clics||'—'}</span>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.78rem', textAlign:'center', color:'var(--text-muted)' }}>{kw.impresiones||'—'}</span>
                          <button onClick={()=>removeKeyword(kw.id)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.8rem' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign:'center', padding:'14px', color:'var(--text-muted)', fontSize:'0.8rem' }}>
                      Agregá keywords con su posición en Google
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end', paddingBottom:8 }}>
                <button onClick={handleSaveGA4} disabled={saving} style={{
                  padding:'14px 36px',
                  background: saved?'#059669':'linear-gradient(135deg, #4285F4, #0f9d58)',
                  border:'none', borderRadius:12, color:'#fff',
                  fontSize:'0.95rem', fontWeight:700, cursor:'pointer', transition:'all 0.2s',
                }}
                  onMouseEnter={e=>!saving&&(e.currentTarget.style.transform='translateY(-2px)')}
                  onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}
                >
                  {saving?'Guardando…':saved?'✓ Guardado':existingGa4?'✎ Actualizar GA4':'✚ Guardar métricas GA4'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
