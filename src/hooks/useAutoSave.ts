import { useEffect, useRef } from 'react';

// Flag to completely disable auto-save functionality
const DISABLE_AUTO_SAVE = true;

interface UseAutoSaveOptions {
  data: any;
  onSave: (data: any) => Promise<void> | void;
  delay?: number;
  enabled?: boolean;
}

export const useAutoSave = ({ 
  data, 
  onSave, 
  delay = 30000,
  enabled = false
}: UseAutoSaveOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef(data);

  useEffect(() => {
    if (!enabled || DISABLE_AUTO_SAVE) return;

    // Vérifier si les données ont changé
    const hasChanged = JSON.stringify(data) !== JSON.stringify(lastDataRef.current);
    
    if (hasChanged) {
      // Annuler la sauvegarde précédente
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Programmer une nouvelle sauvegarde
      timeoutRef.current = setTimeout(() => {
        onSave(data);
        lastDataRef.current = data;
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, onSave, delay, enabled]);

  // Fonction pour forcer la sauvegarde immédiate
  const saveNow = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onSave(data);
    lastDataRef.current = data;
  };

  return { saveNow };
};