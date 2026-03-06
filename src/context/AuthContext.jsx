import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const DASHBOARD_PASSWORD = import.meta.env.VITE_DASHBOARD_PASSWORD || 'metricas2025'
const SESSION_KEY = 'metricas_session'

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentArea, setCurrentArea] = useState(null) // null = no area selected yet
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session from sessionStorage
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved) {
      try {
        const { loggedIn, area } = JSON.parse(saved)
        if (loggedIn) {
          setIsLoggedIn(true)
          setCurrentArea(area || null)
        }
      } catch {}
    }
    loadAreas()
  }, [])

  async function loadAreas() {
    setLoading(true)
    const { data, error } = await supabase
      .from('area_config')
      .select('*')
      .eq('activo', true)
      .order('area_key')

    if (!error && data) setAreas(data)
    setLoading(false)
  }

  function login(password) {
    if (password === DASHBOARD_PASSWORD) {
      setIsLoggedIn(true)
      setCurrentArea(null)
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ loggedIn: true, area: null }))
      return true
    }
    return false
  }

  function selectArea(area) {
    setCurrentArea(area)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ loggedIn: true, area }))
  }

  function exitArea() {
    setCurrentArea(null)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ loggedIn: true, area: null }))
  }

  function logout() {
    setIsLoggedIn(false)
    setCurrentArea(null)
    sessionStorage.removeItem(SESSION_KEY)
  }

  // Validate PIN against Supabase area_config
  async function validatePin(areaKey, pin) {
    const { data, error } = await supabase
      .from('area_config')
      .select('*')
      .eq('area_key', areaKey)
      .eq('pin', pin)
      .single()

    if (error || !data) return null
    return data
  }

  return (
    <AuthContext.Provider value={{
      isLoggedIn, currentArea, areas, loading,
      login, logout, selectArea, exitArea, validatePin
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
