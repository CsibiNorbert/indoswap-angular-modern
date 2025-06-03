import { Injectable, signal, computed } from '@angular/core';
import { NotificationData } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // Modern Angular signals for reactive state management
  private readonly _notifications = signal<NotificationData[]>([]);

  // Public readonly access to notifications
  readonly notifications = this._notifications.asReadonly();
  readonly hasNotifications = computed(() => this._notifications().length > 0);
  readonly unreadCount = computed(() => this._notifications().length);

  showNotification(
    type: NotificationData['type'],
    message: string,
    autoClose: boolean = true
  ): void {
    const notification: NotificationData = {
      id: this.generateId(),
      type,
      message,
      timestamp: new Date(),
      autoClose
    };

    // Add notification to the beginning of the array
    this._notifications.update(notifications => [notification, ...notifications]);

    // Auto-close notification after 5 seconds if autoClose is true
    if (autoClose) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, 5000);
    }
  }

  removeNotification(id: string): void {
    this._notifications.update(notifications => 
      notifications.filter(notification => notification.id !== id)
    );
  }

  clearAllNotifications(): void {
    this._notifications.set([]);
  }

  // Convenience methods for different notification types
  showSuccess(message: string, autoClose: boolean = true): void {
    this.showNotification('success', message, autoClose);
  }

  showError(message: string, autoClose: boolean = false): void {
    this.showNotification('error', message, autoClose);
  }

  showWarning(message: string, autoClose: boolean = true): void {
    this.showNotification('warning', message, autoClose);
  }

  showInfo(message: string, autoClose: boolean = true): void {
    this.showNotification('info', message, autoClose);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
} 