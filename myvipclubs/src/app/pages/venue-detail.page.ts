import { Component, Input, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  ToastController,
} from '@ionic/angular/standalone';
import { VipService } from '../vip.service';
import { TierBadgeComponent } from '../components/tier-badge.component';
import { Venue } from '../models';

@Component({
  selector: 'app-venue-detail',
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    TierBadgeComponent,
  ],
  template: `
    <ion-header class="ion-no-border" [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/venues"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ venue()?.name }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="toggleFav()">
            <ion-icon slot="icon-only" [name]="isFav() ? 'heart' : 'heart-outline'" color="primary"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      @if (venue(); as v) {
        <div class="hero">
          <span class="art">{{ v.image }}</span>
        </div>
        <div class="page">
          <h1>{{ v.name }}</h1>
          <span class="type">{{ v.type }} · {{ v.neighborhood }}, {{ v.city }}</span>
          <p class="vibe">{{ v.vibe }}</p>

          <button class="addr" (click)="directions(v)">
            <ion-icon name="location-outline"></ion-icon>
            <span class="addr-txt">{{ v.address }}</span>
            <span class="dirs"><ion-icon name="navigate-outline"></ion-icon> Directions</span>
          </button>

          <div class="tags">
            @if (tier(v.memberTierRequired); as t) {
              <app-tier-badge [tier]="t"></app-tier-badge>
            }
            @if (v.isMember) {
              <span class="access"><ion-icon name="shield-checkmark-outline"></ion-icon> Access active</span>
            }
          </div>

          @if (v.isMember) {
            <button class="arrive" (click)="checkIn()">
              <ion-icon name="navigate-outline"></ion-icon>
              I'm here — notify {{ v.name }}
            </button>
            <button class="table" (click)="requestTable(v)">
              <ion-icon name="restaurant-outline"></ion-icon>
              Request a table
            </button>
          }

          <div class="section-label">Your people here</div>
          @if (staff().length) {
            @for (s of staff(); track s.id) {
              <div class="person">
                <div class="avatar">{{ s.avatar }}</div>
                <div>
                  <span class="pname">{{ s.name }}</span>
                  <span class="prole">{{ s.role }}</span>
                </div>
              </div>
            }
          } @else {
            <p class="empty">No saved contacts here yet.</p>
          }
        </div>
      } @else {
        <div class="page"><p class="empty">Venue not found.</p></div>
      }
    </ion-content>
  `,
  styles: [
    `
      .hero {
        height: 200px; display: grid; place-items: center;
        background:
          radial-gradient(300px 160px at 50% 20%, rgba(212,175,55,0.22), transparent 70%),
          linear-gradient(160deg, #1d1c28, #0e0d14);
      }
      .art { font-size: 90px; }
      .page { padding: 18px; max-width: 620px; margin: 0 auto; }
      h1 { margin: 0; font-size: 26px; font-weight: 800; color: #fff; }
      .type { color: var(--vip-muted); font-size: 13px; }
      .vibe { color: var(--vip-text); opacity: 0.9; margin: 12px 0 16px; font-size: 15px; }
      .tags { display: flex; align-items: center; gap: 12px; }
      .access { display: inline-flex; align-items: center; gap: 5px; color: #6fd18f; font-size: 12px; font-weight: 600; }
      .access ion-icon { font-size: 14px; }
      .arrive {
        width: 100%; margin-top: 20px; border: none; cursor: pointer; border-radius: 16px; padding: 16px;
        font-weight: 800; font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 8px;
        background: linear-gradient(120deg, #d4af37, #a9861f); color: #14131b;
        box-shadow: 0 12px 34px rgba(212, 175, 55, 0.30);
      }
      .arrive ion-icon { font-size: 20px; }
      .addr {
        width: 100%; text-align: left; cursor: pointer; margin-top: 4px;
        display: flex; align-items: center; gap: 10px;
        background: var(--vip-surface); border: 1px solid var(--vip-border);
        border-radius: 14px; padding: 12px 14px; color: var(--vip-text);
      }
      .addr > ion-icon { font-size: 18px; color: var(--vip-gold); flex-shrink: 0; }
      .addr-txt { flex: 1; font-size: 13.5px; }
      .dirs { display: inline-flex; align-items: center; gap: 4px; color: var(--vip-gold); font-size: 12.5px; font-weight: 700; }
      .dirs ion-icon { font-size: 14px; }
      .table {
        width: 100%; margin-top: 12px; border: 1px solid color-mix(in srgb, var(--vip-gold) 45%, transparent);
        background: var(--vip-gold-tint); color: var(--vip-gold-soft); border-radius: 16px; padding: 15px;
        font-weight: 700; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;
      }
      .table ion-icon { font-size: 19px; }
      .person { display: flex; align-items: center; gap: 12px; background: var(--vip-surface); border: 1px solid var(--vip-border); border-radius: 14px; padding: 12px 14px; margin-bottom: 10px; }
      .avatar { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; color: #14131b; background: linear-gradient(160deg, #d4af37, #9c7c22); }
      .pname { display: block; color: #fff; font-weight: 700; font-size: 15px; }
      .prole { display: block; color: var(--vip-gold); font-size: 12px; }
      .empty { color: var(--vip-muted); }
    `,
  ],
})
export class VenueDetailPage {
  private vip = inject(VipService);
  private router = inject(Router);
  private toast = inject(ToastController);

  private _id = signal<string>('');
  @Input() set id(value: string) {
    this._id.set(value);
  }

  venue = computed(() => this.vip.venueById(this._id()));
  staff = computed(() => this.vip.staffForVenue(this._id()));
  isFav = computed(() => this.vip.isFavoriteVenue(this._id()));

  tier(tierId: string) {
    return this.vip.tierById(tierId);
  }

  toggleFav(): void {
    this.vip.toggleFavoriteVenue(this._id());
  }

  checkIn(): void {
    this.router.navigate(['/checkin'], { queryParams: { venue: this._id() } });
  }

  /** Open the venue's location in Google Maps (works on web and native). */
  directions(v: Venue): void {
    const dest = v.lat && v.lng ? `${v.lat},${v.lng}` : encodeURIComponent(v.address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    window.open(url, '_blank');
  }

  async requestTable(v: Venue): Promise<void> {
    const t = await this.toast.create({
      message: `Table request sent to ${v.name}. Your host will confirm shortly.`,
      duration: 2400,
      position: 'top',
      color: 'primary',
    });
    await t.present();
  }
}
