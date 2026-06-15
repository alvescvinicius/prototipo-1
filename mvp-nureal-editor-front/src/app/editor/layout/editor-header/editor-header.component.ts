import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { EditorStateService }  from '../../../core/services/editor-state.service';
import { ExportService }       from '../../../core/services/export.service';
import { PublishService, PublishResult } from '../../../core/services/publish.service';
import { AuthService }         from '../../../core/services/auth.service';
import { TotalComponentsPipe } from '../../../core/pipes/total-components.pipe';

@Component({
  selector: 'app-editor-header',
  standalone: true,
  imports: [CommonModule, FormsModule, TotalComponentsPipe],
  templateUrl: './editor-header.component.html',
  styleUrl: './editor-header.component.scss'
})
export class EditorHeaderComponent {

  showClearConfirm  = false;
  showExportModal   = false;
  showPublishModal  = false;
  showUserMenu      = false;
  exportProjectName = '';
  publishing        = false;
  publishResult: PublishResult | null = null;
  publishError   = '';

  constructor(
    public  editorState: EditorStateService,
    private router:      Router,
    private exportSvc:   ExportService,
    private publishSvc:  PublishService,
    public  auth:        AuthService
  ) {}

  // ─── Preview ─────────────────────────────────────────────

  openPreview(): void { this.router.navigate(['/preview']); }

  // ─── Dashboard ───────────────────────────────────────────

  goToDashboard(): void { this.router.navigate(['/dashboard']); }

  // ─── Save ────────────────────────────────────────────────

  save(): void { this.editorState.saveNow(); }

  get saveLabel(): string {
    if (this.editorState.isDirty)     return 'Salvar*';
    if (this.editorState.lastSavedAt) return 'Salvo ✓';
    return 'Salvar';
  }

  get lastSavedLabel(): string {
    const d = this.editorState.lastSavedAt;
    if (!d) return '';
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return 'Salvo às ' + hh + ':' + mm;
  }

  // ─── Clear ───────────────────────────────────────────────

  confirmClear(): void { this.showClearConfirm = true;  }
  cancelClear(): void  { this.showClearConfirm = false; }
  clearProject(): void { this.editorState.clearProject(); this.showClearConfirm = false; }

  // ─── Export ──────────────────────────────────────────────

  openExportModal(): void {
    this.exportProjectName = this.editorState.projectName;
    this.showExportModal   = true;
  }
  closeExportModal(): void { this.showExportModal = false; }

  doExport(): void {
    this.exportSvc.exportHTML(
      this.editorState.sections,
      this.exportProjectName || this.editorState.projectName
    );
    this.showExportModal = false;
  }

  // ─── Publish ─────────────────────────────────────────────

  openPublishModal(): void {
    this.publishResult   = null;
    this.showPublishModal = true;
  }
  closePublishModal(): void { this.showPublishModal = false; }

  async doPublish(): Promise<void> {
    if (!this.editorState.projectId) return;
    this.publishing    = true;
    this.publishError  = '';
    this.publishResult = null;
    try {
      await this.editorState.saveNow(); // persiste localmente e no Supabase
      const result = await this.publishSvc.publishProject(
        this.editorState.projectId,
        this.editorState.projectName,
        this.editorState.pages
      );
      if (result) {
        this.publishResult = result;
        if (result.pageUrls.length > 0) {
          window.open(this.fullUrl(result.pageUrls[0].url), '_blank');
        }
      } else {
        this.publishError = 'Falha ao publicar. Verifique se você está autenticado e tente novamente.';
      }
    } catch (e: any) {
      this.publishError = e?.message ?? 'Erro inesperado ao publicar.';
      console.error('[doPublish]', e);
    } finally {
      this.publishing = false;
    }
  }

  fullUrl(path: string): string {
    return window.location.origin + path;
  }

  copyUrl(url: string): void {
    navigator.clipboard.writeText(this.fullUrl(url));
  }

  // ─── User menu ───────────────────────────────────────────

  toggleUserMenu(): void { this.showUserMenu = !this.showUserMenu; }

  async logout(): Promise<void> {
    this.showUserMenu = false;
    await this.auth.logout();
  }

  // ─── Keyboard ────────────────────────────────────────────

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const ctrl = event.ctrlKey || event.metaKey;

    if (ctrl && event.key === 's') { event.preventDefault(); this.save(); }
    if (ctrl && event.key === 'z' && !event.shiftKey) { event.preventDefault(); this.editorState.undo(); }
    if (ctrl && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) { event.preventDefault(); this.editorState.redo(); }
    if (ctrl && event.key === 'c' && !event.shiftKey) {
      const id = (this.editorState.selectedNode as any)?.id;
      if (id) this.editorState.copyComponent(id);
    }
    if (ctrl && event.key === 'v' && !event.shiftKey) { event.preventDefault(); this.editorState.pasteComponent(); }

    if (event.key === 'Escape') {
      this.showExportModal  = false;
      this.showPublishModal = false;
      this.showUserMenu     = false;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      const active  = document.activeElement as HTMLElement;
      const isInput = active && (
        active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT'
      );
      if (!isInput && !this.showExportModal && !this.showPublishModal
          && this.editorState.selectedNode && 'children' in this.editorState.selectedNode) {
        this.editorState.deleteComponent(this.editorState.selectedNode!.id);
      }
    }
  }

}
