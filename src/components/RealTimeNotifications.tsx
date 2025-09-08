import React, { useState, useEffect } from 'react';
import { Callout, Intent } from '@blueprintjs/core';
import { StatusUpdateNotification } from '../services/realTimeUpdatesService';

export interface NotificationToast extends StatusUpdateNotification {
  id: string;
  timestamp: Date;
}

interface RealTimeNotificationsProps {
  onNotification?: (notification: StatusUpdateNotification) => void;
}

const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({ onNotification }) => {
  const [notifications, setNotifications] = useState<NotificationToast[]>([]);

  useEffect(() => {
    if (onNotification) {
      const unsubscribe = () => {}; // Placeholder for actual subscription
      return unsubscribe;
    }
  }, [onNotification]);

  const addNotification = (notification: StatusUpdateNotification) => {
    const toast: NotificationToast = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    setNotifications(prev => [...prev, toast]);

    // Auto-remove after duration (reduced for less prominence)
    setTimeout(() => {
      removeNotification(toast.id);
    }, notification.duration || 3000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIntent = (type: StatusUpdateNotification['type']): Intent => {
    switch (type) {
      case 'success': return Intent.SUCCESS;
      case 'warning': return Intent.WARNING;
      case 'error': return Intent.DANGER;
      case 'info': return Intent.PRIMARY;
      default: return Intent.NONE;
    }
  };

  // Expose addNotification method to parent components (for future use)
  // React.useImperativeHandle could be used here for parent component access

  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 500,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '320px'
    }}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          style={{
            animation: 'fadeInSubtle 0.2s ease-out',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            opacity: 0.9
          }}
        >
          <Callout
            intent={getIntent(notification.type)}
            title={notification.title}
          >
            {notification.message}
            {notification.collectionId && (
              <div style={{ 
                fontSize: '12px', 
                marginTop: '8px', 
                opacity: 0.7 
              }}>
                Collection: {notification.collectionId}
              </div>
            )}
          </Callout>
        </div>
      ))}
      
      {/* CSS for subtle fade-in animation */}
      <style>
        {`
          @keyframes fadeInSubtle {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 0.9;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default RealTimeNotifications;