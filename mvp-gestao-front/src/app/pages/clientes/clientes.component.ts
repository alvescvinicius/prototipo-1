import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Cliente } from '../../core/interfaces/cliente.interface';
import { ClienteService } from '../../core/services/cliente.service';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss',
})
export class ClientesComponent {
  clientes: Cliente[] = [];

  novoCliente = {
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    dataCadastro: new Date(),
    dataAlteracao: new Date(),
    usuarioCadastro: 'admin',
    usuarioAlteracao: 'admin',
  };

  editandoId: number | null = null;

  constructor(private clienteService: ClienteService) {}

  ngOnInit(): void {
    this.clientes = this.clienteService.listar();
  }

  salvar(): void {
    if (this.editandoId) {
      this.clienteService.atualizar({
        id: this.editandoId,
        nome: this.novoCliente.nome,
        cpf: this.novoCliente.cpf,
        telefone: this.novoCliente.telefone,
        email: this.novoCliente.email,
        status: 'ATIVO',
        dataCadastro: new Date(),
        dataAlteracao: new Date(),
        usuarioCadastro: 'admin',
        usuarioAlteracao: 'admin',
      });

      this.editandoId = null;
    } else {
      this.clienteService.adicionar({
        id: Date.now(),
        nome: this.novoCliente.nome,
        cpf: this.novoCliente.cpf,
        telefone: this.novoCliente.telefone,
        email: this.novoCliente.email,
        status: 'ATIVO',
        dataCadastro: new Date(),
        dataAlteracao: new Date(),
        usuarioCadastro: 'admin',
        usuarioAlteracao: 'admin',
      });
    }

    this.clientes = this.clienteService.listar();

    this.novoCliente = {
      nome: '',
      cpf: '',
      telefone: '',
      email: '',
      dataCadastro: new Date(),
      dataAlteracao: new Date(),
      usuarioCadastro: 'admin',
      usuarioAlteracao: 'admin',
    };
  }

  excluir(id: number): void {
    this.clienteService.remover(id);
    this.clientes = this.clienteService.listar();
  }

  editar(cliente: Cliente): void {
    this.editandoId = cliente.id;

    this.novoCliente = {
      nome: cliente.nome,
      cpf: cliente.cpf,
      telefone: cliente.telefone,
      email: cliente.email,
      dataCadastro: cliente.dataCadastro,
      dataAlteracao: cliente.dataAlteracao,
      usuarioCadastro: cliente.usuarioCadastro,
      usuarioAlteracao: cliente.usuarioAlteracao,
    };
  }
}
