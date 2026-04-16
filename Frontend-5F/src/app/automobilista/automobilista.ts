import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NuovoSinistroComponent } from '../nuovo-sinistro/nuovo-sinistro.component';
import { DettaglioSinistroComponent } from '../dettagli-sinistro/dettagli-sinistro';
import { sinistro } from '../models/sinistro.model';
import { VeicoliService } from '../services/veicoli';
import { SinistriService } from '../services/sinistri';
import { AuthService } from '../services/auth';
import { User } from '../models/user.model';

@Component({
  selector: 'app-automobilista',
  standalone: true,
  imports: [CommonModule, NuovoSinistroComponent, DettaglioSinistroComponent, FormsModule],
  templateUrl: './automobilista.html',
  styleUrl: './automobilista.css',
})
export class Automobilista implements OnInit {
  showNewSinistro = false;
  sinistri: sinistro[] = [];
  searchTerm: string = '';
  user?: User;
  sinistroSelezionato?: sinistro;

  constructor(
    public auth: AuthService,
    public veicoliService: VeicoliService,
    private sinistriService: SinistriService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.auth.currentUser;
    this.caricaDati();
  }

  caricaDati(): void {
    this.sinistriService.obsSinistri.subscribe({
      next: (data: any) => {
        this.sinistri = Array.isArray(data) ? data : data.data || [];
        this.cdr.detectChanges();
      }
    });
    this.sinistriService.askSinistri();

    const userId = this.auth.currentUser?.id;
    if (userId) {
      this.veicoliService.getVeicoliUtente(userId).subscribe({
        next: (data) => {
          this.veicoliService.veicoli = data;
          this.cdr.detectChanges();
        }
      });
    }
  }

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