import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RequireLogin, RequireArea } from './components/RouteGuard'
import ComingSoon from './components/ComingSoon'

import LoginPage        from './pages/LoginPage'
import AreaSelectorPage from './pages/AreaSelectorPage'
import DashboardLayout  from './pages/DashboardLayout'
import {
  SocialDashboard,
  SistemasDashboard,
  GerenciaDashboard,
} from './pages/DashboardHomePage'

// Fase 2 — Diseño Gráfico (módulo completo)
import DisenoDashboardPage from './pages/diseno/DisenoDashboardPage'
import DisenoIngresarPage  from './pages/diseno/DisenoIngresarPage'
import DisenoCompararPage  from './pages/diseno/DisenoCompararPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/areas" element={<RequireLogin><AreaSelectorPage /></RequireLogin>} />
          <Route path="/dashboard" element={<RequireArea><DashboardLayout /></RequireArea>}>

            {/* Social Media — Fase 3 */}
            <Route path="social" element={<SocialDashboard />} />
            <Route path="social/ingresar" element={<ComingSoon title="Ingreso de métricas" description="Fase 3." />} />
            <Route path="social/campanas" element={<ComingSoon title="Campañas publicitarias" description="Fase 3." />} />
            <Route path="social/comparar" element={<ComingSoon title="Comparativa mensual" description="Fase 3." />} />

            {/* ✅ Diseño Gráfico — Fase 2 COMPLETO */}
            <Route path="diseno"          element={<DisenoDashboardPage />} />
            <Route path="diseno/ingresar" element={<DisenoIngresarPage />} />
            <Route path="diseno/comparar" element={<DisenoCompararPage />} />

            {/* Sistemas — Fase 3 */}
            <Route path="sistemas" element={<SistemasDashboard />} />
            <Route path="sistemas/ingresar" element={<ComingSoon title="Registro diario" description="Fase 3." />} />
            <Route path="sistemas/ga4"      element={<ComingSoon title="Google Analytics" description="Fase 3." />} />
            <Route path="sistemas/comparar" element={<ComingSoon title="Comparativa mensual" description="Fase 3." />} />

            {/* Gerencia — Fase 4 */}
            <Route path="gerencia" element={<GerenciaDashboard />} />
            <Route path="gerencia/jornadas"  element={<ComingSoon title="Jornadas médicas" description="Fase 4." />} />
            <Route path="gerencia/ganancias" element={<ComingSoon title="Ganancias / Excel" description="Fase 4." />} />
            <Route path="gerencia/comparar"  element={<ComingSoon title="Comparativa ejecutiva" description="Fase 4." />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
