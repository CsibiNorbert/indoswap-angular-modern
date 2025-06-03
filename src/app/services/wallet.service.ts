import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  // Using BehaviorSubjects for compatibility with existing components
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  private addressSubject = new BehaviorSubject<string>('');

  // Modern Angular signals for reactive state management
  private readonly _isConnected = signal<boolean>(false);
  private readonly _address = signal<string>('');
  private readonly _isLoading = signal<boolean>(false);

  // Observable streams for reactive programming
  isConnected$: Observable<boolean> = this.isConnectedSubject.asObservable();
  address$: Observable<string> = this.addressSubject.asObservable();

  // Computed values for derived state
  readonly isConnected = this._isConnected.asReadonly();
  readonly address = this._address.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly shortAddress = computed(() => {
    const addr = this._address();
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
  });

  async connectWallet(): Promise<void> {
    this._isLoading.set(true);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const address = '0x1234567890abcdef1234567890abcdef12345678';
        
        // Update both signals and subjects for compatibility
        this._isConnected.set(true);
        this._address.set(address);
        this.isConnectedSubject.next(true);
        this.addressSubject.next(address);
        
        this._isLoading.set(false);
        resolve();
      }, 1000);
    });
  }

  disconnectWallet(): void {
    // Update both signals and subjects for compatibility
    this._isConnected.set(false);
    this._address.set('');
    this.isConnectedSubject.next(false);
    this.addressSubject.next('');
  }

  // Getter methods for compatibility with existing code
  get isConnectedValue(): boolean {
    return this.isConnectedSubject.value;
  }

  get addressValue(): string {
    return this.addressSubject.value;
  }
} 