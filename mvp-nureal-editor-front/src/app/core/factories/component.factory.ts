import { ComponentType } from '../enums/component-type.enum';
import { PageComponent } from '../interfaces/page-component';
import { ComponentConfig } from '../interfaces/component-config';
import { FormField } from '../interfaces/form-field';

const MENU_PRESETS: Record<string, Partial<ComponentConfig>> = {
  netflix:  { variant: 'netflix',  items: 'Inicio,Series,Filmes,Novidades,Minha Lista' },
  material: { variant: 'material', items: 'Home,Produtos,Sobre,Contato' },
  facebook: { variant: 'facebook', items: 'Feed,Amigos,Grupos,Marketplace' },
  minimal:  { variant: 'minimal',  items: 'Home,Sobre,Servicos,Contato' },
};

const CARD_PRESETS: Record<string, Partial<ComponentConfig>> = {
  netflix: {
    variant: 'netflix', width: '280px',
    content: 'Titulo do Card', description: 'Descricao breve do conteudo.',
    src: 'https://placehold.co/320x180/181818/444444?text=',
  },
  minimal: {
    variant: 'minimal', width: '280px',
    content: 'Titulo do Card', description: 'Descricao breve do conteudo.',
    src: 'https://placehold.co/320x180/f0f0f0/aaaaaa?text=',
  },
  product: {
    variant: 'product', width: '260px',
    content: 'Nome do Produto', description: 'R$ 299,00',
    src: 'https://placehold.co/320x240/fafafa/999999?text=',
  },
  blog: {
    variant: 'blog', width: '340px',
    content: 'Titulo do Post', description: 'Resumo do artigo com as principais informacoes.',
    src: 'https://placehold.co/360x200/f8f9fa/bbbbbb?text=',
  },
};

const CAROUSEL_PRESETS: Record<string, Partial<ComponentConfig>> = {
  netflix: { variant: 'netflix', width: '100%', height: '300px' },
  hero:    { variant: 'hero',    width: '100%', height: '500px' },
  gallery: { variant: 'gallery', width: '100%', height: '380px' },
  simple:  { variant: 'simple',  width: '100%', height: '240px' },
};

const ACCORDION_PRESETS: Record<string, Partial<ComponentConfig>> = {
  netflix:  { variant: 'netflix',  width: '100%', items: 'O que e o Nureal?,Como funciona?,Qual o preco?' },
  material: { variant: 'material', width: '100%', items: 'Pergunta Frequente 1,Pergunta Frequente 2,Pergunta Frequente 3' },
  minimal:  { variant: 'minimal',  width: '100%', items: 'Item 1,Item 2,Item 3' },
};

const FORM_PRESETS: Record<string, Partial<ComponentConfig>> = {
  dark:    { variant: 'dark',    submitLabel: 'Enviar', width: '100%', paddingTop: '24px', paddingBottom: '24px', paddingLeft: '24px', paddingRight: '24px' },
  light:   { variant: 'light',   submitLabel: 'Enviar', width: '100%', paddingTop: '24px', paddingBottom: '24px', paddingLeft: '24px', paddingRight: '24px' },
  contact: { variant: 'contact', submitLabel: 'Enviar Mensagem', width: '100%', paddingTop: '32px', paddingBottom: '32px', paddingLeft: '32px', paddingRight: '32px' },
};

export class ComponentFactory {

