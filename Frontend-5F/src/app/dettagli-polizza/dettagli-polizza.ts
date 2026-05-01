import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Polizza } from '../models/polizza.model';
import { PolizzeService } from '../services/polizze.service';

@Component({
  selector: 'app-dettaglio-polizza',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dettagli-polizza.html',
})
export class DettaglioPolizzaComponent {
  @Input() polizza!: Polizza;
  @Input() isAttiva = false;
  @Output() closed     = new EventEmitter<void>();
  @Output() eliminata  = new EventEmitter<void>();
  @Output() aggiornata = new EventEmitter<Polizza>();

  // ── Modal states ──────────────────────────────────────────────────────────
  showConfermaElimina = false;
  eliminando          = false;
  eliminaErrore       = '';

  showModifica      = false;
  salvandoModifica  = false;
  modificaErrore    = '';
  modificaSuccesso  = '';
  polizzaModifica: Partial<Polizza> = {};

  constructor(private polizzeService: PolizzeService) {}

  close(): void { this.closed.emit(); }

  // ── Utility per formattare la data in YYYY-MM-DD per MySQL ──────────────
  private formattaDataPerBackend(data: any): string | undefined {
    if (!data) return undefined;
    // Se è già una stringa (es. da input type="date"), prendiamo solo i primi 10 caratteri
    if (typeof data === 'string') {
      return data.split('T')[0];
    }
    // Se è un oggetto Date
    if (data instanceof Date) {
      return data.toISOString().split('T')[0];
    }
    return data;
  }

  // ── Elimina ───────────────────────────────────────────────────────────────
  apriConfermaElimina(): void {
    this.showConfermaElimina = true;
    this.eliminaErrore = '';
  }

  chiudiConfermaElimina(): void {
    this.showConfermaElimina = false;
    this.eliminaErrore = '';
  }

  confermElimina(): void {
    if (!this.polizza.id) return;
    this.eliminando = true;
    this.eliminaErrore = '';
    this.polizzeService.eliminaPolizza(this.polizza.id).subscribe({
      next: () => {
        this.eliminando = false;
        this.eliminata.emit();
        this.closed.emit();
      },
      error: (err: any) => {
        console.error('Errore eliminazione polizza:', err);
        this.eliminaErrore = 'Errore durante l\'eliminazione. Riprova.';
        this.eliminando = false;
      }
    });
  }

  // ── Modifica ──────────────────────────────────────────────────────────────
  apriModifica(): void {
    this.polizzaModifica = { ...this.polizza };
    this.modificaErrore   = '';
    this.modificaSuccesso = '';
    this.showModifica     = true;
  }

  chiudiModifica(): void {
    this.showModifica     = false;
    this.modificaErrore   = '';
    this.modificaSuccesso = '';
  }

  salvaModifica(): void {
    if (!this.polizzaModifica.n_polizza   ||
        !this.polizzaModifica.data_inizio  ||
        !this.polizzaModifica.data_scadenza) {
      this.modificaErrore = 'Compila tutti i campi obbligatori.';
      return;
    }
    if (!this.polizza.id) return;

    this.salvandoModifica = true;
    this.modificaErrore   = '';

    // Creiamo il payload pulendo le date prima dell'invio
    const payload: Partial<Polizza> = {
      n_polizza:              this.polizzaModifica.n_polizza,
      compagnia_assicurativa: this.polizzaModifica.compagnia_assicurativa,
      data_inizio:            this.formattaDataPerBackend(this.polizzaModifica.data_inizio),
      data_scadenza:          this.formattaDataPerBackend(this.polizzaModifica.data_scadenza),
      massimale:              this.polizzaModifica.massimale
                                ? Number(this.polizzaModifica.massimale)
                                : undefined,
      tipo_copertura:         this.polizzaModifica.tipo_copertura,
    };

    this.polizzeService.aggiornaPolizza(this.polizza.id, payload).subscribe({
      next: () => {
        this.modificaSuccesso = 'Polizza aggiornata con successo!';
        this.salvandoModifica = false;
        
        // Uniamo i dati per aggiornare la UI localmente
        const polizzaAggiornata: Polizza = { ...this.polizza, ...payload } as Polizza;
        this.aggiornata.emit(polizzaAggiornata);
        
        setTimeout(() => this.chiudiModifica(), 1500);
      },
      error: (err: any) => {
        console.error('Errore aggiornamento polizza:', err);
        // Ora l'errore 1292 dovrebbe sparire e vedrai il messaggio di successo
        this.modificaErrore   = 'Errore durante il salvataggio. Riprova.';
        this.salvandoModifica = false;
      }
    });
  }
}