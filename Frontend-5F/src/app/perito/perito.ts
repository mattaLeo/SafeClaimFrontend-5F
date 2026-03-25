import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClaimCardComponent } from '../componenti/claim-card/claim-card.component';
import { Perizie } from '../services/perizie.service';

export type ViewType = 'dashboard' | 'archivio' | 'relazioni';
export type VehicleType = 'car' | 'truck' | 'motorcycle' | 'van' | 'suv';

export interface Claim {
  id: string;
  code: string;
  status: 'in_valutazione' | 'assegnato' | 'chiuso' | 'in_attesa' | 'approvato';
  type: string;
  location: string;
  date: string;
  time: string;
  vehicle: string;
  priority: 'alta' | 'media' | 'bassa';
  insuranceCompany: string;
  amount?: number;
  month: number;
  year: number;
}

export interface Relazione {
  id: string;
  claimCode: string;
  title: string;
  date: string;
  vehicle: string;
  status: 'Bozza' | 'Completata' | 'Inviata';
  estimatedDamage?: number;
  tipoDanno: string;
  partiDanneggiate: string[];
  description: string;
  conclusione: string;
}

export interface UserSettings {
  full_name: string;
  email: string;
  phone: string;
  notifications_email: boolean;
  notifications_sms: boolean;
  language: string;
  theme: string;
}

@Component({
  selector: 'app-perito',
  standalone: true,
  imports: [CommonModule, FormsModule, ClaimCardComponent],
  templateUrl: './perito.html',
  styleUrl: './perito.css',
})
export class Perito implements OnInit {

  // ─── UI state ─────────────────────────────────────────────────────────────
  isSidebarOpen       = false;
  isSettingsOpen      = false;
  isContactModalOpen  = false;
  isSettingsAnimating = false;
  isClaimDetailOpen   = false;
  isRelazioneOpen     = false;
  isLoading           = true;
  selectedClaim: Claim | null = null;
  currentRole  = 'Perito';
  currentView: ViewType = 'dashboard';

  // ─── User ─────────────────────────────────────────────────────────────────
  user = {
    full_name: 'MARRO SIMONE',
    email: 'simone.marro@safeclaim.it',
    id: 'P-9928'
  };

  settings: UserSettings = {
    full_name: 'MARRO SIMONE',
    email: 'simone.marro@safeclaim.it',
    phone: '+39 335 7821094',
    notifications_email: true,
    notifications_sms: false,
    language: 'Italiano',
    theme: 'Chiaro'
  };

  settingsSaved = false;
  roles = ['Perito', 'Automobilista', 'Assicurazione', 'Officina', 'Supporto Stradale'];

  // ─── Contact ──────────────────────────────────────────────────────────────
  contactForm = {
    insurance: '', subject: '', priority: 'normale', message: '', claimCode: ''
  };
  contactSent = false;
  insuranceCompanies = ['Generali', 'AXA', 'UnipolSai', 'Allianz', 'Poste Assicura', 'Zurich'];

  // ─── Relazioni ────────────────────────────────────────────────────────────
  tipiDanno        = ['Urto', 'Grandine', 'Incendio', 'Furto', 'Alluvione', 'Vandalismo'];
  partiDisponibili = ['Paraurti','Cofano','Tetto','Portiera SX','Portiera DX','Parafango','Parabrezza','Lunotto','Cerchi'];
  conclusioni      = ['Riparabile','Danno Totale','Furto Confermato','Danno Preesistente','Perizia Negativa','In Valutazione'];
  relazioni: Relazione[] = [];
  editingRelazione: Partial<Relazione> & { partiDanneggiate: string[] } = {
    id: '', claimCode: '', title: '', date: '', vehicle: '', status: 'Bozza',
    tipoDanno: '', partiDanneggiate: [], description: '', conclusione: ''
  };

  // ─── Filters ──────────────────────────────────────────────────────────────
  filterStatus   = '';
  filterType     = '';
  filterMonth    = '';
  filterPriority = '';
  filterSearch   = '';

  // ─── Claims ───────────────────────────────────────────────────────────────
  claims: Claim[]    = [];
  allClaims: Claim[] = [];

  // ══════════════════════════════════════════════════════════════════════════

  constructor(public perieService: Perizie) {}

  ngOnInit(): void {
    this.loadSettings();
    this.caricaSinistri();
  }

