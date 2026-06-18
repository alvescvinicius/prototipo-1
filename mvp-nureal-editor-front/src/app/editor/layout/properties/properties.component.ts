import { Component } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';

import { EditorStateService }   from '../../../core/services/editor-state.service';
import { ComponentType }        from '../../../core/enums/component-type.enum';
import { PageComponent }        from '../../../core/interfaces/page-component';
import { ComponentConfig }      from '../../../core/interfaces/component-config';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './properties.component.html',
  styleUrls: ['./properties.component.scss']
})
export class PropertiesComponent {

  public CT = ComponentType;

  constructor(public editorState: EditorStateService) {}

  // ── Selected component shortcut ───────────────────────────
  get comp(): PageComponent | null {
    const n = this.editorState.selectedNode;
    return n && (n as PageComponent).children !== undefined ? n as PageComponent : null;
  }

  get cfg(): ComponentConfig { return this.comp?.config ?? {}; }

  // ── Utility: px value ────────────────────────────────────
  px(val?: string): number | string {
    if (!val) return '';
    if (val.endsWith('px')) return parseFloat(val);
    return val;
  }
  setPx(cfg: ComponentConfig, key: keyof ComponentConfig, v: number | string): void {
    if (v === '' || v === null || v === undefined) {
      (cfg as any)[key] = undefined;
    } else {
      (cfg as any)[key] = typeof v === 'number' ? v + 'px' : v;
    }
    this.editorState.scheduleAutoSave();
  }

  // ── Posição livre (absolutePos) — direto, sem inversão ────
  get freePos(): boolean { return !!this.cfg.absolutePos; }
  set freePos(v: boolean) {
    if (!this.comp) return;
    this.comp.config.absolutePos = v;
    this.editorState.scheduleAutoSave();
  }

  // ── Shortcut setters ─────────────────────────────────────
  set(key: keyof ComponentConfig, v: any): void {
    if (!this.comp) return;
    (this.comp.config as any)[key] = v === '' ? undefined : v;
    this.editorState.scheduleAutoSave();
  }

  // ── Variant list per type ────────────────────────────────
  get variantOptions(): { value: string; label: string; color: string }[] {
    switch (this.comp?.type) {
      case ComponentType.MENU:
        return [
          { value: 'netflix',  label: 'Netflix',  color: '#E50914' },
          { value: 'material', label: 'Material', color: '#1565C0' },
          { value: 'facebook', label: 'Facebook', color: '#1877F2' },
          { value: 'minimal',  label: 'Minimal',  color: '#6b7280' },
        ];
      case ComponentType.CARD:
        return [
          { value: 'netflix',  label: 'Netflix',  color: '#E50914' },
          { value: 'minimal',  label: 'Minimal',  color: '#6b7280' },
          { value: 'product',  label: 'Produto',  color: '#16a34a' },
          { value: 'blog',     label: 'Blog',     color: '#d97706' },
        ];
      case ComponentType.CAROUSEL:
        return [
          { value: 'netflix',  label: 'Netflix',  color: '#E50914' },
          { value: 'hero',     label: 'Hero',     color: '#7c3aed' },
          { value: 'gallery',  label: 'Gallery',  color: '#0891b2' },
          { value: 'simple',   label: 'Simple',   color: '#6b7280' },
        ];
      case ComponentType.ACCORDION:
        return [
          { value: 'netflix',  label: 'Netflix FAQ', color: '#E50914' },
          { value: 'material', label: 'Material',    color: '#1565C0' },
          { value: 'minimal',  label: 'Minimal',     color: '#6b7280' },
        ];
      case ComponentType.FORM:
        return [
          { value: 'dark',    label: 'Dark',    color: '#27272a' },
          { value: 'light',   label: 'Light',   color: '#e5e7eb' },
          { value: 'contact', label: 'Contato', color: '#2563eb' },
        ];
      default:
        return [];
    }
  }

  variantColor(v: string): string {
    const MAP: Record<string, string> = {
      netflix: '#E50914', material: '#1565C0', facebook: '#1877F2',
      minimal: '#6b7280', hero: '#7c3aed', gallery: '#0891b2',
      simple: '#374151', product: '#16a34a', blog: '#d97706',
      dark: '#27272a', light: '#e5e7eb', contact: '#2563eb',
    };
    return MAP[v] ?? '#6b7280';
  }

  // ── Options lists ────────────────────────────────────────
  readonly borderStyles = ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge'];
  readonly positions    = ['', 'static', 'relative', 'absolute', 'fixed', 'sticky'];
  readonly displays     = ['', 'block', 'inline-block', 'flex', 'inline-flex', 'grid', 'none'];
  readonly overflows    = ['', 'visible', 'hidden', 'auto', 'scroll'];
  readonly flexDirs     = ['', 'row', 'row-reverse', 'column', 'column-reverse'];
  readonly alignItems   = ['', 'flex-start', 'flex-end', 'center', 'stretch', 'baseline'];
  readonly justifyContents = ['', 'flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'];
  readonly fontWeights  = ['300', '400', '500', '600', '700', '800', '900'];
  readonly textAligns   = ['left', 'center', 'right', 'justify'];
  readonly cursors      = ['', 'default', 'pointer', 'text', 'move', 'not-allowed', 'crosshair', 'zoom-in'];
  readonly mixBlends    = ['', 'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'difference', 'exclusion'];
}
