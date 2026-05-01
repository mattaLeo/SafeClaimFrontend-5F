export interface Veicolo {
    id: number;
    targa: string;
    n_telaio: string; // Aggiunto
    marca: string;
    modello: string;
    anno_immatricolazione: number; // Aggiunto
    automobilista_id: number;
}