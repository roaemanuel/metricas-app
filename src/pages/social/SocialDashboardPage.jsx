import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'

const color = '#7DD3FC' // Social color from user request
const RED = '#f0436a'    // Instagram/Engagement color
const GREEN = '#10b981'
const BLUE = '#3b82f6'

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
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(8, 12, 28, 0.4)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20
    }}>
      <div 
        className="animate-fadeUp"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: `1px solid ${color}33`,
          borderRadius: 28,
          width: '100%',
          maxWidth: 900,
          maxHeight: '85vh',
          boxShadow: `0 24px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)`,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: '2px',
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }} />

        <div style={{ padding: '24px 30px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.55))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
        <div style={{ padding: '30px', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function DeltaChip({ value, higherIsBetter=true }) {
  if (!value && value!==0) return null
  const isGood = higherIsBetter ? value >= 0 : value <= 0
  const c = isGood ? GREEN : RED
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 10px',
      borderRadius: 99,
      fontSize: '0.75rem',
      fontWeight: 600,
      color: c,
      background: `${c}15`,
      border: `1px solid ${c}33`,
      backdropFilter: 'blur(4px)',
    }}>
      {value > 0 ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
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
  const [modalType, setModalType] = useState(null)

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

  const totalVideos = videos.reduce((s,v) => s + (v.cantidad||1), 0)
  const pieData = REDES.map(r => ({
    name: r.label,
    value: videos.filter(v => v.red_social === r.key).reduce((s,v) => s + (v.cantidad||1), 0)
  })).filter(d => d.value > 0)

  const comparisonData = metrics && prevMetrics ? [
    { name: 'Alcance', actual: metrics.alcance, anterior: prevMetrics.alcance },
    { name: 'Interacc.', actual: metrics.interacciones, anterior: prevMetrics.interacciones },
    { name: 'Seguidores', actual: metrics.nuevos_seguidores, anterior: prevMetrics.nuevos_seguidores },
  ] : []

  const er = metrics?.interacciones && metrics?.alcance
    ? (metrics.interacciones/metrics.alcance*100).toFixed(2) : null

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16,marginBottom:32 }}>
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
            Social Media
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', fontWeight: 500 }}>
            Métricas de impacto y crecimiento en Instagram
          </p>
        </div>
        <div style={{ display:'flex',gap:12,alignItems:'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: 14, 
            padding: '4px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <button onClick={()=>{if(month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1)}}
              style={{width:36,height:36,borderRadius:10,background:'transparent',border:'none',color:'#fff',fontSize:'1.1rem',cursor:'pointer'}}>‹</button>
            <span style={{fontFamily:'var(--font-mono)',fontSize:'0.85rem',color:'rgba(255,255,255,0.8)',minWidth:120,textAlign:'center', fontWeight: 600}}>{MONTHS_ES[month]} {year}</span>
            <button onClick={()=>{if(isCurrentMonth)return;if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1)}}
              disabled={isCurrentMonth} style={{width:36,height:36,borderRadius:10,background:'transparent',border:'none',color:isCurrentMonth?'rgba(255,255,255,0.2)':'#fff',fontSize:'1.1rem',cursor:isCurrentMonth?'not-allowed':'pointer'}}>›</button>
          </div>
          <button onClick={()=>navigate('/dashboard/social/ingresar')} style={{
            padding:'10px 24px',background:color,border:'none',borderRadius:12,
            color:'#080C1C',fontSize:'0.85rem',fontWeight: 700,cursor:'pointer',
            boxShadow:`0 4px 20px ${color}44`,
            transition: 'all 0.2s'
          }}>✚ {metrics ? 'Actualizar' : 'Ingresar métricas'}</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div className="animate-spin" style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: color }} />
        </div>
      ) : !metrics && campanas.length===0 && videos.length===0 ? (
        <div style={{textAlign:'center',padding:'80px 24px',border:`1px dashed ${color}33`,borderRadius:24,background:'rgba(255,255,255,0.03)'}}>
          <div style={{fontSize:48,marginBottom:16}}>📱</div>
          <p style={{color:'rgba(255,255,255,0.5)',marginBottom:24, fontSize: '1.1rem'}}>No hay datos para {MONTHS_ES[month]} {year}</p>
          <div style={{display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap'}}>
            <button onClick={()=>navigate('/dashboard/social/ingresar')} style={{padding:'14px 32px',background:color,border:'none',borderRadius:14,color:'#080C1C',fontWeight: 700,fontSize:'0.95rem',cursor:'pointer',boxShadow:`0 4px 20px ${color}44`}}>
              Ingresar métricas →
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Main KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
            {[
              { label: 'Seguidores', value: metrics?.seguidores_total, icon: '👥', c: color, d: delta(metrics?.seguidores_total, prevMetrics?.seguidores_total) },
              { label: 'Nuevos Seg.', value: metrics?.nuevos_seguidores, icon: '📈', c: GREEN, d: delta(metrics?.nuevos_seguidores, prevMetrics?.nuevos_seguidores) },
              { label: 'Alcance', value: metrics?.alcance, icon: '🌐', c: BLUE, d: delta(metrics?.alcance, prevMetrics?.alcance) },
              { label: 'Interacciones', value: metrics?.interacciones, icon: '❤️', c: RED, d: delta(metrics?.interacciones, prevMetrics?.interacciones) },
            ].map((k, i) => (
              <div
                key={i}
                className="animate-fadeUp group"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  background: 'rgba(255, 255, 255, 0.07)',
                  backdropFilter: 'blur(28px)',
                  WebkitBackdropFilter: 'blur(28px)',
                  border: `1px solid ${k.c}2e`,
                  borderRadius: 24,
                  padding: '28px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.01)'
                  e.currentTarget.style.boxShadow = `0 20px 40px ${k.c}22, inset 0 1px 0 rgba(255, 255, 255, 0.15)`
                  e.currentTarget.style.borderColor = `${k.c}44`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.borderColor = `${k.c}2e`
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, height: '2px',
                  background: `linear-gradient(90deg, transparent, ${k.c}, transparent)`,
                }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ fontSize: '1.8rem', filter: `drop-shadow(0 0 12px ${k.c}44)` }}>{k.icon}</span>
                  <DeltaChip value={k.d} />
                </div>
                
                <div style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '2.2rem', 
                  fontWeight: 700, 
                  color: '#fff', 
                  letterSpacing: '-1.5px', 
                  lineHeight: 1, 
                  marginBottom: 6 
                }}>
                  {fmt(k.value)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {k.label}
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div style={{display:'grid',gridTemplateColumns:pieData.length>0?'2fr 1fr':'1fr',gap:24,marginBottom:32}}>
             {/* Comparative Chart */}
             <div 
               className="animate-fadeUp"
               style={{
                 animationDelay: '0.4s',
                 background: 'rgba(255, 255, 255, 0.05)',
                 backdropFilter: 'blur(28px)',
                 borderRadius: 28,
                 padding: '30px',
                 border: '1px solid rgba(255,255,255,0.1)',
                 boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
               }}
             >
                <div style={{fontSize:'0.85rem',fontWeight: 700,color:'rgba(255,255,255,0.5)',letterSpacing:'0.1em',marginBottom:24, textTransform: 'uppercase'}}>RENDIMIENTO VS MES ANTERIOR</div>
                <div style={{width:'100%',height:320}}>
                  <ResponsiveContainer>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v)=>v>=1000?`${(v/1000).toFixed(1)}k`:v} />
                      <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.03)'}}
                        contentStyle={{ background: 'var(--glass-bg)', backdropFilter: 'blur(24px)', border: '1px solid var(--glass-border)', borderRadius: 12, boxShadow: '0 4px 24px var(--glass-shadow)', color: 'var(--text-primary)' }}
                        itemStyle={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.85rem' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{paddingBottom: 20, fontSize: '0.8rem'}}/>
                      <Bar dataKey="actual" name="Mes Actual" fill={color} radius={[6,6,0,0]} />
                      <Bar dataKey="anterior" name="Mes Anterior" fill="rgba(255,255,255,0.15)" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </div>

             {/* Donut Chart - Content Distribution */}
             {pieData.length > 0 && (
              <div 
                className="animate-fadeUp"
                style={{
                  animationDelay: '0.5s',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(28px)',
                  borderRadius: 28,
                  padding: '30px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  display: 'flex', flexDirection: 'column'
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: 20, textTransform: 'uppercase' }}>CONTENIDO (VIDEOS)</div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={REDES.find(r=>r.label===entry.name)?.color || color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--glass-bg)', backdropFilter: 'blur(24px)', border: '1px solid var(--glass-border)', borderRadius: 12, boxShadow: '0 4px 24px var(--glass-shadow)' }} itemStyle={{ color: 'var(--text-primary)', fontWeight: 700 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', inset: 0, transform: 'translateY(-5%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', pointerEvents: 'none' }}>
                    <span style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{totalVideos}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: 4 }}>Videos</span>
                  </div>
                </div>
                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pieData.map((f, i) => {
                    const r = REDES.find(red => red.label === f.name)
                    return (
                      <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: r?.color || color }} />
                          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{f.name}</span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{f.value}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Secondary Stats & Actions */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))',gap:24}}>
            {/* Engagement Rate Card */}
            {er && (
              <div 
                className="animate-fadeUp"
                style={{
                  animationDelay: '0.6s',
                  background: 'rgba(255, 255, 255, 0.07)',
                  backdropFilter: 'blur(28px)',
                  borderRadius: 24,
                  padding: '30px',
                  display: 'flex', alignItems: 'center', gap: 24,
                  border: `1px solid ${color}22`,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
                }}
              >
                <div style={{
                  width: 70, height: 70, borderRadius: 20, 
                  background: `linear-gradient(135deg, ${color}22, ${color}44)`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: 32, border: `1px solid ${color}33`,
                  boxShadow: `0 0 20px ${color}22`
                }}>✨</div>
                <div>
                  <div style={{fontSize:'0.8rem', fontWeight: 700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.1em', marginBottom:6, textTransform: 'uppercase'}}>Engagement Rate</div>
                  <div style={{fontFamily:'var(--font-mono)', fontSize:'2.8rem', fontWeight: 800, color:color, letterSpacing:'-2px', lineHeight: 1}}>{er}%</div>
                </div>
                {prevMetrics && (
                  <div style={{marginLeft:'auto'}}>
                    <DeltaChip value={delta(metrics.interacciones/metrics.alcance, prevMetrics.interacciones/prevMetrics.alcance)} />
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div 
              className="animate-fadeUp"
              style={{
                animationDelay: '0.7s',
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16
              }}
            >
                <button 
                  onClick={()=>setModalType('videos')} 
                  style={{
                    border: '1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', 
                    borderRadius: 24, padding: 20, cursor: 'pointer', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  }}
                >
                  <span style={{fontSize:28}}>🎬</span>
                  <span style={{fontSize:'0.9rem', fontWeight: 700, color:'#fff'}}>Ver Vídeos</span>
                  <span style={{fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', fontWeight: 600}}>{totalVideos} registros</span>
                </button>
                <button 
                  onClick={()=>setModalType('campanas')} 
                  style={{
                    border: '1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', 
                    borderRadius: 24, padding: 20, cursor: 'pointer', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  }}
                >
                  <span style={{fontSize:28}}>📣</span>
                  <span style={{fontSize:'0.9rem', fontWeight: 700, color:'#fff'}}>Ver Campañas</span>
                  <span style={{fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', fontWeight: 600}}>{campanas.length} activas</span>
                </button>
            </div>
          </div>

          {/* Modals */}
          <GlassModal isOpen={modalType==='videos'} onClose={()=>setModalType(null)} title="Vídeos del Mes">
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                  {videos.map(v => {
                    const red = REDES.find(r => r.key === v.red_social) || REDES[3]
                    return (
                      <div key={v.id} style={{
                        display:'flex',alignItems:'center',gap:16,padding:'18px',
                        background:'rgba(255,255,255,0.05)', borderRadius:16, border:'1px solid rgba(255,255,255,0.1)'
                      }}>
                        <span style={{
                          fontSize:'0.75rem',fontWeight: 700,color:red.color,
                          background:red.color+'15',border:`1px solid ${red.color}33`,
                          borderRadius:10,padding:'6px 14px',flexShrink:0
                        }}>
                          {red.emoji} {red.label}
                        </span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:'1rem',fontWeight:700,color:'#fff',marginBottom:4}}>{v.etiqueta}</div>
                          <div style={{fontSize:'0.8rem',color:'rgba(255,255,255,0.4)',fontFamily:'var(--font-mono)'}}>{v.fecha || 'Sin fecha'}</div>
                        </div>
                        <div style={{fontSize:'1.3rem', fontWeight: 800, color, fontFamily: 'var(--font-mono)'}}>×{v.cantidad || 1}</div>
                      </div>
                    )
                  })}
              </div>
          </GlassModal>

          <GlassModal isOpen={modalType==='campanas'} onClose={()=>setModalType(null)} title="Campañas Publicitarias">
              <div style={{display:'flex', flexDirection:'column', gap:20}}>
                {campanas.map(c => (
                  <div key={c.id} style={{
                    padding:'24px', background:'rgba(255,255,255,0.05)', 
                    borderRadius:20, border:'1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20}}>
                      <div>
                        <div style={{fontSize:'1.1rem', fontWeight: 700, color:'#fff', marginBottom:6}}>{c.nombre}</div>
                        <div style={{fontSize:'0.8rem', color:'rgba(255,255,255,0.4)', fontFamily:'var(--font-mono)', fontWeight: 600}}>
                          {c.fecha_inicio} al {c.fecha_fin}
                        </div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:'0.7rem', color:'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4}}>Presupuesto</div>
                        <div style={{fontSize:'1.3rem', fontWeight: 800, color:'#fbbf24', fontFamily: 'var(--font-mono)'}}>${c.presupuesto?.toLocaleString('es-AR')}</div>
                      </div>
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:20, paddingTop:20, borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                      <div>
                        <div style={{fontSize:'0.7rem', color:'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 4}}>ALCANCE</div>
                        <div style={{fontSize:'1rem', fontWeight: 700, color:BLUE, fontFamily: 'var(--font-mono)'}}>{fmt(c.alcance)}</div>
                      </div>
                      <div>
                        <div style={{fontSize:'0.7rem', color:'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 4}}>CLICS (CTR)</div>
                        <div style={{fontSize:'1rem', fontWeight: 700, color, fontFamily: 'var(--font-mono)'}}>
                          {fmt(c.clics)} <span style={{fontSize: '0.8rem', opacity: 0.7}}>({c.alcance ? (c.clics/c.alcance*100).toFixed(2) : 0}%)</span>
                        </div>
                      </div>
                      <div>
                        <div style={{fontSize:'0.7rem', color:'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 4}}>CONV.</div>
                        <div style={{fontSize:'1rem', fontWeight: 700, color:GREEN, fontFamily: 'var(--font-mono)'}}>{fmt(c.conversiones)}</div>
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
