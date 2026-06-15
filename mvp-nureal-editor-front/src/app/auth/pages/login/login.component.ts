import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

type Mode = 'login' | 'signup';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  mode:     Mode    = 'login';
  email:    string  = '';
  password: string  = '';
  name:     string  = '';
  error:    string  = '';
  loading:  boolean = false;
  success:  string  = '';

  constructor(public auth: AuthService, private router: Router) {
    if (auth.isLoggedIn) router.navigate(['/dashboard']);
  }

  async loginGoogle(): Promise<void> {
    this.loading = true;
    await this.auth.loginWithGoogle();
  }

  async submit(): Promise<void> {
    this.error   = '';
    this.success = '';
    this.loading = true;

    if (this.mode === 'login') {
      const err = await this.auth.loginWithEmail(this.email, this.password);
      if (err) { this.error = err; this.loading = false; }
    } else {
      const err = await this.auth.signUpWithEmail(this.email, this.password, this.name);
      if (err) { this.error = err; this.loading = false; }
      else {
        this.success = 'Conta criada! Verifique seu e-mail para confirmar o cadastro.';
        this.loading = false;
        this.mode    = 'login';
      }
    }
  }

  toggle(): void {
    this.mode    = this.mode === 'login' ? 'signup' : 'login';
    this.error   = '';
    this.success = '';
  }

}
