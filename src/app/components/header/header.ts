import { Component, inject, signal } from '@angular/core';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  template: `
    <header class="header">
      <div class="container">
        <div class="header__logo">
          <h1>IndoSwap</h1>
        </div>
        
        <nav class="header__nav">
          <ul>
            <li><a href="#swap">Swap</a></li>
            <li><a href="#pool">Pool</a></li>
            <li><a href="#stake">Stake</a></li>
            <li><a href="#governance">Governance</a></li>
          </ul>
        </nav>
        
        <div class="header__wallet">
          @if (walletService.isConnected()) {
            <div class="wallet-info">
              <span class="wallet-address">{{ walletService.shortAddress() }}</span>
              <button 
                class="btn btn--secondary"
                (click)="disconnectWallet()"
              >
                Disconnect
              </button>
            </div>
          } @else {
            <button 
              class="btn btn--primary"
              [disabled]="walletService.isLoading()"
              (click)="connectWallet()"
            >
              @if (walletService.isLoading()) {
                Connecting...
              } @else {
                Connect Wallet
              }
            </button>
          }
        </div>
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
