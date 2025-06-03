import { Component, inject, signal } from '@angular/core';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';
import { ButtonComponent } from '../shared/button/button.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <header class="header">
      <div class="logo">
        <div class="logo-text-container">
          <div class="logo-text">IndoSwap</div>
        </div>
      </div>

      <nav class="nav">
        <a href="#swap" class="nav-link">
          <span>🔄 Swap</span>
        </a>
        <a href="#pool" class="nav-link">
          <span>💧 Pool</span>
        </a>
        <a href="#stake" class="nav-link">
          <span>⚡ Stake</span>
        </a>
        <a href="#governance" class="nav-link">
          <span>🏛️ Governance</span>
        </a>
      </nav>

      <div class="wallet-section">
        @if (walletService.isConnected()) {
          <app-button 
            variant="secondary"
            size="medium"
            icon="🔗"
            (clicked)="disconnectWallet()"
            ariaLabel="Disconnect wallet"
          >
            {{ walletService.shortAddress() }}
          </app-button>
        } @else {
          <app-button 
            variant="primary"
            size="medium"
            icon="🤖"
            [disabled]="walletService.isLoading()"
            [loading]="walletService.isLoading()"
            (clicked)="connectWallet()"
            ariaLabel="Connect your wallet"
          >
            @if (walletService.isLoading()) {
              Connecting...
            } @else {
              Connect Wallet
            }
          </app-button>
        }
      </div>
    </header>
  `,
  styleUrl: './header.scss'
})
export class HeaderComponent {
  // Modern Angular dependency injection with inject function
  protected readonly walletService = inject(WalletService);
  private readonly notificationService = inject(NotificationService);

  // Component state with signals
  protected readonly isMenuOpen = signal<boolean>(false);

  async connectWallet(): Promise<void> {
    try {
      await this.walletService.connectWallet();
      this.notificationService.showSuccess('Wallet connected successfully!');
    } catch (error) {
      this.notificationService.showError('Failed to connect wallet. Please try again.');
    }
  }

  disconnectWallet(): void {
    this.walletService.disconnectWallet();
    this.notificationService.showInfo('Wallet disconnected');
  }

  toggleMenu(): void {
    this.isMenuOpen.update(isOpen => !isOpen);
  }
}
