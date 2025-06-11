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
  MetaMaskEvent,
  SUPPORTED_TOKENS,
  SupportedToken,
  ERC20_BALANCE_ABI,
  MULTI_CHAIN_RPC_ENDPOINTS
} from '../models/web3.interface';
import { NotificationService } from './notification.service';
import { PriceService } from './price.service';

// Token balance interface
interface TokenBalance {
  symbol: string;
  balance: string;
  balanceUSD: number;
  lastUpdated: number;
}

// Type for any supported token from any chain
type AnyChainToken = typeof SUPPORTED_TOKENS[56]['bnb'] | typeof SUPPORTED_TOKENS[56]['eth'] | typeof SUPPORTED_TOKENS[56]['usdt'] | typeof SUPPORTED_TOKENS[1]['eth'] | typeof SUPPORTED_TOKENS[1]['usdt'] | typeof SUPPORTED_TOKENS[1]['bnb'];

// Type for any chain tokens object  
type AnyChainTokens = typeof SUPPORTED_TOKENS[56] | typeof SUPPORTED_TOKENS[1];

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

  // Multi-token balance tracking
  private readonly tokenBalances = signal<Map<string, TokenBalance>>(new Map());
  private readonly _isUpdatingBalances = signal<boolean>(false);

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

  // Multi-token balance computed signals
  readonly bnbBalance = computed(() => parseFloat(this.balance() || '0'));
  
  readonly ethBalance = computed(() => {
    const ethToken = this.tokenBalances().get('ETH');
    return ethToken ? parseFloat(ethToken.balance) : 0;
  });

  readonly usdtBalance = computed(() => {
    const usdtToken = this.tokenBalances().get('USDT');
    return usdtToken ? parseFloat(usdtToken.balance) : 0;
  });

  // Individual token USD values
  readonly bnbBalanceUSD = computed(() => {
    const bnbAmount = this.bnbBalance();
    if (bnbAmount === 0) return 0;
    return this.priceService.calculateUSDValue('bnb', bnbAmount);
  });

  readonly ethBalanceUSD = computed(() => {
    const ethAmount = this.ethBalance();
    if (ethAmount === 0) return 0;
    return this.priceService.calculateUSDValue('eth', ethAmount);
  });

  readonly usdtBalanceUSD = computed(() => {
    const usdtAmount = this.usdtBalance();
    if (usdtAmount === 0) return 0;
    return this.priceService.calculateUSDValue('usdt', usdtAmount);
  });

  // Total portfolio value (BNB + ETH + USDT only)
  readonly portfolioValueUSD = computed(() => {
    const bnbUSD = this.bnbBalanceUSD();
    const ethUSD = this.ethBalanceUSD();
    const usdtUSD = this.usdtBalanceUSD();
    
    const total = bnbUSD + ethUSD + usdtUSD;
    console.log(`💰 Portfolio Breakdown: BNB: $${bnbUSD.toFixed(2)}, ETH: $${ethUSD.toFixed(2)}, USDT: $${usdtUSD.toFixed(2)}, Total: $${total.toFixed(2)}`);
    
    return total;
  });

  readonly portfolioDisplay = computed(() => {
    const usdValue = this.portfolioValueUSD();
    return this.priceService.formatUSDValue(usdValue);
  });

  // Individual token balances for debugging/display
  readonly tokenBalanceMap = computed(() => this.tokenBalances());
  readonly isUpdatingBalances = computed(() => this._isUpdatingBalances());

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
  async connectWallet(): Promise<ConnectionResult | null>;
  async connectWallet(walletId: string): Promise<void>;
  async connectWallet(walletId?: string): Promise<ConnectionResult | null | void> {
    // Handle the modal-style connection with walletId
    if (walletId !== undefined) {
      console.log('🔌 WalletService: Connect wallet called with ID:', walletId);

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

      // Call the main connection method and handle success/error
      const result = await this.connectWallet();
      if (result) {
        this.closeModal();
      }
      return;
    }

    // Main connection logic
    if (!this.ethereum) {
      console.warn('🚨 WalletService: MetaMask not detected');
      this.notificationService.showError('MetaMask not detected. Please install MetaMask.');
      return null;
    }

    this.walletState.update(state => ({ ...state, status: 'connecting' }));
    console.log('🔌 WalletService: Connecting to MetaMask...');

    try {
      // Request account access
      const accounts = await this.ethereum.request({
        method: MetaMaskMethod.REQUEST_ACCOUNTS
      });

      if (!accounts?.length) {
        throw new Error('No accounts returned from MetaMask');
      }

      const address = accounts[0];
      console.log('✅ WalletService: Connected to address:', address);

      // Get chain ID
      const chainId = await this.ethereum.request({
        method: MetaMaskMethod.GET_CHAIN_ID
      });
      const numericChainId = parseInt(chainId, 16);
      console.log('🌐 WalletService: Connected to chain:', numericChainId);

      // Get network info
      const networkName = SUPPORTED_NETWORKS[numericChainId]?.chainName || `Chain ${numericChainId}`;
      
      // Update wallet state
      this.walletState.set({
        address,
        chainId: numericChainId,
        balance: '0', // Will be updated by updateBalance
        network: networkName,
        status: 'connected'
      });

      console.log('💰 WalletService: Fetching initial balance...');
      
      // Fetch initial balance
      await this.updateBalance();

      const result: ConnectionResult = {
        address,
        chainId: numericChainId,
        balance: this.balance(),
        network: networkName
      };

      console.log('🎉 WalletService: Connection successful!', result);
      console.log('💰 WalletService: Portfolio display:', this.portfolioDisplay());
      
      this.notificationService.showSuccess('Wallet connected successfully!');
      return result;

    } catch (error: any) {
      console.error('🚨 WalletService: Connection failed:', error);
      
      if (error.code === MetaMaskErrorCode.USER_REJECTED) {
        this.notificationService.showError('Connection rejected by user');
      } else {
        this.notificationService.showError(`Failed to connect: ${error.message}`);
      }
      
      this.walletState.update(state => ({ ...state, status: 'error' }));
      return null;
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

  // Enhanced balance update to include all supported tokens from ALL networks
  async updateBalance(): Promise<void> {
    if (!this.ethereum || !this.address()) {
      console.warn('🚨 WalletService: Cannot update balance - no ethereum or address');
      return;
    }

    console.log('💰 WalletService: Updating MULTI-CHAIN balances...');
    this._isRefreshingBalance.set(true);
    this._isUpdatingBalances.set(true);

    try {
      const address = this.address();
      console.log('📍 WalletService: Getting balances for:', address, 'across ALL supported networks');

      // Fetch balances from ALL supported networks simultaneously
      const networkPromises = Object.entries(SUPPORTED_TOKENS).map(([chainIdStr, chainTokens]) => 
        this.fetchNetworkBalances(address, parseInt(chainIdStr), chainTokens)
      );

      const networkResults = await Promise.allSettled(networkPromises);
      
      // Aggregate results from all networks
      const allTokenBalances = new Map<string, TokenBalance>();
      let currentNetworkNativeBalance = '0';

      networkResults.forEach((result, index) => {
        const chainId = parseInt(Object.keys(SUPPORTED_TOKENS)[index]);
        const currentChainId = this.chainId();

        if (result.status === 'fulfilled') {
          const { tokenBalances, nativeBalance } = result.value;
          
          // If this is the current network, update the native balance for wallet state
          if (chainId === currentChainId) {
            currentNetworkNativeBalance = nativeBalance;
          }

          // Merge token balances - for duplicate symbols, sum the USD values
          tokenBalances.forEach((balance, symbol) => {
            const existing = allTokenBalances.get(symbol);
            if (existing) {
              // Sum USD values for same token across networks
              allTokenBalances.set(symbol, {
                symbol: balance.symbol,
                balance: `${parseFloat(existing.balance) + parseFloat(balance.balance)}`, // Sum raw amounts
                balanceUSD: existing.balanceUSD + balance.balanceUSD, // Sum USD values
                lastUpdated: Math.max(existing.lastUpdated, balance.lastUpdated)
              });
            } else {
              allTokenBalances.set(symbol, balance);
            }
          });

          console.log(`✅ Chain ${chainId} balances fetched successfully`);
        } else {
          console.error(`🚨 Failed to fetch balances from chain ${chainId}:`, result.reason);
        }
      });

      // Update signals with aggregated multi-chain balances
      this.tokenBalances.set(allTokenBalances);
      this.walletState.update(state => ({
        ...state,
        balance: currentNetworkNativeBalance
      }));

      console.log('✅ WalletService: Multi-chain token balances updated successfully');
      console.log('💰 WalletService: Total portfolio value:', this.portfolioDisplay());

      // Log breakdown
      allTokenBalances.forEach((balance, symbol) => {
        console.log(`💰 ${symbol}: ${balance.balance} (${this.priceService.formatUSDValue(balance.balanceUSD)})`);
      });

    } catch (error) {
      console.error('🚨 WalletService: Error updating multi-chain balances:', error);
      this.notificationService.showError('Failed to update balances');
    } finally {
      this._isRefreshingBalance.set(false);
      this._isUpdatingBalances.set(false);
    }
  }

  // Fetch balances from a specific network using direct RPC calls
  private async fetchNetworkBalances(
    address: string, 
    chainId: number, 
    chainTokens: AnyChainTokens
  ): Promise<{ tokenBalances: Map<string, TokenBalance>, nativeBalance: string }> {
    console.log(`🌐 Fetching balances from chain ${chainId}...`);
    
    const tokenBalances = new Map<string, TokenBalance>();
    let nativeBalance = '0';

    try {
      // Fetch all token balances for this network in parallel
      const balancePromises = Object.entries(chainTokens).map(([key, token]) => 
        this.fetchTokenBalanceFromNetwork(address, token, chainId)
      );

      const balanceResults = await Promise.allSettled(balancePromises);
      
      balanceResults.forEach((result, index) => {
        const token = Object.values(chainTokens)[index];

        if (result.status === 'fulfilled') {
          const balance = result.value;
          
          if (token.isNative) {
            nativeBalance = balance;
          }

          // Calculate USD value
          const balanceNum = parseFloat(balance);
          const usdValue = this.priceService.calculateUSDValue(token.symbol.toLowerCase(), balanceNum);

          if (balanceNum > 0) { // Only log non-zero balances
            console.log(`💰 Chain ${chainId} - ${token.symbol}: ${balance} (${this.priceService.formatUSDValue(usdValue)})`);
          }

          tokenBalances.set(token.symbol, {
            symbol: token.symbol,
            balance: balance,
            balanceUSD: usdValue,
            lastUpdated: Date.now()
          });

        } else {
          console.error(`🚨 Failed to fetch ${token.symbol} balance from chain ${chainId}:`, result.reason);
          
          // Set zero balance for failed tokens
          tokenBalances.set(token.symbol, {
            symbol: token.symbol,
            balance: '0',
            balanceUSD: 0,
            lastUpdated: Date.now()
          });
        }
      });

      return { tokenBalances, nativeBalance };

    } catch (error) {
      console.error(`🚨 Error fetching balances from chain ${chainId}:`, error);
      return { tokenBalances, nativeBalance };
    }
  }

  // Fetch token balance from specific network using direct RPC call
  private async fetchTokenBalanceFromNetwork(
    address: string, 
    token: AnyChainToken, 
    chainId: number
  ): Promise<string> {
    try {
      if (token.isNative) {
        // For native tokens, we need to use the current connection if it's the same network
        if (chainId === this.chainId()) {
          const balanceWei = await this.ethereum!.request({
            method: MetaMaskMethod.GET_BALANCE,
            params: [address, 'latest']
          });
          return this.weiToEther(balanceWei);
        } else {
          // For different networks, use direct RPC call
          return await this.fetchNativeBalanceViaRPC(address, chainId);
        }
      } else {
        // For ERC-20 tokens, use direct RPC call
        return await this.fetchERC20BalanceViaRPC(address, token.address!, token.decimals, chainId);
      }
    } catch (error) {
      console.error(`🚨 Error fetching ${token.symbol} from chain ${chainId}:`, error);
      return '0';
    }
  }

  // Fetch native balance via direct RPC call
  private async fetchNativeBalanceViaRPC(address: string, chainId: number): Promise<string> {
    try {
      const rpcUrl = MULTI_CHAIN_RPC_ENDPOINTS[chainId as keyof typeof MULTI_CHAIN_RPC_ENDPOINTS];
      if (!rpcUrl) {
        throw new Error(`No RPC endpoint for chain ${chainId}`);
      }

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }

      return this.weiToEther(data.result);
    } catch (error) {
      console.error(`🚨 Error fetching native balance via RPC for chain ${chainId}:`, error);
      return '0';
    }
  }

  // Fetch ERC-20 balance via direct RPC call
  private async fetchERC20BalanceViaRPC(
    userAddress: string, 
    tokenAddress: string, 
    decimals: number, 
    chainId: number
  ): Promise<string> {
    try {
      const rpcUrl = MULTI_CHAIN_RPC_ENDPOINTS[chainId as keyof typeof MULTI_CHAIN_RPC_ENDPOINTS];
      if (!rpcUrl) {
        throw new Error(`No RPC endpoint for chain ${chainId}`);
      }

      // Encode the balanceOf function call
      const balanceOfSignature = '0x70a08231'; // balanceOf(address) function signature
      const paddedAddress = userAddress.slice(2).padStart(64, '0'); // Remove 0x and pad to 64 chars
      const data = balanceOfSignature + paddedAddress;

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [
            {
              to: tokenAddress,
              data: data
            },
            'latest'
          ],
          id: 1
        })
      });

      const responseData = await response.json();
      if (responseData.error) {
        throw new Error(responseData.error.message);
      }

      // Convert hex result to decimal and then to readable format
      const balanceWei = BigInt(responseData.result);
      const balance = this.weiToToken(balanceWei.toString(16), decimals);
      
      return balance;
    } catch (error) {
      console.error(`🚨 Error fetching ERC-20 balance via RPC for chain ${chainId}:`, error);
      return '0';
    }
  }

  // Convert Wei to token with custom decimals
  private weiToToken(weiHex: string, decimals: number): string {
    try {
      // Remove 0x prefix if present
      const cleanHex = weiHex.startsWith('0x') ? weiHex.slice(2) : weiHex;
      
      // Convert hex to BigInt
      const weiBigInt = BigInt('0x' + cleanHex);
      
      // Convert to decimal string
      const weiStr = weiBigInt.toString();
      
      // Handle cases where the number is less than decimals digits
      if (weiStr.length <= decimals) {
        const padded = weiStr.padStart(decimals, '0');
        const beforeDecimal = '0';
        const afterDecimal = padded.slice(0, decimals);
        return beforeDecimal + '.' + afterDecimal.replace(/0+$/, '') || '0';
      } else {
        const beforeDecimal = weiStr.slice(0, -decimals);
        const afterDecimal = weiStr.slice(-decimals);
        return beforeDecimal + '.' + afterDecimal.replace(/0+$/, '') || '0';
      }
    } catch (error) {
      console.error('🚨 Error converting Wei to token:', error);
      return '0';
    }
  }

  // Generic Wei to Ether conversion (18 decimals) - for native tokens
  private weiToEther(weiHex: string): string {
    return this.weiToToken(weiHex, 18);
  }

  // For compatibility with existing code
  private weiToBNB(weiHex: string): string {
    return this.weiToEther(weiHex);
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

  // Enhanced refresh portfolio method
  async refreshPortfolio(): Promise<void> {
    console.log('🔄 WalletService: Manual portfolio refresh requested...');
    
    // Refresh prices first
    await this.priceService.fetchTokenPrices();
    
    // Then update all token balances
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

  // For compatibility with existing code
  updateWalletState(updates: Partial<WalletState>): void {
    console.log('🔄 WalletService: Updating wallet state:', updates);
    this.walletState.update(state => ({ ...state, ...updates }));
  }

  // Testing utility: Set mock token balances for demonstration
  setMockTokenBalances(): void {
    console.log('🎭 WalletService: Setting mock token balances for testing...');
    
    const mockBalances = new Map<string, TokenBalance>();
    
    // Example: User has $100 ETH, $350 BNB, $0 USDT
    mockBalances.set('BNB', {
      symbol: 'BNB',
      balance: '0.5432', // ~$350 at ~$645/BNB
      balanceUSD: 350,
      lastUpdated: Date.now()
    });
    
    mockBalances.set('ETH', {
      symbol: 'ETH',
      balance: '0.0407', // ~$100 at ~$2456/ETH  
      balanceUSD: 100,
      lastUpdated: Date.now()
    });
    
    mockBalances.set('USDT', {
      symbol: 'USDT',
      balance: '0', // $0 USDT
      balanceUSD: 0,
      lastUpdated: Date.now()
    });
    
    this.tokenBalances.set(mockBalances);
    
    // Update BNB balance in wallet state
    this.walletState.update(state => ({
      ...state,
      balance: '0.5432'
    }));
    
    console.log('✅ Mock balances set: Total portfolio should show $450 (BNB + ETH + USDT)');
    console.log('💰 Portfolio value:', this.portfolioDisplay());
  }

  // For testing: Force update balance and log details
  async testMultiChainBalance(): Promise<void> {
    console.log('🧪 WalletService: Testing multi-chain balance...');
    console.log('🔗 Current chain ID:', this.chainId());
    console.log('🏠 Current address:', this.address());
    
    if (!this.isConnected()) {
      console.log('❌ Wallet not connected');
      return;
    }

    await this.updateBalance();
    
    console.log('📊 Balance results:');
    console.log('- Portfolio Display:', this.portfolioDisplay());
    console.log('- Portfolio USD Value:', this.portfolioValueUSD());
    console.log('- Token Balances:', Array.from(this.tokenBalances().entries()));
    
    // Log individual token balances
    const tokens = this.tokenBalances();
    tokens.forEach((balance, symbol) => {
      console.log(`  ${symbol}: ${balance.balance} ($${balance.balanceUSD.toFixed(2)})`);
    });
  }
} 