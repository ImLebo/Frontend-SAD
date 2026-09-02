import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { X, Check, MapPin, LocateFixed } from 'lucide-react';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Props {
  isOpen?: boolean;
  initialLat?: number;
  initialLng?: number;
  onSave?: (lat: number, lng: number) => void;
  onSelectLocation?: (lat: number, lng: number) => void;
  onClose: () => void;
}

function LocationMarker({ position, setPosition }: { position: [number, number]; setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function LocationPickerModal({
  isOpen = true,
  initialLat = 5.239971,
  initialLng = -75.782206,
  onSave,
  onSelectLocation,
  onClose,
}: Props) {
  if (isOpen === false) return null;

  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);

  const handleConfirm = () => {
    if (onSave) onSave(position[0], position[1]);
    if (onSelectLocation) onSelectLocation(position[0], position[1]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[82vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-800 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-rose-600 text-white shadow-sm">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Fijar Ubicación Exacta en el Mapa (GPS)</h3>
              <p className="text-xs text-slate-300">Haz clic en el mapa para ubicar la vivienda o predio afectado con precisión</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={position}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>

          {/* Floating coordinates badge */}
          <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur border border-slate-300 px-4 py-2.5 rounded-2xl text-xs text-slate-800 font-mono shadow-xl flex items-center space-x-2">
            <LocateFixed className="h-4 w-4 text-rose-600" />
            <span><strong>Lat:</strong> {position[0].toFixed(6)} | <strong>Lng:</strong> {position[1].toFixed(6)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center px-6">
          <span className="text-xs text-slate-500 font-medium">
            Mueve el pin haciendo clic sobre la zona afectada.
          </span>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition cursor-pointer active:scale-95"
            >
              <Check className="h-4 w-4" />
              <span>Confirmar Coordenadas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export { LocationPickerModal };
