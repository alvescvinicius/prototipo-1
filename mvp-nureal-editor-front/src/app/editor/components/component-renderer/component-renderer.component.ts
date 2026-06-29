import { Component, ElementRef, HostBinding, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PageComponent } from '../../../core/interfaces/page-component';
import { ComponentConfig } from '../../../core/interfaces/component-config';
import { ComponentType } from '../../../core/enums/component-type.enum';

import { EditorStateService } from '../../../core/services/editor-state.service';
import { DragDropService } from '../../../core/services/drag-drop.service';
import { NurealObjectsService } from '../../../core/services/nureal-objects.service';
import { ObjectField } from '../../../core/interfaces/nureal-object';
import { buildStyles, buildContainerStyles, buildGridStyles, splitItems } from '../../../core/utils/style-builder';

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

  private _rafMove:   number | null = null;
  private _rafResize: number | null = null;

  private _onMouseMove = (e: MouseEvent) => {
    if (this._rafResize !== null) return;
    this._rafResize = requestAnimationFrame(() => {
      this._rafResize = null;
      this._doResize(e);
    });
  };
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
    // Specific width (not 100% or auto): do not stretch on cross-axis.
    if (w && w !== '100%' && w !== 'auto') return 'flex-start';
    // No explicit config: let parent align-items decide.
    // MENU children (align-items:center) center; CONTAINER children stretch.
    return '';
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
    if (this.component?.config?.absolutePos) return 'inline-block';
    // Componentes compostos: o host é sempre um bloco wrapper.
    // O display do config pertence ao elemento interno (container-render,
    // rendered-menu, etc.) e é aplicado via [ngStyle]/buildContainerStyles().
    const compositeTypes: ComponentType[] = [
      ComponentType.CONTAINER, ComponentType.GRID,
      ComponentType.CARD,      ComponentType.MENU,
      ComponentType.ACCORDION, ComponentType.CAROUSEL,
      ComponentType.FORM,
    ];
    if (this.component?.type && compositeTypes.includes(this.component.type)) return 'block';
    // Folhas: respeita display do config (ex: inline-flex customizado)
    if (this.component?.config?.display) return this.component.config.display;
    return 'block';
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
  private _canvasBoundsW = 99999;
  private _canvasBoundsH = 99999;
  private _compSizeW = 0;
  private _compSizeH = 0;

  private _onMoveMove = (e: MouseEvent) => {
    if (this._rafMove !== null) return;
    this._rafMove = requestAnimationFrame(() => {
      this._rafMove = null;
      this._doMove(e);
    });
  };
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

    // Captura dimensões do canvas (pai) e do próprio componente para clampar
    const hostEl   = this.elRef.nativeElement;
    const canvasEl = hostEl.parentElement;
    this._canvasBoundsW = canvasEl?.offsetWidth  ?? 99999;
    this._canvasBoundsH = canvasEl?.offsetHeight ?? 99999;
    this._compSizeW     = hostEl.offsetWidth;
    this._compSizeH     = hostEl.offsetHeight;

    this._moving      = true;
    this._moveStartX  = event.clientX;
    this._moveStartY  = event.clientY;
    this._moveOriginX = this.component.config.posX ?? 0;
    this._moveOriginY = this.component.config.posY ?? 0;

    document.addEventListener('mousemove', this._onMoveMove);
    document.addEventListener('mouseup',   this._onMoveUp);
    document.body.style.cursor = 'grabbing';
  }

  private _doMove(e: MouseEvent): void {
    if (!this._moving || !this.component) return;
    // Divide pelo zoom para converter coordenadas de tela em coordenadas do canvas
    const zoom = this.editorState.canvasZoom;
    const dx = (e.clientX - this._moveStartX) / zoom;
    const dy = (e.clientY - this._moveStartY) / zoom;
    const newX = Math.round(this._moveOriginX + dx);
    const newY = Math.round(this._moveOriginY + dy);
    // Clamp: componente não sai dos limites do canvas
    const maxX = Math.max(0, this._canvasBoundsW - this._compSizeW);
    const maxY = Math.max(0, this._canvasBoundsH - this._compSizeH);
    this.component.config.posX = Math.max(0, Math.min(newX, maxX));
    this.component.config.posY = Math.max(0, Math.min(newY, maxY));
  }

  private _stopMove(): void {
    if (!this._moving) return;
    this._moving = false;
    if (this._rafMove !== null) { cancelAnimationFrame(this._rafMove); this._rafMove = null; }
    document.removeEventListener('mousemove', this._onMoveMove);
    document.removeEventListener('mouseup',   this._onMoveUp);
    document.body.style.cursor = '';
    // Agenda auto-save sem criar novo snapshot (o snapshot já foi feito no startMove)
    this.editorState.scheduleAutoSave();
  }

  getObjectFields(objectName: string | undefined): ObjectField[] {
    if (!objectName) return [];
    return this.objectsSvc.getByName(objectName)?.fields ?? [];
  }

  getItems     = splitItems;
  getStyles    = buildStyles;
  getContainerStyles = buildContainerStyles;
  getGridStyles      = buildGridStyles;

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
    if (this._rafResize !== null) { cancelAnimationFrame(this._rafResize); this._rafResize = null; }
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup',   this._onMouseUp);
    document.body.style.cursor     = '';
    document.body.style.userSelect = '';
    this.editorState.scheduleAutoSave();
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
    // 'copy' evita que o browser interprete um drop "fora" como remoção
    event.dataTransfer!.effectAllowed = 'copyMove';
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
        this.dragDrop.sourceComponentId,        this.component.id,
      );
      this.dragDrop.reset();
    }
  }

}

