'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import ProyectoConfig from '@/components/ProyectoConfig';
import IntakeForm from '@/components/IntakeForm';
import ProduccionDashboard, { ProyectoInfo } from '@/components/ProduccionDashboard';
import Finanzas, { OrdenFinanzas, ProyectoFinanzasInfo, AbonoRegistro } from '@/components/Finanzas';

interface OrdenGlobal {
  id: string;
  sku: string;
  nombre_completo: string;
  talla: 'XS' | 'S' | 'M' | 'L' | 'XL';
  apodo_vinil: string;
  estatus_produccion: 'Pendiente' | 'Impreso' | 'Entregado';
  aportacion_actual: number;
  historial_abonos?: AbonoRegistro[];
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'config' | 'intake' | 'produccion' | 'finanzas'>('config');
  const [loadingData, setLoadingData] = useState(true);

  const [precioUnitario, setPrecioUnitario] = useState<number>(600);
  const [requierePersonalizacion, setRequierePersonalizacion] = useState<boolean>(true);

  const [proyectoBase, setProyectoBase] = useState({
    id: '',
    escuela_generacion: 'Medicina Anáhuac Mayab - Gen 2026',
    clave_proyecto: 'ANMED26',
    coordinador: 'Joaquín Cámara',
    modelo_prenda: 'Sudadera 100% Algodón Waffle Knit - Color Navy Shield',
    tecnica_personalizacion: 'Serigrafía (Separación CMYK) + Apodo en Vinil UV',
    fecha_anticipo: '2026-09-18',
    fecha_entrega: '2026-10-15',
    folio_orden: 'MAY-0926-01',
  });

  const [ordenesGlobales, setOrdenesGlobales] = useState<OrdenGlobal[]>([]);

  useEffect(() => {
    cargarDatosSupabase();
  }, []);

