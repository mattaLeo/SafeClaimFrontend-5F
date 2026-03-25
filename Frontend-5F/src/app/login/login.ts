import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

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

  constructor(private router: Router) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  async onSubmit(): Promise<void> {
    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Inserisci email e password.';
      return;
    }

    this.loading = true;

    try {
      // TODO: sostituisci con la tua chiamata al servizio di autenticazione
      // es: await this.authService.login(this.email, this.password);

      // Simulazione attesa (rimuovi quando integri il backend)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Naviga alla home dopo il login
      this.router.navigate(['/']);
    } catch (error: any) {
      this.errorMessage = error?.message ?? 'Credenziali non valide. Riprova.';
    } finally {
      this.loading = false;
    }
  }
}