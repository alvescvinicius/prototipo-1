import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EditorStateService } from '../../../core/services/editor-state.service';

import { TreeNodeComponent } from '../../components/tree-node/tree-node.component';

@Component({
  selector: 'app-page-tree',
  standalone: true,
  imports: [
    CommonModule,
    TreeNodeComponent
  ],
  templateUrl: './page-tree.component.html',
  styleUrls: ['./page-tree.component.scss']
})
export class PageTreeComponent {

  constructor(
    public editorState: EditorStateService
  ) {}

}
