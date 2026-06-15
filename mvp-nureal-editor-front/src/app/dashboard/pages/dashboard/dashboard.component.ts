import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService }           from '../../../core/services/auth.service';
import { ProjectService }        from '../../../core/services/project.service';
import { FormSubmissionsService, FormSubmission } from '../../../core/services/form-submissions.service';
import { Project }               from '../../../core/interfaces/project';

const FREE_LIMIT = 2;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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

  // Submissions modal
  showSubmissions    = false;
  submissionsProject: Project | null = null;
  submissions:        FormSubmission[] = [];
  submissionsLoading = false;

  constructor(
    public  auth:    AuthService,
    private projSvc: ProjectService,
    private formSvc: FormSubmissionsService,
    private router:  Router
  ) {}

  async ngOnInit(): Promise<void> {
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
    if (!this.renamingId || !this.renameVal.trim()) {
      this.renamingId = null;
      return;
    }
    await this.projSvc.renameProject(this.renamingId, this.renameVal.trim());
    await this.loadProjects();
    this.renamingId = null;
  }

  get isPro(): boolean {
    return this.auth.profile()?.plan === 'pro';
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatDateTime(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('pt-BR');
  }

  // ── Submissions ────────────────────────────────────────

  async openSubmissions(project: Project, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    this.submissionsProject = project;
    this.showSubmissions    = true;
    this.submissionsLoading = true;
    this.submissions        = await this.formSvc.listByProject(project.id);
    this.submissionsLoading = false;
  }

  closeSubmissions(): void {
    this.showSubmissions    = false;
    this.submissionsProject = null;
    this.submissions        = [];
  }

  async deleteSubmission(id: string): Promise<void> {
    if (!confirm('Remover esta submissão?')) return;
    await this.formSvc.deleteSubmission(id);
    if (this.submissionsProject) {
      this.submissions = await this.formSvc.listByProject(this.submissionsProject.id);
    }
  }

  submissionKeys(data: Record<string, string>): string[] {
    return Object.keys(data);
  }

  exportCsv(): void {
    if (!this.submissions.length) return;
    const allKeys = Array.from(
      new Set(this.submissions.flatMap(s => Object.keys(s.data)))
    );
    const header  = ['Data', ...allKeys].join(',');
    const rows    = this.submissions.map(s =>
      [this.formatDateTime(s.created_at), ...allKeys.map(k => `"${(s.data[k] ?? '').replace(/"/g, '""')}"`)]
        .join(',')
    );
    const csv  = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `submissoes-${this.submissionsProject?.name ?? 'projeto'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
