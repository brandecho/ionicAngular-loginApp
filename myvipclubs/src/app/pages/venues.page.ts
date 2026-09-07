import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { VipService } from '../vip.service';
import { TierBadgeComponent } from '../components/tier-badge.component';

@Component({
  selector: 'app-venues',
  standalone: true,
  imports: [
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    TierBadgeComponent,
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>My Venues</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/tabs/discover">
            <ion-icon slot="icon-only" name="add-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page">
        <p class="lead">The places that already take care of you.</p>

        @for (v of vip.favoriteVenues(); track v.id) {
          <a class="venue" [routerLink]="['/venue', v.id]">
            <span class="art">{{ v.image }}</span>
            <div class="body">
              <div class="row1">
                <span class="name">{{ v.name }}</span>
                <ion-icon class="fav" name="heart" (click)="unfav($event, v.id)"></ion-icon>
              </div>
              <span class="type">{{ v.type }} · {{ v.neighborhood }}, {{ v.city }}</span>
              <span class="vibe">{{ v.vibe }}</span>
              <div class="foot">
                @if (tier(v.memberTierRequired); as t) {
                  <app-tier-badge [tier]="t"></app-tier-badge>
                }
                <span class="access"><ion-icon name="shield-checkmark-outline"></ion-icon> Access active</span>
              </div>
            </div>
          </a>
        }

        <button class="discover-cta" routerLink="/tabs/discover">
          <ion-icon name="compass-outline"></ion-icon>
          Get the hookup at a new venue
        </button>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .page { padding: 8px 18px 28px; max-width: 620px; margin: 0 auto; }
      .lead { color: var(--vip-muted); margin: 6px 2px 18px; font-size: 14px; }
      .venue {
        display: flex; gap: 14px; text-decoration: none;
        background: var(--vip-surface); border: 1px solid var(--vip-border);
        border-radius: 18px; padding: 16px; margin-bottom: 14px;
      }
      .art {
        flex: 0 0 56px; height: 56px; border-radius: 14px; font-size: 30px;
        display: grid; place-items: center; background: var(--vip-surface-2);
      }
      .body { flex: 1; min-width: 0; }
      .row1 { display: flex; align-items: center; justify-content: space-between; }
      .name { color: #fff; font-weight: 700; font-size: 17px; }
      .fav { color: var(--vip-gold); font-size: 22px; }
      .type { display: block; color: var(--vip-muted); font-size: 12.5px; margin-top: 2px; }
      .vibe { display: block; color: var(--vip-text); font-size: 13px; margin: 8px 0 12px; opacity: 0.85; }
      .foot { display: flex; align-items: center; gap: 12px; }
      .access { display: inline-flex; align-items: center; gap: 5px; color: #6fd18f; font-size: 12px; font-weight: 600; }
      .access ion-icon { font-size: 14px; }
      .discover-cta {
        width: 100%; margin-top: 6px; border: 1px dashed color-mix(in srgb, var(--vip-gold) 45%, transparent);
        background: var(--vip-gold-tint); color: var(--vip-gold-soft);
        border-radius: 16px; padding: 15px; font-weight: 700; font-size: 14px;
        display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;
      }
      .discover-cta ion-icon { font-size: 18px; }
    `,
  ],
})
export class VenuesPage {
  vip = inject(VipService);

  tier(id: string) {
    return this.vip.tierById(id);
  }

  unfav(ev: Event, id: string): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.vip.toggleFavoriteVenue(id);
  }
}
