import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { EditorStateService } from '../../../core/services/editor-state.service';
import { ExportService } from '../../../core/services/export.service';
import { TotalComponentsPipe } from '../../../core/pipes/total-components.pipe';

@Component({
  selector: 'app-editor-header',
  standalone: true,
  imports: [CommonModule, FormsModule, TotalComponentsPipe],
  templateUrl: './editor-header.component.html',
  styleUrl: './editor-header.component.scss'
})
export class EditorHeaderComponent {

  public showClearConfirm  = false;
  public showExportModal   = false;
  public exportProjectName = '';

  constructor(
    public  editorState: EditorStateService,
    private router:      Router,
    private exportSvc:   ExportService
  ) {}

  // ─── Preview ─────────────────────────────────────────────────

  openPreview(): void {
    this.router.navigate(['/preview']);
  }

  // ─── Save ────────────────────────────────────────────────────

  save(): void {
    this.editorState.saveNow();
  }

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
    return `Salvo às ${hh}:${mm}`;
  }

  // ─── Clear ───────────────────────────────────────────────────

  confirmClear(): void  { this.showClearConfirm = true;  }
  cancelClear(): void   { this.showClearConfirm = false; }

  clearProject(): void {
    this.editorState.clearProject();
    this.showClearConfirm = false;
  }

  // ─── Export ──────────────────────────────────────────────────

  openExportModal(): void {
    this.exportProjectName = this.editorState.projectName;
    this.showExportModal   = true;
  }

  closeExportModal(): void {
    this.showExportModal = false;
  }

  doExport(): void {
    this.exportSvc.exportHTML(
      this.editorState.sections,
      this.exportProjectName || this.editorState.projectName
    );
    this.showExportModal = false;
  }

  // ─── Keyboard ────────────────────────────────────────────────

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const ctrl = event.ctrlKey || event.metaKey;

    if (ctrl && event.key === 's') {
      event.preventDefault();
      this.save();
    }

    if (ctrl && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.editorState.undo();
    }

    if (ctrl && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
      event.preventDefault();
      this.editorState.redo();
    }

    if (event.key === 'Escape' && this.showExportModal) {
      this.closeExportModal();
    }
  }

}
