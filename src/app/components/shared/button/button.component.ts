import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="buttonClasses"
      (click)="handleClick($event)"
      [attr.aria-label]="ariaLabel"
    >
      <!-- Loading Spinner -->
      @if (loading) {
        <div class="btn__spinner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle 
              cx="12" 
              cy="12" 
              r="9" 
              stroke="currentColor" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-dasharray="28.26" 
              stroke-dashoffset="28.26"
            >
              <animateTransform
                attributeName="transform"
                attributeType="XML"
                type="rotate"
                dur="1s"
                from="0 12 12"
                to="360 12 12"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </div>
      }
      
      <!-- Icon Slot -->
      @if (icon && !loading) {
        <span class="btn__icon" [innerHTML]="icon"></span>
      }
      
      <!-- Content -->
      <span class="btn__content">
        <ng-content></ng-content>
      </span>
      
      <!-- Trailing Icon -->
      @if (trailingIcon && !loading) {
        <span class="btn__icon btn__icon--trailing" [innerHTML]="trailingIcon"></span>
      }
    </button>
  `,
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'medium';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() fullWidth: boolean = false;
  @Input() icon?: string;
  @Input() trailingIcon?: string;
  @Input() ariaLabel?: string;

  @Output() clicked = new EventEmitter<Event>();

  get buttonClasses(): string {
    const classes = [
      'btn',
      `btn--${this.variant}`,
      `btn--${this.size}`
    ];

    if (this.fullWidth) {
      classes.push('btn--full-width');
    }

    if (this.loading) {
      classes.push('btn--loading');
    }

    return classes.join(' ');
  }

  handleClick(event: Event): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
} 