export interface User {
  id?: number;
  nome: string;
  cognome: string;
  cf: string;
  email: string;
  password_hash: string;
  ruolo?: 'automobilista' | 'perito' | 'assicuratore';
  
  // Campi opzionali specifici per ruolo
  nome_compagnia?: string;     // solo per assicuratore
  id_compagnia?: number;
  // altri campi futuri...
}