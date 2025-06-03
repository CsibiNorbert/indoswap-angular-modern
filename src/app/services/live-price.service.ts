import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { interval, of } from 'rxjs';
import { map, catchError, retry } from 'rxjs/operators';

interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  lastUpdated: number;
  source: 'mock' | 'binance';
}

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  reverseRate: number;
  slippage: number;
  priceImpact: number;
  source: string;
}

@Injectable({
  providedIn: 'root'
})
export class LivePriceService {
  private readonly http = inject(HttpClient);

  // Signal-based state management
  private readonly tokenPrices = signal<Map<string, TokenPrice>>(new Map());
  private readonly isLoading = signal<boolean>(false);
  private readonly lastUpdateTime = signal<number>(0);
  private readonly errorMessage = signal<string>('');

  // Binance API endpoints - much better than CoinGecko!
  private readonly API_ENDPOINTS = {
    // Primary: Binance public data API (better CORS support)
    binanceData: 'https://data-api.binance.vision/api/v3/ticker/24hr',
    // Fallback: Main Binance API
    binanceMain: 'https://api.binance.com/api/v3/ticker/24hr'
  } as const;

  // Token mapping for Binance symbol pairs
  private readonly TOKEN_SYMBOLS = new Map([
    ['BNB', 'BNBUSDT'],
    ['BUSD', 'BUSDUSDT'], 
    ['USDC', 'USDCUSDT'],
    ['ETH', 'ETHUSDT'],
    ['BTCB', 'BTCUSDT'],
    ['USDT', 'STABLE'] // USDT is our base stable, calculated as $1.00
  ]);

  // Realistic mock data for immediate display
  private readonly MOCK_PRICES = new Map<string, TokenPrice>([
    ['BNB', { 
      symbol: 'BNB', 
      price: 285.42, 
      change24h: 2.45, 
      volume24h: 1234567890, 
      lastUpdated: Date.now(),
      source: 'mock'
    }],
    ['BUSD', { 
      symbol: 'BUSD', 
      price: 1.0000, 
      change24h: 0.02, 
      volume24h: 567890123, 
      lastUpdated: Date.now(),
      source: 'mock'
    }],
    ['USDT', { 
      symbol: 'USDT', 
      price: 1.0001, 
      change24h: -0.01, 
      volume24h: 2345678901, 
      lastUpdated: Date.now(),
      source: 'mock'
    }],
    ['USDC', { 
      symbol: 'USDC', 
      price: 0.9999, 
      change24h: 0.01, 
      volume24h: 1876543210, 
      lastUpdated: Date.now(),
      source: 'mock'
    }],
    ['ETH', { 
      symbol: 'ETH', 
      price: 2456.78, 
      change24h: 1.84, 
      volume24h: 987654321, 
      lastUpdated: Date.now(),
      source: 'mock'
    }],
    ['BTCB', { 
      symbol: 'BTCB', 
      price: 43256.89, 
      change24h: -0.67, 
      volume24h: 543210987, 
      lastUpdated: Date.now(),
      source: 'mock'
    }]
  ]);

  // Public computed signals
  readonly prices = computed(() => this.tokenPrices());
  readonly loading = computed(() => this.isLoading());
  readonly lastUpdate = computed(() => this.lastUpdateTime());
  readonly error = computed(() => this.errorMessage());

  constructor() {
    console.log('🚀 Binance Price Service initialized');
    this.initializePriceUpdates();
  }

  private initializePriceUpdates(): void {
    // Start with mock data for immediate display
    this.loadMockData();
    
    // Fetch live Binance data
    this.fetchBinancePrices();
    
    // Set up periodic updates every 10 seconds
    interval(10000).subscribe(() => {
      this.fetchBinancePrices();
    });
  }

  private loadMockData(): void {
    this.tokenPrices.set(new Map(this.MOCK_PRICES));
    this.lastUpdateTime.set(Date.now());
    this.errorMessage.set('Demo Mode: Using realistic demo prices with live fluctuations');
    console.log('✅ Mock prices loaded, fetching live Binance data...');
  }

