import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PageComponent } from '../../../core/interfaces/page-component';
import { ComponentConfig } from '../../../core/interfaces/component-config';
import { ComponentType } from '../../../core/enums/component-type.enum';

import { EditorStateService } from '../../../core/services/editor-state.service';

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

  @Input({ required: true })
  component!: PageComponent;

  public ComponentType = ComponentType;

  constructor(public editorState: EditorStateService) {}

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

}
