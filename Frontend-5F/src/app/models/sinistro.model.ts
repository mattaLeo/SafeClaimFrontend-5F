export interface sinistro {
    automobilista_id : number;
    targa: string;
    data_evento: Date;
    descrizione: string;
    stato?: "APERTO" | "CHIUSO" | "IN ANALISI" | "IN ASSEGNAZIONE"| string;
    data_creazione?: Date;
    _id?: string;
    immagini?: string[];
    latitudine?: number;
    longitudine?: number;
    geolocalizzazione?: {
        latitudine: number;
        longitudine: number;
    };
}
