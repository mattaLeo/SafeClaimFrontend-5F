import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { Veicolo } from '../models/veicolo.model';

@Injectable({
  providedIn: 'root',
})
export class VeicoliService {
  private link = 'https://silver-space-guide-7vvggrww9qv7cvq7-5000.app.github.dev/'; 

  public veicoli: Veicolo[] = [];
  private veicoliSubject = new BehaviorSubject<Veicolo[]>([]);
  veicoli$: Observable<Veicolo[]> = this.veicoliSubject.asObservable();

  private currentUserId?: number;

  constructor(private http: HttpClient) {}

  getVeicoliUtente(userId: number): Observable<Veicolo[]> {
    this.currentUserId = userId;
    return this.http.get<Veicolo[]>(`${this.link}veicoli-utente/${userId}`).pipe(
      tap((data) => {
        this.veicoli = data;
        this.veicoliSubject.next(data);
        console.log("Veicoli caricati per l'utente:", this.veicoli);
      })
    );
  }

  askVeicoliUtente(userId: number): void {
    this.getVeicoliUtente(userId).subscribe();
  }

  getVeicoloById(id: number): Observable<Veicolo> {
    return this.http.get<Veicolo>(`${this.link}veicoli/${id}`).pipe(
      tap((data) => console.log(`Dettaglio veicolo ${id}:`, data))
    );
  }

  // Ora usa getVeicoliUtente invece di GET /veicoli (che non esiste)
  askVeicoliAll(): void {
    if (this.currentUserId) {
      this.getVeicoliUtente(this.currentUserId).subscribe();
    }
  }

  createVeicolo(payload: any): Observable<any> {
    const userId = payload.automobilista_id;
    return this.http.post<any>(`${this.link}veicolo/user/${userId}`, payload);
  }
}