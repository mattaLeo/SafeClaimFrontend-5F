import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Il link che usa il tuo compagno
  link = "https://sturdy-space-train-wrrww9x6prwjf9vw9-6000.app.github.dev/";

  obsLogin!: Observable<any>;
  obsSignup!: Observable<any>;
  
  currentUser?: User;

  constructor(private http: HttpClient) { }

  // LOGIN: L'API vuole 'email' e 'psw'
  login(email_in: string, psw_in: string) {
    let datiLogin = {
      email: email_in,
      psw: psw_in
    };

    this.obsLogin = this.http.post<any>(`${this.link}login`, datiLogin);
    
    this.obsLogin.subscribe(res => {
      console.log("Risposta API Login:", res);
      if(res.status === "success") {
        this.currentUser = res.user; // Salviamo i dati dell'utente loggato
      }
    });
  }

  // REGISTRAZIONE: L'API si aspetta l'endpoint /registrazione
  signup(nuovoUtente: User) {
    // Inviamo l'oggetto User che contiene nome, cognome, cf, email, psw
    this.obsSignup = this.http.post<any>(`${this.link}registrazione`, nuovoUtente);
    
    this.obsSignup.subscribe({
      next: (res) => console.log("Registrazione completata:", res),
      error: (err) => console.error("Errore registrazione:", err.error.error)
    });
  }
}