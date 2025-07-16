
const API_BASE_URL = 'https://all.api.radio-browser.info/json';

const fetchStations = async (endpoint: string, params: Record<string, string> = {}) => {
  const url = new URL(`${API_BASE_URL}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.append(key, value);
  });
  
  // Add a cache-busting parameter to ensure a unique request every time.
  url.searchParams.append('_', new Date().getTime().toString());

  try {
    console.log("Fetching stations from URL:", url.toString());
    console.log("With parameters:", params);
    const response = await fetch(url.toString(), {
      method: 'GET',
      cache: 'no-cache', // Still good practice to keep this.
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Filter out stations without a resolved URL, as they cannot be played.
    return data.filter((station: any) => station.url_resolved);
  } catch (error) {
    console.error("Failed to fetch stations:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    } else {
      console.error("Unknown error type:", error);
    }
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

// Función para obtener emisoras colombianas específicas
export const getColombianStations = async (limit = 500) => {
  const colombianStations: any[] = [];

  // Buscar específicamente "Blue Radio Bogota"
  try {
    const blueRadioBogota = await searchStations('Blue Radio Bogota', 10);
    colombianStations.push(...blueRadioBogota);
  } catch (error) {
    console.warn('Error buscando Blue Radio Bogota:', error);
  }
  
  // Definir todas las promesas de búsqueda
  const searchPromises = [];

  // Buscar todas las emisoras de Colombia por país
  searchPromises.push(fetchStations('stations/search', {
    country: 'Colombia',
    limit: limit.toString(),
    hidebroken: 'true',
    order: 'votes',
    reverse: 'true'
  }).catch(error => {
    console.warn('Error buscando emisoras de Colombia por país:', error);
    return [];
  }));

  // También buscar por tag "colombia" y "colombian"
  searchPromises.push(fetchStations('stations/bytag/colombia', {
    limit: '100',
    hidebroken: 'true',
    order: 'votes',
    reverse: 'true'
  }).catch(error => {
    console.warn('Error buscando por tag colombia:', error);
    return [];
  }));

  searchPromises.push(fetchStations('stations/bytag/colombian', {
    limit: '100',
    hidebroken: 'true',
    order: 'votes',
    reverse: 'true'
  }).catch(error => {
    console.warn('Error buscando por tag colombian:', error);
    return [];
  }));

  // Buscar por tags adicionales relacionados con Colombia
  const additionalTags = ['bogota', 'medellin', 'cali', 'barranquilla', 'cartagena', 'pereira', 'manizales', 'bucaramanga', 'vallenato', 'salsa', 'merengue', 'reggaeton', 'bachata'];
  
  // Buscar específicamente Blue Radio y otras emisoras importantes
  const specificStations = ['Blue Radio', 'Olimpica Stereo', 'Caracol Radio', 'RCN Radio', 'W Radio', 'La FM'];
  
  for (const stationName of specificStations) {
    searchPromises.push(fetchStations('stations/search', {
      name: stationName,
      country: 'Colombia',
      limit: '10',
      hidebroken: 'true',
      order: 'votes',
      reverse: 'true'
    }).catch(error => {
      console.warn(`Error buscando ${stationName}:`, error);
      return [];
    }));
  }
  
  for (const tag of additionalTags) {
    searchPromises.push(fetchStations('stations/bytag/' + tag, {
      limit: '50',
      hidebroken: 'true',
      order: 'votes',
      reverse: 'true'
    }).catch(error => {
      console.warn(`Error buscando por tag ${tag}:`, error);
      return [];
    }));
  }

  // Ejecutar todas las promesas en paralelo
  const results = await Promise.all(searchPromises);
  results.forEach(res => colombianStations.push(...res));

  // Eliminar duplicados basándose en stationuuid y ordenar por votos
  const uniqueStations = colombianStations.filter((station, index, self) => 
    index === self.findIndex(s => s.stationuuid === station.stationuuid)
  );
  return uniqueStations.sort((a, b) => (b.votes || 0) - (a.votes || 0))
  .slice(0, limit);
};

// Función para cargar más emisoras colombianas con paginación
export const getMoreColombianStations = async (limit = 50, offset = 0) => {
  const colombianStations: any[] = [];
  const searchPromises = [];

  // Buscar emisoras de Colombia por país con paginación
  searchPromises.push(fetchStations('stations/search', {
    country: 'Colombia',
    limit: limit.toString(),
    offset: offset.toString(),
    hidebroken: 'true',
    order: 'votes',
    reverse: 'true'
  }).catch(error => {
    console.warn('Error buscando más emisoras de Colombia:', error);
    return [];
  }));

  // Buscar por tags adicionales con paginación
  const additionalTags = ['bogota', 'medellin', 'cali', 'barranquilla', 'cartagena', 'pereira', 'manizales', 'bucaramanga', 'vallenato', 'salsa', 'merengue', 'reggaeton', 'bachata'];
  
  // Buscar específicamente Blue Radio y otras emisoras importantes con paginación
  const specificStations = ['Blue Radio', 'Olimpica Stereo', 'Caracol Radio', 'RCN Radio', 'W Radio', 'La FM'];

  for (const stationName of specificStations) {
    searchPromises.push(fetchStations('stations/search', {
      name: stationName,
      country: 'Colombia',
      limit: '10',
      hidebroken: 'true',
      order: 'votes',
      reverse: 'true'
    }).catch(error => {
      console.warn(`Error buscando ${stationName}:`, error);
      return [];
    }));
  }

  for (const tag of additionalTags) {
    searchPromises.push(fetchStations('stations/bytag/' + tag, {
      limit: '50',
      hidebroken: 'true',
      order: 'votes',
      reverse: 'true'
    }).catch(error => {
      console.warn(`Error buscando por tag ${tag}:`, error);
      return [];
    }));
  }

  // Ejecutar todas las promesas en paralelo
  const results = await Promise.all(searchPromises);
  results.forEach(res => colombianStations.push(...res));

  // Eliminar duplicados basándose en stationuuid
  const uniqueStations = colombianStations.filter((station, index, self) => 
    index === self.findIndex(s => s.stationuuid === station.stationuuid)
  );

  // Ordenar por votos y limitar el resultado
  return uniqueStations
    .sort((a, b) => (b.votes || 0) - (a.votes || 0))
    .slice(0, limit);
  

};