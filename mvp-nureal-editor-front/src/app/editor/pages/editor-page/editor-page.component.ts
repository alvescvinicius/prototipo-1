import { Component } from '@angular/core';

import { EditorHeaderComponent } from '../../layout/editor-header/editor-header.component';
import { ToolboxComponent } from '../../layout/toolbox/toolbox.component';
import { CanvasComponent } from '../../layout/canvas/canvas.component';
import { PropertiesComponent } from '../../layout/properties/properties.component';
import { PageTreeComponent } from '../../layout/page-tree/page-tree.component';

import { EditorStateService } from '../../../core/services/editor-state.service';

@Component({
  selector: 'app-editor-page',
  standalone: true,
  imports: [
    EditorHeaderComponent,
    ToolboxComponent,
    CanvasComponent,
    PropertiesComponent,
    PageTreeComponent,
  ],
  templateUrl: './editor-page.component.html',
  styleUrl: './editor-page.component.scss',
})
export class EditorPageComponent {

  constructor(
    public editorState: EditorStateService
  ) {}

}
