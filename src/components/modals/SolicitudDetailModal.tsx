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
} from 'lucide-react';
import { sacService } from '../../services/sacService';
import { SolicitudDetailResponse } from '../../types/sac.types';

interface Props {
  idSolicitud: number | null;
  onClose: () => void;
  onAtenderSolicitud?: (detail: SolicitudDetailResponse) => void;
  onEditarSolicitud?: (detail: SolicitudDetailResponse) => void;
  onEditarEntrega?: (entrega: any, detail: SolicitudDetailResponse) => void;
  isCensoOnly?: boolean;
}

export const SolicitudDetailModal: React.FC<Props> = ({
  idSolicitud,
  onClose,
  onAtenderSolicitud,
  onEditarSolicitud,
  onEditarEntrega,
  isCensoOnly = false,
}) => {
  const [detail, setDetail] = useState<SolicitudDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'censo' | 'rufe' | 'familia' | 'insumos' | 'entregas' | 'fotos'>('censo');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [copiedGps, setCopiedGps] = useState(false);
  const [copiedDoc, setCopiedDoc] = useState(false);

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

                    {/* Bloque 1: Forma de Tenencia y Estado del Bien */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                      <h5 className="text-xs font-black text-indigo-950 uppercase tracking-wide border-b border-slate-100 pb-2">
                        1. Tenencia y Estado del Bien Afectado
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Forma de Tenencia</span>
                          <span className="text-xs font-black text-slate-900 block">
                            {detail.formulario_rufe?.forma_tenencia || condicionVivienda}
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
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                                {ent.codigo_entrega}
                              </span>
                              <span className="text-xs font-black text-slate-900">
                                {ent.nombre_item || 'Ayuda Humanitaria'} x {ent.cantidad || 1}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                              <Clock className="h-3 w-3 text-slate-400" />
                              <span>{formatFechaCorta(ent.fecha)}</span>
                            </span>
                          </div>
                          {ent.observaciones && (
                            <p className="text-xs text-slate-700 italic">
                              "{ent.observaciones}"
                            </p>
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
                              <span className="font-extrabold text-blue-900">{foto.tipo || 'Evidencia'}</span>
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
