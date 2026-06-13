export interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  status: 'ATIVO' | 'INATIVO';
  dataCadastro: Date;
  dataAlteracao: Date;
  usuarioCadastro: string;
  usuarioAlteracao: string;
}
