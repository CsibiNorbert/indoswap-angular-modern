import { Component, inject, signal } from '@angular/core';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  template: `
    <header class="header">
      <div class="logo">
        <div class="logo-icon">
          <img 
            src="/images/coins/coin.jpg" 
            alt="Robo Coin" 
            class="logo-coin"
          />
        </div>
        <div class="logo-text-container">
          <div class="logo-text">IndoSwap</div>
          <div class="logo-badge">Robo DeFi</div>
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
          <button 
            class="connect-wallet connected"
            (click)="disconnectWallet()"
          >
            <span class="wallet-icon">🔗</span>
            <span>{{ walletService.shortAddress() }}</span>
          </button>
        } @else {
          <button 
            class="connect-wallet"
            [class.connecting]="walletService.isLoading()"
            [disabled]="walletService.isLoading()"
            (click)="connectWallet()"
          >
            <div class="wallet-glow"></div>
            <span class="wallet-icon">🤖</span>
            <span>
              @if (walletService.isLoading()) {
                Connecting...
              } @else {
                Connect Wallet
              }
            </span>
          </button>
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
