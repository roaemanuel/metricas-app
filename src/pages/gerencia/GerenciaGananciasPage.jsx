import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'

const accentColor = '#C084FC' // Purple 400 - Gerencia Theme

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
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
    ingresos: find('ingreso', 'venta', 'total', 'monto', 'precio'),
    unidades: find('unidad', 'cantidad', 'qty', 'cant'),
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
      ingresos_generados:  colMap.ingresos >= 0 ? parseMoney(row[colMap.ingresos]) : 0,
      unidades_vendidas:  colMap.unidades >= 0 ? parseInt(row[colMap.unidades]) || null : null,
      ingresado_por: 'gerencia',
    })).filter(r => r.nombre_estrategia && r.nombre_estrategia !== 'Sin nombre')

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
    if (!confirm(`¿Eliminar todos los registros de ${MONTH_NAMES[month]} ${year}?`)) return
    await supabase.from('ganancias_estrategia').delete().eq('periodo', periodo)
    loadData()
  }

  const totalIngresos = rows.reduce((s, r) => s + (r.ingresos_generados || 0), 0)
  const totalUnidades = rows.reduce((s, r) => s + (r.unidades_vendidas || 0), 0)

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:24, marginBottom:32 }}>
        <div>
          <h1 style={{ 
            fontSize:'2.5rem', fontWeight: 900, letterSpacing:'-2px', marginBottom:4,
            background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.55))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Ingresos y Estrategia
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', fontWeight: 500 }}>
            Gerencia · Gestión operativa y financiera por producto / campaña
          </p>
        </div>
        
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 4, 
            border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center' 
          }}>
            <button onClick={() => month===0 ? (setYear(y=>y-1), setMonth(11)) : setMonth(m=>m-1)} 
              style={{ width:40, height:40, borderRadius:12, background:'transparent', border:'none', color:'#fff', fontSize:'1.2rem', cursor:'pointer' }}>‹</button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#fff', minWidth: 140, textAlign: 'center', fontWeight: 800 }}>
              {MONTH_NAMES[month].toUpperCase()} {year}
            </span>
            <button onClick={() => isCurrentMonth ? null : month===11 ? (setYear(y=>y+1), setMonth(0)) : setMonth(m=>m+1)} 
              disabled={isCurrentMonth} style={{ 
                width:40, height:40, borderRadius:12, background:'transparent', border:'none', 
                color: isCurrentMonth ? 'rgba(255,255,255,0.2)' : '#fff', fontSize:'1.2rem', 
                cursor: isCurrentMonth ? 'not-allowed' : 'pointer' 
              }}>›</button>
          </div>
          
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display:'none' }} />
          <button 
            onClick={() => fileRef.current?.click()} 
            style={{
              padding:'14px 28px', background: `linear-gradient(135deg, ${accentColor}, #818CF8)`,
              border:'none', borderRadius: 16, color:'#fff', fontSize:'0.9rem', 
              fontWeight: 800, cursor:'pointer', boxShadow:`0 8px 24px ${accentColor}33`,
              display:'flex', alignItems:'center', gap:10, transition: 'all 0.3s'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 30px ${accentColor}55` }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 8px 24px ${accentColor}33` }}
          >
            <span style={{ fontSize: '1.2rem' }}>📂</span> IMPORTAR EXCEL
          </button>
        </div>
      </div>

      {/* Import preview modal */}
      {importing && importPreview && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(8,12,28,0.4)',
          backdropFilter:'blur(20px)', display:'flex', alignItems:'center',
          justifyContent:'center', zIndex:1000, padding: 20
        }}>
          <div className="animate-scaleIn" style={{
            background:'rgba(255,255,255,0.07)', border:`1px solid ${accentColor}44`,
            borderRadius:32, padding:'40px', width:'100%', maxWidth:700,
            maxHeight:'90vh', overflow:'auto', boxShadow:`0 32px 64px rgba(0,0,0,0.5)`,
            position: 'relative'
          }}>
            <h2 style={{ fontSize:'1.8rem', fontWeight: 900, letterSpacing:'-1px', marginBottom:8, color: '#fff' }}>Vista Previa</h2>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.95rem', marginBottom:32, fontWeight: 500 }}>
              Auditando <strong style={{color:accentColor}}>{rawData.length} registros</strong>. Verificá el mapeo de columnas antes de confirmar.
            </p>

            {/* Column mapping */}
            <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:'24px', marginBottom:32 }}>
              <div style={{ fontSize:'0.75rem', fontWeight: 800, color:'rgba(255,255,255,0.4)', letterSpacing:'0.1em', marginBottom:20, textTransform: 'uppercase' }}>Configuración de Mapeo</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:20 }}>
                {[
                  { key:'nombre',   label:'Estrategia / Item' },
                  { key:'ingresos', label:'Ingreso Generado' },
                  { key:'unidades', label:'Unidades Vendidas' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display:'block', fontSize:'0.7rem', color: accentColor, marginBottom:8, fontWeight:800, letterSpacing: '0.05em' }}>{f.label.toUpperCase()}</label>
                    <select value={colMap[f.key] ?? -1}
                      onChange={e => setColMap(m => ({ ...m, [f.key]: parseInt(e.target.value) }))}
                      style={{ width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, color:'#fff', fontSize:'0.85rem', outline: 'none' }}>
                      <option value={-1} style={{background:'#080c1c'}}>— Omitir columna —</option>
                      {rawHeaders.map((h, i) => <option key={i} value={i} style={{background:'#080c1c'}}>{h || `Columna ${i+1}`}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview table */}
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 32 }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem' }}>
                  <thead>
                    <tr style={{ background:'rgba(255,255,255,0.05)' }}>
                      {rawHeaders.map((h,i) => (
                        <th key={i} style={{ padding:'12px 16px', textAlign:'left', color:'rgba(255,255,255,0.4)', fontWeight:800, fontSize:'0.7rem', textTransform: 'uppercase' }}>
                          {h || `Col ${i+1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((row,i) => (
                      <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                        {rawHeaders.map((_,ci) => (
                          <td key={ci} style={{ padding:'10px 16px', color:'rgba(255,255,255,0.7)', whiteSpace:'nowrap', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis' }}>
                            {String(row[ci] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:16 }}>
              <button 
                onClick={() => { setImporting(false); setImportPreview(null) }} 
                style={{
                  padding:'14px 24px', background:'transparent', border:'1px solid rgba(255,255,255,0.2)',
                  borderRadius:16, color:'rgba(255,255,255,0.6)', fontSize:'0.9rem', fontWeight: 700, cursor:'pointer',
                }}
              >CANCELAR</button>
              <button 
                onClick={confirmImport} 
                disabled={saving || colMap.nombre < 0} 
                style={{
                  padding:'14px 32px',
                  background: saving || colMap.nombre < 0 ? 'rgba(255,255,255,0.05)' : accentColor,
                  border:'none', borderRadius:16,
                  color: saving || colMap.nombre < 0 ? 'rgba(255,255,255,0.2)' : '#080C1C',
                  fontSize:'0.9rem', fontWeight: 900, cursor: saving || colMap.nombre < 0 ? 'not-allowed':'pointer',
                  boxShadow: !saving && colMap.nombre >= 0 ? `0 8px 32px ${accentColor}55` : 'none',
                }}
              >
                {saving ? 'IMPORTANDO...' : `CONFIRMAR ${rawData.length} REGISTROS`}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:120 }}>
          <div className="animate-spin" style={{ width:48, height:48, borderRadius:'50%', border:'4px solid rgba(255,255,255,0.1)', borderTopColor: accentColor }} />
        </div>
      ) : rows.length === 0 ? (
        <div style={{ 
          textAlign:'center', padding:'80px 40px', border:`2px dashed rgba(255,255,255,0.1)`, 
          borderRadius:32, background:'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)'
        }}>
          <div style={{ fontSize:64, marginBottom:24, filter: 'grayscale(1) opacity(0.5)' }}>📊</div>
          <h2 style={{ color:'#fff', fontSize: '1.5rem', fontWeight: 800, marginBottom:8 }}>Cero Registros</h2>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'1rem', marginBottom:32, maxWidth: 400, marginInline: 'auto' }}>
            No se han cargado datos para el periodo {MONTH_NAMES[month]} {year}. Importá el archivo de ventas mensual para comenzar.
          </p>
          <button 
            onClick={() => fileRef.current?.click()} 
            style={{
              padding:'14px 32px', background: 'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', 
              borderRadius:16, color:'#fff', fontWeight: 800, fontSize:'0.9rem', cursor:'pointer'
            }}
          >SELECCIONAR EXCEL</button>
        </div>
      ) : (
        <div className="animate-fadeUp">
          {saved && (
            <div style={{ 
              background:'rgba(16, 185, 129, 0.1)', border:'1px solid rgba(16, 185, 129, 0.3)', 
              borderRadius:16, padding:'14px 20px', marginBottom:24, fontSize:'0.9rem', 
              color:'#10B981', fontWeight: 700, display:'flex', alignItems:'center', gap:10 
            }}>
              ✓ Importación completada: {rows.length} registros cargados para {MONTH_NAMES[month]} {year}
            </div>
          )}

          {/* KPIs */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:20, marginBottom:32 }}>
            {[
              { label:'Estrategias Activas', value:rows.length, icon:'📋', c:accentColor },
              { label:'Ingresos Consolidados', value:formatMoney(totalIngresos), icon:'💵', c:'#10B981' },
              { label:'Unidades Vendidas', value:totalUnidades ? totalUnidades.toLocaleString('es-AR') : '—', icon:'📦', c:'#3B82F6' },
              { label:'Ticket Promedio', value:rows.length ? formatMoney(Math.round(totalIngresos/rows.length)) : '—', icon:'📈', c:'#FDBA74' },
            ].map((k,i) => (
              <div key={i} className="animate-fadeUp" style={{
                animationDelay:`${i*0.1}s`, background:'rgba(255, 255, 255, 0.07)',
                backdropFilter: 'blur(28px)', border:'1px solid rgba(255, 255, 255, 0.1)',
                borderRadius:24, padding:'28px', position:'relative', overflow:'hidden',
                boxShadow:'0 8px 32px rgba(0,0,0,0.15)', transition: 'all 0.3s'
              }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:k.c, opacity:0.8 }} />
                <div style={{ fontSize:28, marginBottom:16, filter: `drop-shadow(0 0 8px ${k.c}44)` }}>{k.icon}</div>
                <div style={{ 
                  fontFamily:'var(--font-mono)', fontSize:'2rem', fontWeight: 800, 
                  color:'#fff', letterSpacing:'-1px', lineHeight:1, marginBottom:8 
                }}>{k.value}</div>
                <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Table Container */}
          <div style={{ 
            background:'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(28px)',
            border:'1px solid rgba(255, 255, 255, 0.1)', borderRadius:32, 
            overflow:'hidden', boxShadow:'0 12px 40px rgba(0,0,0,0.2)' 
          }}>
            <div style={{ 
              padding:'24px 32px', borderBottom:'1px solid rgba(255, 255, 255, 0.08)', 
              display:'flex', alignItems:'center', justifyContent:'space-between',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div style={{ fontSize:'0.85rem', fontWeight: 900, color: accentColor, letterSpacing:'0.1em', textTransform: 'uppercase' }}>
                REPARTO POR ESTRATEGIA ({rows.length})
              </div>
              <button onClick={deleteAll} style={{
                fontSize:'0.75rem', fontWeight: 800, color:'#FCA5A5', background:'rgba(239, 68, 68, 0.1)',
                border:'1px solid rgba(239, 68, 68, 0.2)', borderRadius:12, padding:'6px 14px', cursor:'pointer',
                transition: 'all 0.2s'
              }} onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#fff' }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#FCA5A5' }}>
                BORRAR CONTENIDO DEL MES
              </button>
            </div>
            
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.9rem' }}>
                <thead>
                  <tr style={{ background:'rgba(255,255,255,0.02)' }}>
                    {['Estrategia Operativa','Ingreso Bruto','Ratio Unidades','Share %'].map(h => (
                      <th key={h} style={{ padding:'16px 24px', textAlign:'left', color:'rgba(255,255,255,0.4)', fontWeight:800, fontSize:'0.75rem', letterSpacing:'0.05em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                    <th style={{ width:80 }} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const pct = totalIngresos > 0 ? (r.ingresos_generados / totalIngresos * 100) : 0
                    return (
                      <tr key={r.id} style={{ 
                        borderTop:'1px solid rgba(255, 255, 255, 0.05)', 
                        background: i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'}
                      >
                        <td style={{ padding:'18px 24px', color:'#fff', fontWeight: 700 }}>{r.nombre_estrategia}</td>
                        <td style={{ padding:'18px 24px', fontFamily:'var(--font-mono)', fontWeight: 800, color:'#10B981', fontSize: '1rem' }}>{formatMoney(r.ingresos_generados)}</td>
                        <td style={{ padding:'18px 24px', fontFamily:'var(--font-mono)', color:'rgba(255,255,255,0.5)', fontWeight: 600 }}>{r.unidades_vendidas ?? '—'}</td>
                        <td style={{ padding:'18px 24px', minWidth:160 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                            <div style={{ flex:1, height:6, background:'rgba(255,255,255,0.05)', borderRadius:10, overflow:'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ width:`${pct}%`, height:'100%', background: `linear-gradient(90deg, ${accentColor}, #818CF8)`, borderRadius:10, transition:'width 1s cubic-bezier(0.2, 0, 0.2, 1)' }} />
                            </div>
                            <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.75rem', color: accentColor, fontWeight: 800, minWidth:45 }}>{pct.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td style={{ padding:'18px 24px', textAlign:'right' }}>
                          <button onClick={() => deleteRow(r.id)} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:'0.8rem', padding:'6px 8px', borderRadius:8, transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.color='#F87171'; e.currentTarget.style.background='rgba(239, 68, 68, 0.1)' }}
                            onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.3)'; e.currentTarget.style.background='rgba(255,255,255,0.05)' }}
                          >✕</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop:'2px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.03)' }}>
                    <td style={{ padding:'20px 24px', fontWeight: 900, color:'rgba(255,255,255,0.4)', fontSize:'0.8rem', letterSpacing: '0.1em' }}>RESUMEN TOTAL</td>
                    <td style={{ padding:'20px 24px', fontFamily:'var(--font-mono)', fontWeight: 900, color:'#10B981', fontSize:'1.2rem' }}>{formatMoney(totalIngresos)}</td>
                    <td style={{ padding:'20px 24px', fontFamily:'var(--font-mono)', color:'rgba(255,255,255,0.5)', fontWeight: 800 }}>{totalUnidades || '—'}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
