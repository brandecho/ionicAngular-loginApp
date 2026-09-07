import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonTextarea,
  ToastController,
} from '@ionic/angular/standalone';
import { VipService } from '../vip.service';
import { TierBadgeComponent } from '../components/tier-badge.component';
import { MemberPreferences } from '../models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonList,
    IonTextarea,
    TierBadgeComponent,
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>Profile</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="logout()">
            <ion-icon slot="icon-only" name="log-out-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page">
        <div class="hero">
          <div class="photo">{{ vip.member().photo }}</div>
          <h1>{{ vip.member().firstName }} {{ vip.member().lastName }}</h1>
          <span class="email">{{ vip.member().email }}</span>
          <div class="badges">
            <app-tier-badge [tier]="vip.currentTier()"></app-tier-badge>
            <span class="ltv">{{ vip.lifetimeValue() | currency: 'USD' : 'symbol' : '1.0-0' }} lifetime</span>
          </div>
        </div>

        <div class="section-label">
          My tastes
          <button class="edit" (click)="toggleEdit()">
            <ion-icon [name]="editing() ? 'checkmark-outline' : 'create-outline'"></ion-icon>
            {{ editing() ? 'Save' : 'Edit' }}
          </button>
        </div>

        <p class="why">
          <ion-icon name="information-circle-outline"></ion-icon>
          This is what your venues and their staff see so they can take care of you.
        </p>

        <ion-list class="prefs" lines="full">
          <ion-item>
            <ion-icon slot="start" name="wine-outline"></ion-icon>
            <ion-input label="Go-to drink" labelPlacement="stacked" [readonly]="!editing()" [(ngModel)]="draft.favoriteDrink"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="sparkles-outline"></ion-icon>
            <ion-input label="Celebration drink" labelPlacement="stacked" [readonly]="!editing()" [(ngModel)]="draft.secondDrink"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="flash-outline"></ion-icon>
            <ion-input label="Preferred spirit" labelPlacement="stacked" [readonly]="!editing()" [(ngModel)]="draft.spirit"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="restaurant-outline"></ion-icon>
            <ion-input label="Seating" labelPlacement="stacked" [readonly]="!editing()" [(ngModel)]="draft.seating"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="musical-notes-outline"></ion-icon>
            <ion-input label="Music" labelPlacement="stacked" [readonly]="!editing()" [(ngModel)]="draft.music"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="shield-checkmark-outline"></ion-icon>
            <ion-input label="Allergies" labelPlacement="stacked" [readonly]="!editing()" [(ngModel)]="draft.allergies"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="gift-outline"></ion-icon>
            <ion-input label="Celebration / dates" labelPlacement="stacked" [readonly]="!editing()" [(ngModel)]="draft.celebration"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="ribbon-outline"></ion-icon>
            <ion-textarea label="Notes for the house" labelPlacement="stacked" [autoGrow]="true" [readonly]="!editing()" [(ngModel)]="draft.notes"></ion-textarea>
          </ion-item>
        </ion-list>

        <div class="foot"></div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .page { padding: 8px 18px 28px; max-width: 620px; margin: 0 auto; }
      .hero { text-align: center; padding: 8px 0 6px; }
      .photo {
        width: 84px; height: 84px; margin: 0 auto 12px; border-radius: 50%;
        display: grid; place-items: center; font-size: 40px;
        background: var(--vip-surface-2); border: 2px solid var(--vip-gold);
      }
      h1 { margin: 0; font-size: 24px; font-weight: 800; color: #fff; }
      .email { color: var(--vip-muted); font-size: 13px; }
      .badges { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 12px; }
      .ltv { color: var(--vip-gold-soft); font-size: 13px; font-weight: 600; }

      .edit {
        float: right; display: inline-flex; align-items: center; gap: 5px;
        background: var(--vip-gold-tint); color: var(--vip-gold); border: 1px solid color-mix(in srgb, var(--vip-gold) 40%, transparent);
        border-radius: 999px; padding: 5px 12px; font-size: 12px; font-weight: 700; cursor: pointer;
        text-transform: none; letter-spacing: 0;
      }
      .why { display: flex; gap: 8px; align-items: flex-start; color: var(--vip-muted); font-size: 12.5px; margin: 0 2px 10px; }
      .why ion-icon { font-size: 16px; color: var(--vip-gold); margin-top: 1px; }

      .prefs {
        background: var(--vip-surface); border: 1px solid var(--vip-border); border-radius: 18px; overflow: hidden;
      }
      .prefs ion-item { --background: transparent; }
      .prefs ion-icon[slot='start'] { color: var(--vip-gold); }
      .foot { height: 24px; }
    `,
  ],
})
export class ProfilePage {
  vip = inject(VipService);
  private router = inject(Router);
  private toast = inject(ToastController);

  editing = signal(false);
  draft: MemberPreferences = { ...this.vip.member().preferences };

  toggleEdit(): void {
    if (this.editing()) {
      this.vip.updatePreferences({ ...this.draft });
      this.editing.set(false);
      this.toast
        .create({ message: 'Preferences saved.', duration: 1600, position: 'top', color: 'primary' })
        .then((t) => t.present());
    } else {
      this.draft = { ...this.vip.member().preferences };
      this.editing.set(true);
    }
  }

  logout(): void {
    this.vip.logout();
    this.router.navigateByUrl('/login');
  }
}
