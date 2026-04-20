import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { sinistro } from '../models/sinistro.model';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class Sinistri {
  link = "https://humble-palm-tree-pjjxxg94v5qx39gv-7000.app.github.dev/"

  obsSinistri!: Observable<sinistro[]>
  obsSinistroId!: Observable<sinistro>
  obsCreateSinistro!: Observable<any>

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

  uploadImmagini(sinistroId: string, files: File[]): Observable<any> {
  const formData = new FormData();
  files.forEach(file => formData.append('immagini', file, file.name));
  return this.http.post(`${this.link}sinistro/${sinistroId}/immagini`, formData);
}
}