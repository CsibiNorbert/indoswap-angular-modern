import { Injectable, signal } from '@angular/core';

interface TokenPrice {
  symbol: string;
  usd: number;
  change24h: number;
}

@Injectable({
  providedIn: 'root'
})
export class PriceService {
  private readonly tokenPrices = signal<Map<string, TokenPrice>>(new Map());
  private priceUpdateInterval: any = null;

  // Public computed for getting specific token prices
  getTokenPrice(symbol: string): number {
    const price = this.tokenPrices().get(symbol.toLowerCase());
    return price?.usd || 0;
  }

  // Get all current prices
  getAllPrices(): Map<string, TokenPrice> {
    return this.tokenPrices();
  }

  // Fetch prices from CoinGecko API (free, no API key needed)
  async fetchTokenPrices(): Promise<void> {
    console.log('💰 PriceService: Fetching token prices...');
    
    try {
      // Fetch prices for common BSC tokens
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin,ethereum,tether,binance-usd,usd-coin,chainlink&vs_currencies=usd&include_24hr_change=true',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('💰 PriceService: Received price data:', data);

      // Map the response to our token prices
      const newPrices = new Map<string, TokenPrice>();

      // BNB price
      if (data.binancecoin) {
        newPrices.set('bnb', {
          symbol: 'BNB',
          usd: data.binancecoin.usd,
          change24h: data.binancecoin.usd_24h_change || 0
        });
      }

      // ETH price  
      if (data.ethereum) {
        newPrices.set('eth', {
          symbol: 'ETH',
          usd: data.ethereum.usd,
          change24h: data.ethereum.usd_24h_change || 0
        });
      }

      // USDT price
      if (data.tether) {
        newPrices.set('usdt', {
          symbol: 'USDT',
          usd: data.tether.usd,
          change24h: data.tether.usd_24h_change || 0
        });
      }

      // BUSD price
      if (data['binance-usd']) {
        newPrices.set('busd', {
          symbol: 'BUSD',
          usd: data['binance-usd'].usd,
          change24h: data['binance-usd'].usd_24h_change || 0
        });
      }

      // USDC price
      if (data['usd-coin']) {
        newPrices.set('usdc', {
          symbol: 'USDC',
          usd: data['usd-coin'].usd,
          change24h: data['usd-coin'].usd_24h_change || 0
        });
      }

      // LINK price
      if (data.chainlink) {
        newPrices.set('link', {
          symbol: 'LINK',
          usd: data.chainlink.usd,
          change24h: data.chainlink.usd_24h_change || 0
        });
      }

      this.tokenPrices.set(newPrices);
      console.log('✅ PriceService: Prices updated successfully', newPrices.size, 'tokens');

    } catch (error) {
      console.error('🚨 PriceService: Failed to fetch prices:', error);
      
      // Fallback prices if API fails
      this.setFallbackPrices();
    }
  }

  private setFallbackPrices(): void {
    console.log('⚠️ PriceService: Using fallback prices');
    const fallbackPrices = new Map<string, TokenPrice>();
    
    fallbackPrices.set('bnb', { symbol: 'BNB', usd: 685, change24h: 0 });
    fallbackPrices.set('eth', { symbol: 'ETH', usd: 3400, change24h: 0 });
    fallbackPrices.set('usdt', { symbol: 'USDT', usd: 1.00, change24h: 0 });
    fallbackPrices.set('busd', { symbol: 'BUSD', usd: 1.00, change24h: 0 });
    fallbackPrices.set('usdc', { symbol: 'USDC', usd: 1.00, change24h: 0 });
    fallbackPrices.set('link', { symbol: 'LINK', usd: 25, change24h: 0 });
    
    this.tokenPrices.set(fallbackPrices);
  }

  // Calculate USD value for a token amount
  calculateUSDValue(symbol: string, amount: number): number {
    if (amount === 0) return 0;
    const price = this.getTokenPrice(symbol);
    const value = price * amount;
    console.log(`💰 PriceService: ${amount} ${symbol.toUpperCase()} × $${price} = $${value.toFixed(2)}`);
    return value;
  }

  // Format USD value for display (like MetaMask)
  formatUSDValue(value: number): string {
    if (value === 0) return '$0.00';
    if (value < 0.01) return '<$0.01';
    if (value < 1) return `$${value.toFixed(3)}`;
    if (value < 10) return `$${value.toFixed(2)}`;
    if (value < 1000) return `$${value.toFixed(2)}`;
    if (value < 10000) return `$${(value / 1000).toFixed(2)}K`;
    if (value < 1000000) return `$${(value / 1000).toFixed(1)}K`;
    if (value < 10000000) return `$${(value / 1000000).toFixed(2)}M`;
    return `$${(value / 1000000).toFixed(1)}M`;
  }

  // Auto-refresh prices every 30 seconds
  startPriceUpdates(): void {
    console.log('💰 PriceService: Starting auto price updates (every 30s)...');
    
    // Initial fetch
    this.fetchTokenPrices();
    
    // Clear existing interval if any
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
    }
    
    // Update every 30 seconds
    this.priceUpdateInterval = setInterval(() => {
      console.log('💰 PriceService: Auto-updating prices...');
      this.fetchTokenPrices();
    }, 30000);
  }

  // Stop auto updates (for cleanup)
  stopPriceUpdates(): void {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
      console.log('💰 PriceService: Stopped price updates');
    }
  }

  // Get price change percentage for display
  getPriceChange(symbol: string): number {
    const price = this.tokenPrices().get(symbol.toLowerCase());
    return price?.change24h || 0;
  }

  // Check if prices are loaded
  arePricesLoaded(): boolean {
    return this.tokenPrices().size > 0;
  }
} 