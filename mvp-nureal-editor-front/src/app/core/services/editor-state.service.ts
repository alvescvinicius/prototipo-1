import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { ComponentType } from '../enums/component-type.enum';
import { Section } from '../interfaces/section';
import { Page } from '../interfaces/page';
import { PageComponent } from '../interfaces/page-component';

import { ComponentFactory } from '../factories/component.factory';
import { HistoryService } from './history.service';
import { StorageService } from './storage.service';
import { ProjectService } from './project.service';

@Injectable({ providedIn: 'root' })
export class EditorStateService {
  private _pages: Page[] = [];
  private _currentPageId: string = '';
  private _projectId: string | null = null;

  public selectedNode: Section | PageComponent | null = null;
  public floatingPanelPos: { x: number; y: number } | null = null;
  public selectedPage: Page | null = null;

  /** Nó cujo painel de contexto (Paleta 2) está aberto */
  public paletteContextTarget: { id: string; name: string; nodeType: 'page' | 'component' } | null = null;
  public projectName: string = 'Minha Aplicacao';
  public lastSavedAt: Date | null = null;
  public isDirty: boolean = false;
  public loadingProject: boolean = false;
  public splitView:     boolean = false;

  /** Emite quando o canvas deve recalcular o zoom (ex: volta da preview). */
  public readonly requestZoomFit$ = new Subject<void>();
  public propertiesModalOpen: boolean = false;

  // ── Viewport / Device ────────────────────────────────────
  public viewport: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  public canvasZoom: number = 1;

  /** Persiste scroll do canvas entre navegações (editor ↔ preview) */
  public canvasScrollTop:  number = 0;
  public canvasScrollLeft: number = 0;

  get deviceWidth(): number {
    const map: Record<string, number> = { mobile: 375, tablet: 768, desktop: 1280 };
    return map[this.viewport];
  }
  public pagePropertiesModalOpen: boolean = false;
  private _sidebarCollapsed: boolean = false;
  get sidebarCollapsed(): boolean { return this._sidebarCollapsed; }
  set sidebarCollapsed(val: boolean) {
    this._sidebarCollapsed = val;
    if (val) {
      this.selectedNode = null;
      this.propertiesModalOpen = false;
      this.pagePropertiesModalOpen = false;
    }
  }

