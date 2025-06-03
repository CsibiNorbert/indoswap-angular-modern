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
  WATCH_ASSET = 'wallet_watchAsset'
}

// MetaMask Events
export enum MetaMaskEvent {
  ACCOUNTS_CHANGED = 'accountsChanged',
  CHAIN_CHANGED = 'chainChanged',
  CONNECT = 'connect',
  DISCONNECT = 'disconnect'
} 