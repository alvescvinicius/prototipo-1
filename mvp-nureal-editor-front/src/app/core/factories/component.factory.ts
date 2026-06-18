import { ComponentType } from '../enums/component-type.enum';
import { PageComponent } from '../interfaces/page-component';
import { ComponentConfig } from '../interfaces/component-config';
import { FormField } from '../interfaces/form-field';

// ── Helpers ───────────────────────────────────────────────────────────────

function uid(): string { return crypto.randomUUID(); }

function leaf(type: ComponentType, name: string, config: Partial<ComponentConfig>): PageComponent {
  return { id: uid(), type, name, order: 0, children: [], config: { ...config } };
}

function node(type: ComponentType, name: string, config: Partial<ComponentConfig>, children: PageComponent[]): PageComponent {
  return { id: uid(), type, name, order: 0, children, config: { ...config } };
}

function reorder(list: PageComponent[]): void {
  list.forEach((c, i) => { c.order = i + 1; });
}

// ── Menu children ─────────────────────────────────────────────────────────

function menuChildren(variant: string): PageComponent[] {
  const logoText = variant === 'netflix' ? 'NETFLIX' : variant === 'facebook' ? 'f' : 'Nureal';

  const logoColor = variant === 'netflix' ? '#E50914'
    : variant === 'facebook' ? '#ffffff'
    : variant === 'material' ? '#1565C0'
    : '#111827';

  const navColor = variant === 'facebook' ? 'rgba(255,255,255,.85)'
    : variant === 'material' || variant === 'minimal' ? '#374151'
    : '#e5e5e5';

  const navItems: string[] = variant === 'netflix'
    ? ['Início', 'Séries', 'Filmes', 'Novidades', 'Minha Lista']
    : variant === 'facebook'
    ? ['Feed', 'Amigos', 'Grupos', 'Marketplace']
    : variant === 'material'
    ? ['Home', 'Produtos', 'Sobre', 'Contato']
    : ['Home', 'Sobre', 'Serviços', 'Contato'];

  const navButtons = navItems.map(label =>
    leaf(ComponentType.BUTTON, label, {
      content: label,
      customCss: [
        'background:transparent',
        `color:${navColor}`,
        'border:none',
        'padding:0 4px',
        'font-size:13px',
        'font-weight:400',
        'border-radius:0',
        'box-shadow:none',
        'letter-spacing:0',
        'font-family:inherit',
      ].join(';'),
    }));
  reorder(navButtons);

  const entrarBg = variant === 'facebook' ? 'rgba(255,255,255,.2)' : variant === 'material' ? '#e5e7eb' : '#E50914';
  const entrarColor = (variant === 'facebook' || variant === 'netflix') ? '#ffffff' : '#111827';

  const children: PageComponent[] = [
    leaf(ComponentType.TEXT, 'Logo', {
      content: logoText,
      color: logoColor,
      fontSize: variant === 'minimal' ? '18px' : '24px',
      fontWeight: '900',
      letterSpacing: variant === 'minimal' ? '1px' : '3px',
      alignSelf: 'center',  // centraliza verticalmente no flex-row do nav
    }),
    node(ComponentType.CONTAINER, 'Nav Links', {
      // display omitido — buildContainerStyles() injeta display:flex no inner div.
      // Host de CONTAINER sempre retorna display:block (HostBinding composite fix).
      flexDirection: 'row',
      gap: '24px',
      flexGrow: 1,
      alignSelf: 'center',  // centraliza verticalmente no flex-row do nav
    }, navButtons),
    leaf(ComponentType.BUTTON, 'Entrar', {
      content: 'Entrar',
      backgroundColor: entrarBg,
      color: entrarColor,
      alignSelf: 'center',  // centraliza verticalmente no flex-row do nav
    }),
  ];
  reorder(children);
  return children;
}

// ── Card children ─────────────────────────────────────────────────────────

function cardChildren(variant: string): PageComponent[] {
  const ph = variant === 'minimal'
    ? 'https://placehold.co/320x180/f0f0f0/aaaaaa?text=Imagem'
    : variant === 'product'
    ? 'https://placehold.co/320x240/fafafa/999999?text=Produto'
    : variant === 'blog'
    ? 'https://placehold.co/360x200/f8f9fa/bbbbbb?text=Post'
    : 'https://placehold.co/320x180/181818/444444?text=Card';

  const btnLabel = variant === 'product' ? 'Comprar' : variant === 'blog' ? 'Ler mais' : 'Ver mais';

  const isDark     = variant === 'netflix';
  const titleColor = isDark ? '#ffffff' : '#111827';
  const descColor  = isDark ? '#b3b3b3' : '#6b7280';
  const btnBg      = variant === 'product' ? '#16a34a' : variant === 'blog' ? '#2563eb' : '#E50914';

  const children: PageComponent[] = [
    leaf(ComponentType.IMAGE, 'Capa', { src: ph, width: '100%' }),
    leaf(ComponentType.TITLE, 'Título', {
      content: 'Título do Card',
      color: titleColor,
      fontSize: '14px',
      fontWeight: '700',
      paddingTop: '10px',
      paddingLeft: '12px',
      paddingRight: '12px',
      paddingBottom: '4px',
    }),
    leaf(ComponentType.TEXT, 'Descrição', {
      content: 'Descrição breve do conteúdo.',
      color: descColor,
      fontSize: '12px',
      lineHeight: '1.5',
      paddingLeft: '12px',
      paddingRight: '12px',
      paddingBottom: '12px',
    }),
    leaf(ComponentType.BUTTON, 'Ação', {
      content: btnLabel,
      backgroundColor: btnBg,
      marginLeft: '12px',
      marginRight: '12px',
      marginBottom: '12px',
    }),
  ];
  reorder(children);
  return children;
}

