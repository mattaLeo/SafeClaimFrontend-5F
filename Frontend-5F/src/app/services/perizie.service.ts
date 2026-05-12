import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Perizia } from '../models/perizia.model';
import { Pratica } from '../models/pratica.model';
import { Relazione, Claim } from '../perito/perito';

@Injectable({
  providedIn: 'root'
})
export class Perizie {

  // Porta 8000 → pratiche/perizie (MongoDB)
  private praticheLink = 'https://cuddly-space-barnacle-x5xxp49pwj5297r5-8000.app.github.dev/';
  // Porta 7000 → sinistri (MongoDB)
  private sinistriLink = 'https://cuddly-space-barnacle-x5xxp49pwj5297r5-7000.app.github.dev/';

  constructor(public http: HttpClient) {}

  // ── Sinistri ─────────────────────────────────────────────────────────────────

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

  // ── Pratiche ──────────────────────────────────────────────────────────────────

  getPratichePerito(peritoId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.praticheLink}perito/${peritoId}/pratiche`);
  }

  /**
   * Accetta una pratica assegnata: imposta stato → 'in_perizia'.
   */
  accettaPratica(sinistroId: string, peritoId: string): Observable<any> {
    return this.http.put<any>(
      `${this.praticheLink}sinistro/${sinistroId}/perito/${peritoId}/pratica`,
      { stato: 'in_perizia' }
    );
  }

  /**
   * Rifiuta una pratica: imposta stato → 'aperto' e resetta il perito.
   */
  rifiutaPratica(sinistroId: string, peritoId: string): Observable<any> {
    return this.http.put<any>(
      `${this.praticheLink}sinistro/${sinistroId}/perito/${peritoId}/pratica`,
      { stato: 'aperto', _reset_perito: true }
    );
  }

  /**
   * Elimina una pratica dal sistema (best-effort).
   * Usa il praticaId (MongoDB _id) e il peritoId.
   */
  eliminaPratica(praticaId: string, peritoId: string): Observable<any> {
    return this.http.delete<any>(
      `${this.praticheLink}pratica/${praticaId}/perito/${peritoId}`
    ).pipe(
      catchError(() => of({ ok: false }))
    );
  }

  // ── Relazioni (salvate come Pratiche su MongoDB) ───────────────────────────────
  //
  // Le "relazioni peritali" vengono salvate nella collezione Pratica tramite
  // l'endpoint PUT /sinistro/:id/perito/:id/pratica (upsert).
  // Per leggerle usiamo GET /perito/:id/pratiche filtrando quelle con titolo
  // compilato (= relazione già creata dal perito).

  /**
   * Legge le relazioni del perito dalle pratiche (che fungono da contenitore).
   * Filtra solo quelle che hanno un titolo compilato (relazioni effettive).
   */
  getRelazioniPerito(peritoId: string): Observable<Relazione[]> {
    return this.getPratichePerito(peritoId).pipe(
      map((pratiche: any[]) =>
        pratiche
          .filter(p => !!(p.titolo || p.tipo_danno)) // solo pratiche con dati perizia
          .map(p => this.mapPraticaToRelazione(p))
      ),
      catchError(() => of([]))
    );
  }

  /**
   * Crea una relazione aggiornando (upsert) la pratica esistente.
   * Il backend usa update_one con upsert=True, quindi funziona sia per
   * creare che per aggiornare.
   */
  creaRelazione(sinistroId: string, peritoId: string, rel: Partial<Relazione>): Observable<any> {
    const body = this.buildRelazioneBody(rel);
    return this.http.put<any>(
      `${this.praticheLink}sinistro/${sinistroId}/perito/${peritoId}/pratica`,
      body
    );
  }

  /**
   * Aggiorna una relazione esistente (stesso endpoint, stessa logica upsert).
   */
  aggiornaRelazione(sinistroId: string, peritoId: string, rel: Partial<Relazione>): Observable<any> {
    const body = this.buildRelazioneBody(rel);
    return this.http.put<any>(
      `${this.praticheLink}sinistro/${sinistroId}/perito/${peritoId}/pratica`,
      body
    );
  }

  /**
   * Elimina una relazione (pratica) dal sistema.
   * Richiede il praticaId (MongoDB _id della pratica) e il peritoId.
   */
  eliminaRelazione(praticaId: string, peritoId: string): Observable<any> {
    return this.http.delete<any>(
      `${this.praticheLink}pratica/${praticaId}/perito/${peritoId}`
    ).pipe(
      catchError(() => of({ ok: false }))
    );
  }

  private buildRelazioneBody(rel: Partial<Relazione>): Record<string, any> {
    return {
      titolo:            rel.title,
      tipo_danno:        rel.tipoDanno,
      stima_danno:       rel.estimatedDamage,
      parti_danneggiate: rel.partiDanneggiate ?? [],
      descrizione:       rel.description,
      conclusione:       rel.conclusione,
      veicolo:           rel.vehicle,
      claim_code:        rel.claimCode,
      stato:             rel.status ?? 'Bozza',
    };
  }

  private mapPraticaToRelazione(p: any): Relazione {
    const statoMap: Record<string, 'Bozza' | 'Completata' | 'Inviata'> = {
      'Bozza':      'Bozza',
      'bozza':      'Bozza',
      'Completata': 'Completata',
      'completata': 'Completata',
      'Inviata':    'Inviata',
      'inviata':    'Inviata',
    };
    const statoRaw = p.stato ?? '';
    return {
      id:               String(p._id ?? ''),
      sinistroId:       String(p.sinistro_id ?? ''),
      claimCode:        p.claim_code ?? p.claimCode ?? '',
      title:            p.titolo ?? p.title ?? '',
      vehicle:          p.veicolo ?? p.vehicle ?? '',
      tipoDanno:        p.tipo_danno ?? p.tipoDanno ?? '',
      estimatedDamage:  p.stima_danno ?? p.estimatedDamage ?? undefined,
      partiDanneggiate: p.parti_danneggiate ?? p.partiDanneggiate ?? [],
      description:      p.descrizione ?? p.description ?? '',
      conclusione:      p.conclusione ?? '',
      status:           statoMap[statoRaw] ?? 'Bozza',
      createdAt: p.data_inserimento
        ? new Date(p.data_inserimento).toLocaleDateString('it-IT', {
            day: '2-digit', month: 'long', year: 'numeric',
          })
        : undefined,
    };
  }

  // ── Mapper pratiche → claim card ──────────────────────────────────────────────

  /**
   * Mappa una pratica (con sinistro embedded) all'interfaccia Claim.
   *
   * L'ID viene derivato in ordine di priorità:
   *   1. p.sinistro_id  → campo esplicito, SEMPRE stabile
   *   2. s._id          → sinistro embedded
   *   3. p._id          → fallback sulla pratica stessa
   */
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

    return {
      id:               stableId,
      _praticaId:       String(p._id ?? ''), // conserva il _id della pratica per eliminazione
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

  /** Mantiene la compatibilità con il codice che usa ancora i sinistri diretti. */
  mapSinistreToClaim(s: any): Claim {
    const dataEvento = s.data_evento ? new Date(s.data_evento) : new Date();
    const statoMap: Record<string, string> = {
      'in_valutazione': 'in_valutazione', 'aperto': 'in_valutazione', 'nuovo': 'in_valutazione',
      'assegnato': 'assegnato', 'assegnata': 'assegnato',
      'in_perizia': 'in_perizia', 'in_attesa': 'in_attesa',
      'approvato': 'approvato', 'chiuso': 'chiuso', 'concluso': 'chiuso',
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

  // ── Perizia / Rimborso / Intervento ──────────────────────────────────────────

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