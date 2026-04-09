import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const accentColor = '#FDBA74' // Amber 300 / Systems theme

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

function Counter({ value, onChange, color, label, sublabel }) {
  const isSet = value > 0;
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'20px 24px',
      background: 'rgba(255, 255, 255, 0.06)',
      backdropFilter: 'blur(10px)',
      border: isSet ? `1px solid ${color}88` : '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: 20, transition:'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      boxShadow: isSet ? `0 8px 24px ${color}22` : '0 4px 12px rgba(0,0,0,0.1)',
      transform: isSet ? 'scale(1.02)' : 'scale(1)'
    }}>
      <div>
        <div style={{ fontSize:'0.95rem', fontWeight:700, color: '#fff' }}>{label}</div>
        {sublabel && <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', marginTop:4, fontWeight: 500 }}>{sublabel}</div>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        <button onClick={() => onChange(Math.max(0, value-1))} style={{
          width:38, height:38, borderRadius:12,
          background:'rgba(255, 255, 255, 0.05)', border:'1px solid rgba(255, 255, 255, 0.1)',
          color:'#fff', fontSize:'1.4rem', fontWeight: 600,
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
          transition: 'all 0.2s'
        }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255, 255, 255, 0.1)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(255, 255, 255, 0.05)'}
        >−</button>
        <span style={{
          fontFamily:'var(--font-mono)', fontSize:'1.8rem', fontWeight: 800,
          color: isSet ? color : '#fff',
          minWidth:44, textAlign:'center', transition:'color 0.2s',
          textShadow: isSet ? `0 0 15px ${color}44` : 'none'
        }}>{value}</span>
        <button onClick={() => onChange(value+1)} style={{
          width:38, height:38, borderRadius:12,
          background: isSet ? `${color}22` : 'rgba(255, 255, 255, 0.05)', 
          border: isSet ? `1px solid ${color}66` : '1px solid rgba(255, 255, 255, 0.1)',
          color: isSet ? color : '#fff', fontSize:'1.4rem', fontWeight: 600,
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
          transition:'all 0.2s',
        }}
          onMouseEnter={e=>{ e.currentTarget.style.background=isSet?`${color}33`:'rgba(255, 255, 255, 0.1)' }}
          onMouseLeave={e=>{ e.currentTarget.style.background=isSet?`${color}22`:'rgba(255, 255, 255, 0.05)' }}
        >+</button>
      </div>
    </div>
  )
}

