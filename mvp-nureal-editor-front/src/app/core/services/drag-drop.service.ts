import { Injectable } from '@angular/core';
import { ComponentType } from '../enums/component-type.enum';

export type DragSource = 'toolbox' | 'component';

@Injectable({
  providedIn: 'root'
})
export class DragDropService {

  source: DragSource | null = null;
  toolboxType: ComponentType | null = null;
  sourceComponentId: string | null = null;
  sourceSectionId: string | null = null;

  startToolbox(type: ComponentType): void {
    this.source            = 'toolbox';
    this.toolboxType       = type;
    this.sourceComponentId = null;
    this.sourceSectionId   = null;
  }

  startComponent(componentId: string, sectionId: string): void {
    this.source            = 'component';
    this.sourceComponentId = componentId;
    this.sourceSectionId   = sectionId;
    this.toolboxType       = null;
  }

  reset(): void {
    this.source            = null;
    this.toolboxType       = null;
    this.sourceComponentId = null;
    this.sourceSectionId   = null;
  }

  get isDragging(): boolean   { return this.source !== null; }
  get isFromToolbox(): boolean { return this.source === 'toolbox'; }
  get isFromComponent(): boolean { return this.source === 'component'; }

}
