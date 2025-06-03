# IndoSwap - Modern Angular DeFi Exchange

A cutting-edge decentralized exchange (DEX) built with **Angular 20+**, featuring the latest Angular innovations including **Signals**, **Standalone Components**, and **Modern Control Flow**.

## 🚀 Features

### Modern Angular 20+ Implementation
- ✨ **Angular Signals** for reactive state management
- 🧩 **Standalone Components** for better modularity
- 🎯 **New Control Flow** (@if, @for, @switch)
- ⚡ **Zoneless Change Detection** ready
- 🔧 **Inject Function** for dependency injection
- 📱 **Responsive Design** with mobile-first approach

### DeFi Functionality
- 💱 **Token Swapping** with real-time exchange rates
- 💰 **Wallet Integration** simulation
- 📊 **Live Statistics** with animated counters
- 🔔 **Smart Notifications** system
- 📈 **Price Impact** and slippage calculations
- 🎨 **Modern UI/UX** with glassmorphism design

## 🛠️ Tech Stack

- **Framework**: Angular 20+
- **Language**: TypeScript 5.0+
- **Styling**: SCSS with CSS Custom Properties
- **State Management**: Angular Signals
- **Architecture**: Standalone Components
- **Build Tool**: Angular CLI
- **Package Manager**: npm

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── header/           # Navigation and wallet connection
│   │   ├── hero/             # Landing section with animations
│   │   ├── stats/            # Platform statistics with counters
│   │   ├── swap/             # Token swapping interface
│   │   ├── footer/           # Footer with links and info
│   │   └── notification/     # Toast notification system
│   ├── services/
│   │   ├── wallet.service.ts    # Wallet connection logic
│   │   ├── swap.service.ts      # Token swap functionality
│   │   └── notification.service.ts # Notification management
│   ├── models/
│   │   └── interfaces.ts     # TypeScript interfaces
│   ├── app.ts               # Root component
│   └── app.scss             # Global styles
├── styles/                  # Global SCSS files
└── public/                  # Static assets
```

## 🎨 Design System

### Color Palette
- **Primary**: Brown tones (#8B4513, #B8860B, #DAA520)
- **Background**: Light gradients (#f8f9fa, #e9ecef)
- **Text**: Dark (#1a1a1a) / Light (#666666)
- **Accent**: Gold variations for highlights

### Components
- **Glassmorphism Cards** with backdrop blur
- **Animated Counters** for statistics
- **Floating Elements** with CSS animations
- **Responsive Grid** layouts
- **Interactive Buttons** with hover effects

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm 9+
- Angular CLI 20+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd indoswap-angular-modern
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   ng serve -o
   ```

4. **Build for production**
   ```bash
   ng build --prod
   ```

## 🧩 Component Architecture

### Standalone Components
All components are standalone, eliminating the need for NgModules:

```typescript
@Component({
  selector: 'app-swap',
  standalone: true,
  imports: [FormsModule],
  template: `...`,
  styleUrl: './swap.scss'
})
export class SwapComponent { }
```

### Signal-Based State Management
Using Angular Signals for reactive state:

```typescript
// Service with signals
private readonly _swapData = signal<SwapData>(initialData);
readonly swapData = this._swapData.asReadonly();

// Computed values
readonly canSwap = computed(() => {
  const data = this._swapData();
  return data.fromAmount > 0 && !this._isSwapping();
});
```

### Modern Control Flow
Leveraging new Angular control flow syntax:

```html
@if (walletService.isConnected()) {
  <button (click)="executeSwap()">Swap Tokens</button>
} @else {
  <button (click)="connectWallet()">Connect Wallet</button>
}

@for (token of availableTokens(); track token.symbol) {
  <div class="token-option">{{ token.name }}</div>
}
```

## 🎯 Key Features Implementation

### 1. Token Swapping
- Real-time exchange rate calculations
- Slippage and price impact display
- Token selection with dropdown
- Amount validation and formatting

### 2. Wallet Integration
- Connection simulation
- Balance display
- Address formatting
- Loading states

### 3. Statistics Dashboard
- Animated counter components
- Real-time data updates
- Responsive card layout
- Hover effects and transitions

### 4. Notification System
- Toast notifications
- Auto-dismiss functionality
- Multiple notification types
- Accessibility support

## 🎨 Styling Approach

### SCSS Architecture
- **Component-scoped styles** for encapsulation
- **CSS Custom Properties** for theming
- **Mobile-first** responsive design
- **BEM methodology** for class naming

### Animations
- **CSS Keyframes** for smooth transitions
- **Transform-based** animations for performance
- **Reduced motion** support for accessibility
- **Staggered animations** for visual appeal

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 480px
- **Tablet**: 481px - 768px
- **Desktop**: 769px - 1200px
- **Large**: > 1200px

### Mobile Optimizations
- Touch-friendly button sizes (44px minimum)
- Simplified navigation
- Stacked layouts
- Optimized font sizes

## ♿ Accessibility

### Features
- **ARIA labels** and roles
- **Keyboard navigation** support
- **Focus management**
- **Screen reader** compatibility
- **High contrast** mode support
- **Reduced motion** preferences

## 🔧 Development Guidelines

### Code Style
- **TypeScript strict mode** enabled
- **ESLint** for code quality
- **Prettier** for formatting
- **Conventional commits** for git history

### Best Practices
- **Single Responsibility Principle**
- **Immutable state** patterns
- **Pure functions** where possible
- **Error boundary** implementation
- **Performance optimization**

## 📊 Performance

### Optimizations
- **Lazy loading** ready architecture
- **OnPush change detection** strategy
- **TrackBy functions** for ngFor
- **Optimized bundle** sizes
- **Tree shaking** enabled

### Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Bundle size**: ~53KB (gzipped)

## 🧪 Testing

### Test Structure
```bash
npm run test          # Unit tests
npm run test:watch    # Watch mode
npm run e2e           # End-to-end tests
npm run lint          # Code linting
```

### Coverage
- **Components**: Unit tests with TestBed
- **Services**: Isolated unit tests
- **Integration**: Component interaction tests
- **E2E**: User journey tests

## 🚀 Deployment

### Build Commands
```bash
ng build --prod                 # Production build
ng build --configuration=staging # Staging build
ng analyze                       # Bundle analysis
```

### Deployment Targets
- **Netlify**: Static hosting
- **Vercel**: Edge deployment
- **Firebase**: Google Cloud
- **AWS S3**: Amazon hosting

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- Follow Angular style guide
- Write comprehensive tests
- Update documentation
- Ensure accessibility compliance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Angular Team** for the amazing framework
- **DeFi Community** for inspiration
- **Open Source Contributors** for tools and libraries

## 📞 Support

For support and questions:
- 📧 Email: support@indoswap.com
- 💬 Discord: [IndoSwap Community](https://discord.gg/indoswap)
- 🐦 Twitter: [@IndoSwap](https://twitter.com/indoswap)

---

**Built with ❤️ using Angular 20+ and modern web technologies**
