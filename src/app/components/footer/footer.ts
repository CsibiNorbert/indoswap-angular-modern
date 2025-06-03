import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  template: `
    <footer class="footer">
      <div class="container">
        <div class="footer__content">
          <div class="footer__section">
            <h3 class="footer__title">IndoSwap</h3>
            <p class="footer__description">
              The most advanced decentralized exchange built with modern Angular 20+ 
              featuring signals, standalone components, and cutting-edge DeFi technology.
            </p>
            <div class="footer__social">
              <a href="#" class="social-link" aria-label="Twitter">🐦</a>
              <a href="#" class="social-link" aria-label="Discord">💬</a>
              <a href="#" class="social-link" aria-label="Telegram">📱</a>
              <a href="#" class="social-link" aria-label="GitHub">🐙</a>
            </div>
          </div>
          
          <div class="footer__section">
            <h4 class="footer__subtitle">Products</h4>
            <ul class="footer__links">
              <li><a href="#swap">Token Swap</a></li>
              <li><a href="#pool">Liquidity Pools</a></li>
              <li><a href="#stake">Staking</a></li>
              <li><a href="#governance">Governance</a></li>
            </ul>
          </div>
          
          <div class="footer__section">
            <h4 class="footer__subtitle">Developers</h4>
            <ul class="footer__links">
              <li><a href="#docs">Documentation</a></li>
              <li><a href="#api">API Reference</a></li>
              <li><a href="#sdk">SDK</a></li>
              <li><a href="#github">GitHub</a></li>
            </ul>
          </div>
          
          <div class="footer__section">
            <h4 class="footer__subtitle">Community</h4>
            <ul class="footer__links">
              <li><a href="#blog">Blog</a></li>
              <li><a href="#forum">Forum</a></li>
              <li><a href="#support">Support</a></li>
              <li><a href="#newsletter">Newsletter</a></li>
            </ul>
          </div>
          
          <div class="footer__section">
            <h4 class="footer__subtitle">Legal</h4>
            <ul class="footer__links">
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#cookies">Cookie Policy</a></li>
              <li><a href="#disclaimer">Disclaimer</a></li>
            </ul>
          </div>
        </div>
        
        <div class="footer__bottom">
          <div class="footer__copyright">
            <p>&copy; {{ currentYear }} IndoSwap. All rights reserved.</p>
            <p class="footer__tech">Built with Angular {{ angularVersion }} + Signals</p>
          </div>
          <div class="footer__badges">
            <span class="tech-badge">⚡ Angular 20</span>
            <span class="tech-badge">🎯 Signals</span>
            <span class="tech-badge">🧩 Standalone</span>
            <span class="tech-badge">🚀 Modern</span>
          </div>
        </div>
      </div>
    </footer>
  `,
  styleUrl: './footer.scss'
})
export class FooterComponent {
  protected readonly currentYear = new Date().getFullYear();
  protected readonly angularVersion = '20';
}
