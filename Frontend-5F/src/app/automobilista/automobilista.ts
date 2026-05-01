import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { timer, Subscription } from 'rxjs';

import { NuovoSinistroComponent } from '../nuovo-sinistro/nuovo-sinistro.component';
import { DettaglioSinistroComponent } from '../dettagli-sinistro/dettagli-sinistro';
import { sinistro } from '../models/sinistro.model';
import { User } from '../models/user.model';
import { Veicolo } from '../models/veicolo.model';

import { VeicoliService } from '../services/veicoli.service';
import { Sinistri } from '../services/sinistri.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-automobilista',
  standalone: true,
  imports: [CommonModule, NuovoSinistroComponent, DettaglioSinistroComponent, FormsModule],
  templateUrl: './automobilista.html',
  styleUrl: './automobilista.css',
})
export class Automobilista implements OnInit, OnDestroy {
  showNewSinistro = false;
  sinistri: sinistro[] = [];
  veicoli: Veicolo[] = [];
  searchTerm: string = '';
  user?: User;
  sinistroSelezionato?: sinistro;

  private refreshSub?: Subscription;
  private dataSub = new Subscription(); // Inizializzato per add()

  constructor(
    public auth: AuthService,
    public veicoliService: VeicoliService,
    private sinistriService: Sinistri,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.auth.currentUser;

    // 1. Ascolto stream Sinistri
    this.dataSub.add(
      this.sinistriService.sinistri$.subscribe((data: sinistro[]) => {
        this.sinistri = data;
        this.cdr.detectChanges();
      })
    );

    // 2. Ascolto stream Veicoli (Risolve il problema del caricamento dati)
    this.dataSub.add(
      this.veicoliService.veicoli$.subscribe((data: Veicolo[]) => {
        this.veicoli = data;
        this.cdr.detectChanges();
      })
    );

    this.startAutoRefresh();
  }

  startAutoRefresh(): void {
    // Aggiorna ogni 15 secondi
    this.refreshSub = timer(0, 15000).subscribe(() => {
      this.caricaDati();
    });
  }

  caricaDati(): void {
    const userId = this.auth.currentUser?.id;
    if (userId) {
      // Carica solo dati filtrati per l'utente loggato
      this.veicoliService.askVeicoliUtente(userId);
      this.sinistriService.askSinistri(userId);
    }
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
    this.dataSub.unsubscribe();
  }

  // --- Logica Filtri ---
  get sinistriFiltrati(): sinistro[] {
    if (!this.searchTerm.trim()) return this.sinistri;
    const search = this.searchTerm.toLowerCase();
    return this.sinistri.filter(s => 
      (s.targa?.toLowerCase().includes(search)) || 
      (s.descrizione?.toLowerCase().includes(search)) || 
      (s.stato?.toLowerCase().includes(search))
    );
  }

  // --- Gestione UI ---
  openDettaglio(s: sinistro): void { this.sinistroSelezionato = s; }
  closeDettaglio(): void { this.sinistroSelezionato = undefined; }
  onCreated(): void { this.caricaDati(); this.closeNewSinistro(); }
  openNewSinistro(): void { this.showNewSinistro = true; }
  closeNewSinistro(): void { this.showNewSinistro = false; }
  vaiAVeicoli(): void { this.router.navigate(['/veicoli']); }
}