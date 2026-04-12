import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

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

  constructor(private router: Router) {}

  selectRole(r: 'user' | 'perito' | 'assicuratore'): void {
    this.role = r;
    this.errorMessage = '';
  }

  async onSubmit(): Promise<void> {
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

    this.loading = true;

    try {
      // simulate network
      await new Promise((res) => setTimeout(res, 1000));
      this.router.navigate(['/']);
    } catch (err: any) {
      this.errorMessage = err?.message ?? 'Errore durante la registrazione.';
    } finally {
      this.loading = false;
    }
  }
}
