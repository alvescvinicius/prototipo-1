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

  // Lê direto do service — não faz deep copy estático,
  // então reflete o estado atual da edição a cada visita ao preview.
  get sections(): Section[] {
    return this.editorState.sections;
  }

  constructor(
    public editorState: EditorStateService,
    private router: Router
  ) {}

  backToEditor(): void {
    this.router.navigate(['/editor']);
  }

  getItems(raw: string | undefined): string[] {
    if (!raw) return [];
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }

  getStyles(config: ComponentConfig): Record<string, string> {
    const s: Record<string, string> = {};
    if (config.alignSelf)       s['align-self']        = config.alignSelf;
    if (config.color)           s['color']             = config.color;
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

    // customCss sobrescreve as propriedades acima
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

  getGridStyles(config: ComponentConfig): Record<string, string> {
    const s = this.getStyles(config);
    const cols = parseInt(config.columns || '3', 10) || 3;
    s['display'] = 'grid';
    s['grid-template-columns'] = `repeat(${cols}, 1fr)`;
    if (!s['gap']) s['gap'] = '16px';
    return s;
  }

}
