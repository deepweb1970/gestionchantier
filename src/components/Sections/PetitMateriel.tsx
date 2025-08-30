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
  QrCode, 
  Download, 
  Upload, 
  Calendar, 
  User, 
  Building2, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  Truck, 
  MapPin, 
  Euro, 
  Hash, 
  Weight, 
  Ruler, 
  Shield, 
  Store 
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
  const { data: petitMateriel, loading, error, refresh } = useRealtimeSupabase<PetitMateriel>({
    table: 'petit_materiel',
    fetchFunction: PetitMaterielService.getAll
  });
  
  const { data: prets, refresh: refreshPrets } = useRealtimeSupabase<PretPetitMateriel>({
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
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRetourModalOpen, setIsRetourModalOpen] = useState(false);
  const [editingMateriel, setEditingMateriel] = useState<PetitMateriel | null>(null);
  const [selectedMateriel, setSelectedMateriel] = useState<PetitMateriel | null>(null);
  const [selectedPret, setSelectedPret] = useState<PretPetitMateriel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [barcodeSearch, setBarcodeSearch] = useState('');

  const filteredMateriel = (petitMateriel || []).filter(item => {
    const matchesSearch = item.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.codeBarre.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.statut === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = item.quantiteDisponible <= item.seuilAlerte;
    } else if (stockFilter === 'out') {
      matchesStock = item.quantiteDisponible === 0;
    } else if (stockFilter === 'available') {
      matchesStock = item.quantiteDisponible > 0;
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesStock;
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
    setSelectedMateriel(item);
    setIsPretModalOpen(true);
  };

  const handleRetour = (pret: PretPetitMateriel) => {
    setSelectedPret(pret);
    setIsRetourModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce matériel ?')) {
      try {
        await PetitMaterielService.delete(id);
        refresh();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du matériel');
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
      
      refresh();
      setIsModalOpen(false);
      setEditingMateriel(null);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement du matériel');
    }
  };

  const handleSavePret = async (formData: FormData) => {
    if (!selectedMateriel) return;

    const pretData = {
      petitMaterielId: selectedMateriel.id,
      ouvrierId: formData.get('ouvrierId') as string,
      chantierId: formData.get('chantierId') as string || undefined,
      dateDebut: formData.get('dateDebut') as string,
      dateRetourPrevue: formData.get('dateRetourPrevue') as string,
      quantite: parseInt(formData.get('quantite') as string),
      statut: 'en_cours' as const,
      notes: formData.get('notes') as string || undefined,
      etatDepart: formData.get('etatDepart') as PretPetitMateriel['etatDepart']
    };

    try {
      await PretPetitMaterielService.create(pretData);
      refreshPrets();
      refresh();
      setIsPretModalOpen(false);
      setSelectedMateriel(null);
    } catch (error) {
      console.error('Erreur lors de la création du prêt:', error);
      alert('Erreur lors de la création du prêt');
    }
  };

  const handleSaveRetour = async (formData: FormData) => {
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
      refresh();
      setIsRetourModalOpen(false);
      setSelectedPret(null);
    } catch (error) {
      console.error('Erreur lors du retour:', error);
      alert('Erreur lors du retour du matériel');
    }
  };

  const searchByBarcode = async () => {
    if (!barcodeSearch.trim()) return;

    try {
      const item = await PetitMaterielService.getByBarcode(barcodeSearch);
      if (item) {
        setSelectedMateriel(item);
        setIsDetailModalOpen(true);
      } else {
        alert('Aucun matériel trouvé avec ce code-barres');
      }
    } catch (error) {
      console.error('Erreur lors de la recherche par code-barres:', error);
      alert('Erreur lors de la recherche');
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du matériel</label>
              <input
                name="nom"
                type="text"
                required
                defaultValue={editingMateriel?.nom || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Perceuse sans fil"
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
                placeholder="Ex: Outillage électroportatif"
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
                placeholder="Ex: Bosch"
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
                placeholder="Ex: GSR 18V-60 C"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
            <Hash className="w-5 h-5 mr-2" />
            Identification et traçabilité
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de série</label>
              <input
                name="numeroSerie"
                type="text"
                required
                defaultValue={editingMateriel?.numeroSerie || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ex: BSH001234567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code-barres</label>
              <div className="relative">
                <input
                  name="codeBarre"
                  type="text"
                  required
                  defaultValue={editingMateriel?.codeBarre || ''}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: 3165140123456"
                />
                <QrCode className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
            <Euro className="w-5 h-5 mr-2" />
            Informations commerciales
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Valeur unitaire (€)</label>
              <input
                name="valeur"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={editingMateriel?.valeur || 0}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ex: 299.99"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
              <input
                name="fournisseur"
                type="text"
                defaultValue={editingMateriel?.fournisseur || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ex: Leroy Merlin"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de garantie (fin)</label>
            <input
              name="garantie"
              type="date"
              defaultValue={editingMateriel?.garantie || ''}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Gestion des stocks
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantité en stock</label>
              <input
                name="quantiteStock"
                type="number"
                min="0"
                required
                defaultValue={editingMateriel?.quantiteStock || 1}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Localisation et caractéristiques
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
              <select
                name="localisation"
                required
                defaultValue={editingMateriel?.localisation || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="">Sélectionner une localisation</option>
                <option value="Dépôt principal">Dépôt principal</option>
                <option value="Atelier">Atelier</option>
                <option value="Véhicule">Véhicule</option>
                {chantiers?.filter(c => c.statut === 'actif').map(chantier => (
                  <option key={chantier.id} value={chantier.nom}>
                    {chantier.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                name="statut"
                defaultValue={editingMateriel?.statut || 'disponible'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="disponible">Disponible</option>
                <option value="prete">Prêté</option>
                <option value="maintenance">Maintenance</option>
                <option value="perdu">Perdu</option>
                <option value="hors_service">Hors service</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Poids (kg)</label>
              <div className="relative">
                <input
                  name="poids"
                  type="number"
                  min="0"
                  step="0.1"
                  defaultValue={editingMateriel?.poids || ''}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="Ex: 2.5"
                />
                <Weight className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
              <div className="relative">
                <input
                  name="dimensions"
                  type="text"
                  defaultValue={editingMateriel?.dimensions || ''}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="Ex: 25x15x8 cm"
                />
                <Ruler className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={editingMateriel?.description || ''}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder="Description détaillée du matériel..."
            />
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

  const PretForm = () => {
    if (!selectedMateriel) return null;

    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSavePret(new FormData(e.currentTarget));
      }}>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Matériel: {selectedMateriel.nom}</h3>
            <p className="text-sm text-blue-700">{selectedMateriel.marque} {selectedMateriel.modele}</p>
            <p className="text-sm text-blue-700">Quantité disponible: {selectedMateriel.quantiteDisponible}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ouvrier</label>
              <select
                name="ouvrierId"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un ouvrier</option>
                {ouvriers?.filter(o => o.statut === 'actif').map(ouvrier => (
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
                {chantiers?.filter(c => c.statut === 'actif' || c.statut === 'planifie').map(chantier => (
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
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de retour prévue</label>
              <input
                name="dateRetourPrevue"
                type="date"
                required
                defaultValue={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
              <input
                name="quantite"
                type="number"
                min="1"
                max={selectedMateriel.quantiteDisponible}
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
              defaultValue="bon"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="neuf">Neuf</option>
              <option value="bon">Bon état</option>
              <option value="moyen">État moyen</option>
              <option value="use">Usé</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notes sur le prêt..."
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
  };

  const RetourForm = () => {
    if (!selectedPret) return null;

    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSaveRetour(new FormData(e.currentTarget));
      }}>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Retour de matériel</h3>
            <p className="text-sm text-blue-700">Matériel: {selectedPret.petitMaterielNom}</p>
            <p className="text-sm text-blue-700">Ouvrier: {selectedPret.ouvrierNom}</p>
            <p className="text-sm text-blue-700">Quantité: {selectedPret.quantite}</p>
          </div>
          
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
              <option value="">Sélectionner l'état</option>
              <option value="neuf">Neuf</option>
              <option value="bon">Bon état</option>
              <option value="moyen">État moyen</option>
              <option value="use">Usé</option>
              <option value="endommage">Endommagé</option>
              <option value="perdu">Perdu</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes sur le retour</label>
            <textarea
              name="notes"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Observations sur l'état du matériel..."
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
  };

  const DetailModal = () => {
    if (!selectedMateriel) return null;

    const pretsMateriel = (prets || []).filter(p => p.petitMaterielId === selectedMateriel.id);
    const pretsActifs = pretsMateriel.filter(p => p.statut === 'en_cours');
    const pretsEnRetard = pretsMateriel.filter(p => p.statut === 'retard');

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{selectedMateriel.nom}</h2>
              <p className="mt-1 text-blue-100">{selectedMateriel.marque} {selectedMateriel.modele}</p>
              <div className="mt-3 flex items-center">
                <StatusBadge status={selectedMateriel.statut} type="petit_materiel" />
                <span className="ml-3 text-sm bg-white/20 px-2 py-1 rounded">
                  {selectedMateriel.quantiteDisponible}/{selectedMateriel.quantiteStock} disponible
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{selectedMateriel.valeur.toLocaleString()} €</div>
              <div className="text-sm text-blue-100">Valeur unitaire</div>
            </div>
          </div>
        </div>

        {/* Informations générales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <Hash className="w-5 h-5 mr-2 text-blue-500" />
              Identification
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Numéro de série:</span>
                <span className="font-medium">{selectedMateriel.numeroSerie}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Code-barres:</span>
                <span className="font-medium font-mono">{selectedMateriel.codeBarre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{selectedMateriel.type}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <Store className="w-5 h-5 mr-2 text-green-500" />
              Stock et localisation
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Stock total:</span>
                <span className="font-medium">{selectedMateriel.quantiteStock}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Disponible:</span>
                <span className={`font-medium ${
                  selectedMateriel.quantiteDisponible <= selectedMateriel.seuilAlerte 
                    ? 'text-red-600' 
                    : 'text-green-600'
                }`}>
                  {selectedMateriel.quantiteDisponible}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Seuil d'alerte:</span>
                <span className="font-medium">{selectedMateriel.seuilAlerte}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Localisation:</span>
                <span className="font-medium">{selectedMateriel.localisation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Caractéristiques */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center">
            <Ruler className="w-5 h-5 mr-2 text-purple-500" />
            Caractéristiques
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Date d'achat</p>
              <p className="font-medium">{new Date(selectedMateriel.dateAchat).toLocaleDateString()}</p>
            </div>
            {selectedMateriel.poids && (
              <div>
                <p className="text-sm text-gray-600">Poids</p>
                <p className="font-medium">{selectedMateriel.poids} kg</p>
              </div>
            )}
            {selectedMateriel.dimensions && (
              <div>
                <p className="text-sm text-gray-600">Dimensions</p>
                <p className="font-medium">{selectedMateriel.dimensions}</p>
              </div>
            )}
            {selectedMateriel.garantie && (
              <div>
                <p className="text-sm text-gray-600">Garantie jusqu'au</p>
                <p className="font-medium">{new Date(selectedMateriel.garantie).toLocaleDateString()}</p>
              </div>
            )}
            {selectedMateriel.fournisseur && (
              <div>
                <p className="text-sm text-gray-600">Fournisseur</p>
                <p className="font-medium">{selectedMateriel.fournisseur}</p>
              </div>
            )}
          </div>
          {selectedMateriel.description && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Description</p>
              <p className="font-medium">{selectedMateriel.description}</p>
            </div>
          )}
        </div>

        {/* Prêts actifs */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center">
            <ArrowRight className="w-5 h-5 mr-2 text-orange-500" />
            Prêts en cours ({pretsActifs.length})
          </h3>
          {pretsActifs.length > 0 ? (
            <div className="space-y-3">
              {pretsActifs.map(pret => (
                <div key={pret.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{pret.ouvrierNom}</p>
                      <p className="text-sm text-gray-600">{pret.chantierNom || 'Aucun chantier'}</p>
                      <p className="text-sm text-gray-600">
                        Du {new Date(pret.dateDebut).toLocaleDateString()} 
                        au {new Date(pret.dateRetourPrevue).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={pret.statut} type="pret" />
                      <p className="text-sm font-medium mt-1">Qté: {pret.quantite}</p>
                      <Button 
                        size="sm" 
                        onClick={() => handleRetour(pret)}
                        className="mt-2"
                      >
                        <ArrowLeft className="w-3 h-3 mr-1" />
                        Retour
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Aucun prêt en cours</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          {selectedMateriel.quantiteDisponible > 0 && (
            <Button onClick={() => handlePret(selectedMateriel)}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Créer un prêt
            </Button>
          )}
          <Button variant="secondary" onClick={() => handleEdit(selectedMateriel)}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button variant="danger" onClick={() => handleDelete(selectedMateriel.id)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </div>
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
              <ArrowRight className="w-6 h-6 text-orange-600" />
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
              <Euro className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recherche par code-barres */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <QrCode className="w-5 h-5 mr-2 text-blue-500" />
          Recherche rapide par code-barres
        </h3>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <QrCode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Scanner ou saisir le code-barres..."
              value={barcodeSearch}
              onChange={(e) => setBarcodeSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button onClick={searchByBarcode} disabled={!barcodeSearch.trim()}>
            <Search className="w-4 h-4 mr-2" />
            Rechercher
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des données...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>Erreur lors du chargement des données</p>
            <p className="text-sm">{error.message}</p>
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
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les stocks</option>
                    <option value="available">En stock</option>
                    <option value="low">Stock faible</option>
                    <option value="out">Rupture</option>
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
                      Identification
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
                      Valeur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMateriel.map((item) => {
                    const isLowStock = item.quantiteDisponible <= item.seuilAlerte;
                    const isOutOfStock = item.quantiteDisponible === 0;
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                <Package className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{item.nom}</div>
                              <div className="text-sm text-gray-500">{item.marque} {item.modele}</div>
                              <div className="text-xs text-gray-500">{item.type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">S/N: {item.numeroSerie}</div>
                            <div className="text-gray-500 font-mono">{item.codeBarre}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className={`font-medium ${
                              isOutOfStock ? 'text-red-600' : 
                              isLowStock ? 'text-orange-600' : 
                              'text-green-600'
                            }`}>
                              {item.quantiteDisponible}/{item.quantiteStock}
                            </div>
                            <div className="text-gray-500">Seuil: {item.seuilAlerte}</div>
                            {isLowStock && (
                              <div className="flex items-center mt-1">
                                <AlertTriangle className="w-3 h-3 text-red-500 mr-1" />
                                <span className="text-xs text-red-600">Stock faible</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={item.statut} type="petit_materiel" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900">{item.localisation}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{item.valeur.toLocaleString()} €</div>
                            <div className="text-gray-500">
                              Total: {(item.valeur * item.quantiteStock).toLocaleString()} €
                            </div>
                          </div>
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
                            {item.quantiteDisponible > 0 && (
                              <button
                                onClick={() => handlePret(item)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Créer un prêt"
                              >
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            )}
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
                    );
                  })}
                </tbody>
                {filteredMateriel.length === 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-gray-500 bg-gray-50">
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

      {/* Prêts en cours */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Prêts en cours</h3>
        </div>
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
                  Période
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{pret.ouvrierNom}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{pret.chantierNom || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-gray-900">
                        {new Date(pret.dateDebut).toLocaleDateString()}
                      </div>
                      <div className="text-gray-500">
                        → {new Date(pret.dateRetourPrevue).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={pret.statut} type="pret" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button 
                      size="sm" 
                      onClick={() => handleRetour(pret)}
                    >
                      <ArrowLeft className="w-3 h-3 mr-1" />
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
        title={`Créer un prêt - ${selectedMateriel?.nom}`}
        size="lg"
      >
        <PretForm />
      </Modal>

      {/* Modal de détails */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMateriel(null);
        }}
        title={`Détails - ${selectedMateriel?.nom}`}
        size="xl"
      >
        <DetailModal />
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
    </div>
  );
};