import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EditorStateService }     from '../../../core/services/editor-state.service';
import { NurealObjectsService }   from '../../../core/services/nureal-objects.service';
import { PropertiesComponent }    from '../properties/properties.component';
import { PageComponent }          from '../../../core/interfaces/page-component';
import { ComponentAction, ActionTrigger, ActionType } from '../../../core/interfaces/component-action';

export type ModalTab = 'props' | 'triggers' | 'actions' | 'objects';

@Component({
  selector: 'app-component-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, PropertiesComponent],
  templateUrl: './component-modal.component.html',
  styleUrls: ['./component-modal.component.scss'],
})
export class ComponentModalComponent implements OnInit {

  modalTab: ModalTab = 'props';

  // ── Posição e tamanho do painel flutuante ──────────────────────────────────
  panelX = 0;
  panelY = 0;
  panelW = 700;
  panelH = 580;
  isDragging  = false;
  isResizing  = false;

  triggerOptions: { value: ActionTrigger; label: string; icon: string; desc: string }[] = [
    { value: 'onClick',  label: 'onClick',  icon: '👆', desc: 'Clique no componente' },
    { value: 'onSubmit', label: 'onSubmit', icon: '📤', desc: 'Envio de formulário' },
    { value: 'onLoad',   label: 'onLoad',   icon: '⏱',  desc: 'Ao carregar a página' },
    { value: 'onChange', label: 'onChange', icon: '✏️',  desc: 'Mudança de valor' },
  ];

  actionTypeOptions: { value: ActionType; label: string; icon: string }[] = [
    { value: 'navigate',         label: 'Navegar',         icon: '🔗' },
    { value: 'toggleVisibility', label: 'Mostrar/Ocultar', icon: '👁' },
    { value: 'hide',             label: 'Esconder',        icon: '🙈' },
    { value: 'show',             label: 'Mostrar',         icon: '👀' },
    { value: 'saveToObject',     label: 'Salvar no objeto',icon: '💾' },
    { value: 'webhook',          label: 'Webhook',         icon: '🌐' },
    { value: 'showToast',        label: 'Toast',           icon: '🔔' },
    { value: 'scrollTo',         label: 'Rolar para',      icon: '⬇️' },
    { value: 'runJS',            label: 'Executar JS',     icon: '📜' },
  ];

  constructor(
    public editorState: EditorStateService,
    public objectsSvc:  NurealObjectsService,
  ) {}

  ngOnInit(): void {
    this._initPos();
  }

  private _initPos(): void {
    this.panelW = Math.min(700, window.innerWidth - 32);
    this.panelH = Math.min(580, window.innerHeight - 80);
    this.panelX = Math.round((window.innerWidth  - this.panelW) / 2);
    this.panelY = Math.round((window.innerHeight - this.panelH) / 3);
  }

  // ── Drag ──────────────────────────────────────────────────────────────────

