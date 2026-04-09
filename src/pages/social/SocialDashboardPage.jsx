import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'

const colorPrimary = 'var(--accent)'
const trafficColors = ['#60A5FA', '#34D399', '#F472B6', '#818CF8', '#A78BFA']

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const REDES = [
  { key: 'tiktok',    label: 'TikTok',    emoji: '🎵', color: '#60A5FA' },
  { key: 'youtube',   label: 'YouTube',   emoji: '▶️', color: '#38BDF8' },
  { key: 'whatsapp',  label: 'WhatsApp',  emoji: '💬', color: '#818CF8' },
  { key: 'instagram', label: 'Instagram', emoji: '📸', color: '#6366F1' },
]

function getPeriodo(y,m) { return `${y}-${String(m+1).padStart(2,'0')}-01` }
function fmt(n) {
  if (n===null||n===undefined) return '—'
  return Number(n).toLocaleString('es-AR')
}

// --- Modal Component ---
function GlassModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease'
      }} />
      <div className="glass-panel animate-fadeUp" style={{
        position: 'relative', width: '100%', maxWidth: 900,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        borderRadius: 'var(--radius-xl)', overflow: 'hidden',
        background: 'var(--bg-surface)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          padding: '20px 32px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)',
            width: 32, height: 32, borderRadius: '50%', cursor: 'pointer'
          }}>✕</button>
        </div>
        <div style={{ padding: 32, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function DeltaChip({ value, higherIsBetter=true }) {
  if (!value && value!==0) return null
  const good = higherIsBetter ? value>=0 : value<=0
  const c = good ? '#10b981' : '#f0436a'
  return (
    <span style={{ fontSize:'0.72rem',fontFamily:'var(--font-mono)',fontWeight:700,color:c,background:c+'18',border:`1px solid ${c}33`,borderRadius:99,padding:'2px 10px',marginLeft:8 }}>
      {value>=0?'▲':'▼'}{Math.abs(value).toFixed(1)}%
    </span>
  )
}

export default function SocialDashboardPage() {
  const now = new Date()
  const navigate = useNavigate()
  const [year,setYear]   = useState(now.getFullYear())
  const [month,setMonth] = useState(now.getMonth())
  const [metrics, setMetrics]   = useState(null)
  const [campanas, setCampanas] = useState([])
  const [prevMetrics, setPrev]  = useState(null)
  const [videos, setVideos]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [modalType, setModalType] = useState(null) // 'videos' | 'campanas'

  const isCurrentMonth = year===now.getFullYear()&&month===now.getMonth()

  useEffect(() => { loadAll() }, [year,month])

  async function loadAll() {
    setLoading(true)
    const periodo    = getPeriodo(year,month)
    const prevPeriod = month===0 ? getPeriodo(year-1,11) : getPeriodo(year,month-1)

    const [{ data: m }, { data: c }, { data: p }, { data: v }] = await Promise.all([
      supabase.from('social_media_metrics').select('*').eq('periodo',periodo).maybeSingle(),
      supabase.from('campanas_publicitarias').select('*').eq('periodo',periodo).order('fecha_inicio',{ascending:false}),
      supabase.from('social_media_metrics').select('*').eq('periodo',prevPeriod).maybeSingle(),
      supabase.from('social_videos').select('*').eq('periodo',periodo).order('created_at',{ascending:false}),
    ])
    setMetrics(m||null)
    setCampanas(c||[])
    setPrev(p||null)
    setVideos(v||[])
    setLoading(false)
  }

  function delta(curr, prev) {
    if (!prev || !curr) return null
    if (prev===0) return null
    return ((curr-prev)/prev*100)
  }

  const er = metrics?.interacciones && metrics?.alcance
    ? (metrics.interacciones/metrics.alcance*100).toFixed(2) : null
  const totalGasto = campanas.reduce((s,c)=>s+(c.presupuesto||0),0)

  // Videos stats
  const totalVideos = videos.reduce((s,v) => s + (v.cantidad||1), 0)
  const pieData = REDES.map(r => ({
    name: r.label,
    value: videos.filter(v => v.red_social === r.key).reduce((s,v) => s + (v.cantidad||1), 0)
  })).filter(d => d.value > 0)

  // Chart data for comparing current vs previous
  const comparisonData = metrics && prevMetrics ? [
    { name: 'Alcance', actual: metrics.alcance, anterior: prevMetrics.alcance },
    { name: 'Interacc.', actual: metrics.interacciones, anterior: prevMetrics.interacciones },
    { name: 'Seguidores', actual: metrics.nuevos_seguidores, anterior: prevMetrics.nuevos_seguidores },
  ] : []

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:32 }}>
        <div>
          <h1 style={{ fontSize:'2rem',fontWeight:800,letterSpacing:'-1px',marginBottom:6 }}>Social Media</h1>
          <p style={{ color:'var(--text-secondary)',fontSize:'1rem' }}>Métricas consolidadas · Community Manager</p>
        </div>
        <div style={{ display:'flex',gap:8,alignItems:'center' }}>
          <button onClick={()=>{if(month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1)}}
            style={{width:40,height:40,borderRadius:12,background:'var(--bg-elevated)',border:'1px solid var(--border)',color:'var(--text-secondary)',fontSize:'1.2rem',cursor:'pointer'}}>‹</button>
          <span style={{fontFamily:'var(--font-mono)',fontSize:'0.9rem',color:'var(--text-primary)',minWidth:140,textAlign:'center', fontWeight: 600}}>{MONTHS_ES[month]} {year}</span>
          <button onClick={()=>{if(isCurrentMonth)return;if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1)}}
            disabled={isCurrentMonth} style={{width:40,height:40,borderRadius:12,background:'var(--bg-elevated)',border:'1px solid var(--border)',color:isCurrentMonth?'var(--text-muted)':'var(--text-secondary)',fontSize:'1.2rem',cursor:isCurrentMonth?'not-allowed':'pointer'}}>›</button>
          <button onClick={()=>navigate('/dashboard/social/ingresar')} style={{
            padding:'10px 24px',marginLeft:12,background:'var(--accent)',border:'none',borderRadius:12,
            color:'#fff',fontSize:'0.9rem',fontWeight:700,cursor:'pointer',
            boxShadow:'0 4px 20px var(--accent-glow)',
          }}>✚ {metrics ? 'Actualizar' : 'Ingresar métricas'}</button>
        </div>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:100}}>
          <div style={{width:40,height:40,borderRadius:'50%',border:'3px solid var(--border-bright)',borderTopColor:colorPrimary,animation:'spin 0.8s linear infinite'}}/>
        </div>
      ) : !metrics && campanas.length===0 && videos.length===0 ? (
        <div style={{textAlign:'center',padding:'80px 24px',border:`2px dashed var(--border-bright)`,borderRadius:24,background:'var(--glass-bg)'}}>
          <div style={{fontSize:48,marginBottom:16}}>📱</div>
          <p style={{color:'var(--text-secondary)',marginBottom:24, fontSize: '1.1rem'}}>No hay datos para {MONTHS_ES[month]} {year}</p>
          <div style={{display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap'}}>
            <button onClick={()=>navigate('/dashboard/social/ingresar')} style={{padding:'14px 32px',background:colorPrimary,border:'none',borderRadius:14,color:'#fff',fontWeight:700,fontSize:'1rem',cursor:'pointer',boxShadow:'0 4px 20px var(--accent-glow)'}}>
              Ingresar métricas →
            </button>
            <button onClick={()=>navigate('/dashboard/social/campanas')} style={{padding:'14px 32px',background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:14,color:'var(--text-primary)',fontWeight:600,fontSize:'1rem',cursor:'pointer'}}>
              Registrar campaña
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Main KPIs */}
          {metrics && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:16,marginBottom:24}}>
              {[
                { label:'Seguidores Totales', key:'seguidores_total', icon:'👥', c:trafficColors[0] },
                { label:'Nuevos Seguidores',  key:'nuevos_seguidores', icon:'📈', c:trafficColors[1] },
                { label:'Alcance Total',      key:'alcance',          icon:'🌐', c:trafficColors[3] },
                { label:'Interacciones',      key:'interacciones',    icon:'❤️', c:trafficColors[2] },
              ].map((k,i) => (
                <div key={k.key} className="animate-fadeUp" style={{
                  animationDelay:`${i*0.05}s`,
                  background:'var(--bg-surface)',border:'1px solid var(--border)',
                  borderRadius:'var(--radius-lg)',padding:'24px',position:'relative',overflow:'hidden',
                  boxShadow: '0 8px 32px var(--glass-shadow)'
                }}>
                  <div style={{position:'absolute',top:0,left:0,right:0,height:4,background:k.c,opacity:0.9}}/>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                    <span style={{fontSize:'0.85rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase'}}>{k.label}</span>
                    <span style={{fontSize:22}}>{k.icon}</span>
                  </div>
                  <div style={{fontFamily:'var(--font-display)',fontSize:'3rem',fontWeight:800,color:'var(--text-primary)',letterSpacing:'-1.5px',lineHeight:1,marginBottom:8}}>
                    {fmt(metrics[k.key])}
                  </div>
                  <div style={{display:'flex',alignItems:'center'}}>
                    <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>vs mes anterior</span>
                    <DeltaChip value={delta(metrics[k.key], prevMetrics?.[k.key])} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Charts Row */}
          <div style={{display:'grid',gridTemplateColumns:pieData.length>0?'2fr 1fr':'1fr',gap:16,marginBottom:24}}>
             {/* Comparative Chart */}
             <div className="glass-panel" style={{padding:'24px 32px',borderRadius:'var(--radius-xl)'}}>
                <div style={{fontSize:'0.85rem',fontWeight:700,color:'var(--text-secondary)',letterSpacing:'0.05em',marginBottom:24}}>RENDIMIENTO VS MES ANTERIOR</div>
                <div style={{width:'100%',height:320}}>
                  <ResponsiveContainer>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v)=>v>=1000?`${(v/1000).toFixed(1)}k`:v} />
                      <Tooltip contentStyle={{background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8}} />
                      <Legend verticalAlign="top" height={36}/>
                      <Bar dataKey="actual" name="Mes Actual" fill={colorPrimary} radius={[4,4,0,0]} />
                      <Bar dataKey="anterior" name="Mes Anterior" fill="var(--bg-hover)" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </div>

             {/* Donut Chart - Content Distribution */}
             {pieData.length > 0 && (
              <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: 16 }}>CONTENIDO (VIDEOS)</div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={trafficColors[index % trafficColors.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', pointerEvents: 'none' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalVideos}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Videos</span>
                  </div>
                </div>
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pieData.map((f, i) => (
                    <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: trafficColors[i % trafficColors.length] }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{f.name}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Secondary Stats & Actions */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {/* Engagement Rate Card */}
            {er && (
              <div className="glass-panel" style={{padding:'24px', borderRadius:'var(--radius-lg)', display:'flex', alignItems:'center', gap:20, boxShadow:'0 8px 32px var(--glass-shadow)'}}>
                <div style={{width:64, height:64, borderRadius:'50%', background:'var(--accent-glow)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32}}>✨</div>
                <div>
                  <div style={{fontSize:'0.8rem', fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.05em', marginBottom:4}}>ENGAGEMENT RATE</div>
                  <div style={{fontFamily:'var(--font-display)', fontSize:'3rem', fontWeight:800, color:colorPrimary, letterSpacing:'-1.5px'}}>{er}%</div>
                </div>
                {prevMetrics && (
                  <div style={{marginLeft:'auto'}}>
                    <DeltaChip value={delta(metrics.interacciones/metrics.alcance, prevMetrics.interacciones/prevMetrics.alcance)} />
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions / Lists */}
            <div className="glass-panel" style={{padding:'24px', borderRadius:'var(--radius-lg)', display:'flex', gap:12}}>
                <button onClick={()=>setModalType('videos')} style={{flex:1, height: '100%', border: '1px solid var(--border)', background:'var(--bg-elevated)', borderRadius:12, padding:16, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8}}>
                  <span style={{fontSize:24}}>🎬</span>
                  <span style={{fontSize:'0.85rem', fontWeight:700, color:'var(--text-primary)'}}>Ver Vídeos</span>
                  <span style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>{totalVideos} registros</span>
                </button>
                <button onClick={()=>setModalType('campanas')} style={{flex:1, height: '100%', border: '1px solid var(--border)', background:'var(--bg-elevated)', borderRadius:12, padding:16, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8}}>
                  <span style={{fontSize:24}}>📣</span>
                  <span style={{fontSize:'0.85rem', fontWeight:700, color:'var(--text-primary)'}}>Ver Campañas</span>
                  <span style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>{campanas.length} activas</span>
                </button>
            </div>
          </div>

          {/* Modals */}
          <GlassModal isOpen={modalType==='videos'} onClose={()=>setModalType(null)} title="Vídeos del Mes">
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                  {videos.map(v => {
                    const red = REDES.find(r => r.key === v.red_social) || REDES[3]
                    return (
                      <div key={v.id} style={{display:'flex',alignItems:'center',gap:16,padding:'16px',background:'var(--bg-elevated)',borderRadius:12, border:'1px solid var(--border)'}}>
                        <span style={{fontSize:'0.8rem',fontWeight:700,color:red.color,background:red.color+'15',border:`1px solid ${red.color}33`,borderRadius:8,padding:'6px 12px',flexShrink:0}}>
                          {red.emoji} {red.label}
                        </span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:'1rem',fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>{v.etiqueta}</div>
                          <div style={{fontSize:'0.8rem',color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>{v.fecha || 'Sin fecha'}</div>
                        </div>
                        <div style={{fontSize:'1.2rem', fontWeight:800, color:colorPrimary}}>×{v.cantidad || 1}</div>
                      </div>
                    )
                  })}
              </div>
          </GlassModal>

          <GlassModal isOpen={modalType==='campanas'} onClose={()=>setModalType(null)} title="Campañas Publicitarias">
              <div style={{display:'flex', flexDirection:'column', gap:16}}>
                {campanas.map(c => (
                  <div key={c.id} style={{padding:'20px', background:'var(--bg-elevated)', borderRadius:16, border:'1px solid var(--border)'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12}}>
                      <div>
                        <div style={{fontSize:'1.1rem', fontWeight:800, color:'var(--text-primary)', marginBottom:4}}>{c.nombre}</div>
                        <div style={{fontSize:'0.8rem', color:'var(--text-muted)', fontFamily:'var(--font-mono)'}}>
                          {c.fecha_inicio} al {c.fecha_fin}
                        </div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase'}}>Presupuesto</div>
                        <div style={{fontSize:'1.1rem', fontWeight:800, color:'#f59e0b'}}>${c.presupuesto?.toLocaleString('es-AR')}</div>
                      </div>
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, paddingTop:12, borderTop:'1px solid var(--border)'}}>
                      <div>
                        <div style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>ALCANCE</div>
                        <div style={{fontSize:'0.9rem', fontWeight:700, color:trafficColors[0]}}>{fmt(c.alcance)}</div>
                      </div>
                      <div>
                        <div style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>CLICS (CTR)</div>
                        <div style={{fontSize:'0.9rem', fontWeight:700, color:colorPrimary}}>
                          {fmt(c.clics)} ({c.alcance ? (c.clics/c.alcance*100).toFixed(2) : 0}%)
                        </div>
                      </div>
                      <div>
                        <div style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>CONV.</div>
                        <div style={{fontSize:'0.9rem', fontWeight:700, color:trafficColors[1]}}>{fmt(c.conversiones)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          </GlassModal>
        </>
      )}
    </div>
  )
}
