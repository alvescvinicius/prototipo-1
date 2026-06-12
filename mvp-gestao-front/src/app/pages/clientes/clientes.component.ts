import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Cliente } from '../../shared/interfaces/cliente.interface';
import { ClienteService } from '../../shared/services/cliente.service';

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
    telefone: '',
    email: '',
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
        telefone: this.novoCliente.telefone,
        email: this.novoCliente.email,
        status: 'ATIVO',
      });

      this.editandoId = null;
    } else {
      this.clienteService.adicionar({
        id: Date.now(),
        nome: this.novoCliente.nome,
        telefone: this.novoCliente.telefone,
        email: this.novoCliente.email,
        status: 'ATIVO',
      });
    }

    this.clientes = this.clienteService.listar();

    this.novoCliente = {
      nome: '',
      telefone: '',
      email: '',
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
      telefone: cliente.telefone,
      email: cliente.email,
    };
  }
}
