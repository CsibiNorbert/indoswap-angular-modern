import { Component } from '@angular/core';
import { HeaderComponent } from './components/header/header';
import { NotificationComponent } from './components/notification/notification';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, NotificationComponent],
  template: `
    <div class="app">
      <app-header />
      <app-notification />
      
      <main class="main-content">
        <div class="hero-section">
          <div class="container">
            <h1 class="hero-title">
              Welcome to <span class="gradient-text">IndoSwap</span>
            </h1>
            <p class="hero-description">
              The most advanced decentralized exchange built with modern Angular 17+ and signals
            </p>
            <div class="hero-features">
              <span class="feature-badge">✨ Signals</span>
              <span class="feature-badge">🧩 Standalone Components</span>
              <span class="feature-badge">⚡ Zoneless Change Detection</span>
              <span class="feature-badge">🎯 New Control Flow</span>
            </div>
          </div>
        </div>
        
        <div class="floating-elements">
          <div class="floating-circle floating-circle--1"></div>
          <div class="floating-circle floating-circle--2"></div>
          <div class="floating-circle floating-circle--3"></div>
        </div>
      </main>
    </div>
  `,
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = 'indoswap-angular';
}
