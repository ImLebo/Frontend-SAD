import L from 'leaflet';

/**
 * Genera el marcador de resumen por sector (semáforo con contador de solicitudes)
 */
export const getSectorSummaryMarkerIcon = (
  count: number,
  color: 'green' | 'yellow' | 'red' | 'gray',
  isSelected: boolean = false,
): L.DivIcon => {
  if (count <= 0) {
    return L.divIcon({
      html: '',
      className: 'hidden-sector-icon',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  }

  const iconHtml = `
    <div class="sector-marker-container ${isSelected ? 'selected' : ''}">
      ${count > 0 ? `<div class="sector-center-pulse"></div>` : ''}
      <div class="sector-traffic-light ${color}">
        <span class="sector-traffic-count">${count > 99 ? '99+' : count}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-sector-icon',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -10],
  });
};

/**
 * Genera el marcador individual para cada solicitud georreferenciada
 */
export const getSectorMarkerIcon = (damageLevel: string, hasDelivery: boolean = false): L.DivIcon => {
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
      width: 24px;
      height: 24px;
      background-color: ${color};
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 10px ${shadow};
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 6px; height: 6px; background-color: #ffffff; border-radius: 50%;"></div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-map-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