// ── Carousel slide children ───────────────────────────────────────────────

function slideChildren(variant: string, slideN: number): PageComponent[] {
  const children: PageComponent[] = [
    leaf(ComponentType.IMAGE,  'Imagem',    { src: `https://placehold.co/1280x500/111111/333333?text=Slide+${slideN}`, width: '100%', height: '100%' }),
    leaf(ComponentType.TITLE,  'Título',    { content: `Slide ${slideN}`, color: '#ffffff', fontSize: '32px', fontWeight: '700' }),
    leaf(ComponentType.TEXT,   'Subtítulo', { content: 'Descrição do slide', color: '#e5e5e5', fontSize: '16px' }),
    leaf(ComponentType.BUTTON, 'Ação',      { content: variant === 'netflix' ? 'Assistir' : 'Saiba mais' }),
  ];
  reorder(children);
  return children;
}

function carouselChildren(variant: string): PageComponent[] {
  const slides = [1, 2, 3].map(n =>
    node(ComponentType.CONTAINER, `Slide ${n}`, { width: '100%', height: '100%' }, slideChildren(variant, n)));
  reorder(slides);
  return slides;
}

// ── Accordion children ────────────────────────────────────────────────────

function accordionChildren(variant: string): PageComponent[] {
  const qa: { q: string; a: string }[] = variant === 'netflix'
    ? [
        { q: 'O que é o Nureal?',  a: 'Nureal é uma plataforma de criação de páginas web.' },
        { q: 'Como funciona?',     a: 'Arraste componentes, configure e publique com um clique.' },
        { q: 'Qual o preço?',      a: 'Temos planos gratuito e Pro. Confira em nosso site.' },
      ]
    : [
        { q: 'Pergunta Frequente 1', a: 'Resposta para a pergunta 1.' },
        { q: 'Pergunta Frequente 2', a: 'Resposta para a pergunta 2.' },
        { q: 'Pergunta Frequente 3', a: 'Resposta para a pergunta 3.' },
      ];

  const isDark   = variant === 'netflix';
  const isLight  = variant === 'material' || variant === 'minimal';
  const itemBg   = isDark ? '#2d2d2d' : isLight ? '#ffffff' : 'transparent';
  const divider  = isDark ? '#141414' : '#e5e7eb';
  const qColor   = isDark ? '#ffffff' : '#212121';
  const aColor   = isDark ? '#e5e5e5' : '#424242';
  const qSize    = isDark ? '18px' : variant === 'minimal' ? '15px' : '16px';

  const items = qa.map(({ q, a }, i) => {
    const kids = [
      leaf(ComponentType.BUTTON, 'Pergunta', {
        content: q,
        customCss: [
          'background:transparent',
          `color:${qColor}`,
          'border:none',
          `font-size:${qSize}`,
          'font-weight:400',
          'padding:20px 28px',
          'width:100%',
          'text-align:left',
          'border-radius:0',
          'box-shadow:none',
          'font-family:inherit',
          'cursor:pointer',
        ].join(';'),
      }),
      leaf(ComponentType.TEXT, 'Resposta', {
        content: a,
        color: aColor,
        fontSize: '16px',
        lineHeight: '1.7',
        paddingTop: '8px',
        paddingBottom: '24px',
        paddingLeft: '28px',
        paddingRight: '28px',
      }),
    ];
    reorder(kids);
    return node(ComponentType.CONTAINER, `Item ${i + 1}`, {
      width: '100%',
      backgroundColor: itemBg,
      customCss: `border-bottom:8px solid ${divider}`,
    }, kids);
  });
  reorder(items);
  return items;
}

// ── Form children ─────────────────────────────────────────────────────────

function formChildren(variant: string): PageComponent[] {
  const isDark     = variant !== 'light';
  const inputBg    = isDark ? '#333333' : '#f3f4f6';
  const inputColor = isDark ? '#ffffff' : '#111827';
  const labelColor = isDark ? '#b3b3b3' : '#374151';
  const btnBg      = variant === 'light' ? '#2563eb' : '#E50914';

  const inputCss = [
    `background:${inputBg}`,
    `color:${inputColor}`,
    'border:none',
    'border-radius:4px',
    'padding:14px 16px',
    'font-size:15px',
    'width:100%',
    'box-sizing:border-box',
    'font-family:inherit',
  ].join(';');

  const children: PageComponent[] = [
    leaf(ComponentType.INPUT, 'Nome', {
      label: 'Nome',
      placeholder: 'Seu nome',
      customCss: inputCss,
      color: labelColor,
    }),
    leaf(ComponentType.INPUT, 'Email', {
      label: 'Email',
      placeholder: 'seu@email.com',
      customCss: inputCss,
      color: labelColor,
    }),
  ];
  if (variant === 'contact') {
    children.push(leaf(ComponentType.INPUT, 'Mensagem', {
      label: 'Mensagem',
      placeholder: 'Escreva aqui...',
      customCss: inputCss,
      color: labelColor,
    }));
  }
  children.push(leaf(ComponentType.BUTTON, 'Enviar', {
    content: variant === 'contact' ? 'Enviar Mensagem' : 'Enviar',
    width: '100%',
    backgroundColor: btnBg,
  }));
  reorder(children);
  return children;
}

