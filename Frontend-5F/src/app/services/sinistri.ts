import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { sinistro } from '../models/sinistro.model';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Pratica } from '../models/pratica.model';

@Injectable({
  providedIn: 'root',
})
export class Sinistri {
  link = "https://congenial-barnacle-pj99w67975qh9454-7000.app.github.dev/"
  link2 = "https://congenial-barnacle-pj99w67975qh9454-8000.app.github.dev/"

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

creaPratica(sinistro_id: string, perito_id: string, data: Partial<Pratica>): Observable<{ status: string; id_perizia: string }> {
  return this.http.post<{ status: string; id_perizia: string }>(
    `${this.link2}sinistro/${sinistro_id}/perito/${perito_id}/pratica`, // ← rimosso lo slash in più
    data
  );
}

getPratiche(): Observable<{ totale: number; pratiche: Pratica[] }> {
  return this.http.get<{ totale: number; pratiche: Pratica[] }>(
    `${this.link2}pratiche_assicurazione`
  );
}
}