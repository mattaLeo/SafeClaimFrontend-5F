import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Sinistri } from '../services/sinistri';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { sinistro } from '../models/sinistro.model';
import { Pratica } from '../models/pratica.model';
import { DettaglioSinistroComponent } from '../dettagli-sinistro/dettagli-sinistro';
import { DettaglioPraticaComponent } from '../dettagli-pratica/dettagli-pratica';
import { NuovoSinistroComponent } from '../nuovo-sinistro/nuovo-sinistro.component';
import { timer, Subscription } from 'rxjs';
import { AuthService } from '../services/auth';
import { VeicoliService } from '../services/veicoli';
import { Router } from '@angular/router';

@Component({
  selector: 'app-assicurazione',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DettaglioSinistroComponent,
    DettaglioPraticaComponent,
    NuovoSinistroComponent
  ],
  templateUrl: './assicurazione.html',
  styleUrl: './assicurazione.css',
})
export class Assicurazione implements OnInit, OnDestroy {
  mostraSinistri = false;
  pratiche: Pratica[] = [];
  sinistroSelezionato: sinistro | null = null;
  loadingPratiche = false;
  praticaSelezionata: Pratica | null = null;
  searchTerm = '';
  showNewSinistro = false;
  user: any = null;

  private refreshSubscription?: Subscription;

  constructor(
    public sinistri: Sinistri,
    private cdr: ChangeDetectorRef,
    private auth: AuthService,
    public veicoliService: VeicoliService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.auth.currentUser;
    this.startAutoRefresh();
  }

  startAutoRefresh(): void {
    this.refreshSubscription = timer(0, 15000).subscribe(() => {
      this.sinistri.askSinistri();
      this.caricaPratiche();
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
      error: (err: any) => {
        console.error('Errore pratiche:', err);
        this.loadingPratiche = false;
        this.cdr.detectChanges();
      }
    });
  }

  get sinistriFiltrati(): sinistro[] {
    if (!this.searchTerm.trim()) return this.sinistri.sinistri;
    const search = this.searchTerm.toLowerCase();
    return this.sinistri.sinistri.filter(s => {
      const targa       = (s.targa       ?? '').toLowerCase();
      const descrizione = (s.descrizione ?? '').toLowerCase();
      const stato       = (s.stato       ?? '').toLowerCase();
      return targa.includes(search) || descrizione.includes(search) || stato.includes(search);
    });
  }

  get praticheFiltrate(): Pratica[] {
    if (!this.searchTerm.trim()) return this.pratiche;
    const search = this.searchTerm.toLowerCase();
    return this.pratiche.filter(p => {
      const titolo      = (p.titolo      ?? '').toLowerCase();
      const descrizione = (p.descrizione ?? '').toLowerCase();
      const stato       = (p.stato       ?? '').toLowerCase();
      return titolo.includes(search) || descrizione.includes(search) || stato.includes(search);
    });
  }

  // ── Sinistro ──────────────────────────────────────────────────────────────
  openNewSinistro(): void  { this.showNewSinistro = true; }
  closeNewSinistro(): void { this.showNewSinistro = false; }
  onCreated(): void        { this.showNewSinistro = false; this.sinistri.askSinistri(); }

  openDettaglio(s: sinistro): void  { this.sinistroSelezionato = s; }
  closeDettaglio(): void            { this.sinistroSelezionato = null; this.caricaPratiche(); }

  // alias usati nel vecchio template
  apriDettaglio(s: sinistro): void  { this.openDettaglio(s); }
  chiudiDettaglio(): void           { this.closeDettaglio(); }

  // ── Pratica ───────────────────────────────────────────────────────────────
  apriDettaglioPratica(p: Pratica): void { this.praticaSelezionata = p; }
  chiudiDettaglioPratica(): void         { this.praticaSelezionata = null; }

  // ── Veicoli ───────────────────────────────────────────────────────────────
  vaiAVeicoli(): void { this.router.navigate(['/veicoli']); }

  ngOnDestroy(): void { this.refreshSubscription?.unsubscribe(); }
}