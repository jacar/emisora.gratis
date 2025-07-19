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

  useEffect(() => {
    // Verificar si ya está instalada
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setShowManualInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Mostrar botón manual después de 2 segundos si no hay prompt automático
    const timer = setTimeout(() => {
      if (!showInstallPrompt && !isStandalone) {
        setShowManualInstall(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, [showInstallPrompt, isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Si no hay prompt automático, mostrar instrucciones manuales
      alert('Para instalar la app:\n\n1. En Chrome: Haz clic en el ícono de instalación en la barra de direcciones\n2. En Safari: Comparte y selecciona "Agregar a pantalla de inicio"\n3. En Firefox: Haz clic en el ícono de instalación en la barra de direcciones');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
      setShowManualInstall(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setShowManualInstall(false);
    setDeferredPrompt(null);
  };

  // No mostrar nada si ya está instalada
  if (isStandalone) return null;

  // Banner automático
  if (showInstallPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 animate-bounce">
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

  // Botón manual
  if (showManualInstall) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleInstallClick}
          className="flex items-center space-x-2 px-4 py-3 bg-brand-500 text-white rounded-full shadow-lg hover:bg-brand-600 transition-colors animate-pulse"
          title={t('installApp') || 'Instalar Radio.gratis'}
        >
          <DownloadIcon className="w-5 h-5" />
          <span className="hidden sm:inline">{t('install') || 'Instalar'}</span>
        </button>
      </div>
    );
  }

  return null;
};

export default PWAInstallPrompt; 