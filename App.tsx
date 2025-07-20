
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FixedSizeList } from 'react-window';
import { translations, languages } from './i18n.js';
import { searchStations, getStationsByUuids, fetchRandomStations, getStationsByTag, getStationsByTagAggressive, getColombianStations, getMoreColombianStations, filterStationsByStream, getStationsByCountry, getMoreStationsByCountry } from './services/radioService.js';
import { useFavorites } from './hooks/useFavorites.js';
import Player from './components/Player.jsx';
import StationCard from './components/StationCard.jsx';
import Modal from './components/Modal.jsx';
import Spinner from './components/Spinner.jsx';
import HeroSlider from './components/HeroSlider.jsx';
import FloatingNav from './components/FloatingNav.jsx';
import SEOHead from './components/SEOHead.jsx';
import PWAInstallPrompt from './components/PWAInstallPrompt.jsx';
import { HeartIcon, SunIcon, MoonIcon, SearchIcon, MenuIcon, GithubIcon, BriefcaseIcon, WhatsAppIcon, MicrophoneIcon, XIcon, ChevronUpIcon } from './components/Icons.jsx';
import type { Station } from './types';
import { AdSenseBlock } from './components/StationCard';

// Declarar CONTINENTS, selectedContinent y filteredCountries aquí, antes de App
export const CONTINENTS = [
  { name: 'Todos los continentes', countries: [] },
  { name: 'América', countries: [
    'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Ecuador',
    'El Salvador', 'Guatemala', 'Honduras', 'México', 'Nicaragua', 'Panamá', 'Paraguay',
    'Perú', 'Puerto Rico', 'República Dominicana', 'Uruguay', 'Venezuela',
    'Estados Unidos', 'Canadá', 'Jamaica', 'Haití', 'Trinidad y Tobago', 'Bahamas', 'Barbados', 'Belice', 'Dominica', 'Granada', 'Guyana', 'San Cristóbal y Nieves', 'Santa Lucía', 'San Vicente y las Granadinas', 'Surinam'
  ] },
  { name: 'Europa', countries: [
    'España', 'Francia', 'Alemania', 'Italia', 'Reino Unido', 'Portugal', 'Países Bajos', 'Bélgica', 'Suiza', 'Suecia', 'Noruega', 'Dinamarca', 'Finlandia', 'Irlanda', 'Polonia', 'Rusia', 'Ucrania', 'Rumanía', 'Hungría', 'Grecia', 'Austria', 'República Checa', 'Eslovaquia', 'Bulgaria', 'Croacia', 'Serbia', 'Eslovenia', 'Estonia', 'Letonia', 'Lituania', 'Luxemburgo', 'Malta', 'Moldavia', 'Montenegro', 'Macedonia del Norte', 'Bosnia y Herzegovina', 'Albania'
  ] },
  { name: 'Asia', countries: [
    'China', 'Japón', 'Corea del Sur', 'India', 'Indonesia', 'Tailandia', 'Vietnam', 'Filipinas', 'Malasia', 'Singapur', 'Pakistán', 'Bangladés', 'Arabia Saudita', 'Israel', 'Irán', 'Irak', 'Turquía', 'Kazajistán', 'Uzbekistán', 'Sri Lanka', 'Nepal', 'Camboya', 'Mongolia', 'Afganistán', 'Kuwait', 'Qatar', 'Emiratos Árabes Unidos', 'Jordania', 'Líbano', 'Siria', 'Omán', 'Yemen'
  ] },
  { name: 'África', countries: [
    'Sudáfrica', 'Nigeria', 'Egipto', 'Argelia', 'Marruecos', 'Etiopía', 'Kenia', 'Ghana', 'Túnez', 'Angola', 'Mozambique', 'Senegal', 'Camerún', 'Costa de Marfil', 'Tanzania', 'Uganda', 'Zimbabue', 'República Democrática del Congo', 'Sudán', 'Libia', 'Botsuana', 'Namibia', 'Ruanda', 'Gabón', 'Mauricio', 'Seychelles', 'Madagascar', 'Malawi', 'Burkina Faso', 'Níger', 'Benín', 'Chad', 'Guinea', 'Cabo Verde', 'Somalia', 'Sierra Leona', 'Togo', 'Gambia', 'Liberia', 'República Centroafricana', 'Eritrea', 'Guinea-Bisáu', 'Lesoto', 'Suazilandia', 'Yibuti', 'Comoras', 'Santo Tomé y Príncipe'
  ] },
  { name: 'Oceanía', countries: [
    'Australia', 'Nueva Zelanda', 'Fiyi', 'Papúa Nueva Guinea', 'Samoa', 'Tonga', 'Vanuatu', 'Islas Salomón', 'Micronesia', 'Islas Marshall', 'Palaos', 'Nauru', 'Tuvalu', 'Kiribati'
  ] }
];

const PAGE_SIZE = 15; // Optimizado para carga rápida

const useDebounce = (value: any, delay: number): any => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

