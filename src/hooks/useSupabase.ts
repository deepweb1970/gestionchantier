import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

type UseSupabaseOptions<T> = {
  table: string;
  columns?: string;
  filter?: {
    column: string;
    operator: string;
    value: any;
  }[];
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
};

export function useSupabase<T>(options: UseSupabaseOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchData = async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from(options.table)
        .select(options.columns || '*');
      
      // Appliquer les filtres
      if (options.filter && options.filter.length > 0) {
        options.filter.forEach(filter => {
          query = query.filter(filter.column, filter.operator, filter.value);
        });
      }
      
      // Appliquer le tri
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending !== false 
        });
      }
      
      // Appliquer la limite
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const { data: result, error } = await query;
      
      if (error) {
        setError(error);
        console.error('Erreur lors de la récupération des données:', error);
      } else {
        setData(result as T[]);
      }
    } catch (err) {
      console.error('Erreur inattendue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [options.table, options.columns, JSON.stringify(options.filter), JSON.stringify(options.orderBy), options.limit]);

  const refresh = () => {
    fetchData();
  };

  return { data, loading, error, refresh };
}

export function useSupabaseItem<T>(table: string, id: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchItem = async () => {
    if (!id) {
      setData(null);
      return;
    }

    setLoading(true);
    
    try {
      const { data: result, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        setError(error);
        console.error(`Erreur lors de la récupération de l'élément ${id}:`, error);
      } else {
        setData(result as T);
      }
    } catch (err) {
      console.error('Erreur inattendue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchItem();
    } else {
      setData(null);
    }
  }, [table, id]);

  const refresh = () => {
    fetchItem();
  };

  return { data, loading, error, refresh };
}

export async function createItem<T>(table: string, data: Partial<T>) {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    
    if (error) {
      console.error(`Erreur lors de la création dans ${table}:`, error);
      throw error;
    }
    
    return result;
  } catch (error) {
    console.error('Erreur inattendue:', error);
    throw error;
  }
}

export async function updateItem<T>(table: string, id: string, data: Partial<T>) {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Erreur lors de la mise à jour dans ${table}:`, error);
      throw error;
    }
    
    return result;
  } catch (error) {
    console.error('Erreur inattendue:', error);
    throw error;
  }
}

export async function deleteItem(table: string, id: string) {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Erreur lors de la suppression dans ${table}:`, error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur inattendue:', error);
    throw error;
  }
}