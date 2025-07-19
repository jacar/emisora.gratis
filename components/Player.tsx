
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PlayIcon, PauseIcon, Volume2Icon, VolumeXIcon, XIcon } from './Icons.jsx';

const Player = ({ station, isPlaying, onTogglePlay, onClose, onPlaybackError, t }) => {
  const audioRef = useRef(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const handlePlaybackError = useCallback(() => {
    if (station) {
        console.error(`Error playing stream: ${station?.url_resolved}`);
        onPlaybackError(station.stationuuid);
    }
  }, [station, onPlaybackError]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (!station || !station.url_resolved) {
        audio.pause();
        if (audio.hasAttribute('src')) {
            audio.removeAttribute('src');
            audio.load();
        }
        return;
    }

    if (audio.src !== station.url_resolved) {
      audio.src = station.url_resolved;
      audio.load();
    }

    if (isPlaying) {
      audio.play().catch(e => {
        // AbortError is expected when we switch songs, so we ignore it.
        if (e.name !== 'AbortError') {
          handlePlaybackError();
        }
      });
    } else {
      audio.pause();
    }
  }, [station, isPlaying, handlePlaybackError]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Add event listener for stream errors
    audio.addEventListener('error', handlePlaybackError);
    return () => {
      audio.removeEventListener('error', handlePlaybackError);
    };
  }, [handlePlaybackError]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  if (!station) {
    return null;
  }
  
  const defaultFavicon = `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${station.stationuuid}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md shadow-[0_-4px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_30px_rgba(0,0,0,0.4)] p-4 flex items-center justify-between gap-4">
        <audio ref={audioRef} preload="auto" />
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <img
            src={station.favicon || defaultFavicon}
            alt="station logo"
            className="w-12 h-12 md:w-16 md:h-16 rounded-md object-cover shadow-sm"
            onError={(e) => { e.currentTarget.src = defaultFavicon; }}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('nowPlaying')}</p>
            <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate">{station.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate hidden md:block">{station.country}</p>
          </div>
        </div>

        <button onClick={onTogglePlay} className="p-3 bg-brand-500 text-white rounded-full hover:bg-brand-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-gray-800 shadow-lg">
          {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
        </button>

        <div className="items-center gap-2 hidden md:flex">
          <button onClick={() => setIsMuted(!isMuted)}>
             {isMuted || volume === 0 ? <VolumeXIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" /> : <Volume2Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />}
          </button>
          <input
            id="volume-control"
            name="volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if(parseFloat(e.target.value) > 0) setIsMuted(false);
            }}
            className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-brand-500"
          />
        </div>

        <button onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
          <XIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default Player;