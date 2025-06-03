import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LivePriceService } from '../../services/live-price.service';

@Component({
  selector: 'app-demo-banner',
  standalone: true,
  imports: [CommonModule],
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
            <span>{{ formatLastUpdate() }}</span>
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
export class DemoBannerComponent {
  protected readonly priceService = inject(LivePriceService);

  protected isLiveMode(): boolean {
    const source = this.priceService.getPriceSource();
    return source.includes('Live Prices');
  }

  protected formatLastUpdate(): string {
    const lastUpdate = this.priceService.lastUpdate();
    if (!lastUpdate) return 'Never updated';
    
    const now = Date.now();
    const diff = now - lastUpdate;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) return `${minutes}m ${seconds}s ago`;
    return `${seconds}s ago`;
  }
} 