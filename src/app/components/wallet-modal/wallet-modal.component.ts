import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../services/wallet.service';

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: 'available' | 'not-installed' | 'coming-soon';
  buttonText: string;
  buttonClass: string;
}

@Component({
  selector: 'app-wallet-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wallet-modal.html',
  styleUrls: ['./wallet-modal.scss']
})
export class WalletModalComponent {
  // Expose walletService as public for template access
  readonly walletService = inject(WalletService);

  // Reactive wallet options based on MetaMask availability
  readonly walletOptions = computed((): WalletOption[] => {
    const isMetaMaskInstalled = this.walletService.isMetaMaskInstalled();
    
    return [
      {
        id: 'metamask',
        name: 'MetaMask',
        icon: '🦊',
        description: isMetaMaskInstalled 
          ? 'Connect using browser wallet' 
          : 'Browser wallet not detected',
        status: isMetaMaskInstalled ? 'available' : 'not-installed',
        buttonText: isMetaMaskInstalled ? 'Connect' : 'Install',
        buttonClass: isMetaMaskInstalled ? 'connect' : 'install'
      },
      {
        id: 'walletconnect',
        name: 'WalletConnect',
        icon: '🔗',
        description: 'Connect with mobile wallet',
        status: 'coming-soon',
        buttonText: 'Coming Soon',
        buttonClass: 'disabled'
      },
      {
        id: 'coinbase',
        name: 'Coinbase Wallet',
        icon: '🔵',
        description: 'Connect with Coinbase',
        status: 'coming-soon',
        buttonText: 'Coming Soon',
        buttonClass: 'disabled'
      }
    ];
  });

  // Modal state
  readonly isOpen = this.walletService.isModalOpen;
  readonly connectingWalletId = this.walletService.connectingWalletId;
  readonly isConnecting = this.walletService.isConnecting;

  // Close modal
  closeModal(): void {
    this.walletService.closeModal();
  }

  // Handle backdrop click
  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  // Handle wallet selection
  async selectWallet(wallet: WalletOption): Promise<void> {
    if (wallet.status === 'coming-soon') {
      return;
    }

    if (wallet.status === 'not-installed' && wallet.id === 'metamask') {
      this.walletService.openMetaMaskInstall();
      return;
    }

    if (wallet.status === 'available') {
      await this.walletService.connectWallet(wallet.id);
    }
  }

  // Get button state for a wallet
  getButtonState(wallet: WalletOption): {
    text: string;
    class: string;
    disabled: boolean;
    loading: boolean;
  } {
    const isConnecting = this.connectingWalletId() === wallet.id;
    
    return {
      text: isConnecting ? 'Connecting...' : wallet.buttonText,
      class: wallet.buttonClass + (isConnecting ? ' connecting' : ''),
      disabled: wallet.status === 'coming-soon' || isConnecting,
      loading: isConnecting
    };
  }

  // Track by function for performance
  trackByWalletId(index: number, wallet: WalletOption): string {
    return wallet.id;
  }

  // Handle keyboard navigation
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeModal();
    }
  }
} 