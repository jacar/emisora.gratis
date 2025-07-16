
import React from 'react';
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
}

const StationCard: React.FC<StationCardProps> = ({
  station,
  onPlay,
  isFavorite,
  onToggleFavorite,
  isPlaying,
  currentStationUuid,
  t
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex items-center p-4 space-x-4 cursor-pointer" onClick={() => onPlay(station)}>
      <img
        src={station.favicon || defaultFavicon}
        alt={`${station.name} logo`}
        className="w-20 h-20 object-cover rounded-md flex-shrink-0 bg-gray-200 dark:bg-gray-700"
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = defaultFavicon; }}
      />
      <div className="flex-grow min-w-0">
        <h3 className="font-bold text-lg truncate text-gray-800 dark:text-gray-100">{station.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{station.country || 'Unknown country'}</p>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
          {station.tags.split(',').slice(0, 3).join(', ')}
        </div>
      </div>
      <button
        className="ml-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        onClick={handlePlayClick}
        aria-label={isCurrentlyPlaying ? t('pause') : t('play')}
      >
        {isCurrentlyPlaying ? <PauseIcon className="w-6 h-6 text-brand-500" /> : <PlayIcon className="w-6 h-6 text-brand-500" />}
      </button>
      <button
        className={`ml-2 p-2 rounded-full transition-colors ${isFavorite ? 'bg-brand-100 dark:bg-brand-900' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        onClick={handleFavoriteClick}
        aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
      >
        <HeartIcon className={`w-5 h-5 ${isFavorite ? 'text-brand-500' : 'text-gray-400'}`} />
      </button>
    </div>
  );
};

export default StationCard;