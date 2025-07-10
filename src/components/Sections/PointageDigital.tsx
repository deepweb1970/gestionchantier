import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  Clock, 
  Building2, 
  User, 
  Wrench, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { saisieHeureService } from '../../services/saisieHeureService';
import { ouvrierService } from '../../services/ouvrierService';
import { chantierService } from '../../services/chantierService';
import { materielService } from '../../services/materielService';
import { Button } from '../Common/Button';

interface PointageState {
  isActive: boolean;
  startTime: Date | null;
  elapsedTime: number; // in seconds
  chantierId: string;
  ouvrierId: string;
  materielId: string;
  description: string;
}

export const PointageDigital: React.FC = () => {
  const [pointage, setPointage] = useState<PointageState>({
    isActive: false,
    startTime: null,
    elapsedTime: 0,
    chantierId: '',
    ouvrierId: '',
    materielId: '',
    description: ''
  });
  
  const [displayTime, setDisplayTime] = useState('00:00:00');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { data: chantiers, loading: chantiersLoading } = useRealtimeSupabase({
    table: 'chantiers',
    fetchFunction: chantierService.getAll
  });
  
  const { data: ouvriers, loading: ouvriersLoading } = useRealtimeSupabase({
    table: 'ouvriers',
    fetchFunction: ouvrierService.getAll
  });
  
  const { data: materiel, loading: materielLoading } = useRealtimeSupabase({
    table: 'materiel',
    fetchFunction: materielService.getAll
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (pointage.isActive) {
      interval = setInterval(() => {
        const now = new Date();
        const startTime = pointage.startTime as Date;
        const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        
        setPointage(prev => ({ ...prev, elapsedTime: elapsedSeconds }));
        
        // Format the time as HH:MM:SS
        const hours = Math.floor(elapsedSeconds / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, '0');
        const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
        setDisplayTime(`${hours}:${minutes}:${seconds}`);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pointage.isActive, pointage.startTime]);

  const handleStart = () => {
    // Validate form
    if (!pointage.chantierId) {
      setError('Veuillez sélectionner un chantier');
      return;
    }
    
    if (!pointage.ouvrierId) {
      setError('Veuillez sélectionner un ouvrier');
      return;
    }
    
    if (!pointage.description) {
      setError('Veuillez entrer une description des travaux');
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    const now = new Date();
    setPointage({
      ...pointage,
      isActive: true,
      startTime: now,
      elapsedTime: 0
    });
    
    setDisplayTime('00:00:00');
  };

  const handleStop = async () => {
    if (!pointage.isActive || !pointage.startTime) return;
    
    const startTime = pointage.startTime;
    const endTime = new Date();
    const elapsedHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    
    // Format times for database
    const formattedStartTime = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
    const formattedEndTime = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
    
    try {
      // Create saisie heure record
      const saisieData = {
        ouvrierId: pointage.ouvrierId,
        chantierId: pointage.chantierId,
        materielId: pointage.materielId || undefined,
        date: startTime.toISOString().split('T')[0], // YYYY-MM-DD
        heureDebut: formattedStartTime,
        heureFin: formattedEndTime,
        heuresTotal: parseFloat(elapsedHours.toFixed(2)),
        description: pointage.description,
        valide: false
      };
      
      await saisieHeureService.create(saisieData);
      
      setSuccess(`Pointage enregistré avec succès: ${elapsedHours.toFixed(2)} heures`);
      
      // Reset the form
      setPointage({
        isActive: false,
        startTime: null,
        elapsedTime: 0,
        chantierId: '',
        ouvrierId: '',
        materielId: '',
        description: ''
      });
      
      setDisplayTime('00:00:00');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du pointage:', error);
      setError('Erreur lors de l\'enregistrement du pointage');
    }
  };

  const handleCancel = () => {
    if (confirm('Êtes-vous sûr de vouloir annuler ce pointage ? Les données seront perdues.')) {
      setPointage({
        isActive: false,
        startTime: null,
        elapsedTime: 0,
        chantierId: '',
        ouvrierId: '',
        materielId: '',
        description: ''
      });
      
      setDisplayTime('00:00:00');
      setError(null);
      setSuccess(null);
    }
  };

  const isLoading = chantiersLoading || ouvriersLoading || materielLoading;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
        <Clock className="w-6 h-6 mr-2 text-blue-500" />
        Pointage Digital
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
          <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulaire de pointage */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chantier</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={pointage.chantierId}
                onChange={(e) => setPointage({ ...pointage, chantierId: e.target.value })}
                disabled={pointage.isActive || isLoading}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">Sélectionner un chantier</option>
                {(chantiers || [])
                  .filter(c => c.statut === 'actif' || c.statut === 'planifie')
                  .sort((a, b) => a.nom.localeCompare(b.nom))
                  .map(chantier => (
                    <option key={chantier.id} value={chantier.id}>
                      {chantier.nom}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ouvrier</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={pointage.ouvrierId}
                onChange={(e) => setPointage({ ...pointage, ouvrierId: e.target.value })}
                disabled={pointage.isActive || isLoading}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">Sélectionner un ouvrier</option>
                {(ouvriers || [])
                  .filter(o => o.statut === 'actif')
                  .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`))
                  .map(ouvrier => (
                    <option key={ouvrier.id} value={ouvrier.id}>
                      {ouvrier.prenom} {ouvrier.nom} - {ouvrier.qualification}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Matériel (optionnel)</label>
            <div className="relative">
              <Wrench className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={pointage.materielId}
                onChange={(e) => setPointage({ ...pointage, materielId: e.target.value })}
                disabled={pointage.isActive || isLoading}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">Aucun matériel</option>
                {(materiel || [])
                  .filter(m => m.statut === 'disponible' || m.statut === 'en_service')
                  .sort((a, b) => a.nom.localeCompare(b.nom))
                  .map(item => (
                    <option key={item.id} value={item.id}>
                      {item.nom} - {item.marque} {item.modele}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description des travaux</label>
            <textarea
              value={pointage.description}
              onChange={(e) => setPointage({ ...pointage, description: e.target.value })}
              disabled={pointage.isActive || isLoading}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="Décrivez les travaux effectués..."
            />
          </div>
        </div>
        
        {/* Affichage du temps et contrôles */}
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="text-center">
            <div className="text-5xl font-mono font-bold text-gray-800 mb-2">
              {displayTime}
            </div>
            <p className="text-gray-500">
              {pointage.isActive 
                ? 'Pointage en cours...' 
                : 'En attente de démarrage'}
            </p>
          </div>
          
          <div className="flex space-x-4">
            {!pointage.isActive ? (
              <Button 
                onClick={handleStart}
                disabled={isLoading || !pointage.chantierId || !pointage.ouvrierId || !pointage.description}
                className="px-6"
              >
                <Play className="w-5 h-5 mr-2" />
                Démarrer
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleStop}
                  variant="danger"
                  className="px-6"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Arrêter
                </Button>
                <Button 
                  onClick={handleCancel}
                  variant="secondary"
                >
                  Annuler
                </Button>
              </>
            )}
          </div>
          
          {pointage.isActive && pointage.startTime && (
            <div className="text-sm text-gray-600">
              <p>Début: {pointage.startTime.toLocaleTimeString()}</p>
              <p>Chantier: {chantiers?.find(c => c.id === pointage.chantierId)?.nom}</p>
              <p>Ouvrier: {
                (() => {
                  const ouvrier = ouvriers?.find(o => o.id === pointage.ouvrierId);
                  return ouvrier ? `${ouvrier.prenom} ${ouvrier.nom}` : '';
                })()
              }</p>
              {pointage.materielId && (
                <p>Matériel: {materiel?.find(m => m.id === pointage.materielId)?.nom}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};