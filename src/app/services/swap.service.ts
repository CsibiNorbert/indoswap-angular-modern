import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { SwapData, StatsData } from '../models/interfaces';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class SwapService {
  // Modern Angular dependency injection with inject function
  private readonly notificationService = inject(NotificationService);

  // Modern Angular signals for reactive state management
  private readonly _swapData = signal<SwapData>({
    fromToken: 'ETH',
    toToken: 'USDC',
    amount: 0,
    estimatedOutput: 0,
    slippage: 0.5
  });

  private readonly _isSwapping = signal<boolean>(false);
  
  private readonly _stats = signal<StatsData>({
    totalVolume: 2_840_000_000,
    totalUsers: 145_230,
    totalTransactions: 892_450,
    tvl: 1_250_000_000
  });

  // Public readonly access to state
  readonly swapData = this._swapData.asReadonly();
  readonly isSwapping = this._isSwapping.asReadonly();
  readonly stats = this._stats.asReadonly();

  // Computed values for derived state
  readonly estimatedFee = computed(() => this._swapData().amount * 0.003); // 0.3% fee
  readonly minimumReceived = computed(() => {
    const data = this._swapData();
    return data.estimatedOutput * (1 - data.slippage / 100);
  });

  readonly canSwap = computed(() => {
    const data = this._swapData();
    return data.amount > 0 && data.estimatedOutput > 0 && !this._isSwapping();
  });

  constructor() {
    // Effect to calculate estimated output when amount or tokens change
    effect(() => {
      const data = this._swapData();
      if (data.amount > 0) {
        this.calculateEstimatedOutput();
      }
    });
  }

  updateSwapData(updates: Partial<SwapData>): void {
    this._swapData.update(current => ({ ...current, ...updates }));
  }

  swapTokens(): void {
    const currentData = this._swapData();
    this._swapData.set({
      ...currentData,
      fromToken: currentData.toToken,
      toToken: currentData.fromToken,
      amount: 0,
      estimatedOutput: 0
    });
  }

  async executeSwap(): Promise<void> {
    if (!this.canSwap()) {
      this.notificationService.showError('Invalid swap parameters');
      return;
    }

    this._isSwapping.set(true);
    
    try {
      // Simulate swap execution
      await this.delay(2000);
      
      const data = this._swapData();
      this.notificationService.showSuccess(
        `Successfully swapped ${data.amount} ${data.fromToken} for ${data.estimatedOutput.toFixed(4)} ${data.toToken}`
      );

      // Reset swap form
      this._swapData.update(current => ({
        ...current,
        amount: 0,
        estimatedOutput: 0
      }));

      // Update stats
      this.updateStats();

    } catch (error) {
      this.notificationService.showError('Swap failed. Please try again.');
      console.error('Swap execution failed:', error);
    } finally {
      this._isSwapping.set(false);
    }
  }

  private async calculateEstimatedOutput(): Promise<void> {
    const data = this._swapData();
    
    // Simulate API call to get exchange rate
    await this.delay(300);
    
    // Mock exchange rate calculation
    const exchangeRate = this.getMockExchangeRate(data.fromToken, data.toToken);
    const estimatedOutput = data.amount * exchangeRate;
    
    this._swapData.update(current => ({
      ...current,
      estimatedOutput
    }));
  }

  private getMockExchangeRate(from: string, to: string): number {
    // Mock exchange rates
    const rates: Record<string, Record<string, number>> = {
      'ETH': { 'USDC': 2800, 'BTC': 0.045 },
      'USDC': { 'ETH': 0.000357, 'BTC': 0.000016 },
      'BTC': { 'ETH': 22.2, 'USDC': 62500 }
    };
    
    return rates[from]?.[to] ?? 1;
  }

  private updateStats(): void {
    this._stats.update(current => ({
      ...current,
      totalTransactions: current.totalTransactions + 1,
      totalVolume: current.totalVolume + (this._swapData().amount * 2800), // Rough USD value
    }));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 