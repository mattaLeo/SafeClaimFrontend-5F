import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { VeicoliService } from '../services/veicoli.service';
import { Veicolo } from '../models/veicolo.model';

interface RichiestaSoccorso {
  id: number;
  id_automobilista: number;
  data_richiesta: string;
  stato: string;
}

@Component({
  selector: 'app-richiesta-soccorso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './richiesta-soccorso.html',
  styleUrl: './richiesta-soccorso.css',
})
export class RichiestaSoccorsoComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();

  private link = 'https://glowing-zebra-4j66vrgvjjxf595-7000.app.github.dev/';

  // ── Veicoli ───────────────────────────────────────────────────────────────
  veicoli: Veicolo[] = [];
  targaSelezionata = '';

  // ── Posizione ─────────────────────────────────────────────────────────────
  lat: number | null = null;
  lon: number | null = null;
  indirizzoRilevato = '';
  geoLoading = false;
  geoErrore  = '';

  // ── Form ──────────────────────────────────────────────────────────────────
  loading  = false;
  errore   = '';
  successo = '';

  // ── Storico ───────────────────────────────────────────────────────────────
  richieste: RichiestaSoccorso[] = [];
  loadingRichieste = false;

  constructor(
    private http:          HttpClient,
    private auth:          AuthService,
    private veicoliService: VeicoliService,
    private cdr:           ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const userId = this.auth.currentUser?.id;
    if (userId) {
      this.veicoliService.getVeicoliUtente(userId).subscribe({
        next: (data) => { this.veicoli = data; this.cdr.detectChanges(); }
      });
      this.caricaRichieste(userId);
    }
    this.rilievaPosizioneAuto();
  }

  // ── Geolocalizzazione ─────────────────────────────────────────────────────

  rilievaPosizioneAuto(): void {
    if (!navigator.geolocation) {
      this.geoErrore = 'Geolocalizzazione non supportata dal browser.';
      return;
    }
    this.geoLoading = true;
    this.geoErrore  = '';
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        this.lat = pos.coords.latitude;
        this.lon = pos.coords.longitude;
        this.geoLoading = false;
        await this.geocodeInverso(this.lat, this.lon);
        this.cdr.detectChanges();
      },
      (err) => {
        this.geoLoading = false;
        this.geoErrore  = 'Impossibile rilevare la posizione. Verifica i permessi del browser.';
        this.cdr.detectChanges();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  private async geocodeInverso(lat: number, lon: number): Promise<void> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'it' } });
      if (res.ok) {
        const data = await res.json();
        this.indirizzoRilevato = data.display_name ?? '';
      }
    } catch {}
  }

  // ── Storico richieste ─────────────────────────────────────────────────────

  caricaRichieste(userId: number): void {
    this.loadingRichieste = true;
    this.http.get<RichiestaSoccorso[]>(`${this.link}soccorso/utente/${userId}`).subscribe({
      next: (data) => {
        this.richieste = data;
        this.loadingRichieste = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loadingRichieste = false; this.cdr.detectChanges(); }
    });
  }

  // ── Invio richiesta ───────────────────────────────────────────────────────

  invia(): void {
    this.errore = '';
    if (!this.targaSelezionata) {
      this.errore = 'Seleziona un veicolo.';
      return;
    }
    this.loading = true;

    const payload: any = { targa: this.targaSelezionata };
    if (this.lat !== null) payload.lat = this.lat;
    if (this.lon !== null) payload.lon = this.lon;

    this.http.post<any>(`${this.link}soccorso`, payload).subscribe({
      next: () => {
        this.loading  = false;
        this.successo = 'Richiesta inviata! Il soccorso è in arrivo.';
        const userId = this.auth.currentUser?.id;
        if (userId) this.caricaRichieste(userId);
        this.cdr.detectChanges();
        setTimeout(() => this.close(), 2500);
      },
      error: (err) => {
        this.loading = false;
        this.errore  = err.error?.error ?? 'Errore durante l\'invio. Riprova.';
        this.cdr.detectChanges();
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getStatoClass(stato: string): string {
    const map: Record<string, string> = {
      'in_attesa':   'bg-amber-50 text-amber-700 border-amber-200',
      'in_arrivo':   'bg-blue-50 text-blue-700 border-blue-200',
      'completato':  'bg-green-50 text-green-700 border-green-200',
      'annullato':   'bg-red-50 text-red-700 border-red-200',
    };
    return map[stato?.toLowerCase()] ?? 'bg-slate-100 text-slate-500 border-slate-200';
  }

  close(): void { this.closed.emit(); }
}