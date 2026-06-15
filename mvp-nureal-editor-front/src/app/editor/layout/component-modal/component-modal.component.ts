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
