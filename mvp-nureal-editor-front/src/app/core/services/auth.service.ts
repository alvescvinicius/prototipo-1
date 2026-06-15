import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User, Session } from '@supabase/supabase-js';

import { SupabaseService } from './supabase.service';
import { Profile } from '../interfaces/project';

@Injectable({ providedIn: 'root' })
export class AuthService {

  user    = signal<User | null>(null);
  profile = signal<Profile | null>(null);
  loading = signal(true);

  constructor(
    private supa:   SupabaseService,
    private router: Router
  ) {
    this._init();
  }

  private async _init(): Promise<void> {
    const { data: { session } } = await this.supa.client.auth.getSession();
    await this._applySession(session);

    this.supa.client.auth.onAuthStateChange(async (_event, session) => {
      await this._applySession(session);
    });

    this.loading.set(false);
  }

  private async _applySession(session: Session | null): Promise<void> {
    this.user.set(session?.user ?? null);
    if (session?.user) {
      await this._loadProfile(session.user.id);
    } else {
      this.profile.set(null);
    }
  }

  private async _loadProfile(userId: string): Promise<void> {
    const { data } = await this.supa.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    this.profile.set(data as Profile ?? null);
  }

  // ── Login / Logout ────────────────────────────────────────

  async loginWithGoogle(): Promise<void> {
    await this.supa.client.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo: `${location.origin}/dashboard` }
    });
  }

  async loginWithEmail(email: string, password: string): Promise<string | null> {
    const { error } = await this.supa.client.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    await this.router.navigate(['/dashboard']);
    return null;
  }

  async signUpWithEmail(email: string, password: string, name: string): Promise<string | null> {
    const { error } = await this.supa.client.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    });
    if (error) return error.message;
    return null; // sucesso — aguardar confirmação de email
  }

  async logout(): Promise<void> {
    await this.supa.client.auth.signOut();
    await this.router.navigate(['/login']);
  }

  get isLoggedIn(): boolean { return !!this.user(); }

}
