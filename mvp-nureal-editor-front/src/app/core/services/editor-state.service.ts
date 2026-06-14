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

    const component: PageComponent = {

      id: crypto.randomUUID(),

      type: ComponentType.TEXT,

      name: 'Texto',

      order: 1,

      children: [],

      config: {
        content: 'Novo Texto'
      }

    };

    if (this.selectedNode.type === ComponentType.SECTION) {

      const section = this.selectedNode as Section;

      component.order = section.pageComponents.length + 1;

      section.pageComponents.push(component);

      return;

    }

    if (this.selectedNode.type === ComponentType.CONTAINER) {

      const container = this.selectedNode as PageComponent;

      component.order = container.children.length + 1;

      container.children.push(component);

      return;

    }

  }

  addContainer(): void {

    if (!this.selectedNode) {
      return;
    }

    const container: PageComponent = {

      id: crypto.randomUUID(),

      type: ComponentType.CONTAINER,

      name: 'Container',

      order: 1,

      children: [],

      config: {}

    };

    if (this.selectedNode.type === ComponentType.SECTION) {

      const section = this.selectedNode as Section;

      container.order = section.pageComponents.length + 1;

      section.pageComponents.push(container);

      return;

    }

    if (this.selectedNode.type === ComponentType.CONTAINER) {

      const parent = this.selectedNode as PageComponent;

      container.order = parent.children.length + 1;

      parent.children.push(container);

      return;

    }

  }

}
