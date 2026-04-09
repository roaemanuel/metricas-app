import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const AREA_ROUTES = {
  social:   '/dashboard/social',
  diseno:   '/dashboard/diseno',
  sistemas: '/dashboard/sistemas',
  gerencia: '/dashboard/gerencia',
}

/* ─── PIN Modal ───────────────────────────────────────────── */
function PinInput({ area, onCancel }) {
  const [pin, setPin]         = useState('')
  const [error, setError]     = useState(false)
  const [loading, setLoading] = useState(false)
  const { validatePin, selectArea } = useAuth()
  const navigate  = useNavigate()
  const shakeRef  = useRef(null)

  useEffect(() => {
    if (pin.length === 4) submit(pin)
  }, [pin])

  async function submit(currentPin) {
    setLoading(true)
    const result = await validatePin(area.area_key, currentPin)
    setLoading(false)
    if (result) {
      selectArea(result)
      navigate(AREA_ROUTES[area.area_key] || '/dashboard')
    } else {
      // shake animation
      if (shakeRef.current) {
        shakeRef.current.style.animation = 'none'
        void shakeRef.current.offsetHeight          // reflow
        shakeRef.current.style.animation = 'pinShake 0.45s ease'
      }
      setError(true)
      setPin('')
      setTimeout(() => setError(false), 2500)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading) return
      if (e.key >= '0' && e.key <= '9') setPin(p => (p.length < 4 ? p + e.key : p))
      else if (e.key === 'Backspace')   setPin(p => p.slice(0, -1))
      else if (e.key === 'Escape')      onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [loading, onCancel])

  const accentRGB = hexToRGB(area.color) || '99,130,246'

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200,
      animation: 'fadeIn 0.2s ease',
    }}>
      {/* blurred backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(8, 10, 20, 0.55)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      />

      {/* glass card */}
      <div ref={shakeRef} style={{
        position: 'relative',
        width: '100%', maxWidth: 360,
        padding: '40px 32px 36px',
        borderRadius: 28,
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(40px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
        border: `1px solid rgba(${accentRGB},0.25)`,
        boxShadow: `0 8px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)`,
        animation: 'fadeUp 0.3s cubic-bezier(.22,1,.36,1)',
      }}>

        {/* top glow line */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '60%', height: 2,
          background: `linear-gradient(90deg, transparent, ${area.color}, transparent)`,
          borderRadius: 99,
        }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            fontSize: 42, marginBottom: 12,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
          }}>
            {area.icono}
          </div>
          <h2 style={{
            fontSize: '1.3rem', fontWeight: 700,
            letterSpacing: '-0.5px', color: '#fff', marginBottom: 4,
          }}>
            {area.area_nombre}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
            Ingresá tu PIN de 4 dígitos
          </p>
        </div>

        {/* PIN dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 32 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: 20, height: 20, borderRadius: '50%',
              background: pin.length > i
                ? area.color
                : 'rgba(255,255,255,0.08)',
              border: `2px solid ${pin.length > i ? area.color : 'rgba(255,255,255,0.2)'}`,
              transition: 'all 0.18s cubic-bezier(.34,1.56,.64,1)',
              transform: pin.length > i ? 'scale(1.15)' : 'scale(1)',
              boxShadow: pin.length > i ? `0 0 14px ${area.color}80` : 'none',
            }} />
          ))}
        </div>

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <PinButton key={n} label={n} color={area.color} accentRGB={accentRGB}
              onClick={() => !loading && setPin(p => p.length < 4 ? p + String(n) : p)} />
          ))}
          {/* row: cancel / 0 / backspace */}
          <button onClick={onCancel} style={{
            padding: '14px', background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.35)', fontSize: '1rem', cursor: 'pointer',
            borderRadius: 14, transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
          >✕</button>
          <PinButton label="0" color={area.color} accentRGB={accentRGB}
            onClick={() => !loading && setPin(p => p.length < 4 ? p + '0' : p)} />
          <button onClick={() => !loading && setPin(p => p.slice(0, -1))} style={{
            padding: '14px', background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', cursor: 'pointer',
            borderRadius: 14, transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
          >⌫</button>
        </div>

        {/* Feedback */}
        <div style={{ minHeight: 28, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {error && (
            <p style={{
              color: '#ff6b8a', textAlign: 'center', fontSize: '0.82rem',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: '0.9rem' }}>✕</span> PIN incorrecto
            </p>
          )}
          {loading && (
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              border: `2px solid ${area.color}44`,
              borderTopColor: area.color,
              animation: 'spin 0.7s linear infinite',
            }} />
          )}
        </div>
      </div>
    </div>
  )
}

/* Shared numpad button */
function PinButton({ label, color, accentRGB, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '16px',
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 14,
        color: '#fff',
        fontSize: '1.2rem', fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        backdropFilter: 'blur(8px)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `rgba(${accentRGB},0.22)`
        e.currentTarget.style.borderColor = `rgba(${accentRGB},0.45)`
        e.currentTarget.style.transform = 'scale(1.06)'
        e.currentTarget.style.boxShadow = `0 4px 18px rgba(${accentRGB},0.25)`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = 'none'
      }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.94)' }}
      onMouseUp={e  => { e.currentTarget.style.transform = 'scale(1.06)' }}
    >
      {label}
    </button>
  )
}

