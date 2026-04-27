import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Sinistri } from '../services/sinistri';
import { CommonModule } from '@angular/common';
import { sinistro } from '../models/sinistro.model';
import { Pratica } from '../models/pratica.model';
import { DettaglioSinistroComponent } from '../dettagli-sinistro/dettagli-sinistro';
import { DettaglioPraticaComponent } from '../dettagli-pratica/dettagli-pratica';

@Component({
  selector: 'app-assicurazione',
  standalone: true,
  imports: [CommonModule, DettaglioSinistroComponent, DettaglioPraticaComponent],
  templateUrl: './assicurazione.html',
  styleUrl: './assicurazione.css',
})
export class Assicurazione implements OnInit {
  mostraSinistri = false;
  pratiche: Pratica[] = [];
  sinistroSelezionato: sinistro | null = null;
  loadingPratiche = false;
  praticaSelezionata: Pratica | null = null;

  constructor(public sinistri: Sinistri, private cdr: ChangeDetectorRef) {} // ← aggiunto cdr

  ngOnInit(): void {
    this.sinistri.askSinistri();
    this.caricaPratiche();
  }

  caricaPratiche(): void {
    this.loadingPratiche = true;
    this.sinistri.getPratiche().subscribe({
      next: (res) => {
        this.pratiche = res.pratiche;
        this.loadingPratiche = false;
        this.cdr.detectChanges(); // ← forza aggiornamento vista
      },
      error: (err) => {
        console.error('Errore pratiche:', err);
        this.loadingPratiche = false;
        this.cdr.detectChanges(); // ← forza aggiornamento vista
      }
    });
  }

  apriDettaglio(s: sinistro): void {
    this.sinistroSelezionato = s;
  }

  chiudiDettaglio(): void {
    this.sinistroSelezionato = null;
    this.caricaPratiche();
  }

  apriDettaglioPratica(p: Pratica): void {
    this.praticaSelezionata = p;
  }

  chiudiDettaglioPratica(): void {
    this.praticaSelezionata = null;
  }
}