import { Injectable } from '@angular/core';

import { ComponentType } from '../enums/component-type.enum';

import { Section } from '../interfaces/section';
import { PageComponent } from '../interfaces/page-component';

import { ComponentFactory } from '../factories/component.factory';
import { HistoryService } from './history.service';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class EditorStateService {

  public sections:     Section[]                       = [];
  public selectedNode: Section | PageComponent | null  = null;
  public projectName:  string                          = 'Minha Aplicacao';
  public lastSavedAt:  Date | null                     = null;
  public isDirty:      boolean                         = false;

  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private history: HistoryService,
    private storage: StorageService
  ) {
    this._loadFromStorage();
  }

  private _loadFromStorage(): void {
    const saved = this.storage.load();
    if (!saved) return;
    this.sections    = saved.sections;
    this.projectName = saved.projectName;
    this.lastSavedAt = new Date(saved.savedAt);
    this.isDirty     = false;
  }

  saveNow(): void {
    this.storage.save(this.sections, this.projectName);
    this.lastSavedAt = new Date();
    this.isDirty     = false;
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  private _scheduleAutoSave(): void {
    this.isDirty = true;
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => { this.saveNow(); }, 2000);
  }

  clearProject(): void {
    this.history.clear();
    this.storage.clear();
    this.sections     = [];
    this.selectedNode = null;
    this.lastSavedAt  = null;
    this.isDirty      = false;
  }

  selectNode(node: Section | PageComponent): void {
    this.selectedNode = node;
  }

  clearSelection(): void {
    this.selectedNode = null;
  }

  isSelected(item: Section | PageComponent): boolean {
    if (!this.selectedNode) return false;
    return this.selectedNode.id === item.id;
  }

  undo(): void {
    const prev = this.history.undo(this.sections);
    if (prev) {
      this.sections     = prev;
      this.selectedNode = null;
      this._scheduleAutoSave();
    }
  }

  redo(): void {
    const next = this.history.redo(this.sections);
    if (next) {
      this.sections     = next;
      this.selectedNode = null;
      this._scheduleAutoSave();
    }
  }

  get canUndo(): boolean { return this.history.canUndo; }
  get canRedo(): boolean { return this.history.canRedo; }

  addSection(): void {
    this.history.snapshot(this.sections);
    const section: Section = {
      id:             crypto.randomUUID(),
      type:           ComponentType.SECTION,
      name:           'Section ' + (this.sections.length + 1),
      order:          this.sections.length + 1,
      config:         {},
      pageComponents: []
    };
    this.sections.push(section);
    this._scheduleAutoSave();
  }

  deleteSection(sectionId: string): void {
    this.history.snapshot(this.sections);
    this.sections = this.sections.filter(s => s.id !== sectionId);
    if (this.selectedNode?.id === sectionId) this.selectedNode = null;
    this._reindexSections();
    this._scheduleAutoSave();
  }

  moveSectionUp(sectionId: string): void {
    const idx = this.sections.findIndex(s => s.id === sectionId);
    if (idx <= 0) return;
    this.history.snapshot(this.sections);
    [this.sections[idx - 1], this.sections[idx]] = [this.sections[idx], this.sections[idx - 1]];
    this._reindexSections();
    this._scheduleAutoSave();
  }

  moveSectionDown(sectionId: string): void {
    const idx = this.sections.findIndex(s => s.id === sectionId);
    if (idx === -1 || idx >= this.sections.length - 1) return;
    this.history.snapshot(this.sections);
    [this.sections[idx], this.sections[idx + 1]] = [this.sections[idx + 1], this.sections[idx]];
    this._reindexSections();
    this._scheduleAutoSave();
  }

  private _reindexSections(): void {
    this.sections.forEach((s, i) => { s.order = i + 1; });
  }

  createComponent(type: ComponentType): void {
    if (!this.selectedNode) return;
    this.history.snapshot(this.sections);

    if (this.selectedNode.type === ComponentType.SECTION) {
      const section = this.selectedNode as Section;
      section.pageComponents.push(
        ComponentFactory.create(type, section.pageComponents.length + 1)
      );
      this._scheduleAutoSave();
      return;
    }

    if (this.selectedNode.type === ComponentType.CONTAINER) {
      const parent = this.selectedNode as PageComponent;
      parent.children.push(
        ComponentFactory.create(type, parent.children.length + 1)
      );
      this._scheduleAutoSave();
    }
  }

  addComponentToSection(sectionId: string, type: ComponentType): void {
    const section = this.sections.find(s => s.id === sectionId);
    if (!section) return;
    this.history.snapshot(this.sections);
    const comp = ComponentFactory.create(type, section.pageComponents.length + 1);
    section.pageComponents.push(comp);
    this.selectedNode = comp;
    this._scheduleAutoSave();
  }

  moveComponentToIndex(componentId: string, sectionId: string, targetIndex: number): void {
    const section = this.sections.find(s => s.id === sectionId);
    if (!section) return;

    const currentIndex = section.pageComponents.findIndex(c => c.id === componentId);
    if (currentIndex === -1 || currentIndex === targetIndex) return;

    this.history.snapshot(this.sections);
    const [moved] = section.pageComponents.splice(currentIndex, 1);
    const adjusted = targetIndex > currentIndex ? targetIndex - 1 : targetIndex;
    section.pageComponents.splice(adjusted, 0, moved);
    this._reindexComponents(section.pageComponents);
    this._scheduleAutoSave();
  }

  deleteComponent(componentId: string): void {
    this.history.snapshot(this.sections);
    for (const section of this.sections) {
      const idx = section.pageComponents.findIndex(c => c.id === componentId);
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

  // Move componente para cima — busca em pageComponents e recursivamente em children
  moveComponentUp(componentId: string): void {
    for (const section of this.sections) {
      if (this._moveInList(section.pageComponents, componentId, -1)) return;
      for (const comp of section.pageComponents) {
        if (this._moveInChildren(comp, componentId, -1)) return;
      }
    }
  }

  // Move componente para baixo — busca em pageComponents e recursivamente em children
  moveComponentDown(componentId: string): void {
    for (const section of this.sections) {
      if (this._moveInList(section.pageComponents, componentId, +1)) return;
      for (const comp of section.pageComponents) {
        if (this._moveInChildren(comp, componentId, +1)) return;
      }
    }
  }

  // Move dentro de uma lista: dir=-1 sobe, dir=+1 desce
  private _moveInList(list: PageComponent[], componentId: string, dir: -1 | 1): boolean {
    const idx = list.findIndex(c => c.id === componentId);
    if (idx === -1) return false;
    const target = idx + dir;
    if (target < 0 || target >= list.length) return false;
    this.history.snapshot(this.sections);
    [list[idx], list[target]] = [list[target], list[idx]];
    this._reindexComponents(list);
    this._scheduleAutoSave();
    return true;
  }

  // Busca recursiva em children
  private _moveInChildren(parent: PageComponent, componentId: string, dir: -1 | 1): boolean {
    if (this._moveInList(parent.children, componentId, dir)) return true;
    for (const child of parent.children) {
      if (this._moveInChildren(child, componentId, dir)) return true;
    }
    return false;
  }

  private _deleteFromChildren(parent: PageComponent, componentId: string): boolean {
    const idx = parent.children.findIndex(c => c.id === componentId);
    if (idx !== -1) {
      parent.children.splice(idx, 1);
      this._reindexComponents(parent.children);
      if (this.selectedNode?.id === componentId) this.selectedNode = null;
      return true;
    }
    for (const child of parent.children) {
      if (this._deleteFromChildren(child, componentId)) return true;
    }
    return false;
  }

  private _reindexComponents(list: PageComponent[]): void {
    list.forEach((c, i) => { c.order = i + 1; });
  }

}
