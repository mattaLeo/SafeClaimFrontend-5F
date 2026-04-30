import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VeicoliService } from '../services/veicoli';
import { VeicoloItem } from '../veicolo-item/veicolo-item';
import { NuovoVeicoloComponent } from '../nuovo-veicolo/nuovo-veicolo';

@Component({
  selector: 'app-lista-veicoli',
  standalone: true,
  imports: [CommonModule, VeicoloItem, NuovoVeicoloComponent],
  templateUrl: './lista-veicoli.html',
  styleUrl: './lista-veicoli.css'
})
export class ListaVeicoli implements OnInit {
  showNuovoVeicolo = false;

  constructor(
    public veicoliService: VeicoliService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.veicoliService.askVeicoli().subscribe();
  }

  tornaAllaDashboard(): void {
    this.router.navigate(['/automobilista']);
  }

  onVeicoloCreato(): void {
    this.showNuovoVeicolo = false;
    this.veicoliService.askVeicoli().subscribe();
  }
}