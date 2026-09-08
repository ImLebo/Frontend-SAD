import L from 'leaflet';

// Caché de instancias de DivIcon para evitar recrear objetos DOM y Leaflet en cada render
const summaryIconCache = new Map<string, L.DivIcon>();
const markerIconCache = new Map<string, L.DivIcon>();

/**
 * Genera el marcador de resumen por sector (semáforo con contador de solicitudes) con caché
 */
export const getSectorSummaryMarkerIcon = (
  count: number,
  color: 'green' | 'yellow' | 'red' | 'gray',
  isSelected: boolean = false,
): L.DivIcon => {
  if (count <= 0) {
    const key = 'empty';
    if (!summaryIconCache.has(key)) {
      summaryIconCache.set(
        key,
        L.divIcon({
          html: '',
          className: 'hidden-sector-icon',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        })
      );
    }
    return summaryIconCache.get(key)!;
  }

  const countDisplay = count > 99 ? '99+' : String(count);
  const cacheKey = `${countDisplay}-${color}-${isSelected}`;
  const cached = summaryIconCache.get(cacheKey);
  if (cached) return cached;

  const iconHtml = `
    <div class="sector-marker-container ${isSelected ? 'selected' : ''}">
      ${count > 0 ? `<div class="sector-center-pulse"></div>` : ''}
      <div class="sector-traffic-light ${color}">
        <span class="sector-traffic-count">${countDisplay}</span>
      </div>
    </div>
  `;

  const icon = L.divIcon({
    html: iconHtml,
    className: 'custom-sector-icon',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -10],
  });

  summaryIconCache.set(cacheKey, icon);
  return icon;
};

/**
 * Genera el marcador individual para cada solicitud georreferenciada con caché
 */
export const getSectorMarkerIcon = (damageLevel: string, hasDelivery: boolean = false): L.DivIcon => {
  const cacheKey = `${damageLevel}-${hasDelivery}`;
  const cached = markerIconCache.get(cacheKey);
  if (cached) return cached;

  let color = '#3b82f6'; // Azul por defecto (Leve/Ninguno)
  let shadow = 'rgba(59, 130, 246, 0.4)';

  if (hasDelivery) {
    color = '#10b981'; // Verde (Atendida)
    shadow = 'rgba(16, 185, 129, 0.4)';
  } else if (damageLevel === 'Colapso Total') {
    color = '#ef4444'; // Rojo
    shadow = 'rgba(239, 68, 68, 0.5)';
  } else if (damageLevel === 'Grave') {
    color = '#f59e0b'; // Ámbar/Naranja
    shadow = 'rgba(245, 158, 11, 0.5)';
  } else if (damageLevel === 'Leve') {
    color = '#eab308'; // Amarillo
    shadow = 'rgba(234, 179, 8, 0.4)';
  }

  const svgHtml = `
    <div style="
      position: relative;
      width: 22px;
      height: 22px;
      background-color: ${color};
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 8px ${shadow};
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    ">
      <div style="width: 6px; height: 6px; background-color: #ffffff; border-radius: 50%;"></div>
    </div>
  `;

  const icon = L.divIcon({
    html: svgHtml,
    className: 'custom-map-marker',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });

  markerIconCache.set(cacheKey, icon);
  return icon;
};