  const cargarDatosSupabase = async () => {
    setLoadingData(true);
    try {
      let { data: proyectosData } = await supabase.from('proyectos').select('*').limit(1);

      if (proyectosData && proyectosData.length > 0) {
        const p = proyectosData[0];
        setProyectoBase({
          id: p.id,
          escuela_generacion: p.escuela_generacion,
          clave_proyecto: p.clave_proyecto,
          coordinador: p.coordinador,
          modelo_prenda: p.modelo_prenda,
          tecnica_personalizacion: p.tecnica_personalizacion,
          fecha_anticipo: p.fecha_anticipo,
          fecha_entrega: p.fecha_entrega,
          folio_orden: p.folio_orden,
        });
        setPrecioUnitario(p.precio_unitario || 600);
      } else {
        const { data: nuevoProj } = await supabase
          .from('proyectos')
          .insert([
            {
              escuela_generacion: proyectoBase.escuela_generacion,
              clave_proyecto: proyectoBase.clave_proyecto,
              coordinador: proyectoBase.coordinador,
              modelo_prenda: proyectoBase.modelo_prenda,
              tecnica_personalizacion: proyectoBase.tecnica_personalizacion,
              fecha_anticipo: proyectoBase.fecha_anticipo,
              fecha_entrega: proyectoBase.fecha_entrega,
              folio_orden: proyectoBase.folio_orden,
              precio_unitario: 600,
            },
          ])
          .select()
          .single();

        if (nuevoProj) {
          setProyectoBase((prev) => ({ ...prev, id: nuevoProj.id }));
        }
      }

      const { data: ordenesData } = await supabase
        .from('ordenes')
        .select(`*, historial_abonos(*)`);

      if (ordenesData) {
        const formateadas: OrdenGlobal[] = ordenesData.map((o: any) => ({
          id: o.id,
          sku: o.sku,
          nombre_completo: o.nombre_completo,
          talla: o.talla,
          apodo_vinil: o.apodo_vinil,
          estatus_produccion: o.estatus_produccion,
          aportacion_actual: Number(o.aportacion_actual),
          historial_abonos: (o.historial_abonos || []).map((h: any) => ({
            id: h.id,
            fecha: h.fecha,
            monto: Number(h.monto),
          })),
        }));
        setOrdenesGlobales(formateadas);
      }
    } catch (err) {
      console.error('Error sincronizando con Supabase:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleUpdateProyecto = async (nuevoProyecto: any) => {
    setProyectoBase(nuevoProyecto);
    if (proyectoBase.id) {
      await supabase
        .from('proyectos')
        .update({
          escuela_generacion: nuevoProyecto.escuela_generacion,
          clave_proyecto: nuevoProyecto.clave_proyecto,
          coordinador: nuevoProyecto.coordinador,
          modelo_prenda: nuevoProyecto.modelo_prenda,
          tecnica_personalizacion: nuevoProyecto.tecnica_personalizacion,
          fecha_anticipo: nuevoProyecto.fecha_anticipo,
          fecha_entrega: nuevoProyecto.fecha_entrega,
          folio_orden: nuevoProyecto.folio_orden,
        })
        .eq('id', proyectoBase.id);
    }
  };

  const handleUpdatePrecio = async (nuevoPrecio: number) => {
    setPrecioUnitario(nuevoPrecio);
    if (proyectoBase.id) {
      await supabase
        .from('proyectos')
        .update({ precio_unitario: nuevoPrecio })
        .eq('id', proyectoBase.id);
    }
  };

  const handleUpdateEstatusProduccion = async (id: string, nuevoEstatus: 'Pendiente' | 'Impreso' | 'Entregado') => {
    setOrdenesGlobales((prev) =>
      prev.map((o) => (o.id === id ? { ...o, estatus_produccion: nuevoEstatus } : o))
    );
    await supabase.from('ordenes').update({ estatus_produccion: nuevoEstatus }).eq('id', id);
  };

  const handleActualizarAportacion = async (id: string, nuevaAportacion: number, nuevoAbono: AbonoRegistro) => {
    setOrdenesGlobales((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const historialActual = o.historial_abonos || [];
          return {
            ...o,
            aportacion_actual: nuevaAportacion,
            historial_abonos: [nuevoAbono, ...historialActual],
          };
        }
        return o;
      })
    );

    await supabase.from('ordenes').update({ aportacion_actual: nuevaAportacion }).eq('id', id);
    await supabase.from('historial_abonos').insert([
      {
        orden_id: id,
        fecha: nuevoAbono.fecha,
        monto: nuevoAbono.monto,
      },
    ]);
  };

  const handleEliminarOrdenes = async (idsAEliminar: string[]) => {
    setOrdenesGlobales((prev) => prev.filter((o) => !idsAEliminar.includes(o.id)));
    await supabase.from('ordenes').delete().in('id', idsAEliminar);
  };

  const handleResetFinanzas = async () => {
    const confirmar1 = window.confirm(
      '⚠️ ZONA DE ALTO RIESGO // REINICIO FINANCIERO:\n\nEstás a punto de poner en $0.00 las aportaciones y bitácoras de TODOS los alumnos en la nube.\n\n¿Estás completamente seguro?'
    );
    if (!confirmar1) return;

    const palabraSeguridad = window.prompt(
      '🔒 BARRERA DE SEGURIDAD INDUSTRIAL:\n\nPara confirmar esta acción destructiva, escribe exactamente la palabra: RESET'
    );

    if (palabraSeguridad === null || palabraSeguridad.trim().toUpperCase() !== 'RESET') {
      window.alert('❌ ACCIÓN CANCELADA: Palabra incorrecta.');
      return;
    }

    setOrdenesGlobales((prev) =>
      prev.map((o) => ({
        ...o,
        aportacion_actual: 0,
        historial_abonos: [],
      }))
    );

    for (const o of ordenesGlobales) {
      await supabase.from('ordenes').update({ aportacion_actual: 0 }).eq('id', o.id);
      await supabase.from('historial_abonos').delete().eq('orden_id', o.id);
    }

    window.alert('🧹 ¡Cuentas financieras reiniciadas a ceros!');
  };

