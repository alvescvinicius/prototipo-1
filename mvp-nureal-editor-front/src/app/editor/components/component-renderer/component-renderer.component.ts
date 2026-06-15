import { Component, HostBinding, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PageComponent } from '../../../core/interfaces/page-component';
import { ComponentConfig } from '../../../core/interfaces/component-config';
import { ComponentType } from '../../../core/enums/component-type.enum';

import { EditorStateService } from '../../../core/services/editor-state.service';
import { DragDropService } from '../../../core/services/drag-drop.service';

@Component({
  selector: 'app-component-renderer',
  standalone: true,
  imports: [
    CommonModule,
    ComponentRendererComponent
  ],
  templateUrl: './component-renderer.component.html',
  styleUrls: ['./component-renderer.component.scss']
})
export class ComponentRendererComponent {

  @Input({ required: true }) component!: PageComponent;
  @Input() sectionId: string = '';

  public ComponentType = ComponentType;
  isDragOver = false;

  @HostBinding('style.alignSelf')
  get hostAlignSelf(): string {
    return this.component?.config?.alignSelf || 'stretch';
  }

  @HostBinding('style.display')
  get hostDisplay(): string { return 'block'; }

  constructor(
    public editorState: EditorStateService,
    public dragDrop:    DragDropService,
  ) {}

  getItems(raw: string | undefined): string[] {
    if (!raw) return [];
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }

  getStyles(config: ComponentConfig): Record<string, string> {
    const s: Record<string, string> = {};
    if (config.color)           s['color']            = config.color;
    if (config.fontSize)        s['font-size']         = config.fontSize;
    if (config.fontWeight)      s['font-weight']       = config.fontWeight;
    if (config.textAlign)       s['text-align']        = config.textAlign;
    if (config.backgroundColor) s['background-color']  = config.backgroundColor;
    if (config.borderRadius)    s['border-radius']     = config.borderRadius;
    if (config.borderWidth)     s['border-width']      = config.borderWidth;
    if (config.borderColor)     s['border-color']      = config.borderColor;
    if (config.borderStyle)     s['border-style']      = config.borderStyle;
    if (config.paddingTop)      s['padding-top']       = config.paddingTop;
    if (config.paddingBottom)   s['padding-bottom']    = config.paddingBottom;
    if (config.paddingLeft)     s['padding-left']      = config.paddingLeft;
    if (config.paddingRight)    s['padding-right']     = config.paddingRight;
    if (config.marginTop)       s['margin-top']        = config.marginTop;
    if (config.marginBottom)    s['margin-bottom']     = config.marginBottom;
    if (config.width)           s['width']             = config.width;
    if (config.height)          s['height']            = config.height;

    // Merge custom CSS — suporta tanto declarações separadas por ; quanto quebras de linha
    if (config.customCss) {
      config.customCss.split(/;|\n/).forEach(rule => {
        const idx = rule.indexOf(':');
        if (idx > 0) {
          const prop = rule.substring(0, idx).trim();
          const val  = rule.substring(idx + 1).trim();
          if (prop && val) {
            // Converte kebab-case para camelCase para compatibilidade com ngStyle
            s[prop] = val;
          }
        }
      });
    }

    return s;
  }

  onDragStart(event: DragEvent): void {
    if (!this.sectionId) return;
    this.dragDrop.startComponent(this.component.id, this.sectionId);
    event.dataTransfer?.setData('text/plain', this.component.id);
    event.dataTransfer!.effectAllowed = 'move';
    setTimeout(() => {
      (event.target as HTMLElement).style.opacity = '0.4';
    }, 0);
  }

  onDragEnd(event: DragEvent): void {
    (event.target as HTMLElement).style.opacity = '';
    this.dragDrop.reset();
    this.isDragOver = false;
  }

  onDragOver(event: DragEvent): void {
    if (!this.dragDrop.isFromComponent) return;
    if (this.dragDrop.sourceComponentId === this.component.id) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer!.dropEffect = 'move';
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    const related = event.relatedTarget as HTMLElement | null;
    const target  = event.currentTarget as HTMLElement;
    if (!related || !target.contains(related)) {
      this.isDragOver = false;
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (!this.dragDrop.isFromComponent) return;
    if (!this.dragDrop.sourceComponentId) return;
    if (this.dragDrop.sourceComponentId === this.component.id) return;
    if (this.dragDrop.sourceSectionId !== this.sectionId) return;

    const section = this.editorState.sections.find(s => s.id === this.sectionId);
    if (!section) return;

    const targetIndex = section.pageComponents.findIndex(c => c.id === this.component.id);
    if (targetIndex === -1) return;

    this.editorState.moveComponentToIndex(
      this.dragDrop.sourceComponentId,
      this.sectionId,
      targetIndex
    );
    this.dragDrop.reset();
  }

}
