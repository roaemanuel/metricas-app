import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'

const NAV_ITEMS = {
  social: [
    { path: '/dashboard/social',           label: 'Resumen del mes',    icon: '◎' },
    { path: '/dashboard/social/ingresar',  label: 'Ingresar métricas',  icon: '✚' },
    { path: '/dashboard/social/campanas',  label: 'Campañas',           icon: '📢' },
    { path: '/dashboard/social/comparar',  label: 'Comparar meses',     icon: '⇄' },
  ],
  diseno: [
    { path: '/dashboard/diseno',           label: 'Resumen del mes',    icon: '◎' },
    { path: '/dashboard/diseno/ingresar',  label: 'Registro diario',    icon: '✚' },
    { path: '/dashboard/diseno/comparar',  label: 'Comparar meses',     icon: '⇄' },
  ],
  sistemas: [
    { path: '/dashboard/sistemas',          label: 'Resumen del mes',   icon: '◎' },
    { path: '/dashboard/sistemas/ingresar', label: 'Registro diario',   icon: '✚' },
    { path: '/dashboard/sistemas/ga4',      label: 'Google Analytics',  icon: '📈' },
    { path: '/dashboard/sistemas/comparar', label: 'Comparar meses',    icon: '⇄' },
  ],
  gerencia: [
    { path: '/dashboard/gerencia',              label: 'Vista general',       icon: '◎' },
    { path: '/dashboard/gerencia/jornadas',     label: 'Jornadas médicas',    icon: '🏥' },
    { path: '/dashboard/gerencia/ganancias',    label: 'Ganancias / Excel',   icon: '💹' },
    { path: '/dashboard/gerencia/comparar',     label: 'Comparar meses',      icon: '⇄' },
  ],
}

export default function DashboardLayout() {
  const { currentArea, exitArea, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!currentArea) {
    navigate('/areas')
    return null
  }

/* Force pure blue UI globally */
  const areaColor = 'var(--accent)'
  const areaColorGlow = 'var(--accent-glow)'
  const navItems = NAV_ITEMS[currentArea.area_key] || []

  const now = new Date()
  const monthLabel = now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'transparent',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Dynamic Background Orbs for Glass Refraction */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '-10%', width: '40vw', height: '40vw',
          background: 'var(--accent)', opacity: 0.15, filter: 'blur(100px)', borderRadius: '50%',
          animation: 'drift 15s ease-in-out infinite alternate',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw',
          background: 'var(--accent-secondary)', opacity: 0.1, filter: 'blur(120px)', borderRadius: '50%',
          animation: 'drift 20s ease-in-out infinite alternate-reverse',
        }} />
        <div style={{
          position: 'absolute', top: '30%', left: '40%', width: '30vw', height: '30vw',
          background: 'var(--sistemas-color)', opacity: 0.1, filter: 'blur(90px)', borderRadius: '50%',
          animation: 'drift 18s ease-in-out infinite alternate',
        }} />
      </div>
      {/* Sidebar */}
      <aside className="glass-panel" style={{
        width: 220,
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 4,
          }}>
            <span style={{ fontSize: 18 }}>▦</span>
            <span style={{
              fontWeight: 600, fontSize: '1rem',
              letterSpacing: '-0.5px',
              color: 'var(--text-primary)',
            }}>MetricHub</span>
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
          }}>
            {monthLabel}
          </div>
        </div>

        {/* Area badge */}
        <div style={{
          margin: '16px 12px',
          padding: '10px 14px',
          background: 'var(--accent-glow)',
          border: `1px solid var(--border-bright)`,
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>{currentArea.icono}</span>
          <div>
            <div style={{
              fontSize: '0.78rem', fontWeight: 600,
              color: areaColor, lineHeight: 1.2,
            }}>{currentArea.area_nombre}</div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              color: 'var(--text-muted)',
              marginTop: 2,
            }}>área activa</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
          <div style={{
            fontSize: '0.62rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            fontWeight: 600,
            padding: '0 8px',
            marginBottom: 8,
          }}>Navegación</div>

          {navItems.map(item => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  marginBottom: 2,
                  background: isActive ? 'var(--accent-glow)' : 'transparent',
                  color: isActive ? areaColor : 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 400,
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                  borderLeft: isActive ? `2px solid ${areaColor}` : '2px solid transparent',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-hover)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }
                }}
              >
                <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div style={{
          padding: '12px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <button
            onClick={exitArea}
            style={{
              width: '100%',
              padding: '9px 12px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: '0.78rem',
              textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            ⇦ Cambiar área
          </button>
          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '9px 12px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              textAlign: 'left',
              fontFamily: 'var(--font-mono)',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f0436a'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ✕ Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        minWidth: 0,
        overflowY: 'auto',
        background: 'transparent',
      }}>
        {/* Top bar */}
        <div className="glass-panel" style={{
          position: 'sticky', top: 0, zIndex: 10,
          borderBottom: '1px solid var(--border)',
          padding: '14px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            height: 3, width: 3, borderRadius: '50%',
            background: areaColor,
            boxShadow: `0 0 8px ${areaColor}`,
            marginRight: 10,
            animation: 'pulse-glow 2s ease infinite',
          }} />
          <div style={{ flex: 1 }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.1em',
            }}>
              {currentArea.icono} {currentArea.area_nombre.toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
            }}>
              {new Date().toLocaleDateString('es-AR', {
                weekday: 'short', day: '2-digit',
                month: 'short', year: 'numeric'
              })}
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding: '32px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
