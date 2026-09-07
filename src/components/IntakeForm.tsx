'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface IntakeFormProps {
  proyectoId: string;
  clavePrefijo: string;
  requierePersonalizacion: boolean;
  onRegistroExitoso: (nuevaOrden: {
    id: string; // ID real generado por Supabase
    sku: string;
    nombre_completo: string;
    apodo_vinil: string;
    talla: 'XS' | 'S' | 'M' | 'L' | 'XL';
  }) => void;
}

export default function IntakeForm({
  proyectoId,
  clavePrefijo,
  requierePersonalizacion,
  onRegistroExitoso,
}: IntakeFormProps) {
  const [apellidos, setApellidos] = useState('');
  const [nombres, setNombres] = useState('');
  const [talla, setTalla] = useState<'XS' | 'S' | 'M' | 'L' | 'XL'>('M');
  const [apodoVinil, setApodoVinil] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const tallasDisponibles: ('XS' | 'S' | 'M' | 'L' | 'XL')[] = ['XS', 'S', 'M', 'L', 'XL'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apellidos.trim() || !nombres.trim()) {
      alert('Por favor completa los apellidos y el nombre.');
      return;
    }

    if (!proyectoId) {
      alert('❌ Error: El proyecto aún no se ha sincronizado con Supabase. Espera un segundo e inténtalo de nuevo.');
      return;
    }

    setLoading(true);
    setMensajeExito('');

    const nombreCompletoFinal = `${apellidos.trim()} ${nombres.trim()}`.toUpperCase();
    
    const apodoFinal = requierePersonalizacion
      ? (apodoVinil.trim() ? apodoVinil.trim() : nombres.trim())
      : 'SIN PERSONALIZACIÓN';
    
    const randomNum = Math.floor(100 + Math.random() * 900);
    const skuGenerado = `${clavePrefijo}-${randomNum}`;

    // Insertar en Supabase con aportación inicial en 0
    const { data: ordenInsertada, error } = await supabase
      .from('ordenes')
      .insert([
        {
          proyecto_id: proyectoId,
          sku: skuGenerado,
          nombre_completo: nombreCompletoFinal,
          talla: talla,
          apodo_vinil: apodoFinal,
          aportacion_actual: 0, // Arranca limpio en 0 por defecto
          estatus_produccion: 'Pendiente',
        },
      ])
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error('Error al guardar en Supabase:', error);
      alert('Hubo un error al registrar en la base de datos: ' + error.message);
      return;
    }

    onRegistroExitoso({
      id: ordenInsertada.id,
      sku: skuGenerado,
      nombre_completo: nombreCompletoFinal,
      apodo_vinil: apodoFinal,
      talla: talla,
    });

    setMensajeExito(`¡REGISTRO EXITOSO! SKU ASIGNADO: ${skuGenerado}`);
    
    // Limpiar formulario
    setApellidos('');
    setNombres('');
    setApodoVinil('');
  };

  return (
    <div className="bg-white border-[3px] border-[#020D22] p-8 shadow-[6px_6px_0px_#020D22] font-mono max-w-2xl mx-auto">
      <div className="border-b-2 border-[#020D22] pb-4 mb-6">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          INTAKE DE PERSONALIZACIÓN // {clavePrefijo}
        </span>
        <h2 className="text-3xl font-black text-[#020D22] uppercase tracking-tight mt-1">
          REGISTRO DE PRENDA
        </h2>
      </div>

      {mensajeExito && (
        <div className="mb-6 bg-emerald-100 border-2 border-[#020D22] p-4 text-emerald-900 font-black text-xs uppercase shadow-[4px_4px_0px_#020D22]">
          {mensajeExito}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black uppercase mb-2 text-[#020D22]">
              Apellidos
            </label>
            <input
              type="text"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              placeholder="Castillo Sánchez"
              required
              className="w-full border-[3px] border-[#020D22] p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#020D22] bg-slate-50 shadow-[3px_3px_0px_#020D22]"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-2 text-[#020D22]">
              Nombre(s)
            </label>
            <input
              type="text"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              placeholder="Roberto Carlos"
              required
              className="w-full border-[3px] border-[#020D22] p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#020D22] bg-slate-50 shadow-[3px_3px_0px_#020D22]"
            />
          </div>
        </div>

        {requierePersonalizacion && (
          <div>
            <label className="block text-xs font-black uppercase mb-2 text-[#020D22]">
              Apodo o Texto de Vinil (Exacto en Prenda)
            </label>
            <input
              type="text"
              value={apodoVinil}
              onChange={(e) => setApodoVinil(e.target.value)}
              placeholder="Robert C (Opcional)"
              className="w-full border-[3px] border-[#020D22] p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#020D22] bg-slate-50 shadow-[3px_3px_0px_#020D22]"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-black uppercase mb-2 text-[#020D22]">
            Talla de Sudadera
          </label>
          <div className="grid grid-cols-5 gap-3">
            {tallasDisponibles.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTalla(t)}
                className={`py-4 font-black text-base border-[3px] border-[#020D22] transition-all uppercase shadow-[3px_3px_0px_#020D22] ${
                  talla === t
                    ? 'bg-[#020D22] text-white translate-x-[2px] translate-y-[2px] shadow-none'
                    : 'bg-white text-[#020D22] hover:bg-[#CEE4EF]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#020D22] text-white font-black text-base uppercase py-5 border-[3px] border-[#020D22] shadow-[6px_6px_0px_#CEE4EF] hover:bg-[#CEE4EF] hover:text-[#020D22] transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'REGISTRANDO...' : 'ENVIAR DATOS'}
          </button>
        </div>
      </form>
    </div>
  );
}