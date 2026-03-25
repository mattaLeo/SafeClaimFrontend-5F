import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Perizia } from '../models/perizia.model';
import { Pratica } from '../models/pratica.model';

@Injectable({
  providedIn: 'root'
})
export class Perizie {

  link = 'https://TUO-BACKEND-URL-QUI';  // <-- sostituisci con l'URL del gruppo backend

  perizie!: Perizia[];
  pratiche!: Pratica[];

  constructor(public http: HttpClient) {}

  // Recupera la pratica per sinistro + perito
  askPratica(sinistroId: string, peritoId: string): Observable<Pratica> {
    const obs = this.http.get<Pratica>(
      `${this.link}/sinistro/${sinistroId}/perito/${peritoId}/pratica`
    );
    obs.subscribe(data => this.getPratica(data));
    return obs;
  }

  getPratica(d: Pratica) {
    console.log('[Perizie Service] Pratica ricevuta:', d);
  }

  // Crea una nuova perizia
  askCreaPerizia(sinistroId: string, peritoId: string, body: Partial<Perizia>): Observable<any> {
    const obs = this.http.post<any>(
      `${this.link}/sinistro/${sinistroId}/perito/${peritoId}/pratica`,
      body
    );
    obs.subscribe(data => this.getCreaPerizia(data));
    return obs;
  }

  getCreaPerizia(d: any) {
    console.log('[Perizie Service] Perizia creata:', d);
  }

  // Registra rimborso
  askRimborso(sinistroId: string, peritoId: string, periziaid: string, body: { stima_danno: number; esito: string }): Observable<any> {
    const obs = this.http.post<any>(
      `${this.link}/sinistro/${sinistroId}/perito/${peritoId}/pratica/${periziaid}/rimborso`,
      body
    );
    obs.subscribe(data => this.getRimborso(data));
    return obs;
  }

  getRimborso(d: any) {
    console.log('[Perizie Service] Rimborso salvato:', d);
  }

  // Assegna officina
  askIntervento(sinistroId: string, peritoId: string, periziaid: string, body: { id_officina: string; data_inizio_lavori: string }): Observable<any> {
    const obs = this.http.post<any>(
      `${this.link}/sinistro/${sinistroId}/perito/${peritoId}/pratica/${periziaid}/intervento`,
      body
    );
    obs.subscribe(data => this.getIntervento(data));
    return obs;
  }

  getIntervento(d: any) {
    console.log('[Perizie Service] Intervento assegnato:', d);
  }
}