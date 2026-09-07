import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { Tier } from '../models';

@Component({
  selector: 'app-tier-badge',
  standalone: true,
  imports: [IonIcon],
  template: `
    <span class="badge" [style.--tier-color]="tier.color">
      <ion-icon name="diamond"></ion-icon>
      {{ tier.name }}
    </span>
  `,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--tier-color, var(--vip-gold));
        border: 1px solid var(--tier-color, var(--vip-gold));
        background: color-mix(in srgb, var(--tier-color, #d4af37) 14%, transparent);
      }
      ion-icon {
        font-size: 13px;
      }
    `,
  ],
})
export class TierBadgeComponent {
  @Input({ required: true }) tier!: Tier;
}
