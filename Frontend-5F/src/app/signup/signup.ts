import { Component, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-registra-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.html',
})
export class Signup {
  @Output() created = new EventEmitter<any>();
  @Output() closed = new EventEmitter<void>();

  nuovoCliente = {
    nome: '',
    cognome: '',
    cf: '',
    email: '',
    telefono: '',
    password: ''
  };

  showPassword = false;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService, private cdr: ChangeDetectorRef) {}

  get formValido(): boolean {
    return !!(
      this.nuovoCliente.nome.trim() &&
      this.nuovoCliente.cognome.trim() &&
      this.nuovoCliente.cf.trim() &&
      this.nuovoCliente.email.trim() &&
      this.nuovoCliente.telefono.trim() &&
      this.nuovoCliente.password.trim() &&
      this.nuovoCliente.telefono.trim()
    );
  }

  registraCliente(): void {
    if (!this.formValido) {
      this.errorMessage = 'Compila tutti i campi richiesti.';
      return;
    }
    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;
    this.cdr.detectChanges();

    this.authService.signup({
      nome: this.nuovoCliente.nome,
      cognome: this.nuovoCliente.cognome,
      cf: this.nuovoCliente.cf,
      email: this.nuovoCliente.email,
      telefono: this.nuovoCliente.telefono,
      password_hash: this.nuovoCliente.password,
      ruolo: 'automobilista',
    }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.status === 'success') {
          this.successMessage = `Cliente ${this.nuovoCliente.nome} ${this.nuovoCliente.cognome} registrato con successo!`;
          this.created.emit(res.data ?? { ...this.nuovoCliente });
          this.nuovoCliente = { nome: '', cognome: '', cf: '', email: '', telefono: '', password: '' };
        } else {
          this.errorMessage = res.message ?? 'Errore durante la registrazione.';
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err?.error?.error ?? 'Errore durante la registrazione.';
        this.cdr.detectChanges();
      }
    });
  }

  soloNumeri(event: KeyboardEvent): void {
    const allowed = /[0-9+\s]/;
    if (!allowed.test(event.key)) {
      event.preventDefault();
    }
  }
}