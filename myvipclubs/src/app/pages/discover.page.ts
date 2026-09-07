import { Component, inject } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonIcon,
  ToastController,
} from '@ionic/angular/standalone';
import { VipService } from '../vip.service';
import { TierBadgeComponent } from '../components/tier-badge.component';
import { Venue } from '../models';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonIcon,
    TierBadgeComponent,
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>Discover</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page">
        <div class="banner">
          <ion-icon name="sparkles-outline"></ion-icon>
          <div>
            <strong>Want in somewhere new?</strong>
            <p>Tell My VIP Clubs where you want access. We make the call so you don’t have to.</p>
          </div>
        </div>

        @for (v of vip.discoverVenues(); track v.id) {
          <div class="venue">
            <span class="art">{{ v.image }}</span>
            <div class="body">
              <div class="row1">
                <span class="name">{{ v.name }}</span>
                @if (tier(v.memberTierRequired); as t) {
                  <app-tier-badge [tier]="t"></app-tier-badge>
                }
              </div>
              <span class="type">{{ v.type }} · {{ v.neighborhood }}, {{ v.city }}</span>
              <span class="vibe">{{ v.vibe }}</span>

              @switch (vip.requestStatus(v.id)) {
                @case ('requested') {
                  <button class="req pending" disabled>
                    <ion-icon name="time-outline"></ion-icon> Request sent
                  </button>
                }
                @case ('in_review') {
                  <button class="req review" disabled>
                    <ion-icon name="eye-outline"></ion-icon> Concierge is on it
                  </button>
                }
                @case ('approved') {
                  <button class="req approved" disabled>
                    <ion-icon name="checkmark-circle-outline"></ion-icon> Access granted
                  </button>
                }
                @default {
                  <button class="req" (click)="request(v)">
                    <ion-icon name="flash-outline"></ion-icon> I'm interested — get me in
                  </button>
                }
              }
            </div>
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .page { padding: 8px 18px 28px; max-width: 620px; margin: 0 auto; }
      .banner {
        display: flex; gap: 12px; align-items: flex-start;
        background: var(--vip-gold-tint); border: 1px solid color-mix(in srgb, var(--vip-gold) 40%, transparent);
        border-radius: 16px; padding: 14px 16px; margin: 6px 0 18px;
      }
      .banner ion-icon { font-size: 24px; color: var(--vip-gold); margin-top: 2px; }
      .banner strong { color: #fff; font-size: 15px; }
      .banner p { color: var(--vip-muted); font-size: 13px; margin: 4px 0 0; }

      .venue {
        display: flex; gap: 14px;
        background: var(--vip-surface); border: 1px solid var(--vip-border);
        border-radius: 18px; padding: 16px; margin-bottom: 14px;
      }
      .art {
        flex: 0 0 56px; height: 56px; border-radius: 14px; font-size: 30px;
        display: grid; place-items: center; background: var(--vip-surface-2);
      }
      .body { flex: 1; min-width: 0; }
      .row1 { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .name { color: #fff; font-weight: 700; font-size: 17px; }
      .type { display: block; color: var(--vip-muted); font-size: 12.5px; margin-top: 2px; }
      .vibe { display: block; color: var(--vip-text); font-size: 13px; margin: 8px 0 12px; opacity: 0.85; }

      .req {
        width: 100%; border: none; cursor: pointer; border-radius: 12px; padding: 12px;
        font-weight: 700; font-size: 13.5px; display: flex; align-items: center; justify-content: center; gap: 8px;
        background: linear-gradient(120deg, #d4af37, #a9861f); color: #14131b;
      }
      .req ion-icon { font-size: 17px; }
      .req.pending { background: var(--vip-surface-2); color: var(--vip-gold-soft); border: 1px solid var(--vip-border); }
      .req.review { background: var(--vip-surface-2); color: #e8cd7a; border: 1px solid color-mix(in srgb, var(--vip-gold) 40%, transparent); }
      .req.approved { background: rgba(111, 209, 143, 0.14); color: #6fd18f; border: 1px solid rgba(111, 209, 143, 0.4); }
    `,
  ],
})
export class DiscoverPage {
  vip = inject(VipService);
  private toast = inject(ToastController);

  tier(id: string) {
    return this.vip.tierById(id);
  }

  async request(v: Venue): Promise<void> {
    this.vip.requestVenue(v.id);
    const t = await this.toast.create({
      message: `Request sent to My VIP Clubs for ${v.name}. We'll get you in.`,
      duration: 2600,
      position: 'top',
      color: 'primary',
    });
    await t.present();
  }
}
