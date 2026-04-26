import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { sinistro } from '../models/sinistro.model';
import { Pratica } from '../models/pratica.model';
import { Sinistri } from '../services/sinistri';

@Component({
  selector: 'app-crea-pratica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crea-pratica.html',
})
export class CreaPraticaComponent {
  @Input() sinistro!: sinistro;
  @Output() closed = new EventEmitter<void>();
  @Output() praticaCreata = new EventEmitter<string>();

  peritoId = '';
  titolo = '';
  descrizione = '';

  loading = false;
  error = '';
  success = '';

  constructor(private sinistriService: Sinistri) {}

  get formValido(): boolean {
    return !!this.peritoId.trim() && !!this.titolo.trim() && !!this.descrizione.trim();
  }

  crea(): void {
    if (!this.formValido || !this.sinistro._id) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    const payload: Partial<Pratica> = {
      titolo: this.titolo,
      descrizione: this.descrizione,
      stato: 'Bozza',
    };

    this.sinistriService.creaPratica(this.sinistro._id, this.peritoId.trim(), payload)
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.success = `Pratica creata con successo! ID: ${res.id_perizia}`;
          this.praticaCreata.emit(res.id_perizia);
          setTimeout(() => this.close(), 1800);
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.error === 'Perito non trovato'
            ? 'Perito non trovato. Controlla l\'ID inserito.'
            : 'Errore durante la creazione della pratica. Riprova.';
        }
      });
  }

  close(): void {
    this.closed.emit();
  }
}