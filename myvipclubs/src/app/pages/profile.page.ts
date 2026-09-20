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
import { ApiService } from '../api/api.service';
import { BasicInfoDraft, basicToPatch, prefsToPatch, toMember } from '../api/api.mappers';

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
          <button class="photo" type="button" (click)="fileInput.click()" [disabled]="uploading()">
            @if (vip.member().membershipPhotoUrl) {
              <img [src]="vip.member().membershipPhotoUrl" alt="Profile photo" />
            } @else {
              <span class="emoji">{{ vip.member().photo }}</span>
            }
            <span class="cam">
              <ion-icon [name]="uploading() ? 'time-outline' : 'camera-outline'"></ion-icon>
            </span>
          </button>
          <input #fileInput type="file" accept="image/*" hidden (change)="onPhotoSelected($event)" />
          <h1>{{ vip.member().firstName }} {{ vip.member().lastName }}</h1>
          <span class="email">{{ vip.member().email }}</span>
          <div class="badges">
            <app-tier-badge [tier]="vip.currentTier()"></app-tier-badge>
            @if (vip.lifetimeValue() > 0) {
              <span class="ltv">{{ vip.lifetimeValue() | currency: 'USD' : 'symbol' : '1.0-0' }} lifetime</span>
            }
          </div>
        </div>

        <button class="apply-cta" (click)="openApplication()">
          <ion-icon name="ribbon-outline"></ion-icon>
          <span class="ac-text"><b>Membership application</b><small>Apply, or update your application details</small></span>
          <ion-icon name="chevron-forward-outline"></ion-icon>
        </button>

        <div class="section-label">
          Basic information
          <button class="edit" (click)="toggleBasic()" [disabled]="savingBasic()">
            <ion-icon [name]="editingBasic() ? 'checkmark-outline' : 'create-outline'"></ion-icon>
            {{ editingBasic() ? (savingBasic() ? 'Saving…' : 'Save') : 'Edit' }}
          </button>
        </div>

        <ion-list class="prefs" lines="full">
          <ion-item>
            <ion-icon slot="start" name="person-circle-outline"></ion-icon>
            <ion-input label="First name" labelPlacement="stacked" [readonly]="!editingBasic()" [(ngModel)]="basic.firstName"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="person-circle-outline"></ion-icon>
            <ion-input label="Last name" labelPlacement="stacked" [readonly]="!editingBasic()" [(ngModel)]="basic.lastName"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="sparkles-outline"></ion-icon>
            <ion-input label="Preferred name / nickname" labelPlacement="stacked" [readonly]="!editingBasic()" [(ngModel)]="basic.preferredName"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="mail-outline"></ion-icon>
            <ion-input label="Email" type="email" labelPlacement="stacked" [readonly]="!editingBasic()" [(ngModel)]="basic.email"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="call-outline"></ion-icon>
            <ion-input label="Mobile (for text alerts)" type="tel" labelPlacement="stacked" [readonly]="!editingBasic()" [(ngModel)]="basic.phone"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="home"></ion-icon>
            <ion-input label="Home address" labelPlacement="stacked" placeholder="Street address" [readonly]="!editingBasic()" [(ngModel)]="basic.street1"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="home"></ion-icon>
            <ion-input label="Apt / suite (optional)" labelPlacement="stacked" [readonly]="!editingBasic()" [(ngModel)]="basic.street2"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="location-outline"></ion-icon>
            <ion-input label="City" labelPlacement="stacked" [readonly]="!editingBasic()" [(ngModel)]="basic.city"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="location-outline"></ion-icon>
            <ion-input label="State" labelPlacement="stacked" [readonly]="!editingBasic()" [(ngModel)]="basic.state"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="location-outline"></ion-icon>
            <ion-input label="ZIP / postal code" labelPlacement="stacked" [readonly]="!editingBasic()" [(ngModel)]="basic.postal"></ion-input>
          </ion-item>
        </ion-list>

        <div class="section-label">
          My preferences
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
            <ion-icon slot="start" name="restaurant-outline"></ion-icon>
            <ion-input label="Favorite foods / cuisines" labelPlacement="stacked" [readonly]="!editing()" [(ngModel)]="draft.favoriteFoods"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="business-outline"></ion-icon>
            <ion-input label="Favorite restaurants" labelPlacement="stacked" [readonly]="!editing()" [(ngModel)]="draft.favoriteRestaurants"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="wine-outline"></ion-icon>
            <ion-input label="Preferred beverages / cocktails" labelPlacement="stacked" [readonly]="!editing()" [(ngModel)]="draft.preferredBeverages"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="sparkles-outline"></ion-icon>
            <ion-input label="Favorite wine, spirits, beer" labelPlacement="stacked" [readonly]="!editing()" [(ngModel)]="draft.favoriteWineSpirits"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="shield-checkmark-outline"></ion-icon>
            <ion-input label="Dietary restrictions / allergies" labelPlacement="stacked" [readonly]="!editing()" [(ngModel)]="draft.dietaryRestrictions"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="wine-outline"></ion-icon>
            <ion-input label="Preferred seating" labelPlacement="stacked" [readonly]="!editing()" [(ngModel)]="draft.preferredSeating"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="sparkles-outline"></ion-icon>
            <ion-input label="Preferred atmosphere" labelPlacement="stacked" [readonly]="!editing()" [(ngModel)]="draft.preferredAtmosphere"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="musical-notes-outline"></ion-icon>
            <ion-input label="Music / entertainment" labelPlacement="stacked" [readonly]="!editing()" [(ngModel)]="draft.music"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="flash-outline"></ion-icon>
            <ion-input label="Smoking / cigar preferences" labelPlacement="stacked" [readonly]="!editing()" [(ngModel)]="draft.smoking"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="gift-outline"></ion-icon>
            <ion-input label="Special occasions" labelPlacement="stacked" [readonly]="!editing()" [(ngModel)]="draft.specialOccasions"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="ribbon-outline"></ion-icon>
            <ion-textarea label="Hospitality details a venue should know" labelPlacement="stacked" [autoGrow]="true" [readonly]="!editing()" [(ngModel)]="draft.hospitalityDetails"></ion-textarea>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="star-outline"></ion-icon>
            <ion-textarea label="What makes an experience feel VIP to you?" labelPlacement="stacked" [autoGrow]="true" [readonly]="!editing()" [(ngModel)]="draft.whatMakesVip"></ion-textarea>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="eye-outline"></ion-icon>
            <ion-input label="Details you do NOT want shared" labelPlacement="stacked" [readonly]="!editing()" [(ngModel)]="draft.doNotShare"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="create-outline"></ion-icon>
            <ion-textarea label="Additional notes for recognition" labelPlacement="stacked" [autoGrow]="true" [readonly]="!editing()" [(ngModel)]="draft.additionalNotes"></ion-textarea>
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
        position: relative; width: 92px; height: 92px; margin: 0 auto 12px; padding: 0;
        border-radius: 50%; display: grid; place-items: center; font-size: 40px; overflow: visible;
        background: var(--vip-surface-2); border: 2px solid var(--vip-gold); cursor: pointer;
      }
      .photo img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
      .photo .emoji { line-height: 1; }
      .photo .cam {
        position: absolute; right: -2px; bottom: -2px; width: 30px; height: 30px; border-radius: 50%;
        display: grid; place-items: center; background: var(--vip-gold); color: #14131b;
        border: 2px solid var(--vip-bg, #0c0c13); box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      }
      .photo .cam ion-icon { font-size: 15px; }
      .photo[disabled] { opacity: 0.7; }
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
      .apply-cta { width: 100%; display: flex; align-items: center; gap: 12px; text-align: left; cursor: pointer; background: var(--vip-gold-tint, rgba(212,175,55,0.08)); border: 1px solid color-mix(in srgb, var(--vip-gold) 40%, transparent); border-radius: 14px; padding: 13px 14px; margin: 4px 0 18px; }
      .apply-cta > ion-icon { color: var(--vip-gold); font-size: 22px; }
      .apply-cta .ac-text { flex: 1; display: flex; flex-direction: column; }
      .apply-cta .ac-text b { color: #fff; font-size: 14.5px; }
      .apply-cta .ac-text small { color: var(--vip-muted); font-size: 12px; }
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
  private api = inject(ApiService);
  private router = inject(Router);
  private toast = inject(ToastController);

  editing = signal(false);
  saving = signal(false);
  uploading = signal(false);
  draft: MemberPreferences = { ...this.vip.member().preferences };

  editingBasic = signal(false);
  savingBasic = signal(false);
  basic: BasicInfoDraft = this.snapshotBasic();

  private snapshotBasic(): BasicInfoDraft {
    const m = this.vip.member();
    const a = m.homeAddress;
    return {
      firstName: m.firstName ?? '',
      lastName: m.lastName ?? '',
      preferredName: m.preferredName ?? '',
      email: m.email ?? '',
      phone: m.phone ?? '',
      street1: a?.street1 ?? '',
      street2: a?.street2 ?? '',
      city: a?.city ?? '',
      state: a?.state ?? '',
      postal: a?.postal ?? '',
    };
  }

  async toggleBasic(): Promise<void> {
    if (!this.editingBasic()) {
      this.basic = this.snapshotBasic();
      this.editingBasic.set(true);
      return;
    }
    if (this.savingBasic()) return;
    if (!this.api.isLoggedIn()) {
      await this.showToast('Sign in to edit your details.', 'warning');
      this.editingBasic.set(false);
      return;
    }
    if (!this.basic.firstName.trim() || !this.basic.email.trim()) {
      await this.showToast('Name and email are required.', 'warning');
      return;
    }
    this.savingBasic.set(true);
    try {
      const row = await this.api.updateMe(basicToPatch(this.basic));
      this.vip.setCurrentMember(toMember(row));
      this.editingBasic.set(false);
      await this.showToast('Details saved.', 'primary');
    } catch (err) {
      await this.showToast(this.basicError(err), 'danger');
    } finally {
      this.savingBasic.set(false);
    }
  }

  private basicError(err: unknown): string {
    const status = (err as { status?: number })?.status;
    if (status === 409) return 'That email is already in use by another account.';
    if (status === 400) return 'Please enter a valid name and email.';
    if (status === 0 || status === undefined) return "Couldn't reach the server — try again.";
    return 'Could not save your details. Please try again.';
  }

  async onPhotoSelected(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // let the same file be picked again later
    if (!file) return;
    if (!this.api.isLoggedIn()) {
      await this.showToast('Sign in to save a profile photo.', 'warning');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      await this.showToast('That image is over 5 MB — please pick a smaller one.', 'warning');
      return;
    }
    this.uploading.set(true);
    try {
      const row = await this.api.uploadPhoto(file);
      this.vip.setCurrentMember(toMember(row));
      await this.showToast('Profile photo updated.', 'primary');
    } catch {
      await this.showToast("Couldn't upload the photo. Please try again.", 'danger');
    } finally {
      this.uploading.set(false);
    }
  }

  async toggleEdit(): Promise<void> {
    if (!this.editing()) {
      // Enter edit mode with a fresh copy of the current preferences.
      this.draft = { ...this.vip.member().preferences };
      this.editing.set(true);
      return;
    }
    // Save.
    if (this.saving()) return;
    if (this.api.isLoggedIn()) {
      this.saving.set(true);
      try {
        const row = await this.api.updateMe(prefsToPatch(this.draft));
        this.vip.setCurrentMember(toMember(row));
        this.editing.set(false);
        await this.showToast('Preferences saved to your profile.', 'primary');
      } catch {
        // Keep them in edit mode so nothing is lost; save locally as a backstop.
        this.vip.updatePreferences({ ...this.draft });
        await this.showToast("Saved on this device — couldn't reach the server.", 'warning');
        this.editing.set(false);
      } finally {
        this.saving.set(false);
      }
    } else {
      // Demo mode (not signed in against the API).
      this.vip.updatePreferences({ ...this.draft });
      this.editing.set(false);
      await this.showToast('Preferences saved.', 'primary');
    }
  }

  openApplication(): void {
    this.router.navigateByUrl('/apply');
  }

  logout(): void {
    this.api.logout();
    this.vip.logout();
    this.router.navigateByUrl('/login');
  }

  private async showToast(message: string, color: string): Promise<void> {
    const t = await this.toast.create({ message, duration: 1800, position: 'top', color });
    await t.present();
  }
}
