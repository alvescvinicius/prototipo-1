import { Injectable } from '@angular/core';

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
  public projectName: string = 'Minha Aplicacao';
  public lastSavedAt: Date | null = null;
  public isDirty: boolean = false;
  public loadingProject: boolean = false;
  public splitView:     boolean = false;
  public propertiesModalOpen: boolean = false;
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
    this._scheduleAutoSave();
  }

  renamePage(pageId: string, name: string): void {
    const page = this._pages.find((p) => p.id === pageId);
    if (page) {
      page.name = name;
      this._scheduleAutoSave();
    }
  }

  deletePage(pageId: string): void {
    if (this._pages.length <= 1) return;
    this._pages = this._pages.filter((p) => p.id !== pageId);
    if (this._currentPageId === pageId) this._currentPageId = this._pages[0].id;
    this._scheduleAutoSave();
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

  private _scheduleAutoSave(): void {
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
      this._scheduleAutoSave();
    }
  }

  redo(): void {
    const next = this.history.redo(this.sections);
    if (next) {
      this.sections = next;
      this.selectedNode = null;
      this._scheduleAutoSave();
    }
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
    this._scheduleAutoSave();
  }

  deleteSection(sectionId: string): void {
    this.history.snapshot(this.sections);
    this.sections = this.sections.filter((s) => s.id !== sectionId);
    if (this.selectedNode?.id === sectionId) this.selectedNode = null;
    this._reindexSections();
    this._scheduleAutoSave();
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
    this._scheduleAutoSave();
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
    this._scheduleAutoSave();
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
  addComponentToCanvas(type: ComponentType, posX?: number, posY?: number): void {
    this._ensureCanvas();
    const canvas = this.sections[0];
    if (!canvas) return;
    this.history.snapshot(this.sections);
    const comp = ComponentFactory.create(type, canvas.pageComponents.length + 1);
    // Sempre modo absoluto no canvas livre
    comp.config.absolutePos = true;
    if (posX !== undefined && posY !== undefined) {
      comp.config.posX = Math.round(posX);
      comp.config.posY = Math.round(posY);
    } else {
      // Escalonamento automático para evitar sobreposição
      const idx = canvas.pageComponents.length;
      comp.config.posX = 80 + (idx % 6) * 32;
      comp.config.posY = 80 + (idx % 6) * 32;
    }
    canvas.pageComponents.push(comp);
    this.selectedNode = comp;
    this._scheduleAutoSave();
  }

  createComponent(type: ComponentType): void {
    // Se há um container/grid selecionado, adiciona dentro dele
    if (this.selectedNode &&
        (this.selectedNode.type === ComponentType.CONTAINER ||
         this.selectedNode.type === ComponentType.GRID)) {
      const p = this.selectedNode as PageComponent;
      this.history.snapshot(this.sections);
      p.children.push(ComponentFactory.create(type, p.children.length + 1));
      this._scheduleAutoSave();
      return;
    }
    // Caso geral: adiciona ao canvas livre
    this.addComponentToCanvas(type);
  }

  addComponentToSection(sectionId: string, type: ComponentType): void {
    const section = this.sections.find((s) => s.id === sectionId);
    if (!section) return;
    this.history.snapshot(this.sections);
    const comp = ComponentFactory.create(
      type,
      section.pageComponents.length + 1,
    );
    section.pageComponents.push(comp);
    this.selectedNode = comp;
    this._scheduleAutoSave();
  }

  addComponentToContainer(containerId: string, type: ComponentType): void {
    const container = this._findComponent(containerId);
    if (!container) return;
    this.history.snapshot(this.sections);
    const child = ComponentFactory.create(type, container.children.length + 1);
    container.children.push(child);
    this.selectedNode = child;
    this._scheduleAutoSave();
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
    this._scheduleAutoSave();
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
    this._scheduleAutoSave();
  }

  deleteComponent(componentId: string): void {
    this.history.snapshot(this.sections);
    for (const section of this.sections) {
      const idx = section.pageComponents.findIndex((c) => c.id === componentId);
      if (idx !== -1) {
        section.pageComponents.splice(idx, 1);
        this._reindexComponents(section.pageComponents);
        if (this.selectedNode?.id === componentId) this.selectedNode = null;
        this._scheduleAutoSave();
        return;
      }
      for (const comp of section.pageComponents) {
        if (this._deleteFromChildren(comp, componentId)) {
          this._scheduleAutoSave();
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
    this._scheduleAutoSave();
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
    if (comp) this._clipboard = JSON.parse(JSON.stringify(comp));
  }

  pasteComponent(): void {
    if (!this._clipboard) return;
    this._ensureCanvas();
    const canvas = this.sections[0];
    if (!canvas) return;
    this.history.snapshot(this.sections);
    const clone: PageComponent = {
      ...JSON.parse(JSON.stringify(this._clipboard)),
      id: crypto.randomUUID(),
      order: canvas.pageComponents.length + 1,
    };
    // Offset to avoid exact overlap
    if (clone.config.absolutePos) {
      clone.config.posX = (clone.config.posX ?? 0) + 20;
      clone.config.posY = (clone.config.posY ?? 0) + 20;
    }
    canvas.pageComponents.push(clone);
    this._scheduleAutoSave();
  }
}
