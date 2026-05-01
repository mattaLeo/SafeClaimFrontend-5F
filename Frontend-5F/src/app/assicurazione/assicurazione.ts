import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Sinistri } from '../services/sinistri.service';
import { Perizie } from '../services/perizie.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { sinistro } from '../models/sinistro.model';
import { Pratica } from '../models/pratica.model';
import { DettaglioSinistroComponent } from '../dettagli-sinistro/dettagli-sinistro';
import { DettaglioPraticaComponent } from '../dettagli-pratica/dettagli-pratica';
import { DettaglioPolizzaComponent } from '../dettagli-polizza/dettagli-polizza';
import { NuovoSinistroComponent } from '../nuovo-sinistro/nuovo-sinistro.component';
import { timer, Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { VeicoliService } from '../services/veicoli.service';
import { Router } from '@angular/router';
import { PolizzeService } from '../services/polizze.service';
import { Polizza } from '../models/polizza.model';

@Component({
  selector: 'app-assicurazione',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DettaglioSinistroComponent,
    DettaglioPraticaComponent,
    DettaglioPolizzaComponent,
    NuovoSinistroComponent
  ],
  templateUrl: './assicurazione.html',
  styleUrl: './assicurazione.css',
})
export class Assicurazione implements OnInit, OnDestroy {

  // ── Tab ───────────────────────────────────────────────────────────────────
  activeTab: 'sinistri' | 'pratiche' | 'polizze' = 'sinistri';

  // ── Pratiche ──────────────────────────────────────────────────────────────
  pratiche: Pratica[] = [];
  loadingPratiche = false;
  praticaSelezionata: Pratica | null = null;

  // ── Sinistri ──────────────────────────────────────────────────────────────
  sinistroSelezionato: sinistro | null = null;
  showNewSinistro = false;

  // ── Polizze ───────────────────────────────────────────────────────────────
  polizze: Polizza[] = [];
  loadingPolizze = false;
  showNuovaPolizza = false;
  salvandoPolizza = false;
  polizzaErrore = '';
  polizzaSuccesso = '';
  nuovaPolizza: Partial<Polizza> = { tipo_copertura: 'RCA' };
  polizzaSelezionata: Polizza | null = null;

