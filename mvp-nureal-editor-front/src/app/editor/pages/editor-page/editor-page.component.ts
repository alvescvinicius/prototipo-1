import { Component, OnInit, OnDestroy, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { EditorHeaderComponent }   from '../../layout/editor-header/editor-header.component';
import { ToolboxComponent }        from '../../layout/toolbox/toolbox.component';
import { CanvasComponent }         from '../../layout/canvas/canvas.component';
import { PropertiesComponent }     from '../../layout/properties/properties.component';
import { PagePropertiesComponent } from '../../layout/page-properties/page-properties.component';
import { PageTreeComponent }       from '../../layout/page-tree/page-tree.component';
import { ComponentModalComponent } from '../../layout/component-modal/component-modal.component';
import { EditorStateService }      from '../../../core/services/editor-state.service';
import { ExportService }           from '../../../core/services/export.service';

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
  ],
  templateUrl: './editor-page.component.html',
  styleUrl: './editor-page.component.scss',
})
export class EditorPageComponent implements OnInit, OnDestroy, AfterViewChecked {

  public sidebarWidth = 300;
  private resizingSidebar = false;

  @ViewChild('previewIframe') previewIframe?: ElementRef<HTMLIFrameElement>;

  private _lastSplitView = false;

  constructor(
    private route:       ActivatedRoute,
    public  editorState: EditorStateService,
    private exportSvc:   ExportService,
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

  ngAfterViewChecked(): void {
    const split = this.editorState.splitView;
    if (split && !this._lastSplitView) {
      this._refreshIframe();
    }
    this._lastSplitView = split;
  }

  toggleSidebar(): void {
    this.editorState.sidebarCollapsed = !this.editorState.sidebarCollapsed;
  }

  get splitView(): boolean { return this.editorState.splitView; }

  toggleSplitView(): void {
    this.editorState.splitView = !this.editorState.splitView;
    if (this.editorState.splitView) {
      setTimeout(() => this._refreshIframe(), 100);
    }
  }

  refreshPreview(): void { this._refreshIframe(); }

  private _refreshIframe(): void {
    const iframe = this.previewIframe?.nativeElement;
    if (!iframe) return;
    iframe.srcdoc = this.exportSvc.getPreviewHtml(
      this.editorState.sections,
      this.editorState.projectName
    );
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
