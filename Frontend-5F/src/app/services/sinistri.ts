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

  askSinistri() {
    this.http.get<sinistro[]>(`${this.link}sinistri`).subscribe({
      next: (data) => {
        this.sinistri = data;
        this.sinistriSubject.next(data);
        console.log("Sinistri caricati:", data);
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