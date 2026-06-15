import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EditorStateService } from '../../../core/services/editor-state.service';
import { DragDropService } from '../../../core/services/drag-drop.service';
import { ComponentType } from '../../../core/enums/component-type.enum';
import { ComponentConfig } from '../../../core/interfaces/component-config';
import { Section } from '../../../core/interfaces/section';

import { ComponentRendererComponent } from '../../components/component-renderer/component-renderer.component';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [
    CommonModule,
    ComponentRendererComponent
  ],
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
})
export class CanvasComponent {

  draggingOverSectionId: string | null = null;
  isDraggingOverCanvas = false;

  constructor(
    public editorState: EditorStateService,
    public dragDrop:    DragDropService,
  ) {}

  // ── Estilos da section ────────────────────────────────────────────────────

  getStyles(config: ComponentConfig): Record<string, string> {
    const s: Record<string, string> = {};
    if (config.backgroundColor) s['background-color'] = config.backgroundColor;
    if (config.paddingTop)      s['padding-top']      = config.paddingTop;
    if (config.paddingBottom)   s['padding-bottom']   = config.paddingBottom;
    if (config.paddingLeft)     s['padding-left']     = config.paddingLeft;
    if (config.paddingRight)    s['padding-right']    = config.paddingRight;
    if (config.width)           s['max-width']        = config.width;
    if (config.height)          s['min-height']       = config.height;
    if (config.borderWidth)     s['border-width']     = config.borderWidth;
    if (config.borderStyle)     s['border-style']     = config.borderStyle;
    if (config.borderColor)     s['border-color']     = config.borderColor;
    return s;
  }

  // ── Drop em sections (componentes da toolbox) ────────────────────────────

  onSectionDragOver(event: DragEvent, section: Section): void {
    if (!this.dragDrop.isDragging) return;
    if (this.dragDrop.toolboxType === ComponentType.SECTION) return; // section não cabe dentro de section
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer!.dropEffect = 'copy';
    this.draggingOverSectionId = section.id;
    this.isDraggingOverCanvas = false;
  }

  onSectionDragLeave(event: DragEvent, section: Section): void {
    const related = event.relatedTarget as HTMLElement | null;
    const currentTarget = event.currentTarget as HTMLElement;
    if (!related || !currentTarget.contains(related)) {
      if (this.draggingOverSectionId === section.id) {
        this.draggingOverSectionId = null;
      }
    }
  }

  onSectionDrop(event: DragEvent, section: Section): void {
    event.preventDefault();
    event.stopPropagation();
    this.draggingOverSectionId = null;

    if (this.dragDrop.isFromToolbox && this.dragDrop.toolboxType) {
      if (this.dragDrop.toolboxType !== ComponentType.SECTION) {
        this.editorState.addComponentToSection(section.id, this.dragDrop.toolboxType);
      }
    }
    this.dragDrop.reset();
  }

  // ── Drop no canvas livre (para criar section) ────────────────────────────

  onCanvasDragOver(event: DragEvent): void {
    if (!this.dragDrop.isDragging) return;
    if (this.dragDrop.toolboxType !== ComponentType.SECTION) return;
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

    if (this.dragDrop.isFromToolbox && this.dragDrop.toolboxType === ComponentType.SECTION) {
      this.editorState.addSection();
    }
    this.dragDrop.reset();
  }

}
