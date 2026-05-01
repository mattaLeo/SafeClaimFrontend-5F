import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AssistenteChatResponse {
  risposta: string;
  chunk_usati: { titolo: string; score: number }[];
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class AssistenteService {
  private readonly baseUrl = 'https://silver-space-guide-7vvggrww9qv7cvq7-12000.app.github.dev/assistente/';

  constructor(private http: HttpClient) {}

  chat(domanda: string): Observable<AssistenteChatResponse> {
    return this.http.post<AssistenteChatResponse>(`${this.baseUrl}chat`, { domanda });
  }

  health(): Observable<{ status: string; modello: string; kb_chunks: number; tfidf_termini: number }> {
    return this.http.get<{ status: string; modello: string; kb_chunks: number; tfidf_termini: number }>(`${this.baseUrl}health`);
  }

  argomenti(): Observable<{ argomenti: string[]; totale: number }> {
    return this.http.get<{ argomenti: string[]; totale: number }>(`${this.baseUrl}argomenti`);
  }
}
