import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (login(password)) {
      navigate('/areas')
    } else {
      setShaking(true)
      setError('Contraseña incorrecta')
      setPassword('')
      setTimeout(() => setShaking(false), 500)
      setTimeout(() => setError(''), 3000)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Theme toggle */}
      <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 100 }}>
        <ThemeToggle />
      </div>

      {/* Glass card wrapper */}
      <div
        className="animate-fadeUp"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 420,
          padding: '0 24px',
        }}
      >
        {/* Logo / brand */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          {/* Icon with glass ring */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 68, height: 68,
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(125,211,252,0.25)',
            borderRadius: 22,
            marginBottom: 20,
            boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 0 40px rgba(125,211,252,0.15), inset 0 1px 0 rgba(255,255,255,0.12)',
          }}>
            <span style={{
              fontSize: 28,
              filter: 'drop-shadow(0 0 8px rgba(125,211,252,0.6))',
            }}>▦</span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            fontWeight: 800,
            letterSpacing: '-1.5px',
            background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.55))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 8,
          }}>MetricHub</h1>

          <p style={{
            color: 'rgba(255,255,255,0.38)',
            fontSize: '0.9rem',
            letterSpacing: '0.02em',
          }}>Dashboard interno del equipo</p>
        </div>

        {/* Form glass card */}
        <div
          style={{
            position: 'relative',
            borderRadius: 28,
            padding: '36px 32px',
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(40px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
            border: '1px solid rgba(125,211,252,0.18)',
            boxShadow: '0 8px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.10)',
            animation: shaking ? 'pinShake 0.45s ease' : 'none',
          }}
        >
          {/* Top accent gradient line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, transparent, #7DD3FC, transparent)',
            borderRadius: '28px 28px 0 0',
          }} />

          {/* Inner top-left glow */}
          <div style={{
            position: 'absolute', top: -30, left: -30,
            width: 100, height: 100, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(125,211,252,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <label style={{
            display: 'block',
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.38)',
            marginBottom: 10,
          }}>
            Contraseña de acceso
          </label>

          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '1rem',
                letterSpacing: '0.1em',
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${error ? 'rgba(240,67,106,0.45)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 14,
                color: '#fff',
                marginBottom: 16,
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(125,211,252,0.45)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(125,211,252,0.10)'
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = error ? 'rgba(240,67,106,0.45)' : 'rgba(255,255,255,0.12)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />

            {error && (
              <div style={{
                color: '#ff6b8a',
                fontSize: '0.82rem',
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span>✕</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!password}
              style={{
                width: '100%',
                padding: '14px',
                background: 'rgba(125,211,252,0.18)',
                border: '1px solid rgba(125,211,252,0.35)',
                borderRadius: 14,
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                boxShadow: '0 4px 24px rgba(125,211,252,0.20)',
                transition: 'all 0.25s cubic-bezier(.22,1,.36,1)',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(125,211,252,0.28)'
                e.currentTarget.style.borderColor = 'rgba(125,211,252,0.55)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(125,211,252,0.30)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(125,211,252,0.18)'
                e.currentTarget.style.borderColor = 'rgba(125,211,252,0.35)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(125,211,252,0.20)'
              }}
            >
              Ingresar →
            </button>
          </form>
        </div>

        {/* Footer label */}
        <p style={{
          textAlign: 'center',
          marginTop: 24,
          color: 'rgba(255,255,255,0.18)',
          fontSize: '0.72rem',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.08em',
        }}>
          metricas.tuempresa.com · v1.0
        </p>
      </div>
    </div>
  )
}
