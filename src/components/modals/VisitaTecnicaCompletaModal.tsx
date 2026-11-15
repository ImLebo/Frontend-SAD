import React, { useState } from 'react';
import {
  X,
  ClipboardCheck,
  Home,
  AlertTriangle,
  Compass,
  CheckCircle2,
  Droplets,
  Zap,
  Camera,
  Layers,
  ChevronRight,
  ChevronLeft,
  Loader2,
  FileCheck2,
  Activity
} from 'lucide-react';
import { VisitaTecnica, ElementoEvaluadoVisual, CondicionTerreno, ServicioSaneamiento } from '../../types/sac.types';

interface Props {
  idSolicitud: number;
  initialData?: any;
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
  saving: boolean;
}

const ELEMENTOS_DEFAULT = [
  'Cimentación',
  'Muros / cerramientos',
  'Columnas',
  'Vigas',
  'Cubierta',
  'Pisos / placas',
  'Puertas y ventanas',
  'Instalación eléctrica',
  'Red hidráulica',
  'Red sanitaria / saneamiento',
  'Elementos no estructurales'
];

const CONDICIONES_TERRENO_DEFAULT = [
  'Grietas en el terreno',
  'Asentamientos / hundimientos',
  'Deslizamiento o movimiento de masa',
  'Talud inestable',
  'Caída potencial de rocas',
  'Árboles o postes en riesgo',
  'Afectación por quebradas / drenajes',
  'Erosión / socavación',
  'Cambios visibles del terreno por el sismo',
  'Condición que impida reconstruir en el mismo sitio'
];

const SERVICIOS_DEFAULT = [
  { servicio: 'Agua para consumo', estado: 'Acueducto vereda', aplica: 'Sí' as const },
  { servicio: 'Energía eléctrica', estado: 'Con acceso a red eléctrica', aplica: 'Sí' as const },
  { servicio: 'Alcantarillado / sistema sanitario', estado: 'Sin red de alcantarillado', aplica: 'No' as const },
  { servicio: 'Pozo séptico', estado: 'No cuenta con sistema séptico', aplica: 'No' as const },
  { servicio: 'Manejo de aguas lluvias', estado: 'Sin manejo adecuado', aplica: 'No' as const }
];

