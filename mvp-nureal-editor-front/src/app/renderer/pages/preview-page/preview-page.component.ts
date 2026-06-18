import { Component, Input, HostBinding, HostListener, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { EditorStateService } from '../../../core/services/editor-state.service';
import { Section } from '../../../core/interfaces/section';
import { ComponentConfig } from '../../../core/interfaces/component-config';
import { ComponentType } from '../../../core/enums/component-type.enum';
import { PageComponent } from '../../../core/interfaces/page-component';
import { buildStyles, buildContainerStyles, buildGridStyles, splitItems } from '../../../core/utils/style-builder';

@Component({
  selector: 'app-preview-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preview-page.component.html',
  styleUrl: './preview-page.component.scss'
})
export class PreviewPageComponent implements AfterViewInit {

  public ComponentType = ComponentType;

  /** Modo embutido: oculta a barra de preview e usa editorState.splitView para fechar */
  @Input() embedded = false;

  // ─── Viewport responsivo — sincronizado com editorState ──
  get viewport(): 'mobile' | 'tablet' | 'desktop' {
    return this.editorState.viewport;
  }
  set viewport(v: 'mobile' | 'tablet' | 'desktop') {
    this.editorState.viewport = v;
  }

  /**
   * Todos os viewports usam a largura de design (1280px) para garantir que o
   * preview seja pixel-perfect em relação ao canvas do editor.
   *
   * Desktop → 1280px sem zoom (1:1 com o canvas).
   * Mobile/Tablet → 1280px + zoom para encolher a página inteira no tamanho do dispositivo.
   *
   * O div do viewport é centralizado via margin:0 auto no CSS (.preview-viewport).
   */
  private readonly DESIGN_WIDTH = 1280;

  /** Largura real do container de preview (atualizada no init e no resize). */
  private _containerW = 0;

  ngAfterViewInit(): void {
    this._containerW = this._hostEl.nativeElement.offsetWidth || window.innerWidth;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this._containerW = this._hostEl.nativeElement.offsetWidth || window.innerWidth;
  }

  /**
   * Zoom proporcional: canvas de design (1280px) escalado para preencher o container.
   * Desktop  → zoom = containerWidth / 1280  (ex: 1920px browser → zoom 1.5)
   * Mobile   → zoom = 375 / 1280 ~= 0.29
   * Tablet   → zoom = 768 / 1280 ~= 0.60
   */
  get viewportZoom(): number {
    const w = this._containerW || window.innerWidth;
    if (this.viewport === 'desktop') return w / this.DESIGN_WIDTH;
    return this.editorState.deviceWidth / this.DESIGN_WIDTH;
  }

  /**
   * Mobile/tablet ficam menores que o container — centraliza com margin auto.
   * Desktop preenche exatamente o container, sem necessidade de centralizar.
   */
  get isScaled(): boolean {
    return this.viewport !== 'desktop';
  }

  get sections(): Section[] {
    return this.editorState.sections;
  }

  /** Estilos da página (background, layout, tipografia) — mesmo do canvas */
  get pageStyles(): Record<string, string> {
    const cfg = this.editorState.currentPage?.config ?? {};
    const s: Record<string, string> = {};
    if (cfg.backgroundColor)    s['background-color']    = cfg.backgroundColor;
    if (cfg.backgroundImage)    s['background-image']    = `url(${cfg.backgroundImage})`;
    if (cfg.backgroundSize)     s['background-size']     = cfg.backgroundSize;
    if (cfg.backgroundRepeat)   s['background-repeat']   = cfg.backgroundRepeat;
    if (cfg.backgroundPosition) s['background-position'] = cfg.backgroundPosition;
    if (cfg.color)              s['color']               = cfg.color;
    if (cfg.maxWidth)           s['max-width']           = cfg.maxWidth;
    if (cfg.minHeight)          s['min-height']          = cfg.minHeight;
    if (cfg.paddingTop)         s['padding-top']         = cfg.paddingTop;
    if (cfg.paddingBottom)      s['padding-bottom']      = cfg.paddingBottom;
    if (cfg.paddingLeft)        s['padding-left']        = cfg.paddingLeft;
    if (cfg.paddingRight)       s['padding-right']       = cfg.paddingRight;
    if (cfg.fontFamily)         s['font-family']         = cfg.fontFamily;
    if (cfg.fontSize)           s['font-size']           = cfg.fontSize;
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

  /** Sincroniza o fundo do host com a cor de fundo configurada na página. */
  @HostBinding('style.background-color')
  get hostBg(): string {
    return this.editorState.currentPage?.config?.backgroundColor ?? '#0e0f11';
  }

  constructor(
    public editorState: EditorStateService,
    private router: Router,
    private _hostEl: ElementRef<HTMLElement>
  ) {}

  backToEditor(): void {
    const pid = this.editorState.projectId;
    if (pid) {
      this.router.navigate(['/editor', pid]);
    } else {
      this.router.navigate(['/editor']);
    }
  }

  closeSplitView(): void {
    this.editorState.splitView = false;
    // Sinaliza ao canvas que deve recalcular o zoom após fechar o split-view.
    setTimeout(() => this.editorState.requestZoomFit$.next());
  }

  // ─── Carousel state (preview) ────────────────────────────
  carouselSlides: Record<string, number> = {};

  getCarouselSlide(id: string): number {
    return this.carouselSlides[id] ?? 0;
  }

  prevCarouselSlide(id: string, total: number): void {
    this.carouselSlides[id] = (this.getCarouselSlide(id) - 1 + total) % total;
  }

  nextCarouselSlide(id: string, total: number): void {
    this.carouselSlides[id] = (this.getCarouselSlide(id) + 1) % total;
  }

  getItems  = splitItems;
  getStyles = buildStyles;

  /**
   * Estilos do elemento "host" que envolve cada componente no preview.
   * Espelha os @HostBinding do component-renderer para que o layout
   * se comporte identicamente ao canvas do editor.
   *
   * Aceita um PageComponent completo (preferido) ou um ComponentConfig avulso.
   * Quando o tipo está disponível, componentes compostos sempre produzem
   * display:block no host (igual ao editor após o HostBinding composite fix).
   */
  getCompHostStyles(componentOrConfig: PageComponent | ComponentConfig): Record<string, string> {
    const isFullComponent = 'type' in componentOrConfig && 'id' in componentOrConfig;
    const config: ComponentConfig = isFullComponent
      ? (componentOrConfig as PageComponent).config
      : (componentOrConfig as ComponentConfig);
    const type: ComponentType | null = isFullComponent
      ? (componentOrConfig as PageComponent).type
      : null;

    const compositeTypes: ComponentType[] = [
      ComponentType.CONTAINER, ComponentType.GRID,
      ComponentType.CARD,      ComponentType.MENU,
      ComponentType.ACCORDION, ComponentType.CAROUSEL,
      ComponentType.FORM,
    ];
    const isComposite = type !== null && compositeTypes.includes(type);

    const s: Record<string, string> = {};

    // Display — compostos sempre block (o elemento interno cuida do seu próprio display)
    if (config.absolutePos) {
      s['display'] = 'inline-block';
    } else if (isComposite) {
      s['display'] = 'block';
    } else if (config.display) {
      s['display'] = config.display;
    } else {
      s['display'] = 'block';
    }

    // Width / Height
    if (config.width)  s['width']  = config.width;
    if (config.height) s['height'] = config.height;

    // Align-self
    if (config.absolutePos) {
      s['align-self'] = 'auto';
    } else if (config.alignSelf) {
      s['align-self'] = config.alignSelf;
    } else {
      const w = config.width;
      // Specific width (not 100% or auto): do not stretch on cross-axis.
      if (w && w !== '100%' && w !== 'auto') s['align-self'] = 'flex-start';
      // Otherwise: omit align-self, let parent align-items decide.
      // MENU children (align-items:center) center; CONTAINER children stretch.
    }

    // Flex child props
    if (config.flexGrow   != null) s['flex-grow']   = String(config.flexGrow);
    if (config.flexShrink != null) s['flex-shrink'] = String(config.flexShrink);
    if (config.flexBasis)          s['flex-basis']  = config.flexBasis;
    if (config.order      != null) s['order']       = String(config.order);

    // Position
    const pos = config.position || (config.absolutePos ? 'absolute' : '');
    if (pos) s['position'] = pos;

    // Top / Left / Right / Bottom
    if (config.left)              s['left']   = config.left;
    else if (config.absolutePos)  s['left']   = (config.posX ?? 0) + 'px';
    if (config.top)               s['top']    = config.top;
    else if (config.absolutePos)  s['top']    = (config.posY ?? 0) + 'px';
    if (config.right)  s['right']  = config.right;
    if (config.bottom) s['bottom'] = config.bottom;

    // Z-Index / Overlay / Cursor
    if (config.zIndex != null)    s['z-index']       = String(config.zIndex);
    if (config.mixBlendMode)      s['mix-blend-mode'] = config.mixBlendMode;
    if (config.overflow)          s['overflow']       = config.overflow;
    if (config.cursor)            s['cursor']         = config.cursor;

    return s;
  }

  /** Seção: aplica estilos mas só flex se explicitamente configurado */
  getSectionStyles(config: any): Record<string, string> {
    const s = this.getStyles(config as ComponentConfig);
    if (config.flexDirection) {
      s['display'] = 'flex';
      if (!s['flex-direction']) s['flex-direction'] = 'column';
    }
    return s;
  }

  getContainerStyles = buildContainerStyles;
  getGridStyles      = buildGridStyles;

  /**
   * Calcula a altura mínima de uma seção cujos filhos são absolutamente
   * posicionados, evitando que a seção colapse para 0.
   * Retorna 0 quando os filhos têm fluxo normal (nenhuma altura extra necessária).
   */
  getSectionMinHeight(components: PageComponent[]): number {
    const hasAbs = components.some(c => c.config.absolutePos);
    if (!hasAbs) return 0;
    let maxBottom = 0;
    for (const c of components) {
      if (!c.config.absolutePos) continue;
      const y = c.config.posY ?? 0;
      // Tenta ler altura explícita do config; senão usa fallback por tipo.
      const explicit = this._pxVal(c.config.height) ?? this._pxVal(c.config.minHeight);
      const fallback = this._defaultHeight(c.type);
      const h = explicit ?? fallback;
      maxBottom = Math.max(maxBottom, y + h);
    }
    return maxBottom;
  }

  /** Altura padrão por tipo para quando não há height explícita no config. */
  private _defaultHeight(type: ComponentType): number {
    switch (type) {
      case ComponentType.MENU:      return 68;
      case ComponentType.CARD:      return 220;
      case ComponentType.CAROUSEL:  return 320;
      case ComponentType.ACCORDION: return 180;
      case ComponentType.FORM:      return 200;
      case ComponentType.GRID:      return 180;
      case ComponentType.CONTAINER: return 80;
      case ComponentType.IMAGE:     return 200;
      case ComponentType.BUTTON:    return 44;
      case ComponentType.INPUT:
      case ComponentType.SELECT:    return 64;
      default:                      return 48;
    }
  }

  private _pxVal(v?: string): number | null {
    if (!v || !v.endsWith('px')) return null;
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  }
}
