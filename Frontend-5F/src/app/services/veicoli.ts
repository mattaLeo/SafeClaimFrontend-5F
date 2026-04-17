import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Veicolo } from '../models/veicolo.model';

@Injectable({
  providedIn: 'root',
})
export class VeicoliService {
  // ATTENZIONE: Assicurati che l'URL punti alla porta 5000 (MySQL/Python)
  private link = 'https://laughing-meme-jjjxx497pp642v4q-5000.app.github.dev/'; 

  public veicoli: Veicolo[] = [];

  constructor(private http: HttpClient) {}

  /**
   * Recupera i veicoli di un utente specifico (Metodo usato dal Capo)
   */
  getVeicoliUtente(userId: number): Observable<Veicolo[]> {
    // Nota: Ho rimosso lo slash extra prima di veicoli-utente se il link finisce già con /
    return this.http.get<Veicolo[]>(`${this.link}veicoli-utente/${userId}`).pipe(
      tap((data) => {
        this.veicoli = data;
        console.log("Veicoli caricati per l'utente:", this.veicoli);
      })
    );
  }

  /**
   * Recupera il singolo veicolo (Metodo usato nella tua dashboard)
   */
  getVeicoloById(id: number): Observable<Veicolo> {
    return this.http.get<Veicolo>(`${this.link}veicoli/${id}`).pipe(
      tap((data) => console.log(`Dettaglio veicolo ${id}:`, data))
    );
  }

  /**
   * Recupera tutti i veicoli (Opzionale)
   */
  askVeicoli(): Observable<Veicolo[]> {
    return this.http.get<Veicolo[]>(`${this.link}veicoli`).pipe(
      tap((data) => this.veicoli = data)
    );
  }
}