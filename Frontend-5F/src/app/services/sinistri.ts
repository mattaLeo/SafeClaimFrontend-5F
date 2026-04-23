import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { sinistro } from '../models/sinistro.model';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class Sinistri {
  link = "https://improved-palm-tree-pjjxxg9v4j6g2xq9-7000.app.github.dev/"

  obsSinistri!: Observable<sinistro[]>
  obsSinistroId!: Observable<sinistro>
  obsCreateSinistro!: Observable<any>

  private sinistriSubject = new BehaviorSubject<sinistro[]>([]);
  sinistri$: Observable<sinistro[]> = this.sinistriSubject.asObservable();
  sinistri: sinistro[] = [];

  constructor(public http: HttpClient) {}

  askSinistri() {
    this.http.get<sinistro[]>(`${this.link}sinistri`).subscribe({
      next: (data) => {
        this.sinistri = data;
        this.sinistriSubject.next(data);
        console.log("Sinistri caricati:", data);
      },
      error: (err: any) => console.error("Errore download sinistri:", err)
    });
  }

  createSinistro(nuovoSinistro: sinistro): Observable<any> {
    return this.http.post(`${this.link}sinistro`, nuovoSinistro).pipe(
      tap(() => this.askSinistri())
    );
  }

  uploadImmagini(sinistroId: string, files: File[]): Observable<any> {
  const formData = new FormData();
  files.forEach(file => formData.append('immagini', file, file.name));
  return this.http.post(`${this.link}sinistro/${sinistroId}/immagini`, formData);
}
}