  // ─── Caricamento sinistri ─────────────────────────────────────────────────
  // ⚠️  Quando arriva l'API sostituisci il corpo con:
  //     this.perieService.askSinistriPerito(this.user.id).subscribe(data => this.popolaClaims(data))
  caricaSinistri(): void {
    console.log('[Perito] Caricamento sinistri per perito:', this.user.id);

    // ── MOCK DATA — rimuovi questo blocco quando arriva l'API ──────────────
    const mock: Claim[] = [
      { id:'1',  code:'SN-88291-24', status:'in_valutazione', type:'Collisione Catena',   location:'Via Verdi 15, Milano',        date:'18 Febbraio 2026', time:'14:30', vehicle:'Audi A3 - AB123CD',                priority:'alta',  insuranceCompany:'Generali',  amount:3400,  month:2,  year:2026 },
      { id:'2',  code:'SN-77102-24', status:'assegnato',      type:'Danno da Grandine',   location:'Corso Buenos Aires, Milano',  date:'19 Febbraio 2026', time:'09:00', vehicle:'Fiat 500 - EF456GH',                priority:'media', insuranceCompany:'AXA',       amount:1200,  month:2,  year:2026 },
      { id:'3',  code:'SN-91034-24', status:'in_valutazione', type:'Tamponamento',         location:'Viale Monza 88, Milano',      date:'20 Febbraio 2026', time:'11:15', vehicle:'BMW Serie 3 - MN789OP',             priority:'alta',  insuranceCompany:'UnipolSai', amount:5600,  month:2,  year:2026 },
      { id:'4',  code:'SN-66543-24', status:'assegnato',      type:'Furto Parziale',       location:'Via Torino 22, Milano',       date:'21 Febbraio 2026', time:'16:00', vehicle:'Mercedes GLA - QR012ST',            priority:'bassa', insuranceCompany:'Allianz',   amount:800,   month:2,  year:2026 },
      { id:'5',  code:'SN-55210-24', status:'in_valutazione', type:'Incendio Parziale',    location:'Via Padova 5, Milano',        date:'22 Febbraio 2026', time:'08:30', vehicle:'Ducati Monster - UV345WX',          priority:'alta',  insuranceCompany:'Generali',  amount:9200,  month:2,  year:2026 },
      { id:'6',  code:'SN-44120-24', status:'in_attesa',      type:'Collisione Laterale',  location:'Via Novara 11, Milano',       date:'23 Febbraio 2026', time:'10:00', vehicle:'Iveco Daily - RR901ZZ',             priority:'media', insuranceCompany:'AXA',       amount:6700,  month:2,  year:2026 },
      { id:'7',  code:'SN-33880-24', status:'assegnato',      type:'Danno da Grandine',   location:"Piazza Duca d'Aosta, Milano", date:'24 Febbraio 2026', time:'13:30', vehicle:'Volkswagen Transporter - PP567HH', priority:'bassa', insuranceCompany:'UnipolSai', amount:2300,  month:2,  year:2026 },
      { id:'8',  code:'SN-44891-24', status:'chiuso',         type:'Collisione Laterale',  location:'Via Dante 3, Torino',         date:'10 Gennaio 2026',  time:'10:00', vehicle:'Toyota Yaris - YZ678AB',            priority:'media', insuranceCompany:'Generali',  amount:2100,  month:1,  year:2026 },
      { id:'9',  code:'SN-33781-24', status:'approvato',      type:'Danno da Grandine',   location:'Corso Vittorio, Torino',      date:'12 Gennaio 2026',  time:'14:00', vehicle:'Renault Clio - CD901EF',            priority:'bassa', insuranceCompany:'AXA',       amount:780,   month:1,  year:2026 },
      { id:'10', code:'SN-22654-24', status:'approvato',      type:'Tamponamento',         location:'Via Roma 99, Bologna',        date:'15 Gennaio 2026',  time:'09:30', vehicle:'Peugeot 308 - GH234IJ',             priority:'media', insuranceCompany:'UnipolSai', amount:3300,  month:1,  year:2026 },
      { id:'11', code:'SN-11523-24', status:'chiuso',         type:'Furto Totale',         location:'Via Indipendenza 7, Bologna', date:'18 Gennaio 2026',  time:'11:00', vehicle:'Honda Civic - KL567MN',             priority:'alta',  insuranceCompany:'Allianz',   amount:18000, month:1,  year:2026 },
      { id:'12', code:'SN-99410-23', status:'chiuso',         type:'Vandalismo',           location:'Via Manzoni 14, Firenze',     date:'05 Dicembre 2025', time:'15:30', vehicle:'Ford Focus - OP890QR',              priority:'bassa', insuranceCompany:'Generali',  amount:650,   month:12, year:2025 },
      { id:'13', code:'SN-88334-23', status:'approvato',      type:'Collisione Frontale',  location:'Viale Europa 23, Firenze',    date:'08 Dicembre 2025', time:'08:00', vehicle:'Yamaha MT-07 - ST123UV',            priority:'alta',  insuranceCompany:'AXA',       amount:7400,  month:12, year:2025 },
      { id:'14', code:'SN-66098-23', status:'chiuso',         type:'Incendio Totale',      location:'Via Nazionale 8, Napoli',     date:'20 Novembre 2025', time:'17:00', vehicle:'Kia Sportage - AB789CD',            priority:'alta',  insuranceCompany:'Allianz',   amount:22000, month:11, year:2025 },
      { id:'15', code:'SN-55873-23', status:'approvato',      type:'Danno da Alluvione',   location:'Via Toledo 40, Napoli',       date:'25 Novembre 2025', time:'10:30', vehicle:'Ford Transit - EF012GH',            priority:'alta',  insuranceCompany:'Generali',  amount:11500, month:11, year:2025 },
    ];

    this.popolaClaims(mock);
    // ── FINE MOCK DATA ──────────────────────────────────────────────────────
  }

