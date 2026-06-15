import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EditorStateService } from '../../../core/services/editor-state.service';
import { DragDropService } from '../../../core/services/drag-drop.service';
import { ComponentType } from '../../../core/enums/component-type.enum';

@Component({
  selector: 'app-toolbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toolbox.component.html',
  styleUrls: ['./toolbox.component.scss'],
})
export class ToolboxComponent {

  groups = [
    {
      id: 'basic',
      name: 'Basicos',
      expanded: true,
      items: [
        { id: 'text',   name: 'Texto',   icon: 'T',  type: ComponentType.TEXT,   draggable: true },
        { id: 'title',  name: 'Titulo',  icon: 'H',  type: ComponentType.TITLE,  draggable: true },
        { id: 'button', name: 'Botao',   icon: 'B',  type: ComponentType.BUTTON, draggable: true },
        { id: 'image',  name: 'Imagem',  icon: 'I',  type: ComponentType.IMAGE,  draggable: true },
      ],
    },
    {
      id: 'layout',
      name: 'Layout',
      expanded: true,
      items: [
        { id: 'section',   name: 'Section',   icon: 'S', type: ComponentType.SECTION,   draggable: true },
        { id: 'container', name: 'Container', icon: 'C', type: ComponentType.CONTAINER, draggable: true },
        { id: 'grid', name: 'Grid', icon: '⊞', type: ComponentType.GRID, draggable: true },
      ],
    },
    {
      id: 'web',
      name: 'Web',
      expanded: true,
      items: [
        { id: 'menu',      name: 'Menu',      icon: 'M', type: ComponentType.MENU,      draggable: true },
        { id: 'carousel',  name: 'Carousel',  icon: 'C', type: ComponentType.CAROUSEL,  draggable: true },
        { id: 'card',      name: 'Card',      icon: 'K', type: ComponentType.CARD,      draggable: true },
        { id: 'accordion', name: 'Accordion', icon: 'A', type: ComponentType.ACCORDION, draggable: true },
      ],
    },
    {
      id: 'forms',
      name: 'Formularios',
      expanded: true,
      items: [
        { id: 'input',    name: 'Input',    icon: '_', type: ComponentType.INPUT,    draggable: true },
        { id: 'checkbox', name: 'Checkbox', icon: 'V', type: ComponentType.CHECKBOX, draggable: true },
        { id: 'select',   name: 'Select',   icon: 'D', type: ComponentType.SELECT,   draggable: true },
      ],
    },
  ];

  constructor(
    public editorState: EditorStateService,
    public dragDrop:    DragDropService,
  ) {}

  toggle(group: any): void {
    group.expanded = !group.expanded;
  }

  selectItem(item: any): void {
    if (item.type === ComponentType.SECTION) {
      this.editorState.addSection();
      return;
    }
    if (item.type) {
      this.editorState.createComponent(item.type as ComponentType);
    }
  }

  onDragStart(event: DragEvent, item: any): void {
    if (!item.draggable || !item.type) {
      event.preventDefault();
      return;
    }
    this.dragDrop.startToolbox(item.type as ComponentType);
    event.dataTransfer?.setData('text/plain', item.type);
    event.dataTransfer!.effectAllowed = 'copy';
  }

  onDragEnd(): void {
    this.dragDrop.reset();
  }

}
