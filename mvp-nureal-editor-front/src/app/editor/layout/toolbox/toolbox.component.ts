import { Component } from '@angular/core';
import { EditorStateService } from '../../../core/services/editor-state.service';
import { ComponentType } from '../../../core/enums/component-type.enum';

@Component({
  selector: 'app-toolbox',
  standalone: true,
  templateUrl: './toolbox.component.html',
  styleUrls: ['./toolbox.component.scss'],
})
export class ToolboxComponent {

  groups = [
    {
      id: 'basic',
      name: 'Básicos',
      expanded: true,
      items: [
        { id: 'text', name: 'Texto', icon: '📝' },
        { id: 'title', name: 'Título', icon: '🔤' },
        { id: 'button', name: 'Botão', icon: '🔘' },
        { id: 'image', name: 'Imagem', icon: '🖼️' },
      ],
    },
    {
      id: 'web',
      name: 'Web',
      expanded: false,
      items: [
        { id: 'menu', name: 'Menu', icon: '📋' },
        { id: 'carousel', name: 'Carousel', icon: '🎞️' },
        { id: 'card', name: 'Card', icon: '📦' },
        { id: 'accordion', name: 'Accordion', icon: '📑' },
      ],
    },
    {
      id: 'forms',
      name: 'Formulários',
      expanded: false,
      items: [
        { id: 'input', name: 'Input', icon: '⌨️' },
        { id: 'checkbox', name: 'Checkbox', icon: '☑️' },
        { id: 'select', name: 'Select', icon: '📋' },
      ],
    },
    {
      id: 'layout',
      name: 'Layout',
      expanded: false,
      items: [
        { id: 'section', name: 'Section', icon: '📄' },
        { id: 'container', name: 'Container', icon: '📦' },
      ],
    },
  ];

  constructor(
    public editorState: EditorStateService
  ) {}

  toggle(group: any): void {
    group.expanded = !group.expanded;
  }

  selectItem(item: any): void {

    switch (item.id) {

      case 'container':
        this.editorState.createComponent(
          ComponentType.CONTAINER
        );
        break;

      case 'section':
        this.editorState.addSection();
        break;

      case 'text':
        this.editorState.createComponent(
          ComponentType.TEXT
        );
        break;

      case 'title':
        this.editorState.createComponent(
          ComponentType.TITLE
        );
        break;

      case 'button':
        this.editorState.createComponent(
          ComponentType.BUTTON
        );
        break;

      case 'image':
        this.editorState.createComponent(
          ComponentType.IMAGE
        );
        break;

      case 'menu':
        console.log('Adicionar Menu');
        break;

      case 'carousel':
        console.log('Adicionar Carousel');
        break;

      case 'card':
        console.log('Adicionar Card');
        break;

      case 'accordion':
        console.log('Adicionar Accordion');
        break;

      case 'input':
        console.log('Adicionar Input');
        break;

      case 'checkbox':
        console.log('Adicionar Checkbox');
        break;

      case 'select':
        console.log('Adicionar Select');
        break;

      default:
        console.log(item);

    }

  }

}
