import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EditorStateService }    from '../../../core/services/editor-state.service';
import { NurealObjectsService }  from '../../../core/services/nureal-objects.service';
import { ComponentType }         from '../../../core/enums/component-type.enum';
import { PageComponent }         from '../../../core/interfaces/page-component';
import { Section }               from '../../../core/interfaces/section';
import { FormField }             from '../../../core/interfaces/form-field';
import { FormAction, ActionType } from '../../../core/interfaces/form-action';
import { NurealObject }          from '../../../core/interfaces/nureal-object';

type StyleTab   = 'content' | 'typography' | 'spacing' | 'visual' | 'layout' | 'dimensions' | 'css';
type SectionTab = 'visual' | 'dimensions' | 'layout';
type FormTab    = 'objeto' | 'campos' | 'acoes';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './properties.component.html',
  styleUrls: ['./properties.component.scss']
})
export class PropertiesComponent implements OnInit {

  public ComponentType = ComponentType;
  public activeTab:   StyleTab   = 'content';
  public sectionTab:  SectionTab = 'visual';
  public formTab:     FormTab    = 'objeto';

  public tabs: { id: StyleTab; label: string }[] = [
    { id: 'content',    label: 'Conteudo'   },
    { id: 'typography', label: 'Texto'       },
    { id: 'spacing',    label: 'Espacamento' },
    { id: 'visual',     label: 'Visual'      },
    { id: 'layout',     label: 'Layout'      },
    { id: 'dimensions', label: 'Dimensoes'   },
    { id: 'css',        label: 'CSS'         },
  ];

  public sectionTabs: { id: SectionTab; label: string }[] = [
    { id: 'visual',     label: 'Visual'    },
    { id: 'dimensions', label: 'Dimensoes' },
    { id: 'layout',     label: 'Layout'    },
  ];

  public formTabs: { id: FormTab; label: string }[] = [
    { id: 'objeto', label: 'Objeto' },
    { id: 'campos', label: 'Campos' },
    { id: 'acoes',  label: 'Ações'  },
  ];

  public fontWeightOptions = [
    { value: '300', label: 'Light'    },
    { value: '400', label: 'Regular'  },
    { value: '500', label: 'Medium'   },
    { value: '600', label: 'SemiBold' },
    { value: '700', label: 'Bold'     },
  ];

  public textAlignOptions = [
    { value: 'left',    label: '<-' },
    { value: 'center',  label: '|'  },
    { value: 'right',   label: '->' },
    { value: 'justify', label: '||' },
  ];

  public borderStyleOptions = [
    { value: 'solid',  label: 'Solida'     },
    { value: 'dashed', label: 'Tracejada'  },
    { value: 'dotted', label: 'Pontilhada' },
    { value: 'none',   label: 'Nenhuma'    },
  ];

  public actionTypes: { value: ActionType; label: string }[] = [
    { value: 'create_record',  label: 'Criar registro'  },
    { value: 'send_email',     label: 'Enviar e-mail'   },
    { value: 'send_whatsapp',  label: 'Enviar WhatsApp' },
    { value: 'webhook',        label: 'Webhook'         },
  ];

  constructor(
    public editorState:  EditorStateService,
    public objectsSvc:   NurealObjectsService,
  ) {}

  ngOnInit(): void {
    this.objectsSvc.loadAll();
  }

  get selectedComponent(): PageComponent | null {
    const node = this.editorState.selectedNode;
    if (!node) return null;
    return 'config' in node && node.type !== ComponentType.SECTION
      ? node as PageComponent
      : null;
  }

  get selectedSection(): Section | null {
    const node = this.editorState.selectedNode;
    if (!node) return null;
    return node.type === ComponentType.SECTION ? node as Section : null;
  }

  // ── Variant support ────────────────────────────────────────

