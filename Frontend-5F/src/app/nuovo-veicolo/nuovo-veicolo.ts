import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VeicoliService } from '../services/veicoli';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-nuovo-veicolo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nuovo-veicolo.html',
  styleUrl: './nuovo-veicolo.css',
})
export class NuovoVeicoloComponent {
  @Output() created = new EventEmitter<any>();
  @Output() closed  = new EventEmitter<void>();

  formData = {
    targa: '',
    marca: '',
    modello: ''
  };

  loading        = false;
  errorMessage   = '';
  successMessage = '';

  constructor(
    private veicoliService: VeicoliService,
    private auth: AuthService
  ) {}

  submit(): void {
    if (!this.formData.targa || !this.formData.marca || !this.formData.modello) {
      this.errorMessage = 'Compila tutti i campi obbligatori.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const payload = {
      ...this.formData,
      automobilista_id: this.auth.currentUser?.id
    };

    this.veicoliService.createVeicolo(payload).subscribe({
      next: (res: any) => {
        this.loading        = false;
        this.successMessage = 'Veicolo aggiunto con successo!';
        this.created.emit(res);
        setTimeout(() => this.close(), 1500);
      },
      error: (err: any) => {
        this.loading      = false;
        this.errorMessage = 'Errore durante il salvataggio. Riprova.';
        console.error(err);
      }
    });
  }

  close(): void { this.closed.emit(); }
}