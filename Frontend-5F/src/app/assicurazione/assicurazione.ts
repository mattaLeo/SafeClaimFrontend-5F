import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Fondamentale per vedere i dati nell'HTML
import { SinistriService } from '../services/sinistri';

@Component({
  selector: 'app-assicurazione',
  standalone: true, // Ormai usiamo tutti componenti standalone
  imports: [CommonModule], // Aggiunto per permetterti di usare *ngFor nell'HTML
  templateUrl: './assicurazione.html',
  styleUrl: './assicurazione.css',
})
export class Assicurazione implements OnInit {

  // Iniettiamo il servizio con il nome 'sinistriService'
  constructor(public sinistriService: SinistriService) { }

  ngOnInit(): void {
    // Usiamo il nome corretto definito nel costruttore
    this.sinistriService.askSinistri();
  }
}