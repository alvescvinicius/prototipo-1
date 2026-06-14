import { ComponentType } from '../enums/component-type.enum';
import { PageComponent } from '../interfaces/page-component';

export class ComponentFactory {

  static create(
    type: ComponentType,
    order: number
  ): PageComponent {

    switch (type) {

      case ComponentType.TEXT:

        return {
          id: crypto.randomUUID(),
          type: ComponentType.TEXT,
          name: 'Texto',
          order,
          children: [],
          config: {
            content: 'Novo Texto'
          }
        };

      case ComponentType.TITLE:

        return {
          id: crypto.randomUUID(),
          type: ComponentType.TITLE,
          name: 'Título',
          order,
          children: [],
          config: {
            content: 'Novo Título'
          }
        };

      case ComponentType.BUTTON:

        return {
          id: crypto.randomUUID(),
          type: ComponentType.BUTTON,
          name: 'Botão',
          order,
          children: [],
          config: {
            content: 'Clique Aqui'
          }
        };

      case ComponentType.IMAGE:

        return {
          id: crypto.randomUUID(),
          type: ComponentType.IMAGE,
          name: 'Imagem',
          order,
          children: [],
          config: {
            src: 'https://placehold.co/600x300'
          }
        };

      case ComponentType.CONTAINER:

        return {
          id: crypto.randomUUID(),
          type: ComponentType.CONTAINER,
          name: 'Container',
          order,
          children: [],
          config: {}
        };

      default:

        throw new Error(
          `Tipo não suportado: ${type}`
        );

    }

  }

}
