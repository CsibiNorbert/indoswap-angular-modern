import { Component, signal, effect } from '@angular/core';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [],
  template: `
    <section class="hero">
      <div class="container">
        <div class="hero__content">
          <h1 class="hero__title">
            Trade with confidence on <br>
            <span class="gradient-text">{{ currentWord() }}</span>
          </h1>
          <p class="hero__description">
            The most advanced decentralized exchange built with modern Angular 20+ 
            featuring signals, standalone components, and cutting-edge DeFi technology.
          </p>
          <div class="hero__features">
            <span class="feature-badge">✨ Signals</span>
            <span class="feature-badge">🧩 Standalone Components</span>
            <span class="feature-badge">⚡ Zoneless Change Detection</span>
            <span class="feature-badge">🎯 New Control Flow</span>
          </div>
          <div class="hero__stats">
            <div class="stat">
              <span class="stat__value">$2.4B+</span>
              <span class="stat__label">Total Volume</span>
            </div>
            <div class="stat">
              <span class="stat__value">145K+</span>
              <span class="stat__label">Active Users</span>
            </div>
            <div class="stat">
              <span class="stat__value">892K+</span>
              <span class="stat__label">Transactions</span>
            </div>
          </div>
        </div>
        
        <div class="hero__visual">
          <div class="floating-cards">
            <div class="floating-card floating-card--1">
              <div class="card-icon">💰</div>
              <div class="card-content">
                <span>Low Fees</span>
                <span>0.25%</span>
              </div>
            </div>
            <div class="floating-card floating-card--2">
              <div class="card-icon">⚡</div>
              <div class="card-content">
                <span>Fast Swaps</span>
                <span>< 5sec</span>
              </div>
            </div>
            <div class="floating-card floating-card--3">
              <div class="card-icon">🔒</div>
              <div class="card-content">
                <span>Secure</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="hero__background">
        <div class="gradient-orb gradient-orb--1"></div>
        <div class="gradient-orb gradient-orb--2"></div>
        <div class="gradient-orb gradient-orb--3"></div>
      </div>
    </section>
  `,
  styleUrl: './hero.scss'
})
export class HeroComponent {
  // Rotating words animation using signals
  private readonly words = ['IndoSwap', 'the Future', 'Innovation', 'DeFi'];
  private readonly _currentWordIndex = signal<number>(0);
  readonly currentWord = signal<string>(this.words[0]);

  constructor() {
    // Effect to handle word rotation
    effect(() => {
      const interval = setInterval(() => {
        this._currentWordIndex.update(index => {
          const nextIndex = (index + 1) % this.words.length;
          this.currentWord.set(this.words[nextIndex]);
          return nextIndex;
        });
      }, 3000);

      // Cleanup interval on component destroy
      return () => clearInterval(interval);
    });
  }
}
