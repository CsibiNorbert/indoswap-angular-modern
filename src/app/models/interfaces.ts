// Modern Angular 20+ TypeScript interfaces with readonly properties

export interface Token {
  readonly symbol: string;
  readonly name: string;
  readonly icon: string;
  readonly balance: number;
  readonly address?: string;
}

export interface SwapData {
  readonly fromToken: Token;
  readonly toToken: Token;
  readonly fromAmount: number;
  readonly toAmount: number;
  readonly exchangeRate: number;
  readonly priceImpact: number;
  readonly tradingFee: number;
  readonly minimumReceived: number;
}

export interface NotificationData {
  readonly message: string;
  readonly type: 'success' | 'error' | 'info';
  readonly duration?: number;
}

export interface WalletInfo {
  readonly address: string;
  readonly balance: number;
  readonly connected: boolean;
  readonly network: string;
}

export interface StatsData {
  readonly totalVolume: number;
  readonly totalUsers: number;
  readonly totalTransactions: number;
  readonly tvl: number;
}

export interface FeatureItem {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
  readonly highlighted?: boolean;
}

export interface Stat {
  readonly value: string;
  readonly label: string;
} 