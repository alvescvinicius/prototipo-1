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

  selectNode(
    node: Section | PageComponent
  ): void {

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

  isSelected(
    item: Section | PageComponent
  ): boolean {

    if (!this.selectedNode) {
      return false;
    }

    return this.selectedNode.id === item.id;

  }

  createComponent(
    type: ComponentType
  ): void {

    if (!this.selectedNode) {
      return;
    }

    if (this.selectedNode.type === ComponentType.SECTION) {

      const section =
        this.selectedNode as Section;

      section.pageComponents.push(

        ComponentFactory.create(
          type,
          section.pageComponents.length + 1
        )

      );

      return;

    }

    if (this.selectedNode.type === ComponentType.CONTAINER) {

      const parent =
        this.selectedNode as PageComponent;

      parent.children.push(

        ComponentFactory.create(
          type,
          parent.children.length + 1
        )

      );

    }

  }

}
