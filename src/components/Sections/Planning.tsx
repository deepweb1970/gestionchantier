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
  ArrowRight,
  FileText,
  Table,
  Printer,
  BarChart3
} from 'lucide-react';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { PlanningEvent, Chantier, Ouvrier, Materiel } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { StatusBadge } from '../Common/StatusBadge';
import { ExportModal } from '../Common/ExportModal';
import { exportToPDF } from '../../utils/pdfExport';

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
  
  // Export filters
  const [exportDateStart, setExportDateStart] = useState('');
  const [exportDateEnd, setExportDateEnd] = useState('');
  const [exportChantierFilter, setExportChantierFilter] = useState('all');
  const [exportOuvrierFilter, setExportOuvrierFilter] = useState('all');
  const [exportMaterielFilter, setExportMaterielFilter] = useState('all');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');
  const [exportType, setExportType] = useState<'table' | 'chart'>('table');
  const [chartType, setChartType] = useState<'gantt' | 'timeline' | 'calendar'>('gantt');

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

  const getFilteredEventsForExport = () => {
    return (events || []).filter(event => {
      // Filtre par date
      if (exportDateStart && exportDateEnd) {
        const eventStart = new Date(event.dateDebut);
        const eventEnd = new Date(event.dateFin);
        const filterStart = new Date(exportDateStart);
        const filterEnd = new Date(exportDateEnd);
        filterEnd.setHours(23, 59, 59, 999); // Inclure toute la journée de fin
        
        // L'événement doit chevaucher avec la période de filtre
        if (eventEnd < filterStart || eventStart > filterEnd) {
          return false;
        }
      }
      
      // Filtre par chantier
      if (exportChantierFilter !== 'all' && event.chantierId !== exportChantierFilter) {
        return false;
      }
      
      // Filtre par ouvrier
      if (exportOuvrierFilter !== 'all' && event.ouvrierId !== exportOuvrierFilter) {
        return false;
      }
      
      // Filtre par matériel
      if (exportMaterielFilter !== 'all' && event.materielId !== exportMaterielFilter) {
        return false;
      }
      
      return true;
    });
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToExcel = (data: any[], filename: string) => {
    // Simulation Excel export
    const csvContent = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToChart = (data: any[], filename: string) => {
    // Créer un canvas pour le graphique
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Configuration du graphique
    const margin = { top: 60, right: 40, bottom: 80, left: 200 };
    const chartWidth = canvas.width - margin.left - margin.right;
    const chartHeight = canvas.height - margin.top - margin.bottom;
    
    // Fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (chartType === 'gantt') {
      drawGanttChart(ctx, data, margin, chartWidth, chartHeight, filename);
    } else if (chartType === 'timeline') {
      drawTimelineChart(ctx, data, margin, chartWidth, chartHeight, filename);
    } else if (chartType === 'calendar') {
      drawCalendarChart(ctx, data, margin, chartWidth, chartHeight, filename);
    }
    
    // Télécharger l'image
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}-${chartType}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  };
  
  const drawGanttChart = (ctx: CanvasRenderingContext2D, data: any[], margin: any, chartWidth: number, chartHeight: number, filename: string) => {
    // Titre
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Planning Gantt - ${filename}`, canvas.width / 2, 30);
    
    // Sous-titre avec période
    ctx.font = '14px Arial';
    ctx.fillStyle = '#6b7280';
    const periode = exportDateStart && exportDateEnd ? 
      `${new Date(exportDateStart).toLocaleDateString('fr-FR')} - ${new Date(exportDateEnd).toLocaleDateString('fr-FR')}` :
      'Tous les événements';
    ctx.fillText(periode, canvas.width / 2, 50);
    
    if (data.length === 0) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '16px Arial';
      ctx.fillText('Aucun événement à afficher', canvas.width / 2, canvas.height / 2);
      return;
    }
    
    // Calculer la plage de dates
    const dates = data.map(event => new Date(event['Date début']));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Grouper par ressource (ouvrier ou matériel)
    const resources = [...new Set(data.map(event => event.Ouvrier || event.Matériel || 'Non assigné'))];
    const rowHeight = Math.min(40, chartHeight / resources.length);
    
    // Dessiner l'axe des dates (en haut)
    ctx.fillStyle = '#374151';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    for (let i = 0; i <= totalDays; i += Math.max(1, Math.floor(totalDays / 10))) {
      const date = new Date(minDate.getTime() + i * 24 * 60 * 60 * 1000);
      const x = margin.left + (i / totalDays) * chartWidth;
      
      // Ligne verticale
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartHeight);
      ctx.stroke();
      
      // Date
      ctx.fillText(date.toLocaleDateString('fr-FR'), x, margin.top - 10);
    }
    
    // Dessiner les ressources et leurs événements
    ctx.textAlign = 'left';
    resources.forEach((resource, index) => {
      const y = margin.top + index * rowHeight;
      
      // Nom de la ressource
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(resource, 10, y + rowHeight / 2 + 4);
      
      // Ligne horizontale
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin.left, y + rowHeight);
      ctx.lineTo(margin.left + chartWidth, y + rowHeight);
      ctx.stroke();
      
      // Événements pour cette ressource
      const resourceEvents = data.filter(event => 
        (event.Ouvrier === resource) || (event.Matériel === resource) || 
        (!event.Ouvrier && !event.Matériel && resource === 'Non assigné')
      );
      
      resourceEvents.forEach((event, eventIndex) => {
        const startDate = new Date(event['Date début']);
        const endDate = new Date(event['Date fin']);
        
        const startX = margin.left + ((startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) / totalDays * chartWidth;
        const endX = margin.left + ((endDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) / totalDays * chartWidth;
        const barWidth = Math.max(2, endX - startX);
        
        // Couleur selon le type
        const colors = {
          'chantier': '#3b82f6',
          'maintenance': '#f59e0b',
          'conge': '#10b981',
          'formation': '#8b5cf6'
        };
        ctx.fillStyle = colors[event.Type as keyof typeof colors] || '#6b7280';
        
        // Barre de l'événement
        const barY = y + 5 + (eventIndex % 3) * 10;
        ctx.fillRect(startX, barY, barWidth, 8);
        
        // Texte de l'événement (si assez de place)
        if (barWidth > 50) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px Arial';
          ctx.textAlign = 'left';
          const text = event.Titre.length > 15 ? event.Titre.substring(0, 15) + '...' : event.Titre;
          ctx.fillText(text, startX + 2, barY + 6);
        }
      });
    });
    
    // Légende
    const legendY = margin.top + chartHeight + 20;
    const legendItems = [
      { type: 'chantier', color: '#3b82f6', label: 'Chantier' },
      { type: 'maintenance', color: '#f59e0b', label: 'Maintenance' },
      { type: 'conge', color: '#10b981', label: 'Congé' },
      { type: 'formation', color: '#8b5cf6', label: 'Formation' }
    ];
    
    legendItems.forEach((item, index) => {
      const x = margin.left + index * 120;
      
      // Rectangle coloré
      ctx.fillStyle = item.color;
      ctx.fillRect(x, legendY, 15, 10);
      
      // Texte
      ctx.fillStyle = '#374151';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, x + 20, legendY + 8);
    });
  };
  
  const drawTimelineChart = (ctx: CanvasRenderingContext2D, data: any[], margin: any, chartWidth: number, chartHeight: number, filename: string) => {
    // Titre
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Timeline - ${filename}`, canvas.width / 2, 30);
    
    if (data.length === 0) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '16px Arial';
      ctx.fillText('Aucun événement à afficher', canvas.width / 2, canvas.height / 2);
      return;
    }
    
    // Trier les événements par date
    const sortedData = [...data].sort((a, b) => 
      new Date(a['Date début']).getTime() - new Date(b['Date début']).getTime()
    );
    
    // Ligne de temps centrale
    const timelineY = margin.top + chartHeight / 2;
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(margin.left, timelineY);
    ctx.lineTo(margin.left + chartWidth, timelineY);
    ctx.stroke();
    
    // Événements sur la timeline
    sortedData.forEach((event, index) => {
      const x = margin.left + (index / (sortedData.length - 1)) * chartWidth;
      const isEven = index % 2 === 0;
      const eventY = isEven ? timelineY - 80 : timelineY + 80;
      
      // Ligne vers l'événement
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, timelineY);
      ctx.lineTo(x, eventY);
      ctx.stroke();
      
      // Point sur la timeline
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, timelineY, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Boîte d'événement
      const boxWidth = 150;
      const boxHeight = 60;
      const boxX = x - boxWidth / 2;
      const boxY = eventY - (isEven ? boxHeight : 0);
      
      // Fond de la boîte
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      
      // Bordure de la boîte
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      
      // Texte de l'événement
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      const title = event.Titre.length > 20 ? event.Titre.substring(0, 20) + '...' : event.Titre;
      ctx.fillText(title, x, boxY + 15);
      
      ctx.font = '9px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(event['Date début'], x, boxY + 30);
      ctx.fillText(`${event['Heure début']} - ${event['Heure fin']}`, x, boxY + 42);
      ctx.fillText(event.Type, x, boxY + 54);
    });
  };
  
  const drawCalendarChart = (ctx: CanvasRenderingContext2D, data: any[], margin: any, chartWidth: number, chartHeight: number, filename: string) => {
    // Titre
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Calendrier - ${filename}`, canvas.width / 2, 30);
    
    if (data.length === 0) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '16px Arial';
      ctx.fillText('Aucun événement à afficher', canvas.width / 2, canvas.height / 2);
      return;
    }
    
    // Calculer la plage de dates pour le calendrier
    const dates = data.map(event => new Date(event['Date début']));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Ajuster au début et fin de mois
    const startMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const endMonth = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
    
    // Calculer le nombre de semaines nécessaires
    const totalDays = Math.ceil((endMonth.getTime() - startMonth.getTime()) / (1000 * 60 * 60 * 24));
    const weeks = Math.ceil(totalDays / 7);
    
    const cellWidth = chartWidth / 7;
    const cellHeight = chartHeight / weeks;
    
    // Jours de la semaine
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    
    dayNames.forEach((day, index) => {
      const x = margin.left + index * cellWidth + cellWidth / 2;
      ctx.fillText(day, x, margin.top - 10);
    });
    
    // Grille du calendrier
    for (let week = 0; week < weeks; week++) {
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startMonth);
        currentDate.setDate(startMonth.getDate() + week * 7 + day);
        
        const x = margin.left + day * cellWidth;
        const y = margin.top + week * cellHeight;
        
        // Bordure de la cellule
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellWidth, cellHeight);
        
        // Numéro du jour
        ctx.fillStyle = currentDate.getMonth() === minDate.getMonth() || currentDate.getMonth() === maxDate.getMonth() ? 
          '#1f2937' : '#9ca3af';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(currentDate.getDate().toString(), x + 5, y + 15);
        
        // Événements de ce jour
        const dayEvents = data.filter(event => {
          const eventDate = new Date(event['Date début']);
          return eventDate.toDateString() === currentDate.toDateString();
        });
        
        dayEvents.slice(0, 3).forEach((event, eventIndex) => {
          const eventY = y + 20 + eventIndex * 12;
          
          // Couleur selon le type
          const colors = {
            'chantier': '#3b82f6',
            'maintenance': '#f59e0b',
            'conge': '#10b981',
            'formation': '#8b5cf6'
          };
          ctx.fillStyle = colors[event.Type as keyof typeof colors] || '#6b7280';
          
          // Rectangle de l'événement
          ctx.fillRect(x + 2, eventY, cellWidth - 4, 10);
          
          // Texte de l'événement
          ctx.fillStyle = '#ffffff';
          ctx.font = '8px Arial';
          ctx.textAlign = 'left';
          const text = event.Titre.length > 12 ? event.Titre.substring(0, 12) + '...' : event.Titre;
          ctx.fillText(text, x + 4, eventY + 7);
        });
        
        // Indicateur s'il y a plus d'événements
        if (dayEvents.length > 3) {
          ctx.fillStyle = '#6b7280';
          ctx.font = '8px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`+${dayEvents.length - 3}`, x + cellWidth / 2, y + cellHeight - 5);
        }
      }
    }
  };

  const handleExport = () => {
    const filteredEvents = getFilteredEventsForExport();
    
    if (filteredEvents.length === 0) {
      alert('Aucun événement trouvé avec les filtres sélectionnés');
      return;
    }
    
    // Préparer les données pour l'export
    const exportData = filteredEvents.map(event => {
      const chantier = chantiers?.find(c => c.id === event.chantierId);
      const ouvrier = ouvriers?.find(o => o.id === event.ouvrierId);
      const materielItem = materiel?.find(m => m.id === event.materielId);
      
      const startDate = new Date(event.dateDebut);
      const endDate = new Date(event.dateFin);
      
      return {
        'Titre': event.titre,
        'Type': event.type === 'chantier' ? 'Chantier' :
                event.type === 'maintenance' ? 'Maintenance' :
                event.type === 'conge' ? 'Congé' : 'Formation',
        'Date début': startDate.toLocaleDateString('fr-FR'),
        'Heure début': startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        'Date fin': endDate.toLocaleDateString('fr-FR'),
        'Heure fin': endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        'Durée (h)': ((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)).toFixed(1),
        'Chantier': chantier?.nom || '-',
        'Ouvrier': ouvrier ? `${ouvrier.prenom} ${ouvrier.nom}` : '-',
        'Matériel': materielItem?.nom || '-',
        'Description': event.description || '-'
      };
    }).sort((a, b) => new Date(a['Date début']).getTime() - new Date(b['Date début']).getTime());
    
    const periodText = exportDateStart && exportDateEnd 
      ? `du ${new Date(exportDateStart).toLocaleDateString()} au ${new Date(exportDateEnd).toLocaleDateString()}`
      : 'toutes périodes';
    
    const filename = `planning-${new Date().toISOString().split('T')[0]}`;
    
    try {
      if (exportType === 'table') {
        if (exportFormat === 'pdf') {
          const columns = [
            { header: 'Titre', dataKey: 'Titre', width: 40 },
            { header: 'Type', dataKey: 'Type', width: 20 },
            { header: 'Date début', dataKey: 'Date début', width: 22 },
            { header: 'Heure début', dataKey: 'Heure début', width: 18 },
            { header: 'Date fin', dataKey: 'Date fin', width: 22 },
            { header: 'Heure fin', dataKey: 'Heure fin', width: 18 },
            { header: 'Durée (h)', dataKey: 'Durée (h)', width: 15 },
            { header: 'Chantier', dataKey: 'Chantier', width: 30 },
            { header: 'Ouvrier', dataKey: 'Ouvrier', width: 25 }
          ];
          
          const stats = {
            'Nombre d\'événements': filteredEvents.length,
            'Période': periodText,
            'Total heures': exportData.reduce((sum, event) => sum + parseFloat(event['Durée (h)']), 0).toFixed(1) + 'h',
            'Événements chantier': filteredEvents.filter(e => e.type === 'chantier').length,
            'Événements maintenance': filteredEvents.filter(e => e.type === 'maintenance').length,
            'Congés': filteredEvents.filter(e => e.type === 'conge').length
          };
          
          exportToPDF({
            title: 'Planning des Événements',
            subtitle: `Période: ${periodText}`,
            data: exportData,
            columns,
            filename,
            includeStats: true,
            stats
          });
        } else if (exportFormat === 'csv') {
          exportToCSV(exportData, filename);
        } else if (exportFormat === 'excel') {
          exportToExcel(exportData, filename);
        }
      } else if (exportType === 'chart') {
        exportToChart(exportData, filename);
      }
      
      setIsExportModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export');
    }
  };

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
      
      // Construire les dates complètes avec les heures en UTC pour éviter les problèmes de fuseau horaire
      const dateTimeDebut = `${dateDebut}T${heureDebut}:00.000Z`;
      const dateTimeFin = `${dateFin}T${heureFin}:00.000Z`;
      
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
    // Extraire directement les parties date et heure pour éviter les conversions de fuseau horaire
    const startParts = start.split('T');
    const endParts = end.split('T');
    
    const startDateStr = startParts[0];
    const startTimeStr = startParts[1] ? startParts[1].substring(0, 5) : '00:00';
    const endDateStr = endParts[0];
    const endTimeStr = endParts[1] ? endParts[1].substring(0, 5) : '00:00';
    
    const startDate = new Date(startDateStr + 'T00:00:00');
    const endDate = new Date(endDateStr + 'T00:00:00');
    
    const isSameDay = startDate.toDateString() === endDate.toDateString();
    
    if (isSameDay) {
      return `${startDate.toLocaleDateString()} ${startTimeStr} - ${endTimeStr}`;
    } else {
      return `${startDate.toLocaleDateString()} ${startTimeStr} - ${endDate.toLocaleDateString()} ${endTimeStr}`;
    }
  };

  const ExportModalComponent = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Export du Planning</h3>
        <p className="text-sm text-blue-700">
          Exportez les événements du planning selon vos critères de filtrage
        </p>
      </div>

      <div className="space-y-4">
        {/* Type d'export */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Type d'export</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="exportType"
                value="table"
                checked={exportType === 'table'}
                onChange={(e) => setExportType(e.target.value as 'table' | 'chart')}
                className="mr-3"
              />
              <FileText className="w-5 h-5 mr-2 text-blue-500" />
              <span>Tableau de données</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="exportType"
                value="chart"
                checked={exportType === 'chart'}
                onChange={(e) => setExportType(e.target.value as 'table' | 'chart')}
                className="mr-3"
              />
              <BarChart3 className="w-5 h-5 mr-2 text-green-500" />
              <span>Graphique visuel</span>
            </label>
          </div>
        </div>

        {/* Format d'export pour tableau */}
        {exportType === 'table' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Format de fichier</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={exportFormat === 'pdf'}
                  onChange={(e) => setExportFormat(e.target.value as 'pdf')}
                  className="mr-3"
                />
                <FileText className="w-5 h-5 mr-2 text-red-500" />
                <span>PDF - Document formaté</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value as 'csv')}
                  className="mr-3"
                />
                <FileText className="w-5 h-5 mr-2 text-green-500" />
                <span>CSV - Données tabulaires</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="excel"
                  checked={exportFormat === 'excel'}
                  onChange={(e) => setExportFormat(e.target.value as 'excel')}
                  className="mr-3"
                />
                <FileText className="w-5 h-5 mr-2 text-blue-500" />
                <span>Excel - Feuille de calcul</span>
              </label>
            </div>
          </div>
        )}

        {/* Type de graphique */}
        {exportType === 'chart' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Type de graphique</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="chartType"
                  value="gantt"
                  checked={chartType === 'gantt'}
                  onChange={(e) => setChartType(e.target.value as 'gantt' | 'timeline' | 'calendar')}
                  className="mr-3"
                />
                <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                <span>Diagramme de Gantt</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="chartType"
                  value="timeline"
                  checked={chartType === 'timeline'}
                  onChange={(e) => setChartType(e.target.value as 'gantt' | 'timeline' | 'calendar')}
                  className="mr-3"
                />
                <Clock className="w-5 h-5 mr-2 text-purple-500" />
                <span>Timeline chronologique</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="chartType"
                  value="calendar"
                  checked={chartType === 'calendar'}
                  onChange={(e) => setChartType(e.target.value as 'gantt' | 'timeline' | 'calendar')}
                  className="mr-3"
                />
                <Calendar className="w-5 h-5 mr-2 text-green-500" />
                <span>Vue calendrier</span>
              </label>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
            <input
              type="date"
              value={exportDateStart}
              onChange={(e) => setExportDateStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
            <input
              type="date"
              value={exportDateEnd}
              onChange={(e) => setExportDateEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chantier</label>
            <select
              value={exportChantierFilter}
              onChange={(e) => setExportChantierFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les chantiers</option>
              {chantiers?.filter(c => c.statut === 'actif' || c.statut === 'planifie').map(chantier => (
                <option key={chantier.id} value={chantier.id}>
                  {chantier.nom}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ouvrier</label>
            <select
              value={exportOuvrierFilter}
              onChange={(e) => setExportOuvrierFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les ouvriers</option>
              {ouvriers?.filter(o => o.statut === 'actif').map(ouvrier => (
                <option key={ouvrier.id} value={ouvrier.id}>
                  {ouvrier.prenom} {ouvrier.nom}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Matériel</label>
            <select
              value={exportMaterielFilter}
              onChange={(e) => setExportMaterielFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tout le matériel</option>
              {materiel?.filter(m => m.statut === 'disponible' || m.statut === 'en_service').map(item => (
                <option key={item.id} value={item.id}>
                  {item.nom}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Aperçu de l'export</h4>
          <div className="text-sm text-gray-600">
            <p>• {getFilteredEventsForExport().length} événement(s) à exporter</p>
            <p>• Type: {exportType === 'table' ? 'Tableau' : 'Graphique'}</p>
            {exportType === 'table' && <p>• Format: {exportFormat.toUpperCase()}</p>}
            {exportType === 'chart' && <p>• Graphique: {
              chartType === 'gantt' ? 'Diagramme de Gantt' :
              chartType === 'timeline' ? 'Timeline' :
              'Calendrier'
            }</p>}
            {exportDateStart && exportDateEnd && (
              <p>• Période: {new Date(exportDateStart).toLocaleDateString()} - {new Date(exportDateEnd).toLocaleDateString()}</p>
            )}
            {exportChantierFilter !== 'all' && (
              <p>• Chantier: {chantiers?.find(c => c.id === exportChantierFilter)?.nom}</p>
            )}
            {exportOuvrierFilter !== 'all' && (
              <p>• Ouvrier: {ouvriers?.find(o => o.id === exportOuvrierFilter)?.prenom} {ouvriers?.find(o => o.id === exportOuvrierFilter)?.nom}</p>
            )}
            {exportMaterielFilter !== 'all' && (
              <p>• Matériel: {materiel?.find(m => m.id === exportMaterielFilter)?.nom}</p>
            )}
            <p>• Colonnes: Titre, Type, Date début, Heure début, Date fin, Heure fin, Durée, Chantier, Ouvrier, Matériel, Description</p>
            {exportType === 'chart' && (
              <div className="mt-2 p-2 bg-blue-50 rounded">
                <p className="text-blue-700 text-xs">
                  {chartType === 'gantt' && '📊 Diagramme de Gantt : Vue chronologique avec barres par ressource'}
                  {chartType === 'timeline' && '⏱️ Timeline : Vue chronologique linéaire des événements'}
                  {chartType === 'calendar' && '📅 Calendrier : Vue mensuelle avec événements par jour'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button variant="secondary" onClick={() => setIsExportModalOpen(false)}>
          Annuler
        </Button>
        <Button onClick={handleExport} disabled={getFilteredEventsForExport().length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Exporter {exportType === 'table' ? exportFormat.toUpperCase() : 'Graphique'}
        </Button>
      </div>
    </div>
  );

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
              defaultValue={editingEvent ? 
                (editingEvent.dateDebut.includes('T') ?
                  editingEvent.dateDebut.split('T')[1].substring(0, 5) :
                  '08:00') : '08:00'}
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
              defaultValue={editingEvent ? 
                (editingEvent.dateFin.includes('T') ?
                  editingEvent.dateFin.split('T')[1].substring(0, 5) :
                  '17:00') : '17:00'}
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
                  // Extraire les heures directement depuis les chaînes ISO pour éviter les conversions de fuseau horaire
                  const eventStartStr = event.dateDebut;
                  const eventEndStr = event.dateFin;
                  
                  // Extraire la date et l'heure de début de l'événement
                  const eventStartDate = eventStartStr.split('T')[0];
                  const eventStartTime = eventStartStr.split('T')[1];
                  const eventStartHour = parseInt(eventStartTime.split(':')[0]);
                  const eventStartMinute = parseInt(eventStartTime.split(':')[1]);
                  
                  // Extraire la date et l'heure de fin de l'événement
                  const eventEndDate = eventEndStr.split('T')[0];
                  const eventEndTime = eventEndStr.split('T')[1];
                  const eventEndHour = parseInt(eventEndTime.split(':')[0]);
                  const eventEndMinute = parseInt(eventEndTime.split(':')[1]);
                  
                  // Date du jour actuel dans la grille
                  const currentDayStr = day.toISOString().split('T')[0];
                  
                  // Vérifier si l'événement se déroule ce jour-là
                  const isEventOnThisDay = (eventStartDate === currentDayStr) || 
                                         (eventEndDate === currentDayStr) ||
                                         (eventStartDate < currentDayStr && eventEndDate > currentDayStr);
                  
                  if (!isEventOnThisDay) return false;
                  
                  // Vérifier si l'événement se déroule pendant cette heure
                  if (eventStartDate === currentDayStr && eventEndDate === currentDayStr) {
                    // Événement sur le même jour
                    const eventStartTotalMinutes = eventStartHour * 60 + eventStartMinute;
                    const eventEndTotalMinutes = eventEndHour * 60 + eventEndMinute;
                    const hourStartMinutes = hour * 60;
                    const hourEndMinutes = (hour + 1) * 60;
                    
                    return eventStartTotalMinutes < hourEndMinutes && eventEndTotalMinutes > hourStartMinutes;
                  } else if (eventStartDate === currentDayStr) {
                    // Événement commence ce jour
                    const eventStartTotalMinutes = eventStartHour * 60 + eventStartMinute;
                    const hourEndMinutes = (hour + 1) * 60;
                    return eventStartTotalMinutes < hourEndMinutes;
                  } else if (eventEndDate === currentDayStr) {
                    // Événement finit ce jour
                    const eventEndTotalMinutes = eventEndHour * 60 + eventEndMinute;
                    const hourStartMinutes = hour * 60;
                    return eventEndTotalMinutes > hourStartMinutes;
                  } else {
                    // Événement s'étend sur plusieurs jours
                    return true;
                  }
                  
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
                            {event.dateDebut.includes('T') ? event.dateDebut.split('T')[1].substring(0, 5) : '00:00'}
                            {' - '}
                            {event.dateFin.includes('T') ? event.dateFin.split('T')[1].substring(0, 5) : '00:00'}
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
              // Extraire les heures directement depuis les chaînes ISO
              const eventStartStr = event.dateDebut;
              const eventEndStr = event.dateFin;
              
              // Extraire la date et l'heure de début de l'événement
              const eventStartDate = eventStartStr.split('T')[0];
              const eventStartTime = eventStartStr.split('T')[1];
              const eventStartHour = parseInt(eventStartTime.split(':')[0]);
              const eventStartMinute = parseInt(eventStartTime.split(':')[1]);
              
              // Extraire la date et l'heure de fin de l'événement
              const eventEndDate = eventEndStr.split('T')[0];
              const eventEndTime = eventEndStr.split('T')[1];
              const eventEndHour = parseInt(eventEndTime.split(':')[0]);
              const eventEndMinute = parseInt(eventEndTime.split(':')[1]);
              
              // Date du jour actuel
              const currentDayStr = currentDate.toISOString().split('T')[0];
              
              // Vérifier si l'événement se déroule ce jour-là
              const isEventOnThisDay = (eventStartDate === currentDayStr) || 
                                     (eventEndDate === currentDayStr) ||
                                     (eventStartDate < currentDayStr && eventEndDate > currentDayStr);
              
              if (!isEventOnThisDay) return false;
              
              // Vérifier si l'événement se déroule pendant cette heure
              if (eventStartDate === currentDayStr && eventEndDate === currentDayStr) {
                // Événement sur le même jour
                const eventStartTotalMinutes = eventStartHour * 60 + eventStartMinute;
                const eventEndTotalMinutes = eventEndHour * 60 + eventEndMinute;
                const hourStartMinutes = hour * 60;
                const hourEndMinutes = (hour + 1) * 60;
                
                return eventStartTotalMinutes < hourEndMinutes && eventEndTotalMinutes > hourStartMinutes;
              } else if (eventStartDate === currentDayStr) {
                // Événement commence ce jour
                const eventStartTotalMinutes = eventStartHour * 60 + eventStartMinute;
                const hourEndMinutes = (hour + 1) * 60;
                return eventStartTotalMinutes < hourEndMinutes;
              } else if (eventEndDate === currentDayStr) {
                // Événement finit ce jour
                const eventEndTotalMinutes = eventEndHour * 60 + eventEndMinute;
                const hourStartMinutes = hour * 60;
                return eventEndTotalMinutes > hourStartMinutes;
              } else {
                // Événement s'étend sur plusieurs jours
                return true;
              }
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
                            {event.dateDebut.includes('T') ? event.dateDebut.split('T')[1].substring(0, 5) : '00:00'}
                            {' - '}
                            {event.dateFin.includes('T') ? event.dateFin.split('T')[1].substring(0, 5) : '00:00'}
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

      {/* Modal d'export */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Exporter le Planning"
        size="lg"
      >
        <ExportModalComponent />
      </Modal>
    </div>
  );
};