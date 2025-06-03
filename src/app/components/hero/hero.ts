import { Component, signal, effect } from '@angular/core';
import { ButtonComponent } from '../shared/button/button.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <section class="hero">
      <div class="container">
        <div class="hero__content">
          <h1 class="hero__title">
            Trade <span class="rotating-word" [style.color]="currentWordColor()">{{ currentTitleWord() }}</span> with IndoSwap
          </h1>
          <p class="hero__subtitle">
            The Next Generation <span class="gradient-text">DeFi Exchange</span>
          </p>
          <p class="hero__description">
            Experience lightning-fast swaps, minimal fees, and maximum security. Our advanced routing algorithm finds the best prices across multiple liquidity pools, ensuring you get more value from every trade.
          </p>
          
          <!-- Value Propositions -->
          <div class="hero__features">
            <div class="feature-badge">⚡ Lightning Fast Swaps</div>
            <div class="feature-badge">💰 Best Prices Guaranteed</div>
            <div class="feature-badge">🛡️ Maximum Security</div>
          </div>

          <!-- Call to Action -->
          <div class="hero__cta">
            <app-button 
              variant="primary" 
              size="large"
              icon="🚀"
              (clicked)="scrollToSwap()"
              ariaLabel="Start trading coins now"
            >
              Trade Coins Now
            </app-button>
          </div>

          <!-- Main Coin Showcase Section -->
          <div class="coin-showcase">
            <div class="dual-coin-container">
              <!-- First Coin -->
              <div class="main-coin-container">
                <div class="main-coin">
                  <img 
                    src="/images/coins/coin.png" 
                    alt="IndoSwap Coin" 
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

              <!-- Second Coin - Slightly Bigger, Opposite Direction -->
              <div class="secondary-coin-container">
                <div class="secondary-coin">
                  <img 
                    src="/images/coins/coin.png" 
                    alt="IndoSwap Secondary Coin" 
                    class="giant-coin-secondary"
                  />
                  <div class="coin-glow-ring-secondary"></div>
                  <div class="coin-glow-ring-secondary coin-glow-ring-secondary--2"></div>
                </div>
                
                <!-- Simplified - No rotating platform rings for cleaner look -->
              </div>
            </div>
          </div>
        </div>
        
        <!-- Enhanced Visual Section -->
        <div class="hero__visual">
          <!-- Floating Feature Cards -->
          <div class="floating-cards">
            <div class="floating-card floating-card--1">
              <div class="card-icon">🤖</div>
              <div class="card-content">
                <span>Smart Routing</span>
                <span>AI-Powered</span>
              </div>
            </div>
            <div class="floating-card floating-card--2">
              <div class="card-icon">⚡</div>
              <div class="card-content">
                <span>Instant Swaps</span>
                <span>Lightning Fast</span>
              </div>
            </div>
            <div class="floating-card floating-card--3">
              <div class="card-icon">🛡️</div>
              <div class="card-content">
                <span>Secure Trading</span>
                <span>Protected</span>
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
  // Rotating words for the title with their corresponding colors
  private readonly titleWords = [
    { word: 'Smarter', color: '#FFD700' },    // Gold
    { word: 'Faster', color: '#00BFFF' },     // Deep Sky Blue
    { word: 'Better', color: '#32CD32' },     // Lime Green
    { word: 'Secure', color: '#FF6347' },     // Tomato Red
    { word: 'Wiser', color: '#9370DB' },      // Medium Purple
    { word: 'Efficient', color: '#20B2AA' }   // Light Sea Green
  ];
  
  private readonly _currentTitleWordIndex = signal<number>(0);
  readonly currentTitleWord = signal<string>(this.titleWords[0].word);
  readonly currentWordColor = signal<string>(this.titleWords[0].color);

  constructor() {
    // Effect to handle word rotation for title
    effect(() => {
      const interval = setInterval(() => {
        this._currentTitleWordIndex.update(index => {
          const nextIndex = (index + 1) % this.titleWords.length;
          const nextWord = this.titleWords[nextIndex];
          this.currentTitleWord.set(nextWord.word);
          this.currentWordColor.set(nextWord.color);
          return nextIndex;
        });
      }, 2000); // Change every 2 seconds

      // Cleanup interval on component destroy
      return () => clearInterval(interval);
    });
  }

  // Scroll to swap section function
  scrollToSwap(): void {
    const swapSection = document.querySelector('.swap');
    if (swapSection) {
      swapSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
}

