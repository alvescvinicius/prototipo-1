import { Component, ElementRef, HostBinding, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PageComponent } from '../../../core/interfaces/page-component';
import { ComponentConfig } from '../../../core/interfaces/component-config';
import { ComponentType } from '../../../core/enums/component-type.enum';

import { EditorStateService } from '../../../core/services/editor-state.service';
import { DragDropService } from '../../../core/services/drag-drop.service';

type ResizeDir = 'e' | 's' | 'se' | 'w' | 'n';

@Component({
  selector: 'app-component-renderer',
  standalone: true,
  imports: [ CommonModule, ComponentRendererComponent ],
  templateUrl: './component-renderer.component.html',
  styleUrls: ['./component-renderer.component.scss']
})
export class ComponentRendererComponent implements OnDestroy {

  @Input({ required: true }) component!: PageComponent;
  @Input() sectionId: string = '';

  public ComponentType = ComponentType;
  isDragOver = false;

  // ── Resize state ──────────────────────────────────────────
  private _resizing   = false;
  private _resizeDir: ResizeDir = 'se';
  private _startX     = 0;
  private _startY     = 0;
  private _startW     = 0;
  private _startH     = 0;
  private _parentW    = 0;
  private _parentH    = 0;

  private _onMouseMove = (e: MouseEvent) => this._doResize(e);
  private _onMouseUp   = ()              => this._stopResize();

  @HostBinding('style.alignSelf')
  get hostAlignSelf(): string {
    return this.component?.config?.alignSelf || 'stretch';
  }

  @HostBinding('style.display')
  get hostDisplay(): string { return 'block'; }

  constructor(
    public editorState: EditorStateService,
    public dragDrop:    DragDropService,
    private elRef: ElementRef<HTMLElement>
  ) {}

  ngOnDestroy(): void { this._stopResize(); }

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
    if (config.customCss) {
      config.customCss.split(/;|\n/).forEach(rule => {
        const idx = rule.indexOf(':');
        if (idx > 0) {
          const prop = rule.substring(0, idx).trim();
          const val  = rule.substring(idx + 1).trim();
          if (prop && val) s[prop] = val;
        }
      });
    }
    return s;
  }

  // ── Resize ────────────────────────────────────────────────

  startResize(event: MouseEvent, dir: ResizeDir): void {
    event.preventDefault();
    event.stopPropagation();

    const hostEl   = this.elRef.nativeElement;
    const parentEl = hostEl.parentElement;
    const cardEl   = hostEl.querySelector('.component-card') as HTMLElement || hostEl;

    this._resizing  = true;
    this._resizeDir = dir;
    this._startX    = event.clientX;
    this._startY    = event.clientY;
    this._startW    = cardEl.offsetWidth;
    this._startH    = cardEl.offsetHeight;
    this._parentW   = parentEl ? parentEl.offsetWidth  : this._startW;
    this._parentH   = parentEl ? parentEl.offsetHeight : this._startH;

    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mouseup',   this._onMouseUp);
    document.body.style.cursor     = this._cursor(dir);
    document.body.style.userSelect = 'none';
  }

  private _doResize(e: MouseEvent): void {
    if (!this._resizing) return;
    const dx = e.clientX - this._startX;
    const dy = e.clientY - this._startY;
    const d  = this._resizeDir;

    // Largura (E ou SE): snap para 100% quando chegar a 95% do pai
    if (d === 'e' || d === 'se') {
      const newW = Math.max(20, this._startW + dx);
      if (newW >= this._parentW * 0.95) {
        this.component.config.width = '100%';
      } else {
        this.component.config.width = `${Math.round(newW)}px`;
      }
    }

    // Largura (W): reduz pelo lado esquerdo
    if (d === 'w') {
      const newW = Math.max(20, this._startW - dx);
      if (newW >= this._parentW * 0.95) {
        this.component.config.width = '100%';
      } else {
        this.component.config.width = `${Math.round(newW)}px`;
      }
    }

    // Altura (S ou SE)
    if (d === 's' || d === 'se') {
      const newH = Math.max(10, this._startH + dy);
      if (this._parentH > 0 && newH >= this._parentH * 0.95) {
        this.component.config.height = '100%';
      } else {
        this.component.config.height = `${Math.round(newH)}px`;
      }
    }

    // Altura (N): reduz pelo topo
    if (d === 'n') {
      const newH = Math.max(10, this._startH - dy);
      this.component.config.height = `${Math.round(newH)}px`;
    }
  }

  private _stopResize(): void {
    if (!this._resizing) return;
    this._resizing = false;
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup',   this._onMouseUp);
    document.body.style.cursor     = '';
    document.body.style.userSelect = '';
    (this.editorState as any)['_scheduleAutoSave']?.();
  }

  private _cursor(dir: ResizeDir): string {
    const map: Record<ResizeDir, string> = {
      e: 'ew-resize', w: 'ew-resize',
      s: 'ns-resize', n: 'ns-resize',
      se: 'nwse-resize'
    };
    return map[dir];
  }

  // ── Drag & Drop ───────────────────────────────────────────

  onDragStart(event: DragEvent): void {
    if (!this.sectionId || this._resizing) return;
    this.dragDrop.startComponent(this.component.id, this.sectionId);
    event.dataTransfer?.setData('text/plain', this.component.id);
    event.dataTransfer!.effectAllowed = 'move';
    setTimeout(() => { (event.target as HTMLElement).style.opacity = '0.4'; }, 0);
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
    if (!related || !target.contains(related)) this.isDragOver = false;
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
    this.editorState.moveComponentToIndex(this.dragDrop.sourceComponentId, this.sectionId, targetIndex);
    this.dragDrop.reset();
  }
}
