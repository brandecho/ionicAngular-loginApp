import { Component, computed, inject, signal } from '@angular/core';
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
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { VipService } from '../vip.service';
import { AccountService } from '../accounts/account.service';
import { StaffRole } from '../accounts/account.models';
import { Venue } from '../models';

type Role = 'member' | 'venue' | 'staff';
type Step = 'choose' | 'form' | 'done';

@Component({
  selector: 'app-register',
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
    IonSelect,
    IonSelectOption,
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/login"></ion-back-button>
        </ion-buttons>
        <ion-title>Create account</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page">
        @switch (step()) {
          <!-- ---------- choose role ---------- -->
          @case ('choose') {
            <p class="lead">How will you use My VIP Clubs?</p>
            <button class="role" (click)="pick('member')">
              <span class="ic">🕶️</span>
              <div><span class="rt">I'm a member</span><span class="rd">Get the hookup and VIP access</span></div>
              <ion-icon name="chevron-forward-outline"></ion-icon>
            </button>
            <button class="role" (click)="pick('venue')">
              <span class="ic">🏛️</span>
              <div><span class="rt">I run a venue</span><span class="rd">List your venue & recognize VIPs</span></div>
              <ion-icon name="chevron-forward-outline"></ion-icon>
            </button>
            <button class="role" (click)="pick('staff')">
              <span class="ic">🧑‍🍳</span>
              <div><span class="rt">I'm venue staff</span><span class="rd">Join your venue's team</span></div>
              <ion-icon name="chevron-forward-outline"></ion-icon>
            </button>
          }

          <!-- ---------- form ---------- -->
          @case ('form') {
            <p class="lead">{{ formTitle() }}</p>
            <ion-list class="form" lines="none">
              @if (role() === 'venue') {
                <ion-item><ion-input label="Venue name" labelPlacement="stacked" [(ngModel)]="f.venueName"></ion-input></ion-item>
                <ion-item>
                  <ion-select label="Type" labelPlacement="stacked" [(ngModel)]="f.type" interface="action-sheet">
                    @for (t of venueTypes; track t) { <ion-select-option [value]="t">{{ t }}</ion-select-option> }
                  </ion-select>
                </ion-item>
                <ion-item><ion-input label="Address" labelPlacement="stacked" [(ngModel)]="f.address"></ion-input></ion-item>
                <ion-item><ion-input label="Neighborhood" labelPlacement="stacked" [(ngModel)]="f.neighborhood"></ion-input></ion-item>
                <ion-item><ion-input label="City" labelPlacement="stacked" [(ngModel)]="f.city"></ion-input></ion-item>
                <ion-item><ion-input label="Your name" labelPlacement="stacked" [(ngModel)]="f.name"></ion-input></ion-item>
              } @else {
                <ion-item><ion-input label="Full name" labelPlacement="stacked" [(ngModel)]="f.name"></ion-input></ion-item>
              }

              @if (role() === 'staff') {
                <ion-item>
                  <ion-select label="Your venue" labelPlacement="stacked" [(ngModel)]="f.venueId" interface="action-sheet">
                    @for (v of venues(); track v.id) { <ion-select-option [value]="v.id">{{ v.name }}</ion-select-option> }
                  </ion-select>
                </ion-item>
                <ion-item>
                  <ion-select label="Your role" labelPlacement="stacked" [(ngModel)]="f.staffRole" interface="action-sheet">
                    @for (r of staffRoles; track r) { <ion-select-option [value]="r">{{ r }}</ion-select-option> }
                  </ion-select>
                </ion-item>
              }

              <ion-item><ion-input label="Email" labelPlacement="stacked" type="email" [(ngModel)]="f.email"></ion-input></ion-item>
              <ion-item>
                <ion-input label="Mobile (for text alerts)" labelPlacement="stacked" type="tel" placeholder="+1 305 555 0100" [(ngModel)]="f.phone"></ion-input>
              </ion-item>
              <ion-item><ion-input label="Password" labelPlacement="stacked" type="password" [(ngModel)]="f.password"></ion-input></ion-item>
            </ion-list>

            <p class="sms-note"><ion-icon name="chatbubble-ellipses-outline"></ion-icon> We'll text important updates to your mobile — standard rates apply.</p>

            <ion-button expand="block" class="cta" [disabled]="!valid()" (click)="submit()">
              {{ role() === 'member' ? 'Create account' : 'Submit for approval' }}
            </ion-button>
          }

          <!-- ---------- done ---------- -->
          @case ('done') {
            <div class="done">
              <div class="check"><ion-icon name="checkmark-circle"></ion-icon></div>
              <h2>{{ doneTitle() }}</h2>
              <p>{{ doneBody() }}</p>
              @if (role() === 'staff') {
                <ion-button expand="block" fill="outline" (click)="goStaffStatus()">
                  View my status
                </ion-button>
              }
              <ion-button expand="block" fill="clear" (click)="goHome()">Back to start</ion-button>
            </div>
          }
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .page { padding: 10px 18px 28px; max-width: 520px; margin: 0 auto; }
      .lead { color: var(--vip-muted); margin: 6px 2px 16px; font-size: 14px; }
      .role {
        width: 100%; display: flex; align-items: center; gap: 14px; text-align: left; cursor: pointer;
        background: var(--vip-surface); border: 1px solid var(--vip-border); border-radius: 16px; padding: 16px; margin-bottom: 12px;
      }
      .role .ic { font-size: 28px; flex: 0 0 auto; }
      .role div { flex: 1; display: flex; flex-direction: column; }
      .rt { color: #fff; font-weight: 700; font-size: 16px; }
      .rd { color: var(--vip-muted); font-size: 12.5px; margin-top: 2px; }
      .role ion-icon { color: var(--vip-muted); font-size: 20px; }

      .form { background: var(--vip-surface); border: 1px solid var(--vip-border); border-radius: 16px; overflow: hidden; }
      .form ion-item { --background: transparent; }
      .sms-note { display: flex; gap: 8px; align-items: flex-start; color: var(--vip-muted); font-size: 12.5px; margin: 14px 4px; }
      .sms-note ion-icon { color: var(--vip-gold); font-size: 16px; margin-top: 1px; }
      .cta { --border-radius: 14px; font-weight: 700; height: 50px; }

      .done { text-align: center; padding: 30px 10px; }
      .check ion-icon { font-size: 66px; color: #6fd18f; }
      .done h2 { color: #fff; margin: 14px 0 6px; font-size: 22px; font-weight: 800; }
      .done p { color: var(--vip-muted); font-size: 14px; max-width: 380px; margin: 0 auto 18px; }
    `,
  ],
})
export class RegisterPage {
  private vip = inject(VipService);
  private accounts = inject(AccountService);
  private router = inject(Router);

  step = signal<Step>('choose');
  role = signal<Role>('member');
  private lastMembershipId = signal<string>('');

  venues = computed<Venue[]>(() => this.vip.allVenues());
  venueTypes: Venue['type'][] = ['Nightclub', 'Lounge', 'Rooftop', 'Restaurant', 'Speakeasy', 'Members Club'];
  staffRoles: StaffRole[] = ['Manager', 'Bartender', 'Server', 'Host', 'Sommelier', 'Security'];

  f = {
    name: '',
    email: '',
    phone: '',
    password: '',
    venueName: '',
    type: 'Nightclub' as Venue['type'],
    address: '',
    neighborhood: '',
    city: 'Miami',
    venueId: '',
    staffRole: 'Server' as StaffRole,
  };

  pick(role: Role): void {
    this.role.set(role);
    this.step.set('form');
  }

  formTitle(): string {
    return this.role() === 'member'
      ? 'Your details'
      : this.role() === 'venue'
        ? 'Tell us about your venue'
        : 'Join your venue';
  }

  valid(): boolean {
    const base = !!(this.f.name && this.f.email && this.f.phone && this.f.password);
    if (this.role() === 'venue') return base && !!(this.f.venueName && this.f.address);
    if (this.role() === 'staff') return base && !!this.f.venueId;
    return base;
  }

  submit(): void {
    if (this.role() === 'member') {
      this.accounts.registerMember({
        name: this.f.name,
        email: this.f.email,
        phone: this.f.phone,
        password: this.f.password,
      });
      this.vip.login(this.f.email, this.f.password);
      this.router.navigateByUrl('/tabs/home');
      return;
    }
    if (this.role() === 'venue') {
      this.accounts.registerVenue({
        venueName: this.f.venueName,
        type: this.f.type,
        address: this.f.address,
        neighborhood: this.f.neighborhood,
        city: this.f.city,
        ownerName: this.f.name,
        email: this.f.email,
        phone: this.f.phone,
        password: this.f.password,
      });
      this.step.set('done');
      return;
    }
    // staff
    const m = this.accounts.registerStaff({
      name: this.f.name,
      email: this.f.email,
      phone: this.f.phone,
      password: this.f.password,
      venueId: this.f.venueId,
      role: this.f.staffRole,
    });
    this.lastMembershipId.set(m.id);
    this.step.set('done');
  }

  doneTitle(): string {
    return this.role() === 'venue' ? 'Submitted for review' : 'Request sent';
  }

  doneBody(): string {
    if (this.role() === 'venue') {
      return 'My VIP Clubs is reviewing your venue. You’ll get a text as soon as it’s approved.';
    }
    const v = this.vip.venueById(this.f.venueId);
    return `We’ve asked ${v?.name ?? 'the venue'} to confirm you on their team. You’ll get a text when they respond.`;
  }

  goStaffStatus(): void {
    this.router.navigateByUrl('/staff-status/' + this.lastMembershipId());
  }

  goHome(): void {
    this.router.navigateByUrl('/login');
  }
}
