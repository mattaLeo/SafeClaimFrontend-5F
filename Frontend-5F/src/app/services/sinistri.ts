import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { sinistro } from '../models/sinistro.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Sinistri {
  link = "https://opulent-halibut-wrrww9x5qw5q35g54-7000.app.github.dev/"

  obsSinistri!: Observable<sinistro[]>
  obsSinistroId!: Observable<sinistro>
  obsCreateSinistro!: Observable<any>

  sinistri: sinistro[] = [];
  sinistroById!: sinistro

  constructor(public http: HttpClient) {}

  askSinistri() {
    this.obsSinistri = this.http.get<sinistro[]>(`${this.link}sinistri`)
    this.obsSinistri.subscribe(data => this.getSinistri(data))
  }

  getSinistri(d: sinistro[]) {
    this.sinistri = d
    console.log(this.sinistri)
  }

  askSinistroById(id: number) {
    this.obsSinistroId = this.http.get<sinistro>(`${this.link}sinistri/${id}`)
    this.obsSinistroId.subscribe(data => this.getSinistroById(data))
  }

  getSinistroById(d: sinistro) {
    this.sinistroById = d
    console.log(this.sinistroById)
  }

  createSinistro(automobilista_id: number, targa: string, data_evento: Date, descrizione: string): Observable<any> {
    const newSinistro = {
      // CAMBIA QUI: usa lo stesso nome che si aspetta il backend
      automobilista_id: automobilista_id, 
      targa: targa,
      data_evento: data_evento,
      descrizione: descrizione
    };

    console.log("Sto inviando questo oggetto:", newSinistro); // Utile per il debug

    return this.http.post(`${this.link}sinistro`, newSinistro);
  }
}