// ── Tipi condivisi ──────────────────────────────────────────────────────────

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

// ── Componente ──────────────────────────────────────────────────────────────

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
export class Perito implements OnInit {

  currentView: 'dashboard' | 'archivio' | 'relazioni' = 'dashboard';
  isSidebarOpen       = false;
  isSettingsOpen      = false;
  isSettingsAnimating = false;
  isClaimDetailOpen   = false;
  isRelazioneOpen     = false;
  isContactModalOpen  = false;
  isLoading           = true;
  isRelazioniLoading  = false;
  contactSent         = false;
  settingsSaved       = false;
  relazioneError      = '';

  selectedClaim: Claim | null = null;

  claims:    Claim[] = [];
  allClaims: Claim[] = [];

  filterSearch   = '';
  filterStatus   = '';
  filterPriority = '';

  get filteredClaims(): Claim[] {
    return this.allClaims.filter(c => {
      const matchSearch = !this.filterSearch ||
        c.code.toLowerCase().includes(this.filterSearch.toLowerCase()) ||
        c.vehicle.toLowerCase().includes(this.filterSearch.toLowerCase()) ||
        c.location.toLowerCase().includes(this.filterSearch.toLowerCase());
      const matchStatus   = !this.filterStatus   || c.status   === this.filterStatus;
      const matchPriority = !this.filterPriority || c.priority === this.filterPriority;
      return matchSearch && matchStatus && matchPriority;
    });
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  get activeClaimsCount(): number {
    return this.claims.filter(c =>
      c.status === 'in_valutazione' || c.status === 'assegnato' || c.status === 'in_attesa'
    ).length;
  }

  get totalArchiveAmount(): number {
    return this.allClaims.reduce((sum, c) => sum + (c.amount ?? 0), 0);
  }

  get relazioniCount(): number {
    return this.relazioni.length;
  }

  // ── Utente ──────────────────────────────────────────────────────────────────

  user = { full_name: '', id: '', email: '', phone: '', ruolo: '' };

  settings = {
    full_name: '', email: '', phone: '',
    notifications_email: true,
    notifications_sms:   false,
  };

  // ── Relazioni ────────────────────────────────────────────────────────────────

  relazioni: Relazione[] = [];

  editingRelazione: Partial<Relazione> = {
    partiDanneggiate: [],
    status: 'Bozza',
  };

  tipiDanno = [
    'Collisione', 'Grandine', 'Furto', 'Incendio', 'Vandalismo', 'Altro'
  ];
  partiDisponibili = [
    'Paraurti anteriore', 'Paraurti posteriore', 'Cofano', 'Portiera SX',
    'Portiera DX', 'Tetto', 'Parabrezza', 'Lunotto', 'Fiancata SX', 'Fiancata DX'
  ];
  conclusioni        = ['Riparabile', 'Danno totale', 'In valutazione', 'Frode sospetta'];
  insuranceCompanies = [
    'Generali', 'Allianz', 'UnipolSai', 'AXA', 'Zurich',
    'Reale Mutua', 'Cattolica', 'Sara Assicurazioni'
  ];

  roles       = ['Perito', 'Automobilista', 'Assicurazione'];
  currentRole = 'Perito';

  contactForm: any = {
    claimCode: '', insurance: '', priority: 'normale', subject: '', message: '',
  };

  confirmDeleteClaim:     Claim | null     = null;
  confirmDeleteRelazione: Relazione | null = null;

  constructor(
    private perizie: Perizie,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.loadClaims();
    this.loadRelazioni();
  }

  // ── Caricamento utente ──────────────────────────────────────────────────────

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
    this.settings = {
      full_name:           this.user.full_name,
      email:               this.user.email,
      phone:               this.user.phone,
      notifications_email: true,
      notifications_sms:   false,
    };
    this.currentRole = this.user.ruolo || 'Perito';
  }

  // ── Caricamento sinistri ────────────────────────────────────────────────────

