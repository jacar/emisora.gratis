
import React, { useEffect } from 'react';
import { PlayIcon, PauseIcon, HeartIcon } from './Icons.jsx';
import { Station } from '../types';

interface StationCardProps {
  station: Station;
  onPlay: (station: Station) => void;
  isFavorite: boolean;
  onToggleFavorite: (uuid: string) => void;
  isPlaying: boolean;
  currentStationUuid: string | null;
  t: (key: string) => string;
  isUnavailable?: boolean; // NUEVO: indica si la emisora está marcada como no disponible
}

const StationCard: React.FC<StationCardProps> = ({
  station,
  onPlay,
  isFavorite,
  onToggleFavorite,
  isPlaying,
  currentStationUuid,
  t,
  isUnavailable
}) => {
  const isCurrentlyPlaying = isPlaying && currentStationUuid === station.stationuuid;

  const handlePlayClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onPlay(station);
  };

  const handleFavoriteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onToggleFavorite(station.stationuuid);
  };

  const defaultFavicon = `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${station.stationuuid}`;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex items-center p-4 space-x-4 cursor-pointer ${isUnavailable ? 'opacity-50 pointer-events-none' : ''}`}
      onClick={() => !isUnavailable && onPlay(station)}>
      <img
        src={station.favicon || defaultFavicon}
        alt={`${station.name} logo`}
        className="w-20 h-20 object-cover rounded-md flex-shrink-0 bg-gray-200 dark:bg-gray-700"
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = defaultFavicon; }}
      />
      <div className="flex-grow min-w-0">
        <h3 className="font-bold text-base truncate text-gray-800 dark:text-gray-100">{station.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{station.country || 'Unknown country'}</p>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
          {(station.tags ? station.tags.split(',').slice(0, 3).join(', ') : '')}
        </div>
        {isUnavailable && (
          <div className="flex items-center gap-2 mt-2 text-red-500 text-xs font-semibold">
            <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {t('notAvailable') || 'No disponible'}
          </div>
        )}
      </div>
      <button
        className="ml-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        onClick={handlePlayClick}
        aria-label={isCurrentlyPlaying ? t('pause') : t('play')}
        disabled={isUnavailable}
      >
        {isCurrentlyPlaying ? <PauseIcon className="w-6 h-6 text-brand-500" /> : <PlayIcon className="w-6 h-6 text-brand-500" />}
      </button>
      <button
        className={`ml-2 p-2 rounded-full transition-colors ${isFavorite ? 'bg-brand-100 dark:bg-brand-900' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        onClick={handleFavoriteClick}
        aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
        disabled={isUnavailable}
      >
        <HeartIcon className={`w-5 h-5 ${isFavorite ? 'text-brand-500' : 'text-gray-400'}`} />
      </button>
    </div>
  );
};

// Componente para mostrar un bloque de anuncios de AdSense
export const AdSenseBlock: React.FC = () => {
  useEffect(() => {
    // Solo cargar AdSense en producción y cuando el dominio no sea localhost
    if (process.env.NODE_ENV === 'production' && 
        typeof window !== 'undefined' && 
        !window.location.hostname.includes('localhost') &&
        !window.location.hostname.includes('127.0.0.1') &&
        (window as any).adsbygoogle) {
      try {
        (window as any).adsbygoogle.push({});
      } catch (e) {
        console.warn('AdSense error:', e);
      }
    }
  }, []);
  
  // No mostrar en desarrollo local
  if (process.env.NODE_ENV !== 'production' || 
      (typeof window !== 'undefined' && 
       (window.location.hostname.includes('localhost') || 
        window.location.hostname.includes('127.0.0.1')))) {
    return null;
  }
  
  return (
    <ins className="adsbygoogle"
      style={{ display: 'block', minHeight: 90 }}
      data-ad-client="ca-pub-3735557735218596"
      data-ad-slot="1234567890"
      data-ad-format="auto"
    ></ins>
  );
};

export default StationCard;