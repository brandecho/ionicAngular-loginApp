import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonAvatar,
  IonBadge,
} from '@ionic/angular/standalone';
import { VipService } from '../vip.service';
import { AccountService } from '../accounts/account.service';
import { NotificationService } from '../notify/notification.service';
import { TierBadgeComponent } from '../components/tier-badge.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonAvatar,
    IonBadge,
    TierBadgeComponent,
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>My VIP Clubs</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/inbox">
            <ion-icon slot="icon-only" name="notifications-outline"></ion-icon>
            @if (unread()) { <ion-badge color="danger" class="bell-badge">{{ unread() }}</ion-badge> }
          </ion-button>
          <ion-button routerLink="/tabs/profile">
            <ion-avatar class="nav-avatar">{{ vip.member().photo }}</ion-avatar>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page">
        <p class="hello">Welcome back,</p>
        <h1 class="name">{{ vip.member().firstName }} {{ vip.member().lastName }}</h1>

        <!-- Tier card -->
        <div class="tier-card" [style.--tier-color]="vip.currentTier().color">
          <div class="tier-top">
            <app-tier-badge [tier]="vip.currentTier()"></app-tier-badge>
            <span class="since">Member since {{ vip.member().memberSince }}</span>
          </div>

          <div class="tier-value">
            <span class="label">Lifetime value</span>
            <span class="amount">{{ vip.lifetimeValue() | currency: 'USD' : 'symbol' : '1.0-0' }}</span>
          </div>

          <p class="tagline">“{{ vip.currentTier().tagline }}”</p>

          @if (vip.nextTier(); as next) {
            <div class="progress">
              <div class="bar"><span [style.width.%]="vip.progressToNext() * 100"></span></div>
              <div class="progress-meta">
                <span>{{ vip.amountToNextTier() | currency: 'USD' : 'symbol' : '1.0-0' }} to {{ next.name }}</span>
                <span>{{ vip.progressToNext() * 100 | number: '1.0-0' }}%</span>
              </div>
            </div>
          } @else {
            <div class="progress">
              <div class="progress-meta"><span>You’ve reached the top tier. 🖤</span></div>
            </div>
          }
        </div>

        <!-- Spend / tips / visits -->
        <div class="stats">
          <div class="stat">
            <ion-icon name="wallet-outline"></ion-icon>
            <span class="s-val">{{ vip.member().totalSpent | currency: 'USD' : 'symbol' : '1.0-0' }}</span>
            <span class="s-lab">Total spent</span>
          </div>
          <div class="stat">
            <ion-icon name="cash-outline"></ion-icon>
            <span class="s-val">{{ vip.member().totalTips | currency: 'USD' : 'symbol' : '1.0-0' }}</span>
            <span class="s-lab">Total tips</span>
          </div>
          <div class="stat">
            <ion-icon name="pulse-outline"></ion-icon>
            <span class="s-val">{{ vip.member().visitsThisYear }}</span>
            <span class="s-lab">Visits ’26</span>
          </div>
        </div>

        <!-- Arrive / recognition -->
        <button class="arrive" (click)="goCheckIn()">
          <div class="arrive-txt">
            <span class="arrive-title"><ion-icon name="navigate-outline"></ion-icon> I'm here</span>
            <span class="arrive-sub">Let the venue know you’ve arrived — skip the line</span>
          </div>
          <ion-icon class="arrive-go" name="arrow-forward-outline"></ion-icon>
        </button>

        <!-- Perks -->
        <div class="section-label">Your {{ vip.currentTier().name }} perks</div>
        <div class="perks">
          @for (perk of vip.currentTier().perks; track perk) {
            <div class="perk">
              <ion-icon name="checkmark-circle" [style.color]="vip.currentTier().color"></ion-icon>
              <span>{{ perk }}</span>
            </div>
          }
        </div>

        <!-- Favorite venues preview -->
        <div class="section-label ion-margin-top">
          Your venues
          <a class="see-all" routerLink="/tabs/venues">See all</a>
        </div>
        <div class="hscroll">
          @for (v of vip.favoriteVenues(); track v.id) {
            <a class="vcard" [routerLink]="['/venue', v.id]">
              <span class="vart">{{ v.image }}</span>
              <span class="vname">{{ v.name }}</span>
              <span class="vmeta">{{ v.neighborhood }}</span>
            </a>
          }
        </div>

        <div class="foot"></div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .page { padding: 8px 18px 0; max-width: 620px; margin: 0 auto; }
      .nav-avatar {
        width: 34px; height: 34px; display: grid; place-items: center;
        background: var(--vip-surface-2); border: 1px solid var(--vip-border);
        border-radius: 50%; font-size: 18px;
      }
      .hello { color: var(--vip-muted); margin: 6px 0 0; font-size: 14px; }
      .name { margin: 2px 0 18px; font-size: 26px; font-weight: 800; color: #fff; }

      .tier-card {
        position: relative;
        border-radius: 22px;
        padding: 20px;
        background:
          radial-gradient(400px 160px at 100% 0%, color-mix(in srgb, var(--tier-color) 22%, transparent), transparent 70%),
          linear-gradient(160deg, #1d1c28 0%, #131219 100%);
        border: 1px solid color-mix(in srgb, var(--tier-color) 35%, var(--vip-border));
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
      }
      .tier-top { display: flex; align-items: center; justify-content: space-between; }
      .since { color: var(--vip-muted); font-size: 12px; }
      .tier-value { margin: 18px 0 4px; display: flex; flex-direction: column; }
      .tier-value .label { color: var(--vip-muted); font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; }
      .tier-value .amount { font-size: 38px; font-weight: 800; color: #fff; line-height: 1.1; }
      .tagline { color: var(--tier-color); font-style: italic; margin: 4px 0 16px; font-size: 14px; }

      .progress .bar {
        height: 8px; border-radius: 999px; background: rgba(255,255,255,0.08); overflow: hidden;
      }
      .progress .bar span {
        display: block; height: 100%; border-radius: 999px;
        background: linear-gradient(90deg, var(--tier-color), #fff6);
        transition: width 0.6s ease;
      }
      .progress-meta { display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; color: var(--vip-muted); }

      .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 14px; }
      .stat {
        background: var(--vip-surface); border: 1px solid var(--vip-border); border-radius: 16px;
        padding: 14px 10px; display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center;
      }
      .stat ion-icon { font-size: 20px; color: var(--vip-gold); }
      .s-val { font-weight: 800; font-size: 16px; color: #fff; }
      .s-lab { font-size: 11px; color: var(--vip-muted); }

      .arrive {
        width: 100%; margin-top: 16px; text-align: left;
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
        border: none; cursor: pointer;
        background: linear-gradient(120deg, #d4af37, #a9861f);
        color: #14131b; border-radius: 18px; padding: 16px 18px;
        box-shadow: 0 12px 34px rgba(212, 175, 55, 0.30);
      }
      .arrive-txt { display: flex; flex-direction: column; }
      .arrive-title { font-weight: 800; font-size: 17px; display: flex; align-items: center; gap: 8px; }
      .arrive-sub { font-size: 12.5px; opacity: 0.8; margin-top: 2px; }
      .arrive-go { font-size: 22px; }

      .perks { display: flex; flex-direction: column; gap: 10px; }
      .perk { display: flex; align-items: center; gap: 10px; color: var(--vip-text); font-size: 14px; }
      .perk ion-icon { font-size: 20px; flex-shrink: 0; }

      .see-all { float: right; color: var(--vip-gold); font-size: 12px; text-transform: none; letter-spacing: 0; font-weight: 600; }
      .hscroll { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none; }
      .hscroll::-webkit-scrollbar { display: none; }
      .vcard {
        flex: 0 0 130px; background: var(--vip-surface); border: 1px solid var(--vip-border);
        border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 4px; text-decoration: none;
      }
      .vart { font-size: 30px; }
      .vname { color: #fff; font-weight: 700; font-size: 14px; }
      .vmeta { color: var(--vip-muted); font-size: 12px; }
      .foot { height: 24px; }
      .bell-badge { position: absolute; top: 2px; right: 2px; font-size: 10px; }
    `,
  ],
})
export class HomePage {
  vip = inject(VipService);
  private accounts = inject(AccountService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  unread = computed(() => {
    const id = this.accounts.currentAccount()?.id ?? 'acct_member_alex';
    return this.notify.unreadForAccount(id);
  });

  goCheckIn(): void {
    this.router.navigateByUrl('/checkin');
  }
}
