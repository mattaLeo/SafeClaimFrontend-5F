// ── Shared types ──────────────────────────────────────────────────────────────

export type VehicleType = 'car' | 'motorcycle' | 'truck' | 'van' | 'suv';

export interface Claim {
  id:               string;
  code:             string;
  status:           'in_valutazione' | 'assegnato' | 'chiuso' | 'in_attesa' | 'approvato';
  type:             string;
  location:         string;
  date:             string;
  time:             string;
  vehicle:          string;
  priority:         'alta' | 'media' | 'bassa';
  insuranceCompany: string;
  amount?:          number;
  month?:           number;
  year?:            number;
}

export interface Relazione {
  id?:              string;
  claimCode:        string;
  sinistroId?:      string;
  title:            string;
  vehicle:          string;
  tipoDanno:        string;
  estimatedDamage?: number;
  partiDanneggiate: string[];
  description:      string;
  conclusione:      string;
  status:           'Bozza' | 'Completata' | 'Inviata';
  createdAt?:       string;
}

/** Dettaglio completo del sinistro caricato al click sulla card pratica. */
export interface SinistroDettaglio {
  id:           string;
  targa?:       string;
  marca?:       string;
  modello?:     string;
  dataEvento?:  string;
  descrizione?: string;
  luogo?:       string;
  tipoSinistro?: string;
  stimaDanno?:  number;
  stato?:       string;
  compagnia?:   string;
  immagini:     Array<{ url: string; public_id: string }>;
  analisiAi?: {
    testo?:       string;
    modello?:     string;
    stato:        'completata' | 'in_elaborazione' | 'errore' | 'non_avviata';
    dataAnalisi?: string;
    errore?:      string;
  };
}

// ── Component ──────────────────────────────────────────────────────────────────

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClaimCardComponent } from '../componenti/claim-card/claim-card.component';
import { Perizie } from '../services/perizie.service';
import { AuthService } from '../services/auth';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-perito',
  standalone: true,
  imports: [CommonModule, FormsModule, ClaimCardComponent],
  templateUrl: './perito.html',
  styleUrl: './perito.css',
})
export class Perito implements OnInit, OnDestroy {

  currentView: 'dashboard' | 'archivio' | 'relazioni' = 'dashboard';
  isClaimDetailOpen   = false;
  isRelazioneOpen     = false;
  isContactModalOpen  = false;
  isLoading           = true;
  isRelazioniLoading  = false;
  contactSent         = false;
  relazioneError      = '';

  selectedClaim:    Claim | null           = null;
  selectedSinistro: SinistroDettaglio | null = null;
  isLoadingSinistro = false;
  lightboxUrl:      string | null          = null;

  private aiPollInterval: any = null;

  claims:    Claim[] = [];
  allClaims: Claim[] = [];

  filterSearch   = '';
  filterStatus   = '';
  filterPriority = '';
  filterDateFrom = '';
  filterDateTo   = '';

  get filteredClaims(): Claim[] {
    return this.allClaims.filter(c => {
      const matchSearch = !this.filterSearch ||
        c.code.toLowerCase().includes(this.filterSearch.toLowerCase()) ||
        c.vehicle.toLowerCase().includes(this.filterSearch.toLowerCase()) ||
        c.location.toLowerCase().includes(this.filterSearch.toLowerCase());
      const matchStatus   = !this.filterStatus   || c.status   === this.filterStatus;
      const matchPriority = !this.filterPriority || c.priority === this.filterPriority;

      const parts = c.date?.split(' ');
      const mesi: Record<string, number> = {
        'gennaio':1,'febbraio':2,'marzo':3,'aprile':4,'maggio':5,'giugno':6,
        'luglio':7,'agosto':8,'settembre':9,'ottobre':10,'novembre':11,'dicembre':12
      };
      const claimDate = parts?.length === 3
        ? new Date(+parts[2], (mesi[parts[1].toLowerCase()] ?? 1) - 1, +parts[0])
        : null;

      const matchFrom = !this.filterDateFrom || !claimDate || claimDate >= new Date(this.filterDateFrom);
      const matchTo   = !this.filterDateTo   || !claimDate || claimDate <= new Date(this.filterDateTo);

      return matchSearch && matchStatus && matchPriority && matchFrom && matchTo;
    });
  }

