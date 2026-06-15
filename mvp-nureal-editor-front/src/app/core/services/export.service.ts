import { Injectable } from '@angular/core';

import { Section } from '../interfaces/section';
import { PageComponent } from '../interfaces/page-component';
import { ComponentConfig } from '../interfaces/component-config';
import { ComponentType } from '../enums/component-type.enum';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  // ─── Entry point ─────────────────────────────────────────────

  exportHTML(sections: Section[], projectName: string): void {
    const html = this._buildFullDocument(sections, projectName);
    this._download(html, `${this._slugify(projectName)}.html`);
  }

  // ─── Document ────────────────────────────────────────────────

  private _buildFullDocument(sections: Section[], projectName: string): string {
    const body = sections
      .map(s => this._buildSection(s))
      .join('\n');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this._escape(projectName)}</title>
  <style>
${this._baseStyles()}
  </style>
</head>
<body>

${body || '  <!-- nenhuma seção adicionada -->'}

</body>
</html>`;
  }

  // ─── Section ─────────────────────────────────────────────────

  private _buildSection(section: Section): string {
    const sStyle = this._buildStyleAttr(section.config ?? {});
    const components = section.pageComponents
      .map(c => this._buildComponent(c, 2))
      .join('\n');

    return this._indent(
      `<section class="section" data-name="${this._escape(section.name)}"${sStyle}>
