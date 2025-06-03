import { Injectable, signal, computed, effect } from '@angular/core';
import { WalletInfo } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  // Modern Angular signals for reactive state management
  private readonly _walletInfo = signal<WalletInfo>({
    address: '',
    balance: 0,
    connected: false,
    network: 'mainnet'
  });

  private readonly _isLoading = signal<boolean>(false);

  // Computed values for derived state
  readonly walletInfo = this._walletInfo.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isConnected = computed(() => this._walletInfo().connected);
  readonly formattedBalance = computed(() => 
    this._walletInfo().balance.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    })
  );

  constructor() {
    // Side effects for wallet state changes
    effect(() => {
      const wallet = this._walletInfo();
      if (wallet.connected) {
        console.log(`Wallet connected: ${wallet.address}`);
        this.updateBalance();
      }
    });
  }

  async connectWallet(): Promise<void> {
    this._isLoading.set(true);
    
    try {
      // Simulate wallet connection
      await this.delay(1500);
      
      this._walletInfo.set({
        address: '0x742d35Cc6634C0532925a3b8D40C39DbE30d2A16',
        balance: 2.5847,
        connected: true,
        network: 'mainnet'
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  async disconnectWallet(): Promise<void> {
    this._walletInfo.set({
      address: '',
      balance: 0,
      connected: false,
      network: 'mainnet'
    });
  }

  private async updateBalance(): Promise<void> {
    // Simulate balance update
    await this.delay(1000);
    const currentWallet = this._walletInfo();
    this._walletInfo.set({
      ...currentWallet,
      balance: Math.random() * 10
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 