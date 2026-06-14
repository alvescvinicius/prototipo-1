import { Component } from '@angular/core';
import { EditorStateService } from '../../../core/services/editor-state.service';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [],
  templateUrl: './properties.component.html',
  styleUrl: './properties.component.scss'
})
export class PropertiesComponent {

  constructor(
    public editorState: EditorStateService
  ) {}

}
