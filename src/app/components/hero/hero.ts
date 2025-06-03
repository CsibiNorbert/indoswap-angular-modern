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
            🤖 <span class="spectacular-text">SPECTACULAR ROBO COIN LANDING PAGE!</span>
          </h1>
          <p class="hero__description">
            Experience the future of DeFi with our spectacular robo coin showcase featuring giant rotating coins, orbiting satellites, and stunning visual effects!
          </p>
          
          <!-- Main Coin Showcase Section -->
          <div class="coin-showcase">
            <div class="main-coin-container">
              <!-- Giant Center Coin -->
              <div class="main-coin">
                <img 
                  src="/images/coins/coin.png" 
                  alt="Main Robo Coin" 
                  class="giant-coin"
                />
                <div class="coin-glow-ring"></div>
                <div class="coin-glow-ring coin-glow-ring--2"></div>
              </div>
              
              <!-- Platform with Rings -->
              <div class="coin-platform">
                <div class="platform-ring platform-ring--1"></div>
                <div class="platform-ring platform-ring--2"></div>
                <div class="platform-ring platform-ring--3"></div>
              </div>
            </div>
          </div>

          <!-- Enhanced Stats Display -->
          <div class="hero__stats">
            <div class="stat stat--enhanced">
              <span class="stat__value">$2.4B+</span>
              <span class="stat__label">Total Volume</span>
              <div class="stat__particles"></div>
            </div>
            <div class="stat stat--enhanced">
              <span class="stat__value">145K+</span>
              <span class="stat__label">Active Users</span>
              <div class="stat__particles"></div>
            </div>
            <div class="stat stat--enhanced">
              <span class="stat__value">892K+</span>
              <span class="stat__label">Transactions</span>
              <div class="stat__particles"></div>
            </div>
          </div>
          
          <!-- Rotating Action Text -->
          <div class="rotating-text-container">
            <span class="rotating-text">{{ currentWord() }}</span>
          </div>
        </div>
        
        <!-- Enhanced Visual Section -->
        <div class="hero__visual">
          <!-- Floating Feature Cards -->
          <div class="floating-cards">
            <div class="floating-card floating-card--1">
              <div class="card-icon">🤖</div>
              <div class="card-content">
                <span>AI Routing</span>
                <span>Smart</span>
              </div>
            </div>
            <div class="floating-card floating-card--2">
              <div class="card-icon">⚡</div>
              <div class="card-content">
                <span>0.1s Swaps</span>
                <span>Lightning</span>
              </div>
            </div>
            <div class="floating-card floating-card--3">
              <div class="card-icon">🏰</div>
              <div class="card-content">
                <span>Fortress Security</span>
                <span>Unbreakable</span>
              </div>
            </div>
          </div>
          
          <!-- Energy Particles -->
          <div class="energy-particles">
            <div class="particle particle--1"></div>
            <div class="particle particle--2"></div>
            <div class="particle particle--3"></div>
            <div class="particle particle--4"></div>
            <div class="particle particle--5"></div>
          </div>
          
          <!-- Data Streams -->
          <div class="data-streams">
            <div class="data-stream data-stream--1"></div>
            <div class="data-stream data-stream--2"></div>
            <div class="data-stream data-stream--3"></div>
          </div>
        </div>
      </div>
      
      <!-- Enhanced Background -->
      <div class="hero__background">
        <div class="gradient-orb gradient-orb--1"></div>
        <div class="gradient-orb gradient-orb--2"></div>
        <div class="gradient-orb gradient-orb--3"></div>
        <div class="ambient-glow"></div>
      </div>
    </section>
  `,
  styleUrl: './hero.scss'
})
export class HeroComponent {
  // Rotating words animation using signals - robo theme actions
  private readonly words = ['Trade', 'Swap', 'Earn', 'Build', 'Farm', 'Stake', 'Mine'];
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
      }, 2000); // Faster rotation for more dynamic effect

      // Cleanup interval on component destroy
      return () => clearInterval(interval);
    });
  }
}

