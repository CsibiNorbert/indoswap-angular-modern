// Modern Angular 17+ TypeScript interfaces with readonly properties

export interface WalletInfo {
  readonly address: string;
  readonly balance: number;
  readonly connected: boolean;
  readonly network: string;
}

export interface SwapData {
  readonly fromToken: string;
  readonly toToken: string;
  readonly amount: number;
  readonly estimatedOutput: number;
  readonly slippage: number;
}

export interface NotificationData {
  readonly id: string;
  readonly type: 'success' | 'error' | 'warning' | 'info';
  readonly message: string;
  readonly timestamp: Date;
  readonly autoClose?: boolean;
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