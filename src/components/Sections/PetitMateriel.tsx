import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Search, 
  Filter, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  Building2, 
  Calendar, 
  Download, 
  QrCode,
  Scan
} from 'lucide-react';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { PetitMaterielService, PretPetitMaterielService } from '../../services/petitMaterielService';
import { ouvrierService } from '../../services/ouvrierService';
import { chantierService } from '../../services/chantierService';
import { PetitMateriel, PretPetitMateriel, Ouvrier, Chantier } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { StatusBadge } from '../Common/StatusBadge';

export const PetitMaterielSection: React.FC = () => {
  const { data: petitMateriel, loading: materielLoading, error: materielError, refresh: refreshMateriel } = useRealtimeSupabase<PetitMateriel>({
    table: 'petit_materiel',
    fetchFunction: PetitMaterielService.getAll
  });
  
  const { data: prets, loading: pretsLoading, error: pretsError, refresh: refreshPrets } = useRealtimeSupabase<PretPetitMateriel>({
    table: 'prets_petit_materiel',
    fetchFunction: PretPetitMaterielService.getAll
  });
  
  const { data: ouvriers } = useRealtimeSupabase<Ouvrier>({
    table: 'ouvriers',
    fetchFunction: ouvrierService.getAll
  });
  
  const { data: chantiers } = useRealtimeSupabase<Chantier>({
    table: 'chantiers',
    fetchFunction: chantierService.getAll
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPretModalOpen, setIsPretModalOpen] = useState(false);
  const [isRetourModalOpen, setIsRetourModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingMateriel, setEditingMateriel] = useState<PetitMateriel | null>(null);
  const [selectedMateriel, setSelectedMateriel] = useState<PetitMateriel | null>(null);
  const [selectedPret, setSelectedPret] = useState<PretPetitMateriel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [stockUpdateModalOpen, setStockUpdateModalOpen] = useState(false);
  const [selectedMaterielForStock, setSelectedMaterielForStock] = useState<PetitMateriel | null>(null);

  // Fonction utilitaire pour formater les dates de manière sécurisée
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Date non définie';
    
    try {
      const date = new Date(dateString);
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      return date.toLocaleDateString('fr-FR');
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return 'Date invalide';
    }
  };

  // Fonction utilitaire pour vérifier si un prêt est en retard
  const isLoanOverdue = (dateRetourPrevue: string | null | undefined): boolean => {
    if (!dateRetourPrevue) return false;
    
    try {
      const returnDate = new Date(dateRetourPrevue);
      if (isNaN(returnDate.getTime())) return false;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      returnDate.setHours(0, 0, 0, 0);
      
      return returnDate < today;
    } catch (error) {
      console.error('Erreur lors de la vérification de retard:', error);
      return false;
    }
  };

  const filteredMateriel = (petitMateriel || []).filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = item.nom.toLowerCase().includes(searchLower) ||
                         item.type.toLowerCase().includes(searchLower) ||
                         item.marque.toLowerCase().includes(searchLower) ||
                         item.modele.toLowerCase().includes(searchLower) ||
                         item.codeBarre.toLowerCase().includes(searchLower) ||
                         item.numeroSerie.toLowerCase().includes(searchLower) ||
                         item.localisation.toLowerCase().includes(searchLower) ||
                         (item.description && item.description.toLowerCase().includes(searchLower)) ||
                         (item.fournisseur && item.fournisseur.toLowerCase().includes(searchLower));
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || item.statut === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleEdit = (item: PetitMateriel) => {
    setEditingMateriel(item);
    setIsModalOpen(true);
  };

  const handleViewDetails = (item: PetitMateriel) => {
    setSelectedMateriel(item);
    setIsDetailModalOpen(true);
  };

  const handlePret = (item: PetitMateriel) => {
    if (item.quantiteDisponible === 0) {
      alert('Aucune quantité disponible pour ce matériel');
      return;
    }
    setSelectedMateriel(item);
    setIsPretModalOpen(true);
  };

  const handleStockUpdate = (item: PetitMateriel) => {
    setSelectedMaterielForStock(item);
    setStockUpdateModalOpen(true);
  };

  const handleRetour = (pret: PretPetitMateriel) => {
    setSelectedPret(pret);
    setIsRetourModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      try {
        await PetitMaterielService.delete(id);
        refreshMateriel();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleSave = async (formData: FormData) => {
    const materielData = {
      nom: formData.get('nom') as string,
      type: formData.get('type') as string,
      marque: formData.get('marque') as string,
      modele: formData.get('modele') as string,
      numeroSerie: formData.get('numeroSerie') as string,
      codeBarre: formData.get('codeBarre') as string,
      dateAchat: formData.get('dateAchat') as string,
      valeur: parseFloat(formData.get('valeur') as string),
      statut: formData.get('statut') as PetitMateriel['statut'],
      localisation: formData.get('localisation') as string,
      description: formData.get('description') as string || undefined,
      quantiteStock: parseInt(formData.get('quantiteStock') as string),
      quantiteDisponible: parseInt(formData.get('quantiteDisponible') as string),
      seuilAlerte: parseInt(formData.get('seuilAlerte') as string),
      poids: parseFloat(formData.get('poids') as string) || undefined,
      dimensions: formData.get('dimensions') as string || undefined,
      garantie: formData.get('garantie') as string || undefined,
      fournisseur: formData.get('fournisseur') as string || undefined
    };

    try {
      if (editingMateriel) {
        await PetitMaterielService.update(editingMateriel.id, materielData);
      } else {
        await PetitMaterielService.create(materielData);
      }
      
      refreshMateriel();
      setIsModalOpen(false);
      setEditingMateriel(null);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleSavePret = async (formData: FormData) => {
    if (!selectedMateriel) return;

    const pretData = {
      petitMaterielId: (formData.get('petitMaterielId') as string).trim(),
      ouvrierId: (formData.get('ouvrierId') as string).trim(),
      chantierId: (formData.get('chantierId') as string || '').trim() || undefined,
      dateDebut: (formData.get('dateDebut') as string).trim(),
      dateRetourPrevue: (formData.get('dateRetourPrevue') as string).trim(),
      quantite: parseInt((formData.get('quantite') as string).trim()),
      statut: 'en_cours' as const,
      notes: (formData.get('notes') as string || '').trim() || undefined,
      etatDepart: (formData.get('etatDepart') as string).trim() as PretPetitMateriel['etatDepart']
    };

    // Validation des dates
    const dateDebut = new Date(pretData.dateDebut);
    const dateRetourPrevue = new Date(pretData.dateRetourPrevue);
    
    if (isNaN(dateDebut.getTime())) {
      alert('Date de début invalide');
      return;
    }
    
    if (isNaN(dateRetourPrevue.getTime())) {
      alert('Date de retour prévue invalide');
      return;
    }
    
    if (dateRetourPrevue <= dateDebut) {
      alert('La date de retour prévue doit être postérieure à la date de début');
      return;
    }

    try {
      await PretPetitMaterielService.create(pretData);
      refreshPrets();
      refreshMateriel(); // Pour mettre à jour les quantités
      setIsPretModalOpen(false);
      setSelectedMateriel(null);
    } catch (error) {
      console.error('Erreur lors de la création du prêt:', error);
      alert('Erreur lors de la création du prêt');
    }
  };

  const handleRetourConfirm = async (formData: FormData) => {
    if (!selectedPret) return;

    const retourData = {
      dateRetourEffective: formData.get('dateRetourEffective') as string,
      etatRetour: formData.get('etatRetour') as PretPetitMateriel['etatRetour'],
      statut: 'termine' as const,
      notes: formData.get('notes') as string || undefined
    };

    try {
      await PretPetitMaterielService.update(selectedPret.id, retourData);
      refreshPrets();
      refreshMateriel(); // Pour mettre à jour les quantités
      setIsRetourModalOpen(false);
      setSelectedPret(null);
    } catch (error) {
      console.error('Erreur lors du retour:', error);
      alert('Erreur lors du retour');
    }
  };

  const handleBarcodeSearch = async () => {
    if (!barcodeSearch.trim()) {
      alert('Veuillez saisir un code-barres ou un nom');
      return;
    }

    try {
      // Recherche d'abord par code-barres exact
      let item = await PetitMaterielService.getByBarcode(barcodeSearch.trim());
      
      // Si pas trouvé par code-barres, rechercher par nom
      if (!item) {
        const allItems = await PetitMaterielService.getAll();
        const searchLower = barcodeSearch.toLowerCase().trim();
        item = allItems.find(i => 
          i.nom.toLowerCase().includes(searchLower) ||
          i.marque.toLowerCase().includes(searchLower) ||
          i.modele.toLowerCase().includes(searchLower) ||
          i.numeroSerie.toLowerCase().includes(searchLower)
        ) || null;
      }
      
      if (item) {
        setSelectedMateriel(item);
        setIsDetailModalOpen(true);
        setBarcodeSearch(''); // Clear search after found
      } else {
        alert('Aucun matériel trouvé avec ce code-barres ou ce nom');
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      alert('Erreur lors de la recherche');
    }
  };

  const handleSaveStockUpdate = async (formData: FormData) => {
    if (!selectedMaterielForStock) return;

    const newQuantiteStock = parseInt(formData.get('quantiteStock') as string);
    const newQuantiteDisponible = parseInt(formData.get('quantiteDisponible') as string);
    const newSeuilAlerte = parseInt(formData.get('seuilAlerte') as string);
    const newLocalisation = formData.get('localisation') as string;

    try {
      await PetitMaterielService.update(selectedMaterielForStock.id, {
        quantiteStock: newQuantiteStock,
        quantiteDisponible: newQuantiteDisponible,
        seuilAlerte: newSeuilAlerte,
        localisation: newLocalisation
      });
      
      refreshMateriel();
      setStockUpdateModalOpen(false);
      setSelectedMaterielForStock(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error);
      alert('Erreur lors de la mise à jour du stock');
    }
  };

  // Get unique types for filter
  const uniqueTypes = React.useMemo(() => {
    const types = new Set<string>();
    (petitMateriel || []).forEach(item => {
      types.add(item.type);
    });
    return Array.from(types);
  }, [petitMateriel]);

  // Calculate statistics
  const getStatistics = () => {
    const total = (petitMateriel || []).length;
    const disponible = (petitMateriel || []).filter(item => item.statut === 'disponible').length;
    const prete = (petitMateriel || []).filter(item => item.statut === 'prete').length;
    const lowStock = (petitMateriel || []).filter(item => item.quantiteDisponible <= item.seuilAlerte).length;
    const totalValue = (petitMateriel || []).reduce((sum, item) => sum + (item.valeur * item.quantiteStock), 0);
    
    return { total, disponible, prete, lowStock, totalValue };
  };

  const stats = getStatistics();

  const MaterielForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSave(new FormData(e.currentTarget));
    }}>
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Informations générales
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                name="nom"
                type="text"
                required
                defaultValue={editingMateriel?.nom || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <input
                name="type"
                type="text"
                required
                defaultValue={editingMateriel?.type || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
              <input
                name="marque"
                type="text"
                required
                defaultValue={editingMateriel?.marque || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
              <input
                name="modele"
                type="text"
                required
                defaultValue={editingMateriel?.modele || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de série</label>
              <input
                name="numeroSerie"
                type="text"
                required
                defaultValue={editingMateriel?.numeroSerie || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code-barres</label>
              <input
                name="codeBarre"
                type="text"
                required
                defaultValue={editingMateriel?.codeBarre || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-green-800 mb-4">Stock et localisation</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantité en stock</label>
              <input
                name="quantiteStock"
                type="number"
                min="0"
                required
                defaultValue={editingMateriel?.quantiteStock || 1}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantité disponible</label>
              <input
                name="quantiteDisponible"
                type="number"
                min="0"
                required
                defaultValue={editingMateriel?.quantiteDisponible || 1}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seuil d'alerte</label>
              <input
                name="seuilAlerte"
                type="number"
                min="0"
                required
                defaultValue={editingMateriel?.seuilAlerte || 1}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
              <input
                name="localisation"
                type="text"
                required
                defaultValue={editingMateriel?.localisation || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                name="statut"
                defaultValue={editingMateriel?.statut || 'disponible'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="disponible">Disponible</option>
                <option value="prete">Prêté</option>
                <option value="maintenance">Maintenance</option>
                <option value="perdu">Perdu</option>
                <option value="hors_service">Hors service</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-purple-800 mb-4">Informations complémentaires</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'achat</label>
              <input
                name="dateAchat"
                type="date"
                required
                defaultValue={editingMateriel?.dateAchat || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valeur (€)</label>
              <input
                name="valeur"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={editingMateriel?.valeur || 0}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Poids (kg)</label>
              <input
                name="poids"
                type="number"
                min="0"
                step="0.1"
                defaultValue={editingMateriel?.poids || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
              <input
                name="dimensions"
                type="text"
                defaultValue={editingMateriel?.dimensions || ''}
                placeholder="L x l x h"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Garantie (date)</label>
              <input
                name="garantie"
                type="date"
                defaultValue={editingMateriel?.garantie || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
              <input
                name="fournisseur"
                type="text"
                defaultValue={editingMateriel?.fournisseur || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                rows={2}
                defaultValue={editingMateriel?.description || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
          Annuler
        </Button>
        <Button type="submit">
          {editingMateriel ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );

  const StockUpdateForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSaveStockUpdate(new FormData(e.currentTarget));
    }}>
      <div className="space-y-4">
        {selectedMaterielForStock && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">
              Mise à jour du stock: {selectedMaterielForStock.nom}
            </h3>
            <p className="text-sm text-blue-700">
              {selectedMaterielForStock.marque} {selectedMaterielForStock.modele}
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantité en stock</label>
            <input
              name="quantiteStock"
              type="number"
              min="0"
              required
              defaultValue={selectedMaterielForStock?.quantiteStock || 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantité disponible</label>
            <input
              name="quantiteDisponible"
              type="number"
              min="0"
              required
              defaultValue={selectedMaterielForStock?.quantiteDisponible || 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seuil d'alerte</label>
            <input
              name="seuilAlerte"
              type="number"
              min="0"
              required
              defaultValue={selectedMaterielForStock?.seuilAlerte || 1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
          <input
            name="localisation"
            type="text"
            required
            defaultValue={selectedMaterielForStock?.localisation || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={() => setStockUpdateModalOpen(false)}>
          Annuler
        </Button>
        <Button type="submit">
          Mettre à jour le stock
        </Button>
      </div>
    </form>
  );

  const PretForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSavePret(new FormData(e.currentTarget));
    }}>
      <div className="space-y-4">
        {selectedMateriel && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Matériel: {selectedMateriel.nom}</h3>
            <p className="text-sm text-blue-700">Quantité disponible: {selectedMateriel.quantiteDisponible}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ouvrier</label>
            <select
              name="ouvrierId"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un ouvrier</option>
              {(ouvriers || [])
                .filter(o => o.statut === 'actif')
                .map(ouvrier => (
                  <option key={ouvrier.id} value={ouvrier.id}>
                    {ouvrier.prenom} {ouvrier.nom} - {ouvrier.qualification}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chantier (optionnel)</label>
            <select
              name="chantierId"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Aucun chantier</option>
              {(chantiers || [])
                .filter(c => c.statut === 'actif' || c.statut === 'planifie')
                .map(chantier => (
                  <option key={chantier.id} value={chantier.id}>
                    {chantier.nom}
                  </option>
                ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
            <input
              name="dateDebut"
              type="date"
              required
              defaultValue={(() => {
                const today = new Date();
                return today.toISOString().split('T')[0];
              })()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de retour prévue</label>
            <input
              name="dateRetourPrevue"
              type="date"
              required
              defaultValue={(() => {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                return nextWeek.toISOString().split('T')[0];
              })()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
            <input
              name="quantite"
              type="number"
              min="1"
              max={selectedMateriel?.quantiteDisponible || 1}
              required
              defaultValue="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">État au départ</label>
          <select
            name="etatDepart"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="bon">Bon état</option>
            <option value="moyen">État moyen</option>
            <option value="use">Usé</option>
            <option value="neuf">Neuf</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={() => setIsPretModalOpen(false)}>
          Annuler
        </Button>
        <Button type="submit">
          Créer le prêt
        </Button>
      </div>
    </form>
  );

  const RetourForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleRetourConfirm(new FormData(e.currentTarget));
    }}>
      <div className="space-y-4">
        {selectedPret && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">Retour de matériel</h3>
            <p className="text-sm text-gray-600">
              {selectedPret.petitMaterielNom} - Quantité: {selectedPret.quantite}
            </p>
            <p className="text-sm text-gray-600">
              Prêté à: {selectedPret.ouvrierNom}
            </p>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date de retour effective</label>
          <input
            name="dateRetourEffective"
            type="date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">État au retour</label>
          <select
            name="etatRetour"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="bon">Bon état</option>
            <option value="moyen">État moyen</option>
            <option value="use">Usé</option>
            <option value="endommage">Endommagé</option>
            <option value="perdu">Perdu</option>
            <option value="neuf">Neuf</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes de retour</label>
          <textarea
            name="notes"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={() => setIsRetourModalOpen(false)}>
          Annuler
        </Button>
        <Button type="submit">
          Confirmer le retour
        </Button>
      </div>
    </form>
  );

  const DetailModal = () => {
    if (!selectedMateriel) return null;

    const pretsActifs = (prets || []).filter(p => 
      p.petitMaterielId === selectedMateriel.id && p.statut === 'en_cours'
    );

    return (
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">{selectedMateriel.nom}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-medium">{selectedMateriel.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Marque/Modèle</p>
              <p className="font-medium">{selectedMateriel.marque} {selectedMateriel.modele}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Code-barres</p>
              <p className="font-mono">{selectedMateriel.codeBarre}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Localisation</p>
              <p className="font-medium">{selectedMateriel.localisation}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-2">Stock</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">{selectedMateriel.quantiteStock}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Disponible:</span>
                <span className="font-medium text-green-600">{selectedMateriel.quantiteDisponible}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Seuil alerte:</span>
                <span className="font-medium text-orange-600">{selectedMateriel.seuilAlerte}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-2">Valeur</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Unitaire:</span>
                <span className="font-medium">{selectedMateriel.valeur.toLocaleString()} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total stock:</span>
                <span className="font-medium text-blue-600">
                  {(selectedMateriel.valeur * selectedMateriel.quantiteStock).toLocaleString()} €
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-2">Statut</h4>
            <StatusBadge status={selectedMateriel.statut} type="petit_materiel" />
            {selectedMateriel.quantiteDisponible <= selectedMateriel.seuilAlerte && (
              <div className="mt-2 flex items-center text-orange-600">
                <AlertTriangle className="w-4 h-4 mr-1" />
                <span className="text-sm">Stock faible</span>
              </div>
            )}
          </div>
        </div>

        {pretsActifs.length > 0 && (
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-3">Prêts en cours</h4>
            <div className="space-y-2">
              {pretsActifs.map(pret => {
                const isOverdue = isLoanOverdue(pret.dateRetourPrevue) && pret.statut === 'en_cours';
                return (
                  <div key={pret.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{pret.ouvrierNom}</p>
                      <p className="text-sm text-gray-600">
                        Retour prévu: {formatDate(pret.dateRetourPrevue)}
                      </p>
                      {isOverdue && (
                        <div className="text-xs text-red-600 font-medium mt-1 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          En retard
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Qté: {pret.quantite}</p>
                      <Button size="sm" onClick={() => handleRetour(pret)}>
                        Retour
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion du Petit Matériel</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Matériel
          </Button>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Recherche par code-barres */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <QrCode className="w-5 h-5 mr-2 text-blue-500" />
          Recherche par code-barres ou nom
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Scanner le code-barres ou saisir le nom du matériel..."
            value={barcodeSearch}
            onChange={(e) => setBarcodeSearch(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleBarcodeSearch();
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={handleBarcodeSearch} disabled={!barcodeSearch.trim()}>
            <Scan className="w-4 h-4 mr-2" />
            Rechercher
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Articles</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Disponibles</p>
              <p className="text-2xl font-bold text-green-600">{stats.disponible}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Prêtés</p>
              <p className="text-2xl font-bold text-orange-600">{stats.prete}</p>
            </div>
            <div className="p-3 rounded-full bg-orange-100">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Faible</p>
              <p className="text-2xl font-bold text-red-600">{stats.lowStock}</p>
            </div>
            <div className="p-3 rounded-full bg-red-100">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valeur Totale</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalValue.toLocaleString()} €</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        {materielLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des données...</p>
          </div>
        ) : materielError ? (
          <div className="text-center py-8 text-red-500">
            <p>Erreur lors du chargement des données</p>
            <p className="text-sm">{materielError.message}</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher du matériel..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les types</option>
                    {uniqueTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="disponible">Disponible</option>
                    <option value="prete">Prêté</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="perdu">Perdu</option>
                    <option value="hors_service">Hors service</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Matériel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code-barres
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localisation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMateriel.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                              <Package className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{item.nom}</div>
                            <div className="text-sm text-gray-500">{item.marque} {item.modele}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">{item.codeBarre}</div>
                        <div className="text-sm text-gray-500">{item.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="flex items-center">
                            <span className="text-green-600 font-medium">{item.quantiteDisponible}</span>
                            <span className="text-gray-500 mx-1">/</span>
                            <span className="text-gray-600">{item.quantiteStock}</span>
                          </div>
                          {item.quantiteDisponible <= item.seuilAlerte && (
                            <div className="flex items-center text-orange-600 mt-1">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              <span className="text-xs">Stock faible</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={item.statut} type="petit_materiel" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.localisation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(item)}
                            className="text-green-600 hover:text-green-900"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePret(item)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Créer un prêt"
                            disabled={item.quantiteDisponible === 0}
                          >
                            <User className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStockUpdate(item)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Mettre à jour le stock"
                          >
                            <Package className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {filteredMateriel.length === 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500 bg-gray-50">
                        Aucun matériel trouvé
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}
      </div>

      {/* Prêts actifs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Prêts en cours</h3>
        </div>
        {pretsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des prêts...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matériel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ouvrier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chantier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(prets || []).filter(p => p.statut === 'en_cours' || p.statut === 'retard').map((pret) => (
                  <tr key={pret.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{pret.petitMaterielNom}</div>
                      <div className="text-sm text-gray-500">Qté: {pret.quantite}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pret.ouvrierNom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pret.chantierNom || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Début: {formatDate(pret.dateDebut)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Retour prévu: {formatDate(pret.dateRetourPrevue)}
                      </div>
                      {pret.dateRetourPrevue && new Date(pret.dateRetourPrevue) < new Date() && pret.statut === 'en_cours' && (
                        <div className="flex items-center text-red-600 mt-1">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          <span className="text-xs">En retard</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={pret.statut} type="pret" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button size="sm" onClick={() => handleRetour(pret)}>
                        Retour
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {(prets || []).filter(p => p.statut === 'en_cours' || p.statut === 'retard').length === 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500 bg-gray-50">
                      Aucun prêt en cours
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Modal de création/modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMateriel(null);
        }}
        title={editingMateriel ? 'Modifier le matériel' : 'Nouveau matériel'}
        size="xl"
      >
        <MaterielForm />
      </Modal>

      {/* Modal de prêt */}
      <Modal
        isOpen={isPretModalOpen}
        onClose={() => {
          setIsPretModalOpen(false);
          setSelectedMateriel(null);
        }}
        title="Créer un prêt"
        size="lg"
      >
        <PretForm />
      </Modal>

      {/* Modal de retour */}
      <Modal
        isOpen={isRetourModalOpen}
        onClose={() => {
          setIsRetourModalOpen(false);
          setSelectedPret(null);
        }}
        title="Retour de matériel"
        size="md"
      >
        <RetourForm />
      </Modal>

      {/* Modal de mise à jour du stock */}
      <Modal
        isOpen={stockUpdateModalOpen}
        onClose={() => {
          setStockUpdateModalOpen(false);
          setSelectedMaterielForStock(null);
        }}
        title="Mise à jour du stock"
        size="md"
      >
        <StockUpdateForm />
      </Modal>

      {/* Modal de détails */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMateriel(null);
        }}
        title={`Détails - ${selectedMateriel?.nom}`}
        size="lg"
      >
        <DetailModal />
      </Modal>
    </div>
  );
};