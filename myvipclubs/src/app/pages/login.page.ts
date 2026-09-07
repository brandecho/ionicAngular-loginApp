import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonItem,
  IonList,
  ToastController,
} from '@ionic/angular/standalone';
import { VipService } from '../vip.service';
import { AccountService } from '../accounts/account.service';
import { Account } from '../accounts/account.models';

interface DemoPersona {
  accountId: string;
  emoji: string;
  label: string;
  sub: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, IonContent, IonInput, IonButton, IonIcon, IonItem, IonList],
  template: `
    <ion-content class="login" [fullscreen]="true">
      <div class="wrap">
        <div class="brand">
          <div class="crest"><ion-icon name="diamond"></ion-icon></div>
          <h1>My VIP <span>Clubs</span></h1>
          <p class="sub">The hookup. Recognized before you walk in.</p>
        </div>

        <ion-list class="form" lines="none">
          <ion-item>
            <ion-icon slot="start" name="mail-outline"></ion-icon>
            <ion-input label="Email" labelPlacement="stacked" type="email" placeholder="you@email.com" [(ngModel)]="email"></ion-input>
          </ion-item>
          <ion-item>
            <ion-icon slot="start" name="lock-closed-outline"></ion-icon>
            <ion-input label="Password" labelPlacement="stacked" type="password" placeholder="••••••••" [(ngModel)]="password"></ion-input>
          </ion-item>
        </ion-list>

        <ion-button expand="block" class="cta" (click)="signIn()">
          <ion-icon slot="start" name="log-in-outline"></ion-icon>
          Sign in
        </ion-button>

        <button class="create" (click)="createAccount()">
          New here? <b>Create an account</b>
        </button>

        <!-- Demo accounts for testing -->
        <div class="demo">
          <span class="demo-label">Demo accounts — tap to sign in</span>
          <div class="grid">
            @for (d of personas; track d.accountId) {
              <button class="persona" (click)="demoLogin(d.accountId)">
                <span class="p-emoji">{{ d.emoji }}</span>
                <span class="p-label">{{ d.label }}</span>
                <span class="p-sub">{{ d.sub }}</span>
              </button>
            }
          </div>
          <p class="demo-note">All demo passwords are <b>demo</b> (admin is <b>admin</b>).</p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .login {
        --background:
          radial-gradient(900px 500px at 50% -5%, rgba(212, 175, 55, 0.18), transparent 60%),
          linear-gradient(180deg, #0c0c13 0%, #08080d 100%);
      }
      .wrap { max-width: 460px; margin: 0 auto; min-height: 100%; display: flex; flex-direction: column; justify-content: center; padding: 28px 22px; }
      .brand { text-align: center; margin-bottom: 26px; }
      .crest { width: 68px; height: 68px; margin: 0 auto 16px; border-radius: 20px; display: grid; place-items: center; background: linear-gradient(160deg, #d4af37, #8f7220); box-shadow: 0 12px 40px rgba(212, 175, 55, 0.35); }
      .crest ion-icon { font-size: 32px; color: #14131b; }
      h1 { font-size: 28px; font-weight: 800; letter-spacing: 0.02em; margin: 0; color: #fff; }
      h1 span { color: var(--vip-gold); }
      .sub { color: var(--vip-muted); margin-top: 8px; font-size: 14px; }
      .form { background: var(--vip-surface); border: 1px solid var(--vip-border); border-radius: 18px; overflow: hidden; padding: 4px 6px; }
      ion-item { --background: transparent; }
      ion-item ion-icon[slot='start'] { color: var(--vip-gold); margin-inline-end: 12px; }
      .cta { margin-top: 18px; --border-radius: 14px; font-weight: 700; height: 52px; }
      .create { width: 100%; background: none; border: none; color: var(--vip-muted); font-size: 13.5px; margin-top: 14px; cursor: pointer; }
      .create b { color: var(--vip-gold); }

      .demo { margin-top: 26px; border-top: 1px solid var(--vip-border); padding-top: 20px; }
      .demo-label { display: block; text-align: center; color: var(--vip-muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; margin-bottom: 14px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .persona { display: flex; flex-direction: column; gap: 2px; text-align: left; cursor: pointer; background: var(--vip-surface); border: 1px solid var(--vip-border); border-radius: 14px; padding: 13px; }
      .persona:active { border-color: var(--vip-gold); }
      .p-emoji { font-size: 22px; }
      .p-label { color: #fff; font-weight: 700; font-size: 14px; margin-top: 4px; }
      .p-sub { color: var(--vip-muted); font-size: 11.5px; }
      .demo-note { text-align: center; color: var(--vip-muted); font-size: 11.5px; margin-top: 14px; }
      .demo-note b { color: var(--vip-gold-soft); }
    `,
  ],
})
export class LoginPage {
  private vip = inject(VipService);
  private accounts = inject(AccountService);
  private router = inject(Router);
  private toast = inject(ToastController);

  email = '';
  password = '';

  personas: DemoPersona[] = [
    { accountId: 'acct_member_alex', emoji: '🕶️', label: 'Member', sub: 'Alex Morgan · Platinum' },
    { accountId: 'acct_owner_v2', emoji: '🏛️', label: 'Venue owner', sub: 'Velvet Room' },
    { accountId: 'acct_mgr_v2', emoji: '🗂️', label: 'Venue manager', sub: 'Velvet Room' },
    { accountId: 'acct_admin', emoji: '🛡️', label: 'Platform admin', sub: 'My VIP Clubs' },
    { accountId: 'acct_staff_nina', emoji: '🧑‍🍳', label: 'Staff (pending)', sub: 'Nina · Velvet Room' },
    { accountId: 'acct_owner_pending', emoji: '⏳', label: 'Owner (pending)', sub: 'Lumen Rooftop' },
  ];

  async signIn(): Promise<void> {
    const acct = this.accounts.login(this.email, this.password);
    if (!acct) {
      const t = await this.toast.create({
        message: 'Email or password not recognized. Try a demo account below.',
        duration: 2400,
        position: 'top',
        color: 'danger',
      });
      await t.present();
      return;
    }
    this.enter(acct);
  }

  demoLogin(accountId: string): void {
    const acct = this.accounts.loginAs(accountId);
    if (acct) this.enter(acct);
  }

  /** Route a signed-in account to the right home by role. */
  private enter(acct: Account): void {
    switch (acct.role) {
      case 'member':
        this.vip.login(acct.email, acct.password);
        this.router.navigateByUrl('/tabs/home');
        break;
      case 'owner':
      case 'manager':
        this.router.navigateByUrl(acct.venueId ? `/venue-portal/${acct.venueId}` : '/venue-portal');
        break;
      case 'staff': {
        const m = this.accounts.membershipForAccount(acct.id);
        this.router.navigateByUrl(m ? `/staff-status/${m.id}` : '/venue-portal');
        break;
      }
      case 'admin':
        this.router.navigateByUrl('/admin');
        break;
    }
  }

  createAccount(): void {
    this.router.navigateByUrl('/register');
  }
}
