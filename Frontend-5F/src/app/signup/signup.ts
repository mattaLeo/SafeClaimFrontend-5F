import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  user = { nome: '', cognome: '', cf: '', email: '', password: '' };
  showPassword = false;
  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  get formValido(): boolean {
    return !!(
      this.user.nome.trim() &&
      this.user.cognome.trim() &&
      this.user.cf.trim() &&
      this.user.email.trim() &&
      this.user.password.trim()
    );
  }

  onSubmit(): void {
    if (!this.formValido) {
      this.errorMessage = 'Compila tutti i campi richiesti.';
      return;
    }

    this.errorMessage = '';
    this.loading = true;
    this.cdr.detectChanges();

    this.authService.signup({
      nome: this.user.nome,
      cognome: this.user.cognome,
      cf: this.user.cf,
      email: this.user.email,
      psw: this.user.password,
      ruolo: 'automobilista',
    }).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.router.navigate(['/automobilista']);
        } else {
          this.loading = false;
          this.errorMessage = res.message ?? 'Errore durante la registrazione.';
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err?.error?.error ?? 'Errore durante la registrazione.';
        this.cdr.detectChanges();
      }
    });
  }
}