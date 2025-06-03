import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PriceDisplayComponent } from '../../price-display/price-display.component';

interface TokenPriceConfig {
  symbols: string[];
  showName?: boolean;
  showLastUpdate?: boolean;
  size?: 'small' | 'medium' | 'large';
  inline?: boolean;
  layout?: 'horizontal' | 'vertical' | 'grid';
}

@Component({
  selector: 'app-token-price-list',
  standalone: true,
  imports: [CommonModule, PriceDisplayComponent],
  template: `
    <div class="token-price-list" [ngClass]="containerClasses">
      @for (symbol of config.symbols; track symbol) {
        <app-price-display 
          [symbol]="symbol"
          [showName]="config.showName || false"
          [showLastUpdate]="config.showLastUpdate || false"
          [size]="config.size || 'medium'"
          [inline]="config.inline || false"
        ></app-price-display>
      }
    </div>
  `,
  styles: [`
    .token-price-list {
      &.horizontal {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 1.5rem;
        justify-content: center;
        align-items: center;
      }
      
      &.vertical {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;
      }
      
      &.grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        justify-items: center;
      }
    }
  `]
})
export class TokenPriceListComponent {
  @Input() config: TokenPriceConfig = {
    symbols: ['BNB', 'USDT', 'USDC'],
    layout: 'horizontal'
  };

  get containerClasses(): string {
    return this.config.layout || 'horizontal';
  }
} 