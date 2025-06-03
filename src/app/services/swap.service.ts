import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Token, SwapData } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class SwapService {
  // Exchange rates mapping
  private exchangeRates: { [key: string]: number } = {
    'BNB-BUSD': 285.43,
    'BUSD-BNB': 0.0035,
    'BNB-USDT': 284.87,
    'USDT-BNB': 0.0035,
    'BUSD-USDT': 0.998,
    'USDT-BUSD': 1.002
  };

  // Default tokens
  private defaultTokens: Token[] = [
    { symbol: 'BNB', name: 'Binance Coin', icon: 'bnb', balance: 2.45 },
    { symbol: 'BUSD', name: 'Binance USD', icon: 'busd', balance: 1250.00 },
    { symbol: 'USDT', name: 'Tether USD', icon: 'usdt', balance: 500.00 }
  ];

  // BehaviorSubject for compatibility
  private swapDataSubject = new BehaviorSubject<SwapData>({
    fromToken: this.defaultTokens[0],
    toToken: this.defaultTokens[1],
    fromAmount: 0,
    toAmount: 0,
    exchangeRate: this.exchangeRates['BNB-BUSD'],
    priceImpact: 0.01,
    tradingFee: 0.25,
    minimumReceived: 0
  });

  // Modern Angular signals
  private readonly _swapData = signal<SwapData>(this.swapDataSubject.value);
  private readonly _isSwapping = signal<boolean>(false);

  // Observable for reactive programming
  swapData$: Observable<SwapData> = this.swapDataSubject.asObservable();

  // Computed values
  readonly swapData = this._swapData.asReadonly();
  readonly isSwapping = this._isSwapping.asReadonly();
  readonly canSwap = computed(() => {
    const data = this._swapData();
    return data.fromAmount > 0 && !this._isSwapping();
  });

  getTokens(): Token[] {
    return this.defaultTokens;
  }

  selectFromToken(token: Token): void {
    const currentData = this.swapDataSubject.value;
    const newSwapData: SwapData = {
      ...currentData,
      fromToken: token,
      exchangeRate: this.exchangeRates[`${token.symbol}-${currentData.toToken.symbol}`] || 1,
      fromAmount: 0,
      toAmount: 0,
      minimumReceived: 0
    };

    this.updateSwapData(newSwapData);
  }

  selectToToken(token: Token): void {
    const currentData = this.swapDataSubject.value;
    const newSwapData: SwapData = {
      ...currentData,
      toToken: token,
      exchangeRate: this.exchangeRates[`${currentData.fromToken.symbol}-${token.symbol}`] || 1,
      fromAmount: 0,
      toAmount: 0,
      minimumReceived: 0
    };

    this.updateSwapData(newSwapData);
  }

  calculateSwap(fromAmount: number): SwapData {
    const currentData = this.swapDataSubject.value;
    const rateKey = `${currentData.fromToken.symbol}-${currentData.toToken.symbol}`;
    const exchangeRate = this.exchangeRates[rateKey] || 1;
    const toAmount = fromAmount * exchangeRate;
    const minimumReceived = toAmount * 0.995; // 0.5% slippage

    const newSwapData: SwapData = {
      ...currentData,
      fromAmount,
      toAmount,
      exchangeRate,
      minimumReceived
    };

    this.updateSwapData(newSwapData);
    return newSwapData;
  }

  swapTokens(): void {
    const currentData = this.swapDataSubject.value;
    const newSwapData: SwapData = {
      ...currentData,
      fromToken: currentData.toToken,
      toToken: currentData.fromToken,
      fromAmount: 0,
      toAmount: 0,
      exchangeRate: this.exchangeRates[`${currentData.toToken.symbol}-${currentData.fromToken.symbol}`] || 1,
      minimumReceived: 0
    };

    this.updateSwapData(newSwapData);
  }

  private updateSwapData(newSwapData: SwapData): void {
    this.swapDataSubject.next(newSwapData);
    this._swapData.set(newSwapData);
  }

  async executeSwap(swapData: SwapData): Promise<boolean> {
    this._isSwapping.set(true);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        this._isSwapping.set(false);
        // Simulate successful swap
        resolve(true);
      }, 2000);
    });
  }

  get currentSwapData(): SwapData {
    return this.swapDataSubject.value;
  }
} 