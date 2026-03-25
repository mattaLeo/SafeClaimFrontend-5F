import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sinistri } from '../services/sinistri';
import { VeicoliService } from '../services/veicoli';
import { AuthService } from '../services/auth';
import { sinistro } from '../models/sinistro.model';

@Component({
  selector: 'app-nuovo-sinistro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nuovo-sinistro.component.html',
  styleUrl: './nuovo-sinistro.component.css',
})
export class NuovoSinistroComponent implements OnInit {
  @Output() created = new EventEmitter<sinistro>();
  @Output() closed = new EventEmitter<void>();

  formData = {
    automobilista_id: 0,
    targa: '',
    data_evento: '',
    descrizione: '',
  };

  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private sinistriService: Sinistri,
    public veicoliService: VeicoliService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const userId = this.auth.currentUser?.id;

    if (!userId) {
      this.errorMessage = "Utente non autenticato.";
      return;
    }

    // Impostiamo automaticamente l'id dell'utente loggato
    this.formData.automobilista_id = userId;

    // Carichiamo solo i veicoli dell'utente loggato
    this.veicoliService.getVeicoliUtente(userId).subscribe({
      error: (err) => {
        console.error("Errore nel caricamento veicoli", err);
        this.errorMessage = "Impossibile caricare la lista veicoli.";
      }
    });
  }

  selectVehicle(targa: string) {
    this.formData.targa = targa;
    this.errorMessage = '';
  }

  submit(): void {
    if (!this.formData.targa || !this.formData.data_evento || !this.formData.descrizione) {
      this.errorMessage = "Tutti i campi sono obbligatori.";
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const dataConvertita = new Date(this.formData.data_evento);

    this.sinistriService.createSinistro(
      this.formData.automobilista_id,
      this.formData.targa,
      dataConvertita,
      this.formData.descrizione
    ).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = 'Sinistro creato con successo!';
        this.created.emit(res);
        setTimeout(() => {
          this.resetForm();
          this.close();
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Errore durante il salvataggio sul server.';
        console.error(err);
      }
    });
  }

  close(): void {
    this.closed.emit();
  }

  resetForm(): void {
    this.formData = {
      automobilista_id: this.auth.currentUser?.id ?? 0,
      targa: '',
      data_evento: '',
      descrizione: ''
    };
    this.successMessage = '';
    this.errorMessage = '';
  }
}