'use client';

import React, { useState } from 'react';

export interface ProyectoInfo {
  id: string;
  nombre_proyecto: string;
  clave_prefijo: string;
  coordinador: string;
  modelo_prenda: string;
  tecnica_personalizacion: string;
}

export interface OrdenProduccion {
  id: string;
  sku: string;
  nombre_completo: string;
  talla: 'XS' | 'S' | 'M' | 'L' | 'XL';
  apodo_vinil: string;
  estatus_produccion: 'Pendiente' | 'Impreso' | 'Entregado';
  saldo_pendiente?: number;
}

interface ProduccionDashboardProps {
  proyecto: ProyectoInfo;
  initialOrdenes: OrdenProduccion[];
  requierePersonalizacion: boolean;
  onUpdateEstatus: (id: string, nuevoEstatus: 'Pendiente' | 'Impreso' | 'Entregado') => void;
  onEliminarOrdenes?: (ids: string[]) => void;
}

const ordenTallasMap: Record<string, number> = {
  XS: 1,
  S: 2,
  M: 3,
  L: 4,
  XL: 5,
};

// Mapa de colores que define el fondo tenue de la fila y el borde izquierdo limpio para la celda
const estiloTallaMap: Record<string, { bg: string; borderLeft: string }> = {
  XS: { bg: 'bg-stone-50', borderLeft: 'border-l-[6px] border-stone-400' },
  S: { bg: 'bg-sky-50/60', borderLeft: 'border-l-[6px] border-sky-500' },
  M: { bg: 'bg-amber-50/60', borderLeft: 'border-l-[6px] border-amber-500' },
  L: { bg: 'bg-emerald-50/60', borderLeft: 'border-l-[6px] border-emerald-500' },
  XL: { bg: 'bg-purple-50/60', borderLeft: 'border-l-[6px] border-purple-500' },
};

