import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; 
import { NuovoSinistroComponent } from '../nuovo-sinistro/nuovo-sinistro.component';
import { sinistro } from '../models/sinistro.model';
import { VeicoliService } from '../services/veicoli'; 
import { Veicolo } from '../models/veicolo.model';

@Component({
  selector: 'app-automobilista', // Nome del tag HTML del componente
  standalone: true, // Indica che il componente si gestisce i propri import
  // Registriamo il componente figlio 'NuovoSinistro' per poterlo mostrare nella dashboard
  imports: [CommonModule, NuovoSinistroComponent],
  templateUrl: './automobilista.html',
  styleUrl: './automobilista.css',
})
export class Automobilista {
  // Proprietà Booleana per gestire la visibilità del form "Nuovo Sinistro" tramite *ngIf
  showNewSinistro = false;
  
  // Array locale per memorizzare i sinistri (inizialmente vuoto)
  sinistri: sinistro[] = [];
  
  // Variabile per memorizzare un singolo veicolo cercato. Può essere nullo all'inizio.
  veicoloSelezionato: Veicolo | null = null;

  // DEPENDENCY INJECTION: Angular inietta il Service dei veicoli e il Router
  constructor(
    public veicoliService: VeicoliService, // Public per usarlo direttamente nell'HTML
    private router: Router // Private perché serve solo nella logica TS
  ) {}

  /**
   * NAVIGAZIONE: Metodo per cambiare pagina.
   * Il Router prende l'indirizzo configurato nelle 'routes' e cambia il contenuto della vista.
   */
  vaiAVeicoli(): void {
    this.router.navigate(['/veicoli']);
  }

  /**
   * COMUNICAZIONE ASINCRONA: Recupera i dati di un veicolo specifico dal backend.
   * id: numero identificativo del veicolo
   */
  cercaSingoloVeicolo(id: number): void {
    // Chiamata al service che restituisce un Observable
    this.veicoliService.getVeicoloById(id).subscribe({
      // Caso successo (next): il dato 'v' arriva da Python/Flask
      next: (v) => {
        this.veicoloSelezionato = v; // Aggiorniamo la variabile locale
        console.log("Dettaglio veicolo caricato:", v);
      },
      // Caso errore: gestione dell'eccezione se il server non risponde o l'id non esiste
      error: (err) => console.error("Errore nel recupero del singolo veicolo", err)
    });
  }

  // Gestione apertura MODALE/FORM
  openNewSinistro(): void {
    this.showNewSinistro = true;
  }

  /**
   * EVENTO @OUTPUT: Metodo richiamato quando il componente figlio (NuovoSinistro) 
   * emette un evento di creazione avvenuta.
   * s: l'oggetto sinistro appena creato dal form
   */
  onCreated(s: sinistro): void {
    this.sinistri.push(s); // Aggiungiamo il nuovo sinistro alla lista in tempo reale
    this.closeNewSinistro(); // Chiudiamo il form
  }

  // Chiude il componente del form riportando la variabile a false
  closeNewSinistro(): void {
    this.showNewSinistro = false;
  }
}