const ServiceBanner = ({ t, onClose }: { t: (key: string) => string; onClose: () => void }) => {
  const whatsAppNumber = "573052891719";
  const message = encodeURIComponent(t('whatsappMessage'));
  const whatsAppLink = `https://wa.me/${whatsAppNumber}?text=${message}`;

  return (
    <div className="bg-brand-500 text-white rounded-lg p-3 md:p-6 my-4 md:my-6 flex flex-col md:flex-row items-center justify-between shadow-lg relative">
      {/* Botón de cierre - movido arriba a la izquierda */}
      <button
        onClick={onClose}
        className="absolute top-2 left-2 md:top-3 md:left-3 p-1 rounded-full hover:bg-white/20 transition-colors z-10"
        title="Cerrar"
      >
        <XIcon className="w-5 h-5 md:w-6 md:h-6" />
      </button>
      
      <div className="text-center md:text-left pl-8 md:pl-12">
        <h3 className="text-lg md:text-2xl font-bold">{t('serviceBannerTitle')}</h3>
        <p className="mt-1 opacity-90 text-sm md:text-base">{t('serviceBannerText')}</p>
      </div>
      <a 
        href={whatsAppLink} 
        target="_blank" 
        rel="noopener noreferrer"
        className="mt-3 md:mt-0 flex-shrink-0 px-4 md:px-6 py-2 md:py-3 bg-white text-brand-600 font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-md flex items-center gap-2 text-sm md:text-base"
      >
        <WhatsAppIcon className="w-5 h-5 md:w-6 md:h-6" />
        <span>{t('serviceBannerCTA')}</span>
      </a>
    </div>
  );
};

const PolicyDisplay = ({ text }: { text: string }) => {
  return (
    <div className="space-y-4 text-gray-600 dark:text-gray-300 text-sm sm:text-base max-w-full">
      {text.split('\n\n').map((paragraph: string, index: number) => {
        if (paragraph.startsWith('### ')) {
          return <h4 key={index} className="font-bold text-lg mt-4 mb-2 text-gray-800 dark:text-gray-100 first:mt-0">{paragraph.substring(4)}</h4>
        }
        if (paragraph.startsWith('- ')) {
             return <ul key={index} className="list-disc list-inside space-y-1 pl-4">
                {paragraph.split('\n').map((item: string, i: number) => <li key={i}>{item.substring(2)}</li>)}
             </ul>
        }
        return <p key={index}>{paragraph}</p>
      })}
    </div>
  );
};

const ContactContent = ({ t }: { t: (key: string) => string }) => (
  <div className="text-center">
    <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">{t('contactTitle')}</h3>
    <p className="text-gray-600 dark:text-gray-400 mb-6">{t('contactText')}</p>
    <div className="flex flex-col items-center gap-4">
        <p className="font-semibold">{t('developer')}: Armando Ovalle Jácome</p>
        <div className="flex justify-center gap-4">
            <a href="https://github.com/jacar" target="_blank" rel="noopener noreferrer" title="GitHub" className="text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 p-2 rounded-full bg-gray-100 dark:bg-gray-700 transition-colors">
                <GithubIcon className="w-8 h-8"/>
            </a>
            <a href="https://www.armandomi.space/" target="_blank" rel="noopener noreferrer" title={t('portfolio')} className="text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 p-2 rounded-full bg-gray-100 dark:bg-gray-700 transition-colors">
                <BriefcaseIcon className="w-8 h-8"/>
            </a>
        </div>
    </div>
  </div>
);


