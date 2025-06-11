import { Component, Input, inject, computed, signal, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LivePriceService } from '../../services/live-price.service';

@Component({
  selector: 'app-price-display',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="price-display" [class.loading]="livePriceService.loading()">
      @if (symbol && livePriceService.prices().size > 0) {
        <div class="price-container">
          <div class="token-info">
            <span class="token-symbol">{{ symbol }}</span>
            @if (showName && tokenName()) {
              <span class="token-name">{{ tokenName() }}</span>
            }
          </div>
          
          <div class="price-info">
            <div class="current-price">
              {{ formatPrice(currentPrice()) }}
            </div>
            
            @if (showChange && priceChange() !== 0) {
              <div class="price-change" [class.positive]="priceChange() > 0" [class.negative]="priceChange() < 0">
                <span class="change-indicator">{{ priceChange() > 0 ? '↗' : '↘' }}</span>
                <span class="change-value">{{ formatChange(priceChange()) }}%</span>
              </div>
            }
          </div>
          
          @if (showLastUpdate && livePriceService.lastUpdate()) {
            <div class="last-update">
              {{ lastUpdateDisplay() }}
            </div>
          }
        </div>
      } @else if (livePriceService.loading()) {
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <span class="loading-text">Loading {{ symbol }} price...</span>
        </div>
      } @else if (livePriceService.error()) {
        <div class="error-container">
          <span class="error-icon">⚠️</span>
          <span class="error-text">{{ livePriceService.error() }}</span>
          <button class="retry-button" (click)="retryFetch()">Retry</button>
        </div>
      } @else {
        <div class="no-data">
          <span class="no-data-text">{{ symbol }} price unavailable</span>
        </div>
      }
    </div>
  `,
  styleUrl: './price-display.component.scss'
})
export class PriceDisplayComponent implements OnDestroy {
  @Input() symbol: string = '';
  @Input() showName: boolean = false;
  @Input() showChange: boolean = true;
  @Input() showLastUpdate: boolean = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() inline: boolean = false;

  protected readonly livePriceService = inject(LivePriceService);
  
  // Internal signal for controlled time updates
  private readonly timeUpdateSignal = signal<number>(Date.now());
  private updateInterval?: number;

  // Computed values for reactive updates
  protected readonly currentPrice = computed(() => {
    const tokenPrice = this.livePriceService.getTokenPrice(this.symbol);
    return tokenPrice?.price || 0;
  });

  protected readonly priceChange = computed(() => {
    const tokenPrice = this.livePriceService.getTokenPrice(this.symbol);
    return tokenPrice?.change24h || 0;
  });

  protected readonly tokenName = computed(() => {
    const names: { [key: string]: string } = {
      'BNB': 'Binance Coin',
      'USDT': 'Tether USD',
      'USDC': 'USD Coin',
      'ETH': 'Ethereum',
      'BTCB': 'Bitcoin BEP20'
    };
    return names[this.symbol] || this.symbol;
  });

  // Computed signal for last update display - updates every 10 seconds
  protected readonly lastUpdateDisplay = computed(() => {
    const lastUpdate = this.livePriceService.lastUpdate();
    this.timeUpdateSignal(); // Subscribe to time updates
    
    if (!lastUpdate) return 'Never updated';
    
    const now = Date.now();
    const diff = now - lastUpdate;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) return `${minutes}m ago`;
    if (seconds < 5) return 'Just now';
    if (seconds < 30) return `${Math.floor(seconds / 10) * 10}s ago`;
    return `${Math.floor(seconds / 10) * 10}s ago`;
  });

  constructor() {
    // Update time signal every 10 seconds to control the frequency
    this.updateInterval = window.setInterval(() => {
      this.timeUpdateSignal.set(Date.now());
    }, 10000);
  }

  ngOnDestroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  protected formatPrice(price: number): string {
    if (price === 0) return '$0.00';
    
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
    } else if (price >= 1) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  }

  protected formatChange(change: number): string {
    return Math.abs(change).toFixed(2);
  }

  protected retryFetch(): void {
    this.livePriceService.refreshPrices();
  }
} 