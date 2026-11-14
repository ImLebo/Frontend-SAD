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
  comunidad_jac_nombre?: string;
  comunidad_jac_personeria?: string;
  comunidad_jac_representante?: string;
  comunidad_jac_telefono?: string;
  es_local_comercial?: boolean;
  comercio_razon_social?: string;
  comercio_nit_rut?: string;
  comercio_afectacion_mercancia?: string;
  infraestructuras_rurales?: InfraestructuraRural[];
  visitas_tecnicas?: VisitaTecnica[];
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
