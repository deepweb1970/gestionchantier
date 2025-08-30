import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Download, 
  Search, 
  Filter, 
  Eye, 
  QrCode, 
  Scan,
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  Building2, 
  Calendar, 
  ArrowRight,
  ArrowLeft,
  Truck,
  MapPin,
  Euro,
  Hash,
  Barcode,
  Camera,
  FileText,
  TrendingDown,
  TrendingUp,
  Percent,
  Archive,
  RotateCcw
} from 'lucide-react';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { PetitMaterielService, PretPetitMaterielService } from '../../services/petitMaterielService';
import { ouvrierService } from '../../services/ouvrierService';
import { chantierService } from '../../services/chantierService';
import { PetitMateriel, PretPetitMateriel, Ouvrier, Chantier } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { StatusBadge } from '../Common/StatusBadge';
import type { PetitMateriel as PetitMaterielType, PretPetitMateriel as PretPetitMaterielType, Ouvrier as OuvrierType, Chantier as ChantierType } from '../../types';

export const PetitMaterielManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPretModalOpen, setIsPretModalOpen] = useState(false);
  const [isRetourModalOpen, setIsRetourModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [editingMateriel, setEditingMateriel] = useState<PetitMateriel | null>(null);
  const [selectedMateriel, setSelectedMateriel] = useState<PetitMateriel | null>(null);
  const [selectedPret, setSelectedPret] = useState<PretPetitMateriel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('materiel');
  const [scannedBarcode, setScannedBarcode] = useState('');

  const generateBarcode = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 5);
  };

  const handleEdit = (materiel: PetitMateriel) => {
    setEditingMateriel(materiel);
    setIsModalOpen(true);
  };

  const handleViewDetails = (materiel: PetitMateriel) => {
    setSelectedMateriel(materiel);
    setIsDetailModalOpen(true);
  };

  const handlePret = (materiel: PetitMateriel) => {
    setSelectedMateriel(materiel);
    setIsPretModalOpen(true);
  };

  const handleRetour = (pret: PretPetitMateriel) => {
    setSelectedPret(pret);
    setIsRetourModalOpen(true);
  };

  const scanBarcode = async () => {
    const foundMateriel = petitMateriel?.find(m => m.codeBarre === scannedBarcode);
    if (foundMateriel) {
      setSelectedMateriel(foundMateriel);
      setIsDetailModalOpen(true);
      setIsBarcodeModalOpen(false);
    } else {
      alert('Aucun matériel trouvé avec ce code-barres');
    }
  };

  const exportToPDFReport = () => {
    const data = filteredMateriel.map(item => ({
      'Nom': item.nom,
      'Type': item.type,
      'Code-barres': item.codeBarre,
      'Statut': item.statut,
    }));

    const stats = {
      'Total articles': petitMateriel?.length.toString() || '0',
      'Articles disponibles': petitMateriel?.filter(m => m.statut === 'disponible').length.toString() || '0',
      'Prêts en cours': prets?.filter(p => p.statut === 'en_cours').length.toString() || '0',
      'Articles en alerte': petitMateriel?.filter(m => m.quantiteDisponible <= m.seuilAlerte).length.toString() || '0'
    };

    exportToPDF({
      title: 'Inventaire Petit Matériel',
      columns: [
        { header: 'Nom', dataKey: 'Nom', width: 40 },
        { header: 'Type', dataKey: 'Type', width: 30 },
        { header: 'Code-barres', dataKey: 'Code-barres', width: 25 },
        { header: 'Statut', dataKey: 'Statut', width: 20 },
      ],
      data,
      stats
    });
  };

  const handleSavePret = async (formData: FormData) => {
    if (!selectedMateriel) return;

    const quantitePretee = parseInt(formData.get('quantite') as string);
    
    const pretData: PretPetitMateriel = {
      id: Date.now().toString(),
      petitMaterielId: selectedMateriel.id,
      ouvrierId: formData.get('ouvrierId') as string,
      chantierId: formData.get('chantierId') as string || undefined,
      dateDebut: formData.get('dateDebut') as string,
      dateRetourPrevue: formData.get('dateRetourPrevue') as string,
      quantite: quantitePretee,
      statut: 'en_cours',
      etatDepart: formData.get('etatDepart') as PretPetitMateriel['etatDepart'],
      notes: formData.get('notes') as string,
      ouvrierNom: ouvriers?.find(o => o.id === formData.get('ouvrierId'))?.prenom + ' ' + 
                  ouvriers?.find(o => o.id === formData.get('ouvrierId'))?.nom,
      chantierNom: chantiers?.find(c => c.id === formData.get('chantierId'))?.nom,
      petitMaterielNom: selectedMateriel.nom
    };

    // Mettre à jour les quantités
    setPetitMateriel(petitMateriel?.map(m => 
      m.id === selectedMateriel.id 
        ? { ...m, quantiteDisponible: m.quantiteDisponible - quantitePretee, statut: m.quantiteDisponible - quantitePretee === 0 ? 'prete' : m.statut }
        : m
    ) || []);

    setPrets([...(prets || []), pretData]);
    setIsPretModalOpen(false);
    setSelectedMateriel(null);

    try {
      await PretPetitMaterielService.create(pretData);
      refreshPrets();
      refreshPetitMateriel(); // Refresh pour mettre à jour les quantités
      setIsPretModalOpen(false);
      setSelectedMateriel(null);
    } catch (error) {
      console.error('Erreur lors de la création du prêt:', error);
      alert('Erreur lors de la création du prêt');
    }
  };

  const { data: petitMateriel, loading: petitMaterielLoading, error: petitMaterielError, refresh: refreshPetitMateriel } = useRealtimeSupabase<PetitMateriel>({
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
  
  const { data: chantiers } = useRealtimeSupabase<ChantierType>({
    table: 'chantiers',
    fetchFunction: chantierService.getAll
  });

  const handleSaveRetour = async (formData: FormData) => {
    if (!selectedPret) return;

    const quantiteRetournee = parseInt(formData.get('quantiteRetournee') as string);
    const etatRetour = formData.get('etatRetour') as PretPetitMateriel['etatRetour'];
    
    // Mettre à jour le prêt
    const updatedPret: PretPetitMateriel = {
      ...selectedPret,
      dateRetourEffective: formData.get('dateRetourEffective') as string,
      etatRetour,
      statut: 'termine',
      notes: (selectedPret.notes || '') + '\n' + (formData.get('notesRetour') as string)
    };

    const retourData = {
      dateRetourEffective: formData.get('dateRetourEffective') as string,
      etatRetour,
      statut: 'termine',
      notes: (selectedPret.notes || '') + '\n' + (formData.get('notesRetour') as string)
    };

    setPrets(prets?.map(p => p.id === selectedPret.id ? updatedPret : p) || []);

    // Mettre à jour les quantités du matériel
    const materiel = petitMateriel?.find(m => m.id === selectedPret.petitMaterielId);
    if (materiel) {
      const nouvelleQuantiteDisponible = materiel.quantiteDisponible + quantiteRetournee;
      const nouveauStatut = etatRetour === 'perdu' ? 'perdu' : 
                           nouvelleQuantiteDisponible === materiel.quantiteStock ? 'disponible' : 
                           materiel.statut;

      setPetitMateriel(petitMateriel?.map(m => 
        m.id === selectedPret.petitMaterielId 
          ? { ...m, quantiteDisponible: nouvelleQuantiteDisponible, statut: nouveauStatut }
          : m
      ) || []);
    }

    setIsRetourModalOpen(false);

    try {
      await PretPetitMaterielService.update(selectedPret.id, retourData);
      refreshPrets();
      refreshPetitMateriel(); // Refresh pour mettre à jour les quantités
      setIsRetourModalOpen(false);
      setSelectedPret(null);
    } catch (error) {
      console.error('Erreur lors du retour:', error);
      alert('Erreur lors du retour du matériel');
    }
  };

  const filteredMateriel = (petitMateriel || []).filter(item => {
    const matchesSearch = item.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.codeBarre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.statut === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredPrets = (prets || []).filter(pret => {
    const matchesSearch = pret.petitMaterielNom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pret.ouvrierNom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pret.chantierNom?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const pretsEnCours = (prets || []).filter(pret => pret.statut === 'en_cours' || pret.statut === 'retard');

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce matériel ?')) {
      try {
        await PetitMaterielService.delete(id);
        refreshPetitMateriel();
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
      description: formData.get('description') as string,
      numeroSerie: formData.get('numeroSerie') as string,
      codeBarre: formData.get('codeBarre') as string,
      quantiteStock: parseInt(formData.get('quantiteStock') as string),
      quantiteDisponible: parseInt(formData.get('quantiteDisponible') as string),
      seuilAlerte: parseInt(formData.get('seuilAlerte') as string),
      localisation: formData.get('localisation') as string,
      statut: formData.get('statut') as PetitMateriel['statut'],
      dateAchat: formData.get('dateAchat') as string,
      valeur: parseFloat(formData.get('valeur') as string),
      fournisseur: formData.get('fournisseur') as string,
      poids: parseFloat(formData.get('poids') as string) || undefined,
      dimensions: formData.get('dimensions') as string,
      garantie: formData.get('garantie') as string,
      etatDepart: formData.get('etatDepart') as PretPetitMateriel['etatDepart']
    };

    try {
      if (editingMateriel) {
        await PetitMaterielService.update(editingMateriel.id, materielData);
      } else {
        await PetitMaterielService.create(materielData);
      }
      
      refreshPetitMateriel();
      setIsModalOpen(false);
      setEditingMateriel(null);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement du matériel');
    }
  };

  const handleBarcodeSearch = async () => {
    try {
      const found = await PetitMaterielService.getByBarcode(barcodeSearch);
      if (found) {
        setSelectedMateriel(found);
        setIsDetailModalOpen(true);
      } else {
        alert('Aucun matériel trouvé avec ce code-barres');
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      alert('Erreur lors de la recherche par code-barres');
    }
  };

  const getStatistics = () => {
    const total = (petitMateriel || []).length;
    const disponible = (petitMateriel || []).filter(item => item.statut === 'disponible').length;
    const prete = (petitMateriel || []).filter(item => item.statut === 'prete').length;
    const maintenance = (petitMateriel || []).filter(item => item.statut === 'maintenance').length;
    const stockFaible = (petitMateriel || []).filter(item => item.quantiteDisponible <= item.seuilAlerte).length;
    const valeurTotale = (petitMateriel || []).reduce((sum, item) => sum + (item.valeur * item.quantiteStock), 0);
    const pretsEnCours = (prets || []).filter(p => p.statut === 'en_cours').length;
    const pretsEnRetard = (prets || []).filter(p => p.statut === 'retard').length;
    const alertesStock = (petitMateriel || []).filter(m => m.quantiteDisponible <= m.seuilAlerte).length;

    return { total, disponible, prete, maintenance, valeurTotale, pretsEnCours, pretsEnRetard, alertesStock };
  };

  const getUniqueTypes = () => {
    return [...new Set((petitMateriel || []).map(item => item.type))];
  };

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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: GSR 18V-60 C"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={editingMateriel?.description || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Description détaillée du matériel..."
            />
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
            <Hash className="w-5 h-5 mr-2" />
            Identification
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de série</label>
              <input
                name="numeroSerie"
                type="text"
                required
                defaultValue={editingMateriel?.numeroSerie || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ex: BSH001234"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code-barres</label>
              <div className="flex space-x-2">
                <input
                  name="codeBarre"
                  type="text"
                  required
                  defaultValue={editingMateriel?.codeBarre || ''}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: 3165140123456"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const input = document.querySelector('input[name="codeBarre"]') as HTMLInputElement;
                    if (input) input.value = generateBarcode();
                  }}
                >
                  <QrCode className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
            <Archive className="w-5 h-5 mr-2" />
            Stock et localisation
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
              <select
                name="localisation"
                required
                defaultValue={editingMateriel?.localisation || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Sélectionner une localisation</option>
                <option value="Dépôt principal">Dépôt principal</option>
                <option value="Atelier">Atelier</option>
                <option value="Vestiaire">Vestiaire</option>
                <option value="Véhicule">Véhicule</option>
                {chantiers?.filter(c => c.statut === 'actif').map(chantier => (
                  <option key={chantier.id} value={chantier.nom}>{chantier.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                name="statut"
                defaultValue={editingMateriel?.statut || 'disponible'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valeur unitaire (€)</label>
              <input
                name="valeur"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={editingMateriel?.valeur || 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
              <input
                name="fournisseur"
                type="text"
                defaultValue={editingMateriel?.fournisseur || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ex: Leroy Merlin"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Poids (kg)</label>
              <input
                name="poids"
                type="number"
                step="0.1"
                min="0"
                defaultValue={editingMateriel?.poids || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ex: 1.2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
              <input
                name="dimensions"
                type="text"
                defaultValue={editingMateriel?.dimensions || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ex: 25x8x22 cm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Garantie jusqu'au</label>
              <input
                name="garantie"
                type="date"
                defaultValue={editingMateriel?.garantie || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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

  const PretForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSavePret(new FormData(e.currentTarget));
    }}>
      <div className="space-y-6">
        {selectedMateriel && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Matériel sélectionné</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-700">Nom: <span className="font-medium">{selectedMateriel.nom}</span></p>
                <p className="text-blue-700">Type: <span className="font-medium">{selectedMateriel.type}</span></p>
              </div>
              <div>
                <p className="text-blue-700">Disponible: <span className="font-medium">{selectedMateriel.quantiteDisponible}/{selectedMateriel.quantiteStock}</span></p>
                <p className="text-blue-700">Localisation: <span className="font-medium">{selectedMateriel.localisation}</span></p>
              </div>
            </div>
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
              {(ouvriers || []).filter(o => o.statut === 'actif').map(ouvrier => (
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
              <option value="">Aucun chantier spécifique</option>
              {(chantiers || []).filter(c => c.statut === 'actif' || c.statut === 'planifie').map(chantier => (
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
              max={selectedMateriel?.quantiteDisponible || 1}
              required
              defaultValue="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notes sur le prêt..."
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={() => setIsPretModalOpen(false)}>
          Annuler
        </Button>
        <Button type="submit">
          <ArrowRight className="w-4 h-4 mr-2" />
          Enregistrer le prêt
        </Button>
      </div>
    </form>
  );

  const RetourForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSaveRetour(new FormData(e.currentTarget));
    }}>
      <div className="space-y-6">
        {selectedPret && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">Prêt en cours</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-yellow-700">Matériel: <span className="font-medium">{selectedPret.petitMaterielNom}</span></p>
                <p className="text-yellow-700">Ouvrier: <span className="font-medium">{selectedPret.ouvrierNom}</span></p>
              </div>
              <div>
                <p className="text-yellow-700">Quantité: <span className="font-medium">{selectedPret.quantite}</span></p>
                <p className="text-yellow-700">Depuis le: <span className="font-medium">{new Date(selectedPret.dateDebut).toLocaleDateString()}</span></p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantité retournée</label>
            <input
              name="quantiteRetournee"
              type="number"
              min="1"
              max={selectedPret?.quantite || 1}
              required
              defaultValue={selectedPret?.quantite || 1}
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
              <option value="neuf">Neuf</option>
              <option value="bon">Bon état</option>
              <option value="moyen">État moyen</option>
              <option value="use">Usé</option>
              <option value="endommage">Endommagé</option>
              <option value="perdu">Perdu</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes de retour</label>
          <textarea
            name="notesRetour"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Observations sur l'état du matériel au retour..."
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={() => setIsRetourModalOpen(false)}>
          Annuler
        </Button>
        <Button type="submit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Enregistrer le retour
        </Button>
      </div>
    </form>
  );

  const DetailModal = () => {
    if (!selectedMateriel) return null;

    const pretsActifs = (prets || []).filter(p => p.petitMaterielId === selectedMateriel.id && p.statut === 'en_cours');
    const historiqueComplet = (prets || []).filter(p => p.petitMaterielId === selectedMateriel.id);

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{selectedMateriel.nom}</h2>
              <p className="mt-1 text-blue-100">{selectedMateriel.marque} {selectedMateriel.modele}</p>
              <div className="mt-3 flex items-center space-x-3">
                <StatusBadge status={selectedMateriel.statut} type="petit_materiel" />
                <span className="text-sm bg-white/20 px-2 py-1 rounded">
                  {selectedMateriel.quantiteDisponible}/{selectedMateriel.quantiteStock} disponible
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{selectedMateriel.valeur} €</div>
              <div className="text-sm text-blue-100">Valeur unitaire</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <Hash className="w-5 h-5 mr-2 text-blue-500" />
              Identification
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Numéro de série:</span>
                <span className="font-medium">{selectedMateriel.numeroSerie}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Code-barres:</span>
                <span className="font-mono font-medium">{selectedMateriel.codeBarre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{selectedMateriel.type}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-green-500" />
              Stock et localisation
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Localisation:</span>
                <span className="font-medium">{selectedMateriel.localisation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stock total:</span>
                <span className="font-medium">{selectedMateriel.quantiteStock}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Disponible:</span>
                <span className={`font-medium ${selectedMateriel.quantiteDisponible <= selectedMateriel.seuilAlerte ? 'text-red-600' : 'text-green-600'}`}>
                  {selectedMateriel.quantiteDisponible}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Seuil d'alerte:</span>
                <span className="font-medium">{selectedMateriel.seuilAlerte}</span>
              </div>
            </div>
          </div>
        </div>

        {selectedMateriel.description && (
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-2">Description</h3>
            <p className="text-gray-800">{selectedMateriel.description}</p>
          </div>
        )}

        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center">
            <Truck className="w-5 h-5 mr-2 text-purple-500" />
            Prêts en cours ({pretsActifs.length})
          </h3>
          {pretsActifs.length > 0 ? (
            <div className="space-y-2">
              {pretsActifs.map(pret => (
                <div key={pret.id} className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div>
                    <p className="font-medium text-gray-900">{pret.ouvrierNom}</p>
                    <p className="text-sm text-gray-600">
                      {pret.quantite} unité(s) - Depuis le {new Date(pret.dateDebut).toLocaleDateString()}
                    </p>
                    {pret.chantierNom && (
                      <p className="text-sm text-gray-600">Chantier: {pret.chantierNom}</p>
                    )}
                  </div>
                  <Button size="sm" onClick={() => handleRetour(pret)}>
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Retour
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Aucun prêt en cours</p>
          )}
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-orange-500" />
            Historique des prêts ({historiqueComplet.length})
          </h3>
          {historiqueComplet.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {historiqueComplet.slice(-5).map(pret => (
                <div key={pret.id} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <p className="text-sm font-medium">{pret.ouvrierNom}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(pret.dateDebut).toLocaleDateString()} - 
                      {pret.dateRetourEffective ? new Date(pret.dateRetourEffective).toLocaleDateString() : 'En cours'}
                    </p>
                  </div>
                  <StatusBadge status={pret.statut} type="pret" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Aucun historique</p>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => handleEdit(selectedMateriel)}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button onClick={() => handlePret(selectedMateriel)} disabled={selectedMateriel.quantiteDisponible === 0}>
            <ArrowRight className="w-4 h-4 mr-2" />
            Nouveau prêt
          </Button>
        </div>
      </div>
    );
  };

  const BarcodeModal = () => (
    <div className="space-y-6">
      <div className="text-center">
        <QrCode className="w-16 h-16 mx-auto text-blue-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Scanner un code-barres</h3>
        <p className="text-gray-600">Scannez ou saisissez un code-barres pour identifier le matériel</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Code-barres</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={scannedBarcode}
              onChange={(e) => setScannedBarcode(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Saisissez ou scannez le code-barres"
            />
            <Button variant="secondary" size="sm">
              <Camera className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Utilisez un lecteur de code-barres USB</li>
            <li>• Ou saisissez manuellement le code</li>
            <li>• Le matériel sera automatiquement identifié</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button variant="secondary" onClick={() => setIsBarcodeModalOpen(false)}>
          Annuler
        </Button>
        <Button onClick={scanBarcode} disabled={!scannedBarcode}>
          <Scan className="w-4 h-4 mr-2" />
          Rechercher
        </Button>
      </div>
    </div>
  );

  const stats = getStatistics();
  const uniqueTypes = getUniqueTypes();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion du Petit Matériel</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setIsBarcodeModalOpen(true)} variant="secondary">
            <Scan className="w-4 h-4 mr-2" />
            Scanner
          </Button>
          <Button onClick={exportToPDFReport} variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Matériel
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <p className="text-xs text-gray-500">sur {stats.total} total</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Prêts en cours</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pretsEnCours}</p>
              {stats.pretsEnRetard > 0 && (
                <p className="text-xs text-red-500">{stats.pretsEnRetard} en retard</p>
              )}
            </div>
            <div className="p-3 rounded-full bg-orange-100">
              <Truck className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valeur Totale</p>
              <p className="text-2xl font-bold text-purple-600">{stats.valeurTotale.toLocaleString()} €</p>
              {stats.alertesStock > 0 && (
                <p className="text-xs text-red-500">{stats.alertesStock} alerte(s) stock</p>
              )}
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <Euro className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow-sm border">
        {petitMaterielLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des données...</p>
          </div>
        ) : petitMaterielError ? (
          <div className="text-center py-8 text-red-500">
            <p>Erreur lors du chargement des données</p>
            <p className="text-sm">{petitMaterielError.message}</p>
          </div>
        ) : (
          <>
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('materiel')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'materiel'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Package className="w-4 h-4 inline mr-2" />
                Matériel ({(petitMateriel || []).length})
              </button>
              <button
                onClick={() => setActiveTab('prets')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'prets'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Truck className="w-4 h-4 inline mr-2" />
                Prêts en cours ({(prets || []).filter(p => p.statut === 'en_cours').length})
                {stats.pretsEnRetard > 0 && (
                  <span className="ml-1 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                    {stats.pretsEnRetard}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('historique')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'historique'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Clock className="w-4 h-4 inline mr-2" />
                Historique ({(prets || []).length})
              </button>
            </nav>

            <div className="p-4 border-b space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {activeTab === 'materiel' && (
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
                  </div>
                )}
              </div>
            </div>

            {/* Contenu des onglets */}
            {activeTab === 'materiel' && (
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
                        Valeur
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
                              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                <Package className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{item.nom}</div>
                              <div className="text-sm text-gray-500">{item.marque} {item.modele}</div>
                              <div className="text-xs text-gray-400">{item.type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="flex items-center">
                              <Barcode className="w-4 h-4 mr-1 text-gray-400" />
                              <span className="font-mono">{item.codeBarre}</span>
                            </div>
                            <div className="text-gray-500 mt-1">S/N: {item.numeroSerie}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className={`font-medium ${item.quantiteDisponible <= item.seuilAlerte ? 'text-red-600' : 'text-gray-900'}`}>
                              {item.quantiteDisponible}/{item.quantiteStock}
                            </div>
                            <div className="text-gray-500">
                              Seuil: {item.seuilAlerte}
                              {item.quantiteDisponible <= item.seuilAlerte && (
                                <AlertTriangle className="w-3 h-3 inline ml-1 text-red-500" />
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={item.statut} type="petit_materiel" />
                          <div className="text-xs text-gray-500 mt-1">{item.localisation}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{item.valeur}€</div>
                            <div className="text-gray-500">Total: {(item.valeur * item.quantiteStock).toLocaleString()}€</div>
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
                            <button
                              onClick={() => handlePret(item)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Nouveau prêt"
                              disabled={item.quantiteDisponible === 0}
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-900"
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
            )}

            {activeTab === 'prets' && (
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
                        Quantité
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
                    {filteredPrets.filter(p => p.statut === 'en_cours' || p.statut === 'retard').map((pret) => {
                      const isOverdue = new Date(pret.dateRetourPrevue) < new Date() && pret.statut === 'en_cours';
                      
                      return (
                        <tr key={pret.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{pret.petitMaterielNom}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="text-sm text-gray-900">{pret.ouvrierNom}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {pret.chantierNom ? (
                              <div className="flex items-center">
                                <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                                <span className="text-sm text-gray-900">{pret.chantierNom}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="text-gray-900">
                                {new Date(pret.dateDebut).toLocaleDateString()}
                              </div>
                              <div className={`text-gray-500 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                → {new Date(pret.dateRetourPrevue).toLocaleDateString()}
                                {isOverdue && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {pret.quantite}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={isOverdue ? 'retard' : pret.statut} type="pret" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button size="sm" onClick={() => handleRetour(pret)}>
                              <ArrowLeft className="w-4 h-4 mr-1" />
                              Retour
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {pretsEnCours.length === 0 && (
                    <tfoot>
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500 bg-gray-50">
                          Aucun prêt en cours
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {activeTab === 'historique' && (
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
                        Période
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durée
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        État
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPrets.map((pret) => {
                      const duree = pret.dateRetourEffective 
                        ? Math.ceil((new Date(pret.dateRetourEffective).getTime() - new Date(pret.dateDebut).getTime()) / (1000 * 60 * 60 * 24))
                        : Math.ceil((new Date().getTime() - new Date(pret.dateDebut).getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <tr key={pret.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{pret.petitMaterielNom}</div>
                            <div className="text-sm text-gray-500">Qté: {pret.quantite}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{pret.ouvrierNom}</div>
                            {pret.chantierNom && (
                              <div className="text-sm text-gray-500">{pret.chantierNom}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="text-gray-900">{new Date(pret.dateDebut).toLocaleDateString()}</div>
                              <div className="text-gray-500">
                                → {pret.dateRetourEffective 
                                  ? new Date(pret.dateRetourEffective).toLocaleDateString()
                                  : new Date(pret.dateRetourPrevue).toLocaleDateString() + ' (prévu)'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {duree} jour{duree > 1 ? 's' : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="text-gray-900">Départ: {pret.etatDepart}</div>
                              {pret.etatRetour && (
                                <div className="text-gray-500">Retour: {pret.etatRetour}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={pret.statut} type="pret" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMateriel(null);
        }}
        title={editingMateriel ? 'Modifier le petit matériel' : 'Nouveau petit matériel'}
        size="xl"
      >
        {!petitMaterielLoading && <MaterielForm />}
      </Modal>

      <Modal
        isOpen={isPretModalOpen}
        onClose={() => {
          setIsPretModalOpen(false);
          setSelectedMateriel(null);
        }}
        title="Nouveau prêt de matériel"
        size="lg"
      >
        {selectedMateriel && !pretsLoading && <PretForm />}
      </Modal>

      <Modal
        isOpen={isRetourModalOpen}
        onClose={() => {
          setIsRetourModalOpen(false);
          setSelectedPret(null);
        }}
        title="Retour de matériel"
        size="lg"
      >
        {selectedPret && !pretsLoading && <RetourForm />}
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMateriel(null);
        }}
        title={`Détails - ${selectedMateriel?.nom}`}
        size="xl"
      >
        {selectedMateriel && <DetailModal />}
      </Modal>

      <Modal
        isOpen={isBarcodeModalOpen}
        onClose={() => {
          setIsBarcodeModalOpen(false);
          setScannedBarcode('');
        }}
        title="Scanner un code-barres"
        size="md"
      >
        <BarcodeModal />
      </Modal>
    </div>
  );
};

// Export alias pour correspondre à l'import dans App.tsx
export const PetitMaterielSection = MaterielSection;