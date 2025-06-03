import { Component, inject } from '@angular/core';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [],
  template: `
    <div class="notification-container">
      @for (notification of notificationService.notifications(); track notification.id) {
        <div 
          class="notification notification--{{ notification.type }}"
          [attr.aria-live]="notification.type === 'error' ? 'assertive' : 'polite'"
          role="alert"
        >
          <div class="notification__content">
            <div class="notification__icon">
              @switch (notification.type) {
                @case ('success') { ✅ }
                @case ('error') { ❌ }
                @case ('warning') { ⚠️ }
                @case ('info') { ℹ️ }
              }
            </div>
            <div class="notification__message">
              {{ notification.message }}
            </div>
            <button 
              class="notification__close"
              (click)="removeNotification(notification.id)"
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './notification.scss'
})
export class NotificationComponent {
  // Modern Angular dependency injection with inject function
  protected readonly notificationService = inject(NotificationService);

  removeNotification(id: string): void {
    this.notificationService.removeNotification(id);
  }
}
