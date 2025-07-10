import { useState, useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type UseRealtimeSupabaseOptions<T> = {
  table: string;
  fetchFunction: () => Promise<T[]>;
  initialData?: T[];
  refreshInterval?: number;
};

export function useRealtimeSupabase<T>({ 
  table, 
  fetchFunction,
  initialData = [],
  refreshInterval
}: UseRealtimeSupabaseOptions<T>) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fonction pour charger les données
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await fetchFunction();
      setData(result);
      setLastRefresh(new Date());
    } catch (err) {
      console.error(`Erreur lors du chargement des données de ${table}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Effet pour charger les données initiales et configurer les abonnements en temps réel
  useEffect(() => {
    fetchData();

    // Configurer l'abonnement en temps réel
    const realtimeChannel = supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table
      }, () => {
        console.log(`Nouvelle insertion dans ${table}, rechargement des données`);
        fetchData();
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table
      }, () => {
        console.log(`Mise à jour dans ${table}, rechargement des données`);
        fetchData();
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table
      }, () => {
        console.log(`Suppression dans ${table}, rechargement des données`);
        fetchData();
      })
      // Listen for form refresh events
      .on('broadcast', { event: 'form_refresh' }, (payload) => {
        console.log(`Événement de rafraîchissement reçu pour ${table}:`, payload);
        fetchData();
      })
      .subscribe();

    setChannel(realtimeChannel);

    // Set up refresh interval if specified
    let intervalId: NodeJS.Timeout | undefined;
    if (refreshInterval && refreshInterval > 0) {
      intervalId = setInterval(() => {
        console.log(`Rafraîchissement périodique pour ${table}`);
        fetchData();
      }, refreshInterval);
    }

    // Nettoyage lors du démontage du composant
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [table, refreshInterval]);

  // Fonction pour forcer un rechargement des données
  const refresh = () => {
    fetchData();
  };

  return { data, loading, error, refresh, lastRefresh };
}