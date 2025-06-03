import { Component } from '@angular/core';
import { HeaderComponent } from './components/header/header.component';
import { HeroComponent } from './components/hero/hero';
import { StatsComponent } from './components/stats/stats';
import { SwapComponent } from './components/swap/swap';
import { FooterComponent } from './components/footer/footer';
import { NotificationComponent } from './components/notification/notification';
import { WalletModalComponent } from './components/wallet-modal/wallet-modal.component';

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
    WalletModalComponent
  ],
  template: `
    <div class="background-animation">
      <div class="bg-circle"></div>
      <div class="bg-circle"></div>
      <div class="bg-circle"></div>
    </div>

    <div class="app">
      <app-header />
      <app-notification />
      
      <main class="main-content">
        <app-hero />
        <app-stats />
        <app-swap />
      </main>
      
      <app-footer />
    </div>

    <!-- Add the wallet modal component -->
    <app-wallet-modal />
  `,
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = 'IndoSwap - Next Evolution DeFi Exchange';
}
