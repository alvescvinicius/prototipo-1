import { Injectable } from '@angular/core';

import { ComponentType } from '../enums/component-type.enum';

import { Section } from '../interfaces/section';
import { PageComponent } from '../interfaces/page-component';

@Injectable({
  providedIn: 'root',
})
export class EditorStateService {

  public sections: Section[] = [];

  public selectedNode: Section | PageComponent | null = null;

  selectNode(node: Section | PageComponent): void {
    this.selectedNode = node;
  }

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

  isSelected(item: Section | PageComponent): boolean {

    if (!this.selectedNode) {
      return false;
    }

    return this.selectedNode.id === item.id;

  }

  addText(): void {

    if (!this.selectedNode) {
      return;
    }

    if (this.selectedNode.type !== ComponentType.SECTION) {
      return;
    }

    const section = this.selectedNode as Section;

    const component: PageComponent = {

      id: crypto.randomUUID(),

      type: ComponentType.TEXT,

      name: `Texto ${section.pageComponents.length + 1}`,

      order: section.pageComponents.length + 1,

      children: [],

      config: {
        content: 'Novo Texto'
      }

    };

    section.pageComponents.push(component);

  }

}
