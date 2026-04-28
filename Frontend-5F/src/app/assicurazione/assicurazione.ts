import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Sinistri } from '../services/sinistri';
import { Perizie } from '../services/perizie.service';
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

  // ── Assegna Perito ────────────────────────────────────────────────────────
  periti: any[] = [];
  praticaPerAssegna: Pratica | null = null;
  peritoSelezionatoId = '';
  assegnando = false;
  assegnaErrore = '';
  assegnaSuccesso = '';

  private refreshSubscription?: Subscription;

  constructor(
    public sinistri: Sinistri,
    private perizie: Perizie,
    private cdr: ChangeDetectorRef,
    private auth: AuthService,
    public veicoliService: VeicoliService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.auth.currentUser;
    this.startAutoRefresh();
    this.caricaPeriti();
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

  caricaPeriti(): void {
    this.sinistri.askTuttiPeriti().subscribe({
      next: (data: any) => { this.periti = data; this.cdr.detectChanges(); },
      error: (err: any) => console.error('Errore caricamento periti:', err)
    });
  }

  // ── Assegna Perito ────────────────────────────────────────────────────────

  apriAssegnaPerito(p: Pratica, event: Event): void {
    event.stopPropagation(); // evita di aprire il dettaglio pratica
    this.praticaPerAssegna = p;
    this.peritoSelezionatoId = p.perito_id ?? '';
    this.assegnaErrore = '';
    this.assegnaSuccesso = '';
  }

  chiudiAssegnaPerito(): void {
    this.praticaPerAssegna = null;
    this.peritoSelezionatoId = '';
    this.assegnaErrore = '';
    this.assegnaSuccesso = '';
  }

  confermAssegnaPerito(): void {
    if (!this.praticaPerAssegna?._id || !this.peritoSelezionatoId) {
      this.assegnaErrore = 'Seleziona un perito prima di confermare.';
      return;
    }
    this.assegnando = true;
    this.assegnaErrore = '';
    this.sinistri.assegnaPerito(this.praticaPerAssegna._id, this.peritoSelezionatoId).subscribe({
      next: () => {
        this.assegnaSuccesso = 'Perito assegnato con successo!';
        this.assegnando = false;
        this.caricaPratiche();
        this.cdr.detectChanges();
        setTimeout(() => this.chiudiAssegnaPerito(), 1500);
      },
      error: (err: any) => {
        console.error('Errore assegnazione perito:', err);
        this.assegnaErrore = 'Errore durante l\'assegnazione. Riprova.';
        this.assegnando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Filtri ────────────────────────────────────────────────────────────────

  get sinistriFiltrati(): sinistro[] {
    if (!this.searchTerm.trim()) return this.sinistri.sinistri;
    const search = this.searchTerm.toLowerCase();
    return this.sinistri.sinistri.filter(s =>
      (s.targa ?? '').toLowerCase().includes(search) ||
      (s.descrizione ?? '').toLowerCase().includes(search) ||
      (s.stato ?? '').toLowerCase().includes(search)
    );
  }

  get praticheFiltrate(): Pratica[] {
    if (!this.searchTerm.trim()) return this.pratiche;
    const search = this.searchTerm.toLowerCase();
    return this.pratiche.filter(p =>
      (p.titolo ?? '').toLowerCase().includes(search) ||
      (p.descrizione ?? '').toLowerCase().includes(search) ||
      (p.stato ?? '').toLowerCase().includes(search)
    );
  }

  // ── Sinistro ──────────────────────────────────────────────────────────────
  openNewSinistro(): void  { this.showNewSinistro = true; }
  closeNewSinistro(): void { this.showNewSinistro = false; }
  onCreated(): void        { this.showNewSinistro = false; this.sinistri.askSinistri(); }

  openDettaglio(s: sinistro): void  { this.sinistroSelezionato = s; }
  closeDettaglio(): void            { this.sinistroSelezionato = null; this.caricaPratiche(); }
  apriDettaglio(s: sinistro): void  { this.openDettaglio(s); }
  chiudiDettaglio(): void           { this.closeDettaglio(); }

  // ── Pratica ───────────────────────────────────────────────────────────────
  apriDettaglioPratica(p: Pratica): void { this.praticaSelezionata = p; }
  chiudiDettaglioPratica(): void         { this.praticaSelezionata = null; }

  // ── Veicoli ───────────────────────────────────────────────────────────────
  vaiAVeicoli(): void { this.router.navigate(['/veicoli']); }

  ngOnDestroy(): void { this.refreshSubscription?.unsubscribe(); }
}