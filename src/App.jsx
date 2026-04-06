import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RequireLogin, RequireArea } from './components/RouteGuard'
import ComingSoon from './components/ComingSoon'

import LoginPage        from './pages/LoginPage'
import AreaSelectorPage from './pages/AreaSelectorPage'
import DashboardLayout  from './pages/DashboardLayout'

// ✅ Social Media — Fase 5
import SocialDashboardPage from './pages/social/SocialDashboardPage'
import SocialIngresarPage  from './pages/social/SocialIngresarPage'
import SocialCampanasPage  from './pages/social/SocialCampanasPage'
import SocialCompararPage  from './pages/social/SocialCompararPage'

// ✅ Diseño Gráfico — Fase 2
import DisenoDashboardPage from './pages/diseno/DisenoDashboardPage'
import DisenoIngresarPage  from './pages/diseno/DisenoIngresarPage'
import DisenoCompararPage  from './pages/diseno/DisenoCompararPage'

// ✅ Sistemas / Web — Fase 3
import SistemasDashboardPage from './pages/sistemas/SistemasDashboardPage'
import SistemasIngresarPage  from './pages/sistemas/SistemasIngresarPage'
import SistemasCompararPage  from './pages/sistemas/SistemasCompararPage'

// ✅ Gerencia — Fase 4
import GerenciaDashboardPage from './pages/gerencia/GerenciaDashboardPage'
import GerenciaJornadasPage  from './pages/gerencia/GerenciaJornadasPage'
import GerenciaGananciasPage from './pages/gerencia/GerenciaGananciasPage'
import GerenciaCompararPage  from './pages/gerencia/GerenciaCompararPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/areas" element={<RequireLogin><AreaSelectorPage /></RequireLogin>} />

          <Route path="/dashboard" element={<RequireArea><DashboardLayout /></RequireArea>}>

            {/* ✅ Social Media */}
            <Route path="social"           element={<SocialDashboardPage />} />
            <Route path="social/ingresar"  element={<SocialIngresarPage />} />
            <Route path="social/campanas"  element={<SocialCampanasPage />} />
            <Route path="social/comparar"  element={<SocialCompararPage />} />

            {/* ✅ Diseño Gráfico */}
            <Route path="diseno"           element={<DisenoDashboardPage />} />
            <Route path="diseno/ingresar"  element={<DisenoIngresarPage />} />
            <Route path="diseno/comparar"  element={<DisenoCompararPage />} />

            {/* ✅ Sistemas / Web */}
            <Route path="sistemas"           element={<SistemasDashboardPage />} />
            <Route path="sistemas/ingresar"  element={<SistemasIngresarPage />} />
            <Route path="sistemas/ga4"       element={<SistemasIngresarPage />} />
            <Route path="sistemas/comparar"  element={<SistemasCompararPage />} />

            {/* ✅ Gerencia */}
            <Route path="gerencia"             element={<GerenciaDashboardPage />} />
            <Route path="gerencia/jornadas"    element={<GerenciaJornadasPage />} />
            <Route path="gerencia/ganancias"   element={<GerenciaGananciasPage />} />
            <Route path="gerencia/comparar"    element={<GerenciaCompararPage />} />

          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