  private _clipboard: PageComponent | null = null;
  private _clipboardSourceId: string | null = null;
  public draggedNodeId: string | null = null;
  get hasClipboard(): boolean {
    return this._clipboard !== null;
  }

  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private history: HistoryService,
    private storage: StorageService,
    private projectSvc: ProjectService,
  ) {
    this._loadFromLocalStorage();
  }

  // ─── Project loading (Supabase) ──────────────────────────

  async loadProject(projectId: string): Promise<void> {
    this.loadingProject = true;
    const project = await this.projectSvc.getProject(projectId);
    if (project) {
      this._projectId = project.id;
      this.projectName = project.name;
      this._pages = project.data?.pages ?? [];
      this._currentPageId = project.data?.currentPageId ?? '';
      // garantir ao menos 1 página
      if (this._pages.length === 0) this._initDefaultPage();
      else if (!this._pages.find((p) => p.id === this._currentPageId)) {
        this._currentPageId = this._pages[0].id;
      }
      this.history.clear();
      this.selectedNode = null;
      this.selectedPage = this.currentPage;
      this.lastSavedAt = new Date(project.updated_at);
      this.isDirty = false;
      this._ensureCanvas(); // migrar seções antigas → canvas livre
    }
    this.loadingProject = false;
  }

  // ─── Pages API ───────────────────────────────────────────

  get pages(): Page[] {
    return this._pages;
  }
  get currentPageId(): string {
    return this._currentPageId;
  }
  get projectId(): string | null {
    return this._projectId;
  }

  get currentPage(): Page | null {
    return this._pages.find((p) => p.id === this._currentPageId) ?? null;
  }

  get sections(): Section[] {
    return this.currentPage?.sections ?? [];
  }
  set sections(value: Section[]) {
    const page = this.currentPage;
    if (page) page.sections = value;
  }

  /** Canvas único da página (primeira section, invisível ao usuário) */
  get pageComponents(): import('../interfaces/page-component').PageComponent[] {
    return this.sections[0]?.pageComponents ?? [];
  }

  /** ID da section-canvas (para passar ao ComponentRenderer como sectionId) */
  get canvasSectionId(): string {
    return this.sections[0]?.id ?? '';
  }

  /**
   * Garante que exista exatamente 1 section "canvas" por página.
   * Se houver mais de uma, mescla tudo na primeira.
   */
  private _ensureCanvas(): void {
    const page = this.currentPage;
    if (!page) return;
    if (page.sections.length === 0) {
      page.sections = [{
        id: crypto.randomUUID(),
        type: ComponentType.SECTION,
        name: 'canvas',
        order: 1,
        config: {},
        pageComponents: [],
      }];
    } else if (page.sections.length > 1) {
      // Migra seções extras para a primeira
      const first = page.sections[0];
      for (let i = 1; i < page.sections.length; i++) {
        first.pageComponents.push(...page.sections[i].pageComponents);
      }
      page.sections = [first];
      this._reindexComponents(first.pageComponents);
    }
  }

  switchPage(pageId: string): void {
    const page = this._pages.find((p) => p.id === pageId);

    if (!page) {
      return;
    }

    this.history.clear();

    this.selectedNode = null;
    this.selectedPage = page;

    this._currentPageId = pageId;
    this._ensureCanvas();
  }
  addPage(): void {
    const page: Page = {
      id: crypto.randomUUID(),
      name: `Pagina ${this._pages.length + 1}`,
      sections: [],
    };
    this._pages.push(page);
    this.switchPage(page.id);   // switchPage já chama _ensureCanvas
    this.scheduleAutoSave();
  }

  renamePage(pageId: string, name: string): void {
    const page = this._pages.find((p) => p.id === pageId);
    if (page) {
      page.name = name;
      this.scheduleAutoSave();
    }
  }

  deletePage(pageId: string): void {
    if (this._pages.length <= 1) return;
    this._pages = this._pages.filter((p) => p.id !== pageId);
    if (this._currentPageId === pageId) this._currentPageId = this._pages[0].id;
    this.scheduleAutoSave();
  }

  // ─── Persistence ─────────────────────────────────────────

  private _loadFromLocalStorage(): void {
    const saved = this.storage.load();
    if (saved) {
      this._pages = saved.pages;
      this._currentPageId = saved.currentPageId;
      this.selectedPage = this.currentPage;
      this.projectName = saved.projectName;
      this.lastSavedAt = new Date(saved.savedAt);
      this.isDirty = false;
      this._ensureCanvas();
    } else {
      this._initDefaultPage();
      this._ensureCanvas();
    }
  }

  private _initDefaultPage(): void {
    const page: Page = { id: crypto.randomUUID(), name: 'Pagina 1', sections: [] };
    this._pages = [page];
    this._currentPageId = page.id;
  }

  async saveNow(): Promise<void> {
    // Salva localStorage (fallback local)
    this.storage.save(this._pages, this._currentPageId, this.projectName);
    // Salva no Supabase se tiver projectId
    if (this._projectId) {
      await this.projectSvc.saveProject(
        this._projectId,
        this.projectName,
        this._pages,
        this._currentPageId,
      );
    }
    this.lastSavedAt = new Date();
    this.isDirty = false;
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  scheduleAutoSave(): void {
    this.isDirty = true;
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      this.saveNow();
    }, 2000);
  }

