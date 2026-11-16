import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  MapPin,
  AlertTriangle,
  FileText,
  Users,
  Package,
  CheckCircle2,
  Calendar,
  Phone,
  Shield,
  Home,
  Droplets,
  Camera,
  Loader2,
  PackageCheck,
  Building2,
  Leaf,
  Clock,
  Layers,
  ListCheck,
  CheckCircle,
  Download,
  Eye,
  Pencil,
  Copy,
  ExternalLink,
  Printer,
  Compass,
  Check,
  AlertCircle,
  HeartHandshake,
  Baby,
  Accessibility,
  ClipboardCheck,
  Plus,
  CheckSquare,
  ChevronDown
} from 'lucide-react';
import { sacService } from '../../services/sacService';
import { SolicitudDetailResponse } from '../../types/sac.types';
import { VisitaTecnicaCompletaModal } from './VisitaTecnicaCompletaModal';
import { SeguimientoObraSection } from '../obra/SeguimientoObraSection';

interface Props {
  idSolicitud: number | null;
  initialTab?: 'censo' | 'rufe' | 'familia' | 'insumos' | 'visitas' | 'obra' | 'entregas' | 'fotos';
  onClose: () => void;
  onAtenderSolicitud?: (detail: SolicitudDetailResponse) => void;
  onEditarSolicitud?: (detail: SolicitudDetailResponse) => void;
  onIniciarVisitaTecnica?: (detail: SolicitudDetailResponse) => void;
  onEditarEntrega?: (entrega: any, detail: SolicitudDetailResponse) => void;
  isCensoOnly?: boolean;
}

