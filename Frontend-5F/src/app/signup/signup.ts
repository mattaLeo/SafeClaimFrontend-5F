import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';
import { User } from '../models/user.model';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  // role state
  role: 'user' | 'perito' | 'assicuratore' = 'user';

  // models
  user = { nome: '', cognome: '', cf: '', targa: '', email: '', password: '' };
  perito = { cf: '', email: '', password: '' };
  assicuratore = { email: '', password: '' };

  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  selectRole(r: 'user' | 'perito' | 'assicuratore'): void {
    this.role = r;
    this.errorMessage = '';
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (this.role === 'user') {
      if (!this.user.nome || !this.user.cognome || !this.user.cf || !this.user.targa || !this.user.email || !this.user.password) {
        this.errorMessage = 'Compila tutti i campi richiesti.';
        return;
      }
    } else if (this.role === 'perito') {
      if (!this.perito.cf || !this.perito.email || !this.perito.password) {
        this.errorMessage = 'Compila tutti i campi richiesti.';
        return;
      }
    } else {
      if (!this.assicuratore.email || !this.assicuratore.password) {
        this.errorMessage = 'Compila tutti i campi richiesti.';
        return;
      }
    }

    if (this.role !== 'user') {
      this.errorMessage = 'Al momento la registrazione è supportata solo per l\'automobilista.';
      return;
    }

    this.loading = true;

    const nuovoUtente: User = {
      nome: this.user.nome.trim(),
      cognome: this.user.cognome.trim(),
      cf: this.user.cf.trim().toUpperCase(),
      email: this.user.email.trim().toLowerCase(),
      psw: this.user.password,
      ruolo: 'automobilista',
    };

    this.authService.signup(nuovoUtente).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.status === 'success') {
          this.router.navigate(['/automobilista']);
        } else {
          this.errorMessage = res.error ?? 'Registrazione fallita. Riprovare.';
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err?.error?.error ?? err?.message ?? 'Errore durante la registrazione.';
      },
    });
  }
}
