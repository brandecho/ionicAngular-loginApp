import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  IonItem,
  IonList,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonCheckbox,
  ToastController,
} from '@ionic/angular/standalone';
import { VipService } from '../vip.service';
import { ApiService } from '../api/api.service';
import { toMember } from '../api/api.mappers';

type Plan = 'free' | 'fast_track';
type Step = 'choose' | 'form' | 'done';

@Component({
  selector: 'app-apply',
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonItem,
    IonList,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonCheckbox,
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/profile"></ion-back-button>
        </ion-buttons>
        <ion-title>Membership application</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page">
        @switch (step()) {
          <!-- ---------------- choose a plan ---------------- -->
          @case ('choose') {
            <p class="lead">Choose how you'd like to apply.</p>

            <button class="plan" (click)="pick('free')">
              <div class="ptop"><span class="pico">📝</span><span class="pprice free">Free</span></div>
              <h3>Full application</h3>
              <p>The complete membership application. Tell us all about your tastes so venues can truly recognize you. Takes a few minutes.</p>
              <span class="go">Start free application <ion-icon name="chevron-forward-outline"></ion-icon></span>
            </button>

            <button class="plan featured" (click)="pick('fast_track')">
              <div class="ptop"><span class="pico">⚡</span><span class="pprice">$25</span></div>
              <h3>Fast-track</h3>
              <p>Short on time? Submit the essentials and pay a $25 fast-track fee to jump the queue.</p>
              <span class="go">Start fast-track <ion-icon name="chevron-forward-outline"></ion-icon></span>
            </button>

            <p class="disclaimer">Every application is reviewed by My VIP Clubs before approval.</p>
          }

          <!-- ---------------- the form ---------------- -->
          @case ('form') {
            <div class="formhead">
              <span class="badge" [class.gold]="plan() === 'fast_track'">
                {{ plan() === 'fast_track' ? '⚡ Fast-track · $25' : '📝 Full application · Free' }}
              </span>
            </div>

            <!-- Photo -->
            <div class="avatarwrap">
              <button class="avatar" type="button" (click)="photoInput.click()" [disabled]="uploading()">
                @if (vip.member().membershipPhotoUrl) {
                  <img [src]="vip.member().membershipPhotoUrl" alt="Photo" />
                } @else {
                  <ion-icon name="person-circle-outline"></ion-icon>
                }
                <span class="cam"><ion-icon [name]="uploading() ? 'time-outline' : 'camera-outline'"></ion-icon></span>
              </button>
              <span class="avatarlabel">Membership photo</span>
              <input #photoInput type="file" accept="image/*" hidden (change)="onPhoto($event)" />
            </div>

            <!-- About you (both plans) -->
            <div class="sec">About you</div>
            <ion-list class="form" lines="full">
              <ion-item><ion-input label="First name *" labelPlacement="stacked" [(ngModel)]="m.first_name"></ion-input></ion-item>
              <ion-item><ion-input label="Last name *" labelPlacement="stacked" [(ngModel)]="m.last_name"></ion-input></ion-item>
              <ion-item><ion-input label="Preferred name / nickname" labelPlacement="stacked" [(ngModel)]="m.preferred_name"></ion-input></ion-item>
              <ion-item><ion-input label="Email *" type="email" labelPlacement="stacked" [(ngModel)]="m.email"></ion-input></ion-item>
              <ion-item><ion-input label="Mobile (for text alerts) *" type="tel" labelPlacement="stacked" [(ngModel)]="m.phone"></ion-input></ion-item>
              <ion-item lines="none">
                <ion-toggle [(ngModel)]="m.over_21">I am 21 or older *</ion-toggle>
              </ion-item>
            </ion-list>

            @if (plan() === 'free') {
              <ion-list class="form" lines="full">
                <ion-item><ion-input label="Home street address" labelPlacement="stacked" [(ngModel)]="m.address_street1"></ion-input></ion-item>
                <ion-item><ion-input label="Apt / suite" labelPlacement="stacked" [(ngModel)]="m.address_street2"></ion-input></ion-item>
                <ion-item><ion-input label="City" labelPlacement="stacked" [(ngModel)]="m.address_city"></ion-input></ion-item>
                <ion-item><ion-input label="State" labelPlacement="stacked" [(ngModel)]="m.address_state"></ion-input></ion-item>
                <ion-item><ion-input label="ZIP / postal code" labelPlacement="stacked" [(ngModel)]="m.address_postal"></ion-input></ion-item>
                <ion-item><ion-input label="Instagram / social" labelPlacement="stacked" [(ngModel)]="m.social_profile"></ion-input></ion-item>
                <ion-item><ion-input label="LinkedIn URL" labelPlacement="stacked" [(ngModel)]="m.linkedin_url"></ion-input></ion-item>
                <ion-item>
                  <ion-select label="Relationship status" labelPlacement="stacked" interface="action-sheet" [(ngModel)]="m.relationship_status">
                    @for (o of relationshipOptions; track o) { <ion-select-option [value]="o">{{ o }}</ion-select-option> }
                  </ion-select>
                </ion-item>
                <ion-item><ion-input label="How did you hear about us?" labelPlacement="stacked" [(ngModel)]="m.how_heard"></ion-input></ion-item>
              </ion-list>

              <!-- Referral -->
              <div class="sec">Your referral</div>
              <ion-list class="form" lines="full">
                <ion-item><ion-input label="Referring member — first name" labelPlacement="stacked" [(ngModel)]="m.referral_first"></ion-input></ion-item>
                <ion-item><ion-input label="Referring member — last name" labelPlacement="stacked" [(ngModel)]="m.referral_last"></ion-input></ion-item>
                <ion-item><ion-input label="Their VIP number" labelPlacement="stacked" [(ngModel)]="m.referral_vip_number"></ion-input></ion-item>
                <ion-item><ion-input label="Your relationship to them" labelPlacement="stacked" [(ngModel)]="m.referral_relationship"></ion-input></ion-item>
                <ion-item><ion-input label="How long you've known them" labelPlacement="stacked" [(ngModel)]="m.referral_known_duration"></ion-input></ion-item>
                <ion-item lines="none"><ion-toggle [(ngModel)]="m.referral_knows_personally">They know me personally</ion-toggle></ion-item>
              </ion-list>

              <!-- Professional -->
              <div class="sec">Professional</div>
              <ion-list class="form" lines="full">
                <ion-item><ion-input label="Employer" labelPlacement="stacked" [(ngModel)]="m.employer"></ion-input></ion-item>
                <ion-item><ion-input label="Industry" labelPlacement="stacked" [(ngModel)]="m.industry"></ion-input></ion-item>
                <ion-item><ion-input label="Job title" labelPlacement="stacked" [(ngModel)]="m.job_title"></ion-input></ion-item>
                <ion-item lines="none"><ion-toggle [(ngModel)]="m.is_business_owner">I'm a business owner</ion-toggle></ion-item>
              </ion-list>

              <!-- Interests -->
              <div class="sec">Where you like to go</div>
              <ion-list class="form" lines="full">
                @for (o of establishmentOptions; track o) {
                  <ion-item lines="full">
                    <ion-checkbox [checked]="has(m.establishment_types, o)" (ionChange)="toggleChoice(m.establishment_types, o, $event)">{{ o }}</ion-checkbox>
                  </ion-item>
                }
                <ion-item>
                  <ion-select label="How often you go out" labelPlacement="stacked" interface="action-sheet" [(ngModel)]="m.visit_frequency">
                    @for (o of frequencyOptions; track o) { <ion-select-option [value]="o">{{ o }}</ion-select-option> }
                  </ion-select>
                </ion-item>
                <ion-item>
                  <ion-select label="Usually you go" labelPlacement="stacked" interface="action-sheet" [(ngModel)]="m.visit_company">
                    @for (o of companyOptions; track o) { <ion-select-option [value]="o">{{ o }}</ion-select-option> }
                  </ion-select>
                </ion-item>
                <ion-item lines="none"><ion-toggle [(ngModel)]="m.interested_events">Interested in member events</ion-toggle></ion-item>
                <ion-item lines="none"><ion-toggle [(ngModel)]="m.interested_offers">Interested in venue offers</ion-toggle></ion-item>
              </ion-list>
            }

            <!-- Preferences (both plans; short list for fast-track) -->
            <div class="sec">Your VIP tastes</div>
            <ion-list class="form" lines="full">
              <ion-item><ion-input label="Preferred beverages / cocktails" labelPlacement="stacked" [(ngModel)]="m.preferred_beverages"></ion-input></ion-item>
              <ion-item><ion-input label="Dietary restrictions / allergies" labelPlacement="stacked" [(ngModel)]="m.dietary_restrictions"></ion-input></ion-item>
              <ion-item><ion-input label="Preferred seating" labelPlacement="stacked" [(ngModel)]="m.preferred_seating"></ion-input></ion-item>
              @if (plan() === 'free') {
                <ion-item><ion-input label="Favorite foods / cuisines" labelPlacement="stacked" [(ngModel)]="m.favorite_foods"></ion-input></ion-item>
                <ion-item><ion-input label="Favorite restaurants" labelPlacement="stacked" [(ngModel)]="m.favorite_restaurants"></ion-input></ion-item>
                <ion-item><ion-input label="Favorite wine, spirits, beer" labelPlacement="stacked" [(ngModel)]="m.favorite_wine_spirits"></ion-input></ion-item>
                <ion-item><ion-input label="Preferred atmosphere" labelPlacement="stacked" [(ngModel)]="m.preferred_atmosphere"></ion-input></ion-item>
                <ion-item><ion-input label="Music / entertainment" labelPlacement="stacked" [(ngModel)]="m.music"></ion-input></ion-item>
                <ion-item><ion-input label="Smoking / cigar preferences" labelPlacement="stacked" [(ngModel)]="m.smoking"></ion-input></ion-item>
              }
              <ion-item><ion-textarea label="What makes an experience feel truly VIP to you?" labelPlacement="stacked" [autoGrow]="true" [(ngModel)]="m.what_makes_vip"></ion-textarea></ion-item>
              @if (plan() === 'free') {
                <ion-item><ion-textarea label="Hospitality details a venue should know" labelPlacement="stacked" [autoGrow]="true" [(ngModel)]="m.hospitality_details"></ion-textarea></ion-item>
                <ion-item><ion-input label="Anything you do NOT want shared" labelPlacement="stacked" [(ngModel)]="m.do_not_share"></ion-input></ion-item>
                <ion-item><ion-textarea label="Additional notes" labelPlacement="stacked" [autoGrow]="true" [(ngModel)]="m.additional_notes"></ion-textarea></ion-item>
              }
              <ion-item lines="none"><ion-toggle [(ngModel)]="m.consent_share_with_venues">Share my preferences with venues I visit</ion-toggle></ion-item>
            </ion-list>

            <!-- Consents -->
            <div class="sec">Agreements</div>
            <ion-list class="form" lines="full">
              @if (plan() === 'free') {
                <ion-item><ion-checkbox [(ngModel)]="m.standards_ack">I'll uphold the club's standards of conduct</ion-checkbox></ion-item>
                <ion-item><ion-checkbox [(ngModel)]="m.gratuity_agreed">I understand gratuity expectations</ion-checkbox></ion-item>
                <ion-item><ion-checkbox [(ngModel)]="m.privacy_consented">I consent to the privacy policy</ion-checkbox></ion-item>
                <ion-item><ion-checkbox [(ngModel)]="m.authorize_verification">I authorize verification of my information</ion-checkbox></ion-item>
              }
              <ion-item><ion-checkbox [(ngModel)]="m.final_certification">I certify the information above is true *</ion-checkbox></ion-item>
            </ion-list>

            @if (plan() === 'fast_track') {
              <p class="feenote"><ion-icon name="card-outline"></ion-icon> A $25 fast-track fee is collected securely after you submit.</p>
            }

            <ion-button expand="block" class="cta" [disabled]="submitting()" (click)="submit()">
              {{ submitting()
                  ? 'Submitting…'
                  : plan() === 'fast_track' ? 'Submit & pay $25' : 'Submit application' }}
            </ion-button>
            <ion-button expand="block" fill="clear" (click)="step.set('choose')">Back</ion-button>
          }

          <!-- ---------------- done ---------------- -->
          @case ('done') {
            <div class="done">
              <div class="check"><ion-icon name="checkmark-circle"></ion-icon></div>
              <h2>{{ doneTitle() }}</h2>
              <p>{{ doneBody() }}</p>
              <ion-button expand="block" (click)="goHome()">Go to my home</ion-button>
            </div>
          }
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .page { padding: 12px 18px 40px; max-width: 560px; margin: 0 auto; }
      .lead { color: var(--vip-muted); margin: 6px 2px 18px; font-size: 15px; }
      .plan {
        width: 100%; text-align: left; cursor: pointer; display: block;
        background: var(--vip-surface); border: 1px solid var(--vip-border); border-radius: 18px;
        padding: 18px; margin-bottom: 14px;
      }
      .plan.featured { border-color: color-mix(in srgb, var(--vip-gold) 55%, transparent); background: var(--vip-gold-tint, rgba(212,175,55,0.08)); }
      .ptop { display: flex; align-items: center; justify-content: space-between; }
      .pico { font-size: 26px; }
      .pprice { font-weight: 800; font-size: 20px; color: var(--vip-gold); }
      .pprice.free { color: #6fd18f; }
      .plan h3 { color: #fff; margin: 10px 0 4px; font-size: 18px; font-weight: 800; }
      .plan p { color: var(--vip-muted); font-size: 13px; margin: 0 0 12px; }
      .go { color: var(--vip-gold); font-weight: 700; font-size: 13.5px; display: inline-flex; align-items: center; gap: 4px; }
      .disclaimer { color: var(--vip-muted); font-size: 12px; text-align: center; margin-top: 8px; }

      .formhead { text-align: center; margin: 2px 0 14px; }
      .badge { display: inline-block; background: var(--vip-surface-2); border: 1px solid var(--vip-border); color: #fff; border-radius: 999px; padding: 6px 14px; font-size: 12.5px; font-weight: 700; }
      .badge.gold { border-color: var(--vip-gold); color: var(--vip-gold); }

      .avatarwrap { text-align: center; margin-bottom: 12px; }
      .avatar { position: relative; width: 96px; height: 96px; padding: 0; border-radius: 50%; display: grid; place-items: center; background: var(--vip-surface-2); border: 2px solid var(--vip-gold); cursor: pointer; }
      .avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
      .avatar > ion-icon { font-size: 46px; color: var(--vip-muted); }
      .avatar .cam { position: absolute; right: -2px; bottom: -2px; width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: var(--vip-gold); color: #14131b; border: 2px solid #0c0c13; }
      .avatar .cam ion-icon { font-size: 15px; }
      .avatarlabel { display: block; color: var(--vip-muted); font-size: 12px; margin-top: 8px; }

      .sec { color: var(--vip-gold-soft, #e6cf7a); text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; font-weight: 800; margin: 20px 4px 8px; }
      .form { background: var(--vip-surface); border: 1px solid var(--vip-border); border-radius: 16px; overflow: hidden; }
      .form ion-item { --background: transparent; }
      .feenote { display: flex; gap: 8px; align-items: center; color: var(--vip-muted); font-size: 13px; margin: 16px 4px; }
      .feenote ion-icon { color: var(--vip-gold); font-size: 18px; }
      .cta { margin-top: 18px; --border-radius: 14px; font-weight: 700; height: 52px; }

      .done { text-align: center; padding: 40px 10px; }
      .check ion-icon { font-size: 72px; color: #6fd18f; }
      .done h2 { color: #fff; margin: 16px 0 8px; font-size: 23px; font-weight: 800; }
      .done p { color: var(--vip-muted); font-size: 14.5px; max-width: 400px; margin: 0 auto 22px; }
    `,
  ],
})
export class ApplyPage {
  vip = inject(VipService);
  private api = inject(ApiService);
  private router = inject(Router);
  private toast = inject(ToastController);

  step = signal<Step>('choose');
  plan = signal<Plan>('free');
  submitting = signal(false);
  uploading = signal(false);

  relationshipOptions = ['Single', 'In a relationship', 'Married', 'Prefer not to say'];
  establishmentOptions = [
    'Upscale restaurants', 'Lounges', 'Nightclubs', 'Rooftops',
    'Speakeasies', 'Members clubs', 'Live music', 'Cocktail bars',
  ];
  frequencyOptions = ['Weekly', 'A few times a month', 'Monthly', 'Occasionally'];
  companyOptions = ['Alone', 'As a couple', 'With a group'];

  m = this.blankModel();

  constructor() {
    // If Stripe sent the applicant back after paying, show a confirmation.
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get('paid') === '1') this.step.set('done');
    } catch {
      /* ignore */
    }
  }

  private blankModel() {
    const mem = this.vip.member();
    const a = mem.homeAddress;
    return {
      first_name: mem.firstName ?? '',
      last_name: mem.lastName ?? '',
      preferred_name: mem.preferredName ?? '',
      email: mem.email ?? '',
      phone: mem.phone ?? '',
      over_21: mem.over21 ?? false,
      address_street1: a?.street1 ?? '',
      address_street2: a?.street2 ?? '',
      address_city: a?.city ?? '',
      address_state: a?.state ?? '',
      address_postal: a?.postal ?? '',
      social_profile: mem.socialProfile ?? '',
      linkedin_url: mem.linkedInUrl ?? '',
      relationship_status: mem.relationshipStatus ?? '',
      how_heard: mem.howHeard ?? '',
      referral_first: '',
      referral_last: '',
      referral_vip_number: '',
      referral_relationship: '',
      referral_known_duration: '',
      referral_knows_personally: false,
      employer: mem.employer ?? '',
      industry: mem.industry ?? '',
      job_title: mem.jobTitle ?? '',
      is_business_owner: mem.isBusinessOwner ?? false,
      establishment_types: [] as string[],
      visit_frequency: '',
      visit_company: '',
      interested_events: false,
      interested_offers: false,
      favorite_foods: mem.preferences.favoriteFoods ?? '',
      favorite_restaurants: mem.preferences.favoriteRestaurants ?? '',
      preferred_beverages: mem.preferences.preferredBeverages ?? '',
      dietary_restrictions: mem.preferences.dietaryRestrictions ?? '',
      favorite_wine_spirits: mem.preferences.favoriteWineSpirits ?? '',
      preferred_seating: mem.preferences.preferredSeating ?? '',
      preferred_atmosphere: mem.preferences.preferredAtmosphere ?? '',
      music: mem.preferences.music ?? '',
      smoking: mem.preferences.smoking ?? '',
      hospitality_details: mem.preferences.hospitalityDetails ?? '',
      what_makes_vip: mem.preferences.whatMakesVip ?? '',
      do_not_share: mem.preferences.doNotShare ?? '',
      additional_notes: mem.preferences.additionalNotes ?? '',
      consent_share_with_venues: mem.preferences.consentShareWithVenues ?? false,
      standards_ack: false,
      gratuity_agreed: false,
      privacy_consented: false,
      authorize_verification: false,
      final_certification: false,
    };
  }

  pick(plan: Plan): void {
    this.plan.set(plan);
    this.m = this.blankModel();
    this.step.set('form');
  }

  has(list: string[], value: string): boolean {
    return list.includes(value);
  }

  toggleChoice(list: string[], value: string, ev: CustomEvent): void {
    const checked = (ev.detail as { checked: boolean }).checked;
    const i = list.indexOf(value);
    if (checked && i === -1) list.push(value);
    if (!checked && i !== -1) list.splice(i, 1);
  }

  async onPhoto(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!this.api.isLoggedIn()) {
      await this.msg('Sign in to add a photo.', 'warning');
      return;
    }
    this.uploading.set(true);
    try {
      const row = await this.api.uploadPhoto(file);
      this.vip.setCurrentMember(toMember(row));
    } catch {
      await this.msg("Couldn't upload that photo.", 'danger');
    } finally {
      this.uploading.set(false);
    }
  }

  private valid(): string | null {
    if (!this.m.first_name.trim() || !this.m.last_name.trim()) return 'Please enter your first and last name.';
    if (!this.m.email.trim()) return 'Please enter your email.';
    if (!this.m.phone.trim()) return 'Please enter your mobile number.';
    if (!this.m.over_21) return 'You must be 21 or older to apply.';
    if (!this.m.final_certification) return 'Please certify your information is true.';
    if (this.plan() === 'free') {
      if (!this.m.standards_ack || !this.m.gratuity_agreed || !this.m.privacy_consented || !this.m.authorize_verification) {
        return 'Please accept all the agreements to submit the full application.';
      }
    }
    return null;
  }

  async submit(): Promise<void> {
    if (this.submitting()) return;
    const problem = this.valid();
    if (problem) {
      await this.msg(problem, 'warning');
      return;
    }
    if (!this.api.isLoggedIn()) {
      await this.msg('Please sign in first.', 'warning');
      return;
    }
    this.submitting.set(true);
    try {
      const row = await this.api.submitApplication({ ...this.m, plan: this.plan() });
      this.vip.setCurrentMember(toMember(row));

      if (this.plan() === 'fast_track') {
        const res = await this.api.startApplicationCheckout();
        if (res.configured && res.url) {
          window.location.href = res.url; // to Stripe Checkout
          return;
        }
        // Stripe not enabled yet — application is saved; payment can follow.
        this.step.set('done');
        await this.msg('Application saved. Card payments turn on soon.', 'primary');
        return;
      }
      this.step.set('done');
    } catch (err) {
      await this.msg(this.errText(err), 'danger');
    } finally {
      this.submitting.set(false);
    }
  }

  doneTitle(): string {
    return this.plan() === 'fast_track' ? 'Application submitted' : 'Application submitted';
  }

  doneBody(): string {
    return this.plan() === 'fast_track'
      ? "Thanks! We've received your fast-track application. My VIP Clubs will review it and text you when a decision is made."
      : "Thanks! We've received your application. My VIP Clubs will review it and text you when a decision is made.";
  }

  goHome(): void {
    this.router.navigateByUrl('/tabs/home');
  }

  private errText(err: unknown): string {
    const s = (err as { status?: number })?.status;
    if (s === 409) return 'That email is already in use by another account.';
    if (s === 0 || s === undefined) return "Couldn't reach the server — please try again.";
    return 'Something went wrong submitting your application.';
  }

  private async msg(message: string, color: string): Promise<void> {
    const t = await this.toast.create({ message, duration: 2600, position: 'top', color });
    await t.present();
  }
}
