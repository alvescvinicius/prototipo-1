import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EditorStateService } from '../../../core/services/editor-state.service';
import { Page, PageConfig } from '../../../core/interfaces/page';

@Component({
  selector: 'app-page-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './page-properties.component.html',
  styleUrls: ['./page-properties.component.scss'],
})
export class PagePropertiesComponent {

  constructor(public editorState: EditorStateService) {}

  get page(): Page | null {
    return this.editorState.selectedPage;
  }

  get cfg(): PageConfig {
    if (!this.page) return {};
    if (!this.page.config) this.page.config = {};
    return this.page.config;
  }

  onNameChange(val: string): void {
    if (!this.page) return;
    this.page.name = val;
    (this.editorState as any)['_scheduleAutoSave']?.();
  }

  onSlugChange(val: string): void {
    if (!this.page) return;
    this.page.slug = val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    (this.editorState as any)['_scheduleAutoSave']?.();
  }

  onCfgChange(): void {
    (this.editorState as any)['_scheduleAutoSave']?.();
  }
}
