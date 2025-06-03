import { Component, signal, computed, effect } from '@angular/core';
import { Stat } from '../../models/interfaces';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [],
  template: `
    <section class="stats">
      <div class="container">
        <div class="stats__header">
          <h2 class="stats__title">Platform Statistics</h2>
          <p class="stats__description">
            Real-time data showcasing IndoSwap's growing ecosystem
          </p>
        </div>
        
        <div class="stats__grid">
          @for (stat of animatedStats(); track stat.label) {
            <div class="stat-card">
              <div class="stat-card__value">{{ stat.value }}</div>
              <div class="stat-card__label">{{ stat.label }}</div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styleUrl: './stats.scss'
})
export class StatsComponent {
  // Base stats data
  private readonly baseStats: Stat[] = [
    { value: '2840000000', label: 'Total Volume Traded' },
    { value: '145230', label: 'Active Users' },
    { value: '892450', label: 'Total Transactions' },
    { value: '1250000000', label: 'Total Value Locked' }
  ];

  // Animated values using signals
  private readonly _animatedValues = signal<number[]>([0, 0, 0, 0]);
  
  // Computed stats with formatted values
  readonly animatedStats = computed(() => {
    const values = this._animatedValues();
    return this.baseStats.map((stat, index) => ({
      value: this.formatValue(values[index], index),
      label: stat.label
    }));
  });

  constructor() {
    // Effect to animate counter values
    effect(() => {
      const targets = this.baseStats.map(stat => parseInt(stat.value));
      const duration = 2000; // 2 seconds
      const steps = 60; // 60 FPS
      const stepDuration = duration / steps;
      
      let currentStep = 0;
      
      const animate = () => {
        if (currentStep <= steps) {
          const progress = currentStep / steps;
          const easeOutQuart = 1 - Math.pow(1 - progress, 4);
          
          const newValues = targets.map(target => 
            Math.floor(target * easeOutQuart)
          );
          
          this._animatedValues.set(newValues);
          currentStep++;
          
          setTimeout(animate, stepDuration);
        }
      };
      
      // Start animation after a small delay
      setTimeout(animate, 100);
    });
  }

  private formatValue(value: number, index: number): string {
    if (index === 0 || index === 3) {
      // Format volume and TVL as currency
      if (value >= 1000000000) {
        return `$${(value / 1000000000).toFixed(1)}B`;
      } else if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(1)}K`;
      }
      return `$${value}`;
    } else {
      // Format users and transactions as numbers
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(0)}K`;
      }
      return value.toLocaleString();
    }
  }
}
