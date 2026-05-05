export interface User {
  id?: number;
  nome: string;
  cognome: string;
  cf: string;
  email: string;
  password_hash: string;
  ruolo?: string;
}