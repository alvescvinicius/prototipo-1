import { Component } from '@angular/core';
import { EditorStateService } from '../../../core/services/editor-state.service';

@Component({
  selector: 'app-page-tree',
  standalone: true,
  templateUrl: './page-tree.component.html',
  styleUrls: ['./page-tree.component.scss']
})
export class PageTreeComponent {

  constructor(
    public editorState: EditorStateService
  ) {}

}
