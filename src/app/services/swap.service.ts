import { Injectable, signal, computed, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Token, SwapData } from '../models/interfaces';
import { LivePriceService } from './live-price.service';

@Injectable({
  providedIn: 'root'
})
export class SwapService {
  private readonly livePriceService = inject(LivePriceService);

  // Default tokens with updated data
  private defaultTokens: Token[] = [
    { symbol: 'BNB', name: 'BNB', icon: 'bnb', balance: 0.5432, address: '0xbb4CdB9CBd36B01bD1cBaeBF2De08d9173bc095c', decimals: 18 },
    { symbol: 'USDT', name: 'Tether USD', icon: 'usdt', balance: 2500.00, address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', icon: 'usdc', balance: 850.50, address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
    { symbol: 'ETH', name: 'Ethereum', icon: 'eth', balance: 1.2345, address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', decimals: 18 },
    { symbol: 'BTCB', name: 'Bitcoin BEP20', icon: 'btc', balance: 0.0876, address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', decimals: 18 }
  ];

  // BehaviorSubject for compatibility
  private swapDataSubject = new BehaviorSubject<SwapData>({
    fromToken: this.defaultTokens[0],
    toToken: this.defaultTokens[1],
    fromAmount: 0,
    toAmount: 0,
    exchangeRate: 1,
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
    return data.fromAmount > 0 && !this._isSwapping() && this.livePriceService.prices().size > 0;
  });

  // Computed exchange rate using live prices
  readonly currentExchangeRate = computed(() => {
    const data = this._swapData();
    const exchangeRate = this.livePriceService.getExchangeRate(data.fromToken.symbol, data.toToken.symbol);
    return exchangeRate?.rate || 1;
  });

  getTokens(): Token[] {
    return this.defaultTokens;
  }

  selectFromToken(token: Token): void {
    const currentData = this.swapDataSubject.value;
    const exchangeRateData = this.livePriceService.getExchangeRate(token.symbol, currentData.toToken.symbol);
    const exchangeRate = exchangeRateData?.rate || 1;
    
    const newSwapData: SwapData = {
      ...currentData,
      fromToken: token,
      exchangeRate,
      fromAmount: 0,
      toAmount: 0,
      minimumReceived: 0
    };

    this.updateSwapData(newSwapData);
  }

  selectToToken(token: Token): void {
    const currentData = this.swapDataSubject.value;
    const exchangeRateData = this.livePriceService.getExchangeRate(currentData.fromToken.symbol, token.symbol);
    const exchangeRate = exchangeRateData?.rate || 1;
    
    const newSwapData: SwapData = {
      ...currentData,
      toToken: token,
      exchangeRate,
      fromAmount: 0,
      toAmount: 0,
      minimumReceived: 0
    };

    this.updateSwapData(newSwapData);
  }

  calculateSwap(fromAmount: number): SwapData {
    const currentData = this.swapDataSubject.value;
    const exchangeRateData = this.livePriceService.getExchangeRate(
      currentData.fromToken.symbol, 
      currentData.toToken.symbol,
      fromAmount
    );
    
    const exchangeRate = exchangeRateData?.rate || 1;
    
    // Calculate swap with slippage and fees
    const toAmount = fromAmount * exchangeRate;
    const priceImpact = exchangeRateData?.priceImpact || this.calculatePriceImpact(fromAmount, currentData.fromToken.symbol);
    const tradingFee = 0.25; // 0.25% trading fee
    const feeAmount = toAmount * (tradingFee / 100);
    const finalAmount = toAmount - feeAmount;
    const slippagePercent = exchangeRateData?.slippage || 0.5;
    const minimumReceived = finalAmount * (1 - slippagePercent / 100);

    const newSwapData: SwapData = {
      ...currentData,
      fromAmount,
      toAmount: finalAmount,
      exchangeRate,
      priceImpact,
      tradingFee,
      minimumReceived
    };

    this.updateSwapData(newSwapData);
    console.log('💱 Live swap data updated:', newSwapData);
    return newSwapData;
  }

  swapTokens(): void {
    const currentData = this.swapDataSubject.value;
    const exchangeRateData = this.livePriceService.getExchangeRate(
      currentData.toToken.symbol, 
      currentData.fromToken.symbol
    );
    const exchangeRate = exchangeRateData?.rate || 1;
    
    const newSwapData: SwapData = {
      ...currentData,
      fromToken: currentData.toToken,
      toToken: currentData.fromToken,
      fromAmount: 0,
      toAmount: 0,
      exchangeRate,
      minimumReceived: 0
    };

    this.updateSwapData(newSwapData);
  }

  private updateSwapData(newData: SwapData): void {
    this._swapData.set(newData);
    this.swapDataSubject.next(newData);
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

  /**
   * Calculate price impact based on swap amount
   */
  private calculatePriceImpact(amount: number, tokenSymbol: string): number {
    // Simple price impact calculation - in real DEX this would be more complex
    const tokenPrice = this.getTokenPrice(tokenSymbol);
    const swapValueUSD = amount * tokenPrice;
    
    // Base impact + amount-based impact
    let impact = 0.01; // 0.01% base impact
    
    if (swapValueUSD > 100000) {
      impact += 0.5; // Large trades have higher impact
    } else if (swapValueUSD > 10000) {
      impact += 0.2;
    } else if (swapValueUSD > 1000) {
      impact += 0.05;
    }
    
    return impact;
  }

  /**
   * Get live price for a token
   */
  getTokenPrice(symbol: string): number {
    const tokenPrice = this.livePriceService.getTokenPrice(symbol);
    return tokenPrice?.price || 0;
  }

  /**
   * Get 24h price change for a token
   */
  getTokenPriceChange(symbol: string): number {
    const tokenPrice = this.livePriceService.getTokenPrice(symbol);
    return tokenPrice?.change24h || 0;
  }

  /**
   * Check if live price data is available
   */
  hasLivePrices(): boolean {
    return this.livePriceService.prices().size > 0;
  }
} 