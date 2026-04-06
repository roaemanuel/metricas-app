import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const AREA_ROUTES = {
  social:   '/dashboard/social',
  diseno:   '/dashboard/diseno',
  sistemas: '/dashboard/sistemas',
  gerencia: '/dashboard/gerencia',
}

function PinInput({ area, onCancel }) {
  const [pin, setPin]       = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const { validatePin, selectArea } = useAuth()
  const navigate = useNavigate()

  // ✅ useEffect (no useState) — se ejecuta cada vez que pin cambia
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
      setError('PIN incorrecto')
      setPin('')
      setTimeout(() => setError(''), 2500)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading) return
      if (e.key >= '0' && e.key <= '9') {
        setPin(p => (p.length < 4 ? p + e.key : p))
      } else if (e.key === 'Backspace') {
        setPin(p => p.slice(0, -1))
      } else if (e.key === 'Escape') {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [loading, onCancel])

  function handleDigit(d) {
    if (loading) return
    setPin(p => (p.length < 4 ? p + d : p))
  }

  function handleBackspace() {
    if (loading) return
    setPin(p => p.slice(0, -1))
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(7,8,15,0.88)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px 36px',
        width: '100%', maxWidth: 360,
        boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
        animation: 'fadeUp 0.3s ease',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>{area.icono}</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: 4 }}>
            {area.area_nombre}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            Ingresá tu PIN de 4 dígitos
          </p>
        </div>

        {/* PIN dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 28 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: 18, height: 18, borderRadius: '50%',
              background: pin.length > i ? area.color : 'transparent',
              border: `2px solid ${pin.length > i ? area.color : 'var(--border-bright)'}`,
              transition: 'all 0.15s ease',
              boxShadow: pin.length > i ? `0 0 8px ${area.color}88` : 'none',
            }} />
          ))}
        </div>

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} onClick={() => handleDigit(String(n))} disabled={loading} style={{
              padding: '16px',
              background: 'var(--bg-elevated)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '1.25rem', fontWeight: 600,
              fontFamily: 'var(--font-display)',
              boxShadow: '0 2px 8px var(--glass-shadow)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 12px var(--glass-shadow)' }}}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px var(--glass-shadow)' }}
            >{n}</button>
          ))}
          {/* Row: cancelar / 0 / borrar */}
          <button onClick={onCancel} style={{
            padding: '16px', background: 'transparent',
            border: 'none', borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
          }}>✕</button>
          <button onClick={() => handleDigit('0')} disabled={loading} style={{
            padding: '16px', background: 'var(--bg-elevated)',
            border: 'none', borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600,
            fontFamily: 'var(--font-display)', cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px var(--glass-shadow)',
            transition: 'all 0.2s ease',
          }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 12px var(--glass-shadow)' }}}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px var(--glass-shadow)' }}
          >0</button>
          <button onClick={handleBackspace} style={{
            padding: '16px', background: 'transparent',
            border: 'none', borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)', fontSize: '1rem', cursor: 'pointer',
          }}>⌫</button>
        </div>

        {/* Feedback */}
        {error && (
          <p style={{ color: '#f0436a', textAlign: 'center', fontSize: '0.82rem', marginTop: 8 }}>
            ✕ {error}
          </p>
        )}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              border: `2px solid ${area.color}44`,
              borderTopColor: area.color,
              animation: 'spin 0.7s linear infinite',
            }} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function AreaSelectorPage() {
  const { areas, loading, logout } = useAuth()
  const [selectedArea, setSelectedArea] = useState(null)

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2px solid var(--border-bright)', borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.025,
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 680 }}>
        <div className="animate-fadeUp" style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>▦ MetricHub</p>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--text-primary)', marginBottom: 10, lineHeight: 1.1 }}>
            Seleccioná tu área
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Cada área tiene su propio PIN de acceso
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 40 }}>
          {areas.map((area, i) => (
            <button key={area.id} className="animate-fadeUp"
              onClick={() => setSelectedArea(area)}
              style={{
                animationDelay: `${i * 0.08}s`,
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '28px 24px',
                textAlign: 'left', cursor: 'pointer',
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 8px 24px var(--glass-shadow)',
                transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = area.color + '66'; e.currentTarget.style.boxShadow = `0 24px 40px ${area.color}18` }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = '0 8px 24px var(--glass-shadow)' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: area.color, borderRadius: '99px 99px 0 0' }} />
              <div style={{ fontSize: 32, marginBottom: 14, lineHeight: 1 }}>{area.icono}</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.3px' }}>{area.area_nombre}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16 }}>
                {[0,1,2,3].map(d => (
                  <div key={d} style={{ width: 7, height: 7, borderRadius: '50%', border: `1.5px solid ${area.color}88` }} />
                ))}
                <span style={{ marginLeft: 4, fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>PIN requerido</span>
              </div>
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button onClick={logout} style={{
            background: 'transparent', border: 'none',
            color: 'var(--text-muted)', fontSize: '0.82rem',
            fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', cursor: 'pointer',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >← Cerrar sesión</button>
        </div>
      </div>

      {selectedArea && (
        <PinInput area={selectedArea} onCancel={() => setSelectedArea(null)} />
      )}
    </div>
  )
}
