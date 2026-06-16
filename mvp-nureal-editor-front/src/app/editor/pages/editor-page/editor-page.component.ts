import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { EditorHeaderComponent }   from '../../layout/editor-header/editor-header.component';
import { ToolboxComponent }        from '../../layout/toolbox/toolbox.component';
import { CanvasComponent }         from '../../layout/canvas/canvas.component';
import { PropertiesComponent }     from '../../layout/properties/properties.component';
import { PagePropertiesComponent } from '../../layout/page-properties/page-properties.component';
import { PageTreeComponent }       from '../../layout/page-tree/page-tree.component';
import { ComponentModalComponent } from '../../layout/component-modal/component-modal.component';
import { PreviewPageComponent }    from '../../../renderer/pages/preview-page/preview-page.component';
import { EditorStateService }      from '../../../core/services/editor-state.service';

@Component({
  selector: 'app-editor-page',
  standalone: true,
  imports: [
    CommonModule,
    EditorHeaderComponent,
    ToolboxComponent,
    CanvasComponent,
    PropertiesComponent,
    PagePropertiesComponent,
    PageTreeComponent,
    ComponentModalComponent,
    PreviewPageComponent,
  ],
  templateUrl: './editor-page.component.html',
  styleUrl: './editor-page.component.scss',
})
export class EditorPageComponent implements OnInit, OnDestroy {

  public sidebarWidth = 300;
  private resizingSidebar = false;

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

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.onSidebarMouseMove);
    document.removeEventListener('mouseup', this.stopSidebarResize);
  }

  toggleSidebar(): void {
    this.editorState.sidebarCollapsed = !this.editorState.sidebarCollapsed;
  }

  get splitView(): boolean { return this.editorState.splitView; }

  toggleSplitView(): void {
    this.editorState.splitView = !this.editorState.splitView;
  }

  startSidebarResize(): void {
    this.resizingSidebar = true;
    document.addEventListener('mousemove', this.onSidebarMouseMove);
    document.addEventListener('mouseup', this.stopSidebarResize);
  }

  onSidebarMouseMove = (event: MouseEvent): void => {
    if (!this.resizingSidebar) return;
    this.sidebarWidth = Math.max(220, Math.min(600, event.clientX));
  };

  stopSidebarResize = (): void => {
    this.resizingSidebar = false;
    document.removeEventListener('mousemove', this.onSidebarMouseMove);
    document.removeEventListener('mouseup', this.stopSidebarResize);
  };
}
