import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="logo" role="banner">
        <span class="logo-text">IndoSwap</span>
        <span class="logo-badge">DEX</span>
      </div>
      
      <nav class="nav" role="navigation" aria-label="Main navigation">
        <button 
          type="button"
          class="nav-link"
          (click)="onNavClick('swap')">
          Swap
        </button>
        <button 
          type="button"
          class="nav-link"
          (click)="onNavClick('pool')">
          Pool
        </button>
        <button 
          type="button"
          class="nav-link"
          (click)="onNavClick('farm')">
          Farm
        </button>
        <button 
          type="button"
          class="nav-link"
          (click)="onNavClick('nft')">
          NFT
        </button>
      </nav>

      <div class="wallet-section">
        @if (isConnected()) {
          <!-- Connected state: Show portfolio value, network, and disconnect -->
          <div class="wallet-connected">
            <!-- Portfolio value with refresh button -->
            <div class="balance-display" [class.refreshing]="isRefreshingBalance()">
              <span class="balance-amount">{{ getBalanceDisplay() }}</span>
              <button 
                type="button"
                class="refresh-btn"
                (click)="onRefreshBalance()"
                [disabled]="isRefreshingBalance()"
                title="Refresh portfolio"
                aria-label="Refresh portfolio">
                {{ isRefreshingBalance() ? '⏳' : '🔄' }}
              </button>
            </div>
            
            <!-- Network status indicator -->
            <div class="network-status" [class.correct-network]="isCorrectNetwork()">
              <span class="network-indicator">{{ isCorrectNetwork() ? '🟢' : '🔴' }}</span>
              <span class="network-name">{{ getNetworkName() }}</span>
            </div>
            
            <!-- Wallet address and disconnect button -->
            <div class="wallet-info">
              <span class="wallet-address">{{ shortAddress() }}</span>
              <button 
                type="button"
                class="disconnect-btn"
                (click)="onDisconnect()"
                title="Disconnect wallet"
                aria-label="Disconnect wallet">
                ❌
              </button>
            </div>
          </div>
        } @else {
          <!-- Disconnected state: Show connect button -->
          <button 
            type="button"
            class="connect-btn"
            (click)="onConnect()"
            [disabled]="isConnecting()"
            [class.loading]="isConnecting()">
            @if (isConnecting()) {
              <span class="loading-spinner"></span>
              <span>Connecting...</span>
            } @else {
              <span>Connect Wallet</span>
            }
          </button>
        }
      </div>
    </header>
  `,
  styleUrl: './header.scss'
})
export class HeaderComponent {
  private readonly walletService = inject(WalletService);
  private readonly notificationService = inject(NotificationService);

  // Computed signals from wallet service
  readonly isConnected = this.walletService.isConnected;
  readonly isConnecting = this.walletService.isConnecting;
  readonly shortAddress = this.walletService.shortAddress;
  readonly portfolioDisplay = this.walletService.portfolioDisplay;
  readonly isCorrectNetwork = this.walletService.isCorrectNetwork;
  readonly isRefreshingBalance = this.walletService.isRefreshingBalance;

  onConnect(): void {
    this.walletService.showModal();
  }

  onDisconnect(): void {
    this.walletService.disconnectWallet();
    this.notificationService.showInfo('👋 Wallet disconnected successfully!');
  }

  async onRefreshBalance(): Promise<void> {
    try {
      await this.walletService.refreshPortfolio();
      this.notificationService.showSuccess('💰 Portfolio updated!');
    } catch (error) {
      this.notificationService.showError('Failed to refresh portfolio');
    }
  }

  onNavClick(section: string): void {
    const element = document.getElementById(section);
    element?.scrollIntoView({ behavior: 'smooth' });
  }

  getBalanceDisplay(): string {
    const portfolioValue = this.portfolioDisplay();
    if (portfolioValue === '$0.00') return '$0.00';
    return portfolioValue;
  }

  getNetworkName(): string {
    return this.walletService.getNetworkName();
  }
} 