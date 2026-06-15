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
    const components = section.pageComponents
      .map(c => this._buildComponent(c, 2))
      .join('\n');

    return this._indent(
      `<section class="section" data-name="${this._escape(section.name)}">
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

      case ComponentType.IMAGE:
        return this._indent(
          `<img src="${this._escape(comp.config.src ?? '')}" alt=""${style} />`,
          depth
        );

      case ComponentType.CONTAINER: {
        const children = comp.children
          .map(c => this._buildComponent(c, depth + 1))
          .join('\n');

        return this._indent(
          `<div${style}>
${children || this._indent('<!-- container vazio -->', depth + 1)}
${this._indentStr(depth)}</div>`,
          depth
        );
      }

      default:
        return this._indent(
          `<!-- componente "${comp.type}" não suportado -->`,
          depth
        );
    }
  }

  // ─── Style attr ──────────────────────────────────────────────

  private _buildStyleAttr(config: ComponentConfig): string {
    const rules: string[] = [];

    if (config.color)           rules.push(`color: ${config.color}`);
    if (config.fontSize)        rules.push(`font-size: ${config.fontSize}`);
    if (config.fontWeight)      rules.push(`font-weight: ${config.fontWeight}`);
    if (config.textAlign)       rules.push(`text-align: ${config.textAlign}`);
    if (config.backgroundColor) rules.push(`background-color: ${config.backgroundColor}`);
    if (config.borderRadius)    rules.push(`border-radius: ${config.borderRadius}`);
    if (config.borderWidth)     rules.push(`border-width: ${config.borderWidth}`);
    if (config.borderColor)     rules.push(`border-color: ${config.borderColor}`);
    if (config.borderStyle)     rules.push(`border-style: ${config.borderStyle}`);
    if (config.paddingTop)      rules.push(`padding-top: ${config.paddingTop}`);
    if (config.paddingBottom)   rules.push(`padding-bottom: ${config.paddingBottom}`);
    if (config.paddingLeft)     rules.push(`padding-left: ${config.paddingLeft}`);
    if (config.paddingRight)    rules.push(`padding-right: ${config.paddingRight}`);
    if (config.marginTop)       rules.push(`margin-top: ${config.marginTop}`);
    if (config.marginBottom)    rules.push(`margin-bottom: ${config.marginBottom}`);
    if (config.width)           rules.push(`width: ${config.width}`);
    if (config.height)          rules.push(`height: ${config.height}`);

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
    }

    h2 {
      font-size: 2rem;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 16px;
    }

    p {
      margin-bottom: 8px;
    }

    img {
      display: block;
      max-width: 100%;
    }

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

    button:hover {
      background: #f1f5f9;
    }`;
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
      .replace(/[\u0300-\u036f]/g, '')
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
