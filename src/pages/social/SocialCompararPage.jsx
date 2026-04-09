import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const color = '#7DD3FC' // Social color from user request
const RED = '#f0436a'
const GREEN = '#10b981'

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function fmt(n) {
  if (n === null || n === undefined) return '—'
  return Number(n).toLocaleString('es-AR')
}

function DeltaBadge({ current, previous }) {
  if (current === null || previous === null || previous === 0) return null
  const diff = current - previous
  const pct  = (diff / previous * 100).toFixed(1)
  const isPos = diff >= 0
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '4px 8px',
      borderRadius: 8,
      background: isPos ? 'rgba(16, 185, 129, 0.15)' : 'rgba(240, 67, 106, 0.15)',
      color: isPos ? GREEN : RED,
      fontSize: '0.72rem',
      fontWeight: 800,
      border: `1px solid ${isPos ? GREEN : RED}33`,
      backdropFilter: 'blur(4px)',
    }}>
      {isPos ? '▲' : '▼'} {Math.abs(pct)}%
    </div>
  )
}

export default function SocialCompararPage() {
  const now = new Date()
  const [loading, setLoading] = useState(true)
  
  const [y1, setY1] = useState(now.getFullYear())
  const [m1, setM1] = useState(now.getMonth())
  
  const [y2, setY2] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear())
  const [m2, setM2] = useState(now.getMonth() === 0 ? 11 : now.getMonth() - 1)

  const [d1, setD1] = useState(null)
  const [d2, setD2] = useState(null)

  useEffect(() => { loadData() }, [y1, m1, y2, m2])

  async function loadData() {
    setLoading(true)
    const p1 = `${y1}-${String(m1+1).padStart(2,'0')}-01`
    const p2 = `${y2}-${String(m2+1).padStart(2,'0')}-01`

    const { data } = await supabase
      .from('social_media_metrics')
      .select('*')
      .in('periodo', [p1, p2])

    setD1(data?.find(x => x.periodo === p1) || null)
    setD2(data?.find(x => x.periodo === p2) || null)
    setLoading(false)
  }

  const ROWS = [
    { key: 'seguidores_total',  label: 'Seguidores totales', emoji: '👥' },
    { key: 'nuevos_seguidores', label: 'Nuevos Seguidores',  emoji: '📈' },
    { key: 'alcance',           label: 'Alcance mensual',    emoji: '🌐' },
    { key: 'interacciones',     label: 'Interacciones',      emoji: '❤️' },
  ]

  const years = []
  for (let i = now.getFullYear(); i >= 2024; i--) years.push(i)

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ 
          fontSize: '2.4rem', 
          fontWeight: 800, 
          letterSpacing: '-1.5px', 
          marginBottom: 6,
          background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.55))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Comparativa Mensual
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', fontWeight: 500 }}>
          Contraste de rendimientos entre periodos seleccionados
        </p>
      </div>

      {/* Selectors Panel */}
      <div 
        className="animate-fadeUp"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 24,
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
          marginBottom: 32,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'0.7rem', fontWeight:800, color:color, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Periodo A</div>
            <div style={{ display:'flex', gap:8 }}>
              <select value={m1} onChange={e=>setM1(parseInt(e.target.value))} style={selStyle}>
                {MONTHS_ES.map((m,i)=><option key={i} value={i}>{m}</option>)}
              </select>
              <select value={y1} onChange={e=>setY1(parseInt(e.target.value))} style={selStyle}>
                {years.map(y=><option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.2)' }}>⚡</div>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontSize:'0.7rem', fontWeight:800, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Periodo B (Referencia)</div>
            <div style={{ display:'flex', gap:8 }}>
              <select value={m2} onChange={e=>setM2(parseInt(e.target.value))} style={selStyle}>
                {MONTHS_ES.map((m,i)=><option key={i} value={i}>{m}</option>)}
              </select>
              <select value={y2} onChange={e=>setY2(parseInt(e.target.value))} style={selStyle}>
                {years.map(y=><option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:80 }}>
           <div className="animate-spin" style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: color }} />
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:20 }}>
          {ROWS.map((row, i) => {
            const v1 = d1?.[row.key]
            const v2 = d2?.[row.key]
            return (
              <div 
                key={row.key} 
                className="animate-fadeUp"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  background: 'rgba(255, 255, 255, 0.07)',
                  backdropFilter: 'blur(28px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 24,
                  padding: '32px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}
              >
                {/* Glow Accent */}
                <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity:0.6 }} />

                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
                   <span style={{ fontSize:28, filter: `drop-shadow(0 0 10px ${color}44)` }}>{row.emoji}</span>
                   <span style={{ fontSize:'0.9rem', fontWeight:800, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{row.label}</span>
                </div>

                <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:16 }}>
                  <div>
                    <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', fontWeight:600, marginBottom:4 }}>Periodo A</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:'2.2rem', fontWeight:800, color:'#fff', lineHeight:1 }}>
                      {fmt(v1)}
                    </div>
                  </div>

                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.3)', fontWeight:600, marginBottom:4 }}>Ref. Periodo B</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:'1.2rem', fontWeight:700, color:'rgba(255,255,255,0.5)', marginBottom:8 }}>
                      {fmt(v2)}
                    </div>
                    <DeltaBadge current={v1} previous={v2} />
                  </div>
                </div>

                {/* Progress bar comparison visual */}
                {v1 !== null && v2 !== null && (v1 > 0 || v2 > 0) && (
                  <div style={{ marginTop:24, height:6, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'hidden', display:'flex' }}>
                    <div style={{ 
                      width: `${(v1 / (v1 + v2) * 100)}%`, 
                      background: color, 
                      height: '100%',
                      boxShadow: `0 0 10px ${color}66`
                    }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Engagement Comparison Row (Special Case) */}
      {!loading && d1 && d2 && d1.alcance > 0 && d2.alcance > 0 && (
        <div 
          className="animate-fadeUp"
          style={{
            marginTop: 32,
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${color}33`,
            borderRadius: 24,
            padding: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: 40,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ position:'absolute', top:0, left:0, bottom:0, width:'4px', background:color }} />
          
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <span style={{ fontSize:32 }}>✨</span>
            <span style={{ fontSize:'1rem', fontWeight:800, color:'#fff' }}>Engagement Rate</span>
          </div>

          <div style={{ display:'flex', gap:60, flex:1 }}>
            <div>
              <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Periodo A</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'2.4rem', fontWeight:800, color:color, lineHeight:1 }}>
                {(d1.interacciones/d1.alcance*100).toFixed(2)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Periodo B</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'2.4rem', fontWeight:800, color:'rgba(255,255,255,0.4)', lineHeight:1 }}>
                {(d2.interacciones/d2.alcance*100).toFixed(2)}%
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center' }}>
              <DeltaBadge 
                current={d1.interacciones/d1.alcance} 
                previous={d2.interacciones/d2.alcance} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const selStyle = {
  padding: '10px 14px',
  borderRadius: 12,
  background: 'rgba(255, 255, 255, 0.07)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#fff',
  fontSize: '0.85rem',
  fontWeight: 700,
  cursor: 'pointer',
  outline: 'none',
  fontFamily: 'inherit'
}
