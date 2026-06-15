import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PageComponent } from '../../../core/interfaces/page-component';
import { ComponentType } from '../../../core/enums/component-type.enum';

import { EditorStateService } from '../../../core/services/editor-state.service';

@Component({
  selector: 'app-component-renderer',
  standalone: true,
  imports: [
    CommonModule,
    ComponentRendererComponent
  ],
  templateUrl: './component-renderer.component.html',
  styleUrls: ['./component-renderer.component.scss']
})
export class ComponentRendererComponent {

  @Input({ required: true })
  component!: PageComponent;

  public ComponentType = ComponentType;

  constructor(
    public editorState: EditorStateService
  ) {}

}
