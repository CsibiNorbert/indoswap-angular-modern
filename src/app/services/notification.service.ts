import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationData } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // BehaviorSubject for compatibility
  private notificationSubject = new BehaviorSubject<NotificationData | null>(null);
  
  // Modern Angular signal
  private readonly _notification = signal<NotificationData | null>(null);

  // Observable for reactive programming
  notification$: Observable<NotificationData | null> = this.notificationSubject.asObservable();

  // Read-only signal access
  readonly notification = this._notification.asReadonly();

  show(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000): void {
    const notification: NotificationData = {
      message,
      type,
      duration
    };

    // Update both subject and signal
    this.notificationSubject.next(notification);
    this._notification.set(notification);

    // Auto-hide notification
    if (duration > 0) {
      setTimeout(() => {
        this.hide();
      }, duration);
    }
  }

  hide(): void {
    this.notificationSubject.next(null);
    this._notification.set(null);
  }

  // Convenience methods
  showSuccess(message: string, duration: number = 3000): void {
    this.show(message, 'success', duration);
  }

  showError(message: string, duration: number = 5000): void {
    this.show(message, 'error', duration);
  }

  showInfo(message: string, duration: number = 3000): void {
    this.show(message, 'info', duration);
  }
} 