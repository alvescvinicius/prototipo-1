import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EditorStateService } from '../../../core/services/editor-state.service';
import { DragDropService }    from '../../../core/services/drag-drop.service';
import { ComponentType }      from '../../../core/enums/component-type.enum';

export interface ToolboxVariant {
  id:    string;
  name:  string;
  color: string; // ponto de cor no item
}

interface ToolboxItem {
  id:        string;
  name:      string;
  icon:      string;
  type:      ComponentType;
  draggable: boolean;
  tags?:     string[];
  variants?: ToolboxVariant[];
}

interface ToolboxGroup {
  id:       string;
  name:     string;
  expanded: boolean;
  items:    ToolboxItem[];
}

@Component({
  selector:    'app-toolbox',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './toolbox.component.html',
  styleUrls:   ['./toolbox.component.scss'],
})
export class ToolboxComponent {

  searchQuery = '';

  // Itens expandidos (mostrando variantes)
  expandedItems = new Set<string>();

  groups: ToolboxGroup[] = [
    {
      id: 'basic', name: 'Basicos', expanded: true,
      items: [
        { id: 'text',    name: 'Texto',   icon: 'T',  type: ComponentType.TEXT,   draggable: true, tags: ['text','texto','paragrafo'] },
        { id: 'title',   name: 'Titulo',  icon: 'H',  type: ComponentType.TITLE,  draggable: true, tags: ['titulo','heading','h1','h2'] },
        { id: 'button',  name: 'Botao',   icon: '▶',  type: ComponentType.BUTTON, draggable: true, tags: ['botao','button','btn','cta'] },
        { id: 'image',   name: 'Imagem',  icon: '🖼', type: ComponentType.IMAGE,  draggable: true, tags: ['imagem','image','foto','img'] },
      ],
    },
    {
      id: 'layout', name: 'Layout', expanded: true,
      items: [
        { id: 'container', name: 'Container', icon: '□', type: ComponentType.CONTAINER, draggable: true, tags: ['container','caixa','box'] },
        { id: 'grid',      name: 'Grid',      icon: '⊞', type: ComponentType.GRID,      draggable: true, tags: ['grid','colunas','columns'] },
      ],
    },
    {
      id: 'web', name: 'Web', expanded: true,
      items: [
        {
          id: 'menu', name: 'Menu', icon: '≡', type: ComponentType.MENU, draggable: true,
          tags: ['menu','nav','navegacao'],
          variants: [
            { id: 'netflix',  name: 'Netflix',  color: '#E50914' },
            { id: 'material', name: 'Material', color: '#1565C0' },
            { id: 'facebook', name: 'Facebook', color: '#1877F2' },
            { id: 'minimal',  name: 'Minimal',  color: '#6b7280' },
          ],
        },
        {
          id: 'carousel', name: 'Carousel', icon: '◁▷', type: ComponentType.CAROUSEL, draggable: true,
          tags: ['carousel','slider','slide'],
          variants: [
            { id: 'netflix', name: 'Netflix', color: '#E50914' },
            { id: 'hero',    name: 'Hero',    color: '#7c3aed' },
            { id: 'gallery', name: 'Gallery', color: '#0891b2' },
            { id: 'simple',  name: 'Simple',  color: '#6b7280' },
          ],
        },
        {
          id: 'card', name: 'Card', icon: '🃏', type: ComponentType.CARD, draggable: true,
          tags: ['card','cartao'],
          variants: [
            { id: 'netflix',  name: 'Netflix',  color: '#E50914' },
            { id: 'minimal',  name: 'Minimal',  color: '#6b7280' },
            { id: 'product',  name: 'Produto',  color: '#16a34a' },
            { id: 'blog',     name: 'Blog',     color: '#d97706' },
          ],
        },
        {
          id: 'accordion', name: 'Accordion', icon: '⇕', type: ComponentType.ACCORDION, draggable: true,
          tags: ['accordion','faq','acordeao'],
          variants: [
            { id: 'netflix',  name: 'Netflix FAQ', color: '#E50914' },
            { id: 'material', name: 'Material',    color: '#1565C0' },
            { id: 'minimal',  name: 'Minimal',     color: '#6b7280' },
          ],
        },
        {
          id: 'form', name: 'Formulário', icon: '📋', type: ComponentType.FORM, draggable: true,
          tags: ['form','formulario','captura','contato','leads'],
          variants: [
            { id: 'dark',    name: 'Dark',    color: '#27272a' },
            { id: 'light',   name: 'Light',   color: '#e5e7eb' },
            { id: 'contact', name: 'Contato', color: '#2563eb' },
          ],
        },
      ],
    },
    {
      id: 'forms', name: 'Formularios', expanded: true,
      items: [
        { id: 'input',    name: 'Input',    icon: '_', type: ComponentType.INPUT,    draggable: true, tags: ['input','campo','form'] },
        { id: 'checkbox', name: 'Checkbox', icon: '☑', type: ComponentType.CHECKBOX, draggable: true, tags: ['checkbox','check'] },
        { id: 'select',   name: 'Select',   icon: '⌄', type: ComponentType.SELECT,   draggable: true, tags: ['select','dropdown'] },
      ],
    },
  ];

  constructor(
    public editorState: EditorStateService,
    public dragDrop:    DragDropService,
  ) {}

  get filteredGroups(): ToolboxGroup[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.groups;

    return this.groups
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          item.name.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q)   ||
          item.tags?.some(t => t.includes(q))
        ),
      }))
      .filter(group => group.items.length > 0);
  }

  get isFiltering(): boolean { return this.searchQuery.trim().length > 0; }

  clearSearch(): void { this.searchQuery = ''; }

  toggle(group: ToolboxGroup): void {
    if (!this.isFiltering) group.expanded = !group.expanded;
  }

  toggleVariants(item: ToolboxItem, event: MouseEvent): void {
    event.stopPropagation();
    if (this.expandedItems.has(item.id)) {
      this.expandedItems.delete(item.id);
    } else {
      this.expandedItems.add(item.id);
    }
  }

  isExpanded(item: ToolboxItem): boolean {
    return this.expandedItems.has(item.id);
  }

  selectItem(item: ToolboxItem): void {
    this.editorState.addComponentToCanvas(item.type, undefined, undefined, undefined);
  }

  selectVariant(item: ToolboxItem, variant: ToolboxVariant): void {
    this.editorState.addComponentToCanvas(item.type, undefined, undefined, variant.id);
  }

  onDragStart(event: DragEvent, item: ToolboxItem, variantId?: string): void {
    this.dragDrop.startToolbox(item.type, variantId);
    event.dataTransfer?.setData('text/plain', item.type);
    event.dataTransfer!.effectAllowed = 'copy';
  }

  onDragEnd(): void { this.dragDrop.reset(); }
}
