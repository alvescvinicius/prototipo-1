import {
  Component, OnInit, OnDestroy, HostListener, inject,
} from '@angular/core';
import { CommonModule }             from '@angular/common';
import { FormsModule }              from '@angular/forms';
import { EditorStateService }       from '../../../core/services/editor-state.service';
import { PageComponent }            from '../../../core/interfaces/page-component';
import { DragDropService }          from '../../../core/services/drag-drop.service';
import { ComponentType }            from '../../../core/enums/component-type.enum';
import { PagePropertiesComponent }  from '../page-properties/page-properties.component';
import { PropertiesComponent }      from '../properties/properties.component';
import { PageTreeComponent }        from '../page-tree/page-tree.component';

// ── Toolbox types ─────────────────────────────────────────────────────────

export interface ToolboxVariant { id: string; name: string; color: string; }
export interface ToolboxItem {
  id: string; name: string; icon: string; type: ComponentType;
  tags?: string[]; variants?: ToolboxVariant[];
}
export interface ToolboxGroup { id: string; name: string; items: ToolboxItem[]; }

export type P3Level = 'properties' | 'components';

// ─────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-floating-palette',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    PagePropertiesComponent, PropertiesComponent, PageTreeComponent,
  ],
  templateUrl: './floating-palette.component.html',
  styleUrls:   ['./floating-palette.component.scss'],
})
export class FloatingPaletteComponent implements OnInit, OnDestroy {

  editorState = inject(EditorStateService);
  dragDrop    = inject(DragDropService);

  // ── Group position (all panels share this) ────────────────
  groupX = 0;
  groupY = 0;

  ngOnInit(): void {
    // Anchor just below the Preview button (top-right area)
    this.groupX = window.innerWidth - this.P1W - 16;
    this.groupY = 56;
    this.p1Open = true;  // open by default
  }

  // Panel widths
  readonly P1W = 258;  // structure
  readonly P2W = 224;  // context options
  readonly GAP = 4;

  get p1Left() { return this.groupX; }
  get p2Left() { return this.groupX - this.P2W - this.GAP; }
  get p3Left() { return this.groupX - this.P2W - this.GAP - this.P3W - this.GAP; }

  readonly P3W = 260;  // detail panel width

  // ── Panel open state ──────────────────────────────────────
  p1Open = false;

  get p2Open(): boolean { return !!this.editorState.paletteContextTarget; }
  get ctxTarget()       { return this.editorState.paletteContextTarget; }
  get ctxIsPage()       { return this.ctxTarget?.nodeType === 'page'; }

  p3Level: P3Level | null = null;
  get p3Open() { return !!this.p3Level; }

  // ── Tree expand state ─────────────────────────────────────
  expandedNodes: Record<string, boolean> = {};

  // ── Tree drag-and-drop state ──────────────────────────────
  treeDragId:  string | null = null;
  treeDragOverId: string | null = null;
  treeDragPos: 'before' | 'into' | 'after' = 'after';

  // ── Drag state ────────────────────────────────────────────
  private _dragging = false;
  private _dragOffX = 0;
  private _dragOffY = 0;

  // ── Browser state (component browser split view) ──────────
  searchQuery          = '';
  browserGroupId       = 'basicos';
  browserShowVariants  = false;
  browserItemId?: string;

