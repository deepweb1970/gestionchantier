import React from 'react';
import { Building2, Users, Wrench, FileText, TrendingUp, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const stats = [
    {
      title: 'Chantiers Actifs',
      value: '12',
      change: '+2',
      changeType: 'positive',
      icon: Building2,
      color: 'bg-blue-500'
    },
    {
      title: 'Ouvriers Disponibles',
      value: '28',
      change: '-3',
      changeType: 'negative',
      icon: Users,
      color: 'bg-green-500'
    },
    {
      title: 'Matériel en Service',
      value: '45',
      change: '+5',
      changeType: 'positive',
      icon: Wrench,
      color: 'bg-orange-500'
    },
    {
      title: 'Factures en Attente',
      value: '8',
      change: '-2',
      changeType: 'positive',
      icon: FileText,
      color: 'bg-purple-500'
    }
  ];

  const recentActivities = [
    { id: 1, type: 'chantier', message: 'Nouveau chantier "Villa Moderne" créé', time: '2h' },
    { id: 2, type: 'ouvrier', message: 'Jean Dubois a pointé sur le chantier', time: '3h' },
    { id: 3, type: 'materiel', message: 'Maintenance programmée pour la pelleteuse', time: '5h' },
    { id: 4, type: 'facture', message: 'Facture FAC-2024-001 payée', time: '1j' }
  ];

  const alerts = [
    { id: 1, type: 'warning', message: 'Maintenance requise pour la grue mobile', priority: 'high' },
    { id: 2, type: 'info', message: '3 factures arrivent à échéance cette semaine', priority: 'medium' },
    { id: 3, type: 'success', message: 'Chantier "Extension Maison" terminé', priority: 'low' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Tableau de Bord</h1>
        <div className="text-sm text-gray-500">
          Dernière mise à jour: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">ce mois</span>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Activités Récentes</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'chantier' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'ouvrier' ? 'bg-green-100 text-green-600' :
                      activity.type === 'materiel' ? 'bg-orange-100 text-orange-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {activity.type === 'chantier' && <Building2 className="w-4 h-4" />}
                      {activity.type === 'ouvrier' && <Users className="w-4 h-4" />}
                      {activity.type === 'materiel' && <Wrench className="w-4 h-4" />}
                      {activity.type === 'facture' && <FileText className="w-4 h-4" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">Il y a {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Alertes</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg border-l-4 ${
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                  alert.type === 'info' ? 'bg-blue-50 border-blue-400' :
                  'bg-green-50 border-green-400'
                }`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                      {alert.type === 'info' && <Clock className="w-5 h-5 text-blue-600" />}
                      {alert.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        alert.type === 'warning' ? 'text-yellow-800' :
                        alert.type === 'info' ? 'text-blue-800' :
                        'text-green-800'
                      }`}>
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Priorité: {alert.priority === 'high' ? 'Haute' : alert.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Preview */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Aperçu des Performances</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">75%</div>
              <div className="text-sm text-gray-600">Taux d'occupation</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">€127,850</div>
              <div className="text-sm text-gray-600">Chiffre d'affaires ce mois</div>
              <div className="flex items-center justify-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">+12%</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">94%</div>
              <div className="text-sm text-gray-600">Matériel opérationnel</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};