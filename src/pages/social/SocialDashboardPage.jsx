import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

const color = '#f0436a'
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const REDES = [
  { key: 'tiktok',    label: 'TikTok',    emoji: '🎵', color: '#010101', bg: '#69C9D020' },
  { key: 'youtube',   label: 'YouTube',   emoji: '▶️', color: '#FF0000', bg: '#FF000020' },
  { key: 'whatsapp',  label: 'WhatsApp',  emoji: '💬', color: '#25D366', bg: '#25D36620' },
  { key: 'instagram', label: 'Instagram', emoji: '📸', color: '#E1306C', bg: '#E1306C20' },
]

function getPeriodo(y,m) { return `${y}-${String(m+1).padStart(2,'0')}-01` }
function fmt(n) {
  if (n===null||n===undefined) return '—'
  return Number(n).toLocaleString('es-AR')
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
  function DeltaChip({ value, higherIsBetter=true }) {
    if (!value && value!==0) return null
    const good = higherIsBetter ? value>=0 : value<=0
    const c = good ? '#10b981' : '#f0436a'
    return (
      <span style={{ fontSize:'0.72rem',fontFamily:'var(--font-mono)',fontWeight:700,color:c,background:c+'18',border:`1px solid ${c}33`,borderRadius:99,padding:'1px 8px',marginLeft:6 }}>
        {value>=0?'▲':'▼'}{Math.abs(value).toFixed(1)}%
      </span>
    )
  }

  const er = metrics?.interacciones && metrics?.alcance
    ? (metrics.interacciones/metrics.alcance*100).toFixed(2) : null
  const totalGasto = campanas.reduce((s,c)=>s+(c.presupuesto||0),0)

  // Videos stats
  const totalVideos = videos.reduce((s,v) => s + (v.cantidad||1), 0)
  const videosPorRed = REDES.map(r => ({
    ...r,
    total: videos.filter(v => v.red_social === r.key).reduce((s,v) => s + (v.cantidad||1), 0),
    items: videos.filter(v => v.red_social === r.key),
  })).filter(r => r.total > 0)

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:'1.6rem',fontWeight:800,letterSpacing:'-0.8px',marginBottom:4 }}>Social Media</h1>
          <p style={{ color:'var(--text-secondary)',fontSize:'0.88rem' }}>Resumen mensual · Community</p>
        </div>
        <div style={{ display:'flex',gap:8,alignItems:'center' }}>
          <button onClick={()=>{if(month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1)}}
            style={{width:34,height:34,borderRadius:8,background:'var(--bg-elevated)',border:'1px solid var(--border)',color:'var(--text-secondary)',fontSize:'1rem',cursor:'pointer'}}>‹</button>
          <span style={{fontFamily:'var(--font-mono)',fontSize:'0.82rem',color:'var(--text-primary)',minWidth:130,textAlign:'center'}}>{MONTHS_ES[month]} {year}</span>
          <button onClick={()=>{if(isCurrentMonth)return;if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1)}}
            disabled={isCurrentMonth} style={{width:34,height:34,borderRadius:8,background:'var(--bg-elevated)',border:'1px solid var(--border)',color:isCurrentMonth?'var(--text-muted)':'var(--text-secondary)',fontSize:'1rem',cursor:isCurrentMonth?'not-allowed':'pointer'}}>›</button>
          <button onClick={()=>navigate('/dashboard/social/ingresar')} style={{
            padding:'8px 18px',marginLeft:8,background:color,border:'none',borderRadius:8,
            color:'#fff',fontSize:'0.82rem',fontWeight:700,cursor:'pointer',
            boxShadow:`0 2px 12px ${color}44`,
          }}>✚ {metrics ? 'Actualizar' : 'Ingresar métricas'}</button>
        </div>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:60}}>
          <div style={{width:28,height:28,borderRadius:'50%',border:'2px solid var(--border-bright)',borderTopColor:color,animation:'spin 0.8s linear infinite'}}/>
        </div>
      ) : !metrics && campanas.length===0 && videos.length===0 ? (
        <div style={{textAlign:'center',padding:'60px 24px',border:`1px dashed ${color}44`,borderRadius:16,background:'var(--bg-surface)'}}>
          <div style={{fontSize:40,marginBottom:14}}>📱</div>
          <p style={{color:'var(--text-secondary)',marginBottom:20}}>No hay datos para {MONTHS_ES[month]} {year}</p>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            <button onClick={()=>navigate('/dashboard/social/ingresar')} style={{padding:'12px 24px',background:color,border:'none',borderRadius:10,color:'#fff',fontWeight:700,fontSize:'0.88rem',cursor:'pointer'}}>
              Ingresar métricas →
            </button>
            <button onClick={()=>navigate('/dashboard/social/campanas')} style={{padding:'12px 24px',background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:10,color:'var(--text-primary)',fontWeight:600,fontSize:'0.88rem',cursor:'pointer'}}>
              Registrar campaña →
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Instagram KPIs */}
          {metrics && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:12,marginBottom:14}}>
              {[
                { label:'Seguidores',     key:'seguidores_total',  icon:'👥', c:color },
                { label:'Nuevos este mes',key:'nuevos_seguidores', icon:'📈', c:'#f59e0b' },
                { label:'Alcance',        key:'alcance',           icon:'🌐', c:'#3b82f6' },
                { label:'Interacciones',  key:'interacciones',     icon:'❤️', c:'#ec4899' },
              ].map((k,i) => (
                <div key={k.key} className="animate-fadeUp" style={{
                  animationDelay:`${i*0.05}s`,
                  background:'var(--bg-surface)',border:'1px solid var(--border)',
                  borderRadius:14,padding:'18px 20px',position:'relative',overflow:'hidden',
                }}>
                  <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:k.c,opacity:0.7}}/>
                  <div style={{fontSize:20,marginBottom:8}}>{k.icon}</div>
                  <div style={{fontFamily:'var(--font-mono)',fontSize:'1.6rem',fontWeight:600,color:k.c,letterSpacing:'-0.5px',lineHeight:1,marginBottom:4}}>
                    {fmt(metrics[k.key])}
                  </div>
                  <div style={{fontSize:'0.78rem',color:'var(--text-secondary)',display:'flex',alignItems:'center'}}>
                    {k.label}
                    <DeltaChip value={delta(metrics[k.key], prevMetrics?.[k.key])} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Engagement rate */}
          {er && (
            <div style={{background:'var(--bg-surface)',border:`1px solid ${color}33`,borderRadius:14,padding:'18px 24px',marginBottom:14,display:'flex',alignItems:'center',gap:16}}>
              <span style={{fontSize:24}}>✨</span>
              <div>
                <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--text-muted)',letterSpacing:'0.08em',marginBottom:3}}>ENGAGEMENT RATE</div>
                <div style={{fontFamily:'var(--font-mono)',fontSize:'2rem',fontWeight:700,color,letterSpacing:'-1px'}}>{er}%</div>
              </div>
              <div style={{marginLeft:8,fontSize:'0.8rem',color:'var(--text-muted)'}}>
                {metrics.interacciones?.toLocaleString('es-AR')} interacciones sobre {metrics.alcance?.toLocaleString('es-AR')} de alcance
              </div>
              {prevMetrics?.interacciones && prevMetrics?.alcance && (
                <div style={{marginLeft:'auto'}}>
                  <DeltaChip value={delta(
                    metrics.interacciones/metrics.alcance,
                    prevMetrics.interacciones/prevMetrics.alcance
                  )} />
                </div>
              )}
            </div>
          )}

          {/* Videos del mes */}
          {totalVideos > 0 && (
            <div style={{background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden',marginBottom:14}}>
              <div style={{padding:'14px 22px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:'0.78rem',fontWeight:700,color:'var(--text-secondary)',letterSpacing:'0.05em'}}>🎬 VIDEOS DEL MES</span>
                  <span style={{fontFamily:'var(--font-mono)',fontSize:'0.78rem',fontWeight:700,color,background:color+'15',borderRadius:99,padding:'1px 8px'}}>{totalVideos}</span>
                </div>
                <button onClick={()=>navigate('/dashboard/social/ingresar')} style={{background:'none',border:'none',color,fontSize:'0.75rem',fontWeight:600,cursor:'pointer'}}>
                  Agregar →
                </button>
              </div>
              <div style={{padding:'16px 22px'}}>
                {/* Resumen por red */}
                <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
                  {videosPorRed.map(r => (
                    <div key={r.key} style={{
                      display:'flex',alignItems:'center',gap:8,
                      background:r.bg,border:`1px solid ${r.color}44`,
                      borderRadius:10,padding:'8px 14px',
                    }}>
                      <span style={{fontSize:18}}>{r.emoji}</span>
                      <div>
                        <div style={{fontFamily:'var(--font-mono)',fontSize:'1.1rem',fontWeight:700,color:r.color,lineHeight:1}}>{r.total}</div>
                        <div style={{fontSize:'0.65rem',color:'var(--text-muted)',fontWeight:600}}>{r.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Lista de videos */}
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {videos.slice(0,6).map(v => {
                    const red = REDES.find(r => r.key === v.red_social) || REDES[3]
                    return (
                      <div key={v.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',background:'var(--bg-elevated)',borderRadius:8}}>
                        <span style={{fontSize:'0.72rem',fontWeight:700,color:red.color,background:red.bg,border:`1px solid ${red.color}33`,borderRadius:6,padding:'3px 8px',flexShrink:0}}>
                          {red.emoji} {red.label}
                        </span>
                        <span style={{fontSize:'0.82rem',color:'var(--text-primary)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v.etiqueta}</span>
                        {v.cantidad > 1 && <span style={{fontFamily:'var(--font-mono)',fontSize:'0.75rem',fontWeight:700,color,flexShrink:0}}>×{v.cantidad}</span>}
                        {v.fecha && <span style={{fontSize:'0.68rem',color:'var(--text-muted)',fontFamily:'var(--font-mono)',flexShrink:0}}>{v.fecha.slice(8)}/{v.fecha.slice(5,7)}</span>}
                      </div>
                    )
                  })}
                  {videos.length > 6 && (
                    <div style={{textAlign:'center',fontSize:'0.75rem',color:'var(--text-muted)',fontFamily:'var(--font-mono)',paddingTop:4}}>
                      + {videos.length - 6} más · <button onClick={()=>navigate('/dashboard/social/ingresar')} style={{background:'none',border:'none',color,cursor:'pointer',fontSize:'0.75rem',fontWeight:600}}>ver todos</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Campañas */}
          {campanas.length > 0 && (
            <div style={{background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden'}}>
              <div style={{padding:'14px 22px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:'0.78rem',fontWeight:700,color:'var(--text-secondary)',letterSpacing:'0.05em'}}>
                  CAMPAÑAS DEL MES ({campanas.length})
                </span>
                <div style={{display:'flex',gap:16,alignItems:'center'}}>
                  {totalGasto > 0 && <span style={{fontFamily:'var(--font-mono)',fontSize:'0.82rem',color:'#f59e0b',fontWeight:700}}>
                    Gasto: ${totalGasto.toLocaleString('es-AR')}
                  </span>}
                  <button onClick={()=>navigate('/dashboard/social/campanas')} style={{background:'none',border:'none',color,fontSize:'0.75rem',fontWeight:600,cursor:'pointer'}}>
                    Ver todo →
                  </button>
                </div>
              </div>
              <div style={{padding:'12px 0'}}>
                {campanas.map((c,i) => {
                  const ctr = c.clics&&c.alcance ? (c.clics/c.alcance*100).toFixed(2) : null
                  return (
                    <div key={c.id} style={{
                      padding:'10px 22px',
                      borderTop:i>0?'1px solid var(--border)':'none',
                      display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',
                    }}>
                      <div>
                        <div style={{fontSize:'0.85rem',fontWeight:600,color:'var(--text-primary)',marginBottom:2}}>{c.nombre}</div>
                        <div style={{fontSize:'0.72rem',color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>
                          {c.fecha_inicio?.slice(8)}/{c.fecha_inicio?.slice(5,7)} → {c.fecha_fin?.slice(8)}/{c.fecha_fin?.slice(5,7)}
                        </div>
                      </div>
                      <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
                        {c.presupuesto>0&&<div style={{textAlign:'right'}}><div style={{fontSize:'0.65rem',color:'var(--text-muted)'}}>GASTO</div><div style={{fontFamily:'var(--font-mono)',fontSize:'0.85rem',fontWeight:700,color:'#f59e0b'}}>${c.presupuesto.toLocaleString('es-AR')}</div></div>}
                        {c.alcance&&<div style={{textAlign:'right'}}><div style={{fontSize:'0.65rem',color:'var(--text-muted)'}}>ALCANCE</div><div style={{fontFamily:'var(--font-mono)',fontSize:'0.85rem',fontWeight:600,color:'#3b82f6'}}>{c.alcance.toLocaleString('es-AR')}</div></div>}
                        {ctr&&<div style={{textAlign:'right'}}><div style={{fontSize:'0.65rem',color:'var(--text-muted)'}}>CTR</div><div style={{fontFamily:'var(--font-mono)',fontSize:'0.85rem',fontWeight:700,color}}>{ctr}%</div></div>}
                        {c.conversiones&&<div style={{textAlign:'right'}}><div style={{fontSize:'0.65rem',color:'var(--text-muted)'}}>CONV.</div><div style={{fontFamily:'var(--font-mono)',fontSize:'0.85rem',fontWeight:600,color:'#8b5cf6'}}>{c.conversiones}</div></div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
