import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RealtimeStatusProps {
  className?: string;
}

export const RealtimeStatus: React.FC<RealtimeStatusProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isConnected, setIsConnected] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'success' | 'error' | 'syncing' | 'idle'>('idle');
  const [showDetails, setShowDetails] = useState(false);

  // Gestion du statut en ligne/hors ligne
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Vérification de la connexion à Supabase
  useEffect(() => {
    const checkConnection = async () => {
      if (!isOnline) {
        setIsConnected(false);
        return;
      }
      
      if (!isOnline) {
        setIsConnected(false);
        return;
      }
      
      try {
        const { data, error } = await supabase.from('clients').select('id').limit(1);
        setIsConnected(!error);
        if (!error) {
          setLastSynced(new Date());
          setSyncStatus('success');
        } else {
          setSyncStatus('error');
        }
      } catch (err) {
        setIsConnected(false);
        setSyncStatus('error');
      }
    };

    // Vérifier immédiatement au chargement
    checkConnection();

    return () => {};
  }, [isOnline]);

  const formatLastSynced = () => {
    if (!lastSynced) return 'Jamais';
    
    const now = new Date();
    const diff = now.getTime() - lastSynced.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
      return `il y a ${seconds} seconde${seconds > 1 ? 's' : ''}`;
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }
    
    return lastSynced.toLocaleString();
  };

  const handleManualSync = async () => {
    try {
      setIsConnected(false); // Afficher l'état de synchronisation
      setSyncStatus('syncing');
      
      // Simuler une synchronisation en récupérant des données
      await supabase.from('clients').select('id').limit(1);
      
      setIsConnected(true);
      setLastSynced(new Date());
      setSyncStatus('success');
    } catch (err) {
      setIsConnected(false);
      setSyncStatus('error');
      console.error('Erreur lors de la synchronisation:', err);
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-40 ${className}`}>
      <div 
        className={`px-3 py-2 rounded-lg text-sm transition-all duration-300 cursor-pointer ${
          isOnline && isConnected
            ? 'bg-green-100 text-green-800 border border-green-200 shadow-sm' 
            : !isOnline
            ? 'bg-red-100 text-red-800 border border-red-200 shadow-sm'
            : 'bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center space-x-2">
          {isOnline ? (
            isConnected ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />
            )
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )}
          <span>
            {isOnline ? 'Connecté' : 'Déconnecté'}
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200">
          <h3 className="font-medium text-gray-800 mb-2 flex items-center">
            <Database className="w-4 h-4 mr-2" />
            État de la connexion
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Internet:</span>
              <span className={isOnline ? 'text-green-600 flex items-center' : 'text-red-600 flex items-center'}>
                {isOnline ? 'Connecté ' : 'Déconnecté '}
                {isOnline && <Wifi className="w-3 h-3 ml-1" />}
                {!isOnline && <WifiOff className="w-3 h-3 ml-1" />}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Base de données:</span>
              <span className={
                syncStatus === 'success' ? 'text-green-600 flex items-center' : 
                syncStatus === 'error' ? 'text-red-600 flex items-center' : 
                'text-yellow-600 flex items-center'
              }>
                {syncStatus === 'success' ? 'Connecté ' : 
                 syncStatus === 'error' ? 'Erreur ' : 
                 'Synchronisation... '}
                {syncStatus === 'success' && <CheckCircle className="w-3 h-3 ml-1" />}
                {syncStatus === 'error' && <AlertTriangle className="w-3 h-3 ml-1" />}
                {syncStatus === 'syncing' && <RefreshCw className="w-3 h-3 ml-1 animate-spin" />}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dernière synchronisation:</span>
              <span className="text-gray-800">{lastSynced.toLocaleTimeString()}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleManualSync();
              }}
              className="w-full mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center justify-center"
              disabled={syncStatus === 'syncing'}
            >
              {syncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                  Synchronisation...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Synchroniser maintenant
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};