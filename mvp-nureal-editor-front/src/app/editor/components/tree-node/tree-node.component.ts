import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PageComponent } from '../../../core/interfaces/page-component';
import { EditorStateService } from '../../../core/services/editor-state.service';

@Component({
  selector: 'app-tree-node',
  standalone: true,
  imports: [
    CommonModule,
    TreeNodeComponent
  ],
  templateUrl: './tree-node.component.html'
})
export class TreeNodeComponent {

  @Input({ required: true })
  node!: PageComponent;

  constructor(
    public editorState: EditorStateService
  ) {}

}
