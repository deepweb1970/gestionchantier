import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, Clock, Users, Wrench, AlertTriangle, CheckCircle, Filter, Search, Download, Settings, ChevronLeft, ChevronRight, MapPin, Bell, FolderSync as Sync, Eye, Copy, RefreshCw, User, Building2, Zap, BookOpen, Coffee, X } from 'lucide-react';
import { mockPlanningEvents, mockOuvriers, mockChantiers, mockMateriel } from '../../data/mockData';
import { PlanningEvent, Ouvrier, Chantier, Materiel } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { StatusBadge } from '../Common/StatusBadge';

interface CalendarView {
  type: 'month' | 'week' | 'day';
  date: Date;
}

interface Conflict {
  id: string;
  type: 'ouvrier' | 'materiel' | 'chantier';
  resourceId: string;
  events: PlanningEvent[];
  severity: 'high' | 'medium' | 'low';
}

interface CalendarEvent extends PlanningEvent {
  color: string;
  conflicts?: boolean;
}

export const Planning: React.FC = () => {
  const [events, setEvents] = useState<PlanningEvent[]>(mockPlanningEvents);
  const [calendarView, setCalendarView] = useState<CalendarView>({ type: 'month', date: new Date() });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PlanningEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [draggedEvent, setDraggedEvent] = useState<PlanningEvent | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [showConflicts, setShowConflicts] = useState(true);

  const eventColors = {
    chantier: 'bg-blue-500',
    maintenance: 'bg-orange-500',
    conge: 'bg-green-500',
    formation: 'bg-purple-500'
  };

  const eventTypeLabels = {
    chantier: 'Chantier',
    maintenance: 'Maintenance',
    conge: 'Congé',
    formation: 'Formation'
  };

  useEffect(() => {
    detectConflicts();
  }, [events]);

  const detectConflicts = () => {
    const newConflicts: Conflict[] = [];
    
    // Détecter les conflits d'ouvriers
    mockOuvriers.forEach(ouvrier => {
      const ouvrierEvents = events.filter(e => e.ouvrierId === ouvrier.id);
      const overlappingEvents = findOverlappingEvents(ouvrierEvents);
      
      if (overlappingEvents.length > 0) {
        newConflicts.push({
          id: `ouvrier-${ouvrier.id}`,
          type: 'ouvrier',
          resourceId: ouvrier.id,
          events: overlappingEvents,
          severity: 'high'
        });
      }
    });

    // Détecter les conflits de matériel
    mockMateriel.forEach(materiel => {
      const materielEvents = events.filter(e => e.materielId === materiel.id);
      const overlappingEvents = findOverlappingEvents(materielEvents);
      
      if (overlappingEvents.length > 0) {
        newConflicts.push({
          id: `materiel-${materiel.id}`,
          type: 'materiel',
          resourceId: materiel.id,
          events: overlappingEvents,
          severity: 'medium'
        });
      }
    });

    setConflicts(newConflicts);
  };

  const findOverlappingEvents = (eventList: PlanningEvent[]): PlanningEvent[] => {
    const overlapping: PlanningEvent[] = [];
    
    for (let i = 0; i < eventList.length; i++) {
      for (let j = i + 1; j < eventList.length; j++) {
        const event1 = eventList[i];
        const event2 = eventList[j];
        
        const start1 = new Date(event1.dateDebut);
        const end1 = new Date(event1.dateFin);
        const start2 = new Date(event2.dateDebut);
        const end2 = new Date(event2.dateFin);
        
        if (start1 < end2 && start2 < end1) {
          if (!overlapping.find(e => e.id === event1.id)) overlapping.push(event1);
          if (!overlapping.find(e => e.id === event2.id)) overlapping.push(event2);
        }
      }
    }
    
    return overlapping;
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events
      .filter(event => {
        const eventDate = new Date(event.dateDebut);
        return eventDate.toDateString() === date.toDateString();
      })
      .map(event => ({
        ...event,
        color: eventColors[event.type],
        conflicts: conflicts.some(c => c.events.some(e => e.id === event.id))
      }))
      .filter(event => {
        const matchesSearch = event.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             event.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || event.type === typeFilter;
        const matchesResource = resourceFilter === 'all' || 
                               event.ouvrierId === resourceFilter || 
                               event.materielId === resourceFilter ||
                               event.chantierId === resourceFilter;
        return matchesSearch && matchesType && matchesResource;
      });
  };

  const getEventsForWeek = (startDate: Date): CalendarEvent[] => {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    return events
      .filter(event => {
        const eventStart = new Date(event.dateDebut);
        const eventEnd = new Date(event.dateFin);
        return (eventStart >= startDate && eventStart <= endDate) ||
               (eventEnd >= startDate && eventEnd <= endDate) ||
               (eventStart <= startDate && eventEnd >= endDate);
      })
      .map(event => ({
        ...event,
        color: eventColors[event.type],
        conflicts: conflicts.some(c => c.events.some(e => e.id === event.id))
      }));
  };

  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(calendarView.date);
    
    switch (calendarView.type) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCalendarView({ ...calendarView, date: newDate });
  };

  const handleEventClick = (event: PlanningEvent) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEventDrop = (eventId: string, newDate: Date) => {
    setEvents(events.map(event => {
      if (event.id === eventId) {
        const duration = new Date(event.dateFin).getTime() - new Date(event.dateDebut).getTime();
        const newEnd = new Date(newDate.getTime() + duration);
        
        return {
          ...event,
          dateDebut: newDate.toISOString(),
          dateFin: newEnd.toISOString()
        };
      }
      return event;
    }));
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      setEvents(events.filter(e => e.id !== id));
    }
  };

  const handleSave = (formData: FormData) => {
    const eventData: PlanningEvent = {
      id: editingEvent?.id || Date.now().toString(),
      titre: formData.get('titre') as string,
      description: formData.get('description') as string,
      dateDebut: formData.get('dateDebut') as string,
      dateFin: formData.get('dateFin') as string,
      type: formData.get('type') as PlanningEvent['type'],
      chantierId: formData.get('chantierId') as string || undefined,
      ouvrierId: formData.get('ouvrierId') as string || undefined,
      materielId: formData.get('materielId') as string || undefined
    };

    if (editingEvent) {
      setEvents(events.map(e => e.id === editingEvent.id ? eventData : e));
    } else {
      setEvents([...events, eventData]);
    }
    
    setIsModalOpen(false);
    setEditingEvent(null);
    setSelectedDate(null);
    
    // Force refresh of the UI
    setTimeout(() => {
      setEvents([...events]);
    }, 100);
  };

  const duplicateEvent = (event: PlanningEvent) => {
    const newEvent: PlanningEvent = {
      ...event,
      id: Date.now().toString(),
      titre: `${event.titre} (Copie)`
    };
    setEvents([...events, newEvent]);
    
    // Force refresh of the UI
    setTimeout(() => {
      setEvents([...events]);
    }, 100);
  };

  const bulkDelete = () => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedEvents.length} événement(s) ?`)) {
      setEvents(events.filter(e => !selectedEvents.includes(e.id)));
      setSelectedEvents([]);
    }
  };

  const exportCalendar = () => {
    const calendarData = events.map(event => ({
      titre: event.titre,
      description: event.description,
      debut: event.dateDebut,
      fin: event.dateFin,
      type: event.type,
      chantier: event.chantierId ? mockChantiers.find(c => c.id === event.chantierId)?.nom : '',
      ouvrier: event.ouvrierId ? mockOuvriers.find(o => o.id === event.ouvrierId)?.prenom + ' ' + mockOuvriers.find(o => o.id === event.ouvrierId)?.nom : '',
      materiel: event.materielId ? mockMateriel.find(m => m.id === event.materielId)?.nom : ''
    }));
    
    console.log('Export calendrier:', calendarData);
    // Ici on pourrait générer un fichier ICS ou CSV
  };

  const syncWithExternalCalendar = () => {
    // Simulation de synchronisation
    alert('Synchronisation avec le calendrier externe en cours...');
  };

  const getResourceName = (event: PlanningEvent): string => {
    if (event.ouvrierId) {
      const ouvrier = mockOuvriers.find(o => o.id === event.ouvrierId);
      return ouvrier ? `${ouvrier.prenom} ${ouvrier.nom}` : '';
    }
    if (event.materielId) {
      const materiel = mockMateriel.find(m => m.id === event.materielId);
      return materiel ? materiel.nom : '';
    }
    if (event.chantierId) {
      const chantier = mockChantiers.find(c => c.id === event.chantierId);
      return chantier ? chantier.nom : '';
    }
    return '';
  };

  const EventForm = () => {
    const defaultDate = selectedDate || (editingEvent ? new Date(editingEvent.dateDebut) : new Date());
    const defaultEndDate = editingEvent ? new Date(editingEvent.dateFin) : new Date(defaultDate.getTime() + 60 * 60 * 1000);

    return (
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              name="type"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Date/Heure début</label>
              <input
                name="dateDebut"
                type="datetime-local"
                required
                defaultValue={defaultDate.toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date/Heure fin</label>
              <input
                name="dateFin"
                type="datetime-local"
                required
                defaultValue={defaultEndDate.toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chantier (optionnel)</label>
              <select
                name="chantierId"
                defaultValue={editingEvent?.chantierId || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Aucun chantier</option>
                {mockChantiers.map(chantier => (
                  <option key={chantier.id} value={chantier.id}>{chantier.nom}</option>
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
                {mockOuvriers.map(ouvrier => (
                  <option key={ouvrier.id} value={ouvrier.id}>
                    {ouvrier.prenom} {ouvrier.nom}
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
                {mockMateriel.map(materiel => (
                  <option key={materiel.id} value={materiel.id}>{materiel.nom}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
            Annuler
          </Button>
          {editingEvent && (
            <Button type="button" onClick={() => duplicateEvent(editingEvent)} variant="secondary">
              <Copy className="w-4 h-4 mr-2" />
              Dupliquer
            </Button>
          )}
          <Button type="submit">
            {editingEvent ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </form>
    );
  };

  const ConflictModal = () => (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
          <p className="text-sm text-red-800">
            {conflicts.length} conflit(s) détecté(s) dans le planning
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {conflicts.map(conflict => {
          const resourceName = conflict.type === 'ouvrier' 
            ? mockOuvriers.find(o => o.id === conflict.resourceId)?.prenom + ' ' + mockOuvriers.find(o => o.id === conflict.resourceId)?.nom
            : conflict.type === 'materiel'
            ? mockMateriel.find(m => m.id === conflict.resourceId)?.nom
            : mockChantiers.find(c => c.id === conflict.resourceId)?.nom;

          return (
            <div key={conflict.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {conflict.type === 'ouvrier' && <User className="w-5 h-5 text-blue-500" />}
                  {conflict.type === 'materiel' && <Wrench className="w-5 h-5 text-orange-500" />}
                  {conflict.type === 'chantier' && <Building2 className="w-5 h-5 text-green-500" />}
                  <h4 className="font-medium text-gray-900">{resourceName}</h4>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  conflict.severity === 'high' ? 'bg-red-100 text-red-800' :
                  conflict.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {conflict.severity === 'high' ? 'Critique' :
                   conflict.severity === 'medium' ? 'Moyen' : 'Faible'}
                </span>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-2">Événements en conflit :</p>
                {conflict.events.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.titre}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(event.dateDebut).toLocaleString()} - {new Date(event.dateFin).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEventClick(event)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {conflicts.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
          <p className="text-gray-500">Aucun conflit détecté dans le planning</p>
        </div>
      )}
    </div>
  );

  const ResourceModal = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ouvriers */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Ouvriers
          </h3>
          <div className="space-y-2">
            {mockOuvriers.map(ouvrier => {
              const ouvrierEvents = events.filter(e => e.ouvrierId === ouvrier.id);
              const hasConflict = conflicts.some(c => c.type === 'ouvrier' && c.resourceId === ouvrier.id);
              
              return (
                <div key={ouvrier.id} className={`p-3 border rounded-lg ${hasConflict ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{ouvrier.prenom} {ouvrier.nom}</p>
                      <p className="text-sm text-gray-600">{ouvrier.qualification}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{ouvrierEvents.length} événement(s)</p>
                      {hasConflict && <AlertTriangle className="w-4 h-4 text-red-500 ml-auto" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Matériel */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <Wrench className="w-5 h-5 mr-2" />
            Matériel
          </h3>
          <div className="space-y-2">
            {mockMateriel.map(materiel => {
              const materielEvents = events.filter(e => e.materielId === materiel.id);
              const hasConflict = conflicts.some(c => c.type === 'materiel' && c.resourceId === materiel.id);
              
              return (
                <div key={materiel.id} className={`p-3 border rounded-lg ${hasConflict ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{materiel.nom}</p>
                      <p className="text-sm text-gray-600">{materiel.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{materielEvents.length} événement(s)</p>
                      {hasConflict && <AlertTriangle className="w-4 h-4 text-red-500 ml-auto" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chantiers */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Chantiers
          </h3>
          <div className="space-y-2">
            {mockChantiers.map(chantier => {
              const chantierEvents = events.filter(e => e.chantierId === chantier.id);
              
              return (
                <div key={chantier.id} className="p-3 border rounded-lg border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{chantier.nom}</p>
                      <p className="text-sm text-gray-600">{chantier.client}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{chantierEvents.length} événement(s)</p>
                      <StatusBadge status={chantier.statut} type="chantier" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const SyncModal = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Sync className="w-16 h-16 mx-auto text-blue-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Synchronisation des agendas</h3>
        <p className="text-gray-600">Synchronisez votre planning avec des calendriers externes</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Google Calendar</h4>
              <p className="text-sm text-gray-600">Synchronisation bidirectionnelle</p>
            </div>
          </div>
          <Button size="sm">
            <Sync className="w-4 h-4 mr-2" />
            Connecter
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Outlook</h4>
              <p className="text-sm text-gray-600">Synchronisation bidirectionnelle</p>
            </div>
          </div>
          <Button size="sm">
            <Sync className="w-4 h-4 mr-2" />
            Connecter
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Calendrier Apple</h4>
              <p className="text-sm text-gray-600">Export iCal uniquement</p>
            </div>
          </div>
          <Button size="sm" variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Paramètres de synchronisation</h4>
        <div className="space-y-3">
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-2" />
            <span className="text-sm text-gray-700">Synchronisation automatique toutes les heures</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-2" />
            <span className="text-sm text-gray-700">Notifications de conflits</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm text-gray-700">Synchroniser les événements privés</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button variant="secondary" onClick={() => setIsSyncModalOpen(false)}>
          Fermer
        </Button>
        <Button onClick={syncWithExternalCalendar}>
          <Sync className="w-4 h-4 mr-2" />
          Synchroniser maintenant
        </Button>
      </div>
    </div>
  );

  const renderMonthView = () => {
    const year = calendarView.date.getFullYear();
    const month = calendarView.date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return (
      <div className="bg-white rounded-lg border">
        <div className="grid grid-cols-7 border-b">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === month;
            const isToday = day.toDateString() === new Date().toDateString();
            const dayEvents = getEventsForDate(day);
            
            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-r border-b last:border-r-0 cursor-pointer hover:bg-gray-50 ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                } ${isToday ? 'bg-blue-50' : ''}`}
                onClick={() => handleDateClick(day)}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded text-white cursor-pointer hover:opacity-80 ${event.color} ${
                        event.conflicts ? 'ring-2 ring-red-400' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                    >
                      <div className="flex items-center">
                        {event.conflicts && <AlertTriangle className="w-3 h-3 mr-1" />}
                        <span className="truncate">{event.titre}</span>
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length - 3} autres
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

  const renderWeekView = () => {
    const startOfWeek = new Date(calendarView.date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }

    const weekEvents = getEventsForWeek(startOfWeek);

    return (
      <div className="bg-white rounded-lg border">
        <div className="grid grid-cols-8 border-b">
          <div className="p-3 border-r"></div>
          {days.map(day => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={day.toISOString()} className={`p-3 text-center border-r last:border-r-0 ${isToday ? 'bg-blue-50' : ''}`}>
                <div className="text-sm text-gray-500">
                  {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-medium ${isToday ? 'text-blue-600' : ''}`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="grid grid-cols-8">
          <div className="border-r">
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="h-12 border-b p-2 text-xs text-gray-500">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
          
          {days.map(day => (
            <div key={day.toISOString()} className="border-r last:border-r-0 relative">
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="h-12 border-b hover:bg-gray-50 cursor-pointer"
                     onClick={() => {
                       const clickDate = new Date(day);
                       clickDate.setHours(hour, 0, 0, 0);
                       handleDateClick(clickDate);
                     }}>
                </div>
              ))}
              
              {weekEvents
                .filter(event => {
                  const eventDate = new Date(event.dateDebut);
                  return eventDate.toDateString() === day.toDateString();
                })
                .map(event => {
                  const startTime = new Date(event.dateDebut);
                  const endTime = new Date(event.dateFin);
                  const startHour = startTime.getHours() + startTime.getMinutes() / 60;
                  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
                  
                  return (
                    <div
                      key={event.id}
                      className={`absolute left-1 right-1 ${event.color} text-white text-xs p-1 rounded cursor-pointer hover:opacity-80 ${
                        event.conflicts ? 'ring-2 ring-red-400' : ''
                      }`}
                      style={{
                        top: `${startHour * 48}px`,
                        height: `${Math.max(duration * 48, 24)}px`
                      }}
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-center">
                        {event.conflicts && <AlertTriangle className="w-3 h-3 mr-1" />}
                        <span className="truncate">{event.titre}</span>
                      </div>
                      <div className="text-xs opacity-75">
                        {startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
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

  const renderDayView = () => {
    const dayEvents = getEventsForDate(calendarView.date);
    const isToday = calendarView.date.toDateString() === new Date().toDateString();

    return (
      <div className="bg-white rounded-lg border">
        <div className={`p-4 border-b text-center ${isToday ? 'bg-blue-50' : ''}`}>
          <h3 className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {calendarView.date.toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>
        
        <div className="grid grid-cols-2">
          <div className="border-r">
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="h-16 border-b p-3 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer"
                   onClick={() => {
                     const clickDate = new Date(calendarView.date);
                     clickDate.setHours(hour, 0, 0, 0);
                     handleDateClick(clickDate);
                   }}>
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
          
          <div className="relative">
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="h-16 border-b"></div>
            ))}
            
            {dayEvents.map(event => {
              const startTime = new Date(event.dateDebut);
              const endTime = new Date(event.dateFin);
              const startHour = startTime.getHours() + startTime.getMinutes() / 60;
              const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
              
              return (
                <div
                  key={event.id}
                  className={`absolute left-2 right-2 ${event.color} text-white p-2 rounded cursor-pointer hover:opacity-80 ${
                    event.conflicts ? 'ring-2 ring-red-400' : ''
                  }`}
                  style={{
                    top: `${startHour * 64}px`,
                    height: `${Math.max(duration * 64, 32)}px`
                  }}
                  onClick={() => handleEventClick(event)}
                >
                  <div className="flex items-center mb-1">
                    {event.conflicts && <AlertTriangle className="w-4 h-4 mr-1" />}
                    <span className="font-medium">{event.titre}</span>
                  </div>
                  <div className="text-sm opacity-90">{event.description}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - 
                    {endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {getResourceName(event) && (
                    <div className="text-xs opacity-75">{getResourceName(event)}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Planning</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setIsResourceModalOpen(true)} variant="secondary">
            <Users className="w-4 h-4 mr-2" />
            Ressources
          </Button>
          <Button onClick={() => setIsConflictModalOpen(true)} variant="secondary">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Conflits ({conflicts.length})
          </Button>
          <Button onClick={() => setIsSyncModalOpen(true)} variant="secondary">
            <Sync className="w-4 h-4 mr-2" />
            Synchroniser
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvel Événement
          </Button>
          <Button variant="secondary" onClick={exportCalendar}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Événements Total</p>
              <p className="text-2xl font-bold text-gray-900">{events.length}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conflits Détectés</p>
              <p className="text-2xl font-bold text-red-600">{conflicts.length}</p>
            </div>
            <div className="p-3 rounded-full bg-red-500">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ouvriers Planifiés</p>
              <p className="text-2xl font-bold text-green-600">
                {new Set(events.filter(e => e.ouvrierId).map(e => e.ouvrierId)).size}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Matériel Utilisé</p>
              <p className="text-2xl font-bold text-orange-600">
                {new Set(events.filter(e => e.materielId).map(e => e.materielId)).size}
              </p>
            </div>
            <div className="p-3 rounded-full bg-orange-500">
              <Wrench className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Contrôles du calendrier */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateCalendar('prev')}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
                {calendarView.type === 'month' && calendarView.date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                {calendarView.type === 'week' && `Semaine du ${calendarView.date.toLocaleDateString('fr-FR')}`}
                {calendarView.type === 'day' && calendarView.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h2>
              <button
                onClick={() => navigateCalendar('next')}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCalendarView({ ...calendarView, date: new Date() })}
            >
              Aujourd'hui
            </Button>
          </div>

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
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">Tous les types</option>
                <option value="chantier">Chantiers</option>
                <option value="maintenance">Maintenance</option>
                <option value="conge">Congés</option>
                <option value="formation">Formations</option>
              </select>
            </div>

            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['month', 'week', 'day'] as const).map(viewType => (
                <button
                  key={viewType}
                  onClick={() => setCalendarView({ ...calendarView, type: viewType })}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    calendarView.type === viewType
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {viewType === 'month' ? 'Mois' : viewType === 'week' ? 'Semaine' : 'Jour'}
                </button>
              ))}
            </div>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showConflicts}
                onChange={(e) => setShowConflicts(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Afficher conflits</span>
            </label>
          </div>
        </div>
      </div>

      {/* Légende */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Légende :</span>
          {Object.entries(eventTypeLabels).map(([type, label]) => (
            <div key={type} className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded ${eventColors[type as keyof typeof eventColors]}`}></div>
              <span className="text-sm text-gray-600">{label}</span>
            </div>
          ))}
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-red-500 ring-2 ring-red-400"></div>
            <span className="text-sm text-gray-600">Conflit</span>
          </div>
        </div>
      </div>

      {/* Actions en lot */}
      {selectedEvents.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedEvents.length} événement(s) sélectionné(s)
            </span>
            <div className="flex space-x-2">
              <Button size="sm" variant="danger" onClick={bulkDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setSelectedEvents([])}>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Vue calendrier */}
      <div className="calendar-container">
        {calendarView.type === 'month' && renderMonthView()}
        {calendarView.type === 'week' && renderWeekView()}
        {calendarView.type === 'day' && renderDayView()}
      </div>

      {/* Modal de création/modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
          setSelectedDate(null);
        }}
        title={editingEvent ? 'Modifier l\'événement' : 'Nouvel événement'}
        size="lg"
      >
        <EventForm />
      </Modal>

      {/* Modal des conflits */}
      <Modal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        title="Gestion des Conflits"
        size="xl"
      >
        <ConflictModal />
      </Modal>

      {/* Modal des ressources */}
      <Modal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        title="Gestion des Ressources"
        size="xl"
      >
        <ResourceModal />
      </Modal>

      {/* Modal de synchronisation */}
      <Modal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        title="Synchronisation des Agendas"
        size="lg"
      >
        <SyncModal />
      </Modal>
    </div>
  );
};