  const handleAnticipoGlobalATodos = async () => {
    if (ordenesGlobales.length === 0) {
      window.alert('ℹ️ No hay alumnos registrados.');
      return;
    }

    const inputMonto = window.prompt('Ingresa el monto del anticipo global ($ MXN):', '500');
    if (inputMonto === null) return;

    const montoAnticipo = parseFloat(inputMonto);
    if (isNaN(montoAnticipo) || montoAnticipo <= 0 || montoAnticipo > precioUnitario) {
      window.alert('❌ Monto inválido.');
      return;
    }

    const fechaActual = new Date().toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const nuevasOrdenes = ordenesGlobales.map((o) => {
      const nuevoRegistroAbono: AbonoRegistro = {
        id: `${Date.now()}-${Math.random()}`,
        fecha: `${fechaActual} [ANTICIPO GLOBAL]`,
        monto: montoAnticipo,
      };

      return {
        ...o,
        aportacion_actual: montoAnticipo,
        historial_abonos: [nuevoRegistroAbono, ...(o.historial_abonos || [])],
      };
    });

    setOrdenesGlobales(nuevasOrdenes);

    for (const o of nuevasOrdenes) {
      await supabase.from('ordenes').update({ aportacion_actual: montoAnticipo }).eq('id', o.id);
      await supabase.from('historial_abonos').insert([
        {
          orden_id: o.id,
          fecha: `${fechaActual} [ANTICIPO GLOBAL]`,
          monto: montoAnticipo,
        },
      ]);
    }

    window.alert('✅ ¡Anticipo global aplicado!');
  };

  const ordenesFinanzas: OrdenFinanzas[] = ordenesGlobales.map((o) => {
    const saldo = precioUnitario - o.aportacion_actual;
    return {
      id: o.id,
      sku: o.sku,
      nombre_completo: o.nombre_completo,
      talla: o.talla,
      aportacion_actual: o.aportacion_actual,
      saldo_pendiente: saldo,
      estatus_financiero: saldo <= 0 ? 'LIQUIDADO' : 'PENDIENTE PARCIAL',
      historial_abonos: o.historial_abonos || [],
    };
  });

  const estatusAutomatico = useMemo(() => {
    const valorTotal = ordenesGlobales.length * precioUnitario;
    const totalRecaudado = ordenesFinanzas.reduce((acc, curr) => acc + curr.aportacion_actual, 0);
    const porcentaje = valorTotal > 0 ? (totalRecaudado / valorTotal) * 100 : 0;
    return porcentaje >= 60 ? '🟢 EN PRODUCCIÓN (ANTICIPO CUBIERTO)' : '🔴 ESPERANDO FONDOS (PENDIENTE 60%)';
  }, [ordenesGlobales.length, precioUnitario, ordenesFinanzas]);

  const proyectoFinanzasInfo: ProyectoFinanzasInfo = {
    ...proyectoBase,
    estatus_produccion_general: estatusAutomatico,
  };

  const proyectoInfo: ProyectoInfo = {
    id: proyectoBase.id || 'proj-1',
    nombre_proyecto: proyectoBase.escuela_generacion,
    clave_prefijo: proyectoBase.clave_proyecto,
    coordinador: proyectoBase.coordinador,
    modelo_prenda: proyectoBase.modelo_prenda,
    tecnica_personalizacion: proyectoBase.tecnica_personalizacion,
  };

