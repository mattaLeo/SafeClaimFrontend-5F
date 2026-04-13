import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  link = "https://zany-orbit-977ppqw5gg6xfp9w9-6000.app.github.dev/";

  currentUser?: User;

  constructor(private http: HttpClient) {
    // Ripristina utente dal localStorage all'avvio
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      this.currentUser = JSON.parse(saved);
    }
  }

  login(email_in: string, psw_in: string): Observable<any> {
    return this.http.post<any>(`${this.link}login`, {
      email: email_in,
      psw: psw_in
    }).pipe(
      tap(res => {
        console.log("Risposta API Login:", res);
        if (res.status === "success") {
          this.currentUser = res.user;
          localStorage.setItem('currentUser', JSON.stringify(res.user));
          localStorage.setItem('userRole', res.user.ruolo);
          console.log("Utente loggato:", this.currentUser);
        }
      })
    );
  }

  signup(nuovoUtente: User): Observable<any> {
    return this.http.post<any>(`${this.link}registrazione`, nuovoUtente);
  }

  logout(): void {
    this.currentUser = undefined;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
  }
}