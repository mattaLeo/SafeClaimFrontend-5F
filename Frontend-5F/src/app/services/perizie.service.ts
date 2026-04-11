import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Perizia } from '../models/perizia.model';
import { Pratica } from '../models/pratica.model';

@Injectable({
  providedIn: 'root'
})
export class Perizie {

  link = 'https://potential-space-tribble-x55jj9x764pjfqx9-8000.app.github.dev/';
  sinistriLink = 'https://potential-space-tribble-x55jj9x764pjfqx9-7000.app.github.dev/';

  perizie!: Perizia[];
  pratiche!: Pratica[];

  constructor(public http: HttpClient) {}

  // ── NUOVO: carica i sinistri assegnati al perito ──────────────────────────

  askSinistriPerito(peritoId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.sinistriLink}perito/${peritoId}/sinistri`);
  }

  // Fallback se l'endpoint dedicato non esiste ancora
  askTuttiSinistri(): Observable<any[]> {
    return this.http.get<any[]>(`${this.sinistriLink}sinistri`);
  }

  /**
   * Converte un sinistro raw del backend nel formato Claim dell'UI.
   * Se il backend usa nomi diversi (es. "luogo_sinistro" invece di "luogo"),
   * adattali qui — un console.log della risposta ti mostra i nomi esatti.
   */
  mapSinistreToClaim(s: any): any {
    const dataEvento = s.data_evento ? new Date(s.data_evento) : new Date();

    const statoMap: Record<string, string> = {
      'in_valutazione': 'in_valutazione',
      'aperto':         'in_valutazione',
      'nuovo':          'in_valutazione',
      'assegnato':      'assegnato',
      'in_attesa':      'in_attesa',
      'approvato':      'approvato',
      'chiuso':         'chiuso',
      'concluso':       'chiuso',
    };
    const status = statoMap[s.stato?.toLowerCase?.() ?? ''] ?? 'in_valutazione';

    const stima = s.stima_danno ?? s.importo ?? 0;
    let priority = 'media';
    if      (s.priorita)    priority = s.priorita;
    else if (stima > 10000) priority = 'alta';
    else if (stima < 1000)  priority = 'bassa';

    return {
      id:               String(s.id),
      code:             `SN-${String(s.id).padStart(5, '0')}`,
      status,
      type:             s.tipo_sinistro ?? s.descrizione ?? 'Sinistro',
      location:         s.luogo ?? s.indirizzo ?? 'N/D',
      date:             dataEvento.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }),
      time:             dataEvento.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      vehicle:          `${s.marca ?? ''} ${s.modello ?? ''} - ${s.targa ?? ''}`.trim(),
      priority,
      insuranceCompany: s.compagnia_assicurativa ?? s.assicurazione ?? 'N/D',
      amount:           stima || undefined,
      month:            dataEvento.getMonth() + 1,
      year:             dataEvento.getFullYear(),
    };
  }

  // ── Invariati rispetto all'originale ─────────────────────────────────────

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