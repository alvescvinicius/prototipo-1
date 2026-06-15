import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EditorStateService } from '../../../core/services/editor-state.service';
import { TreeNodeComponent }  from '../../components/tree-node/tree-node.component';
import { Section }            from '../../../core/interfaces/section';
import { Page }               from '../../../core/interfaces/page';

@Component({
  selector: 'app-page-tree',
  standalone: true,
  imports: [CommonModule, TreeNodeComponent],
  templateUrl: './page-tree.component.html',
  styleUrls: ['./page-tree.component.scss']
})
export class PageTreeComponent {

  // collapsed state keyed by id
  collapsedPages:    Record<string, boolean> = {};
  collapsedSections: Record<string, boolean> = {};

  constructor(public editorState: EditorStateService) {}

  togglePage(page: Page, e: MouseEvent): void {
    e.stopPropagation();
    this.collapsedPages[page.id] = !this.collapsedPages[page.id];
  }

  toggleSection(section: Section, e: MouseEvent): void {
    e.stopPropagation();
    this.collapsedSections[section.id] = !this.collapsedSections[section.id];
  }

  isPageExpanded(page: Page): boolean {
    return !this.collapsedPages[page.id];
  }

  isSectionExpanded(section: Section): boolean {
    return !this.collapsedSections[section.id];
  }
}
