import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  link = "https://silver-space-guide-7vvggrww9qv7cvq7-6000.app.github.dev/";

  private _currentUser?: User;

  get currentUser(): User | undefined {
    if (!this._currentUser) {
      const saved = localStorage.getItem('currentUser');
      if (saved) {
        try { this._currentUser = JSON.parse(saved); } catch {}
      }
    }
    return this._currentUser;
  }

  constructor(private http: HttpClient) {}

  login(email_in: string, psw_in: string): Observable<any> {
    return this.http.post<any>(`${this.link}login`, {
      email: email_in,
      psw: psw_in
    }).pipe(
      tap(res => {
        console.log("Risposta API Login:", res);
        if (res.status === "success") {
          this._currentUser = res.user;
          localStorage.setItem('currentUser', JSON.stringify(res.user));
          localStorage.setItem('userRole', res.user.ruolo);
          console.log("Utente loggato:", this._currentUser);
        }
      })
    );
  }

  signup(nuovoUtente: User): Observable<any> {
    const payload = {
      nome: nuovoUtente.nome?.trim(),
      cognome: nuovoUtente.cognome?.trim(),
      cf: nuovoUtente.cf?.trim().toUpperCase(),
      email: nuovoUtente.email?.trim().toLowerCase(),
      psw: nuovoUtente.psw,
    };

    return this.http.post<any>(`${this.link}registrazione`, payload).pipe(
      tap(res => {
        if (res.status === 'success') {
          const registeredUser: User = {
            id: res.id,
            nome: payload.nome ?? '',
            cognome: payload.cognome ?? '',
            cf: payload.cf ?? '',
            email: payload.email ?? '',
            psw: payload.psw ?? '',
            ruolo: 'automobilista',
          };
          this._currentUser = registeredUser;
          localStorage.setItem('currentUser', JSON.stringify(registeredUser));
          localStorage.setItem('userRole', 'automobilista');
        }
      })
    );
  }

  // 🆕 Aggiornamento profilo utente loggato
  updateUser(id: number, data: Partial<User>): Observable<any> {
    const ruolo = localStorage.getItem('userRole') ?? '';
    return this.http.put<any>(`${this.link}utente/${id}`, { ...data, ruolo }).pipe(
      tap(res => {
        if (res?.status === 'success') {
          // Se il backend rimanda l'utente aggiornato lo uso, altrimenti faccio merge locale
          const updated = res.user
            ? { ...res.user, ruolo: this._currentUser?.ruolo ?? ruolo }
            : { ...(this._currentUser as User), ...data };
          this._currentUser = updated as User;
          localStorage.setItem('currentUser', JSON.stringify(this._currentUser));
        }
      })
    );
  }

  logout(): void {
    this._currentUser = undefined;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
  }
}