export interface UserProfile {
  id_usuario: number;
  correo: string;
  nombres: string;
  apellidos: string;
  documento: string;
  id_rol: number;
  nombre_rol: string;
  nivel: number;
}

export interface SectorItem {
  id_sector: number;
  nombre_sector: string;
  id_tipo_sector: number;
  tipo_sector: string; // 'Urbano' | 'Rural'
  latitud?: number | null;
  longitud?: number | null;
}

export interface KitComponente {
  id_componente?: number;
  id_item?: number;
  nombre_componente: string;
  descripcion?: string | null;
  cantidad_estandar: number;
  unidad_medida: string;
  es_obligatorio: boolean;
  orden?: number;
  activo?: boolean;
}

export interface CategoriaAyuda {
  id_categoria: number;
  nombre_categoria: string;
  descripcion?: string | null;
  icono?: string;
  activo: boolean;
  cantidad_items?: number;
}

export interface ItemAyuda {
  id_item: number;
  id_categoria: number;
  nombre_categoria: string;
  codigo_item: string;
  nombre_item: string;
  unidad_medida: string;
  stock_disponible: number;
  activo: boolean;
  costo_referencia?: number;
  descripcion?: string | null;
  es_kit?: boolean;
  permite_personalizacion?: boolean;
  icono_categoria?: string;
  cantidad_componentes?: number;
  componentes?: KitComponente[];
}

export interface EntidadDonante {
  id_entidad: number;
  codigo_entidad: string;
  nombre_entidad: string;
  tipo_entidad: string;
  contacto_nombre?: string | null;
  contacto_telefono?: string | null;
  activo: boolean;
}

export interface ElementoEvaluadoVisual {
  elemento: string;
  nivel_dano: 'Sin daño' | 'Leve' | 'Moderado' | 'Severo' | 'Colapso';
  riesgo_inmediato: 'Sí' | 'No' | 'No aplica';
  observaciones?: string;
}

export interface CondicionTerreno {
  condicion: string;
  aplica: 'Sí' | 'No' | 'No aplica';
  nivel?: 'Leve' | 'Moderado' | 'Grave' | string;
  observaciones?: string;
}

export interface ServicioSaneamiento {
  servicio: string;
  estado?: string;
  aplica: 'Sí' | 'No' | 'No aplica';
  observaciones?: string;
}

export interface VisitaTecnica {
  id_visita?: number;
  id_solicitud?: number;
  numero_visita?: number;
  fecha_visita?: string;
  profesional_responsable: string;
  cargo_responsable?: string;
  dictamen_tecnico: string;
  afectacion_muros: string;
  afectacion_techos: string;
  afectacion_pisos: string;
  requiere_evacuacion: boolean;
  requiere_demolicion: boolean;
  costo_estimado_danos?: number;
  observaciones_tecnicas?: string;
  fotos_evidencia?: string[];
  kits_recomendados_json?: any;
  created_at?: string;

  // 1. Datos Generales de la Visita y Acceso
  hora_visita?: string;
  acceso_vivienda?: string;
  tiempo_acceso?: string;
  condiciones_acceso?: string;

  // 2. Hogar y Situación Actual
  permanece_en_vivienda?: boolean;
  lugar_alojamiento_actual?: string;
  soporte_tenencia?: string;
  tiene_otra_vivienda?: boolean;
  necesidad_inmediata?: string;

  // 3. Caracterización Previa de la Vivienda
  tipologia_vivienda?: string;
  numero_pisos?: number;
  area_aproximada_m2?: number;
  numero_habitaciones?: number;
  material_predominante_muros?: string;
  tipo_cubierta?: string;
  tipo_piso?: string;
  antiguedad_anos?: string;
  tiene_ampliaciones?: boolean;
  descripcion_vivienda_previa?: string;

