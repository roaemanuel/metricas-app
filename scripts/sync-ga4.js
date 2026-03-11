#!/usr/bin/env node
/**
 * MetricHub — GA4 Sync Script
 * Ejecutar: node sync-ga4.js
 * Cron:     0 3 * * * /usr/bin/node /ruta/al/scripts/sync-ga4.js >> /var/log/ga4-sync.log 2>&1
 *
 * Requiere variables de entorno (ver .env.example):
 *   GA4_PROPERTY_ID        → ID de la propiedad GA4 (solo números, ej: 123456789)
 *   GOOGLE_CLIENT_EMAIL    → email de la cuenta de servicio
 *   GOOGLE_PRIVATE_KEY     → clave privada de la cuenta de servicio (con \n reales)
 *   SUPABASE_URL           → URL de tu proyecto Supabase
 *   SUPABASE_SERVICE_KEY   → service_role key de Supabase (NO la anon key)
 */

require('dotenv').config({ path: __dirname + '/.env' })
const { BetaAnalyticsDataClient } = require('@google-analytics/data')
const { createClient } = require('@supabase/supabase-js')

// ─── Config ────────────────────────────────────────────────────────────────
const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const analyticsClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key:  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
})

// ─── Helpers ───────────────────────────────────────────────────────────────
function getPeriodo(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}-01`
}

function getMonthRange(year, month) {
  const start = new Date(year, month, 1)
  const end   = new Date(year, month + 1, 0) // último día del mes
  const fmt   = d => d.toISOString().slice(0, 10)
  return { startDate: fmt(start), endDate: fmt(end) }
}

function metricVal(row, name) {
  const idx = row.metricValues?.findIndex ? null : null
  // GA4 returns values in order of request
  return null
}

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`)
}

// ─── Main sync ─────────────────────────────────────────────────────────────
async function syncMonth(year, month) {
  const periodo = getPeriodo(year, month)
  const { startDate, endDate } = getMonthRange(year, month)
  log(`Syncing GA4 for ${periodo} (${startDate} → ${endDate})`)

  // 1. Métricas principales
  const [mainResponse] = await analyticsClient.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: 'sessions' },
      { name: 'activeUsers' },
      { name: 'screenPageViews' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' },
    ],
  })

  const mainRow = mainResponse.rows?.[0]
  const mv = (i) => parseFloat(mainRow?.metricValues?.[i]?.value || '0')

  const sesiones              = Math.round(mv(0))
  const usuarios_activos      = Math.round(mv(1))
  const pageviews             = Math.round(mv(2))
  const tasa_rebote           = parseFloat((mv(3) * 100).toFixed(2))
  const duracion_promedio_seg = Math.round(mv(4))

  // 2. Fuentes de tráfico (canales)
  const [channelResponse] = await analyticsClient.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics:    [{ name: 'sessions' }],
  })

  const trafico = { organico:0, directo:0, social:0, referido:0, email:0 }
  for (const row of channelResponse.rows || []) {
    const canal    = row.dimensionValues?.[0]?.value?.toLowerCase() || ''
    const sessions = parseInt(row.metricValues?.[0]?.value || '0')
    if (canal.includes('organic'))  trafico.organico += sessions
    else if (canal.includes('direct')) trafico.directo += sessions
    else if (canal.includes('social')) trafico.social  += sessions
    else if (canal.includes('referral')) trafico.referido += sessions
    else if (canal.includes('email')) trafico.email   += sessions
  }

  // 3. Top keywords de búsqueda orgánica (Search Console vinculado a GA4)
  let seo_keywords = []
  try {
    const [searchResponse] = await analyticsClient.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'searchTerm' }],
      metrics:    [{ name: 'sessions' }, { name: 'organicGoogleSearchClicks' }, { name: 'organicGoogleSearchImpressions' }, { name: 'organicGoogleSearchAveragePosition' }],
      orderBys:   [{ metric: { metricName: 'organicGoogleSearchClicks' }, desc: true }],
      limit: 10,
    })
    seo_keywords = (searchResponse.rows || [])
      .filter(r => r.dimensionValues?.[0]?.value !== '(not set)')
      .map(r => ({
        keyword:     r.dimensionValues[0].value,
        clics:       parseInt(r.metricValues[1]?.value || '0'),
        impresiones: parseInt(r.metricValues[2]?.value || '0'),
        posicion:    parseFloat(r.metricValues[3]?.value || '0').toFixed(1),
      }))
  } catch (e) {
    log(`Keywords no disponibles (Search Console no vinculado): ${e.message}`)
  }

  // 4. Upsert en Supabase
  const payload = {
    periodo,
    sesiones,
    usuarios_activos,
    pageviews,
    tasa_rebote,
    duracion_promedio_seg,
    trafico_organico:  trafico.organico,
    trafico_directo:   trafico.directo,
    trafico_social:    trafico.social,
    trafico_referido:  trafico.referido,
    trafico_email:     trafico.email,
    seo_keywords,
    ingresado_por: 'ga4_api',
    updated_at: new Date().toISOString(),
  }

  // Check if exists
  const { data: existing } = await supabase
    .from('ga4_metrics')
    .select('id')
    .eq('periodo', periodo)
    .maybeSingle()

  let error
  if (existing) {
    ;({ error } = await supabase.from('ga4_metrics').update(payload).eq('id', existing.id))
  } else {
    ;({ error } = await supabase.from('ga4_metrics').insert(payload))
  }

  if (error) {
    log(`❌ Supabase error: ${error.message}`)
    return false
  }

  log(`✅ Synced: sesiones=${sesiones} usuarios=${usuarios_activos} pageviews=${pageviews} rebote=${tasa_rebote}% keywords=${seo_keywords.length}`)
  return true
}

// ─── Entry point ───────────────────────────────────────────────────────────
async function main() {
  if (!GA4_PROPERTY_ID) { log('❌ GA4_PROPERTY_ID no configurado'); process.exit(1) }
  if (!process.env.GOOGLE_CLIENT_EMAIL) { log('❌ GOOGLE_CLIENT_EMAIL no configurado'); process.exit(1) }
  if (!process.env.SUPABASE_SERVICE_KEY) { log('❌ SUPABASE_SERVICE_KEY no configurado'); process.exit(1) }

  const now   = new Date()
  const year  = parseInt(process.argv[2]) || now.getFullYear()
  const month = parseInt(process.argv[3]) !== undefined ? parseInt(process.argv[3]) : now.getMonth()
  // Usage: node sync-ga4.js          → mes actual
  //        node sync-ga4.js 2025 2   → marzo 2025 (mes 0-indexed)
  //        node sync-ga4.js 2025 all → todos los meses del año

  if (process.argv[3] === 'all') {
    log(`Syncing all months of ${year}...`)
    for (let m = 0; m <= (year === now.getFullYear() ? now.getMonth() : 11); m++) {
      await syncMonth(year, m)
      await new Promise(r => setTimeout(r, 1000)) // rate limit
    }
  } else {
    await syncMonth(year, month)
  }
}

main().catch(err => {
  log(`❌ Fatal error: ${err.message}`)
  console.error(err)
  process.exit(1)
})
