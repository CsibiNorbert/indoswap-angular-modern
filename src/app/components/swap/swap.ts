import { Component, inject, signal, ElementRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SwapService } from '../../services/swap.service';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';
import { Token } from '../../models/interfaces';
import { ButtonComponent } from '../shared/button/button.component';
import { PriceDisplayComponent } from '../price-display/price-display.component';

@Component({
  selector: 'app-swap',
  standalone: true,
  imports: [FormsModule, ButtonComponent, PriceDisplayComponent],
  templateUrl: './swap.component.html',
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

  // Helper methods for template
  formatUsdValue(amount: number, symbol: string): string {
    if (!this.swapService.hasLivePrices()) return '';
    const price = this.swapService.getTokenPrice(symbol);
    return (amount * price).toFixed(2);
  }
}
