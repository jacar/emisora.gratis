
const API_BASE_URL = 'https://all.api.radio-browser.info/json';

// Cache simple para evitar llamadas repetidas
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

const fetchStations = async (endpoint: string, params: Record<string, string> = {}) => {
  const url = new URL(`${API_BASE_URL}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.append(key, value);
  });
  
  // Crear clave de cache
  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log("Using cached data for:", cacheKey);
    return cached.data;
  }

  try {
    console.log("Fetching stations from URL:", url.toString());
    const response = await fetch(url.toString(), {
      method: 'GET',
      cache: 'no-cache',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const filteredData = data.filter((station: any) => station.url_resolved);
    
    // Guardar en cache
    cache.set(cacheKey, {
      data: filteredData,
      timestamp: Date.now()
    });
    
    return filteredData;
  } catch (error) {
    console.error("Failed to fetch stations:", error);
    return [];
  }
};

export const searchStations = (
  query: string,
  limit = 50,
  offset = 0
) => {
  const params: Record<string, string> = {
    limit: limit.toString(),
    offset: offset.toString(),
    hidebroken: 'true',
    order: 'votes',
    reverse: 'true'
  };
  // The API uses 'name' as a generic search field for name, tag, etc.
  if (query) {
    params.name = query;
  }
  return fetchStations('stations/search', params);
};

export const getStationsByTag = (
  tag: string,
  limit = 50,
  offset = 0
) => {
  const params: Record<string, string> = {
    limit: limit.toString(),
    offset: offset.toString(),
    hidebroken: 'true',
    order: 'votes',
    reverse: 'true'
  };
  return fetchStations(`stations/bytag/${tag}`, params);
};

export const getStationsByUuids = (uuids: string[]) => {
  if (uuids.length === 0) return Promise.resolve([]);
  return fetchStations('stations/byuuid', { uuids: uuids.join(',') });
};

export const fetchRandomStations = (limit = 50) => {
    return fetchStations('stations', {
        limit: limit.toString(),
        hidebroken: 'true',
        order: 'random'
    });
}

// Función para obtener emisoras colombianas específicas (simplificada para mejor rendimiento)
export const getColombianStations = async (limit = 500) => {
  try {
    // Solo hacer 2 llamadas principales para mejor rendimiento
    const [colombianByCountry, colombianByTag] = await Promise.all([
      fetchStations('stations/search', {
        country: 'Colombia',
        limit: '300', // Aumentar para obtener más en una sola llamada
        hidebroken: 'true',
        order: 'votes',
        reverse: 'true'
      }),
      fetchStations('stations/bytag/colombia', {
        limit: '200',
        hidebroken: 'true',
        order: 'votes',
        reverse: 'true'
      })
    ]);

    // Combinar y eliminar duplicados
    const allStations = [...colombianByCountry, ...colombianByTag];
    const uniqueStations = allStations.filter((station, index, self) => 
      index === self.findIndex(s => s.stationuuid === station.stationuuid)
    );
    
    return uniqueStations
      .sort((a, b) => (b.votes || 0) - (a.votes || 0))
      .slice(0, limit);
  } catch (error) {
    console.warn('Error loading Colombian stations:', error);
    return [];
  }
};

// Función para cargar más emisoras colombianas con paginación (simplificada)
export const getMoreColombianStations = async (limit = 50, offset = 0) => {
  try {
    // Solo una llamada para cargar más emisoras
    const stations = await fetchStations('stations/search', {
      country: 'Colombia',
      limit: limit.toString(),
      offset: offset.toString(),
      hidebroken: 'true',
      order: 'votes',
      reverse: 'true'
    });
    
    return stations;
  } catch (error) {
    console.warn('Error loading more Colombian stations:', error);
    return [];
  }
};

// Verifica si un stream responde correctamente en menos de 500ms
export async function isStreamAvailable(url: string, timeout = 500): Promise<boolean> {
  return new Promise((resolve) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      resolve(false);
    }, timeout);
    
    // Intentar con GET en lugar de HEAD para evitar errores 405
    fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-cache',
    })
      .then(() => {
        clearTimeout(timer);
        resolve(true);
      })
      .catch((error) => {
        clearTimeout(timer);
        // Silenciar errores específicos de red
        if (error.name === 'AbortError' || error.name === 'TypeError') {
          resolve(false);
        } else {
          resolve(false);
        }
      });
  });
}

// Filtra una lista de emisoras dejando solo las que responden rápido (optimizado)
export async function filterStationsByStream(stations: any[], timeout = 1000): Promise<any[]> {
  // Limitar a máximo 10 emisoras para verificar simultáneamente
  const stationsToCheck = stations.slice(0, 10);
  
  const checks = await Promise.all(
    stationsToCheck.map(async (station) => {
      if (!station.url_resolved) return false;
      try {
        const ok = await isStreamAvailable(station.url_resolved, timeout);
        return ok;
      } catch (error) {
        // Silenciar errores de streams individuales
        return false;
      }
    })
  );
  return stationsToCheck.filter((_, i) => checks[i]);
}