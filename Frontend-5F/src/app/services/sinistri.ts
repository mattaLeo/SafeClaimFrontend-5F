import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, forkJoin } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { sinistro } from '../models/sinistro.model';
import { Pratica } from '../models/pratica.model';

@Injectable({
  providedIn: 'root',
})
export class Sinistri {
  link  = "https://fantastic-space-broccoli-4j66vrj4vqg2qggr-7000.app.github.dev/";
  link2 = "https://fantastic-space-broccoli-4j66vrj4vqg2qggr-8000.app.github.dev/";

  obsSinistri!:      Observable<sinistro[]>;
  obsSinistroId!:    Observable<sinistro>;
  obsCreateSinistro!: Observable<any>;

  private sinistriSubject = new BehaviorSubject<sinistro[]>([]);
  sinistri$: Observable<sinistro[]> = this.sinistriSubject.asObservable();
  sinistri: sinistro[] = [];

  constructor(public http: HttpClient) {}

  askSinistri(userId?: number) {
    const url = userId 
      ? `${this.link}sinistri?automobilista_id=${userId}`
      : `${this.link}sinistri`;
      
    this.http.get<sinistro[]>(url).subscribe({
      next: (data) => {
        this.sinistri = data;
        this.sinistriSubject.next(data);
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
  const uploads$ = files.map(file => {
    const formData = new FormData();
    formData.append('immagine', file);
    return this.http.post(
      `${this.link}sinistro/${sinistroId}/immagini`,
      formData
    );
  });
  return forkJoin(uploads$);
}
  

  creaPratica(sinistro_id: string, perito_id: string, data: Partial<Pratica>): Observable<{ status: string; id_perizia: string }> {
    return this.http.post<{ status: string; id_perizia: string }>(
      `${this.link2}sinistro/${sinistro_id}/perito/${perito_id}/pratica`,
      data
    );
  }

  getPratiche(): Observable<{ totale: number; pratiche: Pratica[] }> {
    return this.http.get<{ totale: number; pratiche: Pratica[] }>(
      `${this.link2}pratiche_assicurazione`
    );
  }

  aggiornaSinistro(id: string, data: Partial<sinistro>): Observable<any> {
  return this.http.put(`${this.link}sinistro/${id}`, data);
}
}
