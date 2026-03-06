import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function ComingSoon({ title, description }) {
  const { currentArea } = useAuth()
  const navigate = useNavigate()
  const color = currentArea?.color || 'var(--accent)'

  return (
    <div className="animate-fadeIn" style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', textAlign: 'center',
    }}>
      <div style={{
        width: 72, height: 72,
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-elevated)',
        border: `1px dashed ${color}66`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, marginBottom: 24,
      }}>⬡</div>

      <h2 style={{
        fontSize: '1.3rem', fontWeight: 800,
        letterSpacing: '-0.5px', marginBottom: 8,
      }}>{title || 'Módulo en construcción'}</h2>

      <p style={{
        color: 'var(--text-secondary)',
        fontSize: '0.9rem', maxWidth: 340,
        lineHeight: 1.6, marginBottom: 28,
      }}>
        {description || 'Este módulo se construirá en la siguiente fase. Por ahora el acceso está reservado.'}
      </p>

      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '8px 16px',
        letterSpacing: '0.08em',
      }}>
        PRÓXIMA FASE
      </div>
    </div>
  )
}
