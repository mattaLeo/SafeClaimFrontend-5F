import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Claim, VehicleType } from '../../perito/perito';

@Component({
  selector: 'app-claim-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './claim-card.component.html',
  styleUrl: './claim-card.component.css',
})
export class ClaimCardComponent {

  /** La perizia da visualizzare (obbligatorio) */
  @Input({ required: true }) claim!: Claim;

  /** Emette la perizia quando l'utente clicca sulla card */
  @Output() cardClick = new EventEmitter<Claim>();

  onCardClick(): void {
    this.cardClick.emit(this.claim);
  }

  // ─── Vehicle type ──────────────────────────────────────────────────────────

  get vehicleType(): VehicleType {
    const v = this.claim.vehicle.toLowerCase();

    const motorcycleBrands = [
      'ducati','yamaha','kawasaki','harley','honda cb','honda cbr','honda sh',
      'ktm','aprilia','triumph','bmw r','bmw gs','bmw f','moto guzzi',
      'royal enfield','benelli','mv agusta','piaggio','vespa','kymco',
      'sym moto','cfmoto','husqvarna','beta moto'
    ];
    if (motorcycleBrands.some(b => v.includes(b))) return 'motorcycle';

    const truckBrands = [
      'iveco','scania','man ','daf ','volvo fh','volvo fm','mercedes actros',
      'mercedes arocs','renault t ','kenworth','peterbilt','mercedes atego',
      'man tgx','man tgs','man tgl'
    ];
    if (truckBrands.some(b => v.includes(b))) return 'truck';

    const vanKeywords = [
      'transporter','transit','sprinter','ducato','master','jumper','vito',
      'crafter','boxer','daily','trafic','expert','berlingo cargo','kangoo',
      'caddy cargo'
    ];
    if (vanKeywords.some(b => v.includes(b))) return 'van';

    const suvKeywords = [
      'qashqai','tucson','sportage','tiguan','rav4','cr-v','x5','x3','x1',
      'xc60','xc40','discovery','freelander','defender','renegade','compass',
      'gla','glb','glc','gle','mokka','grandland','captur','kuga','ecosport',
      'arona','ateca','karoq','kodiaq','yaris cross','ix35','ix55','santa fe'
    ];
    if (suvKeywords.some(b => v.includes(b))) return 'suv';

    return 'car';
  }

  // ─── Status helpers ────────────────────────────────────────────────────────

  get statusLabel(): string {
    const map: Record<string, string> = {
      'in_valutazione': 'In Valutazione',
      'assegnato':      'Assegnato',
      'chiuso':         'Chiuso',
      'in_attesa':      'In Attesa',
      'approvato':      'Approvato',
    };
    return map[this.claim.status] ?? this.claim.status;
  }

  get statusClass(): string {
    const map: Record<string, string> = {
      'in_valutazione': 'bg-orange-50 text-orange-700 border-orange-200',
      'assegnato':      'bg-blue-50 text-blue-700 border-blue-200',
      'chiuso':         'bg-slate-50 text-slate-500 border-slate-200',
      'in_attesa':      'bg-yellow-50 text-yellow-700 border-yellow-100',
      'approvato':      'bg-green-50 text-green-700 border-green-200',
    };
    return map[this.claim.status] ?? 'bg-slate-50 text-slate-500 border-slate-200';
  }

  get priorityClass(): string {
    const map: Record<string, string> = {
      'alta':  'bg-red-50 text-rose-600',
      'media': 'bg-orange-50 text-orange-600',
      'bassa': 'bg-green-50 text-green-600',
    };
    return map[this.claim.priority] ?? '';
  }
}