  popolaClaims(data: Claim[]): void {
    this.allClaims = data;
    this.claims    = data.filter(c =>
      c.status === 'in_valutazione' || c.status === 'assegnato' || c.status === 'in_attesa'
    );
    this.isLoading = false;
    console.log('[Perito] Tutti i sinistri:', this.allClaims);
    console.log('[Perito] Sinistri attivi:', this.claims);
  }

  // ─── View ─────────────────────────────────────────────────────────────────

  setView(view: ViewType): void {
    this.currentView = view;
    this.isSidebarOpen = false;
  }

  goHome(): void {
    this.currentView = 'dashboard';
    this.isSidebarOpen = false;
    this.isSettingsOpen = false;
    this.isClaimDetailOpen = false;
    this.isContactModalOpen = false;
  }

  // ─── Claim detail ─────────────────────────────────────────────────────────

  openClaimDetail(claim: Claim): void {
    this.selectedClaim = claim;
    this.isClaimDetailOpen = true;
    console.log('[Perito] Claim selezionato:', claim);
    this.perieService.askPratica(claim.id, this.user.id);
  }

  closeClaimDetail(): void {
    this.isClaimDetailOpen = false;
    setTimeout(() => { this.selectedClaim = null; }, 350);
  }

  // ─── Relazioni ────────────────────────────────────────────────────────────

  openNewRelazione(): void {
    this.editingRelazione = {
      id: '', claimCode: '', title: '', date: '', vehicle: '',
      status: 'Bozza', tipoDanno: '', partiDanneggiate: [], description: '', conclusione: ''
    };
    this.isRelazioneOpen = true;
  }

  openRelazioneFromClaim(claim: Claim): void {
    this.editingRelazione = {
      id: '', claimCode: claim.code, title: `Perizia ${claim.type}`,
      date: new Date().toISOString().split('T')[0], vehicle: claim.vehicle,
      status: 'Bozza', tipoDanno: '', partiDanneggiate: [], description: '', conclusione: ''
    };
    this.closeClaimDetail();
    this.currentView = 'relazioni';
    this.isRelazioneOpen = true;
  }

  openRelazioneDetail(rel: Relazione): void {
    this.editingRelazione = { ...rel, partiDanneggiate: [...rel.partiDanneggiate] };
    this.isRelazioneOpen  = true;
  }

  closeRelazione(): void {
    this.isRelazioneOpen = false;
  }

  saveRelazione(): void {
    const rel = this.editingRelazione as Relazione;
    if (rel.id) {
      const idx = this.relazioni.findIndex(r => r.id === rel.id);
      if (idx > -1) this.relazioni[idx] = { ...rel };
    } else {
      rel.id     = `R-${Date.now()}`;
      rel.status = 'Bozza';
      this.relazioni.unshift({ ...rel });
      const claim = this.allClaims.find(c => c.code === rel.claimCode);
      if (claim) {
        console.log('[Perito] Creo perizia su API per sinistro:', claim.id);
        this.perieService.askCreaPerizia(claim.id, this.user.id, {
          data_perizia:  rel.date,
          note_tecniche: rel.description,
          documenti:     []
        });
      }
    }
    this.closeRelazione();
  }

  exportRelazione(rel: Relazione): void {
    alert(`Export PDF per ${rel.claimCode} in preparazione...`);
  }

  addParte(p: string): void {
    if (!this.editingRelazione.partiDanneggiate.includes(p))
      this.editingRelazione.partiDanneggiate.push(p);
  }

  removeParte(i: number): void {
    this.editingRelazione.partiDanneggiate.splice(i, 1);
  }

  getRelazioneStatusClass(s: string): string {
    const m: Record<string, string> = {
      'Bozza':      'bg-yellow-50 text-yellow-700',
      'Completata': 'bg-emerald-50 text-emerald-700',
      'Inviata':    'bg-blue-50 text-blue-700',
    };
    return m[s] ?? 'bg-slate-50 text-slate-500';
  }

  // ─── Contact modal ────────────────────────────────────────────────────────

