import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Sinistri } from '../services/sinistri';
import { CommonModule } from '@angular/common';
import { sinistro } from '../models/sinistro.model';
import { Pratica } from '../models/pratica.model';
import { DettaglioSinistroComponent } from '../dettagli-sinistro/dettagli-sinistro';
import { DettaglioPraticaComponent } from '../dettagli-pratica/dettagli-pratica';
import { timer, Subscription } from 'rxjs'; // Importati per il refresh

@Component({
  selector: 'app-assicurazione',
  standalone: true,
  imports: [CommonModule, DettaglioSinistroComponent, DettaglioPraticaComponent],
  templateUrl: './assicurazione.html',
  styleUrl: './assicurazione.css',
})
export class Assicurazione implements OnInit, OnDestroy {
  mostraSinistri = false;
  pratiche: Pratica[] = [];
  sinistroSelezionato: sinistro | null = null;
  loadingPratiche = false;
  praticaSelezionata: Pratica | null = null;
  
  // Subscription per gestire la pulizia del timer
  private refreshSubscription?: Subscription;

  constructor(public sinistri: Sinistri, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Avvia il ciclo di aggiornamento ogni 30 secondi
    this.startAutoRefresh();
  }

  startAutoRefresh(): void {
    // timer(ritardo_iniziale, intervallo_periodico)
    // 0 = parte subito, 15000 = 15 secondi
    this.refreshSubscription = timer(0, 15000).subscribe(() => {
      console.log('Refresh dati in corso...');
      this.sinistri.askSinistri(); // Chiamata per i sinistri
      this.caricaPratiche();      // Chiamata per le pratiche
    });
  }

  caricaPratiche(): void {
    this.loadingPratiche = true;
    this.sinistri.getPratiche().subscribe({
      next: (res) => {
        this.pratiche = res.pratiche;
        this.loadingPratiche = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Errore pratiche:', err);
        this.loadingPratiche = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Fondamentale: cancella il timer quando l'utente cambia pagina
  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  // ... restanti metodi (apriDettaglio, chiudiDettaglio, ecc.) restano uguali
  apriDettaglio(s: sinistro): void { this.sinistroSelezionato = s; }
  chiudiDettaglio(): void { this.sinistroSelezionato = null; this.caricaPratiche(); }
  apriDettaglioPratica(p: Pratica): void { this.praticaSelezionata = p; }
  chiudiDettaglioPratica(): void { this.praticaSelezionata = null; }
}