import { Injectable } from '@angular/core';
import { Cliente } from '../interfaces/cliente.interface';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  private clientes: Cliente[] = [
    {
      id: 1,
      nome: 'João Silva',
      cpf: '123.456.789-00',
      telefone: '(21) 99999-9999',
      email: 'joao@email.com',
      status: 'ATIVO',
      dataCadastro: new Date(),
      dataAlteracao: new Date(),
      usuarioCadastro: 'admin',
      usuarioAlteracao: 'admin',
    },
    {
      id: 2,
      nome: 'Maria Souza',
      cpf: '987.654.321-00',
      telefone: '(21) 98888-8888',
      email: 'maria@email.com',
      status: 'ATIVO',
      dataCadastro: new Date(),
      dataAlteracao: new Date(),
      usuarioCadastro: 'admin',
      usuarioAlteracao: 'admin',
    }
];

  listar(): Cliente[] {
    return this.clientes;
  }

  adicionar(cliente: Cliente): void {
    this.clientes.push(cliente);
  }

  remover(id: number): void {
    this.clientes = this.clientes.filter((c) => c.id !== id);
  }

  atualizar(cliente: Cliente): void {
    const index = this.clientes.findIndex((c) => c.id === cliente.id);

    if (index >= 0) {
      this.clientes[index] = cliente;
    }
  }


}
