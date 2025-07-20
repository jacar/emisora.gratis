import React, { useState, useEffect } from 'react';
import { XIcon, DownloadIcon } from './Icons.jsx';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt = ({ t }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showManualInstall, setShowManualInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false); // NUEVO: para detectar el primer scroll

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Solo mostrar si ya se hizo scroll y no se ha cerrado
      if (hasScrolled && !hasDismissed) setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setShowManualInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Detectar primer scroll
    const onScroll = () => {
      if (!hasScrolled) setHasScrolled(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('scroll', onScroll);
    };
  }, [showInstallPrompt, isStandalone, hasDismissed, hasScrolled]);

  // Mostrar el banner solo después del primer scroll
  useEffect(() => {
    if (hasScrolled && deferredPrompt && !hasDismissed) {
      setShowInstallPrompt(true);
    }
  }, [hasScrolled, deferredPrompt, hasDismissed]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
        setShowManualInstall(false);
        setDeferredPrompt(null);
      }
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      if (isIOS) {
        alert('Para instalar: toca el botón compartir y selecciona "Añadir a pantalla de inicio"');
      } else if (isAndroid) {
        alert('Para instalar: toca el menú del navegador y selecciona "Añadir a pantalla de inicio"');
      } else {
        alert('Para instalar: usa el menú del navegador y selecciona "Instalar aplicación"');
      }
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setShowManualInstall(false);
    setDeferredPrompt(null);
    setHasDismissed(true);
  };

  if (isStandalone || hasDismissed || !hasScrolled) return null;

  // Banner automático
  if (showInstallPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center">
              <DownloadIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {t('installApp') || 'Instalar Radio.gratis'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('installAppDesc') || 'Instala la app para acceder más rápido'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
            >
              {t('install') || 'Instalar'}
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Eliminar el botón manual flotante, solo mostrar el popup/banner una vez tras el scroll

  return null;
};

export default PWAInstallPrompt; 