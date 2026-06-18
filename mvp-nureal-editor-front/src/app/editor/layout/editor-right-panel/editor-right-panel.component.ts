import {
  Component, OnInit, AfterViewInit, OnDestroy, inject, HostListener, ElementRef,
} from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { Router }        from '@angular/router';
import { EditorStateService }      from '../../../core/services/editor-state.service';
import { DragDropService }         from '../../../core/services/drag-drop.service';
import { ComponentType }           from '../../../core/enums/component-type.enum';
import { PageComponent }           from '../../../core/interfaces/page-component';
import { PagePropertiesComponent } from '../page-properties/page-properties.component';
import { PropertiesComponent }     from '../properties/properties.component';

export interface ToolboxVariant { id: string; name: string; color: string; }
export interface ToolboxItem { id: string; name: string; icon: string; type: ComponentType; tags?: string[]; variants?: ToolboxVariant[]; }
export interface ToolboxGroup { id: string; name: string; items: ToolboxItem[]; }

export type RightTab     = 'structure' | 'properties' | 'components' | 'actions' | 'triggers';
export type BottomTab    = 'properties' | 'components' | 'actions' | 'triggers';

@Component({
  selector: 'app-editor-right-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, PagePropertiesComponent, PropertiesComponent],
  templateUrl: './editor-right-panel.component.html',
  styleUrls: ['./editor-right-panel.component.scss'],
})
export class EditorRightPanelComponent implements OnInit, AfterViewInit, OnDestroy {

  editorState = inject(EditorStateService);
  dragDrop    = inject(DragDropService);
  private router  = inject(Router);
  private hostEl  = inject(ElementRef<HTMLElement>);

  activeTab:  RightTab  = 'structure';
  bottomTab:  BottomTab = 'properties';
  expanded = true;

  // ── Tamanhos redimensionáveis ─────────────────────────────
  panelWidth = 300;   // largura total do painel expandido (px)
  topHeight  = 140;   // altura do bloco ESTRUTURA (px) — o bloco inferior preenche o restante

  readonly PANEL_MIN = 220;
  readonly PANEL_MAX = 600;
  readonly TOP_MIN   = 60;    // estrutura mínima visível
  readonly TOP_MAX   = 800;   // limite superior (telas grandes)

  // estado interno do drag
  private _resizeType: 'panel' | 'divider' | null = null;
  private _resizeStart = 0;
  private _resizeOrigin = 0;

  // ── Tree state ────────────────────────────────────────────
  expandedNodes: Record<string, boolean> = {};
  treeDragId:    string | null = null;
  treeDragOverId: string | null = null;
  treeDragPos: 'before' | 'into' | 'after' = 'after';

  // ── Quick-add popup ───────────────────────────────────────
  quickAddTargetId: string | null = null;
  quickAddTarget:   PageComponent | null = null;
  quickAddItemId:   string | null = null;
  quickAddPanelY  = 0;