  private readonly VARIANT_MAP: Record<string, { value: string; label: string }[]> = {
    [ComponentType.MENU]:      [
      { value: 'netflix',  label: 'Netflix'  },
      { value: 'material', label: 'Material' },
      { value: 'facebook', label: 'Facebook' },
      { value: 'minimal',  label: 'Minimal'  },
    ],
    [ComponentType.CARD]:      [
      { value: 'netflix',  label: 'Netflix'  },
      { value: 'minimal',  label: 'Minimal'  },
      { value: 'product',  label: 'Produto'  },
      { value: 'blog',     label: 'Blog'     },
    ],
    [ComponentType.CAROUSEL]:  [
      { value: 'netflix',  label: 'Netflix'  },
      { value: 'hero',     label: 'Hero'     },
      { value: 'gallery',  label: 'Galeria'  },
      { value: 'simple',   label: 'Simples'  },
    ],
    [ComponentType.ACCORDION]: [
      { value: 'netflix',  label: 'Netflix'  },
      { value: 'material', label: 'Material' },
      { value: 'minimal',  label: 'Minimal'  },
    ],
    [ComponentType.FORM]:      [
      { value: 'dark',    label: 'Escuro'   },
      { value: 'light',   label: 'Claro'    },
      { value: 'contact', label: 'Contato'  },
    ],
  };

  get hasVariants(): boolean {
    return !!this.selectedComponent && !!this.VARIANT_MAP[this.selectedComponent.type];
  }

  get variantOptions(): { value: string; label: string }[] {
    if (!this.selectedComponent) return [];
    return this.VARIANT_MAP[this.selectedComponent.type] ?? [];
  }

