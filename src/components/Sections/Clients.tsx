import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Building, 
  Phone, 
  Mail, 
  FileText, 
  MessageSquare, 
  Calendar, 
  Download, 
  Filter, 
  Search, 
  Eye, 
  Send, 
  MapPin, 
  CheckCircle, 
  AlertTriangle, 
  Building2, 
  CreditCard, 
  Clock 
} from 'lucide-react';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { clientService } from '../../services/clientService';
import { chantierService } from '../../services/chantierService';
import { factureService } from '../../services/factureService';
import { Client, Chantier, Facture } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { StatusBadge } from '../Common/StatusBadge';

export const Clients: React.FC = () => {
  const { data: clients, loading, error, refresh } = useRealtimeSupabase<Client>({
    table: 'clients',
    fetchFunction: clientService.getAll
  });
  
  const { data: chantiers } = useRealtimeSupabase<Chantier>({
    table: 'chantiers',
    fetchFunction: chantierService.getAll
  });
  
  const { data: factures } = useRealtimeSupabase<Facture>({
    table: 'factures',
    fetchFunction: factureService.getAll
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCommunicationModalOpen, setIsCommunicationModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [newMessage, setNewMessage] = useState('');
  const [sortBy, setSortBy] = useState<'nom' | 'type' | 'projets'>('nom');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [communications, setCommunications] = useState<any[]>([
    {
      id: '1',
      clientId: '1',
      type: 'email',
      subject: 'Devis villa moderne',
      message: 'Bonjour, voici le devis pour votre projet de villa moderne.',
      date: '2024-01-15T10:30:00',
      sender: 'admin',
      status: 'sent'
    },
    {
      id: '2',
      clientId: '1',
      type: 'phone',
      subject: 'Appel de suivi',
      message: 'Discussion sur l\'avancement des travaux et prochaines étapes.',
      date: '2024-01-20T14:15:00',
      sender: 'admin',
      status: 'completed'
    }
  ]);

  const filteredClients = (clients || [])
  .filter(client => {
    const matchesSearch = client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.contactPrincipal.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || client.type === typeFilter;
    return matchesSearch && matchesType;
  })
  .sort((a, b) => {
    if (sortBy === 'nom') {
      return sortDirection === 'asc' 
        ? a.nom.localeCompare(b.nom)
        : b.nom.localeCompare(a.nom);
    } else if (sortBy === 'type') {
      return sortDirection === 'asc' 
        ? a.type.localeCompare(b.type)
        : b.type.localeCompare(a.type);
    } else { // projets
      const aProjects = getClientProjects(a.id).length;
      const bProjects = getClientProjects(b.id).length;
      return sortDirection === 'asc' ? aProjects - bProjects : bProjects - aProjects;
    }
  });

  const toggleSort = (field: 'nom' | 'type' | 'projets') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setIsDetailModalOpen(true);
  };

  const handleCommunication = (client: Client) => {
    setSelectedClient(client);
    setIsCommunicationModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        await clientService.delete(id);
        // Force refresh immediately
        refresh();
        refresh();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du client');
      }
    }
  };

  const handleSave = async (formData: FormData) => {
    const clientData = {
      nom: formData.get('nom') as string,
      type: formData.get('type') as Client['type'],
      email: formData.get('email') as string,
      telephone: formData.get('telephone') as string,
      adresse: formData.get('adresse') as string,
      siret: formData.get('siret') as string || undefined,
      contactPrincipal: formData.get('contactPrincipal') as string,
      notes: formData.get('notes') as string
    };

    try {
      if (editingClient) {
        const updatedClient = await clientService.update(editingClient.id, clientData);
        console.log('Client mis à jour:', updatedClient);
      } else {
        const newClient = await clientService.create(clientData);
        console.log('Nouveau client créé:', newClient);
      }
      
      // Force refresh immediately
      refresh();
      
      // Le refresh est automatique grâce à l'abonnement en temps réel
      setIsModalOpen(false);
      setEditingClient(null);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement du client');
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedClient) return;

    const message = {
      id: Date.now().toString(),
      clientId: selectedClient.id,
      type: 'message',
      subject: 'Message direct',
      message: newMessage,
      date: new Date().toISOString(),
      sender: 'admin',
      status: 'sent'
    };

    setCommunications([...communications, message]);
    setNewMessage('');
  };

  const getClientProjects = (clientId: string): Chantier[] => {
    if (!chantiers) return [];
    return chantiers.filter(chantier => chantier.client_id === clientId);
  };

  const getClientInvoices = (clientId: string): Facture[] => {
    if (!factures) return [];
    return factures.filter(facture => facture.client_id === clientId);
  };

  // Calculate statistics
  const getStatistics = () => {
    const total = (clients || []).length;
    const particuliers = (clients || []).filter(c => c.type === 'particulier').length;
    const entreprises = (clients || []).filter(c => c.type === 'entreprise').length;
    const withProjects = (clients || []).filter(c => getClientProjects(c.id).length > 0).length;
    
    return { total, particuliers, entreprises, withProjects };
  };

  const stats = getStatistics();

  const getClientCommunications = (clientId: string) => {
    return communications.filter(comm => comm.clientId === clientId);
  };

  const ClientForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSave(new FormData(e.currentTarget));
    }}>
      <div className="space-y-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Informations générales
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom/Raison sociale</label>
              <input
                name="nom"
                type="text"
                required
                defaultValue={editingClient?.nom || ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="Ex: Martin Dupont ou Entreprise ABC"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                name="type"
                defaultValue={editingClient?.type || 'particulier'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              >
                <option value="particulier">Particulier</option>
                <option value="entreprise">Entreprise</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={editingClient?.email || ''}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="email@exemple.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  name="telephone"
                  type="tel"
                  required
                  defaultValue={editingClient?.telephone || ''}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="01 23 45 67 89"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Adresse et contact
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400" />
              <textarea
                name="adresse"
                rows={2}
                required
                defaultValue={editingClient?.adresse || ''}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Adresse complète"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact principal</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  name="contactPrincipal"
                  type="text"
                  required
                  defaultValue={editingClient?.contactPrincipal || ''}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Nom du contact principal"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SIRET (si entreprise)</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  name="siret"
                  type="text"
                  defaultValue={editingClient?.siret || ''}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Numéro SIRET (14 chiffres)"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Notes et informations complémentaires
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={3}
              defaultValue={editingClient?.notes || ''}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
              placeholder="Informations complémentaires, préférences, historique..."
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
          Annuler
        </Button>
        <Button type="submit">
          {editingClient ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );
  
  const ClientDetailModal = () => {
    if (!selectedClient) return null;

    const projects = getClientProjects(selectedClient.id);
    const invoices = getClientInvoices(selectedClient.id);
    const clientCommunications = getClientCommunications(selectedClient.id);

    // Calculate total invoiced amount and paid amount
    const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.montantTTC, 0);
    const totalPaid = invoices.filter(invoice => invoice.statut === 'payee').reduce((sum, invoice) => sum + invoice.montantTTC, 0);
    const paymentRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className={`bg-gradient-to-r ${
          selectedClient.type === 'entreprise' 
            ? 'from-purple-500 to-purple-600' 
            : 'from-blue-500 to-blue-600'
        } text-white rounded-lg p-6`}>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{selectedClient.nom}</h2>
              <p className="mt-1 text-blue-100">{selectedClient.contactPrincipal}</p>
              <div className="mt-3 flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedClient.type === 'entreprise' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {selectedClient.type === 'entreprise' ? 'Entreprise' : 'Particulier'}
                </span>
                <span className="ml-3 text-sm bg-white/20 px-2 py-1 rounded">
                  {projects.length} projet{projects.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="text-right">
              {invoices.length > 0 && (
                <>
                  <div className="text-3xl font-bold">{totalInvoiced.toLocaleString()} €</div>
                  <div className="text-sm text-blue-100">Total facturé</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Informations générales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-500" />
              Coordonnées
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-800">{selectedClient.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-800">{selectedClient.telephone}</span>
              </div>
              <div className="flex items-start">
                <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-1" />
                <span className="text-gray-800">{selectedClient.adresse}</span>
              </div>
              {selectedClient.siret && (
                <div className="flex items-center">
                  <Building className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-800">SIRET: {selectedClient.siret}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-purple-500" />
              Facturation
            </h3>
            {invoices.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total facturé:</span>
                  <span className="font-medium text-gray-900">{totalInvoiced.toLocaleString()} €</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Montant payé:</span>
                  <span className="font-medium text-green-600">{totalPaid.toLocaleString()} €</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Taux de paiement:</span>
                  <span className="font-medium">{paymentRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="h-2.5 rounded-full bg-green-500"
                    style={{ width: `${paymentRate}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Aucune facture pour ce client</p>
            )}
          </div>
        </div>

        {/* Projets */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-blue-500" />
            Projets ({projects.length})
          </h3>
          <div className="space-y-3">
            {projects.map(project => (
              <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{project.nom}</h4>
                    <p className="text-sm text-gray-600">{project.description}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Du {new Date(project.dateDebut).toLocaleDateString()} 
                      {project.dateFin && ` au ${new Date(project.dateFin).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={project.statut} type="chantier" />
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {project.budget.toLocaleString()} €
                    </p>
                    <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1 ml-auto">
                      <div 
                        className={`h-1.5 rounded-full ${
                          project.avancement < 30 ? 'bg-red-500' :
                          project.avancement < 70 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${project.avancement}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-gray-500 text-center py-4">Aucun projet pour ce client</p>
            )}
          </div>
        </div>

        {/* Factures */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-green-500" />
            Factures ({invoices.length})
          </h3>
          <div className="space-y-3">
            {invoices.map(invoice => (
              <div key={invoice.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900">{invoice.numero}</h4>
                    <p className="text-sm text-gray-600">
                      Émise le {new Date(invoice.dateEmission).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Échéance: {new Date(invoice.dateEcheance).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={invoice.statut} type="facture" />
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {invoice.montantTTC.toLocaleString()} €
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
              <p className="text-gray-500 text-center py-4">Aucune facture pour ce client</p>
            )}
          </div>
        </div>

        {/* Historique des communications */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-indigo-500" />
            Historique des communications ({clientCommunications.length})
          </h3>
          <div className="space-y-3">
            {clientCommunications.map(comm => (
              <div key={comm.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${
                    comm.type === 'email' ? 'bg-blue-100 text-blue-600' :
                    comm.type === 'phone' ? 'bg-green-100 text-green-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {comm.type === 'email' && <Mail className="w-4 h-4" />}
                    {comm.type === 'phone' && <Phone className="w-4 h-4" />}
                    {comm.type === 'message' && <MessageSquare className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{comm.subject}</h4>
                        <p className="text-sm text-gray-600 mt-1">{comm.message}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(comm.date).toLocaleDateString()} à {new Date(comm.date).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {clientCommunications.length === 0 && (
              <p className="text-gray-500 text-center py-4">Aucune communication enregistrée</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => handleCommunication(selectedClient)}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Communiquer
          </Button>
          <Button variant="secondary" onClick={() => handleEdit(selectedClient)}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button variant="danger" onClick={() => handleDelete(selectedClient.id)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>
    );
  };

  const CommunicationModal = () => {
    if (!selectedClient) return null;

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">Communication avec {selectedClient.nom}</h3>
          <p className="text-sm text-gray-600">{selectedClient.email}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau message</label>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            rows={4}
            placeholder="Tapez votre message ici..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => setIsCommunicationModalOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <Send className="w-4 h-4 mr-2" />
            Envoyer
          </Button>
        </div>

        {/* Historique récent */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Messages récents</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {getClientCommunications(selectedClient.id).slice(-5).map(comm => (
              <div key={comm.id} className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between items-start">
                  <p className="text-sm text-gray-900">{comm.message}</p>
                  <span className="text-xs text-gray-500">
                    {new Date(comm.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Clients</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Client
          </Button>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Particuliers</p>
              <p className="text-2xl font-bold text-green-600">{stats.particuliers}</p>
              <p className="text-xs text-gray-500">sur {stats.total} total</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <User className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Entreprises</p>
              <p className="text-2xl font-bold text-purple-600">{stats.entreprises}</p>
              <p className="text-xs text-gray-500">sur {stats.total} total</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <Building className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avec projets</p>
              <p className="text-2xl font-bold text-orange-600">{stats.withProjects}</p>
              <p className="text-xs text-gray-500">sur {stats.total} total</p>
            </div>
            <div className="p-3 rounded-full bg-orange-100">
              <Building2 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
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
                    placeholder="Rechercher un client..."
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
                    <option value="particulier">Particuliers</option>
                    <option value="entreprise">Entreprises</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort('type')}
                    >
                      <div className="flex items-center">
                        <span>Type</span>
                        {sortBy === 'type' && (
                          <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort('projets')}
                    >
                      <div className="flex items-center">
                        <span>Projets</span>
                        {sortBy === 'projets' && (
                          <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClients.map((client) => {
                    const projects = getClientProjects(client.id);
                    return (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                client.type === 'entreprise' ? 'bg-purple-500' : 'bg-blue-500'
                              }`}>
                                {client.type === 'entreprise' ? 
                                  <Building className="h-5 w-5 text-white" /> : 
                                  <User className="h-5 w-5 text-white" />
                                }
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer" onClick={() => handleViewDetails(client)}>
                                {client.nom}
                              </div>
                              <div className="text-sm text-gray-500">{client.contactPrincipal}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{client.email}</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{client.telephone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            client.type === 'entreprise' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {client.type === 'entreprise' ? 'Entreprise' : 'Particulier'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <span className="font-medium">{projects.length}</span>
                            <span className="text-gray-500 ml-1">projet(s)</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetails(client)}
                              className="text-green-600 hover:text-green-900"
                              title="Voir détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCommunication(client)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Communication"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(client)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(client.id)}
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
                {filteredClients.length === 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500 bg-gray-50">
                        Aucun client trouvé
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal de création/modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingClient(null);
        }}
        title={editingClient ? 'Modifier le client' : 'Nouveau client'}
        size="lg"
      >
        {!loading && <ClientForm />}
      </Modal>

      {/* Modal de détails */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedClient(null);
        }}
        title={`Détails - ${selectedClient?.nom}`}
        size="xl"
      >
        {selectedClient && <ClientDetailModal />}
      </Modal>

      {/* Modal de communication */}
      <Modal
        isOpen={isCommunicationModalOpen}
        onClose={() => {
          setIsCommunicationModalOpen(false);
          setSelectedClient(null);
          setNewMessage('');
        }}
        title={`Communication - ${selectedClient?.nom}`}
        size="lg"
      >
        {selectedClient && <CommunicationModal />}
      </Modal>
    </div>
  );
};