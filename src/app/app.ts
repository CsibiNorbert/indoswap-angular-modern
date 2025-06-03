import { Component } from '@angular/core';
import { HeaderComponent } from './components/header/header';
import { HeroComponent } from './components/hero/hero';
import { StatsComponent } from './components/stats/stats';
import { SwapComponent } from './components/swap/swap';
import { FooterComponent } from './components/footer/footer';
import { NotificationComponent } from './components/notification/notification';
import { WalletModalComponent } from './components/wallet-modal/wallet-modal';
import { Features } from './components/features/features';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent, 
    HeroComponent, 
    StatsComponent,
    SwapComponent,
    FooterComponent, 
    NotificationComponent,
    WalletModalComponent,
    Features
  ],
  template: `
    <div class="background-animation">
      <div class="bg-circle"></div>
      <div class="bg-circle"></div>
      <div class="bg-circle"></div>
    </div>

    <app-header />

    <div class="container">
      <app-hero />
      <app-stats />
      <app-swap />
      <app-features />
    </div>

    <app-footer />
    <app-notification />

    <!-- Add the wallet modal component -->
    <app-wallet-modal />
  `,
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = 'IndoSwap - Next Evolution DeFi Exchange';
}
