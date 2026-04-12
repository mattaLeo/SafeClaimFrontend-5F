import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMessage = '';

  constructor(private router: Router, private authService: AuthService) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Inserisci email e password.';
      return;
    }

    this.loading = true;

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          const routeMap: Record<string, string> = {
            automobilista: '/automobilista',
            perito: '/perito',
            assicuratore: '/assicurazione',
          };

          const route = routeMap[res.user.ruolo] ?? '/';
          this.router.navigate([route]);
        } else {
          this.errorMessage = 'Credenziali non valide. Riprova.';
        }
      },
      error: (err: any) => {
        this.errorMessage = err?.error?.message ?? 'Errore di connessione. Riprova.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}