clearProject(): void {
  this.history.clear();
  this.storage.clear();

  this.selectedNode = null;
  this.selectedPage = null;

  this.lastSavedAt = null;
  this.isDirty = false;
  this._clipboard = null;
  this._projectId = null;

  this._initDefaultPage();
}

  // ─── Selection ───────────────────────────────────────────

  selectNode(node: Section | PageComponent | null, pos?: { x: number; y: number }): void {
    this.selectedNode = node;
    this.selectedPage = null;
    this.floatingPanelPos = null;
  }

  selectPage(page: Page | null): void {
    this.selectedPage = page;
    this.selectedNode = null;
  }
  clearSelection(): void {
    this.selectedNode = null;
  }
  isSelected(item: Section | PageComponent): boolean {
    return !!this.selectedNode && this.selectedNode.id === item.id;
  }

  // ─── Undo / Redo ─────────────────────────────────────────

  undo(): void {
    const prev = this.history.undo(this.sections);
    if (prev) {
      this.sections = prev;
      this.selectedNode = null;
      this.scheduleAutoSave();
    }
  }

  redo(): void {
    const next = this.history.redo(this.sections);
    if (next) {
      this.sections = next;
      this.selectedNode = null;
      this.scheduleAutoSave();
    }
  }

  /** Chamado pelo component-renderer antes de iniciar um drag de posição. */
  snapshotForMove(): void {
    this.history.snapshot(this.sections);
  }

  get canUndo(): boolean  { return this.history.canUndo; }
  get canRedo(): boolean  { return this.history.canRedo; }
  get undoCount(): number { return this.history.historySize; }
  get redoCount(): number { return this.history.redoSize; }

  // ─── Sections ────────────────────────────────────────────

  addSection(): void {
    this.history.snapshot(this.sections);
    const section: Section = {
      id: crypto.randomUUID(),
      type: ComponentType.SECTION,
      name: 'Section ' + (this.sections.length + 1),
      order: this.sections.length + 1,
      config: {},
      pageComponents: [],
    };
    this.sections.push(section);
    this.scheduleAutoSave();
  }

  deleteSection(sectionId: string): void {
    this.history.snapshot(this.sections);
    this.sections = this.sections.filter((s) => s.id !== sectionId);
    if (this.selectedNode?.id === sectionId) this.selectedNode = null;
    this._reindexSections();
    this.scheduleAutoSave();
  }

  moveSectionUp(sectionId: string): void {
    const idx = this.sections.findIndex((s) => s.id === sectionId);
    if (idx <= 0) return;
    this.history.snapshot(this.sections);
    [this.sections[idx - 1], this.sections[idx]] = [
      this.sections[idx],
      this.sections[idx - 1],
    ];
    this._reindexSections();
    this.scheduleAutoSave();
  }

  moveSectionDown(sectionId: string): void {
    const idx = this.sections.findIndex((s) => s.id === sectionId);
    if (idx === -1 || idx >= this.sections.length - 1) return;
    this.history.snapshot(this.sections);
    [this.sections[idx], this.sections[idx + 1]] = [
      this.sections[idx + 1],
      this.sections[idx],
    ];
    this._reindexSections();
    this.scheduleAutoSave();
  }

  private _reindexSections(): void {
    this.sections.forEach((s, i) => {
      s.order = i + 1;
    });
  }

  private _reindexComponents(list: PageComponent[]): void {
    list.forEach((c, i) => { c.order = i + 1; });
  }

  // ─── Components ──────────────────────────────────────────

  /**
   * Adiciona um componente ao canvas livre (section[0]).
   * posX/posY: coordenadas absolutas dentro do canvas; se omitidos,
   * usa posição escalonada automática.
   */
  addComponentToCanvas(type: ComponentType, posX?: number, posY?: number, variant?: string): void {
    this._ensureCanvas();
    const canvas = this.sections[0];
    if (!canvas) return;
    this.history.snapshot(this.sections);
    const comp = ComponentFactory.create(type, canvas.pageComponents.length + 1, variant);
    if (posX !== undefined && posY !== undefined) {
      // Drop com coordenadas explicitas → modo livre ativado na posicao do drop
      comp.config.absolutePos = true;
      comp.config.posX = Math.round(posX);
      comp.config.posY = Math.round(posY);
    }
    // Sem coordenadas (click no toolbox) → fluxo normal, cadeado fechado (padrao)
    canvas.pageComponents.push(comp);
    this.selectedNode = comp;
    this.scheduleAutoSave();
  }

  createComponent(type: ComponentType, variant?: string): void {
    // Se há qualquer PageComponent selecionado, adiciona como filho dele
    if (this.selectedNode) {
      const sel = this.selectedNode as PageComponent;
      if (sel.children !== undefined) {   // é PageComponent (tem children), não Section
        this.history.snapshot(this.sections);
        const child = ComponentFactory.create(type, sel.children.length + 1, variant);
        sel.children.push(child);
        this.selectedNode = child;
        this.scheduleAutoSave();
        return;
      }
    }
    // Caso geral: adiciona ao canvas livre
    this.addComponentToCanvas(type, undefined, undefined, variant);
  }

  /** Adiciona um filho diretamente a qualquer componente pelo ID. */
  addChildComponent(parentId: string, type: ComponentType, variant?: string): void {
    const parent = this._findComponent(parentId);
    if (!parent) return;
    this.history.snapshot(this.sections);
    const child = ComponentFactory.create(type, parent.children.length + 1, variant);
    parent.children.push(child);
    this.selectedNode = child;
    this.scheduleAutoSave();
  }

  addComponentToSection(sectionId: string, type: ComponentType, variant?: string): void {
    const section = this.sections.find((s) => s.id === sectionId);
    if (!section) return;
    this.history.snapshot(this.sections);
    const comp = ComponentFactory.create(
      type,
      section.pageComponents.length + 1,
      variant,
    );
    section.pageComponents.push(comp);
    this.selectedNode = comp;
    this.scheduleAutoSave();
  }

  addComponentToContainer(containerId: string, type: ComponentType, variant?: string): void {
    const container = this._findComponent(containerId);
    if (!container) return;
    this.history.snapshot(this.sections);
    const child = ComponentFactory.create(type, container.children.length + 1, variant);
    container.children.push(child);
    this.selectedNode = child;
    this.scheduleAutoSave();
  }

  addSlide(carouselId: string): void {
    const carousel = this._findComponent(carouselId);
    if (!carousel) return;
    this.history.snapshot(this.sections);
    const n = carousel.children.length + 1;
    carousel.children.push({
      id: crypto.randomUUID(),
      type: ComponentType.CONTAINER,
      name: `Slide ${n}`,
      order: n,
      children: [],
      config: { width: '100%', height: '100%' }
    } as any);
    this.scheduleAutoSave();
  }

  removeSlide(carouselId: string, slideIdx: number): void {
    const carousel = this._findComponent(carouselId);
    if (!carousel || carousel.children.length <= 1) return;
    this.history.snapshot(this.sections);
    carousel.children.splice(slideIdx, 1);
    this.scheduleAutoSave();
  }

  moveComponentToIndex(
    componentId: string,
    sectionId: string,
    targetIndex: number,
  ): void {
    const section = this.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const currentIndex = section.pageComponents.findIndex(
      (c) => c.id === componentId,
    );
    if (currentIndex === -1 || currentIndex === targetIndex) return;
    this.history.snapshot(this.sections);
    const [moved] = section.pageComponents.splice(currentIndex, 1);
    const adjusted = targetIndex > currentIndex ? targetIndex - 1 : targetIndex;
    section.pageComponents.splice(adjusted, 0, moved);
    this._reindexComponents(section.pageComponents);
    this.scheduleAutoSave();
  }

  moveComponentToContainer(componentId: string, containerId: string): void {
    if (componentId === containerId) return;
    const container = this._findComponent(containerId);
    if (!container) return;
    if (this._findInList(container.children, componentId)) return;
    this.history.snapshot(this.sections);
    const extracted = this._extractComponent(componentId);
    if (!extracted) return;
    container.children.push(extracted);
    this._reindexComponents(container.children);
    this.selectedNode = extracted;
    this.scheduleAutoSave();
  }

  togglePosLock(componentId: string): void {
    const comp = this._findComponent(componentId);
    if (!comp) return;
    const livre = !!comp.config.absolutePos;
    if (livre) {
      // Travar: desativa modo livre → volta ao fluxo normal
      comp.config.absolutePos = false;
      comp.config.posLocked   = false;
    } else {
      // Destravar: ativa modo livre na posicao atual (ou 0,0)
      comp.config.absolutePos = true;
      comp.config.posLocked   = false;
      comp.config.posX = comp.config.posX ?? 0;
      comp.config.posY = comp.config.posY ?? 0;
    }
    this.scheduleAutoSave();
  }

  deleteComponent(componentId: string): void {
    this.history.snapshot(this.sections);
    for (const section of this.sections) {
      const idx = section.pageComponents.findIndex((c) => c.id === componentId);
      if (idx !== -1) {
        section.pageComponents.splice(idx, 1);
        this._reindexComponents(section.pageComponents);
        if (this.selectedNode?.id === componentId) this.selectedNode = null;
        this.scheduleAutoSave();
        return;
      }
      for (const comp of section.pageComponents) {
        if (this._deleteFromChildren(comp, componentId)) {
          this.scheduleAutoSave();
          return;
        }
      }
    }
  }

  moveComponentUp(componentId: string): void {
    for (const section of this.sections) {
      if (this._moveInList(section.pageComponents, componentId, -1)) return;
      for (const comp of section.pageComponents) {
        if (this._moveInChildren(comp, componentId, -1)) return;
      }
    }
  }

  moveComponentDown(componentId: string): void {
    for (const section of this.sections) {
      if (this._moveInList(section.pageComponents, componentId, +1)) return;
      for (const comp of section.pageComponents) {
        if (this._moveInChildren(comp, componentId, +1)) return;
      }
    }
  }



  private _findPasteTarget(): Section | PageComponent | null {
    if (!this.selectedNode) return this.sections[0] ?? null;
    const t = this.selectedNode.type;
    if (t === ComponentType.SECTION) return this.selectedNode as Section;
    if (t === ComponentType.CONTAINER || t === ComponentType.GRID)
      return this.selectedNode as PageComponent;
    for (const section of this.sections) {
      if (section.pageComponents.some((c) => c.id === this.selectedNode!.id))
        return section;
      for (const comp of section.pageComponents) {
        if (this._findInList(comp.children, this.selectedNode!.id))
          return section;
      }
    }
    return this.sections[0] ?? null;
  }

  private _regenerateIds(comp: PageComponent): PageComponent {
    comp.id = crypto.randomUUID();
    comp.children = comp.children.map((c) => this._regenerateIds(c));
    return comp;
  }

  // ─── Private helpers ─────────────────────────────────────

  private _moveInList(list: PageComponent[], id: string, dir: -1 | 1): boolean {
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    const target = idx + dir;
    if (target < 0 || target >= list.length) return false;
    this.history.snapshot(this.sections);
    [list[idx], list[target]] = [list[target], list[idx]];
    this._reindexComponents(list);
    this.scheduleAutoSave();
    return true;
  }

  private _moveInChildren(
    parent: PageComponent,
    id: string,
    dir: -1 | 1,
  ): boolean {
    if (this._moveInList(parent.children, id, dir)) return true;
    for (const child of parent.children) {
      if (this._moveInChildren(child, id, dir)) return true;
    }
    return false;
  }

  /**
   * Calcula o posY para o próximo componente adicionado via toolbox:
   * bottom = max(posY + height) de todos os componentes existentes.
   * Para componentes sem height numérico explícito usa fallback de 80px.
   */
  private _calcNextPosY(components: PageComponent[]): number {
    if (components.length === 0) return 0;
    let maxBottom = 0;
    for (const c of components) {
      const y = c.config.posY ?? 0;
      const h = this._pxValue(c.config.height) ?? 80;
      maxBottom = Math.max(maxBottom, y + h);
    }
    return maxBottom;
  }

  /** Extrai valor numérico de uma string de pixels ("300px" → 300). Retorna null para %, auto, etc. */
  private _pxValue(val: string | undefined): number | null {
    if (!val) return null;
    if (val.endsWith('px')) { const n = parseFloat(val); return isNaN(n) ? null : n; }
    return null;
  }

  private _findComponent(id: string): PageComponent | null {
    for (const section of this.sections) {
      const found = this._findInList(section.pageComponents, id);
      if (found) return found;
      for (const comp of section.pageComponents) {
        const deep = this._findDeep(comp, id);
        if (deep) return deep;
      }
    }
    return null;
  }

  private _extractComponent(id: string): PageComponent | null {
    for (const section of this.sections) {
      const idx = section.pageComponents.findIndex(c => c.id === id);
      if (idx !== -1) {
        const [comp] = section.pageComponents.splice(idx, 1);
        return comp;
      }
      for (const comp of section.pageComponents) {
        const extracted = this._extractFromChildren(comp, id);
        if (extracted) return extracted;
      }
    }
    return null;
  }

  private _extractFromChildren(parent: PageComponent, id: string): PageComponent | null {
    const idx = parent.children.findIndex(c => c.id === id);
    if (idx !== -1) {
      const [comp] = parent.children.splice(idx, 1);
      return comp;
    }
    for (const child of parent.children) {
      const found = this._extractFromChildren(child, id);
      if (found) return found;
    }
    return null;
  }

  private _deleteFromChildren(parent: PageComponent, id: string): boolean {
    const idx = parent.children.findIndex(c => c.id === id);
    if (idx !== -1) {
      parent.children.splice(idx, 1);
      this._reindexComponents(parent.children);
      if (this.selectedNode?.id === id) this.selectedNode = null;
      return true;
    }
    for (const child of parent.children) {
      if (this._deleteFromChildren(child, id)) return true;
    }
    return false;
  }

  private _findDeep(parent: PageComponent, id: string): PageComponent | null {
    if (parent.id === id) return parent;
    for (const child of parent.children) {
      const found = this._findDeep(child, id);
      if (found) return found;
    }
    return null;
  }

  private _findInList(list: PageComponent[], id: string): PageComponent | null {
    return list.find(c => c.id === id) ?? null;
  }

  // ── Clipboard ─────────────────────────────────────────────

  copyComponent(id: string): void {
    const comp = this._findComponent(id);
    if (!comp) return;
    this._clipboard = JSON.parse(JSON.stringify(comp));
    this._clipboardSourceId = id;
  }

  pasteComponent(): void {
    if (!this._clipboard) return;
    this.history.snapshot(this.sections);
    const clone = this._deepClone(this._clipboard);
    // Garante IDs únicos em todo o clone (incluindo filhos)
    this._reassignIds(clone);
    clone.name = this._uniqueName(clone.name);

    // Try to paste as sibling right after the source
    if (this._clipboardSourceId) {
      const parentInfo = this._findParentList(this._clipboardSourceId);
      if (parentInfo) {
        parentInfo.list.splice(parentInfo.index + 1, 0, clone);
        this._reindexComponents(parentInfo.list);
        this.selectedNode = clone;
        this.scheduleAutoSave();
        return;
      }
    }
    // Fallback: paste at root of first section
    const section = this.sections[0];
    if (!section) return;
    section.pageComponents.push(clone);
    this.selectedNode = clone;
    this.scheduleAutoSave();
  }

  duplicateComponent(id: string): void {
    const comp = this._findComponent(id);
    if (!comp) return;
    this.history.snapshot(this.sections);
    const clone = this._deepClone(comp);
    this._reassignIds(clone);
    clone.name = this._uniqueName(comp.name);
    const parentInfo = this._findParentList(id);
    if (parentInfo) {
      parentInfo.list.splice(parentInfo.index + 1, 0, clone);
      this._reindexComponents(parentInfo.list);
    } else {
      const section = this.sections[0];
      if (section) section.pageComponents.push(clone);
    }
    this.selectedNode = clone;
    this.scheduleAutoSave();
  }

  /** Garante que todos os nós do clone (e seus filhos) tenham IDs únicos. */
  private _reassignIds(comp: PageComponent): void {
    comp.id = crypto.randomUUID();
    for (const child of comp.children ?? []) {
      this._reassignIds(child);
    }
  }

  moveComponentRelativeTo(sourceId: string, targetId: string, position: 'before' | 'after' | 'into'): void {
    if (sourceId === targetId) return;
    const sourceComp = this._findComponent(sourceId);
    if (!sourceComp) return;
    // Não deixar soltar dentro de um próprio descendente
    if (this._findDeep(sourceComp, targetId)) return;

    this.history.snapshot(this.sections);
    const extracted = this._extractComponent(sourceId);
    if (!extracted) return;

    if (position === 'into') {
      const target = this._findComponent(targetId);
      if (!target) { this.scheduleAutoSave(); return; }
      target.children.unshift(extracted);
      this._reindexComponents(target.children);
    } else {
      const parentInfo = this._findParentList(targetId);
      if (!parentInfo) { this.scheduleAutoSave(); return; }
      const insertIdx = position === 'before' ? parentInfo.index : parentInfo.index + 1;
      parentInfo.list.splice(insertIdx, 0, extracted);
      this._reindexComponents(parentInfo.list);
    }

    this.selectedNode = extracted;
    this.scheduleAutoSave();
  }

  _findParentList(id: string): { list: PageComponent[]; index: number } | null {
    for (const section of this.sections) {
      const idx = section.pageComponents.findIndex((c) => c.id === id);
      if (idx !== -1) return { list: section.pageComponents, index: idx };
      for (const comp of section.pageComponents) {
        const result = this._findParentListInChildren(comp, id);
        if (result) return result;
      }
    }
    return null;
  }

  private _findParentListInChildren(
    parent: PageComponent,
    id: string,
  ): { list: PageComponent[]; index: number } | null {
    const idx = parent.children.findIndex((c) => c.id === id);
    if (idx !== -1) return { list: parent.children, index: idx };
    for (const child of parent.children) {
      const result = this._findParentListInChildren(child, id);
      if (result) return result;
    }
    return null;
  }

  private _deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Retorna um nome único para um clone, evitando colisões com os existentes.
   * Exemplo: "Card (netflix)" → "Card (netflix) 2" → "Card (netflix) 3"
   */
  private _uniqueName(baseName: string): string {
    // Coleta todos os nomes já em uso
    const allNames = new Set<string>();
    const collect = (list: PageComponent[]) => {
      for (const c of list) {
        allNames.add(c.name);
        if (c.children?.length) collect(c.children);
      }
    };
    for (const section of this.sections) {
      allNames.add(section.name);
      collect(section.pageComponents);
    }

    // Remove sufixo numérico existente para começar do base limpo
    const stripped = baseName.replace(/ \d+$/, '');
    if (!allNames.has(stripped + ' 2')) return stripped + ' 2';

    let n = 2;
    while (allNames.has(`${stripped} ${n}`)) n++;
    return `${stripped} ${n}`;
  }

}
