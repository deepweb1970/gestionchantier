import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Download, 
  Upload, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  Shield 
} from 'lucide-react';
import { Button } from './Button';

interface BackupInfo {
  id: string;
  timestamp: Date;
  size: string;
  type: 'auto' | 'manual';
  status: 'success' | 'error' | 'in_progress';
}

interface BackupSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupSystem: React.FC<BackupSystemProps> = ({ isOpen, onClose }) => {
  const [backups, setBackups] = useState<BackupInfo[]>([
    {
      id: '1',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      size: '2.4 MB',
      type: 'auto',
      status: 'success'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      size: '2.3 MB',
      type: 'auto',
      status: 'success'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      size: '2.1 MB',
      type: 'manual',
      status: 'success'
    }
  ]);

  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  const createManualBackup = async () => {
    setIsCreatingBackup(true);
    
    try {
      // Simulation de création de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newBackup: BackupInfo = {
        id: Date.now().toString(),
        timestamp: new Date(),
        size: '2.5 MB',
        type: 'manual',
        status: 'success'
      };
      
      setBackups([newBackup, ...backups]);
    } catch (error) {
      console.error('Erreur lors de la création de la sauvegarde:', error);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const downloadBackup = (backup: BackupInfo) => {
    // Simulation de téléchargement
    const blob = new Blob(['Backup data'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${backup.timestamp.toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const restoreBackup = (backup: BackupInfo) => {
    if (confirm('Êtes-vous sûr de vouloir restaurer cette sauvegarde ? Toutes les données actuelles seront remplacées.')) {
      console.log('Restauration de la sauvegarde:', backup.id);
      // Ici on implémenterait la logique de restauration
    }
  };

  const importBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('Import de sauvegarde:', file.name);
        // Ici on implémenterait la logique d'import
      }
    };
    input.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Système de Sauvegarde</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Statut et contrôles */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium text-green-800">Système opérationnel</h3>
                </div>
                <div className="text-sm text-green-700">
                  <p>Dernière sauvegarde auto:</p>
                  <p className="font-medium">{lastAutoSave ? lastAutoSave.toLocaleString() : 'Aucune'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Paramètres</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Sauvegarde automatique</span>
                    <input
                      type="checkbox"
                      checked={autoBackupEnabled}
                      onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                      className="rounded"
                    />
                  </label>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Fréquence</label>
                    <select
                      value={backupFrequency}
                      onChange={(e) => setBackupFrequency(e.target.value)}
                      disabled={!autoBackupEnabled}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="hourly">Toutes les heures</option>
                      <option value="daily">Quotidienne</option>
                      <option value="weekly">Hebdomadaire</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={createManualBackup}
                  disabled={isCreatingBackup}
                  className="w-full"
                >
                  {isCreatingBackup ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Créer une sauvegarde
                    </>
                  )}
                </Button>

                <Button
                  variant="secondary"
                  onClick={importBackup}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importer une sauvegarde
                </Button>
              </div>
            </div>

            {/* Liste des sauvegardes */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Historique des sauvegardes</h3>
                <span className="text-sm text-gray-500">{backups.length} sauvegarde(s)</span>
              </div>

              <div className="space-y-3">
                {backups.map(backup => (
                  <div key={backup.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          backup.status === 'success' ? 'bg-green-100 text-green-600' :
                          backup.status === 'error' ? 'bg-red-100 text-red-600' :
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          {backup.status === 'success' && <CheckCircle className="w-4 h-4" />}
                          {backup.status === 'error' && <AlertTriangle className="w-4 h-4" />}
                          {backup.status === 'in_progress' && <RefreshCw className="w-4 h-4 animate-spin" />}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {backup.timestamp.toLocaleDateString()} à {backup.timestamp.toLocaleTimeString()}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              backup.type === 'auto' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {backup.type === 'auto' ? 'Auto' : 'Manuel'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Taille: {backup.size}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => downloadBackup(backup)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                          title="Télécharger"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => restoreBackup(backup)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-full"
                          title="Restaurer"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Informations de sécurité */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Sécurité des données</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Les sauvegardes sont chiffrées et stockées de manière sécurisée</p>
                  <p>• Rétention automatique: 30 jours pour les sauvegardes automatiques</p>
                  <p>• Les sauvegardes manuelles sont conservées indéfiniment</p>
                  <p>• Possibilité d'export vers un stockage externe</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end p-4 border-t bg-gray-50">
          <Button variant="secondary" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
};