export default function App() {
  // --- Hooks de estado y memo al inicio ---
  const [stations, setStations] = useState<Station[]>([]);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoriteStations, setFavoriteStations] = useState<Station[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const { favoriteUuids, toggleFavorite, isFavorite } = useFavorites();
  const [view, setView] = useState('default');
  const [isRandomLoading, setIsRandomLoading] = useState(false);
  const [isColombianLoading, setIsColombianLoading] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'es');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [showServiceBanner, setShowServiceBanner] = useState(() => {
    return localStorage.getItem('serviceBannerClosed') !== 'true';
  });
  const [showScrollTop, setShowScrollTop] = useState(false);
  const offset = useRef(0);
  const [hasMore, setHasMore] = useState(true);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const recognitionRef = useRef<any>(null);
  const [playbackErrorMsg, setPlaybackErrorMsg] = useState<string | null>(null);
  const BLOCKED_KEY = 'radioBlockedStations';
  const [blockedUuids, setBlockedUuids] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(BLOCKED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  // Nuevo: estado para emisoras no disponibles
  const [unavailableStations, setUnavailableStations] = useState<string[]>([]);
  // --- Filtros de continente y país ---
  const [selectedContinent, setSelectedContinent] = useState<string>('Todos los continentes');
  const [selectedCountry, setSelectedCountry] = useState<string>('Latinoamérica');
  const filteredCountries = useMemo(() => {
    if (selectedContinent === 'Todos los continentes') {
      return CONTINENTS.flatMap(c => c.countries).filter((v, i, a) => v && a.indexOf(v) === i);
    }
    const continent = CONTINENTS.find(c => c.name === selectedContinent);
    return continent ? continent.countries : [];
  }, [selectedContinent]);

  // Diccionario de mapeo de países español → inglés (completo)
  const COUNTRY_NAME_MAP: Record<string, string> = {
    // Europa
    'España': 'Spain',
    'Francia': 'France',
    'Alemania': 'Germany',
    'Italia': 'Italy',
    'Reino Unido': 'United Kingdom',
    'Portugal': 'Portugal',
    'Países Bajos': 'Netherlands',
    'Bélgica': 'Belgium',
    'Suiza': 'Switzerland',
    'Suecia': 'Sweden',
    'Noruega': 'Norway',
    'Dinamarca': 'Denmark',
    'Finlandia': 'Finland',
    'Irlanda': 'Ireland',
    'Polonia': 'Poland',
    'Rusia': 'Russia',
    'Ucrania': 'Ukraine',
    'Rumanía': 'Romania',
    'Hungría': 'Hungary',
    'Grecia': 'Greece',
    'Austria': 'Austria',
    'República Checa': 'Czech Republic',
    'Eslovaquia': 'Slovakia',
    'Bulgaria': 'Bulgaria',
    'Croacia': 'Croatia',
    'Serbia': 'Serbia',
    'Eslovenia': 'Slovenia',
    'Estonia': 'Estonia',
    'Letonia': 'Latvia',
    'Lituania': 'Lithuania',
    'Luxemburgo': 'Luxembourg',
    'Malta': 'Malta',
    'Moldavia': 'Moldova',
    'Montenegro': 'Montenegro',
    'Macedonia del Norte': 'North Macedonia',
    'Bosnia y Herzegovina': 'Bosnia and Herzegovina',
    'Albania': 'Albania',
    // América
    'Argentina': 'Argentina',
    'Bolivia': 'Bolivia',
    'Brasil': 'Brazil',
    'Chile': 'Chile',
    'Colombia': 'Colombia',
    'Costa Rica': 'Costa Rica',
    'Cuba': 'Cuba',
    'Ecuador': 'Ecuador',
    'El Salvador': 'El Salvador',
    'Guatemala': 'Guatemala',
    'Honduras': 'Honduras',
    'México': 'Mexico',
    'Nicaragua': 'Nicaragua',
    'Panamá': 'Panama',
    'Paraguay': 'Paraguay',
    'Perú': 'Peru',
    'Puerto Rico': 'Puerto Rico',
    'República Dominicana': 'Dominican Republic',
    'Uruguay': 'Uruguay',
    'Venezuela': 'Venezuela',
    'Estados Unidos': 'United States',
    'Canadá': 'Canada',
    'Jamaica': 'Jamaica',
    'Haití': 'Haiti',
    'Trinidad y Tobago': 'Trinidad and Tobago',
    'Bahamas': 'Bahamas',
    'Barbados': 'Barbados',
    'Belice': 'Belize',
    'Dominica': 'Dominica',
    'Granada': 'Grenada',
    'Guyana': 'Guyana',
    'San Cristóbal y Nieves': 'Saint Kitts and Nevis',
    'Santa Lucía': 'Saint Lucia',
    'San Vicente y las Granadinas': 'Saint Vincent and the Grenadines',
    'Surinam': 'Suriname',
    // Asia
    'China': 'China',
    'Japón': 'Japan',
    'Corea del Sur': 'South Korea',
    'India': 'India',
    'Indonesia': 'Indonesia',
    'Tailandia': 'Thailand',
    'Vietnam': 'Vietnam',
    'Filipinas': 'Philippines',
    'Malasia': 'Malaysia',
    'Singapur': 'Singapore',
    'Pakistán': 'Pakistan',
    'Bangladés': 'Bangladesh',
    'Arabia Saudita': 'Saudi Arabia',
    'Israel': 'Israel',
    'Irán': 'Iran',
    'Irak': 'Iraq',
    'Turquía': 'Turkey',
    'Kazajistán': 'Kazakhstan',
    'Uzbekistán': 'Uzbekistan',
    'Sri Lanka': 'Sri Lanka',
    'Nepal': 'Nepal',
    'Camboya': 'Cambodia',
    'Mongolia': 'Mongolia',
    'Afganistán': 'Afghanistan',
    'Kuwait': 'Kuwait',
    'Qatar': 'Qatar',
    'Emiratos Árabes Unidos': 'United Arab Emirates',
    'Jordania': 'Jordan',
    'Líbano': 'Lebanon',
    'Siria': 'Syria',
    'Omán': 'Oman',
    'Yemen': 'Yemen',
    // África
    'Sudáfrica': 'South Africa',
    'Nigeria': 'Nigeria',
    'Egipto': 'Egypt',
    'Argelia': 'Algeria',
    'Marruecos': 'Morocco',
    'Etiopía': 'Ethiopia',
    'Kenia': 'Kenya',
    'Ghana': 'Ghana',
    'Túnez': 'Tunisia',
    'Angola': 'Angola',
    'Mozambique': 'Mozambique',
    'Senegal': 'Senegal',
    'Camerún': 'Cameroon',
    'Costa de Marfil': 'Ivory Coast',
    'Tanzania': 'Tanzania',
    'Uganda': 'Uganda',
    'Zimbabue': 'Zimbabwe',
    'República Democrática del Congo': 'Democratic Republic of the Congo',
    'Sudán': 'Sudan',
    'Libia': 'Libya',
    'Botsuana': 'Botswana',
    'Namibia': 'Namibia',
    'Ruanda': 'Rwanda',
    'Gabón': 'Gabon',
    'Mauricio': 'Mauritius',
    'Seychelles': 'Seychelles',
    'Madagascar': 'Madagascar',
    'Malawi': 'Malawi',
    'Burkina Faso': 'Burkina Faso',
    'Níger': 'Niger',
    'Benín': 'Benin',
    'Chad': 'Chad',
    'Guinea': 'Guinea',
    'Cabo Verde': 'Cape Verde',
    'Somalia': 'Somalia',
    'Sierra Leona': 'Sierra Leone',
    'Togo': 'Togo',
    'Gambia': 'Gambia',
    'Liberia': 'Liberia',
    'República Centroafricana': 'Central African Republic',
    'Eritrea': 'Eritrea',
    'Guinea-Bisáu': 'Guinea-Bissau',
    'Lesoto': 'Lesotho',
    'Suazilandia': 'Eswatini',
    'Yibuti': 'Djibouti',
    'Comoras': 'Comoros',
    'Santo Tomé y Príncipe': 'Sao Tome and Principe',
    // Oceanía
    'Australia': 'Australia',
    'Nueva Zelanda': 'New Zealand',
    'Fiyi': 'Fiji',
    'Papúa Nueva Guinea': 'Papua New Guinea',
    'Samoa': 'Samoa',
    'Tonga': 'Tonga',
    'Vanuatu': 'Vanuatu',
    'Islas Salomón': 'Solomon Islands',
    'Micronesia': 'Micronesia',
    'Islas Marshall': 'Marshall Islands',
    'Palaos': 'Palau',
    'Nauru': 'Nauru',
    'Tuvalu': 'Tuvalu',
    'Kiribati': 'Kiribati'
  };

  // Simplificar t para evitar errores de tipado
  const t = useCallback((key: string) => {
    // @ts-ignore
    return translations[language]?.[key] || translations.en[key];
  }, [language]);

  const filterBlocked = useCallback((stations: Station[]) => stations.filter((s: Station) => !blockedUuids.includes(s.stationuuid)), [blockedUuids]);

  const closeServiceBanner = () => {
    setShowServiceBanner(false);
    localStorage.setItem('serviceBannerClosed', 'true');
  };

  const resetServiceBanner = () => {
    setShowServiceBanner(true);
    localStorage.removeItem('serviceBannerClosed');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Detectar scroll para mostrar/ocultar flecha
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Helper para obtener suficientes emisoras funcionales
  async function fetchEnoughFunctionalStations(apiCall: (offset?: number) => Promise<Station[]>, pageSize = PAGE_SIZE, maxTries = 10) {
    let result: Station[] = [];
    let offsetValue = 0;
    let tries = 0;
    while (result.length < pageSize && tries < maxTries) {
      const stations = await apiCall(offsetValue);
      if (!stations || stations.length === 0) {
        // Si no hay más emisoras, intentar con un offset diferente
        offsetValue += pageSize;
        tries++;
        continue;
      }
      const filtered = filterBlocked(stations);
      // Reducir el timeout para que no bloquee tanto y obtener más emisoras
      const functional = await filterStationsByStream(filtered, 300);
      result = result.concat(functional);
      offsetValue += stations.length;
      tries++;
      // Continuar intentando incluso si no hay emisoras funcionales
      if (stations.length === 0 && tries > 5) {
        // Intentar con un offset mucho mayor
        offsetValue += pageSize * 10;
      }
    }
    return result.slice(0, pageSize);
  }

  // Nuevo: contador de intentos vacíos consecutivos
  const [emptyTries, setEmptyTries] = useState(0);
  const MAX_EMPTY_TRIES = 20; // Aumentado para permitir más intentos

  const fetchStationsCallback = useCallback(async (apiCall: (offset?: number) => Promise<Station[]>, isNewSearch: boolean) => {
    // Prevenir múltiples llamadas simultáneas
    if (isLoading) return;
    
    // Prevenir loop infinito - máximo 50 intentos
    if (emptyTries > 50) {
      setHasMore(false);
      return;
    }
    
    if(isNewSearch) {
        offset.current = 0;
        setStations([]);
        setHasMore(true);
        setEmptyTries(0);
    }
    setIsLoading(true);
    setError(null);
    try {
      // Llamar directamente a la API con el offset actual
      const newStations = await apiCall(offset.current);
      if (newStations && newStations.length > 0) {
        const filtered = filterBlocked(newStations);
        // Usar directamente las emisoras filtradas sin verificar streams
        setStations(prev => isNewSearch ? filtered : [...prev, ...filtered]);
        offset.current += newStations.length;
        setHasMore(true);
        setEmptyTries(0);
      } else {
        // Si no hay emisoras, incrementar offset y seguir intentando
        offset.current += PAGE_SIZE;
        setHasMore(true);
        setEmptyTries(prev => prev + 1);
      }
    } catch (err) {
      console.error("Failed to fetch stations:", err);
      // Incrementar offset y seguir intentando
      offset.current += PAGE_SIZE;
      setHasMore(true);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, filterBlocked, PAGE_SIZE, emptyTries]);
  
  const observer = useRef<IntersectionObserver | null>(null);
  
  // Lista de países de Latinoamérica (puedes ampliar esta lista)
  const LATAM_COUNTRIES = [
    'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Ecuador',
    'El Salvador', 'Guatemala', 'Honduras', 'México', 'Nicaragua', 'Panamá', 'Paraguay',
    'Perú', 'Puerto Rico', 'República Dominicana', 'Uruguay', 'Venezuela'
  ];

  // Nueva función para obtener emisoras según país seleccionado
  const fetchStationsByCountry = useCallback(async (offset = 0) => {
    if (selectedCountry === 'Latinoamérica') {
      return getStationsByCountry(LATAM_COUNTRIES, PAGE_SIZE, offset);
    } else if (
      (selectedCountry === 'Todos' || selectedCountry === 'Todos los países') &&
      (selectedContinent === 'Todos los continentes')
    ) {
      // Sin filtro: traer emisoras globales
      return getStationsByCountry('', PAGE_SIZE, offset);
    } else if (selectedCountry === 'Todos' || selectedCountry === 'Todos los países') {
      // Obtener emisoras de todos los países del continente seleccionado
      let perCountry = 15;
      if (selectedContinent === 'Europa') {
        perCountry = 25;
      } else if (selectedContinent === 'América') {
        perCountry = 20;
      }
      
      const results = await Promise.all(
        filteredCountries.map(async (country) => {
          const apiCountry = COUNTRY_NAME_MAP[country] || country;
          let stations = await getStationsByCountry(apiCountry, perCountry, offset);
          if (!stations || stations.length === 0) {
            stations = await searchStations(apiCountry, perCountry, offset);
          }
          if (!stations || stations.length === 0) {
            stations = await getStationsByTag(apiCountry.toLowerCase(), perCountry, offset);
          }
          return stations;
        })
      );
      // Aplanar y eliminar duplicados por stationuuid
      const allStations = results.flat();
      const uniqueStations = allStations.filter((station, index, self) =>
        index === self.findIndex(s => s.stationuuid === station.stationuuid)
      );
      return uniqueStations.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    } else {
      // País específico seleccionado
      const apiCountry = COUNTRY_NAME_MAP[selectedCountry] || selectedCountry;
      let stations = await getStationsByCountry(apiCountry, PAGE_SIZE, offset);
      if (!stations || stations.length === 0) {
        stations = await searchStations(apiCountry, PAGE_SIZE, offset);
      }
      if (!stations || stations.length === 0) {
        stations = await getStationsByTag(apiCountry.toLowerCase(), PAGE_SIZE, offset);
      }
      return stations;
    }
  }, [selectedCountry, selectedContinent, filteredCountries, PAGE_SIZE, COUNTRY_NAME_MAP]);

  // Función simple para cargar más emisoras
  const loadMoreStations = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      let newStations: Station[] = [];
      
      if (view === 'search' && debouncedSearchTerm) {
        newStations = await searchStations(debouncedSearchTerm, PAGE_SIZE, offset.current);
      } else if (view === 'random') {
        return; // No cargar más en vista aleatoria
      } else {
        newStations = await fetchStationsByCountry(offset.current);
      }
      
      if (newStations && newStations.length > 0) {
        setStations(prev => [...prev, ...newStations]);
        offset.current += newStations.length;
      } else {
        setHasMore(false);
      }
    } catch (err) {
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, PAGE_SIZE, view, debouncedSearchTerm, fetchStationsByCountry]);

  // Modificar el observer para infinite scroll global
  const lastStationElementRef = useCallback((node: Element | null) => {
    if (isLoading) return;
    
    if (observer.current) {
      observer.current.disconnect();
    }
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !isLoading) {
        loadMoreStations();
      }
    });
    
    if (node) {
      observer.current.observe(node);
    }
  }, [isLoading, loadMoreStations]);

  // Cambiar la carga inicial para priorizar Latinoamérica
  useEffect(() => {
    if (view === 'default') {
      setStations([]);
      setHasMore(true);
      offset.current = 0;
      fetchStationsCallback(fetchStationsByCountry, true);
    }
  }, [selectedCountry, view]);

  useEffect(() => {
    // Do not trigger search changes while a random search is loading to prevent race conditions.
    if (isRandomLoading) return;
    
    if (view === 'search' && !debouncedSearchTerm) {
      // If search is cleared, go home
      setView('default');
    } else if (debouncedSearchTerm && view === 'search') {
      // Cargar búsqueda inicial
      setIsLoading(true);
      searchStations(debouncedSearchTerm, PAGE_SIZE, 0)
        .then(stations => {
          const filtered = filterBlocked(stations);
          setStations(filtered);
          offset.current = stations.length;
          setHasMore(stations.length >= PAGE_SIZE);
        })
        .catch(err => {
          console.error("Search failed:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [debouncedSearchTerm, view, isRandomLoading, filterBlocked, PAGE_SIZE]);

  useEffect(() => {
    document.documentElement.lang = language;
    const root = window.document.documentElement;
    const isDark = theme === 'dark';
    root.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);
  }, [theme, language]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current && !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Cambia la carga inicial para usar PAGE_SIZE - solo una vez al montar
  useEffect(() => {
    const loadInitialStations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Usar la función agresiva para obtener más emisoras
        const fastLatino = await getStationsByTagAggressive('latino', PAGE_SIZE * 2, 0);
        const filtered = filterBlocked(fastLatino);
        setStations(filtered);
        setHasMore(true); // Siempre permitir más carga
        offset.current = PAGE_SIZE * 2;
      } catch (err) {
        console.error("Failed to fetch initial stations:", err);
        // No mostrar error al usuario
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialStations();
  }, []); // Solo ejecutar al montar el componente

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handlePlay = (station: Station) => {
    if (currentStation?.stationuuid === station.stationuuid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStation(station);
      setIsPlaying(true);
    }
    if (isSearchModalOpen) {
      setIsSearchModalOpen(false);
    }
  };
  
  // Mejorar el manejo de errores de reproducción
  const handlePlaybackError = useCallback((stationUuid: string) => {
    console.warn(`Marking station as unavailable: ${stationUuid}`);
    setUnavailableStations(prev => prev.includes(stationUuid) ? prev : [...prev, stationUuid]);
    setBlockedUuids(prev => {
      if (!prev.includes(stationUuid)) {
        const updated = [...prev, stationUuid];
        localStorage.setItem(BLOCKED_KEY, JSON.stringify(updated));
        return updated;
      }
      return prev;
    });

    if (isFavorite(stationUuid)) {
      toggleFavorite(stationUuid);
    }

    if (currentStation?.stationuuid === stationUuid) {
      setCurrentStation(null);
      setIsPlaying(false);
      setPlaybackErrorMsg(t('error') + ': ' + t('notAvailable'));
      setTimeout(() => setPlaybackErrorMsg(null), 5000); // Oculta el error después de 5s
    }
  }, [currentStation, isFavorite, toggleFavorite, t]);

  const handleTogglePlay = () => setIsPlaying(prev => !prev);
  const handleClosePlayer = () => {
    setIsPlaying(false);
    setCurrentStation(null);
  };
  
  const handleRandomStation = useCallback(async () => {
    setIsRandomLoading(true);
    setSearchTerm('');
    try {
        const randomStations = await fetchRandomStations(PAGE_SIZE);
        setView('random');
        setStations(randomStations);
        setHasMore(false);
        offset.current = randomStations.length;
    } catch (err) {
        console.error("Failed to get random stations:", err);
        setError(t('error'));
    } finally {
        setIsRandomLoading(false);
    }
  }, [t]);

  const handleColombianStations = useCallback(async (limit = PAGE_SIZE) => {
    setIsColombianLoading(true);
    setSearchTerm('');
    try {
        const colombianStations = await getColombianStations(limit);
        setView('colombian');
        setStations(colombianStations);
        setHasMore(colombianStations.length === limit);
        offset.current = colombianStations.length;
    } catch (err) {
        console.error("Failed to get Colombian stations:", err);
        setError(t('error'));
    } finally {
        setIsColombianLoading(false);
    }
  }, [t]);

  const openModal = (type: string) => {
    if (type === 'favorites') {
      setIsLoadingFavorites(true);
      getStationsByUuids(favoriteUuids)
        .then(async (stations) => {
          // Filtrar favoritos funcionales
          const functionalFavorites = await filterStationsByStream(stations, 2000);
          setFavoriteStations(functionalFavorites);
        })
        .catch((err) => {
            console.error("Failed to fetch favorites:", err);
            // No mostrar error al usuario
        })
        .finally(() => setIsLoadingFavorites(false));
    }
    setModalContent(type);
  };

  const handleHomeClick = useCallback(() => {
    setSearchTerm('');
    if (view !== 'default') {
      setView('default');
      fetchStationsCallback((offset) => getStationsByTag('latino', PAGE_SIZE, 0), true);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view, fetchStationsCallback]);
  
  const handleVoiceSearch = () => {
    // Verificar si el navegador soporta reconocimiento de voz
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setVoiceError(t('voiceSearchError'));
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setVoiceError(null);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Configurar el reconocimiento
      recognition.lang = language === 'es' ? 'es-ES' : 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
        console.log('Voice recognition started');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          console.log('Final transcript:', finalTranscript);
          setSearchTerm(finalTranscript);
          recognition.stop();
        } else if (interimTranscript) {
          console.log('Interim transcript:', interimTranscript);
          setSearchTerm(interimTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Voice recognition error:', event.error);
        setVoiceError(t('voiceSearchError'));
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log('Voice recognition ended');
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setVoiceError(t('voiceSearchError'));
    }
  };

  const headerTitle = useMemo(() => {
    switch(view) {
        case 'default': return t('featuredStations');
        case 'random': return t('randomStations');
        case 'colombian': return 'Emisoras Colombianas';
        case 'search': return debouncedSearchTerm ? `${t('searchResults')}: "${debouncedSearchTerm}"` : t('searchResults');
        default: return t('featuredStations');
    }
  }, [view, t, debouncedSearchTerm]);

  const getModalTitle = () => {
    switch (modalContent) {
        case 'favorites': return t('favorites');
        case 'privacy': return t('privacy');
        case 'terms': return t('terms');
        case 'contact': return t('contact');
        default: return '';
    }
  }

  const renderModalContent = () => {
    switch (modalContent) {
        case 'favorites':
            return isLoadingFavorites ? (
              <div className="flex justify-center items-center h-48"><Spinner className="w-8 h-8 text-brand-500" /></div>
            ) : favoriteStations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favoriteStations.map(station => (
                  <StationCard key={station.stationuuid} station={station} onPlay={(s) => { handlePlay(s); setModalContent(null); }} isFavorite={isFavorite(station.stationuuid)} onToggleFavorite={toggleFavorite} isPlaying={isPlaying} currentStationUuid={currentStation?.stationuuid ?? null} t={t} />
                ))}
              </div>
            ) : <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('emptyFavorites')}</p>;
        case 'privacy':
            return <PolicyDisplay text={t('privacyContent')} />;
        case 'terms':
            return <PolicyDisplay text={t('termsContent')} />;
        case 'contact':
            return <ContactContent t={t} />;
        default: return null;
    }
  }

  // Nuevo: estado para resultados de búsqueda local en móvil
  const [localSearchResults, setLocalSearchResults] = useState<Station[]>([]);

  // Nuevo: efecto para búsqueda local en móvil
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768 && debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      const results = stations.filter(station =>
        station.name.toLowerCase().includes(term) ||
        station.country?.toLowerCase().includes(term) ||
        station.tags?.toLowerCase().includes(term)
      );
      setLocalSearchResults(results);
      setView('search');
    } else if (typeof window !== 'undefined' && window.innerWidth < 768 && !debouncedSearchTerm) {
      setLocalSearchResults([]);
      setView('default');
    }
  }, [debouncedSearchTerm, stations]);

  // Si el país seleccionado no está en el continente, resetearlo SOLO si no es válido
  useEffect(() => {
    if (
      selectedCountry !== 'Latinoamérica' &&
      selectedCountry !== 'Todos' &&
      selectedCountry !== 'Todos los países' &&
      !filteredCountries.includes(selectedCountry)
    ) {
      // Solo resetear si el país no es válido en el continente actual
      setSelectedCountry(filteredCountries.length > 0 ? filteredCountries[0] : 'Todos');
    }
  }, [selectedContinent, filteredCountries, selectedCountry]);

  return (
    <div className="min-h-screen text-gray-800 dark:text-gray-200 font-sans flex flex-col overflow-x-hidden">
      <SEOHead 
        currentStation={currentStation ? {
          name: currentStation.name,
          country: currentStation.country || 'Unknown',
          genre: currentStation.tags || 'Radio',
          url: currentStation.url_resolved || currentStation.url
        } : undefined}
      />
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm">
        {playbackErrorMsg && (
          <div className="w-full bg-red-500 text-white text-center py-2 font-semibold animate-pulse">
            {playbackErrorMsg}
          </div>
        )}
        <div className="container mx-auto px-4 py-3 relative">
                      <div className="flex justify-between items-center gap-2 md:gap-4">
                              <a href="/" className="flex-shrink-0">
                  <img src="/logo.svg" alt="Radio.gratis Logo" className="h-12 block dark:hidden" />
                  <img src="/logo-dark.svg" alt="Radio.gratis Logo Dark" className="h-12 hidden dark:block" />
                </a>
            
            {/* Buscador solo visible en md+ */}
            <div className="relative flex-1 min-w-0 max-w-xl hidden md:block">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                id="desktop-search"
                name="search"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-10 pr-12 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
              />
              <button
                onClick={handleVoiceSearch}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                  isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-brand-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={t('voiceSearchTitle')}
              >
                <MicrophoneIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
                 <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1.5 px-2 text-sm focus:ring-brand-500 focus:border-brand-500"
                    aria-label={t('language')}
                >
                    {languages.map(lang => <option key={lang.id} value={lang.id}>{lang.name}</option>)}
                </select>
                <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title={theme === 'light' ? 'Dark mode' : 'Light mode'}>
                    {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                </button>
                <button ref={menuButtonRef} onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Menu">
                    <MenuIcon className="w-5 h-5"/>
                </button>
            </div>
          </div>
          {isMenuOpen && (
            <div ref={menuRef} className="absolute top-full right-4 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 p-2 z-40">
              <ul className="flex flex-col gap-1">
                <li><button onClick={() => {openModal('contact'); setIsMenuOpen(false);}} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">{t('contact')}</button></li>
                <li><button onClick={() => {openModal('terms'); setIsMenuOpen(false);}} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">{t('terms')}</button></li>
                <li><button onClick={() => {openModal('privacy'); setIsMenuOpen(false);}} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">{t('privacy')}</button></li>
              </ul>
            </div>
          )}
        </div>
      </header>
      
      <main className={`container mx-auto p-4 flex-grow w-full ${currentStation ? 'pb-40 md:pb-32' : 'pb-24'}`}>
        {view !== 'search' && <HeroSlider onPlayStation={handlePlay} t={t} />}

        {view === 'default' && showServiceBanner && <ServiceBanner t={t} onClose={closeServiceBanner} />}

        {/* Filtro visual para elegir país y continente */}
        <div className="mb-4 flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
          <label className="font-semibold mr-2 sm:mb-0 mb-1">Continente:</label>
          <select
            className="p-2 rounded border dark:bg-gray-800 dark:text-white w-full sm:w-auto"
            value={selectedContinent}
            onChange={e => setSelectedContinent(e.target.value)}
          >
            {CONTINENTS.map(cont => (
              <option key={cont.name} value={cont.name}>{cont.name}</option>
            ))}
          </select>
          <label className="font-semibold mx-2 sm:mb-0 mb-1">País:</label>
          <select
            className="p-2 rounded border dark:bg-gray-800 dark:text-white w-full sm:w-auto"
            value={selectedCountry}
            onChange={e => setSelectedCountry(e.target.value)}
          >
            <option value="Latinoamérica">Latinoamérica</option>
            {filteredCountries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
            <option value="Todos">Todos los países</option>
          </select>
        </div>

        <div className="flex justify-between items-baseline mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 truncate">{headerTitle}</h2>
          {(isListening || (view === 'search' && isLoading)) && <Spinner className="w-6 h-6 text-brand-500" />}
        </div>
        
        {voiceError && <p className="text-center text-red-500 mb-2">{voiceError}</p>}
        
        {(isLoading || isColombianLoading) && stations.length === 0 ? (
          <div className="flex justify-center items-center h-64"><Spinner className="w-12 h-12 text-brand-500" /></div>
        ) : stations.length > 0 ? (
          <>
            <div className="space-y-4">
              {stations.map((station, index) => {
                const isLastItem = index === stations.length - 1;
                const isUnavailable = unavailableStations?.includes(station.stationuuid);
                return (
                  <div key={station.stationuuid} ref={isLastItem ? lastStationElementRef : null}>
                    <StationCard
                      station={station}
                      onPlay={handlePlay}
                      isFavorite={isFavorite(station.stationuuid)}
                      onToggleFavorite={toggleFavorite}
                      isPlaying={isPlaying}
                      currentStationUuid={currentStation?.stationuuid ?? null}
                      t={t}
                      isUnavailable={isUnavailable}
                    />
                  </div>
                );
              })}
            </div>
            <AdSenseBlock />
            {(isLoading || isColombianLoading) && stations.length > 0 && (
                <div className="flex justify-center items-center h-24 col-span-1 md:col-span-2 lg:col-span-3">
                    <Spinner className="w-8 h-8 text-brand-500" />
                </div>
            )}
            {/* Eliminado el mensaje de "final de lista" para permitir scroll infinito */}
          </>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 h-64 flex flex-col justify-center items-center">
             <SearchIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
             <p className="text-xl">{t('noResults')}</p>
          </div>
        )}
      </main>

      {currentStation ? (
        <Player station={currentStation} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} onClose={handleClosePlayer} onPlaybackError={handlePlaybackError} t={t} />
      ) : (
        <FloatingNav
          onHomeClick={handleHomeClick}
          onFavoritesClick={() => openModal('favorites')}
          onRandomClick={() => { handleRandomStation(); setView('random'); }}
          isRandomLoading={isRandomLoading}
          t={t}
          onSearchClick={() => setIsSearchModalOpen(true)}
        />
      )}
      
      <Modal isOpen={!!modalContent} onClose={() => setModalContent(null)} title={getModalTitle()}>
        {renderModalContent()}
      </Modal>
      
      <PWAInstallPrompt t={t} />

      {/* Modal de búsqueda para móvil */}
      {isSearchModalOpen && (
        <Modal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} title={t('search')}>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              id="mobile-search"
              name="search"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-12 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
              autoFocus
            />
            <button
              onClick={handleVoiceSearch}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-brand-500 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={t('voiceSearchTitle')}
            >
              <MicrophoneIcon className="w-5 h-5" />
            </button>
          </div>
          {voiceError && <p className="text-center text-red-500 mt-2">{voiceError}</p>}
          {/* Resultados de búsqueda local en móvil */}
          {typeof window !== 'undefined' && window.innerWidth < 768 && debouncedSearchTerm && (
            <div className="mt-4 space-y-2">
              {localSearchResults.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400">{t('noResults')}</p>
              ) : (
                localSearchResults.map(station => (
                  <div key={station.stationuuid} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={station.favicon || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${station.stationuuid}`} alt={station.name} className="w-10 h-10 rounded-md object-cover bg-gray-200 dark:bg-gray-700" />
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-800 dark:text-gray-100 truncate">{station.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{station.country}</div>
                      </div>
                    </div>
                    <button
                      className="ml-2 px-4 py-2 bg-brand-500 text-white rounded-lg font-bold hover:bg-brand-600 transition-colors"
                      onClick={() => { setCurrentStation(station); setIsPlaying(true); setIsSearchModalOpen(false); }}
                    >
                      Escuchar
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </Modal>
      )}

      <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="container mx-auto">
            <p>&copy; 2025 webcincodev. {t('rightsReserved')}.</p>
            <div className="mt-2">
                <button onClick={() => openModal('terms')} className="mx-2 hover:text-brand-500">{t('terms')}</button>
                <span className="opacity-50">|</span>
                <button onClick={() => openModal('privacy')} className="mx-2 hover:text-brand-500">{t('privacy')}</button>
            </div>
        </div>
      </footer>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 md:right-6 p-3 rounded-full bg-brand-500 text-white shadow-lg hover:bg-brand-600 transition-colors z-30"
          title="Volver arriba"
        >
          <ChevronUpIcon className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}