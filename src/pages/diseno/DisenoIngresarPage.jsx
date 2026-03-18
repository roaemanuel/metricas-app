import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const color = '#06b6d4'

function todayISO() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`
}

const EMPTY = {
  piezas_realizadas: '',
  videos_editados: '',
  solicitudes_pendientes: '',
  notas: '',
}

export default function DisenoIngresarPage() {

  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [form, setForm] = useState({ ...EMPTY })
  const [existing, setExisting] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadDay(selectedDate)
  }, [selectedDate])

  async function loadDay(date) {
    setLoading(true)
    setSaved(false)

    const { data, error } = await supabase
      .from('diseno_grafico_diario')
      .select('*')
      .eq('fecha', date)
      .limit(1)
      .maybeSingle()

    if (error) {
      alert('Error cargando datos: ' + error.message)
      setLoading(false)
      return
    }

    if (data) {
      setExisting(data)
      setForm({
        piezas_realizadas: data.piezas_realizadas ?? '',
        videos_editados: data.videos_editados ?? '',
        solicitudes_pendientes: data.solicitudes_pendientes ?? '',
        notas: data.notas ?? '',
      })
    } else {
      setExisting(null)
      setForm({ ...EMPTY })
    }

    setLoading(false)
  }

  function num(v) {
    return v !== '' && v !== null && v !== undefined ? parseInt(v) : null
  }

  async function handleSave() {

    if (
      !form.piezas_realizadas &&
      !form.videos_editados &&
      !form.solicitudes_pendientes &&
      !form.notas.trim()
    ) {
      alert('Debes ingresar al menos un dato')
      return
    }

    setSaving(true)

    const payload = {
      fecha: selectedDate,
      piezas_realizadas: num(form.piezas_realizadas),
      videos_editados: num(form.videos_editados),
      solicitudes_pendientes: num(form.solicitudes_pendientes),
      notas: form.notas.trim(),
      ingresado_por: 'diseno',
      updated_at: new Date().toISOString(),
    }

    let error

    if (existing) {
      ;({ error } = await supabase
        .from('diseno_grafico_diario')
        .update(payload)
        .eq('id', existing.id))
    } else {
      ;({ error } = await supabase
        .from('diseno_grafico_diario')
        .insert(payload))
    }

    setSaving(false)

    if (error) {
      alert('Error guardando: ' + error.message)
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2500)

    loadDay(selectedDate)
  }

  const inp = {
    width: '100%',
    padding: '10px 13px',
    fontSize: '1rem',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    color: 'var(--text-primary)',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
  }

  return (
    <div className="animate-fadeIn">

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Registro Diseño Gráfico</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Solo se permite <strong>un registro por día</strong>
        </p>
      </div>

      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '20px 24px',
        marginBottom: 18,
      }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          FECHA
        </label>

        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={{ ...inp, marginTop: 6 }}
        />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>Cargando…</div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>

          <input
            type="number"
            placeholder="Piezas realizadas"
            value={form.piezas_realizadas}
            onChange={e => setForm(f => ({ ...f, piezas_realizadas: e.target.value }))}
            style={inp}
          />

          <input
            type="number"
            placeholder="Videos editados"
            value={form.videos_editados}
            onChange={e => setForm(f => ({ ...f, videos_editados: e.target.value }))}
            style={inp}
          />

          <input
            type="number"
            placeholder="Solicitudes pendientes"
            value={form.solicitudes_pendientes}
            onChange={e => setForm(f => ({ ...f, solicitudes_pendientes: e.target.value }))}
            style={inp}
          />

          <textarea
            rows={3}
            placeholder="Notas"
            value={form.notas}
            onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
            style={{ ...inp, resize: 'none', fontFamily: 'inherit' }}
          />

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '13px 28px',
              background: saved ? '#059669' : `linear-gradient(135deg, ${color}, #0891b2)`,
              border: 'none',
              borderRadius: 12,
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: 10,
            }}
          >
            {saving ? 'Guardando…' : saved ? '✓ Guardado' : existing ? 'Actualizar registro' : 'Guardar registro'}
          </button>

        </div>
      )}

    </div>
  )
}
