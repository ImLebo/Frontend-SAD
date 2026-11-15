import React, { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Camera,
  Layers,
  Wrench,
  ShieldCheck,
  CheckSquare,
  Square,
  Plus,
  Save,
  Loader2,
  Calendar,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { sacService } from '../../services/sacService';
import { SeguimientoObra } from '../../types/sac.types';

interface Props {
  idSolicitud: number;
  codigoSolicitud: string;
  onRefresh?: () => void;
}

const HITOS_DEFAULT = [
  'Preparación del terreno',
  'Cimentación / placa',
  'Instalación de estructura prefabricada',
  'Cubierta',
  'Instalaciones eléctricas',
  'Instalaciones hidráulicas y sanitarias',
  'Instalación de cocina',
  'Instalación de baño',
  'Instalación de lavadero',
  'Instalación de ventana',
  'Acabados',
  'Limpieza y adecuación final',
  'Entrega de vivienda'
];

const DOTACION_DEFAULT = {
  cocina: [
    'Mesón de cocina',
    'Lavaplatos',
    'Grifería',
    'Mueble inferior',
    'Salpicadero cocina',
    'Estufa'
  ],
  bano: [
    'Sanitario',
    'Lavamanos',
    'Grifería lavamanos',
    'Ducha',
    'Porta papel',
    'Toallero',
    'Jabonera',
    'Enchapado ducha',
    'Puerta baño'
  ],
  lavanderia: [
    'Lavadero',
    'Grifería',
    'Punto hidráulico para lavadora',
    'Desagüe para lavadora'
  ],
  acabados: [
    'Vidrios de ventanas',
    'Pisos',
    'Guardaescobas',
    'Pintura',
    'Cielo raso'
  ],
  exteriores: [
    'Canaletas aguas lluvias',
    'Bajantes',
    'Andén/acceso',
    'Escaleras'
  ],
  instalacion_electrica: [
    'Tablero eléctrico',
    'Breakers',
    'Tomas eléctricas',
    'Interruptores',
    'Luminarias',
    'Punto para nevera',
    'Punto para estufa',
    'Puesta a tierra',
    'Red de agua potable',
    'Red sanitaria',
    'Registros hidráulicos',
    'Sifones',
    'Cajas de inspección'
  ],
  saneamiento: [
    'Pozo séptico',
    'Trampa de grasas',
    'Sistema de infiltración'
  ]
};

export const SeguimientoObraSection: React.FC<Props> = ({
  idSolicitud,
  codigoSolicitud,
  onRefresh
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [obraActiva, setObraActiva] = useState<SeguimientoObra | null>(null);

  // Estados locales editables de la Obra
  const [estadoObra, setEstadoObra] = useState<'EN_PLANIFICACION' | 'EN_EJECUCION' | 'TERMINADA' | 'SUSPENDIDA'>('EN_EJECUCION');
  const [responsableObra, setResponsableObra] = useState('Ing. Residente Municipal');
  const [cargoResponsable, setCargoResponsable] = useState('Secretaría de Infraestructura y Obras');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaEntregaEstimada, setFechaEntregaEstimada] = useState('');
  const [observacionesGenerales, setObservacionesGenerales] = useState('');

  // 1. Registro Fotográfico y Documental Inicial
  const [registroInicial, setRegistroInicial] = useState({
    fotos_estado_actual: true,
    foto_lote: true,
    foto_contador: true,
    foto_factura_energia: true,
    foto_electrica: true,
    foto_pozo_septico: true
  });

  // 2. Revisión de Planos
  const [revisionPlanos, setRevisionPlanos] = useState({
    verificacion_lote: true,
    levantamiento_info: true,
    plano_arquitectonico: true,
    plano_hidraulico: true,
    plano_sanitario: true,
    plano_electrico: true,
    plano_pozo_septico: true,
    notas_planos: 'Planos tipología estándar municipal aprobados por Curaduría / Planeación'
  });

  // 3. Hitos de Obra
  const [hitos, setHitos] = useState<Array<{ hito: string; estado: 'Pendiente' | 'En proceso' | 'Completado' | 'No aplica'; fecha?: string; observacion?: string }>>(
    HITOS_DEFAULT.map((h, i) => ({
      hito: h,
      estado: i < 3 ? 'Completado' : i === 3 ? 'En proceso' : 'Pendiente',
      fecha: i < 3 ? '2026-10-15' : undefined,
      observacion: ''
    }))
  );

  // 4. Dotación y Componentes
  const [dotacion, setDotacion] = useState<Record<string, Record<string, boolean>>>({
    cocina: { 'Mesón de cocina': true, 'Lavaplatos': true, 'Grifería': true, 'Mueble inferior': true, 'Salpicadero cocina': true, 'Estufa': true },
    bano: { 'Sanitario': true, 'Lavamanos': true, 'Grifería lavamanos': true, 'Ducha': true, 'Porta papel': true, 'Toallero': true, 'Jabonera': true, 'Enchapado ducha': true, 'Puerta baño': true },
    lavanderia: { 'Lavadero': true, 'Grifería': true, 'Punto hidráulico para lavadora': true, 'Desagüe para lavadora': true },
    acabados: { 'Vidrios de ventanas': true, 'Pisos': true, 'Guardaescobas': true, 'Pintura': true, 'Cielo raso': true },
    exteriores: { 'Canaletas aguas lluvias': true, 'Bajantes': true, 'Andén/acceso': true, 'Escaleras': false },
    instalacion_electrica: { 'Tablero eléctrico': true, 'Breakers': true, 'Tomas eléctricas': true, 'Interruptores': true, 'Luminarias': true, 'Punto para nevera': true, 'Punto para estufa': true, 'Puesta a tierra': true, 'Red de agua potable': true, 'Red sanitaria': true, 'Registros hidráulicos': true, 'Sifones': true, 'Cajas de inspección': true },
    saneamiento: { 'Pozo séptico': true, 'Trampa de grasas': true, 'Sistema de infiltración': true }
  });

  // 5. Otros / Certificaciones
  const [certificaciones, setCertificaciones] = useState({
    autorizacion_habeas_data: true,
    certificado_retie: true,
    asociado_chec: true,
    asociado_corpocaldas: true,
    observaciones: 'Cumple RETIE y lineamientos ambientales de Corpocaldas.'
  });

  // 6. Registro de Cierre
  const [registroCierre, setRegistroCierre] = useState({
    foto_vivienda_terminada: '',
    foto_placa_instalada: '',
    acta_entrega_url: '',
    fecha_terminacion: '',
    estado_final: 'Culminada a satisfacción',
    observaciones_finales: ''
  });

  // Sub-pestaña interna para organizar las 6 secciones de Obra
  const [subTab, setSubTab] = useState<'hitos' | 'dotacion' | 'planos' | 'inicial' | 'cierre' | 'cert'>('hitos');

  useEffect(() => {
    cargarObra();
  }, [idSolicitud]);

  const cargarObra = async () => {
    setLoading(true);
    try {
      const data = await sacService.getSeguimientoObra(idSolicitud);
      if (data && data.length > 0) {
        const o = data[0];
        setObraActiva(o);
        setEstadoObra(o.estado_obra || 'EN_EJECUCION');
        setResponsableObra(o.responsable_obra || '');
        setCargoResponsable(o.cargo_responsable || '');
        setFechaInicio(o.fecha_inicio || '');
        setFechaEntregaEstimada(o.fecha_entrega_estimada || '');
        setObservacionesGenerales(o.observaciones_generales || '');

        if (o.registro_inicial_json && Object.keys(o.registro_inicial_json).length > 0) {
          setRegistroInicial(o.registro_inicial_json);
        }
        if (o.revision_planos_json && Object.keys(o.revision_planos_json).length > 0) {
          setRevisionPlanos(o.revision_planos_json);
        }
        if (o.hitos_obra_json && o.hitos_obra_json.length > 0) {
          setHitos(o.hitos_obra_json);
        }
        if (o.dotacion_componentes_json && Object.keys(o.dotacion_componentes_json).length > 0) {
          setDotacion(o.dotacion_componentes_json);
        }
        if (o.certificaciones_json && Object.keys(o.certificaciones_json).length > 0) {
          setCertificaciones(o.certificaciones_json);
        }
        if (o.registro_cierre_json && Object.keys(o.registro_cierre_json).length > 0) {
          setRegistroCierre(o.registro_cierre_json);
        }
      }
    } catch (err) {
      console.error('Error cargando seguimiento de obra', err);
    } finally {
      setLoading(false);
    }
  };

  // Cálculo automático del porcentaje de avance
  const hitosCompletados = hitos.filter(h => h.estado === 'Completado').length;
  const porcentajeCalculado = Math.round((hitosCompletados / hitos.length) * 100);

  const handleGuardar = async () => {
    if (!responsableObra.trim()) {
      alert('Ingresa el nombre del responsable de la obra.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        codigo_obra: obraActiva?.codigo_obra || `OBRA-${codigoSolicitud}`,
        estado_obra: estadoObra,
        porcentaje_avance: porcentajeCalculado,
        registro_inicial_json: registroInicial,
        revision_planos_json: revisionPlanos,
        hitos_obra_json: hitos,
        registro_cierre_json: registroCierre,
        certificaciones_json: certificaciones,
        dotacion_componentes_json: dotacion,
        responsable_obra: responsableObra.trim(),
        cargo_responsable: cargoResponsable.trim(),
        observaciones_generales: observacionesGenerales,
        fecha_inicio: fechaInicio || undefined,
        fecha_entrega_estimada: fechaEntregaEstimada || undefined
      };

      await sacService.guardarSeguimientoObra(idSolicitud, payload);
      alert('¡Seguimiento de obra y dotación guardados exitosamente!');
      await cargarObra();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al guardar obra');
    } finally {
      setSaving(false);
    }
  };

  const toggleDotacionItem = (categoria: string, item: string) => {
    setDotacion(prev => ({
      ...prev,
      [categoria]: {
        ...(prev[categoria] || {}),
        [item]: !(prev[categoria]?.[item])
      }
    }));
  };

  return (
    <div className="space-y-4">
      {/* Banner Principal de la Obra y Progreso */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black bg-slate-900 text-white px-2.5 py-0.5 rounded-lg">
                  {obraActiva?.codigo_obra || `OBRA-${codigoSolicitud}`}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  estadoObra === 'TERMINADA'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : estadoObra === 'EN_EJECUCION'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {estadoObra}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-950 mt-0.5">
                Seguimiento Oficial de Obra, Reconstrucción y Dotación
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGuardar}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{saving ? 'Guardando...' : 'Guardar Avances de Obra'}</span>
            </button>
          </div>
        </div>

        {/* Barra de Progreso Constructivo */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Avance de Ejecución Física:</span>
            </span>
            <span className="text-base font-black text-blue-700 font-mono">
              {porcentajeCalculado}% ({hitosCompletados} de {hitos.length} hitos completados)
            </span>
          </div>
          <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${porcentajeCalculado}%` }}
            />
          </div>
        </div>

        {/* Campos Generales de la Obra */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estado de la Obra</label>
            <select
              value={estadoObra}
              onChange={(e) => setEstadoObra(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
            >
              <option value="EN_PLANIFICACION">En Planificación / Planos</option>
              <option value="EN_EJECUCION">En Ejecución Constructiva</option>
              <option value="TERMINADA">Terminada / Entregada</option>
              <option value="SUSPENDIDA">Suspendida Temporalmente</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Responsable de Obra</label>
            <input
              type="text"
              value={responsableObra}
              onChange={(e) => setResponsableObra(e.target.value)}
              placeholder="Ej. Ing. Juan Morales"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha de Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha Estimada Entrega</label>
            <input
              type="date"
              value={fechaEntregaEstimada}
              onChange={(e) => setFechaEntregaEstimada(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Sub-navegador de las 6 secciones oficiales del documento OBRA */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        {[
          { id: 'hitos', label: '3. Hitos de Obra (13 etapas)', icon: Wrench },
          { id: 'dotacion', label: '6. Componentes y Dotación', icon: Layers },
          { id: 'planos', label: '2. Revisión de Planos', icon: FileText },
          { id: 'inicial', label: '1. Registro Inicial', icon: Camera },
          { id: 'cert', label: '5. RETIE y Normativa', icon: ShieldCheck },
          { id: 'cierre', label: '4. Cierre y Acta de Entrega', icon: CheckCircle2 }
        ].map((st) => {
          const Icon = st.icon;
          const isAct = subTab === st.id;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => setSubTab(st.id as any)}
              className={`px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isAct
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{st.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB: 3. HITOS DE OBRA */}
      {subTab === 'hitos' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-blue-600" />
                <span>3. Cronograma de Hitos y Etapas Constructivas</span>
              </h4>
              <p className="text-xs text-slate-500">
                Marca el estado de cada una de las 13 etapas oficiales de la obra.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {hitos.map((h, idx) => (
              <div key={h.hito} className="py-2.5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center font-bold text-slate-400 font-mono">{idx + 1}</span>
                  <span className="font-bold text-slate-800 text-xs">{h.hito}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={h.estado}
                    onChange={(e) => {
                      const updated = [...hitos];
                      updated[idx].estado = e.target.value as any;
                      setHitos(updated);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      h.estado === 'Completado'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : h.estado === 'En proceso'
                        ? 'bg-blue-50 text-blue-800 border-blue-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En proceso">En proceso</option>
                    <option value="Completado">Completado</option>
                    <option value="No aplica">No aplica</option>
                  </select>

                  <input
                    type="date"
                    value={h.fecha || ''}
                    onChange={(e) => {
                      const updated = [...hitos];
                      updated[idx].fecha = e.target.value;
                      setHitos(updated);
                    }}
                    className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[11px]"
                  />

                  <input
                    type="text"
                    value={h.observacion || ''}
                    onChange={(e) => {
                      const updated = [...hitos];
                      updated[idx].observacion = e.target.value;
                      setHitos(updated);
                    }}
                    placeholder="Observación..."
                    className="w-40 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[11px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB: 6. COMPONENTES Y DOTACIÓN DE LA VIVIENDA */}
      {subTab === 'dotacion' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              <span>6. Componentes y Dotación Instalada de la Vivienda</span>
            </h4>
            <p className="text-xs text-slate-500">
              Verifica y marca cada uno de los elementos entregados en el predio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(DOTACION_DEFAULT).map(([catKey, items]) => {
              const catTitle =
                catKey === 'cocina' ? 'Cocina' :
                catKey === 'bano' ? 'Baño' :
                catKey === 'lavanderia' ? 'Lavandería' :
                catKey === 'acabados' ? 'Acabados' :
                catKey === 'exteriores' ? 'Exteriores' :
                catKey === 'instalacion_electrica' ? 'Instalación Eléctrica e Hidráulica' :
                'Saneamiento y Pozo';

              return (
                <div key={catKey} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-800 block border-b border-slate-200 pb-1">
                    {catTitle} ({items.length} ítems)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {items.map((it) => {
                      const isChecked = !!dotacion[catKey]?.[it];
                      return (
                        <button
                          key={it}
                          type="button"
                          onClick={() => toggleDotacionItem(catKey, it)}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-left transition cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate text-[11px]">{it}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB: 2. REVISIÓN DE PLANOS */}
      {subTab === 'planos' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span>2. Revisión y Aprobación de Planos Técnicos</span>
            </h4>
            <p className="text-xs text-slate-500">
              Verificación de documentación técnica previa para ejecución de la obra.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              { key: 'verificacion_lote', label: 'Verificación del lote y linderos' },
              { key: 'levantamiento_info', label: 'Levantamiento de información en campo' },
              { key: 'plano_arquitectonico', label: 'Plano arquitectónico de la vivienda' },
              { key: 'plano_hidraulico', label: 'Plano hidráulico (redes de suministro y puntos)' },
              { key: 'plano_sanitario', label: 'Plano sanitario (desagües y redes)' },
              { key: 'plano_electrico', label: 'Plano eléctrico (tomas, luminarias, tablero)' },
              { key: 'plano_pozo_septico', label: 'Plano y diseño del pozo séptico' },
            ].map((p) => (
              <label key={p.key} className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={(revisionPlanos as any)[p.key]}
                  onChange={(e) => setRevisionPlanos({ ...revisionPlanos, [p.key]: e.target.checked })}
                  className="h-4 w-4 rounded text-blue-600"
                />
                <span className="font-bold text-slate-800 text-xs">{p.label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notas de Revisión de Planos</label>
            <textarea
              rows={2}
              value={revisionPlanos.notas_planos}
              onChange={(e) => setRevisionPlanos({ ...revisionPlanos, notas_planos: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
            />
          </div>
        </div>
      )}

      {/* SUB-TAB: 1. REGISTRO INICIAL */}
      {subTab === 'inicial' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Camera className="h-4 w-4 text-blue-600" />
              <span>1. Registro Fotográfico y Documental Inicial</span>
            </h4>
            <p className="text-xs text-slate-500">
              Documentación del estado previo a la apertura de la obra.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              { key: 'fotos_estado_actual', label: 'Fotografías del estado actual de la vivienda' },
              { key: 'foto_lote', label: 'Fotografía del lote y entorno' },
              { key: 'foto_contador', label: 'Fotografía del contador eléctrico' },
              { key: 'foto_factura_energia', label: 'Fotografía de la factura de energía (CHEC)' },
              { key: 'foto_electrica', label: 'Fotografía de la parte eléctrica existente' },
              { key: 'foto_pozo_septico', label: 'Fotografía del pozo séptico o disposición actual' },
            ].map((f) => (
              <label key={f.key} className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={(registroInicial as any)[f.key]}
                  onChange={(e) => setRegistroInicial({ ...registroInicial, [f.key]: e.target.checked })}
                  className="h-4 w-4 rounded text-blue-600"
                />
                <span className="font-bold text-slate-800 text-xs">{f.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB: 5. CERTIFICACIONES Y RETIE */}
      {subTab === 'cert' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>5. Otros Requisitos, Normativa y Certificaciones</span>
            </h4>
            <p className="text-xs text-slate-500">
              Validación de requisitos normativos y articulación institucional.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              { key: 'autorizacion_habeas_data', label: 'Autorización firmada de Hábeas Data' },
              { key: 'certificado_retie', label: 'Certificado RETIE (Reglamento Técnico de Instalaciones Eléctricas)' },
              { key: 'asociado_chec', label: 'Articulación y trámite con CHEC (Energía)' },
              { key: 'asociado_corpocaldas', label: 'Lineamientos ambientales y permisos CORPOCALDAS' },
            ].map((c) => (
              <label key={c.key} className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={(certificaciones as any)[c.key]}
                  onChange={(e) => setCertificaciones({ ...certificaciones, [c.key]: e.target.checked })}
                  className="h-4 w-4 rounded text-blue-600"
                />
                <span className="font-bold text-slate-800 text-xs">{c.label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Observaciones de Certificación</label>
            <input
              type="text"
              value={certificaciones.observaciones}
              onChange={(e) => setCertificaciones({ ...certificaciones, observaciones: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
            />
          </div>
        </div>
      )}

      {/* SUB-TAB: 4. CIERRE Y ACTA DE ENTREGA */}
      {subTab === 'cierre' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>4. Registro Fotográfico del Proceso, Cierre y Acta de Entrega</span>
            </h4>
            <p className="text-xs text-slate-500">
              Protocolo de culminación oficial y entrega formal de la vivienda al beneficiario.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Estado Final de la Vivienda</label>
              <select
                value={registroCierre.estado_final}
                onChange={(e) => setRegistroCierre({ ...registroCierre, estado_final: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              >
                <option value="Culminada a satisfacción">Culminada a satisfacción (Recibida por beneficiario)</option>
                <option value="Con observaciones menores">Con observaciones menores (Subsanables)</option>
                <option value="En proceso de acabados">En proceso de acabados finales</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha de Terminación y Entrega</label>
              <input
                type="date"
                value={registroCierre.fecha_terminacion}
                onChange={(e) => setRegistroCierre({ ...registroCierre, fecha_terminacion: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Observaciones Finales en Acta de Entrega</label>
            <textarea
              rows={3}
              value={registroCierre.observaciones_finales}
              onChange={(e) => setRegistroCierre({ ...registroCierre, observaciones_finales: e.target.value })}
              placeholder="Constancia de entrega formal de llaves, verificación de dotación, redes hidrosanitarias y eléctricas en funcionamiento..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
};