  // ── Toolbox data ──────────────────────────────────────────
  readonly groups: ToolboxGroup[] = [
    {
      id: 'basicos', name: 'Básicos',
      items: [
        { id: 'text',   name: 'Texto',  icon: 'T',  type: ComponentType.TEXT,   tags: ['text','texto'] },
        { id: 'title',  name: 'Título', icon: 'H',  type: ComponentType.TITLE,  tags: ['titulo','heading'] },
        { id: 'button', name: 'Botão',  icon: '▶',  type: ComponentType.BUTTON, tags: ['botao','btn'] },
        { id: 'image',  name: 'Imagem', icon: '🖼',  type: ComponentType.IMAGE,  tags: ['imagem','img'] },
      ],
    },
    {
      id: 'layout', name: 'Layout',
      items: [
        { id: 'container', name: 'Container', icon: '□', type: ComponentType.CONTAINER, tags: ['container','box'] },
        { id: 'grid',      name: 'Grid',      icon: '⊞', type: ComponentType.GRID,      tags: ['grid','colunas'] },
      ],
    },
    {
      id: 'web', name: 'Web',
      items: [
        { id: 'menu', name: 'Menu', icon: '≡', type: ComponentType.MENU, tags: ['menu','nav'],
          variants: [
            { id: 'netflix',  name: 'Netflix',  color: '#E50914' },
            { id: 'material', name: 'Material', color: '#1565C0' },
            { id: 'facebook', name: 'Facebook', color: '#1877F2' },
            { id: 'minimal',  name: 'Minimal',  color: '#6b7280' },
          ],
        },
        { id: 'carousel', name: 'Carousel', icon: '◁▷', type: ComponentType.CAROUSEL, tags: ['carousel','slider'],
          variants: [
            { id: 'netflix', name: 'Netflix', color: '#E50914' },
            { id: 'hero',    name: 'Hero',    color: '#7c3aed' },
            { id: 'gallery', name: 'Gallery', color: '#0891b2' },
            { id: 'simple',  name: 'Simple',  color: '#6b7280' },
          ],
        },
        { id: 'card', name: 'Card', icon: '🃏', type: ComponentType.CARD, tags: ['card'],
          variants: [
            { id: 'netflix', name: 'Netflix', color: '#E50914' },
            { id: 'minimal', name: 'Minimal', color: '#6b7280' },
            { id: 'product', name: 'Produto', color: '#16a34a' },
            { id: 'blog',    name: 'Blog',    color: '#d97706' },
          ],
        },
        { id: 'accordion', name: 'Accordion', icon: '⇕', type: ComponentType.ACCORDION, tags: ['faq'],
          variants: [
            { id: 'netflix',  name: 'Netflix FAQ', color: '#E50914' },
            { id: 'material', name: 'Material',    color: '#1565C0' },
            { id: 'minimal',  name: 'Minimal',     color: '#6b7280' },
          ],
        },
        { id: 'form', name: 'Formulário', icon: '📋', type: ComponentType.FORM, tags: ['form','leads'],
          variants: [
            { id: 'dark',    name: 'Dark',    color: '#27272a' },
            { id: 'light',   name: 'Light',   color: '#e5e7eb' },
            { id: 'contact', name: 'Contato', color: '#2563eb' },
          ],
        },
      ],
    },
    {
      id: 'formularios', name: 'Formulários',
      items: [
        { id: 'input',    name: 'Input',    icon: '_', type: ComponentType.INPUT,    tags: ['input','campo'] },
        { id: 'checkbox', name: 'Checkbox', icon: '☑', type: ComponentType.CHECKBOX, tags: ['checkbox'] },
        { id: 'select',   name: 'Select',   icon: '⌄', type: ComponentType.SELECT,   tags: ['select','dropdown'] },
      ],
    },
  ];

  // ── Browser getters ───────────────────────────────────────

  get browserGroup(): ToolboxGroup | undefined {
    return this.groups.find(g => g.id === this.browserGroupId);
  }

  get browserItem(): ToolboxItem | undefined {
    if (!this.browserItemId) return undefined;
    for (const g of this.groups) {
      const found = g.items.find(i => i.id === this.browserItemId);
      if (found) return found;
    }
    return undefined;
  }

