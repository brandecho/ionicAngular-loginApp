import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiAccount, ApiAuthResponse, ApiMemberRow, ApiVenueRow } from './api.models';

const TOKEN_KEY = 'mvc_token';
const ACCOUNT_KEY = 'mvc_account';

/**
 * Talks to the live My VIP Clubs backend (api.myvipclubs.com). Stores the
 * signed-in session (JWT + account) in localStorage so a refresh keeps you
 * logged in. All reads/writes are guarded so the app still runs if storage
 * is unavailable (private windows, etc.).
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl.replace(/\/+$/, '');

  private _token = signal<string | null>(readString(TOKEN_KEY));
  private _account = signal<ApiAccount | null>(readJson<ApiAccount>(ACCOUNT_KEY));

  readonly account = this._account.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());

  token(): string | null {
    return this._token();
  }

  // ---------------- auth ----------------
  async register(input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<ApiAccount> {
    const res = await firstValueFrom(
      this.http.post<ApiAuthResponse>(`${this.base}/auth/register`, input),
    );
    this.setSession(res);
    return res.account;
  }

  async login(input: { email: string; password: string }): Promise<ApiAccount> {
    const res = await firstValueFrom(
      this.http.post<ApiAuthResponse>(`${this.base}/auth/login`, input),
    );
    this.setSession(res);
    return res.account;
  }

  logout(): void {
    this._token.set(null);
    this._account.set(null);
    remove(TOKEN_KEY);
    remove(ACCOUNT_KEY);
  }

  // ---------------- member ----------------
  me(): Promise<ApiMemberRow> {
    return firstValueFrom(
      this.http.get<ApiMemberRow>(`${this.base}/members/me`, { headers: this.authHeaders() }),
    );
  }

  updateMe(patch: Record<string, unknown>): Promise<ApiMemberRow> {
    return firstValueFrom(
      this.http.patch<ApiMemberRow>(`${this.base}/members/me`, patch, {
        headers: this.authHeaders(),
      }),
    );
  }

  /** Upload/replace the member's profile photo (multipart). Returns the row. */
  uploadPhoto(file: File): Promise<ApiMemberRow> {
    const form = new FormData();
    form.append('photo', file, file.name);
    // Note: don't set Content-Type — the browser adds the multipart boundary.
    return firstValueFrom(
      this.http.post<ApiMemberRow>(`${this.base}/members/me/photo`, form, {
        headers: this.authHeaders(),
      }),
    );
  }

  // ---------------- venues ----------------
  venues(): Promise<ApiVenueRow[]> {
    return firstValueFrom(this.http.get<ApiVenueRow[]>(`${this.base}/venues`));
  }

  venue(id: string): Promise<ApiVenueRow> {
    return firstValueFrom(this.http.get<ApiVenueRow>(`${this.base}/venues/${id}`));
  }

  requestVenue(id: string, note?: string): Promise<unknown> {
    return firstValueFrom(
      this.http.post(
        `${this.base}/venues/${id}/request`,
        { note: note ?? null },
        { headers: this.authHeaders() },
      ),
    );
  }

  // ---------------- helpers ----------------
  private setSession(res: ApiAuthResponse): void {
    this._token.set(res.token);
    this._account.set(res.account);
    write(TOKEN_KEY, res.token);
    write(ACCOUNT_KEY, JSON.stringify(res.account));
  }

  private authHeaders(): HttpHeaders {
    const t = this._token();
    return new HttpHeaders(t ? { Authorization: `Bearer ${t}` } : {});
  }
}

// --- localStorage helpers (never throw) -------------------------------------
function readString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}
function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
