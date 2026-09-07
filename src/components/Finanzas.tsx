'use client';

import React, { useState, useMemo } from 'react';

export interface ProyectoFinanzasInfo {
  escuela_generacion: string;
  clave_proyecto: string;
  coordinador: string;
  modelo_prenda: string;
  tecnica_personalizacion: string;
  fecha_anticipo: string;
  fecha_entrega: string;
  folio_orden: string;
  estatus_produccion_general: string;
}

export interface AbonoRegistro {
  id: string;
  fecha: string;
  monto: number;
}

export interface OrdenFinanzas {
  id: string;
  sku: string;
  nombre_completo: string;
  talla: string;
  aportacion_actual: number;
  saldo_pendiente: number;
  estatus_financiero: string;
  historial_abonos?: AbonoRegistro[];
}

interface FinanzasProps {
  proyecto: ProyectoFinanzasInfo;
  precioUnitario: number;
  ordenes: OrdenFinanzas[];
  onActualizarAportacion: (id: string, nuevoMonto: number, nuevoAbono: AbonoRegistro) => void;
  onResetFinanzas?: () => void;
  onAnticipoGlobal?: () => void;
}

const formatearFecha = (fechaStr: string) => {
  if (!fechaStr) return 'N/D';
  if (fechaStr.includes('-')) {
    const [anio, mes, dia] = fechaStr.split('-');
    if (anio && mes && dia) return `${dia}/${mes}/${anio}`;
  }
  return fechaStr;
};

