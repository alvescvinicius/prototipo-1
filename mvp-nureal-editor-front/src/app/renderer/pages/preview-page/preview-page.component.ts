import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { EditorStateService } from '../../../core/services/editor-state.service';
import { Section } from '../../../core/interfaces/section';
import { PageComponent } from '../../../core/interfaces/page-component';
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

  public sections: Section[];

  constructor(
    private editorState: EditorStateService,
    private router: Router
  ) {
    // copia as sections no momento em que o preview abre
    this.sections = JSON.parse(JSON.stringify(editorState.sections));
  }

  backToEditor(): void {
    this.router.navigate(['/editor']);
  }

  // aplica os estilos do config como objeto CSS
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

    return s;
  }

  // renderiza componentes filhos recursivamente (containers)
  trackById(_: number, item: { id: string }): string {
    return item.id;
  }

}
