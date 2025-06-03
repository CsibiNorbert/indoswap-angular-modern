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
  source: 'mock' | 'coingecko' | 'proxy' | 'pancakeswap';
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

  // FIXED: Use complete URLs with HTTPS - Added PancakeSwap for DEX prices
  private readonly API_ENDPOINTS = {
    // DEX Prices - PancakeSwap (Primary for trading)
    pancakeInfo: 'https://api.pancakeswap.info/api/v2/tokens',
    pancakeSubgraph: 'https://api.thegraph.com/subgraphs/name/pancakeswap/exchange',
    // Market Prices - CoinGecko (Secondary for market data)
    coingecko: 'https://api.coingecko.com/api/v3/simple/price',
    // CORS proxy alternatives - trying multiple for better success rate
    proxy1: 'https://api.allorigins.win/get?url=',
    proxy2: 'https://corsproxy.io/?',
    proxy3: 'https://cors.eu.org/',
    // Fallback to mock data
    mock: 'mock'
  } as const;

  // Realistic mock data (updated with current market prices)
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

  // Token mapping for both APIs
  private readonly TOKEN_IDS = new Map([
    ['BNB', { coingecko: 'binancecoin', pancake: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' }],
    ['BUSD', { coingecko: 'binance-usd', pancake: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56' }], 
    ['USDT', { coingecko: 'tether', pancake: '0x55d398326f99059fF775485246999027B3197955' }],
    ['USDC', { coingecko: 'usd-coin', pancake: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' }],
    ['ETH', { coingecko: 'ethereum', pancake: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8' }],
    ['BTCB', { coingecko: 'bitcoin', pancake: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c' }]
  ]);

  // Public computed signals
  readonly prices = computed(() => this.tokenPrices());
  readonly loading = computed(() => this.isLoading());
  readonly lastUpdate = computed(() => this.lastUpdateTime());
  readonly error = computed(() => this.errorMessage());

  constructor() {
    console.log('🚀 LivePriceService initialized');
    this.initializePriceUpdates();
  }

  private initializePriceUpdates(): void {
    // Start with mock data immediately
    this.loadMockData();
    
    // Try to get real data
    this.fetchAllPrices();
    
    // Set up periodic updates with realistic fluctuations
    interval(10000).subscribe(() => { // Every 10 seconds
      this.updateWithFluctuation();
    });
  }

  private loadMockData(): void {
    this.tokenPrices.set(new Map(this.MOCK_PRICES));
    this.lastUpdateTime.set(Date.now());
    this.errorMessage.set('Demo Mode: Using realistic demo prices');
    console.log('📊 Mock prices loaded:', Array.from(this.MOCK_PRICES.keys()));
  }

  private updateWithFluctuation(): void {
    const currentPrices = new Map(this.tokenPrices());
    let hasChanges = false;
    
    for (const [symbol, priceData] of currentPrices.entries()) {
      // Generate realistic fluctuation (-0.3% to +0.3%)
      const fluctuation = (Math.random() - 0.5) * 0.006; // ±0.3%
      const newPrice = priceData.price * (1 + fluctuation);
      
      // Update 24h change slightly
      const changeFluctuation = (Math.random() - 0.5) * 0.05; // ±0.025%
      const newChange24h = priceData.change24h + changeFluctuation;
      
      currentPrices.set(symbol, {
        ...priceData,
        price: parseFloat(newPrice.toFixed(priceData.symbol === 'BNB' || priceData.symbol === 'ETH' || priceData.symbol === 'BTCB' ? 2 : 4)),
        change24h: parseFloat(newChange24h.toFixed(2)),
        lastUpdated: Date.now()
      });
      hasChanges = true;
    }
    
    if (hasChanges) {
      this.tokenPrices.set(currentPrices);
      this.lastUpdateTime.set(Date.now());
      console.log('🔄 Prices updated with fluctuations');
    }
  }

  async fetchAllPrices(): Promise<void> {
    this.isLoading.set(true);
    console.log('🔍 Attempting to fetch live prices...');

    // Try PancakeSwap first (better for DEX)
    try {
      console.log('🥞 Trying PancakeSwap API...');
      const pancakeData = await this.tryPancakeSwapMethod();
      if (pancakeData && pancakeData.size > 0) {
        this.tokenPrices.set(pancakeData);
        this.lastUpdateTime.set(Date.now());
        this.errorMessage.set('Live DEX prices from PancakeSwap');
        console.log('✅ PancakeSwap prices fetched successfully!');
        this.isLoading.set(false);
        return;
      }
    } catch (error) {
      console.log('⚠️ PancakeSwap method failed:', error);
    }

    // Try multiple proxy methods for CoinGecko as fallback
    const proxyMethods = [
      () => this.tryProxyMethod('proxy1'),
      () => this.tryProxyMethod('proxy2'), 
      () => this.tryProxyMethod('proxy3')
    ];

    for (const [index, proxyMethod] of proxyMethods.entries()) {
      try {
        console.log(`🔗 Trying CoinGecko proxy method ${index + 1}/3...`);
        const liveData = await proxyMethod();
        if (liveData && liveData.size > 0) {
          this.tokenPrices.set(liveData);
          this.lastUpdateTime.set(Date.now());
          this.errorMessage.set(`Live market prices from CoinGecko (Proxy ${index + 1})`);
          console.log(`✅ CoinGecko prices fetched successfully via proxy ${index + 1}!`);
          this.isLoading.set(false);
          return;
        }
      } catch (error) {
        console.log(`⚠️ CoinGecko proxy method ${index + 1} failed:`, error);
      }
    }

    try {
      // Last attempt: Try direct CoinGecko API (will likely fail due to CORS)
      console.log('🔗 Trying direct CoinGecko API...');
      const directData = await this.tryDirectMethod();
      if (directData && directData.size > 0) {
        this.tokenPrices.set(directData);
        this.lastUpdateTime.set(Date.now());
        this.errorMessage.set('Live market prices from CoinGecko (Direct)');
        console.log('✅ Direct CoinGecko API succeeded unexpectedly!');
        this.isLoading.set(false);
        return;
      }
    } catch (error) {
      console.log('⚠️ Direct method failed (expected due to CORS):', error);
    }

    // Fallback: Keep mock data but update error message
    console.log('📊 All live price methods failed - using realistic demo prices');
    this.errorMessage.set('Demo Mode: Live APIs unavailable, using realistic demo prices');
    
    this.isLoading.set(false);
  }

  private async tryPancakeSwapMethod(): Promise<Map<string, TokenPrice> | null> {
    try {
      // Use PancakeSwap Info API
      const response = await this.http.get<any>(this.API_ENDPOINTS.pancakeInfo).pipe(
        retry(2),
        catchError(this.handleHttpError.bind(this))
      ).toPromise();

      if (response && response.data) {
        return this.parsePancakeSwapResponse(response.data);
      }
    } catch (error) {
      console.log('⚠️ PancakeSwap Info API failed, trying fallback...');
    }
    
    return null;
  }

  private parsePancakeSwapResponse(data: any): Map<string, TokenPrice> {
    const prices = new Map<string, TokenPrice>();
    
    for (const [symbol, tokenInfo] of this.TOKEN_IDS.entries()) {
      const tokenAddress = tokenInfo.pancake.toLowerCase();
      const tokenData = data[tokenAddress];
      
      if (tokenData) {
        prices.set(symbol, {
          symbol,
          price: parseFloat(tokenData.price),
          change24h: parseFloat(tokenData.price_change_percentage_24h) || 0,
          volume24h: parseFloat(tokenData.quote_volume_24h) || 0,
          lastUpdated: Date.now(),
          source: 'pancakeswap'
        });
      }
    }
    
    return prices;
  }

  private async tryProxyMethod(proxyKey: 'proxy1' | 'proxy2' | 'proxy3'): Promise<Map<string, TokenPrice> | null> {
    const tokenIds = Array.from(this.TOKEN_IDS.values()).map(token => token.coingecko).join(',');
    const targetUrl = `${this.API_ENDPOINTS.coingecko}?ids=${tokenIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_last_updated_at=true`;
    
    // Use the specified proxy with proper type casting
    const proxyUrl = `${this.API_ENDPOINTS[proxyKey]}${encodeURIComponent(targetUrl)}`;
    
    console.log('🔗 Trying proxy URL:', proxyUrl);
    
    const response = await this.http.get<any>(proxyUrl).pipe(
      retry(2),
      catchError(this.handleHttpError.bind(this))
    ).toPromise();

    if (response && response.contents) {
      const priceData = JSON.parse(response.contents);
      return this.parseCoinGeckoResponse(priceData);
    }
    
    return null;
  }

  private async tryDirectMethod(): Promise<Map<string, TokenPrice> | null> {
    const tokenIds = Array.from(this.TOKEN_IDS.values()).map(token => token.coingecko).join(',');
    const url = `${this.API_ENDPOINTS.coingecko}?ids=${tokenIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_last_updated_at=true`;
    
    console.log('🔗 Trying direct URL:', url);
    
    const response = await this.http.get<any>(url).pipe(
      retry(1),
      catchError(this.handleHttpError.bind(this))
    ).toPromise();

    if (response) {
      return this.parseCoinGeckoResponse(response);
    }
    
    return null;
  }

  private parseCoinGeckoResponse(data: any): Map<string, TokenPrice> {
    const prices = new Map<string, TokenPrice>();
    
    for (const [symbol, tokenInfo] of this.TOKEN_IDS.entries()) {
      const coinGeckoId = tokenInfo.coingecko;
      const coinData = data[coinGeckoId];
      if (coinData) {
        prices.set(symbol, {
          symbol,
          price: coinData.usd,
          change24h: coinData.usd_24h_change || 0,
          volume24h: coinData.usd_24h_vol || 0,
          lastUpdated: (coinData.last_updated_at || Date.now() / 1000) * 1000,
          source: 'coingecko'
        });
      }
    }
    
    return prices;
  }

  private handleHttpError = (error: HttpErrorResponse) => {
    console.error('❌ HTTP Error:', {
      status: error.status,
      message: error.message,
      url: error.url
    });
    
    // Return empty result to continue with fallback
    return of(null);
  };

  // Public methods
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
    await this.fetchAllPrices();
  }

  getSupportedTokens(): string[] {
    return Array.from(this.TOKEN_IDS.keys());
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
      case 'proxy': return 'Live Prices (Proxy)';
      case 'coingecko': return 'Live Prices (CoinGecko)';
      case 'pancakeswap': return 'Live DEX Prices (PancakeSwap)';
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