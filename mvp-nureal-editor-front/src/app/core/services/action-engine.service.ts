import { Injectable } from '@angular/core';
import { ComponentAction, ActionTrigger } from '../interfaces/component-action';
import { PageComponent } from '../interfaces/page-component';
import { Section } from '../interfaces/section';
import { Page } from '../interfaces/page';

/**
 * Contexto de execução fornecido pela página (preview ou pública).
 * Abstrai a navegação, que difere entre os dois renderizadores.
 */
export interface ActionContext {
  pages: Page[];
  navigateToPage: (page: Page) => void;
  navigateToUrl:  (url: string, newTab: boolean) => void;
  toast?:         (message: string, type?: string) => void;
}

/**
 * Motor de ações compartilhado entre o preview do editor e a página publicada.
 * Garante que gatilhos (onClick, onLoad, onChange, onSubmit) e ações
 * (mostrar/ocultar, navegar, rolar, toast, JS) se comportem de forma idêntica
 * nos dois ambientes.
 *
 * Visibilidade é controlada por um Set de IDs ocultos; os templates fazem
 * `[hidden]="engine.isHidden(comp.id)"`. Para `scrollTo`, os hosts de
 * componente expõem `id="nr-<componentId>"`.
 */
@Injectable({ providedIn: 'root' })
export class ActionEngineService {

  /** IDs de componentes atualmente ocultos. */
  readonly hidden = new Set<string>();

  reset(): void {
    this.hidden.clear();
  }

  isHidden(id: string): boolean {
    return this.hidden.has(id);
  }

  /** Executa todas as ações de um componente para um gatilho específico. */
  runTrigger(comp: PageComponent, trigger: ActionTrigger, ctx: ActionContext): void {
    const actions = (comp.config.actions ?? []).filter(a => a.trigger === trigger);
    for (const action of actions) this.execute(action, comp, ctx);
  }

  /** Percorre todos os componentes da página e dispara o gatilho onLoad. */
  runOnLoad(sections: Section[], ctx: ActionContext): void {
    const walk = (list: PageComponent[]) => {
      for (const c of list) {
        this.runTrigger(c, 'onLoad', ctx);
        if (c.children?.length) walk(c.children);
      }
    };
    for (const s of sections) walk(s.pageComponents);
  }

  /** Executa uma ação isolada. */
  execute(action: ComponentAction, source: PageComponent, ctx: ActionContext): void {
    const p = action.params;
    const targetId = p.targetId?.trim() || source.id;

    switch (action.type) {

      case 'hide':
        this.hidden.add(targetId);
        break;

      case 'show':
        this.hidden.delete(targetId);
        break;

      case 'toggleVisibility':
        if (this.hidden.has(targetId)) this.hidden.delete(targetId);
        else this.hidden.add(targetId);
        break;

      case 'navigate':
        if (p.targetPage) {
          const page = ctx.pages.find(pg => pg.id === p.targetPage || pg.name === p.targetPage);
          if (page) ctx.navigateToPage(page);
        } else if (p.targetUrl) {
          ctx.navigateToUrl(p.targetUrl, !!p.openInNewTab);
        }
        break;

      case 'scrollTo': {
        const el = document.getElementById('nr-' + (p.scrollToId || ''));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      }

      case 'showToast':
        if (ctx.toast) ctx.toast(p.toastMessage ?? '', p.toastType);
        else if (p.toastMessage) window.alert(p.toastMessage);
        break;

      case 'runJS':
        if (p.jsCode) {
          try { new Function(p.jsCode)(); } catch (e) { console.error('[runJS]', e); }
        }
        break;

      // saveToObject e webhook são executados no submit do formulário (formActions).
    }
  }
}
