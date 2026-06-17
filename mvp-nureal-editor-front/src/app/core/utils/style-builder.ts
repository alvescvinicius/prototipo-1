import { ComponentConfig } from '../interfaces/component-config';

/**
 * Constrói o mapa de estilos CSS visuais de um componente.
 * Fonte única da verdade — usada por component-renderer, preview-page e public-page.
 * NÃO inclui propriedades de host (display, position, alignSelf, flexGrow, etc.)
 * que são gerenciadas separadamente via @HostBinding / getCompHostStyles().
 */
export function buildStyles(config: ComponentConfig): Record<string, string> {
  const s: Record<string, string> = {};

  // Typography
  if (config.color)         s['color']          = config.color;
  if (config.fontSize)      s['font-size']       = config.fontSize;
  if (config.fontWeight)    s['font-weight']     = config.fontWeight;
  if (config.textAlign)     s['text-align']      = config.textAlign;
  if (config.letterSpacing) s['letter-spacing']  = config.letterSpacing;
  if (config.lineHeight)    s['line-height']     = config.lineHeight;

  // Visual
  if (config.backgroundColor) s['background-color'] = config.backgroundColor;
  if (config.borderRadius)    s['border-radius']     = config.borderRadius;
  if (config.borderWidth)     s['border-width']      = config.borderWidth;
  if (config.borderColor)     s['border-color']      = config.borderColor;
  if (config.borderStyle)     s['border-style']      = config.borderStyle;
  if (config.opacity != null) s['opacity']           = String(config.opacity);
  if (config.boxShadow)       s['box-shadow']        = config.boxShadow;

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

  // Flex container (para CONTAINER/GRID que hospedam filhos)
  if (config.flexDirection)  s['flex-direction']  = config.flexDirection;
  if (config.alignItems)     s['align-items']     = config.alignItems;
  if (config.justifyContent) s['justify-content'] = config.justifyContent;
  if (config.gap)            s['gap']             = config.gap;
  if (config.flexWrap)       s['flex-wrap']       = config.flexWrap;

  // Custom CSS — aplicado por último (maior prioridade)
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

/** Container sempre usa flex-column. */
export function buildContainerStyles(config: ComponentConfig): Record<string, string> {
  const s = buildStyles(config);
  s['display'] = 'flex';
  if (!s['flex-direction']) s['flex-direction'] = 'column';
  return s;
}

/** Grid com número de colunas configurável. */
export function buildGridStyles(config: ComponentConfig): Record<string, string> {
  const s = buildStyles(config);
  const cols = parseInt(config.columns || '3', 10) || 3;
  s['display'] = 'grid';
  s['grid-template-columns'] = `repeat(${cols}, 1fr)`;
  if (!s['gap']) s['gap'] = '16px';
  return s;
}

/** Divide string CSV em array (ex: "Item 1,Item 2" → ['Item 1', 'Item 2']). */
export function splitItems(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}
