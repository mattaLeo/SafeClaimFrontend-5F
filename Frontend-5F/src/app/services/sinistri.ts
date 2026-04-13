import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { sinistro } from '../models/sinistro.model';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SinistriService {
  link = "https://zany-orbit-977ppqw5gg6xfp9w9-5000.app.github.dev/";

  private sinistriSubject = new BehaviorSubject<sinistro[]>([]);
  obsSinistri = this.sinistriSubject.asObservable();
  sinistri: sinistro[] = [];

  constructor(public http: HttpClient) {}

  askSinistri(userId?: number) {
    this.http.get<any>(`${this.link}sinistri`).subscribe({
      next: (res) => {
        // Gestisce sia array diretto che {count, data: [...]}
        const data: sinistro[] = Array.isArray(res) ? res : res.data || [];
        const filtrati = userId ? data.filter(s => s.id_automobilista == userId) : data;
        this.sinistri = filtrati;
        this.sinistriSubject.next(filtrati);
      },
      error: (err) => console.error("Errore download sinistri:", err)
    });
  }

  createSinistro(nuovoSinistro: sinistro): Observable<any> {
    return this.http.post(`${this.link}sinistro`, nuovoSinistro).pipe(
      tap(() => this.askSinistri())
    );
  }
}