import { Component, HostListener } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { Router }        from '@angular/router';
import { EditorStateService }  from '../../../core/services/editor-state.service';
import { ExportService }       from '../../../core/services/export.service';
import { PublishService, PublishResult } from '../../../core/services/publish.service';
import { AuthService }         from '../../../core/services/auth.service';
import { TotalComponentsPipe } from '../../../core/pipes/total-components.pipe';

@Component({
  selector: 'app-editor-left-rail',
  standalone: true,
  imports: [CommonModule, FormsModule, TotalComponentsPipe],
  templateUrl: './editor-left-rail.component.html',
  styleUrls: ['./editor-left-rail.component.scss'],
})
export class EditorLeftRailComponent {

  expanded       = false;
  showPublish    = false;
  showExport     = false;
  showUserMenu   = false;
  showClearConfirm = false;
  publishing     = false;
  publishResult: PublishResult | null = null;
  publishError   = '';
  exportName     = '';

  constructor(
    public  editorState: EditorStateService,
    public  auth:        AuthService,
    private router:      Router,
    private exportSvc:   ExportService,
    private publishSvc:  PublishService,
  ) {}

  toggle(): void { this.expanded = !this.expanded; }

  goToDashboard(): void { this.router.navigate(['/dashboard']); }
  openPreview():   void { this.router.navigate(['/preview']); }
  save():          void { this.editorState.saveNow(); }

  get isDirty(): boolean { return this.editorState.isDirty; }

  // ── Publish ──────────────────────────────────────────────
  openPublishModal(): void { this.publishResult = null; this.publishError = ''; this.showPublish = true; }
  closePublishModal(): void { this.showPublish = false; }

  async doPublish(): Promise<void> {
    if (!this.editorState.projectId) return;
    this.publishing   = true;
    this.publishError = '';
    try {
      await this.editorState.saveNow();
      const r = await this.publishSvc.publishProject(
        this.editorState.projectId, this.editorState.projectName, this.editorState.pages);
      if (r) { this.publishResult = r; }
      else    { this.publishError  = 'Falha ao publicar.'; }
    } catch (e: any) { this.publishError = e?.message ?? 'Erro inesperado.'; }
    finally           { this.publishing = false; }
  }

  fullUrl(path: string): string { return window.location.origin + path; }
  copyUrl(url: string):  void   { navigator.clipboard.writeText(this.fullUrl(url)); }

  // ── Export ───────────────────────────────────────────────
  openExportModal(): void { this.exportName = this.editorState.projectName; this.showExport = true; }
  closeExportModal(): void { this.showExport = false; }
  doExport(): void {
    this.exportSvc.exportHTML(this.editorState.sections, this.exportName || this.editorState.projectName);
    this.showExport = false;
  }

  // ── Clear ────────────────────────────────────────────────
  clearProject(): void { this.editorState.clearProject(); this.showClearConfirm = false; }

  // ── Keyboard shortcuts ───────────────────────────────────
  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    const ctrl    = e.ctrlKey || e.metaKey;
    const active  = document.activeElement as HTMLElement;
    const isInput = active && (
      active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' ||
      active.tagName === 'SELECT' || active.isContentEditable);

    if (ctrl && e.key === 's') { e.preventDefault(); this.save(); return; }
    if (!isInput) {
      if (ctrl && e.key === 'z' && !e.shiftKey)  { e.preventDefault(); this.editorState.undo(); return; }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); this.editorState.redo(); return; }
      if (ctrl && e.key === 'c') { const id = (this.editorState.selectedNode as any)?.id; if (id) this.editorState.copyComponent(id); return; }
      if (ctrl && e.key === 'v') { e.preventDefault(); this.editorState.pasteComponent(); return; }
      if (ctrl && e.key === 'd') {
        e.preventDefault();
        const id = (this.editorState.selectedNode as any)?.id;
        if (id && 'children' in this.editorState.selectedNode!) this.editorState.duplicateComponent(id);
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !this.showPublish && !this.showExport) {
        if (this.editorState.selectedNode && 'children' in this.editorState.selectedNode) {
          this.editorState.deleteComponent(this.editorState.selectedNode!.id);
        }
      }
    }
    if (e.key === 'Escape') { this.showPublish = this.showExport = this.showUserMenu = false; }
  }
}