/* helper – convert hex colour like "#7DD3FC" → "125,211,252" */
function hexToRGB(hex) {
  if (!hex) return null
  const h = hex.replace('#','')
  if (h.length !== 6) return null
  const r = parseInt(h.slice(0,2),16)
  const g = parseInt(h.slice(2,4),16)
  const b = parseInt(h.slice(4,6),16)
  return `${r},${g},${b}`
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function AreaSelectorPage() {
  const { areas, loading, logout } = useAuth()
  const [selectedArea, setSelectedArea] = useState(null)

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.15)', borderTopColor: '#7DD3FC',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative',
      background: 'transparent',
    }}>

      {/* ── Centered glass container ── */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 720, zIndex: 1 }}>

        {/* Header */}
        <div className="animate-fadeUp" style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem', letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <span style={{ opacity: 0.6 }}>▦</span> MetricHub
          </p>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: 800,
            letterSpacing: '-2px',
            background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.55) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 12, lineHeight: 1.1,
          }}>
            Seleccioná tu área
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', letterSpacing: '0.02em' }}>
            Cada área tiene su propio PIN de acceso
          </p>
        </div>

        {/* Area cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: 18, marginBottom: 44,
        }}>
          {areas.map((area, i) => (
            <AreaCard key={area.id} area={area} delay={i * 0.09}
              onSelect={() => setSelectedArea(area)} />
          ))}
        </div>

        {/* Logout */}
        <div style={{ textAlign: 'center' }}>
          <button onClick={logout} style={{
            background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.25)',
            fontSize: '0.8rem', fontFamily: 'var(--font-mono)',
            letterSpacing: '0.08em', cursor: 'pointer',
            transition: 'color 0.25s',
            padding: '6px 12px',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
          >
            ← Cerrar sesión
          </button>
        </div>
      </div>

      {/* PIN modal */}
      {selectedArea && (
        <PinInput area={selectedArea} onCancel={() => setSelectedArea(null)} />
      )}
    </div>
  )
}

/* ─── Area glass card ─────────────────────────────────────── */
function AreaCard({ area, delay, onSelect }) {
  const accentRGB = hexToRGB(area.color) || '125,211,252'

  return (
    <button
      className="animate-fadeUp area-card"
      onClick={onSelect}
      style={{
        animationDelay: `${delay}s`,
        '--card-accent': accentRGB,
        '--card-color': area.color,
        position: 'relative', overflow: 'hidden',
        borderRadius: 22,
        padding: '30px 26px 26px',
        textAlign: 'left', cursor: 'pointer',
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(28px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
        border: `1px solid rgba(${accentRGB},0.18)`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)`,
        transition: 'transform 0.35s cubic-bezier(.22,1,.36,1), border-color 0.3s, box-shadow 0.3s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-8px) scale(1.01)'
        e.currentTarget.style.borderColor = `rgba(${accentRGB},0.5)`
        e.currentTarget.style.boxShadow = `0 24px 56px rgba(${accentRGB},0.22), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.18)`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)'
        e.currentTarget.style.borderColor = `rgba(${accentRGB},0.18)`
        e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)`
      }}
    >
      {/* top gradient accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${area.color}, transparent)`,
        opacity: 0.9,
      }} />

      {/* subtle inner glow at top-left corner */}
      <div style={{
        position: 'absolute', top: -40, left: -40,
        width: 120, height: 120,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${accentRGB},0.18) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* icon */}
      <div style={{
        fontSize: 36, marginBottom: 16, lineHeight: 1,
        filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))',
      }}>
        {area.icono}
      </div>

      {/* name */}
      <h3 style={{
        fontSize: '1.05rem', fontWeight: 700,
        color: '#fff',
        letterSpacing: '-0.3px', marginBottom: 4,
        textShadow: '0 1px 6px rgba(0,0,0,0.4)',
      }}>
        {area.area_nombre}
      </h3>

      {/* PIN dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20 }}>
        {[0,1,2,3].map(d => (
          <div key={d} style={{
            width: 7, height: 7, borderRadius: '50%',
            border: `1.5px solid ${area.color}70`,
            background: 'transparent',
          }} />
        ))}
        <span style={{
          marginLeft: 6, fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          PIN requerido
        </span>
      </div>
    </button>
  )
}
