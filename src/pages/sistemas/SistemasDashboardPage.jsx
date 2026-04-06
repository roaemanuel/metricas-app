import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

const color = '#f5c518'

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function StatCard({ label, value, unit='', icon, c, sub, delay=0 }) {
  return (
    <div className="animate-fadeUp" style={{
      animationDelay:`${delay}s`,
      background:'var(--bg-surface)', border:'1px solid var(--border)',
      borderRadius:14, padding:'20px 22px', position:'relative', overflow:'hidden',
      boxShadow: '0 4px 20px var(--glass-shadow)',
    }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:c, opacity:0.9 }} />
      <div style={{ fontSize:22, marginBottom:10 }}>{icon}</div>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:'2rem', fontWeight:700, color: 'var(--text-primary)', letterSpacing:'-1px', lineHeight:1, marginBottom:6 }}>
        {value}<span style={{ fontSize:'1rem', marginLeft:3 }}>{unit}</span>
      </div>
      <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{label}</div>
      {sub && <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:3 }}>{sub}</div>}
    </div>
  )
}

function MiniBar({ data, c }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:60 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
          <div style={{
            width:'100%', borderRadius:'3px 3px 0 0',
            background: d.value > 0 ? c : 'var(--border)',
            height:`${Math.max((d.value / max) * 50, d.value > 0 ? 3 : 2)}px`,
            opacity: d.value > 0 ? 1 : 0.3, transition:'height 0.4s ease',
          }} />
          <span style={{ fontSize:'0.58rem', color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function SistemasDashboardPage() {
  const now = new Date()
  const navigate = useNavigate()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [records, setRecords] = useState([])
  const [ga4data, setGa4data] = useState(null)
  const [loading, setLoading] = useState(true)

  const periodo = `${year}-${String(month+1).padStart(2,'0')}-01`
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  useEffect(() => { loadMonth() }, [year, month])

  async function loadMonth() {
    setLoading(true)
    const [{ data: daily }, { data: ga4 }] = await Promise.all([
      supabase.from('sistemas_diario').select('*').eq('periodo', periodo).order('fecha'),
      supabase.from('ga4_metrics').select('*').eq('periodo', periodo).maybeSingle(),
    ])
    setRecords(daily || [])
    setGa4data(ga4 || null)
    setLoading(false)
  }

  const totals = records.reduce((acc, r) => {
    acc.incidencias += r.incidencias_resueltas || 0
    acc.codigos     += r.imagenes_codigos_actualizadas || 0
    acc.optimizadas += r.imagenes_peso_optimizado || 0
    acc.dias        += 1
    return acc
  }, { incidencias:0, codigos:0, optimizadas:0, dias:0 })

  const daysInMonth = new Date(year, month+1, 0).getDate()
  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const dayStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`
    const rec = records.find(r => r.fecha === dayStr)
    return { label: String(i+1), value: rec ? rec.incidencias_resueltas || 0 : 0 }
  })

  const traficoTotal = ga4data
    ? (ga4data.trafico_organico||0)+(ga4data.trafico_directo||0)+(ga4data.trafico_social||0)+(ga4data.trafico_referido||0)+(ga4data.trafico_email||0)
    : 0

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:'1.6rem', fontWeight:800, letterSpacing:'-0.8px', marginBottom:4 }}>Sistemas / Web</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.88rem' }}>Resumen mensual · Incidencias, imágenes y Google Analytics</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={() => { if(month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }}
            style={{ width:34, height:34, borderRadius:8, background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:'1rem', cursor:'pointer' }}>‹</button>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.82rem', color:'var(--text-primary)', minWidth:130, textAlign:'center' }}>{MONTHS_ES[month]} {year}</span>
          <button onClick={() => { if(isCurrentMonth)return; if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }}
            disabled={isCurrentMonth}
            style={{ width:34, height:34, borderRadius:8, background:'var(--bg-elevated)', border:'1px solid var(--border)', color:isCurrentMonth?'var(--text-muted)':'var(--text-secondary)', fontSize:'1rem', cursor:isCurrentMonth?'not-allowed':'pointer' }}>›</button>
          <button onClick={() => navigate('/dashboard/sistemas/ingresar')} style={{
            padding:'8px 18px', marginLeft:8, background: 'var(--accent)',
            border:'none', borderRadius:8, color:'#fff',
            fontSize:'0.82rem', fontWeight:700, cursor:'pointer',
            boxShadow:'0 2px 12px var(--accent-glow)',
          }}>✚ Registrar hoy</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
          <div style={{ width:28, height:28, borderRadius:'50%', border:'2px solid var(--border-bright)', borderTopColor:color, animation:'spin 0.8s linear infinite' }} />
        </div>
      ) : records.length === 0 && !ga4data ? (
        <div style={{ textAlign:'center', padding:'60px 24px', border:`1px dashed ${color}44`, borderRadius:16, background:'var(--bg-surface)' }}>
          <div style={{ fontSize:40, marginBottom:14 }}>🖥️</div>
          <p style={{ color:'var(--text-secondary)', marginBottom:20 }}>No hay registros para {MONTHS_ES[month]} {year}</p>
          <button onClick={() => navigate('/dashboard/sistemas/ingresar')} style={{
            padding:'12px 28px', background:color, border:'none', borderRadius:10,
            color:'#000', fontWeight:700, fontSize:'0.88rem', cursor:'pointer',
          }}>Ingresar primer registro →</button>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:20 }}>
            <StatCard label="Incidencias resueltas" value={totals.incidencias} icon="🔧" c={color} delay={0} sub={`${totals.dias} día${totals.dias!==1?'s':''} con registro`} />
            <StatCard label="Imgs. con código"      value={totals.codigos}     icon="🏷️" c="#3b82f6" delay={0.05} />
            <StatCard label="Imgs. optimizadas"     value={totals.optimizadas} icon="⚡" c="#0eb8d4" delay={0.1} />
            {ga4data && <StatCard label="Sesiones web"    value={ga4data.sesiones?.toLocaleString('es-AR') || '—'} icon="🌐" c="#10b981" delay={0.15} />}
            {ga4data && <StatCard label="Usuarios activos" value={ga4data.usuarios_activos?.toLocaleString('es-AR') || '—'} icon="👤" c="#8b5cf6" delay={0.2} />}
          </div>

          {/* Chart row */}
          <div style={{ display:'grid', gridTemplateColumns: ga4data ? '1fr 1fr' : '1fr', gap:14, marginBottom:14 }}>
            {records.length > 0 && (
              <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:14, padding:'20px 24px', boxShadow: '0 4px 16px var(--glass-shadow)' }}>
                <div style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:14, letterSpacing:'0.05em' }}>INCIDENCIAS DIARIAS</div>
                <MiniBar data={chartData} c={color} />
              </div>
            )}
            {ga4data && (
              <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:14, padding:'20px 24px', boxShadow: '0 4px 16px var(--glass-shadow)' }}>
                <div style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:14, letterSpacing:'0.05em' }}>
                  GOOGLE ANALYTICS — {MONTHS_ES[month].toUpperCase()} {year}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[
                    { label:'Páginas vistas',   value: ga4data.pageviews?.toLocaleString('es-AR'),                             c:'#10b981' },
                    { label:'Tasa de rebote',   value: ga4data.tasa_rebote ? ga4data.tasa_rebote+'%' : null,                   c:'#f0436a' },
                    { label:'Duración promedio',value: ga4data.duracion_promedio_seg ? Math.floor(ga4data.duracion_promedio_seg/60)+'m '+Math.round(ga4data.duracion_promedio_seg%60)+'s' : null, c:'#8b5cf6' },
                  ].filter(m => m.value).map(m => (
                    <div key={m.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>{m.label}</span>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.9rem', fontWeight:600, color:m.c }}>{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fuentes de tráfico */}
          {ga4data && traficoTotal > 0 && (
            <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:14, padding:'20px 24px', marginBottom:14, boxShadow: '0 4px 16px var(--glass-shadow)' }}>
              <div style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:14, letterSpacing:'0.05em' }}>FUENTES DE TRÁFICO</div>
              <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                {[
                  { label:'Orgánico', value:ga4data.trafico_organico,  c:'#10b981' },
                  { label:'Directo',  value:ga4data.trafico_directo,   c:'#3b82f6' },
                  { label:'Social',   value:ga4data.trafico_social,    c:'#ec4899' },
                  { label:'Referido', value:ga4data.trafico_referido,  c:'#f59e0b' },
                  { label:'Email',    value:ga4data.trafico_email,     c:'#8b5cf6' },
                ].filter(f => f.value > 0).map(f => {
                  const pct = traficoTotal > 0 ? (f.value / traficoTotal * 100) : 0
                  return (
                    <div key={f.label}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{f.label}</span>
                        <div style={{ display:'flex', gap:10 }}>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.78rem', color:'var(--text-muted)' }}>{pct.toFixed(1)}%</span>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.78rem', fontWeight:600, color:f.c }}>{f.value.toLocaleString('es-AR')}</span>
                        </div>
                      </div>
                      <div style={{ height:5, background:'var(--bg-elevated)', borderRadius:99, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:f.c, borderRadius:99, transition:'width 0.6s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* SEO Keywords */}
          {ga4data?.seo_keywords?.length > 0 && (
            <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', marginBottom:14, boxShadow: '0 4px 16px var(--glass-shadow)' }}>
              <div style={{ padding:'14px 24px', borderBottom:'1px solid var(--border)', fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', letterSpacing:'0.05em' }}>
                SEO KEYWORDS — TOP POSICIONES
              </div>
              <div style={{ padding:'14px 24px', display:'flex', flexDirection:'column', gap:6 }}>
                {[...ga4data.seo_keywords].sort((a,b) => parseInt(a.posicion||99)-parseInt(b.posicion||99)).map((kw,i) => (
                  <div key={i} style={{
                    display:'grid', gridTemplateColumns:'1fr 60px 70px 80px', gap:12,
                    padding:'8px 12px', background:'var(--bg-elevated)',
                    border:'1px solid var(--border)', borderRadius:8, alignItems:'center',
                  }}>
                    <span style={{ fontSize:'0.82rem', color:'var(--text-primary)' }}>{kw.keyword}</span>
                    <span style={{
                      fontFamily:'var(--font-mono)', fontSize:'0.85rem', fontWeight:700, textAlign:'center',
                      color: parseInt(kw.posicion)<=3?'#10b981':parseInt(kw.posicion)<=10?color:'var(--text-secondary)',
                    }}>#{kw.posicion}</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.78rem', textAlign:'center', color:'var(--text-secondary)' }}>{kw.clics ? kw.clics+' clics' : '—'}</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.78rem', textAlign:'center', color:'var(--text-muted)' }}>{kw.impresiones ? kw.impresiones+' impr.' : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Log diario */}
          {records.length > 0 && (
            <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', boxShadow: '0 4px 16px var(--glass-shadow)' }}>
              <div style={{ padding:'14px 24px', borderBottom:'1px solid var(--border)', fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', letterSpacing:'0.05em' }}>
                REGISTROS DEL MES ({records.length})
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.82rem' }}>
                  <thead>
                    <tr style={{ background:'var(--bg-elevated)' }}>
                      {['Fecha','Incidencias','Cód. barras','Optimizadas','Notas'].map(h => (
                        <th key={h} style={{ padding:'10px 14px', textAlign:'left', color:'var(--text-muted)', fontWeight:600, fontSize:'0.72rem', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => (
                      <tr key={r.id} style={{ borderTop:'1px solid var(--border)', background: i%2===0?'transparent':'var(--bg-elevated)' }}>
                        <td style={{ padding:'10px 14px', fontFamily:'var(--font-mono)', color:'var(--text-secondary)', whiteSpace:'nowrap' }}>{r.fecha?.slice(5)}</td>
                        <td style={{ padding:'10px 14px', textAlign:'center', fontFamily:'var(--font-mono)', color: r.incidencias_resueltas>0?color:'var(--text-muted)', fontWeight: r.incidencias_resueltas>0?600:400 }}>{r.incidencias_resueltas||0}</td>
                        <td style={{ padding:'10px 14px', textAlign:'center', fontFamily:'var(--font-mono)', color: r.imagenes_codigos_actualizadas>0?'#3b82f6':'var(--text-muted)' }}>{r.imagenes_codigos_actualizadas||0}</td>
                        <td style={{ padding:'10px 14px', textAlign:'center', fontFamily:'var(--font-mono)', color: r.imagenes_peso_optimizado>0?'#0eb8d4':'var(--text-muted)' }}>{r.imagenes_peso_optimizado||0}</td>
                        <td style={{ padding:'10px 14px', color:'var(--text-muted)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.notas||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