  private loadClaims(): void {
    this.isLoading = true;
    const u = this.auth.currentUser as any;
    const peritoId = String(u?.id ?? 'demo');

    this.perizie.askSinistriPerito(peritoId).subscribe({
      next: (data) => {
        this.claims    = data.map(s => this.perizie.mapSinistreToClaim(s));
        this.allClaims = [...this.claims];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.perizie.askTuttiSinistri().subscribe({
          next: (data: any) => {
            const lista = Array.isArray(data) ? data : (data.data ?? []);
            this.claims    = lista.map((s: any) => this.perizie.mapSinistreToClaim(s));
            this.allClaims = [...this.claims];
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  // ── Caricamento relazioni ───────────────────────────────────────────────────

  private loadRelazioni(): void {
    const u = this.auth.currentUser as any;
    const peritoId = String(u?.id ?? '');
    if (!peritoId) {
      this.isRelazioniLoading = false;
      return;
    }

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

  // ── Navigazione ─────────────────────────────────────────────────────────────

  setView(v: 'dashboard' | 'archivio' | 'relazioni'): void {
    this.currentView = v;
    if (v === 'relazioni') this.loadRelazioni();
  }

  // ── Claim detail ─────────────────────────────────────────────────────────────

  openClaimDetail(c: Claim): void {
    this.selectedClaim     = c;
    this.isClaimDetailOpen = true;
  }

  closeClaimDetail(): void {
    this.isClaimDetailOpen = false;
    this.selectedClaim     = null;
  }

  // ── Delete perizia ────────────────────────────────────────────────────────────

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

  cancelDelete(): void {
    this.confirmDeleteClaim = null;
  }

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
        next: () => {
          this.relazioni = this.relazioni.filter(r => r.id !== rel.id);
          this.confirmDeleteRelazione = null;
          this.cdr.detectChanges();
        },
        error: () => {
          this.relazioni = this.relazioni.filter(r => r.id !== rel.id);
          this.confirmDeleteRelazione = null;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.relazioni = this.relazioni.filter(r => r !== rel);
      this.confirmDeleteRelazione = null;
    }
  }

  cancelDeleteRel(): void {
    this.confirmDeleteRelazione = null;
  }

  // ── Relazione CRUD ───────────────────────────────────────────────────────────

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
    this.editingRelazione = {
      ...rel,
      partiDanneggiate: [...(rel.partiDanneggiate ?? [])],
    };
    this.relazioneError  = '';
    this.isRelazioneOpen = true;
  }

  closeRelazione(): void {
    this.isRelazioneOpen = false;
    this.relazioneError  = '';
  }

  saveRelazione(): void {
    this.relazioneError = '';

    // Trova sempre il claim dal claimCode selezionato
    const claim = this.allClaims.find(c => c.code === this.editingRelazione.claimCode);

    if (!claim) {
      this.relazioneError = 'Seleziona un sinistro valido prima di salvare.';
      return;
    }

    // Aggiorna sinistroId e vehicle dal claim trovato
    this.editingRelazione.sinistroId = claim.id;
    this.editingRelazione.vehicle    = claim.vehicle;

    const u        = this.auth.currentUser as any;
    const peritoId = String(u?.id ?? '');

    if (!peritoId) {
      this.relazioneError = 'Sessione scaduta. Rieffettua il login.';
      return;
    }

    const sinistroId = this.editingRelazione.sinistroId;

    const now = new Date().toLocaleDateString('it-IT', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

    if (this.editingRelazione.id) {
      // ── UPDATE ──
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
        error: (err) => {
          this.relazioneError = 'Errore durante il salvataggio. Riprova.';
          console.error(err);
        }
      });
    } else {
      // ── CREATE ──
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
        error: (err) => {
          this.relazioneError = 'Errore durante il salvataggio. Riprova.';
          console.error(err);
        }
      });
    }
  }

  addParte(p: string): void {
    if (!this.editingRelazione.partiDanneggiate) this.editingRelazione.partiDanneggiate = [];
    this.editingRelazione.partiDanneggiate = [...this.editingRelazione.partiDanneggiate, p];
  }

  removeParte(i: number): void {
    this.editingRelazione.partiDanneggiate =
      this.editingRelazione.partiDanneggiate?.filter((_, idx) => idx !== i);
  }

  // ── Export PDF ───────────────────────────────────────────────────────────────

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
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(label.toUpperCase(), margin + 3, y + 4.8);
      y += 11;
      doc.setTextColor(15, 23, 42);
    };

    const row = (label: string, value: string) => {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(label, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
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
    row('Stima (€)',         rel.estimatedDamage != null
                               ? `€ ${rel.estimatedDamage.toLocaleString('it-IT')}` : '—');
    row('Parti Danneggiate', rel.partiDanneggiate?.join(', ') || '—');
    y += 4;

    if (rel.description) {
      section('Descrizione Tecnica');
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      const lines = doc.splitTextToSize(rel.description, W - margin * 2);
      doc.text(lines, margin, y);
      y += 6 * lines.length + 6;
    }

    if (rel.conclusione) {
      section('Conclusione Peritale');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      if      (rel.conclusione === 'Danno totale')   doc.setTextColor(220, 38, 38);
      else if (rel.conclusione === 'Riparabile')     doc.setTextColor(5, 150, 105);
      else if (rel.conclusione === 'Frode sospetta') doc.setTextColor(217, 119, 6);
      else                                           doc.setTextColor(9, 99, 126);
      doc.text(rel.conclusione, margin, y);
      y += 10;
      doc.setTextColor(15, 23, 42);
    }

    const pageH = 297;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageH - 20, W - margin, pageH - 20);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `SafeClaim · Documento generato il ${new Date().toLocaleDateString('it-IT')}`,
      margin, pageH - 14
    );
    doc.text(rel.claimCode ?? '', W - margin, pageH - 14, { align: 'right' });
    doc.save(`Relazione_${rel.claimCode ?? 'perizia'}_${Date.now()}.pdf`);
  }

  // ── Filtri ───────────────────────────────────────────────────────────────────

  resetFilters(): void {
    this.filterSearch   = '';
    this.filterStatus   = '';
    this.filterPriority = '';
  }

  // ── Contatto ─────────────────────────────────────────────────────────────────

  openContactModal(code: string): void {
    this.contactForm = {
      claimCode: code, insurance: '', priority: 'normale', subject: '', message: ''
    };
    this.contactSent        = false;
    this.isContactModalOpen = true;
  }

  closeContactModal(): void { this.isContactModalOpen = false; }

  sendContactForm(): void {
    this.contactSent = true;
    setTimeout(() => this.closeContactModal(), 2000);
  }

  // ── Sidebar / Settings ───────────────────────────────────────────────────────

  toggleSidebar(): void { this.isSidebarOpen = !this.isSidebarOpen; }

  openSettings(): void {
    this.isSettingsAnimating = true;
    this.isSettingsOpen      = true;
    this.isSidebarOpen       = false;
  }

  closeSettings(): void {
    this.isSettingsAnimating = false;
    setTimeout(() => this.isSettingsOpen = false, 250);
  }

  saveSettings(): void {
    this.user.full_name = this.settings.full_name;
    this.settingsSaved  = true;
    setTimeout(() => this.settingsSaved = false, 3000);
  }

  switchRole(role: string): void { this.currentRole = role; }

  // ── Template helpers ─────────────────────────────────────────────────────────

  getVehicleType(vehicle: string): VehicleType {
    const v = vehicle.toLowerCase();
    if (['ducati','yamaha','kawasaki','harley','honda cb','honda cbr','ktm','aprilia',
         'triumph','bmw r','bmw gs','vespa','piaggio'].some(b => v.includes(b))) return 'motorcycle';
    if (['iveco','scania','man ','daf ','volvo fh','mercedes actros',
         'mercedes arocs'].some(b => v.includes(b))) return 'truck';
    if (['transporter','transit','sprinter','ducato','master','jumper','vito',
         'crafter','boxer','daily'].some(b => v.includes(b))) return 'van';
    if (['qashqai','tucson','sportage','tiguan','rav4','cr-v','x5','x3','xc60',
         'discovery','defender','renegade','glc','gle','mokka','captur',
         'kuga'].some(b => v.includes(b))) return 'suv';
    return 'car';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      in_valutazione: 'In Valutazione', assegnato: 'Assegnato',
      chiuso: 'Chiuso', in_attesa: 'In Attesa', approvato: 'Approvato',
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
    const map: Record<string, string> = {
      alta:  'bg-red-50 text-rose-600',
      media: 'bg-orange-50 text-orange-600',
      bassa: 'bg-green-50 text-green-600',
    };
    return map[priority] ?? '';
  }

  getRelazioneStatusClass(status: string): string {
    const map: Record<string, string> = {
      Bozza:      'bg-slate-100 text-slate-500',
      Completata: 'bg-green-100 text-green-700',
      Inviata:    'bg-blue-100 text-blue-700',
    };
    return map[status] ?? 'bg-slate-100 text-slate-500';
  }

  getRoleIcon(role: string): string {
    const map: Record<string, string> = {
      Perito:        'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      Automobilista: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10',
      Assicurazione: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    };
    return map[role] ?? '';
  }
}