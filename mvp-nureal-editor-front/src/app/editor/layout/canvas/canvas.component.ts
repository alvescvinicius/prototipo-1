import { Component } from '@angular/core';
import { EditorStateService } from '../../../core/services/editor-state.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
})
export class CanvasComponent {
  constructor(public editorState: EditorStateService) {}
}
