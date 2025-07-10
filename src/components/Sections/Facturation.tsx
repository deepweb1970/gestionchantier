import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Download, 
  Send, 
  Eye, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Filter, 
  Search, 
  Euro, 
  Calculator, 
  Printer 
} from 'lucide-react';
import { mockFactures, mockClients, mockChantiers } from '../../data/mockData';
import { Facture, Client, Chantier, FactureItem } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { StatusBadge } from '../Common/StatusBadge';

export const Facturation: React.FC = () => {
  const [factures, setFactures] = useState<Facture[]>(mockFactures);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingFacture, setEditingFacture] = useState<Facture | null>(null);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [items, setItems] = useState<FactureItem[]>([]);
  const [tauxTVA, setTauxTVA] = useState(20);

  const filteredFactures = factures.filter(facture => {
    const matchesSearch = facture.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mockClients.find(c => c.id === facture.clientId)?.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || facture.statut === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const today = new Date();
      const factureDate = new Date(facture.dateEmission);
      
      switch (dateFilter) {
        case 'this_month':
          matchesDate = factureDate.getMonth() === today.getMonth() && factureDate.getFullYear() === today.getFullYear();
          break;
        case 'last_month':
          const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
          matchesDate = factureDate.getMonth() === lastMonth.getMonth() && factureDate.getFullYear() === lastMonth.getFullYear();
          break;
        case 'overdue':
          matchesDate = new Date(facture.dateEcheance) < today && facture.statut !== 'payee';
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getClient = (clientId: string): Client | undefined => {
    return mockClients.find(c => c.id === clientId);
  };

  const getChantier = (chantierId: string): Chantier | undefined => {
    return mockChantiers.find(c => c.id === chantierId);
  };

  const calculateTotals = () => {
    const montantHT = items.reduce((sum, item) => sum + item.total, 0);
    const tva = montantHT * (tauxTVA / 100);
    const montantTTC = montantHT + tva;
    return { montantHT, tva, montantTTC };
  };

  const addItem = () => {
    const newItem: FactureItem = {
      id: Date.now().toString(),
      description: '',
      quantite: 1,
      prixUnitaire: 0,
      total: 0
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof FactureItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantite' || field === 'prixUnitaire') {
          updatedItem.total = updatedItem.quantite * updatedItem.prixUnitaire;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const generateFactureNumber = () => {
    const year = new Date().getFullYear();
    const count = factures.length + 1;
    return `FAC-${year}-${count.toString().padStart(3, '0')}`;
  };

  const createFromChantier = (chantierId: string) => {
    const chantier = getChantier(chantierId);
    if (!chantier) return;

    const client = mockClients.find(c => c.nom === chantier.client);
    if (!client) return;

    const newItem: FactureItem = {
      id: '1',
      description: chantier.description,
      quantite: 1,
      prixUnitaire: chantier.budget,
      total: chantier.budget
    };

    setItems([newItem]);
    setEditingFacture({
      id: '',
      numero: generateFactureNumber(),
      clientId: client.id,
      chantierId: chantier.id,
      dateEmission: new Date().toISOString().split('T')[0],
      dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      montantHT: 0,
      tva: 0,
      montantTTC: 0,
      statut: 'brouillon',
      items: []
    });
    setIsModalOpen(true);
  };

  const handleEdit = (facture: Facture) => {
    setEditingFacture(facture);
    setItems(facture.items);
    setIsModalOpen(true);
  };

  const handleViewDetails = (facture: Facture) => {
    setSelectedFacture(facture);
    setIsDetailModalOpen(true);
  };

  const handlePayment = (facture: Facture) => {
    setSelectedFacture(facture);
    setIsPaymentModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      setFactures(factures.filter(f => f.id !== id));
    }
  };

  const handleSave = (formData: FormData) => {
    const totals = calculateTotals();
    
    const factureData: Facture = {
      id: editingFacture?.id || Date.now().toString(),
      numero: formData.get('numero') as string,
      clientId: formData.get('clientId') as string,
      chantierId: formData.get('chantierId') as string,
      dateEmission: formData.get('dateEmission') as string,
      dateEcheance: formData.get('dateEcheance') as string,
      montantHT: totals.montantHT,
      tva: totals.tva,
      montantTTC: totals.montantTTC,
      statut: formData.get('statut') as Facture['statut'],
      items: items
    };

    if (editingFacture?.id) {
      setFactures(factures.map(f => f.id === editingFacture.id ? factureData : f));
    } else {
      setFactures([...factures, factureData]);
    }
    
    setIsModalOpen(false);
    setEditingFacture(null);
    setItems([]);
    
    // Force refresh of the UI
    setTimeout(() => {
      setFactures([...factures]);
    }, 100);
  };

  const markAsPaid = () => {
    if (!selectedFacture) return;
    
    setFactures(factures.map(f => 
      f.id === selectedFacture.id 
        ? { ...f, statut: 'payee' as Facture['statut'] }
        : f
    ));
    setIsPaymentModalOpen(false);
    setSelectedFacture(null);
    
    // Force refresh of the UI
    setTimeout(() => {
      setFactures([...factures]);
    }, 100);
  };

  const getOverdueInvoices = () => {
    const today = new Date();
    return factures.filter(f => new Date(f.dateEcheance) < today && f.statut !== 'payee');
  };

  const getTotalStats = () => {
    const total = factures.reduce((sum, f) => sum + f.montantTTC, 0);
    const paid = factures.filter(f => f.statut === 'payee').reduce((sum, f) => sum + f.montantTTC, 0);
    const pending = factures.filter(f => f.statut === 'envoyee').reduce((sum, f) => sum + f.montantTTC, 0);
    const overdue = getOverdueInvoices().reduce((sum, f) => sum + f.montantTTC, 0);
    
    return { total, paid, pending, overdue };
  };

  const FactureForm = () => {
    const totals = calculateTotals();
    
    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSave(new FormData(e.currentTarget));
      }}>
        <div className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de facture</label>
              <input
                name="numero"
                type="text"
                required
                defaultValue={editingFacture?.numero || generateFactureNumber()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                name="statut"
                defaultValue={editingFacture?.statut || 'brouillon'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="brouillon">Brouillon</option>
                <option value="envoyee">Envoyée</option>
                <option value="payee">Payée</option>
                <option value="retard">En retard</option>
                <option value="annulee">Annulée</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select
                name="clientId"
                required
                defaultValue={editingFacture?.clientId || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un client</option>
                {mockClients.map(client => (
                  <option key={client.id} value={client.id}>{client.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chantier (optionnel)</label>
              <select
                name="chantierId"
                defaultValue={editingFacture?.chantierId || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Aucun chantier</option>
                {mockChantiers.map(chantier => (
                  <option key={chantier.id} value={chantier.id}>{chantier.nom}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'émission</label>
              <input
                name="dateEmission"
                type="date"
                required
                defaultValue={editingFacture?.dateEmission || new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
              <input
                name="dateEcheance"
                type="date"
                required
                defaultValue={editingFacture?.dateEcheance || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Lignes de facturation */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Lignes de facturation</h3>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une ligne
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Qté"
                      value={item.quantite}
                      onChange={(e) => updateItem(item.id, 'quantite', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Prix unitaire"
                      value={item.prixUnitaire}
                      onChange={(e) => updateItem(item.id, 'prixUnitaire', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm font-medium">{item.total.toFixed(2)} €</span>
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totaux */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Taux TVA (%)</label>
                <input
                  type="number"
                  value={tauxTVA}
                  onChange={(e) => setTauxTVA(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Montant HT:</span>
                <span className="font-medium">{totals.montantHT.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">TVA ({tauxTVA}%):</span>
                <span className="font-medium">{totals.tva.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-bold">Total TTC:</span>
                <span className="font-bold text-lg">{totals.montantTTC.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
            Annuler
          </Button>
          <Button type="submit">
            {editingFacture?.id ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </form>
    );
  };

  const FactureDetailModal = () => {
    if (!selectedFacture) return null;

    const client = getClient(selectedFacture.clientId);
    const chantier = getChantier(selectedFacture.chantierId);

    return (
      <div className="space-y-6">
        {/* En-tête de facture */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedFacture.numero}</h2>
              <p className="text-gray-600 mt-1">
                Émise le {new Date(selectedFacture.dateEmission).toLocaleDateString()}
              </p>
              <p className="text-gray-600">
                Échéance: {new Date(selectedFacture.dateEcheance).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <StatusBadge status={selectedFacture.statut} type="facture" />
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {selectedFacture.montantTTC.toLocaleString()} €
              </p>
            </div>
          </div>
        </div>

        {/* Informations client */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Client</h3>
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-medium text-gray-900">{client?.nom}</h4>
            <p className="text-sm text-gray-600">{client?.email}</p>
            <p className="text-sm text-gray-600">{client?.telephone}</p>
            <p className="text-sm text-gray-600">{client?.adresse}</p>
            {client?.siret && (
              <p className="text-sm text-gray-600">SIRET: {client.siret}</p>
            )}
          </div>
        </div>

        {/* Chantier associé */}
        {chantier && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Chantier associé</h3>
            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{chantier.nom}</h4>
              <p className="text-sm text-gray-600">{chantier.description}</p>
              <p className="text-sm text-gray-600">{chantier.adresse}</p>
            </div>
          </div>
        )}

        {/* Détail des lignes */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Détail</h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Description</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Quantité</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Prix unitaire</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedFacture.items.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.description}</td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.quantite}</td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.prixUnitaire.toFixed(2)} €</td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">{item.total.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-700 text-right">Montant HT:</td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">{selectedFacture.montantHT.toFixed(2)} €</td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-700 text-right">TVA:</td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">{selectedFacture.tva.toFixed(2)} €</td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-lg font-bold text-gray-700 text-right">Total TTC:</td>
                  <td className="px-4 py-2 text-lg font-bold text-gray-900 text-right">{selectedFacture.montantTTC.toFixed(2)} €</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button variant="secondary">
            <Printer className="w-4 h-4 mr-2" />
            Imprimer
          </Button>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          {selectedFacture.statut !== 'payee' && (
            <Button onClick={() => handlePayment(selectedFacture)}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Marquer comme payée
            </Button>
          )}
        </div>
      </div>
    );
  };

  const PaymentModal = () => {
    if (!selectedFacture) return null;

    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-800">
              Vous êtes sur le point de marquer cette facture comme payée.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Détails de la facture</h3>
          <p className="text-sm text-gray-600">Numéro: {selectedFacture.numero}</p>
          <p className="text-sm text-gray-600">Montant: {selectedFacture.montantTTC.toFixed(2)} €</p>
          <p className="text-sm text-gray-600">
            Client: {getClient(selectedFacture.clientId)?.nom}
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>
            Annuler
          </Button>
          <Button onClick={markAsPaid}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirmer le paiement
          </Button>
        </div>
      </div>
    );
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion de la Facturation</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Facture
          </Button>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export Comptable
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Facturé</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()} €</p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <Euro className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Payé</p>
              <p className="text-2xl font-bold text-green-600">{stats.paid.toLocaleString()} €</p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Attente</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending.toLocaleString()} €</p>
            </div>
            <div className="p-3 rounded-full bg-orange-500">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Retard</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue.toLocaleString()} €</p>
            </div>
            <div className="p-3 rounded-full bg-red-500">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Création rapide depuis chantiers */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Création rapide depuis un chantier</h3>
        <div className="flex flex-wrap gap-2">
          {mockChantiers.map(chantier => (
            <button
              key={chantier.id}
              onClick={() => createFromChantier(chantier.id)}
              className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
            >
              <Calculator className="w-4 h-4 inline mr-1" />
              {chantier.nom}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une facture..."
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
                <option value="brouillon">Brouillon</option>
                <option value="envoyee">Envoyée</option>
                <option value="payee">Payée</option>
                <option value="retard">En retard</option>
                <option value="annulee">Annulée</option>
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes les dates</option>
                <option value="this_month">Ce mois</option>
                <option value="last_month">Mois dernier</option>
                <option value="overdue">En retard</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facture
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Échéance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFactures.map((facture) => {
                const client = getClient(facture.clientId);
                const isOverdue = new Date(facture.dateEcheance) < new Date() && facture.statut !== 'payee';
                
                return (
                  <tr key={facture.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{facture.numero}</div>
                          <div className="text-sm text-gray-500">
                            Émise le {new Date(facture.dateEmission).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client?.nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={facture.statut} type="facture" />
                      {isOverdue && (
                        <div className="flex items-center mt-1">
                          <AlertTriangle className="w-3 h-3 text-red-500 mr-1" />
                          <span className="text-xs text-red-600">En retard</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {facture.montantTTC.toLocaleString()} €
                      </div>
                      <div className="text-sm text-gray-500">
                        HT: {facture.montantHT.toLocaleString()} €
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        {new Date(facture.dateEcheance).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(facture)}
                          className="text-green-600 hover:text-green-900"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(facture)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-purple-600 hover:text-purple-900" title="Envoyer">
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(facture.id)}
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
          </table>
        </div>
      </div>

      {/* Modal de création/modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingFacture(null);
          setItems([]);
        }}
        title={editingFacture?.id ? 'Modifier la facture' : 'Nouvelle facture'}
        size="xl"
      >
        <FactureForm />
      </Modal>

      {/* Modal de détails */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedFacture(null);
        }}
        title={`Facture ${selectedFacture?.numero}`}
        size="xl"
      >
        <FactureDetailModal />
      </Modal>

      {/* Modal de paiement */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedFacture(null);
        }}
        title="Confirmer le paiement"
        size="md"
      >
        <PaymentModal />
      </Modal>
    </div>
  );
};