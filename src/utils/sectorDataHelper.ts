import barriosData from '../assets/data/barrios.json';
import veredasData from '../assets/data/veredas.json';
import type { SectorItem } from '../types/sac.types';

export type SectorGeoData = {
  id_sector: number | null;
  name: string;
  latitude: number;
  longitude: number;
  requestCount: number;
  hasValidCoordinates: boolean;
};

// Limpia los espacios, guiones y convierte a mayúsculas para un cruce de nombres más preciso
const normalizeName = (name: string) => name.replace(/[-]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();

export function getSectorsGeoData(backendSectors: SectorItem[]): SectorGeoData[] {
  const geoData: SectorGeoData[] = [];
  const assignedBackendSectorIds = new Set<number>();

  // Mapear barrios
  barriosData.forEach((barrio: any) => {
    const lat = parseFloat(barrio.Latitud);
    const lng = parseFloat(barrio.Longitud);
    const name = barrio['Nombre Barrio'] as string;

    if (!isNaN(lat) && !isNaN(lng) && name) {
      geoData.push({
        id_sector: null,
        name: name.trim(),
        latitude: lat,
        longitude: lng,
        requestCount: 0,
        hasValidCoordinates: true,
      });
    }
  });

  // Mapear veredas
  veredasData.forEach((vereda: any) => {
    const lat = parseFloat(vereda.Latitud);
    const lng = parseFloat(vereda.Longitud);
    const name = vereda.NOMBRE_VER as string;

    if (!isNaN(lat) && !isNaN(lng) && name) {
      geoData.push({
        id_sector: null,
        name: `VEREDA ${name.trim()}`,
        latitude: lat,
        longitude: lng,
        requestCount: 0,
        hasValidCoordinates: true,
      });
    }
  });

  // Intentar cruzar `geoData` con los sectores que provienen del backend
  const backendSectorsMap = new Map<string, SectorItem>();
  backendSectors.forEach((bs) => {
    if (bs.nombre_sector) {
      backendSectorsMap.set(normalizeName(bs.nombre_sector), bs);
    }
  });

  const cleanStr = (s: string) => s.replace(/^(BARRIO|VEREDA)\s*/, '').replace(/[\s\-_]/g, '').trim();

  geoData.forEach((geoSector) => {
    const normName = normalizeName(geoSector.name);
    let matchedBs = backendSectorsMap.get(normName);

    if (!matchedBs) {
      const cleanNorm = cleanStr(normName);
      for (const [key, bs] of backendSectorsMap.entries()) {
        const cleanKey = cleanStr(key);
        if (cleanKey && cleanNorm && cleanKey === cleanNorm) {
          matchedBs = bs;
          break;
        }
      }
    }

    if (matchedBs) {
      geoSector.id_sector = matchedBs.id_sector;
      assignedBackendSectorIds.add(matchedBs.id_sector);
    }
  });

  // Para sectores del backend sin coordenadas en JSON o Backend: registrar con hasValidCoordinates = false
  backendSectors.forEach((bs) => {
    if (!assignedBackendSectorIds.has(bs.id_sector) && bs.nombre_sector) {
      const bAny = bs as any;
      const hasLat = typeof bAny.latitud === 'number' && bAny.latitud !== 0;
      const hasLng = typeof bAny.longitud === 'number' && bAny.longitud !== 0;
      geoData.push({
        id_sector: bs.id_sector,
        name: bs.nombre_sector,
        latitude: hasLat ? bAny.latitud : 0,
        longitude: hasLng ? bAny.longitud : 0,
        requestCount: 0,
        hasValidCoordinates: hasLat && hasLng,
      });
    }
  });

  return geoData;
}

// Función auxiliar para asignar el requestCount basado en id_sector y coordenadas
export function assignRequestsToSectors(
  geoSectors: SectorGeoData[],
  requests: { latitude: number | null; longitude: number | null; id?: number; id_sector?: number | null }[],
) {
  geoSectors.forEach((s) => {
    s.requestCount = 0;
  });

  requests.forEach((req) => {
    if (req.id_sector) {
      const matchSector = geoSectors.find((sec) => sec.id_sector === req.id_sector);
      if (matchSector) {
        matchSector.requestCount += 1;
        return;
      }
    }

    if (req.latitude !== null && req.longitude !== null) {
      let closestSector: SectorGeoData | null = null;
      let minDistance = Infinity;

      geoSectors.forEach((sec) => {
        if (!sec.hasValidCoordinates || sec.latitude === 0 || sec.longitude === 0) return;
        const dLat = sec.latitude - req.latitude!;
        const dLng = sec.longitude - req.longitude!;
        const dist = dLat * dLat + dLng * dLng;

        if (dist < minDistance) {
          minDistance = dist;
          closestSector = sec;
        }
      });

      if (closestSector && minDistance < 0.0005) {
        (closestSector as SectorGeoData).requestCount += 1;
      }
    }
  });

  return geoSectors;
}
