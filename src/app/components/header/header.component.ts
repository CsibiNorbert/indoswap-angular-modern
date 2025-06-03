import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent {
  private readonly walletService = inject(WalletService);

  // Wallet state
  readonly isConnected = this.walletService.isConnected;
  readonly isConnecting = this.walletService.isConnecting;
  readonly isWrongNetwork = this.walletService.isWrongNetwork;
  readonly address = this.walletService.address;
  readonly shortAddress = this.walletService.shortAddress;
  readonly balance = this.walletService.balance;
  readonly formattedBalance = this.walletService.formattedBalance;
  readonly networkName = this.walletService.networkName;
  readonly isCorrectNetwork = this.walletService.isCorrectNetwork;
  readonly isRefreshingBalance = this.walletService.isRefreshingBalance;

  // Connect button text based on state
  readonly connectButtonText = computed(() => {
    if (this.isConnecting()) {
      return 'Connecting...';
    }
    if (this.isWrongNetwork()) {
      return 'Wrong Network';
    }
    if (this.isConnected()) {
      return this.shortAddress();
    }
    return 'Connect Wallet';
  });

  // Connect button class based on state
  readonly connectButtonClass = computed(() => {
    let baseClass = 'connect-wallet';
    
    if (this.isConnecting()) {
      baseClass += ' connecting';
    } else if (this.isWrongNetwork()) {
      baseClass += ' wrong-network';
    } else if (this.isConnected()) {
      baseClass += ' connected';
    }
    
    return baseClass;
  });

  // Network indicator class
  readonly networkClass = computed(() => {
    return {
      'network-status': true,
      'correct': this.isCorrectNetwork(),
      'wrong': !this.isCorrectNetwork() && this.isConnected()
    };
  });

  // Connect wallet action
  async connectWallet(): Promise<void> {
    if (this.isConnected()) {
      // If connected, disconnect
      this.walletService.disconnectWallet();
    } else {
      // Otherwise, show wallet modal
      await this.walletService.connectWallet();
    }
  }

  // Switch to BSC network
  async switchNetwork(): Promise<void> {
    if (this.isWrongNetwork()) {
      try {
        await this.walletService.switchToBSCNetwork();
      } catch (error) {
        console.error('Failed to switch network:', error);
      }
    }
  }

  // Refresh balance
  async refreshBalance(): Promise<void> {
    if (this.isConnected() && this.isCorrectNetwork()) {
      await this.walletService.updateBalance();
    }
  }

  // Navigation actions (placeholder for future implementation)
  navigateToSwap(): void {
    // TODO: Implement navigation
    console.log('Navigate to swap');
  }

  navigateToPool(): void {
    // TODO: Implement navigation
    console.log('Navigate to pool');
  }

  navigateToBridge(): void {
    // TODO: Implement navigation
    console.log('Navigate to bridge');
  }

  navigateToFarms(): void {
    // TODO: Implement navigation
    console.log('Navigate to farms');
  }
} 