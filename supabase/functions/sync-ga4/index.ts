// Supabase Edge Function: sync-ga4
// Deploy: supabase functions deploy sync-ga4
// Ubicación: supabase/functions/sync-ga4/index.ts
//
// Esta función recibe un request desde el dashboard y ejecuta
// la sincronización de GA4 para el mes solicitado.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { year, month } = await req.json()

    const propertyId   = Deno.env.get('GA4_PROPERTY_ID')
    const clientEmail  = Deno.env.get('GOOGLE_CLIENT_EMAIL')
    const privateKey   = Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n')
    const supabaseUrl  = Deno.env.get('SUPABASE_URL')
    const supabaseKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!propertyId || !clientEmail || !privateKey) {
      return new Response(JSON.stringify({ error: 'GA4 credentials not configured' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    // ── Google Auth (JWT manual para Deno) ──────────────────────────────
    const now   = Math.floor(Date.now() / 1000)
    const claim = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }

    // Encode JWT
    const enc = (obj: unknown) =>
      btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

    const header  = enc({ alg: 'RS256', typ: 'JWT' })
    const payload = enc(claim)
    const sigInput = `${header}.${payload}`

    // Import private key and sign
    const keyData = privateKey
      .replace('-----BEGIN RSA PRIVATE KEY-----', '')
      .replace('-----END RSA PRIVATE KEY-----', '')
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '')

    const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8', binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['sign']
    )

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(sigInput)
    )

    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

    const jwt = `${sigInput}.${sigB64}`

    // Exchange JWT for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    })

    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      return new Response(JSON.stringify({ error: 'Google auth failed', detail: tokenData }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    const accessToken = tokenData.access_token

    // ── GA4 Data API ────────────────────────────────────────────────────
    const targetYear  = year  || new Date().getFullYear()
    const targetMonth = month ?? new Date().getMonth()
    const startDate   = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`
    const lastDay     = new Date(targetYear, targetMonth + 1, 0).getDate()
    const endDate     = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const periodo     = startDate

    // Main metrics
    const gaRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'sessions' },
            { name: 'activeUsers' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
          ],
        }),
      }
    )

    const gaData = await gaRes.json()
    const row = gaData.rows?.[0]
    const mv  = (i: number) => parseFloat(row?.metricValues?.[i]?.value || '0')

    const sesiones              = Math.round(mv(0))
    const usuarios_activos      = Math.round(mv(1))
    const pageviews             = Math.round(mv(2))
    const tasa_rebote           = parseFloat((mv(3) * 100).toFixed(2))
    const duracion_promedio_seg = Math.round(mv(4))

    // Channel traffic
    const chRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics:    [{ name: 'sessions' }],
        }),
      }
    )

    const chData = await chRes.json()
    const trafico = { organico: 0, directo: 0, social: 0, referido: 0, email: 0 }
    for (const r of chData.rows || []) {
      const canal = r.dimensionValues?.[0]?.value?.toLowerCase() || ''
      const s     = parseInt(r.metricValues?.[0]?.value || '0')
      if (canal.includes('organic'))  trafico.organico += s
      else if (canal.includes('direct'))   trafico.directo  += s
      else if (canal.includes('social'))   trafico.social   += s
      else if (canal.includes('referral')) trafico.referido += s
      else if (canal.includes('email'))    trafico.email    += s
    }

    // ── Upsert Supabase ─────────────────────────────────────────────────
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    const payload = {
      periodo, sesiones, usuarios_activos, pageviews, tasa_rebote,
      duracion_promedio_seg,
      trafico_organico:  trafico.organico,
      trafico_directo:   trafico.directo,
      trafico_social:    trafico.social,
      trafico_referido:  trafico.referido,
      trafico_email:     trafico.email,
      seo_keywords: [],
      ingresado_por: 'ga4_api',
      updated_at: new Date().toISOString(),
    }

    const { data: existing } = await supabase
      .from('ga4_metrics').select('id').eq('periodo', periodo).maybeSingle()

    const { error } = existing
      ? await supabase.from('ga4_metrics').update(payload).eq('id', existing.id)
      : await supabase.from('ga4_metrics').insert(payload)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      ok: true, periodo, sesiones, usuarios_activos, pageviews,
      tasa_rebote, duracion_promedio_seg, trafico,
    }), { headers: { ...CORS, 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  }
})