  async fetchBinancePrices(): Promise<void> {
    this.isLoading.set(true);
    console.log('🔍 Fetching live prices from Binance...');

    // Try primary Binance data API first (better CORS)
    try {
      const response = await this.tryBinanceEndpoint(this.API_ENDPOINTS.binanceData);
      if (response && response.length > 0) {
        const prices = this.parseBinanceResponse(response);
        if (prices.size > 0) {
          this.tokenPrices.set(prices);
          this.lastUpdateTime.set(Date.now());
          this.errorMessage.set(`Live Binance Prices • Updates every 10 seconds • ${prices.size} tokens`);
          console.log('✅ Live Binance prices updated successfully:', Array.from(prices.keys()));
          this.isLoading.set(false);
          return;
        }
      }
    } catch (error) {
      console.log('⚠️ Primary Binance endpoint failed, trying fallback...', error);
    }

    // Try fallback Binance main API
    try {
      const response = await this.tryBinanceEndpoint(this.API_ENDPOINTS.binanceMain);
      if (response && response.length > 0) {
        const prices = this.parseBinanceResponse(response);
        if (prices.size > 0) {
          this.tokenPrices.set(prices);
          this.lastUpdateTime.set(Date.now());
          this.errorMessage.set(`Live Binance Prices (Fallback) • Updates every 10 seconds • ${prices.size} tokens`);
          console.log('✅ Binance fallback API succeeded:', Array.from(prices.keys()));
          this.isLoading.set(false);
          return;
        }
      }
    } catch (error) {
      console.log('⚠️ Binance fallback failed:', error);
    }

    // If both fail, add realistic fluctuations to demo data
    this.updateDemoWithFluctuation();
    this.errorMessage.set('Demo Mode: Realistic demo prices with live fluctuations (Binance unavailable)');
    console.log('📊 Using demo mode with realistic fluctuations');
    
    this.isLoading.set(false);
  }

  private async tryBinanceEndpoint(endpoint: string): Promise<any[]> {
    console.log('🔗 Trying Binance endpoint:', endpoint);
    
    const response = await this.http.get<any[]>(endpoint).pipe(
      retry(2),
      catchError(this.handleHttpError.bind(this))
    ).toPromise();

    return response || []; // Ensure we always return an array
  }

  private parseBinanceResponse(data: any[]): Map<string, TokenPrice> {
    const prices = new Map<string, TokenPrice>();
    
    try {
      // Create a lookup map for faster symbol matching
      const symbolData = new Map();
      data.forEach(item => {
        symbolData.set(item.symbol, item);
      });

      for (const [tokenSymbol, binanceSymbol] of this.TOKEN_SYMBOLS.entries()) {
        if (binanceSymbol === 'STABLE') {
          // USDT is our stable base - always $1.00
          prices.set(tokenSymbol, {
            symbol: tokenSymbol,
            price: 1.0000,
            change24h: 0.01,
            volume24h: 3000000000, // High volume for USDT
            lastUpdated: Date.now(),
            source: 'binance'
          });
        } else {
          const ticker = symbolData.get(binanceSymbol);
          if (ticker) {
            prices.set(tokenSymbol, {
              symbol: tokenSymbol,
              price: parseFloat(ticker.lastPrice),
              change24h: parseFloat(ticker.priceChangePercent),
              volume24h: parseFloat(ticker.quoteVolume),
              lastUpdated: Date.now(),
              source: 'binance'
            });
          }
        }
      }

      console.log('✅ Parsed Binance data for tokens:', Array.from(prices.keys()));
      return prices;
    } catch (error) {
      console.error('❌ Error parsing Binance response:', error);
      return new Map();
    }
  }

