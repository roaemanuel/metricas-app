import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'

const color = '#9b59f7'

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function getPeriodo(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}-01`
}
function formatMoney(n) {
  if (!n && n !== 0) return '—'
  return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0 })
}
function parseMoney(v) {
  if (!v && v !== 0) return 0
  if (typeof v === 'number') return v
  return parseFloat(String(v).replace(/[^0-9.-]/g, '')) || 0
}

// Smart column detection for Excel
function detectColumns(headers) {
  const h = headers.map(x => String(x || '').toLowerCase().trim())
  const find = (...keywords) => h.findIndex(x => keywords.some(k => x.includes(k)))
  return {
    nombre:   find('nombre', 'producto', 'estrategia', 'descripcion', 'item', 'concepto'),
    ingresos_generados: find('ingreso', 'venta', 'total', 'monto', 'precio'),
    unidades_vendidas: find('unidad', 'cantidad', 'qty', 'cant'),
    periodo:  find('mes', 'periodo', 'fecha', 'month'),
  }
}

export default function GerenciaGananciasPage() {
  const now = new Date()
  const [year, setYear]     = useState(now.getFullYear())
  const [month, setMonth]   = useState(now.getMonth())
  const [rows, setRows]     = useState([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importPreview, setImportPreview] = useState(null)
  const [colMap, setColMap] = useState({})
  const [rawHeaders, setRawHeaders] = useState([])
  const [rawData, setRawData] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef()

  const periodo = getPeriodo(year, month)
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  useEffect(() => { loadData() }, [year, month])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase
      .from('ganancias_estrategia')
      .select('*')
      .eq('periodo', periodo)
      .order('ingresos', { ascending: false })
    setRows(data || [])
    setLoading(false)
  }

  // Excel parsing
  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
      if (!data.length) return

      const headers = data[0].map(String)
      const dataRows = data.slice(1).filter(r => r.some(c => c !== ''))
      const detected = detectColumns(headers)

      setRawHeaders(headers)
      setRawData(dataRows)
      setColMap(detected)
      setImportPreview(dataRows.slice(0, 5))
      setImporting(true)
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
  }

  async function confirmImport() {
    setSaving(true)
    const toInsert = rawData.map(row => ({
      periodo,
      nombre_estrategia: colMap.nombre >= 0 ? String(row[colMap.nombre] || '').trim() : 'Sin nombre',
      ingresos_generados:  colMap.ingresos_generados >= 0 ? parseMoney(row[colMap.ingresos_generados]) : 0,
      unidades_vendidas:  colMap.unidades_vendidas >= 0 ? parseInt(row[colMap.unidades_vendidas]) || null : null,
      ingresado_por: 'gerencia',
    })).filter(r => r.nombre_estrategia && r.nombre_estrategia !== 'Sin nombre')

    // Delete existing for this period then insert
    await supabase.from('ganancias_estrategia').delete().eq('periodo', periodo)
    const { error } = await supabase.from('ganancias_estrategia').insert(toInsert)
    setSaving(false)
    if (!error) {
      setImporting(false); setImportPreview(null)
      setSaved(true); setTimeout(() => setSaved(false), 3000)
      loadData()
    } else alert('Error al importar: ' + error.message)
  }

  async function deleteRow(id) {
    await supabase.from('ganancias_estrategia').delete().eq('id', id)
    loadData()
  }

  async function deleteAll() {
    if (!confirm(`¿Eliminar todos los registros de ${MONTHS_ES[month]} ${year}?`)) return
    await supabase.from('ganancias_estrategia').delete().eq('periodo', periodo)
    loadData()
  }

  const totalIngresos = rows.reduce((s, r) => s + (r.ingresos_generados || 0), 0)
  const totalUnidades = rows.reduce((s, r) => s + (r.unidades_vendidas || 0), 0)

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:'1.6rem',fontWeight:800,letterSpacing:'-0.8px',marginBottom:4 }}>Ganancias / Estrategia</h1>
          <p style={{ color:'var(--text-secondary)',fontSize:'0.88rem' }}>Importación mensual desde Excel · ventas por producto o estrategia</p>
        </div>
        <div style={{ display:'flex',gap:8,alignItems:'center' }}>
          <button onClick={() => { if(month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }}
            style={{ width:34,height:34,borderRadius:8,background:'var(--bg-elevated)',border:'1px solid var(--border)',color:'var(--text-secondary)',fontSize:'1rem',cursor:'pointer' }}>‹</button>
          <span style={{ fontFamily:'var(--font-mono)',fontSize:'0.82rem',color:'var(--text-primary)',minWidth:130,textAlign:'center' }}>{MONTHS_ES[month]} {year}</span>
          <button onClick={() => { if(isCurrentMonth)return; if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }}
            disabled={isCurrentMonth} style={{ width:34,height:34,borderRadius:8,background:'var(--bg-elevated)',border:'1px solid var(--border)',color:isCurrentMonth?'var(--text-muted)':'var(--text-secondary)',fontSize:'1rem',cursor:isCurrentMonth?'not-allowed':'pointer' }}>›</button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display:'none' }} />
          <button onClick={() => fileRef.current?.click()} style={{
            padding:'8px 18px',marginLeft:8,background:color,
            border:'none',borderRadius:8,color:'#fff',
            fontSize:'0.82rem',fontWeight:700,cursor:'pointer',
            boxShadow:`0 2px 12px ${color}44`,
            display:'flex',alignItems:'center',gap:7,
          }}>
            <span style={{ fontSize:'1rem' }}>📂</span> Importar Excel
          </button>
        </div>
      </div>

      {/* Import preview modal */}
      {importing && importPreview && (
        <div style={{
          position:'fixed',inset:0,background:'rgba(7,8,15,0.9)',
          backdropFilter:'blur(14px)',display:'flex',alignItems:'center',
          justifyContent:'center',zIndex:200,
        }}>
          <div style={{
            background:'var(--bg-surface)',border:`1px solid ${color}44`,
            borderRadius:20,padding:'32px',width:'100%',maxWidth:660,
            maxHeight:'80vh',overflow:'auto',
            boxShadow:`0 0 60px ${color}20`,
          }}>
            <h2 style={{ fontSize:'1.1rem',fontWeight:800,letterSpacing:'-0.3px',marginBottom:6 }}>Vista previa de importación</h2>
            <p style={{ color:'var(--text-secondary)',fontSize:'0.82rem',marginBottom:20 }}>
              Se detectaron <strong style={{color:'var(--text-primary)'}}>{rawData.length} filas</strong>. Verificá que las columnas estén bien mapeadas.
            </p>

            {/* Column mapping */}
            <div style={{ background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:12,padding:'16px 20px',marginBottom:20 }}>
              <div style={{ fontSize:'0.72rem',fontWeight:700,color:'var(--text-muted)',letterSpacing:'0.1em',marginBottom:12 }}>MAPEO DE COLUMNAS</div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                {[
                  { key:'nombre',   label:'Nombre/Estrategia *' },
                  { key:'ingresos', label:'Ingresos/Ventas' },
                  { key:'unidades', label:'Unidades vendidas' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display:'block',fontSize:'0.72rem',color:'var(--text-muted)',marginBottom:5,fontWeight:600 }}>{f.label}</label>
                    <select value={colMap[f.key] ?? -1}
                      onChange={e => setColMap(m => ({ ...m, [f.key]: parseInt(e.target.value) }))}
                      style={{ width:'100%',padding:'7px 10px',background:'var(--bg-base)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:'0.82rem' }}>
                      <option value={-1}>— No importar —</option>
                      {rawHeaders.map((h, i) => <option key={i} value={i}>{h || `Columna ${i+1}`}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview table */}
            <div style={{ overflowX:'auto',marginBottom:20 }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'0.8rem' }}>
                <thead>
                  <tr style={{ background:'var(--bg-elevated)' }}>
                    {rawHeaders.map((h,i) => (
                      <th key={i} style={{ padding:'8px 12px',textAlign:'left',color:'var(--text-muted)',fontWeight:600,fontSize:'0.7rem',whiteSpace:'nowrap',borderBottom:'1px solid var(--border)' }}>
                        {h || `Col ${i+1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((row,i) => (
                    <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                      {rawHeaders.map((_,ci) => (
                        <td key={ci} style={{ padding:'7px 12px',color:'var(--text-secondary)',whiteSpace:'nowrap',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis' }}>
                          {String(row[ci] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rawData.length > 5 && (
                <p style={{ textAlign:'center',fontSize:'0.72rem',color:'var(--text-muted)',padding:'8px',fontFamily:'var(--font-mono)' }}>
                  … y {rawData.length - 5} filas más
                </p>
              )}
            </div>

            <div style={{ background:'#f59e0b18',border:'1px solid #f59e0b44',borderRadius:10,padding:'10px 14px',marginBottom:20,fontSize:'0.78rem',color:'#fbbf24' }}>
              ⚠️ Esta acción reemplazará todos los registros de <strong>{MONTHS_ES[month]} {year}</strong> con los datos del Excel.
            </div>

            <div style={{ display:'flex',justifyContent:'flex-end',gap:10 }}>
              <button onClick={() => { setImporting(false); setImportPreview(null) }} style={{
                padding:'11px 22px',background:'transparent',border:'1px solid var(--border)',
                borderRadius:10,color:'var(--text-secondary)',fontSize:'0.88rem',cursor:'pointer',
              }}>Cancelar</button>
              <button onClick={confirmImport} disabled={saving || colMap.nombre < 0} style={{
                padding:'11px 28px',
                background: saving || colMap.nombre < 0 ? 'var(--bg-elevated)' : `linear-gradient(135deg, ${color}, #7c3aed)`,
                border:'none',borderRadius:10,
                color: saving || colMap.nombre < 0 ? 'var(--text-muted)' : '#fff',
                fontSize:'0.9rem',fontWeight:700,cursor: saving || colMap.nombre < 0 ? 'not-allowed':'pointer',
                boxShadow: !saving && colMap.nombre >= 0 ? `0 4px 20px ${color}44` : 'none',
              }}>
                {saving ? 'Importando…' : `✓ Confirmar ${rawData.length} filas`}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display:'flex',justifyContent:'center',padding:60 }}>
          <div style={{ width:28,height:28,borderRadius:'50%',border:'2px solid var(--border-bright)',borderTopColor:color,animation:'spin 0.8s linear infinite' }} />
        </div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign:'center',padding:'60px 24px',border:`1px dashed ${color}44`,borderRadius:16,background:'var(--bg-surface)' }}>
          <div style={{ fontSize:40,marginBottom:14 }}>📊</div>
          <p style={{ color:'var(--text-secondary)',marginBottom:8 }}>No hay datos para {MONTHS_ES[month]} {year}</p>
          <p style={{ color:'var(--text-muted)',fontSize:'0.82rem',marginBottom:24 }}>
            Importá el Excel mensual de ventas con el botón de arriba
          </p>
          <button onClick={() => fileRef.current?.click()} style={{
            padding:'12px 28px',background:color,border:'none',borderRadius:10,
            color:'#fff',fontWeight:700,fontSize:'0.88rem',cursor:'pointer',
          }}>📂 Importar Excel →</button>
        </div>
      ) : (
        <>
          {saved && (
            <div style={{ background:'#05966920',border:'1px solid #05966944',borderRadius:10,padding:'10px 16px',marginBottom:16,fontSize:'0.82rem',color:'#10b981',display:'flex',alignItems:'center',gap:8 }}>
              ✓ Importación completada — {rows.length} registros cargados para {MONTHS_ES[month]} {year}
            </div>
          )}

          {/* KPIs */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:24 }}>
            {[
              { label:'Registros', value:rows.length, icon:'📋', c:color },
              { label:'Ingresos totales', value:formatMoney(totalIngresos), icon:'💵', c:'#10b981' },
              { label:'Unidades vendidas', value:totalUnidades ? totalUnidades.toLocaleString('es-AR') : '—', icon:'📦', c:'#3b82f6' },
              { label:'Ingreso promedio', value:rows.length ? formatMoney(Math.round(totalIngresos/rows.length)) : '—', icon:'📈', c:'#f59e0b' },
            ].map((k,i) => (
              <div key={i} className="animate-fadeUp" style={{
                animationDelay:`${i*0.05}s`,background:'var(--bg-surface)',
                border:'1px solid var(--border)',borderRadius:14,
                padding:'20px 22px',position:'relative',overflow:'hidden',
              }}>
                <div style={{ position:'absolute',top:0,left:0,right:0,height:2,background:k.c,opacity:0.7 }} />
                <div style={{ fontSize:22,marginBottom:10 }}>{k.icon}</div>
                <div style={{ fontFamily:'var(--font-mono)',fontSize:'1.7rem',fontWeight:600,color:k.c,letterSpacing:'-1px',lineHeight:1,marginBottom:6 }}>{k.value}</div>
                <div style={{ fontSize:'0.8rem',color:'var(--text-secondary)' }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden' }}>
            <div style={{ padding:'14px 22px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div style={{ fontSize:'0.78rem',fontWeight:700,color:'var(--text-secondary)',letterSpacing:'0.05em' }}>
                DETALLE POR ESTRATEGIA / PRODUCTO ({rows.length})
              </div>
              <button onClick={deleteAll} style={{
                fontSize:'0.72rem',color:'#f87171',background:'#dc262610',
                border:'1px solid #dc262630',borderRadius:7,padding:'4px 10px',cursor:'pointer',
              }}>✕ Limpiar mes</button>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'0.85rem' }}>
                <thead>
                  <tr style={{ background:'var(--bg-elevated)' }}>
                    {['Nombre / Estrategia','Ingresos','Unidades','%'].map(h => (
                      <th key={h} style={{ padding:'10px 16px',textAlign:'left',color:'var(--text-muted)',fontWeight:600,fontSize:'0.72rem',letterSpacing:'0.05em',whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                    <th style={{ width:36 }} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const pct = totalIngresos > 0 ? (r.ingresos_generados / totalIngresos * 100) : 0
                    return (
                      <tr key={r.id} style={{ borderTop:'1px solid var(--border)',background: i%2===0?'transparent':'var(--bg-elevated)' }}>
                        <td style={{ padding:'11px 16px',color:'var(--text-primary)',fontWeight:500 }}>{r.nombre_estrategia}</td>
                        <td style={{ padding:'11px 16px',fontFamily:'var(--font-mono)',fontWeight:700,color:'#10b981' }}>{formatMoney(r.ingresos_generados)}</td>
                        <td style={{ padding:'11px 16px',fontFamily:'var(--font-mono)',color:'var(--text-secondary)' }}>{r.unidades_vendidas ?? '—'}</td>
                        <td style={{ padding:'11px 16px', minWidth:120 }}>
                          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                            <div style={{ flex:1,height:5,background:'var(--bg-base)',borderRadius:99,overflow:'hidden' }}>
                              <div style={{ width:`${pct}%`,height:'100%',background:color,borderRadius:99,transition:'width 0.5s ease' }} />
                            </div>
                            <span style={{ fontFamily:'var(--font-mono)',fontSize:'0.72rem',color:'var(--text-muted)',minWidth:34 }}>{pct.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td style={{ padding:'11px 8px',textAlign:'center' }}>
                          <button onClick={() => deleteRow(r.id)} style={{ background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'0.75rem',padding:'2px 6px',borderRadius:5 }}
                            onMouseEnter={e=>e.currentTarget.style.color='#f87171'}
                            onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}
                          >✕</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop:'2px solid var(--border)',background:'var(--bg-elevated)' }}>
                    <td style={{ padding:'11px 16px',fontWeight:700,color:'var(--text-secondary)',fontSize:'0.82rem' }}>TOTAL</td>
                    <td style={{ padding:'11px 16px',fontFamily:'var(--font-mono)',fontWeight:700,color:'#10b981',fontSize:'1rem' }}>{formatMoney(totalIngresos)}</td>
                    <td style={{ padding:'11px 16px',fontFamily:'var(--font-mono)',color:'var(--text-secondary)' }}>{totalUnidades || '—'}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
