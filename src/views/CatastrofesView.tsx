import React, { useEffect, useMemo, useState, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Droplets,
  Eye,
  FileText,
  Filter,
  Globe2,
  HeartHandshake,
  Home,
  Info,
  Layers,
  Leaf,
  List,
  ListCheck,
  ClipboardList,
  Loader2,
  LocateFixed,
  MapPin,
  Maximize2,
  Minimize2,
  Minus,
  Package,
  PackageCheck,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Square,
  Tent,
  Trash2,
  Trees,
  Truck,
  User,
  UserCheck,
  Users,
  Utensils,
  Warehouse,
  X,
  Save,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Flame,
  Waves,
  Mountain,
  Wind,
  BarChart3,
  Settings,
  RefreshCw,
  ClipboardCheck,
  Hammer,
} from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { useAuth } from '../auth/AuthContext';
import { NavbarSAC, puedeGestionarEventosUsuario } from '../components/layout/NavbarSAC';
import SearchableSelect from '../components/form/SearchableSelect';
import LocationPickerModal from '../components/maps/LocationPickerModal';
import PendingRequestPickerModal from '../components/modals/PendingRequestPickerModal';
import { SolicitudDetailModal } from '../components/modals/SolicitudDetailModal';
import { VisitaTecnicaCompletaModal } from '../components/modals/VisitaTecnicaCompletaModal';
import { GestionNucleosFamiliaresSAD } from '../components/nucleos/GestionNucleosFamiliaresSAD';
import { apiClient } from '../api/client';
import { DISASTER_TYPOLOGIES } from '../constants/disasterTypologies';
import { getSectorMarkerIcon, getSectorSummaryMarkerIcon } from '../components/maps/sectorMarkerIcon';
import { getSectorsGeoData, assignRequestsToSectors } from '../utils/sectorDataHelper';
import { sacService } from '../services/sacService';
import type {
  SectorItem,
  ItemAyuda,
  SolicitudMapItem,
  SolicitudDetailResponse,
  DashboardStats,
  BancoMaterialItem,
} from '../types/sac.types';
import '../components/maps/RequestLocationMap.css';

// Flag para habilitar/deshabilitar la pestaña de "Entrega de ayudas" en el formulario inicial de solicitud
// Se mantiene todo el código intacto para reactivarlo en el futuro si se requiere
const HABILITAR_ENTREGA_AYUDAS_FORM_INICIAL = false;

const MATERIALES_BANCO_DEFAULT: BancoMaterialItem[] = [
  { material: 'Cemento - Mortero (Bultos)', seleccionado: false, cantidad: '', tipo: '', aprobado: false },
  { material: 'Ladrillos - Bloques de Concreto', seleccionado: false, cantidad: '', tipo: '', aprobado: false },
  { material: 'Madera - Listones - Guaduas', seleccionado: false, cantidad: '', tipo: '', aprobado: false },
  { material: 'Acero - Varillas', seleccionado: false, cantidad: '', tipo: '', aprobado: false },
  { material: 'Malla Electrosoldada', seleccionado: false, cantidad: '', tipo: '', aprobado: false },
  { material: 'Hojas de Zinc', seleccionado: false, cantidad: '', tipo: '', aprobado: false },
  { material: 'Tejas Fibrocemento', seleccionado: false, cantidad: '', tipo: '', aprobado: false },
  { material: 'Teja Arquitectonica', seleccionado: false, cantidad: '', tipo: '', aprobado: false },
  { material: 'Agregados (Arena / Triturado)', seleccionado: false, cantidad: '', tipo: '', aprobado: false },
  { material: 'Perfiles Métalicos', seleccionado: false, cantidad: '', tipo: '', aprobado: false },
];

const iconMap: Record<string, any> = {
  home: Home,
  utensils: Utensils,
  soap: Droplets,
  'heart-handshake': HeartHandshake,
  activity: Activity,
  tent: Tent,
  hammer: Sparkles,
  dog: Shield,
  'file-text': FileText,
  shield: Shield,
  truck: Truck,
};

function EmergencyMapController({ isFullScreen }: { isFullScreen?: boolean }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const timer1 = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    const timer2 = setTimeout(() => {
      map.invalidateSize();
    }, 450);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [map, isFullScreen]);
  return null;
}

export const CatastrofesView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Navigation tabs inside module: inicio | eventos | formulario | evaluaciones | mapa | historial | nucleos | reportes
  const [activeTab, setActiveTab] = useState<'inicio' | 'eventos' | 'formulario' | 'evaluaciones' | 'mapa' | 'historial' | 'nucleos' | 'reportes'>('inicio');
  const [formStepTab, setFormStepTab] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [isConfirmSubmitModalOpen, setIsConfirmSubmitModalOpen] = useState(false);
  const [isLimpiarModalOpen, setIsLimpiarModalOpen] = useState(false);
  const [selectedTabsToClean, setSelectedTabsToClean] = useState<number[]>([1]);
  const [isListarModalOpen, setIsListarModalOpen] = useState(false);
  const [listarSearchQuery, setListarSearchQuery] = useState('');
  const deferredListarSearch = useDeferredValue(listarSearchQuery);
  const [listarEventoFiltro, setListarEventoFiltro] = useState<number | 'ALL'>('ALL');
  const [listarEstadoFiltro, setListarEstadoFiltro] = useState<'all' | 'pending' | 'completed'>('all');
  const [listarSectorFiltro, setListarSectorFiltro] = useState<number | 'ALL'>('ALL');
  const [listarNivelDanoFiltro, setListarNivelDanoFiltro] = useState<string>('ALL');
  const [listarCurrentPage, setListarCurrentPage] = useState<number>(1);
  const [listarPageSize, setListarPageSize] = useState<number>(10);
  const [evalCurrentPage, setEvalCurrentPage] = useState<number>(1);
  const [visitaModalSolicitud, setVisitaModalSolicitud] = useState<any | null>(null);
  const [savingVisitaDirecta, setSavingVisitaDirecta] = useState(false);
  const [detailModalInitialTab, setDetailModalInitialTab] = useState<'censo' | 'rufe' | 'familia' | 'insumos' | 'visitas' | 'obra' | 'entregas' | 'fotos'>('censo');
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    title: string;
    motivos: { campo: string; mensaje: string; tab?: 1 | 2 | 3 | 4 | 5 | 6 }[];
    errorServidor?: string;
  }>({
    isOpen: false,
    title: '',
    motivos: [],
  });
  const [borradorGuardadoHora, setBorradorGuardadoHora] = useState<string | null>(null);

  // Permisos para crear/editar eventos (Secretario, Alcalde, Coordinador UNGRD, Administrador, Funcionario)
  const canManageEventos = useMemo(() => puedeGestionarEventosUsuario(user), [user]);

  // Modal de Crear / Editar Evento de Emergencia (Mockup 3)
  const [isCrearEventoModalOpen, setIsCrearEventoModalOpen] = useState(false);
  const [editingEventoObj, setEditingEventoObj] = useState<any | null>(null);
  const [savingEvento, setSavingEvento] = useState(false);
  const [eventoFiltroTab, setEventoFiltroTab] = useState<'activos' | 'finalizados' | 'todos'>('activos');
  const [eventoSearchText, setEventoSearchText] = useState('');
  const [selectedEmergencyTypeCard, setSelectedEmergencyTypeCard] = useState<string>('Terremoto');
  const [nuevoEventoForm, setNuevoEventoForm] = useState({
    tipo_evento: 'Terremoto',
    fecha_evento: new Date().toISOString().slice(0, 16),
    nombre_evento: '',
    ambito_territorial: 'Rural',
    ubicacion_principal: 'Vereda Alsacia',
    descripcion: '',
  });

  // Catalogs
  const [sectores, setSectores] = useState<SectorItem[]>([]);
  const [itemsAyuda, setItemsAyuda] = useState<ItemAyuda[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  // Multi-Disaster Events
  const [eventos, setEventos] = useState<any[]>([]);
  const [selectedEventoId, setSelectedEventoId] = useState<number>(1);

  // Mode: SOLICITUD_SOLO | VISITA_TECNICA | ENTREGA_DIRECTA | ENTREGA_EXISTENTE
  const [registroModo, setRegistroModo] = useState<'SOLICITUD_SOLO' | 'VISITA_TECNICA' | 'ENTREGA_DIRECTA' | 'ENTREGA_EXISTENTE'>('SOLICITUD_SOLO');

  // Role permissions (Roles: 1: Censo, 2: Entregas, 3: Funcionario, 4: Admin)
  const nivel = user?.nivel ?? 3;
  const isCensoOnlyUser = nivel === 1;
  const isEntregaOnlyUser = nivel === 2;

  useEffect(() => {
    if (isCensoOnlyUser) {
      setRegistroModo('SOLICITUD_SOLO');
    } else if (isEntregaOnlyUser) {
      setRegistroModo('ENTREGA_DIRECTA');
    }
  }, [isCensoOnlyUser, isEntregaOnlyUser]);

  // Disaster solicitudes (Pending and Completed) & Entregas
  const [todasSolicitudes, setTodasSolicitudes] = useState<any[]>([]);
  const [todasEntregas, setTodasEntregas] = useState<any[]>([]);
  const [listarVistaModo, setListarVistaModo] = useState<'solicitudes' | 'entregas'>('solicitudes');
  const [historialVistaModo, setHistorialVistaModo] = useState<'entregas' | 'solicitudes' | 'sesion'>('entregas');
  const [historialSearchQuery, setHistorialSearchQuery] = useState('');
  const deferredHistorialSearch = useDeferredValue(historialSearchQuery);
  const [historialSectorFiltro, setHistorialSectorFiltro] = useState<number | 'ALL'>('ALL');
  const [historialCurrentPage, setHistorialCurrentPage] = useState<number>(1);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isRequestPickerOpen, setIsRequestPickerOpen] = useState(false);

  // Form inputs - Section 1
  const [documento, setDocumento] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [sectorId, setSectorId] = useState<number>(1);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [grupoEtnicoCiudadano, setGrupoEtnicoCiudadano] = useState('Ninguno de los anteriores');
  const [parentescoCiudadano, setParentescoCiudadano] = useState('Jefe(a) o cabeza del hogar');
  const [tipoDestinatario, setTipoDestinatario] = useState<'INDIVIDUAL' | 'NUCLEO_FAMILIAR' | 'COMUNIDAD'>('NUCLEO_FAMILIAR');
  const [nombreComunidad, setNombreComunidad] = useState('');
  const [idNucleoVinculado, setIdNucleoVinculado] = useState<number | null>(null);
  const [nombreNucleoVinculado, setNombreNucleoVinculado] = useState<string>('');
  const [buscandoNucleoDoc, setBuscandoNucleoDoc] = useState(false);
  const [busquedaGeneralQuery, setBusquedaGeneralQuery] = useState('');
  const [resultadosBusquedaPersonas, setResultadosBusquedaPersonas] = useState<any[]>([]);
  const [resultadosBusquedaNucleos, setResultadosBusquedaNucleos] = useState<any[]>([]);
  const [mostrarResultadosBusqueda, setMostrarResultadosBusqueda] = useState(false);
  const [editandoNucleoInline, setEditandoNucleoInline] = useState(false);

  const encontrarSolicitudExistenteNucleo = (docsNucleo: string[], idNucleo?: number | null) => {
    const cleanDocs = docsNucleo.map((d) => String(d || '').trim()).filter(Boolean);
    return todasSolicitudes.find((s: any) => {
      if (editingSolicitudId && Number(s.id_solicitud) === Number(editingSolicitudId)) return false;
      if (selectedEventoId && s.id_evento && Number(s.id_evento) !== Number(selectedEventoId)) return false;
      if (idNucleo && s.id_nucleo && Number(s.id_nucleo) === Number(idNucleo)) return true;
      const docTit = String(s.documento || '').trim();
      if (docTit && cleanDocs.includes(docTit)) return true;
      const docsSol: string[] = Array.isArray(s.documentos_nucleo)
        ? s.documentos_nucleo.map((x: any) => String(x || '').trim())
        : [];
      return cleanDocs.some((d) => docsSol.includes(d));
    });
  };

  const cargarDatosDesdeNucleo = (nf: any, personaRef?: any) => {
    setIdNucleoVinculado(nf.id_nucleo);
    setNombreNucleoVinculado(nf.nombre_nucleo || nf.codigo_nucleo || `Núcleo #${nf.id_nucleo}`);
    if (nf.id_sector) setSectorId(Number(nf.id_sector));
    if (nf.direccion) setDireccion(nf.direccion);
    const todosMiembros = Array.isArray(nf.miembros) ? nf.miembros : [];
    const cabezaHogar =
      todosMiembros.find((m: any) => m.estado_miembro === 'ACTIVO' && m.es_cabeza_hogar) ||
      personaRef ||
      todosMiembros.find((m: any) => m.estado_miembro === 'ACTIVO');
    const titular = cabezaHogar || personaRef;
    if (titular) {
      if (titular.documento) setDocumento(titular.documento);
      if (titular.nombres) setNombres(titular.nombres);
      if (titular.apellidos) setApellidos(titular.apellidos);
      if (titular.telefono) setTelefono(titular.telefono);
    }
    const acomp = todosMiembros.filter(
      (m: any) => m.estado_miembro === 'ACTIVO' && (!titular || m.documento !== titular.documento),
    );
    setNucleoFamiliar(
      acomp.map((m: any, idx: number) => ({
        id: `sync-member-${idx}-${Date.now()}`,
        nombres: m.nombres || '',
        apellidos: m.apellidos || '',
        tipo_documento: 'CC',
        documento: m.documento || '',
        fecha_nacimiento: m.fecha_nacimiento || '',
        parentesco: m.nombre_rol || m.codigo_rol || 'Otro familiar / Pariente',
        identidad_genero: m.sexo === 'F' ? 'Femenino' : 'Masculino',
        grupo_etnico: 'Ninguno',
        telefono: m.telefono || '',
      })),
    );
    setHayAcompanantes(acomp.length > 0);
    setNumAcompanantes(Math.max(1, acomp.length));

    // Verificar si algún miembro del núcleo ya tiene solicitud en este evento
    const docsDelNucleo = [
      titular?.documento,
      ...todosMiembros.map((m: any) => m.documento),
    ].filter(Boolean);
    const solExistente = encontrarSolicitudExistenteNucleo(docsDelNucleo, nf.id_nucleo);
    if (solExistente && !editingSolicitudId && (registroModo === 'SOLICITUD_SOLO' || registroModo === 'ENTREGA_DIRECTA')) {
      showToast(
        `⚠️ Este núcleo familiar ya tiene registrada la solicitud ${solExistente.codigo_solicitud || `SOL-${solExistente.id_solicitud}`} a nombre de ${solExistente.nombre_completo}. Solo se permite una solicitud por núcleo familiar.`,
        'warning'
      );
    }
  };

  const handleBuscarPorNombreOCedula = async (termino?: string) => {
    const q = (termino ?? busquedaGeneralQuery ?? documento).trim();
    if (!q) {
      showToast('Ingresa un nombre, apellido o número de cédula para buscar.', 'warning');
      return;
    }
    setBuscandoNucleoDoc(true);
    try {
      const [resP, resN] = await Promise.all([
        apiClient.get('/nucleos-familiares/personas-busqueda', { params: { search: q, limit: 15 } }),
        apiClient.get('/nucleos-familiares', { params: { search: q, limit: 15 } }),
      ]);
      setResultadosBusquedaPersonas(Array.isArray(resP.data) ? resP.data : []);
      setResultadosBusquedaNucleos(Array.isArray(resN.data) ? resN.data : []);
      setMostrarResultadosBusqueda(true);
    } catch {
      showToast('Error al buscar personas y núcleos familiares.', 'error');
    } finally {
      setBuscandoNucleoDoc(false);
    }
  };

  const handleGuardarEdicionNucleoInline = async () => {
    if (!idNucleoVinculado) return;
    try {
      await apiClient.put(`/nucleos-familiares/${idNucleoVinculado}`, {
        nombre_nucleo: nombreNucleoVinculado.trim() || undefined,
        id_sector: sectorId,
        direccion: direccion.trim() || undefined,
        telefono_contacto: telefono.trim() || undefined,
      });
      setEditandoNucleoInline(false);
      showToast('Núcleo Familiar modificado (nombre, sector y dirección) y sincronizado con SIGA.', 'success');
    } catch {
      showToast('No se pudo actualizar el núcleo familiar.', 'error');
    }
  };

  const handleBuscarNucleoPorDocumento = async () => {
    if (!documento.trim()) {
      showToast('Ingresa primero el número de documento para buscar en SAD / SIGA.', 'warning');
      return;
    }
    setBuscandoNucleoDoc(true);
    try {
      const res = await apiClient.get(`/nucleos-familiares/por-documento/${encodeURIComponent(documento.trim())}`);
      const data = res.data;
      if (data?.encontrado && data?.persona) {
        const p = data.persona;
        if (p.nombres) setNombres(p.nombres);
        if (p.apellidos) setApellidos(p.apellidos);
        if (p.telefono) setTelefono(p.telefono);
        if (p.direccion) setDireccion(p.direccion);
        if (data.nucleo_familiar) {
          cargarDatosDesdeNucleo(data.nucleo_familiar, p);
          showToast(`Ciudadano y Núcleo Familiar (${data.nucleo_familiar.codigo_nucleo || data.nucleo_familiar.nombre_nucleo}) cargados automáticamente.`, 'success');
        } else {
          showToast('Ciudadano encontrado y autocompletado.', 'success');
        }
      } else {
        showToast('No se encontró un registro previo con ese documento; puedes registrarlo como nuevo.', 'warning');
      }
    } catch {
      showToast('Error al consultar núcleo familiar por documento.', 'error');
    } finally {
      setBuscandoNucleoDoc(false);
    }
  };

  // Coordinates
  const [latitud, setLatitud] = useState<number>(5.239971);
  const [longitud, setLongitud] = useState<number>(-75.782206);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Identificación Complementaria del Usuario (Opcional)
  const [edad, setEdad] = useState<string>('');
  const [esPropietario, setEsPropietario] = useState<boolean | null>(null);
  const [hayAcompanantes, setHayAcompanantes] = useState(false);
  const [numAcompanantes, setNumAcompanantes] = useState<number>(1);
  const [hayAdultosMayores, setHayAdultosMayores] = useState(false);
  const [numAdultosMayores, setNumAdultosMayores] = useState<number>(1);
  const [hayNinos, setHayNinos] = useState(false);
  const [numNinos, setNumNinos] = useState<number>(1);
  const [observacionIdentificacion, setObservacionIdentificacion] = useState('');

  // RUFE Form State - Section 2
  const [isRufeSectionOpen, setIsRufeSectionOpen] = useState(true);
  const [fechaRufe, setFechaRufe] = useState(new Date().toISOString().split('T')[0]);
  const [corregimiento, setCorregimiento] = useState('');
  const [residenciaHabitual, setResidenciaHabitual] = useState<boolean | null>(null);
  const [evacuadoResidencia, setEvacuadoResidencia] = useState<boolean | null>(null);
  const [formaTenenciaRufe, setFormaTenenciaRufe] = useState('PROPIETARIO');
  const [estadoBienRufe, setEstadoBienRufe] = useState('HABITABLE');
  const [tipoBienRufe, setTipoBienRufe] = useState('Vivienda');
  const [cultivoTipo, setCultivoTipo] = useState('');
  const [cultivoUnidad, setCultivoUnidad] = useState('Hectáreas');
  const [cultivoArea, setCultivoArea] = useState('');
  const [pecuarioEspecie, setPecuarioEspecie] = useState('');
  const [pecuarioCantidad, setPecuarioCantidad] = useState('');
  const [voboCmgrd, setVoboCmgrd] = useState(false);

  // Núcleo Familiar Dynamic Table (Bloque 2 RUFE)
  const [nucleoFamiliar, setNucleoFamiliar] = useState<
    Array<{
      id: string;
      nombres: string;
      apellidos: string;
      tipo_documento: string;
      documento: string;
      fecha_nacimiento: string;
      parentesco: string;
      identidad_genero: string;
      grupo_etnico: string;
      telefono: string;
    }>
  >([]);

  // Section 3: Indicadores Rápidos & Afectación del Inmueble
  const [evacuar, setEvacuar] = useState(false);
  const [visita, setVisita] = useState(false);
  const [censo, setCenso] = useState(false);
  const [albergue, setAlbergue] = useState(false);
  const [redApoyo, setRedApoyo] = useState(false);

  const [isTechoSectionOpen, setIsTechoSectionOpen] = useState(true);
  const [isEstructuraSectionOpen, setIsEstructuraSectionOpen] = useState(true);
  const [techoDamageLevel, setTechoDamageLevel] = useState<'Colapso Total' | 'Grave' | 'Leve' | 'Ninguno'>('Ninguno');
  const [estructuraDamageLevel, setEstructuraDamageLevel] = useState<'Colapso Total' | 'Grave' | 'Leve' | 'Ninguno'>('Ninguno');
  const [afectacionNivel, setAfectacionNivel] = useState<'Colapso Total' | 'Grave' | 'Leve' | 'Ninguno'>('Ninguno');
  const [userManualDamageLevel, setUserManualDamageLevel] = useState(false);
  const [observacionTecho, setObservacionTecho] = useState('');
  const [observacionEstructura, setObservacionEstructura] = useState('');
  const [observacionAfectacion, setObservacionAfectacion] = useState('');

  // Nuevos campos de Inmueble, Daños Paredes/Pisos y Estimación Económica (Cliente @FABI0L)
  const [subtipoEmergencia, setSubtipoEmergencia] = useState<'SOCIAL_E_INMUEBLE' | 'SOCIAL' | 'INMUEBLE'>('SOCIAL_E_INMUEBLE');
  const [tipoInmueble, setTipoInmueble] = useState<string>('Vivienda');
  const [paredesDamageLevel, setParedesDamageLevel] = useState<'Colapso Total' | 'Grave' | 'Leve' | 'Ninguno'>('Ninguno');
  const [pisosDamageLevel, setPisosDamageLevel] = useState<'Colapso Total' | 'Grave' | 'Leve' | 'Ninguno'>('Ninguno');
  const [otrosDanosDescripcion, setOtrosDanosDescripcion] = useState('');
  const [estimacionPerdidasPesos, setEstimacionPerdidasPesos] = useState<string>('0');
  const [propietarioNombre, setPropietarioNombre] = useState('');
  const [propietarioDocumento, setPropietarioDocumento] = useState('');
  const [propietarioTelefono, setPropietarioTelefono] = useState('');
  const [esPropietarioSolicitante, setEsPropietarioSolicitante] = useState<boolean>(true);
  const [costoEstimadoAyuda, setCostoEstimadoAyuda] = useState<string>('0');
  const [documentoReceptor, setDocumentoReceptor] = useState('');
  const [nombreReceptor, setNombreReceptor] = useState('');
  const [isParedesPisosOpen, setIsParedesPisosOpen] = useState(true);
  const [isInmuebleDatosOpen, setIsInmuebleDatosOpen] = useState(true);

  // Evolución Catálogo Kits, Tenencia y Ficha Catastral
  const [fichaCatastral, setFichaCatastral] = useState('');
  const [tipoTenencia, setTipoTenencia] = useState<'PROPIETARIO_RESIDENTE' | 'ARRENDATARIO' | 'PROPIETARIO_NO_RESIDENTE'>('PROPIETARIO_RESIDENTE');

  // JAC / Comunidad
  const [comunidadJacNombre, setComunidadJacNombre] = useState('');
  const [comunidadJacPersoneria, setComunidadJacPersoneria] = useState('');
  const [comunidadJacRepresentante, setComunidadJacRepresentante] = useState('');
  const [comunidadJacTelefono, setComunidadJacTelefono] = useState('');

  // Local Comercial
  const [esLocalComercial, setEsLocalComercial] = useState(false);
  const [comercioRazonSocial, setComercioRazonSocial] = useState('');
  const [comercioNitRut, setComercioNitRut] = useState('');
  const [comercioAfectacionMercancia, setComercioAfectacionMercancia] = useState('');

  // Infraestructuras Rurales (Finca: Casa, Beneficiadero de café, Casa de agregados, Bodega de insumos, Infraestructura pecuaria, etc.)
  const [infraestructurasRurales, setInfraestructurasRurales] = useState<
    Array<{
      tipo_infraestructura: string;
      nombre_identificador?: string;
      estado_dano: 'Leve' | 'Moderado' | 'Parcial' | 'Grave' | 'Colapso Total';
      observaciones: string;
      costo_estimado_reparacion: number;
    }>
  >([]);
  const [mostrarOtraInfraFinca, setMostrarOtraInfraFinca] = useState(false);
  const [otraInfraFincaNombre, setOtraInfraFincaNombre] = useState('');
  const [otraInfraFincaDano, setOtraInfraFincaDano] = useState<'Leve' | 'Moderado' | 'Grave' | 'Colapso Total'>('Moderado');

  // Entidades Donantes & Subcomponentes de Kits para entregas
  const [entidadesDonantes, setEntidadesDonantes] = useState<any[]>([]);
  const [selectedEntidadDonanteId, setSelectedEntidadDonanteId] = useState<number | null>(null);

  // Checklist & Item Quantities
  const [selectedSubtipos, setSelectedSubtipos] = useState<string[]>([]);
  const [cantidadesSubtipos, setCantidadesSubtipos] = useState<Record<string, number>>({});
  const [busquedaSubtipo, setBusquedaSubtipo] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<number>(0);

  // Section 4: Observaciones, Cantidad y Fotos de Evidencia
  const [observaciones, setObservaciones] = useState('');
  const [cantidadAyuda, setCantidadAyuda] = useState<number>(1);
  const [fotosEntrega, setFotosEntrega] = useState<string[]>([]);
  // Evidencias Fotográficas Específicas por Tipo de Afectación (Hasta 6 fotos cada una)
  const [fotosTecho, setFotosTecho] = useState<string[]>([]);
  const [fotosEstructura, setFotosEstructura] = useState<string[]>([]);

  // Formato Oficial: Banco de Materiales Gobierno de Anserma (Evaluación del Inmueble)
  const [bancoMateriales, setBancoMateriales] = useState<BancoMaterialItem[]>(() =>
    MATERIALES_BANCO_DEFAULT.map((m) => ({ ...m }))
  );
  const [solicitadoPorMateriales, setSolicitadoPorMateriales] = useState<string>('');
  const [mostrarAgregarMaterialInline, setMostrarAgregarMaterialInline] = useState<boolean>(false);
  const [nuevoMaterialNombre, setNuevoMaterialNombre] = useState<string>('');
  const [nuevoMaterialCantidad, setNuevoMaterialCantidad] = useState<string>('1');
  const [nuevoMaterialTipo, setNuevoMaterialTipo] = useState<string>('');

  // Estado para Visita Técnica y Re-evaluación de la Vivienda en el Formulario
  const [visitaProfesionalResponsable, setVisitaProfesionalResponsable] = useState<string>(
    user ? `${user.nombres || ''} ${user.apellidos || ''}`.trim() : ''
  );
  const [visitaCargoResponsable, setVisitaCargoResponsable] = useState<string>(
    'Técnico / Ingeniero Gestión del Riesgo - Obras Públicas'
  );
  const [visitaVerificacionReporte, setVisitaVerificacionReporte] = useState<'CONFIRMADO' | 'AJUSTADO' | 'DESCARTADO'>('CONFIRMADO');
  const [visitaDictamenHabitabilidad, setVisitaDictamenHabitabilidad] = useState<string>('HABITABLE');
  const [visitaObservacionesTecnicas, setVisitaObservacionesTecnicas] = useState<string>('');
  const [reporteInicialSnapshot, setReporteInicialSnapshot] = useState<{
    nivel_vivienda: string;
    nivel_techo: string;
    nivel_paredes: string;
    nivel_pisos: string;
    observaciones: string;
    total_visitas_previas: number;
    visitas_previas: any[];
  } | null>(null);

  // Filtro de Zona Urbana / Rural para Sectores & Observación del Sector
  const [sectorZoneFilter, setSectorZoneFilter] = useState<'all' | 'urbano' | 'rural'>('all');
  const [observacionSector, setObservacionSector] = useState('');

  // MAP TAB FILTERS
  const [mapEstadoFilter, setMapEstadoFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [mapCategoryFilter, setMapCategoryFilter] = useState<number>(0);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapZoneFilter, setMapZoneFilter] = useState<'all' | 'rural' | 'urbano'>('all');

  // Multi Damage filters
  const [isHousingDamageFilterActive, setIsHousingDamageFilterActive] = useState(false);
  const [selectedDamageLevels, setSelectedDamageLevels] = useState<string[]>(['Colapso Total', 'Grave', 'Leve']);
  const [isRoofDamageFilterActive, setIsRoofDamageFilterActive] = useState(false);
  const [selectedRoofDamageLevels, setSelectedRoofDamageLevels] = useState<string[]>(['Colapso Total', 'Grave', 'Leve']);

  // Sector filters
  const [selectedSectorIds, setSelectedSectorIds] = useState<number[]>([]);
  const [isSectorFilterModalOpen, setIsSectorFilterModalOpen] = useState(false);
  const [sectorSearchQuery, setSectorSearchQuery] = useState('');

  // Hierarchical Category / Subtipology filter modal
  const [isMultiFilterModalOpen, setIsMultiFilterModalOpen] = useState(false);
  const [selectedMultiCategoryIds, setSelectedMultiCategoryIds] = useState<number[]>([]);
  const [selectedSubtipologiaCodes, setSelectedSubtipologiaCodes] = useState<string[]>([]);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<number[]>([]);

  const [mapCurrentPage, setMapCurrentPage] = useState(1);
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);
  const [entregaSubTabModo, setEntregaSubTabModo] = useState<'NUEVA_ENTREGA' | 'HISTORIAL_ENTREGAS'>('NUEVA_ENTREGA');

  // Map Display Mode: 'sectores' (Conteo por Sector - default/principal) | 'individual' (Puntos) | 'ambos'
  const [mapDisplayMode, setMapDisplayMode] = useState<'sectores' | 'individual' | 'ambos'>('sectores');
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [mobileMapTab, setMobileMapTab] = useState<'mapa' | 'lista'>('mapa');
  const [selectedMapPinSol, setSelectedMapPinSol] = useState<any | null>(null);

  // Edit Mode state
  const [editingSolicitudId, setEditingSolicitudId] = useState<number | null>(null);
  const [editingSolicitudCodigo, setEditingSolicitudCodigo] = useState<string | null>(null);
  const [editingEntregaId, setEditingEntregaId] = useState<number | null>(null);
  const [editingEntregaCodigo, setEditingEntregaCodigo] = useState<string | null>(null);

  // Modals & Details
  const [detailedRequestId, setDetailedRequestId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [solicitudToDelete, setSolicitudToDelete] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // UI States
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [historialRegistros, setHistorialRegistros] = useState<any[]>([]);

  const showToast = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadCatalogs = async () => {
    try {
      const [secs, items, donantes] = await Promise.all([
        sacService.getSectores(),
        sacService.getItems(),
        sacService.getEntidadesDonantes(),
      ]);
      setSectores(secs);
      setItemsAyuda(items);
      setEntidadesDonantes(donantes);
      if (donantes && donantes.length > 0) {
        setSelectedEntidadDonanteId(donantes[0].id_entidad_donante);
      }
      if (secs.length > 0) {
        setSectorId(secs[0].id_sector);
        if (secs[0].latitud && secs[0].longitud) {
          setLatitud(secs[0].latitud);
          setLongitud(secs[0].longitud);
        }
      }
    } catch (e) {
      console.error('Error cargando catálogos', e);
    }
  };

  const loadEventos = async () => {
    try {
      const evs = await sacService.getEventos();
      setEventos(evs);
      if (evs.length > 0) {
        setSelectedEventoId(evs[0].id_evento);
        fetchSolicitudes(evs[0].id_evento);
        loadDashboard(evs[0].id_evento);
      }
    } catch (e) {
      console.error('Error cargando eventos', e);
    }
  };

  const loadDashboard = async (evId?: number) => {
    const targetEv = evId || selectedEventoId;
    try {
      const stats = await sacService.getEstadisticas(targetEv);
      setDashboardStats(stats);
    } catch (e) {
      console.error('Error cargando estadísticas', e);
    }
  };

  const fetchSolicitudes = async (evId?: number) => {
    const targetEv = evId || selectedEventoId;
    try {
      const [resSol, resEnt] = await Promise.all([
        sacService.getTodasSolicitudes('all', targetEv),
        sacService.getTodasEntregas(targetEv).catch(() => []),
      ]);
      setTodasSolicitudes(resSol);
      setTodasEntregas(Array.isArray(resEnt) ? resEnt : []);
    } catch (e) {
      console.error('Error al cargar solicitudes y entregas', e);
    }
  };

  useEffect(() => {
    loadCatalogs();
    loadEventos();
  }, []);

  const solicitudesPendientes = useMemo(() => {
    return todasSolicitudes.filter(
      (s) => s.estado_codigo === 'pending' && (!selectedEventoId || !s.id_evento || s.id_evento === selectedEventoId)
    );
  }, [todasSolicitudes, selectedEventoId]);

  const filteredListarSolicitudes = useMemo(() => {
    const q = deferredListarSearch.toLowerCase().trim();
    return todasSolicitudes.filter((s: any) => {
      if (listarEventoFiltro !== 'ALL' && s.id_evento && s.id_evento !== listarEventoFiltro) {
        return false;
      }
      if (listarEstadoFiltro === 'pending' && s.estado_codigo !== 'pending') {
        return false;
      }
      if (listarEstadoFiltro === 'completed' && s.estado_codigo !== 'completed') {
        return false;
      }
      if (listarSectorFiltro !== 'ALL' && Number(s.id_sector) !== Number(listarSectorFiltro)) {
        return false;
      }
      if (listarNivelDanoFiltro !== 'ALL' && (s.afectacion_nivel || 'Ninguno') !== listarNivelDanoFiltro) {
        return false;
      }
      if (!q) return true;
      const doc = String(s.documento || '').toLowerCase();
      const nom = `${s.nombres || ''} ${s.apellidos || ''} ${s.nombre_completo || ''}`.toLowerCase();
      const cod = String(s.codigo_solicitud || `SOL-${s.id_solicitud}`).toLowerCase();
      const codsEnt = String(s.codigos_entregas || '').toLowerCase();
      const sec = String(s.nombre_sector || '').toLowerCase();
      const dir = String(s.direccion_afectacion || s.direccion || '').toLowerCase();
      const tel = String(s.telefono || '').toLowerCase();
      const docsNuc = Array.isArray(s.documentos_nucleo) ? s.documentos_nucleo.join(' ').toLowerCase() : '';
      const nomsNuc = Array.isArray(s.nombres_nucleo) ? s.nombres_nucleo.join(' ').toLowerCase() : '';
      return (
        doc.includes(q) ||
        nom.includes(q) ||
        cod.includes(q) ||
        codsEnt.includes(q) ||
        sec.includes(q) ||
        dir.includes(q) ||
        tel.includes(q) ||
        docsNuc.includes(q) ||
        nomsNuc.includes(q)
      );
    });
  }, [todasSolicitudes, deferredListarSearch, listarEventoFiltro, listarEstadoFiltro, listarSectorFiltro, listarNivelDanoFiltro]);

  const filteredListarEntregas = useMemo(() => {
    const q = deferredListarSearch.toLowerCase().trim();
    return todasEntregas.filter((ent: any) => {
      if (listarEventoFiltro !== 'ALL' && ent.id_evento && ent.id_evento !== listarEventoFiltro) {
        return false;
      }
      if (listarSectorFiltro !== 'ALL' && Number(ent.id_sector) !== Number(listarSectorFiltro)) {
        return false;
      }
      if (!q) return true;
      const codEnt = String(ent.codigo_entrega || `ENT-${ent.id_entrega}`).toLowerCase();
      const codSol = String(ent.codigo_solicitud || `SOL-${ent.id_solicitud}`).toLowerCase();
      const docTit = String(ent.documento || '').toLowerCase();
      const nomTit = String(ent.nombre_completo || '').toLowerCase();
      const docRec = String(ent.documento_receptor || '').toLowerCase();
      const nomRec = String(ent.nombre_receptor || '').toLowerCase();
      const items = String(ent.items_resumen || '').toLowerCase();
      const sec = String(ent.nombre_sector || '').toLowerCase();
      const don = String(ent.nombre_entidad_donante || '').toLowerCase();
      const docsNuc = Array.isArray(ent.documentos_nucleo)
        ? ent.documentos_nucleo.join(' ').toLowerCase()
        : String(ent.documentos_nucleo || '').toLowerCase();
      const nomsNuc = Array.isArray(ent.nombres_nucleo)
        ? ent.nombres_nucleo.join(' ').toLowerCase()
        : String(ent.nombres_nucleo || '').toLowerCase();
      return (
        codEnt.includes(q) ||
        codSol.includes(q) ||
        docTit.includes(q) ||
        nomTit.includes(q) ||
        docRec.includes(q) ||
        nomRec.includes(q) ||
        items.includes(q) ||
        sec.includes(q) ||
        don.includes(q) ||
        docsNuc.includes(q) ||
        nomsNuc.includes(q)
      );
    });
  }, [todasEntregas, deferredListarSearch, listarEventoFiltro, listarSectorFiltro]);

  const filteredHistorialEntregas = useMemo(() => {
    const q = deferredHistorialSearch.toLowerCase().trim();
    return todasEntregas.filter((ent: any) => {
      if (selectedEventoId && ent.id_evento && ent.id_evento !== selectedEventoId) return false;
      if (historialSectorFiltro !== 'ALL' && Number(ent.id_sector) !== Number(historialSectorFiltro)) return false;
      if (!q) return true;
      const codEnt = String(ent.codigo_entrega || `ENT-${ent.id_entrega}`).toLowerCase();
      const codSol = String(ent.codigo_solicitud || `SOL-${ent.id_solicitud}`).toLowerCase();
      const docTit = String(ent.documento || '').toLowerCase();
      const nomTit = String(ent.nombre_completo || '').toLowerCase();
      const docRec = String(ent.documento_receptor || '').toLowerCase();
      const nomRec = String(ent.nombre_receptor || '').toLowerCase();
      const items = String(ent.items_resumen || '').toLowerCase();
      const sec = String(ent.nombre_sector || '').toLowerCase();
      const don = String(ent.nombre_entidad_donante || '').toLowerCase();
      const docsNuc = Array.isArray(ent.documentos_nucleo)
        ? ent.documentos_nucleo.join(' ').toLowerCase()
        : String(ent.documentos_nucleo || '').toLowerCase();
      const nomsNuc = Array.isArray(ent.nombres_nucleo)
        ? ent.nombres_nucleo.join(' ').toLowerCase()
        : String(ent.nombres_nucleo || '').toLowerCase();
      return (
        codEnt.includes(q) ||
        codSol.includes(q) ||
        docTit.includes(q) ||
        nomTit.includes(q) ||
        docRec.includes(q) ||
        nomRec.includes(q) ||
        items.includes(q) ||
        sec.includes(q) ||
        don.includes(q) ||
        docsNuc.includes(q) ||
        nomsNuc.includes(q)
      );
    });
  }, [todasEntregas, deferredHistorialSearch, selectedEventoId, historialSectorFiltro]);

  // Historial de entregas vinculadas a la solicitud seleccionada en el formulario
  const entregasDeSolicitudSeleccionada = useMemo(() => {
    const idSol = selectedRequest?.id_solicitud || selectedRequest?.id || editingSolicitudId;
    if (!idSol) return [];
    return todasEntregas.filter((e: any) => Number(e.id_solicitud) === Number(idSol));
  }, [todasEntregas, selectedRequest, editingSolicitudId]);

  useEffect(() => {
    setListarCurrentPage(1);
  }, [deferredListarSearch, listarEventoFiltro, listarEstadoFiltro, listarSectorFiltro, listarNivelDanoFiltro, listarPageSize, listarVistaModo]);

  const totalListarPages = useMemo(() => {
    const count = listarVistaModo === 'entregas' ? filteredListarEntregas.length : filteredListarSolicitudes.length;
    return Math.max(1, Math.ceil(count / listarPageSize));
  }, [filteredListarSolicitudes.length, filteredListarEntregas.length, listarPageSize, listarVistaModo]);

  const paginatedListarSolicitudes = useMemo(() => {
    const start = (listarCurrentPage - 1) * listarPageSize;
    return filteredListarSolicitudes.slice(start, start + listarPageSize);
  }, [filteredListarSolicitudes, listarCurrentPage, listarPageSize]);

  const paginatedListarEntregas = useMemo(() => {
    const start = (listarCurrentPage - 1) * listarPageSize;
    return filteredListarEntregas.slice(start, start + listarPageSize);
  }, [filteredListarEntregas, listarCurrentPage, listarPageSize]);

  const handleGuardarVisitaDirecta = async (payload: any) => {
    if (!visitaModalSolicitud?.id_solicitud) return;
    setSavingVisitaDirecta(true);
    try {
      const res = await sacService.registrarVisitaTecnica(visitaModalSolicitud.id_solicitud, payload);
      showToast(res.message || `¡Visita técnica registrada exitosamente para ${visitaModalSolicitud.codigo_solicitud || `SOL-${visitaModalSolicitud.id_solicitud}`}!`, 'success');
      setVisitaModalSolicitud(null);
      await fetchSolicitudes();
      loadDashboard();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Error al registrar la visita técnica.', 'error');
    } finally {
      setSavingVisitaDirecta(false);
    }
  };

  const checkIsRuralSector = (s: { nombre_sector?: string; id_tipo_sector?: number }) => {
    if (s.id_tipo_sector === 1) return true;
    if (s.id_tipo_sector === 2) return false;
    const name = (s.nombre_sector || '').toLowerCase();
    if (name.includes('vereda') || name.includes('corregimiento') || name.includes('finca')) return true;
    return false;
  };

  const sectoresFiltradosPorZona = useMemo(() => {
    return [...sectores]
      .filter((s) => {
        if (sectorZoneFilter === 'all') return true;
        const isRural = checkIsRuralSector(s);
        if (sectorZoneFilter === 'rural') return isRural;
        if (sectorZoneFilter === 'urbano') return !isRural;
        return true;
      })
      .sort((a, b) => a.nombre_sector.localeCompare(b.nombre_sector, 'es'));
  }, [sectores, sectorZoneFilter]);

  const sectoresSearchableOptions = useMemo(() => {
    return sectoresFiltradosPorZona.map((sec) => {
      const isRural = checkIsRuralSector(sec);
      const zoneTag = isRural ? ' [Rural]' : ' [Urbano]';
      return {
        value: sec.id_sector,
        label: `${sec.nombre_sector}${zoneTag}`,
      };
    });
  }, [sectoresFiltradosPorZona]);

  const isSelectedSectorRural = useMemo(() => {
    if (!sectorId) return false;
    const found = sectores.find((s) => s.id_sector === sectorId);
    return found ? checkIsRuralSector(found) : false;
  }, [sectores, sectorId]);

  const handleGetGps = () => {
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitud(Number(pos.coords.latitude.toFixed(6)));
          setLongitud(Number(pos.coords.longitude.toFixed(6)));
          setGpsLoading(false);
          showToast('Ubicación GPS capturada exitosamente', 'success');
        },
        () => {
          setGpsLoading(false);
          showToast('No fue posible obtener la ubicación GPS automática.', 'warning');
        },
      );
    } else {
      setGpsLoading(false);
      showToast('El navegador no soporta geolocalización.', 'error');
    }
  };

  const agregarFamiliar = () => {
    setNucleoFamiliar((prev) => [
      ...prev,
      {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        nombres: '',
        apellidos: '',
        tipo_documento: 'CC',
        documento: '',
        fecha_nacimiento: '',
        parentesco: 'Hijo(a), hijastro(a)',
        identidad_genero: 'M',
        grupo_etnico: 'Ninguno de los anteriores',
        telefono: '',
      },
    ]);
  };

  const actualizarFamiliar = (id: string, field: string, value: string) => {
    setNucleoFamiliar((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const eliminarFamiliar = (id: string) => {
    setNucleoFamiliar((prev) => prev.filter((item) => item.id !== id));
  };

  // Severity calculation
  const getSeverityRank = (level: string): number => {
    switch (level) {
      case 'Colapso Total': return 3;
      case 'Grave': return 2;
      case 'Leve': return 1;
      default: return 0;
    }
  };

  const getLevelFromRank = (rank: number): 'Colapso Total' | 'Grave' | 'Leve' | 'Ninguno' => {
    switch (rank) {
      case 3: return 'Colapso Total';
      case 2: return 'Grave';
      case 1: return 'Leve';
      default: return 'Ninguno';
    }
  };

  const getBotonNivelStyle = (lvl: 'Colapso Total' | 'Grave' | 'Leve' | 'Ninguno', isSelected: boolean) => {
    if (!isSelected) {
      return 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400';
    }
    switch (lvl) {
      case 'Colapso Total':
        return 'bg-rose-600 text-white font-extrabold border-rose-600 shadow-xs ring-2 ring-rose-300';
      case 'Grave':
        return 'bg-orange-500 text-white font-extrabold border-orange-500 shadow-xs ring-2 ring-orange-300';
      case 'Leve':
        return 'bg-amber-400 text-slate-950 font-black border-amber-400 shadow-xs ring-2 ring-amber-200';
      case 'Ninguno':
      default:
        return 'bg-slate-700 text-white font-extrabold border-slate-700 shadow-xs';
    }
  };

  const deducirNivelTecho = (subtipos: string[]): 'Colapso Total' | 'Grave' | 'Leve' | 'Ninguno' => {
    const sNorm = subtipos.map((s) => s.trim().replace(/\.$/, ''));
    if (
      sNorm.includes('Colapso total de techo/cubierta') ||
      sNorm.includes('Colapso total de techo en casa de la finca') ||
      sNorm.includes('Colapso total del techo')
    ) return 'Colapso Total';
    if (
      sNorm.includes('Colapso parcial de techo/cubierta') ||
      sNorm.includes('Colapso parcial de techo en casa de la finca') ||
      sNorm.includes('Colapso parcial de techo') ||
      sNorm.includes('Colapso de techo en casilla de secado / elba / pasera') ||
      sNorm.includes('Daño en techo / cubierta de beneficiadero de café')
    ) return 'Grave';
    if (
      sNorm.includes('Daño en techo/cubierta (tejas movidas o rotas)') ||
      sNorm.includes('Daño en techo de casa principal (tejas movidas o rotas)') ||
      sNorm.includes('Daño en el techo (tejas movidas o rotas)') ||
      sNorm.includes('Desprendimiento de cielo raso') ||
      sNorm.includes('Daño en vidrios/ventanas') ||
      sNorm.includes('Daño en techo de establo / corral') ||
      sNorm.includes('Daño en techo de cochera / porqueriza') ||
      sNorm.includes('Daño en techo de galpón avícola') ||
      sNorm.includes('Desprendimiento o rotura en marquesina / secadero') ||
      sNorm.includes('Daño en techo de trapiche / enramada panelera') ||
      sNorm.includes('Daño en vidrios/ventanas o puertas de acceso')
    ) {
      return 'Leve';
    }
    return 'Ninguno';
  };

  const deducirNivelParedes = (subtipos: string[]): 'Colapso Total' | 'Grave' | 'Leve' | 'Ninguno' => {
    const sNorm = subtipos.map((s) => s.trim().replace(/\.$/, ''));
    if (
      sNorm.includes('Colapso total de muros/paredes') ||
      sNorm.includes('Colapso total de muros en casa de la finca') ||
      sNorm.includes('Colapso total de muros') ||
      sNorm.includes('Vivienda inhabitable / requiere demolición') ||
      sNorm.includes('Edificación inoperativa / requiere cierre preventivo') ||
      sNorm.includes('Pérdida total de banca / cierre vial')
    ) {
      return 'Colapso Total';
    }
    if (
      sNorm.includes('Colapso parcial de muros/paredes') ||
      sNorm.includes('Colapso parcial de muros en casa de la finca') ||
      sNorm.includes('Colapso parcial de muros') ||
      sNorm.includes('Afectación estructural / colapso en beneficiadero de café') ||
      sNorm.includes('Afectación estructural / colapso en casilla de secado') ||
      sNorm.includes('Afectación estructural / colapso en casilla de secado / elba / pasera') ||
      sNorm.includes('Afectación estructural / colapso en establos / corrales') ||
      sNorm.includes('Afectación estructural / colapso en cocheras / porquerizas') ||
      sNorm.includes('Afectación estructural / colapso en galpones avícolas / gallineros') ||
      sNorm.includes('Daño estructural en marquesina / silo') ||
      sNorm.includes('Daño estructural en marquesina / silo de secado') ||
      sNorm.includes('Agrietamiento/fisuras en columnas o vigas') ||
      sNorm.includes('Vivienda inclinada') ||
      sNorm.includes('Colapso total en zona de servicios') ||
      sNorm.includes('Falla o colapso de muro de contención / gaviones')
    ) {
      return 'Grave';
    }
    if (
      sNorm.includes('Agrietamiento/fisuras en paredes') ||
      sNorm.includes('Agrietamiento/fisuras en paredes de casa principal') ||
      sNorm.includes('Afectación en bodega de insumos / herramientas / agroquímicos') ||
      sNorm.includes('Afectación en trapiche panelero / enramada') ||
      sNorm.includes('Daño en bocatoma / tanques de reserva / acueducto predial') ||
      sNorm.includes('Colapso Parcial en zona de servicios') ||
      sNorm.includes('Daño/despolme fachada')
    ) {
      return 'Leve';
    }
    return 'Ninguno';
  };

  const deducirNivelPisos = (subtipos: string[]): 'Colapso Total' | 'Grave' | 'Leve' | 'Ninguno' => {
    const tieneHundimiento = subtipos.includes('Hundimiento/asentamiento de estructura');
    const tieneColapsoServicios = subtipos.includes('Colapso total en zona de servicios');
    const tieneDanoPisos = subtipos.includes('Daño en pisos/baldosas') || subtipos.includes('Daño en pisos/baldosas o zonas comunes');
    const tieneDanoTerrenoRural = subtipos.includes('Hundimiento / agrietamiento de terreno o caminos internos') || subtipos.includes('Deslizamiento / pérdida de cultivos o pastos');

    if (tieneHundimiento && tieneColapsoServicios) return 'Colapso Total';
    if (tieneHundimiento || tieneColapsoServicios || tieneDanoTerrenoRural) return 'Grave';
    if (
      tieneDanoPisos ||
      subtipos.includes('Colapso Parcial en zona de servicios') ||
      subtipos.includes('Agrietamiento / hundimiento de calzada')
    ) {
      return 'Leve';
    }
    return 'Ninguno';
  };

  const sincronizarDanosegunSubtipos = (subtipos: string[]) => {
    const nuevoTecho = deducirNivelTecho(subtipos);
    const nuevasParedes = deducirNivelParedes(subtipos);
    const nuevosPisos = deducirNivelPisos(subtipos);
    const nuevaEstructura = getLevelFromRank(
      Math.max(getSeverityRank(nuevasParedes), getSeverityRank(nuevosPisos))
    );

    setTechoDamageLevel(nuevoTecho);
    setParedesDamageLevel(nuevasParedes);
    setPisosDamageLevel(nuevosPisos);
    setEstructuraDamageLevel(nuevaEstructura);

    // Calcular nivel global consolidado (incluyendo si requiere evacuar)
    const maxRank = Math.max(
      getSeverityRank(nuevoTecho),
      getSeverityRank(nuevasParedes),
      getSeverityRank(nuevosPisos),
      evacuar ? 2 : 0
    );
    setAfectacionNivel(getLevelFromRank(maxRank));
  };

  const cambiarNivelParedesManual = (lvl: 'Colapso Total' | 'Grave' | 'Leve' | 'Ninguno') => {
    setParedesDamageLevel(lvl);
    const maxEstructura = getLevelFromRank(Math.max(getSeverityRank(lvl), getSeverityRank(pisosDamageLevel)));
    setEstructuraDamageLevel(maxEstructura);
    const maxGlobal = getLevelFromRank(
      Math.max(getSeverityRank(techoDamageLevel), getSeverityRank(lvl), getSeverityRank(pisosDamageLevel), evacuar ? 2 : 0)
    );
    setAfectacionNivel(maxGlobal);
  };

  const cambiarNivelPisosManual = (lvl: 'Colapso Total' | 'Grave' | 'Leve' | 'Ninguno') => {
    setPisosDamageLevel(lvl);
    const maxEstructura = getLevelFromRank(Math.max(getSeverityRank(paredesDamageLevel), getSeverityRank(lvl)));
    setEstructuraDamageLevel(maxEstructura);
    const maxGlobal = getLevelFromRank(
      Math.max(getSeverityRank(techoDamageLevel), getSeverityRank(paredesDamageLevel), getSeverityRank(lvl), evacuar ? 2 : 0)
    );
    setAfectacionNivel(maxGlobal);
  };

  const cambiarNivelTechoManual = (lvl: 'Colapso Total' | 'Grave' | 'Leve' | 'Ninguno') => {
    setTechoDamageLevel(lvl);
    const maxGlobal = getLevelFromRank(
      Math.max(getSeverityRank(lvl), getSeverityRank(paredesDamageLevel), getSeverityRank(pisosDamageLevel), evacuar ? 2 : 0)
    );
    setAfectacionNivel(maxGlobal);
  };

  const actualizarNivelTecho = cambiarNivelTechoManual;
  const actualizarNivelEstructura = cambiarNivelParedesManual;

  const handleToggleEvacuar = () => {
    const nextVal = !evacuar;
    setEvacuar(nextVal);
    if (nextVal) {
      setAfectacionNivel('Grave');
      setUserManualDamageLevel(true);
      showToast('Evacuación activada: Nivel de afectación ajustado a GRAVE.', 'warning');
    } else {
      setAlbergue(false);
      setRedApoyo(false);
    }
  };

  const handleToggleAlbergue = () => {
    if (!evacuar) {
      showToast('La opción de Albergue requiere haber activado la Evacuación.', 'warning');
      return;
    }
    const nextVal = !albergue;
    setAlbergue(nextVal);
    if (nextVal) setRedApoyo(false);
  };

  const handleToggleRedApoyo = () => {
    if (!evacuar) {
      showToast('La opción de Red de Apoyo requiere haber activado la Evacuación.', 'warning');
      return;
    }
    const nextVal = !redApoyo;
    setRedApoyo(nextVal);
    if (nextVal) setAlbergue(false);
  };

  // Tipo de Inmueble Afectado (Vivienda, Finca, Local comercial, Vía, Colegio, Hospital, Inmueble Público, Otros)
  const TIPOS_INMUEBLE_AFECTADO = ['Vivienda', 'Finca', 'Local comercial', 'Vía', 'Colegio', 'Hospital', 'Inmueble Público', 'Otros'];
  const normalizarTipoInmueble = (t: string): string => {
    const legacy: Record<string, string> = {
      Casa: 'Vivienda',
      Apartamento: 'Vivienda',
      Carretera: 'Vía',
      'Institución educativa': 'Colegio',
      'Finca (Predio Rural)': 'Finca',
      'Predio Rural': 'Finca',
      Otro: 'Otros',
    };
    return legacy[t] || t;
  };
  const tipoInmuebleActual = normalizarTipoInmueble(tipoInmueble);
  const esVia = tipoInmuebleActual === 'Vía';
  const esVivienda = tipoInmuebleActual === 'Vivienda';
  const esFinca = tipoInmuebleActual === 'Finca' || (tipoInmuebleActual !== 'Vía' && tipoInmuebleActual !== 'Local comercial' && sectorZoneFilter === 'rural');
  const seleccionarTipoInmueble = (t: string) => {
    setTipoInmueble(t);
    const rufeMap: Record<string, string> = {
      Vivienda: 'Vivienda',
      Finca: 'Finca',
      'Local comercial': 'Local Comercial',
      Colegio: 'Centro Educativo / Escuela',
      Hospital: 'Hospital',
      'Inmueble Público': 'Alcaldía Municipal',
    };
    if (rufeMap[t]) setTipoBienRufe(rufeMap[t]);
  };
  const DANOS_FINCA_TECHO_CASA: string[] = [
    'Sin daño relevante en el techo.',
    'Daño en el techo (tejas movidas o rotas).',
    'Colapso parcial de techo.',
    'Colapso total del techo.',
  ];

  const DANOS_FINCA_TECHO_OTRAS: string[] = [
    'Colapso de techo en casilla de secado / elba / pasera',
    'Daño en techo / cubierta de beneficiadero de café',
    'Daño en techo de cochera / porqueriza',
    'Daño en techo de establo / corral',
    'Desprendimiento o rotura en marquesina / secadero',
    'Daño en techo de galpón avícola',
    'Daño en techo de trapiche / enramada panelera',
  ];

  const DANOS_FINCA_MUROS_CASA: string[] = [
    'Sin daño relevante en paredes / muros.',
    'Agrietamiento/fisuras en paredes de casa principal.',
    'Colapso parcial de muros en casa de la finca.',
    'Colapso total de muros en casa de la finca.',
  ];

  const DANOS_FINCA_MUROS_OTRAS: string[] = [
    'Afectación estructural / colapso en beneficiadero de café',
    'Afectación estructural / colapso en casilla de secado / elba / pasera',
    'Afectación estructural / colapso en establos / corrales',
    'Afectación estructural / colapso en cocheras / porquerizas',
    'Afectación estructural / colapso en galpones avícolas / gallineros',
    'Daño estructural en marquesina / silo de secado',
    'Afectación en bodega de insumos / herramientas / agroquímicos',
    'Afectación en trapiche panelero / enramada',
    'Daño en bocatoma / tanques de reserva / acueducto predial',
    'Hundimiento / agrietamiento de terreno o caminos internos',
    'Deslizamiento / pérdida de cultivos o pastos',
  ];

  const tituloPanel1 = esVia
    ? '1. Afectación en Calzada, Banca y Tránsito'
    : esFinca
    ? '1. Afectación en Techos / Cubiertas de la Finca (Vivienda, Beneficiadero, Casilla, Establo)'
    : esVivienda
    ? '1. Afectación Específica en Techo / Cubierta'
    : `1. Afectación en Cubierta, Ventanería e Instalaciones (${tipoInmuebleActual})`;
  const tituloPanel2 = esVia
    ? '2. Afectación en Obras de Arte, Puentes, Drenajes y Taludes'
    : esFinca
    ? '2. Afectación en Estructuras, Muros e Instalaciones Productivas de la Finca'
    : esVivienda
    ? '2. Afectación Específica en Estructura / Muros'
    : `2. Afectación en Estructura, Muros y Operatividad (${tipoInmuebleActual})`;
  const danosPanel1: string[] = esVia
    ? [
        'Pérdida parcial de banca / calzada',
        'Pérdida total de banca / cierre vial',
        'Derrumbe / obstrucción por material o lodo',
        'Agrietamiento / hundimiento de calzada',
        'Afectación en afirmado / placa huella',
      ]
    : esFinca
    ? [
        'Daño en techo de casa principal (tejas movidas o rotas)',
        'Colapso parcial de techo en casa de la finca',
        'Colapso total de techo en casa de la finca',
        'Daño en techo / cubierta de beneficiadero de café',
        'Colapso de techo en casilla de secado / elba / pasera',
        'Daño en techo de establo / corral',
        'Daño en techo de cochera / porqueriza',
        'Daño en techo de galpón avícola',
        'Desprendimiento o rotura en marquesina / secadero',
        'Daño en techo de trapiche / enramada panelera',
      ]
    : esVivienda
    ? [
        'Daño en techo/cubierta (tejas movidas o rotas)',
        'Colapso parcial de techo/cubierta',
        'Colapso total de techo/cubierta',
        'Desprendimiento de cielo raso',
        'Daño en vidrios/ventanas',
      ]
    : [
        'Daño en techo/cubierta (tejas movidas o rotas)',
        'Colapso parcial de techo/cubierta',
        'Colapso total de techo/cubierta',
        'Desprendimiento de cielo raso',
        'Daño en vidrios/ventanas o puertas de acceso',
        'Afectación en redes eléctricas, hidrosanitarias o conectividad',
      ];
  const danosPanel2: string[] = esVia
    ? [
        'Colapso o taponamiento de alcantarillas / cunetas',
        'Afectación estructural en puente o pontón',
        'Falla o colapso de muro de contención / gaviones',
        'Inestabilidad de talud superior / inferior',
        'Caída de postes, árboles o redes sobre la vía',
      ]
    : esFinca
    ? [
        'Agrietamiento/fisuras en paredes de casa principal',
        'Colapso parcial de muros en casa de la finca',
        'Colapso total de muros en casa de la finca',
        'Afectación estructural / colapso en beneficiadero de café',
        'Afectación estructural / colapso en casilla de secado / elba / pasera',
        'Afectación estructural / colapso en establos / corrales',
        'Afectación estructural / colapso en cocheras / porquerizas',
        'Afectación estructural / colapso en galpones avícolas / gallineros',
        'Daño estructural en marquesina / silo de secado',
        'Afectación en bodega de insumos / herramientas / agroquímicos',
        'Afectación en trapiche panelero / enramada',
        'Daño en bocatoma / tanques de reserva / acueducto predial',
        'Hundimiento / agrietamiento de terreno o caminos internos',
        'Deslizamiento / pérdida de cultivos o pastos',
      ]
    : esVivienda
    ? [
        'Agrietamiento/fisuras en paredes',
        'Vivienda inclinada',
        'Agrietamiento/fisuras en columnas o vigas',
        'Colapso parcial de muros/paredes',
        'Colapso total de muros/paredes',
        'Daño en pisos/baldosas',
        'Colapso Parcial en zona de servicios',
        'Colapso total en zona de servicios',
        'Hundimiento/asentamiento de estructura',
        'Daño/despolme fachada',
        'Vivienda inhabitable / requiere demolición',
      ]
    : [
        'Agrietamiento/fisuras en paredes',
        'Agrietamiento/fisuras en columnas o vigas',
        'Colapso parcial de muros/paredes',
        'Colapso total de muros/paredes',
        'Daño en pisos/baldosas o zonas comunes',
        'Hundimiento/asentamiento de estructura',
        'Afectación de mobiliario, equipos o insumos',
        'Edificación inoperativa / requiere cierre preventivo',
      ];
  const descNivelDano: Record<string, string> = esVia
    ? {
        Ninguno: 'Tránsito normal',
        Leve: 'Paso restringido',
        Grave: 'Paso a un carril',
        'Colapso Total': 'Cierre total / pérdida de banca',
      }
    : {
        Ninguno: esVivienda ? 'Habitable' : 'Operativo',
        Leve: 'Uso con precaución',
        Grave: 'Requiere reparación',
        'Colapso Total': esVivienda ? 'No habitable' : 'Inoperativo / cierre',
      };

  // Selección tipo radio (única opción por componente) con posibilidad de deseleccionar
  const selectRadioSubtipo = (item: string, panelItems: string[]) => {
    if (selectedSubtipos.includes(item)) {
      setSelectedSubtipos((prev) => prev.filter((x) => x !== item));
    } else {
      setSelectedSubtipos((prev) => [...prev.filter((x) => !panelItems.includes(x)), item]);
    }
  };

  // Validación de campos mínimos obligatorios antes de avanzar de paso en el formulario
  const validarPasoActual = (targetStep: number): boolean => {
    if (registroModo === 'ENTREGA_EXISTENTE') return true;
    if (targetStep <= formStepTab) return true;

    if (formStepTab === 1) {
      const faltantes: string[] = [];
      if (!selectedEventoId) faltantes.push('Evento Activo');
      if (!documento.trim()) faltantes.push('Cédula / Documento');
      if (!nombres.trim()) faltantes.push('Nombres');
      if (!apellidos.trim()) faltantes.push('Apellidos');
      if (!sectorId) faltantes.push('Sector / Barrio / Vereda');

      if (faltantes.length > 0) {
        showToast(
          `Debe completar los campos obligatorios antes de continuar: ${faltantes.join(', ')}`,
          'warning'
        );
        return false;
      }
    }
    return true;
  };

  const handleCambiarPaso = (targetStep: 1 | 2 | 3 | 4 | 5 | 6) => {
    if (!validarPasoActual(targetStep)) return;
    setFormStepTab(targetStep);
  };

  // Preset Packages
  const PRESET_PACKAGES: Record<string, { label: string; items: string[] }> = {
    AFECTACION_VIVIENDA: {
      label: 'Afectación Vivienda',
      items: [
        'Tejas de Zinc (Unidades)',
        'Madera, Listones y Volaretas (Tablas/Listones)',
        'Amarres, Ganchos, Pernos y Puntillas',
        'Refugio de Emergencia (Carpas / Plásticos Calibre 8)',
      ],
    },
    MATERIALES_OBRA: {
      label: 'Materiales Obra (Cemento, Tejas, Ladrillos)',
      items: [
        'Cemento y Mortero (Bultos)',
        'Tejas de Zinc (Unidades)',
        'Ladrillos y Bloques de Concreto (Unidades)',
        'Acero de Refuerzo, Varillas y Mallas',
      ],
    },
    ALIMENTOS_ASEO: {
      label: 'Kit Mercado + Aseo',
      items: [
        'Kit de mercado',
        'Kit de Aseo e Higiene Personal Familiar',
        'Kit de Hidratación y Agua Potable (Garrafones/Sobres)',
      ],
    },
    ADULTO_MAYOR: {
      label: 'Kit Pañales + Salud',
      items: [
        'Pañales Adulto M/L/XL y Sabanillas',
        'Medicamentos Básicos (Analgésicos / Antihistamínicos)',
        'Primeros Auxilios y Material de Curación (Gasas / Vendas)',
      ],
    },
    REFUGIO_TECHOS: {
      label: 'Kit Techo + Refugio',
      items: [
        'Tejas de Zinc (Unidades)',
        'Kit de Pernoctación (Colchonetas Impermeables / Cobijas Térmicas)',
        'Refugio de Emergencia (Carpas / Plásticos Calibre 8)',
      ],
    },
    ARREGLO_VIA: {
      label: 'Kit Arreglo de Vía',
      items: [
        'Afirmado',
        'Maquinaria',
        'Gasolina',
        'Cemento',
        'Mano de obra',
        'Entre otros',
      ],
    },
  };

  const isPaqueteActivo = (key: string): boolean => {
    const pkg = PRESET_PACKAGES[key];
    if (!pkg) return false;
    return pkg.items.every((item) => selectedSubtipos.includes(item));
  };

  const aplicarPaqueteRapido = (key: string) => {
    const pkg = PRESET_PACKAGES[key];
    if (!pkg) return;
    const active = isPaqueteActivo(key);
    if (active) {
      const next = selectedSubtipos.filter((item) => !pkg.items.includes(item));
      setSelectedSubtipos(next);
      sincronizarDanosegunSubtipos(next);
      showToast(`Desmarcado paquete: ${pkg.label}`, 'warning');
    } else {
      const next = [...selectedSubtipos];
      pkg.items.forEach((item) => {
        if (!next.includes(item)) next.push(item);
      });
      setSelectedSubtipos(next);
      setCantidadesSubtipos((prev) => {
        const cpy = { ...prev };
        pkg.items.forEach((item) => {
          if (!cpy[item]) cpy[item] = 1;
        });
        return cpy;
      });
      sincronizarDanosegunSubtipos(next);
      showToast(`Seleccionado paquete: ${pkg.label}`, 'success');
    }
  };

  const MUTUAS_EXCLUSIONES: Record<string, string[]> = {
    'Colapso parcial de muros/paredes': ['Colapso total de muros/paredes', 'Sin daño visible'],
    'Colapso total de muros/paredes': ['Colapso parcial de muros/paredes', 'Sin daño visible'],
    'Colapso parcial de techo/cubierta': ['Colapso total de techo/cubierta', 'Sin daño visible'],
    'Colapso total de techo/cubierta': ['Colapso parcial de techo/cubierta', 'Sin daño visible'],
    'Colapso Parcial en zona de servicios': ['Colapso total en zona de servicios', 'Sin daño visible'],
    'Colapso total en zona de servicios': ['Colapso Parcial en zona de servicios', 'Sin daño visible'],
    'Sin daño visible': [
      'Colapso parcial de muros/paredes',
      'Colapso total de muros/paredes',
      'Colapso parcial de techo/cubierta',
      'Colapso total de techo/cubierta',
      'Colapso Parcial en zona de servicios',
      'Colapso total en zona de servicios',
      'Agrietamiento/fisuras en paredes',
      'Vivienda inclinada',
      'Agrietamiento/fisuras en columnas o vigas',
      'Daño en techo/cubierta (tejas movidas o rotas)',
      'Desprendimiento de cielo raso',
      'Daño en pisos/baldosas',
      'Hundimiento/asentamiento de estructura',
      'Daño/despolme fachada',
      'Vivienda inhabitable / requiere demolición',
      'Daño en vidrios/ventanas'
    ]
  };

  const toggleSubtipo = (nombre: string) => {
    let nextSubtipos: string[];
    const isCurrentlySelected = selectedSubtipos.includes(nombre);
    if (isCurrentlySelected) {
      nextSubtipos = selectedSubtipos.filter((item) => item !== nombre);
      setSelectedSubtipos(nextSubtipos);
    } else {
      const excluidos = MUTUAS_EXCLUSIONES[nombre] || [];
      // Si se selecciona un daño físico, remover 'Sin daño visible'
      const autoExcluir = [...excluidos];
      if (nombre !== 'Sin daño visible' && !autoExcluir.includes('Sin daño visible')) {
        autoExcluir.push('Sin daño visible');
      }

      setCantidadesSubtipos((prev) => ({ ...prev, [nombre]: prev[nombre] || 1 }));
      nextSubtipos = [...selectedSubtipos.filter((item) => !autoExcluir.includes(item)), nombre];
      setSelectedSubtipos(nextSubtipos);
    }

    // Sincronizar automáticamente la evaluación de daños (Techo, Paredes, Pisos y Nivel Global)
    sincronizarDanosegunSubtipos(nextSubtipos);
  };

  const handleCantidadSubtipoChange = (nombre: string, val: number) => {
    const valid = Math.max(1, val);
    setCantidadesSubtipos((prev) => ({ ...prev, [nombre]: valid }));
  };

  // Multiple Photo Uploads (Máximo 6 fotos en Solicitudes y Entregas)
  const handleMultiplePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const remainingSlots = Math.max(0, 6 - fotosEntrega.length);
      if (remainingSlots <= 0) {
        showToast('Ya has alcanzado el límite máximo de 6 fotos.', 'warning');
        return;
      }
      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      filesToProcess.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setFotosEntrega((prev) => (prev.length < 6 ? [...prev, reader.result as string] : prev));
          }
        };
        reader.readAsDataURL(file);
      });
      showToast(`${filesToProcess.length} imagen(es) adjuntada(s) (Máximo 6)`, 'success');
    }
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setFotosEntrega((prev) => prev.filter((_, i) => i !== index));
  };

  // Manejo de Fotos Específicas de Techo / Cubierta (Hasta 6 fotos)
  const handleFotosTechoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const remainingSlots = Math.max(0, 6 - fotosTecho.length);
      if (remainingSlots <= 0) {
        showToast('Ya has alcanzado el límite máximo de 6 fotos para Techo / Cubierta.', 'warning');
        return;
      }
      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      filesToProcess.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setFotosTecho((prev) => (prev.length < 6 ? [...prev, reader.result as string] : prev));
          }
        };
        reader.readAsDataURL(file);
      });
      showToast(`${filesToProcess.length} foto(s) de techo adjuntada(s) (Máximo 6)`, 'success');
    }
    e.target.value = '';
  };

  const removeFotoTecho = (index: number) => {
    setFotosTecho((prev) => prev.filter((_, i) => i !== index));
  };

  // Manejo de Fotos Específicas de Estructura / Muros (Hasta 6 fotos)
  const handleFotosEstructuraUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const remainingSlots = Math.max(0, 6 - fotosEstructura.length);
      if (remainingSlots <= 0) {
        showToast('Ya has alcanzado el límite máximo de 6 fotos para Estructura / Muros.', 'warning');
        return;
      }
      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      filesToProcess.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setFotosEstructura((prev) => (prev.length < 6 ? [...prev, reader.result as string] : prev));
          }
        };
        reader.readAsDataURL(file);
      });
      showToast(`${filesToProcess.length} foto(s) de estructura adjuntada(s) (Máximo 6)`, 'success');
    }
    e.target.value = '';
  };

  const removeFotoEstructura = (index: number) => {
    setFotosEstructura((prev) => prev.filter((_, i) => i !== index));
  };

  const totalCantidadCalculada = useMemo(() => {
    return selectedSubtipos.reduce((acc, sub) => acc + (cantidadesSubtipos[sub] || 1), 0);
  }, [selectedSubtipos, cantidadesSubtipos]);

  // Determinar el perfil de ayuda aplicable según la solicitud o formulario (Dueño del inmueble, Ayuda humanitaria, Infraestructura, o Vía)
  const perfilAyudaInfo = useMemo(() => {
    const reqRef =
      registroModo === 'ENTREGA_EXISTENTE' && selectedRequest
        ? todasSolicitudes.find((s: any) => Number(s.id_solicitud) === Number(selectedRequest.id_solicitud)) || selectedRequest
        : null;

    const effTipoInmueble = normalizarTipoInmueble(
      reqRef?.tipo_inmueble || tipoInmuebleActual || 'Vivienda'
    );
    const effSubtipo = (reqRef?.subtipo_emergencia || subtipoEmergencia || 'SOCIAL_E_INMUEBLE').toUpperCase();
    const effTenencia = (reqRef?.tipo_tenencia || tipoTenencia || 'PROPIETARIO_RESIDENTE').toUpperCase();
    const effEsPropietario =
      reqRef?.es_propietario !== undefined && reqRef?.es_propietario !== null
        ? Boolean(reqRef.es_propietario)
        : esPropietario !== null
          ? esPropietario
          : effTenencia !== 'ARRENDATARIO';

    if (effTipoInmueble === 'Vía') {
      return {
        codigo: 'VIA' as const,
        titulo: 'Arreglo de Vía y Maquinaria',
        descripcion: 'Se muestran únicamente las ayudas de maquinaria, insumos viales y materiales de obra (sin ayuda humanitaria).',
        categoriasIds: [6, 9, 11],
        paquetesKeys: ['ARREGLO_VIA', 'MATERIALES_OBRA'],
      };
    }

    if (
      effSubtipo === 'INMUEBLE' ||
      effTenencia === 'PROPIETARIO_NO_RESIDENTE' ||
      effTenencia === 'PROPIETARIO_NO_HABITANTE' ||
      ['Colegio', 'Hospital', 'Inmueble Público'].includes(effTipoInmueble)
    ) {
      return {
        codigo: 'INFRAESTRUCTURA' as const,
        titulo: 'Solo Infraestructura / Materiales de Construcción',
        descripcion: 'Se muestran únicamente materiales de construcción y vivienda (no aparece ayuda humanitaria ni arreglo de vías).',
        categoriasIds: [6],
        paquetesKeys: ['AFECTACION_VIVIENDA', 'MATERIALES_OBRA'],
      };
    }

    if (effSubtipo === 'SOCIAL' || effTenencia === 'ARRENDATARIO' || effEsPropietario === false) {
      return {
        codigo: 'HUMANITARIA' as const,
        titulo: 'Solo Ayuda Humanitaria y Alojamiento Temporal (Arrendatario / Social)',
        descripcion: 'Se muestran únicamente ayudas humanitarias, kits de subsistencia y alojamiento temporal / subsidio de arrendamiento (sin materiales de construcción ni vías).',
        categoriasIds: [1, 2, 3, 4, 5, 7, 8],
        paquetesKeys: ['ALIMENTOS_ASEO', 'ADULTO_MAYOR'],
      };
    }

    return {
      codigo: 'DUENO_INTEGRAL' as const,
      titulo: 'Dueño del Inmueble Residente (Vivienda, Materiales y Ayuda Humanitaria)',
      descripcion: 'Al ser propietario residente del inmueble, aplica ayuda de vivienda, materiales de construcción, alojamiento temporal y asistencia humanitaria (sin vías).',
      categoriasIds: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      paquetesKeys: ['AFECTACION_VIVIENDA', 'MATERIALES_OBRA', 'REFUGIO_TECHOS', 'ALIMENTOS_ASEO', 'ADULTO_MAYOR'],
    };
  }, [registroModo, selectedRequest, todasSolicitudes, tipoInmuebleActual, subtipoEmergencia, tipoTenencia, esPropietario]);

  const categoriasDisponiblesParaAyuda = useMemo(() => {
    return DISASTER_TYPOLOGIES.filter(
      (t) => t.id !== 10 && perfilAyudaInfo.categoriasIds.includes(t.id)
    );
  }, [perfilAyudaInfo]);

  const filteredTipologias = useMemo(() => {
    return categoriasDisponiblesParaAyuda.map((tipo) => {
      if (categoriaFiltro !== 0 && tipo.id !== categoriaFiltro) {
        return null;
      }
      const subFiltrados = tipo.subtipos.filter(
        (sub) =>
          sub.nombre.toLowerCase().includes(busquedaSubtipo.toLowerCase()) ||
          tipo.nombre.toLowerCase().includes(busquedaSubtipo.toLowerCase()),
      );
      if (subFiltrados.length === 0) return null;
      return {
        ...tipo,
        subtipos: subFiltrados,
      };
    }).filter(Boolean) as typeof DISASTER_TYPOLOGIES;
  }, [categoriasDisponiblesParaAyuda, busquedaSubtipo, categoriaFiltro]);

  // Pastel styling for cards depending on severity
  const getCardPastelStyle = (sol: any) => {
    const roofLevel = sol.nivel_afectacion_techo || 'Ninguno';
    const mainLevel = sol.afectacion_nivel || 'Ninguno';

    if (roofLevel === 'Colapso Total' || mainLevel === 'Colapso Total') {
      return 'bg-red-50/90 border-red-200 text-red-950 hover:bg-red-100/90 shadow-2xs';
    }
    if (roofLevel === 'Grave' || mainLevel === 'Grave') {
      return 'bg-amber-50/90 border-amber-200 text-amber-950 hover:bg-amber-100/90 shadow-2xs';
    }
    if (roofLevel === 'Leve' || mainLevel === 'Leve') {
      return 'bg-slate-100/80 border-slate-200 text-slate-900 hover:bg-slate-200/70 shadow-2xs';
    }
    if (sol.estado_codigo === 'completed') {
      return 'bg-emerald-50/90 border-emerald-200 text-emerald-950 shadow-2xs';
    }
    return 'bg-slate-50/80 border-slate-200 text-slate-900 shadow-2xs';
  };

  // Multi Category Accordion in Filter Modal
  const toggleParentCategoryFilter = (catId: number) => {
    const cat = DISASTER_TYPOLOGIES.find((t) => t.id === catId);
    if (!cat) return;
    const allSubCodes = cat.subtipos.map((s) => s.code);
    const isCurrentlySelected = selectedMultiCategoryIds.includes(catId);
    if (isCurrentlySelected) {
      setSelectedMultiCategoryIds((prev) => prev.filter((id) => id !== catId));
      setSelectedSubtipologiaCodes((prev) => prev.filter((code) => !allSubCodes.includes(code)));
    } else {
      setSelectedMultiCategoryIds((prev) => [...prev, catId]);
      setSelectedSubtipologiaCodes((prev) => Array.from(new Set([...prev, ...allSubCodes])));
    }
  };

  const toggleSubtipologiaCodeFilter = (catId: number, subCode: string) => {
    const cat = DISASTER_TYPOLOGIES.find((t) => t.id === catId);
    if (!cat) return;
    const isSubSelected = selectedSubtipologiaCodes.includes(subCode);
    let newSubCodes: string[];
    if (isSubSelected) {
      newSubCodes = selectedSubtipologiaCodes.filter((code) => code !== subCode);
    } else {
      newSubCodes = [...selectedSubtipologiaCodes, subCode];
    }
    setSelectedSubtipologiaCodes(newSubCodes);
    const allSubCodes = cat.subtipos.map((s) => s.code);
    const allChecked = allSubCodes.every((code) => newSubCodes.includes(code));
    if (allChecked) {
      setSelectedMultiCategoryIds((prev) => Array.from(new Set([...prev, catId])));
    } else {
      setSelectedMultiCategoryIds((prev) => prev.filter((id) => id !== catId));
    }
  };

  const toggleCategoryExpand = (catId: number) => {
    setExpandedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId],
    );
  };

  // Use deferred value for search query to keep typing at 60fps
  const deferredMapSearch = useDeferredValue(mapSearchQuery);

  // Filtered solicitudes for Map
  const solicitudesFiltradasMapa = useMemo(() => {
    const q = deferredMapSearch.toLowerCase().trim();
    return todasSolicitudes.filter((sol) => {
      // 0. Selected Event Filter
      if (selectedEventoId && sol.id_evento && sol.id_evento !== selectedEventoId) return false;

      // 1. Status Filter
      if (mapEstadoFilter === 'pending' && sol.estado_codigo !== 'pending') return false;
      if (mapEstadoFilter === 'completed' && sol.estado_codigo !== 'completed') return false;

      // 2. Zone Filter (Rural vs Urbano)
      if (mapZoneFilter === 'rural') {
        const isRural = checkIsRuralSector({ nombre_sector: sol.nombre_sector, id_tipo_sector: sol.id_tipo_sector });
        if (!isRural) return false;
      } else if (mapZoneFilter === 'urbano') {
        const isRural = checkIsRuralSector({ nombre_sector: sol.nombre_sector, id_tipo_sector: sol.id_tipo_sector });
        if (isRural) return false;
      }

      // 3. Housing Damage Multi-Select
      if (isHousingDamageFilterActive) {
        const solNivel = sol.afectacion_nivel || 'Ninguno';
        if (solNivel === 'Ninguno') return false;
        if (selectedDamageLevels.length > 0 && !selectedDamageLevels.includes(solNivel)) return false;
      }

      // 4. Roof Damage Multi-Select
      if (isRoofDamageFilterActive) {
        const roofNivel = sol.nivel_afectacion_techo || 'Ninguno';
        if (roofNivel === 'Ninguno') return false;
        if (selectedRoofDamageLevels.length > 0 && !selectedRoofDamageLevels.includes(roofNivel)) return false;
      }

      // 5. Sector Multi-Check Filter
      if (selectedSectorIds.length > 0) {
        if (!sol.id_sector || !selectedSectorIds.includes(sol.id_sector)) return false;
      }

      // 6. Free Search Query (incluye titulares y cualquier miembro del núcleo familiar)
      if (q) {
        const matchDoc = sol.documento?.toLowerCase().includes(q);
        const matchName = sol.nombre_completo?.toLowerCase().includes(q);
        const matchId = `sol-${sol.id_solicitud}`.toLowerCase().includes(q) || String(sol.id_solicitud).includes(q) || (sol.codigo_solicitud && sol.codigo_solicitud.toLowerCase().includes(q));
        const matchSector = sol.nombre_sector?.toLowerCase().includes(q);
        const docsNuc = Array.isArray(sol.documentos_nucleo)
          ? sol.documentos_nucleo.join(' ').toLowerCase()
          : String(sol.documentos_nucleo || '').toLowerCase();
        const nomsNuc = Array.isArray(sol.nombres_nucleo)
          ? sol.nombres_nucleo.join(' ').toLowerCase()
          : String(sol.nombres_nucleo || '').toLowerCase();
        if (!matchDoc && !matchName && !matchId && !matchSector && !docsNuc.includes(q) && !nomsNuc.includes(q)) {
          return false;
        }
      }

      // 7. Multi-Category / Subtipologies Filter
      if (selectedSubtipologiaCodes.length > 0 || selectedMultiCategoryIds.length > 0) {
        const targetSubNames: string[] = [];
        DISASTER_TYPOLOGIES.forEach((t) => {
          t.subtipos.forEach((sub) => {
            if (selectedSubtipologiaCodes.includes(sub.code)) targetSubNames.push(sub.nombre.toLowerCase());
          });
          if (selectedMultiCategoryIds.includes(t.id)) targetSubNames.push(t.nombre.toLowerCase());
        });
        if (targetSubNames.length > 0) {
          const desc = (sol.descripcion_solicitud || '').toLowerCase();
          const matchesAny = targetSubNames.some((target) => desc.includes(target));
          if (!matchesAny) return false;
        }
      }

      return true;
    });
  }, [
    todasSolicitudes,
    selectedEventoId,
    mapEstadoFilter,
    mapZoneFilter,
    isHousingDamageFilterActive,
    selectedDamageLevels,
    isRoofDamageFilterActive,
    selectedRoofDamageLevels,
    selectedSectorIds,
    deferredMapSearch,
    selectedMultiCategoryIds,
    selectedSubtipologiaCodes,
  ]);

  // Sector Geo Data & Precomputed Aggregates (Single-pass O(N) indexing for maximum FPS)
  const sectorAggregatedData = useMemo(() => {
    const base = getSectorsGeoData(sectores);
    const mappedReqs = solicitudesFiltradasMapa.map((s) => ({
      latitude: s.latitud ?? null,
      longitude: s.longitud ?? null,
      id: s.id_solicitud,
      id_sector: s.id_sector ?? null,
    }));
    const sectorsWithCounts = assignRequestsToSectors(base, mappedReqs);

    // Group requests by sector id in a fast Map lookup
    const sectorRequestsMap = new Map<number, typeof solicitudesFiltradasMapa>();
    const unassignedRequests: typeof solicitudesFiltradasMapa = [];

    solicitudesFiltradasMapa.forEach((sol) => {
      if (sol.id_sector) {
        const list = sectorRequestsMap.get(sol.id_sector) || [];
        list.push(sol);
        sectorRequestsMap.set(sol.id_sector, list);
      } else {
        unassignedRequests.push(sol);
      }
    });

    return sectorsWithCounts
      .map((sec) => {
        if (!sec.hasValidCoordinates || sec.latitude === null || sec.longitude === null || sec.requestCount <= 0) {
          return null;
        }

        let sectorRequests = sec.id_sector ? (sectorRequestsMap.get(sec.id_sector) || []) : [];
        if (sectorRequests.length === 0 && sec.latitude !== null && sec.longitude !== null && unassignedRequests.length > 0) {
          sectorRequests = unassignedRequests.filter((sol) => {
            if (!sol.latitud || !sol.longitud) return false;
            const dLat = sec.latitude! - sol.latitud;
            const dLng = sec.longitude! - sol.longitud;
            return dLat * dLat + dLng * dLng < 0.001;
          });
        }

        let totalScore = 0;
        let countWithEval = 0;
        let pendingCount = 0;
        sectorRequests.forEach((s) => {
          if (s.estado_codigo === 'pending') pendingCount++;
          const level = s.afectacion_nivel;
          if (level === 'Colapso Total') { totalScore += 3; countWithEval++; }
          else if (level === 'Grave') { totalScore += 2; countWithEval++; }
          else if (level === 'Leve') { totalScore += 1; countWithEval++; }
          else { countWithEval++; }
        });

        const avgScore = countWithEval > 0 ? totalScore / countWithEval : 0;

        let badgeColor: 'red' | 'yellow' | 'gray' | 'green' = 'gray';
        if (avgScore >= 2.2 || sectorRequests.some((s) => s.afectacion_nivel === 'Colapso Total')) {
          badgeColor = 'red';
        } else if (avgScore >= 1.2 || sectorRequests.some((s) => s.afectacion_nivel === 'Grave')) {
          badgeColor = 'yellow';
        } else if (avgScore > 0 || sectorRequests.some((s) => s.afectacion_nivel === 'Leve')) {
          badgeColor = 'yellow';
        } else if (pendingCount === 0 && sectorRequests.length > 0) {
          badgeColor = 'green';
        } else {
          badgeColor = 'gray';
        }

        return {
          ...sec,
          sectorRequests,
          badgeColor,
          pendingCount,
        };
      })
      .filter(Boolean) as Array<typeof sectorsWithCounts[0] & { sectorRequests: typeof solicitudesFiltradasMapa; badgeColor: 'red' | 'yellow' | 'gray' | 'green'; pendingCount: number }>;
  }, [sectores, solicitudesFiltradasMapa]);

  const resetAllMapFilters = () => {
    setMapEstadoFilter('all');
    setMapZoneFilter('all');
    setIsHousingDamageFilterActive(false);
    setSelectedDamageLevels(['Colapso Total', 'Grave', 'Leve']);
    setIsRoofDamageFilterActive(false);
    setSelectedRoofDamageLevels(['Colapso Total', 'Grave', 'Leve']);
    setSelectedSectorIds([]);
    setMapSearchQuery('');
    setMapCategoryFilter(0);
    setSelectedMultiCategoryIds([]);
    setSelectedSubtipologiaCodes([]);
    showToast('Todos los filtros del mapa han sido restablecidos.', 'warning');
  };

  const totalPagesMap = useMemo(() => {
    return Math.ceil(solicitudesFiltradasMapa.length / 10) || 1;
  }, [solicitudesFiltradasMapa]);

  const solicitudesPaginadas = useMemo(() => {
    const start = (mapCurrentPage - 1) * 10;
    return solicitudesFiltradasMapa.slice(start, start + 10);
  }, [solicitudesFiltradasMapa, mapCurrentPage]);

  // Limpiar y resetear el formulario
  const resetFormState = () => {
    setEditingSolicitudId(null);
    setEditingSolicitudCodigo(null);
    setEditingEntregaId(null);
    setEditingEntregaCodigo(null);
    setDocumento('');
    setNombres('');
    setApellidos('');
    setTelefono('');
    setDireccion('');
    setSelectedSubtipos([]);
    setCantidadesSubtipos({});
    setObservaciones('');
    setFotosEntrega([]);
    setFotosTecho([]);
    setFotosEstructura([]);
    setEvacuar(false);
    setVisita(false);
    setCenso(false);
    setAlbergue(false);
    setRedApoyo(false);
    setAfectacionNivel('Ninguno');
    setTechoDamageLevel('Ninguno');
    setEstructuraDamageLevel('Ninguno');
    setObservacionTecho('');
    setObservacionEstructura('');
    setObservacionAfectacion('');
    setCultivoTipo('');
    setCultivoArea('');
    setPecuarioEspecie('');
    setPecuarioCantidad('');
    setNucleoFamiliar([]);
    setEdad('');
    setEsPropietario(null);
    setHayAcompanantes(false);
    setNumAcompanantes(1);
    setHayAdultosMayores(false);
    setNumAdultosMayores(1);
    setHayNinos(false);
    setNumNinos(1);
    setObservacionIdentificacion('');
    setObservacionSector('');
    setCorregimiento('');
    setResidenciaHabitual(null);
    setEvacuadoResidencia(null);
    setFormaTenenciaRufe('PROPIETARIO');
    setEstadoBienRufe('HABITABLE');
    setTipoBienRufe('Vivienda');
    setVoboCmgrd(false);
    setSelectedRequest(null);
    setTipoDestinatario('NUCLEO_FAMILIAR');
    setNombreComunidad('');
    setIdNucleoVinculado(null);
    setSubtipoEmergencia('SOCIAL_E_INMUEBLE');
    setTipoInmueble('Vivienda');
    setParedesDamageLevel('Ninguno');
    setPisosDamageLevel('Ninguno');
    setOtrosDanosDescripcion('');
    setEstimacionPerdidasPesos('0');
    setPropietarioNombre('');
    setPropietarioDocumento('');
    setPropietarioTelefono('');
    setEsPropietarioSolicitante(true);
    setCostoEstimadoAyuda('0');
    setDocumentoReceptor('');
    setNombreReceptor('');
    setFichaCatastral('');
    setTipoTenencia('PROPIETARIO_RESIDENTE');
    setComunidadJacNombre('');
    setComunidadJacPersoneria('');
    setComunidadJacRepresentante('');
    setComunidadJacTelefono('');
    setEsLocalComercial(false);
    setComercioRazonSocial('');
    setComercioNitRut('');
    setComercioAfectacionMercancia('');
    setInfraestructurasRurales([]);
    setMostrarOtraInfraFinca(false);
    setOtraInfraFincaNombre('');
    setBancoMateriales(MATERIALES_BANCO_DEFAULT.map((m) => ({ ...m })));
    setSolicitadoPorMateriales('');
    setMostrarAgregarMaterialInline(false);
    setNuevoMaterialNombre('');
    setNuevoMaterialCantidad('1');
    setNuevoMaterialTipo('');
    setVisitaVerificacionReporte('CONFIRMADO');
    setVisitaDictamenHabitabilidad('HABITABLE');
    setVisitaObservacionesTecnicas('');
    setReporteInicialSnapshot(null);
    setSelectedEntidadDonanteId(entidadesDonantes[0]?.id_entidad_donante || null);
  };

  // Funciones específicas para Limpieza de Formulario y Secciones (Modal Limpiar)
  const limpiarPersona = () => {
    setDocumento('');
    setNombres('');
    setApellidos('');
    setTelefono('');
    setDireccion('');
    setObservacionIdentificacion('');
    setObservacionSector('');
    setParentescoCiudadano('Jefe(a) o cabeza del hogar');
    showToast('Datos de la persona y ciudadano limpiados.', 'success');
  };

  const limpiarNucleo = () => {
    setNucleoFamiliar([]);
    setHayAcompanantes(false);
    setNumAcompanantes(1);
    setHayAdultosMayores(false);
    setNumAdultosMayores(1);
    setHayNinos(false);
    setNumNinos(1);
    setIdNucleoVinculado(null);
    showToast('Información del núcleo familiar limpiada.', 'success');
  };

  const limpiarRufe = () => {
    setCultivoTipo('');
    setCultivoArea('');
    setPecuarioEspecie('');
    setPecuarioCantidad('');
    setFormaTenenciaRufe('PROPIETARIO');
    setEstadoBienRufe('HABITABLE');
    setTipoBienRufe('Vivienda');
    setVoboCmgrd(false);
    setResidenciaHabitual(null);
    setEvacuadoResidencia(null);
    setCorregimiento('');
    showToast('Campos de RUFE y agropecuario limpiados.', 'success');
  };

  const limpiarInmueble = () => {
    setAfectacionNivel('Ninguno');
    setTechoDamageLevel('Ninguno');
    setEstructuraDamageLevel('Ninguno');
    setParedesDamageLevel('Ninguno');
    setPisosDamageLevel('Ninguno');
    setObservacionTecho('');
    setObservacionEstructura('');
    setObservacionAfectacion('');
    setOtrosDanosDescripcion('');
    setEstimacionPerdidasPesos('0');
    setEvacuar(false);
    setVisita(false);
    setCenso(false);
    setAlbergue(false);
    setRedApoyo(false);
    setTipoInmueble('Vivienda');
    setBancoMateriales(MATERIALES_BANCO_DEFAULT.map((m) => ({ ...m })));
    setSolicitadoPorMateriales('');
    showToast('Datos de afectación y atención al inmueble limpiados.', 'success');
  };

  const limpiarAyudas = () => {
    setSelectedSubtipos([]);
    setCantidadesSubtipos({});
    setCostoEstimadoAyuda('0');
    showToast('Selección de entrega de ayudas e insumos limpiada.', 'success');
  };

  const limpiarObservaciones = () => {
    setObservaciones('');
    setFotosEntrega([]);
    showToast('Observaciones y evidencias fotográficas limpiadas.', 'success');
  };

  const limpiarPestanaSeleccionada = () => {
    switch (formStepTab) {
      case 1:
        limpiarPersona();
        break;
      case 2:
        limpiarNucleo();
        break;
      case 3:
        limpiarRufe();
        break;
      case 4:
        limpiarInmueble();
        break;
      case 5:
        limpiarAyudas();
        break;
      case 6:
        limpiarObservaciones();
        break;
      default:
        break;
    }
  };

  const limpiarTodoFormulario = () => {
    resetFormState();
    showToast('Todo el formulario ha sido limpiado y restablecido.', 'success');
  };

  const openLimpiarModal = () => {
    setSelectedTabsToClean([formStepTab]);
    setIsLimpiarModalOpen(true);
  };

  const openListarModal = () => {
    if (todasSolicitudes.length === 0) {
      fetchSolicitudes();
    }
    setListarSearchQuery('');
    setListarEventoFiltro('ALL');
    setListarEstadoFiltro('all');
    setListarSectorFiltro('ALL');
    setListarNivelDanoFiltro('ALL');
    setListarCurrentPage(1);
    setIsListarModalOpen(true);
  };

  const ejecutarLimpiezaPestanasSeleccionadas = () => {
    if (selectedTabsToClean.length === 0) {
      showToast('Selecciona al menos una pestaña para limpiar.', 'warning');
      return;
    }

    if (selectedTabsToClean.length === 6) {
      resetFormState();
      showToast('Todas las pestañas del formulario han sido limpiadas y restablecidas.', 'success');
      setIsLimpiarModalOpen(false);
      return;
    }

    selectedTabsToClean.forEach((tabId) => {
      switch (tabId) {
        case 1:
          setDocumento('');
          setNombres('');
          setApellidos('');
          setTelefono('');
          setDireccion('');
          setObservacionIdentificacion('');
          setObservacionSector('');
          setParentescoCiudadano('Jefe(a) o cabeza del hogar');
          break;
        case 2:
          setNucleoFamiliar([]);
          setHayAcompanantes(false);
          setNumAcompanantes(1);
          setHayAdultosMayores(false);
          setNumAdultosMayores(1);
          setHayNinos(false);
          setNumNinos(1);
          setIdNucleoVinculado(null);
          break;
        case 3:
          setCultivoTipo('');
          setCultivoArea('');
          setPecuarioEspecie('');
          setPecuarioCantidad('');
          setFormaTenenciaRufe('PROPIETARIO');
          setEstadoBienRufe('HABITABLE');
          setTipoBienRufe('Vivienda');
          setVoboCmgrd(false);
          setResidenciaHabitual(null);
          setEvacuadoResidencia(null);
          setCorregimiento('');
          break;
        case 4:
          setAfectacionNivel('Ninguno');
          setTechoDamageLevel('Ninguno');
          setEstructuraDamageLevel('Ninguno');
          setParedesDamageLevel('Ninguno');
          setPisosDamageLevel('Ninguno');
          setObservacionTecho('');
          setObservacionEstructura('');
          setObservacionAfectacion('');
          setOtrosDanosDescripcion('');
          setEstimacionPerdidasPesos('0');
          setEvacuar(false);
          setVisita(false);
          setCenso(false);
          setAlbergue(false);
          setRedApoyo(false);
          setTipoInmueble('Vivienda');
          break;
        case 5:
          setSelectedSubtipos([]);
          setCantidadesSubtipos({});
          setCostoEstimadoAyuda('0');
          break;
        case 6:
          setObservaciones('');
          setFotosEntrega([]);
          break;
      }
    });

    const labels = selectedTabsToClean.map((t) => `Pestaña ${t}`).join(', ');
    showToast(`Se limpiaron exitosamente las secciones seleccionadas (${labels}).`, 'success');
    setIsLimpiarModalOpen(false);
  };

  // Validación comprensiva con identificación de motivos para el usuario
  const validarFormulario = (): { valido: boolean; motivos: { campo: string; mensaje: string; tab?: 1 | 2 | 3 | 4 | 5 | 6 }[] } => {
    const motivos: { campo: string; mensaje: string; tab?: 1 | 2 | 3 | 4 | 5 | 6 }[] = [];

    if (eventos.length === 0 || !selectedEventoId) {
      motivos.push({
        campo: 'Evento de Emergencia',
        mensaje: 'No hay ninguna contingencia o evento activo asignado para registrar datos.',
        tab: 1,
      });
    }

    if (registroModo === 'ENTREGA_EXISTENTE') {
      if (!selectedRequest) {
        motivos.push({
          campo: 'Solicitud Previa',
          mensaje: 'Debe seleccionar la solicitud previa que desea atender para entregar las ayudas.',
          tab: 1,
        });
      }
    } else if (registroModo === 'VISITA_TECNICA') {
      if (!editingSolicitudId) {
        motivos.push({
          campo: 'Solicitud para Visita Técnica',
          mensaje: 'Debe seleccionar una solicitud del listado para realizar la visita técnica y re-evaluar la vivienda.',
          tab: 4,
        });
      }
    } else {
      if (!documento.trim()) {
        motivos.push({
          campo: 'Documento del Beneficiario',
          mensaje: 'Debe ingresar el número de documento de identidad del ciudadano beneficiario.',
          tab: 1,
        });
      }
      if (!nombres.trim()) {
        motivos.push({
          campo: 'Nombres del Beneficiario',
          mensaje: 'Debe ingresar los nombres del ciudadano beneficiario.',
          tab: 1,
        });
      }
      if (!apellidos.trim()) {
        motivos.push({
          campo: 'Apellidos del Beneficiario',
          mensaje: 'Debe ingresar los apellidos del ciudadano beneficiario.',
          tab: 1,
        });
      }
      if (!sectorId || sectorId === 0) {
        motivos.push({
          campo: 'Sector / Vereda / Barrio',
          mensaje: 'Debe seleccionar el barrio o vereda donde ocurrió la afectación.',
          tab: 1,
        });
      }

      // Validar que no se cree duplicado para el mismo ciudadano o núcleo familiar en el mismo evento
      if (!editingSolicitudId && (registroModo === 'SOLICITUD_SOLO' || registroModo === 'ENTREGA_DIRECTA')) {
        const todosDocsForm = [
          documento.trim(),
          ...nucleoFamiliar.map((m) => m.documento?.trim()).filter(Boolean),
        ].filter(Boolean);
        const solDuplicada = encontrarSolicitudExistenteNucleo(todosDocsForm, idNucleoVinculado);
        if (solDuplicada) {
          motivos.push({
            campo: 'Núcleo Familiar Ya Registrado',
            mensaje: `Este núcleo familiar ya cuenta con la solicitud ${solDuplicada.codigo_solicitud || `SOL-${solDuplicada.id_solicitud}`} registrada en este evento a nombre de ${solDuplicada.nombre_completo}. Únicamente se permite registrar una solicitud por núcleo familiar.`,
            tab: 1,
          });
        }
      }
    }

    if (registroModo === 'ENTREGA_EXISTENTE' && selectedSubtipos.length === 0 && !cantidadAyuda) {
      motivos.push({
        campo: 'Entrega de Ayudas',
        mensaje: 'Debe seleccionar al menos un ítem o ayuda a entregar en la pestaña 5 (Entrega de ayudas).',
        tab: 5,
      });
    }

    nucleoFamiliar.forEach((miembro, idx) => {
      if (!miembro.nombres.trim()) {
        motivos.push({
          campo: `Núcleo Familiar - Miembro #${idx + 1}`,
          mensaje: `El integrante #${idx + 1} de la familia no tiene nombre asignado. Complete los nombres o elimine la fila vacía.`,
          tab: 2,
        });
      }
    });

    return { valido: motivos.length === 0, motivos };
  };

  // Cargar entrega para edición completa
  const handleEditarEntrega = async (entrega: any, detail?: SolicitudDetailResponse | null) => {
    setIsListarModalOpen(false);
    setEditingEntregaId(entrega.id_entrega);
    setEditingEntregaCodigo(entrega.codigo_entrega);
    setEditingSolicitudId(null);
    setEditingSolicitudCodigo(null);

    let det: any = detail;
    if (!det && entrega.id_solicitud) {
      try {
        det = await sacService.getSolicitudDetail(entrega.id_solicitud);
      } catch (e) {
        console.warn('No se pudo cargar detalle completo de la solicitud vinculada a la entrega:', e);
      }
    }

    // Cargar datos de la persona y de la entrega
    setDocumento(det?.ciudadano?.documento || entrega.documento_receptor || entrega.documento || entrega.titular_documento || '');
    setNombres(det?.ciudadano?.nombres || entrega.nombre_receptor || entrega.nombres || entrega.titular_nombres || '');
    setApellidos(det?.ciudadano?.apellidos || entrega.apellidos || entrega.titular_apellidos || '');
    setTelefono(det?.ciudadano?.telefono || entrega.telefono_receptor || entrega.telefono || '');
    setDireccion(det?.ciudadano?.direccion || det?.direccion_afectacion || entrega.direccion_receptor || entrega.direccion || '');
    if (det?.sector?.id_sector || entrega.id_sector) setSectorId(det?.sector?.id_sector || entrega.id_sector);
    if (det?.latitud_gps && det?.longitud_gps) {
      setLatitud(det.latitud_gps);
      setLongitud(det.longitud_gps);
    }
    setCantidadAyuda(entrega.cantidad || 1);
    setObservaciones(entrega.observaciones || '');
    setFotosEntrega(Array.isArray(entrega.fotos) ? entrega.fotos.slice(0, 6) : []);
    setRegistroModo('ENTREGA_EXISTENTE');
    setEntregaSubTabModo('NUEVA_ENTREGA');
    if (det) {
      setSelectedRequest(det);
    }
    setActiveTab('formulario');
    setFormStepTab(5);
    showToast(`Modo edición activado para Entrega ${entrega.codigo_entrega || `ENT-${entrega.id_entrega}`}`, 'warning');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Gestionar Nueva Entrega sobre una solicitud vinculada (crea una nueva entrega limpia para dicha solicitud)
  const handleGestionarNuevaEntrega = async (entregaOrSol: any) => {
    setIsListarModalOpen(false);
    const idSol = entregaOrSol.id_solicitud || entregaOrSol.id;
    if (!idSol) {
      showToast('No se encontró una solicitud vinculada para gestionar la entrega.', 'error');
      return;
    }
    setEditingEntregaId(null);
    setEditingEntregaCodigo(null);
    setEditingSolicitudId(null);
    setEditingSolicitudCodigo(null);

    let det: any = null;
    try {
      det = await sacService.getSolicitudDetail(idSol);
    } catch (e) {
      console.warn('No se pudo cargar detalle completo de la solicitud vinculada:', e);
    }

    const solData = det || entregaOrSol;
    setSelectedRequest(solData);
    setDocumento(solData?.ciudadano?.documento || entregaOrSol.documento_receptor || entregaOrSol.documento || '');
    setNombres(solData?.ciudadano?.nombres || entregaOrSol.nombre_receptor || entregaOrSol.nombres || '');
    setApellidos(solData?.ciudadano?.apellidos || entregaOrSol.apellidos || '');
    setTelefono(solData?.ciudadano?.telefono || entregaOrSol.telefono_receptor || entregaOrSol.telefono || '');
    setDireccion(solData?.ciudadano?.direccion || solData?.direccion_afectacion || entregaOrSol.direccion_receptor || entregaOrSol.direccion || '');
    if (solData?.sector?.id_sector || entregaOrSol.id_sector) {
      setSectorId(solData?.sector?.id_sector || entregaOrSol.id_sector);
    }
    if (solData?.latitud_gps && solData?.longitud_gps) {
      setLatitud(solData.latitud_gps);
      setLongitud(solData.longitud_gps);
    }

    // Limpiar insumos seleccionados para una NUEVA entrega independiente
    setSelectedSubtipos([]);
    setCantidadesSubtipos({});
    setCantidadAyuda(1);
    setObservaciones('');
    setFotosEntrega([]);

    setRegistroModo('ENTREGA_EXISTENTE');
    setEntregaSubTabModo('NUEVA_ENTREGA');
    setActiveTab('formulario');
    setFormStepTab(5);
    showToast(`Registrando nueva entrega para la solicitud ${solData.codigo_solicitud || `SOL-${idSol}`}`, 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cargar solicitud para edición completa o para Visita Técnica (re-evaluar vivienda)
  const handleEditarSolicitud = async (
    solOrId: number | any,
    modoDestino: 'SOLICITUD_SOLO' | 'VISITA_TECNICA' = 'SOLICITUD_SOLO'
  ) => {
    try {
      const id = typeof solOrId === 'number' ? solOrId : (solOrId.id_solicitud || solOrId.id);
      if (!id) return;
      showToast(
        modoDestino === 'VISITA_TECNICA'
          ? 'Cargando solicitud para Visita Técnica y re-evaluación de la vivienda...'
          : 'Cargando expediente para edición...',
        'warning'
      );
      const detail: SolicitudDetailResponse = await sacService.getSolicitudDetail(id);

      // Ciudadano
      setDocumento(detail.ciudadano?.documento || '');
      setNombres(detail.ciudadano?.nombres || '');
      setApellidos(detail.ciudadano?.apellidos || '');
      setTelefono(detail.ciudadano?.telefono || '');
      setDireccion(detail.ciudadano?.direccion || detail.direccion_afectacion || '');

      // Sector y Coordenadas
      if (detail.sector?.id_sector) {
        setSectorId(detail.sector.id_sector);
      }
      if (detail.latitud_gps && detail.longitud_gps) {
        setLatitud(detail.latitud_gps);
        setLongitud(detail.longitud_gps);
      }
      setObservacionSector(detail.observaciones_sector || '');

      // Evaluación de daño
      if (detail.evaluacion_dano) {
        const ed = detail.evaluacion_dano;
        setAfectacionNivel((ed.nivel_afectacion_vivienda as any) || 'Ninguno');
        setTechoDamageLevel((ed.nivel_afectacion_techo as any) || 'Ninguno');
        setEvacuar(!!ed.requiere_evacuacion);
        setVisita(!!ed.visita_campo_realizada);
        setCenso(!!ed.censo_oficial_realizado);
        setAlbergue(!!ed.requiere_albergue);
        setRedApoyo(!!ed.cuenta_red_apoyo);
        setObservacionAfectacion(ed.observaciones_dano || '');
        if (ed.tipo_inmueble) setTipoInmueble(ed.tipo_inmueble);
        if (ed.nivel_afectacion_paredes) setParedesDamageLevel(ed.nivel_afectacion_paredes as any);
        if (ed.nivel_afectacion_pisos) setPisosDamageLevel(ed.nivel_afectacion_pisos as any);
        if (ed.otros_danos_descripcion) setOtrosDanosDescripcion(ed.otros_danos_descripcion);
        if (ed.estimacion_perdidas_pesos !== undefined) setEstimacionPerdidasPesos(String(ed.estimacion_perdidas_pesos));
        if (ed.propietario_nombre) setPropietarioNombre(ed.propietario_nombre);
        if (ed.propietario_documento) setPropietarioDocumento(ed.propietario_documento);
        if (ed.propietario_telefono) setPropietarioTelefono(ed.propietario_telefono);
        if (ed.es_propietario_solicitante !== undefined) setEsPropietarioSolicitante(ed.es_propietario_solicitante);
        
        // Cargar fotos específicas de Techo y Estructura
        const fotosTechoCargadas = (ed.fotos_techo && ed.fotos_techo.length > 0)
          ? ed.fotos_techo
          : (detail.fotos || []).filter(f => f.tipo === 'Techo_Cubierta').map(f => f.url);
        setFotosTecho(fotosTechoCargadas || []);

        const fotosEstructuraCargadas = (ed.fotos_estructura && ed.fotos_estructura.length > 0)
          ? ed.fotos_estructura
          : (detail.fotos || []).filter(f => f.tipo === 'Estructura_Muros').map(f => f.url);
        setFotosEstructura(fotosEstructuraCargadas || []);

        const fotosGeneralesCargadas = (detail.fotos || []).filter(f => f.tipo === 'Censo_General' || (!f.tipo && !f.id_entrega)).map(f => f.url);
        if (fotosGeneralesCargadas.length > 0) {
          setFotosEntrega(fotosGeneralesCargadas.slice(0, 6));
        }
      }

      // RUFE
      if (detail.formulario_rufe) {
        const rf = detail.formulario_rufe;
        if (rf.fecha_rufe) setFechaRufe(rf.fecha_rufe);
        setCorregimiento(rf.corregimiento || '');
        setResidenciaHabitual(rf.residencia_habitual ?? null);
        setEvacuadoResidencia(rf.evacuado_residencia ?? null);
        setFormaTenenciaRufe(rf.forma_tenencia || 'PROPIETARIO');
        setTipoBienRufe(rf.tipo_bien || 'Vivienda');
        setEstadoBienRufe(rf.estado_bien || 'HABITABLE');
        setCultivoTipo(rf.tipo_cultivo || '');
        setCultivoUnidad(rf.unidad_area_cultivo || 'Hectáreas');
        setCultivoArea(rf.area_cultivo_afectada ? String(rf.area_cultivo_afectada) : '');
        setPecuarioEspecie(rf.especie_pecuaria || '');
        setPecuarioCantidad(rf.cantidad_animales_afectados ? String(rf.cantidad_animales_afectados) : '');
        setVoboCmgrd(!!rf.vobo_cmgrd);
      }

      // Núcleo familiar
      if (detail.nucleo_familiar) {
        const nf = detail.nucleo_familiar;
        setEsPropietario(nf.es_propietario ?? null);
        setEdad(nf.edad_jefe_hogar ? String(nf.edad_jefe_hogar) : '');
        setHayAcompanantes(!!nf.tiene_acompanantes);
        setNumAcompanantes(nf.cantidad_acompanantes || 1);
        setHayAdultosMayores(!!nf.tiene_adultos_mayores);
        setNumAdultosMayores(nf.cantidad_adultos_mayores || 1);
        setHayNinos(!!nf.tiene_ninos);
        setNumNinos(nf.cantidad_ninos || 1);
        setObservacionIdentificacion(nf.observaciones_familia || '');
      }

      // Integrantes del núcleo familiar
      if (detail.integrantes && detail.integrantes.length > 0) {
        setNucleoFamiliar(detail.integrantes.map((m: any, idx: number) => ({
          id: `member-${idx}-${Date.now()}`,
          nombres: m.nombres || '',
          apellidos: m.apellidos || '',
          tipo_documento: m.tipo_documento || 'CC',
          documento: m.documento || '',
          fecha_nacimiento: m.fecha_nacimiento || '',
          parentesco: m.parentesco || 'Otro familiar / Pariente',
          identidad_genero: m.genero || 'Masculino',
          grupo_etnico: m.grupo_etnico || m.etnia || 'Ninguno',
          telefono: m.telefono || '',
        })));
      } else {
        setNucleoFamiliar([]);
      }

      // Items solicitados
      if (detail.items_solicitados && detail.items_solicitados.length > 0) {
        const names: string[] = [];
        const quantities: Record<string, number> = {};
        detail.items_solicitados.forEach((it) => {
          names.push(it.nombre_item);
          quantities[it.nombre_item] = it.cantidad;
        });
        setSelectedSubtipos(names);
        setCantidadesSubtipos(quantities);
      }

      // Fotos (Solo fotos de la solicitud, hasta 6)
      if (detail.fotos && detail.fotos.length > 0) {
        const fotosSol = detail.fotos
          .filter((f: any) => !f.id_entrega)
          .map((f: any) => f.url)
          .slice(0, 6);
        setFotosEntrega(fotosSol);
      } else {
        setFotosEntrega([]);
      }

      // Nuevos campos de evolución: Tenencia, Ficha Catastral, JAC, Comercial, Rural
      setFichaCatastral(detail.ficha_catastral || '');
      const loadedTenencia = detail.tipo_tenencia === 'PROPIETARIO_HABITANTE'
        ? 'PROPIETARIO_RESIDENTE'
        : detail.tipo_tenencia === 'PROPIETARIO_NO_HABITANTE'
          ? 'PROPIETARIO_NO_RESIDENTE'
          : (detail.tipo_tenencia as any) || 'PROPIETARIO_RESIDENTE';
      setTipoTenencia(loadedTenencia);
      if (detail.subtipo_emergencia) {
        setSubtipoEmergencia(detail.subtipo_emergencia as any);
      } else if (loadedTenencia === 'ARRENDATARIO') {
        setSubtipoEmergencia('SOCIAL');
      } else if (loadedTenencia === 'PROPIETARIO_NO_RESIDENTE') {
        setSubtipoEmergencia('INMUEBLE');
      } else {
        setSubtipoEmergencia('SOCIAL_E_INMUEBLE');
      }
      setComunidadJacNombre(detail.comunidad_jac_nombre || '');
      setComunidadJacPersoneria(detail.comunidad_jac_personeria || '');
      setComunidadJacRepresentante(detail.comunidad_jac_representante || '');
      setComunidadJacTelefono(detail.comunidad_jac_telefono || '');
      setEsLocalComercial(!!detail.es_local_comercial);
      setComercioRazonSocial(detail.comercio_razon_social || '');
      setComercioNitRut(detail.comercio_nit_rut || '');
      setComercioAfectacionMercancia(detail.comercio_afectacion_mercancia || '');
      if (Array.isArray(detail.infraestructuras_rurales)) {
        setInfraestructurasRurales(detail.infraestructuras_rurales as any);
      } else {
        setInfraestructurasRurales([]);
      }
      const rawBm = detail.evaluacion_dano?.banco_materiales_json || detail.banco_materiales_json;
      if (Array.isArray(rawBm) && rawBm.length > 0) {
        setBancoMateriales(rawBm);
      } else {
        setBancoMateriales(MATERIALES_BANCO_DEFAULT.map((m) => ({ ...m })));
      }
      setSolicitadoPorMateriales(
        detail.evaluacion_dano?.solicitado_por_materiales ||
        detail.solicitado_por_materiales ||
        ''
      );
      if (detail.evaluacion_dano) {
        if (detail.evaluacion_dano.nivel_afectacion_paredes) {
          setParedesDamageLevel(detail.evaluacion_dano.nivel_afectacion_paredes as any);
        }
        if (detail.evaluacion_dano.nivel_afectacion_pisos) {
          setPisosDamageLevel(detail.evaluacion_dano.nivel_afectacion_pisos as any);
        }
      }

      const visitasPrevias = Array.isArray(detail.visitas_tecnicas) ? detail.visitas_tecnicas : [];
      setReporteInicialSnapshot({
        nivel_vivienda: detail.evaluacion_dano?.nivel_afectacion_vivienda || 'Ninguno',
        nivel_techo: detail.evaluacion_dano?.nivel_afectacion_techo || 'Ninguno',
        nivel_paredes: detail.evaluacion_dano?.nivel_afectacion_paredes || 'Ninguno',
        nivel_pisos: detail.evaluacion_dano?.nivel_afectacion_pisos || 'Ninguno',
        observaciones:
          detail.evaluacion_dano?.observaciones_dano ||
          detail.evaluacion_dano?.otros_danos_descripcion ||
          '',
        total_visitas_previas: visitasPrevias.length,
        visitas_previas: visitasPrevias,
      });

      setSelectedRequest({
        id_solicitud: detail.id_solicitud,
        codigo_solicitud: detail.codigo_solicitud || `SOL-${detail.id_solicitud}`,
        nombre_completo: `${detail.ciudadano?.nombres || ''} ${detail.ciudadano?.apellidos || ''}`.trim(),
        documento: detail.ciudadano?.documento || '',
        telefono: detail.ciudadano?.telefono || '',
        nombre_sector: detail.sector?.nombre_sector || '',
        direccion_afectacion: detail.direccion_afectacion || detail.ciudadano?.direccion || '',
        afectacion_nivel: detail.evaluacion_dano?.nivel_afectacion_vivienda || 'Ninguno',
        total_visitas: visitasPrevias.length,
      });

      setEditingSolicitudId(detail.id_solicitud);
      setEditingSolicitudCodigo(detail.codigo_solicitud || `SOL-${detail.id_solicitud}`);

      if (modoDestino === 'VISITA_TECNICA') {
        setVisita(true);
        setVisitaProfesionalResponsable(
          user ? `${user.nombres || ''} ${user.apellidos || ''}`.trim() || 'Profesional Técnico SAD' : 'Profesional Técnico SAD'
        );
        setVisitaVerificacionReporte('CONFIRMADO');
        setVisitaDictamenHabitabilidad(
          detail.evaluacion_dano?.requiere_evacuacion ||
            detail.evaluacion_dano?.nivel_afectacion_vivienda === 'Colapso Total'
            ? 'NO_HABITABLE'
            : detail.evaluacion_dano?.nivel_afectacion_vivienda === 'Grave'
              ? 'USO_CON_PRECAUCION'
              : 'HABITABLE'
        );
        setVisitaObservacionesTecnicas('');
        setRegistroModo('VISITA_TECNICA');
        setActiveTab('formulario');
        setFormStepTab(4);
        showToast(
          `Visita Técnica #${visitasPrevias.length + 1}: Re-evalúe la vivienda de ${detail.codigo_solicitud || `SOL-${detail.id_solicitud}`} y confirme los hallazgos`,
          'success'
        );
      } else {
        setRegistroModo('SOLICITUD_SOLO');
        setActiveTab('formulario');
        setFormStepTab(1);
        showToast(`Expediente ${detail.codigo_solicitud || `SOL-${detail.id_solicitud}`} cargado en el formulario`, 'success');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('Error al cargar solicitud para edición:', error);
      showToast('No se pudo cargar la solicitud', 'error');
    }
  };

  const handleIniciarVisitaTecnica = async (solOrId: number | any) => {
    setIsListarModalOpen(false);
    setIsDetailModalOpen(false);
    await handleEditarSolicitud(solOrId, 'VISITA_TECNICA');
  };

  const handleSelectSolicitudDesdeListar = async (sol: any) => {
    setIsListarModalOpen(false);
    const id = sol.id_solicitud || sol.id;
    if (!id) return;
    await handleEditarSolicitud(id, registroModo === 'VISITA_TECNICA' ? 'VISITA_TECNICA' : 'SOLICITUD_SOLO');
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const resValidacion = validarFormulario();
    if (!resValidacion.valido) {
      setValidationModal({
        isOpen: true,
        title: 'No se puede enviar el formulario',
        motivos: resValidacion.motivos,
      });
      return;
    }

    setSubmitting(true);

    try {
      if (editingEntregaId) {
        // ACTUALIZACIÓN DE ENTREGA EXISTENTE
        const payload = {
          id_item: itemsAyuda[0]?.id_item || 1,
          cantidad: cantidadAyuda || 1,
          observaciones: observaciones.trim() || undefined,
          fotos_evidencia: fotosEntrega,
        };
        const res = await sacService.actualizarEntrega(editingEntregaId, payload);
        showToast(res.mensaje || `¡Entrega ${editingEntregaCodigo} actualizada exitosamente!`, 'success');
        resetFormState();
      } else if (editingSolicitudId) {
        // ACTUALIZACIÓN DE SOLICITUD EXISTENTE
        const mappedItems = itemsAyuda
          .filter((item) => selectedSubtipos.some((sub) => sub.toLowerCase().includes(item.nombre_item.toLowerCase())))
          .map((item) => ({ id_item: item.id_item, cantidad: cantidadesSubtipos[item.nombre_item] || 1 }));

        const obsAfectacionPartes: string[] = [];
        if (techoDamageLevel !== 'Ninguno' || observacionTecho.trim()) {
          obsAfectacionPartes.push(`[TECHO: Nivel ${techoDamageLevel}${observacionTecho.trim() ? ` | Obs: ${observacionTecho.trim()}` : ''}]`);
        }
        if (estructuraDamageLevel !== 'Ninguno' || observacionEstructura.trim()) {
          obsAfectacionPartes.push(`[ESTRUCTURA: Nivel ${estructuraDamageLevel}${observacionEstructura.trim() ? ` | Obs: ${observacionEstructura.trim()}` : ''}]`);
        }
        if (observacionAfectacion.trim()) {
          obsAfectacionPartes.push(observacionAfectacion.trim());
        }

        const payload = {
          id_evento: selectedEventoId,
          tipo_destinatario: tipoDestinatario,
          id_nucleo: idNucleoVinculado,
          nombre_comunidad: tipoDestinatario === 'COMUNIDAD' ? (nombreComunidad.trim() || direccion.trim() || 'Comunidad del Sector') : undefined,
          ficha_catastral: fichaCatastral.trim() || undefined,
          tipo_tenencia: tipoTenencia,
          comunidad_jac_nombre: tipoDestinatario === 'COMUNIDAD' ? (comunidadJacNombre.trim() || undefined) : undefined,
          comunidad_jac_personeria: tipoDestinatario === 'COMUNIDAD' ? (comunidadJacPersoneria.trim() || undefined) : undefined,
          comunidad_jac_representante: tipoDestinatario === 'COMUNIDAD' ? (comunidadJacRepresentante.trim() || undefined) : undefined,
          comunidad_jac_telefono: tipoDestinatario === 'COMUNIDAD' ? (comunidadJacTelefono.trim() || undefined) : undefined,
          es_local_comercial: tipoInmueble === 'Local comercial' || esLocalComercial,
          comercio_razon_social: comercioRazonSocial.trim() || undefined,
          comercio_nit_rut: comercioNitRut.trim() || undefined,
          comercio_afectacion_mercancia: comercioAfectacionMercancia.trim() || undefined,
          infraestructuras_rurales: infraestructurasRurales.length > 0 ? infraestructurasRurales : undefined,
          ciudadano: {
            documento: documento.trim(),
            nombres: nombres.trim(),
            apellidos: apellidos.trim(),
            telefono: telefono.trim() || undefined,
            direccion: direccion.trim() || undefined,
            id_sector: sectorId,
          },
          ubicacion: {
            direccion_afectacion: direccion.trim() || 'Sector Afectado',
            id_sector: sectorId,
            latitud_gps: latitud,
            longitud_gps: longitud,
            observaciones_sector: observacionSector.trim() || undefined,
          },
          evaluacion_dano: {
            tipo_inmueble: tipoInmueble,
            nivel_afectacion_vivienda: afectacionNivel,
            nivel_afectacion_techo: techoDamageLevel,
            nivel_afectacion_paredes: paredesDamageLevel,
            nivel_afectacion_pisos: pisosDamageLevel,
            otros_danos_descripcion: otrosDanosDescripcion.trim() || undefined,
            estimacion_perdidas_pesos: parseFloat(estimacionPerdidasPesos) || 0,
            propietario_nombre: esPropietarioSolicitante ? `${nombres.trim()} ${apellidos.trim()}` : (propietarioNombre.trim() || undefined),
            propietario_documento: esPropietarioSolicitante ? documento.trim() : (propietarioDocumento.trim() || undefined),
            propietario_telefono: esPropietarioSolicitante ? (telefono.trim() || undefined) : (propietarioTelefono.trim() || undefined),
            es_propietario_solicitante: esPropietarioSolicitante,
            requiere_evacuacion: evacuar,
            visita_campo_realizada: registroModo === 'VISITA_TECNICA' ? true : visita,
            censo_oficial_realizado: censo,
            requiere_albergue: albergue,
            cuenta_red_apoyo: redApoyo,
            afectacion_infraestructura_productiva: infraestructurasRurales.length > 0,
            observaciones_dano: obsAfectacionPartes.join(' ') || undefined,
            fotos_techo: fotosTecho.slice(0, 6),
            fotos_estructura: fotosEstructura.slice(0, 6),
            banco_materiales_json: bancoMateriales,
            solicitado_por_materiales: solicitadoPorMateriales.trim() || `${nombres.trim()} ${apellidos.trim()}`.trim() || undefined,
          },
          banco_materiales_json: bancoMateriales,
          solicitado_por_materiales: solicitadoPorMateriales.trim() || `${nombres.trim()} ${apellidos.trim()}`.trim() || undefined,
          subtipo_emergencia: subtipoEmergencia,
          estimacion_perdidas_pesos: parseFloat(estimacionPerdidasPesos) || 0,
          fotos_inmueble: [],
          fotos_techo: fotosTecho.slice(0, 6),
          fotos_estructura: fotosEstructura.slice(0, 6),
          formulario_rufe: {
            fecha_rufe: fechaRufe,
            corregimiento: corregimiento.trim() || undefined,
            residencia_habitual: residenciaHabitual !== null ? residenciaHabitual : true,
            evacuado_residencia: evacuadoResidencia !== null ? evacuadoResidencia : false,
            forma_tenencia: formaTenenciaRufe,
            tipo_bien: tipoBienRufe,
            estado_bien: estadoBienRufe,
            tiene_afectacion_agropecuaria: !!cultivoTipo || !!pecuarioEspecie,
            tipo_cultivo: cultivoTipo.trim() || undefined,
            unidad_area_cultivo: cultivoUnidad,
            area_cultivo_afectada: cultivoArea ? parseFloat(cultivoArea) : undefined,
            especie_pecuaria: pecuarioEspecie.trim() || undefined,
            cantidad_animales_afectados: pecuarioCantidad ? parseInt(pecuarioCantidad) : undefined,
            vobo_cmgrd: voboCmgrd,
          },
          nucleo_familiar: {
            es_propietario: esPropietario !== null ? esPropietario : true,
            edad_jefe_hogar: edad ? parseInt(edad) : undefined,
            tiene_acompanantes: hayAcompanantes,
            cantidad_acompanantes: hayAcompanantes ? numAcompanantes : 0,
            tiene_adultos_mayores: hayAdultosMayores,
            cantidad_adultos_mayores: hayAdultosMayores ? numAdultosMayores : 0,
            tiene_ninos: hayNinos,
            cantidad_ninos: hayNinos ? numNinos : 0,
            tiene_discapacidad: false,
            observaciones_familia: observacionIdentificacion.trim() || undefined,
            integrantes: nucleoFamiliar.filter((f) => f.nombres.trim() !== '').map((f) => ({
              nombres: f.nombres.trim(),
              apellidos: f.apellidos?.trim() || undefined,
              tipo_documento: f.tipo_documento || 'CC',
              documento: f.documento?.trim() || undefined,
              parentesco: f.parentesco || 'Otro familiar / Pariente',
              genero: f.identidad_genero || 'Masculino',
              fecha_nacimiento: f.fecha_nacimiento || undefined,
              grupo_etnico: f.grupo_etnico || undefined,
              telefono: f.telefono?.trim() || undefined,
            })),
          },
          items_solicitados: mappedItems.length > 0 ? mappedItems : [{ id_item: itemsAyuda[0]?.id_item || 1, cantidad: 1 }],
          fotos_evidencia: fotosEntrega.slice(0, 6),
        };

        await sacService.actualizarSolicitud(editingSolicitudId, payload);

        if (registroModo === 'VISITA_TECNICA') {
          const obsVisitaTexto = [
            `[VERIFICACIÓN DE REPORTE: ${
              visitaVerificacionReporte === 'CONFIRMADO'
                ? 'Confirmado - Coincide con lo reportado en la solicitud'
                : visitaVerificacionReporte === 'AJUSTADO'
                  ? 'Ajustado en campo - Se modificó la evaluación tras inspección técnica'
                  : 'Descartado - No se evidencia afectación atribuible al evento'
            }]`,
            visitaObservacionesTecnicas.trim() || otrosDanosDescripcion.trim() || observacionAfectacion.trim(),
          ]
            .filter(Boolean)
            .join(' — ');

          const resVisita = await sacService.registrarVisitaTecnica(editingSolicitudId, {
            profesional_responsable:
              (visitaProfesionalResponsable || `${user?.nombres || ''} ${user?.apellidos || ''}`).trim() ||
              'Profesional Técnico SAD',
            cargo_responsable: visitaCargoResponsable.trim() || 'Técnico / Ingeniero Gestión del Riesgo',
            dictamen_tecnico:
              visitaDictamenHabitabilidad ||
              (evacuar ? 'NO_HABITABLE' : afectacionNivel === 'Grave' ? 'USO_CON_PRECAUCION' : 'HABITABLE'),
            afectacion_muros: paredesDamageLevel,
            afectacion_techos: techoDamageLevel,
            afectacion_pisos: pisosDamageLevel,
            requiere_evacuacion: evacuar,
            requiere_demolicion: afectacionNivel === 'Colapso Total',
            costo_estimado_danos:
              (parseFloat(estimacionPerdidasPesos) || 0) +
              infraestructurasRurales.reduce((acc, r) => acc + (Number(r.costo_estimado_reparacion) || 0), 0),
            observaciones_tecnicas:
              obsVisitaTexto || 'Visita técnica de verificación y re-evaluación de la vivienda realizada en terreno.',
            fotos_evidencia: [...fotosTecho, ...fotosEstructura, ...fotosEntrega].slice(0, 6),
            fotos_techo: fotosTecho.slice(0, 6),
            fotos_estructura: fotosEstructura.slice(0, 6),
            banco_materiales_json: bancoMateriales,
            solicitado_por_materiales:
              solicitadoPorMateriales.trim() || `${nombres.trim()} ${apellidos.trim()}`.trim() || undefined,
          });
          showToast(
            `¡Visita Técnica #${resVisita.numero_visita || ''} registrada y evaluación de la vivienda ${editingSolicitudCodigo || `SOL-${editingSolicitudId}`} actualizada exitosamente!`,
            'success'
          );
        } else {
          showToast(`¡Solicitud ${editingSolicitudCodigo || `SOL-${editingSolicitudId}`} actualizada exitosamente!`, 'success');
        }
        resetFormState();
      } else if (registroModo === 'SOLICITUD_SOLO') {
        const mappedItems = itemsAyuda
          .filter((item) => selectedSubtipos.some((sub) => sub.toLowerCase().includes(item.nombre_item.toLowerCase())))
          .map((item) => ({ id_item: item.id_item, cantidad: cantidadesSubtipos[item.nombre_item] || 1 }));

        const obsAfectacionPartes: string[] = [];
        if (techoDamageLevel !== 'Ninguno' || observacionTecho.trim()) {
          obsAfectacionPartes.push(`[TECHO: Nivel ${techoDamageLevel}${observacionTecho.trim() ? ` | Obs: ${observacionTecho.trim()}` : ''}]`);
        }
        if (estructuraDamageLevel !== 'Ninguno' || observacionEstructura.trim()) {
          obsAfectacionPartes.push(`[ESTRUCTURA: Nivel ${estructuraDamageLevel}${observacionEstructura.trim() ? ` | Obs: ${observacionEstructura.trim()}` : ''}]`);
        }
        if (observacionAfectacion.trim()) {
          obsAfectacionPartes.push(observacionAfectacion.trim());
        }

        const payload = {
          id_evento: selectedEventoId,
          tipo_destinatario: tipoDestinatario,
          id_nucleo: idNucleoVinculado,
          nombre_comunidad: tipoDestinatario === 'COMUNIDAD' ? (nombreComunidad.trim() || direccion.trim() || 'Comunidad del Sector') : undefined,
          ficha_catastral: fichaCatastral.trim() || undefined,
          tipo_tenencia: tipoTenencia,
          comunidad_jac_nombre: tipoDestinatario === 'COMUNIDAD' ? (comunidadJacNombre.trim() || undefined) : undefined,
          comunidad_jac_personeria: tipoDestinatario === 'COMUNIDAD' ? (comunidadJacPersoneria.trim() || undefined) : undefined,
          comunidad_jac_representante: tipoDestinatario === 'COMUNIDAD' ? (comunidadJacRepresentante.trim() || undefined) : undefined,
          comunidad_jac_telefono: tipoDestinatario === 'COMUNIDAD' ? (comunidadJacTelefono.trim() || undefined) : undefined,
          es_local_comercial: tipoInmueble === 'Local comercial' || esLocalComercial,
          comercio_razon_social: comercioRazonSocial.trim() || undefined,
          comercio_nit_rut: comercioNitRut.trim() || undefined,
          comercio_afectacion_mercancia: comercioAfectacionMercancia.trim() || undefined,
          infraestructuras_rurales: infraestructurasRurales.length > 0 ? infraestructurasRurales : undefined,
          ciudadano: {
            documento: documento.trim(),
            nombres: nombres.trim(),
            apellidos: apellidos.trim(),
            telefono: telefono.trim() || undefined,
            direccion: direccion.trim() || undefined,
            id_sector: sectorId,
          },
          ubicacion: {
            direccion_afectacion: direccion.trim() || 'Sector Afectado',
            id_sector: sectorId,
            latitud_gps: latitud,
            longitud_gps: longitud,
            observaciones_sector: observacionSector.trim() || undefined,
          },
          evaluacion_dano: {
            tipo_inmueble: tipoInmueble,
            nivel_afectacion_vivienda: afectacionNivel,
            nivel_afectacion_techo: techoDamageLevel,
            nivel_afectacion_paredes: paredesDamageLevel,
            nivel_afectacion_pisos: pisosDamageLevel,
            otros_danos_descripcion: otrosDanosDescripcion.trim() || undefined,
            estimacion_perdidas_pesos: parseFloat(estimacionPerdidasPesos) || 0,
            propietario_nombre: esPropietarioSolicitante ? `${nombres.trim()} ${apellidos.trim()}` : (propietarioNombre.trim() || undefined),
            propietario_documento: esPropietarioSolicitante ? documento.trim() : (propietarioDocumento.trim() || undefined),
            propietario_telefono: esPropietarioSolicitante ? (telefono.trim() || undefined) : (propietarioTelefono.trim() || undefined),
            es_propietario_solicitante: esPropietarioSolicitante,
            requiere_evacuacion: evacuar,
            visita_campo_realizada: visita,
            censo_oficial_realizado: censo,
            requiere_albergue: albergue,
            cuenta_red_apoyo: redApoyo,
            afectacion_infraestructura_productiva: false,
            observaciones_dano: obsAfectacionPartes.join(' ') || undefined,
            fotos_techo: fotosTecho.slice(0, 6),
            fotos_estructura: fotosEstructura.slice(0, 6),
            banco_materiales_json: bancoMateriales,
            solicitado_por_materiales: solicitadoPorMateriales.trim() || `${nombres.trim()} ${apellidos.trim()}`.trim() || undefined,
          },
          banco_materiales_json: bancoMateriales,
          solicitado_por_materiales: solicitadoPorMateriales.trim() || `${nombres.trim()} ${apellidos.trim()}`.trim() || undefined,
          subtipo_emergencia: subtipoEmergencia,
          estimacion_perdidas_pesos: parseFloat(estimacionPerdidasPesos) || 0,
          fotos_inmueble: [],
          fotos_techo: fotosTecho.slice(0, 6),
          fotos_estructura: fotosEstructura.slice(0, 6),
          formulario_rufe: {
            fecha_rufe: fechaRufe,
            corregimiento: corregimiento.trim() || undefined,
            residencia_habitual: residenciaHabitual !== null ? residenciaHabitual : true,
            evacuado_residencia: evacuadoResidencia !== null ? evacuadoResidencia : false,
            forma_tenencia: formaTenenciaRufe,
            tipo_bien: tipoBienRufe,
            estado_bien: estadoBienRufe,
            tiene_afectacion_agropecuaria: !!cultivoTipo || !!pecuarioEspecie,
            tipo_cultivo: cultivoTipo.trim() || undefined,
            unidad_area_cultivo: cultivoUnidad,
            area_cultivo_afectada: cultivoArea ? parseFloat(cultivoArea) : undefined,
            especie_pecuaria: pecuarioEspecie.trim() || undefined,
            cantidad_animales_afectados: pecuarioCantidad ? parseInt(pecuarioCantidad) : undefined,
            vobo_cmgrd: voboCmgrd,
          },
          nucleo_familiar: {
            es_propietario: esPropietario !== null ? esPropietario : true,
            edad_jefe_hogar: edad ? parseInt(edad) : undefined,
            tiene_acompanantes: hayAcompanantes,
            cantidad_acompanantes: hayAcompanantes ? numAcompanantes : 0,
            tiene_adultos_mayores: hayAdultosMayores,
            cantidad_adultos_mayores: hayAdultosMayores ? numAdultosMayores : 0,
            tiene_ninos: hayNinos,
            cantidad_ninos: hayNinos ? numNinos : 0,
            tiene_discapacidad: false,
            observaciones_familia: observacionIdentificacion.trim() || undefined,
            integrantes: nucleoFamiliar.filter((f) => f.nombres.trim() !== '').map((f) => ({
              nombres: f.nombres.trim(),
              apellidos: f.apellidos?.trim() || undefined,
              tipo_documento: f.tipo_documento || 'CC',
              documento: f.documento?.trim() || undefined,
              parentesco: f.parentesco || 'Otro familiar / Pariente',
              genero: f.identidad_genero || 'Masculino',
              fecha_nacimiento: f.fecha_nacimiento || undefined,
              grupo_etnico: f.grupo_etnico || undefined,
              telefono: f.telefono?.trim() || undefined,
            })),
          },
          items_solicitados: mappedItems.length > 0 ? mappedItems : [{ id_item: itemsAyuda[0]?.id_item || 1, cantidad: 1 }],
          fotos_evidencia: fotosEntrega.slice(0, 6),
        };

        const res = await sacService.crearCenso(payload);
        showToast(`¡Solicitud ${res.codigo_solicitud} registrada con éxito!`, 'success');
        setHistorialRegistros((prev) => [res, ...prev]);
        resetFormState();
      } else if (registroModo === 'ENTREGA_DIRECTA') {
        const mappedItems = itemsAyuda
          .filter((item) => selectedSubtipos.some((sub) => sub.toLowerCase().includes(item.nombre_item.toLowerCase())))
          .map((item) => ({ id_item: item.id_item, cantidad: cantidadesSubtipos[item.nombre_item] || 1 }));

        const payload = {
          id_evento: selectedEventoId,
          tipo_destinatario: tipoDestinatario,
          id_nucleo: idNucleoVinculado,
          nombre_comunidad: tipoDestinatario === 'COMUNIDAD' ? (nombreComunidad.trim() || direccion.trim() || 'Comunidad del Sector') : undefined,
          ficha_catastral: fichaCatastral.trim() || undefined,
          tipo_tenencia: tipoTenencia,
          comunidad_jac_nombre: tipoDestinatario === 'COMUNIDAD' ? (comunidadJacNombre.trim() || undefined) : undefined,
          comunidad_jac_personeria: tipoDestinatario === 'COMUNIDAD' ? (comunidadJacPersoneria.trim() || undefined) : undefined,
          comunidad_jac_representante: tipoDestinatario === 'COMUNIDAD' ? (comunidadJacRepresentante.trim() || undefined) : undefined,
          comunidad_jac_telefono: tipoDestinatario === 'COMUNIDAD' ? (comunidadJacTelefono.trim() || undefined) : undefined,
          es_local_comercial: tipoInmueble === 'Local comercial' || esLocalComercial,
          comercio_razon_social: comercioRazonSocial.trim() || undefined,
          comercio_nit_rut: comercioNitRut.trim() || undefined,
          comercio_afectacion_mercancia: comercioAfectacionMercancia.trim() || undefined,
          infraestructuras_rurales: infraestructurasRurales.length > 0 ? infraestructurasRurales : undefined,
          ciudadano: {
            documento: documento.trim(),
            nombres: nombres.trim(),
            apellidos: apellidos.trim(),
            telefono: telefono.trim() || undefined,
            direccion: direccion.trim() || undefined,
          },
          id_sector: sectorId,
          latitud: latitud,
          longitud: longitud,
          id_item: mappedItems[0]?.id_item || itemsAyuda[0]?.id_item || 1,
          cantidad: mappedItems[0]?.cantidad || cantidadAyuda || totalCantidadCalculada || 1,
          items_entregados: mappedItems.length > 0 ? mappedItems : undefined,
          observaciones: observaciones.trim() || undefined,
          fotos_evidencia: fotosEntrega,
          fotos_entrega: fotosEntrega,
          costo_estimado_ayuda: parseFloat(costoEstimadoAyuda) || 0,
          id_entidad_donante: selectedEntidadDonanteId || undefined,
          costo_total_entrega: parseFloat(costoEstimadoAyuda) || undefined,
          documento_receptor: documentoReceptor.trim() || documento.trim() || undefined,
          nombre_receptor: nombreReceptor.trim() || `${nombres.trim()} ${apellidos.trim()}` || undefined,
        };
        const res = await sacService.registrarEntregaInmediata(payload);
        showToast(`¡Entrega ${res.codigo_entrega} registrada exitosamente!`, 'success');
        setHistorialRegistros((prev) => [res, ...prev]);
        resetFormState();
      } else if (registroModo === 'ENTREGA_EXISTENTE') {
        if (!selectedRequest) {
          showToast('Por favor, selecciona una solicitud pendiente para realizar la entrega.', 'warning');
          return;
        }

        const mappedItems = itemsAyuda
          .filter((item) => selectedSubtipos.some((sub) => sub.toLowerCase().includes(item.nombre_item.toLowerCase())))
          .map((item) => ({ id_item: item.id_item, cantidad: cantidadesSubtipos[item.nombre_item] || 1 }));

        const payload = {
          id_solicitud: selectedRequest.id_solicitud,
          tipo_destinatario: selectedRequest.tipo_destinatario || tipoDestinatario,
          id_nucleo: selectedRequest.id_nucleo || idNucleoVinculado,
          nombre_comunidad: selectedRequest.nombre_comunidad || (tipoDestinatario === 'COMUNIDAD' ? nombreComunidad.trim() : undefined),
          id_item: mappedItems[0]?.id_item || itemsAyuda[0]?.id_item || 1,
          cantidad: mappedItems[0]?.cantidad || cantidadAyuda || totalCantidadCalculada || 1,
          items_entregados: mappedItems.length > 0 ? mappedItems : undefined,
          observaciones: observaciones.trim() || undefined,
          fotos_evidencia: fotosEntrega,
          fotos_entrega: fotosEntrega,
          costo_estimado_ayuda: parseFloat(costoEstimadoAyuda) || 0,
          id_entidad_donante: selectedEntidadDonanteId || undefined,
          costo_total_entrega: parseFloat(costoEstimadoAyuda) || undefined,
          documento_receptor: documentoReceptor.trim() || undefined,
          nombre_receptor: nombreReceptor.trim() || undefined,
        };
        const res = await sacService.registrarEntregaExistente(payload);
        showToast(`¡Entrega ${res.codigo_entrega} completada para ${selectedRequest.codigo_solicitud || selectedRequest.id_solicitud}!`, 'success');
        setHistorialRegistros((prev) => [res, ...prev]);
        resetFormState();
      }

      fetchSolicitudes();
      loadDashboard();
    } catch (err: any) {
      let errorServidor = 'Error al procesar el registro en el servidor.';
      if (err.response?.data) {
        const d = err.response.data.detail || err.response.data.mensaje || err.response.data.message;
        if (typeof d === 'string') {
          errorServidor = d;
        } else if (Array.isArray(d)) {
          errorServidor = d.map((it: any) => {
            const loc = Array.isArray(it.loc) ? it.loc.filter((x: any) => x !== 'body').join(' -> ') : 'Campo';
            return `• ${loc}: ${it.msg || it.message || JSON.stringify(it)}`;
          }).join('\n');
        } else if (typeof d === 'object') {
          errorServidor = JSON.stringify(d, null, 2);
        }
      } else if (err.message) {
        errorServidor = err.message;
      }

      showToast('No se pudo enviar el formulario. Revise los motivos.', 'error');
      setValidationModal({
        isOpen: true,
        title: 'Error del servidor al registrar',
        motivos: [],
        errorServidor,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!solicitudToDelete) return;
    setDeleting(true);
    try {
      const res = await sacService.eliminarSolicitud(solicitudToDelete.id_solicitud);
      showToast(res.mensaje || 'Solicitud eliminada exitosamente.', 'success');
      setIsDeleteModalOpen(false);
      setSolicitudToDelete(null);
      fetchSolicitudes();
      loadDashboard();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Error al eliminar la solicitud.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Evento Activo Seleccionado
  const eventoActivoActual = useMemo(() => {
    return eventos.find((ev) => ev.id_evento === selectedEventoId) || eventos[0] || null;
  }, [eventos, selectedEventoId]);

  // Guardar / Cargar Borrador Local (Apple UX)
  const handleGuardarBorrador = () => {
    try {
      const draftData = {
        selectedEventoId,
        registroModo,
        tipoDestinatario,
        documento,
        nombres,
        apellidos,
        telefono,
        direccion,
        sectorId,
        observacionSector,
        latitud,
        longitud,
        edad,
        esPropietario,
        hayAcompanantes,
        numAcompanantes,
        hayAdultosMayores,
        numAdultosMayores,
        hayNinos,
        numNinos,
        nucleoFamiliar,
        fechaRufe,
        corregimiento,
        residenciaHabitual,
        evacuadoResidencia,
        formaTenenciaRufe,
        estadoBienRufe,
        tipoBienRufe,
        cultivoTipo,
        cultivoUnidad,
        cultivoArea,
        pecuarioEspecie,
        pecuarioCantidad,
        voboCmgrd,
        evacuar,
        visita,
        censo,
        albergue,
        redApoyo,
        techoDamageLevel,
        estructuraDamageLevel,
        paredesDamageLevel,
        pisosDamageLevel,
        afectacionNivel,
        observacionTecho,
        observacionEstructura,
        observacionAfectacion,
        otrosDanosDescripcion,
        tipoInmueble,
        estimacionPerdidasPesos,
        selectedSubtipos,
        cantidadesSubtipos,
        observaciones,
        fotosTecho,
        fotosEstructura,
        fotosEntrega,
        bancoMateriales,
        solicitadoPorMateriales,
        fichaCatastral,
        tipoTenencia,
        subtipoEmergencia,
        savedAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      };
      localStorage.setItem('sad_borrador_formulario_v2', JSON.stringify(draftData));
      setBorradorGuardadoHora(draftData.savedAt);
      showToast('Borrador guardado localmente con éxito.', 'success');
    } catch {
      showToast('No se pudo guardar el borrador en este dispositivo.', 'warning');
    }
  };

  const handleCargarBorrador = () => {
    try {
      const raw = localStorage.getItem('sad_borrador_formulario_v2');
      if (!raw) {
        showToast('No hay ningún borrador guardado en este navegador.', 'warning');
        return;
      }
      const p = JSON.parse(raw);
      if (p.selectedEventoId) setSelectedEventoId(p.selectedEventoId);
      if (p.registroModo) setRegistroModo(p.registroModo);
      if (p.tipoDestinatario) setTipoDestinatario(p.tipoDestinatario);
      if (p.documento) setDocumento(p.documento);
      if (p.nombres) setNombres(p.nombres);
      if (p.apellidos) setApellidos(p.apellidos);
      if (p.telefono) setTelefono(p.telefono);
      if (p.direccion) setDireccion(p.direccion);
      if (p.sectorId) setSectorId(p.sectorId);
      if (p.observacionSector) setObservacionSector(p.observacionSector);
      if (p.latitud) setLatitud(p.latitud);
      if (p.longitud) setLongitud(p.longitud);
      if (p.edad) setEdad(p.edad);
      if (p.esPropietario !== undefined) setEsPropietario(p.esPropietario);
      if (p.nucleoFamiliar) setNucleoFamiliar(p.nucleoFamiliar);
      if (p.techoDamageLevel) setTechoDamageLevel(p.techoDamageLevel);
      if (p.estructuraDamageLevel) setEstructuraDamageLevel(p.estructuraDamageLevel);
      if (p.paredesDamageLevel) setParedesDamageLevel(p.paredesDamageLevel);
      if (p.pisosDamageLevel) setPisosDamageLevel(p.pisosDamageLevel);
      if (p.afectacionNivel) setAfectacionNivel(p.afectacionNivel);
      if (p.observacionTecho) setObservacionTecho(p.observacionTecho);
      if (p.observacionEstructura) setObservacionEstructura(p.observacionEstructura);
      if (p.selectedSubtipos) setSelectedSubtipos(p.selectedSubtipos);
      if (p.cantidadesSubtipos) setCantidadesSubtipos(p.cantidadesSubtipos);
      if (p.observaciones) setObservaciones(p.observaciones);
      if (p.fotosTecho) setFotosTecho(p.fotosTecho);
      if (p.fotosEstructura) setFotosEstructura(p.fotosEstructura);
      if (p.fotosEntrega) setFotosEntrega(p.fotosEntrega);
      if (Array.isArray(p.bancoMateriales) && p.bancoMateriales.length > 0) setBancoMateriales(p.bancoMateriales);
      if (p.solicitadoPorMateriales !== undefined) setSolicitadoPorMateriales(p.solicitadoPorMateriales);
      if (p.fichaCatastral !== undefined) setFichaCatastral(p.fichaCatastral);
      if (p.tipoTenencia) setTipoTenencia(p.tipoTenencia);
      if (p.subtipoEmergencia) setSubtipoEmergencia(p.subtipoEmergencia);
      showToast(`Borrador del ${p.savedAt || ''} restaurado con éxito.`, 'success');
    } catch {
      showToast('Error al leer el borrador guardado.', 'error');
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sad_borrador_formulario_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.savedAt) setBorradorGuardadoHora(parsed.savedAt);
      }
    } catch {
      // ignore
    }
  }, []);

  // Abrir Modal de Crear / Editar Evento (Mockup 3)
  const handleAbrirModalEvento = (evToEdit?: any, presetTipo?: string) => {
    if (!canManageEventos) {
      showToast('Tu perfil no tiene permisos para crear nuevos eventos de emergencia.', 'warning');
      return;
    }
    if (evToEdit) {
      setEditingEventoObj(evToEdit);
      setNuevoEventoForm({
        tipo_evento: evToEdit.tipo_evento || 'Terremoto',
        fecha_evento: (evToEdit.fecha_evento || new Date().toISOString().slice(0, 10)) + 'T10:24',
        nombre_evento: evToEdit.nombre_evento || '',
        ambito_territorial: evToEdit.ambito_territorial || 'Rural',
        ubicacion_principal: 'Municipio de Anserma',
        descripcion: evToEdit.descripcion || '',
      });
    } else {
      const defaultTipo = presetTipo || selectedEmergencyTypeCard || 'Terremoto';
      setEditingEventoObj(null);
      setNuevoEventoForm({
        tipo_evento: defaultTipo,
        fecha_evento: new Date().toISOString().slice(0, 16),
        nombre_evento: `${defaultTipo} Anserma`,
        ambito_territorial: 'Rural',
        ubicacion_principal: 'Municipio de Anserma',
        descripcion: '',
      });
    }
    setIsCrearEventoModalOpen(true);
  };

  const handleGuardarEventoModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEventoForm.nombre_evento.trim()) {
      showToast('Por favor ingresa el nombre del evento.', 'warning');
      return;
    }
    setSavingEvento(true);
    try {
      if (editingEventoObj) {
        await sacService.actualizarEvento(editingEventoObj.id_evento, {
          nombre_evento: nuevoEventoForm.nombre_evento.trim(),
          tipo_evento: nuevoEventoForm.tipo_evento,
          fecha_evento: nuevoEventoForm.fecha_evento,
          ambito_territorial: nuevoEventoForm.ambito_territorial,
          descripcion: nuevoEventoForm.descripcion.trim(),
        });
        showToast(`Evento "${nuevoEventoForm.nombre_evento}" actualizado correctamente.`, 'success');
      } else {
        const res = await sacService.crearEvento({
          nombre_evento: nuevoEventoForm.nombre_evento.trim(),
          tipo_evento: nuevoEventoForm.tipo_evento,
          fecha_evento: nuevoEventoForm.fecha_evento,
          ambito_territorial: nuevoEventoForm.ambito_territorial,
          descripcion: nuevoEventoForm.descripcion.trim(),
        });
        showToast(res.mensaje || `Evento "${nuevoEventoForm.nombre_evento}" creado exitosamente.`, 'success');
        if (res.id_evento) {
          setSelectedEventoId(res.id_evento);
        }
      }
      setIsCrearEventoModalOpen(false);
      const evs = await sacService.getEventos();
      setEventos(evs);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'No se pudo guardar el evento.', 'error');
    } finally {
      setSavingEvento(false);
    }
  };

  // Indicador de estado por cada una de las 6 pestañas del formulario
  const getFormTabCompleted = (step: 1 | 2 | 3 | 4 | 5 | 6): boolean => {
    switch (step) {
      case 1:
        return Boolean(documento.trim() && nombres.trim() && apellidos.trim() && sectorId);
      case 2:
        return Boolean(idNucleoVinculado || nucleoFamiliar.length > 0 || edad.trim() !== '' || esPropietario !== null);
      case 3:
        return Boolean(fechaRufe && estadoBienRufe && formaTenenciaRufe);
      case 4:
        return Boolean(afectacionNivel !== 'Ninguno' || techoDamageLevel !== 'Ninguno' || estructuraDamageLevel !== 'Ninguno' || visita || censo);
      case 5:
        return selectedSubtipos.length > 0;
      case 6:
        return Boolean(observaciones.trim() !== '' || fotosEntrega.length > 0);
      default:
        return false;
    }
  };

  // Filtros Ejecutivos para Dashboard (Inicio, Evaluaciones y Reportes — Perfil Alcalde / Directivo / Operativo)
  const [dashFiltroZona, setDashFiltroZona] = useState<'TODOS' | 'URBANO' | 'RURAL'>('TODOS');
  const [dashFiltroSectorId, setDashFiltroSectorId] = useState<number>(0);
  const [dashFiltroNivelDano, setDashFiltroNivelDano] = useState<'TODOS' | 'Colapso Total' | 'Grave' | 'Leve' | 'Ninguno'>('TODOS');
  const [dashFiltroEstado, setDashFiltroEstado] = useState<'TODOS' | 'pending' | 'completed'>('TODOS');
  const [dashFiltroAlcance, setDashFiltroAlcance] = useState<'TODOS' | 'INDIVIDUAL' | 'NUCLEO_FAMILIAR' | 'COMUNIDAD'>('TODOS');
  const [dashFiltroBusqueda, setDashFiltroBusqueda] = useState<string>('');

  const hayFiltrosDashboardActivos = useMemo(() => {
    return (
      dashFiltroZona !== 'TODOS' ||
      dashFiltroSectorId !== 0 ||
      dashFiltroNivelDano !== 'TODOS' ||
      dashFiltroEstado !== 'TODOS' ||
      dashFiltroAlcance !== 'TODOS' ||
      dashFiltroBusqueda.trim() !== ''
    );
  }, [dashFiltroZona, dashFiltroSectorId, dashFiltroNivelDano, dashFiltroEstado, dashFiltroAlcance, dashFiltroBusqueda]);

  const limpiarFiltrosDashboard = () => {
    setDashFiltroZona('TODOS');
    setDashFiltroSectorId(0);
    setDashFiltroNivelDano('TODOS');
    setDashFiltroEstado('TODOS');
    setDashFiltroAlcance('TODOS');
    setDashFiltroBusqueda('');
  };

  const solicitudesFiltradasDashboard = useMemo(() => {
    const q = dashFiltroBusqueda.toLowerCase().trim();
    return todasSolicitudes.filter((s) => {
      if (dashFiltroZona !== 'TODOS') {
        const secObj = sectores.find(
          (sec) => sec.id_sector === s.id_sector || sec.nombre_sector === s.nombre_sector
        );
        const isRural = secObj
          ? checkIsRuralSector(secObj)
          : (s.nombre_sector || '').toUpperCase().includes('VEREDA');
        if (dashFiltroZona === 'RURAL' && !isRural) return false;
        if (dashFiltroZona === 'URBANO' && isRural) return false;
      }
      if (dashFiltroSectorId !== 0) {
        const secSeleccionado = sectores.find((sec) => sec.id_sector === dashFiltroSectorId);
        const matchId = Number(s.id_sector) === dashFiltroSectorId;
        const matchNombre =
          secSeleccionado &&
          (s.nombre_sector || '').toLowerCase() === (secSeleccionado.nombre_sector || '').toLowerCase();
        if (!matchId && !matchNombre) return false;
      }
      if (dashFiltroNivelDano !== 'TODOS') {
        const nivelSol = s.afectacion_nivel || 'Ninguno';
        if (nivelSol !== dashFiltroNivelDano) return false;
      }
      if (dashFiltroEstado !== 'TODOS') {
        const isCompleted = s.estado_codigo === 'completed' || s.estado_atencion === 'ATENDIDO';
        if (dashFiltroEstado === 'completed' && !isCompleted) return false;
        if (dashFiltroEstado === 'pending' && isCompleted) return false;
      }
      if (dashFiltroAlcance !== 'TODOS') {
        const alcanceSol = (s.tipo_destinatario || 'NUCLEO_FAMILIAR').toUpperCase();
        if (alcanceSol !== dashFiltroAlcance) return false;
      }
      if (q) {
        const matchText =
          (s.nombre_completo || '').toLowerCase().includes(q) ||
          (s.documento || '').toLowerCase().includes(q) ||
          (s.codigo_solicitud || '').toLowerCase().includes(q) ||
          (s.nombre_sector || '').toLowerCase().includes(q) ||
          (s.direccion_afectacion || '').toLowerCase().includes(q);
        if (!matchText) return false;
      }
      return true;
    });
  }, [
    todasSolicitudes,
    sectores,
    dashFiltroZona,
    dashFiltroSectorId,
    dashFiltroNivelDano,
    dashFiltroEstado,
    dashFiltroAlcance,
    dashFiltroBusqueda,
  ]);

  // Estadísticas resumidas para Inicio y Reportes (reactivas a los filtros ejecutivos)
  const kpiResumen = useMemo(() => {
    const total = solicitudesFiltradasDashboard.length;
    const pendientes = solicitudesFiltradasDashboard.filter(
      (s) => s.estado_codigo === 'pending' && s.estado_atencion !== 'ATENDIDO'
    ).length;
    const atendidas = solicitudesFiltradasDashboard.filter(
      (s) => s.estado_codigo === 'completed' || s.estado_atencion === 'ATENDIDO'
    ).length;
    const viviendasAfectadas = solicitudesFiltradasDashboard.filter(
      (s) => s.afectacion_nivel && s.afectacion_nivel !== 'Ninguno'
    ).length;
    const personasAfectadas = total * 4;
    return { total, pendientes, atendidas, viviendasAfectadas, personasAfectadas };
  }, [solicitudesFiltradasDashboard]);

  // Barra de Filtros Ejecutivos Reutilizable (Apple Design System)
  const renderBarraFiltrosEjecutivos = () => (
    <div className="bg-white rounded-[16px] p-4 border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[9px] bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-[#1D1D1F]">
            Filtros de consulta y monitoreo
          </span>
          <span className="text-[11px] font-medium text-[#6E6E73] bg-[#F5F5F7] px-2.5 py-0.5 rounded-full border border-[#E5E5EA]">
            Mostrando {solicitudesFiltradasDashboard.length} de {todasSolicitudes.length} solicitudes
          </span>
        </div>

        {hayFiltrosDashboardActivos && (
          <button
            type="button"
            onClick={limpiarFiltrosDashboard}
            className="px-3 py-1 rounded-[9px] bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#007AFF] text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
        {/* 1. Evento de Emergencia */}
        <div>
          <label className="block text-[10px] font-semibold text-[#6E6E73] uppercase mb-1">
            Evento de emergencia
          </label>
          <select
            value={selectedEventoId}
            onChange={(e) => {
              const nextEv = Number(e.target.value);
              setSelectedEventoId(nextEv);
              fetchSolicitudes(nextEv);
              loadDashboard(nextEv);
            }}
            className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#D2D2D7] rounded-[10px] text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#007AFF] cursor-pointer"
          >
            {eventos.map((ev) => (
              <option key={ev.id_evento} value={ev.id_evento}>
                {ev.nombre_evento} ({ev.estado_evento})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Zona / Ámbito */}
        <div>
          <label className="block text-[10px] font-semibold text-[#6E6E73] uppercase mb-1">
            Ámbito territorial
          </label>
          <select
            value={dashFiltroZona}
            onChange={(e) => {
              setDashFiltroZona(e.target.value as any);
              setDashFiltroSectorId(0);
            }}
            className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#D2D2D7] rounded-[10px] text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#007AFF] cursor-pointer"
          >
            <option value="TODOS">Todas las zonas</option>
            <option value="RURAL">Zona Rural (Veredas)</option>
            <option value="URBANO">Zona Urbana (Barrios)</option>
          </select>
        </div>

        {/* 3. Sector / Vereda / Barrio */}
        <div>
          <label className="block text-[10px] font-semibold text-[#6E6E73] uppercase mb-1">
            Sector / Vereda / Barrio
          </label>
          <select
            value={dashFiltroSectorId}
            onChange={(e) => setDashFiltroSectorId(Number(e.target.value))}
            className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#D2D2D7] rounded-[10px] text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#007AFF] cursor-pointer"
          >
            <option value={0}>Todos los sectores ({sectores.length})</option>
            {sectores
              .filter((sec) => {
                if (dashFiltroZona === 'RURAL') return checkIsRuralSector(sec);
                if (dashFiltroZona === 'URBANO') return !checkIsRuralSector(sec);
                return true;
              })
              .map((sec) => (
                <option key={sec.id_sector} value={sec.id_sector}>
                  {sec.nombre_sector}
                </option>
              ))}
          </select>
        </div>

        {/* 4. Nivel de Daño en Vivienda */}
        <div>
          <label className="block text-[10px] font-semibold text-[#6E6E73] uppercase mb-1">
            Nivel de afectación
          </label>
          <select
            value={dashFiltroNivelDano}
            onChange={(e) => setDashFiltroNivelDano(e.target.value as any)}
            className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#D2D2D7] rounded-[10px] text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#007AFF] cursor-pointer"
          >
            <option value="TODOS">Todos los niveles</option>
            <option value="Colapso Total">Daño grave / Colapso</option>
            <option value="Grave">Daño moderado / Grave</option>
            <option value="Leve">Daño leve</option>
            <option value="Ninguno">Sin afectación</option>
          </select>
        </div>

        {/* 5. Estado de Atención */}
        <div>
          <label className="block text-[10px] font-semibold text-[#6E6E73] uppercase mb-1">
            Estado de la solicitud
          </label>
          <select
            value={dashFiltroEstado}
            onChange={(e) => setDashFiltroEstado(e.target.value as any)}
            className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#D2D2D7] rounded-[10px] text-xs font-semibold text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#007AFF] cursor-pointer"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="pending">Pendientes de atención</option>
            <option value="completed">Atendidas</option>
          </select>
        </div>

        {/* 6. Búsqueda por Cédula, Nombre o Código */}
        <div>
          <label className="block text-[10px] font-semibold text-[#6E6E73] uppercase mb-1">
            Buscar afectado / código
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6E6E73]" />
            <input
              type="text"
              value={dashFiltroBusqueda}
              onChange={(e) => setDashFiltroBusqueda(e.target.value)}
              placeholder="Cédula, nombre o SOL-..."
              className="w-full pl-8 pr-2.5 py-2 bg-[#F5F5F7] border border-[#D2D2D7] rounded-[10px] text-xs font-medium text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#007AFF]"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const eventosFiltradosVista = useMemo(() => {
    const q = eventoSearchText.toLowerCase().trim();
    return eventos.filter((ev) => {
      const est = (ev.estado_evento || 'Activo').toLowerCase();
      if (eventoFiltroTab === 'activos' && est !== 'activo' && est !== 'en atención') return false;
      if (eventoFiltroTab === 'finalizados' && est === 'activo') return false;
      if (q) {
        const match =
          (ev.nombre_evento || '').toLowerCase().includes(q) ||
          (ev.tipo_evento || '').toLowerCase().includes(q) ||
          (ev.codigo_evento || '').toLowerCase().includes(q) ||
          (ev.ubicacion_principal || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [eventos, eventoFiltroTab, eventoSearchText]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans">
      <NavbarSAC />

      {/* Floating Toast Notification (Apple Pill Style) */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[9999] animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.14)] text-white font-semibold flex items-center gap-3 border ${toast.type === 'success'
              ? 'bg-[#34C759] border-[#34C759]'
              : toast.type === 'error'
                ? 'bg-[#FF3B30] border-[#FF3B30]'
                : 'bg-[#FF9500] border-[#FF9500]'
              }`}
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="text-xs sm:text-sm">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* MODAL: Crear / Editar Nueva Emergencia (Evento) — Mockup 3 */}
      {isCrearEventoModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[20px] max-w-lg w-full p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-[#E5E5EA] space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-[#E5E5EA] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1D1D1F]">
                    {editingEventoObj ? 'Editar Emergencia (Evento)' : 'Crear Nueva Emergencia (Evento)'}
                  </h3>
                  <p className="text-xs text-[#6E6E73]">
                    Registre la información general del evento para iniciar la atención.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCrearEventoModalOpen(false)}
                className="p-1.5 rounded-full text-[#6E6E73] hover:bg-[#F5F5F7] transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarEventoModal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                    Tipo de emergencia <span className="text-[#FF3B30]">*</span>
                  </label>
                  <select
                    value={nuevoEventoForm.tipo_evento}
                    onChange={(e) => {
                      const nuevoTipo = e.target.value;
                      setNuevoEventoForm((prev) => ({
                        ...prev,
                        tipo_evento: nuevoTipo,
                        nombre_evento:
                          !editingEventoObj && (!prev.nombre_evento || prev.nombre_evento.startsWith(prev.tipo_evento))
                            ? `${nuevoTipo} Anserma`
                            : prev.nombre_evento,
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D2D2D7] rounded-[10px] text-xs font-semibold text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] focus:ring-3 focus:ring-[#007AFF]/15 cursor-pointer"
                  >
                    <option value="Terremoto">Terremoto / Sismo</option>
                    <option value="Inundación">Inundación</option>
                    <option value="Incendio">Incendio</option>
                    <option value="Deslizamiento">Deslizamiento</option>
                    <option value="Vendaval">Vendaval / Tornado</option>
                    <option value="Tsunami">Tsunami / Avenida Torrencial</option>
                    <option value="Otro evento">Otro evento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                    Fecha y hora de ocurrencia <span className="text-[#FF3B30]">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={nuevoEventoForm.fecha_evento}
                    onChange={(e) => setNuevoEventoForm((prev) => ({ ...prev, fecha_evento: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D2D2D7] rounded-[10px] text-xs font-semibold text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] focus:ring-3 focus:ring-[#007AFF]/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                    Nombre del evento <span className="text-[#FF3B30]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Terremoto Anserma"
                    value={nuevoEventoForm.nombre_evento}
                    onChange={(e) => setNuevoEventoForm((prev) => ({ ...prev, nombre_evento: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D2D2D7] rounded-[10px] text-xs font-semibold text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] focus:ring-3 focus:ring-[#007AFF]/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                    Ámbito territorial <span className="text-[#FF3B30]">*</span>
                  </label>
                  <select
                    value={nuevoEventoForm.ambito_territorial}
                    onChange={(e) => setNuevoEventoForm((prev) => ({ ...prev, ambito_territorial: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D2D2D7] rounded-[10px] text-xs font-semibold text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] focus:ring-3 focus:ring-[#007AFF]/15 cursor-pointer"
                  >
                    <option value="Rural">Rural</option>
                    <option value="Urbano">Urbano</option>
                    <option value="Urbano y Rural">Mixto (Urbano y Rural)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                  Descripción del evento
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    maxLength={500}
                    placeholder="Sismo de magnitud preliminar con afectación de viviendas y posible daño en infraestructura..."
                    value={nuevoEventoForm.descripcion}
                    onChange={(e) => setNuevoEventoForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                    className="w-full p-3 bg-white border border-[#D2D2D7] rounded-[10px] text-xs font-medium text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] focus:ring-3 focus:ring-[#007AFF]/15"
                  />
                  <span className="absolute bottom-2 right-3 text-[10px] text-[#6E6E73]">
                    {nuevoEventoForm.descripcion.length}/500
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setIsCrearEventoModalOpen(false)}
                  className="px-4 py-2.5 rounded-[10px] border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F] transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEvento}
                  className="px-5 py-2.5 rounded-[10px] bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingEvento ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>{editingEventoObj ? 'Guardar Cambios' : 'Crear Evento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirmación de Registro antes de Enviar (Apple Design System) */}
      {isConfirmSubmitModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[20px] max-w-md w-full p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-[#E5E5EA] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1D1D1F]">Confirmar Registro de Atención</h3>
                <p className="text-xs text-[#6E6E73]">
                  Verifique el resumen antes de guardar oficialmente en el SAD.
                </p>
              </div>
            </div>

            <div className="bg-[#F5F5F7] rounded-xl p-3.5 space-y-2 text-xs border border-[#E5E5EA]">
              <div className="flex justify-between">
                <span className="text-[#6E6E73]">Evento:</span>
                <strong className="text-[#1D1D1F]">{eventoActivoActual?.nombre_evento || 'Activo'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E6E73]">Modalidad:</span>
                <strong className="text-[#007AFF]">
                  {registroModo === 'SOLICITUD_SOLO'
                    ? 'Registro de Solicitud (Censo)'
                    : registroModo === 'ENTREGA_DIRECTA'
                      ? 'Entrega Inmediata en Campo'
                      : 'Entrega a Solicitud Previa'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E6E73]">Beneficiario:</span>
                <strong className="text-[#1D1D1F]">
                  {registroModo === 'ENTREGA_EXISTENTE' && selectedRequest
                    ? `${selectedRequest.nombre_completo} (${selectedRequest.documento})`
                    : `${nombres || 'Sin nombre'} ${apellidos} (${documento || 'S/D'})`}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E6E73]">Nivel de daño vivienda:</span>
                <strong className="text-[#1D1D1F]">{afectacionNivel}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E6E73]">Ayudas / Ítems seleccionados:</span>
                <strong className="text-[#1D1D1F]">{totalCantidadCalculada} unidades ({selectedSubtipos.length} tipos)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E6E73]">Evidencias fotográficas:</span>
                <strong className="text-[#1D1D1F]">{fotosEntrega.length} / 6 foto(s)</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmSubmitModalOpen(false)}
                className="px-4 py-2 rounded-[10px] border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F] cursor-pointer"
              >
                Revisar datos
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={(e) => {
                  setIsConfirmSubmitModalOpen(false);
                  handleSubmit(e as any);
                }}
                className="px-5 py-2 rounded-[10px] bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>Confirmar y Guardar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Limpiar Formulario con selección múltiple de pestañas y confirmación */}
      {isLimpiarModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 shadow-[0_25px_60px_rgba(0,0,0,0.22)] border border-[#E5E5EA] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1D1D1F]">Limpiar Formulario</h3>
                  <p className="text-xs text-[#6E6E73]">
                    Selecciona las pestañas que deseas restablecer y confirma
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLimpiarModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick selection shortcuts */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1 text-xs">
              <span className="text-slate-500 font-medium">Seleccionar alcance:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedTabsToClean([1, 2, 3, 4, 5, 6])}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition cursor-pointer"
                >
                  Todas las pestañas
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTabsToClean([formStepTab])}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition cursor-pointer"
                >
                  Solo activa (Pestaña {formStepTab})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTabsToClean([])}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-semibold text-[11px] transition cursor-pointer"
                >
                  Deseleccionar
                </button>
              </div>
            </div>

            {/* Multi-Select Tabs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
              {[
                {
                  id: 1,
                  titulo: 'Pestaña 1: Persona / Ciudadano',
                  desc: 'Documento, nombres, teléfono y sector',
                  icon: User,
                },
                {
                  id: 2,
                  titulo: 'Pestaña 2: Núcleo Familiar',
                  desc: 'Lista de integrantes y acompañantes',
                  icon: Users,
                },
                {
                  id: 3,
                  titulo: 'Pestaña 3: RUFE / Agropecuario',
                  desc: 'Cultivos, especies y tenencia',
                  icon: FileText,
                },
                {
                  id: 4,
                  titulo: 'Pestaña 4: Atención al Inmueble',
                  desc: 'Daños techo, paredes, evacuación y albergue',
                  icon: Home,
                },
                {
                  id: 5,
                  titulo: 'Pestaña 5: Entrega de Ayudas',
                  desc: 'Checklist de kits, ítems y cantidades',
                  icon: ListCheck,
                },
                {
                  id: 6,
                  titulo: 'Pestaña 6: Observaciones y Evidencias',
                  desc: 'Observaciones del caso y fotos adjuntas',
                  icon: SlidersHorizontal,
                },
              ].map((tab) => {
                const isSelected = selectedTabsToClean.includes(tab.id);
                const IconComp = tab.icon;
                return (
                  <div
                    key={tab.id}
                    onClick={() => {
                      setSelectedTabsToClean((prev) =>
                        prev.includes(tab.id)
                          ? prev.filter((id) => id !== tab.id)
                          : [...prev, tab.id].sort((a, b) => a - b)
                      );
                    }}
                    className={`p-3 rounded-2xl border transition flex items-start gap-2.5 cursor-pointer select-none ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-[#007AFF]" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <IconComp
                          className={`h-3.5 w-3.5 shrink-0 ${
                            isSelected ? 'text-[#007AFF]' : 'text-slate-500'
                          }`}
                        />
                        <span
                          className={`text-xs font-bold leading-tight ${
                            isSelected ? 'text-blue-950' : 'text-slate-800'
                          }`}
                        >
                          {tab.titulo}
                        </span>
                        {tab.id === formStepTab && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-blue-200 text-blue-800 font-extrabold shrink-0">
                            Activa
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">{tab.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Warning note if all selected */}
            {selectedTabsToClean.length === 6 && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-rose-600 shrink-0" />
                <span>Atención: Se limpiará todo el formulario completo a su estado inicial.</span>
              </div>
            )}

            {/* Footer with Confirmation Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium order-2 sm:order-1">
                {selectedTabsToClean.length === 0 ? (
                  <span className="text-amber-600 font-bold">Ninguna pestaña seleccionada</span>
                ) : (
                  <span>
                    <strong>{selectedTabsToClean.length}</strong>{' '}
                    {selectedTabsToClean.length === 1 ? 'pestaña seleccionada' : 'pestañas seleccionadas'}
                  </span>
                )}
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
                <button
                  type="button"
                  onClick={() => setIsLimpiarModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#D2D2D7] bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer transition"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={selectedTabsToClean.length === 0}
                  onClick={ejecutarLimpiezaPestanasSeleccionadas}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>
                    Confirmar Limpieza ({selectedTabsToClean.length})
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Listar Solicitudes Unificado (Mismo del Mapa: Atender Entregas + Múltiples Visitas Técnicas + Editar) */}
      {isListarModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] max-w-5xl w-full p-4 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.28)] border border-[#E5E5EA] flex flex-col max-h-[92vh] space-y-3.5">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                  listarVistaModo === 'solicitudes'
                    ? 'bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {listarVistaModo === 'solicitudes' ? <List className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1D1D1F] flex items-center gap-2">
                    <span>{listarVistaModo === 'solicitudes' ? 'Listado Operativo de Solicitudes' : 'Listado de Entregas de Ayudas'}</span>
                    <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                      listarVistaModo === 'solicitudes'
                        ? 'bg-blue-50 text-[#007AFF] border border-blue-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {listarVistaModo === 'solicitudes'
                        ? `${filteredListarSolicitudes.length} de ${todasSolicitudes.length}`
                        : `${filteredListarEntregas.length} de ${todasEntregas.length}`}
                    </span>
                  </h3>
                  <p className="text-xs text-[#6E6E73]">
                    {listarVistaModo === 'solicitudes'
                      ? 'Atienda solicitudes (crear entregas), registre una o múltiples visitas técnicas, consulte expedientes o edite el censo.'
                      : 'Busque entregas por código ENT-, solicitud SOL-, beneficiario o materiales, y gestione o consulte los despachos.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsListarModalOpen(false);
                    setActiveTab('mapa');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  <span>Ver en Mapa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsListarModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Selector de Modo: Solicitudes vs Entregas */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setListarVistaModo('solicitudes');
                  setListarCurrentPage(1);
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                  listarVistaModo === 'solicitudes'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ClipboardList className="h-4 w-4 text-[#007AFF]" />
                <span>Solicitudes Censadas</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  listarVistaModo === 'solicitudes' ? 'bg-blue-100 text-[#007AFF]' : 'bg-slate-200 text-slate-600'
                }`}>
                  {filteredListarSolicitudes.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setListarVistaModo('entregas');
                  setListarCurrentPage(1);
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                  listarVistaModo === 'entregas'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="h-4 w-4 text-emerald-600" />
                <span>Entregas de Ayudas Realizadas</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  listarVistaModo === 'entregas' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {filteredListarEntregas.length}
                </span>
              </button>
            </div>

            {/* Unified Filter Bar (Same as Map) */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder={
                      listarVistaModo === 'solicitudes'
                        ? 'Buscar por cédula, nombre, apellido, sector, dirección o SOL-ID...'
                        : 'Buscar por código de entrega (ENT-), código solicitud (SOL-), cédula o nombre receptor, material o vereda...'
                    }
                    value={listarSearchQuery}
                    onChange={(e) => setListarSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#007AFF] outline-none text-[#1D1D1F] transition"
                  />
                  {listarSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setListarSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Quick Status Pill */}
                {listarVistaModo === 'solicitudes' ? (
                  <div className="grid grid-cols-3 sm:flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setListarEstadoFiltro('all')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        listarEstadoFiltro === 'all'
                          ? 'bg-slate-900 text-white shadow-xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Todos ({todasSolicitudes.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setListarEstadoFiltro('pending')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        listarEstadoFiltro === 'pending'
                          ? 'bg-rose-600 text-white shadow-xs font-black'
                          : 'text-rose-700 hover:bg-rose-50'
                      }`}
                    >
                      Pendientes ({solicitudesPendientes.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setListarEstadoFiltro('completed')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        listarEstadoFiltro === 'completed'
                          ? 'bg-emerald-600 text-white shadow-xs font-black'
                          : 'text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      Atendidas ({Math.max(0, todasSolicitudes.length - solicitudesPendientes.length)})
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 gap-2 text-xs font-bold text-slate-700">
                    <PackageCheck className="h-4 w-4 text-emerald-600" />
                    <span>{filteredListarEntregas.length} entregas encontradas</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={listarEventoFiltro}
                  onChange={(e) => setListarEventoFiltro(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#1D1D1F] outline-none cursor-pointer truncate"
                >
                  <option value="ALL">Todos los Eventos</option>
                  {eventos.map((ev) => (
                    <option key={ev.id_evento} value={ev.id_evento}>
                      {ev.nombre_evento}
                    </option>
                  ))}
                </select>

                <select
                  value={listarSectorFiltro}
                  onChange={(e) => setListarSectorFiltro(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#1D1D1F] outline-none cursor-pointer truncate"
                >
                  <option value="ALL">Todos los Sectores / Veredas</option>
                  {sectores.map((sec) => (
                    <option key={sec.id_sector} value={sec.id_sector}>
                      {sec.nombre_sector} ({sec.tipo_sector})
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1.5">
                  {listarVistaModo === 'solicitudes' ? (
                    <select
                      value={listarNivelDanoFiltro}
                      onChange={(e) => setListarNivelDanoFiltro(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#1D1D1F] outline-none cursor-pointer truncate"
                    >
                      <option value="ALL">Todos los Niveles de Daño</option>
                      <option value="Colapso Total">🔴 Colapso Total / Daño Grave</option>
                      <option value="Grave">🟠 Daño Moderado / Grave</option>
                      <option value="Leve">🟡 Daño Leve</option>
                      <option value="Ninguno">⚪ Sin Afectación</option>
                    </select>
                  ) : (
                    <div className="flex-1 px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 truncate flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-slate-500" />
                      <span>{todasEntregas.length} entregas totales</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fetchSolicitudes()}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition cursor-pointer shrink-0"
                    title="Actualizar listado"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Results List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[54vh]">
              {listarVistaModo === 'solicitudes' ? (
                filteredListarSolicitudes.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2 bg-slate-50 rounded-2xl border border-slate-100">
                    <FileText className="h-8 w-8 mx-auto text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">No se encontraron solicitudes</p>
                    <p className="text-xs text-slate-400">
                      Ajusta los filtros de estado, sector, nivel de daño o búsqueda.
                    </p>
                  </div>
                ) : (
                  paginatedListarSolicitudes.map((sol: any) => {
                    const isPending = sol.estado_codigo === 'pending';
                    const numVisitas = sol.total_visitas ?? (sol.visita ? 1 : 0);
                    const numEntregas = sol.total_entregas ?? (sol.tiene_entrega ? 1 : 0);
                    return (
                      <div
                        key={sol.id_solicitud}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 hover:shadow-md ${getCardPastelStyle(sol)}`}
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-black bg-white text-slate-900 border border-slate-200 shadow-2xs">
                              {sol.codigo_solicitud || `SOL-${sol.id_solicitud}`}
                            </span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                isPending
                                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {isPending ? 'Pendiente de Entrega' : `✓ Atendida (${numEntregas} entrega${numEntregas === 1 ? '' : 's'})`}
                            </span>
                            <span
                              className={`font-black text-[10px] px-2 py-0.5 rounded-md ${
                                sol.afectacion_nivel === 'Colapso Total'
                                  ? 'bg-rose-600 text-white'
                                  : sol.afectacion_nivel === 'Grave'
                                    ? 'bg-amber-500 text-slate-950'
                                    : sol.afectacion_nivel === 'Leve'
                                      ? 'bg-slate-700 text-white'
                                      : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              Daño: {sol.afectacion_nivel || 'Sin Evaluar'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setDetailModalInitialTab('visitas');
                                setDetailedRequestId(sol.id_solicitud);
                                setIsDetailModalOpen(true);
                              }}
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full border transition cursor-pointer flex items-center gap-1 ${
                                numVisitas > 0
                                  ? 'bg-indigo-100 text-indigo-900 border-indigo-300 hover:bg-indigo-200'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                              title="Ver historial de visitas técnicas de esta solicitud"
                            >
                              <ClipboardCheck className="h-3 w-3 text-indigo-600" />
                              <span>{numVisitas} Visita{numVisitas === 1 ? '' : 's'} Técnica{numVisitas === 1 ? '' : 's'}</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-slate-500" />
                              {sol.nombre_completo || `${sol.nombres || ''} ${sol.apellidos || ''}`}
                            </strong>
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
                              C.C. {sol.documento}
                            </span>
                            {sol.telefono && (
                              <span className="text-[11px] text-slate-500 font-mono">
                                📞 {sol.telefono}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                            {sol.nombre_sector && (
                              <span className="flex items-center gap-1 font-bold text-slate-700 bg-white/80 px-2 py-0.5 rounded-lg border border-slate-200">
                                <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                                {sol.nombre_sector}
                              </span>
                            )}
                            {(sol.direccion_afectacion || sol.direccion) && (
                              <span className="truncate max-w-[260px] text-[11px]">
                                {sol.direccion_afectacion || sol.direccion}
                              </span>
                            )}
                            {sol.fecha_solicitud && (
                              <span className="text-[11px] font-mono text-slate-400">
                                {sol.fecha_solicitud}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botones de Acción Directa: Ver Detalle, Visita Técnica (Re-evaluar Vivienda), Atender (Entrega), Editar */}
                        <div className="shrink-0 flex flex-wrap items-center gap-1.5 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200/60">
                          <button
                            type="button"
                            onClick={() => {
                              setDetailModalInitialTab('censo');
                              setDetailedRequestId(sol.id_solicitud);
                              setIsDetailModalOpen(true);
                            }}
                            className="px-2.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-extrabold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="Ver expediente completo"
                          >
                            <Eye className="h-3.5 w-3.5 text-amber-300" />
                            <span>Detalle</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleIniciarVisitaTecnica(sol)}
                            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="Realizar visita técnica para re-evaluar la vivienda y verificar lo reportado en la solicitud"
                          >
                            <ClipboardCheck className="h-3.5 w-3.5" />
                            <span>Visita Técnica ({numVisitas})</span>
                          </button>

                          {!isCensoOnlyUser && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRequest(sol);
                                setRegistroModo('ENTREGA_EXISTENTE');
                                setActiveTab('formulario');
                                setFormStepTab(5);
                                setIsListarModalOpen(false);
                                showToast(
                                  `Solicitud ${sol.codigo_solicitud || `SOL-${sol.id_solicitud}`} cargada para registrar entrega de ayudas.`,
                                  'success'
                                );
                              }}
                              className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-extrabold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="Atender solicitud y registrar una entrega de ayuda"
                            >
                              <Package className="h-3.5 w-3.5" />
                              <span>Atender (Entrega)</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleEditarSolicitud(sol, 'SOLICITUD_SOLO')}
                            className="px-2.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-[11px] font-extrabold transition flex items-center gap-1 cursor-pointer"
                            title="Cargar en el formulario para editar datos generales de la solicitud"
                          >
                            <Pencil className="h-3.5 w-3.5 text-amber-700" />
                            <span>Editar</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                filteredListarEntregas.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2 bg-slate-50 rounded-2xl border border-slate-100">
                    <Package className="h-8 w-8 mx-auto text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">No se encontraron entregas de ayudas</p>
                    <p className="text-xs text-slate-400">
                      Verifique los filtros de búsqueda por entrega (ENT-), solicitud (SOL-), cédula o sector.
                    </p>
                  </div>
                ) : (
                  paginatedListarEntregas.map((ent: any) => {
                    const itemsArray = Array.isArray(ent.items) ? ent.items : [];
                    const resumenTexto =
                      ent.items_resumen ||
                      (itemsArray.length > 0
                        ? itemsArray.map((it: any) => `${it.cantidad_entregada ?? it.cantidad ?? 1}x ${it.nombre_item || it.nombre_paquete || 'Ítem'}`).join(', ')
                        : 'Ayuda humanitaria o materiales registrados');
                    const totalItems =
                      ent.cantidad_total_items ??
                      (itemsArray.reduce((acc: number, it: any) => acc + Number(it.cantidad_entregada ?? it.cantidad ?? 0), 0) || 1);
                    const solRelacionada = todasSolicitudes.find(
                      (s: any) => Number(s.id_solicitud) === Number(ent.id_solicitud)
                    );

                    return (
                      <div
                        key={ent.id_entrega}
                        className="p-3.5 rounded-2xl border border-emerald-200/90 bg-emerald-50/30 hover:bg-emerald-50/60 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 hover:shadow-md"
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-black bg-emerald-700 text-white shadow-2xs">
                              {ent.codigo_entrega || `ENT-${ent.id_entrega}`}
                            </span>
                            {ent.codigo_solicitud || ent.id_solicitud ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setDetailModalInitialTab('censo');
                                  setDetailedRequestId(ent.id_solicitud);
                                  setIsDetailModalOpen(true);
                                }}
                                className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200 hover:bg-blue-200 transition cursor-pointer flex items-center gap-1"
                                title="Ver expediente de la solicitud asignada"
                              >
                                <FileText className="h-3 w-3 text-blue-700" />
                                <span>{ent.codigo_solicitud || `SOL-${ent.id_solicitud}`}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                                Entrega Inmediata
                              </span>
                            )}
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ✓ Entregada ({totalItems} ítems)
                            </span>
                            {ent.fecha_entrega && (
                              <span className="text-[11px] font-mono text-slate-500">
                                📅 {ent.fecha_entrega}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-slate-500" />
                              {ent.nombre_receptor || ent.titular_nombre || ent.nombre_completo || 'Receptor'}
                            </strong>
                            {(ent.documento_receptor || ent.documento || ent.titular_documento) && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                C.C. {ent.documento_receptor || ent.documento || ent.titular_documento}
                              </span>
                            )}
                            {ent.parentesco_con_jefe && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {ent.parentesco_con_jefe}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                            {(ent.nombre_sector || solRelacionada?.nombre_sector) && (
                              <span className="flex items-center gap-1 font-bold text-slate-700 bg-white/80 px-2 py-0.5 rounded-lg border border-slate-200">
                                <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                                {ent.nombre_sector || solRelacionada?.nombre_sector}
                              </span>
                            )}
                            {(ent.direccion_receptor || solRelacionada?.direccion_afectacion || solRelacionada?.direccion) && (
                              <span className="truncate max-w-[260px] text-[11px]">
                                {ent.direccion_receptor || solRelacionada?.direccion_afectacion || solRelacionada?.direccion}
                              </span>
                            )}
                          </div>

                          {/* Resumen de Insumos Entregados */}
                          <div className="p-2 bg-white/90 rounded-xl border border-emerald-200/70 text-xs text-slate-700 flex items-start gap-1.5 mt-1">
                            <Package className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="font-medium line-clamp-2">
                              <strong className="font-bold text-slate-900">Ayudas entregadas:</strong> {resumenTexto}
                            </span>
                          </div>
                        </div>

                        {/* Botones de Acción para la Entrega */}
                        <div className="shrink-0 flex flex-wrap items-center gap-1.5 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200/60">
                          {ent.id_solicitud && (
                            <button
                              type="button"
                              onClick={() => {
                                setDetailModalInitialTab('censo');
                                setDetailedRequestId(ent.id_solicitud);
                                setIsDetailModalOpen(true);
                              }}
                              className="px-2.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-extrabold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="Ver expediente y detalles de la solicitud"
                            >
                              <Eye className="h-3.5 w-3.5 text-amber-300" />
                              <span>Ver Solicitud</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleEditarEntrega(ent)}
                            className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold border border-slate-300 transition flex items-center gap-1 cursor-pointer"
                            title="Editar los datos e ítems de esta entrega específica"
                          >
                            <Pencil className="h-3.5 w-3.5 text-slate-500" />
                            <span>Editar Entrega</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleGestionarNuevaEntrega(ent)}
                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="Crear y registrar una nueva entrega independiente para esta solicitud"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Gestionar Entrega</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>

            {/* Footer con Paginación Optimizada */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs">
              <div className="flex flex-wrap items-center gap-2 text-slate-600">
                <span>
                  Mostrando{' '}
                  <strong className="text-slate-900">
                    {(listarVistaModo === 'solicitudes' ? filteredListarSolicitudes.length : filteredListarEntregas.length) === 0
                      ? 0
                      : (listarCurrentPage - 1) * listarPageSize + 1}
                    –{Math.min(
                      listarCurrentPage * listarPageSize,
                      listarVistaModo === 'solicitudes' ? filteredListarSolicitudes.length : filteredListarEntregas.length
                    )}
                  </strong>{' '}
                  de{' '}
                  <strong className="text-slate-900">
                    {listarVistaModo === 'solicitudes' ? filteredListarSolicitudes.length : filteredListarEntregas.length}
                  </strong>{' '}
                  {listarVistaModo === 'solicitudes' ? 'solicitudes' : 'entregas'}
                </span>
                <select
                  value={listarPageSize}
                  onChange={(e) => {
                    setListarPageSize(Number(e.target.value));
                    setListarCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value={10}>10 por pág.</option>
                  <option value={20}>20 por pág.</option>
                  <option value={50}>50 por pág.</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <button
                  type="button"
                  disabled={listarCurrentPage <= 1}
                  onClick={() => setListarCurrentPage(1)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Primera página"
                >
                  «
                </button>
                <button
                  type="button"
                  disabled={listarCurrentPage <= 1}
                  onClick={() => setListarCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  ‹ Anterior
                </button>

                <span className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-[11px] font-black text-[#007AFF]">
                  Pág. {listarCurrentPage} / {totalListarPages}
                </span>

                <button
                  type="button"
                  disabled={listarCurrentPage >= totalListarPages}
                  onClick={() => setListarCurrentPage((p) => Math.min(totalListarPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Siguiente ›
                </button>
                <button
                  type="button"
                  disabled={listarCurrentPage >= totalListarPages}
                  onClick={() => setListarCurrentPage(totalListarPages)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Última página"
                >
                  »
                </button>

                <button
                  type="button"
                  onClick={() => setIsListarModalOpen(false)}
                  className="ml-2 px-4 py-1.5 rounded-xl border border-[#D2D2D7] bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 cursor-pointer transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DIRECTO: Registrar Visita Técnica (1 a N visitas desde cualquier listado o mapa) */}
      {visitaModalSolicitud && (
        <VisitaTecnicaCompletaModal
          idSolicitud={visitaModalSolicitud.id_solicitud}
          initialData={{
            profesional_responsable: user ? `${user.nombres || ''} ${user.apellidos || ''}`.trim() : '',
            ciudadano_nombres: visitaModalSolicitud.nombres,
            ciudadano_apellidos: visitaModalSolicitud.apellidos,
            ciudadano_documento: visitaModalSolicitud.documento,
            ciudadano_telefono: visitaModalSolicitud.telefono,
            direccion: visitaModalSolicitud.direccion_afectacion || visitaModalSolicitud.direccion,
            nombre_sector: visitaModalSolicitud.nombre_sector,
            codigo_solicitud: visitaModalSolicitud.codigo_solicitud || `SOL-${visitaModalSolicitud.id_solicitud}`,
          }}
          onClose={() => setVisitaModalSolicitud(null)}
          onSave={handleGuardarVisitaDirecta}
          saving={savingVisitaDirecta}
        />
      )}

      {/* MODAL: Motivos por los cuales no se envía el formulario */}
      {validationModal.isOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 shadow-[0_25px_60px_rgba(0,0,0,0.25)] border border-[#E5E5EA] space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-[#1D1D1F]">{validationModal.title}</h3>
                <p className="text-xs text-[#6E6E73]">
                  Por favor revise y subsane los siguientes motivos para poder procesar el registro:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setValidationModal({ isOpen: false, title: '', motivos: [] })}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Lista de Motivos de Validación */}
            {validationModal.motivos.length > 0 && (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {validationModal.motivos.map((motivo, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-bold text-amber-950 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <span>{motivo.campo}</span>
                      </div>
                      <p className="text-amber-800 text-[11px] leading-relaxed">
                        {motivo.mensaje}
                      </p>
                    </div>

                    {motivo.tab && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormStepTab(motivo.tab!);
                          setValidationModal({ isOpen: false, title: '', motivos: [] });
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-bold text-[10px] shrink-0 transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ir a pestaña {motivo.tab}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Error específico del servidor */}
            {validationModal.errorServidor && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                <span className="font-bold block text-rose-950">Respuesta del Servidor / Backend:</span>
                <p className="font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                  {validationModal.errorServidor}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setValidationModal({ isOpen: false, title: '', motivos: [] })}
                className="px-5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Entendido, ir a corregir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Location Picker */}
      <LocationPickerModal
        isOpen={isMapModalOpen}
        initialLat={latitud}
        initialLng={longitud}
        onSave={(lat, lng) => {
          setLatitud(lat);
          setLongitud(lng);
          showToast('Coordenadas GPS actualizadas desde el mapa.', 'success');
        }}
        onClose={() => setIsMapModalOpen(false)}
      />

      {/* MODAL 2: Pending Request Picker */}
      <PendingRequestPickerModal
        isOpen={isRequestPickerOpen}
        requests={solicitudesPendientes}
        sectores={sectores}
        onViewDetail={(id) => {
          setDetailedRequestId(id);
          setIsDetailModalOpen(true);
        }}
        onSelect={(req) => {
          setSelectedRequest(req);
          setDocumento(req.documento || '');
          setNombres(req.nombres || '');
          setApellidos(req.apellidos || '');
          setDireccion(req.direccion_afectacion || '');
          if (req.id_sector) setSectorId(req.id_sector);
          if (req.latitud) setLatitud(req.latitud);
          if (req.longitud) setLongitud(req.longitud);
          showToast(`Solicitud ${req.codigo_solicitud || req.id_solicitud} vinculada.`, 'success');
        }}
        onClose={() => setIsRequestPickerOpen(false)}
      />

      {/* MODAL 4: Multi-Category Filter Modal */}
      {isMultiFilterModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-[#007AFF]" />
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  Filtro por Categorías y Requerimientos de Insumos
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMultiFilterModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {DISASTER_TYPOLOGIES.map((tipo) => {
                const IconComp = iconMap[tipo.icono] || Package;
                const isExpanded = expandedCategoryIds.includes(tipo.id);
                const isParentChecked = selectedMultiCategoryIds.includes(tipo.id);
                const checkedSubCount = tipo.subtipos.filter((s) => selectedSubtipologiaCodes.includes(s.code)).length;

                return (
                  <div key={tipo.id} className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="p-3 bg-white flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-1">
                        <button
                          type="button"
                          onClick={() => toggleCategoryExpand(tipo.id)}
                          className="p-1 text-slate-400 hover:text-slate-700"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                        <input
                          type="checkbox"
                          checked={isParentChecked || (checkedSubCount === tipo.subtipos.length && tipo.subtipos.length > 0)}
                          onChange={() => toggleParentCategoryFilter(tipo.id)}
                          className="h-4 w-4 text-[#007AFF] rounded"
                        />
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleCategoryExpand(tipo.id)}>
                          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                            <IconComp className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs font-bold text-slate-900">{tipo.nombre}</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-slate-600 font-mono">
                        {checkedSubCount}/{tipo.subtipos.length}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="p-2.5 bg-slate-50 border-t border-slate-100 space-y-1.5 pl-9">
                        {tipo.subtipos.map((sub) => {
                          const isSubChecked = selectedSubtipologiaCodes.includes(sub.code);
                          return (
                            <div
                              key={sub.code}
                              onClick={() => toggleSubtipologiaCodeFilter(tipo.id, sub.code)}
                              className={`p-2 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs transition select-none ${isSubChecked
                                ? 'bg-blue-50 border-blue-300 font-bold text-blue-950'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSubChecked}
                                readOnly
                                className="h-3.5 w-3.5 text-[#007AFF] rounded pointer-events-none"
                              />
                              <span className="text-[11px] flex-1">{sub.nombre}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsMultiFilterModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMultiFilterModalOpen(false);
                  showToast('Filtro por requerimientos aplicado.', 'success');
                }}
                className="px-5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-bold shadow-sm transition"
              >
                Aplicar Filtro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && solicitudToDelete && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-2xl border border-rose-100">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">¿Eliminar Solicitud?</h3>
            </div>
            <p className="text-xs text-slate-600">
              ¿Estás seguro de que deseas eliminar permanentemente la solicitud <strong>{solicitudToDelete.codigo_solicitud || `SOL-${solicitudToDelete.id_solicitud}`}</strong> de <strong>{solicitudToDelete.nombre_completo}</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow"
              >
                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle Completo de Solicitud */}
      {isDetailModalOpen && detailedRequestId && (
        <SolicitudDetailModal
          idSolicitud={detailedRequestId}
          initialTab={detailModalInitialTab}
          onClose={() => {
            setIsDetailModalOpen(false);
            setDetailedRequestId(null);
            setDetailModalInitialTab('censo');
            fetchSolicitudes();
          }}
          onEditarSolicitud={(det) => {
            handleEditarSolicitud(det, 'SOLICITUD_SOLO');
            setFormStepTab(1);
          }}
          onIniciarVisitaTecnica={(det) => {
            handleIniciarVisitaTecnica(det);
          }}
          onEditarEntrega={(ent, det) => handleEditarEntrega(ent, det)}
          onAtenderSolicitud={(det) => {
            setIsDetailModalOpen(false);
            setDetailedRequestId(null);
            setSelectedRequest({
              id_solicitud: det.id_solicitud,
              codigo_solicitud: det.codigo_solicitud,
              nombre_completo: `${det.ciudadano.nombres} ${det.ciudadano.apellidos}`,
              documento: det.ciudadano.documento,
              nombre_sector: det.sector.nombre_sector,
              fecha_solicitud: det.fecha_solicitud,
              afectacion_nivel: det.evaluacion_dano?.nivel_afectacion_vivienda,
              estado_codigo: det.id_estado === 3 ? 'completed' : 'pending',
            });
            setRegistroModo('ENTREGA_EXISTENTE');
            setActiveTab('formulario');
            setFormStepTab(5);
            showToast(`Solicitud ${det.codigo_solicitud} cargada para entrega de ayudas.`, 'success');
          }}
          isCensoOnly={isCensoOnlyUser}
        />
      )}

      {/* WORKSPACE LAYOUT: Left Institutional Sidebar + Main Canvas */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto">
        {/* LEFT SIDEBAR (Apple Design System - Mockups 1, 2, 3, 4, 5) */}
        <aside className="w-full lg:w-[236px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-[#E5E5EA] flex flex-col justify-between">
          <div className="p-3 space-y-1">
            {/* Mobile Horizontal Scroll Menu / Desktop Vertical Menu */}
            <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
              {([
                { id: 'inicio', label: 'Inicio', icon: Home },
                { id: 'eventos', label: 'Eventos y Emergencias', icon: AlertTriangle, badge: eventos.length },
                { id: 'formulario', label: 'Atención a Catástrofes', icon: Activity },
                { id: 'nucleos', label: 'Núcleos Familiares', icon: Users },
                { id: 'evaluaciones', label: 'Evaluaciones de Daños', icon: ShieldAlert },
                { id: 'mapa', label: 'Listado y Mapa', icon: MapPin, badge: todasSolicitudes.length },
                { id: 'historial', label: 'Entregas y Trazabilidad', icon: Truck },
                { id: 'reportes', label: 'Reportes e Indicadores', icon: BarChart3 },
              ] as const).map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-[12px] text-xs font-semibold transition-all cursor-pointer shrink-0 lg:w-full ${isActive
                      ? 'bg-[#007AFF] text-white shadow-[0_2px_8px_rgba(0,122,255,0.28)]'
                      : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-[#6E6E73]'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {'badge' in item && item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-[#F5F5F7] text-[#6E6E73]'
                          }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={openListarModal}
                className="flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-[12px] text-xs font-bold text-[#007AFF] bg-[#007AFF]/8 hover:bg-[#007AFF]/15 border border-[#007AFF]/20 transition-all cursor-pointer shrink-0 lg:w-full mt-1"
                title="Abrir listado rápido de solicitudes para atender entregas o realizar visitas técnicas"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <List className="h-4 w-4 text-[#007AFF] shrink-0" />
                  <span className="truncate">Listar Solicitudes</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-[#007AFF] text-white">
                  {todasSolicitudes.length}
                </span>
              </button>

              {canManageEventos && (
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[12px] text-xs font-semibold text-[#1D1D1F] hover:bg-[#F5F5F7] transition-all cursor-pointer shrink-0 lg:w-full mt-1 border-t border-[#E5E5EA] pt-3"
                >
                  <Settings className="h-4 w-4 text-[#6E6E73] shrink-0" />
                  <span className="truncate">Configuración</span>
                </button>
              )}
            </nav>
          </div>

          {/* Sidebar Institutional Footer */}
          <div className="hidden lg:block p-4 m-3 rounded-[16px] bg-gradient-to-b from-[#F5F5F7] to-[#EBF3FF] border border-[#E5E5EA]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-[#1D1D1F]">Anserma, Caldas</span>
              <span className="h-2 w-2 rounded-full bg-[#34C759]" />
            </div>
            <p className="text-[11px] text-[#6E6E73] font-medium leading-snug">
              Gestión del Riesgo de Desastres • Sincronizado con SIGA
            </p>
            {canManageEventos && (
              <button
                type="button"
                onClick={() => handleAbrirModalEvento()}
                className="mt-3 w-full py-2 px-3 rounded-[10px] bg-white hover:bg-[#007AFF] hover:text-white text-[#007AFF] border border-[#007AFF]/30 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nuevo Evento</span>
              </button>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 space-y-5">
          {/* ======================= VISTA: INICIO (Mockup 2) ======================= */}
          {activeTab === 'inicio' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Top Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-[14px] bg-white border border-[#E5E5EA] flex items-center justify-center shadow-2xs text-[#FF9500]">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
                      Atención a Emergencias
                    </h1>
                    <p className="text-xs text-[#6E6E73]">
                      Registro, caracterización, evaluación y entrega de ayudas a la población afectada.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {canManageEventos && (
                    <button
                      type="button"
                      onClick={() => handleAbrirModalEvento()}
                      className="px-4 py-2.5 rounded-[10px] bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] border border-[#D2D2D7] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                    >
                      <Plus className="h-4 w-4 text-[#007AFF]" />
                      <span>Nuevo Evento</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={openListarModal}
                    className="px-4 py-2.5 rounded-[10px] bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] border border-[#D2D2D7] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <List className="h-4 w-4 text-[#007AFF]" />
                    <span>Listar Solicitudes ({todasSolicitudes.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetFormState();
                      setRegistroModo('SOLICITUD_SOLO');
                      setActiveTab('formulario');
                      setFormStepTab(1);
                    }}
                    className="px-4 py-2.5 rounded-[10px] bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Nueva Solicitud</span>
                  </button>
                </div>
              </div>

              {/* Barra de Filtros Ejecutivos (Alcalde / Coordinación) */}
              {renderBarraFiltrosEjecutivos()}

              {/* 5 KPI Cards Row (Mockup 2 - Interactivos para filtrado rápido) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                <button
                  type="button"
                  onClick={() => setDashFiltroEstado('TODOS')}
                  className={`bg-white rounded-[16px] p-4 border transition text-left flex items-center gap-3.5 cursor-pointer ${dashFiltroEstado === 'TODOS' && hayFiltrosDashboardActivos
                    ? 'border-[#007AFF] ring-2 ring-[#007AFF]/10 shadow-xs'
                    : 'border-[#E5E5EA] hover:border-[#007AFF]/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                    }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#F5F5F7] text-[#1D1D1F] flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-[#1D1D1F] leading-none">
                      {kpiResumen.total.toLocaleString('es-CO')}
                    </div>
                    <div className="text-[11px] font-medium text-[#6E6E73] mt-1">
                      Solicitudes registradas
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDashFiltroEstado((prev) => (prev === 'pending' ? 'TODOS' : 'pending'))
                  }
                  className={`bg-white rounded-[16px] p-4 border transition text-left flex items-center gap-3.5 cursor-pointer ${dashFiltroEstado === 'pending'
                    ? 'border-[#FF9500] ring-2 ring-[#FF9500]/15 bg-[#FF9500]/[0.02]'
                    : 'border-[#E5E5EA] hover:border-[#FF9500]/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                    }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-[#1D1D1F] leading-none">
                      {kpiResumen.pendientes.toLocaleString('es-CO')}
                    </div>
                    <div className="text-[11px] font-medium text-[#6E6E73] mt-1">
                      Pendientes de atención
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDashFiltroEstado((prev) => (prev === 'completed' ? 'TODOS' : 'completed'))
                  }
                  className={`bg-white rounded-[16px] p-4 border transition text-left flex items-center gap-3.5 cursor-pointer ${dashFiltroEstado === 'completed'
                    ? 'border-[#34C759] ring-2 ring-[#34C759]/15 bg-[#34C759]/[0.02]'
                    : 'border-[#E5E5EA] hover:border-[#34C759]/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                    }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#34C759]/12 text-[#34C759] flex items-center justify-center shrink-0">
                    <Check className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-[#1D1D1F] leading-none">
                      {kpiResumen.atendidas.toLocaleString('es-CO')}
                    </div>
                    <div className="text-[11px] font-medium text-[#6E6E73] mt-1">
                      Atendidas
                    </div>
                  </div>
                </button>

                <div className="bg-white rounded-[16px] p-4 border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center shrink-0">
                    <Home className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-[#1D1D1F] leading-none">
                      {kpiResumen.viviendasAfectadas.toLocaleString('es-CO')}
                    </div>
                    <div className="text-[11px] font-medium text-[#6E6E73] mt-1">
                      Viviendas afectadas
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[16px] p-4 border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center gap-3.5 col-span-2 sm:col-span-1">
                  <div className="w-10 h-10 rounded-full bg-[#F5F5F7] text-[#1D1D1F] flex items-center justify-center shrink-0">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-[#1D1D1F] leading-none">
                      {kpiResumen.personasAfectadas.toLocaleString('es-CO')}
                    </div>
                    <div className="text-[11px] font-medium text-[#6E6E73] mt-1">
                      Personas afectadas
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla rápida de resultados cuando hay filtros activos en el Dashboard de Inicio */}
              {hayFiltrosDashboardActivos && (
                <div className="bg-white rounded-[16px] p-5 border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1D1D1F]">
                        Solicitudes filtradas en el evento activo ({solicitudesFiltradasDashboard.length})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('evaluaciones')}
                      className="text-xs font-semibold text-[#007AFF] hover:underline cursor-pointer"
                    >
                      Ver detalle completo en Evaluaciones →
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#E5E5EA] text-[11px] font-semibold text-[#6E6E73]">
                          <th className="py-2 pr-3">Código</th>
                          <th className="py-2 px-3">Solicitante</th>
                          <th className="py-2 px-3">Sector / Vereda</th>
                          <th className="py-2 px-3">Nivel de Daño</th>
                          <th className="py-2 px-3">Estado</th>
                          <th className="py-2 pl-3 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F5F5F7]">
                        {solicitudesFiltradasDashboard.slice(0, 8).map((sol) => (
                          <tr key={sol.id_solicitud} className="hover:bg-[#F5F5F7]/70 transition">
                            <td className="py-2.5 pr-3 font-mono font-bold text-[#007AFF]">
                              {sol.codigo_solicitud || `SOL-${sol.id_solicitud}`}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-[#1D1D1F]">{sol.nombre_completo}</span>
                              <span className="text-[11px] text-[#6E6E73] ml-1.5 font-mono">({sol.documento})</span>
                            </td>
                            <td className="py-2.5 px-3 text-[#6E6E73]">{sol.nombre_sector || 'Sin sector'}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${sol.afectacion_nivel === 'Colapso Total'
                                  ? 'bg-[#FF3B30]/12 text-[#FF3B30]'
                                  : sol.afectacion_nivel === 'Grave'
                                    ? 'bg-[#FF9500]/15 text-[#FF9500]'
                                    : sol.afectacion_nivel === 'Leve'
                                      ? 'bg-[#FFCC00]/20 text-[#997A00]'
                                      : 'bg-[#F5F5F7] text-[#6E6E73]'
                                  }`}
                              >
                                {sol.afectacion_nivel || 'Ninguno'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${sol.estado_atencion === 'ATENDIDO'
                                  ? 'bg-[#34C759]/12 text-[#34C759]'
                                  : 'bg-[#007AFF]/10 text-[#007AFF]'
                                  }`}
                              >
                                {sol.estado_atencion === 'ATENDIDO' ? 'Atendida' : 'En atención'}
                              </span>
                            </td>
                            <td className="py-2.5 pl-3 text-right">
                              <button
                                type="button"
                                onClick={async () => {
                                  await handleEditarSolicitud(sol.id_solicitud);
                                  setFormStepTab(4);
                                }}
                                className="px-2.5 py-1 rounded-[8px] bg-[#F5F5F7] hover:bg-[#007AFF] hover:text-white text-[#1D1D1F] text-[11px] font-semibold transition cursor-pointer"
                              >
                                Evaluar
                              </button>
                            </td>
                          </tr>
                        ))}
                        {solicitudesFiltradasDashboard.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-[#6E6E73] text-xs">
                              No se encontraron solicitudes con los filtros seleccionados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 1. Seleccione el tipo de emergencia (Mockup 2) */}
              <div className="bg-white rounded-[16px] p-5 border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-[#1D1D1F]">
                    1. Seleccione el tipo de emergencia
                  </h2>
                  <span className="text-[11px] text-[#6E6E73] bg-[#F5F5F7] px-3 py-1 rounded-full">
                    ⓘ El sistema adaptará formularios, evaluaciones y ayudas según el evento seleccionado.
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  {[
                    { id: 'Terremoto', label: 'Terremoto', icon: Activity },
                    { id: 'Inundación', label: 'Inundación', icon: Waves },
                    { id: 'Incendio', label: 'Incendio', icon: Flame },
                    { id: 'Deslizamiento', label: 'Deslizamiento', icon: Mountain },
                    { id: 'Vendaval', label: 'Tornado / Vendaval', icon: Wind },
                    { id: 'Tsunami', label: 'Avenida Torrencial', icon: Droplets },
                    { id: 'Otro evento', label: 'Otro evento', icon: Layers },
                  ].map((em) => {
                    const IconEm = em.icon;
                    const isSelected = selectedEmergencyTypeCard === em.id;
                    return (
                      <button
                        key={em.id}
                        type="button"
                        onClick={() => {
                          setSelectedEmergencyTypeCard(em.id);
                          const matchingEv = eventos.find((ev) =>
                            (ev.tipo_evento || '').toLowerCase().includes(em.id.toLowerCase()) ||
                            (ev.nombre_evento || '').toLowerCase().includes(em.id.toLowerCase())
                          );
                          if (matchingEv) {
                            setSelectedEventoId(matchingEv.id_evento);
                            fetchSolicitudes(matchingEv.id_evento);
                            loadDashboard(matchingEv.id_evento);
                          }
                        }}
                        className={`relative p-3.5 rounded-[14px] border text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${isSelected
                          ? 'border-[#007AFF] bg-[#007AFF]/6 ring-2 ring-[#007AFF]/15 text-[#007AFF]'
                          : 'border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] text-[#1D1D1F]'
                          }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#007AFF] text-white flex items-center justify-center">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        )}
                        <IconEm className={`h-5 w-5 ${isSelected ? 'text-[#007AFF]' : 'text-[#6E6E73]'}`} />
                        <span className="text-xs font-bold">{em.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Flujo de atención (Mockup 2) */}
              <div className="bg-white rounded-[16px] p-5 border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-[#1D1D1F]">2. Flujo de atención —</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#007AFF]/10 text-[#007AFF]">
                    {eventoActivoActual?.nombre_evento || selectedEmergencyTypeCard}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      step: 1,
                      title: 'Registro y Censo',
                      desc: 'Ciudadano y núcleo familiar',
                      icon: FileText,
                      active: true,
                      onClick: () => {
                        setRegistroModo('SOLICITUD_SOLO');
                        setActiveTab('formulario');
                        setFormStepTab(1);
                      },
                    },
                    {
                      step: 2,
                      title: 'Evaluación de Daños',
                      desc: 'Vivienda e infraestructura',
                      icon: Home,
                      active: false,
                      onClick: () => {
                        setActiveTab('formulario');
                        setFormStepTab(4);
                      },
                    },
                    {
                      step: 3,
                      title: 'Entrega de Ayudas',
                      desc: 'Insumos y materiales',
                      icon: Package,
                      active: false,
                      onClick: () => {
                        setRegistroModo('ENTREGA_EXISTENTE');
                        setActiveTab('formulario');
                        setFormStepTab(5);
                      },
                    },
                    {
                      step: 4,
                      title: 'Evidencias y Cierre',
                      desc: 'Registro, fotografías y finalización',
                      icon: Camera,
                      active: false,
                      onClick: () => {
                        setActiveTab('formulario');
                        setFormStepTab(6);
                      },
                    },
                  ].map((flujo) => {
                    const IconFlujo = flujo.icon;
                    return (
                      <button
                        key={flujo.step}
                        type="button"
                        onClick={flujo.onClick}
                        className={`p-3.5 rounded-[14px] border text-left flex items-center gap-3 transition-all cursor-pointer ${flujo.active
                          ? 'bg-[#007AFF] border-[#007AFF] text-white shadow-[0_4px_12px_rgba(0,122,255,0.25)]'
                          : 'bg-[#F5F5F7]/70 hover:bg-[#F5F5F7] border-[#E5E5EA] text-[#1D1D1F]'
                          }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${flujo.active ? 'bg-white/20 text-white' : 'bg-white text-[#1D1D1F] border border-[#E5E5EA]'
                            }`}
                        >
                          {flujo.step}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold truncate">{flujo.title}</div>
                          <div className={`text-[11px] truncate ${flujo.active ? 'text-white/85' : 'text-[#6E6E73]'}`}>
                            {flujo.desc}
                          </div>
                        </div>
                        <IconFlujo className={`h-4 w-4 shrink-0 ${flujo.active ? 'text-white' : 'text-[#6E6E73]'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Eventos Activos Table + Mapa Preview Row (Mockup 2) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7 bg-white rounded-[16px] p-5 border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#007AFF]" />
                      <h3 className="text-sm font-bold text-[#1D1D1F]">Eventos activos</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('eventos')}
                      className="text-xs font-semibold text-[#007AFF] hover:underline cursor-pointer"
                    >
                      Ver todos
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#E5E5EA] text-[11px] font-semibold text-[#6E6E73]">
                          <th className="py-2 pr-2">Evento</th>
                          <th className="py-2 px-2">Ámbito</th>
                          <th className="py-2 px-2 text-center">Solicitudes</th>
                          <th className="py-2 px-2">Estado</th>
                          <th className="py-2 pl-2 text-right">Inicio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5EA] text-xs">
                        {eventos.slice(0, 5).map((ev) => {
                          const isSelectedEv = ev.id_evento === selectedEventoId;
                          return (
                            <tr
                              key={ev.id_evento}
                              onClick={() => {
                                setSelectedEventoId(ev.id_evento);
                                fetchSolicitudes(ev.id_evento);
                                loadDashboard(ev.id_evento);
                                showToast(`Evento activo cambiado a: ${ev.nombre_evento}`, 'success');
                              }}
                              className={`cursor-pointer transition ${isSelectedEv ? 'bg-[#007AFF]/5 font-semibold' : 'hover:bg-[#F5F5F7]/70'
                                }`}
                            >
                              <td className="py-2.5 pr-2 font-bold text-[#1D1D1F] flex items-center gap-2">
                                <Activity className="h-3.5 w-3.5 text-[#007AFF] shrink-0" />
                                <span className="truncate max-w-[180px]">{ev.nombre_evento}</span>
                              </td>
                              <td className="py-2.5 px-2 text-[#6E6E73]">
                                {ev.ambito_territorial || 'Urbano y Rural'}
                              </td>
                              <td className="py-2.5 px-2 text-center font-bold text-[#1D1D1F]">
                                {ev.total_solicitudes ?? 0}
                              </td>
                              <td className="py-2.5 px-2">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${ev.estado_evento === 'Activo'
                                    ? 'bg-[#007AFF]/12 text-[#007AFF]'
                                    : 'bg-[#34C759]/15 text-[#34C759]'
                                    }`}
                                >
                                  {ev.estado_evento === 'Activo' ? 'En atención' : ev.estado_evento}
                                </span>
                              </td>
                              <td className="py-2.5 pl-2 text-right text-[#6E6E73]">
                                {ev.fecha_evento}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mini Mapa de Eventos Card */}
                <div className="lg:col-span-5 bg-white rounded-[16px] p-5 border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#007AFF]" />
                      <h3 className="text-sm font-bold text-[#1D1D1F]">Mapa de eventos</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('mapa')}
                      className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Abrir mapa completo</span>
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div
                    onClick={() => setActiveTab('mapa')}
                    className="relative h-44 rounded-[12px] bg-gradient-to-br from-[#EBF3FF] via-[#F5F5F7] to-[#E8F5E9] border border-[#E5E5EA] overflow-hidden cursor-pointer flex items-center justify-center group"
                  >
                    <div className="text-center space-y-1 z-10">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-sm border border-[#E5E5EA] text-xs font-bold text-[#1D1D1F] group-hover:border-[#007AFF] transition">
                        <MapPin className="h-4 w-4 text-[#FF3B30]" />
                        <span>Anserma, Caldas ({todasSolicitudes.length} puntos georreferenciados)</span>
                      </div>
                      <p className="text-[11px] text-[#6E6E73]">Haz clic para interactuar con el visor geográfico</p>
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 bg-white/95 backdrop-blur-xs p-2 rounded-xl border border-[#E5E5EA] text-[10px] space-y-1 shadow-2xs">
                      <div className="font-bold text-[#1D1D1F]">Nivel de afectación</div>
                      <div className="flex items-center gap-1.5 text-[#6E6E73]">
                        <span className="w-2 h-2 rounded-full bg-[#FF3B30]" /> Colapso / Daño grave
                      </div>
                      <div className="flex items-center gap-1.5 text-[#6E6E73]">
                        <span className="w-2 h-2 rounded-full bg-[#FF9500]" /> Daño leve / moderado
                      </div>
                      <div className="flex items-center gap-1.5 text-[#6E6E73]">
                        <span className="w-2 h-2 rounded-full bg-[#34C759]" /> Atendida
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accesos Rápidos Bottom Bar (Mockup 2) */}
              <div className="bg-white rounded-[16px] p-3.5 border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-wrap items-center justify-between gap-2.5">
                <span className="text-xs font-bold text-[#1D1D1F] px-2 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#007AFF]" />
                  <span>Accesos rápidos</span>
                </span>
                <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      resetFormState();
                      setRegistroModo('SOLICITUD_SOLO');
                      setActiveTab('formulario');
                      setFormStepTab(1);
                    }}
                    className="px-4 py-2 rounded-[10px] bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Nueva Solicitud</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('mapa')}
                    className="px-3.5 py-2 rounded-[10px] bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] border border-[#D2D2D7] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Search className="h-3.5 w-3.5 text-[#6E6E73]" />
                    <span>Consultar Solicitud</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRegistroModo('ENTREGA_EXISTENTE');
                      setActiveTab('formulario');
                      setFormStepTab(5);
                    }}
                    className="px-3.5 py-2 rounded-[10px] bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] border border-[#D2D2D7] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Truck className="h-3.5 w-3.5 text-[#6E6E73]" />
                    <span>Gestionar Entregas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('evaluaciones')}
                    className="px-3.5 py-2 rounded-[10px] bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] border border-[#D2D2D7] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Home className="h-3.5 w-3.5 text-[#6E6E73]" />
                    <span>Evaluar Daños</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('reportes')}
                    className="px-3.5 py-2 rounded-[10px] bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] border border-[#D2D2D7] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <BarChart3 className="h-3.5 w-3.5 text-[#6E6E73]" />
                    <span>Reportes</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================= VISTA: EVENTOS Y EMERGENCIAS (Mockup 3) ======================= */}
          {activeTab === 'eventos' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-[14px] bg-white border border-[#E5E5EA] flex items-center justify-center shadow-2xs text-[#007AFF]">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
                      Eventos y Emergencias
                    </h1>
                    <p className="text-xs text-[#6E6E73]">
                      Administre los eventos de emergencia, registre nuevas situaciones y realice su seguimiento.
                    </p>
                  </div>
                </div>

                {canManageEventos && (
                  <button
                    type="button"
                    onClick={() => handleAbrirModalEvento()}
                    className="px-4 py-2.5 rounded-[10px] bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Nuevo Evento</span>
                  </button>
                )}
              </div>

              {/* KPI Summary Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-white rounded-[16px] p-4 border border-[#E5E5EA] flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-[#1D1D1F]">{eventos.length}</div>
                    <div className="text-xs text-[#6E6E73]">Eventos registrados</div>
                  </div>
                </div>
                <div className="bg-white rounded-[16px] p-4 border border-[#E5E5EA] flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#34C759]/12 text-[#34C759] flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-[#1D1D1F]">{kpiResumen.total}</div>
                    <div className="text-xs text-[#6E6E73]">Solicitudes vinculadas</div>
                  </div>
                </div>
                <div className="bg-white rounded-[16px] p-4 border border-[#E5E5EA] flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#FF9500]/12 text-[#FF9500] flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-[#1D1D1F]">
                      {kpiResumen.personasAfectadas.toLocaleString('es-CO')}
                    </div>
                    <div className="text-xs text-[#6E6E73]">Personas afectadas</div>
                  </div>
                </div>
              </div>

              {/* Events Table Card */}
              <div className="bg-white rounded-[16px] p-5 border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 bg-[#F5F5F7] p-1 rounded-[12px] border border-[#E5E5EA]">
                    {([
                      { id: 'activos', label: `Activos (${eventos.filter((e) => e.estado_evento === 'Activo').length})` },
                      { id: 'finalizados', label: `Finalizados (${eventos.filter((e) => e.estado_evento !== 'Activo').length})` },
                      { id: 'todos', label: `Todos (${eventos.length})` },
                    ] as const).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setEventoFiltroTab(t.id)}
                        className={`px-3.5 py-1.5 rounded-[9px] text-xs font-semibold transition cursor-pointer ${eventoFiltroTab === t.id
                          ? 'bg-white text-[#007AFF] shadow-2xs'
                          : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                          }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6E6E73]" />
                    <input
                      type="text"
                      placeholder="Buscar evento..."
                      value={eventoSearchText}
                      onChange={(e) => setEventoSearchText(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-[#F5F5F7] border border-[#D2D2D7] rounded-[10px] text-xs font-medium text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E5EA] text-[11px] font-semibold text-[#6E6E73]">
                        <th className="py-2.5 pr-3">Evento</th>
                        <th className="py-2.5 px-3">Tipo</th>
                        <th className="py-2.5 px-3">Ámbito territorial</th>
                        <th className="py-2.5 px-3 text-center">Solicitudes</th>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3">Inicio</th>
                        <th className="py-2.5 pl-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5EA] text-xs">
                      {eventosFiltradosVista.map((ev) => {
                        const isSelected = ev.id_evento === selectedEventoId;
                        return (
                          <tr
                            key={ev.id_evento}
                            className={`transition ${isSelected ? 'bg-[#007AFF]/5' : 'hover:bg-[#F5F5F7]/60'}`}
                          >
                            <td className="py-3 pr-3">
                              <div className="flex items-center gap-2.5">
                                <Activity className="h-4 w-4 text-[#FF3B30] shrink-0" />
                                <div>
                                  <div className="font-bold text-[#1D1D1F] flex items-center gap-1.5">
                                    <span>{ev.nombre_evento}</span>
                                    {isSelected && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#007AFF] text-white">
                                        Seleccionado
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[#6E6E73] font-mono">{ev.codigo_evento}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F5F5F7] text-[#1D1D1F] border border-[#E5E5EA]">
                                {ev.tipo_evento}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-[#6E6E73]">
                              <strong className="text-[#1D1D1F]">{ev.ambito_territorial || 'Rural'}</strong>
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-[#1D1D1F]">
                              {ev.total_solicitudes ?? 0}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${ev.estado_evento === 'Activo'
                                  ? 'bg-[#34C759]/15 text-[#34C759]'
                                  : 'bg-[#6E6E73]/15 text-[#6E6E73]'
                                  }`}
                              >
                                {ev.estado_evento}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-[#6E6E73]">{ev.fecha_evento}</td>
                            <td className="py-3 pl-3 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedEventoId(ev.id_evento);
                                    fetchSolicitudes(ev.id_evento);
                                    loadDashboard(ev.id_evento);
                                    setActiveTab('formulario');
                                    setFormStepTab(1);
                                    showToast(`Atendiendo evento: ${ev.nombre_evento}`, 'success');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-[#007AFF]/10 hover:bg-[#007AFF] text-[#007AFF] hover:text-white text-[11px] font-semibold transition cursor-pointer"
                                >
                                  Atender
                                </button>
                                {canManageEventos && (
                                  <button
                                    type="button"
                                    onClick={() => handleAbrirModalEvento(ev)}
                                    className="p-1.5 rounded-lg text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition cursor-pointer"
                                    title="Editar evento"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================= TAB 1: FORMULARIO (6 PESTAÑAS - Mockups 1, 4, 5) ======================= */}
          {activeTab === 'formulario' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const resValidacion = validarFormulario();
                if (!resValidacion.valido) {
                  setValidationModal({
                    isOpen: true,
                    title: 'No se puede enviar el formulario',
                    motivos: resValidacion.motivos,
                  });
                  return;
                }
                setIsConfirmSubmitModalOpen(true);
              }}
              className="space-y-4 animate-in fade-in duration-200"
            >
              {/* Apple Design System Header Card (Mockup 1 & Mockup 4) */}
              <div className="bg-white rounded-[16px] p-4 sm:p-5 border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-[14px] bg-[#FF3B30]/10 text-[#FF3B30] flex items-center justify-center shrink-0">
                      <Activity className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg sm:text-xl font-bold text-[#1D1D1F] tracking-tight truncate">
                          Atención a Catástrofes ({eventoActivoActual?.nombre_evento || 'Terremoto'})
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF3B30]/12 text-[#FF3B30]">
                          SAD Móvil
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action Buttons: Cambiar Evento, Listar, Limpiar Formulario, Registrar Solicitud */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {eventos.length > 0 && (
                      <div className="flex items-center gap-1.5 bg-[#F5F5F7] border border-[#D2D2D7] rounded-[10px] px-2.5 py-1.5">
                        <RefreshCw className="h-3.5 w-3.5 text-[#007AFF] shrink-0" />
                        <select
                          value={selectedEventoId}
                          onChange={(e) => {
                            const newEvId = Number(e.target.value);
                            setSelectedEventoId(newEvId);
                            fetchSolicitudes(newEvId);
                            loadDashboard(newEvId);
                          }}
                          className="bg-transparent text-xs font-semibold text-[#1D1D1F] outline-none cursor-pointer max-w-[190px] truncate"
                        >
                          {eventos.map((ev) => (
                            <option key={ev.id_evento} value={ev.id_evento}>
                              {ev.nombre_evento}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={openListarModal}
                      className="px-3.5 py-2 rounded-[10px] bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] border border-[#D2D2D7] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      title="Listar solicitudes para Atender, hacer Visita Técnica o Editar"
                    >
                      <List className="h-3.5 w-3.5 text-[#007AFF]" />
                      <span>Listar ({todasSolicitudes.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={openLimpiarModal}
                      className="px-3.5 py-2 rounded-[10px] bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      title="Limpiar formulario o secciones"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-rose-500" />
                      <span>Limpiar formulario</span>
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className={`px-4 py-2 rounded-[10px] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 ${
                        registroModo === 'VISITA_TECNICA'
                          ? 'bg-indigo-600 hover:bg-indigo-700'
                          : 'bg-[#007AFF] hover:bg-[#0062CC]'
                      }`}
                    >
                      <Check className="h-4 w-4" />
                      <span>
                        {registroModo === 'VISITA_TECNICA'
                          ? 'Guardar Visita Técnica y Evaluación'
                          : editingSolicitudId
                            ? 'Guardar Cambios'
                            : registroModo === 'SOLICITUD_SOLO'
                              ? 'Registrar Solicitud'
                              : 'Confirmar Entrega'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Macro Stepper / Mode Selector: 1. Registro de Solicitud | 2. Visita Técnica (Re-evaluar Vivienda) | 3. Atender (Entrega de Ayudas) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-[#E5E5EA] pt-3 gap-2">
                  {[
                    {
                      stage: 1,
                      label: 'Registrar Solicitud y Afectación',
                      active: registroModo === 'SOLICITUD_SOLO',
                      onClick: () => {
                        if (!isEntregaOnlyUser) setRegistroModo('SOLICITUD_SOLO');
                        setFormStepTab(1);
                      },
                    },
                    {
                      stage: 2,
                      label: 'Visita Técnica (Re-evaluar Vivienda)',
                      active: registroModo === 'VISITA_TECNICA',
                      onClick: () => {
                        setRegistroModo('VISITA_TECNICA');
                        setFormStepTab(4);
                        if (!editingSolicitudId) {
                          openListarModal();
                        }
                      },
                    },
                    {
                      stage: 3,
                      label: 'Atender Solicitud (Entrega de Ayudas)',
                      active: registroModo === 'ENTREGA_EXISTENTE' || registroModo === 'ENTREGA_DIRECTA',
                      onClick: () => {
                        if (!isCensoOnlyUser) {
                          setRegistroModo('ENTREGA_EXISTENTE');
                          setFormStepTab(5);
                        }
                      },
                    },
                  ].map((st) => (
                    <button
                      key={st.stage}
                      type="button"
                      onClick={st.onClick}
                      className={`pb-2.5 border-b-2 flex items-center justify-center gap-2 text-xs font-semibold transition cursor-pointer ${
                        st.active
                          ? 'border-[#007AFF] text-[#1D1D1F] font-bold'
                          : 'border-transparent text-[#6E6E73] hover:text-[#1D1D1F]'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                          st.active ? 'bg-[#007AFF] text-white' : 'bg-[#F5F5F7] text-[#6E6E73]'
                        }`}
                      >
                        {st.stage}
                      </span>
                      <span className="truncate">{st.label}</span>
                    </button>
                  ))}
                </div>

                {/* Form Navigation Bar: En modo Entrega muestra solo 2 subpestañas, en Solicitud/Visita muestra las 4 */}
                {registroModo === 'ENTREGA_EXISTENTE' ? (
                  <div className="grid grid-cols-2 gap-2 bg-[#F5F5F7] p-1.5 rounded-[12px] border border-[#E5E5EA]">
                    <button
                      type="button"
                      onClick={() => {
                        setEntregaSubTabModo('NUEVA_ENTREGA');
                        setFormStepTab(5);
                      }}
                      className={`px-4 py-2.5 rounded-[10px] text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border ${
                        entregaSubTabModo === 'NUEVA_ENTREGA'
                          ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <ListCheck className="h-4 w-4" />
                      <span>Entrega de Ayudas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntregaSubTabModo('HISTORIAL_ENTREGAS')}
                      className={`px-4 py-2.5 rounded-[10px] text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer border ${
                        entregaSubTabModo === 'HISTORIAL_ENTREGAS'
                          ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                      <span>Listar Ayudas Entregadas ({entregasDeSolicitudSeleccionada.length})</span>
                    </button>
                  </div>
                ) : (
                  <div
                    className={`grid gap-2 bg-[#F5F5F7] p-1.5 rounded-[12px] border border-[#E5E5EA] ${
                      HABILITAR_ENTREGA_AYUDAS_FORM_INICIAL ||
                      registroModo === 'ENTREGA_DIRECTA'
                        ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
                        : 'grid-cols-2 sm:grid-cols-4'
                    }`}
                  >
                    {([
                      { step: 1, label: 'Datos del Evento', icon: User },
                      { step: 2, label: 'Núcleo Familiar', icon: Users },
                      { step: 3, label: 'RUFE', icon: FileText },
                      {
                        step: 4,
                        label:
                          registroModo === 'VISITA_TECNICA'
                            ? 'Visita Técnica y Re-evaluación'
                            : 'Afectación del Inmueble',
                        icon: Home,
                      },
                      ...(HABILITAR_ENTREGA_AYUDAS_FORM_INICIAL ||
                      registroModo === 'ENTREGA_DIRECTA'
                        ? ([
                            { step: 5, label: 'Entrega de ayudas', icon: ListCheck },
                            { step: 6, label: 'Observaciones', icon: Camera },
                          ] as const)
                        : []),
                    ] as const).map((tab) => {
                      const TabIcon = tab.icon;
                      const isCurrent = formStepTab === tab.step;
                      const isDone = getFormTabCompleted(tab.step);
                      return (
                        <button
                          key={tab.step}
                          type="button"
                          onClick={() => handleCambiarPaso(tab.step)}
                          className={`px-3 py-2 rounded-[10px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${isCurrent
                            ? 'bg-[#007AFF]/10 border-[#007AFF]/40 text-[#007AFF] font-bold shadow-2xs'
                            : 'bg-white border-[#E5E5EA] text-[#1D1D1F] hover:bg-[#F5F5F7]'
                            }`}
                        >
                          <TabIcon className={`h-3.5 w-3.5 shrink-0 ${isCurrent ? 'text-[#007AFF]' : isDone ? 'text-[#34C759]' : 'text-[#6E6E73]'}`} />
                          <span className="truncate">{tab.label}</span>
                          {isDone && !isCurrent && (
                            <span className="w-2 h-2 rounded-full bg-[#34C759] shrink-0" title="Sección con datos" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Banner de Modo Edición Profesional y Sobrio (sin colores saturados) */}
              {(editingSolicitudId || editingEntregaId) && registroModo !== 'VISITA_TECNICA' && (
                <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center shrink-0">
                      <Pencil className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-0.5 rounded-lg">
                          {editingEntregaCodigo || editingSolicitudCodigo || `REG-${editingSolicitudId || editingEntregaId}`}
                        </span>
                        <span className="font-bold text-sm text-slate-100">
                          {editingEntregaId ? 'Modo Edición de Entrega de Ayuda' : 'Modo Edición de Expediente / Censo'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Modificando información de <strong className="text-slate-200">{nombres || 'Ciudadano'} {apellidos}</strong> (Doc: {documento || 'S/D'}). Los cambios actualizarán la base de datos oficial.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={resetFormState}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <X className="h-3.5 w-3.5 text-rose-400" />
                      <span>Cancelar Edición</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Selector y Panel de Visita Técnica (Re-evaluación de la Vivienda) */}
              {registroModo === 'VISITA_TECNICA' && (
                <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-indigo-200 space-y-4">
                  {!editingSolicitudId ? (
                    <div className="p-6 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-center space-y-3">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto shadow-2xs">
                        <ClipboardCheck className="h-5 w-5" />
                      </div>
                      <div className="max-w-lg mx-auto space-y-1">
                        <h4 className="font-extrabold text-sm text-slate-900">
                          Seleccionar Solicitud para Visita Técnica y Re-evaluación de Vivienda
                        </h4>
                        <p className="text-xs text-slate-600">
                          Elija una solicitud registrada para verificar en terreno si lo reportado es cierto, actualizar la evaluación del inmueble, infraestructura rural y Banco de Materiales.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={openListarModal}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm transition cursor-pointer inline-flex items-center gap-2"
                        >
                          <List className="h-4 w-4" />
                          <span>Seleccionar Solicitud del Listado ({todasSolicitudes.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRegistroModo('SOLICITUD_SOLO');
                            setFormStepTab(1);
                          }}
                          className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Volver a Nueva Solicitud
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Cabecera de la Visita Técnica Activa */}
                      <div className="p-4 bg-gradient-to-r from-indigo-50 via-blue-50/70 to-indigo-50 border border-indigo-200 rounded-2xl space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200/70 pb-3">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-mono text-xs font-black text-white bg-indigo-600 px-3 py-1 rounded-xl shadow-2xs">
                              {editingSolicitudCodigo || `SOL-${editingSolicitudId}`}
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300 text-xs font-black flex items-center gap-1.5">
                              <ClipboardCheck className="h-3.5 w-3.5 text-indigo-700" />
                              <span>
                                Visita Técnica #{(reporteInicialSnapshot?.total_visitas_previas || 0) + 1} — Re-evaluación de Vivienda en Terreno
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() =>
                                setVisitaModalSolicitud({
                                  id_solicitud: editingSolicitudId,
                                  codigo_solicitud: editingSolicitudCodigo,
                                })
                              }
                              className="px-3 py-1.5 bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                              title="Abrir también la ficha técnica detallada de 10 pasos"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span>Ficha Detallada (10 pasos)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDetailedRequestId(editingSolicitudId);
                                setDetailModalInitialTab('visitas');
                                setIsDetailModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                              title="Ver historial de visitas técnicas de esta solicitud"
                            >
                              <ClipboardList className="h-3.5 w-3.5 text-indigo-600" />
                              <span>Listar Visitas Técnicas ({reporteInicialSnapshot?.total_visitas_previas || 0})</span>
                            </button>
                            <button
                              type="button"
                              onClick={openListarModal}
                              className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                            >
                              <Search className="h-3.5 w-3.5" />
                              <span>Cambiar Solicitud</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                resetFormState();
                                setRegistroModo('SOLICITUD_SOLO');
                                setFormStepTab(1);
                              }}
                              className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Salir</span>
                            </button>
                          </div>
                        </div>

                        {/* Comparativo: Datos del Solicitante y Lo Reportado Inicialmente */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                          <div className="bg-white p-3 rounded-xl border border-indigo-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Solicitante Censado</span>
                            <strong className="text-slate-900 font-extrabold text-xs block truncate">
                              {nombres} {apellidos}
                            </strong>
                            <span className="text-slate-500 text-[11px]">
                              Doc: <strong className="font-mono text-slate-700">{documento}</strong>
                              {telefono ? ` • Tel: ${telefono}` : ''}
                            </span>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-indigo-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Ubicación del Predio</span>
                            <strong className="text-slate-900 font-bold block truncate">
                              {sectores.find((s) => s.id_sector === sectorId)?.nombre_sector || 'Sector verificado'}
                            </strong>
                            <span className="text-slate-500 text-[11px] block truncate">
                              {direccion || observacionSector || 'Dirección registrada'}
                            </span>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-indigo-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Reporte Inicial en Solicitud
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-extrabold text-[11px]">
                                Global: {reporteInicialSnapshot?.nivel_vivienda || 'Ninguno'}
                              </span>
                              <span className="text-[11px] text-slate-600">
                                Techo: <strong>{reporteInicialSnapshot?.nivel_techo || 'Ninguno'}</strong> • Muros:{' '}
                                <strong>{reporteInicialSnapshot?.nivel_paredes || 'Ninguno'}</strong>
                              </span>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-indigo-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Historial de Visitas Técnicas
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-lg text-[11px] font-black mt-0.5">
                              <ClipboardCheck className="h-3.5 w-3.5 text-indigo-600" />
                              <span>{reporteInicialSnapshot?.total_visitas_previas || 0} visita(s) previa(s)</span>
                            </span>
                          </div>
                        </div>

                        {/* Verificación de veracidad de lo reportado y Datos del Profesional */}
                        <div className="p-3.5 bg-white rounded-xl border border-indigo-200/80 space-y-3">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-extrabold text-slate-900">
                              1. Verificación en Terreno: ¿Lo reportado en la solicitud corresponde a la realidad del inmueble?
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {([
                                {
                                  id: 'CONFIRMADO',
                                  title: '✓ Confirmado en campo',
                                  desc: 'Lo reportado en la solicitud es cierto y coincide con la inspección.',
                                  activeStyle: 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/15',
                                },
                                {
                                  id: 'AJUSTADO',
                                  title: '⚡ Ajustado / Re-evaluado',
                                  desc: 'Se modifican los niveles de daño abajo según lo verificado en la visita.',
                                  activeStyle: 'border-amber-500 bg-amber-50/70 text-amber-950 ring-2 ring-amber-500/15',
                                },
                                {
                                  id: 'DESCARTADO',
                                  title: '✕ Sin afectación por el evento',
                                  desc: 'No se evidencian daños atribuibles a la emergencia reportada.',
                                  activeStyle: 'border-rose-500 bg-rose-50/70 text-rose-950 ring-2 ring-rose-500/15',
                                },
                              ] as const).map((verOpt) => {
                                const isSel = visitaVerificacionReporte === verOpt.id;
                                return (
                                  <button
                                    key={verOpt.id}
                                    type="button"
                                    onClick={() => {
                                      setVisitaVerificacionReporte(verOpt.id);
                                      if (verOpt.id === 'DESCARTADO') {
                                        setAfectacionNivel('Ninguno');
                                        setTechoDamageLevel('Ninguno');
                                        setParedesDamageLevel('Ninguno');
                                        setPisosDamageLevel('Ninguno');
                                      }
                                    }}
                                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                      isSel ? verOpt.activeStyle : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                                    }`}
                                  >
                                    <div className="text-xs font-extrabold">{verOpt.title}</div>
                                    <div className="text-[10px] text-slate-600 mt-0.5 leading-snug">{verOpt.desc}</div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                Profesional / Evaluador que realiza la Visita *
                              </label>
                              <input
                                type="text"
                                value={visitaProfesionalResponsable}
                                onChange={(e) => setVisitaProfesionalResponsable(e.target.value)}
                                placeholder="Nombre del ingeniero o técnico"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                Cargo / Dependencia
                              </label>
                              <input
                                type="text"
                                value={visitaCargoResponsable}
                                onChange={(e) => setVisitaCargoResponsable(e.target.value)}
                                placeholder="Ej. Obras Públicas / Gestión del Riesgo"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                Dictamen de Habitabilidad en la Visita
                              </label>
                              <select
                                value={visitaDictamenHabitabilidad}
                                onChange={(e) => setVisitaDictamenHabitabilidad(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
                              >
                                <option value="HABITABLE">🟢 Habitable / Seguro</option>
                                <option value="USO_CON_PRECAUCION">🟡 Habitable con precaución / Reparación menor</option>
                                <option value="NO_HABITABLE">🟠 No habitable / Requiere evacuación preventiva</option>
                                <option value="COLAPSO_DEMOLICION">🔴 Colapso o riesgo inminente / Demolición</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                              Concepto Técnico / Hallazgos de esta Visita Técnica
                            </label>
                            <input
                              type="text"
                              value={visitaObservacionesTecnicas}
                              onChange={(e) => setVisitaObservacionesTecnicas(e.target.value)}
                              placeholder="Describa lo verificado en la visita (ej. se constata daño en cubierta y muros, se actualiza nivel de afectación y materiales)..."
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {registroModo === 'ENTREGA_EXISTENTE' && (
            <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-3">
              {/* Selector de Solicitud Previa si modo es ENTREGA_EXISTENTE */}
                {registroModo === 'ENTREGA_EXISTENTE' && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    {!selectedRequest ? (
                      <div className="p-5 bg-amber-50/80 border border-amber-300 rounded-2xl text-center space-y-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-2xs">
                          <Search className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">Seleccionar Solicitud Pendiente para Atender</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsRequestPickerOpen(true)}
                          className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-black shadow-sm transition cursor-pointer inline-flex items-center gap-2"
                        >
                          <Search className="h-4 w-4" />
                          <span>Buscar en Solicitudes Pendientes ({solicitudesPendientes.length})</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 bg-blue-50/80 border-2 border-blue-200 rounded-2xl space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/80 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-white bg-blue-700 px-2.5 py-0.5 rounded-lg shadow-2xs">
                              {selectedRequest.codigo_solicitud || `SOL-${selectedRequest.id_solicitud}`}
                            </span>
                            <span className="text-xs font-black text-blue-950">Beneficiario Vinculado para Entrega</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                const idSol = selectedRequest.id_solicitud || selectedRequest.id;
                                if (idSol) {
                                  setDetailedRequestId(idSol);
                                  setDetailModalInitialTab('censo');
                                  setIsDetailModalOpen(true);
                                }
                              }}
                              className="px-3 py-1 bg-white hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                              title="Ver expediente y detalle completo de la solicitud"
                            >
                              <Eye className="h-3.5 w-3.5 text-blue-700" />
                              <span>Ver Detalle de la Solicitud</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsRequestPickerOpen(true)}
                              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                            >
                              <Search className="h-3.5 w-3.5 text-slate-500" />
                              <span>Cambiar Solicitud</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                          <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Ciudadano</span>
                            <strong className="text-slate-900 font-extrabold text-xs block truncate">{selectedRequest.nombre_completo}</strong>
                            <span className="text-slate-500 text-[11px]">Doc: <strong className="font-mono text-slate-700">{selectedRequest.documento}</strong></span>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Ubicación</span>
                            <strong className="text-slate-900 font-bold block truncate">{selectedRequest.nombre_sector}</strong>
                            <span className="text-slate-500 text-[11px] block truncate">{selectedRequest.direccion_afectacion || 'Sector verificado'}</span>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Afectación Censada</span>
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-black mt-0.5 ${selectedRequest.afectacion_nivel === 'Colapso Total'
                              ? 'bg-rose-100 text-rose-800'
                              : selectedRequest.afectacion_nivel === 'Grave'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-100 text-emerald-800'
                              }`}>
                              {selectedRequest.afectacion_nivel || 'Leve'}
                            </span>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Estado</span>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[11px] font-black mt-0.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                              Pendiente de Entrega
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

              {/* SECCIONES POR PESTAÑA (1 a 6): Solo para Nueva Solicitud / Censo o Entrega Directa */}
              {registroModo !== 'ENTREGA_EXISTENTE' && (
                <>
                  {/* TAB 1: Datos del Evento (Identificación del Ciudadano y Ubicación) */}
                  {formStepTab === 1 && (
                    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xs border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-blue-50 text-[#0071e3] rounded-xl">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">Datos del Evento</h3>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-[#0071e3] bg-blue-50 px-2.5 py-1 rounded-full">
                          Paso 1 de {HABILITAR_ENTREGA_AYUDAS_FORM_INICIAL ? 6 : 4}
                        </span>
                      </div>

                      {/* Alcance / Tipo de Destinatario (Individual, Núcleo Familiar, Comunidad) + Búsqueda por Nombre o Cédula SIGA/SAD */}
                      <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-3.5 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-blue-950">
                            Alcance de la Solicitud / Entrega y Búsqueda por Nombre o Cédula (Sincronizado con SIGA):
                          </span>
                          <button
                            type="button"
                            onClick={handleBuscarNucleoPorDocumento}
                            disabled={buscandoNucleoDoc}
                            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                          >
                            <Search className="h-3.5 w-3.5" />
                            <span>{buscandoNucleoDoc ? 'Consultando...' : 'Autocompletar por Cédula'}</span>
                          </button>
                        </div>

                        {/* Buscador general por Nombre o Cédula (Personas Individuales y Núcleos Familiares) */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                              type="text"
                              value={busquedaGeneralQuery}
                              onChange={(e) => setBusquedaGeneralQuery(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleBuscarPorNombreOCedula(busquedaGeneralQuery);
                                }
                              }}
                              className="w-full pl-9 pr-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-semibold text-slate-900"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleBuscarPorNombreOCedula(busquedaGeneralQuery)}
                            disabled={buscandoNucleoDoc}
                            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Buscar Persona / Núcleo
                          </button>
                        </div>

                        {mostrarResultadosBusqueda && (
                          <div className="bg-white border border-blue-200 rounded-xl p-3 space-y-2 max-h-60 overflow-y-auto">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-600">
                                Personas ({resultadosBusquedaPersonas.length}) • Núcleos Familiares ({resultadosBusquedaNucleos.length})
                              </span>
                              <button
                                type="button"
                                onClick={() => setMostrarResultadosBusqueda(false)}
                                className="text-xs font-bold text-slate-400 hover:text-slate-600"
                              >
                                Cerrar
                              </button>
                            </div>
                            {resultadosBusquedaNucleos.map((nf) => (
                              <div
                                key={`nuc-${nf.id_nucleo}`}
                                onClick={() => {
                                  cargarDatosDesdeNucleo(nf);
                                  setMostrarResultadosBusqueda(false);
                                  showToast(`Núcleo ${nf.nombre_nucleo} vinculado.`, 'success');
                                }}
                                className="p-2 rounded-lg border border-indigo-100 hover:bg-indigo-50 cursor-pointer flex items-center justify-between text-xs"
                              >
                                <div>
                                  <span className="font-mono font-bold text-indigo-700 mr-1.5">{nf.codigo_nucleo}</span>
                                  <strong className="text-slate-900">{nf.nombre_nucleo}</strong>
                                  <span className="text-slate-500 ml-2">• Sector: {nf.nombre_sector} ({nf.direccion})</span>
                                </div>
                                <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold">
                                  Cargar Núcleo
                                </span>
                              </div>
                            ))}
                            {resultadosBusquedaPersonas.map((p) => (
                              <div
                                key={`per-${p.id_persona}`}
                                onClick={async () => {
                                  setDocumento(p.documento || '');
                                  setNombres(p.nombres || '');
                                  setApellidos(p.apellidos || '');
                                  if (p.telefono) setTelefono(p.telefono);
                                  if (p.direccion) setDireccion(p.direccion);
                                  if (p.id_sector) setSectorId(Number(p.id_sector));
                                  if (p.id_nucleo) {
                                    setIdNucleoVinculado(p.id_nucleo);
                                    setNombreNucleoVinculado(p.nombre_nucleo || p.codigo_nucleo || '');
                                    try {
                                      const nucRes = await apiClient.get(`/nucleos-familiares/por-documento/${encodeURIComponent(p.documento || '')}`);
                                      if (nucRes.data?.nucleo_familiar) {
                                        cargarDatosDesdeNucleo(nucRes.data.nucleo_familiar, p);
                                      }
                                    } catch {}
                                  }
                                  setMostrarResultadosBusqueda(false);
                                  showToast(`Persona ${p.nombres} ${p.apellidos} y núcleo familiar cargados.`, 'success');
                                }}
                                className="p-2 rounded-lg border border-blue-100 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs"
                              >
                                <div>
                                  <strong className="text-slate-900">{p.nombres} {p.apellidos}</strong>
                                  <span className="font-mono text-slate-600 ml-1.5">(CC: {p.documento})</span>
                                  {p.nombre_rol && <span className="ml-1.5 px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">{p.nombre_rol}</span>}
                                  {p.nombre_nucleo && <span className="text-slate-500 ml-2">• Núcleo: {p.nombre_nucleo}</span>}
                                  <span className="text-slate-500 ml-2">• Sector: {p.nombre_sector || 'S/D'}</span>
                                </div>
                                <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                                  Cargar
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {([
                            { id: 'INDIVIDUAL', label: 'A Nombre Propio (Individual)' },
                            { id: 'NUCLEO_FAMILIAR', label: 'A Núcleo Familiar' },
                            { id: 'COMUNIDAD', label: 'A una Comunidad / Sector' },
                          ] as const).map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setTipoDestinatario(opt.id)}
                              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${tipoDestinatario === opt.id
                                ? 'bg-white border-blue-600 ring-2 ring-blue-500/15'
                                : 'bg-white/70 border-slate-200 hover:bg-white'
                                }`}
                            >
                              <div className="text-xs font-black text-slate-900">{opt.label}</div>
                            </button>
                          ))}
                        </div>
                        {tipoDestinatario === 'COMUNIDAD' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Seleccionar Sector de la Comunidad *
                              </label>
                              <select
                                value={sectorId}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setSectorId(val);
                                  const secObj = sectores.find((s) => s.id_sector === val);
                                  if (secObj && !nombreComunidad.trim()) {
                                    setNombreComunidad(`Comunidad Sector ${secObj.nombre_sector}`);
                                  }
                                }}
                                className="w-full px-3.5 py-2 bg-white border border-blue-300 rounded-xl text-xs font-semibold text-slate-900"
                              >
                                {sectores.map((s) => (
                                  <option key={s.id_sector} value={s.id_sector}>
                                    {s.nombre_sector}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Nombre de la Comunidad / JAC / Sector Beneficiado *
                              </label>
                              <input
                                type="text"
                                value={nombreComunidad}
                                onChange={(e) => setNombreComunidad(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white border border-blue-300 rounded-xl text-xs font-semibold text-slate-900"
                              />
                            </div>
                          </div>
                        )}
                        {idNucleoVinculado && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[11px] font-bold text-emerald-900">
                                ✓ Vinculado al Núcleo Familiar ID #{idNucleoVinculado} ({nombreNucleoVinculado}) — Sincronizado con SIGA
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditandoNucleoInline(!editandoNucleoInline)}
                                className="px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                              >
                                {editandoNucleoInline ? 'Cerrar edición' : 'Modificar Núcleo / Sector desde aquí'}
                              </button>
                            </div>
                            {editandoNucleoInline && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                                <input
                                  type="text"
                                  value={nombreNucleoVinculado}
                                  onChange={(e) => setNombreNucleoVinculado(e.target.value)}
                                  className="px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs"
                                />
                                <select
                                  value={sectorId}
                                  onChange={(e) => setSectorId(Number(e.target.value))}
                                  className="px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-semibold"
                                >
                                  {sectores.map((s) => (
                                    <option key={s.id_sector} value={s.id_sector}>
                                      {s.nombre_sector}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={handleGuardarEdicionNucleoInline}
                                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                                >
                                  Guardar Cambios del Núcleo
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                        <div className="min-w-0">
                          <label className="block text-xs font-bold text-slate-700 mb-1">Cédula / Documento *</label>
                          <input
                            type="text"
                            required
                            value={documento}
                            onChange={(e) => setDocumento(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 min-w-0 box-border"
                          />
                        </div>
                        <div className="min-w-0">
                          <label className="block text-xs font-bold text-slate-700 mb-1">Nombres *</label>
                          <input
                            type="text"
                            required
                            value={nombres}
                            onChange={(e) => setNombres(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 min-w-0 box-border"
                          />
                        </div>
                        <div className="min-w-0 sm:col-span-2 md:col-span-1">
                          <label className="block text-xs font-bold text-slate-700 mb-1">Apellidos *</label>
                          <input
                            type="text"
                            required
                            value={apellidos}
                            onChange={(e) => setApellidos(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 min-w-0 box-border"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                        <div className="min-w-0">
                          <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono de Contacto</label>
                          <input
                            type="text"
                            value={telefono}
                            onChange={(e) => setTelefono(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 min-w-0 box-border"
                          />
                        </div>
                        <div className="min-w-0">
                          <label className="block text-xs font-bold text-slate-700 mb-1">Pertenencia Étnica</label>
                          <select
                            value={grupoEtnicoCiudadano}
                            onChange={(e) => setGrupoEtnicoCiudadano(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 cursor-pointer min-w-0 truncate box-border"
                          >
                            <option value="Ninguno de los anteriores">Ninguno de los anteriores</option>
                            <option value="Indígena">Indígena</option>
                            <option value="Gitano(a) o Rom">Gitano(a) o Rom</option>
                            <option value="Raizal">Raizal</option>
                            <option value="Palenquero(a)">Palenquero(a)</option>
                            <option value="Afrocolombiano(a), negro(a), mulato(a) o afrodescendiente">Afrocolombiano(a)...</option>
                          </select>
                        </div>
                        <div className="min-w-0 sm:col-span-2 md:col-span-1">
                          <label className="block text-xs font-bold text-slate-700 mb-1">Parentesco / Rol en Hogar</label>
                          <select
                            value={parentescoCiudadano}
                            onChange={(e) => setParentescoCiudadano(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 cursor-pointer min-w-0 truncate box-border"
                          >
                            <option value="Jefe(a) o cabeza del hogar">Jefe(a) o cabeza del hogar</option>
                            <option value="Presidente(a) de la Junta de Acción Comunal">Presidente(a) de la Junta de Acción Comunal</option>
                            <option value="Pareja, Esposo(a)">Pareja, Esposo(a)</option>
                            <option value="Hijo(a), hijastro(a)">Hijo(a), hijastro(a)</option>
                            <option value="Padre, Madre, Suegro, Suegra">Padre, Madre, Suegro, Suegra</option>
                            <option value="Hermano(a), Hermanastro(a)">Hermano(a), Hermanastro(a)</option>
                            <option value="Abuelo(a)">Abuelo(a)</option>
                            <option value="Nieto(a)">Nieto(a)</option>
                            <option value="Tío(a)">Tío(a)</option>
                            <option value="Otro pariente">Otro pariente</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-2 border-t border-slate-100">
                        <div className="min-w-0">
                          <label className="block text-xs font-bold text-slate-700 mb-1">Filtrar Zona:</label>
                          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => setSectorZoneFilter('all')}
                              className={`py-1.5 px-1 text-[10px] sm:text-[11px] font-bold rounded-lg transition text-center truncate cursor-pointer ${sectorZoneFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600'}`}
                            >
                              Todos
                            </button>
                            <button
                              type="button"
                              onClick={() => setSectorZoneFilter('urbano')}
                              className={`py-1.5 px-1 text-[10px] sm:text-[11px] font-bold rounded-lg transition text-center truncate cursor-pointer ${sectorZoneFilter === 'urbano' ? 'bg-white text-blue-800 shadow-xs font-black' : 'text-slate-600'}`}
                            >
                              Urbano
                            </button>
                            <button
                              type="button"
                              onClick={() => setSectorZoneFilter('rural')}
                              className={`py-1.5 px-1 text-[10px] sm:text-[11px] font-bold rounded-lg transition text-center truncate cursor-pointer ${sectorZoneFilter === 'rural' ? 'bg-white text-emerald-800 shadow-xs font-black' : 'text-slate-600'}`}
                            >
                              Rural
                            </button>
                          </div>
                        </div>

                        <div className="min-w-0">
                          <label className="block text-xs font-bold text-slate-700 mb-1">Sector / Barrio / Vereda *</label>
                          <SearchableSelect
                            options={sectoresSearchableOptions}
                            value={sectorId}
                            onChange={(val) => {
                              setSectorId(Number(val));
                              const secObj = sectores.find((s) => s.id_sector === Number(val));
                              if (secObj && secObj.latitud && secObj.longitud) {
                                setLatitud(secObj.latitud);
                                setLongitud(secObj.longitud);
                              }
                            }}
                          />
                        </div>

                        <div className="min-w-0 sm:col-span-2 md:col-span-1">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {isSelectedSectorRural ? 'Nombre Finca / Obs. Sector (Opcional)' : 'Dirección de Afectación'}
                          </label>
                          <input
                            type="text"
                            value={isSelectedSectorRural ? observacionSector : direccion}
                            onChange={(e) => isSelectedSectorRural ? setObservacionSector(e.target.value) : setDireccion(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 min-w-0 box-border"
                          />
                        </div>
                      </div>

                      {/* GPS coordinates & buttons */}
                      <div className="p-3 sm:p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 text-xs text-slate-700 min-w-0">
                          <MapPin className="h-4 w-4 text-blue-700 shrink-0" />
                          <span className="font-mono text-[11px] sm:text-xs break-all">GPS: {latitud.toFixed(6)}, {longitud.toFixed(6)}</span>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={handleGetGps}
                            disabled={gpsLoading}
                            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <LocateFixed className="h-3.5 w-3.5" />
                            <span>{gpsLoading ? 'Capturando...' : 'GPS Automático'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsMapModalOpen(true)}
                            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            <span>Fijar en Mapa</span>
                          </button>
                        </div>
                      </div>

                      {/* Botón Siguiente (Paso 1 -> Paso 2) */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleCambiarPaso(2)}
                          className="px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Siguiente</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Núcleo Familiar (Caracterización Demográfica del Hogar) */}
                  {formStepTab === 2 && (
                    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xs border border-slate-200 space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-blue-50 text-[#0071e3] rounded-xl">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                              <span>Núcleo Familiar y Composición del Hogar</span>
                              <span className="bg-blue-50 text-[#0071e3] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                                {nucleoFamiliar.length} integrante(s) adicionales
                              </span>
                            </h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={agregarFamiliar}
                            className="px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ED] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            <Plus className="h-4 w-4" />
                            <span>+ Agregar Integrante</span>
                          </button>
                        </div>
                      </div>

                      {/* Resumen del Solicitante Principal / Jefe de Hogar */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0071e3] flex items-center justify-center font-bold text-xs">
                            JH
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              {nombres || apellidos ? `${nombres} ${apellidos}`.trim() : 'Solicitante / Jefe(a) de hogar'}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Documento: <strong className="font-mono text-slate-700">{documento || 'Sin especificar'}</strong> • Rol: {parentescoCiudadano}
                            </div>
                          </div>
                        </div>
                        {idNucleoVinculado ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                            ✓ Núcleo Vinculado #{idNucleoVinculado} ({nombreNucleoVinculado})
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                            Se creará / sincronizará automáticamente al guardar
                          </span>
                        )}
                      </div>

                      {/* Lista de Integrantes del Núcleo Familiar */}
                      {nucleoFamiliar.length === 0 ? (
                        <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
                          <Users className="h-7 w-7 text-slate-400 mx-auto" />
                          <p className="text-xs font-semibold text-slate-600">
                            No se han registrado integrantes adicionales en este núcleo familiar.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {nucleoFamiliar.map((fam, index) => (
                            <div
                              key={fam.id}
                              className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2.5 transition-all hover:border-blue-300 hover:bg-white"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                <div className="sm:col-span-1 flex items-center gap-1">
                                  <span className="w-6 h-6 rounded-lg bg-[#0071e3] text-white text-xs font-bold flex items-center justify-center shrink-0">
                                    #{index + 1}
                                  </span>
                                </div>
                                <div className="sm:col-span-3">
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Nombre(s) *</label>
                                  <input
                                    type="text"
                                    value={fam.nombres}
                                    onChange={(e) => actualizarFamiliar(fam.id, 'nombres', e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                                </div>
                                <div className="sm:col-span-3">
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Apellido(s)</label>
                                  <input
                                    type="text"
                                    value={fam.apellidos}
                                    onChange={(e) => actualizarFamiliar(fam.id, 'apellidos', e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Tipo Doc</label>
                                  <select
                                    value={fam.tipo_documento}
                                    onChange={(e) => actualizarFamiliar(fam.id, 'tipo_documento', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 cursor-pointer"
                                  >
                                    <option value="CC">CC (Cédula)</option>
                                    <option value="TI">TI (Tarjeta Id)</option>
                                    <option value="RC">RC (Registro Civil)</option>
                                    <option value="CE">CE (Cédula Extr)</option>
                                    <option value="PPT">PPT (Permiso Protec)</option>
                                    <option value="PAS">PAS (Pasaporte)</option>
                                    <option value="OTRO">OTRO</option>
                                  </select>
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">N° Documento</label>
                                  <input
                                    type="text"
                                    value={fam.documento}
                                    onChange={(e) => actualizarFamiliar(fam.id, 'documento', e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                                  />
                                </div>
                                <div className="sm:col-span-1 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => eliminarFamiliar(fam.id)}
                                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                                    title="Eliminar integrante"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1.5 border-t border-slate-200/60">
                                <div className="sm:col-span-3">
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Parentesco</label>
                                  <select
                                    value={fam.parentesco}
                                    onChange={(e) => actualizarFamiliar(fam.id, 'parentesco', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 cursor-pointer"
                                  >
                                    <option value="Jefe(a) o cabeza del hogar">Jefe(a) o cabeza del hogar</option>
                                    <option value="Presidente(a) de la Junta de Acción Comunal">Presidente(a) de la Junta de Acción Comunal</option>
                                    <option value="Pareja, Esposo(a)">Pareja, Esposo(a)</option>
                                    <option value="Hijo(a), hijastro(a)">Hijo(a), hijastro(a)</option>
                                    <option value="Padre, Madre, Suegro, Suegra">Padre, Madre, Suegro, Suegra</option>
                                    <option value="Hermano(a), Hermanastro(a)">Hermano(a), Hermanastro(a)</option>
                                    <option value="Abuelo(a)">Abuelo(a)</option>
                                    <option value="Nieto(a)">Nieto(a)</option>
                                    <option value="Tío(a)">Tío(a)</option>
                                    <option value="Sobrino(a)">Sobrino(a)</option>
                                    <option value="Otro pariente">Otro pariente</option>
                                    <option value="Otro no pariente">Otro no pariente</option>
                                  </select>
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Género</label>
                                  <select
                                    value={fam.identidad_genero}
                                    onChange={(e) => actualizarFamiliar(fam.id, 'identidad_genero', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 cursor-pointer"
                                  >
                                    <option value="M">M (Masculino)</option>
                                    <option value="F">F (Femenino)</option>
                                    <option value="T">T (Transgénero)</option>
                                  </select>
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Fecha Nacimiento</label>
                                  <input
                                    type="date"
                                    value={fam.fecha_nacimiento}
                                    onChange={(e) => actualizarFamiliar(fam.id, 'fecha_nacimiento', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                                  />
                                </div>
                                <div className="sm:col-span-3">
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Pertenencia Étnica</label>
                                  <select
                                    value={fam.grupo_etnico}
                                    onChange={(e) => actualizarFamiliar(fam.id, 'grupo_etnico', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 cursor-pointer"
                                  >
                                    <option value="Ninguno de los anteriores">Ninguno / No aplica</option>
                                    <option value="Indígena">Indígena</option>
                                    <option value="Gitano(a) o Rom">Gitano(a) o Rom</option>
                                    <option value="Raizal">Raizal</option>
                                    <option value="Palenquero(a)">Palenquero(a)</option>
                                    <option value="Afrocolombiano(a), negro(a), mulato(a) o afrodescendiente">Afrocolombiano(a)...</option>
                                  </select>
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Teléfono</label>
                                  <input
                                    type="tel"
                                    value={fam.telefono}
                                    onChange={(e) => actualizarFamiliar(fam.id, 'telefono', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Navegación Paso 2 */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setFormStepTab(1)}
                          className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                        >
                          ← Anterior
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsRufeSectionOpen(true);
                            setFormStepTab(3);
                          }}
                          className="px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Siguiente (RUFE)</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Formulario Oficial UNGRD RUFE (FR-1703-SMD-69) SMD - ERE */}
                  {formStepTab === 3 && (
                    <div className="bg-white rounded-3xl shadow-xs border border-indigo-200 overflow-hidden">
                      {/* Header Banner Oficial RUFE */}
                      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-indigo-700">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                              FORMULARIO OFICIAL UNGRD
                            </span>
                            <span className="text-indigo-200 text-xs font-mono font-bold">
                              FR-1703-SMD-69 | VERSIÓN 01
                            </span>
                          </div>
                          <h2 className="text-sm sm:text-base font-black tracking-wide flex items-center gap-2">
                            <FileText className="h-5 w-5 text-amber-400" />
                            2. REGISTRO UNIFAMILIAR DE EMERGENCIAS (RUFE) SMD - ERE
                          </h2>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsRufeSectionOpen(!isRufeSectionOpen)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-xs cursor-pointer ${isRufeSectionOpen
                            ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                            : 'bg-indigo-700 hover:bg-indigo-600 text-white border border-indigo-500'
                            }`}
                        >
                          <FileText className="h-4 w-4" />
                          <span>{isRufeSectionOpen ? 'Ocultar Formulario RUFE' : 'Desplegar RUFE'}</span>
                          {isRufeSectionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>

                      {isRufeSectionOpen && (
                        <div className="p-4 sm:p-6 space-y-6 bg-slate-50/50">
                          {/* Encabezado Evento / Fecha RUFE */}
                          <div className="p-3.5 bg-white rounded-2xl border border-indigo-200/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Fecha del RUFE</label>
                              <input
                                type="date"
                                value={fechaRufe}
                                onChange={(e) => setFechaRufe(e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Corregimiento</label>
                              <input
                                type="text"
                                value={corregimiento}
                                onChange={(e) => setCorregimiento(e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">¿Lugar Habitual Residencia?</label>
                              <select
                                value={residenciaHabitual === null ? '' : residenciaHabitual ? 'SI' : 'NO'}
                                onChange={(e) => setResidenciaHabitual(e.target.value === '' ? null : e.target.value === 'SI')}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                              >
                                <option value="">Seleccione...</option>
                                <option value="SI">SI (Habita allí normalmente)</option>
                                <option value="NO">NO</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">¿Evacuado Fuera de Residencia?</label>
                              <select
                                value={evacuadoResidencia === null ? '' : evacuadoResidencia ? 'SI' : 'NO'}
                                onChange={(e) => setEvacuadoResidencia(e.target.value === '' ? null : e.target.value === 'SI')}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                              >
                                <option value="">Seleccione...</option>
                                <option value="SI">SI (Evacuado)</option>
                                <option value="NO">NO</option>
                              </select>
                            </div>
                          </div>

                          {/* Bloque 1: Ubicación del Bien, Modalidad de Tenencia, Enfoque de Solicitud, Ficha Catastral y Estado del Bien */}
                          <div className="p-4 bg-white rounded-2xl border border-indigo-200/80 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2">
                              <h3 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                                <Home className="h-4 w-4 text-indigo-600" />
                                <span>1. Ubicación, Modalidad de Tenencia, Enfoque de la Solicitud y Estado del Bien</span>
                              </h3>
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                                ⚡ Determina automáticamente el enfoque de la solicitud
                              </span>
                            </div>

                            {/* Tarjetas de Modalidad de Tenencia (Propietario Residente | Arrendatario | Propietario No Residente) */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <label className="font-extrabold text-slate-900 block text-xs">
                                  Modalidad de Tenencia y Derechos de Asistencia *
                                </label>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  Al seleccionar si es residente, arrendatario o propietario no residente se define el enfoque de la solicitud
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {([
                                  {
                                    key: 'PROPIETARIO_RESIDENTE',
                                    titulo: 'Propietario Residente',
                                    sub: 'Habita el predio afectado',
                                    badge: 'Derecho Integral',
                                    badgeColor: 'bg-emerald-100 text-emerald-800',
                                    enfoqueLabel: 'Social y de Inmueble (Integral)',
                                    enfoqueVal: 'SOCIAL_E_INMUEBLE' as const,
                                    desc: 'Elegible a kits de subsistencia, auxilio de arrendamiento temporal si evacúa y postulación a reconstrucción o materiales.',
                                  },
                                  {
                                    key: 'ARRENDATARIO',
                                    titulo: 'Arrendatario / Inquilino',
                                    sub: 'Paga canon de arrendamiento',
                                    badge: 'Subsidio Arriendo + Kits',
                                    badgeColor: 'bg-amber-100 text-amber-900',
                                    enfoqueLabel: 'Solo Asistencia Social / Familiar',
                                    enfoqueVal: 'SOCIAL' as const,
                                    desc: 'Receptor directo del auxilio económico de arrendamiento temporal y kits de emergencia. No aplica reconstrucción de inmueble.',
                                  },
                                  {
                                    key: 'PROPIETARIO_NO_RESIDENTE',
                                    titulo: 'Propietario No Residente',
                                    sub: 'Arrienda o tiene predio desocupado',
                                    badge: 'Solo Daño Físico',
                                    badgeColor: 'bg-blue-100 text-blue-900',
                                    enfoqueLabel: 'Solo Inmueble / Daño Material',
                                    enfoqueVal: 'INMUEBLE' as const,
                                    desc: 'Derecho a valoración técnica y apoyo estructural/materiales por pérdida patrimonial de vivienda. No recibe kits humanitarios.',
                                  },
                                ] as const).map((card) => {
                                  const isSel = tipoTenencia === card.key;
                                  return (
                                    <div
                                      key={card.key}
                                      onClick={() => {
                                        setTipoTenencia(card.key);
                                        setSubtipoEmergencia(card.enfoqueVal);
                                        if (card.key === 'PROPIETARIO_RESIDENTE') {
                                          setFormaTenenciaRufe('PROPIETARIO');
                                          setResidenciaHabitual(true);
                                          setEsPropietario(true);
                                          setEsPropietarioSolicitante(true);
                                        } else if (card.key === 'ARRENDATARIO') {
                                          setFormaTenenciaRufe('ARRENDATARIO');
                                          setResidenciaHabitual(true);
                                          setEsPropietario(false);
                                          setEsPropietarioSolicitante(false);
                                        } else {
                                          setFormaTenenciaRufe('PROPIETARIO');
                                          setResidenciaHabitual(false);
                                          setEsPropietario(true);
                                          setEsPropietarioSolicitante(true);
                                        }
                                      }}
                                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                        isSel
                                          ? 'border-[#0071e3] bg-blue-50/50 shadow-xs ring-2 ring-[#0071e3]/15'
                                          : 'border-slate-200 bg-white hover:border-slate-300'
                                      }`}
                                    >
                                      <div>
                                        <div className="flex items-center justify-between gap-1 mb-1">
                                          <span className="font-extrabold text-slate-900 text-xs">{card.titulo}</span>
                                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${card.badgeColor}`}>
                                            {card.badge}
                                          </span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 block mb-1">{card.sub}</span>
                                        <p className="text-[10px] text-slate-600 leading-tight">{card.desc}</p>
                                      </div>
                                      <div className="pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-[10px]">
                                        <span className="font-bold text-indigo-900">Enfoque: {card.enfoqueLabel}</span>
                                        {isSel && (
                                          <span className="font-extrabold text-[#0071e3]">✓ Activo</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                                  Enfoque de la Solicitud *
                                </label>
                                <select
                                  value={subtipoEmergencia}
                                  onChange={(e) => setSubtipoEmergencia(e.target.value as any)}
                                  className="w-full px-3 py-1.5 bg-indigo-50/70 border border-indigo-300 rounded-xl text-xs font-extrabold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                >
                                  <option value="SOCIAL_E_INMUEBLE">Social y de Inmueble (Integral)</option>
                                  <option value="INMUEBLE">Solo Inmueble / Daño Material</option>
                                  <option value="SOCIAL">Solo Asistencia Social / Familiar</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                                  Ficha Catastral / Matrícula:
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ej. 17042000100000025..."
                                  value={fichaCatastral}
                                  onChange={(e) => setFichaCatastral(e.target.value)}
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                                  Forma de Tenencia (RUFE)
                                </label>
                                <select
                                  value={formaTenenciaRufe}
                                  onChange={(e) => setFormaTenenciaRufe(e.target.value)}
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                >
                                  <option value="PROPIETARIO">PROPIETARIO</option>
                                  <option value="ARRENDATARIO">ARRENDATARIO</option>
                                  <option value="OCUPANTE">OCUPANTE</option>
                                  <option value="POSEEDOR">POSEEDOR</option>
                                  <option value="NO INFORMA">NO INFORMA</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                                  Estado del Bien
                                </label>
                                <select
                                  value={estadoBienRufe}
                                  onChange={(e) => setEstadoBienRufe(e.target.value)}
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                >
                                  <option value="HABITABLE">HABITABLE</option>
                                  <option value="NO HABITABLE">NO HABITABLE</option>
                                  <option value="DESTRUIDO">DESTRUIDO</option>
                                  <option value="AVERIADO">AVERIADO</option>
                                  <option value="NO INFORMA">NO INFORMA</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                                  Tipo de Bien Afectado
                                </label>
                                <select
                                  value={tipoBienRufe}
                                  onChange={(e) => {
                                    setTipoBienRufe(e.target.value);
                                    setTipoInmueble(e.target.value);
                                  }}
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                >
                                  <option value="Vivienda">VIVIENDA</option>
                                  <option value="Finca">FINCA</option>
                                  <option value="Local Comercial">LOCAL COMERCIAL</option>
                                  <option value="Fábrica">FÁBRICA</option>
                                  <option value="Bodega">BODEGA</option>
                                  <option value="Lote">LOTE</option>
                                  <option value="Centro de Bienestar">CENTRO DE BIENESTAR</option>
                                  <option value="Centro Educativo / Escuela">CENTRO EDUCATIVO / ESCUELA</option>
                                  <option value="Centro Adulto Mayor">CENTRO ADULTO MAYOR</option>
                                  <option value="Hospital">HOSPITAL</option>
                                  <option value="Estadio">ESTADIO</option>
                                  <option value="Iglesia / Institución Religiosa">IGLESIA / INSTITUCIÓN RELIGIOSA</option>
                                  <option value="Alcaldía Municipal">ALCALDÍA MUNICIPAL</option>
                                  <option value="Estación de Policía">ESTACIÓN DE POLICÍA</option>
                                </select>
                              </div>
                            </div>

                            {/* Datos del Propietario del Inmueble (cuando es Arrendatario o el solicitante no es el propietario) */}
                            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={esPropietarioSolicitante}
                                  onChange={(e) => setEsPropietarioSolicitante(e.target.checked)}
                                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                                />
                                <span>El solicitante registrado ({nombres || 'Ciudadano'}) es el propietario del inmueble</span>
                              </label>

                              {!esPropietarioSolicitante && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 uppercase">Cédula del Propietario</label>
                                    <input
                                      type="text"
                                      value={propietarioDocumento}
                                      onChange={(e) => setPropietarioDocumento(e.target.value)}
                                      placeholder="Documento del propietario"
                                      className="mt-0.5 w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 uppercase">Nombre Completo Propietario</label>
                                    <input
                                      type="text"
                                      value={propietarioNombre}
                                      onChange={(e) => setPropietarioNombre(e.target.value)}
                                      placeholder="Nombres y apellidos del dueño"
                                      className="mt-0.5 w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 uppercase">Teléfono Propietario</label>
                                    <input
                                      type="text"
                                      value={propietarioTelefono}
                                      onChange={(e) => setPropietarioTelefono(e.target.value)}
                                      placeholder="Teléfono de contacto"
                                      className="mt-0.5 w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Bloque 2: Sector Agropecuario (Pérdidas Agrícolas y Pecuarias) */}
                          <div className="p-4 bg-white rounded-2xl border border-indigo-200/80 space-y-3">
                            <h3 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide flex items-center gap-1.5 border-b border-indigo-100 pb-2">
                              <Leaf className="h-4 w-4 text-emerald-600" />
                              <span>2. Sector Agropecuario (Pérdidas de Cultivos y Pecuario RUFE)</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5">
                              <div className="sm:col-span-2 md:col-span-3 min-w-0">
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5 truncate">Tipo de Cultivo</label>
                                <input
                                  type="text"
                                  value={cultivoTipo}
                                  onChange={(e) => setCultivoTipo(e.target.value)}
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 min-w-0 box-border"
                                />
                              </div>

                              <div className="sm:col-span-1 md:col-span-3 min-w-0">
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5 truncate">Unidad Medida</label>
                                <select
                                  value={cultivoUnidad}
                                  onChange={(e) => setCultivoUnidad(e.target.value)}
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-0 truncate box-border"
                                >
                                  <option value="Hectáreas">Hectáreas (s)</option>
                                  <option value="Fanegadas">Fanegada (s)</option>
                                  <option value="Metros Cuadrados">Metro (s) Cuadrado (s)</option>
                                  <option value="Unidades">Unidades</option>
                                </select>
                              </div>

                              <div className="sm:col-span-1 md:col-span-2 min-w-0">
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5 truncate">Área / Cantidad</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={cultivoArea}
                                  onChange={(e) => setCultivoArea(e.target.value)}
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 min-w-0 box-border"
                                />
                              </div>

                              <div className="sm:col-span-1 md:col-span-2 min-w-0">
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5 truncate">Especie Pecuaria</label>
                                <input
                                  type="text"
                                  value={pecuarioEspecie}
                                  onChange={(e) => setPecuarioEspecie(e.target.value)}
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 min-w-0 box-border"
                                />
                              </div>

                              <div className="sm:col-span-1 md:col-span-2 min-w-0">
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5 truncate">Cant</label>
                                <input
                                  type="number"
                                  value={pecuarioCantidad}
                                  onChange={(e) => setPecuarioCantidad(e.target.value)}
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 min-w-0 box-border"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Bloque 3: Vo.Bo. CMGRD/CDGRD */}
                          <div className="p-3 bg-white rounded-2xl border border-indigo-200/80 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="vobo_cmgrd"
                                checked={voboCmgrd}
                                onChange={(e) => setVoboCmgrd(e.target.checked)}
                                className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                              />
                              <label htmlFor="vobo_cmgrd" className="text-xs font-extrabold text-indigo-950 cursor-pointer">
                                Vo.Bo. CMGRD / CDGRD (Visto Bueno del Consejo Municipal/Departamental de Gestión del Riesgo)
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Navegación Paso 3 */}
                      <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setFormStepTab(2)}
                          className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                        >
                          ← Anterior
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormStepTab(4)}
                          className="px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Siguiente (Afectación del Inmueble)</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: Evaluación de la Vivienda e Infraestructura (Mockup 5 + Paneles Técnicos) */}
                  {formStepTab === 4 && (
                    <div className="space-y-4">
                      {/* Tarjeta Superior estilo Mockup 5: Matriz de Componentes + Nivel de Daño + Afectación de Personas + Resumen */}
                      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xs border border-slate-200 space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-blue-50 text-[#0071e3] rounded-xl">
                              <Home className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                                Evaluación del inmueble afectado ({tipoInmuebleActual})
                              </h3>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-blue-50 text-[#0071e3] text-xs font-bold">
                            En evaluación técnica
                          </span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                          {/* Columna Izquierda (7 cols): Matriz de Componentes + Tarjetas de Nivel de Daño */}
                          <div className="lg:col-span-7 space-y-4">
                            {/* Menú de selección de Tipo de Inmueble Afectado */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                        <label className="block text-xs font-bold text-slate-800">Tipo de inmueble afectado *</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {TIPOS_INMUEBLE_AFECTADO.map((t, idx) => {
                            const activo = tipoInmuebleActual === t;
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => seleccionarTipoInmueble(t)}
                                className={`px-3 py-2 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
                                  activo
                                    ? 'bg-[#0071e3] text-white border-[#0071e3] shadow-2xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {idx + 1}. {t}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 4 Tarjetas Visuales de Nivel de Daño de la Vivienda */}
                            <div className="space-y-2">
                              <label className="block text-xs font-bold text-slate-800">
                                Nivel de daño global ({tipoInmuebleActual}) *
                              </label>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                {([
                                  {
                                    val: 'Ninguno',
                                    title: 'Sin afectación',
                                    desc: 'No se evidencian daños significativos.',
                                    color: 'text-slate-600',
                                    activeRing: 'border-slate-500 bg-slate-50',
                                  },
                                  {
                                    val: 'Leve',
                                    title: 'Daño leve',
                                    desc: 'Afectaciones menores, uso con precaución.',
                                    color: 'text-amber-500',
                                    activeRing: 'border-amber-500 bg-amber-50/60',
                                  },
                                  {
                                    val: 'Grave',
                                    title: 'Daño moderado',
                                    desc: 'Daños importantes que requieren reparación.',
                                    color: 'text-orange-500',
                                    activeRing: 'border-[#0071e3] bg-blue-50/70 ring-2 ring-[#0071e3]/15',
                                  },
                                  {
                                    val: 'Colapso Total',
                                    title: 'Daño grave',
                                    desc: 'Pérdida parcial o total, no habitable.',
                                    color: 'text-rose-600',
                                    activeRing: 'border-rose-600 bg-rose-50/70 ring-2 ring-rose-500/15',
                                  },
                                ] as const).map((card) => {
                                  const isSelected = afectacionNivel === card.val;
                                  return (
                                    <button
                                      key={card.val}
                                      type="button"
                                      onClick={() => {
                                        setAfectacionNivel(card.val);
                                        setUserManualDamageLevel(true);
                                      }}
                                      className={`p-3 rounded-2xl border-2 text-center flex flex-col items-center justify-between gap-1.5 transition cursor-pointer relative ${isSelected ? card.activeRing : 'border-slate-200 bg-white hover:border-slate-300'
                                        }`}
                                    >
                                      {isSelected && (
                                        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#0071e3] text-white flex items-center justify-center text-[9px] font-bold">
                                          ✓
                                        </span>
                                      )}
                                      <Home className={`h-6 w-6 ${card.color}`} />
                                      <div className="text-xs font-extrabold text-slate-900">{card.title}</div>
                                      <div className="text-[10px] text-slate-500 leading-tight">{descNivelDano[card.val]}</div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Columna Derecha (5 cols): Afectación de personas + Observaciones + Resumen de la Evaluación */}
                          <div className="lg:col-span-5 space-y-3.5">
                            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                              <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                                <Users className="h-4 w-4 text-[#0071e3]" />
                                <span>Afectación de personas</span>
                              </h4>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 mb-1">N.° de familias</label>
                                  <input
                                    type="number"
                                    min={1}
                                    value={1}
                                    readOnly
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-center"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 mb-1">N.° de personas</label>
                                  <input
                                    type="number"
                                    min={1}
                                    value={1 + Math.max(nucleoFamiliar.length, Number(numAcompanantes) || 0)}
                                    onChange={(e) => {
                                      const total = Math.max(1, Number(e.target.value) || 1);
                                      setNumAcompanantes(Math.max(0, total - 1));
                                      setHayAcompanantes(total > 1);
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-center"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Vulnerables</label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={(Number(numAdultosMayores) || 0) + (Number(numNinos) || 0)}
                                    readOnly
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-center"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                              <label className="block text-xs font-extrabold text-slate-900">
                                Observaciones técnicas de la evaluación
                              </label>
                              <textarea
                                rows={2}
                                value={otrosDanosDescripcion}
                                onChange={(e) => setOtrosDanosDescripcion(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#0071e3] outline-none"
                              />
                            </div>

                            <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40 space-y-2 text-xs">
                              <div className="font-extrabold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-blue-100">
                                <ListCheck className="h-4 w-4 text-[#0071e3]" />
                                <span>Resumen de la evaluación</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Alcance:</span>
                                <span className="font-bold text-slate-900">
                                  {tipoDestinatario === 'COMUNIDAD'
                                    ? 'Comunidad / Sector'
                                    : tipoDestinatario === 'INDIVIDUAL'
                                      ? 'Persona Individual'
                                      : 'Núcleo familiar'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Nivel de daño:</span>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${afectacionNivel === 'Colapso Total'
                                    ? 'bg-rose-100 text-rose-700'
                                    : afectacionNivel === 'Grave'
                                      ? 'bg-amber-100 text-amber-800'
                                      : afectacionNivel === 'Leve'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-slate-200 text-slate-700'
                                    }`}
                                >
                                  {afectacionNivel === 'Colapso Total'
                                    ? 'Daño grave / Colapso'
                                    : afectacionNivel === 'Grave'
                                      ? 'Daño moderado / Grave'
                                      : afectacionNivel === 'Leve'
                                        ? 'Daño leve'
                                        : 'Sin afectación'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Evaluador:</span>
                                <span className="font-semibold text-slate-800">
                                  {user ? `${user.nombres || ''} ${user.apellidos || ''}`.trim() || 'Funcionario SAD' : 'Funcionario SAD'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Indicadores Rápidos de Campo & Desglose Detallado (Techo, Estructura, Paredes/Pisos e Inmueble) */}
                      <div className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
                        <span className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                          Verificación de Campo e Indicadores de Emergencia:
                        </span>

                        {/* 5 Checkboxes SI/NO: Evacuar, Visita, Censo, Albergue, Red de Apoyo */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                          {/* EVACUAR */}
                          <div
                            onClick={handleToggleEvacuar}
                            className={`p-3 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all select-none ${evacuar
                              ? 'border-rose-500 bg-rose-600 text-white font-extrabold shadow-xs ring-2 ring-rose-300'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <input type="checkbox" checked={evacuar} readOnly className="h-3.5 w-3.5 pointer-events-none rounded" />
                              <span className="text-xs font-extrabold leading-tight">Evacuar</span>
                            </div>
                            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${evacuar ? 'bg-white text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                              {evacuar ? 'SI' : 'NO'}
                            </span>
                          </div>

                          {/* VISITA */}
                          <div
                            onClick={() => setVisita(!visita)}
                            className={`p-3 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all select-none ${visita
                              ? 'border-indigo-500 bg-indigo-600 text-white font-extrabold shadow-xs ring-2 ring-indigo-300'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <input type="checkbox" checked={visita} readOnly className="h-3.5 w-3.5 pointer-events-none rounded" />
                              <span className="text-xs font-extrabold leading-tight">Visita Técnico</span>
                            </div>
                            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${visita ? 'bg-white text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                              {visita ? 'SI' : 'NO'}
                            </span>
                          </div>

                          {/* CENSO */}
                          <div
                            onClick={() => setCenso(!censo)}
                            className={`p-3 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all select-none ${censo
                              ? 'border-emerald-500 bg-emerald-600 text-white font-extrabold shadow-xs ring-2 ring-emerald-300'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <input type="checkbox" checked={censo} readOnly className="h-3.5 w-3.5 pointer-events-none rounded" />
                              <span className="text-xs font-extrabold leading-tight">Censo</span>
                            </div>
                            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${censo ? 'bg-white text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {censo ? 'SI' : 'NO'}
                            </span>
                          </div>

                          {/* ALBERGUE (Requiere Evacuar) */}
                          <div
                            onClick={handleToggleAlbergue}
                            title={!evacuar ? 'Requiere activar Evacuar para seleccionar Albergue' : ''}
                            className={`p-3 rounded-2xl border-2 flex items-center justify-between transition-all select-none ${!evacuar
                              ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                              : albergue
                                ? 'border-amber-500 bg-amber-500 text-slate-950 font-extrabold shadow-xs ring-2 ring-amber-300 cursor-pointer'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 cursor-pointer'
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <input type="checkbox" checked={albergue} disabled={!evacuar} readOnly className="h-3.5 w-3.5 pointer-events-none rounded" />
                              <span className="text-xs font-extrabold leading-tight">Albergue</span>
                            </div>
                            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${!evacuar ? 'bg-slate-200 text-slate-400' : albergue ? 'bg-slate-950 text-amber-400' : 'bg-slate-100 text-slate-500'}`}>
                              {albergue ? 'SI' : 'NO'}
                            </span>
                          </div>

                          {/* RED DE APOYO (Requiere Evacuar) */}
                          <div
                            onClick={handleToggleRedApoyo}
                            title={!evacuar ? 'Requiere activar Evacuar para seleccionar Red de Apoyo' : ''}
                            className={`p-3 rounded-2xl border-2 flex items-center justify-between transition-all select-none ${!evacuar
                              ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                              : redApoyo
                                ? 'border-sky-500 bg-sky-600 text-white font-extrabold shadow-xs ring-2 ring-sky-300 cursor-pointer'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 cursor-pointer'
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <input type="checkbox" checked={redApoyo} disabled={!evacuar} readOnly className="h-3.5 w-3.5 pointer-events-none rounded" />
                              <span className="text-xs font-extrabold leading-tight">Red de Apoyo</span>
                            </div>
                            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${!evacuar ? 'bg-slate-200 text-slate-400' : redApoyo ? 'bg-white text-sky-700' : 'bg-slate-100 text-slate-500'}`}>
                              {redApoyo ? 'SI' : 'NO'}
                            </span>
                          </div>
                        </div>

                        {/* Desglose Técnico por Techo, Estructura, Paredes/Pisos y Caracterización del Inmueble */}
                        <div className="space-y-3 pt-2">
                          {/* Panel Colapsable 1: Afectación en Techo */}
                          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 overflow-hidden shadow-2xs">
                            <button
                              type="button"
                              onClick={() => setIsTechoSectionOpen(!isTechoSectionOpen)}
                              className="w-full px-4 py-3 bg-amber-100/60 hover:bg-amber-100 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-amber-500 text-slate-950 rounded-lg font-black text-xs">
                                  🏠
                                </span>
                                <div className="text-left">
                                  <h4 className="text-xs font-extrabold text-amber-950 uppercase flex items-center gap-2">
                                    <span>{tituloPanel1}</span>
                                    {fotosTecho.length > 0 && (
                                      <span className="bg-amber-500/20 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                                        📸 {fotosTecho.length}/6 fotos
                                      </span>
                                    )}
                                  </h4>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-amber-900 text-xs font-bold">
                                <span>{isTechoSectionOpen ? 'Ocultar' : 'Desplegar'}</span>
                                {isTechoSectionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </div>
                            </button>

                            {isTechoSectionOpen && (
                              <div className="p-4 space-y-3 bg-white border-t border-amber-200/60">
                                {esFinca ? (
                                  <div className="space-y-3">
                                    {/* Callout informativo según imagen */}
                                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs font-medium">
                                      <Info className="h-4 w-4 text-blue-600 shrink-0" />
                                      <span>Seleccione la afectación del techo de la casa principal según su gravedad. Luego marque las demás afectaciones que apliquen en la finca.</span>
                                    </div>

                                    {/* Bloque 1: Techo de la casa principal (Radio buttons) */}
                                    <div className="rounded-2xl border border-blue-200 bg-blue-50/20 overflow-hidden flex flex-col md:flex-row">
                                      <div className="md:w-44 p-3.5 bg-blue-50/70 border-b md:border-b-0 md:border-r border-blue-200 flex md:flex-col items-center justify-center gap-2 text-center shrink-0">
                                        <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shadow-2xs">
                                          <Home className="h-5 w-5" />
                                        </div>
                                        <div className="text-xs font-extrabold text-blue-950 leading-tight">
                                          Techo de la casa principal
                                        </div>
                                      </div>
                                      <div className="flex-1 p-3.5 space-y-2">
                                        <h5 className="text-xs font-extrabold text-slate-800">
                                          Afectación en el techo de la casa principal <span className="text-[11px] font-normal text-slate-500">(seleccione una opción)</span>
                                        </h5>
                                        <div className="space-y-1.5">
                                          {DANOS_FINCA_TECHO_CASA.map((item) => {
                                            const isSelected = selectedSubtipos.includes(item);
                                            return (
                                              <label
                                                key={item}
                                                className={`px-3 py-2 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${
                                                  isSelected
                                                    ? 'bg-blue-100/70 border-blue-400 font-extrabold text-blue-950 shadow-2xs'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                                }`}
                                              >
                                                <input
                                                  type="radio"
                                                  name="radio-danos-techo-finca-casa"
                                                  checked={isSelected}
                                                  onChange={() => selectRadioSubtipo(item, DANOS_FINCA_TECHO_CASA)}
                                                  onClick={(e) => {
                                                    if (isSelected) {
                                                      e.preventDefault();
                                                      selectRadioSubtipo(item, DANOS_FINCA_TECHO_CASA);
                                                    }
                                                  }}
                                                  className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                                />
                                                <span className="text-xs leading-snug">{item}</span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Bloque 2: Otras estructuras de la finca (Checklist multi-select) */}
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/20 overflow-hidden flex flex-col md:flex-row">
                                      <div className="md:w-44 p-3.5 bg-emerald-50/70 border-b md:border-b-0 md:border-r border-emerald-200 flex md:flex-col items-center justify-center gap-2 text-center shrink-0">
                                        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shadow-2xs">
                                          <Warehouse className="h-5 w-5" />
                                        </div>
                                        <div className="text-xs font-extrabold text-emerald-950 leading-tight">
                                          Otras estructuras de la finca
                                        </div>
                                      </div>
                                      <div className="flex-1 p-3.5 space-y-2">
                                        <h5 className="text-xs font-extrabold text-slate-800">
                                          Otras afectaciones <span className="text-[11px] font-normal text-slate-500">(puede seleccionar una o varias)</span>
                                        </h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                          {DANOS_FINCA_TECHO_OTRAS.map((item) => {
                                            const isSelected = selectedSubtipos.includes(item);
                                            return (
                                              <label
                                                key={item}
                                                className={`px-3 py-2 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${
                                                  isSelected
                                                    ? 'bg-emerald-50 border-emerald-400 font-extrabold text-emerald-950 shadow-2xs'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                                }`}
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={isSelected}
                                                  onChange={() => toggleSubtipo(item)}
                                                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <span className="leading-snug">{item}</span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                      {danosPanel1.map((item) => {
                                        const isSelected = selectedSubtipos.includes(item);
                                        return (
                                          <label
                                            key={item}
                                            className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                                              isSelected
                                                ? 'bg-amber-50 border-amber-400 font-extrabold text-amber-950 shadow-2xs'
                                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                            }`}
                                          >
                                            <input
                                              type="radio"
                                              name="radio-danos-techo"
                                              checked={isSelected}
                                              onChange={() => selectRadioSubtipo(item, danosPanel1)}
                                              onClick={(e) => {
                                                if (isSelected) {
                                                  e.preventDefault();
                                                  selectRadioSubtipo(item, danosPanel1);
                                                }
                                              }}
                                              className="h-4 w-4 text-amber-600 border-slate-300 focus:ring-amber-500"
                                            />
                                            <span className="leading-snug">{item}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                                    Observación Adicional de Techo (Opcional)
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={observacionTecho}
                                    onChange={(e) => setObservacionTecho(e.target.value)}
                                    placeholder="Describa otros detalles relevantes de la afectación en los techos..."
                                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                                  />
                                </div>

                                <div className="pt-2.5 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-[11px] font-extrabold text-amber-950 uppercase flex items-center gap-1.5">
                                    <span>Nivel Específico en Techo:</span>
                                    <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 text-[10px] font-bold">
                                      {techoDamageLevel}
                                    </span>
                                  </span>
                                  <div className="grid grid-cols-4 gap-1.5 sm:w-auto w-full">
                                    {(['Ninguno', 'Leve', 'Grave', 'Colapso Total'] as const).map((lvl) => (
                                      <button
                                        key={lvl}
                                        type="button"
                                        onClick={() => cambiarNivelTechoManual(lvl)}
                                        className={`py-1 px-2.5 rounded-xl text-[10px] font-bold border transition cursor-pointer ${getBotonNivelStyle(lvl, techoDamageLevel === lvl)}`}
                                      >
                                        {lvl === 'Colapso Total' ? 'Total' : lvl}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Evidencias Fotográficas de Techo / Cubierta (Hasta 6 Fotos) */}
                                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/70 border-2 border-dashed border-amber-300 space-y-2.5">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                      <label className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                                        <Camera className="h-4 w-4 text-amber-700" />
                                        <span>Fotos Evidencia de Techo / Cubierta ({fotosTecho.length}/6)</span>
                                      </label>
                                      <span className="text-[10px] text-amber-800 font-medium block">
                                        Adjunte hasta 6 fotografías claras del daño en tejas, vigas de cubierta o cielo raso.
                                      </span>
                                    </div>
                                    <label
                                      className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-xs transition-all cursor-pointer ${
                                        fotosTecho.length >= 6
                                          ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                                          : 'bg-amber-600 hover:bg-amber-700 text-white active:scale-95'
                                      }`}
                                    >
                                      <Camera className="h-3.5 w-3.5 text-white" />
                                      <span>{fotosTecho.length >= 6 ? 'Límite (6/6)' : '+ Subir Fotos Techo'}</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        disabled={fotosTecho.length >= 6}
                                        onChange={handleFotosTechoUpload}
                                        className="hidden"
                                      />
                                    </label>
                                  </div>

                                  {fotosTecho.length > 0 ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                                      {fotosTecho.map((foto, idx) => (
                                        <div key={idx} className="relative group rounded-xl overflow-hidden border-2 border-amber-400 aspect-square shadow-xs bg-slate-900">
                                          <img src={foto} alt={`Evidencia Techo ${idx + 1}`} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                                          <button
                                            type="button"
                                            onClick={() => removeFotoTecho(idx)}
                                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md transition cursor-pointer"
                                            title="Eliminar foto"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                          <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                            #{idx + 1}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-2 px-3 bg-white/80 rounded-xl border border-amber-200/80 text-[11px] text-amber-800">
                                      <span>No ha subido evidencias de techo aún. Haga clic en <strong>+ Subir Fotos Techo</strong> para adjuntar (máx. 6).</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Panel Colapsable 2: Afectación en Estructura */}
                          <div className="rounded-2xl border border-rose-200 bg-rose-50/40 overflow-hidden shadow-2xs">
                            <button
                              type="button"
                              onClick={() => setIsEstructuraSectionOpen(!isEstructuraSectionOpen)}
                              className="w-full px-4 py-3 bg-rose-100/60 hover:bg-rose-100 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-rose-600 text-white rounded-lg font-black text-xs">
                                  🏛️
                                </span>
                                <div className="text-left">
                                  <h4 className="text-xs font-extrabold text-rose-950 uppercase flex items-center gap-2">
                                    <span>{tituloPanel2}</span>
                                    {fotosEstructura.length > 0 && (
                                      <span className="bg-rose-500/20 text-rose-900 border border-rose-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                                        📸 {fotosEstructura.length}/6 fotos
                                      </span>
                                    )}
                                  </h4>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-rose-900 text-xs font-bold">
                                <span>{isEstructuraSectionOpen ? 'Ocultar' : 'Desplegar'}</span>
                                {isEstructuraSectionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </div>
                            </button>

                            {isEstructuraSectionOpen && (
                              <div className="p-4 space-y-3 bg-white border-t border-rose-200/60">
                                {esFinca ? (
                                  <div className="space-y-3">
                                    {/* Callout informativo según diseño */}
                                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs font-medium">
                                      <Info className="h-4 w-4 text-blue-600 shrink-0" />
                                      <span>Seleccione la afectación estructural de la casa principal según su gravedad. Luego marque las demás instalaciones productivas de la finca que presenten daños.</span>
                                    </div>

                                    {/* Bloque 1: Muros de la casa principal (Radio buttons) */}
                                    <div className="rounded-2xl border border-rose-200 bg-rose-50/20 overflow-hidden flex flex-col md:flex-row">
                                      <div className="md:w-44 p-3.5 bg-rose-50/70 border-b md:border-b-0 md:border-r border-rose-200 flex md:flex-col items-center justify-center gap-2 text-center shrink-0">
                                        <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shadow-2xs">
                                          <Home className="h-5 w-5" />
                                        </div>
                                        <div className="text-xs font-extrabold text-rose-950 leading-tight">
                                          Muros de la casa principal
                                        </div>
                                      </div>
                                      <div className="flex-1 p-3.5 space-y-2">
                                        <h5 className="text-xs font-extrabold text-slate-800">
                                          Afectación en muros de la casa principal <span className="text-[11px] font-normal text-slate-500">(seleccione una opción)</span>
                                        </h5>
                                        <div className="space-y-1.5">
                                          {DANOS_FINCA_MUROS_CASA.map((item) => {
                                            const isSelected = selectedSubtipos.includes(item);
                                            return (
                                              <label
                                                key={item}
                                                className={`px-3 py-2 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${
                                                  isSelected
                                                    ? 'bg-rose-100/70 border-rose-400 font-extrabold text-rose-950 shadow-2xs'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                                }`}
                                              >
                                                <input
                                                  type="radio"
                                                  name="radio-danos-muros-finca-casa"
                                                  checked={isSelected}
                                                  onChange={() => selectRadioSubtipo(item, DANOS_FINCA_MUROS_CASA)}
                                                  onClick={(e) => {
                                                    if (isSelected) {
                                                      e.preventDefault();
                                                      selectRadioSubtipo(item, DANOS_FINCA_MUROS_CASA);
                                                    }
                                                  }}
                                                  className="h-4 w-4 text-rose-600 border-slate-300 focus:ring-rose-500"
                                                />
                                                <span className="text-xs leading-snug">{item}</span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Bloque 2: Otras estructuras e instalaciones productivas (Checklist multi-select) */}
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/20 overflow-hidden flex flex-col md:flex-row">
                                      <div className="md:w-44 p-3.5 bg-emerald-50/70 border-b md:border-b-0 md:border-r border-emerald-200 flex md:flex-col items-center justify-center gap-2 text-center shrink-0">
                                        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shadow-2xs">
                                          <Warehouse className="h-5 w-5" />
                                        </div>
                                        <div className="text-xs font-extrabold text-emerald-950 leading-tight">
                                          Otras estructuras de la finca
                                        </div>
                                      </div>
                                      <div className="flex-1 p-3.5 space-y-2">
                                        <h5 className="text-xs font-extrabold text-slate-800">
                                          Otras afectaciones e instalaciones <span className="text-[11px] font-normal text-slate-500">(puede seleccionar una o varias)</span>
                                        </h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                          {DANOS_FINCA_MUROS_OTRAS.map((item) => {
                                            const isSelected = selectedSubtipos.includes(item);
                                            return (
                                              <label
                                                key={item}
                                                className={`px-3 py-2 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${
                                                  isSelected
                                                    ? 'bg-emerald-50 border-emerald-400 font-extrabold text-emerald-950 shadow-2xs'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                                }`}
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={isSelected}
                                                  onChange={() => toggleSubtipo(item)}
                                                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <span className="leading-snug">{item}</span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                      {danosPanel2.map((item) => {
                                        const isSelected = selectedSubtipos.includes(item);
                                        return (
                                          <label
                                            key={item}
                                            className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                                              isSelected
                                                ? 'bg-rose-50 border-rose-400 font-extrabold text-rose-950 shadow-2xs'
                                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                            }`}
                                          >
                                            <input
                                              type="radio"
                                              name="radio-danos-estructura"
                                              checked={isSelected}
                                              onChange={() => selectRadioSubtipo(item, danosPanel2)}
                                              onClick={(e) => {
                                                if (isSelected) {
                                                  e.preventDefault();
                                                  selectRadioSubtipo(item, danosPanel2);
                                                }
                                              }}
                                              className="h-4 w-4 text-rose-600 border-slate-300 focus:ring-rose-500"
                                            />
                                            <span className="leading-snug">{item}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                                    Observación Adicional de Estructura (Opcional)
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={observacionEstructura}
                                    onChange={(e) => setObservacionEstructura(e.target.value)}
                                    placeholder="Describa otros detalles relevantes de la afectación en paredes, muros o instalaciones..."
                                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                                  />
                                </div>

                                {/* EVALUACIÓN ESPECÍFICA DE MUROS Y CIMIENTOS/PISOS */}
                                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide">
                                      EVALUACIÓN ESPECÍFICA DE MUROS Y CIMIENTOS/PISOS:
                                    </span>
                                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                                      <span>⚡</span>
                                      <span>Sincronizado automáticamente • Modificable manualmente</span>
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Daño en paredes / muros portantes */}
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black text-slate-700 uppercase">
                                          DAÑO EN PAREDES / MUROS PORTANTES:
                                        </span>
                                        <span className="text-[11px] font-black text-rose-700">
                                          {paredesDamageLevel}
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-4 gap-1.5">
                                        {(['Ninguno', 'Leve', 'Grave', 'Colapso Total'] as const).map((lvl) => (
                                          <button
                                            key={`pared-${lvl}`}
                                            type="button"
                                            onClick={() => cambiarNivelParedesManual(lvl)}
                                            className={`py-1 px-2 rounded-xl text-[10px] font-bold border transition cursor-pointer ${getBotonNivelStyle(lvl, paredesDamageLevel === lvl)}`}
                                          >
                                            {lvl === 'Colapso Total' ? 'Total' : lvl}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Daño en pisos / cimientos */}
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black text-slate-700 uppercase">
                                          DAÑO EN PISOS / CIMIENTOS:
                                        </span>
                                        <span className="text-[11px] font-black text-amber-700">
                                          {pisosDamageLevel}
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-4 gap-1.5">
                                        {(['Ninguno', 'Leve', 'Grave', 'Colapso Total'] as const).map((lvl) => (
                                          <button
                                            key={`piso-${lvl}`}
                                            type="button"
                                            onClick={() => cambiarNivelPisosManual(lvl)}
                                            className={`py-1 px-2 rounded-xl text-[10px] font-bold border transition cursor-pointer ${getBotonNivelStyle(lvl, pisosDamageLevel === lvl)}`}
                                          >
                                            {lvl === 'Colapso Total' ? 'Total' : lvl}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Evidencias Fotográficas de Estructura / Muros (Hasta 6 Fotos) */}
                                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-50 to-red-50/70 border-2 border-dashed border-rose-300 space-y-2.5">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                      <label className="text-xs font-black text-rose-950 uppercase tracking-wide flex items-center gap-1.5">
                                        <Camera className="h-4 w-4 text-rose-700" />
                                        <span>Fotos Evidencia de Estructura / Muros ({fotosEstructura.length}/6)</span>
                                      </label>
                                      <span className="text-[10px] text-rose-800 font-medium block">
                                        Adjunte hasta 6 fotografías de grietas, fisuras, columnas, muros portantes o pisos.
                                      </span>
                                    </div>
                                    <label
                                      className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-xs transition-all cursor-pointer ${
                                        fotosEstructura.length >= 6
                                          ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                                          : 'bg-rose-600 hover:bg-rose-700 text-white active:scale-95'
                                      }`}
                                    >
                                      <Camera className="h-3.5 w-3.5 text-white" />
                                      <span>{fotosEstructura.length >= 6 ? 'Límite (6/6)' : '+ Subir Fotos Estructura'}</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        disabled={fotosEstructura.length >= 6}
                                        onChange={handleFotosEstructuraUpload}
                                        className="hidden"
                                      />
                                    </label>
                                  </div>

                                  {fotosEstructura.length > 0 ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                                      {fotosEstructura.map((foto, idx) => (
                                        <div key={idx} className="relative group rounded-xl overflow-hidden border-2 border-rose-400 aspect-square shadow-xs bg-slate-900">
                                          <img src={foto} alt={`Evidencia Estructura ${idx + 1}`} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                                          <button
                                            type="button"
                                            onClick={() => removeFotoEstructura(idx)}
                                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md transition cursor-pointer"
                                            title="Eliminar foto"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                          <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                            #{idx + 1}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-2 px-3 bg-white/80 rounded-xl border border-rose-200/80 text-[11px] text-rose-800">
                                      <span>No ha subido evidencias de estructura aún. Haga clic en <strong>+ Subir Fotos Estructura</strong> para adjuntar (máx. 6).</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Panel Colapsable 3: Costos a Nivel de Infraestructura y Caracterización Especial */}
                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 overflow-hidden shadow-2xs">
                            <button
                              type="button"
                              onClick={() => setIsInmuebleDatosOpen(!isInmuebleDatosOpen)}
                              className="w-full px-4 py-3 bg-emerald-100/60 hover:bg-emerald-100 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-emerald-600 text-white rounded-lg font-black text-xs">
                                  💰
                                </span>
                                <div className="text-left">
                                  <h4 className="text-xs font-extrabold text-emerald-950 uppercase flex items-center gap-2 flex-wrap">
                                    <span>3. Costos a Nivel de Infraestructura y Caracterización del Predio</span>
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                                      {tipoInmuebleActual} • $ {(Number(estimacionPerdidasPesos) || 0).toLocaleString()} COP
                                    </span>
                                  </h4>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-emerald-900 text-xs font-bold">
                                <span>{isInmuebleDatosOpen ? 'Ocultar' : 'Desplegar'}</span>
                                {isInmuebleDatosOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </div>
                            </button>

                            {isInmuebleDatosOpen && (
                              <div className="p-4 space-y-4 bg-white border-t border-emerald-200/60 text-xs">
                                {/* Resumen de Tenencia y Enfoque determinado en RUFE */}
                                <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-200 flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[11px] font-bold text-indigo-950">
                                      Enfoque y Tenencia (definidos en RUFE):
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-white border border-indigo-200 text-indigo-900 text-[11px] font-extrabold">
                                      {tipoTenencia === 'PROPIETARIO_RESIDENTE'
                                        ? 'Propietario Residente'
                                        : tipoTenencia === 'ARRENDATARIO'
                                          ? 'Arrendatario / Inquilino'
                                          : 'Propietario No Residente'}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold">
                                      {subtipoEmergencia === 'SOCIAL_E_INMUEBLE'
                                        ? 'Enfoque: Social y de Inmueble (Integral)'
                                        : subtipoEmergencia === 'SOCIAL'
                                          ? 'Enfoque: Solo Asistencia Social / Familiar'
                                          : 'Enfoque: Solo Inmueble / Daño Material'}
                                    </span>
                                    {fichaCatastral && (
                                      <span className="text-[11px] font-mono font-bold text-slate-600">
                                        • Ficha: {fichaCatastral}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setFormStepTab(3)}
                                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition cursor-pointer"
                                  >
                                    Cambiar en RUFE →
                                  </button>
                                </div>

                                {/* Costos a Nivel de Infraestructura ($ COP) */}
                                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                      <label className="block text-xs font-black text-emerald-950 uppercase">
                                        Estimación de Costos y Pérdidas en Infraestructura ($ COP)
                                      </label>
                                      <span className="text-[10px] text-emerald-800">
                                        Valoración económica del daño estructural, cubierta, muros e instalaciones afectadas.
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[10px] font-bold text-emerald-700 uppercase block">Total Costo Infraestructura</span>
                                      <span className="text-sm font-black font-mono text-emerald-950">
                                        $ {(Number(estimacionPerdidasPesos) || 0).toLocaleString('es-CO')} COP
                                      </span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                                        Costo Estimado Daño en Inmueble Principal ($ COP):
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="50000"
                                        value={estimacionPerdidasPesos}
                                        onChange={(e) => setEstimacionPerdidasPesos(e.target.value)}
                                        className="w-full px-3.5 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-extrabold text-emerald-900 font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                                      />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-[10px] font-bold text-slate-500 w-full">Valores de referencia rápida:</span>
                                      {[1000000, 3000000, 5000000, 10000000, 25000000, 50000000].map((val) => (
                                        <button
                                          key={val}
                                          type="button"
                                          onClick={() => setEstimacionPerdidasPesos(String(val))}
                                          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition cursor-pointer ${
                                            Number(estimacionPerdidasPesos) === val
                                              ? 'bg-emerald-600 text-white border-emerald-600'
                                              : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                                          }`}
                                        >
                                          ${(val / 1000000).toFixed(0)}M
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>



                                {/* Formulario para Locales Comerciales */}
                                {(tipoInmuebleActual === 'Local comercial' || esLocalComercial) && (
                                  <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
                                        <Building2 className="h-4 w-4 text-amber-700" />
                                        <span>Caracterización del Establecimiento Comercial y Pérdidas de Mercancía</span>
                                      </span>
                                      <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                                        Comercio
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                          Razón Social / Nombre Comercial *
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="Ej. Panadería y Abarrotes La Alsacia"
                                          value={comercioRazonSocial}
                                          onChange={(e) => setComercioRazonSocial(e.target.value)}
                                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                          NIT o RUT (Opcional)
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="Ej. 900.123.456-7"
                                          value={comercioNitRut}
                                          onChange={(e) => setComercioNitRut(e.target.value)}
                                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                        Descripción de Pérdidas de Mercancías, Enseres o Vitrinas
                                      </label>
                                      <textarea
                                        rows={2}
                                        placeholder="Pérdida de víveres por inundación, electrodomésticos dañados, vitrinas fracturadas..."
                                        value={comercioAfectacionMercancia}
                                        onChange={(e) => setComercioAfectacionMercancia(e.target.value)}
                                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Formulario para Comunidad / Junta de Acción Comunal */}
                                {tipoDestinatario === 'COMUNIDAD' && (
                                  <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="font-extrabold text-blue-950 text-xs flex items-center gap-1.5">
                                        <Users className="h-4 w-4 text-blue-700" />
                                        <span>Datos de la Organización Comunal / Junta de Acción Comunal</span>
                                      </span>
                                      <span className="text-[10px] font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full">
                                        JAC
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                          Nombre de la JAC o Comunidad *
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="Ej. JAC Vereda Alsacia"
                                          value={comunidadJacNombre}
                                          onChange={(e) => setComunidadJacNombre(e.target.value)}
                                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                          Personería Jurídica (Opcional)
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="Ej. Res. 042 de 1998"
                                          value={comunidadJacPersoneria}
                                          onChange={(e) => setComunidadJacPersoneria(e.target.value)}
                                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                          Presidente / Representante Comunal
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="Nombre completo"
                                          value={comunidadJacRepresentante}
                                          onChange={(e) => setComunidadJacRepresentante(e.target.value)}
                                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                          Teléfono de Contacto JAC
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="Ej. 312 000 0000"
                                          value={comunidadJacTelefono}
                                          onChange={(e) => setComunidadJacTelefono(e.target.value)}
                                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                                              </div>
                            )}
                          </div>

                          {/* ==================== SECCIÓN FINAL EVALUACIÓN DEL INMUEBLE: BANCO DE MATERIALES GOBIERNO DE ANSERMA ==================== */}
                          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                            {/* Encabezado alineado al sistema de diseño SAD */}
                            <div className="bg-slate-50 px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-blue-50 text-[#0071e3] border border-blue-100">
                                  <Hammer className="h-4 w-4" />
                                </div>
                                <div>
                                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                                    Banco de Materiales — Gobierno de Anserma
                                  </h4>
                                  <p className="text-[11px] text-slate-500">
                                    Seleccione los materiales requeridos para el inmueble, indique cantidad, tipo y aprobación
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0071e3] text-[11px] font-bold">
                                  {bancoMateriales.filter((m) => m.seleccionado || Number(m.cantidad) > 0).length} solicitados
                                </span>
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                                  {bancoMateriales.filter((m) => m.aprobado).length} aprobados
                                </span>
                              </div>
                            </div>

                            <div className="p-4 sm:p-5 space-y-4 bg-white">
                              {/* Tabla de Materiales: TIPO DE MATERIAL | CANTIDAD | TIPO / ESPECIFICACIÓN | APROBADO */}
                              <div className="space-y-2">
                                <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                  <div className="sm:col-span-5">Tipo de Material</div>
                                  <div className="sm:col-span-2 text-center">Cantidad</div>
                                  <div className="sm:col-span-3">Tipo / Especificación</div>
                                  <div className="sm:col-span-2 text-center">Aprobado</div>
                                </div>

                                <div className="space-y-2">
                                  {bancoMateriales.map((row, idx) => {
                                    const isActiveRow = row.seleccionado || Number(row.cantidad) > 0;
                                    const isCustomRow = idx >= MATERIALES_BANCO_DEFAULT.length;
                                    return (
                                      <div
                                        key={`${row.material}-${idx}`}
                                        className={`grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-2.5 rounded-xl border transition-all ${
                                          isActiveRow
                                            ? 'bg-blue-50/40 border-blue-300 shadow-2xs'
                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                        }`}
                                      >
                                        {/* Columna 1: TIPO DE MATERIAL */}
                                        <div className="sm:col-span-5 flex items-center gap-2">
                                          <label className="flex-1 flex items-center gap-2.5 px-3 py-2 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200 rounded-xl cursor-pointer select-none transition">
                                            <input
                                              type="checkbox"
                                              checked={isActiveRow}
                                              onChange={(e) => {
                                                const checked = e.target.checked;
                                                const next = [...bancoMateriales];
                                                next[idx] = {
                                                  ...next[idx],
                                                  seleccionado: checked,
                                                  cantidad:
                                                    checked && (!next[idx].cantidad || Number(next[idx].cantidad) === 0)
                                                      ? 1
                                                      : checked
                                                        ? next[idx].cantidad
                                                        : '',
                                                  aprobado: checked ? next[idx].aprobado : false,
                                                };
                                                setBancoMateriales(next);
                                              }}
                                              className="h-4 w-4 rounded border-slate-300 text-[#0071e3] focus:ring-[#0071e3] shrink-0"
                                            />
                                            <span className="text-xs font-bold text-slate-900 leading-tight">
                                              {row.material}
                                            </span>
                                          </label>
                                          {isCustomRow && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setBancoMateriales(bancoMateriales.filter((_, i) => i !== idx))
                                              }
                                              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer shrink-0"
                                              title="Quitar material adicional"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                          )}
                                        </div>

                                        {/* Columna 2: CANTIDAD */}
                                        <div className="sm:col-span-2">
                                          <label className="block sm:hidden text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                                            Cantidad:
                                          </label>
                                          <input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={row.cantidad}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              const next = [...bancoMateriales];
                                              next[idx] = {
                                                ...next[idx],
                                                cantidad: val,
                                                seleccionado: Number(val) > 0,
                                              };
                                              setBancoMateriales(next);
                                            }}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-center text-slate-900 focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-blue-500/15 outline-none"
                                          />
                                        </div>

                                        {/* Columna 3: TIPO / ESPECIFICACIÓN */}
                                        <div className="sm:col-span-3">
                                          <label className="block sm:hidden text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                                            Tipo / Especificación:
                                          </label>
                                          <input
                                            type="text"
                                            placeholder="Ej. Gris 50kg, Calibre, N°..."
                                            value={row.tipo}
                                            onChange={(e) => {
                                              const next = [...bancoMateriales];
                                              next[idx] = {
                                                ...next[idx],
                                                tipo: e.target.value,
                                                seleccionado:
                                                  e.target.value.trim() !== '' ? true : next[idx].seleccionado,
                                              };
                                              setBancoMateriales(next);
                                            }}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-blue-500/15 outline-none"
                                          />
                                        </div>

                                        {/* Columna 4: APROBADO */}
                                        <div className="sm:col-span-2 flex items-center justify-center">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const next = [...bancoMateriales];
                                              const nextAprob = !next[idx].aprobado;
                                              next[idx] = {
                                                ...next[idx],
                                                aprobado: nextAprob,
                                                seleccionado: nextAprob ? true : next[idx].seleccionado,
                                                cantidad:
                                                  nextAprob &&
                                                  (!next[idx].cantidad || Number(next[idx].cantidad) === 0)
                                                    ? 1
                                                    : next[idx].cantidad,
                                              };
                                              setBancoMateriales(next);
                                            }}
                                            className={`w-full py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                              row.aprobado
                                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-2xs'
                                                : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                                            }`}
                                          >
                                            {row.aprobado ? (
                                              <>
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                                <span>Aprobado</span>
                                              </>
                                            ) : (
                                              <span>Pendiente</span>
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Panel Integrado en Frontend para Agregar Material Adicional (Sin window.prompt) */}
                              {mostrarAgregarMaterialInline && (
                                <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3 animate-in fade-in duration-150">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                                      <Plus className="h-3.5 w-3.5 text-[#0071e3]" />
                                      <span>Agregar material adicional al listado</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMostrarAgregarMaterialInline(false);
                                        setNuevoMaterialNombre('');
                                        setNuevoMaterialCantidad('1');
                                        setNuevoMaterialTipo('');
                                      }}
                                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                                    >
                                      Cerrar
                                    </button>
                                  </div>

                                  {/* Sugerencias rápidas con 1 clic */}
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">
                                      Sugerencias rápidas:
                                    </span>
                                    {[
                                      'Teja de Barro / Caballete',
                                      'Tubería y Accesorios PVC',
                                      'Puntillas y Alambre de Amarre',
                                      'Tanque Plástico de Reserva',
                                      'Puerta / Ventana Metálica',
                                      'Pintura / Impermeabilizante',
                                    ].map((sugMat) => (
                                      <button
                                        key={sugMat}
                                        type="button"
                                        onClick={() => setNuevoMaterialNombre(sugMat)}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                          nuevoMaterialNombre === sugMat
                                            ? 'bg-[#0071e3] text-white border-[#0071e3]'
                                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                                        }`}
                                      >
                                        + {sugMat}
                                      </button>
                                    ))}
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                                    <div className="sm:col-span-5">
                                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                        Nombre del Material *
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="Ej. Tubería PVC 4 pulgadas, Alambre..."
                                        value={nuevoMaterialNombre}
                                        onChange={(e) => setNuevoMaterialNombre(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:border-[#0071e3] outline-none"
                                      />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                        Cantidad
                                      </label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={nuevoMaterialCantidad}
                                        onChange={(e) => setNuevoMaterialCantidad(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-center text-slate-900 focus:border-[#0071e3] outline-none"
                                      />
                                    </div>
                                    <div className="sm:col-span-3">
                                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                        Tipo / Referencia
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="Opcional (ej. Calibre, medida...)"
                                        value={nuevoMaterialTipo}
                                        onChange={(e) => setNuevoMaterialTipo(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:border-[#0071e3] outline-none"
                                      />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!nuevoMaterialNombre.trim()) {
                                            showToast('Escribe o selecciona el nombre del material adicional.', 'warning');
                                            return;
                                          }
                                          setBancoMateriales([
                                            ...bancoMateriales,
                                            {
                                              material: nuevoMaterialNombre.trim(),
                                              seleccionado: true,
                                              cantidad: Math.max(1, Number(nuevoMaterialCantidad) || 1),
                                              tipo: nuevoMaterialTipo.trim(),
                                              aprobado: false,
                                            },
                                          ]);
                                          setNuevoMaterialNombre('');
                                          setNuevoMaterialCantidad('1');
                                          setNuevoMaterialTipo('');
                                          setMostrarAgregarMaterialInline(false);
                                          showToast('Material adicional agregado al listado.', 'success');
                                        }}
                                        className="w-full py-2 px-3 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                                      >
                                        Agregar
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Pie del formato: SOLICITADO POR + Botón Agregar otro material */}
                              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2.5">
                                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wide shrink-0">
                                    Solicitado por:
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={
                                      nombres || apellidos
                                        ? `${nombres} ${apellidos}`.trim()
                                        : user
                                          ? `${user.nombres || ''} ${user.apellidos || ''}`.trim()
                                          : 'Nombre de quien solicita los materiales'
                                    }
                                    value={solicitadoPorMateriales}
                                    onChange={(e) => setSolicitadoPorMateriales(e.target.value)}
                                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#0071e3] outline-none"
                                  />
                                </div>
                                {!mostrarAgregarMaterialInline && (
                                  <button
                                    type="button"
                                    onClick={() => setMostrarAgregarMaterialInline(true)}
                                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                                  >
                                    <Plus className="h-3.5 w-3.5 text-[#0071e3]" />
                                    <span>+ Agregar otro material</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Barra inferior de navegación / Envío de Evaluación del Inmueble */}
                        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setFormStepTab(3)}
                            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                          >
                            ← Volver (RUFE)
                          </button>
                          <div className="flex items-center gap-2 flex-wrap">
                            {HABILITAR_ENTREGA_AYUDAS_FORM_INICIAL ? (
                              <button
                                type="button"
                                onClick={() => setFormStepTab(5)}
                                className="px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <span>Continuar (Necesidades y ayudas)</span>
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                type="submit"
                                disabled={submitting}
                                className={`px-7 py-2.5 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                                  registroModo === 'VISITA_TECNICA'
                                    ? 'bg-indigo-600 hover:bg-indigo-700'
                                    : editingSolicitudId
                                      ? 'bg-amber-600 hover:bg-amber-700'
                                      : 'bg-[#0071e3] hover:bg-[#0077ED]'
                                }`}
                              >
                                {submitting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                                <span>
                                  {registroModo === 'VISITA_TECNICA'
                                    ? `Guardar Visita Técnica #${(reporteInicialSnapshot?.total_visitas_previas || 0) + 1} y Actualizar Evaluación`
                                    : editingSolicitudId
                                      ? `Guardar Cambios (${editingSolicitudCodigo || `SOL-${editingSolicitudId}`})`
                                      : 'Registrar Solicitud y Evaluación'}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* SUB-PESTAÑA 2 EN MODO ENTREGA: Historial de Ayudas Entregadas a la Solicitud Seleccionada */}
              {registroModo === 'ENTREGA_EXISTENTE' && entregaSubTabModo === 'HISTORIAL_ENTREGAS' && (
                <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-4 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-50 text-[#0071e3] rounded-xl">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                          Registro de Ayudas Entregadas a esta Solicitud ({entregasDeSolicitudSeleccionada.length})
                        </h3>
                        <p className="text-xs text-slate-500">
                          Historial de despachos para el expediente {selectedRequest?.codigo_solicitud || `SOL-${selectedRequest?.id_solicitud || selectedRequest?.id}`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEntregaSubTabModo('NUEVA_ENTREGA')}
                      className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>+ Crear Nueva Entrega</span>
                    </button>
                  </div>

                  {entregasDeSolicitudSeleccionada.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                      No hay entregas registradas previamente para este expediente. Haga clic en <strong>+ Crear Nueva Entrega</strong> para registrar la primera ayuda.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {entregasDeSolicitudSeleccionada.map((ent: any) => (
                        <div
                          key={ent.id_entrega}
                          className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                                {ent.codigo_entrega || `ENT-${ent.id_entrega}`}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                📅 {ent.fecha_entrega || ent.created_at || 'Fecha registrada'}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                                ✓ {ent.cantidad || 1} ítems
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-800">
                              Receptor: {ent.nombre_receptor || ent.titular_nombres || 'Beneficiario'} ({ent.documento_receptor || ent.documento})
                            </p>
                            <p className="text-xs text-slate-600 line-clamp-2">
                              Insumos entregados: <span className="font-medium text-slate-900">{ent.items_resumen || 'Sin resumen'}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEditarEntrega(ent)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition flex items-center gap-1 cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5 text-slate-600" />
                              <span>Editar Entrega</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: Entrega de ayudas (Nueva Entrega) */}
              {((formStepTab === 5 && registroModo !== 'ENTREGA_EXISTENTE') ||
                (registroModo === 'ENTREGA_EXISTENTE' && entregaSubTabModo === 'NUEVA_ENTREGA')) && (
                <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
                  <div className="bg-[#0071e3] text-white px-5 py-3.5 flex flex-wrap justify-between items-center gap-2">
                    <div>
                      <h2 className="font-bold text-xs sm:text-sm flex items-center gap-2">
                        <ListCheck className="h-4.5 w-4.5 text-white" />
                        <span>Entrega de ayudas</span>
                      </h2>
                    </div>
                    <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold text-white border border-white/30">
                      Total Contabilizado: {totalCantidadCalculada} ítems
                    </div>
                  </div>

                  {/* Fast Presets & Filters */}
                  <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 space-y-3">
                    {/* Banner Informativo de Ayudas Disponibles Según Perfil */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/90 border border-blue-200 flex items-start gap-3 shadow-2xs">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 border border-blue-200">
                        <Info className="h-4 w-4" />
                      </div>
                      <div className="text-xs space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-blue-950 font-extrabold text-sm">{perfilAyudaInfo.titulo}</strong>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-900 border border-blue-300">
                            Filtro Inteligente de Elegibilidad
                          </span>
                        </div>
                        <p className="text-blue-800 leading-relaxed font-medium">{perfilAyudaInfo.descripcion}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold text-slate-600 uppercase">
                        Paquetes Rápidos de Emergencia:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(PRESET_PACKAGES)
                          .filter(([key]) => perfilAyudaInfo.paquetesKeys.includes(key))
                          .map(([key, pkg]) => {
                          const active = isPaqueteActivo(key);
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => aplicarPaqueteRapido(key)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${active
                                ? 'bg-rose-600 text-white border border-rose-600 shadow-md ring-2 ring-rose-300 scale-[1.02]'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                              <span className={active ? 'text-amber-300 font-extrabold' : 'text-slate-500 font-extrabold'}>
                                {active ? '✓' : '+'}
                              </span>
                              <span>{pkg.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Filter Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={busquedaSubtipo}
                          onChange={(e) => setBusquedaSubtipo(e.target.value)}
                          placeholder="Buscar ayuda o material en el listado..."
                          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                        />
                      </div>

                      <div className="relative">
                        <Filter className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <select
                          value={categoriaFiltro}
                          onChange={(e) => setCategoriaFiltro(Number(e.target.value))}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none cursor-pointer"
                        >
                          <option value={0}>Todas las Categorías Permitidas ({categoriasDisponiblesParaAyuda.length})</option>
                          {categoriasDisponiblesParaAyuda.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Checklist Grid with Optional Item Quantities */}
                  <div className="p-4 sm:p-6 max-h-[520px] overflow-y-auto space-y-5">
                    {filteredTipologias.map((tipo) => {
                      if (!tipo || tipo.id === 10) return null; // Category 10 is managed above in Techo/Estructura panels
                      const IconComp = iconMap[tipo.icono] || Utensils;
                      return (
                        <div key={tipo.id} className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50 space-y-3">
                          <h3 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-200">
                            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                              <IconComp className="h-4 w-4" />
                            </div>
                            <span>{tipo.nombre}</span>
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {(() => {
                              const subtiposOrdenados = [...tipo.subtipos].sort((a, b) => {
                                const aChecked = selectedSubtipos.includes(a.nombre) ? 1 : 0;
                                const bChecked = selectedSubtipos.includes(b.nombre) ? 1 : 0;
                                return bChecked - aChecked;
                              });
                              return subtiposOrdenados.map((sub) => {
                                const isChecked = selectedSubtipos.includes(sub.nombre);
                                const cant = cantidadesSubtipos[sub.nombre] || 1;

                                return (
                                  <div
                                    key={sub.code}
                                    onClick={() => toggleSubtipo(sub.nombre)}
                                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer select-none transition-all ${isChecked
                                      ? 'border-rose-500 bg-rose-50/90 font-bold text-rose-950 shadow-xs'
                                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                                      }`}
                                  >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        readOnly
                                        className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 pointer-events-none shrink-0"
                                      />
                                      <span className="text-xs leading-snug truncate">{sub.nombre}</span>
                                    </div>

                                    {/* Quantity Controls when Checked */}
                                    {isChecked && (
                                      <div
                                        className="flex items-center gap-1 bg-white border border-rose-300 rounded-xl p-1 shrink-0 shadow-xs"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => handleCantidadSubtipoChange(sub.nombre, cant - 1)}
                                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-black cursor-pointer"
                                          title="Disminuir cantidad"
                                        >
                                          <Minus className="h-3 w-3" />
                                        </button>

                                        <input
                                          type="number"
                                          min={1}
                                          value={cant}
                                          onChange={(e) => handleCantidadSubtipoChange(sub.nombre, Number(e.target.value))}
                                          className="w-10 text-center text-xs font-black text-slate-900 outline-none bg-transparent"
                                        />

                                        <button
                                          type="button"
                                          onClick={() => handleCantidadSubtipoChange(sub.nombre, cant + 1)}
                                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-black cursor-pointer"
                                          title="Aumentar cantidad"
                                        >
                                          <Plus className="h-3 w-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Barra inferior Paso 5 */}
                  {registroModo !== 'ENTREGA_EXISTENTE' && (
                    <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setFormStepTab(4)}
                        className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        ← Anterior
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormStepTab(6)}
                        className="px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Siguiente (Observaciones y Evidencias)</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: Observaciones Generales y Evidencias Fotográficas Múltiples */}
              {((formStepTab === 6 && registroModo !== 'ENTREGA_EXISTENTE') ||
                (registroModo === 'ENTREGA_EXISTENTE' && entregaSubTabModo === 'NUEVA_ENTREGA')) && (
                <>
                  <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-4 sm:p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Observaciones Generales / Especificación del Caso
                      </label>
                      <textarea
                        rows={2}
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                      />
                    </div>

                    {/* Cantidad Total, Costo Estimado, Entidad Donante y Receptor cuando es Entrega Directa o Existente */}
                    {(registroModo === 'ENTREGA_DIRECTA' || registroModo === 'ENTREGA_EXISTENTE') && (
                      <div className="pt-3 border-t border-slate-200 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Entidad Donante / Origen de Fondos
                            </label>
                            <select
                              value={selectedEntidadDonanteId || ''}
                              onChange={(e) => setSelectedEntidadDonanteId(Number(e.target.value) || null)}
                              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="">-- No especificado (Fondos Municipales SAD) --</option>
                              {entidadesDonantes.map((ed) => (
                                <option key={ed.id_entidad_donante} value={ed.id_entidad_donante}>
                                  {ed.nombre_entidad} ({ed.tipo_entidad})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Costo Estimado de la Ayuda ($ COP)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="5000"
                              value={costoEstimadoAyuda}
                              onChange={(e) => setCostoEstimadoAyuda(e.target.value)}
                              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Cantidad Total de Kits / Materiales
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={cantidadAyuda}
                              onChange={(e) => setCantidadAyuda(Number(e.target.value))}
                              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Doc. Integrante Receptor
                            </label>
                            <input
                              type="text"
                              value={documentoReceptor}
                              onChange={(e) => setDocumentoReceptor(e.target.value)}
                              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Nombre Completo Receptor
                            </label>
                            <input
                              type="text"
                              value={nombreReceptor}
                              onChange={(e) => setNombreReceptor(e.target.value)}
                              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Evidencias Fotográficas Múltiples (Disponible para Solicitudes y Entregas - Hasta 6 Fotos) */}
                    <div className="pt-4 border-t border-slate-200 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <label className="block text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                            <Camera className="h-4 w-4 text-rose-600" />
                            {registroModo === 'SOLICITUD_SOLO'
                              ? 'Evidencias Fotográficas de la Solicitud (Hasta 6 Fotos)'
                              : 'Evidencias Fotográficas de la Entrega de Ayuda (Hasta 6 Fotos)'}
                          </label>
                        </div>
                        <label
                          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-extrabold shadow-2xs transition-colors ${fotosEntrega.length >= 6
                            ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 cursor-pointer'
                            }`}
                        >
                          <Camera className="h-4 w-4 text-rose-600" />
                          <span>+ Adjuntar / Tomar Fotos ({fotosEntrega.length}/6)</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={fotosEntrega.length >= 6}
                            onChange={handleMultiplePhotoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Thumbnail Grid for Multiple Photos */}
                      {fotosEntrega.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <span className="text-xs font-bold text-slate-700">
                            {fotosEntrega.length} / 6 foto(s) adjuntada(s):
                          </span>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                            {fotosEntrega.map((foto, idx) => (
                              <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-300 aspect-square shadow-xs">
                                <img src={foto} alt={`Evidencia ${idx + 1}`} className="h-full w-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removePhoto(idx)}
                                  className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-lg opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
                                  title="Eliminar foto"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    {registroModo !== 'ENTREGA_EXISTENTE' ? (
                      <button
                        type="button"
                        onClick={() => setFormStepTab(5)}
                        className="px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-xs font-semibold transition cursor-pointer"
                      >
                        ← Anterior
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={openLimpiarModal}
                        className="w-full sm:w-auto px-5 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                        title="Limpiar formulario o secciones"
                      >
                        <RotateCcw className="h-4 w-4 text-rose-600" />
                        <span>Limpiar Formulario</span>
                      </button>

                      {editingSolicitudId && (
                        <button
                          type="button"
                          onClick={resetFormState}
                          className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <X className="h-4 w-4 text-rose-600" />
                          <span>Cancelar Edición</span>
                        </button>
                      )}

                      <button
                        type="submit"
                        disabled={submitting}
                        className={`w-full sm:w-auto px-8 py-3.5 text-white rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${editingSolicitudId ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-[#0071e3] hover:bg-[#0077ED]'
                          }`}
                      >
                        {submitting ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5" />
                            <span>
                              {editingSolicitudId
                                ? `Guardar Cambios en Solicitud ${editingSolicitudCodigo || ''}`
                                : registroModo === 'SOLICITUD_SOLO'
                                  ? 'Registrar Solicitud'
                                  : registroModo === 'ENTREGA_DIRECTA'
                                    ? 'Registrar Entrega Inmediata'
                                    : 'Completar y Atender Solicitud'}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </form>
          )}

          {/* ======================= TAB 2: MAPA OPERATIVO ======================= */}
          {activeTab === 'mapa' && (
            <div className="space-y-3">
              {/* Mobile View Toggle Bar (Only on Mobile) */}
              <div className="flex lg:hidden items-center bg-slate-200/90 p-1 rounded-2xl shadow-xs">
                <button
                  type="button"
                  onClick={() => setMobileMapTab('mapa')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${mobileMapTab === 'mapa'
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'text-slate-700 hover:text-slate-900'
                    }`}
                >
                  <Globe2 className="h-4 w-4" />
                  <span>Mapa Operativo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMobileMapTab('lista')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${mobileMapTab === 'lista'
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'text-slate-700 hover:text-slate-900'
                    }`}
                >
                  <List className="h-4 w-4" />
                  <span>Lista ({solicitudesFiltradasMapa.length})</span>
                </button>
              </div>

              {/* Filter Bar (Compact & Collapsible) */}
              <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-xs border border-slate-200 space-y-3 w-full min-w-0">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 w-full">
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={mapSearchQuery}
                      onChange={(e) => setMapSearchQuery(e.target.value)}
                      placeholder="Buscar por cédula, nombre, sector o SOL-ID..."
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-800 min-w-0"
                    />
                    {mapSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setMapSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                    {/* Quick Status Pill */}
                    <div className="grid grid-cols-3 sm:flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 gap-1 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setMapEstadoFilter('all')}
                        className={`px-2 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition text-center truncate cursor-pointer ${mapEstadoFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Todos ({todasSolicitudes.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMapEstadoFilter('pending')}
                        className={`px-2 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition text-center truncate cursor-pointer ${mapEstadoFilter === 'pending' ? 'bg-rose-600 text-white shadow-xs font-black' : 'text-rose-700 hover:bg-rose-50'}`}
                      >
                        Pendientes ({solicitudesPendientes.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMapEstadoFilter('completed')}
                        className={`px-2 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition text-center truncate cursor-pointer ${mapEstadoFilter === 'completed' ? 'bg-emerald-600 text-white shadow-xs font-black' : 'text-emerald-700 hover:bg-emerald-50'}`}
                      >
                        Atendidas
                      </button>
                    </div>

                    {/* Filter Controls & Fullscreen */}
                    <div className="grid grid-cols-3 sm:flex items-center gap-1.5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
                        className={`px-2 sm:px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition cursor-pointer border ${isAdvancedFiltersOpen || (isHousingDamageFilterActive || isRoofDamageFilterActive || mapZoneFilter !== 'all' || selectedSubtipologiaCodes.length > 0)
                          ? 'bg-blue-50 border-blue-300 text-blue-800'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5 text-blue-700 shrink-0" />
                        <span className="truncate">Filtros</span>
                        {(isHousingDamageFilterActive || isRoofDamageFilterActive || mapZoneFilter !== 'all' || selectedSubtipologiaCodes.length > 0) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0"></span>
                        )}
                        {isAdvancedFiltersOpen ? <ChevronUp className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          resetAllMapFilters();
                          showToast('Filtros del mapa restablecidos.', 'success');
                        }}
                        className="px-2 sm:px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                        title="Limpiar filtros"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                        <span className="truncate">Limpiar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsMapFullScreen(true)}
                        className="px-2 sm:px-3 py-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                        title="Maximizar pantalla"
                      >
                        <Maximize2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Maximizar</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collapsible Advanced Filters Panel */}
                {isAdvancedFiltersOpen && (
                  <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Zona Geográfica:</label>
                        <select
                          value={mapZoneFilter}
                          onChange={(e) => setMapZoneFilter(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
                        >
                          <option value="all">Todas las Zonas (Urbana + Rural)</option>
                          <option value="urbano">🏢 Solo Zona Urbana</option>
                          <option value="rural">🏡 Solo Zona Rural</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Catálogo de Requerimientos:</label>
                        <button
                          type="button"
                          onClick={() => setIsMultiFilterModalOpen(true)}
                          className="w-full px-3 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl text-xs font-bold text-blue-900 flex items-center justify-between transition cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Filter className="h-3.5 w-3.5 text-blue-700 shrink-0" />
                            <span>Requerimientos ({selectedSubtipologiaCodes.length})</span>
                          </span>
                          <ChevronRight className="h-4 w-4 text-blue-500 shrink-0" />
                        </button>
                      </div>

                      <div className="sm:col-span-2 md:col-span-1 flex items-end">
                        <div className="w-full bg-slate-50 p-2 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                          <span className="text-slate-600 font-bold text-[11px]">Resultados en mapa:</span>
                          <strong className="text-blue-900 font-black font-mono">{solicitudesFiltradasMapa.length} de {todasSolicitudes.length}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Multi-Damage Severity Pills */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
                      {/* Filtro Daño Vivienda */}
                      <div className="flex items-center gap-1.5 flex-wrap bg-slate-50/90 border border-slate-200 p-1.5 rounded-2xl">
                        <button
                          type="button"
                          onClick={() => {
                            setIsHousingDamageFilterActive(!isHousingDamageFilterActive);
                            setMapCurrentPage(1);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${isHousingDamageFilterActive
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                          <Home className="h-3.5 w-3.5" />
                          <span>Daño Vivienda:</span>
                        </button>

                        {['Colapso Total', 'Grave', 'Leve'].map((lvl) => {
                          const isSelected = selectedDamageLevels.includes(lvl);
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => {
                                setIsHousingDamageFilterActive(true);
                                setMapCurrentPage(1);
                                setSelectedDamageLevels((prev) =>
                                  prev.includes(lvl)
                                    ? prev.length === 1 ? prev : prev.filter((x) => x !== lvl)
                                    : [...prev, lvl]
                                );
                              }}
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${isSelected && isHousingDamageFilterActive
                                ? lvl === 'Colapso Total'
                                  ? 'bg-rose-500 text-white border-rose-600 font-black'
                                  : lvl === 'Grave'
                                    ? 'bg-amber-500 text-slate-950 border-amber-600 font-black'
                                    : 'bg-slate-700 text-white border-slate-800 font-black'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                              <span>{lvl === 'Colapso Total' ? '🔴' : lvl === 'Grave' ? '🟡' : '⚪'}</span>
                              <span>{lvl}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Filtro Daño Techo */}
                      <div className="flex items-center gap-1.5 flex-wrap bg-slate-50/90 border border-slate-200 p-1.5 rounded-2xl">
                        <button
                          type="button"
                          onClick={() => {
                            setIsRoofDamageFilterActive(!isRoofDamageFilterActive);
                            setMapCurrentPage(1);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${isRoofDamageFilterActive
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Daño Techo:</span>
                        </button>

                        {['Colapso Total', 'Grave', 'Leve'].map((lvl) => {
                          const isSelected = selectedRoofDamageLevels.includes(lvl);
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => {
                                setIsRoofDamageFilterActive(true);
                                setMapCurrentPage(1);
                                setSelectedRoofDamageLevels((prev) =>
                                  prev.includes(lvl)
                                    ? prev.length === 1 ? prev : prev.filter((x) => x !== lvl)
                                    : [...prev, lvl]
                                );
                              }}
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${isSelected && isRoofDamageFilterActive
                                ? lvl === 'Colapso Total'
                                  ? 'bg-rose-500 text-white border-rose-600 font-black'
                                  : lvl === 'Grave'
                                    ? 'bg-amber-500 text-slate-950 border-amber-600 font-black'
                                    : 'bg-slate-700 text-white border-slate-800 font-black'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                              <span>{lvl === 'Colapso Total' ? '🔴' : lvl === 'Grave' ? '🟡' : '⚪'}</span>
                              <span>{lvl}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* TWO COLUMN GRID: Left = Solicitudes List, Right = Map (Responsive & Mobile-First) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* LEFT COLUMN: Solicitudes List (Hidden on mobile if map tab is active) */}
                <div className={`${mobileMapTab === 'lista' ? 'flex' : 'hidden'} lg:flex lg:col-span-5 bg-white rounded-3xl p-4 shadow-xs border border-slate-200 flex-col h-[620px]`}>
                  {/* List Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <List className="h-4 w-4 text-blue-700" />
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                        Solicitudes ({solicitudesFiltradasMapa.length})
                      </h3>
                    </div>
                    <div className="text-[11px] text-slate-500 font-bold">
                      Pág. {mapCurrentPage} / {totalPagesMap}
                    </div>
                  </div>

                  {/* Scrollable List Container */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {solicitudesFiltradasMapa.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100 p-4">
                        <p className="font-bold">No se encontraron solicitudes.</p>
                        <p className="text-[11px] mt-1 text-slate-400">Intenta ajustar los filtros de búsqueda, severidad o requerimientos.</p>
                      </div>
                    ) : (
                      solicitudesPaginadas.map((sol) => {
                        const isPending = sol.estado_codigo === 'pending';
                        return (
                          <div
                            key={sol.id_solicitud}
                            className={`p-3 rounded-2xl border transition-all space-y-2 cursor-pointer hover:shadow-sm ${getCardPastelStyle(sol)}`}
                            onClick={() => {
                              if (sol.latitud && sol.longitud) {
                                setLatitud(sol.latitud);
                                setLongitud(sol.longitud);
                              }
                              setSelectedMapPinSol(sol);
                              if (window.innerWidth < 1024) {
                                setMobileMapTab('mapa');
                              }
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[11px] font-black bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                                {sol.codigo_solicitud || `SOL-${sol.id_solicitud}`}
                              </span>
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${isPending
                                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  }`}
                              >
                                {isPending ? 'Pendiente' : '✓ Atendida'}
                              </span>
                            </div>

                            <div className="text-xs">
                              <strong className="text-slate-900 block font-extrabold text-xs">
                                {sol.nombre_completo}
                              </strong>
                              <span className="text-slate-500 block text-[11px] font-mono">
                                Doc: {sol.documento}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-600 flex-wrap">
                              <span className="bg-white/80 px-2 py-0.5 rounded-lg border border-slate-200 font-bold">
                                📍 {sol.nombre_sector}
                              </span>
                              <span
                                className={`font-black text-[10px] px-2 py-0.5 rounded-md ${sol.afectacion_nivel === 'Colapso Total'
                                  ? 'bg-rose-600 text-white'
                                  : sol.afectacion_nivel === 'Grave'
                                    ? 'bg-amber-500 text-slate-950 font-black'
                                    : sol.afectacion_nivel === 'Leve'
                                      ? 'bg-slate-700 text-white'
                                      : 'bg-slate-200 text-slate-700 font-bold'
                                  }`}
                              >
                                Daño: {sol.afectacion_nivel || 'Sin Evaluar'}
                              </span>
                            </div>

                            {sol.descripcion_solicitud && (
                              <p className="text-[11px] text-slate-600 line-clamp-2 bg-white/70 p-1.5 rounded-xl border border-slate-200/60">
                                {sol.descripcion_solicitud}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  setDetailModalInitialTab('censo');
                                  setDetailedRequestId(sol.id_solicitud);
                                  setIsDetailModalOpen(true);
                                }}
                                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-[11px] py-1.5 px-2 rounded-xl shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5 text-amber-300" />
                                <span>Detalle</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleIniciarVisitaTecnica(sol)}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] py-1.5 px-2 rounded-xl shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                                title="Realizar visita técnica y re-evaluar la vivienda"
                              >
                                <ClipboardCheck className="h-3.5 w-3.5" />
                                <span>Visita Técnica ({sol.total_visitas ?? (sol.visita ? 1 : 0)})</span>
                              </button>

                              {!isCensoOnlyUser && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRequest(sol);
                                    setRegistroModo('ENTREGA_EXISTENTE');
                                    setActiveTab('formulario');
                                    setFormStepTab(5);
                                    showToast(`Solicitud ${sol.codigo_solicitud || `SOL-${sol.id_solicitud}`} cargada para atender y crear entrega.`, 'success');
                                  }}
                                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] py-1.5 px-2 rounded-xl shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Package className="h-3.5 w-3.5" />
                                  <span>Atender</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleEditarSolicitud(sol)}
                                className="p-1.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center"
                                title="Editar Solicitud"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSolicitudToDelete(sol);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="p-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold transition cursor-pointer"
                                title="Eliminar Solicitud"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Left Column Pagination Bar */}
                  {totalPagesMap > 1 && (
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 shrink-0 text-xs">
                      <button
                        type="button"
                        disabled={mapCurrentPage === 1}
                        onClick={() => setMapCurrentPage((p) => Math.max(p - 1, 1))}
                        className="px-3 py-1 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        ◀ Ant
                      </button>
                      <span className="text-[11px] text-slate-500 font-bold">
                        {mapCurrentPage} de {totalPagesMap}
                      </span>
                      <button
                        type="button"
                        disabled={mapCurrentPage >= totalPagesMap}
                        onClick={() => setMapCurrentPage((p) => Math.min(p + 1, totalPagesMap))}
                        className="px-3 py-1 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        Sig ▶
                      </button>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: Interactive Leaflet Map (Hero on Mobile) */}
                <div className={isMapFullScreen ? 'fixed inset-0 z-[1000] bg-slate-950 flex flex-col h-screen w-screen p-2 sm:p-3.5 shadow-2xl animate-in fade-in duration-200' : `${mobileMapTab === 'mapa' ? 'flex' : 'hidden'} lg:flex lg:col-span-7 bg-white rounded-3xl p-2.5 sm:p-3 shadow-xs border border-slate-200 h-[68vh] min-h-[460px] lg:h-[620px] flex flex-col`}>
                  {isMapFullScreen && (
                    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 text-white rounded-2xl p-2.5 sm:p-3 mb-2 shadow-2xl space-y-2.5 shrink-0 animate-in slide-in-from-top-2 duration-150">
                      {/* Row 1: Title, Status Pills, Mode Switcher, Filter Toggle, Clean, Exit */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                            <Globe2 className="h-3.5 w-3.5 text-blue-400" />
                            <span>Mapa Operativo</span>
                          </span>
                          <span className="text-[11px] font-extrabold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
                            {solicitudesFiltradasMapa.length} de {todasSolicitudes.length} solicitudes
                          </span>
                        </div>

                        {/* Control Buttons in Fullscreen */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Status Filter Buttons */}
                          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-0.5 gap-0.5">
                            <button
                              type="button"
                              onClick={() => setMapEstadoFilter('all')}
                              className={`px-2 sm:px-2.5 py-1 text-[11px] font-black rounded-lg transition cursor-pointer ${mapEstadoFilter === 'all' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                              Todos
                            </button>
                            <button
                              type="button"
                              onClick={() => setMapEstadoFilter('pending')}
                              className={`px-2 sm:px-2.5 py-1 text-[11px] font-black rounded-lg transition cursor-pointer ${mapEstadoFilter === 'pending' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-400 hover:text-white'
                                }`}
                            >
                              Pendientes
                            </button>
                            <button
                              type="button"
                              onClick={() => setMapEstadoFilter('completed')}
                              className={`px-2 sm:px-2.5 py-1 text-[11px] font-black rounded-lg transition cursor-pointer ${mapEstadoFilter === 'completed' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-400 hover:text-white'
                                }`}
                            >
                              Atendidas
                            </button>
                          </div>

                          {/* Mode Switcher */}
                          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-0.5 gap-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setMapDisplayMode('sectores');
                                showToast('Modo: Conteo por Sector', 'success');
                              }}
                              className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 transition cursor-pointer ${mapDisplayMode === 'sectores' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                                }`}
                              title="Conteo por Sector"
                            >
                              <Building2 className="h-3 w-3" />
                              <span className="hidden sm:inline">Sectores</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMapDisplayMode('individual');
                                showToast('Modo: Puntos Individuales', 'success');
                              }}
                              className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 transition cursor-pointer ${mapDisplayMode === 'individual' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                                }`}
                              title="Puntos Individuales"
                            >
                              <MapPin className="h-3 w-3" />
                              <span className="hidden sm:inline">Puntos</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMapDisplayMode('ambos');
                                showToast('Modo: Ambos (Sectores e Individuales)', 'success');
                              }}
                              className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 transition cursor-pointer ${mapDisplayMode === 'ambos' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                                }`}
                              title="Ambos"
                            >
                              <Globe2 className="h-3 w-3" />
                              <span className="hidden sm:inline">Ambos</span>
                            </button>
                          </div>

                          {/* Toggle Advanced Filters Button */}
                          <button
                            type="button"
                            onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer border ${isAdvancedFiltersOpen || (isHousingDamageFilterActive || isRoofDamageFilterActive || mapZoneFilter !== 'all' || selectedSubtipologiaCodes.length > 0)
                              ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                              }`}
                            title="Filtros del mapa"
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5 text-blue-300" />
                            <span>Filtros</span>
                            {(isHousingDamageFilterActive || isRoofDamageFilterActive || mapZoneFilter !== 'all' || selectedSubtipologiaCodes.length > 0) && (
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                            )}
                            {isAdvancedFiltersOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>

                          {/* Reset / Clean filters button */}
                          <button
                            type="button"
                            onClick={() => {
                              resetAllMapFilters();
                              showToast('Filtros del mapa restablecidos.', 'success');
                            }}
                            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Restablecer y limpiar todos los filtros del mapa"
                          >
                            <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                            <span>Limpiar</span>
                          </button>

                          {/* Exit Fullscreen Button */}
                          <button
                            type="button"
                            onClick={() => setIsMapFullScreen(false)}
                            className="px-3 py-1 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                            title="Salir de Pantalla Completa"
                          >
                            <Minimize2 className="h-3.5 w-3.5" />
                            <span>Salir</span>
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Search input & Fullscreen Collapsible Filters */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-slate-800/80">
                        <div className="relative flex-1 min-w-0">
                          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={mapSearchQuery}
                            onChange={(e) => setMapSearchQuery(e.target.value)}
                            placeholder="Buscar por cédula, nombre, sector o SOL-ID..."
                            className="w-full pl-8 pr-7 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                          {mapSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setMapSearchQuery('')}
                              className="absolute right-2 top-2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>

                        {/* Quick Dropdown & Requerimientos if Filter drawer open */}
                        {isAdvancedFiltersOpen && (
                          <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
                            {/* Zone Filter */}
                            <select
                              value={mapZoneFilter}
                              onChange={(e) => setMapZoneFilter(e.target.value as any)}
                              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none cursor-pointer"
                            >
                              <option value="all">Todas las Zonas</option>
                              <option value="urbano">🏢 Solo Zona Urbana</option>
                              <option value="rural">🏡 Solo Zona Rural</option>
                            </select>

                            {/* Requerimientos Button */}
                            <button
                              type="button"
                              onClick={() => setIsMultiFilterModalOpen(true)}
                              className="px-2.5 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Filter className="h-3 w-3 text-blue-400" />
                              <span>Insumos ({selectedSubtipologiaCodes.length})</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Row 3: Severity Pills in Fullscreen (if filters open) */}
                      {isAdvancedFiltersOpen && (
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs animate-in fade-in duration-150">
                          {/* Daño Vivienda Pills */}
                          <div className="flex items-center gap-1 flex-wrap bg-slate-800/80 border border-slate-700 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => {
                                setIsHousingDamageFilterActive(!isHousingDamageFilterActive);
                                setMapCurrentPage(1);
                              }}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${isHousingDamageFilterActive ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                              <Home className="h-3 w-3" />
                              <span>Daño Vivienda:</span>
                            </button>
                            {['Colapso Total', 'Grave', 'Leve'].map((lvl) => {
                              const isSelected = selectedDamageLevels.includes(lvl);
                              return (
                                <button
                                  key={lvl}
                                  type="button"
                                  onClick={() => {
                                    setIsHousingDamageFilterActive(true);
                                    setMapCurrentPage(1);
                                    setSelectedDamageLevels((prev) =>
                                      prev.includes(lvl) ? (prev.length === 1 ? prev : prev.filter((x) => x !== lvl)) : [...prev, lvl]
                                    );
                                  }}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition cursor-pointer flex items-center gap-1 ${isSelected && isHousingDamageFilterActive
                                    ? lvl === 'Colapso Total'
                                      ? 'bg-rose-600 text-white border-rose-500'
                                      : lvl === 'Grave'
                                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                                        : 'bg-slate-700 text-white border-slate-600'
                                    : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:text-white'
                                    }`}
                                >
                                  <span>{lvl === 'Colapso Total' ? '🔴' : lvl === 'Grave' ? '🟡' : '⚪'}</span>
                                  <span>{lvl}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Daño Techo Pills */}
                          <div className="flex items-center gap-1 flex-wrap bg-slate-800/80 border border-slate-700 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => {
                                setIsRoofDamageFilterActive(!isRoofDamageFilterActive);
                                setMapCurrentPage(1);
                              }}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${isRoofDamageFilterActive ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                              <AlertTriangle className="h-3 w-3" />
                              <span>Daño Techo:</span>
                            </button>
                            {['Colapso Total', 'Grave', 'Leve'].map((lvl) => {
                              const isSelected = selectedRoofDamageLevels.includes(lvl);
                              return (
                                <button
                                  key={lvl}
                                  type="button"
                                  onClick={() => {
                                    setIsRoofDamageFilterActive(true);
                                    setMapCurrentPage(1);
                                    setSelectedRoofDamageLevels((prev) =>
                                      prev.includes(lvl) ? (prev.length === 1 ? prev : prev.filter((x) => x !== lvl)) : [...prev, lvl]
                                    );
                                  }}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition cursor-pointer flex items-center gap-1 ${isSelected && isRoofDamageFilterActive
                                    ? lvl === 'Colapso Total'
                                      ? 'bg-rose-600 text-white border-rose-500'
                                      : lvl === 'Grave'
                                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                                        : 'bg-slate-700 text-white border-slate-600'
                                    : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:text-white'
                                    }`}
                                >
                                  <span>{lvl === 'Colapso Total' ? '🔴' : lvl === 'Grave' ? '🟡' : '⚪'}</span>
                                  <span>{lvl}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex-1 w-full h-full min-h-[350px] rounded-2xl overflow-hidden relative">
                    {/* Floating Direct Map Switcher (Modern Glassmorphism - when NOT fullscreen) */}
                    {!isMapFullScreen && (
                      <div className="absolute top-3 right-3 z-[999] bg-slate-950/85 backdrop-blur-md p-1 rounded-2xl shadow-xl border border-slate-700/70 flex items-center gap-1 scale-90 sm:scale-100 origin-top-right">
                        <button
                          type="button"
                          onClick={() => {
                            setMapDisplayMode('sectores');
                            showToast('Modo: Conteo por Sector', 'success');
                          }}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${mapDisplayMode === 'sectores'
                            ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                            }`}
                          title="Mostrar conteo agrupado por sector"
                        >
                          <Building2 className="h-3.5 w-3.5" />
                          <span>Sectores</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMapDisplayMode('individual');
                            showToast('Modo: Puntos Individuales', 'success');
                          }}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${mapDisplayMode === 'individual'
                            ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                            }`}
                          title="Mostrar puntos exactos individuales"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          <span>Puntos</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMapDisplayMode('ambos');
                            showToast('Modo: Ambos (Sectores e Individuales)', 'success');
                          }}
                          className={`px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${mapDisplayMode === 'ambos'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                            }`}
                          title="Mostrar ambos"
                        >
                          <Globe2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Ambos</span>
                        </button>
                      </div>
                    )}

                    <MapContainer
                      center={[5.239971, -75.782206]}
                      zoom={14}
                      scrollWheelZoom={true}
                      preferCanvas={true}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <EmergencyMapController isFullScreen={isMapFullScreen} />
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      {/* 1. Sector Summary Markers with Precomputed Traffic Light Severity Average & Counts */}
                      {(mapDisplayMode === 'sectores' || mapDisplayMode === 'ambos') &&
                        sectorAggregatedData.map((sec, idx) => (
                          <Marker
                            key={`sector-${sec.id_sector ?? idx}`}
                            position={[sec.latitude!, sec.longitude!]}
                            title={`Sector: ${sec.name} (${sec.requestCount} solicitudes)`}
                            icon={getSectorSummaryMarkerIcon(sec.requestCount, sec.badgeColor, false)}
                            eventHandlers={{
                              click: () => {
                                if (sec.id_sector) {
                                  setSelectedSectorIds([sec.id_sector]);
                                  showToast(`Filtrando mapa y lista por ${sec.name} (${sec.requestCount} solicitudes)`, 'success');
                                }
                              },
                            }}
                          >
                            <Tooltip
                              direction="top"
                              offset={[0, -20]}
                              opacity={1}
                              className="sector-hover-tooltip"
                            >
                              <div className="bg-slate-950 text-white px-2.5 py-1 rounded-xl text-xs font-black shadow-xl flex items-center gap-1.5 border border-slate-700">
                                <span className={`w-2 h-2 rounded-full ${sec.badgeColor === 'red' ? 'bg-rose-500 animate-pulse' : sec.badgeColor === 'yellow' ? 'bg-amber-500 animate-pulse' : sec.badgeColor === 'green' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                <span>{sec.name}</span>
                                <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                                  {sec.requestCount} sol.
                                </span>
                              </div>
                            </Tooltip>

                            <Popup className="sector-list-popup">
                              <div className="bg-white p-3 space-y-2 max-w-[290px] max-h-[320px] overflow-y-auto text-slate-900 rounded-2xl">
                                <div className="border-b border-slate-200 pb-1.5 flex justify-between items-center">
                                  <strong className="text-xs font-black uppercase text-slate-900">{sec.name}</strong>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${sec.badgeColor === 'red' ? 'bg-rose-50 text-rose-700 border-rose-200' : sec.badgeColor === 'yellow' ? 'bg-amber-50 text-amber-800 border-amber-200' : sec.badgeColor === 'green' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                    {sec.requestCount} solicitudes
                                  </span>
                                </div>

                                <div className="space-y-1.5">
                                  {sec.sectorRequests.slice(0, 6).map((sol) => (
                                    <div
                                      key={sol.id_solicitud}
                                      className="p-2 rounded-xl border border-slate-100 bg-slate-50/70 text-xs space-y-1"
                                    >
                                      <div className="flex justify-between items-center">
                                        <span className="font-mono text-[10px] font-black text-slate-900">
                                          {sol.codigo_solicitud || `SOL-${sol.id_solicitud}`}
                                        </span>
                                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${sol.estado_codigo === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                          {sol.estado_codigo === 'completed' ? 'Atendida' : 'Pendiente'}
                                        </span>
                                      </div>
                                      <p className="font-bold text-slate-800 text-[11px] truncate">{sol.nombre_completo}</p>

                                      <div className="flex items-center gap-1 pt-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setDetailedRequestId(sol.id_solicitud);
                                            setIsDetailModalOpen(true);
                                          }}
                                          className="flex-1 text-center text-[10px] font-black text-blue-700 hover:text-blue-900 bg-blue-50 py-1 rounded-lg cursor-pointer flex items-center justify-center gap-1"
                                        >
                                          <Eye className="h-3 w-3" />
                                          <span>Ver</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleEditarSolicitud(sol)}
                                          className="flex-1 text-center text-[10px] font-black text-amber-950 hover:bg-amber-600 bg-amber-500 py-1 rounded-lg cursor-pointer flex items-center justify-center gap-1"
                                        >
                                          <Pencil className="h-3 w-3" />
                                          <span>Editar</span>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        ))}

                      {/* 2. Individual Solicitud Markers with Instant Cached Icons & On-Demand Popups */}
                      {(mapDisplayMode === 'individual' || mapDisplayMode === 'ambos') &&
                        solicitudesFiltradasMapa.map((sol) => {
                          if (!sol.latitud || !sol.longitud) return null;
                          const isPending = sol.estado_codigo === 'pending';
                          const isSelected = selectedMapPinSol?.id_solicitud === sol.id_solicitud;
                          const icon = getSectorMarkerIcon(
                            sol.afectacion_nivel || 'Ninguno',
                            !isPending
                          );

                          return (
                            <Marker
                              key={sol.id_solicitud}
                              position={[sol.latitud, sol.longitud]}
                              icon={icon}
                              eventHandlers={{
                                click: () => {
                                  setSelectedMapPinSol(sol);
                                },
                              }}
                            >
                              <Tooltip
                                direction="top"
                                offset={[0, -20]}
                                opacity={1}
                                className="sector-hover-tooltip"
                              >
                                <div className="bg-slate-950 text-white px-2.5 py-1 rounded-xl text-xs font-black shadow-xl flex items-center gap-1.5 border border-slate-700">
                                  <span className={`w-2 h-2 rounded-full ${isPending ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                                  <span>{sol.codigo_solicitud || `SOL-${sol.id_solicitud}`}</span>
                                  <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                                    {sol.nombre_sector}
                                  </span>
                                </div>
                              </Tooltip>

                              {isSelected && (
                                <Popup className="sector-list-popup" autoPan={false}>
                                  <div className="bg-white p-3.5 space-y-2.5 max-w-[280px] rounded-2xl text-slate-900">
                                    {/* Popup Header */}
                                    <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                                      <span className="font-mono text-xs font-black bg-slate-900 text-white px-2.5 py-0.5 rounded-lg shadow-2xs">
                                        {sol.codigo_solicitud || `SOL-${sol.id_solicitud}`}
                                      </span>
                                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${isPending
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        }`}>
                                        {isPending ? 'Pendiente' : '✓ Atendida'}
                                      </span>
                                    </div>

                                    {/* Beneficiary & Sector Info */}
                                    <div className="text-xs space-y-1">
                                      <strong className="text-slate-900 block font-black text-xs">
                                        {sol.nombre_completo}
                                      </strong>
                                      <span className="text-slate-500 block text-[11px] font-mono">
                                        Doc: {sol.documento}
                                      </span>
                                      <div className="flex items-center gap-1 text-[11px] text-slate-600 pt-0.5">
                                        <span>📍 Sector: <strong className="text-slate-800">{sol.nombre_sector}</strong></span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-[11px] text-slate-700 pt-0.5">
                                        <span className="text-slate-500">Daño:</span>
                                        <span className={`font-black text-[10px] px-2 py-0.5 rounded-md ${sol.afectacion_nivel === 'Colapso Total'
                                          ? 'bg-rose-600 text-white'
                                          : sol.afectacion_nivel === 'Grave'
                                            ? 'bg-amber-500 text-slate-950 font-black'
                                            : sol.afectacion_nivel === 'Leve'
                                              ? 'bg-slate-700 text-white'
                                              : 'bg-slate-100 text-slate-700 font-bold border border-slate-200'
                                          }`}>
                                          {sol.afectacion_nivel || 'Sin Evaluar'}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDetailModalInitialTab('censo');
                                          setDetailedRequestId(sol.id_solicitud);
                                          setIsDetailModalOpen(true);
                                        }}
                                        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-[11px] py-1.5 px-3 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                      >
                                        <Eye className="h-3.5 w-3.5 text-amber-300" />
                                        <span>Ver Expediente Completo</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleIniciarVisitaTecnica(sol)}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] py-1.5 px-3 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                      >
                                        <ClipboardCheck className="h-3.5 w-3.5" />
                                        <span>Visita Técnica — Re-evaluar ({sol.total_visitas ?? (sol.visita ? 1 : 0)})</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleEditarSolicitud(sol)}
                                        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[11px] py-1.5 px-3 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                        <span>Editar esta Solicitud</span>
                                      </button>

                                      {!isCensoOnlyUser && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedRequest(sol);
                                            setRegistroModo('ENTREGA_EXISTENTE');
                                            setActiveTab('formulario');
                                            setFormStepTab(5);
                                            showToast(`Solicitud ${sol.codigo_solicitud || `SOL-${sol.id_solicitud}`} cargada para atender en formulario.`, 'success');
                                          }}
                                          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] py-1.5 px-3 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
                                        >
                                          <Package className="h-3.5 w-3.5" />
                                          <span>Atender (Crear Entrega)</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </Popup>
                              )}
                            </Marker>
                          );
                        })}
                    </MapContainer>

                    {/* Mobile Floating Bottom Sheet Card for Selected Marker / Quick Deliveries */}
                    {selectedMapPinSol ? (
                      <div className="lg:hidden absolute bottom-3 left-3 right-3 z-[999] bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-blue-200 space-y-2.5 animate-in slide-in-from-bottom-3 duration-200">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black bg-blue-700 text-white px-2.5 py-0.5 rounded-lg shadow-2xs">
                              {selectedMapPinSol.codigo_solicitud || `SOL-${selectedMapPinSol.id_solicitud}`}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${selectedMapPinSol.estado_codigo === 'pending'
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              }`}>
                              {selectedMapPinSol.estado_codigo === 'pending' ? 'Pendiente' : '✓ Atendida'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedMapPinSol(null)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <strong className="text-slate-900 block font-extrabold text-xs truncate">
                              {selectedMapPinSol.nombre_completo}
                            </strong>
                            <span className="text-slate-500 block text-[11px] font-mono">
                              Doc: {selectedMapPinSol.documento}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-bold text-slate-700 block truncate">📍 {selectedMapPinSol.nombre_sector}</span>
                            <span className={`inline-block font-black text-[10px] px-2 py-0.5 rounded mt-0.5 ${selectedMapPinSol.afectacion_nivel === 'Colapso Total'
                              ? 'bg-rose-100 text-rose-800'
                              : selectedMapPinSol.afectacion_nivel === 'Grave'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-100 text-emerald-800'
                              }`}>
                              {selectedMapPinSol.afectacion_nivel || 'Leve'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setDetailedRequestId(selectedMapPinSol.id_solicitud);
                              setIsDetailModalOpen(true);
                            }}
                            className="flex-1 bg-slate-100 hover:bg-blue-50 text-blue-800 font-extrabold text-xs py-2 px-3 rounded-xl border border-blue-200 transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 text-blue-600" />
                            <span>Ver Detalle</span>
                          </button>

                          {!isCensoOnlyUser && selectedMapPinSol.estado_codigo === 'pending' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRequest(selectedMapPinSol);
                                setRegistroModo('ENTREGA_EXISTENTE');
                                setActiveTab('formulario');
                                showToast(`Solicitud ${selectedMapPinSol.codigo_solicitud || `SOL-${selectedMapPinSol.id_solicitud}`} cargada para atender en formulario.`, 'success');
                              }}
                              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2 px-3 rounded-xl shadow-sm transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Package className="h-3.5 w-3.5" />
                              <span>Atender Entrega</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Floating Quick Deliveries Pill on Mobile */
                      !isMapFullScreen && (
                        <div className="lg:hidden absolute bottom-3 left-3 right-3 z-[990] flex justify-center pointer-events-none">
                          <button
                            type="button"
                            onClick={() => setMobileMapTab('lista')}
                            className="pointer-events-auto bg-slate-900/90 hover:bg-slate-950 backdrop-blur-md text-white text-xs font-black px-4 py-2.5 rounded-full shadow-2xl border border-slate-700 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
                          >
                            <Package className="h-4 w-4 text-amber-400" />
                            <span>{solicitudesPendientes.length} pendientes de entrega</span>
                            <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                              Ver lista 📋
                            </span>
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================= TAB 3: HISTORIAL Y LISTADO DE ENTREGAS ======================= */}
          {activeTab === 'historial' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                    <Truck className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                      <span>Listado y Trazabilidad de Entregas de Ayudas</span>
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {todasEntregas.length} entregas registradas
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Búsqueda integral de entregas por código ENT-, solicitud SOL-, beneficiario, sector o insumos entregados.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled
                    className="px-3.5 py-2 rounded-xl bg-slate-200 text-slate-400 border border-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-not-allowed"
                    title="Creación directa deshabilitada temporalmente. Gestione entregas directamente desde la solicitud vinculada o el listado general."
                  >
                    <Plus className="h-4 w-4" />
                    <span>Nueva Entrega</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fetchSolicitudes()}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                    title="Actualizar listado de entregas"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Filtros de Búsqueda de Entregas */}
              <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-3">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por código entrega (ENT-), código solicitud (SOL-), cédula o nombre, insumos o sector..."
                      value={historialSearchQuery}
                      onChange={(e) => setHistorialSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none text-[#1D1D1F] transition"
                    />
                    {historialSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setHistorialSearchQuery('')}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                    <select
                      value={selectedEventoId || 'ALL'}
                      onChange={(e) => {
                        const val = e.target.value === 'ALL' ? null : Number(e.target.value);
                        setSelectedEventoId(val);
                      }}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#1D1D1F] outline-none cursor-pointer"
                    >
                      <option value="ALL">Todos los Eventos</option>
                      {eventos.map((ev) => (
                        <option key={ev.id_evento} value={ev.id_evento}>
                          {ev.nombre_evento}
                        </option>
                      ))}
                    </select>

                    <select
                      value={historialSectorFiltro}
                      onChange={(e) => setHistorialSectorFiltro(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#1D1D1F] outline-none cursor-pointer"
                    >
                      <option value="ALL">Todos los Sectores / Veredas</option>
                      {sectores.map((sec) => (
                        <option key={sec.id_sector} value={sec.id_sector}>
                          {sec.nombre_sector}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Listado de Entregas */}
              <div className="space-y-3">
                {filteredHistorialEntregas.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center text-slate-400 space-y-3 border border-slate-200">
                    <Package className="h-10 w-10 mx-auto text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">No se encontraron entregas de ayudas</p>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      No hay registros de entregas que coincidan con la búsqueda por código ENT-, código SOL-, receptor o sector.
                    </p>
                  </div>
                ) : (
                  filteredHistorialEntregas.map((ent: any) => {
                    const itemsArray = Array.isArray(ent.items) ? ent.items : [];
                    const resumenTexto =
                      ent.items_resumen ||
                      (itemsArray.length > 0
                        ? itemsArray.map((it: any) => `${it.cantidad_entregada ?? it.cantidad ?? 1}x ${it.nombre_item || it.nombre_paquete || 'Ítem'}`).join(', ')
                        : 'Ayudas registradas');
                    const totalItems =
                      ent.cantidad_total_items ??
                      (itemsArray.reduce((acc: number, it: any) => acc + Number(it.cantidad_entregada ?? it.cantidad ?? 0), 0) || 1);
                    const solRelacionada = todasSolicitudes.find(
                      (s: any) => Number(s.id_solicitud) === Number(ent.id_solicitud)
                    );

                    return (
                      <div
                        key={ent.id_entrega}
                        className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 hover:border-emerald-300 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 hover:shadow-sm"
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-black bg-emerald-700 text-white shadow-2xs">
                              {ent.codigo_entrega || `ENT-${ent.id_entrega}`}
                            </span>
                            {ent.codigo_solicitud || ent.id_solicitud ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setDetailModalInitialTab('censo');
                                  setDetailedRequestId(ent.id_solicitud);
                                  setIsDetailModalOpen(true);
                                }}
                                className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200 hover:bg-blue-200 transition cursor-pointer flex items-center gap-1"
                                title="Ver solicitud vinculada"
                              >
                                <FileText className="h-3 w-3 text-blue-700" />
                                <span>{ent.codigo_solicitud || `SOL-${ent.id_solicitud}`}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                Entrega Inmediata
                              </span>
                            )}
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ✓ {totalItems} ítems entregados
                            </span>
                            {ent.fecha_entrega && (
                              <span className="text-[11px] font-mono text-slate-500">
                                📅 {ent.fecha_entrega}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-slate-500" />
                              {ent.nombre_receptor || ent.titular_nombre || ent.nombre_completo || 'Receptor'}
                            </strong>
                            {(ent.documento_receptor || ent.documento || ent.titular_documento) && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                C.C. {ent.documento_receptor || ent.documento || ent.titular_documento}
                              </span>
                            )}
                            {ent.parentesco_con_jefe && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {ent.parentesco_con_jefe}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                            {(ent.nombre_sector || solRelacionada?.nombre_sector) && (
                              <span className="flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                                {ent.nombre_sector || solRelacionada?.nombre_sector}
                              </span>
                            )}
                            {(ent.direccion_receptor || solRelacionada?.direccion_afectacion || solRelacionada?.direccion) && (
                              <span className="truncate max-w-[320px] text-[11px]">
                                {ent.direccion_receptor || solRelacionada?.direccion_afectacion || solRelacionada?.direccion}
                              </span>
                            )}
                            {ent.nombre_entidad_donante && (
                              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                Origen: {ent.nombre_entidad_donante}
                              </span>
                            )}
                          </div>

                          {/* Resumen de Insumos Entregados */}
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2 mt-1">
                            <Package className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="font-medium">
                              <strong className="font-bold text-slate-900">Insumos entregados:</strong> {resumenTexto}
                            </span>
                          </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="shrink-0 flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                          {ent.id_solicitud && (
                            <button
                              type="button"
                              onClick={() => {
                                setDetailModalInitialTab('censo');
                                setDetailedRequestId(ent.id_solicitud);
                                setIsDetailModalOpen(true);
                              }}
                              className="px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="Ver expediente completo de la solicitud vinculada"
                            >
                              <Eye className="h-3.5 w-3.5 text-amber-300" />
                              <span>Ver Solicitud</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleEditarEntrega(ent)}
                            className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition flex items-center gap-1 cursor-pointer"
                            title="Editar el registro de esta entrega específica"
                          >
                            <Pencil className="h-3.5 w-3.5 text-slate-500" />
                            <span>Editar Entrega</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleGestionarNuevaEntrega(ent)}
                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="Gestionar y registrar una NUEVA entrega para esta solicitud"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Gestionar Entrega</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Historial de la Sesión Actual */}
              {historialRegistros.length > 0 && (
                <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-3 mt-6">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <ListCheck className="h-4 w-4 text-blue-700" />
                    <h3 className="font-bold text-xs sm:text-sm text-slate-800">
                      Actividad Reciente en esta Sesión ({historialRegistros.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {historialRegistros.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-black bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                            {item.codigo_solicitud || item.codigo_entrega || `REG-#${idx + 1}`}
                          </span>
                          <span className="font-semibold text-slate-800">{item.mensaje}</span>
                        </div>
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* ======================= TAB 4: NÚCLEOS FAMILIARES ======================= */}
          {activeTab === 'nucleos' && (
            <GestionNucleosFamiliaresSAD />
          )}

          {/* ======================= TAB 5: EVALUACIONES DE DAÑOS ======================= */}
          {activeTab === 'evaluaciones' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0071e3] flex items-center justify-center">
                    <Home className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Evaluaciones Técnicas de Daños en Vivienda e Infraestructura
                    </h2>
                    <p className="text-xs text-slate-500">
                      Consulte el estado técnico de cada vivienda censada o abra una solicitud para evaluar o actualizar sus daños.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRegistroModo('SOLICITUD_SOLO');
                    setFormStepTab(4);
                    setActiveTab('formulario');
                  }}
                  className="px-4 py-2.5 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-[10px] text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nueva Evaluación Técnica</span>
                </button>
              </div>

              {/* Barra de Filtros Ejecutivos en Evaluaciones de Daños */}
              {renderBarraFiltrosEjecutivos()}

              <div className="bg-white rounded-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E5E5EA] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E5E5EA] text-[11px] font-semibold text-[#6E6E73] uppercase bg-[#F5F5F7]/60">
                        <th className="py-3 px-4">Solicitud</th>
                        <th className="py-3 px-4">Solicitante / Documento</th>
                        <th className="py-3 px-4">Ubicación</th>
                        <th className="py-3 px-4">Nivel Global</th>
                        <th className="py-3 px-4">Componentes (Techo / Muros / Pisos)</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5F5F7]">
                      {solicitudesFiltradasDashboard
                        .slice((evalCurrentPage - 1) * 12, evalCurrentPage * 12)
                        .map((sol) => (
                          <tr key={sol.id_solicitud} className="hover:bg-[#F5F5F7]/70 transition">
                            <td className="py-3.5 px-4 font-mono font-bold text-[#007AFF]">
                              {sol.codigo_solicitud || `SOL-${sol.id_solicitud}`}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#1D1D1F]">{sol.nombre_completo}</div>
                              <div className="text-[11px] text-[#6E6E73] font-mono">CC: {sol.documento}</div>
                            </td>
                            <td className="py-3.5 px-4 text-[#6E6E73]">
                              <div className="font-semibold text-[#1D1D1F]">{sol.nombre_sector}</div>
                              <div className="text-[11px] text-[#6E6E73] truncate max-w-[180px]">{sol.direccion_afectacion || 'Zona verificada'}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${sol.afectacion_nivel === 'Colapso Total'
                                  ? 'bg-[#FF3B30]/12 text-[#FF3B30]'
                                  : sol.afectacion_nivel === 'Grave'
                                    ? 'bg-[#FF9500]/15 text-[#FF9500]'
                                    : sol.afectacion_nivel === 'Leve'
                                      ? 'bg-[#FFCC00]/20 text-[#997A00]'
                                      : 'bg-[#F5F5F7] text-[#6E6E73]'
                                  }`}
                              >
                                {sol.afectacion_nivel || 'Ninguno'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[11px] text-[#6E6E73]">
                              Techo: <strong>{sol.techo_damage_level || 'S/D'}</strong> • Est: <strong>{sol.estructura_damage_level || 'S/D'}</strong>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${sol.estado_atencion === 'ATENDIDO'
                                  ? 'bg-[#34C759]/12 text-[#34C759]'
                                  : 'bg-[#007AFF]/10 text-[#007AFF]'
                                  }`}
                              >
                                {sol.estado_atencion === 'ATENDIDO' ? 'Evaluada y Atendida' : 'En evaluación'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleIniciarVisitaTecnica(sol)}
                                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[10px] text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1"
                                  title="Realizar visita técnica y re-evaluar la vivienda"
                                >
                                  <ClipboardCheck className="h-3.5 w-3.5" />
                                  <span>Visita Técnica ({sol.total_visitas ?? (sol.visita ? 1 : 0)})</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await handleEditarSolicitud(sol.id_solicitud, 'SOLICITUD_SOLO');
                                    setFormStepTab(4);
                                  }}
                                  className="px-3 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-[10px] text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1"
                                >
                                  <ListCheck className="h-3.5 w-3.5" />
                                  <span>Evaluar Daños</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {solicitudesFiltradasDashboard.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-[#6E6E73]">
                            No hay solicitudes que coincidan con los filtros seleccionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginación de Evaluaciones */}
                {solicitudesFiltradasDashboard.length > 12 && (
                  <div className="px-4 py-3 border-t border-[#E5E5EA] bg-[#F5F5F7]/60 flex items-center justify-between text-xs">
                    <span className="text-[#6E6E73] font-medium">
                      Mostrando{' '}
                      <strong className="text-[#1D1D1F]">
                        {(evalCurrentPage - 1) * 12 + 1}–
                        {Math.min(evalCurrentPage * 12, solicitudesFiltradasDashboard.length)}
                      </strong>{' '}
                      de <strong className="text-[#1D1D1F]">{solicitudesFiltradasDashboard.length}</strong> evaluaciones
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={evalCurrentPage <= 1}
                        onClick={() => setEvalCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-lg border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] font-semibold text-[#1D1D1F] disabled:opacity-40 cursor-pointer"
                      >
                        ‹ Anterior
                      </button>
                      <span className="px-2.5 py-1 font-bold text-[#007AFF]">
                        Pág. {evalCurrentPage} / {Math.max(1, Math.ceil(solicitudesFiltradasDashboard.length / 12))}
                      </span>
                      <button
                        type="button"
                        disabled={evalCurrentPage >= Math.ceil(solicitudesFiltradasDashboard.length / 12)}
                        onClick={() =>
                          setEvalCurrentPage((p) =>
                            Math.min(Math.ceil(solicitudesFiltradasDashboard.length / 12), p + 1)
                          )
                        }
                        className="px-3 py-1.5 rounded-lg border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] font-semibold text-[#1D1D1F] disabled:opacity-40 cursor-pointer"
                      >
                        Siguiente ›
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================= TAB 6: REPORTES E INDICADORES ======================= */}
          {activeTab === 'reportes' && (
            <div className="space-y-4">
              <div className="bg-white rounded-[16px] p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E5E5EA] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-[12px] bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-[#1D1D1F]">
                      Reportes e Indicadores Operativos de Emergencia
                    </h2>
                    <p className="text-xs text-[#6E6E73]">
                      Consolidado estadístico de solicitudes, nivel de afectación en viviendas, entregas y población censada.
                    </p>
                  </div>
                </div>
              </div>

              {/* Barra de Filtros Ejecutivos en Reportes e Indicadores */}
              {renderBarraFiltrosEjecutivos()}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-white rounded-[16px] border border-[#E5E5EA] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <span className="text-[11px] font-semibold text-[#6E6E73] block">Total Solicitudes</span>
                  <span className="text-2xl font-extrabold text-[#1D1D1F] mt-1 block">{kpiResumen.total}</span>
                </div>
                <div className="bg-white rounded-[16px] border border-[#E5E5EA] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <span className="text-[11px] font-semibold text-[#6E6E73] block">Pendientes de Atención</span>
                  <span className="text-2xl font-extrabold text-[#FF9500] mt-1 block">{kpiResumen.pendientes}</span>
                </div>
                <div className="bg-white rounded-[16px] border border-[#E5E5EA] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <span className="text-[11px] font-semibold text-[#6E6E73] block">Solicitudes Atendidas</span>
                  <span className="text-2xl font-extrabold text-[#34C759] mt-1 block">{kpiResumen.atendidas}</span>
                </div>
                <div className="bg-white rounded-[16px] border border-[#E5E5EA] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <span className="text-[11px] font-semibold text-[#6E6E73] block">Viviendas Afectadas</span>
                  <span className="text-2xl font-extrabold text-[#FF3B30] mt-1 block">{kpiResumen.viviendasAfectadas}</span>
                </div>
                <div className="bg-white rounded-[16px] border border-[#E5E5EA] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <span className="text-[11px] font-semibold text-[#6E6E73] block">Personas Afectadas</span>
                  <span className="text-2xl font-extrabold text-[#007AFF] mt-1 block">{kpiResumen.personasAfectadas}</span>
                </div>
              </div>

              <div className="bg-white rounded-[16px] p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E5E5EA] space-y-4">
                <h3 className="text-sm font-extrabold text-[#1D1D1F]">Distribución por Nivel de Daño en Vivienda</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {(['Colapso Total', 'Grave', 'Leve', 'Ninguno'] as const).map((lvl) => {
                    const count = solicitudesFiltradasDashboard.filter((s) => (s.afectacion_nivel || 'Ninguno') === lvl).length;
                    const pct = kpiResumen.total > 0 ? Math.round((count / kpiResumen.total) * 100) : 0;
                    const isSelectedLvl = dashFiltroNivelDano === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() =>
                          setDashFiltroNivelDano((prev) => (prev === lvl ? 'TODOS' : lvl))
                        }
                        className={`p-4 rounded-[12px] border text-left transition space-y-1.5 cursor-pointer ${isSelectedLvl
                          ? 'border-[#007AFF] bg-[#007AFF]/5 ring-2 ring-[#007AFF]/15'
                          : 'border-[#E5E5EA] bg-[#F5F5F7]/60 hover:border-[#007AFF]/40'
                          }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-[#1D1D1F]">
                          <span>{lvl}</span>
                          <span className="font-mono text-[#6E6E73]">{pct}%</span>
                        </div>
                        <div className="text-xl font-extrabold text-[#1D1D1F]">{count} viviendas</div>
                        <div className="w-full h-1.5 bg-[#E5E5EA] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${lvl === 'Colapso Total'
                              ? 'bg-[#FF3B30]'
                              : lvl === 'Grave'
                                ? 'bg-[#FF9500]'
                                : lvl === 'Leve'
                                  ? 'bg-[#FFCC00]'
                                  : 'bg-[#8E8E93]'
                              }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
export default CatastrofesView;
