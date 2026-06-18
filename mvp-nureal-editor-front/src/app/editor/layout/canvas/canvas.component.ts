import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { NavigationEnd, Router } from '@angular/router';
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
export class CanvasComponent implements OnInit, AfterViewInit, OnDestroy {

  isDraggingOverCanvas = false;
  readonly ZOOM_MIN  = 0.1;
  readonly ZOOM_STEP = 0.1;

  private _subs = new Subscription();

  @ViewChild('freeCanvas')  freeCanvasRef?: ElementRef<HTMLDivElement>;
  @ViewChild('canvasWrap')  canvasWrapRef?: ElementRef<HTMLDivElement>;
  @ViewChild('renameInput') renameInput?: ElementRef<HTMLInputElement>;

  constructor(
    public editorState: EditorStateService,
    public dragDrop:    DragDropService,
    private router:     Router,
  ) {}

  ngOnInit(): void {
    // 1) Split-view fecha: canvas continua montado, sinal chega via Subject.
    this._subs.add(
      this.editorState.requestZoomFit$.subscribe(() => this._doZoomFit(150))
    );

    // 2) Retorno da preview fullscreen (NavigationEnd para rota /editor).
    this._subs.add(
      this.router.events.pipe(
        filter(e => e instanceof NavigationEnd),
        filter((e: NavigationEnd) => e.urlAfterRedirects.startsWith('/editor'))
      ).subscribe(() => this._doZoomFit(150))
    );
  }

  ngAfterViewInit(): void {
    // Zoom fit inicial ao montar o canvas.
    this._doZoomFit(0);
  }

  /** Aguarda `delay` ms para o layout estabilizar antes de calcular o zoom. */
  private _doZoomFit(delay: number): void {
    setTimeout(() => this.zoomFit(), delay);
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
  }

  // ── Device / Viewport ─────────────────────────────────────────────────────

  setViewport(vp: 'mobile' | 'tablet' | 'desktop'): void {
    this.editorState.viewport = vp;
    setTimeout(() => this.zoomFit());
  }

  // ── Estilos da página ─────────────────────────────────────────────────────

  get pageStyles(): Record<string, string> {
    const cfg = this.editorState.currentPage?.config ?? {};
    const s: Record<string, string> = {};
    if (cfg.backgroundColor)   s['background-color']    = cfg.backgroundColor;
    if (cfg.backgroundImage)   s['background-image']    = `url(${cfg.backgroundImage})`;
    if (cfg.backgroundSize)    s['background-size']     = cfg.backgroundSize;
    if (cfg.backgroundRepeat)  s['background-repeat']   = cfg.backgroundRepeat;
    if (cfg.backgroundPosition) s['background-position'] = cfg.backgroundPosition;
    if (cfg.color)             s['color']               = cfg.color;
    if (cfg.maxWidth)          s['max-width']           = cfg.maxWidth;
    if (cfg.minHeight)         s['min-height']          = cfg.minHeight;
    if (cfg.paddingTop)        s['padding-top']         = cfg.paddingTop;
    if (cfg.paddingBottom)     s['padding-bottom']      = cfg.paddingBottom;
    if (cfg.paddingLeft)       s['padding-left']        = cfg.paddingLeft;
    if (cfg.paddingRight)      s['padding-right']       = cfg.paddingRight;
    if (cfg.fontFamily)        s['font-family']         = cfg.fontFamily;
    if (cfg.fontSize)          s['font-size']           = cfg.fontSize;
    if (cfg.flexDirection) {
      s['display']        = 'flex';
      s['flex-direction'] = cfg.flexDirection;
      s['flex-wrap']      = cfg.flexWrap || 'wrap';
    }
    if (cfg.alignItems)     s['align-items']     = cfg.alignItems;
    if (cfg.justifyContent) s['justify-content'] = cfg.justifyContent;
    if (cfg.gap)            s['gap']             = cfg.gap;
    return s;
  }

  /** Altura mínima do canvas: garante que componentes absolutos não fiquem cortados */
  get canvasMinHeight(): number {
    const comps = this.editorState.pageComponents;
    let max = 600;
    for (const c of comps) {
      const y = c.config.posY ?? 0;
      const h = this._pxVal(c.config.height) ?? 120;
      max = Math.max(max, y + h + 60);
    }
    return max;
  }

  private _pxVal(v?: string): number | null {
    if (!v || !v.endsWith('px')) return null;
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  }

  // ── Zoom ──────────────────────────────────────────────────────────────────

  get zoomPct(): string {
    return Math.round(this.editorState.canvasZoom * 100) + '%';
  }

  /** Zoom máximo = zoom do preview (janela inteira) */
  get zoomMax(): number {
    return Math.max(this.ZOOM_MIN, +((window.innerWidth / this.editorState.deviceWidth) * 1.5).toFixed(2));
  }

  zoomIn(): void {
    this.editorState.canvasZoom = Math.min(
      this.zoomMax,
      +(this.editorState.canvasZoom + this.ZOOM_STEP).toFixed(2)
    );
  }

  zoomOut(): void {
    this.editorState.canvasZoom = Math.max(
      this.ZOOM_MIN,
      +(this.editorState.canvasZoom - this.ZOOM_STEP).toFixed(2)
    );
  }

  zoomReset(): void {
    // Zoom 1:1 = tamanho real, fiel ao preview
    this.editorState.canvasZoom = 1;
  }

  zoomFit(): void {
    // O painel direito agora é position:fixed (overlay), então o wrap ocupa
    // quase toda a janela (window.innerWidth - left-rail ~52px).
    // Zoom = wrap.clientWidth / deviceWidth ≈ preview zoom.
    const wrap = this.canvasWrapRef?.nativeElement;
    const w = wrap ? wrap.clientWidth : window.innerWidth;
    const scale = (w - 80) / this.editorState.deviceWidth; // 40px padding cada lado
    this.editorState.canvasZoom = Math.max(this.ZOOM_MIN, Math.min(scale, 3));
  }

  /** Zoom estritamente igual ao preview (ignora left-rail) */
  zoomMatchPreview(): void {
    const scale = window.innerWidth / this.editorState.deviceWidth;
    this.editorState.canvasZoom = Math.max(this.ZOOM_MIN, Math.min(scale, 3));
  }

  @HostListener('wheel', ['$event'])
  onWheel(e: WheelEvent): void {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    if (e.deltaY < 0) this.zoomIn();
    else              this.zoomOut();
  }

  // ── Drop no canvas ────────────────────────────────────────────────────────

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
      const zoom = this.editorState.canvasZoom;
      posX = Math.round((event.clientX - rect.left) / zoom);
      posY = Math.round((event.clientY - rect.top)  / zoom);
      // Clamp dentro do canvas
      posX = Math.max(0, Math.min(posX, this.editorState.deviceWidth - 80));
      posY = Math.max(0, posY);
    }

    this.editorState.addComponentToCanvas(
      this.dragDrop.toolboxType, posX, posY,
      this.dragDrop.toolboxVariant ?? undefined
    );
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
