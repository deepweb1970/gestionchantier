import React, { useState } from 'react';
import { Plus, Edit, Trash2, User, Shield, Key, Eye, EyeOff, Clock, Settings, Download, Filter, Search, Mail, Phone, Calendar, AlertTriangle, CheckCircle, Lock, Unlock, UserCheck, UserX, Smartphone, QrCode, Copy, RefreshCw } from 'lucide-react';
import { mockUtilisateurs } from '../../data/mockData';
import { Utilisateur } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { StatusBadge } from '../Common/StatusBadge';

interface HistoriqueConnexion {
  id: string;
  utilisateurId: string;
  dateConnexion: string;
  adresseIP: string;
  navigateur: string;
  appareil: string;
  succes: boolean;
}

interface ParametreSecurite {
  motDePasseComplexe: boolean;
  doubleAuthentification: boolean;
  sessionTimeout: number;
  tentativesMaxConnexion: number;
  verrouillageCompte: boolean;
}

export const Utilisateurs: React.FC = () => {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>(mockUtilisateurs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingUtilisateur, setEditingUtilisateur] = useState<Utilisateur | null>(null);
  const [selectedUtilisateur, setSelectedUtilisateur] = useState<Utilisateur | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPassword, setShowPassword] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  
  const [historiqueConnexions] = useState<HistoriqueConnexion[]>([
    {
      id: '1',
      utilisateurId: '1',
      dateConnexion: '2024-01-15T10:30:00',
      adresseIP: '192.168.1.100',
      navigateur: 'Chrome 120.0',
      appareil: 'Windows 11',
      succes: true
    },
    {
      id: '2',
      utilisateurId: '1',
      dateConnexion: '2024-01-15T09:15:00',
      adresseIP: '192.168.1.100',
      navigateur: 'Chrome 120.0',
      appareil: 'Windows 11',
      succes: true
    },
    {
      id: '3',
      utilisateurId: '2',
      dateConnexion: '2024-01-14T16:45:00',
      adresseIP: '10.0.0.50',
      navigateur: 'Firefox 121.0',
      appareil: 'macOS 14',
      succes: true
    },
    {
      id: '4',
      utilisateurId: '1',
      dateConnexion: '2024-01-14T08:20:00',
      adresseIP: '203.0.113.1',
      navigateur: 'Chrome 120.0',
      appareil: 'Android 14',
      succes: false
    }
  ]);

  const [parametresSecurite, setParametresSecurite] = useState<ParametreSecurite>({
    motDePasseComplexe: true,
    doubleAuthentification: false,
    sessionTimeout: 30,
    tentativesMaxConnexion: 3,
    verrouillageCompte: true
  });

  const permissions = [
    { id: 'read', label: 'Lecture', description: 'Consulter les données' },
    { id: 'write', label: 'Écriture', description: 'Modifier les données' },
    { id: 'delete', label: 'Suppression', description: 'Supprimer les données' },
    { id: 'manage_users', label: 'Gestion utilisateurs', description: 'Gérer les comptes utilisateurs' },
    { id: 'manage_workers', label: 'Gestion ouvriers', description: 'Gérer les ouvriers' },
    { id: 'manage_projects', label: 'Gestion projets', description: 'Gérer les chantiers' },
    { id: 'manage_equipment', label: 'Gestion matériel', description: 'Gérer le matériel' },
    { id: 'manage_clients', label: 'Gestion clients', description: 'Gérer les clients' },
    { id: 'manage_invoices', label: 'Gestion facturation', description: 'Gérer la facturation' },
    { id: 'view_reports', label: 'Consultation rapports', description: 'Consulter les rapports' },
    { id: 'create_reports', label: 'Création rapports', description: 'Créer des rapports' },
    { id: 'admin_settings', label: 'Administration', description: 'Paramètres système' }
  ];

  const rolePermissions = {
    admin: ['read', 'write', 'delete', 'manage_users', 'manage_workers', 'manage_projects', 'manage_equipment', 'manage_clients', 'manage_invoices', 'view_reports', 'create_reports', 'admin_settings'],
    manager: ['read', 'write', 'manage_workers', 'manage_projects', 'manage_equipment', 'manage_clients', 'manage_invoices', 'view_reports', 'create_reports'],
    employe: ['read', 'view_reports']
  };

  const filteredUtilisateurs = utilisateurs.filter(utilisateur => {
    const matchesSearch = utilisateur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         utilisateur.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         utilisateur.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || utilisateur.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'actif' && utilisateur.actif) ||
                         (statusFilter === 'inactif' && !utilisateur.actif);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleEdit = (utilisateur: Utilisateur) => {
    setEditingUtilisateur(utilisateur);
    setIsModalOpen(true);
  };

  const handleViewDetails = (utilisateur: Utilisateur) => {
    setSelectedUtilisateur(utilisateur);
    setIsDetailModalOpen(true);
  };

  const handleSecurity = (utilisateur: Utilisateur) => {
    setSelectedUtilisateur(utilisateur);
    setIsSecurityModalOpen(true);
  };

  const handle2FA = (utilisateur: Utilisateur) => {
    setSelectedUtilisateur(utilisateur);
    generateQRCode();
    generateBackupCodes();
    setIs2FAModalOpen(true);
  };

  const handleHistory = (utilisateur: Utilisateur) => {
    setSelectedUtilisateur(utilisateur);
    setIsHistoryModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      setUtilisateurs(utilisateurs.filter(u => u.id !== id));
    }
  };

  const toggleUserStatus = (id: string) => {
    setUtilisateurs(utilisateurs.map(u => 
      u.id === id ? { ...u, actif: !u.actif } : u
    ));
  };

  const resetPassword = (id: string) => {
    const newPassword = generatePassword();
    alert(`Nouveau mot de passe généré pour l'utilisateur: ${newPassword}`);
    // Ici on enverrait le mot de passe par email
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const generateQRCode = () => {
    // Simulation d'un QR code pour l'authentification 2FA
    setQrCode('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0Ij5RUiBDb2RlPC90ZXh0Pgo8L3N2Zz4K');
  };

  const generateBackupCodes = () => {
    const codes = [];
    for (let i = 0; i < 8; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    setBackupCodes(codes);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copié dans le presse-papiers');
  };

  const handleSave = (formData: FormData) => {
    const selectedPermissions = permissions
      .filter(p => formData.get(`permission_${p.id}`))
      .map(p => p.id);

    const utilisateurData: Utilisateur = {
      id: editingUtilisateur?.id || Date.now().toString(),
      nom: formData.get('nom') as string,
      prenom: formData.get('prenom') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as Utilisateur['role'],
      dernierConnexion: editingUtilisateur?.dernierConnexion || new Date().toISOString(),
      actif: formData.get('actif') === 'on',
      permissions: selectedPermissions
    };

    if (editingUtilisateur) {
      setUtilisateurs(utilisateurs.map(u => u.id === editingUtilisateur.id ? utilisateurData : u));
    } else {
      setUtilisateurs([...utilisateurs, utilisateurData]);
    }
    
    setIsModalOpen(false);
    setEditingUtilisateur(null);
  };

  const getDefaultPermissions = (role: string) => {
    return rolePermissions[role as keyof typeof rolePermissions] || [];
  };

  const getUserConnections = (userId: string) => {
    return historiqueConnexions.filter(h => h.utilisateurId === userId);
  };

  const getSecurityStats = () => {
    const totalUsers = utilisateurs.length;
    const activeUsers = utilisateurs.filter(u => u.actif).length;
    const adminUsers = utilisateurs.filter(u => u.role === 'admin').length;
    const recentConnections = historiqueConnexions.filter(h => {
      const connectionDate = new Date(h.dateConnexion);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return connectionDate > yesterday;
    }).length;

    return { totalUsers, activeUsers, adminUsers, recentConnections };
  };

  const UtilisateurForm = () => {
    const [selectedRole, setSelectedRole] = useState(editingUtilisateur?.role || 'employe');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
      editingUtilisateur?.permissions || getDefaultPermissions(selectedRole)
    );

    const handleRoleChange = (role: string) => {
      setSelectedRole(role);
      setSelectedPermissions(getDefaultPermissions(role));
    };

    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        selectedPermissions.forEach(permission => {
          formData.set(`permission_${permission}`, 'on');
        });
        handleSave(formData);
      }}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                name="nom"
                type="text"
                required
                defaultValue={editingUtilisateur?.nom || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input
                name="prenom"
                type="text"
                required
                defaultValue={editingUtilisateur?.prenom || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              defaultValue={editingUtilisateur?.email || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!editingUtilisateur && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
            <select
              name="role"
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="employe">Employé</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          <div>
            <label className="flex items-center">
              <input
                name="actif"
                type="checkbox"
                defaultChecked={editingUtilisateur?.actif !== false}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Compte actif</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
            <div className="space-y-3 max-h-64 overflow-y-auto border rounded-md p-4">
              {permissions.map(permission => (
                <label key={permission.id} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(permission.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPermissions([...selectedPermissions, permission.id]);
                      } else {
                        setSelectedPermissions(selectedPermissions.filter(p => p !== permission.id));
                      }
                    }}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{permission.label}</div>
                    <div className="text-sm text-gray-500">{permission.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
            Annuler
          </Button>
          <Button type="submit">
            {editingUtilisateur ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </form>
    );
  };

  const DetailModal = () => {
    if (!selectedUtilisateur) return null;

    const connections = getUserConnections(selectedUtilisateur.id);
    const lastConnection = connections[0];

    return (
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Informations générales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nom complet</p>
              <p className="font-medium">{selectedUtilisateur.prenom} {selectedUtilisateur.nom}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{selectedUtilisateur.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Rôle</p>
              <p className="font-medium capitalize">{selectedUtilisateur.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Statut</p>
              <div className="mt-1">
                {selectedUtilisateur.actif ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Actif
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Inactif
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Dernière connexion</p>
              <p className="font-medium">
                {new Date(selectedUtilisateur.dernierConnexion).toLocaleString()}
              </p>
            </div>
            {lastConnection && (
              <div>
                <p className="text-sm text-gray-600">Dernière IP</p>
                <p className="font-medium">{lastConnection.adresseIP}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {permissions.map(permission => (
              <div key={permission.id} className={`flex items-center space-x-2 p-2 rounded ${
                selectedUtilisateur.permissions.includes(permission.id) 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-gray-50 text-gray-500'
              }`}>
                {selectedUtilisateur.permissions.includes(permission.id) ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <div className="w-4 h-4 border border-gray-300 rounded" />
                )}
                <span className="text-sm">{permission.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Connexions récentes</h3>
          <div className="space-y-2">
            {connections.slice(0, 5).map(connection => (
              <div key={connection.id} className="flex items-center justify-between p-3 bg-white border rounded">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${connection.succes ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(connection.dateConnexion).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {connection.navigateur} - {connection.appareil}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{connection.adresseIP}</p>
                  <p className={`text-xs ${connection.succes ? 'text-green-600' : 'text-red-600'}`}>
                    {connection.succes ? 'Succès' : 'Échec'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const SecurityModal = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <Shield className="w-5 h-5 text-blue-600 mr-2" />
          <p className="text-sm text-blue-800">
            Configuration de la sécurité globale du système
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Mot de passe complexe</h4>
            <p className="text-sm text-gray-600">Exiger des mots de passe forts</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={parametresSecurite.motDePasseComplexe}
              onChange={(e) => setParametresSecurite({
                ...parametresSecurite,
                motDePasseComplexe: e.target.checked
              })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Double authentification</h4>
            <p className="text-sm text-gray-600">Activer la 2FA pour tous les utilisateurs</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={parametresSecurite.doubleAuthentification}
              onChange={(e) => setParametresSecurite({
                ...parametresSecurite,
                doubleAuthentification: e.target.checked
              })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Verrouillage de compte</h4>
            <p className="text-sm text-gray-600">Verrouiller après plusieurs tentatives échouées</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={parametresSecurite.verrouillageCompte}
              onChange={(e) => setParametresSecurite({
                ...parametresSecurite,
                verrouillageCompte: e.target.checked
              })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="p-4 border rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Timeout de session (minutes)</h4>
          <input
            type="number"
            min="5"
            max="480"
            value={parametresSecurite.sessionTimeout}
            onChange={(e) => setParametresSecurite({
              ...parametresSecurite,
              sessionTimeout: parseInt(e.target.value)
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="p-4 border rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Tentatives max de connexion</h4>
          <input
            type="number"
            min="1"
            max="10"
            value={parametresSecurite.tentativesMaxConnexion}
            onChange={(e) => setParametresSecurite({
              ...parametresSecurite,
              tentativesMaxConnexion: parseInt(e.target.value)
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button variant="secondary" onClick={() => setIsSecurityModalOpen(false)}>
          Annuler
        </Button>
        <Button onClick={() => setIsSecurityModalOpen(false)}>
          <Shield className="w-4 h-4 mr-2" />
          Sauvegarder
        </Button>
      </div>
    </div>
  );

  const TwoFactorModal = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Smartphone className="w-16 h-16 mx-auto text-blue-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Configuration de la double authentification</h3>
        <p className="text-gray-600">Sécurisez votre compte avec l'authentification à deux facteurs</p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Étape 1: Scanner le QR Code</h4>
        <div className="flex justify-center mb-4">
          {qrCode && (
            <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48 border rounded-lg" />
          )}
        </div>
        <p className="text-sm text-gray-600 text-center">
          Scannez ce code avec votre application d'authentification (Google Authenticator, Authy, etc.)
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Étape 2: Codes de récupération</h4>
        <p className="text-sm text-gray-600 mb-3">
          Sauvegardez ces codes de récupération dans un endroit sûr. Ils vous permettront d'accéder à votre compte si vous perdez votre appareil.
        </p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {backupCodes.map((code, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white border rounded">
              <span className="font-mono text-sm">{code}</span>
              <button
                onClick={() => copyToClipboard(code)}
                className="text-blue-600 hover:text-blue-800"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => copyToClipboard(backupCodes.join('\n'))}
        >
          <Copy className="w-4 h-4 mr-2" />
          Copier tous les codes
        </Button>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Étape 3: Vérification</h4>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Entrez le code à 6 chiffres"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button>
            Vérifier
          </Button>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button variant="secondary" onClick={() => setIs2FAModalOpen(false)}>
          Annuler
        </Button>
        <Button onClick={() => setIs2FAModalOpen(false)}>
          <QrCode className="w-4 h-4 mr-2" />
          Activer 2FA
        </Button>
      </div>
    </div>
  );

  const HistoryModal = () => {
    if (!selectedUtilisateur) return null;

    const connections = getUserConnections(selectedUtilisateur.id);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Historique des connexions - {selectedUtilisateur.prenom} {selectedUtilisateur.nom}
          </h3>
          <Button variant="secondary" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>

        <div className="space-y-3">
          {connections.map(connection => (
            <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${connection.succes ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {new Date(connection.dateConnexion).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    <span>IP: {connection.adresseIP}</span>
                    <span>{connection.navigateur}</span>
                    <span>{connection.appareil}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  connection.succes 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {connection.succes ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Succès
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Échec
                    </>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>

        {connections.length === 0 && (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Aucune connexion enregistrée</p>
          </div>
        )}
      </div>
    );
  };

  const stats = getSecurityStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Utilisateurs</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setIsSecurityModalOpen(true)} variant="secondary">
            <Shield className="w-4 h-4 mr-2" />
            Sécurité
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvel Utilisateur
          </Button>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Statistiques de sécurité */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Utilisateurs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Utilisateurs Actifs</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Administrateurs</p>
              <p className="text-2xl font-bold text-purple-600">{stats.adminUsers}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-500">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Connexions 24h</p>
              <p className="text-2xl font-bold text-orange-600">{stats.recentConnections}</p>
            </div>
            <div className="p-3 rounded-full bg-orange-500">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les rôles</option>
                <option value="admin">Administrateur</option>
                <option value="manager">Manager</option>
                <option value="employe">Employé</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="actif">Actifs</option>
                <option value="inactif">Inactifs</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dernière connexion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUtilisateurs.map((utilisateur) => (
                <tr key={utilisateur.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          utilisateur.role === 'admin' ? 'bg-red-500' :
                          utilisateur.role === 'manager' ? 'bg-blue-500' :
                          'bg-green-500'
                        }`}>
                          <User className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {utilisateur.prenom} {utilisateur.nom}
                        </div>
                        <div className="text-sm text-gray-500">{utilisateur.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      utilisateur.role === 'admin' ? 'bg-red-100 text-red-800' :
                      utilisateur.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {utilisateur.role === 'admin' ? 'Administrateur' :
                       utilisateur.role === 'manager' ? 'Manager' :
                       'Employé'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {utilisateur.actif ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <UserX className="w-3 h-3 mr-1" />
                        Inactif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-gray-400" />
                      {new Date(utilisateur.dernierConnexion).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="text-gray-600">{utilisateur.permissions.length} permission(s)</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(utilisateur)}
                        className="text-green-600 hover:text-green-900"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleHistory(utilisateur)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Historique"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handle2FA(utilisateur)}
                        className="text-orange-600 hover:text-orange-900"
                        title="2FA"
                      >
                        <Smartphone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleUserStatus(utilisateur.id)}
                        className={utilisateur.actif ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                        title={utilisateur.actif ? "Désactiver" : "Activer"}
                      >
                        {utilisateur.actif ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => resetPassword(utilisateur.id)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Réinitialiser mot de passe"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(utilisateur)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(utilisateur.id)}
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
          </table>
        </div>
      </div>

      {/* Modal de création/modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUtilisateur(null);
        }}
        title={editingUtilisateur ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        size="xl"
      >
        <UtilisateurForm />
      </Modal>

      {/* Modal de détails */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedUtilisateur(null);
        }}
        title={`Profil - ${selectedUtilisateur?.prenom} ${selectedUtilisateur?.nom}`}
        size="xl"
      >
        <DetailModal />
      </Modal>

      {/* Modal de sécurité */}
      <Modal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        title="Paramètres de Sécurité"
        size="lg"
      >
        <SecurityModal />
      </Modal>

      {/* Modal 2FA */}
      <Modal
        isOpen={is2FAModalOpen}
        onClose={() => setIs2FAModalOpen(false)}
        title="Double Authentification"
        size="lg"
      >
        <TwoFactorModal />
      </Modal>

      {/* Modal historique */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSelectedUtilisateur(null);
        }}
        title="Historique des Connexions"
        size="xl"
      >
        <HistoryModal />
      </Modal>
    </div>
  );
};