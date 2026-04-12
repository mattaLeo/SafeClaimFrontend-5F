import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Router } from '@angular/router';
import { VeicoliService } from '../services/veicoli'; 
import { VeicoloItem } from '../veicolo-item/veicolo-item'; 

@Component({
  // Il selettore permette di richiamare questo componente nell'app (es. nel file delle rotte)
  selector: 'app-lista-veicoli',
  // standalone: true indica che il componente è autonomo e dichiara i propri import senza bisogno di un AppModule
  standalone: true,
  // Registriamo i moduli e i componenti figli necessari per far funzionare l'HTML
  imports: [CommonModule, VeicoloItem], 
  templateUrl: './lista-veicoli.html',
  styleUrl: './lista-veicoli.css'
})
export class ListaVeicoli implements OnInit {

  // Il costruttore serve per la Dependency Injection: Angular "inietta" automaticamente le istanze dei servizi
  constructor(
    // public permette all'HTML di accedere direttamente alle variabili del service (come l'array veicoli)
    public veicoliService: VeicoliService, 
    // private router viene usato solo all'interno della logica TypeScript per cambiare pagina
    private router: Router
  ) {}

  /**
   * ngOnInit è un Lifecycle Hook (aggancio al ciclo di vita).
   * Viene eseguito automaticamente da Angular una sola volta dopo che il componente è stato inizializzato.
   */
  ngOnInit(): void {
    // Chiamiamo il metodo del Service per recuperare i dati.
    // Usiamo .subscribe() perché askVeicoli restituisce un Observable (dato asincrono).
    // Senza subscribe, la chiamata HTTP non partirebbe nemmeno.
    this.veicoliService.askVeicoli().subscribe();
  }

  /**
   * Metodo richiamato al click del tasto "Indietro" nell'HTML.
   * Usa il servizio Router per navigare verso la rotta dell'area automobilista.
   */
  tornaAllaDashboard(): void {
    this.router.navigate(['/automobilista']);
  }
}