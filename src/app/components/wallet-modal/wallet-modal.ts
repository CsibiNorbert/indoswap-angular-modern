import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';

interface WalletOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  isPopular?: boolean;
  isInstalled?: boolean;
}

type WalletStatus = 'available' | 'connecting' | 'not-installed';

@Component({
  selector: 'app-wallet-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wallet-modal.html',
  styleUrls: ['./wallet-modal.scss']
})
export class WalletModalComponent {
  private readonly walletService = inject(WalletService);
  private readonly notificationService = inject(NotificationService);

  // Wallet options configuration
  readonly walletOptions: WalletOption[] = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Connect using browser extension',
      icon: '🦊',
      isPopular: true,
      isInstalled: this.checkMetaMaskInstallation()
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Scan with mobile wallet',
      icon: '📱',
      isInstalled: true // WalletConnect is always "available"
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      description: 'Connect with Coinbase Wallet',
      icon: '🔵',
      isInstalled: this.checkCoinbaseWalletInstallation()
    }
  ];

  // Computed signals from wallet service
  readonly isModalOpen = this.walletService.isModalOpen;
  readonly isConnecting = this.walletService.isConnecting;
  readonly connectingWallet = this.walletService.connectingWalletId;

  // Track by function for ngFor optimization
  trackByWallet(index: number, wallet: WalletOption): string {
    return wallet.id;
  }

  getWalletStatus(wallet: WalletOption): WalletStatus {
    if (this.connectingWallet() === wallet.id) {
      return 'connecting';
    }
    if (!wallet.isInstalled) {
      return 'not-installed';
    }
    return 'available';
  }

  getWalletButtonText(wallet: WalletOption): string {
    const status = this.getWalletStatus(wallet);
    
    switch (status) {
      case 'connecting':
        return 'Connecting...';
      case 'not-installed':
        return 'Not Installed';
      default:
        return 'Connect';
    }
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onCloseModal();
    }
  }

  onCloseModal(): void {
    if (!this.isConnecting()) {
      this.walletService.closeModal();
    }
  }

  async onWalletSelect(walletId: string): Promise<void> {
    try {
      await this.walletService.connectWallet(walletId);
      this.notificationService.showSuccess(`Connected to ${this.getWalletName(walletId)}`);
    } catch (error) {
      this.notificationService.showError(
        error instanceof Error ? error.message : 'Failed to connect wallet'
      );
    }
  }

  // Private helper methods
  private getWalletName(walletId: string): string {
    return this.walletOptions.find(w => w.id === walletId)?.name || 'wallet';
  }

  private checkMetaMaskInstallation(): boolean {
    return typeof window !== 'undefined' && 
           typeof (window as any).ethereum !== 'undefined' && 
           (window as any).ethereum.isMetaMask;
  }

  private checkCoinbaseWalletInstallation(): boolean {
    return typeof window !== 'undefined' && 
           typeof (window as any).ethereum !== 'undefined' && 
           (window as any).ethereum.isCoinbaseWallet;
  }
}