  private updateDemoWithFluctuation(): void {
    const currentPrices = new Map(this.tokenPrices());
    
    for (const [symbol, priceData] of currentPrices.entries()) {
      // Generate realistic fluctuation (-0.3% to +0.3%)
      const fluctuation = (Math.random() - 0.5) * 0.006;
      const newPrice = priceData.price * (1 + fluctuation);
      
      // Update 24h change slightly
      const changeFluctuation = (Math.random() - 0.5) * 0.05;
      const newChange24h = priceData.change24h + changeFluctuation;
      
      currentPrices.set(symbol, {
        ...priceData,
        price: parseFloat(newPrice.toFixed(priceData.symbol === 'BNB' || priceData.symbol === 'ETH' || priceData.symbol === 'BTCB' ? 2 : 4)),
        change24h: parseFloat(newChange24h.toFixed(2)),
        lastUpdated: Date.now()
      });
    }
    
    this.tokenPrices.set(currentPrices);
    this.lastUpdateTime.set(Date.now());
  }

  private handleHttpError = (error: HttpErrorResponse) => {
    console.error('❌ HTTP Error:', {
      status: error.status,
      message: error.message,
      url: error.url
    });
    
    // Return empty result to continue with fallback
    return of([]);
  };

  // Public methods for components
  getTokenPrice(symbol: string): TokenPrice | null {
    return this.tokenPrices().get(symbol.toUpperCase()) || null;
  }

  getExchangeRate(fromSymbol: string, toSymbol: string, amount: number = 1): ExchangeRate | null {
    const fromPrice = this.getTokenPrice(fromSymbol);
    const toPrice = this.getTokenPrice(toSymbol);

    if (!fromPrice || !toPrice) {
      return null;
    }

    const rate = fromPrice.price / toPrice.price;
    const reverseRate = toPrice.price / fromPrice.price;
    const slippage = this.calculateSlippage(amount, fromSymbol, toSymbol);
    const priceImpact = this.calculatePriceImpact(amount, fromSymbol);

    return {
      from: fromSymbol,
      to: toSymbol,
      rate,
      reverseRate,
      slippage,
      priceImpact,
      source: `${fromPrice.source} + ${toPrice.source}`
    };
  }

  private calculateSlippage(amount: number, fromSymbol: string, toSymbol: string): number {
    const stablecoins = ['BUSD', 'USDT', 'USDC'];
    const isStablePair = stablecoins.includes(fromSymbol) && stablecoins.includes(toSymbol);
    
    if (isStablePair) {
      if (amount < 1000) return 0.05;
      if (amount < 10000) return 0.1;
      return 0.15;
    }
    
    if (amount < 1000) return 0.1;
    if (amount < 10000) return 0.3;
    if (amount < 100000) return 0.8;
    return 2.0;
  }

  private calculatePriceImpact(amount: number, symbol: string): number {
    const tokenPrice = this.getTokenPrice(symbol);
    if (!tokenPrice) return 0;

    const tradeValueUSD = amount * tokenPrice.price;
    
    if (tradeValueUSD < 1000) return 0.01;
    if (tradeValueUSD < 10000) return 0.05;
    if (tradeValueUSD < 100000) return 0.2;
    return 1.0;
  }

  async refreshPrices(): Promise<void> {
    await this.fetchBinancePrices();
  }

  getSupportedTokens(): string[] {
    return Array.from(this.TOKEN_SYMBOLS.keys());
  }

  isPriceStale(): boolean {
    const now = Date.now();
    const lastUpdate = this.lastUpdateTime();
    return (now - lastUpdate) > 30000; // 30 seconds
  }

  getPriceSource(): string {
    const prices = this.tokenPrices();
    if (prices.size === 0) return 'No data';
    
    const firstPrice = Array.from(prices.values())[0];
    switch (firstPrice.source) {
      case 'mock': return 'Demo Prices';
      case 'binance': return 'Live Binance Prices';
      default: return 'Unknown';
    }
  }
}

// Helper functions
export function formatPrice(price: number): string {
  if (price >= 1) {
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    });
  } else {
    return price.toFixed(8);
  }
}

export function formatPercentage(percentage: number): string {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(2)}%`;
}