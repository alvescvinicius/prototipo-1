import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EditorStateService } from '../../../core/services/editor-state.service';
import { DragDropService } from '../../../core/services/drag-drop.service';
import { ComponentType } from '../../../core/enums/component-type.enum';

import { ComponentRendererComponent } from '../../components/component-renderer/component-renderer.component';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ComponentRendererComponent
  ],
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
})
export class CanvasComponent {

  isDraggingOverCanvas = false;
  canvasZoom = 1;
  readonly ZOOM_MIN = 0.25;
  readonly ZOOM_MAX = 2;
  readonly ZOOM_STEP = 0.1;

  @ViewChild('freeCanvas')   freeCanvasRef?: ElementRef<HTMLDivElement>;
  @ViewChild('canvasWrap')   canvasWrapRef?: ElementRef<HTMLDivElement>;
  @ViewChild('renameInput')  renameInput?: ElementRef<HTMLInputElement>;

  constructor(
    public editorState: EditorStateService,
    public dragDrop:    DragDropService,
  ) {}

  // ── Zoom ─────────────────────────────────────────────────────────────────

  get zoomPct(): string {
    return Math.round(this.canvasZoom * 100) + '%';
  }

  zoomIn(): void  { this.canvasZoom = Math.min(this.ZOOM_MAX, +(this.canvasZoom + this.ZOOM_STEP).toFixed(2)); }
  zoomOut(): void { this.canvasZoom = Math.max(this.ZOOM_MIN, +(this.canvasZoom - this.ZOOM_STEP).toFixed(2)); }
  zoomReset(): void { this.canvasZoom = 1; }

  zoomFit(): void {
    const wrap  = this.canvasWrapRef?.nativeElement;
    const inner = this.freeCanvasRef?.nativeElement;
    if (!wrap || !inner) return;
    const scaleW = wrap.clientWidth  / inner.offsetWidth;
    const scaleH = wrap.clientHeight / inner.offsetHeight;
    this.canvasZoom = Math.min(scaleW, scaleH, this.ZOOM_MAX);
    this.canvasZoom = Math.max(this.canvasZoom, this.ZOOM_MIN);
  }

  @HostListener('wheel', ['$event'])
  onWheel(e: WheelEvent): void {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    if (e.deltaY < 0) this.zoomIn();
    else              this.zoomOut();
  }

  // ── Drop no canvas livre ──────────────────────────────────────────────────

  onCanvasDragOver(event: DragEvent): void {
    if (!this.dragDrop.isDragging) return;
    if (!this.dragDrop.isFromToolbox) return;
    if (this.dragDrop.toolboxType === ComponentType.SECTION) return;
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
    this.isDraggingOverCanvas = true;
  }

  onCanvasDragLeave(event: DragEvent): void {
    const related = event.relatedTarget as HTMLElement | null;
    const target  = event.currentTarget as HTMLElement;
    if (!related || !target.contains(related)) {
      this.isDraggingOverCanvas = false;
    }
  }

  onCanvasDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOverCanvas = false;

    if (!this.dragDrop.isFromToolbox || !this.dragDrop.toolboxType) {
      this.dragDrop.reset();
      return;
    }
    if (this.dragDrop.toolboxType === ComponentType.SECTION) {
      this.dragDrop.reset();
      return;
    }

    const canvas = this.freeCanvasRef?.nativeElement;
    let posX = 80;
    let posY = 80;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      posX = Math.round((event.clientX - rect.left) / this.canvasZoom);
      posY = Math.round((event.clientY - rect.top)  / this.canvasZoom);
    }

    this.editorState.addComponentToCanvas(this.dragDrop.toolboxType, posX, posY, this.dragDrop.toolboxVariant ?? undefined);
    this.dragDrop.reset();
  }

  // ── Page rename ───────────────────────────────────────────────────────────

  renamingPageId: string | null = null;
  renameValue:    string        = '';

  startRename(pageId: string, name: string, event: MouseEvent): void {
    event.stopPropagation();
    this.renamingPageId = pageId;
    this.renameValue    = name;
    setTimeout(() => this.renameInput?.nativeElement.select(), 0);
  }

  commitRename(): void {
    if (this.renamingPageId && this.renameValue.trim()) {
      this.editorState.renamePage(this.renamingPageId, this.renameValue.trim());
    }
    this.renamingPageId = null;
  }

  deletePage(pageId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.editorState.deletePage(pageId);
  }

}
