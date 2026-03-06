import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

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
      background: 'var(--bg-base)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: `
          linear-gradient(rgba(91,106,247,0.8) 1px, transparent 1px),
          linear-gradient(90deg, rgba(91,106,247,0.8) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }} />

      {/* Glow orb */}
      <div style={{
        position: 'absolute',
        width: 600, height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(91,106,247,0.12) 0%, transparent 70%)',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />

      <div
        className="animate-fadeUp"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 420,
          padding: '0 24px',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64, height: 64,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-bright)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 20,
            boxShadow: '0 0 40px var(--accent-glow)',
          }}>
            <span style={{ fontSize: 28 }}>▦</span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            fontWeight: 800,
            letterSpacing: '-1px',
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}>MetricHub</h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            letterSpacing: '0.02em',
          }}>Dashboard interno del equipo</p>
        </div>

        {/* Form card */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '36px 32px',
          animation: shaking ? 'shake 0.4s ease' : 'none',
        }}>
          <style>{`
            @keyframes shake {
              0%,100% { transform: translateX(0); }
              20%      { transform: translateX(-8px); }
              40%      { transform: translateX(8px); }
              60%      { transform: translateX(-5px); }
              80%      { transform: translateX(5px); }
            }
          `}</style>

          <label style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
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
                background: 'var(--bg-elevated)',
                border: `1px solid ${error ? '#f0436a66' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                marginBottom: 16,
              }}
            />

            {error && (
              <div style={{
                color: '#f0436a',
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
                background: 'var(--accent)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 700,
                letterSpacing: '0.03em',
                boxShadow: '0 4px 24px var(--accent-glow)',
              }}
              onMouseEnter={e => e.target.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
            >
              Ingresar →
            </button>
          </form>
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: 24,
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
        }}>
          metricas.tuempresa.com · v1.0
        </p>
      </div>
    </div>
  )
}
