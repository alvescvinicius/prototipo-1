export interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  status: 'ATIVO' | 'INATIVO';
}
