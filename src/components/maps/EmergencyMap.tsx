import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { SolicitudMapItem } from '../../types/sac.types';
import { getSectorMarkerIcon } from './sectorMarkerIcon';
import { Eye, MapPin, User, AlertTriangle } from 'lucide-react';

interface Props {
  solicitudes: SolicitudMapItem[];
  onSelectSolicitud: (id: number) => void;
  isFullScreen?: boolean;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

export const EmergencyMap: React.FC<Props> = ({
  solicitudes,
  onSelectSolicitud,
  isFullScreen = false,
}) => {
  // Centro por defecto: Anserma Caldas (5.2399, -75.7822)
  const defaultCenter: [number, number] = [5.239971, -75.782206];

  return (
    <div className={`w-full ${isFullScreen ? 'h-full' : 'h-[480px]'} rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative`}>
      <MapContainer
        center={defaultCenter}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={defaultCenter} />

        {solicitudes.map((sol) => {
          if (!sol.latitud_gps || !sol.longitud_gps) return null;

          return (
            <Marker
              key={sol.id_solicitud}
              position={[sol.latitud_gps, sol.longitud_gps]}
              icon={getSectorMarkerIcon(sol.nivel_afectacion_vivienda, sol.tiene_entrega)}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 space-y-2 text-xs min-w-[200px]">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
                    <span className="font-mono font-bold text-indigo-400">
                      {sol.codigo_solicitud}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        sol.tiene_entrega
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {sol.nombre_estado}
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-200">
                    <p className="font-semibold text-white">
                      {sol.ciudadano.nombres} {sol.ciudadano.apellidos}
                    </p>
                    <p className="text-slate-400">
                      CC: {sol.ciudadano.documento}
                    </p>
                    <p className="text-slate-400 flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-slate-500" />
                      <span>{sol.sector.nombre_sector}</span>
                    </p>
                    <div className="flex items-center space-x-2 pt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                        Daño: {sol.nivel_afectacion_vivienda}
                      </span>
                      {sol.requiere_evacuacion && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold">
                          EVACUAR
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectSolicitud(sol.id_solicitud)}
                    className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded-lg font-semibold flex items-center justify-center space-x-1 transition cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Ver Detalle RUFE</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