  // ── Shared ────────────────────────────────────────────────────────────────
  searchTerm = '';
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
    private router: Router,
    private polizzeService: PolizzeService
  ) {}

  ngOnInit(): void {
    this.user = this.auth.currentUser;
    this.startAutoRefresh();
    this.caricaPeriti();
    this.caricaPolizze();
    this.caricaVeicoli();
  }

  setTab(tab: 'sinistri' | 'pratiche' | 'polizze'): void {
    this.activeTab = tab;
    this.searchTerm = '';
  }

  startAutoRefresh(): void {
    this.refreshSubscription = timer(0, 15000).subscribe(() => {
      this.sinistri.askSinistri();
      this.caricaPratiche();
    });
  }

  // ── Pratiche ──────────────────────────────────────────────────────────────
  caricaPratiche(): void {
    this.loadingPratiche = true;
    this.sinistri.getPratiche().subscribe({
      next: (res: any) => {
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

  // ── Periti ────────────────────────────────────────────────────────────────
  caricaPeriti(): void {
    this.sinistri.askTuttiPeriti().subscribe({
      next: (data: any) => {
        this.periti = (Array.isArray(data) ? data : data?.periti ?? []).map((p: any) => ({
          ...p,
          id:  p.id  ?? p._id,
          _id: p._id ?? p.id,
        }));
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Errore caricamento periti:', err)
    });
  }

  apriAssegnaPerito(p: Pratica, event: Event): void {
    if (p.perito_id) return;
    event.stopPropagation();
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

  // ── Veicoli ───────────────────────────────────────────────────────────────
  caricaVeicoli(): void {
    const userId = Number(
      this.user?.id        ??
      this.user?.utente_id ??
      this.user?.userId    ??
      this.user?._id
    );
    if (!userId) return;
    this.veicoliService.getVeicoliUtente(userId).subscribe({
      next: () => this.cdr.detectChanges(),
      error: (err: any) => console.error('Errore caricamento veicoli:', err)
    });
  }

  vaiAVeicoli(): void { this.router.navigate(['/veicoli']); }

  // ── Polizze ───────────────────────────────────────────────────────────────
  caricaPolizze(): void {
    this.loadingPolizze = true;
    this.polizzeService.getPolizze().subscribe({
      next: (data: Polizza[]) => {
        this.polizze = data;
        this.loadingPolizze = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Errore polizze:', err);
        this.loadingPolizze = false;
        this.cdr.detectChanges();
      }
    });
  }

  isPolizzaAttiva(pol: Polizza): boolean {
    return this.polizzeService.isAttiva(pol);
  }

  apriNuovaPolizza(): void {
    this.nuovaPolizza = { tipo_copertura: 'RCA' };
    this.polizzaErrore = '';
    this.polizzaSuccesso = '';
    this.showNuovaPolizza = true;
  }

  chiudiNuovaPolizza(): void {
    this.showNuovaPolizza = false;
    this.polizzaErrore = '';
    this.polizzaSuccesso = '';
  }

  salvaPolizza(): void {
    if (!this.nuovaPolizza.n_polizza    ||
        !this.nuovaPolizza.data_inizio  ||
        !this.nuovaPolizza.data_scadenza ||
        !this.nuovaPolizza.veicolo_id) {
      this.polizzaErrore = 'Compila tutti i campi obbligatori.';
      return;
    }

    const assicuratoreId = Number(
      this.user?.id        ??
      this.user?.utente_id ??
      this.user?.userId    ??
      this.user?._id
    );

    if (!assicuratoreId) {
      this.polizzaErrore = 'Utente non riconosciuto. Rieffettua il login.';
      return;
    }

    this.salvandoPolizza = true;
    this.polizzaErrore = '';

    const payload: Polizza = {
      n_polizza:              this.nuovaPolizza.n_polizza!,
      compagnia_assicurativa: this.nuovaPolizza.compagnia_assicurativa,
      data_inizio:            this.nuovaPolizza.data_inizio!,
      data_scadenza:          this.nuovaPolizza.data_scadenza!,
      massimale:              this.nuovaPolizza.massimale
                                ? Number(this.nuovaPolizza.massimale)
                                : undefined,
      tipo_copertura:         this.nuovaPolizza.tipo_copertura ?? 'RCA',
      veicolo_id:             Number(this.nuovaPolizza.veicolo_id),
      assicuratore_id:        assicuratoreId
    };

    this.polizzeService.creaPolizza(payload).subscribe({
      next: () => {
        this.polizzaSuccesso = 'Polizza creata con successo!';
        this.salvandoPolizza = false;
        this.caricaPolizze();
        this.cdr.detectChanges();
        setTimeout(() => this.chiudiNuovaPolizza(), 1500);
      },
      error: (err: any) => {
        console.error('Errore creazione polizza:', err);
        this.polizzaErrore = 'Errore durante il salvataggio. Riprova.';
        this.salvandoPolizza = false;
        this.cdr.detectChanges();
      }
    });
  }

  apriDettaglioPolizza(pol: Polizza, event: Event): void {
    event.stopPropagation();
    this.polizzaSelezionata = pol;
  }

  chiudiDettaglioPolizza(): void {
    this.polizzaSelezionata = null;
  }

  onPolizzaAggiornata(polizzaAggiornata: Polizza): void {
    const idx = this.polizze.findIndex(p => p.id === polizzaAggiornata.id);
    if (idx !== -1) this.polizze[idx] = polizzaAggiornata;
    this.polizzaSelezionata = polizzaAggiornata;
    this.cdr.detectChanges();
  }

  onPolizzaEliminata(): void {
    this.caricaPolizze();
    this.polizzaSelezionata = null;
    this.cdr.detectChanges();
  }

  // ── Filtri ────────────────────────────────────────────────────────────────
  get sinistriFiltrati(): sinistro[] {
    if (!this.searchTerm.trim()) return this.sinistri.sinistri;
    const s = this.searchTerm.toLowerCase();
    return this.sinistri.sinistri.filter((x: sinistro) =>
      (x.targa       ?? '').toLowerCase().includes(s) ||
      (x.descrizione ?? '').toLowerCase().includes(s) ||
      (x.stato       ?? '').toLowerCase().includes(s)
    );
  }

  get praticheFiltrate(): Pratica[] {
    if (!this.searchTerm.trim()) return this.pratiche;
    const s = this.searchTerm.toLowerCase();
    return this.pratiche.filter((p: Pratica) =>
      (p.titolo      ?? '').toLowerCase().includes(s) ||
      (p.descrizione ?? '').toLowerCase().includes(s) ||
      (p.stato       ?? '').toLowerCase().includes(s)
    );
  }

  get polizzeFiltrate(): Polizza[] {
    if (!this.searchTerm.trim()) return this.polizze;
    const s = this.searchTerm.toLowerCase();
    return this.polizze.filter((p: Polizza) =>
      (p.n_polizza              ?? '').toLowerCase().includes(s) ||
      (p.compagnia_assicurativa ?? '').toLowerCase().includes(s) ||
      (p.tipo_copertura         ?? '').toLowerCase().includes(s)
    );
  }

  // ── Sinistro ──────────────────────────────────────────────────────────────
  openNewSinistro(): void  { this.showNewSinistro = true; }
  closeNewSinistro(): void { this.showNewSinistro = false; }
  onCreated(): void        { this.showNewSinistro = false; this.sinistri.askSinistri(); }

  openDettaglio(s: sinistro): void { this.sinistroSelezionato = s; }
  closeDettaglio(): void           { this.sinistroSelezionato = null; this.caricaPratiche(); }
  apriDettaglio(s: sinistro): void { this.openDettaglio(s); }
  chiudiDettaglio(): void          { this.closeDettaglio(); }

  // ── Pratica ───────────────────────────────────────────────────────────────
  apriDettaglioPratica(p: Pratica): void { this.praticaSelezionata = p; }
  chiudiDettaglioPratica(): void         { this.praticaSelezionata = null; }

  ngOnDestroy(): void { this.refreshSubscription?.unsubscribe(); }
}