  /** Gera uma string CSS legível com todas as propriedades configuradas no componente. */
  get computedCssString(): string {
    const cfg = this.selectedComponent?.config;
    if (!cfg) return '';
    const pairs: [string, string | number | undefined][] = [
      ['color',            cfg.color],
      ['font-size',        cfg.fontSize],
      ['font-weight',      cfg.fontWeight],
      ['text-align',       cfg.textAlign],
      ['letter-spacing',   cfg.letterSpacing],
      ['line-height',      cfg.lineHeight],
      ['background-color', cfg.backgroundColor],
      ['border-radius',    cfg.borderRadius],
      ['border-width',     cfg.borderWidth],
      ['border-color',     cfg.borderColor],
      ['border-style',     cfg.borderStyle],
      ['opacity',          cfg.opacity != null ? String(cfg.opacity) : undefined],
      ['box-shadow',       cfg.boxShadow],
      ['padding-top',      cfg.paddingTop],
      ['padding-bottom',   cfg.paddingBottom],
      ['padding-left',     cfg.paddingLeft],
      ['padding-right',    cfg.paddingRight],
      ['margin-top',       cfg.marginTop],
      ['margin-bottom',    cfg.marginBottom],
      ['margin-left',      cfg.marginLeft],
      ['margin-right',     cfg.marginRight],
      ['width',            cfg.width],
      ['height',           cfg.height],
      ['max-width',        cfg.maxWidth],
      ['min-width',        cfg.minWidth],
      ['flex-direction',   cfg.flexDirection],
      ['align-items',      cfg.alignItems],
      ['justify-content',  cfg.justifyContent],
      ['gap',              cfg.gap],
      ['flex-wrap',        cfg.flexWrap],
      ['display',          cfg.display],
      ['align-self',       cfg.alignSelf],
      ['flex-grow',        cfg.flexGrow != null ? String(cfg.flexGrow) : undefined],
      ['flex-shrink',      cfg.flexShrink != null ? String(cfg.flexShrink) : undefined],
      ['flex-basis',       cfg.flexBasis],
      ['order',            cfg.order != null ? String(cfg.order) : undefined],
      ['cursor',           cfg.cursor],
      ['position',         cfg.position],
      ['top',              cfg.top],
      ['right',            cfg.right],
      ['bottom',           cfg.bottom],
      ['left',             cfg.left],
      ['mix-blend-mode',   cfg.mixBlendMode],
      ['overflow',         cfg.overflow],
    ];
    return pairs
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([p, v]) => `${p}: ${v};`)
      .join('\n');
  }

  get hasContentTab(): boolean {
    if (!this.selectedComponent) return false;
    const t = this.selectedComponent.type;
    return (
      t === ComponentType.TEXT     ||
      t === ComponentType.TITLE    ||
      t === ComponentType.BUTTON   ||
      t === ComponentType.IMAGE    ||
      t === ComponentType.INPUT    ||
      t === ComponentType.CHECKBOX ||
      t === ComponentType.SELECT   ||
      t === ComponentType.MENU     ||
      t === ComponentType.CARD     ||
      t === ComponentType.CAROUSEL ||
      t === ComponentType.ACCORDION ||
      t === ComponentType.GRID
    );
  }

  // ── bound object helpers ────────────────────────────────────

  get boundObject(): NurealObject | null {
    const name = this.selectedComponent?.config.boundObject;
    if (!name) return null;
    return this.objectsSvc.getByName(name) ?? null;
  }

  bindObject(comp: PageComponent, name: string): void {
    comp.config.boundObject = name || undefined;
    // reset legacy fields so the object fields are used
    comp.config.formFields  = [];
  }

  // ── actions ────────────────────────────────────────────────

  getActions(comp: PageComponent): FormAction[] {
    return comp.config.formActions ?? [];
  }

  addAction(comp: PageComponent): void {
    const action: FormAction = {
      id:   crypto.randomUUID(),
      type: 'create_record',
    };
    comp.config.formActions = [...this.getActions(comp), action];
  }

  removeAction(comp: PageComponent, id: string): void {
    comp.config.formActions = this.getActions(comp).filter(a => a.id !== id);
  }

  // ── form-fields (legacy, shown when no object bound) ───────

  addFormField(comp: PageComponent): void {
    if (!comp.config.formFields) comp.config.formFields = [];
    const field: FormField = {
      id:          crypto.randomUUID(),
      type:        'text',
      label:       'Campo ' + (comp.config.formFields.length + 1),
      placeholder: '',
      required:    false,
    };
    comp.config.formFields = [...comp.config.formFields, field];
  }

  removeFormField(comp: PageComponent, index: number): void {
    if (!comp.config.formFields) return;
    comp.config.formFields = comp.config.formFields.filter((_, i) => i !== index);
  }

  // ── Carousel slides ──────────────────────────────────────────
  activeCarouselSlide: Record<string, number> = {};

  setActiveCarouselSlide(id: string, i: number): void {
    this.activeCarouselSlide[id] = i;
    // sync with renderer via editorState so canvas shows same slide
    (this.editorState as any)['_carouselActiveSlide'] = this.activeCarouselSlide;
  }

  addCarouselSlide(comp: PageComponent): void {
    const n = comp.children.length + 1;
    comp.children = [...comp.children, {
      id:       crypto.randomUUID(),
      type:     this.ComponentType.CONTAINER,
      name:     `Slide ${n}`,
      order:    n,
      children: [],
      config:   { width: '100%', height: '100%' }
    }];
  }

  removeCarouselSlide(comp: PageComponent): void {
    if (comp.children.length <= 1) return;
    comp.children = comp.children.slice(0, -1);
    const cur = this.activeCarouselSlide[comp.id] ?? 0;
    if (cur >= comp.children.length) {
      this.activeCarouselSlide[comp.id] = comp.children.length - 1;
    }
  }

  copyComputedCss(): void {
    navigator.clipboard.writeText(this.computedCssString).catch(() => {});
  }

  setTab(tab: StyleTab): void          { this.activeTab  = tab; }
  setSectionTab(t: SectionTab): void   { this.sectionTab = t;   }
  setFormTab(t: FormTab): void         { this.formTab    = t;    }

  px(value: string | undefined): number | null {
    if (!value) return null;
    const n = parseFloat(value);
    return isNaN(n) ? null : n;
  }

  setPx(
    obj: Record<string, string | undefined>,
    key: string,
    raw: number | string | null
  ): void {
    if (raw === null || raw === '' || raw === undefined) {
      obj[key] = undefined;
    } else {
      obj[key] = `${raw}px`;
    }
  }
}
