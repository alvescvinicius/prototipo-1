import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorStateService } from '../../../core/services/editor-state.service';
import { PropertiesComponent } from '../properties/properties.component';

@Component({
  selector: 'app-component-modal',
  standalone: true,
  imports: [CommonModule, PropertiesComponent],
  templateUrl: './component-modal.component.html',
  styleUrls: ['./component-modal.component.scss'],
})
export class ComponentModalComponent {
  constructor(public editorState: EditorStateService) {}

  close(): void {
    this.editorState.propertiesModalOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.close();
  }

  onBackdrop(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close();
    }
  }
}
