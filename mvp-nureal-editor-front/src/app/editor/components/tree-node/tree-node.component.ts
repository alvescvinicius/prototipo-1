import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PageComponent } from '../../../core/interfaces/page-component';
import { ComponentType } from '../../../core/enums/component-type.enum';
import { EditorStateService } from '../../../core/services/editor-state.service';

@Component({
  selector: 'app-tree-node',
  standalone: true,
  imports: [ CommonModule, TreeNodeComponent ],
  templateUrl: './tree-node.component.html',
  styleUrls: ['./tree-node.component.scss']
})
export class TreeNodeComponent {

  @Input({ required: true }) node!: PageComponent;
  @Input() depth: number = 0;

  public ComponentType = ComponentType;
  expanded = true;
  dropPosition: 'before' | 'after' | 'into' | null = null;

  constructor(public editorState: EditorStateService) {}

  get hasChildren(): boolean {
    return this.node.children && this.node.children.length > 0;
  }

  get isContainer(): boolean {
    return this.node.type === ComponentType.CONTAINER ||
           (this.node as any).type === 'grid';
  }

  get icon(): string {
    switch (this.node.type) {
      case ComponentType.CONTAINER:  return 'layout';
      case ComponentType.TEXT:       return 'type';
      case ComponentType.TITLE:      return 'heading';
      case ComponentType.BUTTON:     return 'pointer';
      case ComponentType.IMAGE:      return 'image';
      case ComponentType.MENU:       return 'menu';
      case ComponentType.CARD:       return 'card';
      case ComponentType.CAROUSEL:   return 'carousel';
      case ComponentType.ACCORDION:  return 'accordion';
      case ComponentType.INPUT:      return 'input';
      case ComponentType.CHECKBOX:   return 'check';
      case ComponentType.SELECT:     return 'select';
      default:                       return 'box';
    }
  }

  toggle(e: MouseEvent): void {
    e.stopPropagation();
    this.expanded = !this.expanded;
  }

  openModal(e: MouseEvent): void {
    e.stopPropagation();
    this.editorState.selectNode(this.node);
    this.editorState.propertiesModalOpen = true;
  }

  onDragStart(e: DragEvent): void {
    e.stopPropagation();
    this.editorState.draggedNodeId = this.node.id;
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/plain', this.node.id);
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = this.editorState.draggedNodeId;
    if (!draggedId || draggedId === this.node.id) return;

    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const pct = (e.clientY - rect.top) / rect.height;

    if (this.isContainer && pct > 0.25 && pct < 0.75) {
      this.dropPosition = 'into';
    } else {
      this.dropPosition = pct < 0.5 ? 'before' : 'after';
    }

    e.dataTransfer!.dropEffect = 'move';
  }

  onDragLeave(e: DragEvent): void {
    const related = e.relatedTarget as HTMLElement | null;
    if (related && (e.currentTarget as HTMLElement).contains(related)) return;
    this.dropPosition = null;
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = this.editorState.draggedNodeId;
    if (!draggedId || !this.dropPosition || draggedId === this.node.id) {
      this.dropPosition = null;
      return;
    }
    this.editorState.moveComponentRelativeTo(draggedId, this.node.id, this.dropPosition);
    this.editorState.draggedNodeId = null;
    this.dropPosition = null;
  }

  onDragEnd(): void {
    this.editorState.draggedNodeId = null;
    this.dropPosition = null;
  }
}