  openContactModal(claimCode = ''): void {
    this.contactForm.claimCode = claimCode;
    this.contactSent = false;
    this.isContactModalOpen = true;
  }

  closeContactModal(): void {
    this.isContactModalOpen = false;
    this.contactSent = false;
  }

  sendContactForm(): void {
    this.contactSent = true;
    setTimeout(() => { this.closeContactModal(); }, 2000);
  }

  // ─── Sidebar / Settings ──────────────────────────────────────────────────

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  openSettings(): void {
    this.isSidebarOpen = false;
    this.isSettingsOpen = true;
    setTimeout(() => { this.isSettingsAnimating = true; }, 16);
  }

  closeSettings(): void {
    this.isSettingsAnimating = false;
    setTimeout(() => { this.isSettingsOpen = false; }, 350);
  }

  saveSettings(): void {
    localStorage.setItem('perito_settings', JSON.stringify(this.settings));
    this.user.full_name = this.settings.full_name;
    this.user.email     = this.settings.email;
    this.settingsSaved  = true;
    setTimeout(() => { this.settingsSaved = false; }, 2500);
  }

  loadSettings(): void {
    const saved = localStorage.getItem('perito_settings');
    if (saved) {
      this.settings       = JSON.parse(saved);
      this.user.full_name = this.settings.full_name;
    }
  }

  switchRole(role: string): void {
    this.currentRole = role;
  }

  // ─── Filters ──────────────────────────────────────────────────────────────

  get filteredClaims(): Claim[] {
    return this.allClaims.filter(c => {
      if (this.filterStatus   && c.status !== this.filterStatus) return false;
      if (this.filterPriority && c.priority !== this.filterPriority) return false;
      if (this.filterMonth    && c.month !== parseInt(this.filterMonth)) return false;
      if (this.filterSearch) {
        const s = this.filterSearch.toLowerCase();
        if (!c.code.toLowerCase().includes(s) &&
            !c.location.toLowerCase().includes(s) &&
            !c.vehicle.toLowerCase().includes(s) &&
            !c.insuranceCompany.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }

  resetFilters(): void {
    this.filterStatus = ''; this.filterType = '';
    this.filterMonth  = ''; this.filterPriority = ''; this.filterSearch = '';
  }

  get totalArchiveAmount(): number {
    return this.filteredClaims.reduce((s, c) => s + (c.amount || 0), 0);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  getStatusLabel(status: string): string {
    const m: Record<string, string> = {
      'in_valutazione': 'In Valutazione', 'assegnato': 'Assegnato',
      'chiuso': 'Chiuso', 'in_attesa': 'In Attesa', 'approvato': 'Approvato'
    };
    return m[status] || status;
  }

  getStatusClass(status: string): string {
    const m: Record<string, string> = {
      'in_valutazione': 'bg-orange-50 text-orange-700 border-orange-200',
      'assegnato':      'bg-blue-50 text-blue-700 border-blue-200',
      'chiuso':         'bg-slate-50 text-slate-500 border-slate-200',
      'in_attesa':      'bg-yellow-50 text-yellow-700 border-yellow-100',
      'approvato':      'bg-green-50 text-green-700 border-green-200'
    };
    return m[status] || 'bg-slate-50 text-slate-500 border-slate-200';
  }

  getPriorityClass(p: string): string {
    const m: Record<string, string> = {
      'alta': 'bg-red-50 text-rose-600', 'media': 'bg-orange-50 text-orange-600', 'bassa': 'bg-green-50 text-green-600'
    };
    return m[p] || '';
  }

  getVehicleType(vehicle: string): VehicleType {
    const v = vehicle.toLowerCase();
    const motorcycle = ['ducati','yamaha','kawasaki','harley','honda cb','ktm','aprilia','triumph','bmw r','bmw gs','moto guzzi','vespa','piaggio'];
    const truck      = ['iveco','scania','man ','daf ','volvo fh','mercedes actros','man tgx','man tgs'];
    const van        = ['transporter','transit','sprinter','ducato','master','vito','crafter','boxer','daily'];
    const suv        = ['suv','qashqai','tucson','sportage','tiguan','rav4','x5','x3','xc60','discovery','gla','glb','glc','mokka','captur','kuga'];
    if (motorcycle.some(b => v.includes(b))) return 'motorcycle';
    if (truck.some(b => v.includes(b)))      return 'truck';
    if (van.some(b => v.includes(b)))        return 'van';
    if (suv.some(b => v.includes(b)))        return 'suv';
    return 'car';
  }

  getRoleIcon(role: string): string {
    const icons: Record<string, string> = {
      'Perito':           'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      'Automobilista':    'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17h5',
      'Assicurazione':    'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
      'Officina':         'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      'Supporto Stradale':'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z'
    };
    return icons[role] || icons['Perito'];
  }
}