export default function Finanzas({
  proyecto,
  precioUnitario,
  ordenes,
  onActualizarAportacion,
  onResetFinanzas,
  onAnticipoGlobal,
}: FinanzasProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'TODOS' | 'ADEUDO' | 'LIQUIDADO'>('TODOS');
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenFinanzas | null>(null);
  const [montoAbono, setMontoAbono] = useState('');

  const kpis = useMemo(() => {
    const totalRegistros = ordenes.length;
    const valorTotal = totalRegistros * precioUnitario;
    const totalRecaudado = ordenes.reduce((acc, curr) => acc + curr.aportacion_actual, 0);
    const totalPendiente = valorTotal - totalRecaudado;
    const conAdeudo = ordenes.filter((o) => (precioUnitario - o.aportacion_actual) > 0).length;
    const porcentajeRecaudado = valorTotal > 0 ? (totalRecaudado / valorTotal) * 100 : 0;

    return { totalRegistros, valorTotal, totalRecaudado, totalPendiente, conAdeudo, porcentajeRecaudado };
  }, [ordenes, precioUnitario]);

  const filteredList = useMemo(() => {
    return ordenes.filter((o) => {
      const saldo = precioUnitario - o.aportacion_actual;
      const matchSearch =
        o.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.sku.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;
      if (filterMode === 'ADEUDO') return saldo > 0;
      if (filterMode === 'LIQUIDADO') return saldo <= 0;
      return true;
    });
  }, [ordenes, searchTerm, filterMode, precioUnitario]);

  const abrirModalAbono = (orden: OrdenFinanzas) => {
    setOrdenSeleccionada(orden);
    setMontoAbono('');
    setModalAbierto(true);
  };

  const guardarAbono = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ordenSeleccionada) return;
    const abonoMonto = parseFloat(montoAbono);
    if (isNaN(abonoMonto) || abonoMonto <= 0) {
      alert('Ingresa un monto válido mayor a 0.');
      return;
    }

    const nuevaAportacion = ordenSeleccionada.aportacion_actual + abonoMonto;
    if (nuevaAportacion > precioUnitario) {
      alert(`❌ El abono supera el precio unitario de la prenda ($${precioUnitario}).`);
      return;
    }

    const fechaActual = new Date().toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const nuevoRegistroAbono: AbonoRegistro = {
      id: Date.now().toString(),
      fecha: fechaActual,
      monto: abonoMonto,
    };

    onActualizarAportacion(ordenSeleccionada.id, nuevaAportacion, nuevoRegistroAbono);
    setModalAbierto(false);
    setOrdenSeleccionada(null);
  };

  const handleExportCSV = () => {
    const headers = ['SKU,NOMBRE_COMPLETO,TALLA,APORTACION,SALDO_PENDIENTE,ESTATUS\n'];
    const rows = ordenes.map((o) => {
      const saldo = precioUnitario - o.aportacion_actual;
      return `"${o.sku}","${o.nombre_completo}","${o.talla}",${o.aportacion_actual},${saldo},"${saldo <= 0 ? 'LIQUIDADO' : 'PENDIENTE PARCIAL'}"`;
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURI([...headers, ...rows].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `reporte_financiero_${proyecto.clave_proyecto}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 relative">
      {/* Panel Ejecutivo del Proyecto */}
      <div className="bg-[#020D22] text-white border-[3px] border-[#020D22] p-6 shadow-[6px_6px_0px_#CEE4EF]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-600 pb-4 mb-4">
          <div>
            <span className="text-xs font-mono tracking-widest text-[#CEE4EF] font-bold uppercase">
              {proyecto.escuela_generacion} // FOLIO: {proyecto.folio_orden}
            </span>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mt-1">
              ESTADO FINANCIERO Y CONTROL DE PROYECTO
            </h2>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="bg-[#CEE4EF] text-[#020D22] font-mono font-black text-xs px-3 py-1.5 border-2 border-[#020D22] uppercase">
              CLAVE: {proyecto.clave_proyecto}
            </div>
            <span className="text-xs font-mono font-bold text-amber-300">
              {proyecto.estatus_produccion_general}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-xs font-mono">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
            <div>
              <span className="text-[#CEE4EF] block font-bold uppercase mb-1">Coordinador de Enlace:</span>
              <span className="font-extrabold text-white text-sm">{proyecto.coordinador}</span>
            </div>
            <div>
              <span className="text-[#CEE4EF] block font-bold uppercase mb-1">Modelo y Prenda:</span>
              <span className="font-extrabold text-white text-xs block">{proyecto.modelo_prenda}</span>
              <span className="text-gray-300 text-xs">{proyecto.tecnica_personalizacion}</span>
            </div>
            <div>
              <span className="text-[#CEE4EF] block font-bold uppercase mb-1">Precio Unitario:</span>
              <span className="font-extrabold text-emerald-300 text-sm block">${precioUnitario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="space-y-1">
              <div>
                <span className="text-[#CEE4EF] font-bold uppercase">Límite Anticipo:</span>{' '}
                <span className="font-bold text-white">{formatearFecha(proyecto.fecha_anticipo)}</span>
              </div>
              <div>
                <span className="text-[#CEE4EF] font-bold uppercase">Entrega Oficial:</span>{' '}
                <span className="font-bold text-white">{formatearFecha(proyecto.fecha_entrega)}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleExportCSV}
            className="bg-[#CEE4EF] text-[#020D22] font-mono font-black text-xs px-5 py-3 border-2 border-[#020D22] hover:bg-white shadow-[3px_3px_0px_#ffffff] transition-all uppercase whitespace-nowrap"
          >
            📥 Exportar Reporte CSV
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Clave */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border-[3px] border-[#020D22] p-4 shadow-[4px_4px_0px_#020D22]">
          <span className="text-xs font-mono uppercase text-gray-500 font-bold">Valor Total Proyecto</span>
          <p className="text-2xl font-black font-mono text-[#020D22]">
            ${kpis.valorTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs font-mono text-gray-400">{kpis.totalRegistros} Alumnos Registrados</span>
        </div>

        <div className="bg-white border-[3px] border-[#020D22] p-4 shadow-[4px_4px_0px_#020D22]">
          <span className="text-xs font-mono uppercase text-gray-500 font-bold">Total Recaudado</span>
          <p className="text-2xl font-black font-mono text-emerald-700">
            ${kpis.totalRecaudado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs font-mono font-bold text-gray-500">
            {kpis.porcentajeRecaudado.toFixed(2)}% del proyecto cubierto
          </span>
        </div>

        <div className="bg-white border-[3px] border-[#020D22] p-4 shadow-[4px_4px_0px_#020D22]">
          <span className="text-xs font-mono uppercase text-gray-500 font-bold">Saldo Pendiente Global</span>
          <p className="text-2xl font-black font-mono text-rose-700">
            ${kpis.totalPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs font-mono text-gray-400">Por cobrar</span>
        </div>

        <div className="bg-[#CEE4EF] border-[3px] border-[#020D22] p-4 shadow-[4px_4px_0px_#020D22]">
          <span className="text-xs font-mono uppercase text-[#020D22] font-bold">Alumnos con Adeudo</span>
          <p className="text-2xl font-black font-mono text-[#020D22]">
            {kpis.conAdeudo} / {kpis.totalRegistros}
          </p>
          <span className="text-xs font-mono font-bold text-rose-800 uppercase">Riesgo de Retención</span>
        </div>
      </div>

      {/* Controles de Búsqueda, Filtros y Botones de Pruebas */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="BUSCAR POR NOMBRE O SKU..."
          className="w-full md:w-96 border-[3px] border-[#020D22] p-3 font-mono text-sm uppercase placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#020D22] bg-white shadow-[2px_2px_0px_#020D22]"
        />

        <div className="flex flex-wrap gap-2 font-mono text-xs items-center">
          {/* Botón Seguro de Reseteo Financiero */}
          {onResetFinanzas && (
            <button
              onClick={onResetFinanzas}
              className="px-3 py-3 bg-rose-200 text-rose-950 font-black border-2 border-[#020D22] hover:bg-rose-300 transition-colors shadow-[2px_2px_0px_#020D22] uppercase whitespace-nowrap"
              title="Pone todas las cuentas en $0 con doble barrera de seguridad"
            >
              🧹 RESETEAR CUENTAS ($0)
            </button>
          )}

          {/* Botón de Anticipo Global a Todos */}
          {onAnticipoGlobal && (
            <button
              onClick={onAnticipoGlobal}
              className="px-4 py-3 bg-purple-200 text-purple-950 font-black border-2 border-[#020D22] hover:bg-purple-300 transition-colors shadow-[2px_2px_0px_#020D22] uppercase whitespace-nowrap"
            >
              ⚡ ANTICIPO GLOBAL A TODOS
            </button>
          )}

          {(['TODOS', 'ADEUDO', 'LIQUIDADO'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-4 py-3 font-black border-2 border-[#020D22] transition-colors ${
                filterMode === mode
                  ? 'bg-[#020D22] text-white shadow-[2px_2px_0px_#CEE4EF]'
                  : 'bg-white text-[#020D22] hover:bg-[#CEE4EF]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla Financiera de Alumnos */}
      <div className="border-[3px] border-[#020D22] bg-white overflow-x-auto shadow-[6px_6px_0px_#020D22]">
        <table className="w-full text-left border-collapse font-mono text-sm">
          <thead>
            <tr className="bg-[#CEE4EF] text-[#020D22] border-b-[3px] border-[#020D22] text-xs font-black uppercase">
              <th className="p-3 border-r-2 border-[#020D22]">SKU</th>
              <th className="p-3 border-r-2 border-[#020D22]">Nombre Completo</th>
              <th className="p-3 border-r-2 border-[#020D22] text-center">Talla</th>
              <th className="p-3 border-r-2 border-[#020D22] text-right">Aportación</th>
              <th className="p-3 border-r-2 border-[#020D22] text-right">Saldo Pendiente</th>
              <th className="p-3 border-r-2 border-[#020D22] text-center">Estatus</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-[#020D22]">
            {filteredList.map((row) => {
              const saldo = precioUnitario - row.aportacion_actual;
              return (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-black text-[#020D22] border-r-2 border-[#020D22]">
                    {row.sku}
                  </td>
                  <td className="p-3 font-bold border-r-2 border-[#020D22] uppercase">
                    {row.nombre_completo}
                  </td>
                  <td className="p-3 text-center border-r-2 border-[#020D22] font-bold">
                    {row.talla}
                  </td>
                  <td className="p-3 text-right border-r-2 border-[#020D22] font-semibold text-emerald-800">
                    ${row.aportacion_actual.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right border-r-2 border-[#020D22] font-black text-rose-800">
                    ${saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-center border-r-2 border-[#020D22]">
                    <span
                      className={`inline-block px-2.5 py-1 text-xs font-black border-2 border-[#020D22] uppercase ${
                        saldo <= 0
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-rose-100 text-rose-900'
                      }`}
                    >
                      {saldo <= 0 ? 'Liquidado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => abrirModalAbono(row)}
                      className="px-3 py-1.5 bg-[#020D22] text-white text-xs font-black border-2 border-[#020D22] hover:bg-[#CEE4EF] hover:text-[#020D22] transition-colors shadow-[2px_2px_0px_#CEE4EF] uppercase"
                    >
                      + Abono
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Brutalista de Abono con Bitácora */}
      {modalAbierto && ordenSeleccionada && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-mono">
          <div className="bg-white border-[4px] border-[#020D22] p-6 w-full max-w-lg shadow-[8px_8px_0px_#CEE4EF] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b-2 border-[#020D22] pb-3">
              <h3 className="font-black uppercase text-lg text-[#020D22]">
                REGISTRAR ABONO // {ordenSeleccionada.sku}
              </h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="font-black text-lg px-2 border-2 border-[#020D22] bg-rose-200 hover:bg-rose-300"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-1 font-bold bg-slate-50 p-3 border-2 border-[#020D22]">
              <p>Alumno: <span className="text-[#020D22] font-black">{ordenSeleccionada.nombre_completo}</span></p>
              <p>Precio Prenda: <span className="text-[#020D22]">${precioUnitario.toFixed(2)}</span></p>
              <p>Aportación Actual: <span className="text-emerald-700">${ordenSeleccionada.aportacion_actual.toFixed(2)}</span></p>
              <p>Saldo Pendiente: <span className="text-rose-700">${(precioUnitario - ordenSeleccionada.aportacion_actual).toFixed(2)}</span></p>
            </div>

            {/* Bitácora de Pagos Anteriores */}
            <div className="space-y-2">
              <span className="block text-xs font-black uppercase text-[#020D22]">
                📋 Bitácora de Abonos Previos:
              </span>
              <div className="border-2 border-[#020D22] bg-gray-50 max-h-36 overflow-y-auto p-2 space-y-1 text-xs">
                {(!ordenSeleccionada.historial_abonos || ordenSeleccionada.historial_abonos.length === 0) ? (
                  <p className="text-gray-500 italic text-center py-2">No hay abonos registrados en la bitácora.</p>
                ) : (
                  ordenSeleccionada.historial_abonos.map((abono) => (
                    <div key={abono.id} className="flex justify-between items-center bg-white p-2 border border-gray-300">
                      <span className="font-bold text-gray-700">📅 {abono.fecha}</span>
                      <span className="font-black text-emerald-800">+ ${abono.monto.toFixed(2)} MXN</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <form onSubmit={guardarAbono} className="space-y-4 pt-2 border-t-2 border-[#020D22]">
              <div>
                <label className="block text-xs font-black uppercase text-[#020D22] mb-1">
                  Nuevo Abono ($ MXN):
                </label>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(e.target.value)}
                  placeholder="Ej. 100 o 250"
                  className="w-full border-[3px] border-[#020D22] p-3 text-sm font-black focus:outline-none focus:ring-2 focus:ring-[#020D22] bg-white"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-[#020D22] font-black border-2 border-[#020D22] hover:bg-gray-300 uppercase text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[#020D22] text-white font-black border-2 border-[#020D22] hover:bg-[#CEE4EF] hover:text-[#020D22] uppercase text-xs shadow-[3px_3px_0px_#CEE4EF]"
                >
                  Registrar en Bitácora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}