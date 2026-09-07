import { Component, Input, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  ToastController,
} from '@ionic/angular/standalone';
import { VipService } from '../vip.service';
import { TierBadgeComponent } from '../components/tier-badge.component';

type Tab = 'tonight' | 'requests' | 'members' | 'staff';

@Component({
  selector: 'app-venue-dashboard',
  standalone: true,
  imports: [
    CurrencyPipe,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    TierBadgeComponent,
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/venue-portal"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ venue()?.name }}</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [value]="tab()" (ionChange)="tab.set($any($event.detail.value))" scrollable>
          <ion-segment-button value="tonight">
            <ion-label>Tonight</ion-label>
          </ion-segment-button>
          <ion-segment-button value="requests">
            <ion-label>Requests{{ pending().length ? ' (' + pending().length + ')' : '' }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="members">
            <ion-label>Members</ion-label>
          </ion-segment-button>
          <ion-segment-button value="staff">
            <ion-label>Staff</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page">
        @switch (tab()) {
          <!-- ============ TONIGHT ============ -->
          @case ('tonight') {
            <p class="lead">VIPs inbound right now — get the room ready.</p>
            @if (arriving().length) {
              @for (a of arriving(); track a.member.id) {
                <button class="row arriving" (click)="openMember(a.member.id)">
                  <span class="avatar" [style.--tier-color]="vip.tierForMember(a.member).color">{{ a.member.photo }}</span>
                  <div class="body">
                    <span class="name">{{ a.member.firstName }} {{ a.member.lastName }}</span>
                    <div class="sub">
                      <app-tier-badge [tier]="vip.tierForMember(a.member)"></app-tier-badge>
                      <span class="eta"><ion-icon name="navigate-outline"></ion-icon> ~{{ a.etaMinutes }} min</span>
                    </div>
                  </div>
                  <ion-icon class="go" name="chevron-forward-outline"></ion-icon>
                </button>
              }
            } @else {
              <div class="empty"><ion-icon name="pulse-outline"></ion-icon><p>No VIPs inbound at the moment.</p></div>
            }
          }

          <!-- ============ REQUESTS ============ -->
          @case ('requests') {
            <p class="lead">Members asking for access to {{ venue()?.name }}.</p>
            @if (pending().length) {
              @for (r of pending(); track r.memberId) {
                @if (vip.memberById(r.memberId); as m) {
                  <div class="req">
                    <div class="req-top">
                      <span class="avatar" [style.--tier-color]="vip.tierForMember(m).color">{{ m.photo }}</span>
                      <div class="body">
                        <span class="name">{{ m.firstName }} {{ m.lastName }}</span>
                        <div class="sub">
                          <app-tier-badge [tier]="vip.tierForMember(m)"></app-tier-badge>
                          <span class="ltv">{{ vip.lifetimeValueOf(m) | currency: 'USD' : 'symbol' : '1.0-0' }} lifetime</span>
                        </div>
                      </div>
                    </div>
                    @if (r.note) { <p class="note">“{{ r.note }}”</p> }
                    <div class="actions">
                      <button class="btn decline" (click)="decline(m.id)"><ion-icon name="close-outline"></ion-icon> Decline</button>
                      <button class="btn approve" (click)="approve(m.id, m.firstName)"><ion-icon name="checkmark-outline"></ion-icon> Approve</button>
                    </div>
                  </div>
                }
              }
            } @else {
              <div class="empty"><ion-icon name="checkmark-circle-outline"></ion-icon><p>All caught up — no pending requests.</p></div>
            }
          }

          <!-- ============ MEMBERS ============ -->
          @case ('members') {
            <p class="lead">Your VIP roster — {{ roster().length }} members.</p>
            @for (m of roster(); track m.id) {
              <button class="row" (click)="openMember(m.id)">
                <span class="avatar" [style.--tier-color]="vip.tierForMember(m).color">{{ m.photo }}</span>
                <div class="body">
                  <span class="name">{{ m.firstName }} {{ m.lastName }}</span>
                  <div class="sub">
                    <app-tier-badge [tier]="vip.tierForMember(m)"></app-tier-badge>
                    <span class="ltv">{{ vip.lifetimeValueOf(m) | currency: 'USD' : 'symbol' : '1.0-0' }}</span>
                  </div>
                </div>
                <ion-icon class="go" name="eye-outline"></ion-icon>
              </button>
            }
          }

          <!-- ============ STAFF ============ -->
          @case ('staff') {
            <p class="lead">Team taking care of guests here.</p>
            @if (staff().length) {
              @for (s of staff(); track s.id) {
                <div class="row static">
                  <span class="avatar staff">{{ s.avatar }}</span>
                  <div class="body">
                    <span class="name">{{ s.name }}</span>
                    <span class="role">{{ s.role }}</span>
                  </div>
                </div>
              }
            } @else {
              <div class="empty"><ion-icon name="people-outline"></ion-icon><p>No staff added for this venue yet.</p></div>
            }
          }
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .page { padding: 12px 18px 28px; max-width: 620px; margin: 0 auto; }
      .lead { color: var(--vip-muted); font-size: 13.5px; margin: 4px 2px 16px; }

      .row, .req { background: var(--vip-surface); border: 1px solid var(--vip-border); border-radius: 16px; }
      .row {
        width: 100%; display: flex; align-items: center; gap: 14px; text-align: left;
        padding: 13px 14px; margin-bottom: 11px; cursor: pointer;
      }
      .row.static { cursor: default; }
      .row.arriving { border-color: color-mix(in srgb, var(--vip-gold) 40%, transparent); background: var(--vip-gold-tint); }
      .avatar {
        flex: 0 0 48px; height: 48px; border-radius: 50%; display: grid; place-items: center; font-size: 24px;
        background: var(--vip-surface-2); border: 2px solid var(--tier-color, var(--vip-border));
      }
      .avatar.staff { border: none; color: #14131b; font-size: 15px; font-weight: 800; background: linear-gradient(160deg, #d4af37, #9c7c22); }
      .body { flex: 1; min-width: 0; }
      .name { display: block; color: #fff; font-weight: 700; font-size: 16px; }
      .role { display: block; color: var(--vip-gold); font-size: 12.5px; margin-top: 2px; }
      .sub { display: flex; align-items: center; gap: 10px; margin-top: 6px; flex-wrap: wrap; }
      .ltv { color: var(--vip-muted); font-size: 12px; font-weight: 600; }
      .eta { display: inline-flex; align-items: center; gap: 4px; color: var(--vip-gold-soft); font-size: 12px; font-weight: 700; }
      .eta ion-icon { font-size: 13px; }
      .go { color: var(--vip-muted); font-size: 20px; }

      .req { padding: 14px; margin-bottom: 12px; }
      .req-top { display: flex; align-items: center; gap: 14px; }
      .note { color: var(--vip-text); font-style: italic; font-size: 13px; opacity: 0.85; margin: 12px 0 0; }
      .actions { display: flex; gap: 10px; margin-top: 14px; }
      .btn {
        flex: 1; border: none; cursor: pointer; border-radius: 12px; padding: 11px; font-weight: 700; font-size: 13.5px;
        display: flex; align-items: center; justify-content: center; gap: 6px;
      }
      .btn ion-icon { font-size: 17px; }
      .approve { background: linear-gradient(120deg, #d4af37, #a9861f); color: #14131b; }
      .decline { background: var(--vip-surface-2); color: var(--vip-muted); border: 1px solid var(--vip-border); }

      .empty { text-align: center; padding: 48px 20px; color: var(--vip-muted); }
      .empty ion-icon { font-size: 40px; opacity: 0.5; }
      .empty p { margin-top: 10px; font-size: 14px; }
    `,
  ],
})
export class VenueDashboardPage {
  vip = inject(VipService);
  private router = inject(Router);
  private toast = inject(ToastController);

  private venueId = signal<string>('');
  tab = signal<Tab>('tonight');

  @Input() set id(value: string) {
    this.venueId.set(value);
  }

  venue = computed(() => this.vip.venueById(this.venueId()));
  arriving = computed(() => this.vip.arrivingMembersForVenue(this.venueId()));
  pending = computed(() => this.vip.pendingRequestsForVenue(this.venueId()));
  roster = computed(() => this.vip.membersForVenue(this.venueId()));
  staff = computed(() => this.vip.staffForVenue(this.venueId()));

  openMember(memberId: string): void {
    this.router.navigate(['/manager', memberId], { queryParams: { venue: this.venueId() } });
  }

  async approve(memberId: string, firstName: string): Promise<void> {
    this.vip.approveRequest(memberId, this.venueId());
    const t = await this.toast.create({
      message: `${firstName} is now on the ${this.venue()?.name} VIP list.`,
      duration: 2200,
      position: 'top',
      color: 'primary',
    });
    await t.present();
  }

  async decline(memberId: string): Promise<void> {
    this.vip.declineRequest(memberId, this.venueId());
    const t = await this.toast.create({
      message: 'Request declined.',
      duration: 1600,
      position: 'top',
    });
    await t.present();
  }
}
