import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function StatCard({ label, value, unit = '', color, icon, delay = 0 }) {
  return (
    <div
      className="animate-fadeUp"
      style={{
        animationDelay: `${delay}s`,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '22px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: color,
        opacity: 0.6,
      }} />
      <div style={{
        fontSize: '1.4rem', marginBottom: 12,
        filter: `drop-shadow(0 0 6px ${color}88)`,
      }}>{icon}</div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '1.8rem',
        fontWeight: 500,
        color: color,
        letterSpacing: '-1px',
        marginBottom: 4,
      }}>
        {value}<span style={{ fontSize: '0.9rem', marginLeft: 3 }}>{unit}</span>
      </div>
      <div style={{
        fontSize: '0.78rem',
        color: 'var(--text-secondary)',
      }}>{label}</div>
    </div>
  )
}

function ComingSoonBadge({ module }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: 'var(--bg-elevated)',
      border: '1px dashed var(--border-bright)',
      borderRadius: 'var(--radius-sm)',
      padding: '6px 14px',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.72rem',
      color: 'var(--text-muted)',
      marginTop: 12,
    }}>
      <span style={{ opacity: 0.5 }}>⬡</span>
      Módulo {module} — próximo paso
    </div>
  )
}

// ─── SOCIAL MEDIA ─────────────────────────────────────────────────────────────
export function SocialDashboard() {
  const { currentArea } = useAuth()
  const navigate = useNavigate()
  const color = currentArea?.color || '#f0436a'

  return (
    <div className="animate-fadeIn">
      <h1 style={{
        fontSize: '1.6rem', fontWeight: 600,
        letterSpacing: '-0.8px', marginBottom: 6,
        color: 'var(--text-primary)',
      }}>Social Media</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 32 }}>
        Resumen del mes en curso · Instagram & Campañas
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14, marginBottom: 32,
      }}>
        <StatCard label="Seguidores totales" value="—" icon="👥" color={color} delay={0} />
        <StatCard label="Nuevos seguidores" value="—" icon="📈" color={color} delay={0.06} />
        <StatCard label="Engagement rate" value="—" unit="%" icon="💬" color={color} delay={0.12} />
        <StatCard label="Alcance mensual" value="—" icon="🌐" color={color} delay={0.18} />
        <StatCard label="Leads generados" value="—" icon="🎯" color={color} delay={0.24} />
      </div>

      <div style={{
        background: 'var(--bg-surface)',
        border: `1px dashed ${color}44`,
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        textAlign: 'center',
      }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
          Aún no hay datos para este mes. Ingresá las métricas para verlas reflejadas aquí.
        </p>
        <button
          onClick={() => navigate('/dashboard/social/ingresar')}
          style={{
            padding: '12px 28px',
            background: color,
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: '#fff',
            fontSize: '0.88rem',
            fontWeight: 600,
            boxShadow: `0 4px 20px ${color}44`,
          }}
        >
          ✚ Ingresar métricas del mes →
        </button>
      </div>
    </div>
  )
}

// ─── DISEÑO GRÁFICO ───────────────────────────────────────────────────────────
export function DisenoDashboard() {
  const { currentArea } = useAuth()
  const navigate = useNavigate()
  const color = currentArea?.color || '#0eb8d4'

  return (
    <div className="animate-fadeIn">
      <h1 style={{
        fontSize: '1.6rem', fontWeight: 600,
        letterSpacing: '-0.8px', marginBottom: 6,
      }}>Diseño Gráfico</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 32 }}>
        Producción mensual · Flyers, video y fotografía
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14, marginBottom: 32,
      }}>
        <StatCard label="Flyers totales" value="0" icon="🎨" color={color} delay={0} />
        <StatCard label="Stories" value="0" icon="📱" color={color} delay={0.06} />
        <StatCard label="Efemérides" value="0" icon="📅" color={color} delay={0.12} />
        <StatCard label="Colabs. en video" value="0" icon="🎬" color={color} delay={0.18} />
        <StatCard label="Fotos de producto" value="0" icon="📸" color={color} delay={0.24} />
      </div>

      <div style={{
        background: 'var(--bg-surface)',
        border: `1px dashed ${color}44`,
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        textAlign: 'center',
      }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
          Registrá el trabajo de hoy para acumular las métricas del mes.
        </p>
        <button
          onClick={() => navigate('/dashboard/diseno/ingresar')}
          style={{
            padding: '12px 28px',
            background: color,
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: '#fff',
            fontSize: '0.88rem',
            fontWeight: 600,
            boxShadow: `0 4px 20px ${color}44`,
          }}
        >
          ✚ Registro de hoy →
        </button>
      </div>
    </div>
  )
}

