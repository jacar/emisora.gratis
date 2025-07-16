
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FixedSizeList } from 'react-window';
import { translations, languages } from './i18n.js';
import { searchStations, getStationsByUuids, fetchRandomStations, getStationsByTag, getColombianStations, getMoreColombianStations } from './services/radioService.js';
import { useFavorites } from './hooks/useFavorites.js';
import Player from './components/Player.jsx';
import StationCard from './components/StationCard.jsx';
import Modal from './components/Modal.jsx';
import Spinner from './components/Spinner.jsx';
import HeroSlider from './components/HeroSlider.jsx';
import FloatingNav from './components/FloatingNav.jsx';
import { HeartIcon, SunIcon, MoonIcon, SearchIcon, MenuIcon, GithubIcon, BriefcaseIcon, WhatsAppIcon, MicrophoneIcon, XIcon } from './components/Icons.jsx';
import type { Station } from './types';

const PAGE_SIZE = 10; // Reducido de 20 a 10 para carga más rápida

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
    // Mostrar el banner por defecto, solo ocultarlo si fue cerrado explícitamente
    return localStorage.getItem('serviceBannerClosed') !== 'true';
  });
  
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

  // Simplificar t para evitar errores de tipado
  const t = useCallback((key: string) => {
    // @ts-ignore
    return translations[language]?.[key] || translations.en[key];
  }, [language]);

  const BLOCKED_KEY = 'radioBlockedStations';
  const [blockedUuids, setBlockedUuids] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(BLOCKED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const filterBlocked = useCallback((stations: Station[]) => stations.filter((s: Station) => !blockedUuids.includes(s.stationuuid)), [blockedUuids]);

  const closeServiceBanner = () => {
    setShowServiceBanner(false);
    localStorage.setItem('serviceBannerClosed', 'true');
  };

  const resetServiceBanner = () => {
    setShowServiceBanner(true);
    localStorage.removeItem('serviceBannerClosed');
  };

  const fetchStationsCallback = useCallback(async (apiCall: () => Promise<Station[]>, isNewSearch: boolean) => {
    if(isNewSearch) {
        offset.current = 0;
        setStations([]);
        setHasMore(true);
    }
    setIsLoading(true);
    setError(null);
    
    try {
      const newStations = await apiCall();
      const filteredStations = filterBlocked(newStations);
      
      setHasMore(filteredStations.length >= PAGE_SIZE);
      setStations(prev => isNewSearch ? filteredStations : [...prev, ...filteredStations]);
      offset.current += newStations.length;

    } catch (err) {
      console.error("Failed to fetch stations:", err);
      console.error("Error setting localized error message:", err);
      setError(t('error'));
    } finally {
      setIsLoading(false);
    }
  }, [t, filterBlocked]);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const lastStationElementRef = useCallback((node: Element | null) => {
    if (isLoading || !hasMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
          let apiCall: (() => Promise<Station[]>) | null = null;
          if (view === 'default') {
            // Cargar más emisoras latinas y colombianas
            apiCall = async () => {
              const latinoStations = await getStationsByTag('latino', PAGE_SIZE, offset.current);
              const colombianStations = await getMoreColombianStations(PAGE_SIZE, offset.current);
              return [...latinoStations, ...colombianStations];
            };
          } else if (view === 'colombian') {
            apiCall = () => getMoreColombianStations(PAGE_SIZE, offset.current);
          } else if (view === 'search' && debouncedSearchTerm) {
            apiCall = () => searchStations(debouncedSearchTerm, PAGE_SIZE, offset.current);
          }
          
          if (apiCall) {
              fetchStationsCallback(apiCall, false);
          }
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, view, debouncedSearchTerm, fetchStationsCallback]);

  useEffect(() => {
    // Do not trigger search changes while a random search is loading to prevent race conditions.
    if (isRandomLoading) return;
    
    if (view === 'search' && !debouncedSearchTerm) {
      // If search is cleared, go home
      setView('default');
      fetchStationsCallback(() => getStationsByTag('latino', PAGE_SIZE, 0), true);
    } else if (debouncedSearchTerm) {
      if (view !== 'search') {
        setView('search');
      }
      fetchStationsCallback(() => searchStations(debouncedSearchTerm, PAGE_SIZE, 0), true);
    }

  }, [debouncedSearchTerm, fetchStationsCallback, view, isRandomLoading]);

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

  // Cambia la carga inicial para usar PAGE_SIZE
  useEffect(() => {
    const loadInitialStations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Cargar solo emisoras latinas inicialmente (más rápido)
        const latinoStations = await getStationsByTag('latino', PAGE_SIZE, 0);
        
        // Cargar emisoras colombianas en segundo plano (sin bloquear la UI)
        const colombianStationsPromise = getColombianStations(PAGE_SIZE);
        
        // Mostrar las latinas inmediatamente
        const filteredStations = filterBlocked(latinoStations);
        setStations(filteredStations);
        setHasMore(filteredStations.length >= PAGE_SIZE);
        offset.current = filteredStations.length;
        
        // Cuando lleguen las colombianas, agregarlas
        colombianStationsPromise.then(colombianStations => {
          const allStations = [...latinoStations, ...colombianStations];
          const uniqueStations = allStations.filter((station, index, self) => 
            index === self.findIndex(s => s.stationuuid === station.stationuuid)
          );
          const sortedStations = uniqueStations.sort((a, b) => (b.votes || 0) - (a.votes || 0));
          const finalFilteredStations = filterBlocked(sortedStations);
          setStations(finalFilteredStations);
          setHasMore(finalFilteredStations.length >= PAGE_SIZE);
          offset.current = finalFilteredStations.length;
        }).catch(err => {
          console.warn("Error loading Colombian stations:", err);
          // No mostrar error si las latinas ya se cargaron
        });
        
      } catch (err) {
        console.error("Failed to fetch initial stations:", err);
        setError(t('error'));
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialStations();
  }, [filterBlocked, t]);

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
  
  const handlePlaybackError = useCallback((stationUuid: string) => {
    console.warn(`Removing broken station: ${stationUuid}`);
    setStations(prev => prev.filter(s => s.stationuuid !== stationUuid));
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
      setPlaybackErrorMsg(t('error'));
      setTimeout(() => setPlaybackErrorMsg(null as any), 5000); // Oculta el error después de 5s
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
        .then(setFavoriteStations)
        .catch((err) => {
            console.error("Failed to fetch favorites:", err);
            setError(t('error'));
        })
        .finally(() => setIsLoadingFavorites(false));
    }
    setModalContent(type);
  };

  const handleHomeClick = useCallback(() => {
    setSearchTerm('');
    if (view !== 'default') {
      setView('default');
      fetchStationsCallback(() => getStationsByTag('latino', PAGE_SIZE, 0), true);
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

      recognition.onresult = (event: SpeechRecognitionEvent) => {
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

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
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

  return (
    <div className="min-h-screen text-gray-800 dark:text-gray-200 font-sans flex flex-col">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm">
        {playbackErrorMsg && (
          <div className="w-full bg-red-500 text-white text-center py-2 font-semibold animate-pulse">
            {playbackErrorMsg}
          </div>
        )}
        <div className="container mx-auto px-4 py-3 relative">
          <div className="flex justify-between items-center gap-2 md:gap-4">
            <a href="#" onClick={(e) => { e.preventDefault(); handleHomeClick(); }} className="flex-shrink-0">
                <img src="https://www.webcincodev.com/blog/wp-content/uploads/2025/07/LOGO_TOP.png" alt="Top.emisoras Logo" className="h-12 block dark:hidden" />
                <img src="https://www.webcincodev.com/blog/wp-content/uploads/2025/07/logodark.png" alt="Top.emisoras Logo Dark" className="h-12 hidden dark:block" />
            </a>
            
            {/* Buscador solo visible en md+ */}
            <div className="relative flex-1 min-w-0 max-w-xl hidden md:block">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
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



        <div className="flex justify-between items-baseline mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 truncate">{headerTitle}</h2>
          {(isListening || (view === 'search' && isLoading)) && <Spinner className="w-6 h-6 text-brand-500" />}
        </div>
        
        {voiceError && <p className="text-center text-red-500 mb-2">{voiceError}</p>}
        
        {(isLoading || isColombianLoading) && stations.length === 0 ? (
          <div className="flex justify-center items-center h-64"><Spinner className="w-12 h-12 text-brand-500" /></div>
        ) : error ? (
          <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">{error}</div>
        ) : stations.length > 0 ? (
          <>
            <FixedSizeList
              height={600} // Altura fija del contenedor de la lista virtualizada
              itemCount={stations.length} // Número total de elementos en la lista
              itemSize={150} // Altura estimada de cada elemento (ajusta según el diseño de StationCard)
              width="100%"
              itemData={{ stations, handlePlay, isFavorite, toggleFavorite, isPlaying, currentStation, t, lastStationElementRef }}
            >
              {({ index, style, data }) => {
                const { stations, handlePlay, isFavorite, toggleFavorite, isPlaying, currentStation, t, lastStationElementRef } = data;
                const station = stations[index];
                const isLastItem = index === stations.length - 1;

                return (
                  <div style={style} ref={isLastItem ? lastStationElementRef : null}>
                    <StationCard
                      station={station}
                      onPlay={handlePlay}
                      isFavorite={isFavorite(station.stationuuid)}
                      onToggleFavorite={toggleFavorite}
                      isPlaying={isPlaying}
                      currentStationUuid={currentStation?.stationuuid ?? null}
                      t={t}
                    />
                  </div>
                );
              }}
            </FixedSizeList>
            {(isLoading || isColombianLoading) && stations.length > 0 && (
                <div className="flex justify-center items-center h-24 col-span-1 md:col-span-2 lg:col-span-3">
                    <Spinner className="w-8 h-8 text-brand-500" />
                </div>
            )}
            {!hasMore && stations.length > 0 && view !== 'random' && (
                 <p className="text-center text-gray-500 dark:text-gray-400 mt-8 col-span-1 md:col-span-2 lg:col-span-3">{t('endOfList')}</p>
            )}
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

      {/* Modal de búsqueda para móvil */}
      {isSearchModalOpen && (
        <Modal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} title={t('search')}>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
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
    </div>
  );
}