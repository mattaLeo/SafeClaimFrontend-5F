import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Perizia } from '../models/perizia.model';
import { Pratica } from '../models/pratica.model';
import { Relazione } from '../perito/perito';

@Injectable({
  providedIn: 'root'
})
export class Perizie {

  // Porta 8000 → pratiche/perizie (MongoDB)
  private praticheLink = 'https://redesigned-zebra-977ppqwrvvww274w5-8000.app.github.dev/';
  // Porta 7000 → sinistri (MongoDB)
  private sinistriLink = 'https://redesigned-zebra-977ppqwrvvww274w5-7000.app.github.dev/';

  constructor(public http: HttpClient) {}

  // ── Sinistri ────────────────────────────────────────────────────────────────

  askSinistriPerito(peritoId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.sinistriLink}perito/${peritoId}/sinistri`);
  }

  askTuttiSinistri(): Observable<any[]> {
    return this.http.get<any[]>(`${this.sinistriLink}sinistri`);
  }

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
      id:       String(s._id ?? s.id),
      code:     `SN-${String(s._id ?? s.id).slice(-5).toUpperCase()}`,
      status,
      type:     s.tipo_sinistro ?? s.descrizione ?? 'Sinistro',
      location: s.luogo ?? s.indirizzo ?? 'N/D',
      date:     dataEvento.toLocaleDateString('it-IT', {
                  day: '2-digit', month: 'long', year: 'numeric'
                }),
      time:     dataEvento.toLocaleTimeString('it-IT', {
                  hour: '2-digit', minute: '2-digit'
                }),
      vehicle:  `${s.marca ?? ''} ${s.modello ?? ''} ${s.targa ? '- ' + s.targa : ''}`.trim(),
      priority,
      insuranceCompany: s.compagnia_assicurativa ?? s.assicurazione ?? 'N/D',
      amount:   stima || undefined,
      month:    dataEvento.getMonth() + 1,
      year:     dataEvento.getFullYear(),
    };
  }

  // ── Relazioni (CRUD su MongoDB via porta 8000) ───────────────────────────────
  // Le relazioni sono salvate nella collezione "Perizia" di MongoDB.
  // Ogni documento ha: sinistro_id (= claim._id originale), perito_id, e i campi
  // della Relazione. Usiamo gli endpoint pratica già esistenti sul backend.

  /**
   * Carica tutte le relazioni di un perito.
   * Endpoint reale: GET /perito/<peritoId>/perizie  (non ancora implementato)
   * Fallback: leggiamo la collezione Perizia filtrando per perito_id lato client.
   */
  getRelazioniPerito(peritoId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.praticheLink}perito/${peritoId}/perizie`
    );
  }

  /**
   * Crea una nuova relazione peritale.
   * Mappa sull'endpoint POST /sinistro/<sinistroId>/perito/<peritoId>/pratica
   */
  creaRelazione(sinistroId: string, peritoId: string, rel: Partial<Relazione>): Observable<any> {
    const body = {
      titolo:            rel.title,
      tipo_danno:        rel.tipoDanno,
      stima_danno:       rel.estimatedDamage,
      parti_danneggiate: rel.partiDanneggiate,
      descrizione:       rel.description,
      conclusione:       rel.conclusione,
      veicolo:           rel.vehicle,
      claim_code:        rel.claimCode,
      stato:             rel.status ?? 'Bozza',
    };
    return this.http.post<any>(
      `${this.praticheLink}sinistro/${sinistroId}/perito/${peritoId}/pratica`,
      body
    );
  }

  /**
   * Aggiorna una relazione esistente.
   * Mappa sull'endpoint PUT /sinistro/<sinistroId>/perito/<peritoId>/pratica
   */
  aggiornaRelazione(sinistroId: string, peritoId: string, rel: Partial<Relazione>): Observable<any> {
    const body = {
      titolo:            rel.title,
      tipo_danno:        rel.tipoDanno,
      stima_danno:       rel.estimatedDamage,
      parti_danneggiate: rel.partiDanneggiate,
      descrizione:       rel.description,
      conclusione:       rel.conclusione,
      veicolo:           rel.vehicle,
      stato:             rel.status ?? 'Bozza',
    };
    return this.http.put<any>(
      `${this.praticheLink}sinistro/${sinistroId}/perito/${peritoId}/pratica`,
      body
    );
  }

  /**
   * Elimina una relazione (perizia) tramite il suo ID MongoDB.
   * Endpoint: DELETE /perizia/<id>  — da aggiungere al backend.
   */
  eliminaRelazione(periziaid: string): Observable<any> {
    return this.http.delete<any>(`${this.praticheLink}perizia/${periziaid}`);
  }

  // ── Pratica / Rimborso / Intervento (invariati) ───────────────────────────

  askPratica(sinistroId: string, peritoId: string): Observable<Pratica> {
    return this.http.get<Pratica>(
      `${this.praticheLink}sinistro/${sinistroId}/perito/${peritoId}/pratica`
    );
  }

  askCreaPerizia(sinistroId: string, peritoId: string, body: Partial<Perizia>): Observable<any> {
    return this.http.post<any>(
      `${this.praticheLink}sinistro/${sinistroId}/perito/${peritoId}/pratica`,
      body
    );
  }

  askRimborso(
    sinistroId: string, peritoId: string, periziaid: string,
    body: { stima_danno: number; esito: string }
  ): Observable<any> {
    return this.http.post<any>(
      `${this.praticheLink}sinistro/${sinistroId}/perito/${peritoId}/pratica/${periziaid}/rimborso`,
      body
    );
  }

  askIntervento(
    sinistroId: string, peritoId: string, periziaid: string,
    body: { id_officina: string; data_inizio_lavori: string }
  ): Observable<any> {
    return this.http.post<any>(
      `${this.praticheLink}sinistro/${sinistroId}/perito/${peritoId}/pratica/${periziaid}/intervento`,
      body
    );
  }
}