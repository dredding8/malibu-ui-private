import { WebSocketMessage } from '../hooks/useWebSocket';

/**
 * Real-time Updates Service
 * Handles WebSocket messages and coordinates with the BackgroundProcessingContext
 * to provide live status updates for collection processing
 */

export interface CollectionUpdate {
  id: string;
  name: string;
  status: 'ready' | 'processing' | 'failed' | 'cancelled';
  progress: number;
  estimatedTimeRemaining?: number;
  lastUpdated: Date;
  message?: string;
}

export interface StatusUpdateNotification {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
  collectionId?: string;
}

export class RealTimeUpdatesService {
  private subscribers: Map<string, (update: CollectionUpdate) => void> = new Map();
  private notificationSubscribers: Set<(notification: StatusUpdateNotification) => void> = new Set();

  /**
   * Subscribe to real-time updates for a specific collection
   */
  public subscribeToCollection(collectionId: string, callback: (update: CollectionUpdate) => void): () => void {
    this.subscribers.set(collectionId, callback);
    
    return () => {
      this.subscribers.delete(collectionId);
    };
  }

  /**
   * Subscribe to status update notifications
   */
  public subscribeToNotifications(callback: (notification: StatusUpdateNotification) => void): () => void {
    this.notificationSubscribers.add(callback);
    
    return () => {
      this.notificationSubscribers.delete(callback);
    };
  }

  /**
   * Process incoming WebSocket messages and update collection status
   */
  public processMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'status_update':
        this.handleStatusUpdate(message);
        break;
      case 'progress_update':
        this.handleProgressUpdate(message);
        break;
      case 'error':
        this.handleError(message);
        break;
      case 'connection_status':
        this.handleConnectionStatus(message);
        break;
      default:
        console.warn('Unknown WebSocket message type:', message);
    }
  }

  private handleStatusUpdate(message: WebSocketMessage): void {
    if (!message.collectionId || !message.status) return;

    const update: CollectionUpdate = {
      id: message.collectionId,
      name: `Collection ${message.collectionId}`, // In real implementation, this would come from the message
      status: message.status as CollectionUpdate['status'],
      progress: message.progress || 0,
      lastUpdated: new Date(message.timestamp || Date.now())
    };

    // Notify specific collection subscriber
    const subscriber = this.subscribers.get(message.collectionId);
    subscriber?.(update);

    // Generate user-friendly notification
    this.generateStatusNotification(update);
  }

  private handleProgressUpdate(message: WebSocketMessage): void {
    if (!message.collectionId || message.progress === undefined) return;

    const update: CollectionUpdate = {
      id: message.collectionId,
      name: `Collection ${message.collectionId}`,
      status: 'processing',
      progress: message.progress,
      lastUpdated: new Date(message.timestamp || Date.now()),
      estimatedTimeRemaining: this.calculateEstimatedTime(message.progress)
    };

    const subscriber = this.subscribers.get(message.collectionId);
    subscriber?.(update);

    // Notify on significant progress milestones
    if (message.progress >= 100) {
      this.notifyProgress(message.collectionId, 'Complete!', 'success');
    } else if (message.progress >= 75) {
      this.notifyProgress(message.collectionId, 'Almost done...', 'info');
    } else if (message.progress >= 50) {
      this.notifyProgress(message.collectionId, 'Halfway there', 'info');
    }
  }

  private handleError(message: WebSocketMessage): void {
    const notification: StatusUpdateNotification = {
      type: 'error',
      title: 'Processing Error',
      message: message.message || 'An error occurred during collection processing',
      collectionId: message.collectionId,
      duration: 8000
    };

    this.notifySubscribers(notification);
  }

  private handleConnectionStatus(message: WebSocketMessage): void {
    const isConnected = message.message === 'connected';
    
    const notification: StatusUpdateNotification = {
      type: isConnected ? 'success' : 'warning',
      title: isConnected ? 'Real-time Updates Active' : 'Connection Issue',
      message: isConnected 
        ? 'You\'ll receive live updates on your collections' 
        : 'Reconnecting to live updates...',
      duration: isConnected ? 3000 : 5000
    };

    this.notifySubscribers(notification);
  }

  private generateStatusNotification(update: CollectionUpdate): void {
    let notification: StatusUpdateNotification;

    switch (update.status) {
      case 'ready':
        notification = {
          type: 'success',
          title: 'Collection Ready! 🎉',
          message: `${update.name} is now ready to view and download`,
          collectionId: update.id,
          duration: 6000
        };
        break;
      case 'processing':
        notification = {
          type: 'info',
          title: 'Processing Update',
          message: `${update.name} is ${update.progress}% complete`,
          collectionId: update.id,
          duration: 4000
        };
        break;
      case 'failed':
        notification = {
          type: 'error',
          title: 'Processing Failed',
          message: `${update.name} encountered an issue and needs attention`,
          collectionId: update.id,
          duration: 8000
        };
        break;
      default:
        return;
    }

    this.notifySubscribers(notification);
  }

  private notifyProgress(collectionId: string, message: string, type: StatusUpdateNotification['type']): void {
    const notification: StatusUpdateNotification = {
      type,
      title: 'Progress Update',
      message,
      collectionId,
      duration: 3000
    };

    this.notifySubscribers(notification);
  }

  private notifySubscribers(notification: StatusUpdateNotification): void {
    this.notificationSubscribers.forEach(callback => {
      callback(notification);
    });
  }

  private calculateEstimatedTime(progress: number): number {
    if (progress <= 0) return 0;
    if (progress >= 100) return 0;
    
    // Simple estimation based on current progress
    // In a real implementation, this would use historical data
    const baseTime = 120; // 2 minutes base estimation
    const remaining = (100 - progress) / 100;
    return Math.ceil(baseTime * remaining);
  }

  /**
   * Get connection status for display
   */
  public getConnectionInfo(): { status: string; message: string } {
    return {
      status: 'active',
      message: 'Real-time updates are active'
    };
  }

  /**
   * Manual trigger for testing purposes
   */
  public simulateStatusUpdate(collectionId: string, status: CollectionUpdate['status'], progress: number = 0): void {
    const message: WebSocketMessage = {
      type: 'status_update',
      collectionId,
      status,
      progress,
      timestamp: new Date().toISOString()
    };
    
    this.processMessage(message);
  }
}

// Export singleton instance
export const realTimeUpdatesService = new RealTimeUpdatesService();