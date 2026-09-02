export interface Subtipologia {
  code: string;
  nombre: string;
}

export interface TipologiaCatastrofe {
  id: number;
  nombre: string;
  icono: string;
  subtipos: Subtipologia[];
}

export const DISASTER_TYPOLOGIES: TipologiaCatastrofe[] = [
  {
    id: 10,
    nombre: "Afectación de Vivienda",
    icono: "home",
    subtipos: [
      { code: "VIV_AGRIETA_PAREDES", nombre: "Agrietamiento/fisuras en paredes" },
      { code: "VIV_INCLINADA", nombre: "Vivienda inclinada" },
      { code: "VIV_AGRIETA_COLUMNAS", nombre: "Agrietamiento/fisuras en columnas o vigas" },
      { code: "VIV_COLAPSO_PARCIAL_MUROS", nombre: "Colapso parcial de muros/paredes" },
      { code: "VIV_COLAPSO_TOTAL_MUROS", nombre: "Colapso total de muros/paredes" },
      { code: "VIV_DANO_TECHO", nombre: "Daño en techo/cubierta (tejas movidas o rotas)" },
      { code: "VIV_COLAPSO_PARCIAL_TECHO", nombre: "Colapso parcial de techo/cubierta" },
      { code: "VIV_COLAPSO_TOTAL_TECHO", nombre: "Colapso total de techo/cubierta" },
      { code: "VIV_CIELO_RASO", nombre: "Desprendimiento de cielo raso" },
      { code: "VIV_DANO_PISOS", nombre: "Daño en pisos/baldosas" },
      { code: "VIV_COLAPSO_PARCIAL_SERVICIOS", nombre: "Colapso Parcial en zona de servicios" },
      { code: "VIV_COLAPSO_TOTAL_SERVICIOS", nombre: "Colapso total en zona de servicios" },
      { code: "VIV_HUNDIMIENTO_ESTRUCTURA", nombre: "Hundimiento/asentamiento de estructura" },
      { code: "VIV_DANO_FACHADA", nombre: "Daño/despolme fachada" },
      { code: "VIV_INHABITABLE_DEMOLICION", nombre: "Vivienda inhabitable / requiere demolición" },
      { code: "VIV_DANO_VENTANAS", nombre: "Daño en vidrios/ventanas" },
      { code: "VIV_SIN_DANO", nombre: "Sin daño visible" },
      { code: "VIV_SIN_VISITA", nombre: "Vivienda Pendiente de Inspección / Sin Visita Técnica" },
      { code: "VIV_SUBSIDIO", nombre: "Subsidio de Vivienda / Arriendo Temporal" },
    ],
  },
  {
    id: 1,
    nombre: "Asistencia Alimentaria",
    icono: "utensils",
    subtipos: [
      { code: "ALIM_MERCADO", nombre: "Kit de mercado" },
      { code: "ALIM_INFANTIL", nombre: "Nutrición Infantil y Fórmulas Lácteas" },
      { code: "ALIM_AGUA", nombre: "Kit de Hidratación y Agua Potable (Garrafones/Sobres)" },
    ],
  },
  {
    id: 2,
    nombre: "Aseo y Saneamiento (WASH)",
    icono: "soap",
    subtipos: [
      { code: "WASH_PERSONAL", nombre: "Kit de Aseo e Higiene Personal Familiar" },
      { code: "WASH_DIGNIDAD", nombre: "Kit de Dignidad / Higiene Femenina" },
      { code: "WASH_DESINFECCION", nombre: "Kit de Desinfección y Limpieza de Espacios" },
    ],
  },
  {
    id: 3,
    nombre: "Cuidado y Población Vulnerable",
    icono: "heart-handshake",
    subtipos: [
      { code: "VULN_ADULTO_MAYOR", nombre: "Pañales Adulto M/L/XL y Sabanillas" },
      { code: "VULN_PRIMERA_INFANCIA", nombre: "Pañales Bebé y Puericultura" },
      { code: "VULN_MOVILIDAD", nombre: "Ayudas Técnicas de Movilidad (Sillas de Ruedas / Bastones)" },
    ],
  },
  {
    id: 4,
    nombre: "Salud y Asistencia Psicosocial",
    icono: "activity",
    subtipos: [
      { code: "SALUD_PRIMEROS_AUXILIOS", nombre: "Primeros Auxilios y Material de Curación (Gasas / Vendas)" },
      { code: "SALUD_MED_BASICOS", nombre: "Medicamentos Básicos (Analgésicos / Antihistamínicos)" },
      { code: "SALUD_CRONICOS", nombre: "Manejo de Enfermedades Crónicas (Hipertensión / Diabetes)" },
      { code: "SALUD_PSICOSOCIAL", nombre: "Atención Psicosocial y Salud Mental (PAP / Manejo Duelo)" },
    ],
  },
  {
    id: 5,
    nombre: "Alojamiento Temporal y Abrigo",
    icono: "tent",
    subtipos: [
      { code: "ALOJ_PERNOCTACION", nombre: "Kit de Pernoctación (Colchonetas Impermeables / Cobijas Térmicas)" },
      { code: "ALOJ_REFUGIO", nombre: "Refugio de Emergencia (Carpas / Plásticos Calibre 8)" },
      { code: "ALOJ_MENAJE", nombre: "Menaje de Cocina (Estufas Portátiles / Ollas / Vajilla)" },
      { code: "ALOJ_ROPA", nombre: "Kit de Ropa y Calzado de Emergencia" },
    ],
  },
  {
    id: 6,
    nombre: "Materiales de Construcción y Herramientas",
    icono: "hammer",
    subtipos: [
      { code: "CONST_CEMENTO", nombre: "Cemento y Mortero (Bultos)" },
      { code: "CONST_LADRILLOS", nombre: "Ladrillos y Bloques de Concreto (Unidades)" },
      { code: "CONST_MADERA", nombre: "Madera, Listones y Volaretas (Tablas/Listones)" },
      { code: "CONST_ACERO", nombre: "Acero de Refuerzo, Varillas y Mallas" },
      { code: "CONST_TEJAS_ZINC", nombre: "Tejas de Zinc (Unidades)" },
      { code: "CONST_TEJAS_FIBROCEMENTO", nombre: "Tejas de Fibrocemento / Onduladas" },
      { code: "CONST_AMARRES_PERNOS", nombre: "Amarres, Ganchos, Pernos y Puntillas" },
      { code: "CONST_AGREGADOS", nombre: "Agregados (Arena / Triturado / Grava)" },
      { code: "CONST_HERRAMIENTAS_DESPEJE", nombre: "Herramientas de Obra (Palas, Picas, Carretillas)" },
      { code: "CONST_EPP_OBRA", nombre: "EPP de Construcción (Cascos, Botas, Guantes)" },
    ],
  },
  {
    id: 7,
    nombre: "Cuidado y Bienestar Animal",
    icono: "dog",
    subtipos: [
      { code: "ANIM_ALIMENTO", nombre: "Alimentación para Mascotas (Concentrado Perro / Gato)" },
      { code: "ANIM_MANEJO_SANIDAD", nombre: "Manejo, Refugio y Sanidad Animal (Guacales / Correas)" },
    ],
  },
  {
    id: 8,
    nombre: "Asistencia Jurídica y Documental",
    icono: "file-text",
    subtipos: [
      { code: "JUR_DOCUMENTOS", nombre: "Reposición y Trámite de Documentos de Identidad" },
      { code: "JUR_CENSO_RUD", nombre: "Registro y Certificación de Damnificados (RUD / Censo)" },
      { code: "JUR_ASESORIA", nombre: "Asesoría Legal en Subsidios, Arriendos y Seguros" },
      { code: "JUR_BUSQUEDA", nombre: "Restablecimiento de Contacto Familiar y Búsqueda" },
    ],
  },
  {
    id: 9,
    nombre: "Logística y Protección",
    icono: "shield",
    subtipos: [
      { code: "LOG_ENERGIA", nombre: "Energía e Iluminación (Linternas / Pilas / Power Banks)" },
      { code: "LOG_EPP", nombre: "Elementos de Protección Personal - EPP (Guantes / Cascos / Tapabocas)" },
      { code: "LOG_RESIDUOS", nombre: "Gestión de Residuos y Señalización (Bolsas Escombros / Cintas)" },
    ],
  },
];
