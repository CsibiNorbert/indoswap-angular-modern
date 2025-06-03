import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent {
  private readonly walletService = inject(WalletService);
  private readonly notificationService = inject(NotificationService);

  // Computed signals from services
  readonly isConnected = this.walletService.isConnected;
  readonly isConnecting = this.walletService.isConnecting;
  readonly shortAddress = this.walletService.shortAddress;

  readonly buttonText = computed(() => {
    if (this.isConnecting()) return 'Connecting...';
    if (this.isConnected()) return this.shortAddress();
    return 'Connect Wallet';
  });

  readonly buttonClass = computed(() => ({
    'connect-wallet': true,
    'connected': this.isConnected(),
    'connecting': this.isConnecting()
  }));

  onWalletToggle(): void {
    try {
      if (this.isConnected()) {
        this.walletService.disconnectWallet();
        this.notificationService.showInfo('Wallet disconnected');
      } else {
        // Show the wallet selection modal instead of connecting directly
        this.walletService.showModal();
      }
    } catch (error) {
      this.notificationService.showError('Wallet operation failed');
    }
  }

  onNavClick(section: string): void {
    const element = document.getElementById(section);
    element?.scrollIntoView({ behavior: 'smooth' });
  }
} 