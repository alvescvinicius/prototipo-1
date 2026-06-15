import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { EditorStateService }  from '../../../core/services/editor-state.service';
import { ExportService }       from '../../../core/services/export.service';
import { PublishService }      from '../../../core/services/publish.service';
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
  publishedUrl      = '';

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
    this.publishedUrl     = '';
    this.showPublishModal = true;
  }
  closePublishModal(): void { this.showPublishModal = false; }

  async doPublish(): Promise<void> {
    if (!this.editorState.projectId) return;
    this.publishing = true;
    const url = await this.publishSvc.publishProject(
      this.editorState.projectId,
      this.editorState.projectName,
      this.editorState.sections
    );
    this.publishedUrl = url ?? '';
    this.publishing   = false;
  }

  copyPublishedUrl(): void {
    navigator.clipboard.writeText(this.publishedUrl);
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
    if (ctrl && event.key === 'c' && !event.shiftKey) { this.editorState.copyComponent(); }
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
        this.editorState.deleteComponent((this.editorState.selectedNode as any).id);
      }
    }
  }

}
