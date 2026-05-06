import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pratica } from '../models/pratica.model';
import { Polizza } from '../models/polizza.model';
import { DettaglioPraticaComponent } from '../dettagli-pratica/dettagli-pratica';
import { DettaglioPolizzaComponent } from '../dettagli-polizza/dettagli-polizza';
import { CreaPolizzaComponent } from '../crea-polizza/crea-polizza';
import { timer, Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { PolizzeService } from '../services/polizze.service';
import { Sinistri } from '../services/sinistri.service';

@Component({
  selector: 'app-assicurazione',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DettaglioPraticaComponent,
    DettaglioPolizzaComponent,
    CreaPolizzaComponent,
  ],
  templateUrl: './assicurazione.html',
  styleUrl: './assicurazione.css',
})
export class Assicurazione implements OnInit, OnDestroy {

  activeTab: 'pratiche' | 'polizze' = 'pratiche';

  // Pratiche
  pratiche: Pratica[] = [];
  loadingPratiche = false;
  praticaSelezionata: Pratica | null = null;

  // Polizze
  polizze: Polizza[] = [];
  loadingPolizze = false;
  showNuovaPolizza = false;
  polizzaSelezionata: Polizza | null = null;

  // Shared
  searchTerm = '';
  periti: any[] = [];

  // Assegna Perito
  praticaPerAssegna: Pratica | null = null;
  peritoSelezionatoId = '';
  assegnando = false;

  private refreshSubscription?: Subscription;

  constructor(
    private sinistri: Sinistri,
    private polizzeService: PolizzeService,
    private cdr: ChangeDetectorRef,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.startAutoRefresh();
    this.caricaPeriti();
    this.caricaPratiche();
    this.caricaPolizze();
  }

  get countPraticheDaAssegnare(): number {
    return this.pratiche.filter(p => !p.perito_id).length;
  }

  get countPolizzeAttive(): number {
    return this.polizze.filter(pol => this.isPolizzaAttiva(pol)).length;
  }

  setTab(tab: 'pratiche' | 'polizze'): void {
    this.activeTab = tab;
    this.searchTerm = '';
  }

  startAutoRefresh(): void {
    this.refreshSubscription = timer(0, 15000).subscribe(() => {
      this.caricaPratiche();
    });
  }

  caricaPratiche(): void {
    this.loadingPratiche = true;
    this.sinistri.getPratiche().subscribe({
      next: (res: any) => {
        this.pratiche = res.pratiche || [];
        this.loadingPratiche = false;
        this.cdr.detectChanges();
      },
      error: () => this.loadingPratiche = false
    });
  }

  caricaPeriti(): void {
    this.sinistri.askTuttiPeriti().subscribe({
      next: (data: any) => {
        this.periti = Array.isArray(data) ? data : data?.periti ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  caricaPolizze(): void {
    this.loadingPolizze = true;
    this.polizzeService.getPolizze().subscribe({
      next: (data: Polizza[]) => {
        this.polizze = data;
        this.loadingPolizze = false;
        this.cdr.detectChanges();
      },
      error: () => this.loadingPolizze = false
    });
  }

  isPolizzaAttiva(pol: Polizza): boolean {
    return this.polizzeService.isAttiva(pol);
  }

  // ==================== MODALS ====================

  apriNuovaPolizza(): void {
    this.showNuovaPolizza = true;
  }

  chiudiNuovaPolizza(): void {
    this.showNuovaPolizza = false;
  }

  onPolizzaCreata(res: any): void {     // Accetta $event
    this.caricaPolizze();
    this.chiudiNuovaPolizza();
  }

  apriDettaglioPolizza(pol: Polizza, event: Event): void {
    event.stopPropagation();
    this.polizzaSelezionata = pol;
  }

  chiudiDettaglioPolizza(): void {
    this.polizzaSelezionata = null;
  }

  // ==================== PRATICHE ====================

  apriDettaglioPratica(p: Pratica): void {
    this.praticaSelezionata = p;
  }

  chiudiDettaglioPratica(): void {
    this.praticaSelezionata = null;
  }

  // ==================== ASSEGNAZIONE PERITO ====================

  apriAssegnaPerito(p: Pratica, event: Event): void {
    event.stopPropagation();
    this.praticaPerAssegna = p;
    this.peritoSelezionatoId = '';
    this.assegnando = false;
  }

  chiudiAssegnaPerito(): void {
    this.praticaPerAssegna = null;
    this.peritoSelezionatoId = '';
  }

  confermAssegnaPerito(): void {
    if (!this.praticaPerAssegna?._id || !this.peritoSelezionatoId) return;

    this.assegnando = true;
    this.sinistri.assegnaPerito(this.praticaPerAssegna._id, this.peritoSelezionatoId).subscribe({
      next: () => {
        this.assegnando = false;
        this.caricaPratiche();
        this.chiudiAssegnaPerito();
      },
      error: (err) => {
        console.error(err);
        this.assegnando = false;
      }
    });
  }

  // ==================== FILTRI ====================

  get praticheFiltrate(): Pratica[] {
    if (!this.searchTerm.trim()) return this.pratiche;
    const s = this.searchTerm.toLowerCase();
    return this.pratiche.filter((p: Pratica) =>
      (p.titolo?.toLowerCase() || '').includes(s) ||
      (p.descrizione?.toLowerCase() || '').includes(s)
    );
  }

  get polizzeFiltrate(): Polizza[] {
    if (!this.searchTerm.trim()) return this.polizze;
    const s = this.searchTerm.toLowerCase();
    return this.polizze.filter((p: Polizza) =>
      (p.n_polizza?.toLowerCase() || '').includes(s) ||
      (p.compagnia_assicurativa?.toLowerCase() || '').includes(s)
    );
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }
}