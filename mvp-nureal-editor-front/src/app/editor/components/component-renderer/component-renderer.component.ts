import { Component, ElementRef, HostBinding, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PageComponent } from '../../../core/interfaces/page-component';
import { ComponentConfig } from '../../../core/interfaces/component-config';
import { ComponentType } from '../../../core/enums/component-type.enum';

import { EditorStateService } from '../../../core/services/editor-state.service';
import { DragDropService } from '../../../core/services/drag-drop.service';
import { NurealObjectsService } from '../../../core/services/nureal-objects.service';
import { ObjectField } from '../../../core/interfaces/nureal-object';

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
  contextMenu = { visible: false, x: 0, y: 0 };

  // carousel active slide per component id
  activeSlide: Record<string, number> = {};

  getActiveSlide(id: string): number {
    return this.activeSlide[id] ?? 0;
  }

  prevSlide(id: string, total: number, e: MouseEvent): void {
    e.stopPropagation();
    this.activeSlide[id] = (this.getActiveSlide(id) - 1 + total) % total;
  }

  nextSlide(id: string, total: number, e: MouseEvent): void {
    e.stopPropagation();
    this.activeSlide[id] = (this.getActiveSlide(id) + 1) % total;
  }

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

  /** Exibe borda fantasma quando outro componente está selecionado */
  @HostBinding('class.ghost-outline')
  get isGhostOutline(): boolean {
    return !!this.editorState.selectedNode && !this.editorState.isSelected(this.component);
  }

  @HostBinding('style.position')
  get hostPosition(): string {
    if (this.component?.config?.position) return this.component.config.position;
    return this.component?.config?.absolutePos ? 'absolute' : '';
  }

  @HostBinding('style.left')
  get hostLeft(): string {
    if (this.component?.config?.left) return this.component.config.left;
    if (!this.component?.config?.absolutePos) return '';
    return (this.component.config.posX ?? 0) + 'px';
  }

  @HostBinding('style.top')
  get hostTop(): string {
    if (this.component?.config?.top) return this.component.config.top;
    if (!this.component?.config?.absolutePos) return '';
    return (this.component.config.posY ?? 0) + 'px';
  }

  @HostBinding('style.right')
  get hostRight(): string {
    return this.component?.config?.right || '';
  }

  @HostBinding('style.bottom')
  get hostBottom(): string {
    return this.component?.config?.bottom || '';
  }

  @HostBinding('style.cursor')
  get hostCursor(): string {
    if (this.component?.config?.cursor) return this.component.config.cursor;
    if (this.component?.config?.absolutePos && this.editorState.isSelected(this.component)) {
      return 'grab';
    }
    return '';
  }

  @HostBinding('style.zIndex')
  get hostZIndex(): string {
    const z = this.component?.config?.zIndex;
    if (z != null) return String(z);
    return '';
  }

  @HostBinding('style.alignSelf')
  get hostAlignSelf(): string {
    if (this.component?.config?.absolutePos) return 'auto';
    if (this.component?.config?.alignSelf) return this.component.config.alignSelf;
    const w = this.component?.config?.width;
    if (w && w !== '100%' && w !== 'auto') return 'flex-start';
    return 'stretch';
  }

  @HostBinding('style.flexGrow')
  get hostFlexGrow(): string {
    const g = this.component?.config?.flexGrow;
    return g != null ? String(g) : '';
  }

  @HostBinding('style.flexShrink')
  get hostFlexShrink(): string {
    const s = this.component?.config?.flexShrink;
    return s != null ? String(s) : '';
  }

  @HostBinding('style.flexBasis')
  get hostFlexBasis(): string {
    return this.component?.config?.flexBasis || '';
  }

  @HostBinding('style.order')
  get hostOrder(): string {
    const o = this.component?.config?.order;
    return o != null ? String(o) : '';
  }

  @HostBinding('style.mixBlendMode')
  get hostMixBlendMode(): string {
    return this.component?.config?.mixBlendMode || '';
  }

  @HostBinding('style.overflow')
  get hostOverflow(): string {
    return this.component?.config?.overflow || '';
  }

  @HostBinding('style.width')
  get hostWidth(): string {
    return this.component?.config?.width || '';
  }

  @HostBinding('style.height')
  get hostHeight(): string {
    return this.component?.config?.height || '';
  }

  @HostBinding('style.display')
  get hostDisplay(): string {
    if (this.component?.config?.display) return this.component.config.display;
    // Em modo absoluto, display:inline-block deixa o elemento no tamanho do conteúdo
    return this.component?.config?.absolutePos ? 'inline-block' : 'block';
  }

  constructor(
    public editorState: EditorStateService,
    public dragDrop:    DragDropService,
    public objectsSvc:  NurealObjectsService,
    private elRef: ElementRef<HTMLElement>
  ) {}

  ngOnDestroy(): void {
    this._stopResize();
    this._stopMove();
  }

  // ── Posição livre (drag-to-position) ─────────────────────────────────────

  private _moving    = false;
  private _moveStartX = 0;
  private _moveStartY = 0;
  private _moveOriginX = 0;
  private _moveOriginY = 0;

  private _onMoveMove = (e: MouseEvent) => this._doMove(e);
  private _onMoveUp   = ()              => this._stopMove();

  // ── Context Menu ─────────────────────────────────────────

  private _closeCtxBound = () => this.closeContextMenu();

  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.editorState.selectNode(this.component, { x: event.clientX, y: event.clientY });
    const host  = (this.elRef.nativeElement as HTMLElement).getBoundingClientRect();
    this.contextMenu = {
      visible: true,
      x: event.clientX - host.left,
      y: event.clientY - host.top,
    };
    // Close on next click anywhere
    setTimeout(() => document.addEventListener('click', this._closeCtxBound, { once: true }), 0);
  }

  closeContextMenu(): void {
    this.contextMenu = { visible: false, x: 0, y: 0 };
  }

  ctxDuplicate(): void {
    this.closeContextMenu();
    this.editorState.duplicateComponent(this.component.id);
  }

  ctxCopy(): void {
    this.closeContextMenu();
    this.editorState.copyComponent(this.component.id);
  }

  ctxPaste(): void {
    this.closeContextMenu();
    this.editorState.pasteComponent();
  }

  ctxDelete(): void {
    this.closeContextMenu();
    this.editorState.deleteComponent(this.component.id);
  }

  onCardClick(event: MouseEvent): void {
    event.stopPropagation();
    this.closeContextMenu();
    this.editorState.selectNode(this.component, { x: event.clientX, y: event.clientY });
  }

  onCardDblclick(event: MouseEvent): void {
    event.stopPropagation();
    this.editorState.selectNode(this.component, { x: event.clientX, y: event.clientY });
    this.editorState.propertiesModalOpen = true;
  }

  onCardMousedown(event: MouseEvent): void {
    // Apenas componentes selecionados em modo absoluto
    if (!this.editorState.isSelected(this.component)) return;
    if (!this.component?.config?.absolutePos) return;
    // Não mover quando clicar em botões de ação, resize handles ou move-handle
    const target = event.target as HTMLElement;
    if (target.closest('.component-actions')) return;
    if (target.closest('.resize-handle')) return;
    this.startMove(event);
  }

  startMove(event: MouseEvent): void {
    if (!this.component?.config?.absolutePos) return;
    event.preventDefault();
    event.stopPropagation();

    // Snapshot ANTES de mover: garante que Ctrl+Z volta ao estado pré-drag
    this.editorState.snapshotForMove();

    this._moving     = true;
    this._moveStartX = event.clientX;
    this._moveStartY = event.clientY;
    this._moveOriginX = this.component.config.posX ?? 0;
    this._moveOriginY = this.component.config.posY ?? 0;

    document.addEventListener('mousemove', this._onMoveMove);
    document.addEventListener('mouseup',   this._onMoveUp);
    document.body.style.cursor = 'grabbing';
  }

  private _doMove(e: MouseEvent): void {
    if (!this._moving || !this.component) return;
    const dx = e.clientX - this._moveStartX;
    const dy = e.clientY - this._moveStartY;
    this.component.config.posX = Math.round(this._moveOriginX + dx);
    this.component.config.posY = Math.round(this._moveOriginY + dy);
  }

  private _stopMove(): void {
    if (!this._moving) return;
    this._moving = false;
    document.removeEventListener('mousemove', this._onMoveMove);
    document.removeEventListener('mouseup',   this._onMoveUp);
    document.body.style.cursor = '';
    // Agenda auto-save sem criar novo snapshot (o snapshot já foi feito no startMove)
    this.editorState['_scheduleAutoSave']?.();
  }

  getObjectFields(objectName: string | undefined): ObjectField[] {
    if (!objectName) return [];
    return this.objectsSvc.getByName(objectName)?.fields ?? [];
  }

  getItems(raw: string | undefined): string[] {
    if (!raw) return [];
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }

  getStyles(config: ComponentConfig): Record<string, string> {
    const s: Record<string, string> = {};
    // Typography
    if (config.color)           s['color']          = config.color;
    if (config.fontSize)        s['font-size']      = config.fontSize;
    if (config.fontWeight)      s['font-weight']    = config.fontWeight;
    if (config.textAlign)       s['text-align']     = config.textAlign;
    if (config.letterSpacing)   s['letter-spacing'] = config.letterSpacing;
    if (config.lineHeight)      s['line-height']    = config.lineHeight;
    // Visual
    if (config.backgroundColor) s['background-color'] = config.backgroundColor;
    if (config.borderRadius)    s['border-radius']    = config.borderRadius;
    if (config.borderWidth)     s['border-width']     = config.borderWidth;
    if (config.borderColor)     s['border-color']     = config.borderColor;
    if (config.borderStyle)     s['border-style']     = config.borderStyle;
    if (config.opacity != null) s['opacity']          = String(config.opacity);
    if (config.boxShadow)       s['box-shadow']       = config.boxShadow;
    // Spacing
    if (config.paddingTop)    s['padding-top']    = config.paddingTop;
    if (config.paddingBottom) s['padding-bottom'] = config.paddingBottom;
    if (config.paddingLeft)   s['padding-left']   = config.paddingLeft;
    if (config.paddingRight)  s['padding-right']  = config.paddingRight;
    if (config.marginTop)     s['margin-top']     = config.marginTop;
    if (config.marginBottom)  s['margin-bottom']  = config.marginBottom;
    if (config.marginLeft)    s['margin-left']    = config.marginLeft;
    if (config.marginRight)   s['margin-right']   = config.marginRight;
    // Dimensions
    if (config.width)    s['width']     = config.width;
    if (config.height)   s['height']    = config.height;
    if (config.maxWidth) s['max-width'] = config.maxWidth;
    if (config.minWidth) s['min-width'] = config.minWidth;
    // Flex layout
    if (config.flexDirection)  s['flex-direction']  = config.flexDirection;
    if (config.alignItems)     s['align-items']     = config.alignItems;
    if (config.justifyContent) s['justify-content'] = config.justifyContent;
    if (config.gap)            s['gap']             = config.gap;
    if (config.flexWrap)       s['flex-wrap']       = config.flexWrap;
    // Custom CSS (highest priority — always last)
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

  getContainerStyles(config: ComponentConfig): Record<string, string> {
    const s = this.getStyles(config);
    s['display'] = 'flex';
    if (!s['flex-direction']) s['flex-direction'] = 'column';
    return s;
  }

  getGridStyles(config: ComponentConfig): Record<string, string> {
    const s = this.getStyles(config);
    const cols = parseInt(config.columns || '3', 10) || 3;
    s['display'] = 'grid';
    s['grid-template-columns'] = `repeat(${cols}, 1fr)`;
    s['gap'] = s['gap'] || '16px';
    return s;
  }

  // ── Resize ────────────────────────────────────────────────

  startResize(event: MouseEvent, dir: ResizeDir): void {
    event.preventDefault();
    event.stopPropagation();

    const hostEl   = this.elRef.nativeElement;
    const parentEl = hostEl.parentElement;
    const cardEl   = hostEl.querySelector('.component-card') as HTMLElement || hostEl;

    // Snapshot ANTES de redimensionar: garante que Ctrl+Z volta ao tamanho anterior
    this.editorState.snapshotForMove();

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

  private get _isContainer(): boolean {
    return this.component.type === ComponentType.CONTAINER ||
           this.component.type === ComponentType.GRID ||
           this.component.type === ComponentType.CAROUSEL;
  }

  onDragOver(event: DragEvent): void {
    // Aceita: reordenação entre componentes
    if (this.dragDrop.isFromComponent) {
      if (this.dragDrop.sourceComponentId === this.component.id) return;
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer!.dropEffect = 'move';
      this.isDragOver = true;
      return;
    }
    // Aceita: toolbox → container/grid (exceto SECTION)
    if (this.dragDrop.isFromToolbox && this._isContainer &&
        this.dragDrop.toolboxType !== ComponentType.SECTION) {
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer!.dropEffect = 'copy';
      this.isDragOver = true;
    }
  }

  onDragLeave(event: DragEvent): void {
    const related = event.relatedTarget as HTMLElement | null;
    const target  = event.currentTarget as HTMLElement;
    if (!related || !target.contains(related)) this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;

    // Toolbox → container/grid/carousel: só este componente trata se for container
    if (this.dragDrop.isFromToolbox && this.dragDrop.toolboxType) {
      if (this._isContainer) {
        event.stopPropagation();
        if (this.dragDrop.toolboxType !== ComponentType.SECTION) {
          const v = this.dragDrop.toolboxVariant ?? undefined;
          if (this.component.type === ComponentType.CAROUSEL) {
            const slideIdx = this.getActiveSlide(this.component.id);
            const slide = this.component.children[slideIdx];
            if (slide) this.editorState.addComponentToContainer(slide.id, this.dragDrop.toolboxType, v);
          } else {
            this.editorState.addComponentToContainer(this.component.id, this.dragDrop.toolboxType, v);
          }
        }
        this.dragDrop.reset();
      }
      // Se não é container, deixa o evento borbulhar para o container pai
      return;
    }

    if (!this.dragDrop.isFromComponent) return;
    if (!this.dragDrop.sourceComponentId) return;
    if (this.dragDrop.sourceComponentId === this.component.id) return;

    // Componente existente → mover para dentro de container/grid
    if (this._isContainer) {
      event.stopPropagation();
      this.editorState.moveComponentToContainer(
        this.dragDrop.sourceComponentId,
        this.component.id,
      );
      this.dragDrop.reset();
    }
  }

}
