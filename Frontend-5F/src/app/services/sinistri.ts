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
  link  = "https://special-space-palm-tree-r44jjrw659xq3gxr-7000.app.github.dev/";
  link2 = "https://special-space-palm-tree-r44jjrw659xq3gxr-8000.app.github.dev/";

  obsSinistri!:      Observable<sinistro[]>;
  obsSinistroId!:    Observable<sinistro>;
  obsCreateSinistro!: Observable<any>;

  private sinistriSubject = new BehaviorSubject<sinistro[]>([]);
  sinistri$: Observable<sinistro[]> = this.sinistriSubject.asObservable();
  sinistri: sinistro[] = [];

  constructor(public http: HttpClient) {}

  askSinistri(): void {
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
    const uploads$ = files.map(file =>
      this.fileToBase64(file).pipe(
        switchMap(base64 => this.http.post(
          `${this.link}sinistro/${sinistroId}/immagini`,
          { immagine_base64: base64 }
        ))
      )
    );
    return forkJoin(uploads$);
  }

  private fileToBase64(file: File): Observable<string> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.onload = () => {
        const full = reader.result as string;
        const base64 = full.split(',')[1].trim(); // solo dati puri, senza prefisso
        observer.next(base64);
        observer.complete();
      };
      reader.onerror = err => observer.error(err);
      reader.readAsDataURL(file);
    });
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
}