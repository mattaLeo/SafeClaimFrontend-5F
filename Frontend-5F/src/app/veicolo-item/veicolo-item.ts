import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Veicolo } from '../models/veicolo.model';

@Component({
  // Il 'selector' è il nome del tag HTML personalizzato che useremo nel padre (<app-veicolo-item>) 
  selector: 'app-veicolo-item',
  // Specifichiamo che è un componente 'standalone', quindi si gestisce i propri import 
  standalone: true,
  // Moduli necessari per il funzionamento del template HTML
  imports: [CommonModule],
  // Percorso del file che definisce la struttura visiva
  templateUrl: './veicolo-item.html'
})
export class VeicoloItem {
  /**
   * Il decoratore @Input() permette al componente padre (ListaVeicoli) 
   * di passare un oggetto di tipo 'Veicolo' a questo componente figlio.
   * Il simbolo '!' indica ad Angular che la proprietà verrà inizializzata 
   * sicuramente dall'esterno (evita errori di 'undefined').
   */
  @Input() veicolo!: Veicolo; 
}