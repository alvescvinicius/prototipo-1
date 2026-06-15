import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { EditorHeaderComponent } from '../../layout/editor-header/editor-header.component';
import { ToolboxComponent }      from '../../layout/toolbox/toolbox.component';
import { CanvasComponent }       from '../../layout/canvas/canvas.component';
import { PropertiesComponent }   from '../../layout/properties/properties.component';
import { PageTreeComponent }     from '../../layout/page-tree/page-tree.component';
import { EditorStateService }    from '../../../core/services/editor-state.service';

@Component({
  selector: 'app-editor-page',
  standalone: true,
  imports: [
    CommonModule,
    EditorHeaderComponent,
    ToolboxComponent,
    CanvasComponent,
    PropertiesComponent,
    PageTreeComponent,
  ],
  templateUrl: './editor-page.component.html',
  styleUrl: './editor-page.component.scss',
})
export class EditorPageComponent implements OnInit {

  public sidebarTab: 'properties' | 'structure' = 'properties';
  public sidebarWidth = 280;
  private resizingSidebar = false;

  constructor(
    private route:       ActivatedRoute,
    private editorState: EditorStateService
  ) {}

  async ngOnInit(): Promise<void> {
    const projectId = this.route.snapshot.paramMap.get('projectId');
    if (projectId) {
      await this.editorState.loadProject(projectId);
    }
  }

  startSidebarResize(): void {
    this.resizingSidebar = true;
    document.addEventListener('mousemove', this.onSidebarMouseMove);
    document.addEventListener('mouseup', this.stopSidebarResize);
  }

  onSidebarMouseMove = (event: MouseEvent): void => {
    if (!this.resizingSidebar) return;
    this.sidebarWidth = Math.max(220, window.innerWidth - event.clientX);
  };

  stopSidebarResize = (): void => {
    this.resizingSidebar = false;
    document.removeEventListener('mousemove', this.onSidebarMouseMove);
    document.removeEventListener('mouseup', this.stopSidebarResize);
  };
}
