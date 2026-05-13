import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Perizia } from '../models/perizia.model';
import { Pratica } from '../models/pratica.model';
import { Relazione, Claim } from '../perito/perito';

@Injectable({
  providedIn: 'root'
})
export class Perizie {

  private praticheLink = 'https://miniature-fishstick-5g55r9g6jvp3vqxv-8000.app.github.dev/';
  private sinistriLink = 'https://miniature-fishstick-5g55r9g6jvp3vqxv-7000.app.github.dev/';

  constructor(public http: HttpClient) {}

  // ── Sinistri ────────────────────────────────────────────────────────────────

  askSinistriPerito(peritoId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.sinistriLink}perito/${peritoId}/sinistri`);
  }

  askTuttiSinistri(): Observable<any[]> {
    return this.http.get<any[]>(`${this.sinistriLink}sinistri`);
  }

  askTuttiPeriti(): Observable<any[]> {
    return this.http.get<any[]>(`${this.praticheLink}periti`);
  }

  getSinistro(sinistroId: string): Observable<any> {
    return this.http.get<any>(`${this.sinistriLink}sinistro/${sinistroId}`);
  }

  getAnalisiAI(sinistroId: string): Observable<any> {
    return this.http.get<any>(`${this.sinistriLink}sinistro/${sinistroId}/analisi`);
  }

  // ── Pratiche ────────────────────────────────────────────────────────────────

  getPratichePerito(peritoId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.praticheLink}perito/${peritoId}/pratiche`);
  }

  accettaPratica(praticaId: string, peritoId: string): Observable<any> {
    return this.http.put<any>(
      `${this.praticheLink}pratica/${praticaId}/perito/${peritoId}`,
      { stato: 'in_perizia' }
    );
  }

  rifiutaPratica(praticaId: string, peritoId: string): Observable<any> {
    return this.http.put<any>(
      `${this.praticheLink}pratica/${praticaId}/perito/${peritoId}`,
      { stato: 'da_assegnare', _reset_perito: true }
    );
  }

  eliminaPratica(praticaId: string, peritoId: string): Observable<any> {
    return this.http.delete<any>(
      `${this.praticheLink}pratica/${praticaId}/perito/${peritoId}`
    ).pipe(
      catchError(() => of({ ok: false }))
    );
  }

  // ── Mapping ─────────────────────────────────────────────────────────────────

  mapPraticaToClaimCard(p: any): Claim {
    const s = p.sinistro ?? {};
    const dataEvento = s.data_evento ? new Date(s.data_evento) : new Date();

    const statoMap: Record<string, string> = {
      'in_valutazione':    'in_valutazione',
      'aperto':            'in_valutazione',
      'nuovo':             'in_valutazione',
      'assegnato':         'assegnato',
      'assegnata':         'assegnato',
      'in_perizia':        'in_perizia',
      'in_attesa':         'in_attesa',
      'approvato':         'approvato',
      'rimborso_proposto': 'approvato',
      'chiuso':            'chiuso',
      'concluso':          'chiuso',
      'in_riparazione':    'chiuso',
    };
    const praticaStato = (p.stato ?? s.stato ?? '').toLowerCase();
    const status = statoMap[praticaStato] ?? 'assegnato';

    const stima = s.stima_danno ?? p.stima_danno ?? 0;
    let priority = 'media';
    if      (s.priorita)                priority = s.priorita;
    else if (stima > 10000)             priority = 'alta';
    else if (stima > 0 && stima < 1000) priority = 'bassa';

    const vehicle = (
      [s.marca ?? '', s.modello ?? '', s.targa ? `- ${s.targa}` : '']
        .join(' ').trim() || s.targa
    ) ?? 'N/D';

    const stableId = String(p.sinistro_id ?? s._id ?? p._id);
    const praticaId = String(p._id);

    return {
      id:               stableId,
      praticaId:        praticaId,
      code:             `SN-${stableId.slice(-5).toUpperCase()}`,
      status:           status as Claim['status'],
      type:             s.tipo_sinistro ?? (s.descrizione?.substring(0, 50) ?? 'Sinistro'),
      location:         s.luogo ?? s.indirizzo ?? 'N/D',
      date:             dataEvento.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }),
      time:             dataEvento.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      vehicle,
      priority:         priority as Claim['priority'],
      insuranceCompany: s.compagnia_assicurativa ?? p.compagnia ?? 'N/D',
      amount:           stima || undefined,
      month:            dataEvento.getMonth() + 1,
      year:             dataEvento.getFullYear(),
    };
  }

  mapSinistreToClaim(s: any): Claim {
    const dataEvento = s.data_evento ? new Date(s.data_evento) : new Date();
    const statoMap: Record<string, string> = {
      'in_valutazione': 'in_valutazione', 'aperto': 'in_valutazione', 'nuovo': 'in_valutazione',
      'assegnato': 'assegnato', 'assegnata': 'assegnato', 'in_perizia': 'in_perizia',
      'in_attesa': 'in_attesa', 'approvato': 'approvato', 'chiuso': 'chiuso', 'concluso': 'chiuso',
    };
    const status = statoMap[s.stato?.toLowerCase?.() ?? ''] ?? 'assegnato';
    const stima = s.stima_danno ?? s.importo ?? 0;
    let priority = 'media';
    if      (s.priorita)    priority = s.priorita;
    else if (stima > 10000) priority = 'alta';
    else if (stima < 1000)  priority = 'bassa';

    const stableId = String(s._id ?? s.id);

    return {
      id:               stableId,
      praticaId:        undefined,
      code:             `SN-${stableId.slice(-5).toUpperCase()}`,
      status:           status as Claim['status'],
      type:             s.tipo_sinistro ?? s.descrizione ?? 'Sinistro',
      location:         s.luogo ?? s.indirizzo ?? 'N/D',
      date:             dataEvento.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }),
      time:             dataEvento.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      vehicle:          `${s.marca ?? ''} ${s.modello ?? ''} ${s.targa ? '- ' + s.targa : ''}`.trim(),
      priority:         priority as Claim['priority'],
      insuranceCompany: s.compagnia_assicurativa ?? s.assicurazione ?? 'N/D',
      amount:           stima || undefined,
      month:            dataEvento.getMonth() + 1,
      year:             dataEvento.getFullYear(),
    };
  }

  // ── Relazioni ───────────────────────────────────────────────────────────────

  getRelazioniPerito(peritoId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.praticheLink}perito/${peritoId}/perizie`);
  }

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
      `${this.praticheLink}sinistro/${sinistroId}/perito/${peritoId}/pratica`, body
    );
  }

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
      `${this.praticheLink}sinistro/${sinistroId}/perito/${peritoId}/pratica`, body
    );
  }

  eliminaRelazione(periziaid: string): Observable<any> {
    return this.http.delete<any>(`${this.praticheLink}perizia/${periziaid}`);
  }

  // ── Pratica / Rimborso / Intervento ─────────────────────────────────────────

  askPratica(sinistroId: string, peritoId: string): Observable<Pratica> {
    return this.http.get<Pratica>(
      `${this.praticheLink}sinistro/${sinistroId}/perito/${peritoId}/pratica`
    );
  }

  askCreaPerizia(sinistroId: string, peritoId: string, body: Partial<Perizia>): Observable<any> {
    return this.http.post<any>(
      `${this.praticheLink}sinistro/${sinistroId}/perito/${peritoId}/pratica`, body
    );
  }

  askRimborso(
    sinistroId: string, peritoId: string, periziaid: string,
    body: { stima_danno: number; esito: string }
  ): Observable<any> {
    return this.http.post<any>(
      `${this.praticheLink}sinistro/${sinistroId}/perito/${peritoId}/pratica/${periziaid}/rimborso`, body
    );
  }

  askIntervento(
    sinistroId: string, peritoId: string, periziaid: string,
    body: { id_officina: string; data_inizio_lavori: string }
  ): Observable<any> {
    return this.http.post<any>(
      `${this.praticheLink}sinistro/${sinistroId}/perito/${peritoId}/pratica/${periziaid}/intervento`, body
    );
  }
}