export const VisitaTecnicaCompletaModal: React.FC<Props> = ({
  idSolicitud,
  initialData,
  onClose,
  onSave,
  saving
}) => {
  const [activeSection, setActiveSection] = useState<number>(1);

  // Form State
  const [profesionalResponsable, setProfesionalResponsable] = useState(
    initialData?.profesional_responsable || 'Sarah Gutierrez'
  );
  const [cargoResponsable, setCargoResponsable] = useState(
    initialData?.cargo_responsable || 'Obras Públicas e Infraestructura'
  );
  const [horaVisita, setHoraVisita] = useState('16:12:00');
  const [accesoVivienda, setAccesoVivienda] = useState('Carretera');
  const [tiempoAcceso, setTiempoAcceso] = useState('20 minutos');
  const [condicionesAcceso, setCondicionesAcceso] = useState('Buenas condiciones');

  // Sección 2: Hogar y Situación
  const [numFamilias, setNumFamilias] = useState(1);
  const [numPersonas, setNumPersonas] = useState(2);
  const [numNinos, setNumNinos] = useState(0);
  const [numAdultosMayores, setNumAdultosMayores] = useState(0);
  const [numDiscapacidad, setNumDiscapacidad] = useState(0);
  const [permaneceEnVivienda, setPermaneceEnVivienda] = useState(true);
  const [lugarAlojamientoActual, setLugarAlojamientoActual] = useState('En la vivienda');
  const [soporteTenencia, setSoporteTenencia] = useState('Escritura');
  const [tieneOtraVivienda, setTieneOtraVivienda] = useState(false);
  const [necesidadInmediata, setNecesidadInmediata] = useState('Reconstrucción menor');
  const [cuentaRedApoyo, setCuentaRedApoyo] = useState(false);

  // Sección 3: Caracterización Previa
  const [tipologiaVivienda, setTipologiaVivienda] = useState('Unifamiliar');
  const [numeroPisos, setNumeroPisos] = useState(1);
  const [areaM2, setAreaM2] = useState<number>(120);
  const [numeroHabitaciones, setNumeroHabitaciones] = useState(4);
  const [materialMuros, setMaterialMuros] = useState('Material / Mampostería');
  const [tipoCubierta, setTipoCubierta] = useState('Teja arquitectónica');
  const [tipoPiso, setTipoPiso] = useState('Cerámica');
  const [antiguedadAnos, setAntiguedadAnos] = useState('11 años');
  const [tieneAmpliaciones, setTieneAmpliaciones] = useState(false);
  const [descripcionPrevia, setDescripcionPrevia] = useState('Vivienda de un solo nivel');

  // Sección 4: Evaluación Visual de Daños (11 elementos)
  const [elementosEvaluados, setElementosEvaluados] = useState<ElementoEvaluadoVisual[]>(
    ELEMENTOS_DEFAULT.map((elem) => ({
      elemento: elem,
      nivel_dano: elem === 'Cimentación' || elem === 'Pisos / placas' ? 'Severo' : (elem === 'Muros / cerramientos' || elem === 'Cubierta' || elem === 'Puertas y ventanas' ? 'Colapso' : 'Sin daño'),
      riesgo_inmediato: elem.includes('Muros') || elem.includes('Cubierta') ? 'Sí' : 'No',
      observaciones: ''
    }))
  );

  // Sección 5: Terreno y Amenazas (10 condiciones)
  const [condicionesTerreno, setCondicionesTerreno] = useState<CondicionTerreno[]>(
    CONDICIONES_TERRENO_DEFAULT.map((cond) => ({
      condicion: cond,
      aplica: cond.includes('Grietas') || cond.includes('Cambios visibles') ? 'Sí' : 'No',
      nivel: cond.includes('Grietas') ? 'Leve' : undefined,
      observaciones: ''
    }))
  );

  // Sección 6: Servicios y Saneamiento
  const [serviciosSaneamiento, setServiciosSaneamiento] = useState<ServicioSaneamiento[]>(SERVICIOS_DEFAULT);

  // Sección 7: Habitabilidad e Intervención
  const [clasificacionHabitabilidad, setClasificacionHabitabilidad] = useState('No habitable');
  const [requiereRestriccionIngreso, setRequiereRestriccionIngreso] = useState(true);
  const [requiereEvaluacionEspecializada, setRequiereEvaluacionEspecializada] = useState('No aplica');
  const [intervencionRecomendada, setIntervencionRecomendada] = useState('Reconstrucción total');
  const [medidaUrgente, setMedidaUrgente] = useState('Reconstrucción total');
  const [prioridadAtencion, setPrioridadAtencion] = useState('Urgente');

  // Sección 8: Condiciones para Reconstrucción
  const [accesoMateriales, setAccesoMateriales] = useState(true);
  const [disponibilidadAgua, setDisponibilidadAgua] = useState(true);
  const [disponibilidadEnergia, setDisponibilidadEnergia] = useState(true);
  const [saneamientoViable, setSaneamientoViable] = useState(true);
  const [requiereMovimientoTierras, setRequiereMovimientoTierras] = useState(false);
  const [requiereMuroContencion, setRequiereMuroContencion] = useState(false);
  const [requiereManejoAguasLluvias, setRequiereManejoAguasLluvias] = useState(false);
  const [puedeApoyarManoObra, setPuedeApoyarManoObra] = useState(true);
  const [zonaMasSeguraPredio, setZonaMasSeguraPredio] = useState(false);

  // Sección 9: Checklist Fotográfico
  const [checklistFotos, setChecklistFotos] = useState({
    interior_vivienda: true,
    danos_estructurales: true,
    cubierta: true,
    terreno_grietas: true,
    taludes_amenazas: false,
    acceso_vivienda: true,
    servicios_saneamiento: false,
    panoramica_vivienda_entorno: true
  });

  // Sección 10: Concepto Técnico Preliminar
  const [dictamenGeneral, setDictamenGeneral] = useState('DESHABITABLE');
  const [requiereEvacuacion, setRequiereEvacuacion] = useState(true);
  const [requiereDemolicion, setRequiereDemolicion] = useState(false);
  const [costoEstimadoDanos, setCostoEstimadoDanos] = useState(45000000);
  const [principalesDanos, setPrincipalesDanos] = useState('Colapso de muros y cubierta, afectación severa de cimentación y pisos.');
  const [riesgosInmediatos, setRiesgosInmediatos] = useState('Riesgo de colapso de mampostería restante.');
  const [recomendacionOcupacion, setRecomendacionOcupacion] = useState('Desalojo preventivo inmediato.');
  const [estudiosAdicionales, setEstudiosAdicionales] = useState('Estudio de suelos y estabilidad de talud.');
  const [observacionesGenerales, setObservacionesGenerales] = useState('Vivienda ubicada en zona rural con fácil acceso vial.');

  const secciones = [
    { num: 1, label: '1. General y Acceso', icon: Compass },
    { num: 2, label: '2. Hogar y Situación', icon: Home },
    { num: 3, label: '3. Vivienda Previa', icon: Layers },
    { num: 4, label: '4. Evaluación Visual', icon: AlertTriangle },
    { num: 5, label: '5. Terreno y Amenazas', icon: Activity },
    { num: 6, label: '6. Servicios', icon: Droplets },
    { num: 7, label: '7. Habitabilidad', icon: FileCheck2 },
    { num: 8, label: '8. Reconstrucción', icon: CheckCircle2 },
    { num: 9, label: '9. Fotos Checklist', icon: Camera },
    { num: 10, label: '10. Concepto Técnico', icon: ClipboardCheck },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profesionalResponsable.trim()) {
      alert('Ingresa el nombre del profesional responsable.');
      setActiveSection(1);
      return;
    }

    const payload = {
      profesional_responsable: profesionalResponsable.trim(),
      cargo_responsable: cargoResponsable.trim(),
      dictamen_tecnico: dictamenGeneral,
      afectacion_muros: elementosEvaluados.find(e => e.elemento.includes('Muros'))?.nivel_dano || 'Parcial',
      afectacion_techos: elementosEvaluados.find(e => e.elemento.includes('Cubierta'))?.nivel_dano || 'Colapso',
      afectacion_pisos: elementosEvaluados.find(e => e.elemento.includes('Pisos'))?.nivel_dano || 'Severo',
      requiere_evacuacion: requiereEvacuacion,
      requiere_demolicion: requiereDemolicion,
      costo_estimado_danos: Number(costoEstimadoDanos) || 0,
      observaciones_tecnicas: observacionesGenerales,
      fotos_evidencia: [],
      hora_visita: horaVisita,
      acceso_vivienda: accesoVivienda,
      tiempo_acceso: tiempoAcceso,
      condiciones_acceso: condicionesAcceso,
      permanece_en_vivienda: permaneceEnVivienda,
      lugar_alojamiento_actual: lugarAlojamientoActual,
      soporte_tenencia: soporteTenencia,
      tiene_otra_vivienda: tieneOtraVivienda,
      necesidad_inmediata: necesidadInmediata,
      tipologia_vivienda: tipologiaVivienda,
      numero_pisos: Number(numeroPisos) || 1,
      area_aproximada_m2: Number(areaM2) || 0,
      numero_habitaciones: Number(numeroHabitaciones) || 1,
      material_predominante_muros: materialMuros,
      tipo_cubierta: tipoCubierta,
      tipo_piso: tipoPiso,
      antiguedad_anos: antiguedadAnos,
      tiene_ampliaciones: tieneAmpliaciones,
      descripcion_vivienda_previa: descripcionPrevia,
      evaluacion_elementos_json: elementosEvaluados,
      terreno_amenazas_json: condicionesTerreno,
      servicios_saneamiento_json: serviciosSaneamiento,
      concepto_habitabilidad_json: {
        clasificacion_habitabilidad: clasificacionHabitabilidad,
        requiere_restriccion_ingreso: requiereRestriccionIngreso,
        requiere_evaluacion_especializada: requiereEvaluacionEspecializada,
        intervencion_preliminar_recomendada: intervencionRecomendada,
        medida_urgente_recomendada: medidaUrgente,
        prioridad_atencion: prioridadAtencion
      },
      condiciones_reconstruccion_json: {
        acceso_materiales_maquinaria: accesoMateriales,
        disponibilidad_agua: disponibilidadAgua,
        disponibilidad_energia: disponibilidadEnergia,
        saneamiento_viable: saneamientoViable,
        requiere_movimiento_tierras: requiereMovimientoTierras,
        requiere_muro_contencion: requiereMuroContencion,
        requiere_manejo_aguas_lluvias: requiereManejoAguasLluvias,
        puede_apoyar_mano_obra: puedeApoyarManoObra,
        existe_zona_mas_segura_predio: zonaMasSeguraPredio
      },
      registro_fotografico_checklist_json: checklistFotos,
      concepto_tecnico_detallado_json: {
        principales_danos: principalesDanos,
        riesgos_inmediatos: riesgosInmediatos,
        recomendacion_ocupacion: recomendacionOcupacion,
        estudios_adicionales: estudiosAdicionales,
        observaciones_generales: observacionesGenerales
      }
    };

    await onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header Oficial UNGRD */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full">
                  Formato Oficial Post-Sismo / Desastres
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">SOL-{idSolicitud}</span>
              </div>
              <h3 className="text-base font-black text-slate-950">
                Ficha Técnica de Evaluación de Afectaciones en Terreno
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Barra de Navegación por Secciones (1 al 10) */}
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 overflow-x-auto flex items-center gap-1.5 scrollbar-thin">
          {secciones.map((sec) => {
            const Icon = sec.icon;
            const isCurrent = activeSection === sec.num;
            return (
              <button
                key={sec.num}
                type="button"
                onClick={() => setActiveSection(sec.num)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Formulario Dinámico */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs bg-slate-50/40">
          {/* SECCIÓN 1: DATOS GENERALES DE LA VISITA Y ACCESO */}
          {activeSection === 1 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Compass className="h-4 w-4 text-blue-600" />
                <span>1. Datos Generales de la Visita y Condiciones de Acceso</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Profesional / Funcionario Responsable *</label>
                  <input
                    type="text"
                    required
                    value={profesionalResponsable}
                    onChange={(e) => setProfesionalResponsable(e.target.value)}
                    placeholder="Ej. Sarah Gutierrez"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cargo / Dependencia</label>
                  <input
                    type="text"
                    value={cargoResponsable}
                    onChange={(e) => setCargoResponsable(e.target.value)}
                    placeholder="Ej. Obras Públicas en Infraestructura"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hora de la Visita</label>
                  <input
                    type="text"
                    value={horaVisita}
                    onChange={(e) => setHoraVisita(e.target.value)}
                    placeholder="Ej. 16:12:00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Acceso a la Vivienda</label>
                  <select
                    value={accesoVivienda}
                    onChange={(e) => setAccesoVivienda(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Carretera">Carretera / Vía vehicular</option>
                    <option value="Trocha">Trocha o vía destapada</option>
                    <option value="Camino de herradura">Camino de herradura / Peatonal</option>
                    <option value="Fluvial">Fluvial / Ribereño</option>
                    <option value="Vía Urbana">Vía Urbana Pavimentada</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tiempo Aproximado de Acceso</label>
                  <input
                    type="text"
                    value={tiempoAcceso}
                    onChange={(e) => setTiempoAcceso(e.target.value)}
                    placeholder="Ej. 20 minutos"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Condiciones Actuales de Acceso</label>
                  <select
                    value={condicionesAcceso}
                    onChange={(e) => setCondicionesAcceso(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Buenas condiciones">Buenas condiciones (Transitabilidad normal)</option>
                    <option value="Paso restringido">Paso restringido / Sólo 4x4 o moto</option>
                    <option value="Difícil acceso">Difícil acceso / Peatonal obligado</option>
                    <option value="Cierre total">Cierre total por derrumbe o pérdida de banca</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 2: HOGAR Y SITUACIÓN ACTUAL */}
          {activeSection === 2 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Home className="h-4 w-4 text-blue-600" />
                <span>2. Hogar y Situación Actual en la Emergencia</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Nº Familias</label>
                  <input
                    type="number"
                    min="1"
                    value={numFamilias}
                    onChange={(e) => setNumFamilias(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Total Personas</label>
                  <input
                    type="number"
                    min="1"
                    value={numPersonas}
                    onChange={(e) => setNumPersonas(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Niños / Niñas</label>
                  <input
                    type="number"
                    min="0"
                    value={numNinos}
                    onChange={(e) => setNumNinos(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Adultos Mayores</label>
                  <input
                    type="number"
                    min="0"
                    value={numAdultosMayores}
                    onChange={(e) => setNumAdultosMayores(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">¿La familia permanece en la vivienda?</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPermaneceEnVivienda(true)}
                      className={`flex-1 py-2 rounded-xl font-bold border transition ${
                        permaneceEnVivienda ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-white border-slate-200'
                      }`}
                    >
                      Sí permanece
                    </button>
                    <button
                      type="button"
                      onClick={() => setPermaneceEnVivienda(false)}
                      className={`flex-1 py-2 rounded-xl font-bold border transition ${
                        !permaneceEnVivienda ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-white border-slate-200'
                      }`}
                    >
                      Evacuaron / No habita
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lugar de Alojamiento Actual</label>
                  <input
                    type="text"
                    value={lugarAlojamientoActual}
                    onChange={(e) => setLugarAlojamientoActual(e.target.value)}
                    placeholder="Ej. En la misma vivienda, Familiar / Red de apoyo..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Soporte o Documento de Tenencia</label>
                  <select
                    value={soporteTenencia}
                    onChange={(e) => setSoporteTenencia(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Escritura">Escritura Pública Registrada</option>
                    <option value="Contrato Compraventa">Contrato o Promesa de Compraventa</option>
                    <option value="Certificado Tradición">Certificado de Tradición y Libertad</option>
                    <option value="Sana Posesión">Declaración de Sana Posesión</option>
                    <option value="Recibo Servicios">Factura o Recibo de Servicios Públicos</option>
                    <option value="Sin soporte">Sin soporte documental físico</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Necesidad Inmediata Identificada</label>
                  <select
                    value={necesidadInmediata}
                    onChange={(e) => setNecesidadInmediata(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Reconstrucción menor">Reconstrucción menor / Reparación cubierta o muros</option>
                    <option value="Reconstrucción total">Reconstrucción total de la vivienda</option>
                    <option value="Reubicación">Reubicación en lote seguro</option>
                    <option value="Subsidio arriendo">Subsidio de arrendamiento temporal</option>
                    <option value="Kit de emergencia">Kit alimentario / Asistencia humanitaria inmediata</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 3: CARACTERIZACIÓN PREVIA DE LA VIVIENDA */}
          {activeSection === 3 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Layers className="h-4 w-4 text-blue-600" />
                <span>3. Caracterización de la Vivienda Antes del Sismo / Desastre</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipología</label>
                  <select
                    value={tipologiaVivienda}
                    onChange={(e) => setTipologiaVivienda(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Unifamiliar">Unifamiliar</option>
                    <option value="Bifamiliar">Bifamiliar</option>
                    <option value="Multifamiliar">Multifamiliar</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nº Pisos</label>
                  <input
                    type="number"
                    min="1"
                    value={numeroPisos}
                    onChange={(e) => setNumeroPisos(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Área Aproximada (m²)</label>
                  <input
                    type="number"
                    value={areaM2}
                    onChange={(e) => setAreaM2(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Material Predominante Muros</label>
                  <input
                    type="text"
                    value={materialMuros}
                    onChange={(e) => setMaterialMuros(e.target.value)}
                    placeholder="Ej. Material / Mampostería, Bahareque..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Cubierta / Techo</label>
                  <input
                    type="text"
                    value={tipoCubierta}
                    onChange={(e) => setTipoCubierta(e.target.value)}
                    placeholder="Ej. Teja arquitectónica, Teja de barro..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Piso</label>
                  <input
                    type="text"
                    value={tipoPiso}
                    onChange={(e) => setTipoPiso(e.target.value)}
                    placeholder="Ej. Cerámica, Cemento afinado, Madera..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Antigüedad Aproximada</label>
                  <input
                    type="text"
                    value={antiguedadAnos}
                    onChange={(e) => setAntiguedadAnos(e.target.value)}
                    placeholder="Ej. 11 años"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Descripción General</label>
                  <input
                    type="text"
                    value={descripcionPrevia}
                    onChange={(e) => setDescripcionPrevia(e.target.value)}
                    placeholder="Ej. Vivienda de un solo nivel con patio posterior..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 4: EVALUACIÓN VISUAL DE DAÑOS (11 ELEMENTOS) */}
          {activeSection === 4 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <span>4. Matriz Completa de Evaluación Visual de Daños</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Calificación elemento por elemento según el formato oficial municipal de Anserma.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600">
                      <th className="py-2.5 px-3">Elemento Evaluado</th>
                      <th className="py-2.5 px-3">Nivel de Daño</th>
                      <th className="py-2.5 px-3">¿Riesgo Inmediato?</th>
                      <th className="py-2.5 px-3">Observaciones / Especificación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {elementosEvaluados.map((item, idx) => (
                      <tr key={item.elemento} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                          {item.elemento}
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={item.nivel_dano}
                            onChange={(e) => {
                              const updated = [...elementosEvaluados];
                              updated[idx].nivel_dano = e.target.value as any;
                              setElementosEvaluados(updated);
                            }}
                            className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                              item.nivel_dano === 'Colapso' || item.nivel_dano === 'Severo'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : item.nivel_dano === 'Moderado'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            <option value="Sin daño">Sin daño</option>
                            <option value="Leve">Leve</option>
                            <option value="Moderado">Moderado</option>
                            <option value="Severo">Severo</option>
                            <option value="Colapso">Colapso</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={item.riesgo_inmediato}
                            onChange={(e) => {
                              const updated = [...elementosEvaluados];
                              updated[idx].riesgo_inmediato = e.target.value as any;
                              setElementosEvaluados(updated);
                            }}
                            className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                              item.riesgo_inmediato === 'Sí'
                                ? 'bg-rose-100 text-rose-900 border-rose-300'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            <option value="No">No</option>
                            <option value="Sí">Sí</option>
                            <option value="No aplica">No aplica</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.observaciones || ''}
                            onChange={(e) => {
                              const updated = [...elementosEvaluados];
                              updated[idx].observaciones = e.target.value;
                              setElementosEvaluados(updated);
                            }}
                            placeholder="Detalle..."
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECCIÓN 5: TERRENO Y AMENAZAS ASOCIADAS */}
          {activeSection === 5 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Activity className="h-4 w-4 text-amber-600" />
                <span>5. Terreno y Amenazas del Entorno Asociadas</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {condicionesTerreno.map((cond, idx) => (
                  <div key={cond.condicion} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">{cond.condicion}</span>
                      <select
                        value={cond.aplica}
                        onChange={(e) => {
                          const updated = [...condicionesTerreno];
                          updated[idx].aplica = e.target.value as any;
                          setCondicionesTerreno(updated);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${
                          cond.aplica === 'Sí' ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-white border-slate-200'
                        }`}
                      >
                        <option value="No">No</option>
                        <option value="Sí">Sí</option>
                        <option value="No aplica">No aplica</option>
                      </select>
                    </div>
                    {cond.aplica === 'Sí' && (
                      <input
                        type="text"
                        value={cond.observaciones || ''}
                        onChange={(e) => {
                          const updated = [...condicionesTerreno];
                          updated[idx].observaciones = e.target.value;
                          setCondicionesTerreno(updated);
                        }}
                        placeholder="Observación o magnitud del agrietamiento..."
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px]"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN 6: SERVICIOS Y SANEAMIENTO */}
          {activeSection === 6 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Droplets className="h-4 w-4 text-blue-600" />
                <span>6. Servicios Públicos y Saneamiento Básico</span>
              </h4>
              <div className="space-y-3">
                {serviciosSaneamiento.map((serv, idx) => (
                  <div key={serv.servicio} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 items-center">
                    <span className="font-bold text-slate-800">{serv.servicio}</span>
                    <input
                      type="text"
                      value={serv.estado || ''}
                      onChange={(e) => {
                        const updated = [...serviciosSaneamiento];
                        updated[idx].estado = e.target.value;
                        setServiciosSaneamiento(updated);
                      }}
                      placeholder="Estado del servicio..."
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <select
                      value={serv.aplica}
                      onChange={(e) => {
                        const updated = [...serviciosSaneamiento];
                        updated[idx].aplica = e.target.value as any;
                        setServiciosSaneamiento(updated);
                      }}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    >
                      <option value="Sí">Sí funcional / Acceso</option>
                      <option value="No">No disponible / Colapso</option>
                      <option value="No aplica">No aplica</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN 7: HABITABILIDAD E INTERVENCIÓN */}
          {activeSection === 7 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <FileCheck2 className="h-4 w-4 text-blue-600" />
                <span>7. Concepto Preliminar de Habitabilidad e Intervención</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Clasificación de Habitabilidad</label>
                  <select
                    value={clasificacionHabitabilidad}
                    onChange={(e) => setClasificacionHabitabilidad(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-black"
                  >
                    <option value="No habitable">No habitable (Desalojo obligado)</option>
                    <option value="Habitable con restricción">Habitable con restricción parcial</option>
                    <option value="Habitable">Habitable sin riesgo estructural</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Medida Urgente Recomendada</label>
                  <select
                    value={medidaUrgente}
                    onChange={(e) => setMedidaUrgente(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Reconstrucción total">Reconstrucción total de la vivienda</option>
                    <option value="Reconstrucción menor">Reconstrucción menor de muros / techos</option>
                    <option value="Reubicación">Reubicación en sitio seguro</option>
                    <option value="Apuntalamiento urgente">Apuntalamiento urgente y estabilización</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prioridad de Atención</label>
                  <select
                    value={prioridadAtencion}
                    onChange={(e) => setPrioridadAtencion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-rose-700"
                  >
                    <option value="Urgente">Urgente (Atención Inmediata)</option>
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">¿Requiere Evaluación Estructural Especializada?</label>
                  <select
                    value={requiereEvaluacionEspecializada}
                    onChange={(e) => setRequiereEvaluacionEspecializada(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="No aplica">No aplica</option>
                    <option value="Sí requiere">Sí requiere peritaje geotécnico / estructural</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 8: CONDICIONES PARA RECONSTRUCCIÓN */}
          {activeSection === 8 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>8. Condiciones para Reconstrucción / Reubicación en el Predio</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Acceso para materiales y maquinaria pesada', val: accesoMateriales, set: setAccesoMateriales },
                  { label: 'Disponibilidad de punto de agua en obra', val: disponibilidadAgua, set: setDisponibilidadAgua },
                  { label: 'Disponibilidad de energía eléctrica para obra', val: disponibilidadEnergia, set: setDisponibilidadEnergia },
                  { label: 'Saneamiento básico viable en el lote', val: saneamientoViable, set: setSaneamientoViable },
                  { label: 'Requiere movimiento de tierras / explanación', val: requiereMovimientoTierras, set: setRequiereMovimientoTierras },
                  { label: 'Requiere muro de contención / gaviones', val: requiereMuroContencion, set: setRequiereMuroContencion },
                  { label: 'Requiere manejo especial de aguas lluvias / drenaje', val: requiereManejoAguasLluvias, set: setRequiereManejoAguasLluvias },
                  { label: 'El beneficiario puede apoyar con mano de obra', val: puedeApoyarManoObra, set: setPuedeApoyarManoObra },
                  { label: 'Existe zona más segura dentro del mismo predio', val: zonaMasSeguraPredio, set: setZonaMasSeguraPredio }
                ].map((item) => (
                  <label key={item.label} className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <input
                      type="checkbox"
                      checked={item.val}
                      onChange={(e) => item.set(e.target.checked)}
                      className="h-4 w-4 rounded text-blue-600"
                    />
                    <span className="font-bold text-slate-800 text-xs">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN 9: REGISTRO FOTOGRÁFICO CHECKLIST */}
          {activeSection === 9 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Camera className="h-4 w-4 text-blue-600" />
                <span>9. Checklist Obligatorio del Registro Fotográfico</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'interior_vivienda', label: 'Interior vivienda' },
                  { key: 'danos_estructurales', label: 'Daños estructurales' },
                  { key: 'cubierta', label: 'Cubierta / Techo' },
                  { key: 'terreno_grietas', label: 'Terreno y grietas' },
                  { key: 'taludes_amenazas', label: 'Taludes y amenazas' },
                  { key: 'acceso_vivienda', label: 'Acceso a vivienda' },
                  { key: 'servicios_saneamiento', label: 'Servicios básicos' },
                  { key: 'panoramica_vivienda_entorno', label: 'Vista panorámica' },
                ].map((f) => (
                  <label key={f.key} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(checklistFotos as any)[f.key]}
                      onChange={(e) => setChecklistFotos({ ...checklistFotos, [f.key]: e.target.checked })}
                      className="h-4 w-4 rounded text-blue-600"
                    />
                    <span className="font-bold text-slate-700 text-xs">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN 10: CONCEPTO TÉCNICO PRELIMINAR */}
          {activeSection === 10 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <ClipboardCheck className="h-4 w-4 text-blue-600" />
                <span>10. Dictamen y Concepto Técnico Conclusivo</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dictamen Técnico Oficial</label>
                  <select
                    value={dictamenGeneral}
                    onChange={(e) => setDictamenGeneral(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-black text-rose-700"
                  >
                    <option value="COLAPSO_INMINENTE">COLAPSO INMINENTE</option>
                    <option value="DESHABITABLE">DESHABITABLE</option>
                    <option value="SEVERO">SEVERO</option>
                    <option value="MODERADO">MODERADO</option>
                    <option value="LEVE">LEVE</option>
                    <option value="HABITABLE">HABITABLE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Costo Estimado de Daños (COP)</label>
                  <input
                    type="number"
                    value={costoEstimadoDanos}
                    onChange={(e) => setCostoEstimadoDanos(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiereEvacuacion}
                      onChange={(e) => setRequiereEvacuacion(e.target.checked)}
                      className="h-4 w-4 rounded text-rose-600"
                    />
                    <span className="font-bold text-rose-800">Requiere Evacuación</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiereDemolicion}
                      onChange={(e) => setRequiereDemolicion(e.target.checked)}
                      className="h-4 w-4 rounded text-rose-600"
                    />
                    <span className="font-bold text-rose-800">Requiere Demolición</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Principales Daños Encontrados</label>
                  <textarea
                    rows={2}
                    value={principalesDanos}
                    onChange={(e) => setPrincipalesDanos(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Riesgos Inmediatos Identificados</label>
                  <textarea
                    rows={2}
                    value={riesgosInmediatos}
                    onChange={(e) => setRiesgosInmediatos(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones Generales y Recomendación de Ocupación</label>
                <textarea
                  rows={2}
                  value={observacionesGenerales}
                  onChange={(e) => setObservacionesGenerales(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>
          )}

          {/* Botones de Navegación del Stepper y Guardar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div>
              {activeSection > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveSection((prev) => prev - 1)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Anterior</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeSection < 10 ? (
                <button
                  type="button"
                  onClick={() => setActiveSection((prev) => prev + 1)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Siguiente Sección</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                  <span>{saving ? 'Guardando...' : 'Formalizar Dictamen Oficial'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