  get browserRightItems(): ToolboxItem[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      return this.groups.flatMap(g => g.items).filter(i =>
        i.name.toLowerCase().includes(q) || i.tags?.some(t => t.includes(q))
      );
    }
    return this.browserGroup?.items ?? [];
  }

  groupOf(item: ToolboxItem): string {
    return this.groups.find(g => g.items.some(i => i.id === item.id))?.name ?? '';
  }

  // ── Panel 1 ───────────────────────────────────────────────

  toggleP1(): void { this.p1Open = !this.p1Open; }
  closeP1(): void  { this.p1Open = false; this.closeP2(); }

  // ── Panel 2 ───────────────────────────────────────────────

  openCtxFor(id: string, name: string, nodeType: 'page' | 'component'): void {
    this.editorState.paletteContextTarget = { id, name, nodeType };
    this.p3Level = null;
  }

  closeP2(): void {
    this.editorState.paletteContextTarget = null;
    this.closeP3();
  }

  // ── Panel 3 ───────────────────────────────────────────────

  openP3(level: P3Level): void {
    this.p3Level = level;
    if (level === 'components') {
      this.browserGroupId     = this.groups[0]?.id ?? 'basicos';
      this.browserShowVariants = false;
      this.browserItemId       = undefined;
      this.searchQuery         = '';
    }
  }

  closeP3(): void { this.p3Level = null; }

  get p3Label(): string {
    switch (this.p3Level) {
      case 'properties': return 'Propriedades';
      case 'components': return 'Componentes';
      default: return '';
    }
  }

  // ── Browser actions ───────────────────────────────────────

  selectBrowserGroup(id: string): void {
    this.browserGroupId      = id;
    this.browserShowVariants = false;
    this.browserItemId       = undefined;
    this.searchQuery         = '';
  }

  openBrowserItem(item: ToolboxItem): void {
    if (item.variants?.length) {
      this.browserItemId       = item.id;
      this.browserShowVariants = true;
    } else {
      this.editorState.addComponentToCanvas(item.type, undefined, undefined, undefined);
    }
  }

  backBrowserToItems(): void {
    this.browserShowVariants = false;
    this.browserItemId       = undefined;
  }

  addBrowserVariant(v: ToolboxVariant): void {
    if (!this.browserItem) return;
    this.editorState.addComponentToCanvas(this.browserItem.type, undefined, undefined, v.id);
  }

  // Legacy drag-drop from toolbox
  onDragStart(event: DragEvent, item: ToolboxItem, variantId?: string): void {
    this.dragDrop.startToolbox(item.type, variantId);
    event.dataTransfer?.setData('text/plain', item.type);
    event.dataTransfer!.effectAllowed = 'copy';
  }

  onDragEnd(): void { this.dragDrop.reset(); }

  // ── Drag (moves entire group) ─────────────────────────────

  startDrag(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('button,input,a,select')) return;
    this._dragging = true;
    this._dragOffX = event.clientX - this.groupX;
    this._dragOffY = event.clientY - this.groupY;
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (!this._dragging) return;
    const maxX = window.innerWidth  - 64;
    const maxY = window.innerHeight - 48;
    this.groupX = Math.max(0, Math.min(maxX, e.clientX - this._dragOffX));
    this.groupY = Math.max(0, Math.min(maxY, e.clientY - this._dragOffY));
  }

  @HostListener('document:mouseup')
  onMouseUp(): void { this._dragging = false; }

  // ── Tree helpers ─────────────────────────────────────────

  toggleNode(id: string): void {
    this.expandedNodes[id] = !this.expandedNodes[id];
  }

  isExpanded(id: string): boolean {
    return !!this.expandedNodes[id];
  }

  isSelected(comp: PageComponent): boolean {
    return this.editorState.selectedNode?.id === comp.id;
  }

  /**
   * 1º clique  → seleciona
   * 2º clique (já selecionado) → expande / recolhe filhos
   */
  onCompClick(comp: PageComponent): void {
    if (this.isSelected(comp)) {
      if (comp.children?.length) {
        this.toggleNode(comp.id);
      }
    } else {
      this.editorState.selectNode(comp);
    }
  }

  /** Duplo clique no componente já selecionado → abre propriedades */
  onCompDblClick(comp: PageComponent): void {
    this.editorState.selectNode(comp);
    this.openCtxFor(comp.id, comp.name, 'component');
    this.openP3('properties');
  }

  // ── Tree DnD methods ─────────────────────────────────────

  onTreeDragStart(id: string, event: DragEvent): void {
    this.treeDragId = id;
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/plain', id);
    event.stopPropagation();
  }

  onTreeDragOver(id: string, event: DragEvent): void {
    if (!this.treeDragId || this.treeDragId === id) return;
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const pct  = (event.clientY - rect.top) / rect.height;
    this.treeDragOverId = id;
    this.treeDragPos = pct < 0.25 ? 'before' : pct > 0.75 ? 'after' : 'into';
  }

  onTreeDrop(targetId: string, event: DragEvent): void {
    event.preventDefault();
    if (this.treeDragId && this.treeDragId !== targetId) {
      // Expand target when dropping into
      if (this.treeDragPos === 'into') this.expandedNodes[targetId] = true;
      this.editorState.moveComponentRelativeTo(this.treeDragId, targetId, this.treeDragPos);
    }
    this.treeDragId     = null;
    this.treeDragOverId = null;
  }

  onTreeDragEnd(): void {
    this.treeDragId     = null;
    this.treeDragOverId = null;
  }

  flatTree(
    comps: PageComponent[],
    depth = 0
  ): Array<{ comp: PageComponent; depth: number }> {
    const out: Array<{ comp: PageComponent; depth: number }> = [];
    for (const c of comps) {
      out.push({ comp: c, depth });
      if (this.expandedNodes[c.id] && c.children?.length) {
        out.push(...this.flatTree(c.children, depth + 1));
      }
    }
    return out;
  }

  ngOnDestroy(): void {}
}