  // 4 a 10. Secciones estructuradas completas
  evaluacion_elementos_json?: ElementoEvaluadoVisual[];
  terreno_amenazas_json?: CondicionTerreno[];
  servicios_saneamiento_json?: ServicioSaneamiento[];
  concepto_habitabilidad_json?: {
    clasificacion_habitabilidad?: string;
    requiere_restriccion_ingreso?: boolean;
    requiere_evaluacion_especializada?: string;
    intervencion_preliminar_recomendada?: string;
    requiere_intervencion_urgente_reduccion_riesgo?: boolean;
    medida_urgente_recomendada?: string;
    prioridad_atencion?: string;
  };
  condiciones_reconstruccion_json?: {
    acceso_materiales_maquinaria?: boolean;
    disponibilidad_agua?: boolean;
    disponibilidad_energia?: boolean;
    saneamiento_viable?: boolean;
    requiere_movimiento_tierras?: boolean;
    requiere_muro_contencion?: boolean;
    requiere_manejo_aguas_lluvias?: boolean;
    puede_apoyar_mano_obra?: boolean;
    existe_zona_mas_segura_predio?: boolean;
  };
  registro_fotografico_checklist_json?: {
    interior_vivienda?: boolean;
    danos_estructurales?: boolean;
    cubierta?: boolean;
    terreno_grietas?: boolean;
    taludes_amenazas?: boolean;
    acceso_vivienda?: boolean;
    servicios_saneamiento?: boolean;
    panoramica_vivienda_entorno?: boolean;
  };
  concepto_tecnico_detallado_json?: {
    principales_danos?: string;
    riesgos_inmediatos?: string;
    recomendacion_ocupacion?: string;
    estudios_adicionales?: string;
    observaciones_generales?: string;
    responsable_firma?: string;
    fecha?: string;
  };
  fotos_techo?: string[];
  fotos_estructura?: string[];
  banco_materiales_json?: BancoMaterialItem[];
  solicitado_por_materiales?: string;
}