  // ── Stats ─────────────────────────────────────────────────────────────────────

  get activeClaimsCount(): number {
    return this.claims.filter(c =>
      c.status === 'in_valutazione' || c.status === 'assegnato' || c.status === 'in_attesa'
    ).length;
  }

  get totalArchiveAmount(): number {
    return this.allClaims.reduce((sum, c) => sum + (c.amount ?? 0), 0);
  }

  get relazioniCount(): number { return this.relazioni.length; }

  // ── Utente ────────────────────────────────────────────────────────────────────

  user = { full_name: '', id: '', email: '', phone: '', ruolo: '' };

  // ── Relazioni ─────────────────────────────────────────────────────────────────

  relazioni: Relazione[] = [];

  editingRelazione: Partial<Relazione> = { partiDanneggiate: [], status: 'Bozza' };

  tipiDanno = ['Collisione', 'Grandine', 'Furto', 'Incendio', 'Vandalismo', 'Altro'];
  partiDisponibili = [
    'Paraurti anteriore','Paraurti posteriore','Cofano','Portiera SX',
    'Portiera DX','Tetto','Parabrezza','Lunotto','Fiancata SX','Fiancata DX'
  ];
  conclusioni        = ['Riparabile', 'Danno totale', 'In valutazione', 'Frode sospetta'];
  insuranceCompanies = [
    'Generali','Allianz','UnipolSai','AXA','Zurich',
    'Reale Mutua','Cattolica','Sara Assicurazioni'
  ];

  contactForm: any = { claimCode:'', insurance:'', priority:'normale', subject:'', message:'' };
  confirmDeleteClaim:     Claim | null     = null;
  confirmDeleteRelazione: Relazione | null = null;

  constructor(
    private perizie: Perizie,
    private auth:    AuthService,
    private cdr:     ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.loadClaims();
    this.loadRelazioni();
  }

  ngOnDestroy(): void {
    this.stopAIPoll();
  }

  // ── Caricamento utente ────────────────────────────────────────────────────────

  private loadUser(): void {
    const u = this.auth.currentUser as any;
    if (!u) return;
    this.user = {
      full_name: `${u.nome ?? ''} ${u.cognome ?? ''}`.trim(),
      id:        String(u.id ?? ''),
      email:     u.email ?? '',
      phone:     u.telefono ?? u.phone ?? '',
      ruolo:     u.ruolo ?? '',
    };
  }

  // ── Caricamento pratiche ──────────────────────────────────────────────────────

