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

export default function Home() {
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

  // Cargar datos iniciales desde Supabase al montar el componente
  useEffect(() => {
    cargarDatosSupabase();
  }, []);

  const cargarDatosSupabase = async () => {
    setLoadingData(true);
    try {
      // 1. Cargar o inicializar proyecto
      let { data: proyectosData, error: projError } = await supabase.from('proyectos').select('*').limit(1);

      let proyectoActualId = '';

      if (proyectosData && proyectosData.length > 0) {
        const p = proyectosData[0];
        proyectoActualId = p.id;
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
        // Si no existe proyecto, creamos uno por defecto
        const { data: nuevoProj, error: insProjError } = await supabase
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
          proyectoActualId = nuevoProj.id;
          setProyectoBase((prev) => ({ ...prev, id: nuevoProj.id }));
        }
      }

      // 2. Cargar órdenes y sus respectivos abonos
      const { data: ordenesData, error: ordError } = await supabase
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

  // Sincronizar actualización de metadatos del proyecto
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

  // Sincronizar actualización de precio unitario
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

    // Actualizar en base de datos
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

  // Reseteo financiero seguro con doble barrera y persistencia en Supabase
  const handleResetFinanzas = async () => {
    const confirmar1 = window.confirm(
      '⚠️ ZONA DE ALTO RIESGO // REINICIO FINANCIERO:\n\nEstás a punto de poner en $0.00 las aportaciones y bitácoras de TODOS los alumnos en la nube.\n\n¿Estás completamente seguro?'
    );
    if (!confirmar1) return;

    const palabraSeguridad = window.prompt(
      '🔒 BARRERA DE SEGURIDAD INDUSTRIAL:\n\nPara confirmar esta acción destructiva, escribe exactamente la palabra: RESET'
    );

    if (palabraSeguridad === null) return;

    if (palabraSeguridad.trim().toUpperCase() !== 'RESET') {
      window.alert('❌ ACCIÓN CANCELADA: La palabra de seguridad es incorrecta.');
      return;
    }

    // Actualizar estado local
    setOrdenesGlobales((prev) =>
      prev.map((o) => ({
        ...o,
        aportacion_actual: 0,
        historial_abonos: [],
      }))
    );

    // Actualizar base de datos en nube
    for (const o of ordenesGlobales) {
      await supabase.from('ordenes').update({ aportacion_actual: 0 }).eq('id', o.id);
      await supabase.from('historial_abonos').delete().eq('orden_id', o.id);
    }

    window.alert('🧹 ¡Cuentas financieras reiniciadas a ceros en Supabase!');
  };

  const handleAnticipoGlobalATodos = async () => {
    if (ordenesGlobales.length === 0) {
      window.alert('ℹ️ No hay ningún alumno registrado en el sistema.');
      return;
    }

    const inputMonto = window.prompt(
      `⚡ APLICAR ANTICIPO GLOBAL A TODOS\n\nHay ${ordenesGlobales.length} alumno(s) registrados.\nIngresa el monto del anticipo obligatorio ($ MXN):`,
      '500'
    );

    if (inputMonto === null) return;

    const montoAnticipo = parseFloat(inputMonto);
    if (isNaN(montoAnticipo) || montoAnticipo <= 0) {
      window.alert('❌ Ingresa una cantidad válida mayor a 0.');
      return;
    }

    if (montoAnticipo > precioUnitario) {
      window.alert(`❌ El anticipo no puede ser mayor al precio unitario ($${precioUnitario}).`);
      return;
    }

    const confirmar = window.confirm(
      `⚠️ ¿Aplicar anticipo global de $${montoAnticipo.toFixed(2)} a LOS ${ordenesGlobales.length} ALUMNOS en Supabase?`
    );

    if (!confirmar) return;

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

    // Persistir en Supabase
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

    window.alert(`✅ ¡Anticipo global aplicado a los ${ordenesGlobales.length} alumnos en la nube!`);
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

    if (porcentaje >= 60) {
      return '🟢 EN PRODUCCIÓN (ANTICIPO CUBIERTO)';
    }
    return '🔴 ESPERANDO FONDOS (PENDIENTE 60%)';
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
      aportacion_actual: 0, // Arranca limpio en 0
      historial_abonos: [], // Sin abonos automáticos
    };

    setOrdenesGlobales((prev) => [itemGlobal, ...prev]);
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-[#CEE4EF] flex items-center justify-center font-mono font-black text-[#020D22] text-xl">
        🔄 CONECTANDO CON SUPABASE...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#CEE4EF] text-[#020D22] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Cabecera Principal del Sistema */}
        <header className="bg-[#020D22] text-white border-[3px] border-[#020D22] p-6 shadow-[8px_8px_0px_#CEE4EF] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#CEE4EF]">
              ALBA CUSTOM // MICRO-ERP INDUSTRIAL (CLOUD SUPABASE)
            </span>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mt-1">
              SISTEMA DE PRODUCCIÓN
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-2 font-mono text-xs">
            <button
              onClick={() => setActiveTab('config')}
              className={`px-3 py-2.5 font-black border-2 border-[#CEE4EF] transition-all ${
                activeTab === 'config'
                  ? 'bg-[#CEE4EF] text-[#020D22] shadow-[2px_2px_0px_#ffffff]'
                  : 'bg-[#020D22] text-white hover:bg-[#CEE4EF] hover:text-[#020D22]'
              }`}
            >
              00. CONFIG
            </button>
            <button
              onClick={() => setActiveTab('intake')}
              className={`px-3 py-2.5 font-black border-2 border-[#CEE4EF] transition-all ${
                activeTab === 'intake'
                  ? 'bg-[#CEE4EF] text-[#020D22] shadow-[2px_2px_0px_#ffffff]'
                  : 'bg-[#020D22] text-white hover:bg-[#CEE4EF] hover:text-[#020D22]'
              }`}
            >
              01. INTAKE
            </button>
            <button
              onClick={() => setActiveTab('produccion')}
              className={`px-3 py-2.5 font-black border-2 border-[#CEE4EF] transition-all ${
                activeTab === 'produccion'
                  ? 'bg-[#CEE4EF] text-[#020D22] shadow-[2px_2px_0px_#ffffff]'
                  : 'bg-[#020D22] text-white hover:bg-[#CEE4EF] hover:text-[#020D22]'
              }`}
            >
              02. PRODUCCIÓN ({ordenesGlobales.length} PZAS)
            </button>
            <button
              onClick={() => setActiveTab('finanzas')}
              className={`px-3 py-2.5 font-black border-2 border-[#CEE4EF] transition-all ${
                activeTab === 'finanzas'
                  ? 'bg-[#CEE4EF] text-[#020D22] shadow-[2px_2px_0px_#ffffff]'
                  : 'bg-[#020D22] text-white hover:bg-[#CEE4EF] hover:text-[#020D22]'
              }`}
            >
              03. FINANZAS
            </button>
          </div>
        </header>

        {/* Sección de Contenido Activo */}
        <section className="transition-all">
          {activeTab === 'config' && (
            <div className="space-y-6">
              <ProyectoConfig
                proyecto={proyectoFinanzasInfo}
                precioUnitario={precioUnitario}
                onUpdateProyecto={handleUpdateProyecto}
                onUpdatePrecio={handleUpdatePrecio}
              />

              <div className="bg-white border-[3px] border-[#020D22] p-6 shadow-[6px_6px_0px_#020D22] max-w-3xl mx-auto">
                <label className="flex items-center space-x-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requierePersonalizacion}
                    onChange={(e) => setRequierePersonalizacion(e.target.checked)}
                    className="w-6 h-6 border-[3px] border-[#020D22] accent-[#020D22] cursor-pointer"
                  />
                  <div>
                    <span className="block text-xs font-black uppercase text-[#020D22] font-mono">
                      PERSONALIZACIÓN DE APODO / TEXTO EN VINIL
                    </span>
                    <span className="text-xs text-gray-600 font-bold font-mono">
                      Activa esta casilla si las prendas llevarán nombres o apodos individuales impresos.
                    </span>
                  </div>
                </label>
              </div>
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