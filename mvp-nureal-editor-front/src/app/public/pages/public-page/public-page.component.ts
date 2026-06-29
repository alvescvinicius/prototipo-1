import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ProjectService }          from '../../../core/services/project.service';
import { FormSubmissionsService }  from '../../../core/services/form-submissions.service';
import { ActionEngineService, ActionContext } from '../../../core/services/action-engine.service';
import { NurealObjectsService }    from '../../../core/services/nureal-objects.service';
import { ObjectRecordsService }    from '../../../core/services/object-records.service';
import { FormField }               from '../../../core/interfaces/form-field';
import { FormAction }              from '../../../core/interfaces/form-action';
import { ObjectField }             from '../../../core/interfaces/nureal-object';
import { Section }                 from '../../../core/interfaces/section';
import { Page }                    from '../../../core/interfaces/page';
import { PageComponent }           from '../../../core/interfaces/page-component';
import { ComponentConfig }         from '../../../core/interfaces/component-config';
import { ComponentType }           from '../../../core/enums/component-type.enum';
import { buildStyles, buildGridStyles, splitItems } from '../../../core/utils/style-builder';

@Component({
  selector: 'app-public-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './public-page.component.html',
  styleUrl: './public-page.component.scss'
})
export class PublicPageComponent implements OnInit, OnDestroy {

  public ComponentType = ComponentType;

  formState: Record<string, {
    values:     Record<string, string>;
    submitting: boolean;
    submitted:  boolean;
    error:      string;
  }> = {};

  state: 'loading' | 'found' | 'not-found' = 'loading';
  projectId   = '';
  ownerId     = '';
  projectName = '';
  pages:       Page[]   = [];
  currentPage: Page | null = null;

  constructor(
    private route:       ActivatedRoute,
    private router:      Router,
    private projectSvc:  ProjectService,
    private formSvc:     FormSubmissionsService,
    public  engine:      ActionEngineService,
    private objectsSvc:  NurealObjectsService,
    private recordsSvc:  ObjectRecordsService,
  ) {}

  /** Contexto de execução das ações (navegação específica da página pública). */
  get actionCtx(): ActionContext {
    return {
      pages: this.pages,
      navigateToPage: (page: Page) => this.navigateTo(page),
      navigateToUrl:  (url: string, newTab: boolean) => {
        if (newTab) window.open(url, '_blank');
        else window.location.href = url;
      },
    };
  }

  /** Reseta visibilidade e dispara os gatilhos onLoad da página atual. */
  private _afterPageRender(): void {
    this.engine.reset();
    this.engine.runOnLoad(this.sections, this.actionCtx);
  }

  async ngOnInit(): Promise<void> {
    const projectSlug = this.route.snapshot.paramMap.get('projectSlug') ?? '';
    const pageSlug    = this.route.snapshot.paramMap.get('pageSlug');

    const project = await this.projectSvc.getProjectBySlug(projectSlug);
    if (!project) {
      this.state = 'not-found';
      this._setBody();
      return;
    }

    this.projectId   = project.id;
    this.ownerId     = project.user_id;
    this.projectName = project.name;
    this.pages       = project.data?.pages ?? [];

    if (this.pages.length === 0) { this.state = 'not-found'; return; }

    if (pageSlug) {
      this.currentPage = this.pages.find(p =>
        this.slugify(p.name) === pageSlug || p.slug === pageSlug
      ) ?? this.pages[0];
    } else {
      this.currentPage = this.pages[0];
    }

    this.state = 'found';
    this._setBody();

    // Carrega objetos para resolver campos
    await this.objectsSvc.loadAll();

    // Dispara gatilhos onLoad após a página estar pronta
    setTimeout(() => this._afterPageRender());
  }

  private _setBody(): void {
    document.documentElement.style.colorScheme = 'light';
    document.body.style.background   = '#ffffff';
    document.body.style.color        = '#111111';
    document.body.style.overflow     = 'auto';
    document.body.style.colorScheme  = 'light';
  }

  ngOnDestroy(): void {
    document.documentElement.style.colorScheme = '';
    document.body.style.background  = '';
    document.body.style.color       = '';
    document.body.style.overflow    = '';
    document.body.style.colorScheme = '';
  }

  get sections(): Section[] {
    return this.currentPage?.sections ?? [];
  }

  navigateTo(page: Page): void {
    const projectSlug = this.route.snapshot.paramMap.get('projectSlug') ?? '';
    const pageSlug    = page.slug ?? this.slugify(page.name);
    this.currentPage  = page;
    this.router.navigate(['/p', projectSlug, pageSlug], { replaceUrl: true });
    // Reaplica visibilidade e onLoad da nova página
    setTimeout(() => this._afterPageRender());
  }

  // ─── Campos do formulário ──────────────────────────────────

