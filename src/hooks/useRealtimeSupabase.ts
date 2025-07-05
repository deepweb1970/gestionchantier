import { useState, useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type UseRealtimeSupabaseOptions<T> = {
  table: string;
  fetchFunction: () => Promise<T[]>;
  initialData?: T[];
};

export function useRealtimeSupabase<T>({ 
  table, 
  fetchFunction,
  initialData = []
}: UseRealtimeSupabaseOptions<T>) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Fonction pour charger les données
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await fetchFunction();
      setData(result);
      setError(null);
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
      .subscribe();

    setChannel(realtimeChannel);

    // Nettoyage lors du démontage du composant
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [table]);

  // Fonction pour forcer un rechargement des données
  const refresh = () => {
    fetchData();
  };

  return { data, loading, error, refresh };
}