import { Injectable, signal, computed } from '@angular/core';
import { WalletState, WalletStatus } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  // Signals for reactive state management
  private readonly walletState = signal<WalletState>({
    status: 'disconnected',
    address: '',
    chainId: 56, // BSC mainnet
    balance: '0'
  });

  // Modal state
  private readonly modalOpen = signal<boolean>(false);
  private readonly _connectingWalletId = signal<string>('');

  // Public computed signals
  readonly isConnected = computed(() => 
    this.walletState().status === 'connected'
  );
  
  readonly isConnecting = computed(() => 
    this.walletState().status === 'connecting'
  );

  // Add isLoading alias for backward compatibility
  readonly isLoading = computed(() => 
    this.walletState().status === 'connecting'
  );
  
  readonly address = computed(() => 
    this.walletState().address
  );
  
  readonly shortAddress = computed(() => {
    const addr = this.address();
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
  });
  
  readonly chainId = computed(() => 
    this.walletState().chainId
  );
  
  readonly balance = computed(() => 
    this.walletState().balance
  );

  // Modal state signals
  readonly isModalOpen = computed(() => 
    this.modalOpen()
  );

  readonly connectingWalletId = computed(() => 
    this._connectingWalletId()
  );

  // Modal methods
  showModal(): void {
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    // Reset connecting state when modal is closed
    this._connectingWalletId.set('');
  }

  // Updated connect wallet method that accepts wallet ID
  async connectWallet(walletId?: string): Promise<void> {
    // If no walletId provided, show modal instead
    if (!walletId) {
      this.showModal();
      return;
    }

    // Set connecting state
    this._connectingWalletId.set(walletId);
    this.walletState.update(state => ({
      ...state,
      status: 'connecting'
    }));

    try {
      // Simulate wallet connection process
      await this.simulateWalletConnection(walletId);
      
      // Mock successful connection
      this.walletState.set({
        status: 'connected',
        address: this.generateMockAddress(walletId),
        chainId: 56,
        balance: '2.45'
      });

      // Close modal on successful connection
      this.closeModal();
      
    } catch (error) {
      this.walletState.update(state => ({
        ...state,
        status: 'error'
      }));
      this._connectingWalletId.set('');
      throw error;
    }
  }

  disconnectWallet(): void {
    this.walletState.set({
      status: 'disconnected',
      address: '',
      chainId: 56,
      balance: '0'
    });
    this.closeModal();
  }

  // For reactive updates from external wallet events
  updateWalletState(updates: Partial<WalletState>): void {
    this.walletState.update(state => ({ ...state, ...updates }));
  }

  // Private helper methods
  private async simulateWalletConnection(walletId: string): Promise<void> {
    // Simulate different connection times for different wallets
    const connectionTime = walletId === 'metamask' ? 1500 : 2000;
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate occasional connection failures for testing
        if (Math.random() > 0.9) {
          reject(new Error(`Failed to connect to ${walletId}`));
        } else {
          resolve();
        }
      }, connectionTime);
    });
  }

  private generateMockAddress(walletId: string): string {
    // Generate different mock addresses based on wallet type
    const addresses = {
      metamask: '0x742e4B537583D5cB93f7FD5B23982F1dA5096e7F',
      walletconnect: '0x8ba1f109551bD432803012645Hac136c4',
      coinbase: '0xa1b2c3d4e5f6789012345678901234567890abcd'
    };

    return addresses[walletId as keyof typeof addresses] || addresses.metamask;
  }
} 