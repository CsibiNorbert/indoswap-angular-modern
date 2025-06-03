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
  isAvailable?: boolean;
}

type WalletStatus = 'available' | 'connecting' | 'not-installed' | 'coming-soon';

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
  readonly walletOptions = computed((): WalletOption[] => [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Connect using browser extension',
      icon: '🦊',
      isPopular: true,
      isInstalled: this.checkMetaMaskInstallation(),
      isAvailable: this.checkMetaMaskInstallation()
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Connect using mobile wallet',
      icon: '📱',
      isPopular: true,
      isInstalled: false, // WalletConnect will be implemented later
      isAvailable: false
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      description: 'Connect using Coinbase Wallet',
      icon: '🔵',
      isPopular: false,
      isInstalled: this.checkCoinbaseWalletInstallation(),
      isAvailable: false // Will implement later
    }
  ]);

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
    if (!wallet.isAvailable) {
      return 'coming-soon';
    }
    return 'available';
  }

  getWalletButtonText(wallet: WalletOption): string {
    const status = this.getWalletStatus(wallet);
    
    switch (status) {
      case 'connecting':
        return 'Connecting...';
      case 'not-installed':
        return 'Install';
      case 'coming-soon':
        return 'Coming Soon';
      default:
        return 'Connect';
    }
  }

  getWalletStatusIcon(wallet: WalletOption): string {
    const status = this.getWalletStatus(wallet);
    
    switch (status) {
      case 'connecting':
        return '⏳';
      case 'not-installed':
        return '⬇️';
      case 'coming-soon':
        return '🔜';
      default:
        return '✅';
    }
  }

  isWalletDisabled(wallet: WalletOption): boolean {
    const status = this.getWalletStatus(wallet);
    return this.isConnecting() || status === 'coming-soon';
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
    const wallet = this.walletOptions().find(w => w.id === walletId);
    if (!wallet) {
      console.error('🚨 Wallet not found:', walletId);
      return;
    }

    console.log('🔌 User selected wallet:', wallet.name);

    // Handle MetaMask specifically
    if (walletId === 'metamask') {
      if (!wallet.isAvailable) {
        this.onInstallWallet(wallet);
        return;
      }

      try {
        console.log('🦊 Attempting MetaMask connection...');
        this.notificationService.showInfo('🔌 Connecting to MetaMask...');
        
        await this.walletService.connectWallet(walletId);
        
        this.notificationService.showSuccess(
          `🎉 ${wallet.name} connected successfully! Welcome to IndoSwap!`
        );
        console.log('✅ MetaMask connection successful');
        
      } catch (error: any) {
        console.error('🚨 MetaMask connection failed:', error);
        this.handleConnectionError(error.message || 'Unknown error', wallet.name);
      }
    } else {
      // For other wallets, show coming soon message
      console.log('ℹ️ Other wallet selected:', wallet.name);
      this.notificationService.showInfo(
        `${wallet.name} integration coming soon! 🚀 Stay tuned for updates.`
      );
    }
  }

  onInstallWallet(wallet: WalletOption): void {
    console.log('📥 Install wallet requested:', wallet.name);
    
    if (wallet.id === 'metamask') {
      this.notificationService.showInfo(
        'MetaMask is not installed. Redirecting to installation page...'
      );
      
      setTimeout(() => {
        window.open('https://metamask.io/download/', '_blank');
      }, 1500);
    } else {
      this.notificationService.showInfo(
        `${wallet.name} installation guide coming soon!`
      );
    }
  }

  // Add test connection method for debugging
  async onTestConnection(): Promise<void> {
    console.log('🧪 Testing direct MetaMask connection...');
    
    try {
      if (!(window as any).ethereum) {
        throw new Error('MetaMask not detected');
      }

      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts'
      });

      console.log('✅ Direct test successful:', accounts);
      this.notificationService.showSuccess('🧪 Direct connection test successful!');
      
    } catch (error: any) {
      console.error('🚨 Direct test failed:', error);
      this.notificationService.showError(`🧪 Test failed: ${error.message}`);
    }
  }

  onHelpClick(): void {
    this.notificationService.showInfo(
      '💡 New to crypto wallets? Check our beginner guide (coming soon) or visit metamask.io/education'
    );
  }

  private handleConnectionError(errorMessage: string, walletName: string): void {
    console.log('🚨 Handling connection error:', errorMessage);
    
    // Handle specific error types
    if (errorMessage.includes('rejected') || errorMessage.includes('denied') || errorMessage.includes('User rejected')) {
      this.notificationService.showInfo(
        '❌ Connection cancelled. You can try connecting again anytime.'
      );
    } else if (errorMessage.includes('unlock')) {
      this.notificationService.showInfo(
        '🔒 Please unlock your MetaMask wallet and try again.'
      );
    } else if (errorMessage.includes('install') || errorMessage.includes('not detected')) {
      this.notificationService.showError(
        '🦊 MetaMask not found. Please install MetaMask browser extension.'
      );
    } else if (errorMessage.includes('network')) {
      this.notificationService.showInfo(
        '🌐 Network switching required. Please approve the network change in MetaMask.'
      );
    } else if (errorMessage.includes('undefined') || errorMessage.includes('null')) {
      this.notificationService.showError(
        '🔧 Connection error. Please refresh the page and try again.'
      );
    } else {
      this.notificationService.showError(
        `❌ Failed to connect to ${walletName}. Please try again.`
      );
    }
  }

  // Private helper methods
  private getWalletName(walletId: string): string {
    return this.walletOptions().find(w => w.id === walletId)?.name || 'wallet';
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
