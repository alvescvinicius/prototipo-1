import { Injectable } from '@angular/core';

import { ComponentType } from '../enums/component-type.enum';

import { Section } from '../interfaces/section';
import { PageComponent } from '../interfaces/page-component';

import { ComponentFactory } from '../factories/component.factory';

@Injectable({
  providedIn: 'root',
})
export class EditorStateService {

  public sections: Section[] = [];

  public selectedNode: Section | PageComponent | null = null;

  constructor() {}

  // ─── Seleção ───────────────────────────────────────────────

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

  // ─── Sections ──────────────────────────────────────────────

  addSection(): void {
    const section: Section = {
      id: crypto.randomUUID(),
      type: ComponentType.SECTION,
      name: `Section ${this.sections.length + 1}`,
      order: this.sections.length + 1,
      pageComponents: []
    };
    this.sections.push(section);
  }

  deleteSection(sectionId: string): void {
    this.sections = this.sections.filter(s => s.id !== sectionId);
    if (this.selectedNode?.id === sectionId) {
      this.selectedNode = null;
    }
    this._reindexSections();
  }

  moveSectionUp(sectionId: string): void {
    const idx = this.sections.findIndex(s => s.id === sectionId);
    if (idx <= 0) return;
    [this.sections[idx - 1], this.sections[idx]] =
      [this.sections[idx], this.sections[idx - 1]];
    this._reindexSections();
  }

  moveSectionDown(sectionId: string): void {
    const idx = this.sections.findIndex(s => s.id === sectionId);
    if (idx === -1 || idx >= this.sections.length - 1) return;
    [this.sections[idx], this.sections[idx + 1]] =
      [this.sections[idx + 1], this.sections[idx]];
    this._reindexSections();
  }

  private _reindexSections(): void {
    this.sections.forEach((s, i) => s.order = i + 1);
  }

  // ─── Components ────────────────────────────────────────────

  createComponent(type: ComponentType): void {
    if (!this.selectedNode) return;

    if (this.selectedNode.type === ComponentType.SECTION) {
      const section = this.selectedNode as Section;
      section.pageComponents.push(
        ComponentFactory.create(type, section.pageComponents.length + 1)
      );
      return;
    }

    if (this.selectedNode.type === ComponentType.CONTAINER) {
      const parent = this.selectedNode as PageComponent;
      parent.children.push(
        ComponentFactory.create(type, parent.children.length + 1)
      );
    }
  }

  deleteComponent(componentId: string): void {
    // busca em todas as sections
    for (const section of this.sections) {
      const idx = section.pageComponents.findIndex(c => c.id === componentId);
      if (idx !== -1) {
        section.pageComponents.splice(idx, 1);
        this._reindexComponents(section.pageComponents);
        if (this.selectedNode?.id === componentId) this.selectedNode = null;
        return;
      }

      // busca dentro de containers
      for (const comp of section.pageComponents) {
        if (this._deleteFromChildren(comp, componentId)) return;
      }
    }
  }

  moveComponentUp(componentId: string): void {
    for (const section of this.sections) {
      const idx = section.pageComponents.findIndex(c => c.id === componentId);
      if (idx > 0) {
        [section.pageComponents[idx - 1], section.pageComponents[idx]] =
          [section.pageComponents[idx], section.pageComponents[idx - 1]];
        this._reindexComponents(section.pageComponents);
        return;
      }
    }
  }

  moveComponentDown(componentId: string): void {
    for (const section of this.sections) {
      const idx = section.pageComponents.findIndex(c => c.id === componentId);
      if (idx !== -1 && idx < section.pageComponents.length - 1) {
        [section.pageComponents[idx], section.pageComponents[idx + 1]] =
          [section.pageComponents[idx + 1], section.pageComponents[idx]];
        this._reindexComponents(section.pageComponents);
        return;
      }
    }
  }

  private _deleteFromChildren(
    parent: PageComponent,
    componentId: string
  ): boolean {
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
    list.forEach((c, i) => c.order = i + 1);
  }

}
