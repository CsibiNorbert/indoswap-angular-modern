// Web3 Types Interface for MetaMask Integration

export interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (eventName: string, handler: (...args: any[]) => void) => void;
  removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
  selectedAddress: string | null;
  chainId: string;
  networkVersion: string;
}

export interface Web3Window extends Window {
  ethereum?: EthereumProvider;
}

export interface NetworkConfig {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

export interface ConnectionResult {
  address: string;
  chainId: number;
  balance: string;
  network: string;
}

export interface MetaMaskError {
  code: number;
  message: string;
  data?: any;
}

// Token configuration for multi-token balance support
export interface SupportedToken {
  readonly symbol: string;
  readonly name: string;
  readonly decimals: number;
  readonly address: string | null; // null for native tokens (BNB, ETH)
  readonly isNative: boolean;
  readonly chainId: number;
  readonly coingeckoId: string;
}

// Supported tokens for portfolio calculation - Multi-chain support
export const SUPPORTED_TOKENS = {
  // Binance Smart Chain (56)
  56: {
    bnb: {
      symbol: 'BNB',
      name: 'Binance Coin',
      decimals: 18,
      address: null, // Native BNB on BSC
      isNative: true,
      chainId: 56,
      coingeckoId: 'binancecoin'
    },
    eth: {
      symbol: 'ETH', 
      name: 'Ethereum',
      decimals: 18,
      address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', // Wrapped ETH on BSC
      isNative: false,
      chainId: 56,
      coingeckoId: 'ethereum'
    },
    usdt: {
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 18,
      address: '0x55d398326f99059fF775485246999027B3197955', // USDT on BSC
      isNative: false,
      chainId: 56,
      coingeckoId: 'tether'
    }
  },
  // Ethereum Mainnet (1)
  1: {
    eth: {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      address: null, // Native ETH on Ethereum
      isNative: true,
      chainId: 1,
      coingeckoId: 'ethereum'
    },
    usdt: {
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6, // USDT on Ethereum has 6 decimals
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT on Ethereum
      isNative: false,
      chainId: 1,
      coingeckoId: 'tether'
    },
    bnb: {
      symbol: 'BNB',
      name: 'Binance Coin',
      decimals: 18,
      address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52', // BNB token on Ethereum
      isNative: false,
      chainId: 1,
      coingeckoId: 'binancecoin'
    }
  }
} as const;

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'wrong-network';

export type SupportedChainId = 56 | 1 | 137; // BSC, Ethereum, Polygon

export const SUPPORTED_NETWORKS: Record<number, NetworkConfig> = {
  56: {
    chainId: '0x38',
    chainName: 'Binance Smart Chain',
    nativeCurrency: {
      name: 'Binance Coin',
      symbol: 'BNB',
      decimals: 18
    },
    rpcUrls: ['https://bsc-dataseed.binance.org/'],
    blockExplorerUrls: ['https://bscscan.com/']
  },
  1: {
    chainId: '0x1',
    chainName: 'Ethereum Mainnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    blockExplorerUrls: ['https://etherscan.io/']
  }
};

// Multi-chain RPC endpoints for direct balance fetching
export const MULTI_CHAIN_RPC_ENDPOINTS = {
  1: 'https://eth.llamarpc.com', // Ethereum mainnet - free public RPC
  56: 'https://bsc-dataseed.binance.org/' // BSC mainnet
} as const;

export const BSC_MAINNET_CHAIN_ID = 56;
export const METAMASK_DOWNLOAD_URL = 'https://metamask.io/download/';

// MetaMask Error Codes
export enum MetaMaskErrorCode {
  USER_REJECTED = 4001,
  UNAUTHORIZED = 4100,
  UNSUPPORTED_METHOD = 4200,
  DISCONNECTED = 4900,
  CHAIN_DISCONNECTED = 4901,
  CHAIN_NOT_ADDED = 4902
}

// MetaMask RPC Methods
export enum MetaMaskMethod {
  REQUEST_ACCOUNTS = 'eth_requestAccounts',
  GET_ACCOUNTS = 'eth_accounts',
  GET_CHAIN_ID = 'eth_chainId',
  GET_BALANCE = 'eth_getBalance',
  SWITCH_CHAIN = 'wallet_switchEthereumChain',
  ADD_CHAIN = 'wallet_addEthereumChain',
  WATCH_ASSET = 'wallet_watchAsset',
  ETH_CALL = 'eth_call'
}

// MetaMask Events
export enum MetaMaskEvent {
  ACCOUNTS_CHANGED = 'accountsChanged',
  CHAIN_CHANGED = 'chainChanged',
  CONNECT = 'connect',
  DISCONNECT = 'disconnect'
}

// ERC-20 ABI for balanceOf function
export const ERC20_BALANCE_ABI = {
  name: 'balanceOf',
  type: 'function',
  inputs: [
    {
      name: 'account',
      type: 'address'
    }
  ],
  outputs: [
    {
      name: '',
      type: 'uint256'
    }
  ]
}; 