export const SolicitudDetailModal: React.FC<Props> = ({
  idSolicitud,
  initialTab = 'censo',
  onClose,
  onAtenderSolicitud,
  onEditarSolicitud,
  onIniciarVisitaTecnica,
  onEditarEntrega,
  isCensoOnly = false,
}) => {
  const [detail, setDetail] = useState<SolicitudDetailResponse | any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'censo' | 'rufe' | 'familia' | 'insumos' | 'visitas' | 'obra' | 'entregas' | 'fotos'>(initialTab);
  const [savingMateriales, setSavingMateriales] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [copiedGps, setCopiedGps] = useState(false);
  const [copiedDoc, setCopiedDoc] = useState(false);
  const [expandedVisitaId, setExpandedVisitaId] = useState<number | null>(null);

  // Visitas Técnicas de Verificación State
  const [isVisitaModalOpen, setIsVisitaModalOpen] = useState(false);
  const [savingVisita, setSavingVisita] = useState(false);
  const [visitaForm, setVisitaForm] = useState({
    profesional_responsable: '',
    cargo_responsable: 'Técnico / Ingeniero Gestión del Riesgo',
    dictamen_tecnico: 'MODERADO',
    afectacion_muros: 'Parcial',
    afectacion_techos: 'Parcial',
    afectacion_pisos: 'Ninguno',
    requiere_evacuacion: false,
    requiere_demolicion: false,
    costo_estimado_danos: 0,
    observaciones_tecnicas: ''
  });

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (idSolicitud) {
      loadDetail();
    }
  }, [idSolicitud]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const data = await sacService.getSolicitudDetail(idSolicitud!);
      setDetail(data);
    } catch (err: any) {
      console.error('Error cargando información de la solicitud', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarVisitaCompleta = async (payload: any) => {
    setSavingVisita(true);
    try {
      await sacService.registrarVisitaTecnica(idSolicitud!, payload);
      setIsVisitaModalOpen(false);
      loadDetail();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al registrar visita técnica');
    } finally {
      setSavingVisita(false);
    }
  };

  const handleGuardarVisita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitaForm.profesional_responsable.trim()) {
      alert('Debes ingresar el nombre del profesional responsable.');
      return;
    }
    setSavingVisita(true);
    try {
      await sacService.registrarVisitaTecnica(idSolicitud!, visitaForm);
      setIsVisitaModalOpen(false);
      setVisitaForm({
        profesional_responsable: '',
        cargo_responsable: 'Técnico / Ingeniero Gestión del Riesgo',
        dictamen_tecnico: 'MODERADO',
        afectacion_muros: 'Parcial',
        afectacion_techos: 'Parcial',
        afectacion_pisos: 'Ninguno',
        requiere_evacuacion: false,
        requiere_demolicion: false,
        costo_estimado_danos: 0,
        observaciones_tecnicas: ''
      });
      loadDetail();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al registrar visita técnica');
    } finally {
      setSavingVisita(false);
    }
  };

  const formatFecha = (fechaStr?: string | null) => {
    if (!fechaStr) return 'Fecha no registrada';
    try {
      const date = new Date(fechaStr);
      if (isNaN(date.getTime())) return fechaStr;
      return new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(date);
    } catch {
      return fechaStr;
    }
  };

  const formatFechaCorta = (fechaStr?: string | null) => {
    if (!fechaStr) return '-';
    try {
      const date = new Date(fechaStr);
      if (isNaN(date.getTime())) return fechaStr;
      return new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    } catch {
      return fechaStr;
    }
  };

  const handleCopyGps = () => {
    if (detail?.latitud_gps && detail?.longitud_gps) {
      navigator.clipboard.writeText(`${detail.latitud_gps}, ${detail.longitud_gps}`);
      setCopiedGps(true);
      setTimeout(() => setCopiedGps(false), 2000);
    }
  };

  const handleCopyDoc = () => {
    if (detail?.ciudadano?.documento) {
      navigator.clipboard.writeText(detail.ciudadano.documento);
      setCopiedDoc(true);
      setTimeout(() => setCopiedDoc(false), 2000);
    }
  };

  if (!idSolicitud) return null;

  const isAtendida = detail?.id_estado === 3 || detail?.nombre_estado?.toLowerCase().includes('atendida');

  // Nivel de daño consolidado
  const nivelConsolidado = detail?.evaluacion_dano?.nivel_afectacion_vivienda || 'Sin Evaluar';
  const nivelTecho = detail?.evaluacion_dano?.nivel_afectacion_techo || 'Ninguno';

  // Condición en la vivienda
  const condicionVivienda =
    detail?.formulario_rufe?.forma_tenencia ||
    (detail?.nucleo_familiar?.es_propietario !== undefined
      ? detail.nucleo_familiar.es_propietario
        ? 'Propietario'
        : 'Arrendatario / Poseedor'
      : 'Arrendatario / Poseedor');

  return (
    <>
      <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden my-auto">
          {/* Header Institucional */}
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 sm:px-7 py-4.5 border-b border-slate-200 bg-white">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs font-black bg-slate-950 text-white px-3 py-1 rounded-xl shadow-xs">
                  {detail?.codigo_solicitud || `SOL-${idSolicitud}`}
                </span>

                {isAtendida ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 font-black text-xs px-3 py-1 rounded-full shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>ATENDIDA (Con Entrega)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-800 border border-rose-300 font-black text-xs px-3 py-1 rounded-full shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <span>PENDIENTE (Sin Entrega)</span>
                  </span>
                )}

                {detail?.sector && (
                  <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-emerald-600" />
                    <span>{detail.sector.nombre_sector}</span>
                    <span className="text-slate-400">({detail.sector.tipo_sector || 'Sector'})</span>
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-950 tracking-tight flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-700" />
                  <span>Expediente Oficial de Atención a Emergencia</span>
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Fecha de Registro:</span>
                  <span className="font-bold text-slate-700">{formatFecha(detail?.fecha_solicitud)}</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (onIniciarVisitaTecnica && detail) {
                    onClose();
                    onIniciarVisitaTecnica(detail);
                  } else {
                    setIsVisitaModalOpen(true);
                  }
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                title="Realizar visita técnica para re-evaluar la vivienda y verificar lo reportado"
              >
                <ClipboardCheck className="h-3.5 w-3.5" />
                <span>Visita Técnica ({detail?.visitas_tecnicas?.length || 0})</span>
              </button>

              {onEditarSolicitud && detail && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEditarSolicitud(detail);
                  }}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                  title="Editar datos de la solicitud y censo"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Editar Solicitud</span>
                </button>
              )}

              {!isCensoOnly && !isAtendida && onAtenderSolicitud && detail && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAtenderSolicitud(detail);
                  }}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                >
                  <Package className="h-3.5 w-3.5" />
                  <span>Atender Solicitud</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                title="Imprimir Expediente"
              >
                <Printer className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navegación por Pestañas Institucionales */}
          <div className="border-b border-slate-200 bg-slate-50/90 px-3 sm:px-6 pt-2 select-none overflow-hidden">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('censo')}
                className={`py-2 px-1.5 sm:px-2 text-[11px] sm:text-xs font-extrabold rounded-t-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center ${
                  activeTab === 'censo'
                    ? 'bg-white border-t-2 border-x border-t-blue-600 border-x-slate-200 text-blue-900 shadow-2xs font-black -mb-[1px]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Home className={`h-3.5 w-3.5 shrink-0 ${activeTab === 'censo' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="truncate">Evaluación</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('rufe')}
                className={`py-2 px-1.5 sm:px-2 text-[11px] sm:text-xs font-extrabold rounded-t-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center ${
                  activeTab === 'rufe'
                    ? 'bg-white border-t-2 border-x border-t-blue-600 border-x-slate-200 text-blue-900 shadow-2xs font-black -mb-[1px]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Shield className={`h-3.5 w-3.5 shrink-0 ${activeTab === 'rufe' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="truncate">RUFE UNGRD</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('familia')}
                className={`py-2 px-1.5 sm:px-2 text-[11px] sm:text-xs font-extrabold rounded-t-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center ${
                  activeTab === 'familia'
                    ? 'bg-white border-t-2 border-x border-t-blue-600 border-x-slate-200 text-blue-900 shadow-2xs font-black -mb-[1px]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Users className={`h-3.5 w-3.5 shrink-0 ${activeTab === 'familia' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="truncate">Núcleo Familiar</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('insumos')}
                className={`py-2 px-1.5 sm:px-2 text-[11px] sm:text-xs font-extrabold rounded-t-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center ${
                  activeTab === 'insumos'
                    ? 'bg-white border-t-2 border-x border-t-blue-600 border-x-slate-200 text-blue-900 shadow-2xs font-black -mb-[1px]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <ListCheck className={`h-3.5 w-3.5 shrink-0 ${activeTab === 'insumos' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="truncate">Insumos ({detail?.items_solicitados?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('visitas')}
                className={`py-2 px-1.5 sm:px-2 text-[11px] sm:text-xs font-extrabold rounded-t-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center ${
                  activeTab === 'visitas'
                    ? 'bg-white border-t-2 border-x border-t-blue-600 border-x-slate-200 text-blue-900 shadow-2xs font-black -mb-[1px]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <ClipboardCheck className={`h-3.5 w-3.5 shrink-0 ${activeTab === 'visitas' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="truncate">Visitas Técnicas ({detail?.visitas_tecnicas?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('obra')}
                className={`py-2 px-1.5 sm:px-2 text-[11px] sm:text-xs font-extrabold rounded-t-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center ${
                  activeTab === 'obra'
                    ? 'bg-white border-t-2 border-x border-t-blue-600 border-x-slate-200 text-blue-900 shadow-2xs font-black -mb-[1px]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Building2 className={`h-3.5 w-3.5 shrink-0 ${activeTab === 'obra' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="truncate">Obra y Reconstrucción</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('entregas')}
                className={`py-2 px-1.5 sm:px-2 text-[11px] sm:text-xs font-extrabold rounded-t-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center ${
                  activeTab === 'entregas'
                    ? 'bg-white border-t-2 border-x border-t-blue-600 border-x-slate-200 text-blue-900 shadow-2xs font-black -mb-[1px]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <PackageCheck className={`h-3.5 w-3.5 shrink-0 ${activeTab === 'entregas' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="truncate">Entregas ({detail?.entregas?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('fotos')}
                className={`py-2 px-1.5 sm:px-2 text-[11px] sm:text-xs font-extrabold rounded-t-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center ${
                  activeTab === 'fotos'
                    ? 'bg-white border-t-2 border-x border-t-blue-600 border-x-slate-200 text-blue-900 shadow-2xs font-black -mb-[1px]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Camera className={`h-3.5 w-3.5 shrink-0 ${activeTab === 'fotos' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="truncate">Fotos ({detail?.fotos?.length || 0})</span>
              </button>
            </div>
          </div>

          {/* Cuerpo del Modal */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 bg-slate-50/50">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-500 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
                <p className="text-xs font-bold">Cargando expediente institucional estructurado...</p>
              </div>
            ) : detail ? (
              <>
                {/* ==================== PESTAÑA 1: EVALUACIÓN & UBICACIÓN ==================== */}
                {activeTab === 'censo' && (
                  <div className="space-y-4">
                    {/* Grid Identificación + Ubicación */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 1. Datos del Ciudadano */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wide">
                            <User className="h-4 w-4 text-blue-700" />
                            <span>Identificación del Beneficiario</span>
                          </div>
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200">
                            Titular
                          </span>
                        </div>

                        <div className="space-y-2 text-xs text-slate-700">
                          <div>
                            <span className="text-[11px] text-slate-500 block font-bold">Nombre Completo</span>
                            <span className="font-black text-sm text-slate-900 block">
                              {detail.ciudadano.nombres} {detail.ciudadano.apellidos}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                            <div>
                              <span className="text-[11px] text-slate-500 block font-bold">Documento de Identidad</span>
                              <span className="font-mono font-black text-xs text-slate-800">
                                {detail.ciudadano.documento}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handleCopyDoc}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                              title="Copiar Documento"
                            >
                              {copiedDoc ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                              <span>{copiedDoc ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                            <div>
                              <span className="text-[11px] text-slate-500 block font-bold">Teléfono de Contacto</span>
                              <span className="font-bold text-xs text-slate-800">
                                {detail.ciudadano.telefono || 'No registrado'}
                              </span>
                            </div>
                            {detail.ciudadano.telefono && (
                              <a
                                href={`tel:${detail.ciudadano.telefono}`}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                              >
                                <Phone className="h-3 w-3" />
                                <span>Llamar</span>
                              </a>
                            )}
                          </div>

                          <div className="pt-1 border-t border-slate-100">
                            <span className="text-[11px] text-slate-500 block font-bold">Condición en la Vivienda</span>
                            <span className="inline-flex items-center gap-1.5 font-black text-xs text-blue-900 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200/80 mt-0.5">
                              <Home className="h-3.5 w-3.5 text-blue-700" />
                              <span>{condicionVivienda}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Ubicación y Sector */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wide">
                            <MapPin className="h-4 w-4 text-emerald-600" />
                            <span>Ubicación y Georreferenciación</span>
                          </div>
                          <span
                            className={`font-black text-[10px] px-2.5 py-0.5 rounded-full border ${
                              detail.sector.tipo_sector === 'Rural'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-sky-50 text-sky-800 border-sky-300'
                            }`}
                          >
                            {detail.sector.tipo_sector === 'Rural' ? '🌳 Zona Rural' : '🏢 Zona Urbana'}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs text-slate-700">
                          <div>
                            <span className="text-[11px] text-slate-500 block font-bold">Sector / Vereda / Barrio</span>
                            <span className="font-black text-sm text-slate-900 block">
                              {detail.sector.nombre_sector}
                            </span>
                          </div>

                          <div className="pt-1 border-t border-slate-100">
                            <span className="text-[11px] text-slate-500 block font-bold">Dirección o Referencia</span>
                            <span className="font-bold text-xs text-slate-800 block">
                              {detail.direccion_afectacion || 'No especificada en el censo'}
                            </span>
                          </div>

                          {detail.observaciones_sector && (
                            <div className="pt-1 border-t border-slate-100">
                              <span className="text-[11px] text-slate-500 block font-bold">Punto de Referencia</span>
                              <p className="italic text-xs text-slate-600">
                                "{detail.observaciones_sector}"
                              </p>
                            </div>
                          )}

                          {detail.latitud_gps && detail.longitud_gps ? (
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                              <div>
                                <span className="text-[11px] text-slate-500 block font-bold">Coordenadas GPS</span>
                                <span className="font-mono text-xs font-bold text-slate-700">
                                  {Number(detail.latitud_gps).toFixed(5)}, {Number(detail.longitud_gps).toFixed(5)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={handleCopyGps}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                                  title="Copiar Coordenadas"
                                >
                                  {copiedGps ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                  <span>{copiedGps ? 'Copiado' : 'Copiar'}</span>
                                </button>
                                <a
                                  href={`https://www.google.com/maps?q=${detail.latitud_gps},${detail.longitud_gps}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                                >
                                  <Compass className="h-3 w-3" />
                                  <span>Mapa</span>
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-1 border-t border-slate-100 text-slate-400 italic text-[11px]">
                              Sin georreferenciación GPS exacta registrada.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 3. Evaluación Física y Estructural de Daños */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wide">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <span>Evaluación Estructural de Daños</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-bold">Nivel Consolidado:</span>
                          <span
                            className={`text-xs font-black px-3 py-1 rounded-xl shadow-2xs ${
                              nivelConsolidado === 'Colapso Total'
                                ? 'bg-rose-600 text-white shadow-rose-200'
                                : nivelConsolidado === 'Grave'
                                ? 'bg-amber-500 text-slate-950 font-black'
                                : nivelConsolidado === 'Leve'
                                ? 'bg-slate-700 text-white'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            {nivelConsolidado === 'Colapso Total'
                              ? '🔴 Colapso Total'
                              : nivelConsolidado === 'Grave'
                              ? '🟡 Daño Grave'
                              : nivelConsolidado === 'Leve'
                              ? '⚪ Daño Leve'
                              : '🟢 Ninguno / Sin Daño Reportado'}
                          </span>
                        </div>
                      </div>

                      {/* 4 Indicadores Rápidos de Evaluación */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                            Daño Vivienda
                          </span>
                          <span
                            className={`text-xs font-black block ${
                              nivelConsolidado === 'Colapso Total'
                                ? 'text-rose-700'
                                : nivelConsolidado === 'Grave'
                                ? 'text-amber-700'
                                : nivelConsolidado === 'Leve'
                                ? 'text-slate-800'
                                : 'text-slate-600'
                            }`}
                          >
                            {nivelConsolidado}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                            Daño Techo
                          </span>
                          <span
                            className={`text-xs font-black block ${
                              nivelTecho === 'Colapso Total'
                                ? 'text-rose-700'
                                : nivelTecho === 'Grave'
                                ? 'text-amber-700'
                                : nivelTecho === 'Leve'
                                ? 'text-slate-800'
                                : 'text-slate-600'
                            }`}
                          >
                            {nivelTecho}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                            Evacuación
                          </span>
                          <span
                            className={`text-xs font-black block ${
                              detail.evaluacion_dano?.requiere_evacuacion ? 'text-rose-700' : 'text-slate-700'
                            }`}
                          >
                            {detail.evaluacion_dano?.requiere_evacuacion ? '🚨 SÍ (Requerida)' : '🛡️ NO'}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                            Albergue
                          </span>
                          <span
                            className={`text-xs font-black block ${
                              detail.evaluacion_dano?.requiere_albergue ? 'text-amber-700' : 'text-slate-700'
                            }`}
                          >
                            {detail.evaluacion_dano?.requiere_albergue ? '⛺ SÍ (Requerido)' : '🛡️ NO'}
                          </span>
                        </div>
                      </div>

                      {/* Metadatos de Validación Técnica */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
                        <span className="text-slate-500 font-bold">Verificaciones en Terreno:</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] border ${
                            detail.evaluacion_dano?.visita_campo_realizada
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {detail.evaluacion_dano?.visita_campo_realizada ? '✓ Visita de Campo Realizada' : '⏳ Visita Pendiente'}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] border ${
                            detail.evaluacion_dano?.censo_oficial_realizado
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {detail.evaluacion_dano?.censo_oficial_realizado ? '✓ Censo Oficial Formalizado' : '⏳ En Registro'}
                        </span>

                        {detail.evaluacion_dano?.cuenta_red_apoyo !== undefined && (
                          <span
                            className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] border ${
                              detail.evaluacion_dano.cuenta_red_apoyo
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {detail.evaluacion_dano.cuenta_red_apoyo ? '👨‍👩‍👦 Con Red de Apoyo Familiar' : 'Sin Red de Apoyo'}
                          </span>
                        )}
                      </div>

                      {/* Observaciones y Diagnóstico de Daños */}
                      {detail.evaluacion_dano?.observaciones_dano && (
                        <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 text-xs space-y-1">
                          <span className="font-black text-amber-950 block">
                            Diagnóstico y Observaciones de Daño Estructural:
                          </span>
                          <p className="text-slate-800 leading-relaxed font-medium">
                            {detail.evaluacion_dano.observaciones_dano}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 4. Caracterización Jurídica de Tenencia y Catastro */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wide">
                          <Building2 className="h-4 w-4 text-indigo-700" />
                          <span>Tenencia Jurídica y Ficha Catastral</span>
                        </div>
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-800 px-2.5 py-0.5 rounded-md border border-indigo-200">
                          Derechos de Asistencia
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            Modalidad de Tenencia del Afectado
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900">
                              {detail.tipo_tenencia === 'PROPIETARIO_RESIDENTE'
                                ? 'Propietario Residente'
                                : detail.tipo_tenencia === 'ARRENDATARIO'
                                ? 'Arrendatario / Inquilino'
                                : detail.tipo_tenencia === 'PROPIETARIO_NO_RESIDENTE'
                                ? 'Propietario No Residente'
                                : detail.condicion_vivienda || 'No especificada'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              detail.tipo_tenencia === 'ARRENDATARIO'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : detail.tipo_tenencia === 'PROPIETARIO_RESIDENTE'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              {detail.tipo_tenencia === 'ARRENDATARIO'
                                ? 'Subsidio Arriendo + Kits'
                                : detail.tipo_tenencia === 'PROPIETARIO_RESIDENTE'
                                ? 'Kits + Subsidios + Reconstrucción'
                                : detail.tipo_tenencia === 'PROPIETARIO_NO_RESIDENTE'
                                ? 'Solo Reconstrucción Estructural'
                                : 'Titular'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1">
                            {detail.tipo_tenencia === 'ARRENDATARIO'
                              ? 'El arrendatario es el titular receptor del auxilio de arrendamiento temporal y ayudas de asistencia humanitaria inmediata.'
                              : detail.tipo_tenencia === 'PROPIETARIO_RESIDENTE'
                              ? 'Habita el predio afectado; tiene derecho integral a kits, subsidios de evacuación y programas de reconstrucción.'
                              : detail.tipo_tenencia === 'PROPIETARIO_NO_RESIDENTE'
                              ? 'No habita el inmueble. Su derecho se orienta a la reclamación de afectación de bienes inmuebles para obras públicas/reparación, no a kits de subsistencia alimentaria.'
                              : 'Condición declarada en el censo unificado.'}
                          </p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            Ficha Catastral / Matrícula Inmobiliaria
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-900 block">
                            {detail.ficha_catastral || 'Sin número de ficha catastral registrado'}
                          </span>
                          <span className="text-[11px] text-slate-500 mt-1 block">
                            Número de identificación predial ante la Oficina de Catastro y Registro de Instrumentos Públicos.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 5. Afectación en Locales Comerciales (Si Aplica) */}
                    {(detail.es_local_comercial || detail.comercio_razon_social) && (
                      <div className="bg-white rounded-2xl border border-amber-200 p-4 sm:p-5 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
                          <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wide">
                            <Building2 className="h-4 w-4 text-amber-700" />
                            <span>Afectación en Establecimiento de Comercio</span>
                          </div>
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-md border border-amber-300">
                            Sector Productivo y Comercial
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
                            <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">
                              Razón Social / Nombre del Negocio
                            </span>
                            <span className="font-bold text-slate-900 block">
                              {detail.comercio_razon_social || 'Comercio local sin registro'}
                            </span>
                            <span className="text-[11px] text-slate-600 block mt-1">
                              NIT / RUT: <strong className="font-mono">{detail.comercio_nit_rut || 'No registra'}</strong>
                            </span>
                          </div>

                          <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
                            <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">
                              Pérdidas de Mercancía / Inventario
                            </span>
                            <p className="text-[11px] text-slate-800 leading-relaxed font-medium">
                              {detail.comercio_afectacion_mercancia || 'No se registraron daños específicos a inventarios o vitrinas.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 6. Datos de Representación Comunitaria / JAC (Si Aplica) */}
                    {(detail.tipo_destinatario === 'COMUNIDAD' || detail.comunidad_jac_nombre) && (
                      <div className="bg-white rounded-2xl border border-blue-200 p-4 sm:p-5 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                          <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xs uppercase tracking-wide">
                            <Users className="h-4 w-4 text-blue-700" />
                            <span>Junta de Acción Comunal / Solicitud Comunitaria</span>
                          </div>
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-md border border-blue-300">
                            Organización Comunal
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                            <span className="text-[10px] font-bold text-blue-800 uppercase block mb-1">Nombre JAC / Sector</span>
                            <span className="font-bold text-slate-900 block">{detail.comunidad_jac_nombre || '-'}</span>
                          </div>
                          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                            <span className="text-[10px] font-bold text-blue-800 uppercase block mb-1">Personería Jurídica</span>
                            <span className="font-mono font-bold text-slate-900 block">{detail.comunidad_jac_personeria || 'En trámite'}</span>
                          </div>
                          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                            <span className="text-[10px] font-bold text-blue-800 uppercase block mb-1">Representante Legal</span>
                            <span className="font-bold text-slate-900 block">{detail.comunidad_jac_representante || detail.ciudadano?.nombre_completo}</span>
                            <span className="text-[11px] text-slate-600 block mt-0.5">Tel: {detail.comunidad_jac_telefono || detail.ciudadano?.telefono || '-'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 7. Infraestructura Rural y Fincas Agropecuarias (Si Aplica) */}
                    {Array.isArray(detail.infraestructuras_rurales) && detail.infraestructuras_rurales.length > 0 && (
                      <div className="bg-white rounded-2xl border border-emerald-200 p-4 sm:p-5 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
                          <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs uppercase tracking-wide">
                            <Leaf className="h-4 w-4 text-emerald-700" />
                            <span>Infraestructuras Rurales y Productivas de la Finca</span>
                          </div>
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-md border border-emerald-300">
                            {detail.infraestructuras_rurales.length} instalaciones evaluadas
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {detail.infraestructuras_rurales.map((infra: any, idx: number) => (
                            <div key={idx} className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-200 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-emerald-950">{infra.tipo_infraestructura}</span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                  infra.estado_dano === 'Colapso Total'
                                    ? 'bg-rose-100 text-rose-800'
                                    : infra.estado_dano === 'Grave'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {infra.estado_dano}
                                </span>
                              </div>
                              {infra.observaciones && (
                                <p className="text-[11px] text-slate-700 italic">"{infra.observaciones}"</p>
                              )}
                              {infra.costo_estimado_reparacion > 0 && (
                                <div className="text-[11px] font-bold text-slate-900 pt-1 border-t border-emerald-100">
                                  Costo est: $ {Number(infra.costo_estimado_reparacion).toLocaleString()} COP
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* BANCO DE MATERIALES GOBIERNO DE ANSERMA (Visualización y Aprobación Directa) */}
                    {(() => {
                      const rawBm: any[] = detail.evaluacion_dano?.banco_materiales_json || detail.banco_materiales_json || [];
                      const materialesActivos = Array.isArray(rawBm)
                        ? rawBm.filter((m) => m.seleccionado || Number(m.cantidad) > 0 || m.aprobado)
                        : [];
                      const solicitadoPor =
                        detail.evaluacion_dano?.solicitado_por_materiales ||
                        detail.solicitado_por_materiales ||
                        `${detail.ciudadano?.nombres || ''} ${detail.ciudadano?.apellidos || ''}`.trim();

                      return (
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-blue-50 text-[#0071e3] border border-blue-100">
                                <PackageCheck className="h-4 w-4" />
                              </div>
                              <span className="text-xs font-extrabold text-slate-900">
                                Banco de Materiales — Gobierno de Anserma
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#0071e3] text-[11px] font-bold">
                                {materialesActivos.length} solicitado(s)
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                                {materialesActivos.filter((m) => m.aprobado).length} aprobado(s)
                              </span>
                            </div>
                          </div>

                          <div className="p-4 space-y-3 text-xs">
                            {materialesActivos.length === 0 ? (
                              <div className="py-4 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                                No se han solicitado materiales en el Banco de Materiales para esta evaluación.
                              </div>
                            ) : (
                              <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-50 text-slate-600 text-[10px] font-bold uppercase border-b border-slate-200">
                                    <tr>
                                      <th className="py-2.5 px-3">Tipo de Material</th>
                                      <th className="py-2.5 px-3 text-center">Cantidad</th>
                                      <th className="py-2.5 px-3">Tipo / Especificación</th>
                                      <th className="py-2.5 px-3 text-center">Estado / Aprobado</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {rawBm.map((mat, idx) => {
                                      if (!mat.seleccionado && !(Number(mat.cantidad) > 0) && !mat.aprobado) return null;
                                      return (
                                        <tr key={idx} className="hover:bg-slate-50">
                                          <td className="py-2.5 px-3 font-bold text-slate-900">{mat.material}</td>
                                          <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-700">{mat.cantidad || 1}</td>
                                          <td className="py-2.5 px-3 text-slate-700">{mat.tipo || 'Estándar'}</td>
                                          <td className="py-2.5 px-3 text-center">
                                            <button
                                              type="button"
                                              disabled={savingMateriales}
                                              onClick={async () => {
                                                try {
                                                  setSavingMateriales(true);
                                                  const updatedList = [...rawBm];
                                                  updatedList[idx] = { ...updatedList[idx], aprobado: !updatedList[idx].aprobado };
                                                  await sacService.actualizarBancoMateriales(detail.id_solicitud, {
                                                    banco_materiales_json: updatedList,
                                                    solicitado_por_materiales: solicitadoPor,
                                                  });
                                                  await loadDetail();
                                                } catch (e) {
                                                  console.error('Error actualizando aprobación de material', e);
                                                } finally {
                                                  setSavingMateriales(false);
                                                }
                                              }}
                                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1 ${
                                                mat.aprobado
                                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                              }`}
                                              title="Clic para aprobar o desaprobar este material"
                                            >
                                              {mat.aprobado ? (
                                                <>
                                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                                  <span>Aprobado</span>
                                                </>
                                              ) : (
                                                <span>Pendiente (Clic para Aprobar)</span>
                                              )}
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                              <span>
                                <strong className="uppercase text-slate-600">Solicitado por:</strong>{' '}
                                <span className="font-bold text-slate-900">{solicitadoPor || 'No especificado'}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ==================== PESTAÑA 2: FORMULARIO RUFE UNGRD ==================== */}
                {activeTab === 'rufe' && (
                  <div className="space-y-4">
                    {/* Header Banner Oficial RUFE */}
                    <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 rounded-2xl border border-indigo-700 shadow-md flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-amber-400" />
                          <h4 className="text-sm font-black uppercase tracking-wider text-amber-300">
                            Formulario Oficial UNGRD RUFE (FR-1703-SMD-69)
                          </h4>
                          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                            VERSIÓN 01
                          </span>
                        </div>
                        <p className="text-xs text-indigo-200 mt-1">
                          Registro Unifamiliar de Emergencias para la Caracterización y Ayuda Humanitaria en Colombia.
                        </p>
                      </div>

                      {detail.formulario_rufe?.vobo_cmgrd && (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-xs">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Vo.Bo. CMGRD / CDGRD Aprobado</span>
                        </span>
                      )}
                    </div>

                    {/* Bloque 1: Forma de Tenencia, Enfoque de la Solicitud, Ficha Catastral y Estado del Bien */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                      <h5 className="text-xs font-black text-indigo-950 uppercase tracking-wide border-b border-slate-100 pb-2">
                        1. Tenencia, Enfoque de la Solicitud, Ficha Catastral y Estado del Bien Afectado
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200">
                          <span className="text-[10px] font-bold text-indigo-700 uppercase block mb-1">Modalidad de Tenencia</span>
                          <span className="text-xs font-black text-indigo-950 block">
                            {detail.tipo_tenencia === 'PROPIETARIO_RESIDENTE' || detail.tipo_tenencia === 'PROPIETARIO_HABITANTE'
                              ? 'Propietario Residente'
                              : detail.tipo_tenencia === 'ARRENDATARIO'
                                ? 'Arrendatario / Inquilino'
                                : detail.tipo_tenencia === 'PROPIETARIO_NO_RESIDENTE' || detail.tipo_tenencia === 'PROPIETARIO_NO_HABITANTE'
                                  ? 'Propietario No Residente'
                                  : detail.formulario_rufe?.forma_tenencia || condicionVivienda}
                          </span>
                        </div>
                        <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200">
                          <span className="text-[10px] font-bold text-blue-700 uppercase block mb-1">Enfoque de la Solicitud</span>
                          <span className="text-xs font-black text-blue-950 block">
                            {detail.subtipo_emergencia === 'SOCIAL'
                              ? 'Solo Asistencia Social'
                              : detail.subtipo_emergencia === 'INMUEBLE'
                                ? 'Solo Inmueble / Material'
                                : 'Social y de Inmueble (Integral)'}
                          </span>
                        </div>
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ficha Catastral</span>
                          <span className="text-xs font-mono font-black text-slate-900 block">
                            {detail.ficha_catastral || 'No registrada'}
                          </span>
                        </div>
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tipo de Bien</span>
                          <span className="text-xs font-black text-slate-900 block">
                            {detail.formulario_rufe?.tipo_bien || 'Vivienda'}
                          </span>
                        </div>
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Estado del Bien</span>
                          <span
                            className={`text-xs font-black block ${
                              detail.formulario_rufe?.estado_bien === 'DESTRUIDO'
                                ? 'text-rose-700'
                                : detail.formulario_rufe?.estado_bien === 'NO HABITABLE'
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {detail.formulario_rufe?.estado_bien || 'Habitable'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bloque 2: Información Demográfica - Integrantes del Hogar RUFE */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
                        <h5 className="text-xs font-black text-indigo-950 uppercase tracking-wide flex items-center gap-2">
                          <Users className="h-4 w-4 text-indigo-600" />
                          <span>2. Información Demográfica (Integrantes del Hogar RUFE)</span>
                        </h5>
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-black px-2.5 py-0.5 rounded-full">
                          {((detail.formulario_rufe?.integrantes || detail.nucleo_familiar?.integrantes) || []).length} integrante(s)
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                            <tr>
                              <th scope="col" className="py-2.5 px-3 w-10 text-center">#</th>
                              <th scope="col" className="py-2.5 px-3">Nombre(s) y Apellido(s)</th>
                              <th scope="col" className="py-2.5 px-3">Documento de Identidad</th>
                              <th scope="col" className="py-2.5 px-3">Fecha de Nacimiento</th>
                              <th scope="col" className="py-2.5 px-3">Parentesco</th>
                              <th scope="col" className="py-2.5 px-3 text-center">Género</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-800">
                            {((detail.formulario_rufe?.integrantes || detail.nucleo_familiar?.integrantes) || []).map((fam, idx) => (
                              <tr key={idx} className="hover:bg-indigo-50/40 transition-colors">
                                <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px] font-bold text-center">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3">
                                  <strong className="text-slate-900 font-extrabold flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                    {fam.nombres} {fam.apellidos || ''}
                                  </strong>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-700 font-bold">
                                  {fam.tipo_documento ? `${fam.tipo_documento} ` : ''}{fam.documento || '-'}
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-1.5 font-mono text-slate-800">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <span>{fam.fecha_nacimiento || '-'}</span>
                                    {fam.edad && (
                                      <span className="text-[10px] text-slate-500 font-sans font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                                        ({fam.edad} años)
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-black ${
                                    fam.parentesco.toLowerCase().includes('jefe')
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : fam.parentesco.toLowerCase().includes('presidente') || fam.parentesco.toLowerCase().includes('jac')
                                      ? 'bg-purple-100 text-purple-800'
                                      : fam.parentesco.toLowerCase().includes('cónyuge') || fam.parentesco.toLowerCase().includes('pareja')
                                      ? 'bg-blue-100 text-blue-800'
                                      : fam.parentesco.toLowerCase().includes('hijo')
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {fam.parentesco}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="text-slate-600 font-bold">{fam.genero || '-'}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Bloque 3: Sector Agropecuario */}
                    {detail.formulario_rufe?.tiene_afectacion_agropecuaria && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                        <h5 className="text-xs font-black text-indigo-950 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-1.5">
                          <Leaf className="h-4 w-4 text-emerald-600" />
                          <span>3. Sector Agropecuario (Pérdidas de Cultivos y Pecuario RUFE)</span>
                        </h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-slate-500 font-bold block mb-0.5">Tipo de Cultivo:</span>
                            <span className="font-extrabold text-slate-900">{detail.formulario_rufe.tipo_cultivo || '-'}</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-slate-500 font-bold block mb-0.5">Área Afectada:</span>
                            <span className="font-extrabold text-slate-900">
                              {detail.formulario_rufe.area_cultivo_afectada} {detail.formulario_rufe.unidad_area_cultivo || 'Hectáreas'}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-slate-500 font-bold block mb-0.5">Especie Pecuaria:</span>
                            <span className="font-extrabold text-slate-900">{detail.formulario_rufe.especie_pecuaria || '-'}</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-slate-500 font-bold block mb-0.5">Animales Afectados:</span>
                            <span className="font-extrabold text-slate-900">{detail.formulario_rufe.cantidad_animales_afectados || 0}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ==================== PESTAÑA 3: NÚCLEO FAMILIAR ==================== */}
                {activeTab === 'familia' && (
                  <div className="space-y-4">
                    {/* Resumen Demográfico del Hogar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Edad Jefe Hogar</span>
                        <span className="text-lg font-black text-slate-900">{detail.nucleo_familiar?.edad_jefe_hogar || '-'} años</span>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Acompañantes</span>
                        <span className="text-lg font-black text-blue-700">{detail.nucleo_familiar?.cantidad_acompanantes || 0}</span>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Adultos Mayores</span>
                        <span className="text-lg font-black text-amber-700">{detail.nucleo_familiar?.cantidad_adultos_mayores || 0}</span>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Niños en Hogar</span>
                        <span className="text-lg font-black text-emerald-700">{detail.nucleo_familiar?.cantidad_ninos || 0}</span>
                      </div>
                    </div>

                    {/* Tabla de Integrantes del Núcleo Familiar */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-700" />
                          <span>Detalle Demográfico de los Integrantes de la Familia</span>
                        </h5>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                            <tr>
                              <th scope="col" className="py-2.5 px-3 w-10 text-center">#</th>
                              <th scope="col" className="py-2.5 px-3">Nombre Completo</th>
                              <th scope="col" className="py-2.5 px-3">Documento</th>
                              <th scope="col" className="py-2.5 px-3">Fecha de Nacimiento</th>
                              <th scope="col" className="py-2.5 px-3">Parentesco</th>
                              <th scope="col" className="py-2.5 px-3 text-center">Género</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-800">
                            {((detail.nucleo_familiar?.integrantes || detail.formulario_rufe?.integrantes) || []).map((fam, idx) => (
                              <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                                <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px] font-bold text-center">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3 font-extrabold text-slate-900">
                                  {fam.nombres} {fam.apellidos || ''}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-700 font-bold">
                                  {fam.tipo_documento ? `${fam.tipo_documento} ` : ''}{fam.documento || '-'}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="font-mono text-slate-800">{fam.fecha_nacimiento || '-'}</span>
                                  {fam.edad && (
                                    <span className="ml-1 text-[10px] text-slate-500 font-bold">({fam.edad} años)</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-slate-800">
                                  {fam.parentesco}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-slate-600">
                                  {fam.genero || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {detail.nucleo_familiar?.tiene_discapacidad && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                        <Accessibility className="h-5 w-5 text-amber-700 shrink-0" />
                        <span className="text-xs font-bold text-amber-950">
                          El núcleo familiar cuenta con integrantes con condición de discapacidad o movilidad reducida.
                        </span>
                      </div>
                    )}

                    {detail.nucleo_familiar?.observaciones_familia && (
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs shadow-2xs space-y-1">
                        <span className="font-extrabold text-slate-900 block">Observaciones Familiares:</span>
                        <p className="text-slate-700 leading-relaxed">{detail.nucleo_familiar.observaciones_familia}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ==================== PESTAÑA 4: INSUMOS SOLICITADOS ==================== */}
                {activeTab === 'insumos' && (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-3 p-4 sm:p-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                        Checklist de Insumos y Materiales Requeridos ({detail.items_solicitados?.length || 0})
                      </span>
                    </div>

                    {(!detail.items_solicitados || detail.items_solicitados.length === 0) ? (
                      <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                        No se registraron requerimientos específicos de insumos.
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                            <tr>
                              <th scope="col" className="py-2.5 px-3 w-10 text-center">#</th>
                              <th scope="col" className="py-2.5 px-3">Ítem / Insumo Solicitado</th>
                              <th scope="col" className="py-2.5 px-3 text-center">Unidad</th>
                              <th scope="col" className="py-2.5 px-3 text-center w-28">Cantidad Requerida</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-800">
                            {detail.items_solicitados.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px] font-bold text-center">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3 font-extrabold text-slate-900 flex items-center gap-2">
                                  <Package className="h-4 w-4 text-blue-700 shrink-0" />
                                  <span>{item.nombre_item}</span>
                                </td>
                                <td className="py-2.5 px-3 text-center text-slate-600">
                                  {item.unidad_medida || 'Unidades'}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-flex items-center justify-center bg-blue-100 text-blue-950 font-black px-2.5 py-0.5 rounded-full text-xs min-w-[50px]">
                                    {item.cantidad}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ==================== PESTAÑA: VISITAS TÉCNICAS DE VERIFICACIÓN ==================== */}
                {activeTab === 'visitas' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Visitas Técnicas de Verificación en Terreno
                        </h4>
                        <p className="text-xs text-slate-500">
                          Dictámenes de inspección oficial por parte de ingenieros o técnicos de la UNGRD.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsVisitaModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Registrar Visita Técnica</span>
                      </button>
                    </div>

                    {(!detail.visitas_tecnicas || detail.visitas_tecnicas.length === 0) ? (
                      <div className="py-12 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
                        <ClipboardCheck className="h-8 w-8 text-slate-400 mx-auto" />
                        <p className="font-semibold text-slate-800">No se registran visitas técnicas de verificación para este predio.</p>
                        <p className="text-slate-500 text-[11px]">Haz clic en "Registrar Visita Técnica" para documentar la inspección oficial de la UNGRD.</p>
                      </div>
                    ) : (
                      detail.visitas_tecnicas.map((vis: any) => (
                        <div
                          key={vis.id_visita}
                          className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-2xs space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                                Visita Técnica #{vis.numero_visita}
                              </span>
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                vis.dictamen_tecnico === 'COLAPSO_INMINENTE' || vis.dictamen_tecnico === 'SEVERO' || vis.dictamen_tecnico === 'DESHABITABLE'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : vis.dictamen_tecnico === 'MODERADO'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                Dictamen: {vis.dictamen_tecnico}
                              </span>
                            </div>

                            <span className="text-xs text-slate-500 font-medium">
                              {formatFecha(vis.fecha_visita)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">Profesional Responsable</span>
                              <span className="font-bold text-slate-800 block">{vis.profesional_responsable}</span>
                              <span className="text-slate-600 text-[11px]">{vis.cargo_responsable || 'Técnico de Gestión del Riesgo'}</span>
                            </div>

                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">Daños Estructurales Verificados</span>
                              <div className="mt-1 space-y-0.5 text-[11px]">
                                <div>Muros/Paredes: <strong className="text-slate-800">{vis.afectacion_muros}</strong></div>
                                <div>Techo/Cubierta: <strong className="text-slate-800">{vis.afectacion_techos}</strong></div>
                                <div>Pisos: <strong className="text-slate-800">{vis.afectacion_pisos}</strong></div>
                              </div>
                            </div>

                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">Criterios de Seguridad</span>
                              <div className="mt-1 space-y-1">
                                {vis.requiere_evacuacion ? (
                                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 mr-1">
                                    Requiere Evacuación
                                  </span>
                                ) : (
                                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-700 mr-1">
                                    No requiere evacuación
                                  </span>
                                )}
                                {vis.requiere_demolicion && (
                                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                                    Requiere Demolición
                                  </span>
                                )}
                                {vis.costo_estimado_danos > 0 && (
                                  <div className="text-[11px] font-bold text-slate-800 mt-1">
                                    Daños estimados: $ {Number(vis.costo_estimado_danos).toLocaleString()} COP
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {vis.observaciones_tecnicas && (
                            <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                              <span className="font-bold text-slate-700 block text-[10px] uppercase mb-0.5">Observaciones Técnicas:</span>
                              <p className="text-slate-700 leading-relaxed">{vis.observaciones_tecnicas}</p>
                            </div>
                          )}

                          {/* Acordeón expandible para las 10 secciones oficiales de evaluación */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => setExpandedVisitaId(expandedVisitaId === vis.id_visita ? null : vis.id_visita)}
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                            >
                              <span>{expandedVisitaId === vis.id_visita ? 'Ocultar dictamen oficial (10 secciones)' : 'Ver dictamen oficial completo (10 secciones de evaluación post-sismo)'}</span>
                              <ChevronDown className={`h-4 w-4 transition-transform ${expandedVisitaId === vis.id_visita ? 'rotate-180' : ''}`} />
                            </button>
                            <span className="text-[10px] text-slate-400 font-mono">FR-POST-SISMO-ANSERMA</span>
                          </div>

                          {expandedVisitaId === vis.id_visita && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs animate-in fade-in">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-slate-200 pb-2">
                                <div>
                                  <span className="font-bold text-slate-600 block text-[10px] uppercase">Acceso y Condiciones:</span>
                                  <p className="text-slate-800 font-medium">Vía: {vis.acceso_vivienda || 'Carretera'} ({vis.tiempo_acceso || '20 min'}) - {vis.condiciones_acceso || 'Buenas condiciones'}</p>
                                </div>
                                <div>
                                  <span className="font-bold text-slate-600 block text-[10px] uppercase">Situación Hogar:</span>
                                  <p className="text-slate-800 font-medium">{vis.permanece_en_vivienda ? 'Permanece en la vivienda' : 'Evacuado'} | Alojamiento: {vis.lugar_alojamiento_actual || 'Vivienda'} | Tenencia: {vis.soporte_tenencia || 'Escritura'}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-200 pb-2">
                                <div>
                                  <span className="font-bold text-slate-600 block text-[10px] uppercase">Vivienda Previa:</span>
                                  <p className="text-slate-800 font-medium">{vis.tipologia_vivienda || 'Unifamiliar'}, {vis.numero_pisos || 1} piso(s), {vis.area_aproximada_m2 || 0} m²</p>
                                </div>
                                <div>
                                  <span className="font-bold text-slate-600 block text-[10px] uppercase">Materiales:</span>
                                  <p className="text-slate-800 font-medium">Muros: {vis.material_predominante_muros || 'Mampostería'} | Techo: {vis.tipo_cubierta || 'Teja'} | Piso: {vis.tipo_piso || 'Cerámica'}</p>
                                </div>
                                <div>
                                  <span className="font-bold text-slate-600 block text-[10px] uppercase">Necesidad Inmediata:</span>
                                  <p className="text-slate-800 font-bold text-blue-700">{vis.necesidad_inmediata || 'Reconstrucción menor'}</p>
                                </div>
                              </div>

                              {vis.evaluacion_elementos_json && vis.evaluacion_elementos_json.length > 0 && (
                                <div>
                                  <span className="font-bold text-slate-600 block text-[10px] uppercase mb-1">Detalle Visual por Elemento:</span>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                                    {vis.evaluacion_elementos_json.map((el: any) => (
                                      <div key={el.elemento} className="bg-white p-1.5 rounded-lg border border-slate-200">
                                        <span className="font-bold text-slate-700 block truncate">{el.elemento}:</span>
                                        <span className={`font-black ${el.nivel_dano === 'Colapso' || el.nivel_dano === 'Severo' ? 'text-rose-600' : 'text-slate-800'}`}>
                                          {el.nivel_dano} (Riesgo: {el.riesgo_inmediato})
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ==================== PESTAÑA: SEGUIMIENTO DE OBRA Y RECONSTRUCCIÓN ==================== */}
                {activeTab === 'obra' && (
                  <SeguimientoObraSection
                    idSolicitud={idSolicitud}
                    codigoSolicitud={detail.codigo_solicitud || `SOL-${idSolicitud}`}
                    onRefresh={loadDetail}
                  />
                )}

                {/* ==================== PESTAÑA 5: ENTREGAS REALIZADAS ==================== */}
                {activeTab === 'entregas' && (
                  <div className="space-y-3">
                    {(!detail.entregas || detail.entregas.length === 0) ? (
                      <div className="py-12 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                        <p className="font-medium">No se han formalizado entregas físicas para este ticket de emergencia.</p>
                        {!isCensoOnly && onAtenderSolicitud && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onAtenderSolicitud(detail);
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <PackageCheck className="h-4 w-4" />
                            <span>Registrar Entrega de Insumos Ahora</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      detail.entregas.map((ent) => (
                        <div
                          key={ent.id_entrega}
                          className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-2xs space-y-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                                {ent.codigo_entrega}
                              </span>
                              <span className="text-xs font-black text-slate-900">
                                {ent.nombre_item || 'Ayuda Humanitaria'} x {ent.cantidad || 1}
                              </span>
                              {ent.nombre_entidad_donante && (
                                <span className="text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md">
                                  🏛️ Donante: {ent.nombre_entidad_donante}
                                </span>
                              )}
                              {(ent.costo_total_entrega || ent.costo_total) > 0 && (
                                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                                  💰 $ {Number(ent.costo_total_entrega || ent.costo_total).toLocaleString()} COP
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                              <Clock className="h-3 w-3 text-slate-400" />
                              <span>{formatFechaCorta(ent.fecha)}</span>
                            </span>
                          </div>

                          {/* Subcomponentes de Kit Entregados */}
                          {Array.isArray(ent.componentes) && ent.componentes.length > 0 && (
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                                Componentes y Dotación Incluida en este Kit:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {ent.componentes.map((comp: any, cIdx: number) => (
                                  <span
                                    key={cIdx}
                                    className="text-[11px] font-semibold bg-white border border-slate-300 text-slate-800 px-2 py-0.5 rounded-lg shadow-2xs"
                                  >
                                    ✓ {comp.nombre_componente || comp.nombre || comp} {comp.cantidad ? `(x${comp.cantidad})` : ''}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {ent.observaciones && (
                            <p className="text-xs text-slate-700 italic">
                              "{ent.observaciones}"
                            </p>
                          )}

                          {Array.isArray(ent.fotos) && ent.fotos.length > 0 && (
                            <div className="pt-2 border-t border-slate-100 space-y-2">
                              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                                <Camera className="h-3.5 w-3.5 text-emerald-600" />
                                Evidencia fotográfica de la entrega ({ent.fotos.length} / 6):
                              </span>
                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                {ent.fotos.slice(0, 6).map((url, idx) => (
                                  <div
                                    key={`${ent.id_entrega}-foto-${idx}`}
                                    onClick={() => setSelectedPhotoUrl(url)}
                                    className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-900 cursor-pointer group relative"
                                  >
                                    <img
                                      src={url}
                                      alt={`Foto entrega ${idx + 1}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {!isCensoOnly && onEditarEntrega && (
                            <div className="flex justify-end pt-1 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onEditarEntrega(ent, detail);
                                }}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                <span>Editar Esta Entrega ({ent.codigo_entrega})</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ==================== PESTAÑA 6: EVIDENCIAS FOTOGRÁFICAS ==================== */}
                {activeTab === 'fotos' && (
                  <div className="space-y-3">
                    {(!detail.fotos || detail.fotos.length === 0) ? (
                      <div className="py-12 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200">
                        No se adjuntaron evidencias fotográficas para esta solicitud o entrega.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {detail.fotos.map((foto) => (
                          <div
                            key={foto.id_foto}
                            onClick={() => setSelectedPhotoUrl(foto.url)}
                            className="bg-white border border-slate-200 rounded-2xl overflow-hidden group shadow-2xs hover:shadow-md transition-all cursor-pointer"
                          >
                            <div className="aspect-video w-full overflow-hidden bg-slate-900 relative">
                              <img
                                src={foto.url}
                                alt={`Evidencia ${foto.id_foto}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-extrabold transition-opacity">
                                🔍 Ver Ampliada
                              </div>
                            </div>
                            <div className="p-3 flex items-center justify-between text-xs">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                foto.tipo === 'Techo_Cubierta'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : foto.tipo === 'Estructura_Muros'
                                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                  : 'bg-blue-100 text-blue-900 border border-blue-200'
                              }`}>
                                {foto.tipo === 'Techo_Cubierta'
                                  ? '🏠 Techo / Cubierta'
                                  : foto.tipo === 'Estructura_Muros'
                                  ? '🏛️ Estructura / Muros'
                                  : foto.tipo === 'Censo_General'
                                  ? '📋 Censo General'
                                  : (foto.tipo || 'Evidencia')}
                              </span>
                              <span className="text-slate-500 text-[10px] font-mono">{formatFechaCorta(foto.fecha)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Modal para Registrar Visita Técnica Completa (10 Secciones Oficiales) */}
      {isVisitaModalOpen && (
        <VisitaTecnicaCompletaModal
          idSolicitud={idSolicitud!}
          onClose={() => setIsVisitaModalOpen(false)}
          onSave={handleGuardarVisitaCompleta}
          saving={savingVisita}
        />
      )}

      {/* Lightbox / Visor de Fotos en Alta Resolución */}
      {selectedPhotoUrl && (
        <div
          onClick={() => setSelectedPhotoUrl(null)}
          className="fixed inset-0 z-[999999] bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[92vh] w-full bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-2xl flex flex-col items-center p-4 space-y-3 my-auto"
          >
            <div className="w-full flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Camera className="h-4 w-4 text-blue-700" />
                <span>Visualizador de Evidencias Fotográficas</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedPhotoUrl(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center w-full min-h-[300px] bg-slate-950 rounded-2xl p-2">
              <img
                src={selectedPhotoUrl}
                alt="Evidencia fotográfica a tamaño completo"
                className="max-h-[72vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>

            <div className="w-full flex flex-wrap justify-between items-center text-xs text-slate-500 gap-2">
              <span>Haga clic fuera o en la 'X' para cerrar.</span>
              <a
                href={selectedPhotoUrl}
                download="evidencia_catastrofe.jpg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 font-extrabold hover:underline flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Descargar Fotografía</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
