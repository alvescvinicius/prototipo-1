import { ComponentType } from '../enums/component-type.enum';
import { PageComponent } from '../interfaces/page-component';

export class ComponentFactory {

  static create(type: ComponentType, order: number): PageComponent {

    switch (type) {

      case ComponentType.TEXT:
        return {
          id: crypto.randomUUID(), type, name: 'Texto', order, children: [],
          config: {
            content:       'Novo Texto',
            fontSize:      '16px',
            color:         '#1e293b',
            paddingTop:    '8px',
            paddingBottom: '8px',
          }
        };

      case ComponentType.TITLE:
        return {
          id: crypto.randomUUID(), type, name: 'Título', order, children: [],
          config: {
            content:       'Novo Título',
            fontSize:      '32px',
            fontWeight:    '700',
            color:         '#0f172a',
            paddingTop:    '16px',
            paddingBottom: '8px',
          }
        };

      case ComponentType.BUTTON:
        return {
          id: crypto.randomUUID(), type, name: 'Botão', order, children: [],
          config: {
            content:         'Clique Aqui',
            backgroundColor: '#2563eb',
            color:           '#ffffff',
            borderRadius:    '6px',
            paddingTop:      '10px',
            paddingBottom:   '10px',
            paddingLeft:     '24px',
            paddingRight:    '24px',
            fontSize:        '14px',
            fontWeight:      '500',
          }
        };

      case ComponentType.IMAGE:
        return {
          id: crypto.randomUUID(), type, name: 'Imagem', order, children: [],
          config: {
            src:   'https://placehold.co/800x300',
            width: '100%',
          }
        };

      case ComponentType.CONTAINER:
        return {
          id: crypto.randomUUID(), type, name: 'Container', order, children: [],
          config: {
            paddingTop:    '16px',
            paddingBottom: '16px',
            paddingLeft:   '16px',
            paddingRight:  '16px',
          }
        };

      case ComponentType.INPUT:
        return {
          id: crypto.randomUUID(), type, name: 'Input', order, children: [],
          config: {
            label:         'Campo',
            placeholder:   'Digite aqui...',
            paddingTop:    '8px',
            paddingBottom: '8px',
          }
        };

      case ComponentType.CHECKBOX:
        return {
          id: crypto.randomUUID(), type, name: 'Checkbox', order, children: [],
          config: {
            content:       'Aceito os termos e condições',
            paddingTop:    '8px',
            paddingBottom: '8px',
          }
        };

      case ComponentType.SELECT:
        return {
          id: crypto.randomUUID(), type, name: 'Select', order, children: [],
          config: {
            label:         'Selecione',
            placeholder:   'Escolha uma opção...',
            options:       'Opção 1,Opção 2,Opção 3',
            paddingTop:    '8px',
            paddingBottom: '8px',
          }
        };

      case ComponentType.MENU:
        return {
          id: crypto.randomUUID(), type, name: 'Menu', order, children: [],
          config: {
            items:           'Home,Sobre,Serviços,Contato',
            backgroundColor: '#1e293b',
            paddingTop:      '0px',
            paddingBottom:   '0px',
          }
        };

      case ComponentType.CARD:
        return {
          id: crypto.randomUUID(), type, name: 'Card', order, children: [],
          config: {
            content:      'Título do Card',
            description:  'Descrição do card com informações relevantes.',
            src:          'https://placehold.co/400x200',
            borderRadius: '10px',
            width:        '320px',
          }
        };

      case ComponentType.CAROUSEL:
        return {
          id: crypto.randomUUID(), type, name: 'Carousel', order, children: [],
          config: {
            items:  'Slide 1,Slide 2,Slide 3',
            width:  '100%',
            height: '200px',
          }
        };

      case ComponentType.ACCORDION:
        return {
          id: crypto.randomUUID(), type, name: 'Accordion', order, children: [],
          config: {
            items: 'Item 1,Item 2,Item 3',
            width: '100%',
          }
        };

      default:
        throw new Error(`Tipo não suportado: ${type}`);

    }
  }
}