// ── Legacy form fields (keep for renderer compat) ────────────────────────

const FORM_FIELDS_BASE: FormField[] = [
  { id: uid(), type: 'text',  label: 'Nome',  placeholder: 'Seu nome',        required: true },
  { id: uid(), type: 'email', label: 'Email', placeholder: 'seu@email.com',   required: true },
];
const FORM_FIELDS_CONTACT: FormField[] = [
  ...FORM_FIELDS_BASE,
  { id: uid(), type: 'textarea', label: 'Mensagem', placeholder: 'Escreva sua mensagem...', required: false },
];

// ── Factory ───────────────────────────────────────────────────────────────

export class ComponentFactory {

  static create(type: ComponentType, order: number, variant?: string): PageComponent {
    // Não seta absolutePos aqui — o padrão é fluxo normal (cadeado).
    // addComponentToCanvas() seta absolutePos apenas quando há coordenadas de drop.
    // Filhos adicionados via addChildComponent() ficam em fluxo normal do pai.
    return ComponentFactory._build(type, order, variant);
  }

  private static _build(type: ComponentType, order: number, variant?: string): PageComponent {

    switch (type) {

      case ComponentType.TEXT:
        return leaf(ComponentType.TEXT, 'Texto', { content: 'Novo Texto' });

      case ComponentType.TITLE:
        return leaf(ComponentType.TITLE, 'Título', { content: 'Novo Título' });

      case ComponentType.BUTTON:
        return leaf(ComponentType.BUTTON, 'Botão', { content: 'Clique Aqui' });

      case ComponentType.IMAGE:
        return leaf(ComponentType.IMAGE, 'Imagem', { src: 'https://placehold.co/800x300', width: '100%' });

      case ComponentType.CONTAINER:
        return { id: uid(), type, name: 'Container', order, children: [], config: { width: '100%' } };

      case ComponentType.GRID:
        return { id: uid(), type, name: 'Grid', order, children: [],
          config: { width: '100%', columns: '3', paddingTop: '16px', paddingBottom: '16px', paddingLeft: '16px', paddingRight: '16px' } };

      case ComponentType.INPUT:
        return leaf(ComponentType.INPUT, 'Input', { label: 'Campo', placeholder: 'Digite aqui...' });

      case ComponentType.CHECKBOX:
        return leaf(ComponentType.CHECKBOX, 'Checkbox', { content: 'Aceito os termos e condições' });

      case ComponentType.SELECT:
        return leaf(ComponentType.SELECT, 'Select', { label: 'Selecione', placeholder: 'Escolha uma opção...', options: 'Opção 1,Opção 2,Opção 3' });

      case ComponentType.MENU: {
        const v = variant || 'netflix';
        const children = menuChildren(v);
        const comp = node(ComponentType.MENU, `Menu (${v})`, { variant: v, width: '100%', items: '' }, children);
        comp.order = order;
        return comp;
      }

      case ComponentType.CARD: {
        const v = variant || 'netflix';
        const children = cardChildren(v);
        const comp = node(ComponentType.CARD, `Card (${v})`, { variant: v, width: '280px' }, children);
        comp.order = order;
        return comp;
      }

      case ComponentType.CAROUSEL: {
        const v = variant || 'netflix';
        const children = carouselChildren(v);
        const comp = node(ComponentType.CAROUSEL, `Carousel (${v})`,
          { variant: v, width: '100%', height: v === 'hero' ? '500px' : v === 'gallery' ? '380px' : '300px' },
          children);
        comp.order = order;
        return comp;
      }

      case ComponentType.ACCORDION: {
        const v = variant || 'netflix';
        const children = accordionChildren(v);
        const comp = node(ComponentType.ACCORDION, `Accordion (${v})`, { variant: v, width: '100%' }, children);
        comp.order = order;
        return comp;
      }

      case ComponentType.FORM: {
        const v = variant || 'dark';
        const children = formChildren(v);
        const comp = node(ComponentType.FORM, `Formulário (${v})`,
          {
            variant: v,
            formId: uid(),
            submitLabel: v === 'contact' ? 'Enviar Mensagem' : 'Enviar',
            width: '100%',
            formFields: v === 'contact' ? FORM_FIELDS_CONTACT : FORM_FIELDS_BASE,
          },
          children);
        comp.order = order;
        return comp;
      }

      default:
        throw new Error('Tipo não suportado: ' + type);
    }
  }
}