// ─── SISTEMAS ─────────────────────────────────────────────────────────────────
export function SistemasDashboard() {
  const { currentArea } = useAuth()
  const navigate = useNavigate()
  const color = currentArea?.color || '#f5c518'

  return (
    <div className="animate-fadeIn">
      <h1 style={{
        fontSize: '1.6rem', fontWeight: 600,
        letterSpacing: '-0.8px', marginBottom: 6,
      }}>Sistemas / Web</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 32 }}>
        Incidencias, Google Analytics y gestión de imágenes
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14, marginBottom: 32,
      }}>
        <StatCard label="Incidencias resueltas" value="0" icon="🔧" color={color} delay={0} />
        <StatCard label="Sesiones web (GA4)" value="—" icon="🌐" color={color} delay={0.06} />
        <StatCard label="Usuarios únicos" value="—" icon="👤" color={color} delay={0.12} />
        <StatCard label="Imgs. con código" value="0" icon="🏷️" color={color} delay={0.18} />
        <StatCard label="Imgs. optimizadas" value="0" icon="⚡" color={color} delay={0.24} />
      </div>

      <div style={{
        background: 'var(--bg-surface)',
        border: `1px dashed ${color}44`,
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        textAlign: 'center',
      }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
          Registrá las actividades de hoy para llevar el historial mensual.
        </p>
        <button
          onClick={() => navigate('/dashboard/sistemas/ingresar')}
          style={{
            padding: '12px 28px',
            background: color,
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: '#000',
            fontSize: '0.88rem',
            fontWeight: 600,
            boxShadow: `0 4px 20px ${color}44`,
          }}
        >
          ✚ Registro de hoy →
        </button>
      </div>
    </div>
  )
}

// ─── GERENCIA ─────────────────────────────────────────────────────────────────
export function GerenciaDashboard() {
  const { currentArea } = useAuth()
  const navigate = useNavigate()
  const color = currentArea?.color || '#9b59f7'

  return (
    <div className="animate-fadeIn">
      <h1 style={{
        fontSize: '1.6rem', fontWeight: 600,
        letterSpacing: '-0.8px', marginBottom: 6,
      }}>Gerencia / Contabilidad</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 32 }}>
        Vista ejecutiva · Jornadas médicas y ganancias por estrategia
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14, marginBottom: 32,
      }}>
        <StatCard label="Jornadas este mes" value="0" icon="🏥" color={color} delay={0} />
        <StatCard label="Gasto total jornadas" value="$0" icon="💰" color={color} delay={0.06} />
        <StatCard label="Estrategias activas" value="0" icon="📊" color={color} delay={0.12} />
        <StatCard label="Ingresos del mes" value="$0" icon="💹" color={color} delay={0.18} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 14,
      }}>
        <div style={{
          background: 'var(--bg-surface)',
          border: `1px dashed ${color}44`,
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🏥</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 14 }}>
            Registrar nueva jornada médica
          </p>
          <button
            onClick={() => navigate('/dashboard/gerencia/jornadas')}
            style={{
              padding: '10px 22px',
              background: color,
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: '#fff',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >Nueva jornada →</button>
        </div>
        <div style={{
          background: 'var(--bg-surface)',
          border: `1px dashed ${color}44`,
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>📂</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 14 }}>
            Importar Excel de ganancias del mes
          </p>
          <button
            onClick={() => navigate('/dashboard/gerencia/ganancias')}
            style={{
              padding: '10px 22px',
              background: color,
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: '#fff',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >Importar Excel →</button>
        </div>
      </div>
    </div>
  )
}
