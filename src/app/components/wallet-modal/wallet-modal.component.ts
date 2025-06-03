import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';

interface WalletOption {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly description: string;
  readonly isPopular?: boolean;
  readonly isAvailable: boolean;
  readonly installUrl?: string;
}

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

  readonly isModalOpen = this.walletService.isModalOpen;
  readonly isConnecting = this.walletService.isConnecting;

  readonly walletOptions = computed((): readonly WalletOption[] => [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect using browser extension',
      isPopular: true,
      isAvailable: this.walletService.isMetaMaskInstalled(),
      installUrl: 'https://metamask.io/download/'
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '📱',
      description: 'Connect using mobile wallet',
      isPopular: true,
      isAvailable: false, // Will implement later
      installUrl: undefined
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '🔵',
      description: 'Connect using Coinbase Wallet',
      isPopular: false,
      isAvailable: false, // Will implement later
      installUrl: undefined
    }
  ]);

  readonly connectingWallet = computed(() => 
    this.walletService.connectingWalletId()
  );

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onCloseModal();
    }
  }

  onCloseModal(): void {
    this.walletService.closeModal();
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
    
    if (wallet.installUrl) {
      this.notificationService.showInfo(
        `${wallet.name} is not installed. Redirecting to installation page...`
      );
      
      setTimeout(() => {
        window.open(wallet.installUrl, '_blank');
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

  getWalletStatus(wallet: WalletOption): string {
    if (this.connectingWallet() === wallet.id) {
      return 'connecting';
    }
    if (!wallet.isAvailable && wallet.id === 'metamask') {
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

  onHelpClick(): void {
    this.notificationService.showInfo(
      '💡 New to crypto wallets? Check our beginner guide (coming soon) or visit metamask.io/education'
    );
  }

  trackByWallet(index: number, wallet: WalletOption): string {
    return wallet.id;
  }
} 