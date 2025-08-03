import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock, 
  Building2, 
  User, 
  Wrench, 
  Filter, 
  Search, 
  Download, 
  Eye, 
  AlertCircle, 
  CheckCircle, 
  X, 
  CalendarDays, 
  CalendarRange, 
  ArrowLeft, 
  ArrowRight 
} from 'lucide-react';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { PlanningEvent, Chantier, Ouvrier, Materiel } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { StatusBadge } from '../Common/StatusBadge';
import { ExportModal } from '../Common/ExportModal';

// Services
import { chantierService } from '../../services/chantierService';
import { ouvrierService } from '../../services/ouvrierService';
import { materielService } from '../../services/materielService';
import { planningService } from '../../services/planningService';

export const Planning: React.FC = () => {
  // Data fetching
  const { data: events, loading: eventsLoading, error: eventsError, refresh: refreshEvents } = useRealtimeSupabase<PlanningEvent>({
    table: 'planning_events',
    fetchFunction: planningService.getAll
  });
  
  const { data: chantiers, loading: chantiersLoading } = useRealtimeSupabase<Chantier>({
    table: 'chantiers',
    fetchFunction: chantierService.getAll
  });
  
  const { data: ouvriers, loading: ouvriersLoading } = useRealtimeSupabase<Ouvrier>({
    table: 'ouvriers',
    fetchFunction: ouvrierService.getAll
  });
  
  const { data: materiel, loading: materielLoading } = useRealtimeSupabase<Materiel>({
    table: 'materiel',
    fetchFunction: materielService.getAll
  });

  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PlanningEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<PlanningEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week');
  const [conflicts, setConflicts] = useState<{[key: string]: string[]}>({});

  // Helper functions
  const getChantier = (chantierId?: string): Chantier | undefined => {
    if (!chantierId) return undefined;
    return chantiers?.find(c => c.id === chantierId || (c as any).client_id === chantierId);
  };

  const getOuvrier = (ouvrierId?: string): Ouvrier | undefined => {
    if (!ouvrierId) return undefined;
    return ouvriers?.find(o => o.id === ouvrierId);
  };

  const getMateriel = (materielId?: string): Materiel | undefined => {
    if (!materielId) return undefined;
    return materiel?.find(m => m.id === materielId);
  };

  // Filter events
  const filteredEvents = (events || []).filter(event => {
    const matchesSearch = event.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getChantier(event.chantierId)?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getOuvrier(event.ouvrierId)?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getMateriel(event.materielId)?.nom.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    
    const matchesResource = resourceFilter === 'all' || 
                           (resourceFilter === 'chantier' && event.chantierId) ||
                           (resourceFilter === 'ouvrier' && event.ouvrierId) ||
                           (resourceFilter === 'materiel' && event.materielId);
    
    return matchesSearch && matchesType && matchesResource;
  });

  // Check for conflicts
  useEffect(() => {
    if (!events) return;
    
    const newConflicts: {[key: string]: string[]} = {};
    
    // Check for ouvrier conflicts
    const ouvrierEvents = events.filter(e => e.ouvrierId);
    ouvrierEvents.forEach(event1 => {
      if (!event1.ouvrierId) return;
      
      const conflictingEvents = ouvrierEvents.filter(event2 => {
        if (event1.id === event2.id || !event2.ouvrierId || event1.ouvrierId !== event2.ouvrierId) return false;
        
        const start1 = new Date(event1.dateDebut);
        const end1 = new Date(event1.dateFin);
        const start2 = new Date(event2.dateDebut);
        const end2 = new Date(event2.dateFin);
        
        return (start1 <= end2 && start2 <= end1);
      });
      
      if (conflictingEvents.length > 0) {
        newConflicts[event1.id] = conflictingEvents.map(e => e.id);
      }
    });
    
    // Check for materiel conflicts
    const materielEvents = events.filter(e => e.materielId);
    materielEvents.forEach(event1 => {
      if (!event1.materielId) return;
      
      const conflictingEvents = materielEvents.filter(event2 => {
        if (event1.id === event2.id || !event2.materielId || event1.materielId !== event2.materielId) return false;
        
        const start1 = new Date(event1.dateDebut);
        const end1 = new Date(event1.dateFin);
        const start2 = new Date(event2.dateDebut);
        const end2 = new Date(event2.dateFin);
        
        return (start1 <= end2 && start2 <= end1);
      });
      
      if (conflictingEvents.length > 0) {
        newConflicts[event1.id] = [...(newConflicts[event1.id] || []), ...conflictingEvents.map(e => e.id)];
      }
    });
    
    setConflicts(newConflicts);
  }, [events]);

  // Calendar navigation
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  // CRUD operations
  const handleCreate = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (event: PlanningEvent) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleViewDetails = (event: PlanningEvent) => {
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      try {
        await planningService.delete(id);
        refreshEvents();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'événement');
      }
    }
  };

  const handleSave = async (formData: FormData) => {
    try {
      const dateDebut = formData.get('dateDebut') as string;
      const dateFin = formData.get('dateFin') as string;
      const heureDebut = formData.get('heureDebut') as string;
      const heureFin = formData.get('heureFin') as string;
      
      // Construire les dates complètes avec les heures
      const dateTimeDebut = `${dateDebut}T${heureDebut}:00`;
      const dateTimeFin = `${dateFin}T${heureFin}:00`;
      
      const eventData = {
        titre: formData.get('titre') as string,
        description: formData.get('description') as string || undefined,
        dateDebut: dateTimeDebut,
        dateFin: dateTimeFin,
        chantierId: formData.get('chantierId') as string || undefined,
        ouvrierId: formData.get('ouvrierId') as string || undefined,
        materielId: formData.get('materielId') as string || undefined,
        type: formData.get('type') as PlanningEvent['type']
      };

      if (editingEvent) {
        await planningService.update(editingEvent.id, eventData);
      } else {
        await planningService.create(eventData);
      }
      
      refreshEvents();
      setIsModalOpen(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement de l\'événement');
    }
  };

  // Calendar rendering
  const getDaysInWeek = (date: Date) => {
    const days = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Start from Monday
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getDaysInMonth = (date: Date) => {
    const days = [];
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first Monday before the first day of the month
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay() + 1);
    if (startDate.getTime() > firstDay.getTime()) {
      startDate.setDate(startDate.getDate() - 7);
    }
    
    // End on the last Sunday after the last day of the month
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (7 - lastDay.getDay()));
    
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter(event => {
      const eventStart = new Date(event.dateDebut);
      const eventEnd = new Date(event.dateFin);
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Vérifier si l'événement se déroule ce jour-là
      return eventStart <= dayEnd && eventEnd >= dayStart;
    });
  };

  const getEventColor = (event: PlanningEvent) => {
    switch (event.type) {
      case 'chantier':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'conge':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'formation':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEventIcon = (event: PlanningEvent) => {
    switch (event.type) {
      case 'chantier':
        return <Building2 className="w-4 h-4" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4" />;
      case 'conge':
        return <Calendar className="w-4 h-4" />;
      case 'formation':
        return <User className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const isSameDay = startDate.toDateString() === endDate.toDateString();
    
    if (isSameDay) {
      return `${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleDateString()} ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  // Form component
  const EventForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSave(new FormData(e.currentTarget));
    }}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
          <input
            name="titre"
            type="text"
            required
            defaultValue={editingEvent?.titre || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={editingEvent?.description || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type d'événement</label>
          <select
            name="type"
            required
            defaultValue={editingEvent?.type || 'chantier'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="chantier">Chantier</option>
            <option value="maintenance">Maintenance</option>
            <option value="conge">Congé</option>
            <option value="formation">Formation</option>
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
            <input
              name="dateDebut"
              type="date"
              required
              defaultValue={editingEvent?.dateDebut ? new Date(editingEvent.dateDebut).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heure de début</label>
            <input
              name="heureDebut"
              type="time"
              required
              defaultValue={editingEvent?.dateDebut ? 
                (() => {
                  const date = new Date(editingEvent.dateDebut);
                  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                })() : '08:00'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
            <input
              name="dateFin"
              type="date"
              required
              defaultValue={editingEvent?.dateFin ? new Date(editingEvent.dateFin).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heure de fin</label>
            <input
              name="heureFin"
              type="time"
              required
              defaultValue={editingEvent?.dateFin ? 
                (() => {
                  const date = new Date(editingEvent.dateFin);
                  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                })() : '17:00'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Chantier (optionnel)</label>
          <select
            name="chantierId"
            defaultValue={editingEvent?.chantierId || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Aucun chantier</option>
            {chantiers?.filter(c => c.statut === 'actif' || c.statut === 'planifie').map(chantier => (
              <option key={chantier.id} value={chantier.id}>
                {chantier.nom} ({chantier.statut})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ouvrier (optionnel)</label>
          <select
            name="ouvrierId"
            defaultValue={editingEvent?.ouvrierId || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Aucun ouvrier</option>
            {ouvriers?.filter(o => o.statut === 'actif').map(ouvrier => (
              <option key={ouvrier.id} value={ouvrier.id}>
                {ouvrier.prenom} {ouvrier.nom} - {ouvrier.qualification} ({ouvrier.statut})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Matériel (optionnel)</label>
          <select
            name="materielId"
            defaultValue={editingEvent?.materielId || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Aucun matériel</option>
            {materiel?.filter(m => m.statut === 'disponible' || m.statut === 'en_service').map(item => (
              <option key={item.id} value={item.id}>
                {item.nom} - {item.marque} {item.modele} ({item.statut})
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
          Annuler
        </Button>
        <Button type="submit">
          {editingEvent ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );

  // Detail modal component
  const EventDetailModal = () => {
    if (!selectedEvent) return null;

    const chantier = getChantier(selectedEvent.chantierId);
    const ouvrier = getOuvrier(selectedEvent.ouvrierId);
    const materielItem = getMateriel(selectedEvent.materielId);
    const hasConflicts = conflicts[selectedEvent.id] && conflicts[selectedEvent.id].length > 0;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className={`p-4 rounded-lg ${getEventColor(selectedEvent)}`}>
          <div className="flex items-center space-x-2 mb-2">
            {getEventIcon(selectedEvent)}
            <h3 className="text-lg font-semibold">{selectedEvent.titre}</h3>
          </div>
          <p className="text-sm">{selectedEvent.description}</p>
        </div>

        {/* Conflicts warning */}
        {hasConflicts && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
              <div>
                <h4 className="font-medium text-red-800">Conflits détectés</h4>
                <p className="text-sm text-red-700">
                  Cet événement est en conflit avec {conflicts[selectedEvent.id].length} autre(s) événement(s).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Date and time */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Date et heure</h4>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-900">
                {formatDateRange(selectedEvent.dateDebut, selectedEvent.dateFin)}
              </span>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {chantier && (
            <div className="border rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Building2 className="w-4 h-4 text-blue-600 mr-1" />
                Chantier
              </h4>
              <p className="text-sm font-medium text-gray-900">{chantier.nom}</p>
              <p className="text-xs text-gray-500">{(chantier as any).adresse || chantier.adresse}</p>
              <div className="mt-2">
                <StatusBadge status={chantier.statut} type="chantier" />
              </div>
            </div>
          )}

          {ouvrier && (
            <div className="border rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <User className="w-4 h-4 text-green-600 mr-1" />
                Ouvrier
              </h4>
              <p className="text-sm font-medium text-gray-900">{ouvrier.prenom} {ouvrier.nom}</p>
              <p className="text-xs text-gray-500">{ouvrier.qualification}</p>
              <div className="mt-2">
                <StatusBadge status={ouvrier.statut} type="ouvrier" />
              </div>
            </div>
          )}

          {materielItem && (
            <div className="border rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Wrench className="w-4 h-4 text-orange-600 mr-1" />
                Matériel
              </h4>
              <p className="text-sm font-medium text-gray-900">{materielItem.nom}</p>
              <p className="text-xs text-gray-500">{materielItem.marque} {materielItem.modele}</p>
              <div className="mt-2">
                <StatusBadge status={materielItem.statut} type="materiel" />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => handleEdit(selectedEvent)}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button variant="danger" onClick={() => {
            handleDelete(selectedEvent.id);
            setIsDetailModalOpen(false);
          }}>
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>
    );
  };

  // Month view
  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const weeks = [];
    
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="grid grid-cols-7 border-b">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => (
            <div key={index} className="p-2 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
        </div>
        
        <div>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
              {week.map((day, dayIndex) => {
                const isToday = day.toDateString() === new Date().toDateString();
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const dayEvents = getEventsForDay(day);
                
                return (
                  <div 
                    key={dayIndex} 
                    className={`min-h-[100px] p-1 border-r last:border-r-0 ${
                      isToday ? 'bg-blue-50' : isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <div className={`text-right text-sm p-1 ${
                      isToday ? 'font-bold text-blue-700 bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center ml-auto' : 
                      isCurrentMonth ? 'font-medium text-gray-700' : 'text-gray-400'
                    }`}>
                      {day.getDate()}
                    </div>
                    
                    <div className="space-y-1 mt-1 max-h-[80px] overflow-y-auto">
                      {dayEvents.slice(0, 3).map(event => (
                        <div 
                          key={event.id}
                          onClick={() => handleViewDetails(event)}
                          className={`text-xs p-1 rounded cursor-pointer truncate ${getEventColor(event)}`}
                        >
                          {event.titre}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-center text-gray-500">
                          +{dayEvents.length - 3} autres
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Week view
  const renderWeekView = () => {
    const days = getDaysInWeek(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i); // 0:00 to 23:00
    
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="grid grid-cols-8 border-b">
          <div className="p-2 text-center text-sm font-medium text-gray-700 border-r">
            Heure
          </div>
          {days.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div 
                key={index} 
                className={`p-2 text-center text-sm font-medium ${
                  isToday ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                } ${index < 6 ? 'border-r' : ''}`}
              >
                {day.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
              </div>
            );
          })}
        </div>
        
        <div>
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
              <div className="p-2 text-center text-xs text-gray-500 border-r">
                {hour.toString().padStart(2, '0')}:00
              </div>
              
              {days.map((day, dayIndex) => {
                const dayStart = new Date(day);
                dayStart.setHours(hour, 0, 0, 0);
                const dayEnd = new Date(day);
                dayEnd.setHours(hour + 1, 0, 0, 0);
                
                const hourEvents = filteredEvents.filter(event => {
                  const eventStart = new Date(event.dateDebut);
                  const eventEnd = new Date(event.dateFin);
                  const hourStartTime = new Date(dayStart);
                  hourStartTime.setHours(hour, 0, 0, 0);
                  const hourEndTime = new Date(dayStart);
                  hourEndTime.setHours(hour, 59, 59, 999);
                  
                  // Vérifier si l'événement se déroule pendant cette heure
                  return eventStart <= hourEndTime && eventEnd >= hourStartTime;
                });
                
                return (
                  <div 
                    key={dayIndex} 
                    className={`min-h-[40px] p-1 relative ${dayIndex < 6 ? 'border-r' : ''} ${
                      hour >= 22 || hour <= 6 ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      {hourEvents.map(event => (
                        <div 
                          key={event.id}
                          onClick={() => handleViewDetails(event)}
                          className={`text-xs p-1 rounded cursor-pointer ${getEventColor(event)} ${
                            conflicts[event.id] ? 'border-2 border-red-500' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-1">
                            {getEventIcon(event)}
                            <span className="truncate">{event.titre}</span>
                          </div>
                          <div className="text-xs opacity-75 truncate">
                            {new Date(event.dateDebut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {' - '}
                            {new Date(event.dateFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Day view
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i); // 0:00 to 23:00
    
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b text-center">
          <h3 className="text-lg font-semibold text-gray-800">
            {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>
        </div>
        
        <div>
          {hours.map(hour => {
            const hourStart = new Date(currentDate);
            hourStart.setHours(hour, 0, 0, 0);
            const hourEnd = new Date(currentDate);
            hourEnd.setHours(hour + 1, 0, 0, 0);
            
            const hourEvents = filteredEvents.filter(event => {
              const eventStart = new Date(event.dateDebut);
              const eventEnd = new Date(event.dateFin);
              const hourStartTime = new Date(currentDate);
              hourStartTime.setHours(hour, 0, 0, 0);
              const hourEndTime = new Date(currentDate);
              hourEndTime.setHours(hour, 59, 59, 999);
              
              // Vérifier si l'événement se déroule pendant cette heure
              return eventStart <= hourEndTime && eventEnd >= hourStartTime;
            });
            
            return (
              <div key={hour} className="grid grid-cols-12 border-b last:border-b-0">
                <div className={`col-span-1 p-2 text-center text-sm text-gray-500 border-r ${
                  hour >= 22 || hour <= 6 ? 'bg-gray-100' : ''
                }`}>
                  {hour.toString().padStart(2, '0')}:00
                </div>
                
                <div className={`col-span-11 min-h-[60px] p-2 ${
                  hour >= 22 || hour <= 6 ? 'bg-gray-50' : ''
                }`}>
                  {hourEvents.length === 0 ? (
                    <div className={`h-full flex items-center justify-center text-sm ${
                      hour >= 22 || hour <= 6 ? 'text-gray-300' : 'text-gray-400'
                    }`}>
                      {hour >= 22 || hour <= 6 ? 'Hors horaires' : 'Aucun événement'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {hourEvents.map(event => (
                        <div 
                          key={event.id}
                          onClick={() => handleViewDetails(event)}
                          className={`p-2 rounded cursor-pointer ${getEventColor(event)} ${
                            conflicts[event.id] ? 'border-2 border-red-500' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {getEventIcon(event)}
                            <span className="font-medium">{event.titre}</span>
                          </div>
                          
                          <div className="mt-1 text-sm">
                            {new Date(event.dateDebut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {' - '}
                            {new Date(event.dateFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          
                          <div className="mt-1 text-sm">
                            {event.chantierId && (
                              <span className="inline-flex items-center mr-2">
                                <Building2 className="w-3 h-3 mr-1" />
                                {getChantier(event.chantierId)?.nom}
                              </span>
                            )}
                            {event.ouvrierId && (
                              <span className="inline-flex items-center mr-2">
                                <User className="w-3 h-3 mr-1" />
                                {getOuvrier(event.ouvrierId)?.prenom} {getOuvrier(event.ouvrierId)?.nom}
                              </span>
                            )}
                            {event.materielId && (
                              <span className="inline-flex items-center">
                                <Wrench className="w-3 h-3 mr-1" />
                                {getMateriel(event.materielId)?.nom}
                              </span>
                            )}
                          </div>
                          
                          {event.description && (
                            <div className="mt-1 text-sm">
                              {event.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // List view for mobile
  const renderListView = () => {
    return (
      <div className="space-y-4 md:hidden">
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Aucun événement trouvé</p>
          </div>
        ) : (
          filteredEvents.map(event => (
            <div 
              key={event.id}
              className={`p-4 rounded-lg shadow-sm border ${getEventColor(event)} ${
                conflicts[event.id] ? 'border-2 border-red-500' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  {getEventIcon(event)}
                  <h3 className="font-medium">{event.titre}</h3>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleViewDetails(event)}
                    className="p-1 rounded hover:bg-white/50"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(event)}
                    className="p-1 rounded hover:bg-white/50"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-1 rounded hover:bg-white/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="mt-2 text-sm">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatDateRange(event.dateDebut, event.dateFin)}
                </div>
              </div>
              
              <div className="mt-2 text-sm">
                {event.chantierId && (
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 mr-1" />
                    {getChantier(event.chantierId)?.nom}
                  </div>
                )}
                {event.ouvrierId && (
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {getOuvrier(event.ouvrierId)?.prenom} {getOuvrier(event.ouvrierId)?.nom}
                  </div>
                )}
                {event.materielId && (
                  <div className="flex items-center">
                    <Wrench className="w-4 h-4 mr-1" />
                    {getMateriel(event.materielId)?.nom}
                  </div>
                )}
              </div>
              
              {conflicts[event.id] && (
                <div className="mt-2 text-xs text-red-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Conflit détecté
                </div>
              )}
            </div>
          ))
        )}
      </div>
    );
  };

  // Main component render
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Planning</h1>
        <div className="flex space-x-3">
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvel Événement
          </Button>
          <Button variant="secondary" onClick={() => setIsExportModalOpen(true)}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Filters and search */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un événement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les types</option>
              <option value="chantier">Chantier</option>
              <option value="maintenance">Maintenance</option>
              <option value="conge">Congé</option>
              <option value="formation">Formation</option>
            </select>
            
            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les ressources</option>
              <option value="chantier">Chantiers</option>
              <option value="ouvrier">Ouvriers</option>
              <option value="materiel">Matériel</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calendar navigation */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={goToPrevious}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              Aujourd'hui
            </button>
            
            <button
              onClick={goToNext}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowRight className="w-5 h-5 text-gray-600" />
            </button>
            
            <h2 className="text-lg font-semibold text-gray-800">
              {viewMode === 'month' 
                ? currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                : viewMode === 'week'
                ? `Semaine du ${getDaysInWeek(currentDate)[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
                : currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
              }
            </h2>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-md ${
                viewMode === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>Jour</span>
              </div>
            </button>
            
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md ${
                viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center">
                <CalendarRange className="w-4 h-4 mr-1" />
                <span>Semaine</span>
              </div>
            </button>
            
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md ${
                viewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center">
                <CalendarDays className="w-4 h-4 mr-1" />
                <span>Mois</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Conflicts summary */}
      {Object.keys(conflicts).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
            <div>
              <h3 className="font-medium text-red-800">Conflits de planning détectés</h3>
              <p className="text-sm text-red-700">
                {Object.keys(conflicts).length} événement(s) ont des conflits de ressources.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {eventsLoading || chantiersLoading || ouvriersLoading || materielLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du planning...</p>
        </div>
      ) : eventsError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Erreur de chargement</h3>
          <p className="text-red-700">{eventsError.message}</p>
        </div>
      ) : (
        <>
          {/* Calendar views */}
          <div className="hidden md:block">
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'day' && renderDayView()}
          </div>
          
          {/* Mobile list view */}
          {renderListView()}
          
          {/* Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Résumé</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">Total événements</p>
                    <p className="text-2xl font-bold text-blue-800">{filteredEvents.length}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700">Chantiers planifiés</p>
                    <p className="text-2xl font-bold text-green-800">
                      {filteredEvents.filter(e => e.type === 'chantier').length}
                    </p>
                  </div>
                  <Building2 className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-700">Ouvriers assignés</p>
                    <p className="text-2xl font-bold text-orange-800">
                      {new Set(filteredEvents.filter(e => e.ouvrierId).map(e => e.ouvrierId)).size}
                    </p>
                  </div>
                  <User className="w-8 h-8 text-orange-500" />
                </div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700">Conflits</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {Object.keys(conflicts).length}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        title={editingEvent ? 'Modifier l\'événement' : 'Nouvel événement'}
        size="lg"
      >
        <EventForm />
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEvent(null);
        }}
        title="Détails de l'événement"
        size="lg"
      >
        <EventDetailModal />
      </Modal>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Exporter le planning"
        data={filteredEvents.map(event => ({
          Titre: event.titre,
          Description: event.description || '',
          Type: event.type,
          'Date début': new Date(event.dateDebut).toLocaleString(),
          'Date fin': new Date(event.dateFin).toLocaleString(),
          Chantier: getChantier(event.chantierId)?.nom || '',
          Ouvrier: event.ouvrierId ? `${getOuvrier(event.ouvrierId)?.prenom} ${getOuvrier(event.ouvrierId)?.nom}` : '',
          Matériel: getMateriel(event.materielId)?.nom || '',
          Conflit: conflicts[event.id] ? 'Oui' : 'Non'
        }))}
        filename="planning"
      />
    </div>
  );
};