function ExistingModal({ date, onEdit, onNew, onCancel }) {
  return (
    <div style={{
      position:'fixed', inset:0,
      background:'rgba(8, 12, 28, 0.45)', backdropFilter:'blur(16px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:2000, animation:'fadeIn 0.3s ease',
    }}>
      <div className="animate-fadeUp" style={{
        background:'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)',
        border:'1px solid rgba(255, 255, 255, 0.12)',
        borderRadius:32, padding:'48px 40px', width:'100%', maxWidth:420,
        boxShadow:'0 24px 60px rgba(0,0,0,0.5)', textAlign:'center',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
        <div style={{ fontSize:56, marginBottom:24, filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.2))' }}>🖥️</div>
        <h2 style={{ 
          fontSize:'1.6rem', fontWeight: 900, marginBottom:12,
          background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.55))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Registro duplicado
        </h2>
        <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.95rem', lineHeight:1.6, marginBottom:32 }}>
          La jornada del <strong style={{color:'#fff'}}>{formatDateDisplay(date)}</strong> ya fue procesada.
          ¿Qué deseas hacer?
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <button onClick={onEdit} style={{
            padding:'16px', background: accentColor, border:'none', borderRadius:16,
            color:'#080C1C', fontSize:'1rem', fontWeight: 800, cursor:'pointer',
            boxShadow:`0 8px 20px ${accentColor}44`, transition: 'all 0.3s'
          }}
            onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
            onMouseLeave={e=>e.currentTarget.style.transform='none'}
          >✎ Editar jornada existente</button>
          <button onClick={onNew} style={{
            padding:'15px', background:'rgba(255, 255, 255, 0.05)',
            border:'1px solid rgba(255, 255, 255, 0.1)', borderRadius:16,
            color:'#fff', fontSize:'1rem', fontWeight:700, cursor:'pointer', transition: 'all 0.2s'
          }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255, 255, 255, 0.1)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255, 255, 255, 0.05)'}
          >✚ Nueva entrada (Adicional)</button>
          <button onClick={onCancel} style={{
            padding:'12px', background:'transparent', border:'none',
            color:'rgba(255,255,255,0.3)', fontSize:'0.85rem', cursor:'pointer', fontWeight: 600, marginTop: 8
          }}>Regresar sin cambios</button>
        </div>
      </div>
    </div>
  )
}

const EMPTY_FORM = { incidencias_resueltas:0, imagenes_codigos_actualizadas:0, imagenes_peso_optimizado:0, notas:'' }
const EMPTY_GA4  = { sesiones:'', usuarios_activos:'', pageviews:'', tasa_rebote:'', duracion_promedio_seg:'', trafico_organico:'', trafico_directo:'', trafico_social:'', trafico_referido:'', trafico_email:'', seo_keywords:[] }

export default function SistemasIngresarPage() {
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
  const [syncingGa4, setSyncingGa4]           = useState(false)
  const [syncMsg, setSyncMsg]                 = useState('')

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

  async function loadGa4(periodo) {
    const { data: ga4data } = await supabase.from('ga4_metrics').select('*').eq('periodo', periodo).maybeSingle()
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
    }
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
      ;({ error } = await supabase.from('sistemas_diario').update(payload).eq('id', existingRecord.id))
    } else {
      ;({ error } = await supabase.from('sistemas_diario').insert(payload))
    }
    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      alert('Error: ' + error.message)
    }
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
      error = err
      if (data) { setExistingGa4({ id:data.id }) }
    }
    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      alert('Error GA4: ' + error.message)
    }
  }

  const inputSt = { 
    width:'100%', padding:'12px 16px', fontSize:'0.95rem', 
    background:'rgba(255, 255, 255, 0.05)', border:'1px solid rgba(255, 255, 255, 0.1)', 
    borderRadius:12, color:'#fff', boxSizing:'border-box', outline: 'none',
    transition: 'all 0.2s focus'
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:24, marginBottom:32 }}>
        <div>
          <h1 style={{ 
            fontSize:'2.5rem', fontWeight: 900, letterSpacing:'-2px', marginBottom:4,
            background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.55))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Ingreso de Métricas
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', fontWeight: 500 }}>
            Sistemas / Web · <span style={{ color: accentColor, fontWeight: 700 }}>{formatDateDisplay(selectedDate)}</span>
            {mode==='edit' && <span style={{ marginLeft:12, fontSize:'0.75rem', background:`${accentColor}22`, color: accentColor, border:`1px solid ${accentColor}44`, borderRadius:99, padding:'4px 12px', fontWeight:800, textTransform: 'uppercase' }}>✎ Editando sistema</span>}
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12, background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jornada:</span>
          <input type="date" value={selectedDate} max={today} onChange={e=>setSelectedDate(e.target.value)}
            style={{ 
              background: 'transparent', border: 'none', color: '#fff', fontSize: '1rem', 
              fontWeight: 700, fontFamily: 'var(--font-mono)', outline: 'none', cursor: 'pointer' 
            }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display:'flex', gap:6, marginBottom:32, background:'rgba(255, 255, 255, 0.05)', 
        padding:6, borderRadius:20, width:'fit-content', border: '1px solid rgba(255,255,255,0.1)' 
      }}>
        {[
          {id:'diario', lbl:'📋 Registro Operativo', icon: '🔧'},
          {id:'ga4', lbl:'📈 Analítica Web', icon: '🌐'}
        ].map(tab => (
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{
            padding:'12px 24px', borderRadius:14, border:'none', cursor:'pointer',
            background: activeTab===tab.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            color: activeTab===tab.id ? '#fff' : 'rgba(255,255,255,0.4)',
            fontSize:'0.9rem', fontWeight: activeTab===tab.id ? 800 : 600,
            display: 'flex', alignItems: 'center', gap: 8,
            transition:'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: activeTab===tab.id ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
          }}>
            <span style={{ fontSize: 16 }}>{tab.icon}</span>
            {tab.lbl}
          </button>
        ))}
      </div>

      {mode==='ask' && !loading && activeTab==='diario' && (
        <ExistingModal date={selectedDate} onEdit={handleEditExisting} onNew={handleAddNew} onCancel={()=>setSelectedDate(today)} />
      )}

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:100 }}>
          <div className="animate-spin" style={{ width:40, height:40, borderRadius:'50%', border:'4px solid rgba(255,255,255,0.1)', borderTopColor: accentColor }} />
        </div>
      ) : (
        <div className="animate-fadeUp">
          {/* ── TAB: DIARIO ── */}
          {activeTab==='diario' && (mode==='edit'||mode==='new') && (
            <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

              {/* Incidencias Panel */}
              <div style={{ 
                background:'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', 
                border:'1px solid rgba(255, 255, 255, 0.12)', borderRadius:32, padding:'32px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden' 
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: '#60A5FA' }} />
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(96, 165, 250, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#60A5FA' }}>🔧</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize:'1.1rem', color: '#fff' }}>Incidencias técnicas resueltas</div>
                    <div style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.4)', marginTop:2, fontWeight: 500 }}>Soporte técnico y mantenimiento evolutivo hoy</div>
                  </div>
                </div>
                
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20, padding: '20px 0' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:32 }}>
                    <button onClick={()=>setForm(f=>({...f, incidencias_resueltas:Math.max(0,f.incidencias_resueltas-1)}))} style={{
                      width:64, height:64, borderRadius:20,
                      background:'rgba(255, 255, 255, 0.05)', border:'1px solid rgba(255, 255, 255, 0.1)',
                      color:'#fff', fontSize:'2rem', fontWeight: 600,
                      display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                      transition: 'all 0.2s'
                    }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(255, 255, 255, 0.1)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(255, 255, 255, 0.05)'}
                    >−</button>
                    <div style={{ textAlign:'center' }}>
                      <div style={{
                        fontFamily:'var(--font-mono)', fontSize:'5.5rem', fontWeight: 900, lineHeight:1,
                        color: form.incidencias_resueltas > 0 ? '#60A5FA' : '#fff',
                        transition:'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        textShadow: form.incidencias_resueltas > 0 ? `0 0 40px rgba(96, 165, 250, 0.4)` : 'none',
                        transform: form.incidencias_resueltas > 0 ? 'scale(1.1)' : 'scale(1)'
                      }}>{form.incidencias_resueltas}</div>
                      <div style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.3)', marginTop:12, fontWeight: 800, letterSpacing:'0.2em', textTransform: 'uppercase' }}>
                        {form.incidencias_resueltas === 1 ? 'INCIDENCIA' : 'INCIDENCIAS'}
                      </div>
                    </div>
                    <button onClick={()=>setForm(f=>({...f, incidencias_resueltas:f.incidencias_resueltas+1}))} style={{
                      width:64, height:64, borderRadius:20,
                      background: form.incidencias_resueltas > 0 ? 'rgba(96, 165, 250, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${form.incidencias_resueltas > 0 ? 'rgba(96, 165, 250, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                      color: form.incidencias_resueltas > 0 ? '#60A5FA' : '#fff',
                      fontSize:'2rem', fontWeight: 600,
                      display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                      transition:'all 0.3s',
                    }}
                      onMouseEnter={e=>{ e.currentTarget.style.background='rgba(96, 165, 250, 0.3)'; e.currentTarget.style.borderColor='#60A5FA' }}
                      onMouseLeave={e=>{ e.currentTarget.style.background=form.incidencias_resueltas>0?'rgba(96, 165, 250, 0.2)':'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor=form.incidencias_resueltas>0?'rgba(96, 165, 250, 0.5)':'rgba(255, 255, 255, 0.1)' }}
                    >+</button>
                  </div>
                  {form.incidencias_resueltas === 0 && (
                    <div className="animate-pulse" style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                      Sin reporte de errores hoy ✓
                    </div>
                  )}
                </div>
              </div>

              {/* Images Optimization Panel */}
              <div style={{ 
                background:'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', 
                border:'1px solid rgba(255, 255, 255, 0.12)', borderRadius:32, padding:'32px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: accentColor }} />
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `${accentColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: accentColor }}>🖼️</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize:'1.1rem', color: '#fff' }}>Gestión multimedia y procesos</div>
                    <div style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.4)', marginTop:2, fontWeight: 500 }}>Actualización de catálogo e imágenes de productos</div>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap:16 }}>
                  <Counter
                    value={form.imagenes_codigos_actualizadas}
                    onChange={v=>setForm(f=>({...f,imagenes_codigos_actualizadas:v}))}
                    color={accentColor}
                    label="🏷️ Carga de código de barras"
                    sublabel="Nuevos productos con GTIN/EAN correctamente vinculados"
                  />
                  <Counter
                    value={form.imagenes_peso_optimizado}
                    onChange={v=>setForm(f=>({...f,imagenes_peso_optimizado:v}))}
                    color="#3B82F6"
                    label="⚡ Optimización de peso visual"
                    sublabel="Mejora de tiempos de carga mediante webp/compresión"
                  />
                </div>
              </div>

              {/* Notes Panel */}
              <div style={{ 
                background:'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(20px)', 
                border:'1px solid rgba(255, 255, 255, 0.1)', borderRadius:24, padding:'28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                  <span style={{ fontSize:20 }}>📝</span>
                  <span style={{ fontWeight: 800, fontSize:'1rem', color: '#fff' }}>Observaciones técnicas</span>
                  <span style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.3)', fontWeight: 600 }}>(Notas internas)</span>
                </div>
                <textarea value={form.notas} onChange={e=>setForm(f=>({...f,notas:e.target.value}))}
                  placeholder="Escribe aquí cualquier observación relevante sobre la infraestructura o problemas detectados…" rows={3}
                  style={{ ...inputSt, resize:'vertical', lineHeight:1.6, background: 'rgba(255,255,255,0.03)' }} />
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end', paddingTop:12, paddingBottom:40 }}>
                <button onClick={handleSaveDiario} disabled={saving} style={{
                  padding:'18px 48px',
                  background: saved ? 'linear-gradient(135deg, #10B981, #059669)' : accentColor,
                  border:'none', borderRadius:20, color: saved ? '#fff' : '#080C1C',
                  fontSize:'1.1rem', fontWeight: 900, cursor:'pointer',
                  boxShadow: saved ? '0 10px 30px rgba(16, 185, 129, 0.3)' : `0 10px 30px ${accentColor}44`,
                  transition:'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }}
                  onMouseEnter={e=>!saving&&(e.currentTarget.style.transform='translateY(-6px) scale(1.02)')}
                  onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0) scale(1)')}
                >
                  {saving ? 'Procesando...' : saved ? '✓ Registro Actualizado' : mode==='edit' ? '✎ Confirmar Cambios' : '✚ Guardar Jornada Técnica'}
                </button>
              </div>
            </div>
          )}

          {/* ── TAB: GA4 ── */}
          {activeTab==='ga4' && (
            <div style={{ display:'flex', flexDirection:'column', gap:24, paddingBottom: 60 }}>
              {/* Toolbar GA4 */}
              <div style={{
                background:'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
                border:'1px solid rgba(255, 255, 255, 0.12)',
                borderRadius:24, padding:'20px 24px',
                display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(66, 133, 244, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/77/Google_Analytics_logo.svg" alt="GA4" style={{ width: 24 }} />
                  </div>
                  <div>
                    <div style={{ fontSize:'0.9rem', color:'#fff', fontWeight: 800 }}>Periodo de Análisis</div>
                    <div style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.4)', fontWeight: 600 }}>{new Date(getPeriodo(selectedDate)).toLocaleDateString('es-AR',{month:'long',year:'numeric'}).toUpperCase()}</div>
                  </div>
                </div>
                
                <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                  {existingGa4 && <span style={{ fontSize:'0.75rem', background:'rgba(16, 185, 129, 0.15)', color:'#10B981', border:'1px solid rgba(16, 185, 129, 0.3)', borderRadius:99, padding:'6px 14px', fontWeight:800, letterSpacing: '0.02em' }}>✓ DATOS SINCRONIZADOS</span>}
                  {syncMsg && <span style={{ fontSize:'0.8rem', color: syncMsg.startsWith('✅')?'#10B981':'#F0436A', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{syncMsg}</span>}
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
                          setSyncMsg('✅ Sincronizado')
                          await loadGa4(periodo)
                        } else {
                          setSyncMsg('❌ ' + (data.error || 'Error'))
                        }
                      } catch(e) {
                        setSyncMsg('❌ Error')
                      }
                      setSyncingGa4(false)
                    }}
                    disabled={syncingGa4}
                    style={{
                      fontSize:'0.9rem', fontWeight: 800, cursor: syncingGa4?'wait':'pointer',
                      background: '#4285F4', color: '#fff',
                      border:'none', borderRadius:14, padding:'10px 24px',
                      boxShadow: '0 6px 20px rgba(66, 133, 244, 0.3)',
                      transition:'all 0.3s', display: 'flex', alignItems: 'center', gap: 8
                    }}
                    onMouseEnter={e=>!syncingGa4&&(e.currentTarget.style.transform='translateY(-2px)')}
                    onMouseLeave={e=>(e.currentTarget.style.transform='none')}
                  >
                    {syncingGa4 ? '⟳' : '⚡'} 
                    {syncingGa4 ? 'Sincronizando...' : 'Auto-Sync Google Analytics'}
                  </button>
                </div>
              </div>

              {/* Main Metrics GA4 */}
              <div style={{ 
                background:'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', 
                border:'1px solid rgba(255, 255, 255, 0.12)', borderRadius:32, overflow:'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)' 
              }}>
                <div style={{ padding:'20px 32px', borderBottom:'1px solid rgba(255, 255, 255, 0.1)', display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:20 }}>📊</span>
                  <span style={{ fontWeight: 800, fontSize:'1.1rem', color: '#fff' }}>KPIs de Rendimiento Digital</span>
                </div>
                <div style={{ padding:'32px', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:20 }}>
                  {[
                    { key:'sesiones',              label:'Sesiones totales',      placeholder:'0', icon: '🌍' },
                    { key:'usuarios_activos',       label:'Usuarios únicos',       placeholder:'0', icon: '👤' },
                    { key:'pageviews',              label:'Páginas vistas',        placeholder:'0', icon: '📄' },
                    { key:'tasa_rebote',            label:'Bounce Rate (%)',       placeholder:'0.00', icon: '📉' },
                    { key:'duracion_promedio_seg',  label:'Sesión Prom. (seg)',    placeholder:'0', icon: '⏱️' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display:'flex', alignItems: 'center', gap: 6, fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', fontWeight:800, marginBottom:8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <span>{f.icon}</span> {f.label}
                      </label>
                      <input type="number" value={ga4[f.key]} onChange={e=>setGa4(g=>({...g,[f.key]:e.target.value}))}
                        placeholder={f.placeholder} style={inputSt} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Traffic Sources GA4 */}
              <div style={{ 
                background:'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', 
                border:'1px solid rgba(255, 255, 255, 0.12)', borderRadius:32, overflow:'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
              }}>
                <div style={{ padding:'20px 32px', borderBottom:'1px solid rgba(255, 255, 255, 0.1)', display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:20 }}>🔀</span>
                  <span style={{ fontWeight: 800, fontSize:'1.1rem', color: '#fff' }}>Canales de Adquisición</span>
                </div>
                <div style={{ padding:'32px', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:20 }}>
                  {[
                    { key:'trafico_organico', label:'Search (Orgánico)',  color:'#10B981', icon: '🔍' },
                    { key:'trafico_directo',  label:'Directo (URL)',     color:'#3B82F6', icon: '🔗' },
                    { key:'trafico_social',   label:'Social Media',      color:'#EC4899', icon: '📱' },
                    { key:'trafico_referido', label:'Referido / Blogs',  color:'#F59E0B', icon: '🤝' },
                    { key:'trafico_email',    label:'Email Marketing',   color:'#8B5CF6', icon: '📩' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display:'flex', alignItems: 'center', gap: 6, fontSize:'0.75rem', fontWeight:800, marginBottom:10, color:f.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <span>{f.icon}</span> {f.label}
                      </label>
                      <input type="number" value={ga4[f.key]} onChange={e=>setGa4(g=>({...g,[f.key]:e.target.value}))}
                        placeholder="0" style={{ ...inputSt, border: ga4[f.key] ? `1px solid ${f.color}44` : '1px solid rgba(255, 255, 255, 0.1)', background: ga4[f.key] ? `${f.color}08` : 'rgba(255, 255, 255, 0.05)' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* SEO Top Keywords */}
              <div style={{ 
                background:'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(28px)', 
                border:'1px solid rgba(255, 255, 255, 0.12)', borderRadius:32, overflow:'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
              }}>
                <div style={{ padding:'20px 32px', borderBottom:'1px solid rgba(255, 255, 255, 0.1)', display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:20 }}>🥇</span>
                  <span style={{ fontWeight: 800, fontSize:'1.1rem', color: '#fff' }}>Search Console Top Keywords</span>
                </div>
                <div style={{ padding:'32px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 100px 100px auto', gap:12, marginBottom:20 }}>
                    {[{k:'keyword',pl:'Keyword / Frase'},{k:'posicion',pl:'Posición'},{k:'clics',pl:'Clics'},{k:'impresiones',pl:'Impresiones'}].map(f => (
                      <input key={f.k} value={newKw[f.k]} onChange={e=>setNewKw(k=>({...k,[f.k]:e.target.value}))}
                        onKeyDown={e=>e.key==='Enter'&&addKeyword()} placeholder={f.pl}
                        style={{ ...inputSt, background: 'rgba(255, 255, 255, 0.03)' }} />
                    ))}
                    <button onClick={addKeyword} disabled={!newKw.keyword.trim()} style={{
                      padding:'12px 24px', background: newKw.keyword.trim() ? accentColor : 'rgba(255, 255, 255, 0.05)',
                      border:'none', borderRadius:14, color: newKw.keyword.trim() ? '#080C1C' : 'rgba(255, 255, 255, 0.2)',
                      fontSize:'0.9rem', fontWeight: 800, cursor: newKw.keyword.trim() ? 'pointer' : 'default', transition: 'all 0.3s'
                    }}>+ Agregar</button>
                  </div>

                  {ga4.seo_keywords.length > 0 ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {ga4.seo_keywords.map(kw => (
                        <div key={kw.id} className="animate-fadeUp" style={{
                          display:'grid', gridTemplateColumns:'1fr 100px 100px 100px 40px',
                          gap:12, padding:'16px 20px',
                          background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)',
                          borderRadius:16, alignItems:'center', transition: 'all 0.2s'
                        }}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                          onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                        >
                          <span style={{ fontSize:'0.95rem', color:'#fff', fontWeight: 700 }}>{kw.keyword}</span>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:'1.1rem', textAlign:'center', fontWeight:900, color:parseInt(kw.posicion)<=3?'#10B981':parseInt(kw.posicion)<=10?accentColor:'rgba(255,255,255,0.4)' }}>#{kw.posicion||'?'}</span>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.85rem', textAlign:'center', color:'rgba(255,255,255,0.5)', fontWeight: 600 }}>{kw.clics||'0'}</span>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.85rem', textAlign:'center', color:'rgba(255,255,255,0.3)', fontWeight: 500 }}>{kw.impresiones||'0'}</span>
                          <button onClick={()=>removeKeyword(kw.id)} style={{ background:'rgba(240, 67, 106, 0.1)', border:'none', color:'#F0436A', cursor:'pointer', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,0.25)', fontSize:'1rem', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: 24, fontWeight: 500 }}>
                      No hay palabras clave registradas para este periodo.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end', paddingTop:12 }}>
                <button onClick={handleSaveGA4} disabled={saving} style={{
                  padding:'18px 48px',
                  background: saved ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #4285F4, #34A853)',
                  border:'none', borderRadius:20, color:'#fff',
                  fontSize:'1.1rem', fontWeight: 900, cursor:'pointer', transition:'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  boxShadow: saved ? '0 10px 30px rgba(16, 185, 129, 0.3)' : '0 10px 30px rgba(66, 133, 244, 0.3)',
                }}
                  onMouseEnter={e=>!saving&&(e.currentTarget.style.transform='translateY(-6px) scale(1.02)')}
                  onMouseLeave={e=>(e.currentTarget.style.transform='none')}
                >
                  {saving ? 'Guardando...' : saved ? '✓ Analítica Actualizada' : existingGa4 ? '✎ Actualizar Datos GA4' : '✚ Confirmar Métricas GA4'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
