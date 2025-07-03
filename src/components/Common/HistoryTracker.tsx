import React, { useState, useEffect } from 'react';
import { History, User, Edit, Trash2, Plus, Eye, Clock, Filter, Search, Download } from 'lucide-react';

interface HistoryEntry {
  id: string;
  action: 'create' | 'update' | 'delete' | 'view';
  entityType: string;
  entityId: string;
  entityName: string;
  userId: string;
  userName: string;
  timestamp: Date;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  details?: string;
}

interface HistoryTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  entityType?: string;
  entityId?: string;
}

export const HistoryTracker: React.FC<HistoryTrackerProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId
}) => {
  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      id: '1',
      action: 'create',
      entityType: 'chantier',
      entityId: '1',
      entityName: 'Villa Moderne',
      userId: '1',
      userName: 'Admin',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      details: 'Création du chantier Villa Moderne'
    },
    {
      id: '2',
      action: 'update',
      entityType: 'chantier',
      entityId: '1',
      entityName: 'Villa Moderne',
      userId: '2',
      userName: 'Manager',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      changes: [
        { field: 'avancement', oldValue: 60, newValue: 65 },
        { field: 'statut', oldValue: 'actif', newValue: 'actif' }
      ],
      details: 'Mise à jour de l\'avancement'
    },
    {
      id: '3',
      action: 'create',
      entityType: 'ouvrier',
      entityId: '3',
      entityName: 'Michel Leroy',
      userId: '1',
      userName: 'Admin',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      details: 'Ajout d\'un nouvel ouvrier'
    },
    {
      id: '4',
      action: 'delete',
      entityType: 'materiel',
      entityId: '4',
      entityName: 'Ancienne bétonnière',
      userId: '1',
      userName: 'Admin',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      details: 'Suppression du matériel obsolète'
    },
    {
      id: '5',
      action: 'view',
      entityType: 'facture',
      entityId: '1',
      entityName: 'FAC-2024-001',
      userId: '2',
      userName: 'Manager',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      details: 'Consultation de la facture'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const filteredHistory = history.filter(entry => {
    if (entityType && entry.entityType !== entityType) return false;
    if (entityId && entry.entityId !== entityId) return false;
    
    const matchesSearch = entry.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.details?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || entry.action === actionFilter;
    const matchesUser = userFilter === 'all' || entry.userId === userFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const entryDate = new Date(entry.timestamp);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = entryDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = entryDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = entryDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesAction && matchesUser && matchesDate;
  });

  const getActionIcon = (action: HistoryEntry['action']) => {
    switch (action) {
      case 'create': return Plus;
      case 'update': return Edit;
      case 'delete': return Trash2;
      case 'view': return Eye;
      default: return History;
    }
  };

  const getActionColor = (action: HistoryEntry['action']) => {
    switch (action) {
      case 'create': return 'text-green-600 bg-green-100';
      case 'update': return 'text-blue-600 bg-blue-100';
      case 'delete': return 'text-red-600 bg-red-100';
      case 'view': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActionLabel = (action: HistoryEntry['action']) => {
    switch (action) {
      case 'create': return 'Création';
      case 'update': return 'Modification';
      case 'delete': return 'Suppression';
      case 'view': return 'Consultation';
      default: return 'Action';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 24) {
      return `Il y a ${hours}h`;
    } else if (days < 30) {
      return `Il y a ${days}j`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  const exportHistory = () => {
    const csvContent = [
      'Date,Action,Type,Entité,Utilisateur,Détails',
      ...filteredHistory.map(entry => 
        `${entry.timestamp.toISOString()},${getActionLabel(entry.action)},${entry.entityType},${entry.entityName},${entry.userName},"${entry.details}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'historique-modifications.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const uniqueUsers = Array.from(new Set(history.map(h => h.userId)))
    .map(userId => {
      const entry = history.find(h => h.userId === userId);
      return { id: userId, name: entry?.userName || '' };
    });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <History className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              Historique des modifications
              {entityType && entityId && (
                <span className="text-sm text-gray-500 ml-2">
                  - {entityType} #{entityId}
                </span>
              )}
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportHistory}
              className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Filtres */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">Toutes les actions</option>
                <option value="create">Créations</option>
                <option value="update">Modifications</option>
                <option value="delete">Suppressions</option>
                <option value="view">Consultations</option>
              </select>
            </div>

            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">Tous les utilisateurs</option>
              {uniqueUsers.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
          </div>
        </div>

        {/* Liste de l'historique */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Aucune modification trouvée</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map(entry => {
                const ActionIcon = getActionIcon(entry.action);
                const actionColor = getActionColor(entry.action);
                
                return (
                  <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-full ${actionColor}`}>
                        <ActionIcon className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {getActionLabel(entry.action)}
                            </span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-700 capitalize">{entry.entityType}</span>
                            <span className="text-gray-500">•</span>
                            <span className="font-medium text-gray-900">{entry.entityName}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <User className="w-3 h-3" />
                            <span>{entry.userName}</span>
                            <Clock className="w-3 h-3 ml-2" />
                            <span>{formatTimestamp(entry.timestamp)}</span>
                          </div>
                        </div>
                        
                        {entry.details && (
                          <p className="text-sm text-gray-600 mb-2">{entry.details}</p>
                        )}
                        
                        {entry.changes && entry.changes.length > 0 && (
                          <div className="bg-gray-50 rounded p-3">
                            <p className="text-xs font-medium text-gray-700 mb-2">Modifications :</p>
                            <div className="space-y-1">
                              {entry.changes.map((change, index) => (
                                <div key={index} className="text-xs text-gray-600">
                                  <span className="font-medium">{change.field}:</span>
                                  <span className="text-red-600 line-through ml-1">{change.oldValue}</span>
                                  <span className="mx-1">→</span>
                                  <span className="text-green-600">{change.newValue}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500 mt-2">
                          {entry.timestamp.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center p-4 border-t bg-gray-50">
          <span className="text-sm text-gray-500">
            {filteredHistory.length} modification(s) affichée(s)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};