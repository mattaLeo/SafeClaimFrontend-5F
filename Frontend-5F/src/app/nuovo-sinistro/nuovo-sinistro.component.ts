import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SinistriService } from '../services/sinistri';
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
  @Output() created = new EventEmitter<any>();
  @Output() closed = new EventEmitter<void>();

  formData = {
    targa: '',
    data_evento: '',
    descrizione: '',
  };

  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private sinistriService: SinistriService,
    public veicoliService: VeicoliService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const userId = this.auth.currentUser?.id;
    if (userId) {
      // Carichiamo i veicoli dell'utente per permettere la selezione della targa
      this.veicoliService.getVeicoliUtente(userId).subscribe();
    }
  }

  /**
   * Metodo per selezionare la targa dal template HTML
   * Risolve l'errore TS2339
   */
  selectVehicle(targa: string): void {
    this.formData.targa = targa;
    this.errorMessage = ''; // Resetta l'errore quando l'utente sceglie un veicolo
  }

  submit(): void {
    if (!this.formData.targa || !this.formData.data_evento || !this.formData.descrizione) {
      this.errorMessage = "Compila tutti i campi obbligatori.";
      return;
    }

    this.loading = true;
    
    // Creiamo l'oggetto rispettando il modello automobilista_id
    const payload: sinistro = {
      automobilista_id: this.auth.currentUser?.id || 0,
      targa: this.formData.targa,
      data_evento: new Date(this.formData.data_evento),
      descrizione: this.formData.descrizione
    };

    this.sinistriService.createSinistro(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = "Sinistro inviato con successo!";
        this.created.emit(res);
        // Chiudiamo il popup dopo un secondo e mezzo
        setTimeout(() => this.close(), 1500);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = "Errore durante il salvataggio. Riprova.";
        console.error("Errore salvataggio sinistro:", err);
      }
    });
  }

  close(): void { 
    this.closed.emit(); 
  }
}