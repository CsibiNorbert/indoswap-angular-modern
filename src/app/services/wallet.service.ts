import { Injectable, signal, computed, inject } from '@angular/core';
import { WalletState, WalletStatus } from '../models/interfaces';
import { 
  EthereumProvider, 
  Web3Window, 
  ConnectionResult, 
  MetaMaskError, 
  ConnectionStatus,
  SUPPORTED_NETWORKS,
  BSC_MAINNET_CHAIN_ID,
  METAMASK_DOWNLOAD_URL,
  MetaMaskErrorCode,
  MetaMaskMethod,
  MetaMaskEvent
} from '../models/web3.interface';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private readonly notificationService = inject(NotificationService);

  // Signals for reactive state management
  private readonly walletState = signal<WalletState>({
    status: 'disconnected',
    address: '',
    chainId: BSC_MAINNET_CHAIN_ID,
    balance: '0'
  });

  // Modal and UI state
  private readonly modalOpen = signal<boolean>(false);
  private readonly _connectingWalletId = signal<string>('');
  private readonly _isRefreshingBalance = signal<boolean>(false);

  // Ethereum provider
  private ethereum: EthereumProvider | null = null;

  // Public computed signals
  readonly isConnected = computed(() => 
    this.walletState().status === 'connected'
  );
  
  readonly isConnecting = computed(() => 
    this.walletState().status === 'connecting'
  );

  readonly isWrongNetwork = computed(() =>
    this.walletState().status === 'wrong-network'
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

  readonly formattedBalance = computed(() => {
    const balance = this.balance();
    return balance ? `${parseFloat(balance).toFixed(4)} BNB` : '0.0000 BNB';
  });

  readonly networkName = computed(() => {
    const chainId = this.chainId();
    return SUPPORTED_NETWORKS[chainId]?.chainName || 'Unknown Network';
  });

  readonly isCorrectNetwork = computed(() => 
    this.chainId() === BSC_MAINNET_CHAIN_ID
  );

  // Modal state signals
  readonly isModalOpen = computed(() => 
    this.modalOpen()
  );

  readonly connectingWalletId = computed(() => 
    this._connectingWalletId()
  );

  readonly isRefreshingBalance = computed(() =>
    this._isRefreshingBalance()
  );

  constructor() {
    this.initializeProvider();
    this.checkExistingConnection();
  }

  // Initialize MetaMask provider
  private initializeProvider(): void {
    const web3Window = window as Web3Window;
    
    if (web3Window.ethereum?.isMetaMask) {
      this.ethereum = web3Window.ethereum;
      this.setupEventListeners();
    }
  }

  // Setup MetaMask event listeners
  private setupEventListeners(): void {
    if (!this.ethereum) return;

    // Account changes
    this.ethereum.on(MetaMaskEvent.ACCOUNTS_CHANGED, (accounts: string[]) => {
      this.handleAccountsChanged(accounts);
    });

    // Network changes
    this.ethereum.on(MetaMaskEvent.CHAIN_CHANGED, (chainId: string) => {
      this.handleChainChanged(chainId);
    });

    // Disconnection
    this.ethereum.on(MetaMaskEvent.DISCONNECT, (error: MetaMaskError) => {
      this.handleDisconnect(error);
    });
  }

  // Check for existing connection on app start
  private async checkExistingConnection(): Promise<void> {
    if (!this.ethereum) return;

    try {
      const accounts = await this.ethereum.request({
        method: MetaMaskMethod.GET_ACCOUNTS
      });

      if (accounts && accounts.length > 0) {
        const chainId = await this.ethereum.request({
          method: MetaMaskMethod.GET_CHAIN_ID
        });

        const chainIdDecimal = parseInt(chainId, 16);
        const address = accounts[0];

        // Update wallet state
        this.walletState.set({
          status: chainIdDecimal === BSC_MAINNET_CHAIN_ID ? 'connected' : 'wrong-network',
          address,
          chainId: chainIdDecimal,
          balance: '0'
        });

        // Fetch balance if on correct network
        if (chainIdDecimal === BSC_MAINNET_CHAIN_ID) {
          await this.updateBalance();
        }
      }
    } catch (error) {
      console.error('Error checking existing connection:', error);
    }
  }

  // Modal methods
  showModal(): void {
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this._connectingWalletId.set('');
  }

  // MetaMask connection methods
  isMetaMaskInstalled(): boolean {
    return !!(window as Web3Window).ethereum?.isMetaMask;
  }

  openMetaMaskInstall(): void {
    window.open(METAMASK_DOWNLOAD_URL, '_blank');
  }

  // Main connection method
  async connectWallet(walletId?: string): Promise<void> {
    if (!walletId) {
      this.showModal();
      return;
    }

    if (walletId !== 'metamask') {
      this.notificationService.showError('Only MetaMask is supported currently');
      return;
    }

    if (!this.isMetaMaskInstalled()) {
      this.notificationService.showError('MetaMask is not installed');
      return;
    }

    this._connectingWalletId.set(walletId);
    this.walletState.update(state => ({ ...state, status: 'connecting' }));

    try {
      // Request account access
      const accounts = await this.ethereum!.request({
        method: MetaMaskMethod.REQUEST_ACCOUNTS
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
      }

      const address = accounts[0];

      // Get current chain ID
      const chainId = await this.ethereum!.request({
        method: MetaMaskMethod.GET_CHAIN_ID
      });
      const chainIdDecimal = parseInt(chainId, 16);

      // Check if we're on BSC network
      if (chainIdDecimal !== BSC_MAINNET_CHAIN_ID) {
        await this.switchToBSCNetwork();
        return; // switchToBSCNetwork will handle the rest
      }

      // Update wallet state
      this.walletState.set({
        status: 'connected',
        address,
        chainId: chainIdDecimal,
        balance: '0'
      });

      // Fetch balance
      await this.updateBalance();

      // Success notifications
      this.notificationService.showSuccess(
        `Connected to MetaMask: ${address.slice(0, 6)}...${address.slice(-4)}`
      );

      this.closeModal();

    } catch (error: any) {
      this.handleConnectionError(error);
    }
  }

  // Network switching
  async switchToBSCNetwork(): Promise<void> {
    if (!this.ethereum) throw new Error('MetaMask not available');

    try {
      // Try to switch to BSC
      await this.ethereum.request({
        method: MetaMaskMethod.SWITCH_CHAIN,
        params: [{ chainId: SUPPORTED_NETWORKS[BSC_MAINNET_CHAIN_ID].chainId }]
      });

    } catch (switchError: any) {
      // If BSC network is not added, add it
      if (switchError.code === MetaMaskErrorCode.CHAIN_NOT_ADDED) {
        try {
          await this.ethereum.request({
            method: MetaMaskMethod.ADD_CHAIN,
            params: [SUPPORTED_NETWORKS[BSC_MAINNET_CHAIN_ID]]
          });
        } catch (addError) {
          throw new Error('Failed to add BSC network to MetaMask');
        }
      } else {
        throw switchError;
      }
    }
  }

  // Balance management
  async updateBalance(): Promise<void> {
    if (!this.ethereum || !this.isConnected() || !this.isCorrectNetwork()) {
      return;
    }

    this._isRefreshingBalance.set(true);

    try {
      const address = this.address();
      const balanceWei = await this.ethereum.request({
        method: MetaMaskMethod.GET_BALANCE,
        params: [address, 'latest']
      });

      // Convert from Wei to BNB
      const balanceEth = this.weiToEth(balanceWei);
      
      this.walletState.update(state => ({
        ...state,
        balance: balanceEth
      }));

      this.notificationService.showSuccess('Balance updated successfully');

    } catch (error) {
      console.error('Error updating balance:', error);
      this.notificationService.showError('Failed to update balance');
    } finally {
      this._isRefreshingBalance.set(false);
    }
  }

  // Disconnect wallet
  disconnectWallet(): void {
    this.walletState.set({
      status: 'disconnected',
      address: '',
      chainId: BSC_MAINNET_CHAIN_ID,
      balance: '0'
    });
    
    this.closeModal();
    this.notificationService.showInfo('Wallet disconnected');
  }

  // Event handlers
  private async handleAccountsChanged(accounts: string[]): Promise<void> {
    if (accounts.length === 0) {
      this.disconnectWallet();
    } else if (accounts[0] !== this.address()) {
      this.walletState.update(state => ({
        ...state,
        address: accounts[0],
        balance: '0'
      }));

      if (this.isCorrectNetwork()) {
        await this.updateBalance();
      }

      this.notificationService.showInfo(`Account changed to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
    }
  }

  private async handleChainChanged(chainIdHex: string): Promise<void> {
    const chainId = parseInt(chainIdHex, 16);
    
    this.walletState.update(state => ({
      ...state,
      chainId,
      status: chainId === BSC_MAINNET_CHAIN_ID ? 'connected' : 'wrong-network',
      balance: '0'
    }));

    if (chainId === BSC_MAINNET_CHAIN_ID) {
      await this.updateBalance();
      this.notificationService.showSuccess('Switched to Binance Smart Chain');
    } else {
      this.notificationService.showInfo(
        `Connected to ${SUPPORTED_NETWORKS[chainId]?.chainName || 'unknown network'}. Please switch to BSC.`
      );
    }
  }

  private handleDisconnect(error: MetaMaskError): void {
    this.disconnectWallet();
    console.error('MetaMask disconnected:', error);
  }

  // Error handling
  private handleConnectionError(error: any): void {
    this._connectingWalletId.set('');
    
    if (error?.code === MetaMaskErrorCode.USER_REJECTED) {
      this.walletState.update(state => ({ ...state, status: 'disconnected' }));
      this.notificationService.showInfo('Connection cancelled by user');
    } else {
      this.walletState.update(state => ({ ...state, status: 'error' }));
      this.notificationService.showError(
        error?.message || 'Failed to connect to MetaMask'
      );
    }
  }

  // Utility methods
  private weiToEth(weiValue: string): string {
    const wei = BigInt(weiValue);
    const eth = Number(wei) / Math.pow(10, 18);
    return eth.toFixed(6);
  }

  // For compatibility with existing code
  updateWalletState(updates: Partial<WalletState>): void {
    this.walletState.update(state => ({ ...state, ...updates }));
  }
} 