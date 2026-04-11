import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  link = "https://potential-space-tribble-x55jj9x764pjfqx9-6000.app.github.dev/";

  currentUser?: User

  constructor(private http: HttpClient) { }

  login(email_in: string, psw_in: string): Observable<any> {
    return this.http.post<any>(`${this.link}login`, {
      email: email_in,
      psw: psw_in
    }).pipe(
      tap(res => {
        console.log("Risposta API Login:", res);
        if (res.status === "success") {
          this.currentUser = res.user;
          localStorage.setItem('userRole', res.user.ruolo); // <-- aggiungi questa riga
          console.log("Utente loggato:", this.currentUser);
        }
      })
    );
  }

  signup(nuovoUtente: User): Observable<any> {
    return this.http.post<any>(`${this.link}registrazione`, nuovoUtente);
  }
}