  /** Resolve campos do formulário: objeto vinculado ou campos manuais */
  getFormFields(config: ComponentConfig): FormField[] {
    if (config.boundObject) {
      const obj = this.objectsSvc.getByName(config.boundObject);
      if (obj) {
        return obj.fields.map(f => ({
          id:          f.id,
          type:        this._mapFieldType(f.type),
          label:       f.label,
          placeholder: f.placeholder ?? '',
          required:    f.required ?? false,
          options:     f.options,
        } as FormField));
      }
    }
    return config.formFields ?? [];
  }

  private _mapFieldType(t: string): string {
    const map: Record<string, string> = {
      boolean: 'checkbox',
      phone:   'tel',
      date:    'date',
      number:  'number',
      email:   'email',
      textarea:'textarea',
      select:  'select',
      text:    'text',
    };
    return map[t] ?? 'text';
  }

  getFormState(formId: string) {
    if (!this.formState[formId]) {
      this.formState[formId] = { values: {}, submitting: false, submitted: false, error: '' };
    }
    return this.formState[formId];
  }

  getSelectOptions(raw: string | undefined): string[] {
    if (!raw) return [];
    return raw.split(',').map((s: string) => s.trim()).filter(Boolean);
  }

  // ─── Visibilidade ─────────────────────────────────────────

  isHidden(id: string): boolean {
    return this.engine.isHidden(id);
  }

  // ─── Gatilhos de componente (motor compartilhado) ─────────

  handleComponentClick(comp: PageComponent): void {
    this.engine.runTrigger(comp, 'onClick', this.actionCtx);
  }

  handleComponentChange(comp: PageComponent): void {
    this.engine.runTrigger(comp, 'onChange', this.actionCtx);
  }

  // ─── Submit com engine de ações ────────────────────────────

  async submitForm(component: PageComponent, pageId: string): Promise<void> {
    const config = component.config;
    const formId = config.formId || component.id;
    const state  = this.getFormState(formId);
    if (state.submitting || state.submitted) return;

    state.submitting = true;
    state.error      = '';

    try {
      const actions: FormAction[] = config.formActions ?? [];

      // Se não há ações definidas, faz o submit legado (form_submissions)
      if (actions.length === 0) {
        await this.formSvc.submit(this.projectId, pageId, formId, state.values);
        state.submitted = true;
        state.submitting = false;
        this.engine.runTrigger(component, 'onSubmit', this.actionCtx);
        return;
      }

      // Executa cada ação em sequência
      for (const action of actions) {
        await this._executeAction(action, config, state.values);
      }

      state.submitted  = true;
      this.engine.runTrigger(component, 'onSubmit', this.actionCtx);
    } catch (err: any) {
      state.error = err?.message ?? 'Erro ao enviar formulário.';
    } finally {
      state.submitting = false;
    }
  }

  private async _executeAction(
    action:  FormAction,
    config:  ComponentConfig,
    values:  Record<string, string>
  ): Promise<void> {
    switch (action.type) {

      case 'create_record': {
        const objectName = action.objectName || config.boundObject;
        if (!objectName) throw new Error('Objeto não definido para create_record');
                await this.recordsSvc.create(this.ownerId, this.projectId, objectName, values);
        break;
      }

      case 'send_email': {
        const url = action.emailWebhookUrl;
        if (!url) break;
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to:      this._interpolate(action.emailTo ?? '', values),
            subject: this._interpolate(action.emailSubject ?? '', values),
            body:    this._interpolate(action.emailBody ?? '', values),
            data:    values,
          }),
        });
        break;
      }

      case 'send_whatsapp': {
        const url = action.whatsappWebhookUrl;
        if (!url) break;
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to:      this._interpolate(action.whatsappTo ?? '', values),
            message: this._interpolate(action.whatsappMessage ?? '', values),
            data:    values,
          }),
        });
        break;
      }

      case 'webhook': {
        const url    = action.webhookUrl;
        const method = action.webhookMethod ?? 'POST';
        if (!url) break;
        const rawPayload = action.webhookPayload
          ? this._interpolate(action.webhookPayload, values)
          : JSON.stringify(values);
        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body:    method !== 'GET' ? rawPayload : undefined,
        });
        break;
      }
    }
  }

  /** Substitui {campo} pelo valor correspondente */
  private _interpolate(template: string, values: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
  }

  // ─── Estilos ──────────────────────────────────────────────

  getStyles     = buildStyles;
  getGridStyles = buildGridStyles;
  getItems      = splitItems;

  slugify(str: string): string {
    return str.toLowerCase()
      .normalize('NFD')
      .replace(/̀|́|̂|̃|̄|̅|̆|̇|̈|̉|̊|̋|̌|̍|̎|̏/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
