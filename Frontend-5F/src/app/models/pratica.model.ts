export interface Pratica {
  _id?: string;
  sinistro_id: string;
  perito_id: string;
  titolo: string;
  descrizione: string;
  tipo_danno?: string;
  stima_danno?: number;
  parti_danneggiate?: string[];
  conclusione?: string;
  veicolo?: string;
  claim_code?: string;
  stato: string;
  note_tecniche?: string;
  note_perito?: string;
  documenti?: string[];
  data_inserimento?: Date;
  data_aggiornamento?: Date;
}