import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { EditorStateService } from '../../../core/services/editor-state.service';
import { Section } from '../../../core/interfaces/section';
import { ComponentConfig } from '../../../core/interfaces/component-config';
import { ComponentType } from '../../../core/enums/component-type.enum';
import { buildStyles, buildContainerStyles, buildGridStyles, splitItems } from '../../../core/utils/style-builder';

@Component({
  selector: 'app-preview-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preview-page.component.html',
  styleUrl: './preview-page.component.scss'
})
export class PreviewPageComponent {

  public ComponentType = ComponentType;

  /** Modo embutido: oculta a barra de preview e usa editorState.splitView para fechar */
  @Input() embedded = false;

  // ─── Viewport responsivo ─────────────────────────────────
  public viewport: 'mobile' | 'tablet' | 'desktop' = 'desktop';

  get viewportWidth(): string {
    const map = { mobile: '375px', tablet: '768px', desktop: '100%' };
    return map[this.viewport];
  }

  get sections(): Section[] {
    return this.editorState.sections;
  }

  /** Estilos da página (background, layout, tipografia) — mesmo do canvas */
  get pageStyles(): Record<string, string> {
    const cfg = this.editorState.currentPage?.config ?? {};
    const s: Record<string, string> = {};
    if (cfg.backgroundColor)   s['background-color']   = cfg.backgroundColor;
    if (cfg.backgroundImage)   s['background-image']   = `url(${cfg.backgroundImage})`;
    if (cfg.backgroundSize)    s['background-size']    = cfg.backgroundSize;
    if (cfg.backgroundRepeat)  s['background-repeat']  = cfg.backgroundRepeat;
    if (cfg.backgroundPosition) s['background-position'] = cfg.backgroundPosition;
    if (cfg.color)             s['color']              = cfg.color;
    if (cfg.maxWidth)          s['max-width']          = cfg.maxWidth;
    if (cfg.minHeight)         s['min-height']         = cfg.minHeight;
    if (cfg.paddingTop)        s['padding-top']        = cfg.paddingTop;
    if (cfg.paddingBottom)     s['padding-bottom']     = cfg.paddingBottom;
    if (cfg.paddingLeft)       s['padding-left']       = cfg.paddingLeft;
    if (cfg.paddingRight)      s['padding-right']      = cfg.paddingRight;
    if (cfg.fontFamily)        s['font-family']        = cfg.fontFamily;
    if (cfg.fontSize)          s['font-size']          = cfg.fontSize;
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

  constructor(
    public editorState: EditorStateService,
    private router: Router
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

  getItems = splitItems;
  getStyles = buildStyles;

  /**
   * Estilos do elemento "host" que envolve cada componente no preview.
   * Espelha os @HostBinding do component-renderer para que o layout
   * se comporte identicamente ao canvas do editor.
   */
  getCompHostStyles(config: ComponentConfig): Record<string, string> {
    const s: Record<string, string> = {};

    // Display — mesma lógica do hostDisplay
    if (config.display)       s['display'] = config.display;
    else if (config.absolutePos) s['display'] = 'inline-block';
    else                      s['display'] = 'block';

    // Width / Height (o host precisa ter a dimensão para participar do flex pai)
    if (config.width)  s['width']  = config.width;
    if (config.height) s['height'] = config.height;

    // Align-self — mesma lógica do hostAlignSelf
    if (config.absolutePos) {
      s['align-self'] = 'auto';
    } else if (config.alignSelf) {
      s['align-self'] = config.alignSelf;
    } else {
      const w = config.width;
      s['align-self'] = (w && w !== '100%' && w !== 'auto') ? 'flex-start' : 'stretch';
    }

    // Flex child props — mesma lógica dos hostFlexGrow/Shrink/Basis/Order
    if (config.flexGrow   != null) s['flex-grow']   = String(config.flexGrow);
    if (config.flexShrink != null) s['flex-shrink'] = String(config.flexShrink);
    if (config.flexBasis)          s['flex-basis']  = config.flexBasis;
    if (config.order      != null) s['order']       = String(config.order);

    // Position — mesma lógica do hostPosition
    const pos = config.position || (config.absolutePos ? 'absolute' : '');
    if (pos) s['position'] = pos;

    // Top / Left / Right / Bottom
    if (config.left)        s['left']   = config.left;
    else if (config.absolutePos) s['left'] = (config.posX ?? 0) + 'px';
    if (config.top)         s['top']    = config.top;
    else if (config.absolutePos) s['top']  = (config.posY ?? 0) + 'px';
    if (config.right)  s['right']  = config.right;
    if (config.bottom) s['bottom'] = config.bottom;

    // Z-Index
    if (config.zIndex != null) s['z-index'] = String(config.zIndex);

    // Overlay
    if (config.mixBlendMode) s['mix-blend-mode'] = config.mixBlendMode;
    if (config.overflow)     s['overflow']       = config.overflow;

    // Cursor
    if (config.cursor) s['cursor'] = config.cursor;

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
}
