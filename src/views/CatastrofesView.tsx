import React, { useEffect, useMemo, useState } from 'react';
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
  Layers,
  Leaf,
  List,
  ListCheck,
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
  Tent,
  Trash2,
  Trees,
  Truck,
  User,
  UserCheck,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { useAuth } from '../auth/AuthContext';
import { NavbarSAC } from '../components/layout/NavbarSAC';
import SearchableSelect from '../components/form/SearchableSelect';
import LocationPickerModal from '../components/maps/LocationPickerModal';
import PendingRequestPickerModal from '../components/modals/PendingRequestPickerModal';
import { SolicitudDetailModal } from '../components/modals/SolicitudDetailModal';
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
} from '../types/sac.types';
import '../components/maps/RequestLocationMap.css';

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
};

function EmergencyMapController({ isFullScreen }: { isFullScreen?: boolean }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map, isFullScreen]);
  return null;
}

export const CatastrofesView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Navigation tabs inside module: formulario | mapa | historial
  const [activeTab, setActiveTab] = useState<'formulario' | 'mapa' | 'historial'>('formulario');

  // Catalogs
  const [sectores, setSectores] = useState<SectorItem[]>([]);
  const [itemsAyuda, setItemsAyuda] = useState<ItemAyuda[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  // Multi-Disaster Events
  const [eventos, setEventos] = useState<any[]>([]);
  const [selectedEventoId, setSelectedEventoId] = useState<number>(1);

  // Mode: SOLICITUD_SOLO | ENTREGA_DIRECTA | ENTREGA_EXISTENTE
  const [registroModo, setRegistroModo] = useState<'SOLICITUD_SOLO' | 'ENTREGA_DIRECTA' | 'ENTREGA_EXISTENTE'>('SOLICITUD_SOLO');

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

  // Disaster solicitudes (Pending and Completed)
  const [todasSolicitudes, setTodasSolicitudes] = useState<any[]>([]);
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

  // Section 3: Indicadores Rápidos & Afectación de Vivienda
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

  // Checklist & Item Quantities
  const [selectedSubtipos, setSelectedSubtipos] = useState<string[]>([]);
  const [cantidadesSubtipos, setCantidadesSubtipos] = useState<Record<string, number>>({});
  const [busquedaSubtipo, setBusquedaSubtipo] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<number>(0);

  // Section 4: Observaciones, Cantidad y Fotos de Evidencia
  const [observaciones, setObservaciones] = useState('');
  const [cantidadAyuda, setCantidadAyuda] = useState<number>(1);
  const [fotosEntrega, setFotosEntrega] = useState<string[]>([]);

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
      const [secs, items] = await Promise.all([
        sacService.getSectores(),
        sacService.getItems(),
      ]);
      setSectores(secs);
      setItemsAyuda(items);
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
      const res = await sacService.getTodasSolicitudes('all', targetEv);
      setTodasSolicitudes(res);
    } catch (e) {
      console.error('Error al cargar solicitudes', e);
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

  const actualizarNivelTecho = (level: 'Colapso Total' | 'Grave' | 'Leve' | 'Ninguno') => {
    setTechoDamageLevel(level);
    if (!userManualDamageLevel) {
      const maxRank = Math.max(getSeverityRank(level), getSeverityRank(estructuraDamageLevel));
      setAfectacionNivel(getLevelFromRank(maxRank));
    }
  };

  const actualizarNivelEstructura = (level: 'Colapso Total' | 'Grave' | 'Leve' | 'Ninguno') => {
    setEstructuraDamageLevel(level);
    if (!userManualDamageLevel) {
      const maxRank = Math.max(getSeverityRank(techoDamageLevel), getSeverityRank(level));
      setAfectacionNivel(getLevelFromRank(maxRank));
    }
  };

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

  // Preset Packages
  const PRESET_PACKAGES: Record<string, { label: string; items: string[] }> = {
    AFECTACION_VIVIENDA: {
      label: 'Afectación Vivienda',
      items: [
        'Agrietamiento/fisuras en paredes',
        'Daño en techo/cubierta (tejas movidas o rotas)',
        'Colapso parcial de muros/paredes',
        'Vivienda inhabitable / requiere demolición',
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
      setSelectedSubtipos((prev) => prev.filter((item) => !pkg.items.includes(item)));
      showToast(`Desmarcado paquete: ${pkg.label}`, 'warning');
    } else {
      setSelectedSubtipos((prev) => {
        const next = [...prev];
        pkg.items.forEach((item) => {
          if (!next.includes(item)) next.push(item);
        });
        return next;
      });
      setCantidadesSubtipos((prev) => {
        const next = { ...prev };
        pkg.items.forEach((item) => {
          if (!next[item]) next[item] = 1;
        });
        return next;
      });
      showToast(`Seleccionado paquete: ${pkg.label}`, 'success');
    }
  };

  const toggleSubtipo = (nombre: string) => {
    const isCurrentlySelected = selectedSubtipos.includes(nombre);
    if (isCurrentlySelected) {
      setSelectedSubtipos((prev) => prev.filter((item) => item !== nombre));
    } else {
      setCantidadesSubtipos((prev) => ({ ...prev, [nombre]: prev[nombre] || 1 }));
      setSelectedSubtipos((prev) => [...prev, nombre]);
    }
  };

  const handleCantidadSubtipoChange = (nombre: string, val: number) => {
    const valid = Math.max(1, val);
    setCantidadesSubtipos((prev) => ({ ...prev, [nombre]: valid }));
  };

  // Multiple Photo Uploads
  const handleMultiplePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setFotosEntrega((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
      showToast(`${files.length} imagen(es) adjuntada(s)`, 'success');
    }
  };

  const removePhoto = (index: number) => {
    setFotosEntrega((prev) => prev.filter((_, i) => i !== index));
  };

  const totalCantidadCalculada = useMemo(() => {
    return selectedSubtipos.reduce((acc, sub) => acc + (cantidadesSubtipos[sub] || 1), 0);
  }, [selectedSubtipos, cantidadesSubtipos]);

  const filteredTipologias = useMemo(() => {
    return DISASTER_TYPOLOGIES.map((tipo) => {
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
  }, [busquedaSubtipo, categoriaFiltro]);

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

  // Filtered solicitudes for Map
  const solicitudesFiltradasMapa = useMemo(() => {
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

      // 6. Free Search Query
      const q = mapSearchQuery.toLowerCase().trim();
      if (q) {
        const matchDoc = sol.documento?.toLowerCase().includes(q);
        const matchName = sol.nombre_completo?.toLowerCase().includes(q);
        const matchId = `sol-${sol.id_solicitud}`.toLowerCase().includes(q) || String(sol.id_solicitud).includes(q) || (sol.codigo_solicitud && sol.codigo_solicitud.toLowerCase().includes(q));
        const matchSector = sol.nombre_sector?.toLowerCase().includes(q);
        if (!matchDoc && !matchName && !matchId && !matchSector) return false;
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
    mapSearchQuery,
    selectedMultiCategoryIds,
    selectedSubtipologiaCodes,
  ]);

  // Sector Geo Data & Request Counts for Map (agrupado por sector con semáforo promedio)
  const sectorGeoData = useMemo(() => {
    const base = getSectorsGeoData(sectores);
    const mappedReqs = solicitudesFiltradasMapa.map((s) => ({
      latitude: s.latitud ?? null,
      longitude: s.longitud ?? null,
      id: s.id_solicitud,
      id_sector: s.id_sector ?? null,
    }));
    return assignRequestsToSectors(base, mappedReqs);
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
  };

  // Cargar entrega para edición completa
  const handleEditarEntrega = (entrega: any, detail: SolicitudDetailResponse) => {
    setEditingEntregaId(entrega.id_entrega);
    setEditingEntregaCodigo(entrega.codigo_entrega);
    setEditingSolicitudId(null);
    setEditingSolicitudCodigo(null);

    // Cargar datos de la persona y de la entrega
    setDocumento(detail.ciudadano?.documento || '');
    setNombres(detail.ciudadano?.nombres || '');
    setApellidos(detail.ciudadano?.apellidos || '');
    setTelefono(detail.ciudadano?.telefono || '');
    setDireccion(detail.ciudadano?.direccion || detail.direccion_afectacion || '');
    if (detail.sector?.id_sector) setSectorId(detail.sector.id_sector);
    if (detail.latitud_gps && detail.longitud_gps) {
      setLatitud(detail.latitud_gps);
      setLongitud(detail.longitud_gps);
    }
    setCantidadAyuda(entrega.cantidad || 1);
    setObservaciones(entrega.observaciones || '');
    setRegistroModo('ENTREGA_EXISTENTE');
    setActiveTab('formulario');
    showToast(`Modo edición activado para Entrega ${entrega.codigo_entrega}`, 'warning');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cargar solicitud para edición completa
  const handleEditarSolicitud = async (solOrId: number | any) => {
    try {
      const id = typeof solOrId === 'number' ? solOrId : (solOrId.id_solicitud || solOrId.id);
      if (!id) return;
      showToast('Cargando expediente para edición...', 'warning');
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

      // Fotos
      if (detail.fotos && detail.fotos.length > 0) {
        setFotosEntrega(detail.fotos.map((f) => f.url));
      }

      setEditingSolicitudId(detail.id_solicitud);
      setEditingSolicitudCodigo(detail.codigo_solicitud || `SOL-${detail.id_solicitud}`);
      setRegistroModo('SOLICITUD_SOLO');
      setActiveTab('formulario');
      showToast(`Modo edición activado para ${detail.codigo_solicitud || `SOL-${detail.id_solicitud}`}`, 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('Error al cargar solicitud para edición:', error);
      showToast('No se pudo cargar la solicitud para edición', 'error');
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (eventos.length === 0) {
      showToast('No tienes ninguna contingencia activa asignada para registrar datos.', 'error');
      return;
    }

    if (registroModo !== 'ENTREGA_EXISTENTE') {
      if (!documento.trim() || !nombres.trim() || !apellidos.trim()) {
        showToast('Por favor ingrese documento, nombres y apellidos del beneficiario.', 'error');
        return;
      }
    }

    if (registroModo === 'ENTREGA_EXISTENTE' && !selectedRequest) {
      showToast('Seleccione la solicitud pendiente que desea atender.', 'error');
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
            nivel_afectacion_vivienda: afectacionNivel,
            nivel_afectacion_techo: techoDamageLevel,
            requiere_evacuacion: evacuar,
            visita_campo_realizada: visita,
            censo_oficial_realizado: censo,
            requiere_albergue: albergue,
            cuenta_red_apoyo: redApoyo,
            afectacion_infraestructura_productiva: false,
            observaciones_dano: obsAfectacionPartes.join(' ') || undefined,
          },
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
          fotos_evidencia: fotosEntrega,
        };

        const res = await sacService.actualizarSolicitud(editingSolicitudId, payload);
        showToast(`¡Solicitud ${editingSolicitudCodigo || `SOL-${editingSolicitudId}`} actualizada exitosamente!`, 'success');
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
            nivel_afectacion_vivienda: afectacionNivel,
            nivel_afectacion_techo: techoDamageLevel,
            requiere_evacuacion: evacuar,
            visita_campo_realizada: visita,
            censo_oficial_realizado: censo,
            requiere_albergue: albergue,
            cuenta_red_apoyo: redApoyo,
            afectacion_infraestructura_productiva: false,
            observaciones_dano: obsAfectacionPartes.join(' ') || undefined,
          },
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
          fotos_evidencia: fotosEntrega,
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
          id_item: mappedItems[0]?.id_item || itemsAyuda[0]?.id_item || 1,
          cantidad: mappedItems[0]?.cantidad || cantidadAyuda || totalCantidadCalculada || 1,
          items_entregados: mappedItems.length > 0 ? mappedItems : undefined,
          observaciones: observaciones.trim() || undefined,
          fotos_evidencia: fotosEntrega,
        };
        const res = await sacService.registrarEntregaExistente(payload);
        showToast(`¡Entrega ${res.codigo_entrega} completada para ${selectedRequest.codigo_solicitud || selectedRequest.id_solicitud}!`, 'success');
        setHistorialRegistros((prev) => [res, ...prev]);
        resetFormState();
      }

      fetchSolicitudes();
      loadDashboard();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Error al procesar el registro.', 'error');
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <NavbarSAC />

      {/* Active Disaster Event Selector & Segmented Navigation Sub-Bar */}
      <div className="bg-white border-b border-slate-200 shadow-2xs px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-2.5">
          {/* Active Disaster Event Selector */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {eventos.length > 0 ? (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200/90 px-3 py-1 rounded-xl shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse shrink-0"></span>
                <span className="text-xs font-black text-rose-900 shrink-0">Evento Activo:</span>
                <select
                  value={selectedEventoId}
                  onChange={(e) => {
                    const newEvId = Number(e.target.value);
                    setSelectedEventoId(newEvId);
                    fetchSolicitudes(newEvId);
                    loadDashboard(newEvId);
                  }}
                  className="bg-white border border-rose-200 rounded-lg px-2.5 py-0.5 text-xs font-black text-rose-950 shadow-2xs focus:outline-none cursor-pointer"
                >
                  {eventos.map((ev) => (
                    <option key={ev.id_evento} value={ev.id_evento}>
                      {ev.codigo_evento} — {ev.nombre_evento}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="text-xs font-black text-amber-900">
                  Sin Eventos Asignados
                </span>
              </div>
            )}

            {/* Event Details Pill */}
            {eventos.find((e) => e.id_evento === selectedEventoId) && (
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                <span className="text-blue-700 font-extrabold">
                  {eventos.find((e) => e.id_evento === selectedEventoId)?.tipo_evento}
                </span>
                <span className="text-slate-400">•</span>
                <span>{eventos.find((e) => e.id_evento === selectedEventoId)?.municipio || 'Anserma'}</span>
              </div>
            )}
          </div>

          {/* Minimalist Segmented Navigation Tabs */}
          <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('formulario')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'formulario'
                  ? 'bg-white text-blue-700 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Formulario</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mapa')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'mapa'
                  ? 'bg-white text-blue-700 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Mapa</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeTab === 'mapa' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'}`}>
                {todasSolicitudes.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('historial')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'historial'
                  ? 'bg-white text-blue-700 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <ListCheck className="h-3.5 w-3.5" />
              <span>Historial</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeTab === 'historial' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'}`}>
                {historialRegistros.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Warning Banner if No Active Events Assigned */}
      {eventos.length === 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center">
          <div className="max-w-3xl mx-auto flex items-center justify-center gap-2.5 text-amber-900 text-xs font-bold">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0" />
            <span>
              <strong>Sin Contingencia Asignada:</strong> Tu perfil no tiene ningún evento de desastre activo asignado. Para registrar censos o realizar entregas, solicita a un Administrador que te asigne a una contingencia activa.
            </span>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl text-white font-bold flex items-center gap-3 border ${
              toast.type === 'success'
                ? 'bg-emerald-600 border-emerald-400'
                : toast.type === 'error'
                ? 'bg-rose-600 border-rose-400'
                : 'bg-amber-600 border-amber-400'
            }`}
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="text-sm">{toast.msg}</span>
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
                <Filter className="h-5 w-5 text-blue-700" />
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
                          className="h-4 w-4 text-blue-600 rounded"
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
                              className={`p-2 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs transition select-none ${
                                isSubChecked
                                  ? 'bg-blue-50 border-blue-300 font-bold text-blue-950'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSubChecked}
                                readOnly
                                className="h-3.5 w-3.5 text-blue-600 rounded pointer-events-none"
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
                className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-sm transition"
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
          onClose={() => {
            setIsDetailModalOpen(false);
            setDetailedRequestId(null);
          }}
          onEditarSolicitud={(det) => handleEditarSolicitud(det)}
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
            showToast(`Solicitud ${det.codigo_solicitud} cargada para atender en formulario.`, 'success');
          }}
          isCensoOnly={isCensoOnlyUser}
        />
      )}

      {/* MAIN BODY */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 w-full flex-grow space-y-5">
        {/* ======================= TAB 1: FORMULARIO ======================= */}
        {activeTab === 'formulario' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Banner de Modo Edición */}
            {(editingSolicitudId || editingEntregaId) && (
              <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white rounded-3xl p-4 sm:p-5 shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                    <Pencil className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-xs bg-slate-950/40 px-2.5 py-0.5 rounded-lg">
                        {editingEntregaCodigo || editingSolicitudCodigo || `REG-${editingSolicitudId || editingEntregaId}`}
                      </span>
                      <span className="font-extrabold text-sm sm:text-base">
                        {editingEntregaId ? 'Modo Edición de Entrega de Ayuda Activo' : 'Modo Edición de Expediente / Censo Activo'}
                      </span>
                    </div>
                    <p className="text-xs text-amber-100 font-medium mt-0.5">
                      Modificando información de <strong>{nombres || 'Ciudadano'} {apellidos}</strong> (Doc: {documento || 'S/D'}). Los cambios actualizarán la base de datos oficial.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetFormState}
                    className="px-4 py-2 bg-white text-slate-900 hover:bg-amber-50 rounded-2xl text-xs font-black shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    <X className="h-4 w-4 text-rose-600" />
                    <span>Cancelar Edición</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mode Selector Card */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-3">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">
                Modalidades de Atención Habilitadas para su Perfil:
              </label>

              {isCensoOnlyUser ? (
                <div className="p-4 rounded-2xl border-2 border-blue-600 bg-blue-50/50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-700 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                      1
                    </div>
                    <div>
                      <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                        <span>Nueva Solicitud (Censo Oficial)</span>
                        <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full">
                          Solo Censo / Nivel 1
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Permiso institucional para la caracterización y toma de solicitudes RUFE en terreno.
                      </div>
                    </div>
                  </div>
                </div>
              ) : isEntregaOnlyUser ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRegistroModo('ENTREGA_DIRECTA')}
                    className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all cursor-pointer ${
                      registroModo === 'ENTREGA_DIRECTA'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${
                        registroModo === 'ENTREGA_DIRECTA' ? 'bg-blue-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      2
                    </div>
                    <div>
                      <div className="font-extrabold text-blue-900 text-xs sm:text-sm flex flex-wrap items-center gap-1.5">
                        <span>Entrega Inmediata</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-black">
                          Auto-Crea
                        </span>
                        <span className="bg-sky-100 text-sky-900 text-[10px] px-1.5 py-0.2 rounded font-black">
                          Entregas / Nivel 2
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Crea Solicitud y formaliza Entrega física en campo.</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegistroModo('ENTREGA_EXISTENTE')}
                    className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all cursor-pointer ${
                      registroModo === 'ENTREGA_EXISTENTE'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${
                        registroModo === 'ENTREGA_EXISTENTE' ? 'bg-blue-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      3
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                        <span>Entrega a Solicitud Previa</span>
                        <span className="bg-sky-100 text-sky-900 text-[10px] px-1.5 py-0.2 rounded font-black">
                          Entregas / Nivel 2
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Vincular entrega física a solicitud censada pendiente.</div>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setRegistroModo('SOLICITUD_SOLO')}
                    className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all cursor-pointer ${
                      registroModo === 'SOLICITUD_SOLO'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${
                        registroModo === 'SOLICITUD_SOLO' ? 'bg-blue-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      1
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm">Nueva Solicitud (Censo)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Registro de censo y caracterización.</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegistroModo('ENTREGA_DIRECTA')}
                    className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all cursor-pointer ${
                      registroModo === 'ENTREGA_DIRECTA'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${
                        registroModo === 'ENTREGA_DIRECTA' ? 'bg-blue-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      2
                    </div>
                    <div>
                      <div className="font-extrabold text-blue-900 text-xs sm:text-sm flex items-center gap-1.5">
                        <span>Entrega Inmediata</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-black">
                          Auto-Crea
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Crea Solicitud y entrega en campo.</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegistroModo('ENTREGA_EXISTENTE')}
                    className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all cursor-pointer ${
                      registroModo === 'ENTREGA_EXISTENTE'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${
                        registroModo === 'ENTREGA_EXISTENTE' ? 'bg-blue-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      3
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm">Entrega a Solicitud Previa</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Vincular a solicitud pendiente.</div>
                    </div>
                  </button>
                </div>
              )}

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
                        <p className="text-xs text-slate-600 max-w-md mx-auto mt-0.5">
                          Los datos del ciudadano, RUFE y evaluación de daños ya están registrados. Solo debes seleccionar los bienes, insumos o materiales a entregar.
                        </p>
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
                        <button
                          type="button"
                          onClick={() => setIsRequestPickerOpen(true)}
                          className="px-3 py-1 bg-white hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <Search className="h-3.5 w-3.5" />
                          <span>Cambiar Solicitud</span>
                        </button>
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
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-black mt-0.5 ${
                            selectedRequest.afectacion_nivel === 'Colapso Total'
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

            {/* SECCIONES 1 Y 2: Solo para Nueva Solicitud / Censo o Entrega Directa */}
            {registroModo !== 'ENTREGA_EXISTENTE' && (
              <>
                {/* SECTION 1: Identificación del Ciudadano y Ubicación */}
                <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xs border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                    <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">1. Identificación y Ubicación Geográfica</h3>
                      <p className="text-[11px] text-slate-500">Datos personales del damnificado y georreferenciación exacta</p>
                    </div>
                  </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cédula / Documento *</label>
                  <input
                    type="text"
                    required
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    placeholder="Número de documento"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    placeholder="Nombres"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    placeholder="Apellidos"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono de Contacto</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="ej: 3104509988"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pertenencia Étnica</label>
                  <select
                    value={grupoEtnicoCiudadano}
                    onChange={(e) => setGrupoEtnicoCiudadano(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 cursor-pointer"
                  >
                    <option value="Ninguno de los anteriores">Ninguno de los anteriores</option>
                    <option value="Indígena">Indígena</option>
                    <option value="Gitano(a) o Rom">Gitano(a) o Rom</option>
                    <option value="Raizal">Raizal</option>
                    <option value="Palenquero(a)">Palenquero(a)</option>
                    <option value="Afrocolombiano(a), negro(a), mulato(a) o afrodescendiente">Afrocolombiano(a)...</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Parentesco / Rol en Hogar</label>
                  <select
                    value={parentescoCiudadano}
                    onChange={(e) => setParentescoCiudadano(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 cursor-pointer"
                  >
                    <option value="Jefe(a) o cabeza del hogar">Jefe(a) o cabeza del hogar</option>
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Filtrar Zona:</label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSectorZoneFilter('all')}
                      className={`py-1.5 text-[11px] font-bold rounded-lg transition ${sectorZoneFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setSectorZoneFilter('urbano')}
                      className={`py-1.5 text-[11px] font-bold rounded-lg transition ${sectorZoneFilter === 'urbano' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600'}`}
                    >
                      Urbano
                    </button>
                    <button
                      type="button"
                      onClick={() => setSectorZoneFilter('rural')}
                      className={`py-1.5 text-[11px] font-bold rounded-lg transition ${sectorZoneFilter === 'rural' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'}`}
                    >
                      Rural
                    </button>
                  </div>
                </div>

                <div>
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
                    placeholder="Buscar y seleccionar sector..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isSelectedSectorRural ? 'Nombre Finca / Obs. Sector (Opcional)' : 'Dirección de Afectación'}
                  </label>
                  <input
                    type="text"
                    value={isSelectedSectorRural ? observacionSector : direccion}
                    onChange={(e) => isSelectedSectorRural ? setObservacionSector(e.target.value) : setDireccion(e.target.value)}
                    placeholder={isSelectedSectorRural ? 'Ej: Finca La Esperanza, Km 4...' : 'Ej: Calle 12 # 4-50...'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                  />
                </div>
              </div>

              {/* GPS coordinates & buttons */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <MapPin className="h-4 w-4 text-blue-700" />
                  <span className="font-mono">GPS: {latitud.toFixed(6)}, {longitud.toFixed(6)}</span>
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

              {/* Sub-card: Datos Complementarios del Núcleo Familiar */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider block">
                  Datos Complementarios del Núcleo Familiar (Opcionales):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Edad (Años)</label>
                    <input
                      type="number"
                      placeholder="35"
                      value={edad}
                      onChange={(e) => setEdad(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">¿Es Propietario?</label>
                    <select
                      value={esPropietario === null ? '' : esPropietario ? 'SI' : 'NO'}
                      onChange={(e) => setEsPropietario(e.target.value === '' ? null : e.target.value === 'SI')}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="">Seleccione...</option>
                      <option value="SI">SI</option>
                      <option value="NO">NO</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Acompañantes</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={hayAcompanantes ? numAcompanantes : 0}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0;
                        setNumAcompanantes(v);
                        setHayAcompanantes(v > 0);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Adultos Mayores</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={hayAdultosMayores ? numAdultosMayores : 0}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0;
                        setNumAdultosMayores(v);
                        setHayAdultosMayores(v > 0);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Niños</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={hayNinos ? numNinos : 0}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0;
                        setNumNinos(v);
                        setHayNinos(v > 0);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Formulario Oficial UNGRD RUFE (FR-1703-SMD-69) SMD - ERE */}
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
                  <p className="text-xs text-indigo-200">
                    Formulario unificado de caracterización demográfica, afectación de bienes y pérdidas agropecuarias UNGRD.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsRufeSectionOpen(!isRufeSectionOpen)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
                    isRufeSectionOpen
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
                        placeholder="Ej: San Félix..."
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

                  {/* Bloque 1: Ubicación del Bien, Tenencia y Estado del Bien */}
                  <div className="p-4 bg-white rounded-2xl border border-indigo-200/80 space-y-3">
                    <h3 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide flex items-center gap-1.5 border-b border-indigo-100 pb-2">
                      <Home className="h-4 w-4 text-indigo-600" />
                      <span>1. Ubicación, Forma de Tenencia y Estado del Bien</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                          Forma de Tenencia
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

                      <div className="sm:col-span-4">
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

                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                          Tipo de Bien Afectado
                        </label>
                        <select
                          value={tipoBienRufe}
                          onChange={(e) => setTipoBienRufe(e.target.value)}
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
                  </div>

                  {/* Bloque 2: INFORMACIÓN DEMOGRÁFICA (Núcleo Familiar RUFE) */}
                  <div className="p-4 bg-white rounded-2xl border border-indigo-200/80 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-indigo-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-2xs">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide flex items-center gap-2">
                            <span>2. Información Demográfica (Núcleo Familiar RUFE)</span>
                            {nucleoFamiliar.length > 0 && (
                              <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                {nucleoFamiliar.length} integrante(s)
                              </span>
                            )}
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Tabla demográfica oficial de integrantes del hogar (nombres, apellidos, documento, parentesco, género, nacimiento, etnia y teléfono).
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={agregarFamiliar}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>+ Agregar Miembro al Núcleo</span>
                      </button>
                    </div>

                    {nucleoFamiliar.length === 0 ? (
                      <div className="py-5 text-center border-2 border-dashed border-indigo-200/70 rounded-2xl bg-indigo-50/30">
                        <p className="text-xs font-semibold text-slate-500">
                          No hay integrantes agregados en la información demográfica. Presione <strong className="text-indigo-600">+ Agregar Miembro al Núcleo</strong> para diligenciar la tabla demográfica.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {nucleoFamiliar.map((fam, index) => (
                          <div
                            key={fam.id}
                            className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5 transition-all hover:border-indigo-300 hover:bg-white"
                          >
                            {/* Row 1: Nombres, Apellidos, Tipo Doc, Documento, Borrar */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                              <div className="sm:col-span-1 flex items-center gap-1">
                                <span className="w-6 h-6 rounded-md bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                                  #{index + 1}
                                </span>
                              </div>

                              <div className="sm:col-span-3">
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Nombre(s) *</label>
                                <input
                                  type="text"
                                  placeholder="Nombres completos"
                                  value={fam.nombres}
                                  onChange={(e) => actualizarFamiliar(fam.id, 'nombres', e.target.value)}
                                  className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                              </div>

                              <div className="sm:col-span-3">
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Apellido(s)</label>
                                <input
                                  type="text"
                                  placeholder="Apellidos completos"
                                  value={fam.apellidos}
                                  onChange={(e) => actualizarFamiliar(fam.id, 'apellidos', e.target.value)}
                                  className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Tipo Doc</label>
                                <select
                                  value={fam.tipo_documento}
                                  onChange={(e) => actualizarFamiliar(fam.id, 'tipo_documento', e.target.value)}
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
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
                                  placeholder="Número Doc"
                                  value={fam.documento}
                                  onChange={(e) => actualizarFamiliar(fam.id, 'documento', e.target.value)}
                                  className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                              </div>

                              <div className="sm:col-span-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => eliminarFamiliar(fam.id)}
                                  className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                                  title="Eliminar integrante"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Row 2: Parentesco, Género (M/F/T), Fecha Nacimiento, Pertenencia Étnica, Teléfono */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 border-t border-slate-200/60">
                              <div className="sm:col-span-3">
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Parentesco</label>
                                <select
                                  value={fam.parentesco}
                                  onChange={(e) => actualizarFamiliar(fam.id, 'parentesco', e.target.value)}
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                >
                                  <option value="Jefe(a) o cabeza del hogar">Jefe(a) o cabeza del hogar</option>
                                  <option value="Pareja, Esposo(a)">Pareja, Esposo(a)</option>
                                  <option value="Hijo(a), hijastro(a)">Hijo(a), hijastro(a)</option>
                                  <option value="Padre, Madre, Suegro, Suegra">Padre, Madre, Suegro, Suegra</option>
                                  <option value="Hermano(a), Hermanastro(a)">Hermano(a), Hermanastro(a)</option>
                                  <option value="Abuelo(a)">Abuelo(a)</option>
                                  <option value="Nieto(a)">Nieto(a)</option>
                                  <option value="Tío(a)">Tío(a)</option>
                                  <option value="Sobrino(a)">Sobrino(a)</option>
                                  <option value="Yerno, Nuera">Yerno, Nuera</option>
                                  <option value="Cuñado, Cuñada">Cuñado, Cuñada</option>
                                  <option value="Primo(a)">Primo(a)</option>
                                  <option value="Otro pariente">Otro pariente</option>
                                  <option value="Otro no pariente">Otro no pariente</option>
                                  <option value="No informa">No informa</option>
                                </select>
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Género</label>
                                <select
                                  value={fam.identidad_genero}
                                  onChange={(e) => actualizarFamiliar(fam.id, 'identidad_genero', e.target.value)}
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
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
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>

                              <div className="sm:col-span-3">
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Pertenencia Étnica</label>
                                <select
                                  value={fam.grupo_etnico}
                                  onChange={(e) => actualizarFamiliar(fam.id, 'grupo_etnico', e.target.value)}
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
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
                                  placeholder="Opcional"
                                  value={fam.telefono}
                                  onChange={(e) => actualizarFamiliar(fam.id, 'telefono', e.target.value)}
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bloque 3: Sector Agropecuario (Pérdidas Agrícolas y Pecuarias) */}
                  <div className="p-4 bg-white rounded-2xl border border-indigo-200/80 space-y-3">
                    <h3 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide flex items-center gap-1.5 border-b border-indigo-100 pb-2">
                      <Leaf className="h-4 w-4 text-emerald-600" />
                      <span>3. Sector Agropecuario (Pérdidas de Cultivos y Pecuario RUFE)</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Tipo de Cultivo</label>
                        <input
                          type="text"
                          placeholder="Ej: Café, Maíz, Yuca, Plátano..."
                          value={cultivoTipo}
                          onChange={(e) => setCultivoTipo(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Unidad Medida</label>
                        <select
                          value={cultivoUnidad}
                          onChange={(e) => setCultivoUnidad(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="Hectáreas">Hectáreas (s)</option>
                          <option value="Fanegadas">Fanegada (s)</option>
                          <option value="Metros Cuadrados">Metro (s) Cuadrado (s)</option>
                          <option value="Unidades">Unidades</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Área / Cantidad</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          value={cultivoArea}
                          onChange={(e) => setCultivoArea(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Especie Pecuaria</label>
                        <input
                          type="text"
                          placeholder="Ej: Bovinos, Porcinos..."
                          value={pecuarioEspecie}
                          onChange={(e) => setPecuarioEspecie(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Cant</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={pecuarioCantidad}
                          onChange={(e) => setPecuarioCantidad(e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bloque 4: Vo.Bo. CMGRD/CDGRD */}
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
            </div>
          </>
        )}

            {/* SECTION 3: Checklist de Insumos, Bienes y Materiales */}
            <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="bg-rose-700 text-white px-5 py-3.5 flex flex-wrap justify-between items-center gap-2">
                <div>
                  <h2 className="font-bold text-xs sm:text-sm flex items-center gap-2">
                    <ListCheck className="h-4.5 w-4.5 text-amber-400" />
                    <span>
                      {registroModo === 'ENTREGA_EXISTENTE'
                        ? 'Checklist de Insumos, Bienes y Materiales a Entregar'
                        : '3. Checklist de Insumos, Bienes y Materiales'}
                    </span>
                  </h2>
                  <p className="text-[11px] text-rose-100">
                    {registroModo === 'ENTREGA_EXISTENTE'
                      ? 'Marque y especifique las cantidades de los insumos y materiales que se entregan físicamente al beneficiario.'
                      : 'Marque cada requerimiento. Si entrega/solicita más de 1 unidad, especifique la cantidad.'}
                  </p>
                </div>
                <div className="bg-rose-950/80 px-3 py-0.5 rounded-full text-xs font-bold text-amber-300 border border-rose-500">
                  Total Contabilizado: {totalCantidadCalculada} ítems
                </div>
              </div>

              {/* Indicadores Rápidos de Campo & Evaluación de Vivienda */}
              {registroModo !== 'ENTREGA_EXISTENTE' && (
                <div className="p-4 sm:p-5 bg-rose-50/50 border-b border-slate-200 space-y-4">
                  <span className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                    Verificación de Campo e Indicadores de Emergencia:
                  </span>

                  {/* 5 Checkboxes SI/NO: Evacuar, Visita, Censo, Albergue, Red de Apoyo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                    {/* EVACUAR */}
                    <div
                      onClick={handleToggleEvacuar}
                      className={`p-3 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all select-none ${
                        evacuar
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
                      className={`p-3 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all select-none ${
                        visita
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
                      className={`p-3 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all select-none ${
                        censo
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
                      className={`p-3 rounded-2xl border-2 flex items-center justify-between transition-all select-none ${
                        !evacuar
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
                      className={`p-3 rounded-2xl border-2 flex items-center justify-between transition-all select-none ${
                        !evacuar
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

                  {/* Evaluador Global y Desglose por Techo y Estructura */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
                    {/* Resumen Evaluado Global */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <Home className="h-4.5 w-4.5 text-rose-600" />
                        <div>
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                            Evaluación de Afectación de Vivienda (Nivel Global)
                          </span>
                          <p className="text-[11px] text-slate-500">
                            Se auto-calcula al mayor nivel entre Techo y Estructura, o puede ajustarse manualmente.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 italic hidden sm:inline">
                          {userManualDamageLevel ? '(Modificado manualmente)' : '(Consolidado automático)'}
                        </span>
                        <select
                          value={afectacionNivel}
                          onChange={(e) => {
                            setAfectacionNivel(e.target.value as any);
                            setUserManualDamageLevel(true);
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-black outline-none transition-all cursor-pointer ${
                            afectacionNivel === 'Colapso Total'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : afectacionNivel === 'Grave'
                              ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold'
                              : afectacionNivel === 'Leve'
                              ? 'bg-slate-700 text-white border-slate-700 font-extrabold'
                              : 'bg-slate-100 text-slate-700 border-slate-300 font-bold'
                          }`}
                        >
                          <option value="Ninguno">Ninguno / No Evaluado</option>
                          <option value="Leve">Daño Leve</option>
                          <option value="Grave">Daño Grave</option>
                          <option value="Colapso Total">Colapso Total</option>
                        </select>
                      </div>
                    </div>

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
                              <span>1. Afectación en Techo / Cubierta</span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                techoDamageLevel === 'Colapso Total' ? 'bg-rose-600 text-white' :
                                techoDamageLevel === 'Grave' ? 'bg-amber-500 text-slate-950' :
                                techoDamageLevel === 'Leve' ? 'bg-slate-600 text-white' : 'bg-slate-200 text-slate-700'
                              }`}>
                                Nivel: {techoDamageLevel}
                              </span>
                            </h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-amber-900 text-xs font-bold">
                          <span>{isTechoSectionOpen ? 'Ocultar' : 'Desplegar'}</span>
                          {isTechoSectionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </button>

                      {isTechoSectionOpen && (
                        <div className="p-4 space-y-3 bg-white border-t border-amber-200/60 animate-in fade-in slide-in-from-top-2 duration-150">
                          {/* Selector Nivel Techo */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                              Nivel de Daño Específico en Techo:
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {(['Colapso Total', 'Grave', 'Leve', 'Ninguno'] as const).map((lvl) => (
                                <button
                                  key={lvl}
                                  type="button"
                                  onClick={() => actualizarNivelTecho(lvl)}
                                  className={`px-3 py-1 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                                    techoDamageLevel === lvl
                                      ? lvl === 'Colapso Total'
                                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                        : lvl === 'Grave'
                                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                                        : lvl === 'Leve'
                                        ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                                        : 'bg-slate-800 text-white border-slate-800 shadow-xs'
                                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                  }`}
                                >
                                  {lvl === 'Colapso Total' ? '🔴 Colapso Total' : lvl === 'Grave' ? '🟡 Daño Grave' : lvl === 'Leve' ? '⚪ Daño Leve' : '⚪ Ninguno'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Checklist Techo */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                              Seleccionar Afectaciones Específicas en Techo / Cubierta:
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {[
                                'Daño en techo/cubierta (tejas movidas o rotas)',
                                'Colapso parcial de techo/cubierta',
                                'Colapso total de techo/cubierta',
                                'Desprendimiento de cielo raso',
                                'Daño en vidrios/ventanas',
                              ].map((item) => (
                                <label
                                  key={item}
                                  className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                                    selectedSubtipos.includes(item)
                                      ? 'bg-amber-50 border-amber-400 font-extrabold text-amber-950 shadow-2xs'
                                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedSubtipos.includes(item)}
                                    onChange={() => toggleSubtipo(item)}
                                    className="h-4 w-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                                  />
                                  <span className="leading-snug">{item}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Observación Techo */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                              Observación Adicional de Techo (Opcional)
                            </label>
                            <input
                              type="text"
                              placeholder="Ej: Tejas movidas en habitación principal..."
                              value={observacionTecho}
                              onChange={(e) => setObservacionTecho(e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                            />
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
                              <span>2. Afectación en Estructura / Muros</span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                estructuraDamageLevel === 'Colapso Total' ? 'bg-rose-600 text-white' :
                                estructuraDamageLevel === 'Grave' ? 'bg-amber-500 text-slate-950' :
                                estructuraDamageLevel === 'Leve' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                              }`}>
                                Nivel: {estructuraDamageLevel}
                              </span>
                            </h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-rose-900 text-xs font-bold">
                          <span>{isEstructuraSectionOpen ? 'Ocultar' : 'Desplegar'}</span>
                          {isEstructuraSectionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </button>

                      {isEstructuraSectionOpen && (
                        <div className="p-4 space-y-3 bg-white border-t border-rose-200/60 animate-in fade-in slide-in-from-top-2 duration-150">
                          {/* Selector Nivel Estructura */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                              Nivel de Daño Específico en Estructura:
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {(['Colapso Total', 'Grave', 'Leve', 'Ninguno'] as const).map((lvl) => (
                                <button
                                  key={lvl}
                                  type="button"
                                  onClick={() => actualizarNivelEstructura(lvl)}
                                  className={`px-3 py-1 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                                    estructuraDamageLevel === lvl
                                      ? lvl === 'Colapso Total'
                                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                        : lvl === 'Grave'
                                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                                        : lvl === 'Leve'
                                        ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                                        : 'bg-slate-800 text-white border-slate-800 shadow-xs'
                                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                  }`}
                                >
                                  {lvl === 'Colapso Total' ? '🔴 Colapso Total' : lvl === 'Grave' ? '🟡 Daño Grave' : lvl === 'Leve' ? '⚪ Daño Leve' : '⚪ Ninguno'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Checklist Estructura */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                              Seleccionar Afectaciones Específicas en Estructura / Muros:
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {[
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
                              ].map((item) => (
                                <label
                                  key={item}
                                  className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                                    selectedSubtipos.includes(item)
                                      ? 'bg-rose-50 border-rose-400 font-extrabold text-rose-950 shadow-2xs'
                                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedSubtipos.includes(item)}
                                    onChange={() => toggleSubtipo(item)}
                                    className="h-4 w-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                                  />
                                  <span className="leading-snug">{item}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Observación Estructura */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                              Observación Adicional de Estructura (Opcional)
                            </label>
                            <input
                              type="text"
                              placeholder="Ej: Pared lateral agrietada de lado a lado..."
                              value={observacionEstructura}
                              onChange={(e) => setObservacionEstructura(e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Fast Presets & Filters */}
              <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold text-slate-600 uppercase">
                    Paquetes Rápidos de Emergencia:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(PRESET_PACKAGES).map(([key, pkg]) => {
                      const active = isPaqueteActivo(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => aplicarPaqueteRapido(key)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                            active
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
                      placeholder="Buscar por subtipología o palabra clave (ej. cemento, tejas)..."
                      value={busquedaSubtipo}
                      onChange={(e) => setBusquedaSubtipo(e.target.value)}
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
                      <option value={0}>Todas las 10 Categorías de Atención</option>
                      {DISASTER_TYPOLOGIES.map((t) => (
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
                        {tipo.subtipos.map((sub) => {
                          const isChecked = selectedSubtipos.includes(sub.nombre);
                          const cant = cantidadesSubtipos[sub.nombre] || 1;

                          return (
                            <div
                              key={sub.code}
                              onClick={() => toggleSubtipo(sub.nombre)}
                              className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer select-none transition-all ${
                                isChecked
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
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 4: Observaciones Generales y Evidencias Fotográficas Múltiples */}
            <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Observaciones Generales / Especificación del Caso
                </label>
                <textarea
                  rows={2}
                  placeholder="Escriba aquí observaciones adicionales de la familia, condición de salud o requerimientos..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              {/* Cantidad Total cuando es Entrega Directa o Existente */}
              {(registroModo === 'ENTREGA_DIRECTA' || registroModo === 'ENTREGA_EXISTENTE') && (
                <div className="pt-3 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Cantidad Total de Kits / Materiales Contabilizados
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={cantidadAyuda}
                    onChange={(e) => setCantidadAyuda(Number(e.target.value))}
                    className="w-full sm:w-1/2 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              )}

              {/* Evidencias Fotográficas Múltiples (Disponible para Solicitudes y Entregas) */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Camera className="h-4 w-4 text-rose-600" />
                      Evidencias Fotográficas de la Solicitud / Entrega (Múltiples)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Adjunte fotografías de los daños en vivienda, bien afectado o entrega de insumos realizada.
                    </p>
                  </div>
                  <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-xs font-extrabold text-rose-800 cursor-pointer shadow-2xs transition-colors">
                    <Camera className="h-4 w-4 text-rose-600" />
                    <span>+ Adjuntar / Tomar Fotos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleMultiplePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Thumbnail Grid for Multiple Photos */}
                {fotosEntrega.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-slate-700">
                      {fotosEntrega.length} foto(s) adjuntada(s):
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
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
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
                className={`w-full sm:w-auto px-8 py-3.5 text-white rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                  editingSolicitudId ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-blue-700 hover:bg-blue-800'
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
                        ? 'Guardar Censo Oficial'
                        : registroModo === 'ENTREGA_DIRECTA'
                        ? 'Registrar Entrega Inmediata'
                        : 'Completar y Atender Solicitud'}
                    </span>
                  </>
                )}
              </button>
            </div>
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
                className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  mobileMapTab === 'mapa'
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
                className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  mobileMapTab === 'lista'
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <List className="h-4 w-4" />
                <span>Lista ({solicitudesFiltradasMapa.length})</span>
              </button>
            </div>

            {/* Filter Bar (Compact & Collapsible) */}
            <div className="bg-white rounded-3xl p-3.5 sm:p-4 shadow-xs border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={mapSearchQuery}
                    onChange={(e) => setMapSearchQuery(e.target.value)}
                    placeholder="Buscar por cédula, nombre, sector o SOL-ID..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>

                {/* Quick Status Pill */}
                <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setMapEstadoFilter('all')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${mapEstadoFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Todos ({todasSolicitudes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapEstadoFilter('pending')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${mapEstadoFilter === 'pending' ? 'bg-rose-600 text-white shadow-xs font-black' : 'text-rose-700 hover:bg-rose-50'}`}
                  >
                    Pendientes ({solicitudesPendientes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapEstadoFilter('completed')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${mapEstadoFilter === 'completed' ? 'bg-emerald-600 text-white shadow-xs font-black' : 'text-emerald-700 hover:bg-emerald-50'}`}
                  >
                    Atendidas
                  </button>
                </div>

                {/* Filter Controls & Fullscreen */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
                    className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer border ${
                      isAdvancedFiltersOpen || (isHousingDamageFilterActive || isRoofDamageFilterActive || mapZoneFilter !== 'all' || selectedSubtipologiaCodes.length > 0)
                        ? 'bg-blue-50 border-blue-300 text-blue-800'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 text-blue-700" />
                    <span className="hidden sm:inline">Filtros</span>
                    {(isHousingDamageFilterActive || isRoofDamageFilterActive || mapZoneFilter !== 'all' || selectedSubtipologiaCodes.length > 0) && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                    )}
                    {isAdvancedFiltersOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={resetAllMapFilters}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    title="Limpiar filtros"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Limpiar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMapFullScreen(!isMapFullScreen)}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    title="Maximizar pantalla"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Pantalla Completa</span>
                  </button>
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
                        className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                          isHousingDamageFilterActive
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
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                              isSelected && isHousingDamageFilterActive
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
                        className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                          isRoofDamageFilterActive
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
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                              isSelected && isRoofDamageFilterActive
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
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                isPending
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
                              className={`font-black text-[10px] px-2 py-0.5 rounded-md ${
                                sol.afectacion_nivel === 'Colapso Total'
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

                          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => {
                                setDetailedRequestId(sol.id_solicitud);
                                setIsDetailModalOpen(true);
                              }}
                              className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-[11px] py-1.5 px-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5 text-amber-300" />
                              <span>Ver Detalle</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEditarSolicitud(sol)}
                              className="p-1.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center"
                              title="Editar Solicitud"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            {!isCensoOnlyUser && isPending && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRequest(sol);
                                  setRegistroModo('ENTREGA_EXISTENTE');
                                  setActiveTab('formulario');
                                  showToast(`Solicitud ${sol.codigo_solicitud || `SOL-${sol.id_solicitud}`} cargada para atender en formulario.`, 'success');
                                }}
                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] py-1.5 px-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Package className="h-3.5 w-3.5" />
                                <span>Atender</span>
                              </button>
                            )}

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
              <div className={`${mobileMapTab === 'mapa' ? 'flex' : 'hidden'} lg:flex lg:col-span-7 bg-white rounded-3xl p-2.5 sm:p-3 shadow-xs border border-slate-200 transition-all ${isMapFullScreen ? 'fixed inset-2 sm:inset-4 z-[999] shadow-2xl flex flex-col h-auto' : 'h-[68vh] min-h-[460px] lg:h-[620px] flex flex-col'}`}>
                {isMapFullScreen && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">Mapa Georreferenciado - Conteo por Sector</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMapFullScreen(false)}
                      className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      Salir de Pantalla Completa
                    </button>
                  </div>
                )}

                <div className="flex-1 w-full h-full min-h-[350px] rounded-2xl overflow-hidden relative">
                  {/* Floating Direct Map Switcher (Modern Glassmorphism) */}
                  <div className="absolute top-3 right-3 z-[999] bg-slate-950/85 backdrop-blur-md p-1 rounded-2xl shadow-xl border border-slate-700/70 flex items-center gap-1 scale-90 sm:scale-100 origin-top-right">
                    <button
                      type="button"
                      onClick={() => {
                        setMapDisplayMode('sectores');
                        showToast('Modo: Conteo por Sector', 'success');
                      }}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                        mapDisplayMode === 'sectores'
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
                      className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                        mapDisplayMode === 'individual'
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
                      className={`px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                        mapDisplayMode === 'ambos'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                      }`}
                      title="Mostrar ambos"
                    >
                      <Globe2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Ambos</span>
                    </button>
                  </div>

                  <MapContainer
                    center={[5.239971, -75.782206]}
                    zoom={14}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <EmergencyMapController isFullScreen={isMapFullScreen} />
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* 1. Sector Summary Markers with Traffic Light Severity Average & Counts */}
                    {(mapDisplayMode === 'sectores' || mapDisplayMode === 'ambos') &&
                      sectorGeoData.map((sec, idx) => {
                        if (!sec.hasValidCoordinates || sec.latitude === null || sec.longitude === null || sec.requestCount <= 0) return null;
                        const sectorRequests = solicitudesFiltradasMapa.filter((sol) => {
                          if (sol.id_sector && sec.id_sector) {
                            return sol.id_sector === sec.id_sector;
                          }
                          if (!sol.latitud || !sol.longitud) return false;
                          const dLat = sec.latitude! - sol.latitud;
                          const dLng = sec.longitude! - sol.longitud;
                          return dLat * dLat + dLng * dLng < 0.001;
                        });

                        // Promedio de gravedad: Colapso Total = 3, Grave = 2, Leve = 1, Ninguno = 0
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

                        return (
                          <Marker
                            key={`sector-${idx}`}
                            position={[sec.latitude!, sec.longitude!]}
                            title={`Sector: ${sec.name} (${sec.requestCount} solicitudes)`}
                            icon={getSectorSummaryMarkerIcon(sec.requestCount, badgeColor, false)}
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
                                <span className={`w-2 h-2 rounded-full ${badgeColor === 'red' ? 'bg-rose-500 animate-pulse' : badgeColor === 'yellow' ? 'bg-amber-500 animate-pulse' : badgeColor === 'green' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
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
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${badgeColor === 'red' ? 'bg-rose-50 text-rose-700 border-rose-200' : badgeColor === 'yellow' ? 'bg-amber-50 text-amber-800 border-amber-200' : badgeColor === 'green' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                    {sec.requestCount} solicitudes
                                  </span>
                                </div>

                                <div className="space-y-1.5">
                                  {sectorRequests.slice(0, 6).map((sol) => (
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
                        );
                      })}

                    {/* 2. Individual Solicitud Markers */}
                    {(mapDisplayMode === 'individual' || mapDisplayMode === 'ambos') &&
                      solicitudesFiltradasMapa.map((sol) => {
                        if (!sol.latitud || !sol.longitud) return null;
                        const isPending = sol.estado_codigo === 'pending';
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

                            <Popup className="sector-list-popup">
                              <div className="bg-white p-3.5 space-y-2.5 max-w-[280px] rounded-2xl text-slate-900">
                                {/* Popup Header */}
                                <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                                  <span className="font-mono text-xs font-black bg-slate-900 text-white px-2.5 py-0.5 rounded-lg shadow-2xs">
                                    {sol.codigo_solicitud || `SOL-${sol.id_solicitud}`}
                                  </span>
                                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                                    isPending
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
                                    <span className={`font-black text-[10px] px-2 py-0.5 rounded-md ${
                                      sol.afectacion_nivel === 'Colapso Total'
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
                                    onClick={() => handleEditarSolicitud(sol)}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[11px] py-1.5 px-3 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                    <span>Editar esta Solicitud</span>
                                  </button>

                                  {!isCensoOnlyUser && isPending && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedRequest(sol);
                                        setRegistroModo('ENTREGA_EXISTENTE');
                                        setActiveTab('formulario');
                                        showToast(`Solicitud ${sol.codigo_solicitud || `SOL-${sol.id_solicitud}`} cargada para atender en formulario.`, 'success');
                                      }}
                                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] py-1.5 px-3 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
                                    >
                                      <Package className="h-3.5 w-3.5" />
                                      <span>Atender esta Solicitud</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </Popup>
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
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            selectedMapPinSol.estado_codigo === 'pending'
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
                          <span className={`inline-block font-black text-[10px] px-2 py-0.5 rounded mt-0.5 ${
                            selectedMapPinSol.afectacion_nivel === 'Colapso Total'
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
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 3: HISTORIAL ======================= */}
        {activeTab === 'historial' && (
          <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xs border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ListCheck className="h-5 w-5 text-blue-700" />
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  Historial de Registros Realizados en esta Sesión ({historialRegistros.length})
                </h3>
              </div>
            </div>

            {historialRegistros.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100">
                Aún no has realizado registros durante esta sesión.
              </div>
            ) : (
              <div className="space-y-2.5">
                {historialRegistros.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                          {item.codigo_solicitud || item.codigo_entrega || `REG-#${idx + 1}`}
                        </span>
                        <span className="text-xs font-extrabold text-slate-900">{item.mensaje}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {item.id_solicitud && (
                        <button
                          type="button"
                          onClick={() => handleEditarSolicitud(item.id_solicitud)}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Pencil className="h-3 w-3" />
                          <span>Editar</span>
                        </button>
                      )}
                      <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
export default CatastrofesView;
