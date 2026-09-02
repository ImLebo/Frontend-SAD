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

export interface ItemAyuda {
  id_item: number;
  id_categoria: number;
  nombre_categoria: string;
  codigo_item: string;
  nombre_item: string;
  unidad_medida: string;
  stock_disponible: number;
  activo: boolean;
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
  nivel_afectacion_vivienda: 'Colapso Total' | 'Grave' | 'Leve' | 'Ninguno';
  nivel_afectacion_techo: 'Colapso Total' | 'Grave' | 'Leve' | 'Ninguno';
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
  }>;
  fotos: Array<{
    id_foto: number;
    url: string;
    tipo: string;
    fecha: string;
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
