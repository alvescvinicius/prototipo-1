import { Component } from '@angular/core';

import { EditorHeaderComponent } from '../../layout/editor-header/editor-header.component';
import { ToolboxComponent } from '../../layout/toolbox/toolbox.component';
import { CanvasComponent } from '../../layout/canvas/canvas.component';
import { PropertiesComponent } from '../../layout/properties/properties.component';
import { PageTreeComponent } from '../../layout/page-tree/page-tree.component';

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
  public treeHeight = 300;

  private resizing = false;

  startResize(): void {
    this.resizing = true;

    document.addEventListener('mousemove', this.onMouseMove);

    document.addEventListener('mouseup', this.stopResize);
  }

  onMouseMove = (event: MouseEvent): void => {
    if (!this.resizing) {
      return;
    }

    const viewportHeight = window.innerHeight;

    this.treeHeight = Math.max(150, viewportHeight - event.clientY);
  };

  stopResize = (): void => {
    this.resizing = false;

    document.removeEventListener('mousemove', this.onMouseMove);

    document.removeEventListener('mouseup', this.stopResize);
  };

  public sidebarWidth = 260;

  private resizingSidebar = false;

  startSidebarResize(): void {
    this.resizingSidebar = true;

    document.addEventListener('mousemove', this.onSidebarMouseMove);

    document.addEventListener('mouseup', this.stopSidebarResize);
  }

  onSidebarMouseMove = (event: MouseEvent): void => {
    if (!this.resizingSidebar) {
      return;
    }

    const viewportWidth = window.innerWidth;

    this.sidebarWidth = Math.max(220, viewportWidth - event.clientX);
  };

  stopSidebarResize = (): void => {
    this.resizingSidebar = false;

    document.removeEventListener('mousemove', this.onSidebarMouseMove);

    document.removeEventListener('mouseup', this.stopSidebarResize);
  };
}