  static create(type: ComponentType, order: number, variant?: string): PageComponent {

    switch (type) {

      case ComponentType.TEXT:
        return {
          id: crypto.randomUUID(), type, name: 'Texto', order, children: [],
          config: { content: 'Novo Texto', fontSize: '16px', color: '#1e293b', paddingTop: '8px', paddingBottom: '8px' }
        };

      case ComponentType.TITLE:
        return {
          id: crypto.randomUUID(), type, name: 'Titulo', order, children: [],
          config: { content: 'Novo Titulo', fontSize: '32px', fontWeight: '700', color: '#0f172a', paddingTop: '16px', paddingBottom: '8px' }
        };

      case ComponentType.BUTTON:
        return {
          id: crypto.randomUUID(), type, name: 'Botao', order, children: [],
          config: {
            content: 'Clique Aqui', backgroundColor: '#2563eb', color: '#ffffff',
            borderRadius: '6px', paddingTop: '10px', paddingBottom: '10px',
            paddingLeft: '24px', paddingRight: '24px', fontSize: '14px', fontWeight: '500',
          }
        };

      case ComponentType.IMAGE:
        return {
          id: crypto.randomUUID(), type, name: 'Imagem', order, children: [],
          config: { src: 'https://placehold.co/800x300', width: '100%' }
        };

      case ComponentType.CONTAINER:
        return {
          id: crypto.randomUUID(), type, name: 'Container', order, children: [],
          config: { paddingTop: '16px', paddingBottom: '16px', paddingLeft: '16px', paddingRight: '16px' }
        };

      case ComponentType.INPUT:
        return {
          id: crypto.randomUUID(), type, name: 'Input', order, children: [],
          config: { label: 'Campo', placeholder: 'Digite aqui...', paddingTop: '8px', paddingBottom: '8px' }
        };

      case ComponentType.CHECKBOX:
        return {
          id: crypto.randomUUID(), type, name: 'Checkbox', order, children: [],
          config: { content: 'Aceito os termos e condicoes', paddingTop: '8px', paddingBottom: '8px' }
        };

      case ComponentType.SELECT:
        return {
          id: crypto.randomUUID(), type, name: 'Select', order, children: [],
          config: { label: 'Selecione', placeholder: 'Escolha uma opcao...', options: 'Opcao 1,Opcao 2,Opcao 3', paddingTop: '8px', paddingBottom: '8px' }
        };

      case ComponentType.MENU: {
        const preset = MENU_PRESETS[variant || 'netflix'] ?? MENU_PRESETS['netflix'];
        return {
          id: crypto.randomUUID(), type,
          name: 'Menu (' + preset.variant + ')', order, children: [],
          config: { ...preset }
        };
      }

      case ComponentType.CARD: {
        const preset = CARD_PRESETS[variant || 'netflix'] ?? CARD_PRESETS['netflix'];
        return {
          id: crypto.randomUUID(), type,
          name: 'Card (' + preset.variant + ')', order, children: [],
          config: { ...preset }
        };
      }

      case ComponentType.CAROUSEL: {
        const preset = CAROUSEL_PRESETS[variant || 'netflix'] ?? CAROUSEL_PRESETS['netflix'];
        const makeSlide = (n: number) => ({
          id: crypto.randomUUID(),
          type: ComponentType.CONTAINER,
          name: 'Slide ' + n,
          order: n,
          children: [] as PageComponent[],
          config: { width: '100%', height: '100%' }
        });
        return {
          id: crypto.randomUUID(), type,
          name: 'Carousel (' + preset.variant + ')', order,
          children: [makeSlide(1), makeSlide(2), makeSlide(3)],
          config: { ...preset }
        };
      }

      case ComponentType.ACCORDION: {
        const preset = ACCORDION_PRESETS[variant || 'netflix'] ?? ACCORDION_PRESETS['netflix'];
        return {
          id: crypto.randomUUID(), type,
          name: 'Accordion (' + preset.variant + ')', order, children: [],
          config: { ...preset }
        };
      }

      case ComponentType.FORM: {
        const preset = FORM_PRESETS[variant || 'dark'] ?? FORM_PRESETS['dark'];
        const baseFields: FormField[] = [
          { id: crypto.randomUUID(), type: 'text',  label: 'Nome',  placeholder: 'Seu nome', required: true },
          { id: crypto.randomUUID(), type: 'email', label: 'Email', placeholder: 'seu@email.com', required: true },
        ];
        const contactFields: FormField[] = [
          ...baseFields,
          { id: crypto.randomUUID(), type: 'textarea', label: 'Mensagem', placeholder: 'Escreva sua mensagem...', required: false },
        ];
        return {
          id: crypto.randomUUID(), type,
          name: 'Formulario (' + preset.variant + ')', order, children: [],
          config: {
            formId: crypto.randomUUID(),
            formFields: preset.variant === 'contact' ? contactFields : baseFields,
            ...preset,
          }
        };
      }

      case ComponentType.GRID:
        return {
          id: crypto.randomUUID(), type, name: 'Grid', order, children: [],
          config: { columns: '3', paddingTop: '16px', paddingBottom: '16px', paddingLeft: '16px', paddingRight: '16px' }
        };

          default:
        throw new Error('Tipo nao suportado: ' + type);
    }
  }
}
