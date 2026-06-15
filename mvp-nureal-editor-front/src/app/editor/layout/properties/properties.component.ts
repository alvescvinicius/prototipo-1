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

type StyleTab   = 'content' | 'typography' | 'spacing' | 'visual' | 'dimensions' | 'css';
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