export default function ProduccionDashboard({
  proyecto,
  initialOrdenes,
  requierePersonalizacion,
  onUpdateEstatus,
  onEliminarOrdenes,
}: ProduccionDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTalla, setFilterTalla] = useState<string>('TODAS');
  const [seleccionados, setSeleccionados] = useState<string[]>([]);

  const handleStatusChange = (id: string, nuevoEstatus: OrdenProduccion['estatus_produccion']) => {
    if (nuevoEstatus === 'Entregado') {
      const orden = initialOrdenes.find((o) => o.id === id);
      if (orden && orden.saldo_pendiente !== undefined && orden.saldo_pendiente > 0) {
        alert(`❌ ACCIÓN BLOQUEADA: No se puede entregar la prenda ${orden.sku} (${orden.nombre_completo}) porque tiene un saldo pendiente de $${orden.saldo_pendiente}.`);
        return;
      }
    }
    onUpdateEstatus(id, nuevoEstatus);
  };

  const handleLoteStatusChange = (nuevoEstatus: OrdenProduccion['estatus_produccion']) => {
    if (nuevoEstatus === 'Entregado') {
      const aptosParaEntrega = filteredOrdenes.filter((o) => o.saldo_pendiente === undefined || o.saldo_pendiente <= 0);
      const conAdeudo = filteredOrdenes.filter((o) => o.saldo_pendiente !== undefined && o.saldo_pendiente > 0);

      if (aptosParaEntrega.length === 0) {
        alert(`❌ ACCIÓN BLOQUEADA POR LOTE: Ninguna de las ${filteredOrdenes.length} piezas seleccionadas está liquidada.`);
        return;
      }

      if (conAdeudo.length > 0) {
        const confirmar = window.confirm(`⚠️ AVISO DE LOTE INTELIGENTE:\n\nHay ${conAdeudo.length} prenda(s) con saldo pendiente que serán omitidas. ¿Deseas marcar como ENTREGADO únicamente a las ${aptosParaEntrega.length} pieza(s) que ya están liquidadas?`);
        if (!confirmar) return;

        aptosParaEntrega.forEach((o) => {
          onUpdateEstatus(o.id, nuevoEstatus);
        });
        return;
      }
    }

    filteredOrdenes.forEach((o) => {
      onUpdateEstatus(o.id, nuevoEstatus);
    });
  };

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSeleccionarTodos = () => {
    if (seleccionados.length === filteredOrdenes.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(filteredOrdenes.map((o) => o.id));
    }
  };

  const handleEliminarSeleccionados = () => {
    if (seleccionados.length === 0) return;

    const confirmar = window.confirm(
      `⚠️ ADVERTENCIA DE ELIMINACIÓN MASIVA:\n\n¿Estás seguro de que deseas eliminar permanentemente estos ${seleccionados.length} asiento(s) de pedido?\n\nEsta acción borrará los registros de la lista de producción y de las finanzas del proyecto. No se puede deshacer.`
    );

    if (confirmar && onEliminarOrdenes) {
      onEliminarOrdenes(seleccionados);
      setSeleccionados([]);
    }
  };

  const filteredOrdenes = initialOrdenes
    .filter((o) => {
      const matchSearch =
        o.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.apodo_vinil.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;
      if (filterTalla !== 'TODAS' && o.talla !== filterTalla) return false;
      return true;
    })
    .sort((a, b) => {
      const pesoA = ordenTallasMap[a.talla] || 99;
      const pesoB = ordenTallasMap[b.talla] || 99;
      if (pesoA !== pesoB) return pesoA - pesoB;
      return a.nombre_completo.localeCompare(b.nombre_completo);
    });

  const resumenTallas = {
    XS: initialOrdenes.filter((o) => o.talla === 'XS').length,
    S: initialOrdenes.filter((o) => o.talla === 'S').length,
    M: initialOrdenes.filter((o) => o.talla === 'M').length,
    L: initialOrdenes.filter((o) => o.talla === 'L').length,
    XL: initialOrdenes.filter((o) => o.talla === 'XL').length,
    TOTAL: initialOrdenes.length,
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Proyecto */}
      <div className="bg-[#020D22] text-white border-[3px] border-[#020D22] p-6 shadow-[6px_6px_0px_#CEE4EF]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-600 pb-4 mb-4">
          <div>
            <span className="text-xs font-mono tracking-widest text-[#CEE4EF] uppercase font-bold">
              CONTROL DE PISO // {proyecto.nombre_proyecto}
            </span>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mt-1">
              PANEL DE PRODUCCIÓN
            </h2>
          </div>
          <div className="bg-[#CEE4EF] text-[#020D22] font-mono font-black text-xs px-3 py-1.5 border-2 border-[#020D22] uppercase">
            PREFIJO: {proyecto.clave_prefijo}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <span className="text-[#CEE4EF] block font-bold uppercase">Coordinador de Enlace:</span>
            <span className="font-extrabold text-white text-sm">{proyecto.coordinador}</span>
          </div>
          <div>
            <span className="text-[#CEE4EF] block font-bold uppercase">Especificaciones de Prenda:</span>
            <span className="font-extrabold text-white">{proyecto.modelo_prenda}</span>
            <span className="block text-gray-300">{proyecto.tecnica_personalizacion}</span>
          </div>
        </div>
      </div>

      {/* Resumen de Tallas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {(['XS', 'S', 'M', 'L', 'XL'] as const).map((talla) => (
          <div key={`resumen-${talla}`} className="bg-white border-[3px] border-[#020D22] p-3 shadow-[3px_3px_0px_#020D22] text-center font-mono">
            <span className="text-xs font-bold text-gray-500 uppercase">Talla {talla}</span>
            <p className="text-2xl font-black text-[#020D22]">{resumenTallas[talla]}</p>
          </div>
        ))}
        <div key="resumen-total" className="bg-[#CEE4EF] border-[3px] border-[#020D22] p-3 shadow-[3px_3px_0px_#020D22] text-center font-mono">
          <span className="text-xs font-bold text-[#020D22] uppercase">Total Piezas</span>
          <p className="text-2xl font-black text-[#020D22]">{resumenTallas.TOTAL}</p>
        </div>
      </div>

      {/* Filtros, Búsqueda y Acciones por Lote */}
      <div className="bg-white border-[3px] border-[#020D22] p-4 shadow-[4px_4px_0px_#020D22] space-y-4 font-mono">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="BUSCAR POR SKU, NOMBRE O APODO..."
            className="w-full md:w-96 border-[3px] border-[#020D22] p-3 text-sm uppercase placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#020D22] bg-slate-50"
          />

          <div className="flex flex-wrap gap-1 text-xs">
            {['TODAS', 'XS', 'S', 'M', 'L', 'XL'].map((t) => (
              <button
                key={`filtro-talla-${t}`}
                onClick={() => setFilterTalla(t)}
                className={`px-3 py-2.5 font-black border-2 border-[#020D22] transition-colors ${
                  filterTalla === t
                    ? 'bg-[#020D22] text-white shadow-[2px_2px_0px_#CEE4EF]'
                    : 'bg-white text-[#020D22] hover:bg-[#CEE4EF]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Barra de Acciones por Lotes y Eliminación */}
        <div className="border-t-2 border-[#020D22] pt-4 flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="text-xs font-black uppercase text-[#020D22] flex items-center gap-2">
            <span>⚡ ACCIÓN POR LOTE ({filteredOrdenes.length} en vista):</span>
            {seleccionados.length > 0 && (
              <span className="bg-rose-200 px-2 py-0.5 border border-[#020D22] text-rose-900 font-bold">
                {seleccionados.length} seleccionados
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 text-xs w-full lg:w-auto">
            <button
              onClick={() => handleLoteStatusChange('Pendiente')}
              className="px-3 py-2 bg-amber-100 text-amber-900 border-2 border-[#020D22] font-black hover:bg-amber-200 transition-colors shadow-[2px_2px_0px_#020D22]"
            >
              LOTE: PENDIENTE
            </button>
            <button
              onClick={() => handleLoteStatusChange('Impreso')}
              className="px-3 py-2 bg-blue-100 text-blue-900 border-2 border-[#020D22] font-black hover:bg-blue-200 transition-colors shadow-[2px_2px_0px_#020D22]"
            >
              LOTE: IMPRESO
            </button>
            <button
              onClick={() => handleLoteStatusChange('Entregado')}
              className="px-3 py-2 bg-emerald-100 text-emerald-900 border-2 border-[#020D22] font-black hover:bg-emerald-200 transition-colors shadow-[2px_2px_0px_#020D22]"
            >
              LOTE: ENTREGADO 🔒
            </button>
            
            {seleccionados.length > 0 && (
              <button
                onClick={handleEliminarSeleccionados}
                className="px-3 py-2 bg-rose-600 text-white border-2 border-[#020D22] font-black hover:bg-rose-700 transition-colors shadow-[2px_2px_0px_#020D22] animate-pulse"
              >
                🗑️ ELIMINAR ({seleccionados.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de Órdenes */}
      <div className="border-[3px] border-[#020D22] bg-white overflow-x-auto shadow-[6px_6px_0px_#020D22]">
        <table className="w-full text-left border-collapse font-mono text-sm">
          <thead>
            <tr className="bg-[#CEE4EF] text-[#020D22] border-b-[3px] border-[#020D22] text-xs font-black uppercase">
              <th className="p-3 border-r-2 border-[#020D22] text-center w-12">
                <input
                  type="checkbox"
                  checked={filteredOrdenes.length > 0 && seleccionados.length === filteredOrdenes.length}
                  onChange={toggleSeleccionarTodos}
                  className="w-4 h-4 accent-[#020D22] cursor-pointer"
                  title="Seleccionar todos"
                />
              </th>
              <th className="p-3 border-r-2 border-[#020D22]">SKU</th>
              <th className="p-3 border-r-2 border-[#020D22]">Nombre Completo</th>
              <th className="p-3 border-r-2 border-[#020D22] text-center">Talla</th>
              {requierePersonalizacion && (
                <th className="p-3 border-r-2 border-[#020D22]">Apodo / Vinil</th>
              )}
              <th className="p-3 text-center">Estatus de Producción</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-[#020D22]">
            {filteredOrdenes.map((row, index) => {
              const rowKey = row.id ? `orden-${row.id}` : `orden-idx-${index}`;
              const estaSeleccionado = seleccionados.includes(row.id);
              
              const estiloTalla = estiloTallaMap[row.talla] || { bg: 'bg-white', borderLeft: 'border-l-[6px] border-gray-300' };
              const claseFila = estaSeleccionado ? 'bg-rose-50' : `${estiloTalla.bg} hover:opacity-90 transition-opacity`;

              return (
                <tr key={rowKey} className={claseFila}>
                  <td className={`p-3 text-center border-r-2 border-[#020D22] ${estaSeleccionado ? 'border-l-[6px] border-l-rose-500' : estiloTalla.borderLeft}`}>
                    <input
                      type="checkbox"
                      checked={estaSeleccionado}
                      onChange={() => toggleSeleccion(row.id)}
                      className="w-4 h-4 accent-[#020D22] cursor-pointer"
                    />
                  </td>
                  <td className="p-3 font-black text-[#020D22] border-r-2 border-[#020D22]">
                    {row.sku}
                  </td>
                  <td className="p-3 font-bold border-r-2 border-[#020D22] uppercase">
                    {row.nombre_completo}
                  </td>
                  <td className="p-3 text-center border-r-2 border-[#020D22] font-black">
                    <span className="inline-block px-2 py-0.5 border border-[#020D22] bg-white text-xs shadow-[1px_1px_0px_#020D22]">
                      {row.talla}
                    </span>
                  </td>
                  {requierePersonalizacion && (
                    <td className="p-3 border-r-2 border-[#020D22] font-semibold text-blue-900 uppercase">
                      {row.apodo_vinil}
                    </td>
                  )}
                  <td className="p-3 text-center">
                    <select
                      value={row.estatus_produccion}
                      onChange={(e) => handleStatusChange(row.id, e.target.value as OrdenProduccion['estatus_produccion'])}
                      className={`font-mono text-xs font-black uppercase p-2 border-2 border-[#020D22] focus:outline-none cursor-pointer ${
                        row.estatus_produccion === 'Pendiente'
                          ? 'bg-amber-100 text-amber-900'
                          : row.estatus_produccion === 'Impreso'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Impreso">Impreso</option>
                      <option value="Entregado">Entregado</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}