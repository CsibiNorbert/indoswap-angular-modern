import { Component } from '@angular/core';
import { HeaderComponent } from './components/header/header';
import { HeroComponent } from './components/hero/hero';
import { StatsComponent } from './components/stats/stats';
import { SwapComponent } from './components/swap/swap';
import { FooterComponent } from './components/footer/footer';
import { NotificationComponent } from './components/notification/notification';
import { DemoBannerComponent } from './components/demo-banner/demo-banner.component';

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
    DemoBannerComponent
  ],
  template: `
    <div class="app">
      <!-- <app-demo-banner /> -->
      <app-header />
      <app-notification />
      
      <main class="main-content">
        <app-hero />
        <app-stats />
        <app-swap />
      </main>
      
      <app-footer />
    </div>
  `,
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = 'indoswap-angular-modern';
}