  const handleNuevaOrden = (nuevaOrden: { id: string; sku: string; nombre_completo: string; apodo_vinil: string; talla: any }) => {
    const itemGlobal: OrdenGlobal = {
      id: nuevaOrden.id,
      sku: nuevaOrden.sku,
      nombre_completo: nuevaOrden.nombre_completo,
      talla: nuevaOrden.talla,
      apodo_vinil: nuevaOrden.apodo_vinil,
      estatus_produccion: 'Pendiente',
      aportacion_actual: 0,
      historial_abonos: [],
    };
    setOrdenesGlobales((prev) => [itemGlobal, ...prev]);
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-[#CEE4EF] flex items-center justify-center font-mono font-black text-[#020D22] text-xl">
        🔄 CARGANDO PANEL ADMINISTRATIVO...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#CEE4EF] text-[#020D22] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-[#020D22] text-white border-[3px] border-[#020D22] p-6 shadow-[8px_8px_0px_#CEE4EF] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#CEE4EF]">
              ALBA CUSTOM // PANEL DE ADMINISTRACIÓN
            </span>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mt-1">
              CONTROL INDUSTRIAL
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-2 font-mono text-xs">
            <button
              onClick={() => setActiveTab('config')}
              className={`px-3 py-2.5 font-black border-2 border-[#CEE4EF] transition-all ${
                activeTab === 'config' ? 'bg-[#CEE4EF] text-[#020D22]' : 'bg-[#020D22] text-white'
              }`}
            >
              00. CONFIG
            </button>
            <button
              onClick={() => setActiveTab('intake')}
              className={`px-3 py-2.5 font-black border-2 border-[#CEE4EF] transition-all ${
                activeTab === 'intake' ? 'bg-[#CEE4EF] text-[#020D22]' : 'bg-[#020D22] text-white'
              }`}
            >
              01. INTAKE
            </button>
            <button
              onClick={() => setActiveTab('produccion')}
              className={`px-3 py-2.5 font-black border-2 border-[#CEE4EF] transition-all ${
                activeTab === 'produccion' ? 'bg-[#CEE4EF] text-[#020D22]' : 'bg-[#020D22] text-white'
              }`}
            >
              02. PRODUCCIÓN ({ordenesGlobales.length} PZAS)
            </button>
            <button
              onClick={() => setActiveTab('finanzas')}
              className={`px-3 py-2.5 font-black border-2 border-[#CEE4EF] transition-all ${
                activeTab === 'finanzas' ? 'bg-[#CEE4EF] text-[#020D22]' : 'bg-[#020D22] text-white'
              }`}
            >
              03. FINANZAS
            </button>
          </div>
        </header>

        <section className="transition-all">
          {activeTab === 'config' && (
            <div className="space-y-6">
              <ProyectoConfig
                proyecto={proyectoFinanzasInfo}
                precioUnitario={precioUnitario}
                onUpdateProyecto={handleUpdateProyecto}
                onUpdatePrecio={handleUpdatePrecio}
              />
            </div>
          )}

          {activeTab === 'intake' && (
            <IntakeForm 
              proyectoId={proyectoBase.id} 
              clavePrefijo={proyectoBase.clave_proyecto} 
              requierePersonalizacion={requierePersonalizacion}
              onRegistroExitoso={handleNuevaOrden} 
            />
          )}

          {activeTab === 'produccion' && (
            <ProduccionDashboard 
              proyecto={proyectoInfo} 
              initialOrdenes={ordenesGlobales.map((o) => ({
                ...o,
                saldo_pendiente: precioUnitario - o.aportacion_actual,
              }))} 
              requierePersonalizacion={requierePersonalizacion}
              onUpdateEstatus={handleUpdateEstatusProduccion}
              onEliminarOrdenes={handleEliminarOrdenes}
            />
          )}

          {activeTab === 'finanzas' && (
            <Finanzas 
              proyecto={proyectoFinanzasInfo} 
              precioUnitario={precioUnitario} 
              ordenes={ordenesFinanzas} 
              onActualizarAportacion={handleActualizarAportacion}
              onResetFinanzas={handleResetFinanzas}
              onAnticipoGlobal={handleAnticipoGlobalATodos}
            />
          )}
        </section>
      </div>
    </main>
  );
}