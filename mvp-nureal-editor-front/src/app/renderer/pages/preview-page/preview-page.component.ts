import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { EditorStateService } from '../../../core/services/editor-state.service';
import { Section } from '../../../core/interfaces/section';
import { ComponentConfig } from '../../../core/interfaces/component-config';
import { ComponentType } from '../../../core/enums/component-type.enum';

@Component({
  selector: 'app-preview-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preview-page.component.html',
  styleUrl: './preview-page.component.scss'
})
export class PreviewPageComponent {

  public ComponentType = ComponentType;

  // ─── Viewport responsivo ─────────────────────────────────
  public viewport: 'mobile' | 'tablet' | 'desktop' = 'desktop';

  get viewportWidth(): string {
    const map = { mobile: '375px', tablet: '768px', desktop: '100%' };
    return map[this.viewport];
  }

  get sections(): Section[] {
    return this.editorState.sections;
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

  getItems(raw: string | undefined): string[] {
    if (!raw) return [];
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }

  getStyles(config: ComponentConfig): Record<string, string> {
    const s: Record<string, string> = {};
    // Typography
    if (config.color)           s['color']           = config.color;
    if (config.fontSize)        s['font-size']       = config.fontSize;
    if (config.fontWeight)      s['font-weight']     = config.fontWeight;
    if (config.textAlign)       s['text-align']      = config.textAlign;
    if (config.letterSpacing)   s['letter-spacing']  = config.letterSpacing;
    if (config.lineHeight)      s['line-height']     = config.lineHeight;
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
    if (config.alignItems)     s['align-items']     = config.alignItems;    if (config.justifyContent) s['justify-content'] = config.justifyContent;
    if (config.gap)            s['gap']             = config.gap;
    if (config.flexWrap)       s['flex-wrap']       = config.flexWrap;
    return s;
  }

  getContainerStyles(config: ComponentConfig): Record<string, string> {
    const s = this.getStyles(config);
    if (config.flexDirection) s['display'] = 'flex';
    return s;
  }

  getGridStyles(config: ComponentConfig): Record<string, string> {
    const s = this.getStyles(config);
    s['display'] = 'grid';
    if (config.columns) s['grid-template-columns'] = `repeat(${config.columns}, 1fr)`;
    if (config.gap)     s['gap']                   = config.gap;
    return s;
  }
}
