# MetricHub — Guía de configuración GA4 automático

## Resumen
Vas a crear una **cuenta de servicio de Google** que tiene permiso de lectura
en tu propiedad GA4. Esa cuenta se usa para traer datos automáticamente
cada noche y también con el botón "⚡ Sync GA4" en el dashboard.

---

## PASO 1 — Crear proyecto en Google Cloud Console

1. Ir a https://console.cloud.google.com
2. Click en el selector de proyectos (arriba a la izquierda) → **Nuevo proyecto**
3. Nombre: `MetricHub` → Crear
4. Asegurarse de que el proyecto `MetricHub` esté seleccionado

---

## PASO 2 — Habilitar la API de Google Analytics Data

1. En el menú izquierdo: **APIs y servicios** → **Biblioteca**
2. Buscar: `Google Analytics Data API`
3. Click en el resultado → **Habilitar**

---

## PASO 3 — Crear cuenta de servicio

1. **APIs y servicios** → **Credenciales**
2. Click **+ Crear credenciales** → **Cuenta de servicio**
3. Nombre: `metricas-ga4`
4. Click **Crear y continuar** → omitir los siguientes pasos opcionales → **Listo**
5. En la lista de cuentas de servicio, click en `metricas-ga4@...`
6. Pestaña **Claves** → **Agregar clave** → **Crear clave nueva** → **JSON** → Crear
7. Se descarga un archivo `.json` — **guardarlo en lugar seguro, no subirlo a git**

El archivo JSON tiene este formato:
```json
{
  "type": "service_account",
  "project_id": "metricas-...",
  "client_email": "metricas-ga4@metricas-....iam.gserviceaccount.com",
  "private_key": "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n",
  ...
}
```

---

## PASO 4 — Dar acceso a la cuenta de servicio en GA4

1. Ir a https://analytics.google.com
2. Click en el ícono ⚙️ **Administrar** (abajo a la izquierda)
3. En la columna **Propiedad**: **Administración de acceso a la propiedad**
4. Click **+** → **Agregar usuarios**
5. Email: pegar el `client_email` del JSON (ej: `metricas-ga4@...iam.gserviceaccount.com`)
6. Rol: **Lector**
7. Click **Agregar**

---

## PASO 5 — Obtener el Property ID de GA4

1. En GA4 Admin → columna **Propiedad** → **Detalles de la propiedad**
2. Copiar el **ID de la propiedad** (solo números, ej: `123456789`)

---

## PASO 6 — Configurar variables en Supabase Edge Functions

1. Ir a tu proyecto en https://supabase.com → **Edge Functions** → **Manage secrets**
2. Agregar estos secrets:

| Secret | Valor |
|--------|-------|
| `GA4_PROPERTY_ID` | El número de PASO 5 |
| `GOOGLE_CLIENT_EMAIL` | `client_email` del JSON |
| `GOOGLE_PRIVATE_KEY` | `private_key` del JSON (con los `\n` literales) |
| `SUPABASE_SERVICE_ROLE_KEY` | En Supabase → Settings → API → service_role |

---

## PASO 7 — Deploy de la Edge Function

Instalar Supabase CLI si no está instalado:
```bash
npm install -g supabase
```

Desde la raíz del proyecto:
```bash
supabase login
supabase link --project-ref TU_PROJECT_REF   # está en la URL de Supabase
supabase functions deploy sync-ga4
```

El `project-ref` es la parte `xxxxxxxxxx` de tu URL `https://xxxxxxxxxx.supabase.co`

---

## PASO 8 — Configurar el cron job en el VPS (actualización nocturna)

SSH al VPS y ejecutar:

```bash
# Copiar la carpeta scripts al VPS
# Desde tu máquina local:
scp -r metricas-app/scripts/ root@TU_VPS_IP:/opt/metricas-scripts/

# En el VPS, instalar dependencias:
cd /opt/metricas-scripts
npm install

# Crear archivo .env con los valores reales:
cp .env.example .env
nano .env
# → completar GA4_PROPERTY_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
```

Agregar el cron job (se ejecuta todos los días a las 3am):
```bash
crontab -e
```

Agregar esta línea:
```
0 3 * * * /usr/bin/node /opt/metricas-scripts/sync-ga4.js >> /var/log/ga4-sync.log 2>&1
```

Verificar que funciona manualmente:
```bash
node /opt/metricas-scripts/sync-ga4.js
# Debería mostrar: ✅ Synced: sesiones=... usuarios=... pageviews=...
```

---

## PASO 9 — Usar el botón en el dashboard

Una vez deployada la Edge Function, el botón **⚡ Sync GA4** aparece en:
`Dashboard → Sistemas/Web → Registrar → Tab "Google Analytics"`

Al hacer click trae los datos del mes seleccionado y los guarda automáticamente.

---

## Comandos útiles

```bash
# Sincronizar mes actual
node /opt/metricas-scripts/sync-ga4.js

# Sincronizar un mes específico (ej: febrero 2025, mes 0-indexed)
node /opt/metricas-scripts/sync-ga4.js 2025 1

# Sincronizar todos los meses de un año
node /opt/metricas-scripts/sync-ga4.js 2025 all

# Ver logs del cron
tail -f /var/log/ga4-sync.log
```

---

## Solución de problemas

**Error: `PERMISSION_DENIED`**
→ La cuenta de servicio no tiene acceso a la propiedad GA4. Repetir PASO 4.

**Error: `Google auth failed`**
→ La `GOOGLE_PRIVATE_KEY` tiene los `\n` escapados en vez de saltos de línea reales.
   En Supabase Secrets asegurarse de que el valor tenga `\n` literales (no `\\n`).

**Keywords vacías / `Search Console no vinculado`**
→ Es normal si no tenés Search Console vinculado a GA4. Las métricas principales
   (sesiones, usuarios, etc.) funcionan igual.
