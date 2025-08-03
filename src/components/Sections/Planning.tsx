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
  BarChart3,
  PieChart,
  TrendingUp
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
  const [isChartExportModalOpen, setIsChartExportModalOpen] = useState(false);
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
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  
  // Chart export states
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'timeline'>('bar');
  const [chartDateStart, setChartDateStart] = useState('');
  const [chartDateEnd, setChartDateEnd] = useState('');
  const [chartGroupBy, setChartGroupBy] = useState<'day' | 'week' | 'month' | 'type' | 'resource'>('day');
  const [chartChantier, setChartChantier] = useState('all');
  const [chartOuvrier, setChartOuvrier] = useState('all');
  const [chartMateriel, setChartMateriel] = useState('all');

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
        filename: `planning-${new Date().toISOString().split('T')[0]}`,
        includeStats: true,
        stats
      });
    } else if (exportFormat === 'csv') {
      exportToCSV(exportData, `planning-${new Date().toISOString().split('T')[0]}`);
    } else if (exportFormat === 'excel') {
      exportToExcel(exportData, `planning-${new Date().toISOString().split('T')[0]}`);
    }
    
    setIsExportModalOpen(false);
  };

  const handleChartExport = () => {
    const filteredEvents = getFilteredEventsForChart();
    
    if (filteredEvents.length === 0) {
      alert('Aucun événement trouvé pour les critères sélectionnés');
      return;
    }
    
    generateChart(filteredEvents);
  };

  const getFilteredEventsForChart = () => {
    return (events || []).filter(event => {
      const eventDate = new Date(event.dateDebut);
      
      // Filtre par date
      if (chartDateStart && eventDate < new Date(chartDateStart)) return false;
      if (chartDateEnd && eventDate > new Date(chartDateEnd + 'T23:59:59')) return false;
      
      // Filtre par chantier
      if (chartChantier !== 'all' && event.chantierId !== chartChantier) return false;
      
      // Filtre par ouvrier
      if (chartOuvrier !== 'all' && event.ouvrierId !== chartOuvrier) return false;
      
      // Filtre par matériel
      if (chartMateriel !== 'all' && event.materielId !== chartMateriel) return false;
      
      return true;
    });
  };

  const generateChart = (filteredEvents: PlanningEvent[]) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Configuration du graphique
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Titre
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Planning - ${getChartTitle()}`, canvas.width / 2, 40);
    
    // Sous-titre avec période
    ctx.font = '14px Arial';
    ctx.fillStyle = '#6b7280';
    const periode = chartDateStart && chartDateEnd 
      ? `${new Date(chartDateStart).toLocaleDateString()} - ${new Date(chartDateEnd).toLocaleDateString()}`
      : 'Toutes les dates';
    ctx.fillText(`Période: ${periode}`, canvas.width / 2, 65);
    
    // Générer le graphique selon le type
    switch (chartType) {
      case 'bar':
        generateBarChart(ctx, filteredEvents, canvas.width, canvas.height);
        break;
      case 'pie':
        generatePieChart(ctx, filteredEvents, canvas.width, canvas.height);
        break;
      case 'timeline':
        generateTimelineChart(ctx, filteredEvents, canvas.width, canvas.height);
        break;
    }
    
    // Télécharger l'image
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `planning-${chartType}-${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
    
    setIsChartExportModalOpen(false);
  };

  const getChartTitle = () => {
    switch (chartType) {
      case 'bar': return 'Répartition des événements';
      case 'pie': return 'Distribution par type';
      case 'timeline': return 'Timeline des événements';
      default: return 'Graphique du planning';
    }
  };

  const generateBarChart = (ctx: CanvasRenderingContext2D, events: PlanningEvent[], width: number, height: number) => {
    const chartArea = { x: 80, y: 100, width: width - 160, height: height - 200 };
    const data = getChartData(events);
    
    if (data.length === 0) return;
    
    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = chartArea.width / data.length * 0.8;
    const barSpacing = chartArea.width / data.length * 0.2;
    
    // Couleurs pour les barres
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    
    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartArea.height;
      const x = chartArea.x + (index * (barWidth + barSpacing));
      const y = chartArea.y + chartArea.height - barHeight;
      
      // Dessiner la barre
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Valeur au-dessus de la barre
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);
      
      // Label en bas
      ctx.save();
      ctx.translate(x + barWidth / 2, chartArea.y + chartArea.height + 15);
      ctx.rotate(-Math.PI / 4);
      ctx.textAlign = 'right';
      ctx.fillText(item.label, 0, 0);
      ctx.restore();
    });
    
    // Axes
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartArea.x, chartArea.y);
    ctx.lineTo(chartArea.x, chartArea.y + chartArea.height);
    ctx.lineTo(chartArea.x + chartArea.width, chartArea.y + chartArea.height);
    ctx.stroke();
  };

  const generatePieChart = (ctx: CanvasRenderingContext2D, events: PlanningEvent[], width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;
    
    const data = getChartData(events);
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    if (total === 0) return;
    
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    let currentAngle = -Math.PI / 2;
    
    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      
      // Dessiner la tranche
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Label et pourcentage
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 30);
      
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, labelX, labelY);
      ctx.fillText(`${((item.value / total) * 100).toFixed(1)}%`, labelX, labelY + 15);
      
      currentAngle += sliceAngle;
    });
  };

  const generateTimelineChart = (ctx: CanvasRenderingContext2D, events: PlanningEvent[], width: number, height: number) => {
    const chartArea = { x: 80, y: 100, width: width - 160, height: height - 200 };
    
    if (events.length === 0) return;
    
    // Trier les événements par date
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime()
    );
    
    const startDate = new Date(sortedEvents[0].dateDebut);
    const endDate = new Date(sortedEvents[sortedEvents.length - 1].dateFin);
    const totalDuration = endDate.getTime() - startDate.getTime();
    
    const colors = {
      'chantier': '#3b82f6',
      'maintenance': '#f59e0b',
      'conge': '#10b981',
      'formation': '#8b5cf6'
    };
    
    // Dessiner la ligne de temps
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chartArea.x, chartArea.y + chartArea.height / 2);
    ctx.lineTo(chartArea.x + chartArea.width, chartArea.y + chartArea.height / 2);
    ctx.stroke();
    
    // Dessiner les événements
    sortedEvents.forEach((event, index) => {
      const eventStart = new Date(event.dateDebut);
      const eventEnd = new Date(event.dateFin);
      
      const startX = chartArea.x + ((eventStart.getTime() - startDate.getTime()) / totalDuration) * chartArea.width;
      const endX = chartArea.x + ((eventEnd.getTime() - startDate.getTime()) / totalDuration) * chartArea.width;
      const y = chartArea.y + chartArea.height / 2 + (index % 2 === 0 ? -30 : 30);
      
      // Barre d'événement
      ctx.fillStyle = colors[event.type] || '#6b7280';
      ctx.fillRect(startX, y - 5, Math.max(endX - startX, 3), 10);
      
      // Ligne de connexion
      ctx.strokeStyle = colors[event.type] || '#6b7280';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startX + (endX - startX) / 2, y);
      ctx.lineTo(startX + (endX - startX) / 2, chartArea.y + chartArea.height / 2);
      ctx.stroke();
      
      // Label de l'événement
      ctx.fillStyle = '#1f2937';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        event.titre.length > 20 ? event.titre.substring(0, 20) + '...' : event.titre,
        startX + (endX - startX) / 2,
        y + (index % 2 === 0 ? -10 : 25)
      );
    });
    
    // Dates de début et fin
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(startDate.toLocaleDateString(), chartArea.x, chartArea.y + chartArea.height + 30);
    ctx.textAlign = 'right';
    ctx.fillText(endDate.toLocaleDateString(), chartArea.x + chartArea.width, chartArea.y + chartArea.height + 30);
  };

  const getChartData = (events: PlanningEvent[]) => {
    switch (chartGroupBy) {
      case 'type':
        return getDataByType(events);
      case 'resource':
        return getDataByResource(events);
      case 'day':
        return getDataByDay(events);
      case 'week':
        return getDataByWeek(events);
      case 'month':
        return getDataByMonth(events);
      default:
        return getDataByType(events);
    }
  };

  const getDataByType = (events: PlanningEvent[]) => {
    const typeCount = events.reduce((acc, event) => {
      const type = event.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(typeCount).map(([type, count]) => ({
      label: type === 'chantier' ? 'Chantier' :
             type === 'maintenance' ? 'Maintenance' :
             type === 'conge' ? 'Congé' :
             type === 'formation' ? 'Formation' : type,
      value: count
    }));
  };

  const getDataByResource = (events: PlanningEvent[]) => {
    const resourceCount = events.reduce((acc, event) => {
      let resource = 'Non assigné';
      
      if (event.ouvrierId) {
        const ouvrier = ouvriers?.find(o => o.id === event.ouvrierId);
        resource = ouvrier ? `${ouvrier.prenom} ${ouvrier.nom}` : 'Ouvrier inconnu';
      } else if (event.materielId) {
        const mat = materiel?.find(m => m.id === event.materielId);
        resource = mat ? mat.nom : 'Matériel inconnu';
      } else if (event.chantierId) {
        const chantier = chantiers?.find(c => c.id === event.chantierId);
        resource = chantier ? chantier.nom : 'Chantier inconnu';
      }
      
      acc[resource] = (acc[resource] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(resourceCount).map(([resource, count]) => ({
      label: resource.length > 15 ? resource.substring(0, 15) + '...' : resource,
      value: count
    }));
  };

  const getDataByDay = (events: PlanningEvent[]) => {
    const dayCount = events.reduce((acc, event) => {
      const day = new Date(event.dateDebut).toLocaleDateString();
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(dayCount)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([day, count]) => ({
        label: day,
        value: count
      }));
  };

  const getDataByWeek = (events: PlanningEvent[]) => {
    const weekCount = events.reduce((acc, event) => {
      const date = new Date(event.dateDebut);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekLabel = `Semaine du ${weekStart.toLocaleDateString()}`;
      
      acc[weekLabel] = (acc[weekLabel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(weekCount).map(([week, count]) => ({
      label: week,
      value: count
    }));
  };

  const getDataByMonth = (events: PlanningEvent[]) => {
    const monthCount = events.reduce((acc, event) => {
      const date = new Date(event.dateDebut);
      const monthLabel = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
      
      acc[monthLabel] = (acc[monthLabel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(monthCount).map(([month, count]) => ({
      label: month,
      value: count
    }));
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
    // Simulation d'export Excel - en production, utiliser une bibliothèque comme SheetJS
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Format d'export</h4>
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
              <span>PDF - Document formaté avec statistiques</span>
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
              <Table className="w-5 h-5 mr-2 text-green-500" />
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
              <Table className="w-5 h-5 mr-2 text-blue-500" />
              <span>Excel - Feuille de calcul</span>
            </label>
          </div>
        </div>

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
            <p>• Format: {exportFormat.toUpperCase()}</p>
            <p>• Colonnes: Titre, Type, Date début, Heure début, Date fin, Heure fin, Durée, Chantier, Ouvrier, Matériel, Description</p>
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
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button variant="secondary" onClick={() => setIsExportModalOpen(false)}>
          Annuler
        </Button>
        <Button onClick={handleExport} disabled={getFilteredEventsForExport().length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </div>
    </div>
  );

  const ChartExportModal = () => {
    const filteredEvents = getFilteredEventsForChart();
    
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
            <p className="text-sm text-blue-800">
              Exportez le planning sous forme de graphique avec les filtres de votre choix
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de graphique</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as 'bar' | 'pie' | 'timeline')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bar">Graphique en barres</option>
              <option value="pie">Graphique en secteurs</option>
              <option value="timeline">Timeline</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grouper par</label>
            <select
              value={chartGroupBy}
              onChange={(e) => setChartGroupBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="type">Type d'événement</option>
              <option value="resource">Ressource</option>
              <option value="day">Par jour</option>
              <option value="week">Par semaine</option>
              <option value="month">Par mois</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
            <input
              type="date"
              value={chartDateStart}
              onChange={(e) => setChartDateStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
            <input
              type="date"
              value={chartDateEnd}
              onChange={(e) => setChartDateEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chantier</label>
            <select
              value={chartChantier}
              onChange={(e) => setChartChantier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les chantiers</option>
              {chantiers?.filter(c => c.statut === 'actif' || c.statut === 'planifie').map(chantier => (
                <option key={chantier.id} value={chantier.id}>{chantier.nom}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ouvrier</label>
            <select
              value={chartOuvrier}
              onChange={(e) => setChartOuvrier(e.target.value)}
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
              value={chartMateriel}
              onChange={(e) => setChartMateriel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tout le matériel</option>
              {materiel?.filter(m => m.statut === 'disponible' || m.statut === 'en_service').map(item => (
                <option key={item.id} value={item.id}>{item.nom}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Aperçu</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 font-medium">
                {chartType === 'bar' ? 'Barres' : 
                 chartType === 'pie' ? 'Secteurs' : 'Timeline'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Groupement:</span>
              <span className="ml-2 font-medium">
                {chartGroupBy === 'type' ? 'Type' :
                 chartGroupBy === 'resource' ? 'Ressource' :
                 chartGroupBy === 'day' ? 'Jour' :
                 chartGroupBy === 'week' ? 'Semaine' : 'Mois'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Période:</span>
              <span className="ml-2 font-medium">
                {chartDateStart && chartDateEnd 
                  ? `${new Date(chartDateStart).toLocaleDateString()} - ${new Date(chartDateEnd).toLocaleDateString()}`
                  : 'Toutes'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Événements:</span>
              <span className="ml-2 font-medium text-blue-600">{filteredEvents.length}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => setIsChartExportModalOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleChartExport}
            disabled={filteredEvents.length === 0}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Générer le graphique
          </Button>
        </div>
      </div>
    );
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
          <Button variant="secondary" onClick={() => setIsChartExportModalOpen(true)}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Exporter Graphique
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

      {/* Modal d'export graphique */}
      <Modal
        isOpen={isChartExportModalOpen}
        onClose={() => setIsChartExportModalOpen(false)}
        title="Export Graphique du Planning"
        size="lg"
      >
        <ChartExportModal />
      </Modal>
    </div>
  );
};