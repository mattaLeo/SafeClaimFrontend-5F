import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Veicolo } from '../models/veicolo.model';

@Injectable({
  // 'root' significa che il Service è disponibile in tutta l'app come un "Singleton" (unica istanza)
  providedIn: 'root',
})
export class VeicoliService {
  private link = 'https://opulent-halibut-wrrww9x5qw5q35g54-5000.app.github.dev/'; 

  // Variabile pubblica che memorizza i veicoli scaricati, rendendoli accessibili a tutti i componenti
  public veicoli: Veicolo[] = [];

  // Il costruttore inietta HttpClient tramite Dependency Injection 
  constructor(private http: HttpClient) {}

  /**
   * Metodo per recuperare la lista completa dei veicoli dal database
   * Restituisce un Observable: il componente dovrà fare il .subscribe() per leggere i dati
   */
  askVeicoli(): Observable<Veicolo[]> {
    // Effettua una chiamata GET verso l'endpoint /veicoli del server Flask
    return this.http.get<Veicolo[]>(`${this.link}/veicoli`).pipe(
      // Usiamo pipe e tap per intercettare la risposta JSON che arriva da Python
      tap((data) => {
        // Salviamo i dati ricevuti nell'array locale per aggiornare l'interfaccia in tempo reale 
        this.veicoli = data;
        // Log di debug per verificare il corretto arrivo dei dati nella console del browser 
        console.log("Lista veicoli aggiornata:", this.veicoli);
      })
    );
  }

  /**
   * Metodo per recuperare i dettagli di un singolo veicolo usando il suo ID univoco
   * Viene usato per mostrare info specifiche o per la modifica [cite: 91, 96]
   */
  getVeicoloById(id: number): Observable<Veicolo> {
    // La rotta include l'ID come parametro dinamico, proprio come definito in Python [cite: 91, 96]
    return this.http.get<Veicolo>(`${this.link}/veicoli/${id}`).pipe(
      // Stampiamo i dati per assicurarci che il "ponte" con Flask stia funzionando [cite: 87, 90]
      tap((data) => console.log(`Dettaglio veicolo ${id}:`, data))
    );
  }
}