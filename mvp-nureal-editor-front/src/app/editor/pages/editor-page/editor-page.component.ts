import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { EditorHeaderComponent }      from '../../layout/editor-header/editor-header.component';
import { CanvasComponent }            from '../../layout/canvas/canvas.component';
import { PagePropertiesComponent }    from '../../layout/page-properties/page-properties.component';
import { ComponentModalComponent }    from '../../layout/component-modal/component-modal.component';
import { PreviewPageComponent }       from '../../../renderer/pages/preview-page/preview-page.component';
import { FloatingPaletteComponent }   from '../../layout/floating-palette/floating-palette.component';
import { EditorStateService }         from '../../../core/services/editor-state.service';

@Component({
  selector: 'app-editor-page',
  standalone: true,
  imports: [
    CommonModule,
    EditorHeaderComponent,
    CanvasComponent,
    PagePropertiesComponent,
    ComponentModalComponent,
    PreviewPageComponent,
    FloatingPaletteComponent,
  ],
  templateUrl: './editor-page.component.html',
  styleUrl: './editor-page.component.scss',
})
export class EditorPageComponent implements OnInit, OnDestroy {

  constructor(
    private route:       ActivatedRoute,
    public  editorState: EditorStateService,
  ) {}

  async ngOnInit(): Promise<void> {
    const projectId = this.route.snapshot.paramMap.get('projectId');
    if (projectId) {
      await this.editorState.loadProject(projectId);
    }
  }

  ngOnDestroy(): void {}

  get splitView(): boolean { return this.editorState.splitView; }
}
