import { Component, inject, signal, ElementRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SwapService } from '../../services/swap.service';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';
import { Token } from '../../models/interfaces';

@Component({
  selector: 'app-swap',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="swap">
      <div class="container">
        <div class="swap__wrapper">
          <div class="swap__header">
            <h2 class="swap__title">Swap Tokens</h2>
            <p class="swap__description">
              Trade tokens instantly with best rates and minimal slippage
            </p>
          </div>
          
          <div class="swap__card" #swapCard>
            <!-- From Token Section -->
            <div class="token-input" data-token-input="from">
              <div class="token-input__header">
                <span class="token-input__label">From</span>
                <span class="token-input__balance">
                  Balance: {{ swapService.swapData().fromToken.balance.toFixed(4) }}
                </span>
              </div>
              
              <div class="token-input__content">
                <input 
                  type="number" 
                  class="token-input__amount"
                  placeholder="0.0"
                  [(ngModel)]="fromAmount"
                  (ngModelChange)="onFromAmountChange($event)"
                />
                
                <button 
                  class="token-selector"
                  (click)="toggleFromTokenList()"
                  type="button"
                >
                  <div class="token-info">
                    <div class="token-icon">{{ getTokenIcon(swapService.swapData().fromToken.symbol) }}</div>
                    <span class="token-symbol">{{ swapService.swapData().fromToken.symbol }}</span>
                  </div>
                  <span class="chevron">▼</span>
                </button>
              </div>
              
              <!-- From Token Dropdown -->
              @if (showFromTokenList()) {
                <div class="token-list">
                  @for (token of availableTokens(); track token.symbol) {
                    <button 
                      class="token-option"
                      [class.selected]="token.symbol === swapService.swapData().fromToken.symbol"
                      (click)="selectFromToken(token)"
                      type="button"
                    >
                      <div class="token-info">
                        <div class="token-icon">{{ getTokenIcon(token.symbol) }}</div>
                        <div>
                          <div class="token-symbol">{{ token.symbol }}</div>
                          <div class="token-name">{{ token.name }}</div>
                        </div>
                      </div>
                      <div class="token-balance">{{ token.balance.toFixed(4) }}</div>
                    </button>
                  }
                </div>
              }
            </div>
            
            <!-- Swap Button -->
            <div class="swap__divider">
              <button 
                class="swap-direction-btn"
                (click)="swapTokens()"
                type="button"
                [disabled]="swapService.isSwapping()"
              >
                ⇅
              </button>
            </div>
            
            <!-- To Token Section -->
            <div class="token-input" data-token-input="to">
              <div class="token-input__header">
                <span class="token-input__label">To</span>
                <span class="token-input__balance">
                  Balance: {{ swapService.swapData().toToken.balance.toFixed(4) }}
                </span>
              </div>
              
              <div class="token-input__content">
                <input 
                  type="number" 
                  class="token-input__amount"
                  placeholder="0.0"
                  [value]="swapService.swapData().toAmount.toFixed(6)"
                  readonly
                />
                
                <button 
                  class="token-selector"
                  (click)="toggleToTokenList()"
                  type="button"
                >
                  <div class="token-info">
                    <div class="token-icon">{{ getTokenIcon(swapService.swapData().toToken.symbol) }}</div>
                    <span class="token-symbol">{{ swapService.swapData().toToken.symbol }}</span>
                  </div>
                  <span class="chevron">▼</span>
                </button>
              </div>
              
              <!-- To Token Dropdown -->
              @if (showToTokenList()) {
                <div class="token-list">
                  @for (token of availableTokens(); track token.symbol) {
                    <button 
                      class="token-option"
                      [class.selected]="token.symbol === swapService.swapData().toToken.symbol"
                      (click)="selectToToken(token)"
                      type="button"
                    >
                      <div class="token-info">
                        <div class="token-icon">{{ getTokenIcon(token.symbol) }}</div>
                        <div>
                          <div class="token-symbol">{{ token.symbol }}</div>
                          <div class="token-name">{{ token.name }}</div>
                        </div>
                      </div>
                      <div class="token-balance">{{ token.balance.toFixed(4) }}</div>
                    </button>
                  }
                </div>
              }
            </div>
            
            <!-- Swap Details -->
            @if (swapService.swapData().fromAmount > 0) {
              <div class="swap__details">
                <div class="swap-detail">
                  <span>Exchange Rate</span>
                  <span>1 {{ swapService.swapData().fromToken.symbol }} = {{ swapService.swapData().exchangeRate.toFixed(4) }} {{ swapService.swapData().toToken.symbol }}</span>
                </div>
                <div class="swap-detail">
                  <span>Minimum Received</span>
                  <span>{{ swapService.swapData().minimumReceived.toFixed(6) }} {{ swapService.swapData().toToken.symbol }}</span>
                </div>
                <div class="swap-detail">
                  <span>Trading Fee</span>
                  <span>{{ swapService.swapData().tradingFee }}%</span>
                </div>
                <div class="swap-detail">
                  <span>Price Impact</span>
                  <span>{{ swapService.swapData().priceImpact.toFixed(2) }}%</span>
                </div>
              </div>
            }
            
            <!-- Action Buttons -->
            <div class="swap__actions">
              @if (!walletService.isConnected()) {
                <button 
                  class="btn btn--primary btn--large"
                  (click)="connectWallet()"
                  [disabled]="walletService.isLoading()"
                >
                  @if (walletService.isLoading()) {
                    Connecting...
                  } @else {
                    Connect Wallet
                  }
                </button>
              } @else {
                <button 
                  class="btn btn--primary btn--large"
                  (click)="executeSwap()"
                  [disabled]="!swapService.canSwap() || swapService.isSwapping()"
                >
                  @if (swapService.isSwapping()) {
                    Swapping...
                  } @else if (!swapService.canSwap()) {
                    Enter Amount
                  } @else {
                    Swap Tokens
                  }
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrl: './swap.scss'
})
export class SwapComponent {
  // Services injection
  protected readonly swapService = inject(SwapService);
  protected readonly walletService = inject(WalletService);
  private readonly notificationService = inject(NotificationService);
  private readonly elementRef = inject(ElementRef);

  // Component state
  protected readonly showFromTokenList = signal<boolean>(false);
  protected readonly showToTokenList = signal<boolean>(false);
  protected readonly availableTokens = signal<Token[]>(this.swapService.getTokens());
  
  // Form data
  protected fromAmount: number = 0;

  // Host listener for click outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedElement = event.target as HTMLElement;
    const swapCard = this.elementRef.nativeElement.querySelector('.swap__card');
    
    // Check if click is outside the swap card
    if (swapCard && !swapCard.contains(clickedElement)) {
      // Close both dropdowns if they're open
      if (this.showFromTokenList()) {
        this.showFromTokenList.set(false);
      }
      if (this.showToTokenList()) {
        this.showToTokenList.set(false);
      }
    } else {
      // Click is inside swap card, check if it's outside the dropdowns but not on selectors
      const fromTokenInput = this.elementRef.nativeElement.querySelector('[data-token-input="from"]');
      const toTokenInput = this.elementRef.nativeElement.querySelector('[data-token-input="to"]');
      
      // Check if click is outside from token area but inside swap card
      if (fromTokenInput && !fromTokenInput.contains(clickedElement) && this.showFromTokenList()) {
        this.showFromTokenList.set(false);
      }
      
      // Check if click is outside to token area but inside swap card  
      if (toTokenInput && !toTokenInput.contains(clickedElement) && this.showToTokenList()) {
        this.showToTokenList.set(false);
      }
    }
  }

  onFromAmountChange(amount: number): void {
    this.fromAmount = amount || 0;
    if (this.fromAmount > 0) {
      this.swapService.calculateSwap(this.fromAmount);
    }
  }

  toggleFromTokenList(): void {
    this.showFromTokenList.update(show => !show);
    if (this.showFromTokenList()) {
      this.showToTokenList.set(false);
    }
  }

  toggleToTokenList(): void {
    this.showToTokenList.update(show => !show);
    if (this.showToTokenList()) {
      this.showFromTokenList.set(false);
    }
  }

  selectFromToken(token: Token): void {
    if (token.symbol === this.swapService.swapData().toToken.symbol) {
      // If selecting the same token as "to", swap them
      this.swapService.swapTokens();
    } else {
      this.swapService.selectFromToken(token);
    }
    this.showFromTokenList.set(false);
    this.fromAmount = 0;
  }

  selectToToken(token: Token): void {
    if (token.symbol === this.swapService.swapData().fromToken.symbol) {
      // If selecting the same token as "from", swap them
      this.swapService.swapTokens();
    } else {
      this.swapService.selectToToken(token);
    }
    this.showToTokenList.set(false);
    this.fromAmount = 0;
  }

  swapTokens(): void {
    this.swapService.swapTokens();
    this.fromAmount = 0;
  }

  async connectWallet(): Promise<void> {
    try {
      await this.walletService.connectWallet();
      this.notificationService.showSuccess('Wallet connected successfully!');
    } catch (error) {
      this.notificationService.showError('Failed to connect wallet');
    }
  }

  async executeSwap(): Promise<void> {
    if (!this.swapService.canSwap()) {
      this.notificationService.showError('Invalid swap parameters');
      return;
    }

    try {
      const success = await this.swapService.executeSwap(this.swapService.swapData());
      
      if (success) {
        const data = this.swapService.swapData();
        this.notificationService.showSuccess(
          `Successfully swapped ${data.fromAmount} ${data.fromToken.symbol} for ${data.toAmount.toFixed(4)} ${data.toToken.symbol}`
        );
        this.fromAmount = 0;
      } else {
        this.notificationService.showError('Swap failed. Please try again.');
      }
    } catch (error) {
      this.notificationService.showError('Swap failed. Please try again.');
    }
  }

  protected getTokenIcon(symbol: string): string {
    const icons: { [key: string]: string } = {
      'BNB': '🟡',
      'BUSD': '💰',
      'USDT': '💵'
    };
    return icons[symbol] || '🪙';
  }
}