  /**
   * Carica le pratiche assegnate all'assicurazione al perito corrente.
   * Ogni pratica contiene già un campo "sinistro" con il riepilogo del sinistro,
   * senza le immagini (che vengono caricate on-demand all'apertura del dettaglio).
   * In caso di fallimento (endpoint non ancora disponibile) fa fallback ai sinistri.
   */
  private loadClaims(): void {
    this.isLoading = true;
    const u = this.auth.currentUser as any;
    const peritoId = String(u?.id ?? 'demo');

    this.perizie.getPratichePerito(peritoId).subscribe({
      next: (data) => {
        this.claims    = data.map(p => this.perizie.mapPraticaToClaimCard(p));
        this.allClaims = [...this.claims];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        // Fallback: usa tutti i sinistri se il nuovo endpoint non è ancora live
        this.perizie.askTuttiSinistri().subscribe({
          next: (data: any) => {
            const lista = Array.isArray(data) ? data : (data.data ?? []);
            this.claims    = lista.map((s: any) => this.perizie.mapSinistreToClaim(s));
            this.allClaims = [...this.claims];
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: () => { this.isLoading = false; this.cdr.detectChanges(); }
        });
      }
    });
  }

  // ── Caricamento relazioni ─────────────────────────────────────────────────────

  private loadRelazioni(): void {
    const u = this.auth.currentUser as any;
    const peritoId = String(u?.id ?? '');
    if (!peritoId) { this.isRelazioniLoading = false; return; }

    this.isRelazioniLoading = true;
    this.perizie.getRelazioniPerito(peritoId).subscribe({
      next: (data: any[]) => {
        this.relazioni = data.map(d => this.mapBackendToRelazione(d));
        this.isRelazioniLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.relazioni = [];
        this.isRelazioniLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private mapBackendToRelazione(d: any): Relazione {
    return {
      id:               String(d._id ?? d.id ?? ''),
      sinistroId:       String(d.sinistro_id ?? ''),
      claimCode:        d.claim_code ?? d.claimCode ?? '',
      title:            d.titolo ?? d.title ?? '',
      vehicle:          d.veicolo ?? d.vehicle ?? '',
      tipoDanno:        d.tipo_danno ?? d.tipoDanno ?? '',
      estimatedDamage:  d.stima_danno ?? d.estimatedDamage ?? undefined,
      partiDanneggiate: d.parti_danneggiate ?? d.partiDanneggiate ?? [],
      description:      d.descrizione ?? d.description ?? '',
      conclusione:      d.conclusione ?? '',
      status:           d.stato ?? d.status ?? 'Bozza',
      createdAt:        d.data_inserimento
                          ? new Date(d.data_inserimento).toLocaleDateString('it-IT', {
                              day: '2-digit', month: 'long', year: 'numeric'
                            })
                          : undefined,
    };
  }

  // ── Navigazione ───────────────────────────────────────────────────────────────

  setView(v: 'dashboard' | 'archivio' | 'relazioni'): void {
    this.currentView = v;
    if (v === 'relazioni') this.loadRelazioni();
  }

  // ── Claim / Pratica detail ────────────────────────────────────────────────────

  openClaimDetail(c: Claim): void {
    this.selectedClaim     = c;
    this.isClaimDetailOpen = true;
    this.selectedSinistro  = null;
    this.stopAIPoll();
    this.loadSinistroDetail(c.id);
  }

  closeClaimDetail(): void {
    this.isClaimDetailOpen = false;
    this.selectedClaim     = null;
    this.selectedSinistro  = null;
    this.stopAIPoll();
  }

  /**
   * Carica il dettaglio completo del sinistro collegato alla pratica:
   * tutti i campi, l'array immagini con URL Cloudinary, e l'analisi AI.
   */
  private loadSinistroDetail(sinistroId: string): void {
    this.isLoadingSinistro = true;
    this.perizie.getSinistro(sinistroId).subscribe({
      next: (data) => {
        const analisi = data.analisi_ai;
        this.selectedSinistro = {
          id:          String(data._id ?? sinistroId),
          targa:       data.targa,
          marca:       data.marca,
          modello:     data.modello,
          dataEvento:  data.data_evento,
          descrizione: data.descrizione,
          luogo:       data.luogo ?? data.indirizzo,
          tipoSinistro: data.tipo_sinistro,
          stimaDanno:  data.stima_danno ?? data.importo,
          stato:       data.stato,
          compagnia:   data.compagnia_assicurativa ?? data.assicurazione,
          immagini:    Array.isArray(data.immagini) ? data.immagini : [],
          analisiAi: analisi ? {
            testo:       analisi.testo,
            modello:     analisi.modello,
            stato:       analisi.stato ?? 'non_avviata',
            dataAnalisi: analisi.data_analisi,
            errore:      analisi.errore,
          } : { stato: 'non_avviata' },
        };
        this.isLoadingSinistro = false;

        // Se l'analisi AI è ancora in corso, avvia il polling
        if (this.selectedSinistro.analisiAi?.stato === 'in_elaborazione') {
          this.startAIPoll(sinistroId);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingSinistro = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Polling analisi AI ────────────────────────────────────────────────────────

  private startAIPoll(sinistroId: string): void {
    let attempts = 0;
    this.aiPollInterval = setInterval(() => {
      attempts++;
      if (attempts > 12 || !this.isClaimDetailOpen) {
        this.stopAIPoll();
        return;
      }
      this.perizie.getAnalisiAI(sinistroId).subscribe({
        next: (analisi) => {
          if (!this.selectedSinistro) return;
          this.selectedSinistro.analisiAi = {
            testo:       analisi.testo,
            modello:     analisi.modello,
            stato:       analisi.stato ?? 'non_avviata',
            dataAnalisi: analisi.data_analisi,
            errore:      analisi.errore,
          };
          if (analisi.stato !== 'in_elaborazione') this.stopAIPoll();
          this.cdr.detectChanges();
        }
      });
    }, 5000);
  }

  private stopAIPoll(): void {
    if (this.aiPollInterval) {
      clearInterval(this.aiPollInterval);
      this.aiPollInterval = null;
    }
  }

  // ── Lightbox immagini ─────────────────────────────────────────────────────────

  openImage(url: string): void  { this.lightboxUrl = url; }
  closeLightbox(): void          { this.lightboxUrl = null; }

  // ── Delete pratica ────────────────────────────────────────────────────────────

  askDeleteClaim(c: Claim, event?: Event): void {
    event?.stopPropagation();
    this.confirmDeleteClaim = c;
  }

  confirmDelete(): void {
    if (!this.confirmDeleteClaim) return;
    const id = this.confirmDeleteClaim.id;
    this.claims    = this.claims.filter(c => c.id !== id);
    this.allClaims = this.allClaims.filter(c => c.id !== id);
    if (this.selectedClaim?.id === id) this.closeClaimDetail();
    this.confirmDeleteClaim = null;
  }

  cancelDelete(): void { this.confirmDeleteClaim = null; }

  // ── Delete relazione ──────────────────────────────────────────────────────────

  askDeleteRelazione(rel: Relazione, event?: Event): void {
    event?.stopPropagation();
    this.confirmDeleteRelazione = rel;
  }

  confirmDeleteRel(): void {
    if (!this.confirmDeleteRelazione) return;
    const rel = this.confirmDeleteRelazione;
    if (rel.id) {
      this.perizie.eliminaRelazione(rel.id).subscribe({
        next:  () => { this.relazioni = this.relazioni.filter(r => r.id !== rel.id); this.confirmDeleteRelazione = null; this.cdr.detectChanges(); },
        error: () => { this.relazioni = this.relazioni.filter(r => r.id !== rel.id); this.confirmDeleteRelazione = null; this.cdr.detectChanges(); }
      });
    } else {
      this.relazioni = this.relazioni.filter(r => r !== rel);
      this.confirmDeleteRelazione = null;
    }
  }

  cancelDeleteRel(): void { this.confirmDeleteRelazione = null; }

  // ── Relazione CRUD ────────────────────────────────────────────────────────────

  openNewRelazione(): void {
    this.editingRelazione = { partiDanneggiate: [], status: 'Bozza' };
    this.relazioneError   = '';
    this.isRelazioneOpen  = true;
  }

  openRelazioneFromClaim(c: Claim): void {
    this.editingRelazione = {
      claimCode:        c.code,
      sinistroId:       c.id,
      vehicle:          c.vehicle,
      partiDanneggiate: [],
      status:           'Bozza',
    };
    this.relazioneError    = '';
    this.isClaimDetailOpen = false;
    this.isRelazioneOpen   = true;
  }

  openRelazioneDetail(rel: Relazione): void {
    this.editingRelazione = { ...rel, partiDanneggiate: [...(rel.partiDanneggiate ?? [])] };
    this.relazioneError   = '';
    this.isRelazioneOpen  = true;
  }

  closeRelazione(): void {
    this.isRelazioneOpen = false;
    this.relazioneError  = '';
  }

  saveRelazione(): void {
    this.relazioneError = '';

    const claim = this.allClaims.find(c => c.code === this.editingRelazione.claimCode);
    if (!claim) { this.relazioneError = 'Seleziona un sinistro valido prima di salvare.'; return; }

    this.editingRelazione.sinistroId = claim.id;
    this.editingRelazione.vehicle    = claim.vehicle;

    const u        = this.auth.currentUser as any;
    const peritoId = String(u?.id ?? '');
    if (!peritoId) { this.relazioneError = 'Sessione scaduta. Rieffettua il login.'; return; }

    const sinistroId = this.editingRelazione.sinistroId!;
    const now = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

    if (this.editingRelazione.id) {
      this.perizie.aggiornaRelazione(sinistroId, peritoId, this.editingRelazione).subscribe({
        next: () => {
          const idx = this.relazioni.findIndex(r => r.id === this.editingRelazione.id);
          if (idx !== -1) {
            this.relazioni = [
              ...this.relazioni.slice(0, idx),
              { ...(this.editingRelazione as Relazione) },
              ...this.relazioni.slice(idx + 1),
            ];
          }
          this.isRelazioneOpen = false;
          this.cdr.detectChanges();
        },
        error: (err) => { this.relazioneError = 'Errore durante il salvataggio. Riprova.'; console.error(err); }
      });
    } else {
      this.perizie.creaRelazione(sinistroId, peritoId, this.editingRelazione).subscribe({
        next: (res: any) => {
          const nuova: Relazione = {
            ...(this.editingRelazione as Relazione),
            id:        res.id_perizia ?? String(Date.now()),
            status:    'Bozza',
            createdAt: now,
          };
          this.relazioni       = [...this.relazioni, nuova];
          this.isRelazioneOpen = false;
          this.cdr.detectChanges();
        },
        error: (err) => { this.relazioneError = 'Errore durante il salvataggio. Riprova.'; console.error(err); }
      });
    }
  }

  addParte(p: string): void {
    if (!this.editingRelazione.partiDanneggiate) this.editingRelazione.partiDanneggiate = [];
    this.editingRelazione.partiDanneggiate = [...this.editingRelazione.partiDanneggiate, p];
  }

  removeParte(i: number): void {
    this.editingRelazione.partiDanneggiate = this.editingRelazione.partiDanneggiate?.filter((_, idx) => idx !== i);
  }

  // ── Export PDF ────────────────────────────────────────────────────────────────

  exportRelazione(rel: Relazione): void {
    const doc    = new jsPDF({ unit: 'mm', format: 'a4' });
    const W      = 210;
    const margin = 20;
    let y        = 0;

    doc.setFillColor(9, 99, 126);
    doc.rect(0, 0, W, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SAFECLAIM', margin, 16);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Relazione Peritale', margin, 23);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(rel.title ?? 'Relazione', margin, 32);
    doc.setFontSize(8);
    doc.setTextColor(200, 240, 255);
    doc.text(rel.status.toUpperCase(), W - margin, 32, { align: 'right' });

    y = 50;
    doc.setTextColor(15, 23, 42);

    const section = (label: string) => {
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(margin, y, W - margin * 2, 7, 1, 1, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
      doc.text(label.toUpperCase(), margin + 3, y + 4.8);
      y += 11; doc.setTextColor(15, 23, 42);
    };

    const row = (label: string, value: string) => {
      doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
      doc.text(label, margin, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
      const lines = doc.splitTextToSize(value, W - margin * 2 - 45);
      doc.text(lines, margin + 45, y);
      y += 6 * lines.length + 2;
    };

    section('Riferimento Sinistro');
    row('Codice Sinistro', rel.claimCode ?? '—');
    row('Veicolo',         rel.vehicle   ?? '—');
    row('Data Redazione',  rel.createdAt ?? new Date().toLocaleDateString('it-IT'));
    y += 4;

    section('Valutazione Danno');
    row('Tipo Danno',        rel.tipoDanno ?? '—');
    row('Stima (€)',         rel.estimatedDamage != null ? `€ ${rel.estimatedDamage.toLocaleString('it-IT')}` : '—');
    row('Parti Danneggiate', rel.partiDanneggiate?.join(', ') || '—');
    y += 4;

    if (rel.description) {
      section('Descrizione Tecnica');
      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
      const lines = doc.splitTextToSize(rel.description, W - margin * 2);
      doc.text(lines, margin, y);
      y += 6 * lines.length + 6;
    }

    if (rel.conclusione) {
      section('Conclusione Peritale');
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      if      (rel.conclusione === 'Danno totale')   doc.setTextColor(220, 38, 38);
      else if (rel.conclusione === 'Riparabile')     doc.setTextColor(5, 150, 105);
      else if (rel.conclusione === 'Frode sospetta') doc.setTextColor(217, 119, 6);
      else                                           doc.setTextColor(9, 99, 126);
      doc.text(rel.conclusione, margin, y);
      y += 10; doc.setTextColor(15, 23, 42);
    }

    const pageH = 297;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageH - 20, W - margin, pageH - 20);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184);
    doc.text(`SafeClaim · Documento generato il ${new Date().toLocaleDateString('it-IT')}`, margin, pageH - 14);
    doc.text(rel.claimCode ?? '', W - margin, pageH - 14, { align: 'right' });
    doc.save(`Relazione_${rel.claimCode ?? 'perizia'}_${Date.now()}.pdf`);
  }

  // ── Filtri ────────────────────────────────────────────────────────────────────

  resetFilters(): void {
    this.filterSearch = ''; this.filterStatus = ''; this.filterPriority = '';
    this.filterDateFrom = ''; this.filterDateTo = '';
  }

  // ── Contatto ──────────────────────────────────────────────────────────────────

  openContactModal(code: string): void {
    this.contactForm = { claimCode: code, insurance: '', priority: 'normale', subject: '', message: '' };
    this.contactSent        = false;
    this.isContactModalOpen = true;
  }

  closeContactModal(): void { this.isContactModalOpen = false; }

  sendContactForm(): void {
    this.contactSent = true;
    setTimeout(() => this.closeContactModal(), 2000);
  }

  // ── Template helpers ──────────────────────────────────────────────────────────

  getVehicleType(vehicle: string): VehicleType {
    const v = vehicle.toLowerCase();
    if (['ducati','yamaha','kawasaki','harley','honda cb','honda cbr','ktm','aprilia',
         'triumph','bmw r','bmw gs','vespa','piaggio'].some(b => v.includes(b))) return 'motorcycle';
    if (['iveco','scania','man ','daf ','volvo fh','mercedes actros','mercedes arocs'].some(b => v.includes(b))) return 'truck';
    if (['transporter','transit','sprinter','ducato','master','jumper','vito',
         'crafter','boxer','daily'].some(b => v.includes(b))) return 'van';
    if (['qashqai','tucson','sportage','tiguan','rav4','cr-v','x5','x3','xc60',
         'discovery','defender','renegade','glc','gle','mokka','captur','kuga'].some(b => v.includes(b))) return 'suv';
    return 'car';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      in_valutazione:'In Valutazione', assegnato:'Assegnato',
      chiuso:'Chiuso', in_attesa:'In Attesa', approvato:'Approvato',
    };
    return map[status] ?? status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      in_valutazione: 'bg-orange-50 text-orange-700 border-orange-200',
      assegnato:      'bg-blue-50 text-blue-700 border-blue-200',
      chiuso:         'bg-slate-50 text-slate-500 border-slate-200',
      in_attesa:      'bg-yellow-50 text-yellow-700 border-yellow-100',
      approvato:      'bg-green-50 text-green-700 border-green-200',
    };
    return map[status] ?? 'bg-slate-50 text-slate-500 border-slate-200';
  }

  getPriorityClass(priority: string): string {
    const map: Record<string, string> = { alta:'bg-red-50 text-rose-600', media:'bg-orange-50 text-orange-600', bassa:'bg-green-50 text-green-600' };
    return map[priority] ?? '';
  }

  getRelazioneStatusClass(status: string): string {
    const map: Record<string, string> = { Bozza:'bg-slate-100 text-slate-500', Completata:'bg-green-100 text-green-700', Inviata:'bg-blue-100 text-blue-700' };
    return map[status] ?? 'bg-slate-100 text-slate-500';
  }

  formatDate(isoStr?: string): string {
    if (!isoStr) return '';
    try {
      return new Date(isoStr).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return isoStr; }
  }
}