'use client';

import React from 'react';
import { ProyectoFinanzasInfo } from './Finanzas';

interface ProyectoConfigProps {
  proyecto: ProyectoFinanzasInfo;
  precioUnitario: number;
  onUpdateProyecto: (nuevoProyecto: ProyectoFinanzasInfo) => void;
  onUpdatePrecio: (nuevoPrecio: number) => void;
}

export default function ProyectoConfig({
  proyecto,
  precioUnitario,
  onUpdateProyecto,
  onUpdatePrecio,
}: ProyectoConfigProps) {

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onUpdateProyecto({
      ...proyecto,
      [name]: value,
    });
  };

  const handlePrecioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Si está vacío, mandamos 0; de lo contrario convertimos a número limpio sin ceros a la izquierda
    onUpdatePrecio(val === '' ? 0 : Number(val));
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white border-[3px] border-[#020D22] shadow-[8px_8px_0px_#020D22]">
      <div className="bg-[#020D22] p-6 border-b-[3px] border-[#020D22] text-white">
        <span className="text-xs tracking-widest uppercase font-mono text-[#CEE4EF]">
          CENTRO DE CONTROL // METADATOS DEL LOTE
        </span>
        <h1 className="text-3xl font-black tracking-tighter uppercase mt-1">
          Configuración del Proyecto
        </h1>
      </div>

      <div className="p-6 space-y-5 font-mono">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-[#020D22] uppercase mb-1">
              Escuela / Generación
            </label>
            <input
              type="text"
              name="escuela_generacion"
              value={proyecto.escuela_generacion}
              onChange={handleChange}
              className="w-full border-2 border-[#020D22] p-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#020D22] bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[#020D22] uppercase mb-1">
              Clave de Proyecto (Prefijo SKU)
            </label>
            <input
              type="text"
              name="clave_proyecto"
              value={proyecto.clave_proyecto}
              onChange={handleChange}
              className="w-full border-2 border-[#020D22] p-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#020D22] bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-[#020D22] uppercase mb-1">
              Coordinador de Enlace
            </label>
            <input
              type="text"
              name="coordinador"
              value={proyecto.coordinador}
              onChange={handleChange}
              className="w-full border-2 border-[#020D22] p-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#020D22] bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[#020D22] uppercase mb-1">
              Folio de Orden
            </label>
            <input
              type="text"
              name="folio_orden"
              value={proyecto.folio_orden}
              onChange={handleChange}
              className="w-full border-2 border-[#020D22] p-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#020D22] bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-[#020D22] uppercase mb-1">
            Modelo y Color de Prenda
          </label>
          <input
            type="text"
            name="modelo_prenda"
            value={proyecto.modelo_prenda}
            onChange={handleChange}
            className="w-full border-2 border-[#020D22] p-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#020D22] bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-black text-[#020D22] uppercase mb-1">
            Técnica de Personalización
          </label>
          <input
            type="text"
            name="tecnica_personalizacion"
            value={proyecto.tecnica_personalizacion}
            onChange={handleChange}
            className="w-full border-2 border-[#020D22] p-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#020D22] bg-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-black text-[#020D22] uppercase mb-1">
              Precio por Sudadera ($)
            </label>
            <input
              type="number"
              value={precioUnitario}
              onChange={handlePrecioChange}
              className="w-full border-2 border-[#020D22] p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#020D22] bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[#020D22] uppercase mb-1">
              Fecha Límite Anticipo
            </label>
            <input
              type="date"
              name="fecha_anticipo"
              value={proyecto.fecha_anticipo}
              onChange={handleChange}
              className="w-full border-2 border-[#020D22] p-3 text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#020D22] bg-white"
            />
            <span className="text-[10px] text-gray-500 font-mono mt-1 block">
              Escribe o usa el calendario
            </span>
          </div>

          <div>
            <label className="block text-xs font-black text-[#020D22] uppercase mb-1">
              Fecha de Entrega Oficial
            </label>
            <input
              type="date"
              name="fecha_entrega"
              value={proyecto.fecha_entrega}
              onChange={handleChange}
              className="w-full border-2 border-[#020D22] p-3 text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#020D22] bg-white"
            />
            <span className="text-[10px] text-gray-500 font-mono mt-1 block">
              Escribe o usa el calendario
            </span>
          </div>
        </div>

        <div className="bg-[#CEE4EF] border-2 border-[#020D22] p-4 text-xs font-bold text-[#020D22]">
          💡 Nota: El estatus de producción general y los valores financieros se calculan automáticamente en función de los registros y aportaciones.
        </div>
      </div>
    </div>
  );
}