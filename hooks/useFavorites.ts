
import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'radioGlobeFavorites';

export const useFavorites = () => {
  const [favoriteUuids, setFavoriteUuids] = useState([]);

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(FAVORITES_KEY);
      if (storedFavorites) {
        setFavoriteUuids(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error("Could not load favorites from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteUuids));
    } catch (error) {
      console.error("Could not save favorites to localStorage", error);
    }
  }, [favoriteUuids]);

  const addFavorite = useCallback((uuid) => {
    setFavoriteUuids((prev) => [...prev, uuid]);
  }, []);

  const removeFavorite = useCallback((uuid) => {
    setFavoriteUuids((prev) => prev.filter((id) => id !== uuid));
  }, []);

  const isFavorite = useCallback((uuid) => {
    return favoriteUuids.includes(uuid);
  }, [favoriteUuids]);
  
  const toggleFavorite = useCallback((stationUuid) => {
    if (isFavorite(stationUuid)) {
      removeFavorite(stationUuid);
    } else {
      addFavorite(stationUuid);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  return { favoriteUuids, toggleFavorite, isFavorite };
};