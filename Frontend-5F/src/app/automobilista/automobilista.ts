import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { timer, Subscription } from 'rxjs';

// Import componenti e modelli
import { NuovoSinistroComponent } from '../nuovo-sinistro/nuovo-sinistro.component';
import { DettaglioSinistroComponent } from '../dettagli-sinistro/dettagli-sinistro';
import { sinistro } from '../models/sinistro.model';
import { User } from '../models/user.model';

// Import servizi
import { VeicoliService } from '../services/veicoli';
import { Sinistri } from '../services/sinistri';
import { AuthService } from '../services/auth';

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
  searchTerm: string = '';
  user?: User;
  sinistroSelezionato?: sinistro;

  // Sottoscrizioni per evitare memory leak
  private refreshSub?: Subscription;
  private dataSub?: Subscription;

  constructor(
    public auth: AuthService,
    public veicoliService: VeicoliService,
    private SinistriService: Sinistri, // Assicurati che il nome della classe sia corretto
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.auth.currentUser;

    // 1. Ti iscrivi allo stream dei dati UNA VOLTA SOLA.
    // Questo risolve il problema del "vederli tutti" perché ascolti lo stato del servizio.
    this.dataSub = this.SinistriService.sinistri$.subscribe({
      next: (data: sinistro[]) => {
        this.sinistri = data;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error("Errore stream:", err)
    });

    // 2. Avvii il timer per dire al servizio di caricare i dati ogni 30 secondi
    this.startAutoRefresh();
  }

  startAutoRefresh(): void {
    this.refreshSub = timer(0, 15000).subscribe(() => {
      this.caricaDati();
    });
  }

  caricaDati(): void {
    const userId = this.auth.currentUser?.id;
    if (!userId) return;

    // Richiama il caricamento dei veicoli
    this.veicoliService.getVeicoliUtente(userId).subscribe({
      next: (data) => {
        this.veicoliService.veicoli = data;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error(err)
    });

    // Comando al servizio di aggiornare i sinistri (senza .subscribe perché è void)
    this.SinistriService.askSinistri(userId);
  }

  ngOnDestroy(): void {
    // Pulizia totale
    this.refreshSub?.unsubscribe();
    this.dataSub?.unsubscribe();
  }

  // --- Altri Metodi ---

  get sinistriFiltrati(): sinistro[] {
    if (!this.searchTerm.trim()) return this.sinistri;
    const search = this.searchTerm.toLowerCase();
    return this.sinistri.filter(s => {
      const targa = (s.targa ?? '').toLowerCase();
      const descrizione = (s.descrizione ?? '').toLowerCase();
      const stato = (s.stato ?? '').toLowerCase();
      return targa.includes(search) || descrizione.includes(search) || stato.includes(search);
    });
  }

  openDettaglio(s: sinistro): void { this.sinistroSelezionato = s; }
  closeDettaglio(): void { this.sinistroSelezionato = undefined; }

  onCreated(): void {
    this.caricaDati();
    this.closeNewSinistro();
  }

  openNewSinistro(): void { this.showNewSinistro = true; }
  closeNewSinistro(): void { this.showNewSinistro = false; }
  vaiAVeicoli(): void { this.router.navigate(['/veicoli']); }
}