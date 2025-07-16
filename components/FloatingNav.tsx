
import React from 'react';
import { HomeIcon, HeartIcon, ShuffleIcon, SearchIcon } from './Icons.jsx';
import Spinner from './Spinner.jsx';

const NavButton = ({ onClick, icon, label, isLoading }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-1 text-gray-600 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors w-20 disabled:opacity-50 disabled:pointer-events-none"
        aria-label={label}
        disabled={isLoading}
    >
        {isLoading ? <Spinner className="w-6 h-6" /> : icon}
        <span className="text-xs font-medium">{label}</span>
    </button>
);


const FloatingNav = ({
    onHomeClick,
    onFavoritesClick,
    onRandomClick,
    isRandomLoading,
    t,
    onSearchClick
}) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700">
            <div className="container mx-auto flex justify-around items-center h-20 px-2">
                <NavButton
                    onClick={onHomeClick}
                    icon={<HomeIcon className="w-6 h-6" />}
                    label={t('home')}
                />
                <NavButton
                    onClick={onFavoritesClick}
                    icon={<HeartIcon className="w-6 h-6" />}
                    label={t('favorites')}
                />
                {/* Botón de búsqueda solo visible en móvil */}
                <div className="block md:hidden">
                  <NavButton
                    onClick={onSearchClick}
                    icon={<SearchIcon className="w-6 h-6" />}
                    label={t('search')}
                  />
                </div>

                <NavButton
                    onClick={onRandomClick}
                    icon={<ShuffleIcon className="w-6 h-6" />}
                    label={t('random')}
                    isLoading={isRandomLoading}
                />
            </div>
        </nav>
    );
};

export default FloatingNav;