  // ── Browser state ─────────────────────────────────────────
  searchQuery         = '';
  browserGroupId      = 'basicos';
  browserShowVariants = false;
  browserItemId?: string;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // Divide o painel 50/50 entre estrutura e propriedades por padrão
    const totalH = this.hostEl.nativeElement.clientHeight;
    if (totalH > 0) {
      this.topHeight = Math.round(totalH / 2);
    }
  }

  ngOnDestroy(): void { this._stopResize(); }

  // ── Resize: largura do painel ─────────────────────────────
  onPanelResizeStart(e: MouseEvent): void {
    e.preventDefault();
    this._resizeType   = 'panel';
    this._resizeStart  = e.clientX;
    this._resizeOrigin = this.panelWidth;
    this._attachListeners();
  }

  // ── Resize: altura do divisor interno ─────────────────────
  onDividerResizeStart(e: MouseEvent): void {
    e.preventDefault();
    this._resizeType   = 'divider';
    this._resizeStart  = e.clientY;
    this._resizeOrigin = this.topHeight;
    this._attachListeners();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (!this._resizeType) return;
    if (this._resizeType === 'panel') {
      const delta = this._resizeStart - e.clientX;   // arrasta p/ esquerda = aumenta
      this.panelWidth = Math.max(this.PANEL_MIN, Math.min(this.PANEL_MAX, this._resizeOrigin + delta));
    } else {
      const delta = e.clientY - this._resizeStart;   // arrasta p/ baixo = aumenta top
      this.topHeight = Math.max(this.TOP_MIN, Math.min(this.TOP_MAX, this._resizeOrigin + delta));
    }
  }

  @HostListener('document:mouseup')
  onMouseUp(): void { this._stopResize(); }

  @HostListener('document:keydown.escape')
  onEsc(): void { this.closeQuickAdd(); }

  private _attachListeners(): void {
    document.body.style.userSelect = 'none';
    document.body.style.cursor = this._resizeType === 'panel' ? 'ew-resize' : 'ns-resize';
  }

  private _stopResize(): void {
    this._resizeType = null;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }

  setTab(tab: RightTab): void {
    if (this.activeTab === tab && this.expanded) {
      this.expanded = false;
    } else {
      this.activeTab = tab;
      this.expanded  = true;
    }
  }

  openPreview(): void { this.router.navigate(['/preview']); }

  // ── Tree helpers ──────────────────────────────────────────
  toggleNode(id: string): void { this.expandedNodes[id] = !this.expandedNodes[id]; }
  isExpanded(id: string): boolean { return !!this.expandedNodes[id]; }
  isSelected(comp: PageComponent): boolean { return this.editorState.selectedNode?.id === comp.id; }

  typeIcon(type: ComponentType): string {
    const MAP: Partial<Record<ComponentType, string>> = {
      [ComponentType.TEXT]:      'T',
      [ComponentType.TITLE]:     'H',
      [ComponentType.BUTTON]:    '▶',
      [ComponentType.IMAGE]:     '🖼',
      [ComponentType.CONTAINER]: '□',
      [ComponentType.GRID]:      '⊞',
      [ComponentType.MENU]:      '≡',
      [ComponentType.CARD]:      '🃏',
      [ComponentType.CAROUSEL]:  '◁▷',
      [ComponentType.ACCORDION]: '⇕',
      [ComponentType.FORM]:      '📋',
      [ComponentType.INPUT]:     '_',
      [ComponentType.CHECKBOX]:  '☑',
      [ComponentType.SELECT]:    '⌄',
    };
    return MAP[type] ?? '⬡';
  }

  onCompClick(comp: PageComponent): void {
    if (this.isSelected(comp)) {
      if (comp.children?.length) this.toggleNode(comp.id);
    } else {
      this.editorState.selectNode(comp);
    }
  }

  onCompDblClick(comp: PageComponent): void {
    this.editorState.selectNode(comp);
    this.bottomTab = 'properties';
    this.expanded  = true;
  }

  // ── Quick-add popup ───────────────────────────────────────
  openQuickAdd(comp: PageComponent, event: MouseEvent): void {
    event.stopPropagation();
    if (this.quickAddTargetId === comp.id) { this.closeQuickAdd(); return; }
    const btn = event.currentTarget as HTMLElement;
    const row = btn.closest('.rp-comp-row') as HTMLElement | null;
    const rect = (row ?? btn).getBoundingClientRect();
    this.quickAddPanelY  = rect.top;
    this.quickAddTargetId = comp.id;
    this.quickAddTarget   = comp;
    this.quickAddItemId   = null;
  }

  closeQuickAdd(): void {
    this.quickAddTargetId = null;
    this.quickAddTarget   = null;
    this.quickAddItemId   = null;
  }

  get quickAddItem(): ToolboxItem | undefined {
    if (!this.quickAddItemId) return undefined;
    for (const g of this.groups) {
      const f = g.items.find(i => i.id === this.quickAddItemId);
      if (f) return f;
    }
    return undefined;
  }

  quickAddOpenItem(item: ToolboxItem): void {
    if (item.variants?.length) { this.quickAddItemId = item.id; return; }
    this._quickAddCommit(item.type);
  }

  quickAddPickVariant(v: ToolboxVariant): void {
    if (!this.quickAddItem) return;
    this._quickAddCommit(this.quickAddItem.type, v.id);
  }

  quickAddSwitchTab(tab: BottomTab): void {
    this.bottomTab = tab;
    if (this.quickAddTarget) this.editorState.selectNode(this.quickAddTarget);
    this.closeQuickAdd();
  }

  private _quickAddCommit(type: ComponentType, variantId?: string): void {
    if (this.quickAddTarget) {
      this.editorState.selectNode(this.quickAddTarget);
      this.expandedNodes[this.quickAddTarget.id] = true;
    }
    this.editorState.createComponent(type, variantId);
    this.closeQuickAdd();
    this.bottomTab = 'properties';
  }

  addChildTo(comp: PageComponent, event: MouseEvent): void {
    event.stopPropagation();
    this.editorState.selectNode(comp);
    this.expandedNodes[comp.id] = true;
    this.bottomTab = 'components';
    this.expanded  = true;
    this.browserShowVariants = false;
    this.browserItemId = undefined;
    this.searchQuery = '';
  }

  deleteComp(comp: PageComponent, event: MouseEvent): void {
    event.stopPropagation();
    this.editorState.deleteComponent(comp.id);
  }

  flatTree(comps: PageComponent[], depth = 0): Array<{ comp: PageComponent; depth: number }> {
    const out: Array<{ comp: PageComponent; depth: number }> = [];
    for (const c of comps) {
      out.push({ comp: c, depth });
      if (this.expandedNodes[c.id] && c.children?.length) out.push(...this.flatTree(c.children, depth + 1));
    }
    return out;
  }

  // ── Tree DnD ─────────────────────────────────────────────
  onTreeDragStart(id: string, e: DragEvent): void { this.treeDragId = id; e.dataTransfer!.effectAllowed = 'move'; e.stopPropagation(); }
  onTreeDragOver(id: string, e: DragEvent): void {
    if (!this.treeDragId || this.treeDragId === id) return;
    e.preventDefault(); e.dataTransfer!.dropEffect = 'move';
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const p = (e.clientY - r.top) / r.height;
    this.treeDragOverId = id;
    this.treeDragPos = p < 0.25 ? 'before' : p > 0.75 ? 'after' : 'into';
  }
  onTreeDrop(targetId: string, e: DragEvent): void {
    e.preventDefault();
    if (this.treeDragId && this.treeDragId !== targetId) {
      if (this.treeDragPos === 'into') this.expandedNodes[targetId] = true;
      this.editorState.moveComponentRelativeTo(this.treeDragId, targetId, this.treeDragPos);
    }
    this.treeDragId = this.treeDragOverId = null;
  }
  onTreeDragEnd(): void { this.treeDragId = this.treeDragOverId = null; }

  // ── Browser ───────────────────────────────────────────────
  readonly groups: ToolboxGroup[] = [
    { id: 'basicos', name: 'Básicos', items: [
        { id: 'text',   name: 'Texto',  icon: 'T',  type: ComponentType.TEXT,   tags: ['text','texto'] },
        { id: 'title',  name: 'Título', icon: 'H',  type: ComponentType.TITLE,  tags: ['titulo','heading'] },
        { id: 'button', name: 'Botão',  icon: '▶',  type: ComponentType.BUTTON, tags: ['botao','btn'] },
        { id: 'image',  name: 'Imagem', icon: '🖼', type: ComponentType.IMAGE,  tags: ['imagem','img'] },
    ]},
    { id: 'layout', name: 'Layout', items: [
        { id: 'container', name: 'Container', icon: '□', type: ComponentType.CONTAINER, tags: ['container'] },
        { id: 'grid',      name: 'Grid',      icon: '⊞', type: ComponentType.GRID,      tags: ['grid'] },
    ]},
    { id: 'web', name: 'Web', items: [
        { id: 'menu',      name: 'Menu',       icon: '≡',  type: ComponentType.MENU,      tags: ['menu','nav'],
          variants: [{ id:'netflix',name:'Netflix',color:'#E50914'},{ id:'material',name:'Material',color:'#1565C0'},{ id:'facebook',name:'Facebook',color:'#1877F2'},{ id:'minimal',name:'Minimal',color:'#6b7280'}] },
        { id: 'carousel',  name: 'Carousel',   icon: '◁▷', type: ComponentType.CAROUSEL,  tags: ['carousel','slider'],
          variants: [{ id:'netflix',name:'Netflix',color:'#E50914'},{ id:'hero',name:'Hero',color:'#7c3aed'},{ id:'gallery',name:'Gallery',color:'#0891b2'},{ id:'simple',name:'Simple',color:'#6b7280'}] },
        { id: 'card',      name: 'Card',       icon: '🃏', type: ComponentType.CARD,      tags: ['card'],
          variants: [{ id:'netflix',name:'Netflix',color:'#E50914'},{ id:'minimal',name:'Minimal',color:'#6b7280'},{ id:'product',name:'Produto',color:'#16a34a'},{ id:'blog',name:'Blog',color:'#d97706'}] },
        { id: 'accordion', name: 'Accordion',  icon: '⇕',  type: ComponentType.ACCORDION, tags: ['faq'],
          variants: [{ id:'netflix',name:'Netflix FAQ',color:'#E50914'},{ id:'material',name:'Material',color:'#1565C0'},{ id:'minimal',name:'Minimal',color:'#6b7280'}] },
        { id: 'form',      name: 'Formulário', icon: '📋', type: ComponentType.FORM,      tags: ['form','leads'],
          variants: [{ id:'dark',name:'Dark',color:'#27272a'},{ id:'light',name:'Light',color:'#e5e7eb'},{ id:'contact',name:'Contato',color:'#2563eb'}] },
    ]},
    { id: 'formularios', name: 'Formulários', items: [
        { id: 'input',    name: 'Input',    icon: '_', type: ComponentType.INPUT,    tags: ['input'] },
        { id: 'checkbox', name: 'Checkbox', icon: '☑', type: ComponentType.CHECKBOX, tags: ['checkbox'] },
        { id: 'select',   name: 'Select',   icon: '⌄', type: ComponentType.SELECT,   tags: ['select'] },
    ]},
  ];

  get browserGroup() { return this.groups.find(g => g.id === this.browserGroupId); }
  get browserItem()  { for (const g of this.groups) { const f = g.items.find(i => i.id === this.browserItemId); if (f) return f; } return undefined; }
  get browserItems(): ToolboxItem[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (q) return this.groups.flatMap(g => g.items).filter(i => i.name.toLowerCase().includes(q) || i.tags?.some(t => t.includes(q)));
    return this.browserGroup?.items ?? [];
  }
  groupOf(item: ToolboxItem): string { return this.groups.find(g => g.items.some(i => i.id === item.id))?.name ?? ''; }
  selectGroup(id: string): void { this.browserGroupId = id; this.browserShowVariants = false; this.browserItemId = undefined; this.searchQuery = ''; }

  get selectedPageComp(): PageComponent | null {
    const sel = this.editorState.selectedNode as PageComponent;
    return sel?.children !== undefined ? sel : null;
  }

  openItem(item: ToolboxItem): void {
    if (item.variants?.length) {
      this.browserItemId = item.id;
      this.browserShowVariants = true;
    } else {
      const parentId = this.selectedPageComp?.id;
      this.editorState.createComponent(item.type);
      if (parentId) this.expandedNodes[parentId] = true;
      // Foca propriedades após adicionar componente
      this.bottomTab = 'properties';
    }
  }

  addVariant(v: ToolboxVariant): void {
    if (!this.browserItem) return;
    const parentId = this.selectedPageComp?.id;
    this.editorState.createComponent(this.browserItem.type, v.id);
    if (parentId) this.expandedNodes[parentId] = true;
    this.browserShowVariants = false;
    this.browserItemId = undefined;
    this.bottomTab = 'properties';
  }

  backToItems(): void { this.browserShowVariants = false; this.browserItemId = undefined; }
  onDragStart(e: DragEvent, item: ToolboxItem, variantId?: string): void {
    this.dragDrop.startToolbox(item.type, variantId);
    e.dataTransfer?.setData('text/plain', item.type);
    e.dataTransfer!.effectAllowed = 'copy';
  }
  onDragEnd(): void { this.dragDrop.reset(); }
}
