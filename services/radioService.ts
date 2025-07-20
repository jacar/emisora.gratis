
const API_BASE_URL = 'https://all.api.radio-browser.info/json';

// Cache simple para evitar llamadas repetidas
const cache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // Reducido a 2 minutos para evitar cache obsoleto

const fetchStations = async (endpoint: string, params: Record<string, string> = {}) => {
  const url = new URL(`${API_BASE_URL}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.append(key, value);
  });
  
  // Crear clave de cache
  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Si params.country es un array, hacer fetch país por país SIEMPRE
  if (params.country && Array.isArray(params.country)) {
    let allResults: any[] = [];
    for (const country of params.country) {
      try {
        const resp = await fetch(`${API_BASE_URL}/stations/search?country=${encodeURIComponent(country)}&limit=${params.limit || 15}&hidebroken=true&order=votes&reverse=true`).catch(err => {
          return null;
        });
        if (resp && resp.ok) {
          const d = await resp.json();
          allResults = allResults.concat(d.filter((station: any) => station.url_resolved));
        }
      } catch (e) {
        // Silenciar errores
      }
    }
    return allResults;
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      cache: 'no-cache',
    }).catch(error => {
      throw error;
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

// Nueva función para obtener emisoras por tag con múltiples estrategias
export const getStationsByTagAggressive = async (
  tag: string,
  limit = 50,
  offset = 0
) => {
  try {
    const promises = [
      fetchStations(`stations/bytag/${tag}`, {
        limit: limit.toString(),
        offset: offset.toString(),
        hidebroken: 'true',
        order: 'votes',
        reverse: 'true'
      }),
      fetchStations(`stations/search`, {
        name: tag,
        limit: (limit * 2).toString(),
        offset: offset.toString(),
        hidebroken: 'true',
        order: 'random',
        reverse: 'false'
      })
    ];
    
    const results = await Promise.all(promises);
    const allStations = results.flat();
    
    // Eliminar duplicados y ordenar
    const uniqueStations = allStations.filter((station, index, self) =>
      index === self.findIndex(s => s.stationuuid === station.stationuuid)
    );
    
    return uniqueStations
      .sort((a, b) => (b.votes || 0) - (a.votes || 0))
      .slice(0, limit);
  } catch (error) {
    console.warn('Error in aggressive tag search:', error);
    return [];
  }
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

// Obtener emisoras por país o lista de países (con paginación)
export const getStationsByCountry = async (countries: string | string[], limit = 50, offset = 0) => {
  try {
    let countryParam = '';
    if (Array.isArray(countries)) {
      countryParam = countries.join(',');
    } else {
      countryParam = countries;
    }
    
    // Si no hay país específico, buscar emisoras globales
    if (!countryParam || countryParam === '') {
      return fetchStations('stations', {
        limit: limit.toString(),
        offset: offset.toString(),
        hidebroken: 'true',
        order: 'votes',
        reverse: 'true'
      });
    }
    
    // Intentar múltiples estrategias de búsqueda
    const searchPromises = [
      fetchStations('stations/search', {
        country: countryParam,
        limit: limit.toString(),
        offset: offset.toString(),
        hidebroken: 'true',
        order: 'votes',
        reverse: 'true'
      }),
      fetchStations('stations/search', {
        country: countryParam,
        limit: (limit * 2).toString(),
        offset: offset.toString(),
        hidebroken: 'true',
        order: 'random',
        reverse: 'false'
      })
    ];
    
    const results = await Promise.all(searchPromises);
    const allStations = results.flat();
    
    // Eliminar duplicados y ordenar por votos
    const uniqueStations = allStations.filter((station, index, self) =>
      index === self.findIndex(s => s.stationuuid === station.stationuuid)
    );
    
    return uniqueStations
      .sort((a, b) => (b.votes || 0) - (a.votes || 0))
      .slice(0, limit);
  } catch (error) {
    console.warn('Error loading stations by country:', error);
    return [];
  }
};

// Infinite scroll: cargar más emisoras por país o países
export const getMoreStationsByCountry = async (countries: string | string[], limit = 50, offset = 0) => {
  return getStationsByCountry(countries, limit, offset);
};

// Verifica si un stream responde correctamente en menos de 300ms
export async function isStreamAvailable(url: string, timeout = 300): Promise<boolean> {
  return new Promise((resolve) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      resolve(false);
    }, timeout);
    
    // Intentar con HEAD primero para ser más rápido
    fetch(url, {
      method: 'HEAD',
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
        // Si HEAD falla, intentar con GET
        if (error.name === 'TypeError') {
          fetch(url, {
            method: 'GET',
            mode: 'no-cors',
            signal: controller.signal,
            cache: 'no-cache',
          })
            .then(() => resolve(true))
            .catch(() => resolve(false));
        } else {
          resolve(false);
        }
      });
  });
}

// Filtra una lista de emisoras dejando solo las que responden rápido (optimizado)
export async function filterStationsByStream(stations: any[], timeout = 1000): Promise<any[]> {
  // Reducir el límite para evitar sobrecarga
  const stationsToCheck = stations.slice(0, 15);
  
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