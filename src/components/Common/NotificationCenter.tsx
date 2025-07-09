import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, Info, Clock, Trash2, BookMarked as MarkAsRead } from 'lucide-react';

// Flag to completely disable automatic notifications
const DISABLE_NOTIFICATIONS = true;

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: string, id?: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  isOpen, 
  onClose, 
  onNavigate 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'warning',
      title: 'Maintenance requise',
      message: 'La pelleteuse CAT320D nécessite une maintenance dans 2 jours',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      read: false,
      actionUrl: 'materiel'
    },
    {
      id: '2',
      type: 'error',
      title: 'Conflit de planning',
      message: 'Jean Dubois est assigné à 2 chantiers simultanément le 25/01',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      actionUrl: 'planning'
    },
    {
      id: '3',
      type: 'info',
      title: 'Nouvelle facture',
      message: 'Facture FAC-2024-003 créée pour le client Martin Dubois',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      read: true,
      actionUrl: 'facturation'
    },
    {
      id: '4',
      type: 'success',
      title: 'Paiement reçu',
      message: 'Facture FAC-2024-001 payée - 18 000€',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true,
      actionUrl: 'facturation'
    },
    {
      id: '5',
      type: 'warning',
      title: 'Heures en attente',
      message: '15 saisies d\'heures en attente de validation',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: false,
      actionUrl: 'heures'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      case 'info': return Info;
      default: return Info;
    }
  };

  const getColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      onNavigate(notification.actionUrl);
      onClose();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `Il y a ${minutes} min`;
    } else if (hours < 24) {
      return `Il y a ${hours}h`;
    } else {
      return `Il y a ${days}j`;
    }
  };

  // Simulation de nouvelles notifications en temps réel
  useEffect(() => {
    if (DISABLE_NOTIFICATIONS) return;
    
    const interval = setInterval(() => {
      // Simuler une nouvelle notification de temps en temps
      if (Math.random() < 0.1) { // 10% de chance toutes les 30 secondes
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: 'info',
          title: 'Nouvelle activité',
          message: 'Une nouvelle saisie d\'heures a été créée',
          timestamp: new Date(),
          read: false,
          actionUrl: 'heures'
        };
        setNotifications(prev => [newNotification, ...prev]);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end z-50 pt-16 pr-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-blue-600 hover:text-blue-800 text-sm"
                title="Tout marquer comme lu"
              >
                <MarkAsRead className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune notification</p>
            </div>
          ) : (
            notifications.map(notification => {
              const Icon = getIcon(notification.type);
              const colorClass = getColor(notification.type);
              
              return (
                <div
                  key={notification.id}
                  className={`flex items-start p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={`p-2 rounded-full mr-3 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 hover:bg-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t bg-gray-50 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800">
            Voir toutes les notifications
          </button>
        </div>
      </div>
    </div>
  );
};