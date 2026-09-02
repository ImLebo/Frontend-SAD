import { useMemo, useState, useEffect } from 'react';
import { Calendar, CheckCircle, ChevronLeft, ChevronRight, Eye, MapPin, Search, User, X } from 'lucide-react';
import type { SectorItem } from '../../types/sac.types';

export interface PendingRequestItem {
  id_solicitud: number;
  codigo_solicitud: string;
  documento: string;
  nombres: string;
  apellidos: string;
  nombre_completo?: string;
  nombre_sector: string;
  id_sector: number;
  tipo_sector?: string;
  direccion_solicitud?: string;
  descripcion_solicitud?: string;
  fecha_solicitud?: string;
  latitud?: number;
  longitud?: number;
  nivel_afectacion_vivienda?: string;
}

interface PendingRequestPickerModalProps {
  isOpen: boolean;
  requests: any[];
  sectores: SectorItem[];
  onSelect: (request: any) => void;
  onViewDetail?: (idSolicitud: number) => void;
  onClose: () => void;
}

const ITEMS_PER_PAGE = 8;

export default function PendingRequestPickerModal({
  isOpen,
  requests,
  sectores,
  onSelect,
  onViewDetail,
  onClose,
}: PendingRequestPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<number | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const q = searchQuery.toLowerCase().trim();
      const matchDoc = req.documento?.toLowerCase().includes(q);
      const fullName = `${req.nombres || ''} ${req.apellidos || ''}`.trim().toLowerCase();
      const matchName = fullName.includes(q) || (req.nombre_completo && req.nombre_completo.toLowerCase().includes(q));
      const matchId = `sol-${req.id_solicitud}`.toLowerCase().includes(q) || String(req.id_solicitud).includes(q) || (req.codigo_solicitud && req.codigo_solicitud.toLowerCase().includes(q));
      const matchSector = req.nombre_sector?.toLowerCase().includes(q);

      const matchesSearch = !q || matchDoc || matchName || matchId || matchSector;
      const matchesSectorFilter = selectedSector === 'ALL' || req.id_sector === selectedSector;

      return matchesSearch && matchesSectorFilter;
    });
  }, [requests, searchQuery, selectedSector]);

  // Reset to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSector]);

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE) || 1;

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, currentPage]);

  const startIdx = filteredRequests.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, filteredRequests.length);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-3xl max-h-[90vh] rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-800 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black">
              SOL
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Buscar y Seleccionar Solicitud Pendiente</h3>
              <p className="text-xs text-slate-300">
                Filtre por documento, nombre del ciudadano, sector o ID para vincular la entrega de ayuda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por documento, nombre de ciudadano, sector o SOL-ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none text-slate-800"
            />
          </div>

          <div>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none text-slate-800 cursor-pointer"
            >
              <option value="ALL">Todos los Sectores</option>
              {sectores.map((s) => (
                <option key={s.id_sector} value={s.id_sector}>
                  {s.nombre_sector} ({s.tipo_sector})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Request Cards List (Paginated) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1">
          {paginatedRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-medium">No se encontraron solicitudes pendientes con estos filtros.</p>
            </div>
          ) : (
            paginatedRequests.map((req) => (
              <div
                key={req.id_solicitud}
                onClick={() => onViewDetail && onViewDetail(req.id_solicitud)}
                className="border border-slate-200 rounded-2xl p-3.5 bg-white hover:border-blue-400 hover:bg-slate-50/70 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-rose-100 text-rose-700 text-xs font-black px-2.5 py-0.5 rounded-lg border border-rose-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors">
                      {req.codigo_solicitud || `SOL-${req.id_solicitud}`}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-800 truncate group-hover:text-blue-900 transition-colors">
                      <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      {req.nombres} {req.apellidos} (Doc: {req.documento})
                    </span>
                  </div>

                  {req.direccion_afectacion && (
                    <p className="text-xs text-slate-600 line-clamp-1">Dir: {req.direccion_afectacion}</p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-rose-500" />
                      {req.nombre_sector}
                    </span>
                    {req.fecha_solicitud && (
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {req.fecha_solicitud}
                      </span>
                    )}
                    {onViewDetail && (
                      <span className="text-blue-600 font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="h-3 w-3" />
                        Clic para ver detalle completo
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0" onClick={(e) => e.stopPropagation()}>
                  {onViewDetail && (
                    <button
                      type="button"
                      onClick={() => onViewDetail(req.id_solicitud)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 px-3 py-2 text-xs font-bold transition cursor-pointer"
                      title="Ver expediente y censo completo"
                    >
                      <Eye className="h-3.5 w-3.5 text-blue-600" />
                      <span>Ver Detalle</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(req);
                      onClose();
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-95 transition-all cursor-pointer"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Seleccionar Solicitud</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Pagination Controls */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-600 px-6">
          <div className="font-semibold text-slate-600">
            Mostrando <strong className="text-slate-900">{startIdx} - {endIdx}</strong> de <strong className="text-slate-900">{filteredRequests.length}</strong> solicitudes
          </div>

          {/* Pagination buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              title="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-3 py-1 font-black text-xs text-slate-800 bg-white border border-slate-200 rounded-lg">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              title="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="ml-2 px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
