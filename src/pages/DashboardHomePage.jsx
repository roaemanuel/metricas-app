import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

/* ── helpers ──────────────────────────────────────────────────────────────── */
function hexToRGB(hex) {
  if (!hex) return '125,211,252'
  const h = hex.replace('#', '')
  if (h.length !== 6) return '125,211,252'
  return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`
}

/* ── Glass stat card ──────────────────────────────────────────────────────── */
function StatCard({ label, value, unit = '', color, icon, delay = 0 }) {
  const rgb = hexToRGB(color)
  return (
    <div
      className="animate-fadeUp"
      style={{
        animationDelay: `${delay}s`,
        position: 'relative', overflow: 'hidden',
        borderRadius: 18,
        padding: '22px 20px',
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(28px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
        border: `1px solid rgba(${rgb},0.18)`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.08)`,
        transition: 'transform 0.3s cubic-bezier(.22,1,.36,1), box-shadow 0.3s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'
        e.currentTarget.style.boxShadow = `0 16px 40px rgba(${rgb},0.20), 0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)'
        e.currentTarget.style.boxShadow = `0 4px 24px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.08)`
      }}
    >
      {/* top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      }} />
      {/* inner corner glow */}
      <div style={{
        position: 'absolute', top: -20, left: -20,
        width: 70, height: 70, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${rgb},0.18) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        fontSize: '1.4rem', marginBottom: 10,
        filter: `drop-shadow(0 4px 8px rgba(${rgb},0.4))`,
      }}>{icon}</div>

      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '1.75rem', fontWeight: 500,
        color: color,
        letterSpacing: '-1px', marginBottom: 4,
      }}>
        {value}<span style={{ fontSize: '0.85rem', marginLeft: 3 }}>{unit}</span>
      </div>

      <div style={{
        fontSize: '0.76rem',
        color: 'rgba(255,255,255,0.40)',
        letterSpacing: '0.01em',
      }}>{label}</div>
    </div>
  )
}

/* ── Glass CTA card (empty state) ─────────────────────────────────────────── */
function CtaCard({ color, rgb, icon, message, label, onClick }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      borderRadius: 18,
      padding: '32px',
      background: 'rgba(255,255,255,0.05)',
      backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
      border: `1px dashed rgba(${rgb},0.30)`,
      boxShadow: `0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.07)`,
      textAlign: 'center',
    }}>
      {icon && <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>}
      <p style={{ color: 'rgba(255,255,255,0.42)', marginBottom: 16, fontSize: '0.88rem' }}>
        {message}
      </p>
      <button
        onClick={onClick}
        style={{
          padding: '12px 28px',
          background: `rgba(${rgb},0.16)`,
          border: `1px solid rgba(${rgb},0.35)`,
          borderRadius: 12,
          color: '#fff',
          fontSize: '0.88rem', fontWeight: 700,
          boxShadow: `0 4px 20px rgba(${rgb},0.22)`,
          transition: 'all 0.25s cubic-bezier(.22,1,.36,1)',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = `rgba(${rgb},0.28)`
          e.currentTarget.style.borderColor = `rgba(${rgb},0.55)`
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = `0 10px 30px rgba(${rgb},0.32)`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = `rgba(${rgb},0.16)`
          e.currentTarget.style.borderColor = `rgba(${rgb},0.35)`
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = `0 4px 20px rgba(${rgb},0.22)`
        }}
      >
        {label}
      </button>
    </div>
  )
}

/* ── Page title component ──────────────────────────────────────────────────── */
function PageTitle({ title, subtitle, color }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{
        fontSize: 'clamp(1.5rem, 3vw, 2rem)',
        fontWeight: 800, letterSpacing: '-1px', marginBottom: 6,
        background: `linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.55))`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>{title}</h1>
      <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.9rem' }}>{subtitle}</p>
    </div>
  )
}

// ─── SOCIAL MEDIA ─────────────────────────────────────────────────────────────
export function SocialDashboard() {
  const { currentArea } = useAuth()
  const navigate = useNavigate()
  const color = currentArea?.color || '#7DD3FC'
  const rgb   = hexToRGB(color)

  return (
    <div className="animate-fadeIn">
      <PageTitle
        title="Social Media"
        subtitle="Resumen del mes en curso · Instagram & Campañas"
        color={color}
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14, marginBottom: 28,
      }}>
        <StatCard label="Seguidores totales" value="—" icon="👥" color={color} delay={0}    />
        <StatCard label="Nuevos seguidores"  value="—" icon="📈" color={color} delay={0.06} />
        <StatCard label="Engagement rate"    value="—" unit="%" icon="💬" color={color} delay={0.12} />
        <StatCard label="Alcance mensual"    value="—" icon="🌐" color={color} delay={0.18} />
        <StatCard label="Leads generados"    value="—" icon="🎯" color={color} delay={0.24} />
      </div>

      <CtaCard
        color={color} rgb={rgb}
        message="Aún no hay datos para este mes. Ingresá las métricas para verlas reflejadas aquí."
        label="✚ Ingresar métricas del mes →"
        onClick={() => navigate('/dashboard/social/ingresar')}
      />
    </div>
  )
}

// ─── DISEÑO GRÁFICO ───────────────────────────────────────────────────────────
export function DisenoDashboard() {
  const { currentArea } = useAuth()
  const navigate = useNavigate()
  const color = currentArea?.color || '#93C5FD'
  const rgb   = hexToRGB(color)

  return (
    <div className="animate-fadeIn">
      <PageTitle
        title="Diseño Gráfico"
        subtitle="Producción mensual · Flyers, video y fotografía"
        color={color}
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14, marginBottom: 28,
      }}>
        <StatCard label="Flyers totales"    value="0" icon="🎨" color={color} delay={0}    />
        <StatCard label="Stories"           value="0" icon="📱" color={color} delay={0.06} />
        <StatCard label="Efemérides"        value="0" icon="📅" color={color} delay={0.12} />
        <StatCard label="Colabs. en video"  value="0" icon="🎬" color={color} delay={0.18} />
        <StatCard label="Fotos de producto" value="0" icon="📸" color={color} delay={0.24} />
      </div>

      <CtaCard
        color={color} rgb={rgb}
        message="Registrá el trabajo de hoy para acumular las métricas del mes."
        label="✚ Registro de hoy →"
        onClick={() => navigate('/dashboard/diseno/ingresar')}
      />
    </div>
  )
}

// ─── SISTEMAS ─────────────────────────────────────────────────────────────────
export function SistemasDashboard() {
  const { currentArea } = useAuth()
  const navigate = useNavigate()
  const color = currentArea?.color || '#60A5FA'
  const rgb   = hexToRGB(color)

  return (
    <div className="animate-fadeIn">
      <PageTitle
        title="Sistemas / Web"
        subtitle="Incidencias, Google Analytics y gestión de imágenes"
        color={color}
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14, marginBottom: 28,
      }}>
        <StatCard label="Incidencias resueltas" value="0" icon="🔧" color={color} delay={0}    />
        <StatCard label="Sesiones web (GA4)"    value="—" icon="🌐" color={color} delay={0.06} />
        <StatCard label="Usuarios únicos"        value="—" icon="👤" color={color} delay={0.12} />
        <StatCard label="Imgs. con código"       value="0" icon="🏷️" color={color} delay={0.18} />
        <StatCard label="Imgs. optimizadas"      value="0" icon="⚡" color={color} delay={0.24} />
      </div>

      <CtaCard
        color={color} rgb={rgb}
        message="Registrá las actividades de hoy para llevar el historial mensual."
        label="✚ Registro de hoy →"
        onClick={() => navigate('/dashboard/sistemas/ingresar')}
      />
    </div>
  )
}

// ─── GERENCIA ─────────────────────────────────────────────────────────────────
export function GerenciaDashboard() {
  const { currentArea } = useAuth()
  const navigate = useNavigate()
  const color = currentArea?.color || '#A5B4FC'
  const rgb   = hexToRGB(color)

  return (
    <div className="animate-fadeIn">
      <PageTitle
        title="Gerencia / Contabilidad"
        subtitle="Vista ejecutiva · Jornadas médicas y ganancias por estrategia"
        color={color}
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14, marginBottom: 28,
      }}>
        <StatCard label="Jornadas este mes"   value="0"  icon="🏥" color={color} delay={0}    />
        <StatCard label="Gasto total jornadas" value="$0" icon="💰" color={color} delay={0.06} />
        <StatCard label="Estrategias activas"  value="0"  icon="📊" color={color} delay={0.12} />
        <StatCard label="Ingresos del mes"     value="$0" icon="💹" color={color} delay={0.18} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 14,
      }}>
        <CtaCard
          color={color} rgb={rgb} icon="🏥"
          message="Registrar nueva jornada médica"
          label="Nueva jornada →"
          onClick={() => navigate('/dashboard/gerencia/jornadas')}
        />
        <CtaCard
          color={color} rgb={rgb} icon="📂"
          message="Importar Excel de ganancias del mes"
          label="Importar Excel →"
          onClick={() => navigate('/dashboard/gerencia/ganancias')}
        />
      </div>
    </div>
  )
}
