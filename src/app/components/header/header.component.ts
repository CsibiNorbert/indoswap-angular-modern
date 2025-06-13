import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';
import { PriceService } from '../../services/price.service';

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

        <!-- Wallet Section -->
        <div class="wallet-section">
          <!-- Connected State -->
          <div class="wallet-connected" *ngIf="isConnected()">
            <!-- Portfolio Balance -->
            <div class="balance-section">
              <span class="balance-amount" [title]="getBalanceTooltip()">{{ portfolioDisplay() }}</span>
              <button 
                type="button"
                class="refresh-btn"
                (click)="onRefreshBalance()"
                [disabled]="isRefreshingBalance()"
                title="Refresh multi-chain portfolio balance">
                <span *ngIf="isRefreshingBalance()" class="spinner">⟳</span>
                <span *ngIf="!isRefreshingBalance()">🔄</span>
              </button>
            </div>

            <!-- Network -->
            <div class="network-section">
              <span class="network-dot">🌐</span>
              <span class="network-name">{{ portfolioLabel() }}</span>
            </div>

            <!-- Address & Disconnect -->
            <div class="address-section">
              <span class="wallet-address">{{ shortAddress() }}</span>
              <button 
                type="button"
                class="disconnect-btn"
                (click)="onDisconnect()"
                title="Disconnect wallet">
                ❌
              </button>
            </div>
          </div>

          <!-- Disconnected State -->
          <button 
            type="button"
            class="connect-btn"
            *ngIf="!isConnected()"
            [disabled]="isConnecting()"
            (click)="onConnect()">
            <span *ngIf="isConnecting()">⏳ Connecting...</span>
            <span *ngIf="!isConnecting()">Connect Wallet</span>
          </button>
        </div>
      </nav>
    </header>
  `,
  styles: [`
    .header {
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      backdrop-filter: blur(20px);
      background: rgba(255, 255, 255, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .logo-text {
      font-size: 1.8rem;
      font-weight: 800;
      background: linear-gradient(45deg, #FFD700, #FFA500);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .logo-badge {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.2rem 0.4rem;
      background: linear-gradient(45deg, #ff6b6b, #ee5a24);
      border-radius: 6px;
      color: white;
      text-transform: uppercase;
    }

    .nav {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .nav-link {
      background: none;
      border: none;
      color: white;
      padding: 0.7rem 1.2rem;
      border-radius: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .nav-link:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }

    .wallet-section {
      margin-left: 1rem;
    }

    .wallet-connected {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }

    .balance-section {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .balance-amount {
      font-weight: 600;
      color: #FFD700;
      font-size: 0.9rem;
      font-family: 'Courier New', monospace;
      min-width: 70px;
      cursor: help;
    }

    .refresh-btn {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      padding: 0.2rem;
      border-radius: 4px;
      transition: all 0.3s ease;
      font-size: 0.7rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .refresh-btn:hover:not(:disabled) {
      color: #FFD700;
      transform: scale(1.1);
    }

    .refresh-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .network-section {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.8rem;
      padding: 0.25rem 0.5rem;
      border-radius: 8px;
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .network-section.correct-network {
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .network-dot {
      font-size: 0.6rem;
    }

    .network-name {
      color: white;
      font-weight: 500;
      white-space: nowrap;
    }

    .address-section {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .wallet-address {
      color: white;
      font-family: 'Courier New', monospace;
      font-weight: 600;
      font-size: 0.85rem;
    }

    .disconnect-btn {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      padding: 0.2rem;
      border-radius: 4px;
      transition: all 0.3s ease;
      font-size: 0.7rem;
    }

    .disconnect-btn:hover {
      color: #ff6b6b;
      background: rgba(255, 107, 107, 0.1);
      transform: scale(1.1);
    }

    .connect-btn {
      background: linear-gradient(45deg, #ff6b6b, #ee5a24);
      padding: 0.8rem 1.5rem;
      border: none;
      border-radius: 16px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(238, 90, 36, 0.3);
      min-width: 140px;
    }

    .connect-btn:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(238, 90, 36, 0.4);
    }

    .connect-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    @media (max-width: 968px) {
      .header {
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
      }

      .nav {
        gap: 0.5rem;
        flex-wrap: wrap;
        justify-content: center;
      }

      .wallet-connected {
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: center;
      }
    }
  `]
})
export class HeaderComponent {
  private readonly walletService = inject(WalletService);
  private readonly notificationService = inject(NotificationService);
  private readonly priceService = inject(PriceService);

  // Computed signals from wallet service
  readonly isConnected = this.walletService.isConnected;
  readonly isConnecting = this.walletService.isConnecting;
  readonly shortAddress = this.walletService.shortAddress;
  readonly portfolioDisplay = this.walletService.portfolioDisplay;
  readonly isRefreshingBalance = this.walletService.isRefreshingBalance;
  readonly balance = this.walletService.balance;
  readonly isCorrectNetwork = this.walletService.isCorrectNetwork;
  readonly isUpdatingBalances = this.walletService.isUpdatingBalances;
  
  // Show multi-chain portfolio label
  readonly portfolioLabel = computed(() => {
    return this.isConnected() ? 'Multi-Chain Portfolio' : 'Portfolio';
  });

  onConnect(): void {
    this.walletService.showModal();
  }

  onDisconnect(): void {
    this.walletService.disconnectWallet();
    this.notificationService.showInfo('👋 Wallet disconnected successfully!');
  }

  async onRefreshBalance(): Promise<void> {
    if (!this.isConnected()) {
      this.notificationService.showError('Wallet not connected');
      return;
    }

    try {
      await this.walletService.updateBalance();
      this.notificationService.showSuccess('Portfolio refreshed!');
    } catch (error) {
      console.error('Error refreshing portfolio:', error);
      this.notificationService.showError('Failed to refresh portfolio');
    }
  }

  onNavClick(section: string): void {
    const element = document.getElementById(section);
    element?.scrollIntoView({ behavior: 'smooth' });
  }

  getBalanceDisplay(): string {
    if (!this.isConnected()) {
      return '$0.00';
    }

    // Use the new portfolio display that shows total USD value of BNB + ETH + USDT
    return this.walletService.portfolioDisplay();
  }

  getBalanceTooltip(): string {
    if (!this.isConnected()) {
      return 'Connect wallet to see multi-chain portfolio balance';
    }

    const bnbUSD = this.walletService.bnbBalanceUSD();
    const ethUSD = this.walletService.ethBalanceUSD();
    const usdtUSD = this.walletService.usdtBalanceUSD();
    
    return `Multi-Chain Portfolio Breakdown:\n• BNB: ${this.priceService.formatUSDValue(bnbUSD)}\n• ETH: ${this.priceService.formatUSDValue(ethUSD)}\n• USDT: ${this.priceService.formatUSDValue(usdtUSD)}\n\nTotal Across All Networks: ${this.walletService.portfolioDisplay()}`;
  }

  getNetworkName(): string {
    return this.walletService.getNetworkName();
  }
} 