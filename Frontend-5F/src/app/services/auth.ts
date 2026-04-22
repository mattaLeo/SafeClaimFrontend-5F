import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  link = "https://scaling-yodel-g44gg56j9695hpv6j-6000.app.github.dev/";

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
    return this.http.post<any>(`${this.link}registrazione`, nuovoUtente);
  }

  logout(): void {
    this._currentUser = undefined;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
  }
}