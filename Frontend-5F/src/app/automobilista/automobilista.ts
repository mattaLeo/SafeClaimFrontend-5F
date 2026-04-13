import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; 
import { NuovoSinistroComponent } from '../nuovo-sinistro/nuovo-sinistro.component';
import { sinistro } from '../models/sinistro.model';
import { VeicoliService } from '../services/veicoli'; 
import { SinistriService } from '../services/sinistri';
import { AuthService } from '../services/auth';
import { User } from '../models/user.model';

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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.auth.currentUser;
    console.log("User:", this.user);

    this.sinistriService.obsSinistri.subscribe({
      next: (data) => {
        console.log("Sinistri filtrati:", data);
        this.sinistri = data;
      }
    });

    this.caricaDati();
  }

  caricaDati(): void {
    const userId = this.auth.currentUser?.id;
    console.log("userId usato per filtro:", userId);
    this.sinistriService.askSinistri(userId);

    if (userId) {
      this.veicoliService.getVeicoliUtente(userId).subscribe();
    }
  }

  onCreated(): void {
    this.caricaDati();
    this.closeNewSinistro();
  }

  openNewSinistro(): void { this.showNewSinistro = true; }
  closeNewSinistro(): void { this.showNewSinistro = false; }
  vaiAVeicoli(): void { this.router.navigate(['/veicoli']); }
}