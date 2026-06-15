import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService }    from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';
import { Project }        from '../../../core/interfaces/project';

const FREE_LIMIT = 2;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  projects  = signal<Project[]>([]);
  loading   = signal(true);
  creating  = signal(false);
  limitHit  = signal(false);

  renamingId: string | null = null;
  renameVal:  string        = '';

  constructor(
    public  auth:    AuthService,
    private projSvc: ProjectService,
    private router:  Router
  ) {}

  async ngOnInit(): Promise<void> {
    // Aguarda o perfil carregar antes de verificar limites
    if (this.auth.loading()) {
      await new Promise<void>(resolve => {
        const interval = setInterval(() => {
          if (!this.auth.loading()) { clearInterval(interval); resolve(); }
        }, 50);
      });
    }
    await this.loadProjects();
  }

  async loadProjects(): Promise<void> {
    this.loading.set(true);
    const list = await this.projSvc.listProjects();
    this.projects.set(list);
    const profile = this.auth.profile();
    // Só bloqueia se: perfil existe, plano é 'free', e tem 2+ projetos DO usuário
    const isFreePlan = profile !== null && profile.plan === 'free';
    this.limitHit.set(isFreePlan && list.length >= FREE_LIMIT);
    this.loading.set(false);
  }

  async createProject(): Promise<void> {
    if (this.creating() || this.limitHit()) return;
    this.creating.set(true);
    const project = await this.projSvc.createProject('Novo Projeto');
    this.creating.set(false);
    if (project) {
      await this.router.navigate(['/editor', project.id]);
    } else {
      this.limitHit.set(true);
    }
  }

  openProject(id: string): void {
    this.router.navigate(['/editor', id]);
  }

  async deleteProject(id: string, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    if (!confirm('Excluir este projeto? Esta ação não pode ser desfeita.')) return;
    await this.projSvc.deleteProject(id);
    await this.loadProjects();
  }

  startRename(project: Project, event: MouseEvent): void {
    event.stopPropagation();
    this.renamingId = project.id;
    this.renameVal  = project.name;
  }

  async commitRename(): Promise<void> {
    if (this.renamingId && this.renameVal.trim()) {
      await this.projSvc.renameProject(this.renamingId, this.renameVal.trim());
      await this.loadProjects();
    }
    this.renamingId = null;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  get isPro(): boolean { return this.auth.profile()?.plan === 'pro'; }

}
