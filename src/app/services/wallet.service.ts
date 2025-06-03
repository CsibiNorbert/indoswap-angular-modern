import { Injectable, signal, computed, inject, NgZone } from '@angular/core';
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
import { PriceService } from './price.service';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private readonly notificationService = inject(NotificationService);
  private readonly ngZone = inject(NgZone);
  private readonly priceService = inject(PriceService);

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
  private isInitialized = false;

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

  // NEW: Portfolio calculation computed signals
  readonly bnbBalance = computed(() => parseFloat(this.balance() || '0'));
  
  readonly portfolioValueUSD = computed(() => {
    const bnbAmount = this.bnbBalance();
    if (bnbAmount === 0) return 0;
    
    return this.priceService.calculateUSDValue('bnb', bnbAmount);
  });

  readonly portfolioDisplay = computed(() => {
    const usdValue = this.portfolioValueUSD();
    return this.priceService.formatUSDValue(usdValue);
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
    console.log('🔧 WalletService: Initializing...');
    this.initializeProvider();
    this.checkExistingConnection();
    
    // Start price updates for portfolio calculation
    this.priceService.startPriceUpdates();
  }

  // Initialize MetaMask provider with enhanced debugging
  private initializeProvider(): void {
    try {
      const web3Window = window as Web3Window;
      
      console.log('🔍 WalletService: Checking for ethereum provider...');
      console.log('🔍 Window.ethereum exists:', !!web3Window.ethereum);
      console.log('🔍 Is MetaMask:', web3Window.ethereum?.isMetaMask);
      
      if (web3Window.ethereum?.isMetaMask) {
        this.ethereum = web3Window.ethereum;
        this.setupEventListeners();
        console.log('✅ WalletService: Ethereum provider found:', {
          isMetaMask: this.ethereum.isMetaMask,
          chainId: this.ethereum.chainId,
          selectedAddress: this.ethereum.selectedAddress
        });
      } else {
        console.log('🚨 WalletService: No ethereum provider found');
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('🚨 WalletService: Error initializing provider:', error);
      this.isInitialized = true;
    }
  }

  // Setup MetaMask event listeners with enhanced debugging
  private setupEventListeners(): void {
    if (!this.ethereum) {
      console.log('🚨 WalletService: Cannot setup event listeners - no ethereum provider');
      return;
    }

    try {
      console.log('🎧 WalletService: Setting up event listeners...');

      // Account changes
      this.ethereum.on(MetaMaskEvent.ACCOUNTS_CHANGED, (accounts: string[]) => {
        console.log('👤 WalletService: Accounts changed:', accounts);
        this.ngZone.run(() => {
          this.handleAccountsChanged(accounts);
        });
      });

      // Network changes
      this.ethereum.on(MetaMaskEvent.CHAIN_CHANGED, (chainId: string) => {
        console.log('🌐 WalletService: Chain changed:', chainId);
        this.ngZone.run(() => {
          this.handleChainChanged(chainId);
        });
      });

      // Disconnection
      this.ethereum.on(MetaMaskEvent.DISCONNECT, (error: MetaMaskError) => {
        console.log('🔌 WalletService: Disconnect event:', error);
        this.ngZone.run(() => {
          this.handleDisconnect(error);
        });
      });

      console.log('✅ WalletService: Event listeners setup complete');
    } catch (error) {
      console.error('🚨 WalletService: Error setting up event listeners:', error);
    }
  }

  // Check for existing connection on app start with enhanced debugging
  private async checkExistingConnection(): Promise<void> {
    if (!this.ethereum) {
      console.log('ℹ️ WalletService: No ethereum provider for connection check');
      return;
    }

    try {
      console.log('🔍 WalletService: Checking for existing connection...');
      
      const accounts = await this.ethereum.request({
        method: MetaMaskMethod.GET_ACCOUNTS
      });

      console.log('👤 WalletService: Existing accounts:', accounts);

      if (accounts && accounts.length > 0) {
        const chainId = await this.ethereum.request({
          method: MetaMaskMethod.GET_CHAIN_ID
        });

        const chainIdDecimal = parseInt(chainId, 16);
        const address = accounts[0];

        console.log('🌐 WalletService: Current chain ID:', chainIdDecimal);
        console.log('📍 WalletService: Current address:', address);

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

        console.log('✅ WalletService: Existing connection restored');
      } else {
        console.log('ℹ️ WalletService: No existing connection found');
      }
    } catch (error) {
      console.error('🚨 WalletService: Error checking existing connection:', error);
    }
  }

  // Modal methods with debugging
  showModal(): void {
    console.log('📱 WalletService: Showing modal');
    this.modalOpen.set(true);
  }

  closeModal(): void {
    console.log('❌ WalletService: Closing modal');
    this.modalOpen.set(false);
    this._connectingWalletId.set('');
  }

  // MetaMask connection methods with enhanced debugging
  isMetaMaskInstalled(): boolean {
    const installed = !!(window as Web3Window).ethereum?.isMetaMask;
    console.log('🦊 WalletService: MetaMask installed:', installed);
    return installed;
  }

  openMetaMaskInstall(): void {
    console.log('📥 WalletService: Opening MetaMask install page');
    window.open(METAMASK_DOWNLOAD_URL, '_blank');
  }

  // Main connection method with comprehensive debugging
  async connectWallet(walletId?: string): Promise<void> {
    console.log('🔌 WalletService: Connect wallet called with ID:', walletId);

    if (!walletId) {
      console.log('📱 WalletService: No wallet ID provided, showing modal');
      this.showModal();
      return;
    }

    if (walletId !== 'metamask') {
      console.log('🚨 WalletService: Unsupported wallet:', walletId);
      this.notificationService.showError('Only MetaMask is supported currently');
      return;
    }

    if (!this.isMetaMaskInstalled()) {
      console.log('🚨 WalletService: MetaMask not installed');
      this.notificationService.showError('MetaMask is not installed');
      return;
    }

    console.log('🦊 WalletService: Starting MetaMask connection...');
    this._connectingWalletId.set(walletId);
    this.walletState.update(state => ({ ...state, status: 'connecting' }));

    try {
      console.log('📝 WalletService: Requesting accounts...');
      
      // Request account access
      const accounts = await this.ethereum!.request({
        method: MetaMaskMethod.REQUEST_ACCOUNTS
      });

      console.log('👤 WalletService: Accounts received:', accounts);

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
      }

      const address = accounts[0];
      console.log('📍 WalletService: Selected address:', address);

      // Get current chain ID
      const chainId = await this.ethereum!.request({
        method: MetaMaskMethod.GET_CHAIN_ID
      });
      const chainIdDecimal = parseInt(chainId, 16);
      console.log('🌐 WalletService: Current chain ID:', chainIdDecimal);

      // Check if we're on BSC network
      if (chainIdDecimal !== BSC_MAINNET_CHAIN_ID) {
        console.log('🔄 WalletService: Wrong network, switching to BSC...');
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

      console.log('✅ WalletService: Wallet state updated');

      // Fetch balance
      await this.fetchBalanceOnConnection();

      // Success notifications
      this.notificationService.showSuccess(
        `Connected to MetaMask: ${address.slice(0, 6)}...${address.slice(-4)}`
      );

      console.log('✅ WalletService: MetaMask connection successful!');
      this.closeModal();

    } catch (error: any) {
      console.error('🚨 WalletService: MetaMask connection failed:', error);
      this.handleConnectionError(error);
    }
  }

  // Network switching with enhanced debugging
  async switchToBSCNetwork(): Promise<void> {
    if (!this.ethereum) {
      console.error('🚨 WalletService: No ethereum provider for network switch');
      throw new Error('MetaMask not available');
    }

    try {
      console.log('🔄 WalletService: Attempting to switch to BSC network...');
      
      // Try to switch to BSC
      await this.ethereum.request({
        method: MetaMaskMethod.SWITCH_CHAIN,
        params: [{ chainId: SUPPORTED_NETWORKS[BSC_MAINNET_CHAIN_ID].chainId }]
      });

      console.log('✅ WalletService: Successfully switched to BSC');

    } catch (switchError: any) {
      console.log('⚠️ WalletService: Switch failed, trying to add BSC network:', switchError);
      
      // If BSC network is not added, add it
      if (switchError.code === MetaMaskErrorCode.CHAIN_NOT_ADDED) {
        try {
          console.log('➕ WalletService: Adding BSC network...');
          await this.ethereum.request({
            method: MetaMaskMethod.ADD_CHAIN,
            params: [SUPPORTED_NETWORKS[BSC_MAINNET_CHAIN_ID]]
          });
          console.log('✅ WalletService: BSC network added successfully');
        } catch (addError) {
          console.error('🚨 WalletService: Failed to add BSC network:', addError);
          throw new Error('Failed to add BSC network to MetaMask');
        }
      } else {
        console.error('🚨 WalletService: Network switch failed:', switchError);
        throw switchError;
      }
    }
  }

  // Balance management with enhanced debugging
  async updateBalance(): Promise<void> {
    if (!this.ethereum || !this.isConnected() || !this.isCorrectNetwork()) {
      console.log('ℹ️ WalletService: Cannot update balance - conditions not met');
      return;
    }

    console.log('💰 WalletService: Updating balance...');
    this._isRefreshingBalance.set(true);

    try {
      const address = this.address();
      console.log('📍 WalletService: Getting balance for:', address);
      
      const balanceWei = await this.ethereum.request({
        method: MetaMaskMethod.GET_BALANCE,
        params: [address, 'latest']
      });

      console.log('💰 WalletService: Balance in Wei:', balanceWei);

      // Convert from Wei to BNB
      const balanceEth = this.weiToEth(balanceWei);
      console.log('💰 WalletService: Balance in BNB:', balanceEth);
      
      this.walletState.update(state => ({
        ...state,
        balance: balanceEth
      }));

      // Log portfolio value for debugging
      const usdValue = this.priceService.calculateUSDValue('bnb', parseFloat(balanceEth));
      const formattedValue = this.priceService.formatUSDValue(usdValue);
      console.log('💰 WalletService: Portfolio value USD:', formattedValue);

      console.log('✅ WalletService: Balance updated successfully');

    } catch (error) {
      console.error('🚨 WalletService: Error updating balance:', error);
      this.notificationService.showError('Failed to update balance');
    } finally {
      this._isRefreshingBalance.set(false);
    }
  }

  // Force immediate balance fetch on connection
  async fetchBalanceOnConnection(): Promise<void> {
    console.log('🔄 WalletService: Fetching balance immediately after connection...');
    
    if (!this.ethereum || !this.address()) {
      console.warn('🚨 WalletService: Cannot fetch balance - no ethereum or address');
      return;
    }

    try {
      // Force balance fetch
      await this.updateBalance();
      
      // If balance is still 0, try alternative method
      if (this.balance() === '0' || this.balance() === '0.0000') {
        console.log('🔄 WalletService: Balance is 0, trying alternative fetch...');
        
        // Wait a bit and try again (sometimes MetaMask needs a moment)
        setTimeout(async () => {
          await this.updateBalance();
        }, 1000);
      }
      
    } catch (error) {
      console.error('🚨 WalletService: Failed to fetch balance on connection:', error);
    }
  }

  // Public method for refreshing portfolio (used by header component)
  async refreshPortfolio(): Promise<void> {
    console.log('🔄 WalletService: Manual portfolio refresh requested...');
    
    // Refresh prices first
    await this.priceService.fetchTokenPrices();
    
    // Then update balance
    if (this.isConnected()) {
      await this.updateBalance();
    }
  }

  // Keep for backward compatibility
  async refreshBalance(): Promise<void> {
    await this.refreshPortfolio();
  }

  // Get network name for display
  getNetworkName(): string {
    const chainId = this.chainId();
    if (chainId === BSC_MAINNET_CHAIN_ID) {
      return 'BSC Mainnet';
    }
    return SUPPORTED_NETWORKS[chainId]?.chainName || 'Unknown Network';
  }

  // Disconnect wallet with debugging
  disconnectWallet(): void {
    console.log('🔌 WalletService: Disconnecting wallet...');
    
    this.walletState.set({
      status: 'disconnected',
      address: '',
      chainId: BSC_MAINNET_CHAIN_ID,
      balance: '0'
    });
    
    this.closeModal();
    this.notificationService.showInfo('Wallet disconnected');
    console.log('✅ WalletService: Wallet disconnected');
  }

  // Event handlers with enhanced debugging
  private async handleAccountsChanged(accounts: string[]): Promise<void> {
    console.log('👤 WalletService: Handling accounts changed:', accounts);
    
    if (accounts.length === 0) {
      console.log('🔌 WalletService: No accounts, disconnecting...');
      this.disconnectWallet();
    } else if (accounts[0] !== this.address()) {
      console.log('🔄 WalletService: Account changed to:', accounts[0]);
      
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
    console.log('🌐 WalletService: Handling chain changed to:', chainId);
    
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
    console.log('🔌 WalletService: Handling disconnect:', error);
    this.disconnectWallet();
  }

  // Error handling with enhanced debugging
  private handleConnectionError(error: any): void {
    console.error('🚨 WalletService: Handling connection error:', error);
    
    this._connectingWalletId.set('');
    
    if (error?.code === MetaMaskErrorCode.USER_REJECTED) {
      console.log('❌ WalletService: User rejected connection');
      this.walletState.update(state => ({ ...state, status: 'disconnected' }));
      this.notificationService.showInfo('Connection cancelled by user');
    } else {
      console.log('🚨 WalletService: Connection error:', error?.message);
      this.walletState.update(state => ({ ...state, status: 'error' }));
      this.notificationService.showError(
        error?.message || 'Failed to connect to MetaMask'
      );
    }
  }

  // Utility methods
  private weiToEth(weiValue: string): string {
    try {
      const wei = BigInt(weiValue);
      const eth = Number(wei) / Math.pow(10, 18);
      return eth.toFixed(6);
    } catch (error) {
      console.error('🚨 WalletService: Error converting Wei to ETH:', error);
      return '0';
    }
  }

  // For compatibility with existing code
  updateWalletState(updates: Partial<WalletState>): void {
    console.log('🔄 WalletService: Updating wallet state:', updates);
    this.walletState.update(state => ({ ...state, ...updates }));
  }
} 