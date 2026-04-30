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
  user = { nome: '', cognome: '', cf: '', targa: '', email: '', password: '' };
  showPassword = false;
  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.user.nome || !this.user.cognome || !this.user.cf || !this.user.targa || !this.user.email || !this.user.password) {
      this.errorMessage = 'Compila tutti i campi richiesti.';
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.authService.signup({
      ...this.user,
      ruolo: 'automobilista'
    } as any).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/signin']);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err?.error?.message ?? 'Errore durante la registrazione.';
        this.cdr.detectChanges();
      }
    });
  }
}