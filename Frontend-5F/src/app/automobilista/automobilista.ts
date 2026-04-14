import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; 
import { NuovoSinistroComponent } from '../nuovo-sinistro/nuovo-sinistro.component';
import { sinistro } from '../models/sinistro.model';
import { VeicoliService } from '../services/veicoli'; 
import { SinistriService } from '../services/sinistri'; // <--- NOME CORRETTO
import { Veicolo } from '../models/veicolo.model';
import { AuthService } from '../services/auth';
import { User } from '../models/user.model';
import { ChangeDetectorRef } from '@angular/core';


@Component({
  selector: 'app-automobilista',
  standalone: true,
  imports: [CommonModule, NuovoSinistroComponent],
  templateUrl: './automobilista.html',
  styleUrl: './automobilista.css',
})
export class Automobilista implements OnInit {
  showNewSinistro = false;
  sinistri: sinistro[] = [];
  user?: User;

constructor(
  public auth: AuthService,
  public veicoliService: VeicoliService,
  private sinistriService: SinistriService,
  private router: Router,
  private cdr: ChangeDetectorRef  // <-- aggiungi
) {}
  ngOnInit(): void {
    this.user = this.auth.currentUser;
    this.caricaDati();
  }

  caricaDati(): void {
  this.sinistriService.obsSinistri.subscribe({
    next: (data: any) => {
      this.sinistri = Array.isArray(data) ? data : data.data || [];
      this.cdr.detectChanges(); // <-- aggiungi
    }
  });
  this.sinistriService.askSinistri();

  const userId = this.auth.currentUser?.id;
  if (userId) {
    this.veicoliService.getVeicoliUtente(userId).subscribe({
      next: (data) => {
        this.veicoliService.veicoli = data;
        this.cdr.detectChanges(); // <-- aggiungi
      }
    });
  }
}

  onCreated(): void {
    this.caricaDati();
    this.closeNewSinistro();
  }

  openNewSinistro(): void { this.showNewSinistro = true; }
  closeNewSinistro(): void {
  this.showNewSinistro = false; 
}
  vaiAVeicoli(): void { this.router.navigate(['/veicoli']); }
}