  startDrag(e: MouseEvent): void {
    if ((e.target as HTMLElement).closest('button')) return; // não arrastar ao clicar em botão
    e.preventDefault();
    const ox = e.clientX - this.panelX;
    const oy = e.clientY - this.panelY;
    this.isDragging = true;

    const onMove = (me: MouseEvent) => {
      this.panelX = Math.max(0, Math.min(window.innerWidth  - 80, me.clientX - ox));
      this.panelY = Math.max(0, Math.min(window.innerHeight - 40, me.clientY - oy));
    };
    const onUp = () => {
      this.isDragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }

  // ── Resize ────────────────────────────────────────────────────────────────

  startResize(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX;
    const sy = e.clientY;
    const sw = this.panelW;
    const sh = this.panelH;
    this.isResizing = true;

    const onMove = (me: MouseEvent) => {
      this.panelW = Math.max(480, sw + (me.clientX - sx));
      this.panelH = Math.max(320, sh + (me.clientY - sy));
    };
    const onUp = () => {
      this.isResizing = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }

  // ── Dados ─────────────────────────────────────────────────────────────────

  get comp(): PageComponent | null {
    const n = this.editorState.selectedNode;
    return n && 'children' in n ? (n as PageComponent) : null;
  }

  get actions(): ComponentAction[] {
    if (!this.comp) return [];
    if (!this.comp.config.actions) this.comp.config.actions = [];
    return this.comp.config.actions;
  }

  actionsForTrigger(trigger: ActionTrigger): number {
    return this.actions.filter(a => a.trigger === trigger).length;
  }

  addAction(trigger: ActionTrigger = 'onClick'): void {
    if (!this.comp) return;
    if (!this.comp.config.actions) this.comp.config.actions = [];
    this.comp.config.actions.push({ id: crypto.randomUUID(), trigger, type: 'navigate', params: {} });
    this.modalTab = 'actions';
  }

  removeAction(id: string): void {
    if (!this.comp) return;
    this.comp.config.actions = (this.comp.config.actions ?? []).filter(a => a.id !== id);
  }

  // ── Seletor de componente-alvo com busca ───────────────────────────────────

  /** Picker aberto atualmente, identificado por `${actionId}:${paramKey}`. */
  openPicker: string | null = null;
  /** Texto de busca por picker. */
  searchTerms: Record<string, string> = {};

  pid(action: ComponentAction, key: string): string {
    return `${action.id}:${key}`;
  }

  /** Lista achatada de todos os componentes da página (exceto o próprio). */
  get flatComponents(): { id: string; name: string; type: string; depth: number }[] {
    const out: { id: string; name: string; type: string; depth: number }[] = [];
    const selfId = this.comp?.id;
    const walk = (list: PageComponent[], depth: number) => {
      for (const c of list) {
        if (c.id !== selfId) out.push({ id: c.id, name: c.name, type: String(c.type), depth });
        if (c.children?.length) walk(c.children, depth + 1);
      }
    };
    for (const s of this.editorState.sections) walk(s.pageComponents, 0);
    return out;
  }

  /** Rótulo amigável do componente selecionado (ou o id bruto se não encontrado). */
  targetLabel(id: string | undefined): string {
    if (!id) return '';
    return this.flatComponents.find(c => c.id === id)?.name ?? id;
  }

  /** Texto exibido no input: busca digitada (se aberto) ou nome do alvo. */
  pickerDisplay(action: ComponentAction, key: string): string {
    const p = this.pid(action, key);
    if (this.openPicker === p) return this.searchTerms[p] ?? '';
    return this.targetLabel(action.params[key as keyof ComponentAction['params']] as string | undefined);
  }

  /** Componentes filtrados pelo termo de busca do picker. */
  filteredComponents(action: ComponentAction, key: string): { id: string; name: string; type: string; depth: number }[] {
    const term = (this.searchTerms[this.pid(action, key)] ?? '').trim().toLowerCase();
    const all = this.flatComponents;
    if (!term) return all;
    return all.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.type.toLowerCase().includes(term) ||
      c.id.toLowerCase().includes(term),
    );
  }

  onPickerFocus(action: ComponentAction, key: string): void {
    const p = this.pid(action, key);
    this.openPicker = p;
    this.searchTerms[p] = '';
  }

  onPickerInput(action: ComponentAction, key: string, value: string): void {
    this.openPicker = this.pid(action, key);
    this.searchTerms[this.pid(action, key)] = value;
  }

  schedulePickerClose(p: string): void {
    setTimeout(() => { if (this.openPicker === p) this.openPicker = null; }, 150);
  }

  selectTarget(action: ComponentAction, key: string, id: string): void {
    (action.params as Record<string, unknown>)[key] = id;
    this.openPicker = null;
  }

  clearTarget(action: ComponentAction, key: string): void {
    (action.params as Record<string, unknown>)[key] = '';
    this.openPicker = null;
  }

  get pages() { return this.editorState.pages; }

  get boundObject() {
    const name = this.comp?.config.boundObject;
    return name ? (this.objectsSvc.objects().find(o => o.name === name) ?? null) : null;
  }

  setTab(tab: ModalTab): void {
    this.modalTab = tab;
    if (tab === 'objects') this.objectsSvc.loadAll();
   }

  close(): void { this.editorState.propertiesModalOpen = false; }

  @HostListener('document:keydown.escape')
  onEsc(): void { this.close(); }
}