${components || '  <!-- seção vazia -->'}
</section>`,
      1
    );
  }

  // ─── Component (recursivo) ───────────────────────────────────

  private _buildComponent(comp: PageComponent, depth: number): string {
    const style = this._buildStyleAttr(comp.config);

    switch (comp.type) {

      case ComponentType.TEXT:
        return this._indent(
          `<p${style}>${this._escape(comp.config.content ?? '')}</p>`,
          depth
        );

      case ComponentType.TITLE:
        return this._indent(
          `<h2${style}>${this._escape(comp.config.content ?? '')}</h2>`,
          depth
        );

      case ComponentType.BUTTON:
        return this._indent(
          `<button type="button"${style}>${this._escape(comp.config.content ?? '')}</button>`,
          depth
        );

      case ComponentType.IMAGE: {
        const href = comp.config.href;
        const img  = `<img src="${this._escape(comp.config.src ?? '')}" alt=""${style} />`;
        return this._indent(href ? `<a href="${this._escape(href)}">${img}</a>` : img, depth);
      }

      case ComponentType.INPUT: {
        const lbl = comp.config.label
          ? `<label>${this._escape(comp.config.label)}</label>\n`
          : '';
        return this._indent(
          `<div${style}>\n${lbl}<input type="text" placeholder="${this._escape(comp.config.placeholder ?? '')}">\n</div>`,
          depth
        );
      }

      case ComponentType.CHECKBOX:
        return this._indent(
          `<label${style}><input type="checkbox"> ${this._escape(comp.config.content ?? '')}</label>`,
          depth
        );

      case ComponentType.SELECT: {
        const opts = (comp.config.options ?? '')
          .split(',').map(o => o.trim()).filter(Boolean)
          .map(o => `<option>${this._escape(o)}</option>`).join('\n');
        const lbl = comp.config.label
          ? `<label>${this._escape(comp.config.label)}</label>\n`
          : '';
        const ph = `<option>${this._escape(comp.config.placeholder ?? 'Selecione...')}</option>`;
        return this._indent(
          `<div${style}>\n${lbl}<select>\n${ph}\n${opts}\n</select>\n</div>`,
          depth
        );
      }

      case ComponentType.MENU: {
        const links = (comp.config.items ?? '')
          .split(',').map(i => i.trim()).filter(Boolean)
          .map(i => `<a href="#">${this._escape(i)}</a>`).join('\n');
        return this._indent(`<nav${style}>\n${links}\n</nav>`, depth);
      }

      case ComponentType.CARD: {
        const img = comp.config.src
          ? `<img src="${this._escape(comp.config.src)}" alt="" style="width:100%;display:block;" />\n`
          : '';
        return this._indent(
          `<div${style}>\n${img}<div class="card-body">\n<h3>${this._escape(comp.config.content ?? '')}</h3>\n<p>${this._escape(comp.config.description ?? '')}</p>\n</div>\n</div>`,
          depth
        );
      }

      case ComponentType.CAROUSEL: {
        const slides = (comp.config.items ?? '')
          .split(',').map(s => s.trim()).filter(Boolean)
          .map(s => `<div class="slide">${this._escape(s)}</div>`).join('\n');
        return this._indent(`<div class="carousel"${style}>\n${slides}\n</div>`, depth);
      }

      case ComponentType.ACCORDION: {
        const items = (comp.config.items ?? '')
          .split(',').map(i => i.trim()).filter(Boolean)
          .map(i => `<details>\n<summary>${this._escape(i)}</summary>\n<p>Conteúdo</p>\n</details>`).join('\n');
        return this._indent(`<div${style}>\n${items}\n</div>`, depth);
      }

      case ComponentType.CONTAINER: {
        const children = comp.children
          .map(c => this._buildComponent(c, depth + 1))
          .join('\n');
        return this._indent(
          `<div${style}>\n${children || this._indent('<!-- container vazio -->', depth + 1)}\n${this._indentStr(depth)}</div>`,
          depth
        );
      }

      case ComponentType.GRID: {
        const cols = parseInt(comp.config.columns || '3', 10) || 3;
        const gridCss = `display:grid;grid-template-columns:repeat(${cols},1fr);gap:16px`;
        const gridStyle = this._buildStyleAttr({
          ...comp.config,
          customCss: gridCss + (comp.config.customCss ? ';' + comp.config.customCss : '')
        });
        const children = comp.children
          .map(c => this._buildComponent(c, depth + 1))
          .join('\n');
        return this._indent(
          `<div${gridStyle}>\n${children || this._indent('<!-- grid vazio -->', depth + 1)}\n${this._indentStr(depth)}</div>`,
          depth
        );
      }

      default:
        return this._indent(
          `<!-- componente "${comp.type}" não exportado -->`,
          depth
        );
    }
  }

  // ─── Style attr ──────────────────────────────────────────────

  private _buildStyleAttr(config: ComponentConfig): string {
    const map: Record<string, string> = {};

    if (config.color)           map['color']            = config.color;
    if (config.fontSize)        map['font-size']         = config.fontSize;
    if (config.fontWeight)      map['font-weight']       = config.fontWeight;
    if (config.textAlign)       map['text-align']        = config.textAlign;
    if (config.backgroundColor) map['background-color']  = config.backgroundColor;
    if (config.borderRadius)    map['border-radius']     = config.borderRadius;
    if (config.borderWidth)     map['border-width']      = config.borderWidth;
    if (config.borderColor)     map['border-color']      = config.borderColor;
    if (config.borderStyle)     map['border-style']      = config.borderStyle;
    if (config.paddingTop)      map['padding-top']       = config.paddingTop;
    if (config.paddingBottom)   map['padding-bottom']    = config.paddingBottom;
    if (config.paddingLeft)     map['padding-left']      = config.paddingLeft;
    if (config.paddingRight)    map['padding-right']     = config.paddingRight;
    if (config.marginTop)       map['margin-top']        = config.marginTop;
    if (config.marginBottom)    map['margin-bottom']     = config.marginBottom;
    if (config.width)           map['width']             = config.width;
    if (config.height)          map['height']            = config.height;

    // customCss sobrescreve as propriedades acima
    if (config.customCss) {
      config.customCss.split(/;|\n/).forEach(rule => {
        const idx = rule.indexOf(':');
        if (idx > 0) {
          const prop = rule.substring(0, idx).trim();
          const val  = rule.substring(idx + 1).trim();
          if (prop && val) map[prop] = val;
        }
      });
    }

    const rules = Object.entries(map).map(([k, v]) => `${k}: ${v}`);
    if (rules.length === 0) return '';
    return ` style="${rules.join('; ')}"`;
  }

  // ─── Base CSS ────────────────────────────────────────────────

  private _baseStyles(): string {
    return `    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #18181b;
      background: #ffffff;
    }

    .section {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 24px;
      box-sizing: border-box;
    }

    h2 { font-size: 2rem; font-weight: 700; line-height: 1.2; margin-bottom: 16px; }
    h3 { font-size: 1.25rem; font-weight: 600; margin-bottom: 8px; }
    p  { margin-bottom: 8px; }

    img { display: block; max-width: 100%; }
    a   { color: inherit; }

    button {
      display: inline-block;
      padding: 10px 24px;
      font-size: 14px;
      font-family: inherit;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      cursor: pointer;
    }
    button:hover { background: #f1f5f9; }

    nav { display: flex; gap: 24px; align-items: center; padding: 12px 24px; }
    nav a { text-decoration: none; font-size: 14px; }

    .card-body { padding: 16px; }

    .carousel { overflow: hidden; }
    .slide { padding: 20px; text-align: center; }

    details summary { cursor: pointer; padding: 12px 16px; font-weight: 500; border-bottom: 1px solid #e2e8f0; }
    details p { padding: 12px 16px; }

    select, input[type="text"] {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-family: inherit;
      font-size: 14px;
    }
    label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 4px; }`;
  }

  // ─── Helpers ─────────────────────────────────────────────────

  private _escape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private _slugify(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private _indentStr(depth: number): string {
    return '  '.repeat(depth);
  }

  private _indent(str: string, depth: number): string {
    const pad = this._indentStr(depth);
    return str
      .split('\n')
      .map(line => (line.trim() ? pad + line : line))
      .join('\n');
  }

  private _download(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');

    a.href     = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

}