export interface SeguimientoObra {
  id_obra?: number;
  id_solicitud?: number;
  id_visita_origen?: number;
  codigo_obra?: string;
  estado_obra: 'EN_PLANIFICACION' | 'EN_EJECUCION' | 'TERMINADA' | 'SUSPENDIDA' | string;
  porcentaje_avance: number;
  registro_inicial_json?: {
    fotos_estado_actual?: string[];
    foto_lote?: string;
    foto_contador?: string;
    foto_factura_energia?: string;
    foto_electrica?: string;
    foto_pozo_septico?: string;
  };
  revision_planos_json?: {
    verificacion_lote?: boolean;
    levantamiento_info?: boolean;
    plano_arquitectonico?: boolean;
    plano_hidraulico?: boolean;
    plano_sanitario?: boolean;
    plano_electrico?: boolean;
    plano_pozo_septico?: boolean;
    notas_planos?: string;
  };
  hitos_obra_json?: Array<{
    hito: string;
    estado: 'Pendiente' | 'En proceso' | 'Completado' | 'No aplica';
    porcentaje?: number;
    fecha?: string;
    observacion?: string;
  }>;
  registro_cierre_json?: {
    fotos_proceso?: string[];
    foto_vivienda_terminada?: string;
    foto_placa_instalada?: string;
    acta_entrega_url?: string;
    fecha_terminacion?: string;
    estado_final?: string;
    observaciones_finales?: string;
  };
  certificaciones_json?: {
    autorizacion_habeas_data?: boolean;
    certificado_retie?: boolean;
    asociado_chec?: boolean;
    asociado_corpocaldas?: boolean;
    observaciones?: string;
  };
  dotacion_componentes_json?: {
    cocina?: Record<string, boolean>;
    bano?: Record<string, boolean>;
    lavanderia?: Record<string, boolean>;
    acabados?: Record<string, boolean>;
    exteriores?: Record<string, boolean>;
    instalacion_electrica?: Record<string, boolean>;
    saneamiento?: Record<string, boolean>;
  };
  responsable_obra: string;
  cargo_responsable?: string;
  firma_responsable?: string;
  observaciones_generales?: string;
  fecha_inicio?: string;
  fecha_entrega_estimada?: string;
  fecha_entrega_real?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InfraestructuraRural {
  id_infraestructura?: number;
  id_solicitud?: number;
  tipo_infraestructura: string;
  nombre_identificador?: string;
  dano_estructura?: string;
  dano_techo?: string;
  estado_dano?: string;
  costo_estimado_reparacion?: number;
  observaciones?: string;
  fotos_evidencia?: string[];
}

export interface CiudadanoData {
  id_persona?: number;
  documento: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  direccion?: string;
  id_sector?: number;
}

export interface BancoMaterialItem {
  material: string;
  seleccionado: boolean;
  cantidad: number | string;
  tipo: string;
  aprobado: boolean;
}

export interface EvaluacionDanoData {
  tipo_inmueble?: string;
  nivel_afectacion_vivienda: 'Colapso Total' | 'Grave' | 'Leve' | 'Ninguno' | string;
  nivel_afectacion_techo: 'Colapso Total' | 'Grave' | 'Leve' | 'Ninguno' | string;
  nivel_afectacion_paredes?: 'Colapso Total' | 'Grave' | 'Leve' | 'Ninguno' | string;
  nivel_afectacion_pisos?: 'Colapso Total' | 'Grave' | 'Leve' | 'Ninguno' | string;
  otros_danos_descripcion?: string;
  estimacion_perdidas_pesos?: number;
  propietario_nombre?: string;
  propietario_documento?: string;
  propietario_telefono?: string;
  es_propietario_solicitante?: boolean;
  requiere_evacuacion: boolean;
  visita_campo_realizada: boolean;
  censo_oficial_realizado: boolean;
  requiere_albergue: boolean;
  cuenta_red_apoyo: boolean;
  afectacion_infraestructura_productiva: boolean;
  descripcion_infraestructura_productiva?: string;
  observaciones_dano?: string;
  tipologia_vivienda?: string;
  numero_pisos?: number;
  area_aproximada_m2?: number;
  numero_habitaciones?: number;
  material_predominante_muros?: string;
  tipo_cubierta?: string;
  tipo_piso?: string;
  antiguedad_anos?: string;
  tiene_ampliaciones?: boolean;
  descripcion_vivienda_previa?: string;
  fotos_techo?: string[];
  fotos_estructura?: string[];
  banco_materiales_json?: BancoMaterialItem[];
  solicitado_por_materiales?: string;
}

export interface IntegranteFamiliarData {
  nombres: string;
  apellidos?: string;
  tipo_documento?: string;
  documento?: string;
  fecha_nacimiento?: string;
  edad?: number;
  parentesco: string;
  genero?: string;
  etnia?: string;
  telefono?: string;
}

export interface FormularioRufeData {
  fecha_rufe?: string;
  corregimiento?: string;
  residencia_habitual: boolean;
  evacuado_residencia: boolean;
  forma_tenencia: 'Propietario' | 'Arrendatario' | 'Poseedor' | 'Ocupante' | 'Usufructuario' | string;
  tipo_bien: 'Vivienda' | 'Local Comercial' | 'Lote' | 'Finca' | string;
  estado_bien: 'Destruida/Colapsada' | 'Habitable' | 'Inhabitable' | 'Afectada Parcial' | string;
  tiene_afectacion_agropecuaria: boolean;
  tipo_cultivo?: string;
  unidad_area_cultivo?: string;
  area_cultivo_afectada?: number;
  especie_pecuaria?: string;
  cantidad_animales_afectados?: number;
  vobo_cmgrd: boolean;
  integrantes?: IntegranteFamiliarData[];
}

export interface NucleoFamiliarData {
  es_propietario: boolean;
  edad_jefe_hogar?: number;
  tiene_acompanantes: boolean;
  cantidad_acompanantes: number;
  tiene_adultos_mayores: boolean;
  cantidad_adultos_mayores: number;
  tiene_ninos: boolean;
  cantidad_ninos: number;
  tiene_discapacidad: boolean;
  observaciones_familia?: string;
  integrantes?: IntegranteFamiliarData[];
}

export interface SolicitudMapItem {
  id_solicitud: number;
  codigo_solicitud: string;
  fecha_solicitud: string;
  direccion_afectacion: string;
  latitud_gps?: number | null;
  longitud_gps?: number | null;
  id_estado: number;
  nombre_estado: string;
  ciudadano: {
    id_persona: number;
    documento: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
  };
  sector: {
    id_sector: number;
    nombre_sector: string;
    id_tipo_sector: number;
    tipo_sector: string;
  };
  nivel_afectacion_vivienda: string;
  nivel_afectacion_techo: string;
  requiere_evacuacion: boolean;
  tiene_rufe: boolean;
  tiene_entrega: boolean;
}

export interface SolicitudDetailResponse {
  id_solicitud: number;
  codigo_solicitud: string;
  fecha_solicitud: string;
  direccion_afectacion: string;
  latitud_gps?: number | null;
  longitud_gps?: number | null;
  id_estado: number;
  nombre_estado: string;
  observaciones_sector?: string;
  ficha_catastral?: string;
  tipo_tenencia?: string;
  subtipo_emergencia?: 'SOCIAL_E_INMUEBLE' | 'SOCIAL' | 'INMUEBLE' | string;
  estimacion_perdidas_pesos?: number;
  banco_materiales_json?: BancoMaterialItem[];
  solicitado_por_materiales?: string;
  comunidad_jac_nombre?: string;
  comunidad_jac_personeria?: string;
  comunidad_jac_representante?: string;
  comunidad_jac_telefono?: string;
  es_local_comercial?: boolean;
  comercio_razon_social?: string;
  comercio_nit_rut?: string;
  comercio_afectacion_mercancia?: string;
  acceso_vivienda?: string;
  tiempo_acceso?: string;
  condiciones_acceso?: string;
  soporte_tenencia?: string;
  permanece_en_vivienda?: boolean;
  lugar_alojamiento_actual?: string;
  tiene_otra_vivienda?: boolean;
  necesidad_inmediata?: string;
  infraestructuras_rurales?: InfraestructuraRural[];
  visitas_tecnicas?: VisitaTecnica[];
  seguimiento_obra?: SeguimientoObra[];
  ciudadano: CiudadanoData;
  sector: SectorItem;
  evaluacion_dano?: EvaluacionDanoData;
  formulario_rufe?: FormularioRufeData;
  nucleo_familiar?: NucleoFamiliarData;
  integrantes?: IntegranteFamiliarData[];
  items_solicitados: Array<{
    id_item: number;
    nombre_item: string;
    unidad_medida: string;
    cantidad: number;
  }>;
  entregas: Array<{
    id_entrega: number;
    codigo_entrega: string;
    fecha: string;
    observaciones?: string;
    id_item?: number;
    nombre_item?: string;
    cantidad?: number;
    costo_estimado_ayuda?: number;
    documento_receptor?: string;
    nombre_receptor?: string;
    fotos?: string[];
  }>;
  fotos: Array<{
    id_foto: number;
    url: string;
    tipo: string;
    fecha: string;
    id_entrega?: number | null;
  }>;
}

export interface DashboardStats {
  total_solicitudes: number;
  solicitudes_pendientes: number;
  solicitudes_atendidas: number;
  total_entregas: number;
  dano_vivienda: {
    colapso_total: number;
    grave: number;
    leve: number;
  };
  evacuados: number;
  distribucion_zona: {
    urbana: number;
    rural: number;
  };
}
