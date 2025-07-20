
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

// @ts-ignore
import RadioBrowser from 'radio-browser';

// Fallback con radio-browser npm package
async function radioBrowserFallbackByTag(tag: string, limit = 50, offset = 0) {
  try {
    const stations = await RadioBrowser.getStations({
      tag,
      limit,
      offset,
      hidebroken: true,
      order: 'votes',
      reverse: true
    });
    return stations;
  } catch (error) {
    return [];
  }
}

// Fallback con Radio API (radio-api.com)
const RADIO_API_KEY = 'TU_API_KEY_AQUI'; // Reemplaza por tu API Key de radio-api.com
async function radioApiFallbackByTag(tag: string, limit = 50, offset = 0) {
  try {
    const url = `https://api.radio-api.com/search?apikey=${RADIO_API_KEY}&tag=${encodeURIComponent(tag)}&limit=${limit}&offset=${offset}`;
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const data = await resp.json();
    // Normaliza el formato para que coincida con el resto de la app
    return (data.stations || []).map((station: any) => ({
      stationuuid: station.id || station.stationuuid || station.uuid || station.url,
      name: station.name,
      url_resolved: station.url,
      favicon: station.favicon || '',
      country: station.country || '',
      tags: station.tags || '',
      votes: station.votes || 0,
    }));
  } catch (error) {
    return [];
  }
}

// Fallback con Radio API para país o lista de países
async function radioApiFallbackByCountry(countries: string | string[], limit = 50, offset = 0) {
  try {
    const countryList = Array.isArray(countries) ? countries : [countries];
    let allResults: any[] = [];
    for (const country of countryList) {
      const url = `https://api.radio-api.com/search?apikey=${RADIO_API_KEY}&country=${encodeURIComponent(country)}&limit=${limit}&offset=${offset}`;
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const data = await resp.json();
      const stations = (data.stations || []).map((station: any) => ({
        stationuuid: station.id || station.stationuuid || station.uuid || station.url,
        name: station.name,
        url_resolved: station.url,
        favicon: station.favicon || '',
        country: station.country || '',
        tags: station.tags || '',
        votes: station.votes || 0,
      }));
      allResults = allResults.concat(stations);
    }
    // Elimina duplicados
    return allResults.filter((station, index, self) =>
      index === self.findIndex(s => s.stationuuid === station.stationuuid)
    );
  } catch (error) {
    return [];
  }
}

// Modifica getStationsByTag para usar el fallback de Radio API si tampoco hay resultados con radio-browser
export const getStationsByTag = async (
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
  const result = await fetchStations(`stations/bytag/${tag}`, params);
  if (result.length === 0) {
    // Fallback con radio-browser npm package
    const rb = await radioBrowserFallbackByTag(tag, limit, offset);
    if (rb.length > 0) return rb;
    // Fallback con Radio API
    return await radioApiFallbackByTag(tag, limit, offset);
  }
  return result;
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

// Modifica getStationsByCountry para usar el fallback de Radio API si tampoco hay resultados
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
    if (uniqueStations.length > 0) {
      return uniqueStations.sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, limit);
    }
    // Fallback con Radio API
    const radioApiStations = await radioApiFallbackByCountry(countries, limit, offset);
    if (radioApiStations.length > 0) {
      return radioApiStations;
    }
    // Fallback final: emisoras globales populares
    return fetchStations('stations', {
      limit: limit.toString(),
      offset: offset.toString(),
      hidebroken: 'true',
      order: 'votes',
      reverse: 'true'
    });
  } catch (error) {
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
      .catch(async (error) => {
        clearTimeout(timer);
        // Si HEAD falla con 405 o 403, intentar con GET
        if (error && (error.message?.includes('405') || error.message?.includes('403') || error.name === 'TypeError')) {
          try {
            const controller2 = new AbortController();
            const timer2 = setTimeout(() => {
              controller2.abort();
              resolve(false);
            }, timeout);
            await fetch(url, {
              method: 'GET',
              mode: 'no-cors',
              signal: controller2.signal,
              cache: 'no-cache',
            });
            clearTimeout(timer2);
            resolve(true);
          } catch {
            resolve(false);
          }
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