import { Component, inject, computed, signal, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LivePriceService } from '../../services/live-price.service';

@Component({
  selector: 'app-demo-banner',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isLiveMode()) {
      <div class="demo-banner real-time">
        <div class="demo-banner__content">
          <div class="demo-banner__icon">🚀</div>
          <div class="demo-banner__text">
            <span class="demo-banner__title">Live Prices</span>
            <span class="demo-banner__subtitle">
              {{ priceService.getPriceSource() }} • Updates every 10 seconds
            </span>
          </div>
          <div class="demo-banner__status">
            <div class="status-indicator"></div>
            <span>{{ lastUpdateDisplay() }}</span>
          </div>
        </div>
      </div>
    }
    @if (!isLiveMode()) {
      <div class="demo-banner">
        <div class="demo-banner__content">
          <div class="demo-banner__icon">🎮</div>
          <div class="demo-banner__text">
            <span class="demo-banner__title">Demo Mode</span>
            <span class="demo-banner__subtitle">
              Realistic prices with live fluctuations • Updates every 10s
            </span>
          </div>
          <div class="demo-banner__status">
            <div class="status-indicator"></div>
            <span>{{ priceService.getPriceSource() }}</span>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './demo-banner.component.scss'
})
export class DemoBannerComponent implements OnDestroy {
  protected readonly priceService = inject(LivePriceService);
  
  // Internal signal for controlled time updates
  private readonly timeUpdateSignal = signal<number>(Date.now());
  private updateInterval?: number;

  // Computed signal for last update display - updates every 10 seconds  
  protected readonly lastUpdateDisplay = computed(() => {
    const lastUpdate = this.priceService.lastUpdate();
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

  protected isLiveMode(): boolean {
    const source = this.priceService.getPriceSource();
    return source.includes('Live Prices');
  }
} 