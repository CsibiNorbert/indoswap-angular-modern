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

const SUPPORTED_TOKENS = {
  bnb: { symbol: 'BNB', address: null, decimals: 18 },
  eth: {
    symbol: 'ETH',
    address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    decimals: 18
  },
  usdt: {
    symbol: 'USDT',
    address: '0x55d398326f99059fF775485246999027B3197955',
    decimals: 18
  }
} as const;

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
  private readonly _tokenBalances = signal<Map<string, string>>(new Map());

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

  // Token balance map
  readonly tokenBalances = computed(() => this._tokenBalances());

  readonly bnbBalance = computed(() => {
    return parseFloat(this.tokenBalances().get('bnb') || '0');
  });

  readonly portfolioValueUSD = computed(() => {
    let total = 0;
    for (const [symbol, amount] of this.tokenBalances()) {
      const num = parseFloat(amount);
      if (num > 0) {
        total += this.priceService.calculateUSDValue(symbol, num);
      }
    }
    return total;
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
    
    // Add to global window for debugging
    (window as any).walletService = this;
    console.log('🔧 WalletService: Added to window.walletService for debugging');
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
    console.log('💰 WalletService: Starting balance update...');
    console.log('💰 WalletService: Ethereum available:', !!this.ethereum);
    console.log('💰 WalletService: Address available:', this.address());
    console.log('💰 WalletService: Is connected:', this.isConnected());
    console.log('💰 WalletService: Is correct network:', this.isCorrectNetwork());
    
    if (!this.ethereum) {
      console.error('🚨 WalletService: No ethereum provider');
      return;
    }

    if (!this.isConnected()) {
      console.error('🚨 WalletService: Wallet not connected');
      return;
    }

    if (!this.isCorrectNetwork()) {
      console.error('🚨 WalletService: Wrong network');
      return;
    }

    console.log('💰 WalletService: All conditions met, proceeding with balance update...');
    this._isRefreshingBalance.set(true);

    try {
      const address = this.address();
      console.log('📍 WalletService: Getting balance for:', address);

      const tokenMap = new Map<string, string>();

      // Native BNB balance
      const balanceWei = await this.ethereum.request({
        method: MetaMaskMethod.GET_BALANCE,
        params: [address, 'latest']
      });
      console.log('💰 WalletService: Raw BNB balance (hex):', balanceWei);
      const bnbBalance = this.weiToBNB(balanceWei);
      tokenMap.set('bnb', bnbBalance);

      this.walletState.update(state => ({
        ...state,
        balance: bnbBalance
      }));

      // ERC20 token balances
      for (const [symbol, info] of Object.entries(SUPPORTED_TOKENS)) {
        if (!info.address) continue;
        const amount = await this.getErc20Balance(info.address, info.decimals);
        tokenMap.set(symbol, amount);
      }

      this._tokenBalances.set(tokenMap);

      console.log('✅ WalletService: Balance map updated', tokenMap);

    } catch (error) {
      console.error('🚨 WalletService: Error updating balance:', error);
      this.notificationService.showError('Failed to update balance');
    } finally {
      this._isRefreshingBalance.set(false);
    }
  }

  // PUBLIC method for manual debugging - can be called from browser console
  async debugBalance(): Promise<void> {
    console.log('🔧 DEBUG: Manual balance check started...');
    console.log('🔧 DEBUG: Ethereum provider:', !!this.ethereum);
    console.log('🔧 DEBUG: Wallet connected:', this.isConnected());
    console.log('🔧 DEBUG: Address:', this.address());
    console.log('🔧 DEBUG: Chain ID:', this.chainId());
    console.log('🔧 DEBUG: Is BSC network:', this.isCorrectNetwork());
    console.log('🔧 DEBUG: Current balance signal:', this.balance());

    if (!this.ethereum) {
      console.error('🔧 DEBUG: No ethereum provider available');
      return;
    }

    try {
      // Direct balance check without conditions
      const address = this.address();
      if (!address) {
        console.error('🔧 DEBUG: No address available');
        return;
      }

      console.log('🔧 DEBUG: Making direct eth_getBalance call...');
      const balanceWei = await this.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });

      console.log('🔧 DEBUG: Raw response:', balanceWei);
      
      const balanceBNB = this.weiToBNB(balanceWei);
      console.log('🔧 DEBUG: Converted balance:', balanceBNB);

      // Force update state
      this.walletState.update(state => ({
        ...state,
        balance: balanceBNB
      }));

      console.log('🔧 DEBUG: Updated balance signal:', this.balance());

    } catch (error) {
      console.error('🔧 DEBUG: Direct balance check failed:', error);
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

  // Enhanced refresh balance method (keep for backward compatibility)
  async refreshBalance(): Promise<void> {
    console.log('🔄 WalletService: Manual balance refresh requested');
    console.log('🔄 WalletService: Connection status:', this.isConnected());
    console.log('🔄 WalletService: Current address:', this.address());
    console.log('🔄 WalletService: Correct network:', this.isCorrectNetwork());
    
    if (this.isConnected() && this.isCorrectNetwork()) {
      await this.updateBalance();
    } else {
      console.warn('🚨 WalletService: Cannot refresh - wallet not connected or wrong network');
    }
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

  // Enhanced wei to BNB conversion with debugging
  private weiToBNB(wei: string): string {
    console.log('🔄 WalletService: Converting wei to BNB...');
    console.log('🔄 WalletService: Input wei:', wei);
    
    try {
      // Remove 0x prefix if present
      const cleanWei = wei.startsWith('0x') ? wei.slice(2) : wei;
      console.log('🔄 WalletService: Clean wei (no 0x):', cleanWei);
      
      // Convert hex to decimal using BigInt to handle large numbers
      const weiDecimal = BigInt('0x' + cleanWei);
      console.log('🔄 WalletService: Wei as decimal:', weiDecimal.toString());
      
      // Convert to BNB (1 BNB = 10^18 wei)
      const bnbValue = Number(weiDecimal) / Math.pow(10, 18);
      console.log('🔄 WalletService: Final BNB value:', bnbValue);
      
      return bnbValue.toFixed(6);
    } catch (error) {
      console.error('🚨 WalletService: Error converting wei to BNB:', error);
      return '0';
    }
  }

  private async getErc20Balance(
    tokenAddress: string,
    decimals: number
  ): Promise<string> {
    if (!this.ethereum) return '0';

    try {
      const address = this.address();
      const data =
        '0x70a08231' + address.slice(2).padStart(64, '0');
      const result = await this.ethereum.request({
        method: 'eth_call',
        params: [{ to: tokenAddress, data }, 'latest']
      });
      const clean = (result as string).startsWith('0x')
        ? (result as string).slice(2)
        : (result as string);
      const value = BigInt('0x' + clean);
      const amount = Number(value) / Math.pow(10, decimals);
      return amount.toString();
    } catch (error) {
      console.error('🚨 WalletService: Failed to fetch token balance', tokenAddress, error);
      return '0';
    }
  }

  // For compatibility with existing code
  updateWalletState(updates: Partial<WalletState>): void {
    console.log('🔄 WalletService: Updating wallet state:', updates);
    this.walletState.update(state => ({ ...state, ...updates }));
  }
} 